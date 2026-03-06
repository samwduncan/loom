/**
 * ActiveMessage — Multi-span streaming message display component.
 *
 * Renders a segment array: text spans interleaved with ToolChip components.
 * The rAF loop paints to the current active text span via useStreamBuffer.
 * When a new tool call appears, the buffer is checkpointed and a new text
 * span is appended after the tool chip.
 *
 * ThinkingDisclosure renders above the content segments.
 *
 * Constitution: Named export (2.2), contain:content (10.3), React.memo (perf).
 */

import { memo, useRef, useCallback, useEffect, useState } from 'react';
import { useStreamBuffer } from '@/hooks/useStreamBuffer';
import { useTimelineStore } from '@/stores/timeline';
import { useStreamStore } from '@/stores/stream';
import { ToolChip } from '@/components/chat/tools/ToolChip';
import { ThinkingDisclosure } from '@/components/chat/view/ThinkingDisclosure';
import { MessageContainer } from '@/components/chat/view/MessageContainer';
import type { Message } from '@/types/message';
import type { ToolCallState } from '@/types/stream';
import '../styles/streaming-cursor.css';

export interface ActiveMessageProps {
  /** Session ID for flushing to timeline store */
  sessionId: string;
  /** Called when finalization animation completes — parent can unmount */
  onFinalizationComplete: () => void;
}

type Segment =
  | { type: 'text'; id: string }
  | { type: 'tool'; toolCallId: string };

let segmentCounter = 0;
function nextSegmentId(): string {
  return `seg-${++segmentCounter}`;
}

export const ActiveMessage = memo(function ActiveMessage(
  props: ActiveMessageProps,
): React.JSX.Element {
  const { sessionId, onFinalizationComplete } = props;

  const containerRef = useRef<HTMLDivElement>(null);
  const currentTextRef = useRef<HTMLSpanElement | null>(null);
  const finalizationFiredRef = useRef(false);
  const knownToolCountRef = useRef(0);

  const [segments, setSegments] = useState<Segment[]>(() => [
    { type: 'text', id: nextSegmentId() },
  ]);
  const [phase, setPhase] = useState<'streaming' | 'finalizing'>('streaming');
  const [disconnected, setDisconnected] = useState(false);

  // Store actions via selectors — functions are referentially stable (Constitution 4.2)
  const addMessage = useTimelineStore((state) => state.addMessage);
  const addSession = useTimelineStore((state) => state.addSession);

  // Stream store subscriptions
  const thinkingState = useStreamStore((state) => state.thinkingState);
  const toolCallCount = useStreamStore((state) => state.activeToolCalls.length);

  // Stable callback refs — synced via useEffect (react-hooks/refs compliance)
  const onFinalizationCompleteRef = useRef(onFinalizationComplete);
  const sessionIdRef = useRef(sessionId);

  useEffect(() => {
    onFinalizationCompleteRef.current = onFinalizationComplete;
    sessionIdRef.current = sessionId;
  });

  // Mutable ref for textNodeRef that useStreamBuffer reads — we swap this
  // to point at the latest text span when segments change
  const textNodeRef = useRef<HTMLSpanElement | null>(null);

  // Sync textNodeRef with currentTextRef in an effect (react-hooks/refs compliance)
  useEffect(() => {
    textNodeRef.current = currentTextRef.current;
  });

  const handleFlush = useCallback((text: string) => {
    if (finalizationFiredRef.current) return;
    finalizationFiredRef.current = true;

    // Enter finalizing phase — React state drives data-phase attribute, CSS drives the fade
    setPhase('finalizing');

    // Prefer stream store's activeSessionId — it's updated during stub reconciliation
    // when the backend assigns a real session ID. The prop sessionId may still point
    // to a removed stub if replaceState hasn't triggered a React Router re-render yet.
    // eslint-disable-next-line loom/no-external-store-mutation -- one-time read in callback, not mutation
    const streamActiveId = useStreamStore.getState().activeSessionId;
    const currentSessionId = streamActiveId ?? sessionIdRef.current;

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
      id: Math.random().toString(36).slice(2, 10),
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

  const { checkpoint } = useStreamBuffer({
    textNodeRef,
    onFlush: handleFlush,
    onDisconnect: handleDisconnect,
  });

  // Ref for checkpoint function to call from render body without stale closure
  const checkpointRef = useRef(checkpoint);
  useEffect(() => {
    checkpointRef.current = checkpoint;
  });

  // Detect new tool calls in render body (React "adjusting state during rendering" pattern).
  // This avoids the set-state-in-effect ESLint rule. React explicitly supports calling
  // setState during render as long as it's guarded by a condition that prevents infinite loops.
  if (toolCallCount > knownToolCountRef.current) {
    // eslint-disable-next-line loom/no-external-store-mutation -- one-time read during render, not mutation
    const allToolCalls = useStreamStore.getState().activeToolCalls;
    const newToolCalls = allToolCalls.slice(knownToolCountRef.current);

    // Checkpoint the buffer so the new span only gets new text
    checkpointRef.current();

    // Null out the text ref to signal span switch
    currentTextRef.current = null;
    textNodeRef.current = null;

    // Build new segments
    const newSegments: Segment[] = [];
    for (const tc of newToolCalls) {
      newSegments.push({ type: 'tool', toolCallId: tc.id });
      newSegments.push({ type: 'text', id: nextSegmentId() });
    }

    setSegments((prev) => [...prev, ...newSegments]);
    knownToolCountRef.current = toolCallCount;
  }

  // Ref callback for text spans — the LAST text span sets currentTextRef
  const makeTextRefCallback = useCallback(
    (segmentId: string) => (node: HTMLSpanElement | null) => {
      // We need to check if this is the last text segment.
      // Since ref callbacks fire on mount, we use a simple heuristic:
      // store the node and its segment id, then always update currentTextRef.
      // The last-rendered text span will be the latest to call this.
      if (node) {
        currentTextRef.current = node;
        textNodeRef.current = node;
      }
      // When segmentId is referenced here, it keeps the callback unique per segment.
      // This prevents React from reusing ref callbacks across spans.
      void segmentId;
    },
    [],
  );

  return (
    <MessageContainer role="assistant">
      <div
        ref={containerRef}
        className="active-message"
        data-phase={phase}
        data-testid="active-message"
      >
        <ThinkingDisclosure thinkingState={thinkingState} />
        {segments.map((seg) => {
          if (seg.type === 'text') {
            return <span key={seg.id} ref={makeTextRefCallback(seg.id)} />;
          }
          return <ToolChipFromStore key={seg.toolCallId} toolCallId={seg.toolCallId} />;
        })}
        <span className="streaming-cursor" data-testid="streaming-cursor" />
        {disconnected && (
          <div className="active-message-disconnect">
            Connection lost during response.
          </div>
        )}
      </div>
    </MessageContainer>
  );
});

/**
 * ToolChipFromStore — looks up a tool call by ID from the stream store.
 * Separated to isolate the store subscription per tool call.
 */
function ToolChipFromStore({ toolCallId }: { toolCallId: string }) {
  const toolCall = useStreamStore((state) =>
    state.activeToolCalls.find((tc: ToolCallState) => tc.id === toolCallId),
  );

  if (!toolCall) return null;
  return <ToolChip toolCall={toolCall} />;
}
