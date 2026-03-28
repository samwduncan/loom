/**
 * useChatScroll -- IntersectionObserver sentinel + ResizeObserver auto-follow scroll hook.
 *
 * Replaces all inline scroll logic from MessageList.tsx. Eliminates the #1 scroll jank
 * source (setState in scroll handlers) and the #3 source (per-message-length auto-scroll).
 *
 * Architecture:
 * - IO sentinel for atBottom detection (ref-based, no setState in scroll path)
 * - ResizeObserver on content wrapper for streaming auto-follow (rAF-throttled scrollTop)
 * - Debounced React state (200ms) for pill visibility only
 * - User gesture detection (wheel/touchmove) for auto-scroll disengage
 * - Session switch reset, stream re-engagement, unread tracking
 * - Scroll position save/restore via sessionStorage
 * - iOS statusTap support (Capacitor window event)
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
import { IS_NATIVE } from '@/lib/platform';

const SCROLL_STORAGE_PREFIX = 'loom-scroll-';
const PILL_DEBOUNCE_MS = 200;

export interface UseChatScrollOptions {
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  sessionId: string;
  isStreaming: boolean;
  messageCount: number;
}

export interface UseChatScrollReturn {
  /** Ref callback for the bottom sentinel div */
  sentinelRef: (node: HTMLDivElement | null) => void;
  /** Whether to show the scroll-to-bottom pill (debounced) */
  showPill: boolean;
  /** Number of unread messages while scrolled up (debounced) */
  unreadCount: number;
  /** Smooth scroll to bottom + reset unread */
  scrollToBottom: () => void;
  /** Ref for the content wrapper (attach to inner div for ResizeObserver) */
  contentWrapperRef: RefObject<HTMLDivElement | null>;
  /** Whether user is at bottom (ref-based, for auto-scroll logic) */
  isAtBottomRef: RefObject<boolean>;
}

export function useChatScroll({
  scrollContainerRef,
  sessionId,
  isStreaming,
  messageCount,
}: UseChatScrollOptions): UseChatScrollReturn {
  // ─── Hot-path refs (no React re-renders) ────────────────────────────
  const isAtBottomRef = useRef(true);
  // Initialize to true when streaming is active on mount (avoids missing the false->true edge)
  const isAutoScrollingRef = useRef(isStreaming);
  const unreadCountRef = useRef(0);
  const rafPendingRef = useRef(false);

  // ─── Cold-path React state (debounced for pill visibility) ──────────
  const [showPill, setShowPill] = useState(false);
  const [displayUnreadCount, setDisplayUnreadCount] = useState(0);

  // ─── Debounced pill updater ─────────────────────────────────────────
  const pillTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const schedulePillUpdate = useCallback(() => {
    if (pillTimerRef.current) clearTimeout(pillTimerRef.current);
    pillTimerRef.current = setTimeout(() => {
      setShowPill(!isAtBottomRef.current);
      setDisplayUnreadCount(unreadCountRef.current);
    }, PILL_DEBOUNCE_MS);
  }, []);

  // ─── Sentinel callback ref ─────────────────────────────────────────
  const [sentinelNode, setSentinelNode] = useState<HTMLDivElement | null>(null);
  const sentinelRef = useCallback((node: HTMLDivElement | null) => {
    setSentinelNode(node);
  }, []);

  // ─── Content wrapper ref ────────────────────────────────────────────
  const contentWrapperRef = useRef<HTMLDivElement | null>(null);

  // ─── Scroll position save timer ─────────────────────────────────────
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Session switch reset (state-during-render pattern) ─────────────
  const prevSessionRef = useRef(sessionId);
  if (prevSessionRef.current !== sessionId) {
    prevSessionRef.current = sessionId;
    isAtBottomRef.current = true;
    isAutoScrollingRef.current = false;
    unreadCountRef.current = 0;
    schedulePillUpdate();
  }

  // ─── Unread tracking (state-during-render pattern) ──────────────────
  const prevMessageCountRef = useRef(messageCount);
  if (messageCount > prevMessageCountRef.current && !isAtBottomRef.current) {
    unreadCountRef.current += messageCount - prevMessageCountRef.current;
    schedulePillUpdate();
  }
  prevMessageCountRef.current = messageCount;

  // ─── Stream start re-engagement ─────────────────────────────────────
  const prevIsStreamingRef = useRef(isStreaming);
  if (isStreaming && !prevIsStreamingRef.current) {
    // Streaming just started -- re-engage auto-scroll
    isAtBottomRef.current = true;
    isAutoScrollingRef.current = true;
    unreadCountRef.current = 0;
    schedulePillUpdate();
  }
  prevIsStreamingRef.current = isStreaming;

  // ─── IntersectionObserver: sentinel-based atBottom detection ─────────
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!sentinelNode || !container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.isIntersecting) {
          isAtBottomRef.current = true;
          unreadCountRef.current = 0;
          schedulePillUpdate();
        } else if (!isAutoScrollingRef.current) {
          isAtBottomRef.current = false;
          schedulePillUpdate();
        }
      },
      {
        root: container,
        threshold: 0,
        rootMargin: '0px 0px -150px 0px',
      },
    );

    observer.observe(sentinelNode);
    return () => observer.disconnect();
  }, [sentinelNode, scrollContainerRef, schedulePillUpdate]);

  // ─── ResizeObserver: auto-follow during streaming ───────────────────
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const contentWrapper = contentWrapperRef.current ?? container.firstElementChild;
    if (!contentWrapper) return;

    const observer = new ResizeObserver(() => {
      if (!isAtBottomRef.current) return;
      if (rafPendingRef.current) return;

      rafPendingRef.current = true;
      requestAnimationFrame(() => {
        rafPendingRef.current = false;
        const el = scrollContainerRef.current;
        if (el) {
          el.scrollTop = el.scrollHeight - el.clientHeight;
        }
      });
    });

    observer.observe(contentWrapper);
    return () => {
      observer.disconnect();
      rafPendingRef.current = false;
    };
    // Re-setup on session change (new content wrapper)
  }, [scrollContainerRef, sessionId]);

  // ─── User gesture detection (wheel/touchmove/scroll) ───────────────
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let lastScrollTop = container.scrollTop;

    const handleUserGesture = (): void => {
      if (isAutoScrollingRef.current) {
        isAutoScrollingRef.current = false;
        isAtBottomRef.current = false;
        schedulePillUpdate();
      }
    };

    const handleScroll = (): void => {
      const currentScrollTop = container.scrollTop;
      // Detect upward scroll during auto-scroll (covers scrollbar drag, keyboard)
      if (isAutoScrollingRef.current && currentScrollTop < lastScrollTop) {
        isAutoScrollingRef.current = false;
        isAtBottomRef.current = false;
        schedulePillUpdate();
      }
      lastScrollTop = currentScrollTop;

      // Throttled save to sessionStorage
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        const el = scrollContainerRef.current;
        if (el) {
          sessionStorage.setItem(
            `${SCROLL_STORAGE_PREFIX}${sessionId}`,
            String(el.scrollTop),
          );
        }
      }, PILL_DEBOUNCE_MS);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    container.addEventListener('wheel', handleUserGesture, { passive: true });
    container.addEventListener('touchmove', handleUserGesture, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
      container.removeEventListener('wheel', handleUserGesture);
      container.removeEventListener('touchmove', handleUserGesture);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [scrollContainerRef, sessionId, schedulePillUpdate]);

  // ─── Scroll position restore on session switch ──────────────────────
  const restoredSessionRef = useRef<string | null>(null);
  useEffect(() => {
    if (restoredSessionRef.current === sessionId) return;
    restoredSessionRef.current = sessionId;

    const saved = sessionStorage.getItem(`${SCROLL_STORAGE_PREFIX}${sessionId}`);
    if (saved !== null) {
      requestAnimationFrame(() => {
        const el = scrollContainerRef.current;
        if (el) {
          el.scrollTop = Number(saved);
        }
      });
    }
  }, [sessionId, scrollContainerRef]);

  // ─── iOS statusTap ──────────────────────────────────────────────────
  useEffect(() => {
    if (!IS_NATIVE) return;

    const handleStatusTap = (): void => {
      const el = scrollContainerRef.current;
      if (el) {
        el.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    window.addEventListener('statusTap', handleStatusTap);
    return () => window.removeEventListener('statusTap', handleStatusTap);
  }, [scrollContainerRef]);

  // ─── scrollToBottom ─────────────────────────────────────────────────
  const scrollToBottom = useCallback(() => {
    const el = scrollContainerRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
    unreadCountRef.current = 0;
    isAtBottomRef.current = true;
    schedulePillUpdate();
  }, [scrollContainerRef, schedulePillUpdate]);

  // ─── Cleanup pill timer on unmount ──────────────────────────────────
  useEffect(() => {
    return () => {
      if (pillTimerRef.current) clearTimeout(pillTimerRef.current);
    };
  }, []);

  return {
    sentinelRef,
    showPill,
    unreadCount: displayUnreadCount,
    scrollToBottom,
    contentWrapperRef,
    isAtBottomRef,
  };
}
