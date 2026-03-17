/**
 * useFocusRestore -- saves active element on open, restores on close.
 *
 * For non-Radix overlays (Radix Dialog handles this internally).
 * Uses requestAnimationFrame for the restore to ensure the DOM
 * has settled after the overlay unmounts.
 *
 * Constitution: Named export (2.2), no default export.
 */

import { useRef, useEffect } from 'react';

/**
 * Captures `document.activeElement` when `isOpen` becomes true.
 * Restores focus to that element when `isOpen` becomes false.
 */
export function useFocusRestore(isOpen: boolean): void {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Capture the element that had focus before the overlay opened
      previousFocusRef.current = document.activeElement as HTMLElement | null;
    } else if (previousFocusRef.current) {
      // Restore focus after a frame so the DOM has settled
      const el = previousFocusRef.current;
      const rafId = requestAnimationFrame(() => {
        el.focus();
      });
      previousFocusRef.current = null;
      return () => cancelAnimationFrame(rafId);
    }
  }, [isOpen]);
}
