/**
 * ActiveMessage — Multi-span streaming message display with crossfade finalization.
 *
 * Renders a segment array: text spans interleaved with ToolChip components.
 * The rAF loop paints to the current active text span via useStreamBuffer.
 * When a new tool call appears, the buffer is checkpointed and a new text
 * span is appended after the tool chip.
 *
 * On flush: renders MarkdownRenderer behind the streaming DOM, then crossfades
 * over 250ms (opacity + height animation). After transition, streaming DOM is
 * removed and container height set to auto.
 *
 * ThinkingDisclosure renders above the content segments.
 *
 * Constitution: Named export (2.2), contain:content (10.3), React.memo (perf).
 */

import { memo, useRef, useCallback, useEffect, useState, useMemo } from 'react';
import { useStreamBuffer } from '@/hooks/useStreamBuffer';
import { useTimelineStore } from '@/stores/timeline';
import { useStreamStore } from '@/stores/stream';
import { useUIStore } from '@/stores/ui';
import { ToolChip } from '@/components/chat/tools/ToolChip';
import { ToolCallGroup } from '@/components/chat/tools/ToolCallGroup';
import { ThinkingDisclosure } from '@/components/chat/view/ThinkingDisclosure';
import { MessageContainer } from '@/components/chat/view/MessageContainer';
import { MarkdownRenderer } from '@/components/chat/view/MarkdownRenderer';
import { StreamingCursor } from '@/components/chat/view/StreamingCursor';
import type { Message } from '@/types/message';
import type { ToolCallState } from '@/types/stream';
import '../styles/streaming-cursor.css';
import '../styles/streaming-markdown.css';

export interface ActiveMessageProps {
  /** Session ID for flushing to timeline store */
  sessionId: string;
  /** Called when finalization animation completes — parent can unmount */
  onFinalizationComplete: () => void;
}

type Segment =
  | { type: 'text'; id: string }
  | { type: 'tool'; toolCallId: string };

type Phase = 'streaming' | 'finalizing' | 'finalized';

/** Crossfade duration in ms — matches CSS var(--duration-normal) */
const CROSSFADE_MS = 250;

let segmentCounter = 0;
function nextSegmentId(): string {
  return `seg-${++segmentCounter}`;
}

export const ActiveMessage = memo(function ActiveMessage(
  props: ActiveMessageProps,
): React.JSX.Element {
  const { sessionId, onFinalizationComplete } = props;

  const containerRef = useRef<HTMLDivElement>(null);
  const streamingRef = useRef<HTMLDivElement>(null);
  const finalizedRef = useRef<HTMLDivElement>(null);
  const currentTextRef = useRef<HTMLSpanElement | null>(null);
  const finalizationFiredRef = useRef(false);
  const knownToolCountRef = useRef(0);

  const [segments, setSegments] = useState<Segment[]>(() => [
    { type: 'text', id: nextSegmentId() },
  ]);
  const [phase, setPhase] = useState<Phase>('streaming');
  const [finalizedContent, setFinalizedContent] = useState<string | null>(null);
  const [disconnected, setDisconnected] = useState(false);

  // Store actions via selectors — functions are referentially stable (Constitution 4.2)
  const addMessage = useTimelineStore((state) => state.addMessage);
  const addSession = useTimelineStore((state) => state.addSession);

  // Stream store subscriptions
  const thinkingState = useStreamStore((state) => state.thinkingState);
  const toolCallCount = useStreamStore((state) => state.activeToolCalls.length);
  const thinkingExpanded = useUIStore((state) => state.thinkingExpanded);

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

    // Set finalized content — triggers React render with MarkdownRenderer
    setFinalizedContent(text);

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

    // Read result data from stream store (populated by multiplexer onResultData)
    // eslint-disable-next-line loom/no-external-store-mutation -- one-time read in callback, not mutation
    const resultTokens = useStreamStore.getState().resultTokens;
    // eslint-disable-next-line loom/no-external-store-mutation -- one-time read in callback, not mutation
    const resultCost = useStreamStore.getState().resultCost;

    const message: Message = {
      id: Math.random().toString(36).slice(2, 10),
      role: 'assistant',
      content: text,
      metadata: {
        timestamp: new Date().toISOString(),
        tokenCount: resultTokens ? resultTokens.input + resultTokens.output : null,
        inputTokens: resultTokens?.input ?? null,
        outputTokens: resultTokens?.output ?? null,
        cacheReadTokens: resultTokens?.cacheRead ?? null,
        cost: resultCost,
        duration: null,
      },
      providerContext: {
        providerId: 'claude',
        modelId: '',
        agentName: null,
      },
    };

    addMessage(currentSessionId, message);

    // Crossfade orchestration: measure heights, animate, clean up
    // Use rAF to wait for React to render the finalized content
    requestAnimationFrame(() => {
      const container = containerRef.current;
      const streaming = streamingRef.current;
      const finalized = finalizedRef.current;

      if (!container || !streaming || !finalized) {
        // Fallback: skip animation, go straight to finalized
        setPhase('finalized');
        onFinalizationCompleteRef.current();
        return;
      }

      // Measure heights
      const streamingHeight = streaming.getBoundingClientRect().height;
      const finalizedHeight = finalized.getBoundingClientRect().height;

      // Set container to explicit streaming height
      container.style.height = `${streamingHeight}px`;

      // Force reflow to ensure starting height is committed
      void container.offsetHeight;

      // Animate to finalized height + trigger opacity crossfade via data-phase
      container.style.height = `${finalizedHeight}px`;
      setPhase('finalizing');

      // After crossfade completes: clean up and signal parent
      let signaled = false;
      const signalComplete = () => {
        if (signaled) return;
        signaled = true;
        setPhase('finalized');
        if (container) {
          container.style.height = 'auto';
        }
        onFinalizationCompleteRef.current();
      };

      const handleTransitionEnd = (e: TransitionEvent) => {
        // Wait for the opacity transition on the finalized layer
        if (e.propertyName === 'opacity' && e.target === finalized) {
          container.removeEventListener('transitionend', handleTransitionEnd);
          signalComplete();
        }
      };
      container.addEventListener('transitionend', handleTransitionEnd);

      // Safety fallback if transitionend doesn't fire (reduced-motion, display changes)
      setTimeout(() => {
        container.removeEventListener('transitionend', handleTransitionEnd);
        signalComplete();
      }, CROSSFADE_MS + 100);
    });
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

  // Derive render chunks from segments: leading text, grouped tools, trailing text.
  // During streaming, tools are always consecutive (text spans between them are empty
  // checkpointed spans). This groups 2+ consecutive tool segments into a ToolCallGroup.
  const renderChunks = useMemo(() => {
    type TextSeg = Extract<Segment, { type: 'text' }>;
    type ToolSeg = Extract<Segment, { type: 'tool' }>;

    const toolSegs: ToolSeg[] = [];
    const leadingText: TextSeg[] = [];
    let trailingText: TextSeg | null = null;
    let foundFirstTool = false;

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i]!; // ASSERT: loop index i is within bounds [0, segments.length)
      if (seg.type === 'tool') {
        foundFirstTool = true;
        toolSegs.push(seg);
      } else if (!foundFirstTool) {
        leadingText.push(seg);
      } else {
        // Text segment after a tool — only the last one matters (receives streaming content)
        trailingText = seg;
      }
    }

    return { leadingText, toolSegs, trailingText };
  }, [segments]);

  return (
    <MessageContainer role="assistant" isStreaming>
      <div
        ref={containerRef}
        className="crossfade-container active-message"
        data-phase={phase}
        data-testid="active-message"
      >
        {/* Streaming layer — removed after finalization */}
        {phase !== 'finalized' && (
          <div ref={streamingRef} className="crossfade-streaming">
            <ThinkingDisclosure
              blocks={thinkingState?.blocks ?? []}
              isStreaming={thinkingState?.isThinking ?? false}
              globalExpanded={thinkingExpanded}
            />
            {/* Leading text spans (before any tools) */}
            {renderChunks.leadingText.map((seg) => (
              <span key={seg.id} ref={makeTextRefCallback(seg.id)} />
            ))}
            {/* Tool calls: group 2+ into ToolCallGroup, single as ToolChipFromStore */}
            {renderChunks.toolSegs.length >= 2 ? (
              <ToolCallGroupFromStore
                toolCallIds={renderChunks.toolSegs.map((seg) => seg.toolCallId)}
              />
            ) : (
              renderChunks.toolSegs.map((seg) => (
                <ToolChipFromStore
                  key={seg.toolCallId}
                  toolCallId={seg.toolCallId}
                />
              ))
            )}
            {/* Trailing text span (receives streaming content after last tool) */}
            {renderChunks.trailingText && (
              <span
                key={renderChunks.trailingText.id}
                ref={makeTextRefCallback(renderChunks.trailingText.id)}
              />
            )}
            <StreamingCursor />
          </div>
        )}
        {/* Finalized layer — rendered once flush provides content */}
        {finalizedContent !== null && (
          <div ref={finalizedRef} className="crossfade-finalized">
            <MarkdownRenderer content={finalizedContent} />
          </div>
        )}
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

/**
 * ToolCallGroupFromStore — subscribes to multiple tool calls and renders
 * them inside a ToolCallGroup container during streaming.
 *
 * Groups start expanded (forceExpanded) so users can see tool
 * activity in real time. Error tools are extracted from the group.
 */
function ToolCallGroupFromStore({ toolCallIds }: { toolCallIds: string[] }) {
  const toolCalls = useStreamStore((state) =>
    toolCallIds
      .map((id) => state.activeToolCalls.find((tc: ToolCallState) => tc.id === id))
      .filter((tc): tc is ToolCallState => tc != null),
  );

  if (toolCalls.length === 0) return null;

  // If demoted to single (shouldn't happen, but safety)
  if (toolCalls.length === 1) {
    return <ToolChip toolCall={toolCalls[0]!} />; // ASSERT: length === 1 guarantees index 0 exists
  }

  const errors = toolCalls.filter((tc) => tc.isError);
  const nonErrors = toolCalls.filter((tc) => !tc.isError);

  // If all tools are errors, show them individually
  if (nonErrors.length === 0) {
    return (
      <>
        {errors.map((tc) => (
          <ToolChip key={tc.id} toolCall={tc} />
        ))}
      </>
    );
  }

  // During streaming, show group expanded so user sees what's happening
  return <ToolCallGroup tools={nonErrors} errors={errors} forceExpanded />;
}
