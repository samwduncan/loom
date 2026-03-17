/**
 * CollapsibleMessage -- wrapper that shows a compact summary or full content.
 *
 * When collapsed: renders a single-line button with role label, truncated
 * first line of content, and tool call count. Clicking expands.
 *
 * When expanded: renders children normally. Children are unmounted when
 * collapsed to avoid keeping full DOM trees (markdown renderers, tool cards)
 * in memory for off-screen messages.
 *
 * Constitution: Named exports (2.2), design tokens only (1.1).
 */

import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';

export interface CollapsibleMessageProps {
  role: string;
  content: string;
  toolCallCount: number;
  isCollapsed: boolean;
  onToggle: () => void;
  children: ReactNode;
}

/** Get display label for message role */
function roleLabel(role: string): string {
  switch (role) {
    case 'user':
      return 'You';
    case 'assistant':
      return 'Claude';
    case 'system':
      return 'System';
    case 'error':
      return 'Error';
    case 'task_notification':
      return 'Task';
    default:
      return role;
  }
}

/** Truncate to first line, max 80 chars */
function truncateContent(content: string): string {
  const firstLine = content.split('\n')[0] ?? '';
  if (firstLine.length <= 80) return firstLine;
  return firstLine.slice(0, 80) + '...';
}

export function CollapsibleMessage({
  role,
  content,
  toolCallCount,
  isCollapsed,
  onToggle,
  children,
}: CollapsibleMessageProps) {
  const label = roleLabel(role);
  const summary = truncateContent(content);

  if (isCollapsed) {
    return (
      <div data-testid="collapsible-wrapper">
        <button
          type="button"
          data-testid="collapsed-summary"
          className="flex w-full items-center gap-2 rounded px-2 py-1 text-xs text-muted transition-colors hover:bg-surface-raised"
          aria-label={`Expand collapsed message from ${label}`}
          onClick={onToggle}
        >
          <ChevronRight className="h-3 w-3 shrink-0" />
          <span className="font-medium shrink-0">{label}</span>
          <span className="truncate opacity-70">{summary}</span>
          {toolCallCount > 0 && (
            <span className="ml-auto shrink-0 rounded bg-surface-raised px-1.5 py-0.5 text-[10px] font-medium">
              {toolCallCount} {toolCallCount === 1 ? 'tool' : 'tools'}
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div data-testid="collapsible-wrapper">
      {children}
    </div>
  );
}
