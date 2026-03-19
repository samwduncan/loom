/**
 * EmptyState -- reusable empty state layout with icon, heading, and optional description/action.
 *
 * Renders a centered flex column for use in panels and lists
 * when there is no content to display.
 *
 * Constitution: Named export (2.2), cn() for classes (3.6), design tokens only (3.1).
 */

import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

export interface EmptyStateProps {
  icon: ReactNode;
  heading: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, heading, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2 px-4 py-8 text-center',
        className,
      )}
    >
      <div className="text-[var(--text-muted)]" aria-hidden="true">{icon}</div>
      <h3 className="text-sm font-medium text-[var(--text-secondary)]">{heading}</h3>
      {description && (
        <p className="mt-1 text-xs text-[var(--text-muted)]">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
