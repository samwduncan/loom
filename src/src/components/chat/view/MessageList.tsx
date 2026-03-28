/**
 * MessageList -- flat list with CSS content-visibility for smooth scrolling.
 *
 * No virtualization library. All messages are in the DOM but the browser
 * skips rendering off-screen items via content-visibility: auto. This avoids
 * the height estimation errors that cause scroll jumps in virtualization libs.
 *
 * Scroll logic extracted to useChatScroll hook (Phase 64):
 * - IO sentinel for atBottom detection (ref-based, no setState in scroll path)
 * - ResizeObserver auto-follow during streaming
 * - Debounced pill state, unread tracking, scroll position persistence
 *
 * Constitution: Named exports (2.2), selector-only store access (4.2).
 */

import { useRef, useState, useEffect, useCallback, memo, type RefObject } from 'react';
import { Loader2 } from 'lucide-react';
import { UserMessage } from '@/components/chat/view/UserMessage';
import { AssistantMessage } from '@/components/chat/view/AssistantMessage';
import { ErrorMessage } from '@/components/chat/view/ErrorMessage';
import { SystemMessage } from '@/components/chat/view/SystemMessage';
import { TaskNotificationMessage } from '@/components/chat/view/TaskNotificationMessage';
import { ActiveMessage } from '@/components/chat/view/ActiveMessage';
import { ScrollToBottomPill } from '@/components/chat/view/ScrollToBottomPill';
import { MessageErrorBoundary } from '@/components/shared/ErrorBoundary';
import { useChatScroll } from '@/hooks/useChatScroll';
import { useStreamStore } from '@/stores/stream';
import type { Message } from '@/types/message';
import type { ReactNode } from 'react';

export interface MessageListProps {
  messages: Message[];
  sessionId: string;
  scrollContainerRef?: RefObject<HTMLDivElement | null>;
  searchQuery?: string;
  highlightText?: (text: string) => ReactNode;
  hasMoreMessages?: boolean;
  isFetchingMore?: boolean;
  onLoadMore?: () => void;
}

/** Memoized message renderer — prevents re-render on parent re-render */
const MemoizedMessageItem = memo(function MemoizedMessageItem({
  msg,
  sessionId,
  highlightText,
}: {
  msg: Message;
  sessionId: string;
  highlightText?: (text: string) => ReactNode;
}) {
  switch (msg.role) {
    case 'user':
      return <UserMessage message={msg} highlightText={highlightText} />;
    case 'assistant':
      return <AssistantMessage message={msg} highlightText={highlightText} />;
    case 'error':
      return <ErrorMessage message={msg} sessionId={sessionId} />;
    case 'system':
      return <SystemMessage message={msg} />;
    case 'task_notification':
      return <TaskNotificationMessage message={msg} />;
    default:
      return null;
  }
});

/** No content-visibility — browser renders all items to avoid scroll height changes */

export function MessageList({ messages, sessionId, scrollContainerRef, searchQuery, highlightText, hasMoreMessages, isFetchingMore, onLoadMore }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const loadMoreSentinelRef = useRef<HTMLDivElement>(null);
  const isStreaming = useStreamStore((state) => state.isStreaming);

  // ─── useChatScroll hook (replaces ~120 lines of inline scroll logic) ──
  const {
    sentinelRef,
    showPill,
    unreadCount,
    scrollToBottom,
    contentWrapperRef,
  } = useChatScroll({
    scrollContainerRef: scrollRef,
    sessionId,
    isStreaming,
    messageCount: messages.length,
  });

  // ActiveMessage fade-out handling
  const [showActiveMessage, setShowActiveMessage] = useState(false);
  if (isStreaming && !showActiveMessage) {
    setShowActiveMessage(true);
  }
  const handleFinalized = useCallback(() => {
    setShowActiveMessage(false);
  }, []);

  // Infinite scroll: auto-load older messages when sentinel is visible
  const onLoadMoreRef = useRef(onLoadMore);
  useEffect(() => { onLoadMoreRef.current = onLoadMore; });
  useEffect(() => {
    const sentinel = loadMoreSentinelRef.current;
    const container = scrollRef.current;
    if (!sentinel || !container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && onLoadMoreRef.current) {
          // Save scroll height before prepend for anchor restoration
          const prevHeight = container.scrollHeight;
          const prevScroll = container.scrollTop;

          onLoadMoreRef.current();

          // After DOM update: restore scroll position so content doesn't jump
          requestAnimationFrame(() => {
            const newHeight = container.scrollHeight;
            container.scrollTop = prevScroll + (newHeight - prevHeight);
          });
        }
      },
      { root: container, rootMargin: '200px 0px 0px 0px' },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [sessionId, hasMoreMessages]);

  // Ref callback merges internal scrollRef with external scrollContainerRef
  const mergedRef = useCallback((node: HTMLDivElement | null) => {
    (scrollRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    if (scrollContainerRef) {
      // ASSERT: scrollContainerRef is a MutableRefObject passed from ChatView for scroll-position stability
      const mutableRef = scrollContainerRef as React.MutableRefObject<HTMLDivElement | null>;
      mutableRef.current = node;
    }
  }, [scrollContainerRef]);

  // Search empty state
  if (messages.length === 0 && searchQuery) {
    return (
      <div className="flex flex-1 items-center justify-center py-20 text-sm text-muted" data-testid="search-empty-state">
        No messages match &lsquo;{searchQuery}&rsquo;
      </div>
    );
  }

  return (
    <div
      ref={mergedRef}
      className="native-scroll h-full overflow-y-auto"
      data-testid="message-list-scroll"
    >
      <div ref={contentWrapperRef} className="mx-auto max-w-3xl py-4">
        {hasMoreMessages && (
          <div ref={loadMoreSentinelRef} className="flex justify-center py-2">
            {isFetchingMore && <Loader2 className="size-4 animate-spin text-muted" />}
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className="contain-content msg-item">
            <div className="px-2 md:px-4">
              <MessageErrorBoundary>
                <MemoizedMessageItem msg={msg} sessionId={sessionId} highlightText={highlightText} />
              </MessageErrorBoundary>
            </div>
          </div>
        ))}
        {showActiveMessage && (
          <div className="px-2 md:px-4">
            <ActiveMessage
              sessionId={sessionId}
              onFinalizationComplete={handleFinalized}
            />
          </div>
        )}
      </div>
      {/* Bottom sentinel for IO-based atBottom detection */}
      <div ref={sentinelRef} style={{ height: 1 }} aria-hidden="true" />
      <ScrollToBottomPill
        visible={showPill}
        onClick={scrollToBottom}
        unreadCount={unreadCount}
      />
    </div>
  );
}
