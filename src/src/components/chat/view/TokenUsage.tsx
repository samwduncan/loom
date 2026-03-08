/**
 * TokenUsage -- displays formatted token count and cost below assistant messages.
 *
 * Shows "X in / Y out . $Z" format with comma-separated numbers.
 * If cache read tokens are present: "X in (N cached) / Y out . $Z".
 * Renders nothing when no token data is available.
 *
 * Constitution: Named export (2.2), no inline styles (7.14).
 */

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

export function TokenUsage({ metadata }: TokenUsageProps) {
  const hasTokens = metadata.inputTokens !== null || metadata.outputTokens !== null;
  const hasCost = metadata.cost !== null && metadata.cost > 0;

  if (!hasTokens && !hasCost) return null;

  const parts: string[] = [];

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
    parts.push(formatCost(metadata.cost!)); // ASSERT: hasCost guards non-null
  }

  return (
    <div className="text-muted text-xs mt-1">
      {parts.join(' \u00B7 ')}
    </div>
  );
}
