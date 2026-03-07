/**
 * useAutoResize -- auto-resize textarea to fit content up to a max height.
 *
 * Uses useLayoutEffect (synchronous after DOM mutations) to measure
 * scrollHeight and set height before the browser paints. When content
 * exceeds maxHeight, switches to internal scrolling via overflow-y: auto.
 *
 * Constitution: Named exports only (2.2), no default export.
 */

import { useLayoutEffect, type RefObject } from 'react';

/**
 * Auto-resize a textarea element based on its content.
 *
 * @param ref - Ref to the textarea element
 * @param value - Current textarea value (triggers resize on change)
 * @param maxHeight - Maximum height in pixels before internal scroll (default: 200)
 */
export function useAutoResize(
  ref: RefObject<HTMLTextAreaElement | null>,
  value: string,
  maxHeight = 200,
): void {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Reset height to measure natural scrollHeight
    el.style.height = '0px';
    const scrollHeight = el.scrollHeight;

    // Clamp to maxHeight
    const height = Math.min(scrollHeight, maxHeight);
    el.style.height = `${height}px`;

    // Toggle internal scrolling
    el.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, [ref, value, maxHeight]);
}
