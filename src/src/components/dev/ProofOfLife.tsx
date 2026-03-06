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
import { useScrollAnchor } from '@/hooks/useScrollAnchor';
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

  // Session ID — stable for the lifetime of this page
  const [sessionId] = useState(() => 'proof-of-life-' + crypto.randomUUID().slice(0, 8));

  // Store selectors
  const connectionStatus = useConnectionStore((s) => s.providers.claude.status);
  const connectionError = useConnectionStore((s) => s.providers.claude.error);
  const isStreaming = useStreamStore((s) => s.isStreaming);

  // Timeline store: find our session's messages.
  // Return stable EMPTY_MESSAGES reference when no session found to avoid
  // infinite re-render loop (Zustand v5 useSyncExternalStore requires cached getSnapshot).
  const messages = useTimelineStore((s) => {
    const session = s.sessions.find((sess) => sess.id === sessionId);
    return session?.messages ?? EMPTY_MESSAGES;
  });

  // Store actions
  const addMessage = useTimelineStore((s) => s.addMessage);
  const addSession = useTimelineStore((s) => s.addSession);

  // Scroll anchor
  const { sentinelRef, showPill, scrollToBottom } = useScrollAnchor(scrollContainerRef);

  // Initialize WebSocket on mount (double-init guard in websocket-init.ts)
  useEffect(() => {
    void initializeWebSocket();
  }, []);

  // Create stub session on mount
  useEffect(() => {
    // eslint-disable-next-line loom/no-external-store-mutation -- one-time read in effect for session check
    const sessions = useTimelineStore.getState().sessions;
    const exists = sessions.some((s) => s.id === sessionId);
    if (!exists) {
      addSession({
        id: sessionId,
        title: 'Proof of Life',
        messages: [],
        providerId: 'claude',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: { tokenBudget: null, contextWindowUsed: null, totalCost: null },
      });
    }
  }, [sessionId, addSession]);

  // Handle send
  const handleSend = useCallback(() => {
    const prompt = inputValue.trim();
    if (!prompt || isStreaming) return;

    // Add user message to timeline
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: prompt,
      metadata: {
        timestamp: new Date().toISOString(),
        tokenCount: null,
        cost: null,
        duration: null,
      },
      providerContext: {
        providerId: 'claude',
        modelId: '',
        agentName: null,
      },
    };

    addMessage(sessionId, userMessage);
    setInputValue('');
    setShowActiveMessage(true);

    // Send via WebSocket
    wsClient.send({
      type: 'claude-command',
      command: prompt,
      options: { projectPath: '/home/swd/loom', sessionId },
    });
  }, [inputValue, isStreaming, sessionId, addMessage]);

  // Handle stop
  const handleStop = useCallback(() => {
    wsClient.send({
      type: 'abort-session',
      sessionId,
      provider: 'claude',
    });
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

        {/* Active streaming message */}
        {showActiveMessage && isStreaming && (
          <ActiveMessage
            sessionId={sessionId}
            onFinalizationComplete={handleFinalizationComplete}
          />
        )}

        {/* Scroll anchor sentinel */}
        <div ref={sentinelRef} />

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
