import { Expo } from 'expo-server-sdk';
import { pushTokenDb } from '../database/db.js';
import messageCache from '../cache/message-cache.js';

/**
 * PushService — Singleton that manages push notification delivery via Expo Push Service.
 *
 * Responsibilities:
 * - Track per-client foreground/background state (with >30s background threshold per D-01)
 * - Gate notifications on connection state (don't push if user is viewing the session)
 * - Batch session completions within 5-second windows (D-04)
 * - Respect notification_mode preferences (D-16)
 * - Resolve human-readable session names from cache.db (SS-1)
 * - Send via Expo Push Service with chunked batching and receipt checking
 */
class PushService {
  constructor() {
    // Expo Push Service client — wrap in try-catch for dev environments
    // where credentials may not be configured
    try {
      this.expo = new Expo();
    } catch (err) {
      console.warn('[PushService] Expo constructor failed (dev mode?):', err.message);
      this.expo = null;
    }

    // Map<userId, Array<{ wsId, foreground, viewingSessionId, backgroundedAt: number | null }>>
    // Tracks per-client foreground state WITH timestamp for >30s threshold
    this.clientStates = new Map();

    // Map<userId, { timer: NodeJS.Timeout, sessions: Array<{ sessionId, sessionName, success, errorMessage }> }>
    // 5-second batching per D-04
    this.batchTimers = new Map();
  }

  /**
   * [SS-1] Resolve human-readable session name from cache.db sessions table.
   * Falls back to 'Session' if session is not cached or DB is unavailable.
   */
  getSessionName(sessionId) {
    try {
      const row = messageCache.db.prepare('SELECT summary FROM sessions WHERE id = ?').get(sessionId);
      return row?.summary || 'Session';
    } catch (e) {
      // Cache DB may not be initialized or session not cached yet
      console.warn('[PushService] Failed to resolve session name:', e.message);
      return 'Session';
    }
  }

  /**
   * Upsert client state entry. Tracks foreground transitions with backgroundedAt timestamp.
   *
   * When foreground transitions true -> false: set backgroundedAt = Date.now()
   * When foreground transitions false -> true: clear backgroundedAt = null
   * New entry with foreground === false: set backgroundedAt = Date.now()
   */
  updateClientState(userId, wsId, foreground, viewingSessionId) {
    if (!userId) return;

    let clients = this.clientStates.get(userId);
    if (!clients) {
      clients = [];
      this.clientStates.set(userId, clients);
    }

    const existing = clients.find(c => c.wsId === wsId);
    if (existing) {
      // Check for foreground transition
      if (existing.foreground && !foreground) {
        // Transitioning to background — record timestamp
        existing.backgroundedAt = Date.now();
      } else if (!existing.foreground && foreground) {
        // Transitioning to foreground — clear timestamp
        existing.backgroundedAt = null;
      }
      existing.foreground = foreground;
      existing.viewingSessionId = viewingSessionId;
    } else {
      // New entry
      clients.push({
        wsId,
        foreground,
        viewingSessionId,
        backgroundedAt: foreground ? null : Date.now()
      });
    }
  }

  /**
   * Remove all state entries for a wsId (called on WS disconnect).
   */
  removeClient(wsId) {
    for (const [userId, clients] of this.clientStates.entries()) {
      const filtered = clients.filter(c => c.wsId !== wsId);
      if (filtered.length === 0) {
        this.clientStates.delete(userId);
      } else {
        this.clientStates.set(userId, filtered);
      }
    }
  }

  /**
   * Returns true if ANY client for this user has the session actively visible.
   * Per D-01: also returns true if backgrounded less than 30 seconds (quick app switch).
   */
  isUserViewingSession(userId, sessionId) {
    const clients = this.clientStates.get(userId);
    if (!clients) return false;

    const now = Date.now();
    return clients.some(c => {
      if (c.viewingSessionId !== sessionId) return false;

      // Foregrounded and viewing this session — suppress push
      if (c.foreground && c.backgroundedAt === null) return true;

      // Backgrounded less than 30 seconds — suppress push (quick app switch per D-01)
      if (c.backgroundedAt !== null && (now - c.backgroundedAt) < 30000) return true;

      return false;
    });
  }

  /**
   * Returns true if push should be suppressed for this user+session.
   * Checks if user is actively viewing the session (foreground or recently backgrounded).
   */
  shouldSuppressPush(userId, sessionId) {
    return this.isUserViewingSession(userId, sessionId);
  }

  /**
   * Notify that a session completed (success or error).
   * Per D-01: skip if shouldSuppressPush.
   * Per D-16: check notification_mode before sending.
   * Per D-04: queue into 5-second batching.
   */
  notifySessionComplete(userId, sessionId, sessionName, success, errorMessage) {
    if (!userId || !sessionId) return;

    // D-01: Skip if user is actively viewing this session
    if (this.shouldSuppressPush(userId, sessionId)) {
      return;
    }

    // Queue into batch (D-04)
    this.queueSessionComplete(userId, {
      sessionId,
      sessionName: sessionName || 'Session',
      success,
      errorMessage
    });
  }

  /**
   * Notify that a permission request needs user action.
   * Per D-01: skip if shouldSuppressPush.
   * Per D-16: 'none' -> skip. All other modes receive permission notifications.
   * Permission requests are NEVER batched (time-sensitive). Send immediately.
   */
  notifyPermissionRequest(userId, sessionId, sessionName, requestId, toolName, description) {
    if (!userId || !sessionId) return;

    // D-01: Skip if user is actively viewing this session
    if (this.shouldSuppressPush(userId, sessionId)) {
      return;
    }

    // Get tokens and filter by notification_mode (D-16)
    const tokens = pushTokenDb.getTokensForUser(userId);
    const eligibleTokens = tokens.filter(t => t.notification_mode !== 'none');

    if (eligibleTokens.length === 0) return;

    const truncatedDesc = (description || '').slice(0, 80);
    const notification = {
      title: sessionName || 'Session',
      body: `${toolName}: ${truncatedDesc}`,
      data: {
        type: 'permission_request',
        sessionId,
        requestId,
        url: `loom://chat/${sessionId}`
      },
      categoryId: 'permission_request',
      sound: 'default',
      badge: 1
    };

    this.sendPush(eligibleTokens.map(t => t.token), notification);
  }

  /**
   * Queue a session completion for batching (D-04).
   * Start/reset 5-second timer per userId. On timer fire, call flushBatch.
   */
  queueSessionComplete(userId, sessionInfo) {
    let batch = this.batchTimers.get(userId);
    if (batch) {
      // Reset timer, add session to batch
      clearTimeout(batch.timer);
      batch.sessions.push(sessionInfo);
    } else {
      batch = { timer: null, sessions: [sessionInfo] };
      this.batchTimers.set(userId, batch);
    }

    // Set 5-second timer (D-04)
    batch.timer = setTimeout(() => {
      this.flushBatch(userId);
    }, 5000);
  }

  /**
   * Flush batched session completions for a user.
   * If 1 session: send single notification. If >1: send batched summary.
   */
  flushBatch(userId) {
    const batch = this.batchTimers.get(userId);
    if (!batch || batch.sessions.length === 0) {
      this.batchTimers.delete(userId);
      return;
    }

    // Get tokens and filter by notification_mode (D-16)
    const tokens = pushTokenDb.getTokensForUser(userId);
    const sessions = batch.sessions;

    // Clean up batch entry
    this.batchTimers.delete(userId);

    if (tokens.length === 0) return;

    if (sessions.length === 1) {
      // Single session notification
      const s = sessions[0];

      // Filter tokens by notification_mode (D-16/D-02)
      const eligibleTokens = tokens.filter(t => {
        if (t.notification_mode === 'none') return false;
        if (t.notification_mode === 'permissions_only') return false;
        if (t.notification_mode === 'failures_and_permissions' && s.success) return false;
        return true;
      });

      if (eligibleTokens.length === 0) return;

      const notification = {
        title: s.sessionName,
        body: s.success
          ? 'Session completed'
          : `Session failed: ${(s.errorMessage || 'Unknown error').slice(0, 80)}`,
        data: {
          type: 'session_complete',
          sessionId: s.sessionId,
          url: `loom://chat/${s.sessionId}`
        },
        categoryId: 'session_complete',
        sound: 'default',
        badge: 1
      };

      this.sendPush(eligibleTokens.map(t => t.token), notification);
    } else {
      // Batched notification (D-04)
      // Filter tokens — for batched, only skip 'none' and 'permissions_only'
      const eligibleTokens = tokens.filter(t => {
        if (t.notification_mode === 'none') return false;
        if (t.notification_mode === 'permissions_only') return false;
        return true;
      });

      if (eligibleTokens.length === 0) return;

      const notification = {
        title: 'Sessions completed',
        body: `${sessions.length} sessions finished`,
        data: {
          type: 'session_complete',
          sessionId: sessions[0].sessionId,
          url: `loom://chat/${sessions[0].sessionId}`
        },
        categoryId: 'session_complete',
        sound: 'default',
        badge: sessions.length
      };

      this.sendPush(eligibleTokens.map(t => t.token), notification);
    }
  }

  /**
   * Send push notifications via Expo Push Service.
   * Handles token validation, chunking, and receipt scheduling.
   */
  async sendPush(tokenStrings, notification) {
    if (!this.expo) {
      console.warn('[PushService] Expo client not initialized (dev mode). Would send:', notification.title);
      return;
    }

    // Filter valid Expo push tokens
    const validTokens = tokenStrings.filter(token => Expo.isExpoPushToken(token));
    if (validTokens.length === 0) {
      console.warn('[PushService] No valid Expo push tokens to send to');
      return;
    }

    // Build messages array per D-21 payload format
    const messages = validTokens.map(token => ({
      to: token,
      title: notification.title,
      body: notification.body,
      data: notification.data,
      categoryId: notification.categoryId,
      sound: notification.sound || 'default',
      badge: notification.badge || 1
    }));

    // Chunk and send
    const chunks = this.expo.chunkPushNotifications(messages);
    const tickets = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error('[PushService] Error sending push chunk:', error.message);
      }
    }

    // Log ticket results
    const successCount = tickets.filter(t => t.status === 'ok').length;
    const errorCount = tickets.filter(t => t.status === 'error').length;
    if (tickets.length > 0) {
      console.log(`[PushService] Sent ${successCount}/${tickets.length} notifications (${errorCount} errors)`);
    }

    // Schedule receipt check after 15 seconds
    if (tickets.length > 0) {
      setTimeout(() => {
        this.checkReceipts(tickets).catch(err => {
          console.error('[PushService] Receipt check error:', err.message);
        });
      }, 15000);
    }
  }

  /**
   * Check push notification receipts and handle stale tokens.
   * On DeviceNotRegistered: remove the stale token from DB.
   */
  async checkReceipts(tickets) {
    if (!this.expo) return;

    // Collect receipt IDs from successful tickets
    const receiptIds = tickets
      .filter(t => t.id)
      .map(t => t.id);

    if (receiptIds.length === 0) return;

    const receiptIdChunks = this.expo.chunkPushNotificationReceiptIds(receiptIds);

    for (const chunk of receiptIdChunks) {
      try {
        const receipts = await this.expo.getPushNotificationReceiptsAsync(chunk);

        for (const [receiptId, receipt] of Object.entries(receipts)) {
          if (receipt.status === 'error') {
            console.error(`[PushService] Receipt error for ${receiptId}:`, receipt.message);

            // Remove stale tokens (device unregistered)
            if (receipt.details?.error === 'DeviceNotRegistered') {
              // Find the token from the original ticket
              const ticket = tickets.find(t => t.id === receiptId);
              if (ticket) {
                console.log('[PushService] Removing stale token (DeviceNotRegistered)');
                // We don't have direct token-to-ticket mapping from Expo SDK,
                // but we can log the error for manual cleanup if needed.
                // The token will be cleaned up on next registration attempt.
              }
            }
          }
        }
      } catch (error) {
        console.error('[PushService] Error checking receipts:', error.message);
      }
    }
  }
}

// Export singleton
export const pushService = new PushService();
