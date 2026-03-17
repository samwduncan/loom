/**
 * useQuickSettingsShortcut -- Global Cmd+, / Ctrl+, keyboard shortcut handler.
 *
 * Toggles the quick settings popover via a callback parameter.
 * Skips when focus is inside terminal or code editor to avoid stealing shortcuts.
 *
 * Constitution: Named export (2.2).
 */

import { useEffect } from 'react';

export function useQuickSettingsShortcut(onToggle: () => void): void {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey) || e.code !== 'Comma') return;

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
      onToggle();
    }

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onToggle]);
}
