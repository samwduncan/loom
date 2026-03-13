/**
 * MessageList -- renders an array of Message objects with scroll anchoring.
 *
 * 5-way dispatch: user, assistant, error, system, task_notification.
 * Each message wrapped in MessageErrorBoundary for crash isolation.
 * During streaming, renders ActiveMessage at the end.
 * Includes scroll anchor sentinel and ScrollToBottomPill.
 *
 * Scroll position is saved per session and restored on switch.
 * New sessions (no saved position) scroll to bottom.
 * Unread count tracks messages arriving while scrolled away from bottom.
 *
 * ActiveMessage stays mounted through finalization to complete the 200ms
 * fade-out before unmounting. showActiveMessage is driven by
 * onFinalizationComplete, NOT by isStreaming going false.
 *
 * Constitution: Named exports (2.2), selector-only store access (4.2).
 */

import { useRef, useState, useEffect, useCallback, useLayoutEffect, type RefObject } from 'react';
import { cn } from '@/utils/cn';
import { UserMessage } from '@/components/chat/view/UserMessage';
import { AssistantMessage } from '@/components/chat/view/AssistantMessage';
import { ErrorMessage } from '@/components/chat/view/ErrorMessage';
import { SystemMessage } from '@/components/chat/view/SystemMessage';
import { TaskNotificationMessage } from '@/components/chat/view/TaskNotificationMessage';
import { ActiveMessage } from '@/components/chat/view/ActiveMessage';
import { ScrollToBottomPill } from '@/components/chat/view/ScrollToBottomPill';
import { MessageErrorBoundary } from '@/components/shared/ErrorBoundary';
import { useScrollAnchor } from '@/hooks/useScrollAnchor';
import { useStreamStore } from '@/stores/stream';
import type { Message } from '@/types/message';
import type { ReactNode } from 'react';

export interface MessageListProps {
  messages: Message[];
  sessionId: string;
  /** Scroll container ref passed from ChatView for composer scroll stability */
  scrollContainerRef?: RefObject<HTMLDivElement | null>;
  /** Active search query (debounced) -- used for empty state display */
  searchQuery?: string;
  /** Highlight function to wrap matching text in <mark> elements */
  highlightText?: (text: string) => ReactNode;
  /** Whether older messages are available for loading */
  hasMore?: boolean;
  /** Whether a pagination fetch is currently in flight */
  isFetchingMore?: boolean;
  /** Callback to trigger loading older messages */
  onLoadMore?: () => void;
}

export function MessageList({ messages, sessionId, scrollContainerRef, searchQuery, highlightText, hasMore, isFetchingMore, onLoadMore }: MessageListProps) {
  const internalScrollRef = useRef<HTMLDivElement>(null);
  // Use external ref if provided (for composer scroll stability), otherwise internal
  const scrollRef = scrollContainerRef ?? internalScrollRef;
  const assignRef = scrollContainerRef ?? internalScrollRef;
  const isStreaming = useStreamStore((state) => state.isStreaming);
  const topSentinelRef = useRef<HTMLDivElement>(null);

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
  }, []);

  const {
    sentinelRef,
    showPill,
    scrollToBottom,
    unreadCount,
    saveScrollPosition,
    restoreScrollPosition,
    incrementUnread,
  } = useScrollAnchor(scrollRef);

  // --- Entrance animation tracking ---
  // Uses React "adjust state during rendering" pattern to track which messages
  // are "new" (appended after initial render or session switch).
  // Initial load and session switches suppress animations to avoid cascade.
  const [animationState, setAnimationState] = useState({
    prevCount: messages.length,
    prevSessionId: sessionId,
    newStartIndex: messages.length, // Start with all "old" (no animations on mount)
  });

  // Adjust state during rendering: detect message count changes and session switches
  // without useEffect. React explicitly supports calling setState during render as
  // long as it's guarded by a condition that prevents infinite loops.
  if (sessionId !== animationState.prevSessionId) {
    // Session switch: suppress animations, reset base
    setAnimationState({
      prevCount: messages.length,
      prevSessionId: sessionId,
      newStartIndex: messages.length,
    });
  } else if (messages.length !== animationState.prevCount) {
    // Same session, new messages: animate messages at index >= previous count
    setAnimationState({
      prevCount: messages.length,
      prevSessionId: sessionId,
      newStartIndex: messages.length > animationState.prevCount
        ? animationState.prevCount
        : messages.length, // Count decreased (unlikely) -- no animations
    });
  }

  const newStartIndex = animationState.newStartIndex;

  // Scroll position save/restore on session switch.
  // Saves old session position, restores target session position.
  // New sessions (no saved position) scroll to bottom.
  const prevSessionIdRef = useRef<string | null>(null);
  const prevMessageCountRef = useRef(messages.length);

  useLayoutEffect(() => {
    // Save outgoing session's scroll position (must run before early return
    // so switching to an empty session still saves the outgoing position)
    if (prevSessionIdRef.current !== null && prevSessionIdRef.current !== sessionId) {
      saveScrollPosition(prevSessionIdRef.current);
    }

    if (messages.length === 0) {
      prevSessionIdRef.current = sessionId;
      return;
    }

    // Restore target session's position or scroll to bottom for new sessions
    if (prevSessionIdRef.current !== sessionId) {
      const restored = restoreScrollPosition(sessionId);
      if (!restored) {
        // No saved position -- scroll to bottom (new session)
        const el = scrollRef.current;
        if (el) el.scrollTop = el.scrollHeight;
      }
      prevSessionIdRef.current = sessionId;
    }
  }, [sessionId, messages.length, scrollRef, saveScrollPosition, restoreScrollPosition]);

  // Track new messages arriving while scrolled up for unread badge.
  // useEffect syncs message count changes to unread counter when pill is visible.
  // The ref sync pattern (useEffect, not render-time) satisfies react-hooks/refs.
  useEffect(() => {
    const prev = prevMessageCountRef.current;
    prevMessageCountRef.current = messages.length;
    if (messages.length > prev && showPill) {
      incrementUnread(messages.length - prev);
    }
  }, [messages.length, showPill, incrementUnread]);

  // --- Pagination: IntersectionObserver for scroll-up loading ---
  useEffect(() => {
    if (!topSentinelRef.current || !hasMore || !onLoadMore) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !isFetchingMore) {
          onLoadMore();
        }
      },
      { root: scrollRef.current, rootMargin: '200px 0px 0px 0px' },
    );
    observer.observe(topSentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, isFetchingMore, onLoadMore, scrollRef]);

  // --- Pagination: Scroll position preservation on prepend ---
  // When older messages are prepended, scrollHeight increases but scrollTop
  // stays the same, causing a visual jump. This compensates by adding the
  // height delta to scrollTop immediately after DOM commit.
  const prevScrollHeightRef = useRef(0);
  const prevFirstMsgIdRef = useRef<string | null>(null);
  const prevPrependCountRef = useRef(messages.length);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const firstId = messages[0]?.id ?? null;
    // Detect prepend: first message ID changed AND count increased
    if (
      prevFirstMsgIdRef.current !== null &&
      firstId !== prevFirstMsgIdRef.current &&
      messages.length > prevPrependCountRef.current
    ) {
      const delta = el.scrollHeight - prevScrollHeightRef.current;
      el.scrollTop += delta;
    }
    prevScrollHeightRef.current = el.scrollHeight;
    prevFirstMsgIdRef.current = firstId;
    prevPrependCountRef.current = messages.length;
  });

  // Combined scroll-to-bottom + reset unread handler for pill click
  const handlePillClick = useCallback(() => {
    scrollToBottom();
  }, [scrollToBottom]);

  function renderMessage(msg: Message) {
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
  }

  return (
    <div
      ref={assignRef}
      className="flex-1 overflow-y-auto"
      data-testid="message-list-scroll"
    >
      {/* Search empty state */}
      {messages.length === 0 && searchQuery ? (
        <div className="flex flex-1 items-center justify-center py-20 text-sm text-muted" data-testid="search-empty-state">
          No messages match &lsquo;{searchQuery}&rsquo;
        </div>
      ) : (
      <div className="mx-auto max-w-3xl flex flex-col py-4">
        {hasMore && (
          <div ref={topSentinelRef} className="h-px" aria-hidden="true" data-testid="pagination-sentinel" />
        )}
        {isFetchingMore && (
          <div className="flex justify-center py-2" data-testid="pagination-spinner">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted border-t-accent-primary" />
          </div>
        )}
        {messages.map((msg, idx) => (
          <MessageErrorBoundary key={msg.id}>
            <div className={cn(
              idx >= newStartIndex && 'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 duration-200'
            )}>
              {renderMessage(msg)}
            </div>
          </MessageErrorBoundary>
        ))}
        {showActiveMessage && (
          <ActiveMessage
            sessionId={sessionId}
            onFinalizationComplete={handleFinalized}
          />
        )}
      </div>
      )}
      <div ref={sentinelRef} className="h-0" aria-hidden="true" />
      <ScrollToBottomPill
        visible={showPill}
        onClick={handlePillClick}
        unreadCount={unreadCount}
      />
    </div>
  );
}
