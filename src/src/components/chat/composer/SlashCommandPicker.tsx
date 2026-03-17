/**
 * SlashCommandPicker -- positioned popup for / slash commands in the composer.
 *
 * Renders a command list above the composer textarea.
 * Supports keyboard navigation (selected via data-selected attribute)
 * and click selection.
 *
 * Constitution: Named exports (2.2), design tokens only (3.1), cn() (3.6).
 */

import { useCallback } from 'react';
import type { SlashCommand } from '@/types/slash-command';

interface SlashCommandPickerProps {
  results: SlashCommand[];
  selectedIndex: number;
  onSelect: (cmd: SlashCommand) => void;
}

export function SlashCommandPicker({ results, selectedIndex, onSelect }: SlashCommandPickerProps) {
  // Scroll selected item into view (guard for jsdom which lacks scrollIntoView)
  const selectedRef = useCallback((node: HTMLDivElement | null) => {
    if (node && typeof node.scrollIntoView === 'function') {
      node.scrollIntoView({ block: 'nearest' });
    }
  }, []);

  // Empty state
  if (results.length === 0) {
    return (
      <div className="slash-picker" data-testid="slash-picker" role="listbox" id="slash-picker-list">
        <div className="px-3 py-4 text-center text-xs text-muted" role="option" aria-selected={false}>
          No commands found
        </div>
      </div>
    );
  }

  return (
    <div className="slash-picker" data-testid="slash-picker" role="listbox" id="slash-picker-list">
      {results.map((cmd, index) => {
        const isSelected = index === selectedIndex;

        return (
          <div
            key={cmd.id}
            ref={isSelected ? selectedRef : undefined}
            data-selected={isSelected ? 'true' : undefined}
            className="slash-picker-item"
            onClick={() => onSelect(cmd)}
            role="option"
            aria-selected={isSelected}
          >
            <span className="text-sm font-semibold text-foreground">
              {cmd.label}
            </span>
            <span className="ml-2 text-xs text-muted">
              {cmd.description}
            </span>
          </div>
        );
      })}
    </div>
  );
}
