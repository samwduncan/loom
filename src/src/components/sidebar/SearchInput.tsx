/**
 * SearchInput -- controlled search input for session filtering.
 *
 * Layout: Search icon (left), text input, conditional X clear button (right).
 * Uses design tokens only. Lucide icons at size 14 for sidebar consistency.
 *
 * Constitution: Named export (2.2), token-based styling (3.1), cn() for classes (3.6).
 */

import { useCallback, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/utils/cn';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchInput({ value, onChange }: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClear = useCallback(() => {
    onChange('');
    inputRef.current?.focus();
  }, [onChange]);

  return (
    <div className={cn('relative flex items-center')}>
      <Search
        size={14}
        className="absolute left-2 text-muted pointer-events-none"
        aria-hidden="true"
      />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search sessions..."
        aria-label="Search sessions"
        className={cn(
          'w-full bg-surface-base border border-border rounded-md',
          'pl-7 pr-7 py-1.5 text-sm',
          'text-foreground placeholder:text-muted',
          'outline-none focus:ring-1 focus:ring-primary',
          'transition-colors duration-150',
        )}
      />
      {value.length > 0 && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className={cn(
            'absolute right-2 text-muted hover:text-foreground',
            'transition-colors duration-150',
          )}
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
