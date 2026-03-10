/**
 * FileTreeContextMenu -- right-click context menus for file and directory nodes.
 *
 * FileContextMenu: Copy Path, Copy Relative Path, Open in Editor, Open in Terminal.
 * DirContextMenu: Copy Path, Expand All, Collapse All.
 *
 * Uses shadcn ContextMenu wrapping Radix primitives.
 * Store actions accessed via selector hooks per Constitution (4.2, 4.5).
 *
 * Constitution: Named export (2.2), design tokens (3.1), cn() for classes (3.6).
 */

import type { ReactNode } from 'react';
import { Copy, FileText, Terminal, ChevronsUpDown, ChevronsDownUp } from 'lucide-react';
import { toast } from 'sonner';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { useFileStore } from '@/stores/file';
import { useUIStore } from '@/stores/ui';
import type { FileTreeNode } from '@/types/file';

export interface FileContextMenuProps {
  children: ReactNode;
  filePath: string;
  projectRoot: string | null;
}

export interface DirContextMenuProps {
  children: ReactNode;
  dirPath: string;
  node: FileTreeNode;
  projectRoot: string | null;
}

/**
 * Strips projectRoot prefix from a path to produce a relative path.
 * Falls back to full path if projectRoot is null or not a prefix.
 */
function toRelativePath(filePath: string, projectRoot: string | null): string {
  if (!projectRoot || !filePath.startsWith(projectRoot)) return filePath;
  const relative = filePath.slice(projectRoot.length);
  return relative.startsWith('/') ? relative.slice(1) : relative;
}

/**
 * Recursively collects all directory paths from a FileTreeNode.
 */
function getAllDirPaths(node: FileTreeNode): string[] {
  const paths: string[] = [];
  if (node.type === 'directory') {
    paths.push(node.path);
    if (node.children) {
      for (const child of node.children) {
        paths.push(...getAllDirPaths(child));
      }
    }
  }
  return paths;
}

export const FileContextMenu = function FileContextMenu({
  children,
  filePath,
  projectRoot,
}: FileContextMenuProps) {
  const openFile = useFileStore((s) => s.openFile);
  const setActiveTab = useUIStore((s) => s.setActiveTab);

  const handleCopyPath = () => {
    navigator.clipboard.writeText(filePath);
    toast.success('Copied to clipboard');
  };

  const handleCopyRelativePath = () => {
    navigator.clipboard.writeText(toRelativePath(filePath, projectRoot));
    toast.success('Copied to clipboard');
  };

  const handleOpenInEditor = () => {
    openFile(filePath);
  };

  const handleOpenInTerminal = () => {
    setActiveTab('shell');
    // TODO: Phase 25 -- send cd command to terminal
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onSelect={handleCopyPath}>
          <Copy size={14} />
          Copy Path
        </ContextMenuItem>
        <ContextMenuItem onSelect={handleCopyRelativePath}>
          <Copy size={14} />
          Copy Relative Path
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={handleOpenInEditor}>
          <FileText size={14} />
          Open in Editor
        </ContextMenuItem>
        <ContextMenuItem onSelect={handleOpenInTerminal}>
          <Terminal size={14} />
          Open in Terminal
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

export const DirContextMenu = function DirContextMenu({
  children,
  dirPath: _dirPath,
  node,
  projectRoot: _projectRoot,
}: DirContextMenuProps) {
  const expandDirs = useFileStore((s) => s.expandDirs);
  const collapseDirs = useFileStore((s) => s.collapseDirs);

  const handleCopyPath = () => {
    navigator.clipboard.writeText(node.path);
    toast.success('Copied to clipboard');
  };

  const handleExpandAll = () => {
    expandDirs(getAllDirPaths(node));
  };

  const handleCollapseAll = () => {
    collapseDirs(getAllDirPaths(node));
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onSelect={handleCopyPath}>
          <Copy size={14} />
          Copy Path
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={handleExpandAll}>
          <ChevronsUpDown size={14} />
          Expand All
        </ContextMenuItem>
        <ContextMenuItem onSelect={handleCollapseAll}>
          <ChevronsDownUp size={14} />
          Collapse All
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};
