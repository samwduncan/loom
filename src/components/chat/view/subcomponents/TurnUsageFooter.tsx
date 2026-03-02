import { memo, useMemo } from 'react';
import { calculateTurnCost, formatTokenCount } from '../../utils/pricing';
import type { TurnUsage } from '../../utils/pricing';

interface TurnUsageFooterProps {
  usage: TurnUsage;
  model: string;
}

export const TurnUsageFooter = memo(function TurnUsageFooter({ usage, model }: TurnUsageFooterProps) {
  const cost = useMemo(() => calculateTurnCost(usage, model), [usage, model]);

  return (
    <div className="pt-2 border-t border-[#3d2e25]/30 text-[11px] text-[#c4a882]/50 font-mono leading-relaxed px-3 sm:px-0">
      <div>
        {formatTokenCount(usage.inputTokens)} in &middot; {formatTokenCount(usage.outputTokens)} out
        {usage.cacheReadTokens > 0 && ` \u00B7 ${formatTokenCount(usage.cacheReadTokens)} cache`}
        {usage.cacheCreationTokens > 0 && ` \u00B7 ${formatTokenCount(usage.cacheCreationTokens)} cache-write`}
      </div>
      <div>
        ${cost.toFixed(4)} &middot; {model}
      </div>
    </div>
  );
});
