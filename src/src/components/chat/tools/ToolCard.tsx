/**
 * ToolCard -- shared expanded tool card component for M1.
 *
 * Displays tool input (JSON-formatted) and output (if present).
 * Error output shown in --status-error color.
 * This is the shared layout for all tools in M1 -- per-tool custom cards come in M2.
 *
 * Constitution: Named exports only (2.2), cn() for classNames.
 */

import { cn } from '@/utils/cn';
import type { ToolCardProps } from '@/lib/tool-registry';
import './tool-chip.css';

export function ToolCard({
  input,
  output,
  isError,
}: ToolCardProps) {
  const inputStr = JSON.stringify(input, null, 2);
  const truncatedInput =
    inputStr.length > 200 ? inputStr.slice(0, 197) + '...' : inputStr;

  const truncatedOutput =
    output && output.length > 500 ? output.slice(0, 497) + '...' : output;

  return (
    <div className="tool-card">
      <div className="tool-card-input">
        <pre>
          {truncatedInput}
        </pre>
      </div>
      {truncatedOutput != null && (
        <div
          className={cn(
            'tool-card-output',
            isError && 'tool-card-output--error',
          )}
        >
          <pre>
            {truncatedOutput}
          </pre>
        </div>
      )}
    </div>
  );
}
