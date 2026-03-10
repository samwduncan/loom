/**
 * useTabKeyboardShortcuts -- Global Cmd/Ctrl+1-4 keyboard shortcut handler for tab switching.
 *
 * Uses e.code (NOT e.key) for locale-independent key detection.
 * Skips when focus is inside terminal or code editor to avoid stealing shortcuts.
 *
 * Contract: Shell component MUST place data-terminal attribute on an ancestor
 * of xterm's keyboard input element.
 *
 * Constitution: Named export (2.2), selector-only store access (4.2).
 */

import { useEffect } from 'react';
import { useUIStore } from '@/stores/ui';
import type { TabId } from '@/types/ui';

const CODE_TO_TAB: Record<string, TabId> = {
  Digit1: 'chat',
  Digit2: 'files',
  Digit3: 'shell',
  Digit4: 'git',
};

export function useTabKeyboardShortcuts(): void {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (!e.metaKey && !e.ctrlKey) return;

      const tab = CODE_TO_TAB[e.code];
      if (!tab) return;

      // Don't steal shortcuts from terminal or code editor
      const target = e.target as HTMLElement | null;
      if (target && typeof target.closest === 'function' &&
          (target.closest('[data-terminal]') || target.closest('[data-codemirror]'))) {
        return;
      }

      e.preventDefault();
      // eslint-disable-next-line loom/no-external-store-mutation -- event handler outside React render, getState is the correct pattern
      useUIStore.getState().setActiveTab(tab);
    }

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);
}
