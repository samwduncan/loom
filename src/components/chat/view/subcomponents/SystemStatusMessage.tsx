import React, { memo } from 'react';
import { Info, AlertTriangle, XCircle } from 'lucide-react';

export type StatusTier = 'info' | 'warning' | 'error';

const tierConfig = {
  info: {
    bg: 'bg-muted-foreground/5',
    border: 'border-l-2 border-muted-foreground/30',
    text: 'text-muted-foreground/60',
    Icon: Info,
  },
  warning: {
    bg: 'bg-status-reconnecting/[0.08]',
    border: 'border-l-2 border-status-reconnecting/40',
    text: 'text-status-reconnecting/80',
    Icon: AlertTriangle,
  },
  error: {
    bg: 'bg-status-error/8',
    border: 'border-l-2 border-status-error/40',
    text: 'text-foreground',
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
        <span className="text-[10px] text-muted-foreground/30 ml-auto flex-shrink-0">
          {timestamp}
        </span>
      )}
    </div>
  );
});
