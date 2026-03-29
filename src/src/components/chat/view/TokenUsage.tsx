/**
 * TokenUsage -- expandable token usage footer below assistant messages.
 *
 * Shows compact "X in / Y out . $Z" by default. Clicking expands to a
 * detailed breakdown card with labeled rows for input, output, cache, cost.
 * Uses CSS grid transition for smooth expand/collapse.
 *
 * Constitution: Named export (2.2), no inline styles (7.14), design tokens only.
 */

import { useState, useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { MessageMetadata } from '@/types/message';

interface TokenUsageProps {
  metadata: MessageMetadata;
}

/**
 * Format cost for display:
 * - < $0.01: show 4 decimal places ($0.0012)
 * - >= $0.01: show 3 decimal places ($0.053)
 */
function formatCost(cost: number): string {
  if (cost < 0.01) {
    return `$${cost.toFixed(4)}`;
  }
  return `$${cost.toFixed(3)}`;
}

/**
 * Build the compact one-liner summary string.
 */
function buildSummary(metadata: MessageMetadata): string {
  const parts: string[] = [];
  const hasTokens = metadata.inputTokens !== null || metadata.outputTokens !== null;
  const hasCost = metadata.cost !== null && metadata.cost > 0;

  if (hasTokens) {
    const input = (metadata.inputTokens ?? 0).toLocaleString();
    const output = (metadata.outputTokens ?? 0).toLocaleString();
    const cacheRead = metadata.cacheReadTokens;

    if (cacheRead && cacheRead > 0) {
      parts.push(`${input} in (${cacheRead.toLocaleString()} cached) / ${output} out`);
    } else {
      parts.push(`${input} in / ${output} out`);
    }
  }

  if (hasCost) {
    parts.push(formatCost(metadata.cost!)); // ASSERT: hasCost guards non-null check above
  }

  return parts.join(' \u00B7 ');
}

export function TokenUsage({ metadata }: TokenUsageProps) {
  const [expanded, setExpanded] = useState(false);

  const hasTokens = metadata.inputTokens !== null || metadata.outputTokens !== null;
  const hasCost = metadata.cost !== null && metadata.cost > 0;

  const summary = useMemo(() => buildSummary(metadata), [metadata]);
  const showCacheRow = metadata.cacheReadTokens != null && metadata.cacheReadTokens > 0;

  if (!hasTokens && !hasCost) return null;

  return (
    <div className="mt-1">
      <button
        type="button"
        data-testid="token-usage-summary"
        className="text-muted flex cursor-pointer items-center gap-1 text-xs transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 rounded-sm"
        aria-expanded={expanded}
        aria-label="Toggle token usage details"
        onClick={() => setExpanded((prev) => !prev)}
      >
        <ChevronRight
          size={12}
          className={cn('transition-transform duration-200', expanded && 'rotate-90')}
        />
        {summary}
      </button>

      {expanded && (
        <dl
          data-testid="token-usage-detail"
          className="text-muted bg-surface-raised mt-1 rounded px-3 py-2 text-xs"
        >
          {hasTokens && (
            <>
              <div className="flex justify-between gap-4">
                <dt>Input tokens</dt>
                <dd>{(metadata.inputTokens ?? 0).toLocaleString()}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Output tokens</dt>
                <dd>{(metadata.outputTokens ?? 0).toLocaleString()}</dd>
              </div>
              {showCacheRow && (
                <div className="flex justify-between gap-4">
                  <dt>Cache read</dt>
                  <dd>{(metadata.cacheReadTokens ?? 0).toLocaleString()}</dd>
                </div>
              )}
            </>
          )}
          {hasCost && (
            <div className="flex justify-between gap-4">
              <dt>Cost</dt>
              <dd>{formatCost(metadata.cost ?? 0)}</dd>
            </div>
          )}
        </dl>
      )}
    </div>
  );
}
