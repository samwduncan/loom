/**
 * FileTree -- tree container with loading/error/success states.
 *
 * Receives tree data as props from FileTreePanel (single hook instance).
 * Manages search filter and hidden-file visibility, renders FileNode recursively.
 *
 * Constitution: Named export (2.2), selector-only store (4.2),
 * cn() for classes (3.6), design tokens only (3.1).
 */

import { useState, useMemo } from 'react';
import { Search, FolderOpen } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/EmptyState';
import { FileNode } from './FileNode';
import { FileTreeSearch } from './FileTreeSearch';
import { matchesFilter, filterHiddenNodes } from './file-utils';
import type { FileTreeNode } from '@/types/file';
import type { GitFileStatus } from '@/types/git';

export interface FileTreeProps {
  className?: string;
  tree: FileTreeNode[];
  fetchState: 'idle' | 'loading' | 'error' | 'success';
  retry: () => void;
  projectRoot: string | null;
  projectName: string;
  gitStatusMap?: Map<string, GitFileStatus>;
}

export const FileTree = function FileTree({
  className,
  tree,
  fetchState,
  retry,
  projectRoot,
  projectName,
  gitStatusMap,
}: FileTreeProps) {
  const [filter, setFilter] = useState('');

  // Filter: remove dotfiles recursively, then apply search filter
  const visibleTree = useMemo(() => {
    const filtered = filterHiddenNodes(tree);

    if (filter) {
      return filtered.filter((node) => matchesFilter(node, filter));
    }

    return filtered;
  }, [tree, filter]);

  // Loading skeleton
  if (fetchState === 'idle' || fetchState === 'loading') {
    return (
      <div data-testid="file-tree-skeleton" className={className} role="status" aria-label="Loading file tree">
        <div className="px-2 py-1 space-y-1.5">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div
                className="h-3 skeleton-shimmer rounded-sm file-node"
                style={{ '--depth': Math.min(i % 4, 2), width: i % 3 === 0 ? '60%' : i % 2 === 0 ? '45%' : '70%' } as React.CSSProperties}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (fetchState === 'error') {
    return (
      <div className={className}>
        <div className="flex flex-col items-center gap-2 px-3 py-6 text-center">
          <p className="text-xs text-muted-foreground">Failed to load file tree</p>
          <Button variant="outline" size="xs" onClick={retry}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Success state -- no project selected (empty tree with no active filter)
  if (tree.length === 0 && !filter) {
    return (
      <div className={className}>
        <EmptyState
          icon={<FolderOpen className="size-8" />}
          heading="No project selected"
          description="Select a project from the sidebar to browse files"
        />
      </div>
    );
  }

  const hasFilteredResults = visibleTree.length > 0;

  return (
    <div className={className}>
      <div className="px-1.5 py-1">
        <FileTreeSearch value={filter} onChange={setFilter} />
      </div>
      <ScrollArea className="flex-1">
        <div className="px-1 py-0.5" role="tree" aria-label="Project files">
          {hasFilteredResults ? (
            visibleTree.map((node) => (
              <FileNode key={node.path} node={node} depth={0} filter={filter || undefined} projectRoot={projectRoot} projectName={projectName} gitStatusMap={gitStatusMap} />
            ))
          ) : (
            <EmptyState
              icon={<Search className="size-8" />}
              heading="No files match filter"
              description="Try adjusting your search terms"
            />
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
