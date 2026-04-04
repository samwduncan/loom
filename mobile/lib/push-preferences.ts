/**
 * MMKV-backed push notification preferences, pending-approvals queue,
 * and push token persistence.
 *
 * Preferences: notification mode (all, failures_and_permissions, permissions_only, none).
 * Queue: offline permission responses (approve/deny from notification action buttons).
 * Token: cached Expo push token for settings sync.
 */
import { MMKV } from 'react-native-mmkv';

// ---------------------------------------------------------------------------
// MMKV instance (default instance, keys prefixed to avoid collisions)
// ---------------------------------------------------------------------------

const mmkv = new MMKV();

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NotificationMode =
  | 'all'
  | 'failures_and_permissions'
  | 'permissions_only'
  | 'none';

export interface PendingApproval {
  requestId: string;
  action: 'approve' | 'deny';
  timestamp: number;
}

// ---------------------------------------------------------------------------
// Constants (D-14)
// ---------------------------------------------------------------------------

const PUSH_PREF_MODE_KEY = 'push_pref_mode';
const PENDING_APPROVALS_KEY = 'pending_approvals';
const PUSH_TOKEN_KEY = 'push_token'; // [S-4] Defined here, not in Plan 03

// ---------------------------------------------------------------------------
// Notification mode preferences
// ---------------------------------------------------------------------------

/**
 * Get the current notification mode preference.
 * Defaults to 'all' if not set.
 */
export function getNotificationMode(): NotificationMode {
  const raw = mmkv.getString(PUSH_PREF_MODE_KEY);
  if (
    raw === 'all' ||
    raw === 'failures_and_permissions' ||
    raw === 'permissions_only' ||
    raw === 'none'
  ) {
    return raw;
  }
  return 'all';
}

/**
 * Set the notification mode preference.
 */
export function setNotificationMode(mode: NotificationMode): void {
  mmkv.set(PUSH_PREF_MODE_KEY, mode);
}

// ---------------------------------------------------------------------------
// Pending approvals queue (D-06)
// ---------------------------------------------------------------------------

/**
 * Queue an offline permission response for later drain.
 * Stores { requestId, action, timestamp } durably in MMKV.
 */
export function queueApproval(
  requestId: string,
  action: 'approve' | 'deny',
): void {
  const existing = getPendingApprovals();
  existing.push({ requestId, action, timestamp: Date.now() });
  mmkv.set(PENDING_APPROVALS_KEY, JSON.stringify(existing));
}

/**
 * Read all pending approval responses from the durable queue.
 * Returns empty array if none queued.
 */
export function getPendingApprovals(): PendingApproval[] {
  const raw = mmkv.getString(PENDING_APPROVALS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as PendingApproval[];
  } catch {
    return [];
  }
}

/**
 * Clear all pending approval responses after successful drain.
 */
export function clearPendingApprovals(): void {
  mmkv.delete(PENDING_APPROVALS_KEY);
}

// ---------------------------------------------------------------------------
// Push token persistence [S-4]
// ---------------------------------------------------------------------------

/**
 * Get the cached Expo push token from MMKV.
 * Returns null if not yet registered.
 */
export function getPushToken(): string | null {
  return mmkv.getString(PUSH_TOKEN_KEY) ?? null;
}

/**
 * Persist the Expo push token to MMKV after registration.
 * Called by useNotifications after registerForPushNotifications succeeds.
 */
export function setPushToken(token: string): void {
  mmkv.set(PUSH_TOKEN_KEY, token);
}
