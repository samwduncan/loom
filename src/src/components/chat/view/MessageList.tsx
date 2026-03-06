/**
 * MessageList -- renders an array of Message objects with scroll anchoring.
 *
 * Dispatches to UserMessage or AssistantMessage based on message.role.
 * Each message wrapped in MessageErrorBoundary for crash isolation.
 * During streaming, renders ActiveMessage at the end.
 * Includes scroll anchor sentinel and ScrollToBottomPill.
 *
 * Constitution: Named exports (2.2), selector-only store access (4.2).
 */

import { useRef } from 'react';
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
}

export function MessageList({ messages, sessionId, onStreamFinalized }: MessageListProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isStreaming = useStreamStore((state) => state.isStreaming);

  const { sentinelRef, showPill, scrollToBottom } = useScrollAnchor(scrollContainerRef);

  return (
    <div
      ref={scrollContainerRef}
      className="flex-1 overflow-y-auto"
      data-testid="message-list-scroll"
    >
      <div className="flex flex-col py-4">
        {messages.map((msg) => (
          <MessageErrorBoundary key={msg.id}>
            {msg.role === 'user' ? (
              <UserMessage message={msg} />
            ) : (
              <AssistantMessage message={msg} />
            )}
          </MessageErrorBoundary>
        ))}
        {isStreaming && (
          <ActiveMessage
            sessionId={sessionId}
            onFinalizationComplete={onStreamFinalized}
          />
        )}
      </div>
      <div ref={sentinelRef} className="h-0" aria-hidden="true" />
      <ScrollToBottomPill visible={showPill} onClick={scrollToBottom} />
    </div>
  );
}
