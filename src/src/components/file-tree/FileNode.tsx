/**
 * FileNode -- recursive memoized tree node with indentation, icons, and click handlers.
 *
 * Each node subscribes to its own store slice via granular selectors (isExpanded,
 * isActive) to minimize re-renders. Directories recursively render children when expanded.
 *
 * Filter support: when `filter` prop is set, only renders nodes whose name matches
 * (case-insensitive) or whose descendants match.
 *
 * Constitution: Named export (2.2), memo (2.5), selector-only store (4.2),
 * cn() for classes (3.6), design tokens only (3.1).
 */

import { memo, useCallback } from 'react';
import { ChevronRight } from 'lucide-react';
import { useFileStore } from '@/stores/file';
import { cn } from '@/utils/cn';
import { FileIcon } from './FileIcon';
import type { FileTreeNode } from '@/types/file';
import './file-tree.css';

export interface FileNodeProps {
  node: FileTreeNode;
  depth: number;
  filter?: string;
}

/**
 * Recursively checks if a node or any of its descendants match the filter.
 */
function matchesFilter(node: FileTreeNode, filter: string): boolean {
  const lowerFilter = filter.toLowerCase();
  if (node.name.toLowerCase().includes(lowerFilter)) return true;
  if (node.type === 'directory' && node.children) {
    return node.children.some((child) => matchesFilter(child, lowerFilter));
  }
  return false;
}

export const FileNode = memo(function FileNode({ node, depth, filter }: FileNodeProps) {
  const isExpanded = useFileStore((s) => s.expandedDirs.includes(node.path));
  const isActive = useFileStore((s) => s.activeFilePath === node.path);
  const toggleDir = useFileStore((s) => s.toggleDir);
  const openFile = useFileStore((s) => s.openFile);

  const handleClick = useCallback(() => {
    if (node.type === 'directory') {
      toggleDir(node.path);
    } else {
      openFile(node.path);
    }
  }, [node.type, node.path, toggleDir, openFile]);

  // Filter check: skip this node if it doesn't match
  if (filter && !matchesFilter(node, filter)) {
    return null;
  }

  const isDirectory = node.type === 'directory';

  return (
    <>
      <button
        type="button"
        data-testid="file-node-row"
        className={cn(
          'file-node flex w-full items-center gap-1.5 rounded-sm px-1.5 py-0.5 text-left text-xs',
          isActive && 'file-node-active',
        )}
        style={{ '--depth': depth } as React.CSSProperties}
        onClick={handleClick}
      >
        {/* Chevron for directories */}
        {isDirectory ? (
          <ChevronRight
            data-testid="file-node-chevron"
            size={14}
            className={cn(
              'shrink-0 text-muted-foreground transition-transform duration-100',
              isExpanded && 'rotate-90',
            )}
          />
        ) : (
          <span className="w-3.5 shrink-0" aria-hidden="true" />
        )}

        <FileIcon
          name={node.name}
          isDirectory={isDirectory}
          isExpanded={isExpanded}
          size={14}
          className="shrink-0 text-muted-foreground"
        />

        <span className="truncate text-foreground">{node.name}</span>
      </button>

      {/* Recursively render children when expanded */}
      {isDirectory && isExpanded && node.children?.map((child) => (
        <FileNode
          key={child.path}
          node={child}
          depth={depth + 1}
          filter={filter}
        />
      ))}
    </>
  );
});
