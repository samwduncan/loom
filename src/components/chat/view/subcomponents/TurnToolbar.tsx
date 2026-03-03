import { ChevronsDown, ChevronsUp } from 'lucide-react';

interface TurnToolbarProps {
  turnCount: number;
  onExpandAll: () => void;
  onCollapseAll: () => void;
}

export function TurnToolbar({ turnCount, onExpandAll, onCollapseAll }: TurnToolbarProps) {
  if (turnCount < 2) return null;

  return (
    <div className="sticky top-0 z-[var(--z-sticky)] flex items-center justify-between px-3 sm:px-4 py-1 text-xs text-muted-foreground bg-surface-base/80 backdrop-blur-sm border-b border-border/10">
      <span className="font-medium">
        {turnCount} turn{turnCount !== 1 ? 's' : ''}
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onExpandAll}
          className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-surface-raised/60 transition-colors"
          title="Expand all turns"
        >
          <ChevronsDown className="w-3.5 h-3.5" />
          <span>Expand all</span>
        </button>
        <button
          type="button"
          onClick={onCollapseAll}
          className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-surface-raised/60 transition-colors"
          title="Collapse all turns"
        >
          <ChevronsUp className="w-3.5 h-3.5" />
          <span>Collapse all</span>
        </button>
      </div>
    </div>
  );
}
