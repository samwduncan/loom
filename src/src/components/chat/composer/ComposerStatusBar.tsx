/**
 * ComposerStatusBar -- compact session-aware info bar below the composer pill.
 *
 * Data sources:
 * - Stream store: tokenBudget + modelName (live during streaming)
 * - Session token-usage endpoint: context window (persisted, loaded on session switch)
 * - burn-rate.json: 5h block %, burn multiplier (polled every 30s)
 * - claude-metrics API: today's cost (polled every 30s)
 * - Timeline store messages: session cost (summed from message metadata)
 *
 * Constitution: Named export (2.2), selector-only store access (4.2),
 * token-based styling (3.1), cn() for classes (3.6).
 */

import { memo, useState, useCallback, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useStreamStore } from '@/stores/stream';
import { useTimelineStore } from '@/stores/timeline';
import { useUIStore } from '@/stores/ui';
import { useUsageMetrics, useSessionTokenUsage } from '@/hooks/useUsageMetrics';
import { formatModelName } from '@/lib/format-model-name';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import type { PermissionMode } from '@/types/ui';

const PERMISSION_LABELS: Record<PermissionMode, string> = {
  default: 'Default',
  plan: 'Plan',
  bypassPermissions: 'YOLO',
};

const PERMISSION_DESCRIPTIONS: Record<PermissionMode, string> = {
  default: 'Ask before risky actions',
  plan: 'Read-only, plan mode tools only',
  bypassPermissions: 'Skip all permission prompts',
};

function fmtCost(cost: string | number | null): string | null {
  if (cost === null) return null;
  const n = typeof cost === 'string' ? parseFloat(cost) : cost;
  if (isNaN(n) || n === 0) return null;
  return n < 0.01 ? `$${n.toFixed(4)}` : `$${n.toFixed(2)}`;
}

function fmtTokens(used: number, total: number): string {
  const u = used >= 1_000_000 ? `${(used / 1_000_000).toFixed(1)}M` : `${Math.round(used / 1000)}K`;
  const t = total >= 1_000_000 ? `${(total / 1_000_000).toFixed(0)}M` : `${Math.round(total / 1000)}K`;
  return `${u}/${t}`;
}

function Bar({ pct, label }: { pct: number; label: string }) {
  const colorClass = pct >= 90
    ? 'bg-[var(--status-error)]'
    : pct >= 70
      ? 'bg-[var(--status-warning)]'
      : 'bg-[var(--status-success)]';
  return (
    <span className="flex items-center gap-1">
      <span className="composer-status-bar-progress">
        <span
          className={cn('composer-status-bar-progress-fill', colorClass)}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </span>
      <span>{label}</span>
    </span>
  );
}

function Sep() {
  return <span className="composer-status-bar-separator">·</span>;
}

export interface ComposerStatusBarProps {
  projectName: string;
  sessionId: string | null;
}

export const ComposerStatusBar = memo(function ComposerStatusBar({
  projectName,
  sessionId,
}: ComposerStatusBarProps) {
  const [permOpen, setPermOpen] = useState(false);

  // Stores
  const permissionMode = useUIStore((s) => s.permissionMode);
  const setPermissionMode = useUIStore((s) => s.setPermissionMode);
  const liveTokenBudget = useStreamStore((s) => s.tokenBudget);
  const modelName = useStreamStore((s) => s.modelName);

  // Per-session context (from JSONL, loaded on session switch)
  const sessionUsage = useSessionTokenUsage(projectName, sessionId);

  // Prefer live streaming data, fall back to JSONL-loaded data
  const tokenBudget = liveTokenBudget ?? sessionUsage;

  // Session cost — sum from loaded messages
  const messages = useTimelineStore((s) =>
    sessionId ? (s.sessions.find((sess) => sess.id === sessionId)?.messages ?? null) : null,
  );
  const sessionCost = useMemo(() => {
    if (!messages || messages.length === 0) return null;
    let total = 0;
    for (const m of messages) {
      if (m.metadata?.cost) total += m.metadata.cost;
    }
    return total > 0 ? total : null;
  }, [messages]);

  // Global metrics (polled)
  const metrics = useUsageMetrics();
  const blockPct = metrics?.burnRate?.blockPct ?? null;
  const burnMult = metrics?.burnRate?.mult ?? null;
  const todayCost = metrics?.usage?.today?.totalCost ?? null;

  const handleSelectMode = useCallback(
    (mode: PermissionMode) => {
      setPermissionMode(mode);
      setPermOpen(false);
    },
    [setPermissionMode],
  );

  const budgetPct = tokenBudget
    ? Math.min(100, Math.round((tokenBudget.used / tokenBudget.total) * 100))
    : null;

  // Build items — only render items that have data
  const items: React.ReactNode[] = [];

  // Permission mode (always shown)
  items.push(
    <Popover key="perm" open={permOpen} onOpenChange={setPermOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex items-center gap-0.5 px-1.5 py-0.5 rounded',
            'hover:bg-surface-raised/50 transition-colors',
            permissionMode === 'bypassPermissions' && 'text-[var(--status-warning)]',
            permissionMode === 'plan' && 'text-[var(--accent-primary)]',
          )}
        >
          {PERMISSION_LABELS[permissionMode]}
          <ChevronDown size={10} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        sideOffset={6}
        className={cn(
          'w-48 p-1.5',
          'bg-surface-raised border border-border',
          'rounded-lg shadow-lg',
        )}
      >
        {(Object.keys(PERMISSION_LABELS) as PermissionMode[]).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => handleSelectMode(mode)}
            className={cn(
              'w-full text-left px-2 py-1.5 rounded text-xs',
              'transition-colors',
              mode === permissionMode
                ? 'bg-surface-active text-foreground'
                : 'text-muted hover:text-foreground hover:bg-surface-raised/50',
            )}
          >
            <div className="font-medium">{PERMISSION_LABELS[mode]}</div>
            <div className="text-[10px] text-muted">{PERMISSION_DESCRIPTIONS[mode]}</div>
          </button>
        ))}
      </PopoverContent>
    </Popover>,
  );

  // Model name (only if known)
  const model = formatModelName(modelName);
  if (modelName) {
    items.push(<span key="model" className="truncate">{model}</span>);
  }

  // Context window (from live streaming OR from JSONL)
  if (budgetPct !== null && tokenBudget) {
    items.push(
      <Bar key="ctx" pct={budgetPct} label={fmtTokens(tokenBudget.used, tokenBudget.total)} />,
    );
  }

  // 5h block usage
  if (blockPct !== null) {
    items.push(<Bar key="5h" pct={blockPct} label={`5h ${blockPct}%`} />);
  }

  // Burn rate
  if (burnMult !== null) {
    items.push(
      <span
        key="burn"
        className={cn(
          burnMult > 1 && 'text-[var(--status-warning)]',
          burnMult > 1.5 && 'text-[var(--status-error)]',
        )}
      >
        {burnMult.toFixed(1)}x{metrics?.burnRate?.trend ?? ''}
      </span>,
    );
  }

  // Session cost (from messages)
  const sessCostStr = fmtCost(sessionCost);
  if (sessCostStr) {
    items.push(<span key="sess-cost">{sessCostStr}</span>);
  }

  // Today's total cost
  const todayCostStr = fmtCost(todayCost);
  if (todayCostStr) {
    items.push(
      <span key="day-cost" className="opacity-60">{todayCostStr}/d</span>,
    );
  }

  // Interleave separators between items
  const rendered: React.ReactNode[] = [];
  for (let i = 0; i < items.length; i++) {
    if (i > 0) rendered.push(<Sep key={`sep-${i}`} />);
    rendered.push(items[i]);
  }

  return (
    <div className="composer-status-bar flex-wrap">
      {rendered}
    </div>
  );
});
