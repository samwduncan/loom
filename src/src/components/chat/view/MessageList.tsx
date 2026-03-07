/**
 * MessageList -- renders an array of Message objects with scroll anchoring.
 *
 * Dispatches to UserMessage or AssistantMessage based on message.role.
 * Each message wrapped in MessageErrorBoundary for crash isolation.
 * During streaming, renders ActiveMessage at the end.
 * Includes scroll anchor sentinel and ScrollToBottomPill.
 *
 * ActiveMessage stays mounted through finalization to complete the 200ms
 * fade-out before unmounting. showActiveMessage is driven by
 * onFinalizationComplete, NOT by isStreaming going false.
 *
 * Constitution: Named exports (2.2), selector-only store access (4.2).
 */

import { useRef, useState, useCallback, useLayoutEffect, type RefObject } from 'react';
import { UserMessage } from '@/components/chat/view/UserMessage';
import { AssistantMessage } from '@/components/chat/view/AssistantMessage';
import { ActiveMessage } from '@/components/chat/view/ActiveMessage';
import { ScrollToBottomPill } from '@/components/chat/view/ScrollToBottomPill';
import { MessageErrorBoundary } from '@/components/shared/ErrorBoundary';
import { useScrollAnchor } from '@/hooks/useScrollAnchor';
import { useStreamStore } from '@/stores/stream';
import type { Message } from '@/types/message';

interface MessageListProps {
  messages: Message[];
  sessionId: string;
  onStreamFinalized: () => void;
  /** Scroll container ref passed from ChatView for composer scroll stability */
  scrollContainerRef?: RefObject<HTMLDivElement | null>;
}

export function MessageList({ messages, sessionId, onStreamFinalized, scrollContainerRef }: MessageListProps) {
  const internalScrollRef = useRef<HTMLDivElement>(null);
  // Use external ref if provided (for composer scroll stability), otherwise internal
  const scrollRef = scrollContainerRef ?? internalScrollRef;
  const assignRef = scrollContainerRef ?? internalScrollRef;
  const isStreaming = useStreamStore((state) => state.isStreaming);

  // ActiveMessage must stay mounted through finalization fade (200ms).
  // showActiveMessage turns ON when streaming starts, OFF only when
  // onFinalizationComplete fires -- NOT when isStreaming flips to false.
  // Uses React "adjust state during rendering" pattern (not useEffect)
  // to avoid the set-state-in-effect ESLint rule.
  const [showActiveMessage, setShowActiveMessage] = useState(false);

  if (isStreaming && !showActiveMessage) {
    setShowActiveMessage(true);
  }

  const handleFinalized = useCallback(() => {
    setShowActiveMessage(false);
    onStreamFinalized();
  }, [onStreamFinalized]);

  const { sentinelRef, showPill, scrollToBottom } = useScrollAnchor(scrollRef);

  // Scroll to bottom on mount and on session change. useLayoutEffect fires
  // synchronously after React commits DOM mutations, so scrollHeight is final.
  const scrolledSessionRef = useRef<string | null>(null);
  useLayoutEffect(() => {
    if (messages.length === 0) return;
    if (scrolledSessionRef.current === sessionId) return;
    scrolledSessionRef.current = sessionId;

    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [sessionId, messages.length, scrollRef]);

  return (
    <div
      ref={assignRef}
      className="flex-1 overflow-y-auto"
      data-testid="message-list-scroll"
    >
      <div className="mx-auto max-w-3xl flex flex-col py-4">
        {messages.map((msg) => (
          <MessageErrorBoundary key={msg.id}>
            {msg.role === 'user' ? (
              <UserMessage message={msg} />
            ) : (
              <AssistantMessage message={msg} />
            )}
          </MessageErrorBoundary>
        ))}
        {showActiveMessage && (
          <ActiveMessage
            sessionId={sessionId}
            onFinalizationComplete={handleFinalized}
          />
        )}
      </div>
      <div ref={sentinelRef} className="h-0" aria-hidden="true" />
      <ScrollToBottomPill visible={showPill} onClick={scrollToBottom} />
    </div>
  );
}
