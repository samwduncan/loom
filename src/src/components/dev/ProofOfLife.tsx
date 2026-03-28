/**
 * ProofOfLife -- End-to-end streaming demo page at /dev/proof-of-life.
 *
 * Standalone page (outside AppShell) that composes all M1 subsystems:
 * WebSocket connection, streaming tokens, thinking blocks, tool chips,
 * scroll anchoring, and connection status.
 *
 * Constitution: Named exports only (2.2), design tokens only (7.14).
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { initializeWebSocket } from '@/lib/websocket-init';
import { wsClient } from '@/lib/websocket-client';
import { useConnectionStore } from '@/stores/connection';
import { useStreamStore } from '@/stores/stream';
import { useTimelineStore } from '@/stores/timeline';
import { useChatScroll } from '@/hooks/useChatScroll';
import { ActiveMessage } from '@/components/chat/view/ActiveMessage';
import { ScrollToBottomPill } from '@/components/chat/view/ScrollToBottomPill';
import { cn } from '@/utils/cn';
import type { Message } from '@/types/message';
import './proof-of-life.css';

const DEFAULT_PROMPT = 'Write a haiku about coding';
const EMPTY_MESSAGES: Message[] = [];

export function ProofOfLife() {
  const [inputValue, setInputValue] = useState(DEFAULT_PROMPT);
  const [showActiveMessage, setShowActiveMessage] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Session ID — null until backend creates one, then stable for conversation
  const [sessionId, setSessionId] = useState<string | null>(null);
  // Local ID for timeline store (always available)
  const [localId] = useState(() => 'proof-of-life-' + Math.random().toString(36).slice(2, 10));

  // Store selectors
  const connectionStatus = useConnectionStore((s) => s.providers.claude.status);
  const connectionError = useConnectionStore((s) => s.providers.claude.error);
  const isStreaming = useStreamStore((s) => s.isStreaming);
  const activeSessionId = useStreamStore((s) => s.activeSessionId);

  // Timeline store: find our session's messages.
  // Return stable EMPTY_MESSAGES reference when no session found to avoid
  // infinite re-render loop (Zustand v5 useSyncExternalStore requires cached getSnapshot).
  const messages = useTimelineStore((s) => {
    const session = s.sessions.find((sess) => sess.id === localId);
    return session?.messages ?? EMPTY_MESSAGES;
  });

  // Store actions
  const addMessage = useTimelineStore((s) => s.addMessage);
  const addSession = useTimelineStore((s) => s.addSession);

  // Scroll anchor
  const { sentinelRef, showPill, scrollToBottom, contentWrapperRef } = useChatScroll({
    scrollContainerRef,
    sessionId: localId,
    isStreaming,
    messageCount: messages.length,
  });

  // Initialize WebSocket on mount (double-init guard in websocket-init.ts)
  useEffect(() => {
    void initializeWebSocket();
  }, []);

  // Capture backend session ID for resume on subsequent messages.
  // "Adjust state during rendering" pattern — React supports this when guarded
  // by a condition that prevents infinite loops (same pattern as ActiveMessage).
  if (activeSessionId && !sessionId) {
    setSessionId(activeSessionId);
  }

  // Create stub session on mount using localId
  useEffect(() => {
    // eslint-disable-next-line loom/no-external-store-mutation -- one-time read in effect for session check
    const sessions = useTimelineStore.getState().sessions;
    const exists = sessions.some((s) => s.id === localId);
    if (!exists) {
      addSession({
        id: localId,
        title: 'Proof of Life',
        messages: [],
        providerId: 'claude',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: { tokenBudget: null, contextWindowUsed: null, totalCost: null },
      });
    }
  }, [localId, addSession]);

  // Handle send
  const handleSend = useCallback(() => {
    const prompt = inputValue.trim();
    if (!prompt || isStreaming) return;

    // Add user message to timeline
    const userMessage: Message = {
      id: Math.random().toString(36).slice(2, 10),
      role: 'user',
      content: prompt,
      metadata: {
        timestamp: new Date().toISOString(),
        tokenCount: null,
        inputTokens: null,
        outputTokens: null,
        cacheReadTokens: null,
        cost: null,
        duration: null,
      },
      providerContext: {
        providerId: 'claude',
        modelId: '',
        agentName: null,
      },
    };

    addMessage(localId, userMessage);
    setInputValue('');
    setShowActiveMessage(true);

    // Send via WebSocket — only pass sessionId for resume (second+ messages)
    const options: Record<string, unknown> = { projectPath: '/home/swd/loom' };
    if (sessionId) {
      options.sessionId = sessionId;
    }
    wsClient.send({
      type: 'claude-command',
      command: prompt,
      options,
    });
  }, [inputValue, isStreaming, sessionId, localId, addMessage]);

  // Handle stop
  const handleStop = useCallback(() => {
    if (sessionId) {
      wsClient.send({
        type: 'abort-session',
        sessionId,
        provider: 'claude',
      });
    }
  }, [sessionId]);

  // Handle finalization complete — ActiveMessage has flushed to timeline
  const handleFinalizationComplete = useCallback(() => {
    setShowActiveMessage(false);
  }, []);

  // Key handler for input
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  // Connection status label
  const statusLabel = connectionStatus === 'connected'
    ? `Connected to ${window.location.hostname}:${window.location.port || '5555'}`
    : connectionStatus === 'connecting' || connectionStatus === 'reconnecting'
      ? 'Reconnecting...'
      : 'Disconnected';

  return (
    <div className="proof-of-life" data-testid="proof-of-life">
      {/* Header */}
      <div className="proof-of-life-header">
        <span
          className={cn(
            'proof-of-life-status-dot',
            connectionStatus === 'connected' && 'proof-of-life-status-dot--connected',
            connectionStatus === 'connecting' && 'proof-of-life-status-dot--connecting',
            connectionStatus === 'reconnecting' && 'proof-of-life-status-dot--reconnecting',
            connectionStatus === 'disconnected' && 'proof-of-life-status-dot--disconnected',
          )}
          data-testid="connection-status-dot"
        />
        <span className="proof-of-life-header-title">Proof of Life</span>
        <span className="proof-of-life-header-label">{statusLabel}</span>
      </div>

      {/* Conversation */}
      <div
        ref={scrollContainerRef}
        className="proof-of-life-conversation"
        data-testid="conversation-area"
      >
        <div ref={contentWrapperRef}>
          {messages.map((msg: Message) => {
            if (msg.role === 'user') {
              return (
                <div key={msg.id} className="proof-of-life-user-msg">
                  {msg.content}
                </div>
              );
            }
            if (msg.role === 'assistant') {
              return (
                <div key={msg.id} className="proof-of-life-assistant-msg">
                  {msg.content}
                </div>
              );
            }
            return null;
          })}

          {/* Error display */}
          {connectionError && (
            <div className="proof-of-life-error" data-testid="error-display">
              {connectionError}
            </div>
          )}

          {/* Active streaming message — keep mounted during finalization fade */}
          {showActiveMessage && (
            <ActiveMessage
              sessionId={localId}
              onFinalizationComplete={handleFinalizationComplete}
            />
          )}
        </div>

        {/* Bottom sentinel for IO-based atBottom detection */}
        <div ref={sentinelRef} style={{ height: 1 }} aria-hidden="true" />

        {/* Scroll pill */}
        <ScrollToBottomPill visible={showPill} onClick={scrollToBottom} />
      </div>

      {/* Input area */}
      <div className="proof-of-life-input-area">
        <input
          type="text"
          className="proof-of-life-input"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          data-testid="message-input"
          disabled={isStreaming}
        />
        {isStreaming ? (
          <button
            type="button"
            className="proof-of-life-btn proof-of-life-btn--stop"
            onClick={handleStop}
            data-testid="stop-button"
          >
            Stop
          </button>
        ) : (
          <button
            type="button"
            className="proof-of-life-btn"
            onClick={handleSend}
            disabled={!inputValue.trim()}
            data-testid="send-button"
          >
            Send
          </button>
        )}
      </div>
    </div>
  );
}
