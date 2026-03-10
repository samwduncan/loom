/**
 * useCommandPaletteShortcut -- Global Cmd+K / Ctrl+K keyboard shortcut handler.
 *
 * Opens/closes the command palette via UI store's toggleCommandPalette action.
 * Skips when focus is inside terminal or code editor to avoid stealing shortcuts.
 *
 * Constitution: Named export (2.2), selector-only store access (4.2).
 */

import { useEffect } from 'react';
import { useUIStore } from '@/stores/ui';

export function useCommandPaletteShortcut(): void {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey) || e.code !== 'KeyK') return;

      // Don't steal shortcuts from terminal or code editor
      const target = e.target as HTMLElement | null; // ASSERT: KeyboardEvent.target is EventTarget; narrowed for DOM closest() access
      if (
        target &&
        typeof target.closest === 'function' &&
        (target.closest('[data-terminal]') || target.closest('[data-codemirror]'))
      ) {
        return;
      }

      e.preventDefault();
      // eslint-disable-next-line loom/no-external-store-mutation -- event handler outside React render, getState is the correct pattern
      useUIStore.getState().toggleCommandPalette();
    }

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);
}
