import React, { memo, useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
 * Groups 3+ consecutive tool calls under a pill-styled summary header.
 * Supports nested two-level expand: group expand reveals cards, each card independently expandable.
 * State-aware: auto-expands for running/error groups, auto-collapses when all complete.
 */
export const ToolCallGroup: React.FC<ToolCallGroupProps> = memo(
  ({ messages, messageProps }) => {
    const [allInnerExpanded, setAllInnerExpanded] = useState(false);

    const summary = useMemo(() => buildGroupSummary(messages), [messages]);

    const hasErrors = useMemo(
      () => messages.some((m) => m.toolResult?.isError),
      [messages]
    );

    const hasRunning = useMemo(
      () => messages.some((m) => !m.toolResult),
      [messages]
    );

    const errorCount = useMemo(
      () => messages.filter((m) => m.toolResult?.isError).length,
      [messages]
    );

    // Auto-expand: running tools or errors should be visible
    const [isExpanded, setIsExpanded] = useState(hasRunning || hasErrors);
    const prevHasRunning = useRef(hasRunning);

    // When all running tools complete (transition from running → all done), auto-collapse after delay
    // When errors exist, keep expanded
    useEffect(() => {
      if (hasRunning) {
        setIsExpanded(true);
      } else if (prevHasRunning.current && !hasRunning && !hasErrors) {
        // All tools just finished, no errors -- collapse after brief delay
        const timer = setTimeout(() => setIsExpanded(false), 500);
        return () => clearTimeout(timer);
      }
      if (hasErrors) {
        setIsExpanded(true);
      }
      prevHasRunning.current = hasRunning;
    }, [hasRunning, hasErrors]);

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
      <div className="my-1 rounded-xl bg-muted/[0.03] border border-border/10">
        {/* Group header -- pill-styled with count badges */}
        <button
          type="button"
          onClick={handleToggle}
          className="flex items-center gap-1.5 w-full px-2.5 py-1.5 text-left select-none hover:bg-foreground/5 rounded-xl transition-colors"
          aria-expanded={isExpanded}
          title={summary}
        >
          <ChevronRight
            className={`w-3 h-3 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${
              isExpanded ? 'rotate-90' : ''
            }`}
          />
          <span className="text-xs font-medium text-muted-foreground">
            Tool Calls
          </span>
          {/* Total count badge */}
          <span className="text-[10px] bg-muted/30 text-muted-foreground rounded-full px-1.5 py-0.5 font-mono tabular-nums">
            {messages.length}
          </span>
          {/* Error count badge -- only when errors exist */}
          {errorCount > 0 && (
            <span className="text-[10px] bg-red-500/15 text-red-400 rounded-full px-1.5 py-0.5 font-mono tabular-nums">
              {errorCount} failed
            </span>
          )}
          {/* Running indicator -- shows when tools are still executing */}
          {hasRunning && (
            <span className="text-[10px] text-rose-400/70 flex-shrink-0">
              running...
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
