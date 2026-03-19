/**
 * ProjectHeader -- collapsible project group heading for sidebar session list.
 *
 * Renders a full-width button with expand/collapse chevron, truncated project
 * display name, and visible session count badge. Used by SessionList to group
 * sessions by project.
 *
 * Constitution: Named export (2.2), cn() for classes (3.6), token-based styling (3.1).
 */

import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface ProjectHeaderProps {
  displayName: string;
  sessionCount: number;
  isExpanded: boolean;
  onToggle: () => void;
  isCurrentProject?: boolean;
}

export function ProjectHeader({
  displayName,
  sessionCount,
  isExpanded,
  onToggle,
  isCurrentProject,
}: ProjectHeaderProps) {
  const ChevronIcon = isExpanded ? ChevronDown : ChevronRight;

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isExpanded}
      className={cn(
        'w-full flex items-center gap-2 px-3 py-2',
        'text-left font-medium text-foreground',
        'transition-[background-color] duration-[var(--duration-fast)]',
        'session-item-hover',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        isCurrentProject && 'border-l-2 border-l-[var(--accent-primary)]',
      )}
    >
      <ChevronIcon size={14} className="shrink-0 text-muted" />
      <span className="flex-1 truncate text-[length:var(--text-body)]">
        {displayName}
      </span>
      <span className="text-[length:0.75rem] text-muted tabular-nums">
        {sessionCount}
      </span>
    </button>
  );
}
