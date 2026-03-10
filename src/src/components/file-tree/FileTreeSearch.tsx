/**
 * FileTreeSearch -- search input for filtering file tree nodes.
 *
 * Renders a compact input with search icon and calls onChange on every keystroke.
 *
 * Constitution: Named export (2.2), design tokens only (3.1), cn() for classes (3.6).
 */

import { Search } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface FileTreeSearchProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const FileTreeSearch = function FileTreeSearch({
  value,
  onChange,
  className,
}: FileTreeSearchProps) {
  return (
    <div className={cn('relative', className)}>
      <Search
        size={13}
        className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
        aria-hidden="true"
      />
      <input
        type="text"
        data-testid="file-tree-search"
        placeholder="Filter files..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-7 w-full rounded-sm border border-border/8 bg-transparent pl-7 pr-2 text-xs text-foreground placeholder:text-muted-foreground outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50"
      />
    </div>
  );
};
