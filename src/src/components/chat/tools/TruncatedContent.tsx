/**
 * TruncatedContent -- shared truncation wrapper with "Show N more" / "Show less" toggle.
 *
 * Reused by all per-tool cards for consistent truncation UX.
 * Renders items via renderItem callback, slicing at threshold when collapsed.
 *
 * Constitution: Named exports only (2.2), cn() for classNames (3.6), memo() wrapped.
 */

import { memo, useState } from 'react';
import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

export interface TruncatedContentProps {
  items: string[];
  threshold: number;
  /** Label for expand button, e.g. "lines", "files" */
  unit: string;
  renderItem: (item: string, index: number) => ReactNode;
}

export const TruncatedContent = memo(function TruncatedContent({
  items,
  threshold,
  unit,
  renderItem,
}: TruncatedContentProps) {
  const [expanded, setExpanded] = useState(false);
  const remaining = items.length - threshold;
  const visible = expanded ? items : items.slice(0, threshold);

  return (
    <div>
      {visible.map((item, i) => renderItem(item, i))}
      {remaining > 0 && !expanded && (
        <button
          type="button"
          className={cn(
            'text-xs py-1 cursor-pointer',
            'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
          )}
          onClick={() => setExpanded(true)}
        >
          Show {remaining} more {unit}
        </button>
      )}
      {expanded && remaining > 0 && (
        <button
          type="button"
          className={cn(
            'text-xs py-1 cursor-pointer',
            'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
          )}
          onClick={() => setExpanded(false)}
        >
          Show less
        </button>
      )}
    </div>
  );
});
