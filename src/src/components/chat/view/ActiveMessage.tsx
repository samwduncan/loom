/**
 * ActiveMessage — Streaming message display component.
 *
 * Uses useStreamBuffer for rAF-based token rendering. Manages a three-phase
 * lifecycle: streaming -> finalizing -> unmount signal. During finalization,
 * accumulated text flushes to the timeline store and the cursor + tint fade
 * out over 200ms before signaling the parent to unmount.
 *
 * Constitution: Named export (2.2), contain:content (10.3), React.memo (perf).
 */

import { memo, useRef, useCallback, useEffect } from 'react';
import { useStreamBuffer } from '@/hooks/useStreamBuffer';
import { useTimelineStore } from '@/stores/timeline';
import type { Message } from '@/types/message';
import type { Session } from '@/types/session';
import '../styles/streaming-cursor.css';

export interface ActiveMessageProps {
  /** Session ID for flushing to timeline store */
  sessionId: string;
  /** Called when finalization animation completes — parent can unmount */
  onFinalizationComplete: () => void;
}

export const ActiveMessage = memo(function ActiveMessage(
  props: ActiveMessageProps,
): React.JSX.Element {
  const { sessionId, onFinalizationComplete } = props;

  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const finalizationFiredRef = useRef(false);

  // Get store actions via selectors (Constitution 4.2)
  const addMessage = useTimelineStore((state) => state.addMessage);
  const addSession = useTimelineStore((state) => state.addSession);
  const sessions = useTimelineStore((state) => state.sessions);

  // Stable callback refs — synced via useEffect (react-hooks/refs compliance)
  const onFinalizationCompleteRef = useRef(onFinalizationComplete);
  const sessionIdRef = useRef(sessionId);
  const addMessageRef = useRef(addMessage);
  const addSessionRef = useRef(addSession);
  const sessionsRef = useRef(sessions);

  useEffect(() => {
    onFinalizationCompleteRef.current = onFinalizationComplete;
    sessionIdRef.current = sessionId;
    addMessageRef.current = addMessage;
    addSessionRef.current = addSession;
    sessionsRef.current = sessions;
  });

  const handleFlush = useCallback((text: string) => {
    if (finalizationFiredRef.current) return;
    finalizationFiredRef.current = true;

    // Enter finalizing phase via DOM attribute (CSS drives the fade)
    if (containerRef.current) {
      containerRef.current.dataset['phase'] = 'finalizing';
    }

    const currentSessionId = sessionIdRef.current;

    // M1 workaround: create stub session if needed
    const sessionExists = sessionsRef.current.some(
      (s: Session) => s.id === currentSessionId,
    );
    if (currentSessionId && !sessionExists) {
      addSessionRef.current({
        id: currentSessionId,
        title: 'New Chat',
        messages: [],
        providerId: 'claude',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: { tokenBudget: null, contextWindowUsed: null, totalCost: null },
      });
    }

    const message: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: text,
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

    addMessageRef.current(currentSessionId, message);

    // Signal parent after CSS fade completes (200ms = --duration-normal)
    setTimeout(() => {
      onFinalizationCompleteRef.current();
    }, 200);
  }, []);

  const handleDisconnect = useCallback(() => {
    // Enter finalizing phase
    if (containerRef.current) {
      containerRef.current.dataset['phase'] = 'finalizing';
    }

    // Append error line after the text node
    if (containerRef.current) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'active-message-disconnect';
      errorDiv.textContent = 'Connection lost during response.';
      containerRef.current.appendChild(errorDiv);
    }

    // Do NOT call onFinalizationComplete — component stays mounted with partial text
  }, []);

  useStreamBuffer({
    textNodeRef: textRef,
    onFlush: handleFlush,
    onDisconnect: handleDisconnect,
  });

  return (
    <div
      ref={containerRef}
      className="active-message"
      data-phase="streaming"
      data-testid="active-message"
    >
      <span ref={textRef} />
      <span className="streaming-cursor" data-testid="streaming-cursor" />
    </div>
  );
});
