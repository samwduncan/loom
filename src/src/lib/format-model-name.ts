/**
 * Format a Claude model ID for compact display.
 *
 * "claude-opus-4-6-20250514" → "Opus 4.6"
 * "claude-sonnet-4-6-20250514" → "Sonnet 4.6"
 * "claude-haiku-4-5-20241022" → "Haiku 4.5"
 * "claude-sonnet-4-20250514" → "Sonnet 4"
 */
export function formatModelName(modelId: string | null): string {
  if (!modelId) return '--';
  const match = modelId.match(/(?:claude-)?(\w+)-(\d+(?:-\d+)?)/i);
  if (!match || !match[1] || !match[2]) return modelId;
  const name = match[1].charAt(0).toUpperCase() + match[1].slice(1);
  const version = match[2].replace(/-/g, '.');
  return `${name} ${version}`;
}
