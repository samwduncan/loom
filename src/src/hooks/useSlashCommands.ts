/**
 * useSlashCommands -- hook managing / slash command trigger detection, filtering, and picker state.
 *
 * Detects / at position 0, filters the static command list, manages keyboard navigation.
 *
 * Constitution: Named exports (2.2), selector-only store access (4.2).
 */

import { useState } from 'react';
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

function filterCommands(query: string): SlashCommand[] {
  if (!query) return SLASH_COMMANDS;
  return SLASH_COMMANDS.filter((cmd) => cmd.id.includes(query.toLowerCase()));
}

export function useSlashCommands(): {
  isOpen: boolean;
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

  const results = isOpen ? filterCommands(query) : [];

  function detectAndOpen(text: string, cursorPos: number) {
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
  }

  function close() {
    setIsOpen(false);
    setQuery('');
    setSelectedIndex(0);
  }

  function moveDown() {
    setSelectedIndex((prev) => {
      if (results.length === 0) return 0;
      return (prev + 1) % results.length;
    });
  }

  function moveUp() {
    setSelectedIndex((prev) => {
      if (results.length === 0) return 0;
      return (prev - 1 + results.length) % results.length;
    });
  }

  function selectCurrent(): SlashCommand | null {
    if (results.length === 0) return null;
    const idx = Math.min(selectedIndex, results.length - 1);
    return results[idx] ?? null;
  }

  return {
    isOpen,
    results,
    selectedIndex,
    detectAndOpen,
    close,
    moveUp,
    moveDown,
    selectCurrent,
  };
}
