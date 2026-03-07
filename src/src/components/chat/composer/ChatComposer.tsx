/**
 * ChatComposer -- multiline floating pill composer with send/stop FSM.
 *
 * Replaces M1 single-line input. Auto-resize textarea, 5-state send/stop
 * morph, keyboard shortcuts (Enter/Shift+Enter/Escape/Cmd+.), message
 * queuing during streaming, and floating pill layout.
 *
 * Constitution: Named exports (2.2), selector-only store access (4.2), cn() (3.6).
 */

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  type KeyboardEvent,
  type RefObject,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Square } from 'lucide-react';
import { cn } from '@/utils/cn';
import { wsClient } from '@/lib/websocket-client';
import { useStreamStore } from '@/stores/stream';
import { useTimelineStore } from '@/stores/timeline';
import { useAutoResize } from './useAutoResize';
import { useComposerState } from './useComposerState';
import { ComposerKeyboardHints } from './ComposerKeyboardHints';
import type { Message } from '@/types/message';
import './composer.css';

interface ChatComposerProps {
  projectName: string;
  sessionId: string | null;
  /** Scroll container ref for scroll-position stability during resize */
  scrollContainerRef?: RefObject<HTMLDivElement | null>;
  /** Text from suggestion chip click -- populates input when set */
  suggestionText?: string | null;
}

export function ChatComposer({ projectName, sessionId, scrollContainerRef, suggestionText }: ChatComposerProps) {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pendingTitleRef = useRef<string | null>(null);
  const hasMessageSentRef = useRef(false);

  // Stream store selectors
  const isStreaming = useStreamStore((s) => s.isStreaming);
  const streamSessionId = useStreamStore((s) => s.activeSessionId);

  // Timeline store selectors
  const addMessage = useTimelineStore((s) => s.addMessage);
  const addSession = useTimelineStore((s) => s.addSession);
  const updateSessionTitle = useTimelineStore((s) => s.updateSessionTitle);

  // FSM
  const { state: composerState, dispatch, canSend, canStop } = useComposerState();

  // Populate input from suggestion chip click
  useEffect(() => {
    if (suggestionText) {
      setInput(suggestionText);
      requestAnimationFrame(() => textareaRef.current?.focus());
    }
  }, [suggestionText]);

  // Auto-resize textarea
  useAutoResize(textareaRef, input, 200);

  // Scroll stability: capture scroll position before resize, restore after
  const prevScrollRef = useRef<{ top: number; height: number } | null>(null);

  // Capture scroll state before auto-resize modifies textarea height
  useLayoutEffect(() => {
    const container = scrollContainerRef?.current;
    if (container) {
      prevScrollRef.current = {
        top: container.scrollTop,
        height: container.scrollHeight,
      };
    }
  }, [input, scrollContainerRef]);

  // Restore scroll position after resize
  useLayoutEffect(() => {
    const container = scrollContainerRef?.current;
    const prev = prevScrollRef.current;
    if (container && prev) {
      const heightDelta = container.scrollHeight - prev.height;
      if (heightDelta !== 0) {
        container.scrollTop = prev.top + heightDelta;
      }
    }
  });

  // When a new chat session is created, update sidebar title
  useEffect(() => {
    if (streamSessionId && pendingTitleRef.current) {
      updateSessionTitle(streamSessionId, pendingTitleRef.current);
      pendingTitleRef.current = null;
    }
  }, [streamSessionId, updateSessionTitle]);

  // Auto-focus on session switch
  useEffect(() => {
    textareaRef.current?.focus();
  }, [sessionId]);

  // Global Cmd+. / Ctrl+. keyboard shortcut for stop
  useEffect(() => {
    function handleGlobalKeyDown(e: globalThis.KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === '.') {
        if (!canStop) return;
        e.preventDefault();
        handleStop();
      }
    }
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canStop, streamSessionId]);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;

    // Message queuing during streaming: send immediately, add optimistic with queued flag
    if (isStreaming) {
      const effectiveId = sessionId ?? streamSessionId;
      if (!effectiveId) return;

      const options: Record<string, string> = { projectPath: projectName };
      options.sessionId = effectiveId;

      wsClient.send({
        type: 'claude-command',
        command: trimmed,
        options,
      });

      const queuedMessage: Message = {
        id: Math.random().toString(36).slice(2, 10),
        role: 'user',
        content: trimmed,
        metadata: {
          timestamp: new Date().toISOString(),
          tokenCount: null,
          cost: null,
          duration: null,
          queued: true,
        },
        providerContext: {
          providerId: 'claude',
          modelId: '',
          agentName: null,
        },
      };
      addMessage(effectiveId, queuedMessage);
      setInput('');
      requestAnimationFrame(() => textareaRef.current?.focus());
      return;
    }

    // Normal send: must be in idle state
    if (!canSend) return;

    // Dispatch SEND to FSM (enters 'sending' state)
    dispatch({ type: 'SEND' });

    // Determine effective session ID
    let effectiveSessionId = sessionId;

    if (!sessionId) {
      // Create stub session for optimistic display
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

    // Build options -- omit sessionId for new chat
    const options: Record<string, string> = { projectPath: projectName };
    if (sessionId) {
      options.sessionId = sessionId;
    }

    // Store pending title for new chats
    if (!sessionId) {
      pendingTitleRef.current = trimmed.slice(0, 50);
    }

    wsClient.send({
      type: 'claude-command',
      command: trimmed,
      options,
    });

    // Optimistic user message
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

    hasMessageSentRef.current = true;
    setInput('');
    requestAnimationFrame(() => textareaRef.current?.focus());
  }, [input, isStreaming, canSend, projectName, sessionId, streamSessionId, addMessage, addSession, navigate, dispatch]);

  const handleStop = useCallback(() => {
    if (!canStop) return;
    const sid = streamSessionId ?? sessionId;
    if (sid) {
      wsClient.send({
        type: 'abort-session',
        sessionId: sid,
        provider: 'claude',
      });
      dispatch({ type: 'STOP' });
    }
  }, [canStop, streamSessionId, sessionId, dispatch]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      } else if (e.key === 'Escape') {
        if (input.trim()) {
          // First press: clear input
          setInput('');
        } else {
          // Second press (already empty): blur
          textareaRef.current?.blur();
        }
      }
    },
    [handleSend, input],
  );

  const isStreamingState = composerState === 'active' || composerState === 'aborting';

  return (
    <div className="max-w-3xl mx-auto w-full px-4 pb-4 pt-2">
      <div
        className="composer-pill p-3"
        data-streaming={isStreamingState}
        data-testid="chat-composer"
      >
        {/* Image preview row slot -- Plan 02 adds content */}

        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Send a message..."
          aria-label="Message input"
          rows={1}
          className={cn(
            'w-full resize-none overflow-y-hidden bg-transparent text-sm text-foreground',
            'placeholder:text-muted',
            'focus:outline-none',
          )}
        />

        <div className="mt-2 flex items-end justify-between">
          <ComposerKeyboardHints
            hasMessageSent={hasMessageSentRef.current}
            isStreaming={isStreamingState}
          />

          <div className="composer-button-cell">
            {/* Send button */}
            <button
              type="button"
              onClick={handleSend}
              disabled={!canSend || !input.trim()}
              aria-label="Send message"
              data-visible={canSend && !isStreamingState ? 'true' : 'false'}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg',
                'bg-primary text-surface-base',
                'disabled:opacity-40 disabled:cursor-not-allowed',
                'hover:opacity-80 transition-opacity',
              )}
            >
              <Send size={16} aria-hidden="true" />
            </button>

            {/* Stop button */}
            <button
              type="button"
              onClick={handleStop}
              disabled={!canStop}
              aria-label="Stop generation"
              data-visible={isStreamingState ? 'true' : 'false'}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg',
                'bg-status-error text-foreground',
                'disabled:opacity-40 disabled:cursor-not-allowed',
                'hover:opacity-80 transition-opacity',
              )}
            >
              {composerState === 'aborting' ? (
                <div className="composer-abort-spinner" aria-hidden="true" />
              ) : (
                <Square size={14} aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ChatComposerProps is used by ChatView for prop threading
