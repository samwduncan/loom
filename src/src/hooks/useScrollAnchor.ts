/**
 * useScrollAnchor -- IntersectionObserver-based scroll anchoring for chat streaming.
 *
 * Pins scroll to bottom during streaming via rAF loop, disengages on user scroll,
 * re-engages on pill click or new stream start. Anti-oscillation guard prevents
 * pill flashing during programmatic auto-scroll.
 *
 * Enhanced with:
 * - Per-session scroll position map (save/restore on session switch)
 * - ResizeObserver bottom lock for dynamic content during streaming
 * - Unread message count tracking when scrolled away from bottom
 * - 200px threshold for pill visibility via IntersectionObserver rootMargin
 *
 * Uses a callback ref for the sentinel element so that the IntersectionObserver
 * setup re-runs when the sentinel is attached to the DOM (refs alone don't trigger effects).
 *
 * Constitution: Selector-only store access (4.2), named exports (2.2).
 */

import {
  useRef,
  useState,
  useEffect,
  useCallback,
  type RefObject,
} from 'react';
import { useStreamStore } from '@/stores/stream';

export interface UseScrollAnchorReturn {
  /** Callback ref to attach to the sentinel element at scroll container bottom */
  sentinelRef: (node: HTMLDivElement | null) => void;
  /** Whether user is currently at the bottom of scroll */
  isAtBottom: boolean;
  /** Whether to show the scroll-to-bottom pill */
  showPill: boolean;
  /** Click handler for the pill -- smooth scrolls and re-engages */
  scrollToBottom: () => void;
  /** Number of messages arrived while scrolled away from bottom */
  unreadCount: number;
  /** Reset unread count to 0 (called when scrolling to bottom) */
  resetUnread: () => void;
  /** Increment unread count by delta (called by MessageList on new messages while scrolled up) */
  incrementUnread: (delta: number) => void;
  /** Save current scroll position for a session */
  saveScrollPosition: (sessionId: string) => void;
  /** Restore saved scroll position for a session. Returns true if position was restored. */
  restoreScrollPosition: (sessionId: string) => boolean;
}

export function useScrollAnchor(
  scrollContainerRef: RefObject<HTMLElement | null>,
): UseScrollAnchorReturn {
  const [sentinelNode, setSentinelNode] = useState<HTMLDivElement | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const isAutoScrollingRef = useRef(false);
  const prevIsStreamingRef = useRef(false);
  const scrollPositionMapRef = useRef<Map<string, number>>(new Map());
  const resizeRafRef = useRef<number | null>(null);

  const isStreaming = useStreamStore((state) => state.isStreaming);

  // Callback ref for sentinel element -- triggers observer setup on attach
  const sentinelRef = useCallback((node: HTMLDivElement | null) => {
    setSentinelNode(node);
  }, []);

  // New stream re-engagement: when isStreaming transitions false -> true, reset to bottom.
  // This syncs Zustand store state (isStreaming) to local component state (isAtBottom),
  // which is a valid use of setState in effect per the React docs pattern for external
  // store synchronization. The guard ensures it only fires on the false->true edge.
  useEffect(() => {
    if (isStreaming && !prevIsStreamingRef.current) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing external store edge to local state
      setIsAtBottom(true);
       
      setUnreadCount(0);
    }
    prevIsStreamingRef.current = isStreaming;
  }, [isStreaming]);

  // IntersectionObserver: track sentinel visibility with 200px bottom threshold
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!sentinelNode || !container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.isIntersecting) {
          setIsAtBottom(true);
          // Reset unread when user scrolls to bottom naturally
          setUnreadCount(0);
        } else if (!isAutoScrollingRef.current) {
          // Only disengage if we're NOT driving the scroll ourselves
          setIsAtBottom(false);
        }
      },
      {
        root: container,
        threshold: 0,
        // Pill appears when sentinel is 200px+ below the viewport bottom
        rootMargin: '0px 0px -200px 0px',
      },
    );

    observer.observe(sentinelNode);
    return () => observer.disconnect();
  }, [sentinelNode, scrollContainerRef]);

  // User scroll detection: comprehensive coverage for all input methods.
  // - wheel/touchmove: immediate disengage for the most common gestures
  // - scroll event: catches scrollbar drag, keyboard (PgUp/Home/arrows), and any other source
  // The IntersectionObserver alone can't distinguish user scroll from content growth,
  // so we listen for explicit user gestures and scroll direction to break the auto-scroll lock.
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let lastScrollTop = container.scrollTop;

    // Scroll event catches ALL scroll sources. Detect upward scroll during auto-scroll
    // to handle scrollbar drag and keyboard scrolling that wheel/touchmove miss.
    const handleScroll = (): void => {
      const currentScrollTop = container.scrollTop;
      if (isAutoScrollingRef.current && currentScrollTop < lastScrollTop) {
        isAutoScrollingRef.current = false;
        setIsAtBottom(false);
      }
      lastScrollTop = currentScrollTop;
    };

    // Wheel/touchmove fire before scroll events — faster disengage for common gestures
    const handleUserGesture = (): void => {
      if (isAutoScrollingRef.current) {
        isAutoScrollingRef.current = false;
        setIsAtBottom(false);
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    container.addEventListener('wheel', handleUserGesture, { passive: true });
    container.addEventListener('touchmove', handleUserGesture, {
      passive: true,
    });

    return () => {
      container.removeEventListener('scroll', handleScroll);
      container.removeEventListener('wheel', handleUserGesture);
      container.removeEventListener('touchmove', handleUserGesture);
    };
  }, [scrollContainerRef]);

  // ResizeObserver: maintain bottom lock when dynamic content expands during streaming.
  // Observes the scroll container's first child (content wrapper) for size changes.
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !sentinelNode) return;

    const contentWrapper = container.firstElementChild;
    if (!contentWrapper) return;

    const observer = new ResizeObserver(() => {
      if (!isAutoScrollingRef.current) return;
      // rAF throttle -- skip if a frame is already pending
      if (resizeRafRef.current !== null) return;
      resizeRafRef.current = requestAnimationFrame(() => {
        resizeRafRef.current = null;
        sentinelNode.scrollIntoView({ block: 'end' });
      });
    });

    observer.observe(contentWrapper);
    return () => {
      observer.disconnect();
      if (resizeRafRef.current !== null) {
        cancelAnimationFrame(resizeRafRef.current);
        resizeRafRef.current = null;
      }
    };
  }, [scrollContainerRef, sentinelNode]);

  // Auto-scroll rAF loop: keeps sentinel in view during streaming
  useEffect(() => {
    if (!isStreaming || !isAtBottom) {
      isAutoScrollingRef.current = false;
      return;
    }

    isAutoScrollingRef.current = true;
    let rafId: number;

    const scroll = (): void => {
      sentinelNode?.scrollIntoView({ block: 'end' });
      rafId = requestAnimationFrame(scroll);
    };

    rafId = requestAnimationFrame(scroll);

    return () => {
      cancelAnimationFrame(rafId);
      isAutoScrollingRef.current = false;
    };
  }, [isStreaming, isAtBottom, sentinelNode]);

  // scrollToBottom: smooth scroll + re-engage + reset unread
  const scrollToBottom = useCallback(() => {
    sentinelNode?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    setIsAtBottom(true);
    setUnreadCount(0);
  }, [sentinelNode]);

  // resetUnread: manual reset (e.g., when pill is clicked)
  const resetUnread = useCallback(() => {
    setUnreadCount(0);
  }, []);

  // incrementUnread: called by MessageList when new messages arrive while scrolled up
  const incrementUnread = useCallback((delta: number) => {
    setUnreadCount((prev) => prev + delta);
  }, []);

  // saveScrollPosition: store current scrollTop for a session
  const saveScrollPosition = useCallback((sessionId: string) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    scrollPositionMapRef.current.set(sessionId, container.scrollTop);
  }, [scrollContainerRef]);

  // restoreScrollPosition: restore saved scrollTop for a session
  const restoreScrollPosition = useCallback((sessionId: string): boolean => {
    const container = scrollContainerRef.current;
    if (!container) return false;
    const saved = scrollPositionMapRef.current.get(sessionId);
    if (saved !== undefined) {
      container.scrollTop = saved;
      return true;
    }
    return false;
  }, [scrollContainerRef]);

  return {
    sentinelRef,
    isAtBottom,
    showPill: !isAtBottom,
    scrollToBottom,
    unreadCount,
    resetUnread,
    incrementUnread,
    saveScrollPosition,
    restoreScrollPosition,
  };
}
