/**
 * TerminalHeader -- connection state indicator, mode label, and control buttons.
 *
 * Shows a horizontal bar with:
 * - Terminal icon + "Shell" label
 * - Connection state dot (yellow/green/red)
 * - "Shell" mode label
 * - Restart (RotateCw) and Disconnect (Unplug) buttons
 *
 * Constitution: Named export (2.2), cn() (3.6), design tokens (3.1).
 */

import { Terminal, RotateCw, Unplug } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { ShellConnectionState } from '@/types/shell';

export interface TerminalHeaderProps {
  state: ShellConnectionState;
  onRestart: () => void;
  onDisconnect: () => void;
}

const STATE_DOT_CLASSES: Record<ShellConnectionState, string> = {
  connecting: 'bg-[var(--status-warning)] animate-pulse',
  connected: 'bg-[var(--status-success)]',
  disconnected: 'bg-[var(--status-error)]',
};

export const TerminalHeader = function TerminalHeader({
  state,
  onRestart,
  onDisconnect,
}: TerminalHeaderProps) {
  return (
    <div className="flex h-10 items-center gap-2 border-b border-border/8 bg-[var(--surface-raised)] px-3">
      <Terminal className="h-4 w-4 text-[var(--text-muted)]" />
      <span className="text-sm font-medium text-[var(--text-primary)]">
        Shell
      </span>

      <div
        className={cn('h-2 w-2 rounded-full', STATE_DOT_CLASSES[state])}
        data-testid="connection-dot"
        aria-label={`Connection: ${state}`}
      />

      <div className="flex-1" />

      <button
        type="button"
        title="Restart"
        aria-label="Restart terminal"
        onClick={onRestart}
        disabled={state === 'connecting'}
        className="rounded p-1 text-[var(--text-muted)] transition-colors hover:bg-surface-raised hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
      >
        <RotateCw className="h-4 w-4" />
      </button>

      <button
        type="button"
        title="Disconnect"
        aria-label="Disconnect terminal"
        onClick={onDisconnect}
        disabled={state === 'disconnected' || state === 'connecting'}
        className="rounded p-1 text-[var(--text-muted)] transition-colors hover:bg-surface-raised hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
      >
        <Unplug className="h-4 w-4" />
      </button>
    </div>
  );
};
