/**
 * ConnectionStatusIndicator — Colored dot showing WebSocket connection health.
 *
 * Reads claude provider status from connection store via selector.
 * Green (connected), yellow+pulse (connecting/reconnecting), red (disconnected).
 *
 * Constitution: Named export (2.2), token-based styling (3.1), cn() for classes (3.6),
 * selector-only store access (4.2).
 */

import { memo } from 'react';
import { cn } from '@/utils/cn';
import { useConnectionStore } from '@/stores/connection';
import type { ConnectionStatus } from '@/types/provider';

const STATUS_CONFIG: Record<
  ConnectionStatus,
  { color: string; label: string; pulse: boolean }
> = {
  connected: { color: 'bg-success', label: 'Connected', pulse: false },
  connecting: { color: 'bg-warning', label: 'Connecting...', pulse: true },
  reconnecting: { color: 'bg-warning', label: 'Reconnecting...', pulse: true },
  disconnected: { color: 'bg-destructive', label: 'Disconnected', pulse: false },
};

export const ConnectionStatusIndicator = memo(function ConnectionStatusIndicator() {
  const status = useConnectionStore((s) => s.providers.claude.status);
  const config = STATUS_CONFIG[status];

  return (
    <span title={config.label} className="inline-flex items-center">
      <span
        className={cn(
          'inline-block size-2 rounded-full',
          config.color,
          config.pulse && 'animate-pulse',
        )}
      />
    </span>
  );
});
