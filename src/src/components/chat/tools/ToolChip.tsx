/**
 * ToolChip -- compact inline pill component for tool calls.
 *
 * Renders a status dot, icon, tool name, and chip label. Click toggles
 * inline expansion showing ToolCard (pushes content below, no popover).
 *
 * Constitution: Named exports only (2.2), cn() for classNames, memo() wrapped.
 */

import { memo, useState } from 'react';
import { getToolConfig } from '@/lib/tool-registry';
import { cn } from '@/utils/cn';
import type { ToolCallState } from '@/types/stream';
import './tool-chip.css';

export interface ToolChipProps {
  toolCall: ToolCallState;
}

export const ToolChip = memo(function ToolChip({ toolCall }: ToolChipProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = getToolConfig(toolCall.toolName);
  const chipLabel = config.getChipLabel(toolCall.input);
  const Icon = config.icon;
  const CardComponent = config.renderCard;

  return (
    <div className="tool-chip-container">
      <button
        type="button"
        className={cn('tool-chip', `tool-chip--${toolCall.status}`)}
        onClick={() => setIsExpanded((prev) => !prev)}
        aria-expanded={isExpanded}
      >
        <span
          className={cn(
            'tool-chip-dot',
            `tool-chip-dot--${toolCall.status}`,
          )}
        />
        <Icon />
        <span className="tool-chip-name">{config.displayName}</span>
        <span className="tool-chip-label">{chipLabel}</span>
      </button>
      {isExpanded && (
        <CardComponent
          toolName={toolCall.toolName}
          input={toolCall.input}
          output={toolCall.output}
          isError={toolCall.isError}
          status={toolCall.status}
        />
      )}
    </div>
  );
});
