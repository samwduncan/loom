/**
 * useScrollAnchor -- IntersectionObserver-based scroll anchoring for chat streaming.
 *
 * Pins scroll to bottom during streaming via rAF loop, disengages on user scroll,
 * re-engages on pill click or new stream start. Anti-oscillation guard prevents
 * pill flashing during programmatic auto-scroll.
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
}

export function useScrollAnchor(
  scrollContainerRef: RefObject<HTMLElement | null>,
): UseScrollAnchorReturn {
  const [sentinelNode, setSentinelNode] = useState<HTMLDivElement | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const isAutoScrollingRef = useRef(false);
  const prevIsStreamingRef = useRef(false);

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
    }
    prevIsStreamingRef.current = isStreaming;
  }, [isStreaming]);

  // IntersectionObserver: track sentinel visibility
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!sentinelNode || !container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.isIntersecting) {
          setIsAtBottom(true);
        } else if (!isAutoScrollingRef.current) {
          // Only disengage if we're NOT driving the scroll ourselves
          setIsAtBottom(false);
        }
      },
      { root: container, threshold: 0 },
    );

    observer.observe(sentinelNode);
    return () => observer.disconnect();
  }, [sentinelNode, scrollContainerRef]);

  // User scroll detection: wheel/touchmove on scroll container disengages auto-scroll.
  // The IntersectionObserver alone can't distinguish user scroll from content growth,
  // so we listen for explicit user gestures to break the auto-scroll lock.
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleUserScroll = (): void => {
      if (isAutoScrollingRef.current) {
        isAutoScrollingRef.current = false;
        setIsAtBottom(false);
      }
    };

    container.addEventListener('wheel', handleUserScroll, { passive: true });
    container.addEventListener('touchmove', handleUserScroll, {
      passive: true,
    });

    return () => {
      container.removeEventListener('wheel', handleUserScroll);
      container.removeEventListener('touchmove', handleUserScroll);
    };
  }, [scrollContainerRef]);

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

  // scrollToBottom: smooth scroll + re-engage
  const scrollToBottom = useCallback(() => {
    sentinelNode?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    setIsAtBottom(true);
  }, [sentinelNode]);

  return {
    sentinelRef,
    isAtBottom,
    showPill: !isAtBottom && isStreaming,
    scrollToBottom,
  };
}
