/**
 * Mobile WebSocket init -- wires WS client, multiplexer, and Zustand stores.
 *
 * Mobile-specific version of src/src/lib/websocket-init.ts. Replaces web-specific
 * code (window.location, localStorage, CustomEvent) with React Native equivalents
 * (AppState lifecycle, Zustand direct actions).
 *
 * Single entry point: initializeWebSocket(). Called once during app initialization.
 * Uses nativeAuthProvider for token management and resolveWsUrl from platform.ts.
 *
 * IMPORTANT: disconnect() on WebSocketClient nulls the internal token. The foreground
 * handler MUST call wsClient.connect(token) with a fresh token from nativeAuthProvider,
 * NOT tryReconnect() which would silently no-op.
 */

import { AppState, type AppStateStatus } from 'react-native';
import { WebSocketClient } from '@loom/shared/lib/websocket-client';
import type { WsConnectionState } from '@loom/shared/lib/websocket-client';
import { routeServerMessage } from '@loom/shared/lib/stream-multiplexer';
import type { MultiplexerCallbacks } from '@loom/shared/lib/stream-multiplexer';
import type { ServerMessage } from '@loom/shared/types/websocket';
import { resolveWsUrl } from './platform';
import { nativeAuthProvider } from './auth-provider';
import { useTimelineStore } from '../stores/index';
import { useConnectionStore } from '../stores/index';
import { useStreamStore } from '../stores/index';

// ---------------------------------------------------------------------------
// Module state
// ---------------------------------------------------------------------------

/** Double-init guard */
let isInitialized = false;

/** Singleton WebSocket client */
let wsClient: WebSocketClient | null = null;

/** 30-second background disconnect timer */
let backgroundTimer: ReturnType<typeof setTimeout> | null = null;

/** Tracks whether we're inside a streaming response */
let isCurrentlyStreaming = false;

/** 200ms debounce timer for activity text updates (matches web app) */
let activityDebounceTimer: ReturnType<typeof setTimeout> | null = null;

/** AppState subscription (cleaned up on disconnect) */
let appStateSubscription: ReturnType<typeof AppState.addEventListener> | null = null;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Get the current WebSocket client instance. */
export function getWsClient(): WebSocketClient | null {
  return wsClient;
}

/**
 * Initialize the WebSocket pipeline:
 * 1. Build multiplexer callbacks wired to stores
 * 2. Configure WS client with onMessage/onStateChange
 * 3. Register AppState lifecycle listener
 * 4. Bootstrap auth and connect
 */
export async function initializeWebSocket(): Promise<void> {
  if (isInitialized) return;
  isInitialized = true;

  // Create WebSocket client
  wsClient = new WebSocketClient({
    resolveWsUrl,
    auth: nativeAuthProvider,
  });

  // Get store references outside React (getState pattern)
  const connectionStore = useConnectionStore.getState;
  const streamStore = useStreamStore.getState;

  // ---------------------------------------------------------------------------
  // Build ALL 21 MultiplexerCallbacks wired to Zustand stores
  // ---------------------------------------------------------------------------

  const callbacks: MultiplexerCallbacks = {
    // 1. onContentToken -- routes to content stream subscribers, NOT a store action
    onContentToken: (text) => {
      wsClient!.emitContent(text); // ASSERT: wsClient is non-null after init
    },

    // 2. onThinkingBlock
    onThinkingBlock: (id, text, isComplete) => {
      const current = streamStore().thinkingState;
      const blocks = current?.blocks ?? [];
      streamStore().setThinkingState({
        isThinking: !isComplete,
        blocks: [...blocks, { id, text, isComplete }],
      });
    },

    // 3. onToolUseStart
    onToolUseStart: (toolCall) => {
      streamStore().addToolCall(toolCall);
    },

    // 4. onToolResult
    onToolResult: (toolCallId, output, isError) => {
      streamStore().updateToolCall(toolCallId, {
        status: isError ? 'rejected' : 'resolved',
        output,
        isError,
        completedAt: new Date().toISOString(),
      });
    },

    // 5. onToolProgress
    onToolProgress: (toolUseId, _toolName, _elapsed) => {
      streamStore().updateToolCall(toolUseId, { status: 'executing' });
    },

    // 6. onActivityText (200ms debounce, same as web)
    onActivityText: (text) => {
      if (activityDebounceTimer !== null) clearTimeout(activityDebounceTimer);
      activityDebounceTimer = setTimeout(() => {
        streamStore().setActivityText(text);
        activityDebounceTimer = null;
      }, 200);
    },

    // 7. onStreamStart
    onStreamStart: () => {
      streamStore().startStream();
    },

    // 8. onStreamEnd
    onStreamEnd: (sessionId, _exitCode) => {
      // Clear pending activity debounce to avoid stale text after stream ends
      if (activityDebounceTimer !== null) {
        clearTimeout(activityDebounceTimer);
        activityDebounceTimer = null;
      }
      streamStore().endStream();
    },

    // 9. onError
    onError: (error, _sessionId) => {
      connectionStore().setProviderError('claude', error);
    },

    // 10. onSessionCreated
    onSessionCreated: (sid) => {
      streamStore().setActiveSessionId(sid);

      const tl = useTimelineStore.getState();
      if (!tl.sessions.some((s) => s.id === sid)) {
        tl.addSession({
          id: sid,
          title: 'New Chat',
          messages: [],
          providerId: 'claude',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          metadata: {
            tokenBudget: null,
            contextWindowUsed: null,
            totalCost: null,
          },
        });
      }
      tl.setActiveSession(sid);
    },

    // 11. onSessionAborted
    onSessionAborted: (_sessionId, _provider, _success) => {
      // No-op Phase 69
    },

    // 12. onSessionStatus
    onSessionStatus: (_sessionId, _provider, _isProcessing) => {
      // No-op Phase 69
    },

    // 13. onActiveSessions
    onActiveSessions: (_sessions) => {
      // No-op Phase 69 -- multi-session tracking is later
    },

    // 14. onTokenBudget
    onTokenBudget: (used, total, _sessionId) => {
      streamStore().setTokenBudget(used, total);
    },

    // 15. onPermissionRequest
    onPermissionRequest: (requestId, toolName, input, sessionId) => {
      streamStore().setPermissionRequest({
        requestId,
        toolName,
        input,
        sessionId,
        receivedAt: Date.now(),
      });
    },

    // 16. onPermissionCancelled
    onPermissionCancelled: (_requestId) => {
      streamStore().clearPermissionRequest();
    },

    // 17. onResultData
    onResultData: (tokens, cost, modelName) => {
      streamStore().setResultData(tokens, cost, modelName);
    },

    // 18. onProjectsUpdated
    onProjectsUpdated: () => {
      // No-op on native -- no window.dispatchEvent
    },

    // 19. onLiveSessionData
    onLiveSessionData: (_sessionId, _entries) => {
      // No-op Phase 69
    },

    // 20. onLiveSessionAttached
    onLiveSessionAttached: (sessionId) => {
      streamStore().attachLiveSession(sessionId);
    },

    // 21. onLiveSessionDetached
    onLiveSessionDetached: (sessionId) => {
      streamStore().detachLiveSession(sessionId);
    },
  };

  // ---------------------------------------------------------------------------
  // Configure wsClient callbacks
  // ---------------------------------------------------------------------------

  wsClient.configure({
    onMessage: (msg: ServerMessage) => {
      // Auto-start stream on first claude-response
      if (msg.type === 'claude-response' && !isCurrentlyStreaming) {
        isCurrentlyStreaming = true;
        wsClient!.startContentStream(); // Clear backlog buffer for new stream
        callbacks.onStreamStart();
      }

      // Route through multiplexer
      routeServerMessage(msg, callbacks, (clientMsg) =>
        wsClient!.send(clientMsg),
      );

      // Track stream end
      if (msg.type === 'claude-complete' || msg.type === 'claude-error') {
        isCurrentlyStreaming = false;
        wsClient!.endContentStream(); // Keep buffer for late subscribers
      }
    },

    onStateChange: (state: WsConnectionState) => {
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

          // If was streaming, preserve partial content
          if (isCurrentlyStreaming) {
            isCurrentlyStreaming = false;
            streamStore().clearStreamingFlag();
            connectionStore().setProviderError(
              'claude',
              'Connection lost during response',
            );
          }

          // Auth failure: check close code for 4001 or 4401
          {
            const closeCode = wsClient!.getLastCloseCode();
            if (closeCode === 4001 || closeCode === 4401) {
              nativeAuthProvider.clearToken();
              connectionStore().setProviderError(
                'claude',
                'Authentication failed -- please re-enter token',
              );
            }
          }
          break;
      }
    },
  });

  // ---------------------------------------------------------------------------
  // AppState lifecycle: background disconnect / foreground reconnect
  // ---------------------------------------------------------------------------

  appStateSubscription = AppState.addEventListener(
    'change',
    (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        // Foreground: clear background timer and reconnect
        if (backgroundTimer !== null) {
          clearTimeout(backgroundTimer);
          backgroundTimer = null;
        }

        // Get fresh token from Keychain -- MUST use connect(token) not tryReconnect()
        // because disconnect() nulled the internal token.
        const token = nativeAuthProvider.getToken();
        const currentState = wsClient?.getState();
        if (
          token &&
          wsClient &&
          (currentState === 'disconnected' || currentState === 'reconnecting')
        ) {
          wsClient.connect(token);
        }
      } else if (nextState === 'background') {
        // Background: start 30s grace period before disconnect
        backgroundTimer = setTimeout(() => {
          wsClient?.disconnect();
          backgroundTimer = null;
        }, 30000);
      }
      // 'inactive': no-op (per D-30 -- Control Center/Notification Center)
    },
  );

  // ---------------------------------------------------------------------------
  // Initial connection
  // ---------------------------------------------------------------------------

  const token = nativeAuthProvider.getToken();
  if (token) {
    wsClient.connect(token);
  }
}

/**
 * Disconnect WebSocket and reset state. Used for sign-out or cleanup.
 */
export function disconnectWebSocket(): void {
  if (backgroundTimer !== null) {
    clearTimeout(backgroundTimer);
    backgroundTimer = null;
  }
  if (activityDebounceTimer !== null) {
    clearTimeout(activityDebounceTimer);
    activityDebounceTimer = null;
  }
  if (appStateSubscription) {
    appStateSubscription.remove();
    appStateSubscription = null;
  }
  wsClient?.disconnect();
  wsClient = null;
  isInitialized = false;
  isCurrentlyStreaming = false;
}
