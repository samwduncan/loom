/**
 * FileIcon -- renders the appropriate lucide-react icon for a file or directory.
 *
 * Uses getFileIcon from file-icons.ts for the mapping logic.
 * Uses createElement to avoid react-hooks/static-components lint violation
 * (JSX with a dynamic component assigned during render is flagged).
 *
 * Constitution: Named exports (2.2), no hardcoded colors (3.1).
 */

import { createElement } from 'react';
import { getFileIcon } from './file-icons';

export interface FileIconProps {
  name: string;
  isDirectory: boolean;
  isExpanded?: boolean;
  className?: string;
  size?: number;
}

export const FileIcon = function FileIcon({
  name,
  isDirectory,
  isExpanded = false,
  className,
  size = 16,
}: FileIconProps) {
  return createElement(getFileIcon(name, isDirectory, isExpanded), { size, className });
};
