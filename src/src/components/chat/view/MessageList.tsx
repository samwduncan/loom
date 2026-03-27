/**
 * MessageList -- flat list with CSS content-visibility for smooth scrolling.
 *
 * No virtualization library. All messages are in the DOM but the browser
 * skips rendering off-screen items via content-visibility: auto. This avoids
 * the height estimation errors that cause scroll jumps in virtualization libs.
 *
 * Constitution: Named exports (2.2), selector-only store access (4.2).
 */

import { useRef, useState, useEffect, useLayoutEffect, useCallback, memo, type RefObject } from 'react';
import { UserMessage } from '@/components/chat/view/UserMessage';
import { AssistantMessage } from '@/components/chat/view/AssistantMessage';
import { ErrorMessage } from '@/components/chat/view/ErrorMessage';
import { SystemMessage } from '@/components/chat/view/SystemMessage';
import { TaskNotificationMessage } from '@/components/chat/view/TaskNotificationMessage';
import { ActiveMessage } from '@/components/chat/view/ActiveMessage';
import { ScrollToBottomPill } from '@/components/chat/view/ScrollToBottomPill';
import { MessageErrorBoundary } from '@/components/shared/ErrorBoundary';
import { useStreamStore } from '@/stores/stream';
import type { Message } from '@/types/message';
import type { ReactNode } from 'react';

const SCROLL_STORAGE_PREFIX = 'loom-scroll-';

export interface MessageListProps {
  messages: Message[];
  sessionId: string;
  scrollContainerRef?: RefObject<HTMLDivElement | null>;
  searchQuery?: string;
  highlightText?: (text: string) => ReactNode;
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

export function MessageList({ messages, sessionId, scrollContainerRef, searchQuery, highlightText }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isStreaming = useStreamStore((state) => state.isStreaming);
  const [atBottom, setAtBottom] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // ActiveMessage fade-out handling
  const [showActiveMessage, setShowActiveMessage] = useState(false);
  if (isStreaming && !showActiveMessage) {
    setShowActiveMessage(true);
  }
  const handleFinalized = useCallback(() => {
    setShowActiveMessage(false);
  }, []);

  // Track unread when new messages arrive while scrolled up
  const [prevCount, setPrevCount] = useState(messages.length);
  if (messages.length !== prevCount) {
    if (messages.length > prevCount && !atBottom) {
      setUnreadCount(prev => prev + (messages.length - prevCount));
    }
    setPrevCount(messages.length);
  }

  // Session switch — reset scroll state (adjust-state-during-render pattern)
  const [prevSession, setPrevSession] = useState(sessionId);
  if (prevSession !== sessionId) {
    setPrevSession(sessionId);
    setAtBottom(true);
    setUnreadCount(0);
  }

  // Save scroll position for the previous session on switch (via effect to satisfy refs rule)
  const prevSessionRef = useRef(sessionId);
  useEffect(() => {
    if (prevSessionRef.current !== sessionId) {
      const el = scrollRef.current;
      if (el && prevSessionRef.current) {
        sessionStorage.setItem(`${SCROLL_STORAGE_PREFIX}${prevSessionRef.current}`, String(el.scrollTop));
      }
      prevSessionRef.current = sessionId;
    }
  }, [sessionId]);

  // Scroll to saved position (or bottom) on session switch or initial messages load
  const scrolledSessionRef = useRef<string | null>(null);
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el && messages.length > 0 && scrolledSessionRef.current !== sessionId) {
      scrolledSessionRef.current = sessionId;
      const savedPos = sessionStorage.getItem(`${SCROLL_STORAGE_PREFIX}${sessionId}`);
      requestAnimationFrame(() => {
        if (savedPos !== null) {
          el.scrollTop = Number(savedPos);
        } else {
          el.scrollTop = el.scrollHeight;
        }
      });
    }
  });

  // Auto-follow during streaming
  useEffect(() => {
    const el = scrollRef.current;
    if (isStreaming && atBottom && el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [isStreaming, atBottom, messages.length]);

  // Track atBottom state + throttled scroll position save
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const isBottom = distFromBottom < 150;
    setAtBottom(isBottom);
    if (isBottom) setUnreadCount(0);

    // Throttled save to sessionStorage (200ms trailing edge)
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      sessionStorage.setItem(`${SCROLL_STORAGE_PREFIX}${sessionId}`, String(el.scrollTop));
    }, 200);
  }, [sessionId]);

  // Attach scroll listener + cleanup pending save timeout on unmount
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', handleScroll);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [handleScroll]);

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
    setUnreadCount(0);
  }, []);

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
      className="h-full overflow-y-auto"
      data-testid="message-list-scroll"
    >
      <div className="mx-auto max-w-3xl py-4">
        {messages.map((msg) => (
          <div key={msg.id}>
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
      <ScrollToBottomPill
        visible={!atBottom}
        onClick={scrollToBottom}
        unreadCount={unreadCount}
      />
    </div>
  );
}
