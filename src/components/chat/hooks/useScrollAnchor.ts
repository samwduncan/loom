import { useCallback, useRef, useState } from 'react';

/**
 * useScrollAnchor -- scroll-event based scroll tracking.
 *
 * Listens to scroll events on the container and checks whether the user is
 * within 10px of the bottom. Replaces the previous IntersectionObserver +
 * sentinel approach for more predictable behavior during streaming.
 *
 * CSS note: the consuming component should apply `overflow-anchor: auto` on
 * the scroll container to preserve position when content is prepended above
 * the viewport.
 */
export function useScrollAnchor(
  scrollContainerRef: React.RefObject<HTMLDivElement>,
) {
  /** Locked threshold -- user is "at bottom" when within this many pixels. */
  const BOTTOM_THRESHOLD = 10;

  // --- State ---
  const [isAtBottom, setIsAtBottom] = useState(true);
  const isAtBottomRef = useRef(true);

  // True when the user has scrolled away from the bottom.
  // Auto-resets to false when the user scrolls back near the bottom (no pill
  // click required -- per user decision: auto re-engage).
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);

  // --- handleScroll ---
  // Attached to onScroll on the scroll container. Immediate -- no debounce.
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    const atBottom = distanceFromBottom <= BOTTOM_THRESHOLD;

    if (atBottom !== isAtBottomRef.current) {
      isAtBottomRef.current = atBottom;
      setIsAtBottom(atBottom);
    }

    if (atBottom) {
      // Auto re-engage: user scrolled back to bottom during streaming.
      setIsUserScrolledUp(false);
    } else {
      setIsUserScrolledUp(true);
    }
  }, [scrollContainerRef]);

  // --- scrollToBottom ---
  // Smooth scroll (~300ms animation) per user decision.
  const scrollToBottom = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: 'smooth',
    });

    // Optimistic update -- reset scrolled-up state immediately so the UI
    // can hide the scroll pill before the animation completes.
    setIsUserScrolledUp(false);
    isAtBottomRef.current = true;
    setIsAtBottom(true);
  }, [scrollContainerRef]);

  return {
    isAtBottom,
    isUserScrolledUp,
    handleScroll,
    scrollToBottom,
  };
}
