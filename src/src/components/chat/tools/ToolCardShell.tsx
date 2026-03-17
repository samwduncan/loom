/**
 * ToolCardShell -- shared card wrapper with header, expand animation, error treatment.
 *
 * Provides consistent header layout (icon, name, status dot, status label, elapsed time)
 * and CSS Grid expand/collapse animation for all tool cards.
 *
 * Constitution: Named exports only (2.2), cn() for classNames (3.6), memo() wrapped.
 */

import { memo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useElapsedTime } from '@/hooks/useElapsedTime';
import { useUIStore } from '@/stores/ui';
import { SpotlightCard } from '@/components/effects/SpotlightCard';
import type { ToolCallState, ToolCallStatus } from '@/types/stream';
import type { ToolConfig } from '@/lib/tool-registry';
import './tool-card-shell.css';

export interface ToolCardShellProps {
  toolCall: ToolCallState;
  config: ToolConfig;
  isExpanded: boolean;
  onToggle?: () => void;
  children: React.ReactNode;
}

const STATUS_LABELS: Record<ToolCallStatus, string> = {
  invoked: 'Starting',
  executing: 'Running',
  resolved: 'Done',
  rejected: 'Failed',
};

export const ToolCardShell = memo(function ToolCardShell({
  toolCall,
  config,
  isExpanded,
  onToggle,
  children,
}: ToolCardShellProps) {
  const showRawParams = useUIStore((state) => state.showRawParams);
  const elapsed = useElapsedTime(toolCall.startedAt, toolCall.completedAt);
  const Icon = config.icon;
  const isError = toolCall.status === 'rejected';

  return (
    <SpotlightCard>
    <div
      className="tool-card-shell"
      data-status={toolCall.status}
      data-expanded={isExpanded}
      data-testid="tool-card-shell"
    >
      <button
        type="button"
        className="tool-card-shell-header"
        onClick={onToggle}
      >
        <span className="tool-card-shell-icon">
          <Icon />
        </span>
        <span className="tool-card-shell-name">{config.displayName}</span>
        {isError && (
          <AlertTriangle
            size={14}
            className="tool-card-shell-error-icon"
            data-testid="tool-card-shell-error-icon"
          />
        )}
        <span className="tool-card-shell-right">
          <span
            className={cn(
              'tool-chip-dot',
              `tool-chip-dot--${toolCall.status}`,
            )}
          />
          <span className="tool-card-shell-status-label">
            {STATUS_LABELS[toolCall.status]}
          </span>
          {elapsed && (
            <span className="tool-card-shell-elapsed">
              {`\u00B7 ${elapsed}`}
            </span>
          )}
        </span>
      </button>
      <div className="tool-card-shell-body" data-expanded={isExpanded}>
        <div>
          <div className="tool-card-shell-body-inner">
            {children}
            {showRawParams && toolCall.input && (
              <details className="mt-2 border-t border-border pt-2">
                <summary className="text-xs text-muted cursor-pointer select-none">
                  Raw Parameters
                </summary>
                <pre
                  className={cn(
                    'mt-1 overflow-x-auto p-2',
                    'bg-surface-sunken rounded',
                    'font-mono text-xs',
                    'whitespace-pre-wrap break-all',
                  )}
                  data-testid="raw-params"
                >
                  {JSON.stringify(toolCall.input, null, 2)}
                </pre>
              </details>
            )}
          </div>
        </div>
      </div>
    </div>
    </SpotlightCard>
  );
});
