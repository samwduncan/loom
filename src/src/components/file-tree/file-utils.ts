/**
 * file-utils -- shared utilities for file tree filtering and classification.
 *
 * Separated from components for react-refresh compatibility and DRY.
 */

import type { FileTreeNode } from '@/types/file';

export const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico']);

/**
 * Checks if a file name has an image extension.
 */
export function isImageFile(name: string): boolean {
  const dotIndex = name.lastIndexOf('.');
  if (dotIndex === -1 || dotIndex === 0) return false;
  const ext = name.slice(dotIndex).toLowerCase();
  return IMAGE_EXTENSIONS.has(ext);
}

/**
 * Recursively checks if a node or any of its descendants match the filter.
 */
export function matchesFilter(node: FileTreeNode, filter: string): boolean {
  const lower = filter.toLowerCase();
  if (node.name.toLowerCase().includes(lower)) return true;
  if (node.type === 'directory' && node.children) {
    return node.children.some((child) => matchesFilter(child, lower));
  }
  return false;
}

/**
 * Recursively filters dotfiles from a tree. Returns a new tree with
 * dotfiles/dotdirs removed at all nesting levels.
 */
export function filterHiddenNodes(nodes: FileTreeNode[]): FileTreeNode[] {
  return nodes
    .filter((node) => !node.name.startsWith('.'))
    .map((node) => {
      if (node.type === 'directory' && node.children) {
        return { ...node, children: filterHiddenNodes(node.children) };
      }
      return node;
    });
}
