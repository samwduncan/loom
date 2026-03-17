/**
 * useAutoCollapse -- IntersectionObserver-based message collapse detection.
 *
 * Creates per-message IntersectionObservers that detect when messages scroll
 * out of the viewport. Messages far from the bottom (beyond collapseThreshold)
 * collapse to a compact summary line. Scrolling back auto-expands them.
 *
 * Features:
 * - 300ms debounce on collapse to prevent flicker during fast scroll
 * - Immediate expand (no debounce) for responsive scroll-back
 * - Pin/unpin via toggleExpand to keep a message open regardless of IO
 * - Stable ref callbacks (cached per messageId) to prevent observer churn
 * - Protection check in MessageList (not here) — only observable messages
 *   should be passed to observeRef
 * - Cleanup disconnects all observers on unmount
 *
 * Constitution: Named exports (2.2), no whole-store subscriptions (4.2).
 */

import { useRef, useState, useEffect, useCallback, type RefObject } from 'react';

const COLLAPSE_DEBOUNCE_MS = 300;

interface AutoCollapseReturn {
  /** Get a stable ref callback for a message. Only call for observable messages (not protected). */
  observeRef: (messageId: string) => (el: HTMLElement | null) => void;
  /** Check if a message is currently collapsed */
  isCollapsed: (messageId: string) => boolean;
  /** Toggle pin state: first click pins (expands), second click unpins (collapses) */
  toggleExpand: (messageId: string) => void;
}

export function useAutoCollapse(
  scrollContainerRef: RefObject<HTMLElement | null>,
): AutoCollapseReturn {
  // Collapsed message IDs — React state for proper batching and bailout
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(() => new Set());
  // Pinned messages: these stay expanded regardless of IO
  const pinnedRef = useRef(new Set<string>());
  // Observer instances: messageId -> IntersectionObserver
  const observersRef = useRef(new Map<string, IntersectionObserver>());
  // Pending collapse timeouts: messageId -> timeout handle
  const timeoutsRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  // Stable ref callback cache: messageId -> callback (prevents observer churn)
  const refCallbacksRef = useRef(new Map<string, (el: HTMLElement | null) => void>());

  const observeRef = useCallback(
    (messageId: string): ((el: HTMLElement | null) => void) => {
      // Return cached callback for stable identity across renders
      const cached = refCallbacksRef.current.get(messageId);
      if (cached) return cached;

      const callback = (el: HTMLElement | null) => {
        // Cleanup existing observer for this message
        const existingObserver = observersRef.current.get(messageId);
        if (existingObserver) {
          existingObserver.disconnect();
          observersRef.current.delete(messageId);
        }

        if (!el) return;

        // Guard: don't create observer if scroll container isn't mounted yet
        const root = scrollContainerRef.current;
        if (!root) return;

        const observer = new IntersectionObserver(
          ([entry]) => {
            if (!entry) return;

            if (entry.isIntersecting) {
              // Expand immediately: cancel any pending collapse
              const pendingTimeout = timeoutsRef.current.get(messageId);
              if (pendingTimeout != null) {
                clearTimeout(pendingTimeout);
                timeoutsRef.current.delete(messageId);
              }
              setCollapsedIds((prev) => {
                if (!prev.has(messageId)) return prev; // bailout: no change
                const next = new Set(prev);
                next.delete(messageId);
                return next;
              });
            } else {
              // Collapse with debounce: schedule collapse after delay
              if (pinnedRef.current.has(messageId)) return; // pinned — skip

              const timeout = setTimeout(() => {
                timeoutsRef.current.delete(messageId);
                setCollapsedIds((prev) => {
                  if (prev.has(messageId)) return prev; // bailout: already collapsed
                  const next = new Set(prev);
                  next.add(messageId);
                  return next;
                });
              }, COLLAPSE_DEBOUNCE_MS);
              timeoutsRef.current.set(messageId, timeout);
            }
          },
          {
            root,
            rootMargin: '200px 0px 0px 0px',
          },
        );

        observer.observe(el);
        observersRef.current.set(messageId, observer);
      };

      refCallbacksRef.current.set(messageId, callback);
      return callback;
    },
    [scrollContainerRef],
  );

  const isCollapsed = useCallback(
    (messageId: string): boolean => collapsedIds.has(messageId),
    [collapsedIds],
  );

  const toggleExpand = useCallback(
    (messageId: string) => {
      if (pinnedRef.current.has(messageId)) {
        // Unpin: immediately collapse (user expects second click = close)
        pinnedRef.current.delete(messageId);
        setCollapsedIds((prev) => {
          if (prev.has(messageId)) return prev;
          const next = new Set(prev);
          next.add(messageId);
          return next;
        });
      } else {
        // Pin: force expand and prevent IO collapse
        pinnedRef.current.add(messageId);
        // Cancel any pending collapse timeout
        const pendingTimeout = timeoutsRef.current.get(messageId);
        if (pendingTimeout != null) {
          clearTimeout(pendingTimeout);
          timeoutsRef.current.delete(messageId);
        }
        setCollapsedIds((prev) => {
          if (!prev.has(messageId)) return prev;
          const next = new Set(prev);
          next.delete(messageId);
          return next;
        });
      }
    },
    [],
  );

  // Cleanup all observers and timeouts on unmount.
  // Capture ref values inside effect to satisfy react-hooks/exhaustive-deps.
  useEffect(() => {
    const observers = observersRef.current;
    const timeouts = timeoutsRef.current;
    return () => {
      for (const observer of observers.values()) {
        observer.disconnect();
      }
      observers.clear();
      for (const timeout of timeouts.values()) {
        clearTimeout(timeout);
      }
      timeouts.clear();
    };
  }, []);

  return { observeRef, isCollapsed, toggleExpand };
}
