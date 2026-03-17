/**
 * ToolChip -- compact inline pill component for tool calls.
 *
 * Renders a status dot, icon, tool name, elapsed time, and chip label.
 * Click toggles inline expansion showing ToolCard via ToolCardShell
 * (pushes content below, no popover).
 *
 * Error tool calls auto-expand on first render and on transition to rejected
 * using "adjust state during rendering" pattern.
 *
 * Constitution: Named exports only (2.2), cn() for classNames, memo() wrapped.
 */

import { memo, useState } from 'react';
import { getToolConfig } from '@/lib/tool-registry';
import { useElapsedTime } from '@/hooks/useElapsedTime';
import { useUIStore } from '@/stores/ui';
import { ToolCardShell } from './ToolCardShell';
import { cn } from '@/utils/cn';
import type { ToolCallState } from '@/types/stream';
import './tool-chip.css';

export interface ToolChipProps {
  toolCall: ToolCallState;
  /** Override initial expanded state (used by ToolCallGroup "Expand all") */
  defaultExpanded?: boolean;
}

export const ToolChip = memo(function ToolChip({ toolCall, defaultExpanded }: ToolChipProps) {
  const autoExpandTools = useUIStore((state) => state.autoExpandTools);
  const [userToggled, setUserToggled] = useState(false);
  const [localExpanded, setLocalExpanded] = useState(
    defaultExpanded ?? (toolCall.isError && toolCall.status === 'rejected'),
  );

  // Reactive: store controls expansion until user manually toggles or defaultExpanded overrides
  const isExpanded = userToggled
    ? localExpanded
    : defaultExpanded !== undefined
      ? localExpanded
      : autoExpandTools || localExpanded;
  const config = getToolConfig(toolCall.toolName);
  const chipLabel = config.getChipLabel(toolCall.input);
  const Icon = config.icon;
  const CardComponent = config.renderCard;
  const elapsed = useElapsedTime(toolCall.startedAt, toolCall.completedAt);

  // "Adjust state during rendering" pattern: auto-expand on transition to rejected
  const [prevStatus, setPrevStatus] = useState(toolCall.status);
  if (toolCall.status !== prevStatus) {
    setPrevStatus(toolCall.status);
    if (toolCall.status === 'rejected') {
      setLocalExpanded(true);
    }
  }

  return (
    <div className="tool-chip-container" data-testid="tool-chip">
      <button
        type="button"
        className={cn('tool-chip', `tool-chip--${toolCall.status}`)}
        onClick={() => {
          setUserToggled(true);
          setLocalExpanded((prev) => !prev);
        }}
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
        {elapsed && (
          <>
            <span className="tool-chip-separator">&middot;</span>
            <span className="tool-chip-elapsed">{elapsed}</span>
          </>
        )}
        <span className="tool-chip-label">{chipLabel}</span>
      </button>
      <ToolCardShell
        toolCall={toolCall}
        config={config}
        isExpanded={isExpanded}
        onToggle={() => {
          setUserToggled(true);
          setLocalExpanded((prev) => !prev);
        }}
      >
        <CardComponent
          toolName={toolCall.toolName}
          input={toolCall.input}
          output={toolCall.output}
          isError={toolCall.isError}
          status={toolCall.status}
        />
      </ToolCardShell>
    </div>
  );
});
