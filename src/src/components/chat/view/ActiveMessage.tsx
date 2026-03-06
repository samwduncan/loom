/**
 * ActiveMessage — Streaming message display component.
 *
 * Uses useStreamBuffer for rAF-based token rendering. Manages a three-phase
 * lifecycle: streaming -> finalizing -> unmount signal. During finalization,
 * accumulated text flushes to the timeline store and the cursor + tint fade
 * out over the CSS transition duration before signaling the parent to unmount.
 *
 * Constitution: Named export (2.2), contain:content (10.3), React.memo (perf).
 */

import { memo, useRef, useCallback, useEffect, useState } from 'react';
import { useStreamBuffer } from '@/hooks/useStreamBuffer';
import { useTimelineStore } from '@/stores/timeline';
import type { Message } from '@/types/message';
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

  const [phase, setPhase] = useState<'streaming' | 'finalizing'>('streaming');
  const [disconnected, setDisconnected] = useState(false);

  // Store actions via selectors — functions are referentially stable (Constitution 4.2)
  const addMessage = useTimelineStore((state) => state.addMessage);
  const addSession = useTimelineStore((state) => state.addSession);

  // Stable callback refs — synced via useEffect (react-hooks/refs compliance)
  const onFinalizationCompleteRef = useRef(onFinalizationComplete);
  const sessionIdRef = useRef(sessionId);

  useEffect(() => {
    onFinalizationCompleteRef.current = onFinalizationComplete;
    sessionIdRef.current = sessionId;
  });

  const handleFlush = useCallback((text: string) => {
    if (finalizationFiredRef.current) return;
    finalizationFiredRef.current = true;

    // Enter finalizing phase — React state drives data-phase attribute, CSS drives the fade
    setPhase('finalizing');

    const currentSessionId = sessionIdRef.current;

    // M1 workaround: create stub session if needed. getState() is intentional here —
    // subscribing to sessions would cause re-renders during streaming for no benefit.
    // eslint-disable-next-line loom/no-external-store-mutation -- one-time read in callback, not mutation
    const sessions = useTimelineStore.getState().sessions;
    const sessionExists = sessions.some(
      (s: { id: string }) => s.id === currentSessionId,
    );
    if (currentSessionId && !sessionExists) {
      addSession({
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

    addMessage(currentSessionId, message);

    // Signal parent after CSS transition completes (driven by data-phase change)
    const container = containerRef.current;
    if (container) {
      let signaled = false;
      const signalComplete = () => {
        if (signaled) return;
        signaled = true;
        onFinalizationCompleteRef.current();
      };

      const handleTransitionEnd = (e: TransitionEvent) => {
        if (e.propertyName === 'background-color') {
          container.removeEventListener('transitionend', handleTransitionEnd);
          signalComplete();
        }
      };
      container.addEventListener('transitionend', handleTransitionEnd);

      // Safety fallback if transitionend doesn't fire (reduced-motion, display changes)
      setTimeout(() => {
        container.removeEventListener('transitionend', handleTransitionEnd);
        signalComplete();
      }, 500);
    }
  }, [addMessage, addSession]);

  const handleDisconnect = useCallback(() => {
    setPhase('finalizing');
    setDisconnected(true);
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
      data-phase={phase}
      data-testid="active-message"
    >
      <span ref={textRef} />
      <span className="streaming-cursor" data-testid="streaming-cursor" />
      {disconnected && (
        <div className="active-message-disconnect">
          Connection lost during response.
        </div>
      )}
    </div>
  );
});
