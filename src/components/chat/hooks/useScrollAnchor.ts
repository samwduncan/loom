import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * useScrollAnchor — IntersectionObserver-based scroll tracking.
 *
 * Replaces the legacy onScroll/isNearBottom pattern with a sentinel div
 * observed via IntersectionObserver. Zero scroll-event overhead for
 * determining whether the user is at the bottom of the message list.
 *
 * The sentinel div is placed at the very bottom of the message list by the
 * consuming component (e.g. ChatMessagesPane). The observer fires only when
 * the sentinel enters or leaves the viewport, rather than on every scroll tick.
 */
export function useScrollAnchor(
  scrollContainerRef: React.RefObject<HTMLDivElement>,
) {
  // --- Internal state for sentinel element ---
  // Using state (not just a ref) so the observer effect re-runs when the
  // sentinel DOM node is attached or swapped by the consuming component.
  const [sentinelNode, setSentinelNode] = useState<HTMLDivElement | null>(null);

  // --- State ---
  // Driven by IntersectionObserver — true when the sentinel div is visible.
  const [isAtBottom, setIsAtBottom] = useState(true);
  // Synchronous mirror of isAtBottom for use inside event handlers (onWheel,
  // onTouchMove) where React state may lag behind the observer callback.
  const isAtBottomRef = useRef(true);

  // True when the user has intentionally scrolled away from the bottom.
  // Resets to false when the sentinel becomes visible again (auto re-engage).
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);

  // --- IntersectionObserver setup ---
  // Re-runs whenever the sentinel node changes (set via callback ref).
  useEffect(() => {
    if (!sentinelNode) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;

        if (entry.isIntersecting) {
          setIsAtBottom(true);
          isAtBottomRef.current = true;
          // Auto re-engage: user scrolled back to bottom during streaming.
          setIsUserScrolledUp(false);
        } else {
          setIsAtBottom(false);
          isAtBottomRef.current = false;
        }
      },
      {
        // 100px tolerance — auto-scroll engages before the user reaches the
        // exact bottom pixel.
        threshold: 0,
        rootMargin: '100px',
      },
    );

    observer.observe(sentinelNode);

    return () => {
      observer.disconnect();
    };
  }, [sentinelNode]);

  // --- handleUserScroll ---
  // Attached to onWheel / onTouchMove on the scroll container.
  // No debounce — immediate pause per user decision.
  const handleUserScroll = useCallback(() => {
    if (!isAtBottomRef.current) {
      setIsUserScrolledUp(true);
    }
  }, []);

  // --- scrollToBottom ---
  // Smooth scroll (~300ms animation) per user decision.
  const scrollToBottom = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: 'smooth',
    });

    // Optimistic update — reset scrolled-up state immediately so the UI
    // can hide the scroll pill before the animation completes.
    setIsUserScrolledUp(false);
  }, [scrollContainerRef]);

  // --- sentinelCallbackRef ---
  // A ref callback so the consuming component can attach the sentinel div
  // without needing to forward a ref object. Sets sentinelNode state which
  // triggers the observer effect to re-run.
  const sentinelCallbackRef = useCallback((node: HTMLDivElement | null) => {
    setSentinelNode(node);
  }, []);

  return {
    sentinelRef: sentinelCallbackRef,
    isAtBottom,
    isUserScrolledUp,
    handleUserScroll,
    scrollToBottom,
  };
}
