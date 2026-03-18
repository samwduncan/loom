/**
 * DateGroupHeader -- sticky date group label for session list.
 *
 * Renders uppercase text in --text-muted, position: sticky, with --surface-raised
 * background to prevent text bleed during scroll.
 *
 * Constitution: Named export (2.2), token-based styling (3.1), cn() for classes (3.6).
 */

import type { SessionDateGroup } from '@/types/session';
import { cn } from '@/utils/cn';

interface DateGroupHeaderProps {
  label: SessionDateGroup;
}

export function DateGroupHeader({ label }: DateGroupHeaderProps) {
  return (
    <div
      className={cn(
        'sticky top-0 z-[var(--z-sticky)]',
        'bg-surface-raised px-3 py-1.5',
        'text-[length:0.6875rem] font-medium uppercase tracking-wider',
        'text-muted select-none',
      )}
      role="presentation"
    >
      {label}
    </div>
  );
}
