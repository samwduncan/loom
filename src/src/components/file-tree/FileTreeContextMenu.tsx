/**
 * FileTreeContextMenu -- right-click context menus for file and directory nodes.
 *
 * FileContextMenu: Copy Path, Copy Relative Path, Open in Editor.
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
import { sendToShell } from '@/lib/shell-input';
import type { FileTreeNode } from '@/types/file';

export interface FileContextMenuProps {
  children: ReactNode;
  filePath: string;
  projectRoot: string | null;
}

export interface DirContextMenuProps {
  children: ReactNode;
  node: FileTreeNode;
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

/**
 * Copy text to clipboard with toast feedback.
 */
function copyToClipboard(text: string): void {
  navigator.clipboard.writeText(text).then(
    () => toast.success('Copied to clipboard'),
    () => toast.error('Failed to copy to clipboard'),
  );
}

export const FileContextMenu = function FileContextMenu({
  children,
  filePath,
  projectRoot,
}: FileContextMenuProps) {
  const openFile = useFileStore((s) => s.openFile);
  const setActiveTab = useUIStore((s) => s.setActiveTab);

  const handleCopyPath = () => {
    copyToClipboard(filePath);
  };

  const handleCopyRelativePath = () => {
    copyToClipboard(toRelativePath(filePath, projectRoot));
  };

  const handleOpenInEditor = () => {
    openFile(filePath);
  };

  const handleOpenInTerminal = () => {
    const dirPath = filePath.slice(0, filePath.lastIndexOf('/'));
    setActiveTab('shell');
    const escaped = dirPath.replace(/'/g, "'\\''");
    const sent = sendToShell(`cd '${escaped}'\r`);
    if (!sent) {
      toast.error('Terminal not connected');
    }
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
        <ContextMenuSeparator />
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
  node,
}: DirContextMenuProps) {
  const expandDirs = useFileStore((s) => s.expandDirs);
  const collapseDirs = useFileStore((s) => s.collapseDirs);

  const handleCopyPath = () => {
    copyToClipboard(node.path);
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
