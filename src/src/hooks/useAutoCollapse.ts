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
 * - Cleanup disconnects all observers on unmount
 *
 * Constitution: Named exports (2.2), no whole-store subscriptions (4.2).
 */

import { useRef, useState, useEffect, useCallback, type RefObject } from 'react';

const COLLAPSE_DEBOUNCE_MS = 300;

interface AutoCollapseReturn {
  /** Ref callback factory: attach to each message's wrapper div */
  observeRef: (messageId: string, messageIndex: number) => (el: HTMLElement | null) => void;
  /** Check if a message is currently collapsed */
  isCollapsed: (messageId: string) => boolean;
  /** Toggle pin state: pinned messages stay expanded regardless of IO */
  toggleExpand: (messageId: string) => void;
}

export function useAutoCollapse(
  scrollContainerRef: RefObject<HTMLElement | null>,
  messageCount: number,
  collapseThreshold: number = 10,
): AutoCollapseReturn {
  // Revision counter to trigger re-renders when collapse map changes
  const [, setRevision] = useState(0);
  const bump = useCallback(() => setRevision((r) => r + 1), []);

  // Collapse state: messageId -> collapsed boolean
  const collapseMapRef = useRef(new Map<string, boolean>());
  // Pinned messages: these stay expanded regardless of IO
  const pinnedRef = useRef(new Set<string>());
  // Observer instances: messageId -> IntersectionObserver
  const observersRef = useRef(new Map<string, IntersectionObserver>());
  // Pending collapse timeouts: messageId -> timeout handle
  const timeoutsRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  // Snapshot messageCount and threshold into refs for IO callback closure.
  // Updated via useEffect (not render) to satisfy react-hooks/refs rule.
  const messageCountRef = useRef(messageCount);
  const thresholdRef = useRef(collapseThreshold);
  useEffect(() => {
    messageCountRef.current = messageCount;
    thresholdRef.current = collapseThreshold;
  }, [messageCount, collapseThreshold]);

  const observeRef = useCallback(
    (messageId: string, messageIndex: number) => {
      return (el: HTMLElement | null) => {
        // Cleanup existing observer for this message
        const existingObserver = observersRef.current.get(messageId);
        if (existingObserver) {
          existingObserver.disconnect();
          observersRef.current.delete(messageId);
        }

        if (!el) return;

        // Don't observe messages within the collapse threshold (recent protection)
        if (messageIndex >= messageCountRef.current - thresholdRef.current) {
          return;
        }

        const observer = new IntersectionObserver(
          ([entry]) => {
            if (!entry) return;

            if (entry.isIntersecting) {
              // Expand immediately: cancel any pending collapse and mark expanded
              const pendingTimeout = timeoutsRef.current.get(messageId);
              if (pendingTimeout != null) {
                clearTimeout(pendingTimeout);
                timeoutsRef.current.delete(messageId);
              }
              collapseMapRef.current.set(messageId, false);
              bump();
            } else {
              // Collapse with debounce: schedule collapse after delay
              if (pinnedRef.current.has(messageId)) return; // pinned -- skip

              const timeout = setTimeout(() => {
                timeoutsRef.current.delete(messageId);
                collapseMapRef.current.set(messageId, true);
                bump();
              }, COLLAPSE_DEBOUNCE_MS);
              timeoutsRef.current.set(messageId, timeout);
            }
          },
          {
            root: scrollContainerRef.current,
            rootMargin: '200px 0px 0px 0px',
          },
        );

        observer.observe(el);
        observersRef.current.set(messageId, observer);
      };
    },
    [scrollContainerRef, bump],
  );

  const isCollapsed = useCallback(
    (messageId: string): boolean => {
      return collapseMapRef.current.get(messageId) === true;
    },
     
    [],
  );

  const toggleExpand = useCallback(
    (messageId: string) => {
      if (pinnedRef.current.has(messageId)) {
        // Unpin: allow future IO-driven collapse
        pinnedRef.current.delete(messageId);
      } else {
        // Pin: force expand and prevent IO collapse
        pinnedRef.current.add(messageId);
        collapseMapRef.current.set(messageId, false);
        // Cancel any pending collapse timeout
        const pendingTimeout = timeoutsRef.current.get(messageId);
        if (pendingTimeout != null) {
          clearTimeout(pendingTimeout);
          timeoutsRef.current.delete(messageId);
        }
      }
      bump();
    },
    [bump],
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
