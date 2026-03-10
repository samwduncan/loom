/**
 * File icon mapping -- maps file extensions to lucide-react icon components.
 *
 * Separated from FileIcon.tsx for react-refresh compatibility
 * (files exporting components should only export components).
 */

import {
  File,
  FileCode,
  FileJson,
  FileText,
  ImageIcon,
  Folder,
  FolderOpen,
  Cog,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const CODE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);
const TEXT_EXTENSIONS = new Set(['.css', '.md', '.txt', '.html', '.htm']);
const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico']);
const CONFIG_EXTENSIONS = new Set(['.yaml', '.yml', '.toml', '.env', '.ini', '.conf']);

function getExtension(name: string): string {
  // Handle dotfiles like .env
  if (name.startsWith('.') && !name.includes('.', 1)) {
    return name; // ".env" -> ".env"
  }
  const lastDot = name.lastIndexOf('.');
  return lastDot > 0 ? name.slice(lastDot) : '';
}

export function getFileIcon(
  name: string,
  isDirectory: boolean,
  isExpanded: boolean,
): LucideIcon {
  if (isDirectory) {
    return isExpanded ? FolderOpen : Folder;
  }

  const ext = getExtension(name).toLowerCase();

  if (CODE_EXTENSIONS.has(ext)) return FileCode;
  if (ext === '.json') return FileJson;
  if (TEXT_EXTENSIONS.has(ext)) return FileText;
  if (IMAGE_EXTENSIONS.has(ext)) return ImageIcon;
  if (CONFIG_EXTENSIONS.has(ext)) return Cog;

  return File;
}
