/**
 * FileNode -- recursive memoized tree node with indentation, icons, and click handlers.
 *
 * Each node subscribes to its own store slice via granular selectors (isExpanded,
 * isActive) to minimize re-renders. Directories recursively render children when expanded.
 *
 * Wraps file nodes in FileContextMenu and directory nodes in DirContextMenu.
 * Image files open ImagePreview dialog instead of setting active file.
 *
 * Filter support: when `filter` prop is set, only renders nodes whose name matches
 * (case-insensitive) or whose descendants match.
 *
 * Constitution: Named export (2.2), memo (2.5), selector-only store (4.2),
 * cn() for classes (3.6), design tokens only (3.1).
 */

import { memo, useCallback, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useFileStore } from '@/stores/file';
import { cn } from '@/utils/cn';
import { FileIcon } from './FileIcon';
import { FileContextMenu, DirContextMenu } from './FileTreeContextMenu';
import { ImagePreview } from './ImagePreview';
import { isImageFile, matchesFilter } from './file-utils';
import type { FileTreeNode } from '@/types/file';
import type { GitFileStatus } from '@/types/git';
import './styles/file-tree.css';

export interface FileNodeProps {
  node: FileTreeNode;
  depth: number;
  filter?: string;
  projectRoot?: string | null;
  projectName?: string;
  gitStatusMap?: Map<string, GitFileStatus>;
}

export const FileNode = memo(function FileNode({ node, depth, filter, projectRoot, projectName, gitStatusMap }: FileNodeProps) {
  const isExpanded = useFileStore((s) => s.expandedDirs.has(node.path));
  const isActive = useFileStore((s) => s.activeFilePath === node.path);
  const toggleDir = useFileStore((s) => s.toggleDir);
  const openFile = useFileStore((s) => s.openFile);

  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);

  const isDirectory = node.type === 'directory';
  const isImage = !isDirectory && isImageFile(node.name);
  const gitStatus = gitStatusMap?.get(node.path);

  const handleClick = useCallback(() => {
    if (isDirectory) {
      toggleDir(node.path);
    } else if (isImage) {
      setImagePreviewOpen(true);
    } else {
      openFile(node.path, node.size);
    }
  }, [isDirectory, node.path, node.size, toggleDir, openFile, isImage]);

  // Filter check: skip this node if it doesn't match
  if (filter && !matchesFilter(node, filter)) {
    return null;
  }

  const rowContent = (
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

      {gitStatus && (
        <span
          className="file-node-status"
          data-status={gitStatus}
          data-testid="file-node-status"
          aria-label={`Git status: ${gitStatus}`}
        />
      )}
    </button>
  );

  const wrappedRow = isDirectory ? (
    <DirContextMenu node={node}>
      {rowContent}
    </DirContextMenu>
  ) : (
    <FileContextMenu filePath={node.path} projectRoot={projectRoot ?? null}>
      {rowContent}
    </FileContextMenu>
  );

  return (
    <>
      {wrappedRow}

      {/* Image preview dialog */}
      {isImage && (
        <ImagePreview
          filePath={node.path}
          fileName={node.name}
          open={imagePreviewOpen}
          onOpenChange={setImagePreviewOpen}
          projectName={projectName ?? ''}
        />
      )}

      {/* Recursively render children when expanded */}
      {isDirectory && isExpanded && node.children?.map((child) => (
        <FileNode
          key={child.path}
          node={child}
          depth={depth + 1}
          filter={filter}
          projectRoot={projectRoot}
          projectName={projectName}
          gitStatusMap={gitStatusMap}
        />
      ))}
    </>
  );
});
