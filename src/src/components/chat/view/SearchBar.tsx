/**
 * SearchBar -- chat message search input with result count and close button.
 *
 * Slides in from right with opacity transition when mounted.
 * Escape key closes. Auto-focuses input on mount.
 * Respects prefers-reduced-motion (instant show/hide).
 *
 * Constitution: Named exports (2.2), design tokens only (7.14), no inline styles.
 */

import { useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  query: string;
  onQueryChange: (q: string) => void;
  onClose: () => void;
  resultCount: number;
}

export function SearchBar({ query, onQueryChange, onClose, resultCount }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Escape to close
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="flex items-center gap-2 border-b border-border bg-surface-1 px-3 py-2 motion-safe:animate-in motion-safe:slide-in-from-right-4 motion-safe:fade-in duration-200"
      data-testid="search-bar"
    >
      <Search className="size-4 shrink-0 text-muted" />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Search messages..."
        className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted outline-none"
        data-testid="search-input"
      />
      {query && (
        <span className="shrink-0 text-xs text-muted" data-testid="search-result-count">
          {resultCount} {resultCount === 1 ? 'match' : 'matches'}
        </span>
      )}
      <button
        type="button"
        onClick={onClose}
        className="shrink-0 rounded-sm p-0.5 text-muted transition-colors duration-150 hover:text-foreground"
        title="Close search"
        data-testid="search-close"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
