import { ChevronsDown, ChevronsUp } from 'lucide-react';

interface TurnToolbarProps {
  turnCount: number;
  onExpandAll: () => void;
  onCollapseAll: () => void;
}

export function TurnToolbar({ turnCount, onExpandAll, onCollapseAll }: TurnToolbarProps) {
  if (turnCount < 2) return null;

  return (
    <div className="sticky top-0 z-10 flex items-center justify-between px-3 sm:px-4 py-1 text-xs text-gray-500 text-gray-400 bg-gray-50/80 bg-gray-900/80 backdrop-blur-sm border-b border-gray-200/50 border-gray-700/50">
      <span className="font-medium">
        {turnCount} turn{turnCount !== 1 ? 's' : ''}
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onExpandAll}
          className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-gray-200/60 hover:bg-gray-700/60 transition-colors"
          title="Expand all turns"
        >
          <ChevronsDown className="w-3.5 h-3.5" />
          <span>Expand all</span>
        </button>
        <button
          type="button"
          onClick={onCollapseAll}
          className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-gray-200/60 hover:bg-gray-700/60 transition-colors"
          title="Collapse all turns"
        >
          <ChevronsUp className="w-3.5 h-3.5" />
          <span>Collapse all</span>
        </button>
      </div>
    </div>
  );
}
