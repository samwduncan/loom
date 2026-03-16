/**
 * MentionPicker -- positioned popup for @ file mentions in the composer.
 *
 * Renders a fuzzy-filtered file list above the composer textarea.
 * Supports keyboard navigation (selected via data-selected attribute)
 * and click selection.
 *
 * Constitution: Named exports (2.2), design tokens only (3.1), cn() (3.6).
 */

import { useCallback, useRef } from 'react';
import { cn } from '@/utils/cn';
import type { FileMention } from '@/types/mention';

interface MentionPickerProps {
  results: FileMention[];
  selectedIndex: number;
  isLoading: boolean;
  onSelect: (file: FileMention) => void;
}

/**
 * Extract directory path from a full file path.
 * e.g., "src/components/App.tsx" -> "src/components/"
 */
function getDirectory(path: string): string {
  const lastSlash = path.lastIndexOf('/');
  if (lastSlash === -1) return '';
  return path.slice(0, lastSlash + 1);
}

export function MentionPicker({ results, selectedIndex, isLoading, onSelect }: MentionPickerProps) {
  const listRef = useRef<HTMLDivElement>(null);

  // Scroll selected item into view (guard for jsdom which lacks scrollIntoView)
  const selectedRef = useCallback((node: HTMLDivElement | null) => {
    if (node && typeof node.scrollIntoView === 'function') {
      node.scrollIntoView({ block: 'nearest' });
    }
  }, []);

  // Empty states
  if (results.length === 0) {
    return (
      <div className="mention-picker" data-testid="mention-picker" role="listbox" id="mention-picker-list">
        <div className="px-3 py-4 text-center text-xs text-muted" role="option" aria-selected={false}>
          {isLoading ? 'Loading files...' : 'No files found'}
        </div>
      </div>
    );
  }

  return (
    <div className="mention-picker" data-testid="mention-picker" ref={listRef} role="listbox" id="mention-picker-list">
      {results.map((file, index) => {
        const isSelected = index === selectedIndex;
        const directory = getDirectory(file.path);

        return (
          <div
            key={file.path}
            ref={isSelected ? selectedRef : undefined}
            data-selected={isSelected ? 'true' : undefined}
            className={cn('mention-picker-item flex items-center gap-2')}
            onClick={() => onSelect(file)}
            role="option"
            aria-selected={isSelected}
          >
            <span className="text-sm font-medium text-foreground truncate">
              {file.name}
            </span>
            {directory && (
              <span className="text-xs text-muted truncate">
                {directory}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
