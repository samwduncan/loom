/**
 * BulkActionBar -- sticky bar showing selection count with delete and cancel actions.
 *
 * Rendered at the bottom of the session list when sessions are selected.
 *
 * Constitution: Named export (2.2), token-based styling (3.1), cn() for classes (3.6).
 */

import { Trash2, X } from 'lucide-react';
import { cn } from '@/utils/cn';

interface BulkActionBarProps {
  count: number;
  onDelete: () => void;
  onCancel: () => void;
}

export function BulkActionBar({ count, onDelete, onCancel }: BulkActionBarProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between',
        'px-3 py-2 border-t border-border bg-surface-raised',
        'text-[length:var(--text-body)]',
      )}
    >
      <span className="text-muted">
        {count} selected
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Delete ${count} selected session${count !== 1 ? 's' : ''}`}
          className={cn(
            'p-1.5 rounded-md text-[var(--status-error)]',
            'hover:bg-status-error/20',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            'transition-colors duration-[var(--duration-fast)]',
          )}
        >
          <Trash2 size={14} />
        </button>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Cancel selection"
          className={cn(
            'p-1.5 rounded-md text-muted hover:text-foreground hover:bg-surface-raised/50',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            'transition-colors duration-[var(--duration-fast)]',
          )}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
