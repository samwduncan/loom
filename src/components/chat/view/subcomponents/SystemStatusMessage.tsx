import React, { memo } from 'react';
import { Info, AlertTriangle, XCircle } from 'lucide-react';

export type StatusTier = 'info' | 'warning' | 'error';

const tierConfig = {
  info: {
    bg: 'bg-[#c4a882]/5',
    border: 'border-l-2 border-[#c4a882]/30',
    text: 'text-[#c4a882]/60',
    Icon: Info,
  },
  warning: {
    bg: 'bg-amber-500/[0.08]',
    border: 'border-l-2 border-amber-500/40',
    text: 'text-amber-300/80',
    Icon: AlertTriangle,
  },
  error: {
    bg: 'bg-[#b85c3a]/10',
    border: 'border-l-2 border-[#b85c3a]/40',
    text: 'text-[#dab8b8]',
    Icon: XCircle,
  },
};

interface SystemStatusMessageProps {
  tier: StatusTier;
  content: string;
  timestamp?: string;
}

export const SystemStatusMessage = memo(function SystemStatusMessage({
  tier,
  content,
  timestamp,
}: SystemStatusMessageProps) {
  const config = tierConfig[tier];
  const { Icon } = config;
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded ${config.bg} ${config.border} my-1`}>
      <Icon className={`w-3.5 h-3.5 ${config.text} flex-shrink-0`} />
      <span className={`text-xs ${config.text} flex-1`}>{content}</span>
      {timestamp && (
        <span className="text-[10px] text-[#c4a882]/30 ml-auto flex-shrink-0">
          {timestamp}
        </span>
      )}
    </div>
  );
});
