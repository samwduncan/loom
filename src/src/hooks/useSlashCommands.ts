/**
 * useSlashCommands -- hook managing / slash command trigger detection, filtering, and picker state.
 *
 * Mirrors the useFileMentions pattern: detectSlashQuery detects / at position 0,
 * hook manages open/close, query filtering, keyboard navigation, and selection.
 *
 * Constitution: Named exports (2.2), selector-only store access (4.2).
 */

import { useState, useMemo, useCallback } from 'react';
import { SLASH_COMMANDS } from '@/lib/slash-commands';
import type { SlashCommand } from '@/types/slash-command';

/**
 * Detect a slash command query by checking if / is at position 0.
 *
 * Returns the query string after / (e.g., "cl" for "/cl|"),
 * or null if / is not at position 0 or text contains whitespace after /.
 */
export function detectSlashQuery(text: string, cursorPos: number): string | null {
  if (text.length === 0 || cursorPos === 0) return null;

  // / must be at position 0
  if (text.charAt(0) !== '/') return null;

  // Extract text between / and cursor
  const query = text.slice(1, cursorPos);

  // Reject if query contains whitespace (user moved past the command)
  if (/\s/.test(query)) return null;

  return query;
}

export function useSlashCommands(): {
  isOpen: boolean;
  query: string;
  results: SlashCommand[];
  selectedIndex: number;
  detectAndOpen: (text: string, cursorPos: number) => void;
  close: () => void;
  moveUp: () => void;
  moveDown: () => void;
  selectCurrent: () => SlashCommand | null;
} {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Filter commands by query (simple includes match -- only 4 items, no fuse needed)
  const results = useMemo(() => {
    if (!isOpen) return [];
    if (!query) return SLASH_COMMANDS;
    return SLASH_COMMANDS.filter((cmd) => cmd.id.includes(query.toLowerCase()));
  }, [isOpen, query]);

  const detectAndOpen = useCallback(
    (text: string, cursorPos: number) => {
      const detected = detectSlashQuery(text, cursorPos);
      if (detected !== null) {
        setIsOpen(true);
        setQuery(detected);
        setSelectedIndex(0);
      } else {
        setIsOpen(false);
        setQuery('');
        setSelectedIndex(0);
      }
    },
    [],
  );

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setSelectedIndex(0);
  }, []);

  const moveDown = useCallback(() => {
    setSelectedIndex((prev) => {
      const len = results.length;
      if (len === 0) return 0;
      return (prev + 1) % len;
    });
  }, [results.length]);

  const moveUp = useCallback(() => {
    setSelectedIndex((prev) => {
      const len = results.length;
      if (len === 0) return 0;
      return (prev - 1 + len) % len;
    });
  }, [results.length]);

  const selectCurrent = useCallback((): SlashCommand | null => {
    if (results.length === 0) return null;
    const idx = Math.min(selectedIndex, results.length - 1);
    return results[idx] ?? null;
  }, [results, selectedIndex]);

  return {
    isOpen,
    query,
    results,
    selectedIndex,
    detectAndOpen,
    close,
    moveUp,
    moveDown,
    selectCurrent,
  };
}
