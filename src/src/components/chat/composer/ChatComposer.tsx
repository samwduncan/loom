/**
 * ChatComposer -- minimal M1 chat input with send/stop button.
 *
 * Single text input + send button. Enter to send. During streaming,
 * send button morphs to stop button (sends abort-session).
 *
 * After send: adds user message to timeline store optimistically,
 * clears input, refocuses.
 *
 * Constitution: Named exports (2.2), selector-only store access (4.2), cn() (3.6).
 */

import { useState, useRef, useCallback, useEffect, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { wsClient } from '@/lib/websocket-client';
import { useStreamStore } from '@/stores/stream';
import { useTimelineStore } from '@/stores/timeline';
import type { Message } from '@/types/message';
import '../styles/chat-view.css';

interface ChatComposerProps {
  projectName: string;
  sessionId: string | null;
}

export function ChatComposer({ projectName, sessionId }: ChatComposerProps) {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingTitleRef = useRef<string | null>(null);

  const isStreaming = useStreamStore((state) => state.isStreaming);
  const streamSessionId = useStreamStore((state) => state.activeSessionId);
  const addMessage = useTimelineStore((state) => state.addMessage);
  const addSession = useTimelineStore((state) => state.addSession);
  const updateSessionTitle = useTimelineStore((state) => state.updateSessionTitle);

  // When a new chat session is created (streamSessionId transitions to non-null
  // while we have a pending title), update the sidebar title optimistically
  useEffect(() => {
    if (streamSessionId && pendingTitleRef.current) {
      updateSessionTitle(streamSessionId, pendingTitleRef.current);
      pendingTitleRef.current = null;
    }
  }, [streamSessionId, updateSessionTitle]);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;

    // Determine the effective session ID for the optimistic message.
    // For new chats (sessionId is null), create a stub session immediately.
    let effectiveSessionId = sessionId;

    if (!sessionId) {
      // Create a stub session so user sees their message immediately
      const stubId = 'stub-' + Math.random().toString(36).slice(2, 10);
      addSession({
        id: stubId,
        title: trimmed.slice(0, 50),
        messages: [],
        providerId: 'claude',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: { tokenBudget: null, contextWindowUsed: null, totalCost: null },
      });
      effectiveSessionId = stubId;
      navigate(`/chat/${stubId}`);
    }

    // Build options -- omit sessionId when null (new chat).
    // Send the ORIGINAL sessionId to backend (null for new chat), NOT the stub ID.
    const options: Record<string, string> = { projectPath: projectName };
    if (sessionId) {
      options.sessionId = sessionId;
    }

    // Store pending title for new chats -- will be applied when session-created fires
    if (!sessionId) {
      pendingTitleRef.current = trimmed.slice(0, 50);
    }

    wsClient.send({
      type: 'claude-command',
      command: trimmed,
      options,
    });

    // Optimistic user message -- add to timeline store immediately
    if (effectiveSessionId) {
      const userMessage: Message = {
        id: Math.random().toString(36).slice(2, 10),
        role: 'user',
        content: trimmed,
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
      addMessage(effectiveSessionId, userMessage);
    }

    setInput('');
    // Refocus input after send
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }, [input, isStreaming, projectName, sessionId, addMessage, addSession, navigate]);

  const handleStop = useCallback(() => {
    if (streamSessionId) {
      wsClient.send({
        type: 'abort-session',
        sessionId: streamSessionId,
        provider: 'claude',
      });
    }
  }, [streamSessionId]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  return (
    <div className="chat-composer flex-shrink-0 border-t border-border px-4 py-3">
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Send a message..."
          aria-label="Message input"
          className={cn(
            'flex-1 rounded-lg border border-border bg-surface-base px-3 py-2',
            'text-sm text-foreground placeholder:text-muted',
            'focus:outline-none focus:ring-1 focus:ring-primary',
            'transition-colors',
          )}
          disabled={isStreaming}
        />
        {isStreaming ? (
          <button
            type="button"
            onClick={handleStop}
            aria-label="Stop generation"
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-lg',
              'bg-status-error text-foreground',
              'hover:opacity-80 transition-opacity',
            )}
          >
            {/* Stop square icon */}
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="currentColor"
              aria-hidden="true"
            >
              <rect width="14" height="14" rx="2" />
            </svg>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim()}
            aria-label="Send message"
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-lg',
              'bg-primary text-surface-base',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              'hover:opacity-80 transition-opacity',
            )}
          >
            {/* Send arrow icon */}
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M14 2L2 8l5 2 2 5z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
