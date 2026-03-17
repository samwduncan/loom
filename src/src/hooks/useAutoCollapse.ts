/**
 * useAutoCollapse -- IntersectionObserver-based message collapse detection.
 *
 * Uses a SINGLE shared IntersectionObserver for all messages (instead of one
 * per message) to avoid accumulating observers as message count grows.
 * Maps observed elements back to messageIds via an Element->string map.
 *
 * Features:
 * - 300ms debounce on collapse to prevent flicker during fast scroll
 * - Immediate expand (no debounce) for responsive scroll-back
 * - Pin/unpin via toggleExpand to keep a message open regardless of IO
 * - Stable ref callbacks (cached per messageId) to prevent observer churn
 * - Protection check in MessageList (not here) -- only observable messages
 *   should be passed to observeRef
 * - Cleanup disconnects the single observer on unmount
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
  // Collapsed message IDs -- React state for proper batching and bailout
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(() => new Set());
  // Pinned messages: these stay expanded regardless of IO
  const pinnedRef = useRef(new Set<string>());
  // Single shared observer instance
  const observerRef = useRef<IntersectionObserver | null>(null);
  // Element -> messageId mapping for the shared observer callback
  const elementMapRef = useRef(new Map<Element, string>());
  // Element tracking per messageId for unobserve on null ref
  const messageElementRef = useRef(new Map<string, Element>());
  // Pending collapse timeouts: messageId -> timeout handle
  const timeoutsRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  // Stable ref callback cache: messageId -> callback (prevents observer churn)
  const refCallbacksRef = useRef(new Map<string, (el: HTMLElement | null) => void>());

  /**
   * Get or create the single shared IntersectionObserver.
   * Returns null if scroll container isn't mounted yet.
   */
  const getObserver = useCallback((): IntersectionObserver | null => {
    if (observerRef.current) return observerRef.current;

    const root = scrollContainerRef.current;
    if (!root) return null;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const messageId = elementMapRef.current.get(entry.target);
          if (!messageId) continue;

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
            if (pinnedRef.current.has(messageId)) continue; // pinned -- skip

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
        }
      },
      {
        root,
        rootMargin: '200px 0px 0px 0px',
      },
    );

    observerRef.current = observer;
    return observer;
  }, [scrollContainerRef]);

  const observeRef = useCallback(
    (messageId: string): ((el: HTMLElement | null) => void) => {
      // Return cached callback for stable identity across renders
      const cached = refCallbacksRef.current.get(messageId);
      if (cached) return cached;

      const callback = (el: HTMLElement | null) => {
        // Cleanup: unobserve previous element for this message
        const prevEl = messageElementRef.current.get(messageId);
        if (prevEl) {
          const obs = observerRef.current;
          if (obs) {
            obs.unobserve(prevEl);
          }
          elementMapRef.current.delete(prevEl);
          messageElementRef.current.delete(messageId);
        }

        if (!el) return;

        const observer = getObserver();
        if (!observer) return;

        // Register element -> messageId mapping and observe
        elementMapRef.current.set(el, messageId);
        messageElementRef.current.set(messageId, el);
        observer.observe(el);
      };

      refCallbacksRef.current.set(messageId, callback);
      return callback;
    },
    [getObserver],
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

  // Cleanup the single observer and all timeouts on unmount.
  // Capture ref values inside effect to satisfy react-hooks/exhaustive-deps.
  useEffect(() => {
    const observer = observerRef;
    const timeouts = timeoutsRef.current;
    const elementMap = elementMapRef.current;
    const messageElements = messageElementRef.current;
    return () => {
      if (observer.current) {
        observer.current.disconnect();
        observer.current = null;
      }
      elementMap.clear();
      messageElements.clear();
      for (const timeout of timeouts.values()) {
        clearTimeout(timeout);
      }
      timeouts.clear();
    };
  }, []);

  return { observeRef, isCollapsed, toggleExpand };
}
