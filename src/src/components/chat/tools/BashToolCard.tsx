/**
 * BashToolCard -- terminal-styled card body for Bash tool calls.
 *
 * Renders command with $ prefix in a distinct header, and ANSI-colored
 * output with 50-line truncation via TruncatedContent.
 *
 * Constitution: Named exports only (2.2), cn() for classNames (3.6), memo() wrapped.
 */

import { memo, useMemo } from 'react';
import { parseAnsi } from '@/lib/ansi-parser';
import { cn } from '@/utils/cn';
import { TruncatedContent } from './TruncatedContent';
import type { ToolCardProps } from '@/lib/tool-registry';
import './tool-cards.css';

const BASH_TRUNCATION_THRESHOLD = 50;

export const BashToolCard = memo(function BashToolCard({
  input,
  output,
  isError,
}: ToolCardProps) {
  const command =
    typeof input.command === 'string' ? input.command : '';

  const outputLines = useMemo(() => {
    if (output == null) return null;
    return output.split('\n');
  }, [output]);

  return (
    <div
      className={cn(
        'rounded-md overflow-hidden',
        'bg-[var(--surface-base)] font-[family-name:var(--font-mono)] text-[length:var(--text-body)]',
      )}
    >
      {/* Command header */}
      <div
        className={cn(
          'px-3 py-2',
          'border-b border-[var(--border-subtle)]',
          'text-[var(--text-primary)]',
        )}
      >
        <span className="text-[var(--text-muted)] select-none">$ </span>
        <span>{command}</span>
      </div>

      {/* Output body */}
      {outputLines != null && (
        <div
          className={cn(
            'px-3 py-2',
            isError && 'text-[var(--status-error)]',
          )}
        >
          <TruncatedContent
            items={outputLines}
            threshold={BASH_TRUNCATION_THRESHOLD}
            unit="lines"
            renderItem={renderOutputLine}
          />
        </div>
      )}
    </div>
  );
});

/**
 * Renders a single output line with ANSI color parsing.
 *
 * SAFETY: parseAnsi emits only className-based spans from a controlled
 * set of CSS classes. Input text is HTML-escaped before wrapping.
 * No user HTML injection is possible.
 */
function renderOutputLine(line: string, index: number) {
  return (
    <div
      key={index}
      className="whitespace-pre-wrap break-all leading-relaxed"
      // SAFETY: parseAnsi only emits className-based spans, input text is HTML-escaped
      dangerouslySetInnerHTML={{ __html: parseAnsi(line) }}
    />
  );
}
