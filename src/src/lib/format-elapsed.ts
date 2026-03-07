/**
 * formatElapsed -- formats milliseconds into human-readable elapsed time.
 *
 * Sub-60s: "1.2s" (always one decimal place)
 * 60s+: "1m 23s" (floor both, no decimals)
 *
 * Used by useElapsedTime hook for tool card/chip timer display.
 */

export function formatElapsed(ms: number): string {
  if (ms < 60_000) {
    return `${(ms / 1000).toFixed(1)}s`;
  }
  const minutes = Math.floor(ms / 60_000);
  const seconds = Math.floor((ms % 60_000) / 1000);
  return `${minutes}m ${seconds}s`;
}
