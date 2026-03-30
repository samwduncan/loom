/**
 * useLongPress -- custom long-press detection for iOS WKWebView.
 *
 * iOS does NOT fire the `contextmenu` event on long-press, so Radix ContextMenu
 * is broken on iOS. This hook provides touch-based long-press detection as a
 * replacement on mobile.
 *
 * Returns touch event handlers (onTouchStart, onTouchMove, onTouchEnd) on mobile.
 * Returns empty object on desktop (Radix ContextMenu handles right-click).
 *
 * CRITICAL: Does NOT call e.preventDefault() in touchstart. Doing so would suppress
 * ALL default touch behavior including vertical scrolling. Since useLongPress wraps
 * every session item and message bubble, this would make session list and message list
 * unscrollable on iOS. Instead, iOS text selection/callout is suppressed via CSS
 * `-webkit-user-select: none; -webkit-touch-callout: none` on elements with the
 * [data-long-press-target] attribute. For messages (no data-long-press-target),
 * temporary text selection during the 500ms timer is accepted and cancelled by
 * the touchmove threshold.
 *
 * Features:
 * - Configurable delay (default 500ms)
 * - Movement cancellation with configurable threshold (default 10px)
 * - Cancel callback for UI cleanup
 * - Uses useRef for onLongPress callback to avoid stale closure in setTimeout
 *
 * Constitution: Named export (2.2), no default export.
 */

import { useRef, useCallback, useEffect } from 'react';
import { useMobile } from '@/hooks/useMobile';

export interface UseLongPressOptions {
  /** Callback fired after the delay expires without cancellation */
  onLongPress: () => void;
  /** Callback fired if the gesture is cancelled (finger moved or lifted early) */
  onCancel?: () => void;
  /** Hold duration in ms before onLongPress fires (default: 500) */
  delay?: number;
  /** Max finger movement in px before cancellation (default: 10) */
  moveThreshold?: number;
}

export interface UseLongPressHandlers {
  onTouchStart?: (e: React.TouchEvent) => void;
  onTouchMove?: (e: React.TouchEvent) => void;
  onTouchEnd?: () => void;
}

export function useLongPress({
  onLongPress,
  onCancel,
  delay = 500,
  moveThreshold = 10,
}: UseLongPressOptions): UseLongPressHandlers {
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const startPos = useRef({ x: 0, y: 0 });
  const isMobile = useMobile();
  // Use ref for onLongPress to avoid stale closure in setTimeout callback.
  // Without this, if the parent re-renders with a new onLongPress callback
  // between touchstart and timer expiry, the old callback fires.
  const onLongPressRef = useRef(onLongPress);
  useEffect(() => {
    onLongPressRef.current = onLongPress;
  }, [onLongPress]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    startPos.current = { x: touch.clientX, y: touch.clientY };

    // DELIBERATELY no e.preventDefault() here.
    // Calling preventDefault in touchstart suppresses ALL default touch behavior
    // including vertical scrolling. Since useLongPress wraps every session item
    // and message bubble, this would make both lists unscrollable on iOS.
    // Text selection suppression is handled via CSS [data-long-press-target].

    timerRef.current = setTimeout(() => {
      timerRef.current = undefined;
      onLongPressRef.current();
    }, delay);
  }, [delay]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch || timerRef.current === undefined) return;
    const dx = Math.abs(touch.clientX - startPos.current.x);
    const dy = Math.abs(touch.clientY - startPos.current.y);
    if (dx > moveThreshold || dy > moveThreshold) {
      clearTimeout(timerRef.current);
      timerRef.current = undefined;
      onCancel?.();
    }
  }, [moveThreshold, onCancel]);

  const handleTouchEnd = useCallback(() => {
    if (timerRef.current !== undefined) {
      clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }
  }, []);

  // Desktop: return empty object -- Radix ContextMenu handles right-click
  if (!isMobile) return {};

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };
}
