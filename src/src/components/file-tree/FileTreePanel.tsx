/**
 * FileTreePanel -- split layout with tree sidebar and editor placeholder.
 *
 * Left: 240px (w-60) tree sidebar with header, refresh button, and FileTree.
 * Right: flex-1 editor placeholder (replaced in Plan 03).
 *
 * Constitution: Named export (2.2), design tokens only (3.1), cn() for classes (3.6).
 */

import { RefreshCw } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useProjectContext } from '@/hooks/useProjectContext';
import { useFileTree } from '@/hooks/useFileTree';
import { FileTree } from './FileTree';
import './file-tree.css';

export interface FileTreePanelProps {
  className?: string;
}

export const FileTreePanel = function FileTreePanel({ className }: FileTreePanelProps) {
  const { projectName } = useProjectContext();
  const { retry } = useFileTree(projectName);

  return (
    <div className={cn('flex h-full', className)}>
      {/* Tree sidebar */}
      <div className="w-60 shrink-0 border-r border-border/8 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border/8">
          <span className="text-xs font-medium text-foreground uppercase tracking-wider">
            Files
          </span>
          <button
            type="button"
            className="p-1 rounded-sm text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Refresh file tree"
            onClick={retry}
          >
            <RefreshCw size={14} />
          </button>
        </div>

        {/* File tree */}
        <FileTree className="flex-1 min-h-0 flex flex-col" />
      </div>

      {/* Editor placeholder */}
      <div className="flex-1 min-w-0 flex items-center justify-center">
        <span className="text-sm text-muted-foreground">
          Select a file to view
        </span>
      </div>
    </div>
  );
};
