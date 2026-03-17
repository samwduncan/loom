/**
 * CollapsibleMessage -- wrapper that shows a compact summary or full content.
 *
 * When collapsed: renders a single-line button with role label, truncated
 * first line of content, and tool call count. Clicking expands.
 *
 * When expanded: renders children normally with a CSS grid transition
 * (grid-template-rows: 0fr/1fr) matching the ThinkingDisclosure pattern.
 *
 * Constitution: Named exports (2.2), design tokens only (1.1).
 */

import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Message } from '@/types/message';

export interface CollapsibleMessageProps {
  message: Message;
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
  message,
  isCollapsed,
  onToggle,
  children,
}: CollapsibleMessageProps) {
  const toolCount = message.toolCalls?.length ?? 0;
  const label = roleLabel(message.role);
  const summary = truncateContent(message.content);

  return (
    <div data-testid="collapsible-wrapper">
      {/* Collapsed summary button */}
      {isCollapsed && (
        <button
          type="button"
          data-testid="collapsed-summary"
          className="flex w-full items-center gap-2 rounded px-2 py-1 text-xs text-muted transition-colors hover:bg-surface-hover"
          onClick={onToggle}
        >
          <ChevronRight className="h-3 w-3 shrink-0" />
          <span className="font-medium shrink-0">{label}</span>
          <span className="truncate opacity-70">{summary}</span>
          {toolCount > 0 && (
            <span className="ml-auto shrink-0 rounded bg-surface-raised px-1.5 py-0.5 text-[10px] font-medium">
              {toolCount} {toolCount === 1 ? 'tool' : 'tools'}
            </span>
          )}
        </button>
      )}

      {/* Full content with CSS grid transition */}
      <div
        className="grid transition-[grid-template-rows] duration-200 ease-out"
        style={{ gridTemplateRows: isCollapsed ? '0fr' : '1fr' }}
      >
        <div className="overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
