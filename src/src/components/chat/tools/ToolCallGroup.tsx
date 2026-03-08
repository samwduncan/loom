/**
 * ToolCallGroup -- collapsible group container for consecutive tool calls.
 *
 * Two-level expand: group header -> individual ToolChips -> individual ToolCards.
 * Error tools are extracted and rendered below the group as standalone chips.
 *
 * Uses CSS Grid grid-template-rows: 0fr/1fr animation consistent with
 * ToolCardShell and ThinkingDisclosure.
 *
 * Constitution: Named exports only (2.2), cn() for classNames (3.6), memo() wrapped.
 */

import { memo, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { ToolChip } from './ToolChip';
import { getToolConfig } from '@/lib/tool-registry';
import { cn } from '@/utils/cn';
import type { ToolCallState } from '@/types/stream';
import './ToolCallGroup.css';

export interface ToolCallGroupProps {
  tools: ToolCallState[];
  errors: ToolCallState[];
  defaultExpanded?: boolean;
}

/**
 * Build deduplicated type summary string.
 * e.g. "Read x3, Edit x1, Bash x1"
 */
function buildTypeSummary(tools: ToolCallState[]): string {
  const counts = new Map<string, number>();
  for (const tool of tools) {
    const config = getToolConfig(tool.toolName);
    const name = config.displayName;
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => (count > 1 ? `${name} \u00D7${count}` : name))
    .join(', ');
}

export const ToolCallGroup = memo(function ToolCallGroup({
  tools,
  errors,
  defaultExpanded = false,
}: ToolCallGroupProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [expandAllCounter, setExpandAllCounter] = useState(0);

  const totalCount = tools.length;
  const summary = buildTypeSummary(tools);

  return (
    <div className="tool-group" data-testid="tool-group">
      {/* Header -- always visible */}
      <div
        className="tool-group-header"
        data-testid="tool-group-header"
        role="button"
        tabIndex={0}
        onClick={() => setIsExpanded((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsExpanded((prev) => !prev);
          }
        }}
        aria-expanded={isExpanded}
      >
        <ChevronRight
          size={14}
          className={cn(
            'tool-group-chevron',
            isExpanded && 'tool-group-chevron--expanded',
          )}
        />
        <span className="tool-group-count">
          {totalCount} tool call{totalCount !== 1 ? 's' : ''}
        </span>
        <span className="tool-group-separator">&mdash;</span>
        <span className="tool-group-summary" data-testid="tool-group-summary">
          {summary}
        </span>
        {isExpanded && (
          <button
            type="button"
            className="tool-group-expand-all"
            onClick={(e) => {
              e.stopPropagation();
              setExpandAllCounter((c) => c + 1);
            }}
          >
            Expand all
          </button>
        )}
      </div>

      {/* Body -- CSS Grid expand/collapse */}
      <div
        className="tool-group-body"
        style={{ gridTemplateRows: isExpanded ? '1fr' : '0fr' }}
      >
        <div>
          <div className="tool-group-body-inner">
            {tools.map((tool) => (
              <ToolChip
                key={tool.id + '-' + expandAllCounter}
                toolCall={tool}
                defaultExpanded={expandAllCounter > 0 ? true : undefined}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Error tools -- always visible below group */}
      {errors.length > 0 && (
        <div className="tool-group-errors" data-testid="tool-group-errors">
          {errors.map((error) => (
            <ToolChip key={error.id} toolCall={error} />
          ))}
        </div>
      )}
    </div>
  );
});
