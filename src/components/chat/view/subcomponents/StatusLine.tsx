import TokenUsagePie from './TokenUsagePie';
import { useActivityStatus } from '../../hooks/useActivityStatus';
import { formatTokenCount } from '../../utils/pricing';

interface StatusLineProps {
  claudeStatus: { text?: string; tokens?: number; can_interrupt?: boolean } | null;
  isLoading: boolean;
  onAbort: () => void;
  provider: string;
  modelLabel: string;
  sessionCost?: number | null;
  tokenBudget: { used?: number; total?: number } | null;
}

/**
 * Always-visible status bar rendered below the composer.
 * - Idle: shows provider, model, and cost info with token pie on the right
 * - Streaming: shows activity text, elapsed time, token count, and stop button
 *
 * The container never unmounts -- only content changes to prevent layout shift.
 */
export default function StatusLine({
  claudeStatus,
  isLoading,
  onAbort,
  provider,
  modelLabel,
  sessionCost,
  tokenBudget,
}: StatusLineProps) {
  const { activityText, elapsedSeconds, tokenCount } = useActivityStatus(claudeStatus, isLoading);

  // Capitalize provider name for display
  const providerLabel = provider.charAt(0).toUpperCase() + provider.slice(1);

  return (
    <div className="min-h-[28px] max-w-4xl mx-auto px-3 flex items-center justify-between">
      {isLoading ? (
        <>
          {/* Streaming state: activity . elapsed . tokens . esc hint */}
          <div className="flex items-center gap-0 text-xs text-foreground-secondary min-w-0">
            <span className="truncate">{activityText}</span>
            <span className="text-muted-foreground mx-1.5">&middot;</span>
            <span className="flex-shrink-0">{elapsedSeconds}s</span>
            {tokenCount > 0 && (
              <>
                <span className="text-muted-foreground mx-1.5">&middot;</span>
                <span className="flex-shrink-0">{formatTokenCount(tokenCount)} tokens</span>
              </>
            )}
            <span className="text-muted-foreground mx-1.5 hidden sm:inline">&middot;</span>
            <span className="text-muted-foreground/60 flex-shrink-0 hidden sm:inline">esc to stop</span>
          </div>

          {/* Stop button */}
          <button
            type="button"
            onClick={onAbort}
            className="ml-2 flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-destructive hover:bg-destructive/90 text-destructive-foreground transition-colors flex-shrink-0"
            title="Stop generation"
          >
            {/* Square stop icon */}
            <svg className="w-2.5 h-2.5" viewBox="0 0 10 10" fill="currentColor">
              <rect x="1" y="1" width="8" height="8" rx="1" />
            </svg>
            <span className="hidden sm:inline">Stop</span>
          </button>
        </>
      ) : (
        <>
          {/* Idle state: provider . model . cost */}
          <div className="flex items-center gap-0 text-xs text-foreground-secondary min-w-0">
            <span className="flex-shrink-0">{providerLabel}</span>
            <span className="text-muted-foreground mx-1.5">&middot;</span>
            <span className="truncate">{modelLabel}</span>
            {sessionCost != null && sessionCost > 0 && (
              <>
                <span className="text-muted-foreground mx-1.5">&middot;</span>
                <span className="flex-shrink-0">${sessionCost.toFixed(4)}</span>
              </>
            )}
          </div>

          {/* Token usage pie on the right */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <TokenUsagePie
              used={tokenBudget?.used || 0}
              total={tokenBudget?.total || parseInt(import.meta.env.VITE_CONTEXT_WINDOW) || 160000}
            />
            {tokenBudget?.used ? (
              <span className="text-[10px] text-muted-foreground/50 font-mono whitespace-nowrap hidden sm:inline">
                {formatTokenCount(tokenBudget.used)}
              </span>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
