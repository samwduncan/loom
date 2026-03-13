/**
 * WebSocket init module -- wires WS client, multiplexer, and Zustand stores
 * together at app startup. Single entry point: initializeWebSocket().
 *
 * Called once during app initialization (not inside a React component).
 *
 * Constitution: Named exports only (2.2), no default export.
 */

import { wsClient } from '@/lib/websocket-client';
import type { ConnectionState } from '@/lib/websocket-client';
import {
  routeServerMessage,
} from '@/lib/stream-multiplexer';
import type { MultiplexerCallbacks } from '@/lib/stream-multiplexer';
import { bootstrapAuth } from '@/lib/auth';
import { useConnectionStore } from '@/stores/connection';
import { useStreamStore } from '@/stores/stream';
import { useTimelineStore } from '@/stores/timeline';
import type { ServerMessage } from '@/types/websocket';

/** Double-init guard — prevents multiple connections from React strict mode or re-mounts */
let isInitialized = false;

/** Module-scoped debounce timer for activity text updates (200ms) */
let activityDebounceTimer: ReturnType<typeof setTimeout> | null = null;

/** Module-scoped timer for cleaning up stale stub sessions */
let stubCleanupTimer: ReturnType<typeof setTimeout> | null = null;

/** Module-scoped set of session IDs with active streams (from backend sync) */
let activeStreamingSessions = new Set<string>();

/** Get the current set of actively streaming session IDs. */
export function getActiveStreamingSessions(): ReadonlySet<string> {
  return activeStreamingSessions;
}

/** Reset the init guard — for tests only. */
export function _resetInitForTesting(): void {
  isInitialized = false;
  if (stubCleanupTimer !== null) {
    clearTimeout(stubCleanupTimer);
    stubCleanupTimer = null;
  }
  activeStreamingSessions = new Set<string>();
}

/**
 * Initialize the WebSocket pipeline:
 * 1. Build multiplexer callbacks wired to stores
 * 2. Configure WS client with onMessage/onStateChange
 * 3. Bootstrap auth and connect
 */
export async function initializeWebSocket(): Promise<void> {
  if (isInitialized) return;
  isInitialized = true;
  // Get store references outside React (getState pattern)
  const connectionStore = useConnectionStore.getState;
  const streamStore = useStreamStore.getState;

  // Build multiplexer callbacks wired to stores
  const callbacks: MultiplexerCallbacks = {
    onContentToken: (text) => wsClient.emitContent(text),

    onThinkingBlock: (id, text, isComplete) => {
      const current = streamStore().thinkingState;
      const blocks = current?.blocks ?? [];
      streamStore().setThinkingState({
        isThinking: !isComplete,
        blocks: [...blocks, { id, text, isComplete }],
      });
    },

    onToolUseStart: (toolCall) => streamStore().addToolCall(toolCall),

    onToolResult: (toolCallId, output, isError) => {
      streamStore().updateToolCall(toolCallId, {
        status: isError ? 'rejected' : 'resolved',
        output,
        isError,
        completedAt: new Date().toISOString(),
      });
    },

    onToolProgress: (toolUseId, _toolName, _elapsed) => {
      streamStore().updateToolCall(toolUseId, { status: 'executing' });
    },

    onActivityText: (text) => {
      if (activityDebounceTimer !== null) clearTimeout(activityDebounceTimer);
      activityDebounceTimer = setTimeout(() => {
        streamStore().setActivityText(text);
        activityDebounceTimer = null;
      }, 200);
    },
    onStreamStart: () => streamStore().startStream(),
    onStreamEnd: (_sessionId, _exitCode) => {
      // Clear pending activity debounce to avoid stale text after stream ends
      if (activityDebounceTimer !== null) {
        clearTimeout(activityDebounceTimer);
        activityDebounceTimer = null;
      }
      streamStore().endStream();
    },

    onError: (error, _sessionId) => {
      connectionStore().setProviderError('claude', error);
    },

    onSessionCreated: (sid) => {
      streamStore().setActiveSessionId(sid);
      const timelineStore = useTimelineStore.getState;
      const sessions = timelineStore().sessions;

      // Check if there's a stub session to reconcile
      const stubSession = sessions.find((s) => s.id.startsWith('stub-'));
      if (stubSession) {
        const stubId = stubSession.id;

        // Atomic swap: replace stub ID with real ID in-place (preserves messages, title, metadata)
        timelineStore().replaceSessionId(stubId, sid);

        // Update URL without triggering React Router navigation (avoids double-fetch)
        window.history.replaceState(null, '', `/chat/${sid}`);

        // Migrate draft persistence key from stub ID to real ID
        try {
          const draftsRaw = localStorage.getItem('loom-composer-drafts');
          if (draftsRaw) {
            const drafts = JSON.parse(draftsRaw) as Record<string, unknown>;
            if (stubId in drafts) {
              drafts[sid] = drafts[stubId];
              delete drafts[stubId];
              localStorage.setItem('loom-composer-drafts', JSON.stringify(drafts));
            }
          }
        } catch {
          // Draft migration is best-effort
        }

        // Schedule cleanup for any remaining stale stub sessions
        if (stubCleanupTimer !== null) {
          clearTimeout(stubCleanupTimer);
        }
        stubCleanupTimer = setTimeout(() => {
          const currentSessions = useTimelineStore.getState().sessions;
          for (const s of currentSessions) {
            if (s.id.startsWith('stub-')) {
              useTimelineStore.getState().removeSession(s.id);
            }
          }
          stubCleanupTimer = null;
        }, 30_000);
      } else {
        // No stub -- add session normally (Phase 8 behavior)
        if (!sessions.some((s) => s.id === sid)) {
          timelineStore().addSession({
            id: sid,
            title: 'New Chat',
            messages: [],
            providerId: 'claude',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            metadata: { tokenBudget: null, contextWindowUsed: null, totalCost: null },
          });
        }
      }

      // Set as active session in timeline
      timelineStore().setActiveSession(sid);
    },

    onSessionAborted: (_sessionId, _provider, _success) => {
      // Log for now
    },

    onSessionStatus: (_sessionId, _provider, _isProcessing) => {
      // Log for now
    },

    onActiveSessions: (sessions) => {
      // Parse active session IDs from all providers
      const typedSessions = sessions as { claude?: string[]; codex?: string[]; gemini?: string[] };
      const allActiveIds = [
        ...(typedSessions.claude ?? []),
        ...(typedSessions.codex ?? []),
        ...(typedSessions.gemini ?? []),
      ];
      activeStreamingSessions = new Set(allActiveIds);

      // On reconnect: if we thought we were streaming but the active session
      // is no longer in the backend's active set, clear stale streaming state
      if (isCurrentlyStreaming) {
        const currentActiveSessionId = streamStore().activeSessionId;
        if (currentActiveSessionId && !activeStreamingSessions.has(currentActiveSessionId)) {
          isCurrentlyStreaming = false;
          streamStore().endStream();
        }
      }
    },

    onTokenBudget: (_used, _total, _sessionId) => {
      // Future: update session metadata
    },

    onResultData: (tokens, cost) => streamStore().setResultData(tokens, cost),

    onPermissionRequest: (requestId, toolName, input, sessionId) => {
      streamStore().setPermissionRequest({
        requestId,
        toolName,
        input,
        sessionId,
        receivedAt: Date.now(),
      });
    },

    onPermissionCancelled: () => {
      streamStore().clearPermissionRequest();
    },

    onProjectsUpdated: () => {
      window.dispatchEvent(new CustomEvent('loom:projects-updated'));
    },
  };

  // Track streaming state to call onStreamStart once per stream
  let isCurrentlyStreaming = false;

  // Configure wsClient callbacks
  wsClient.configure({
    onMessage: (msg: ServerMessage) => {
      // Auto-start stream on first claude-response
      if (msg.type === 'claude-response' && !isCurrentlyStreaming) {
        isCurrentlyStreaming = true;
        wsClient.startContentStream(); // Clear backlog buffer for new stream
        callbacks.onStreamStart();
      }

      // Route through multiplexer
      routeServerMessage(msg, callbacks, (clientMsg) =>
        wsClient.send(clientMsg),
      );

      // Track stream end
      if (msg.type === 'claude-complete' || msg.type === 'claude-error') {
        isCurrentlyStreaming = false;
        wsClient.endContentStream(); // Keep buffer for late subscribers, cleared on next stream
      }
    },

    onStateChange: (state: ConnectionState) => {
      switch (state) {
        case 'connecting':
          connectionStore().updateProviderStatus('claude', 'connecting');
          break;
        case 'connected':
          connectionStore().updateProviderStatus('claude', 'connected');
          connectionStore().resetReconnectAttempts('claude');
          connectionStore().setProviderError('claude', null);
          break;
        case 'reconnecting':
          connectionStore().updateProviderStatus('claude', 'reconnecting');
          connectionStore().incrementReconnectAttempts('claude');
          break;
        case 'disconnected':
          connectionStore().updateProviderStatus('claude', 'disconnected');
          // If was streaming, preserve partial content (per CONTEXT.md decision)
          if (isCurrentlyStreaming) {
            isCurrentlyStreaming = false;
            // Don't call endStream -- keep partial content visible
            connectionStore().setProviderError(
              'claude',
              'Connection lost during response',
            );
          }
          break;
      }
    },
  });

  // Bootstrap auth and connect
  const token = await bootstrapAuth();
  wsClient.connect(token);
}
