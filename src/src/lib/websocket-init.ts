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

/** Reset the init guard — for tests only. */
export function _resetInitForTesting(): void {
  isInitialized = false;
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

    onActivityText: (text) => streamStore().setActivityText(text),
    onStreamStart: () => streamStore().startStream(),
    onStreamEnd: (_sessionId, _exitCode) => streamStore().endStream(),

    onError: (error, _sessionId) => {
      connectionStore().setProviderError('claude', error);
    },

    onSessionCreated: (sid) => {
      streamStore().setActiveSessionId(sid);
      // Phase 8: Also add session to timeline store for sidebar display
      const timelineStore = useTimelineStore.getState;
      const sessions = timelineStore().sessions;
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
      // Also set as active session in timeline
      timelineStore().setActiveSession(sid);
    },

    onSessionAborted: (_sessionId, _provider, _success) => {
      // Log for now
    },

    onSessionStatus: (_sessionId, _provider, _isProcessing) => {
      // Log for now
    },

    onActiveSessions: (_sessions) => {
      // Phase 8 will sync sessions from this data
    },

    onTokenBudget: (_used, _total, _sessionId) => {
      // Future: update session metadata
    },

    onPermissionRequest: (_requestId, _toolName, _input, _sessionId) => {
      // M2 permission UI
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
