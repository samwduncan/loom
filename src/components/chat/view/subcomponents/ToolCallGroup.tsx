import React, { memo, useState, useMemo, useCallback } from 'react';
import { ChevronRight, ChevronsUpDown } from 'lucide-react';
import { ToolActionCard } from './ToolActionCard';
import type { ChatMessage, ToolResult } from '../../types/types';
import type { Project } from '../../../../types/app';

type DiffLine = {
  type: string;
  content: string;
  lineNum: number;
};

interface ToolCallGroupProps {
  messages: ChatMessage[];
  messageProps: {
    onFileOpen?: (filePath: string, diffInfo?: unknown) => void;
    createDiff?: (oldStr: string, newStr: string) => DiffLine[];
    selectedProject?: Project | null;
    showRawParameters?: boolean;
  };
}

/**
 * Build a summary string from a group of tool messages.
 * e.g. "3 tool calls: 2 Read, 1 Edit"
 */
function buildGroupSummary(messages: ChatMessage[]): string {
  const counts = new Map<string, number>();
  let errorCount = 0;

  for (const msg of messages) {
    const name = msg.toolName || 'Unknown';
    counts.set(name, (counts.get(name) || 0) + 1);
    if (msg.toolResult?.isError) {
      errorCount++;
    }
  }

  const parts: string[] = [];
  for (const [name, count] of counts) {
    parts.push(`${count} ${name}`);
  }

  const base = `${messages.length} tool calls: ${parts.join(', ')}`;
  if (errorCount > 0) {
    return `${base} (${errorCount} failed)`;
  }
  return base;
}

/**
 * Groups 3+ consecutive tool calls under a typed summary header.
 * Supports nested two-level expand: group expand reveals cards, each card independently expandable.
 */
export const ToolCallGroup: React.FC<ToolCallGroupProps> = memo(
  ({ messages, messageProps }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [allInnerExpanded, setAllInnerExpanded] = useState(false);

    const summary = useMemo(() => buildGroupSummary(messages), [messages]);

    const hasErrors = useMemo(
      () => messages.some((m) => m.toolResult?.isError),
      [messages]
    );

    const handleToggle = useCallback(() => {
      setIsExpanded((prev) => !prev);
    }, []);

    const handleExpandAll = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
      setAllInnerExpanded((prev) => !prev);
      if (!isExpanded) {
        setIsExpanded(true);
      }
    }, [isExpanded]);

    return (
      <div className="my-1 rounded-md bg-muted/[0.03] border border-border/10">
        {/* Group header */}
        <button
          type="button"
          onClick={handleToggle}
          className="flex items-center gap-1.5 w-full px-2 py-1.5 text-left select-none hover:bg-white/5 rounded-md transition-colors"
          aria-expanded={isExpanded}
        >
          <ChevronRight
            className={`w-3 h-3 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${
              isExpanded ? 'rotate-90' : ''
            }`}
          />
          <span className="text-xs font-medium text-muted-foreground">
            {summary}
          </span>
          {hasErrors && (
            <span className="text-[10px] text-red-400 flex-shrink-0">
              (errors)
            </span>
          )}
          <span className="ml-auto flex-shrink-0">
            <button
              type="button"
              onClick={handleExpandAll}
              className="text-[10px] text-muted-foreground hover:text-foreground-secondary transition-colors flex items-center gap-0.5"
              title={allInnerExpanded ? 'Collapse all' : 'Expand all'}
            >
              <ChevronsUpDown className="w-3 h-3" />
            </button>
          </span>
        </button>

        {/* Expandable card list with CSS grid animation */}
        <div
          style={{
            display: 'grid',
            gridTemplateRows: isExpanded ? '1fr' : '0fr',
            transition: 'grid-template-rows 200ms ease-out',
          }}
        >
          <div className="overflow-hidden">
            <div className="px-1 pb-1 space-y-0.5">
              {messages.map((msg) => (
                <ToolActionCard
                  key={msg.toolId || `${msg.toolName}-${String(msg.timestamp)}`}
                  toolName={msg.toolName || 'Unknown'}
                  toolInput={msg.toolInput}
                  toolResult={msg.toolResult}
                  toolId={msg.toolId}
                  onFileOpen={messageProps.onFileOpen}
                  createDiff={messageProps.createDiff}
                  selectedProject={messageProps.selectedProject}
                  showRawParameters={messageProps.showRawParameters}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

ToolCallGroup.displayName = 'ToolCallGroup';
