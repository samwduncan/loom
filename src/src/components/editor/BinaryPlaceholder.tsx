/**
 * BinaryPlaceholder -- shown when a non-text binary file is opened.
 *
 * Displays a centered message with FileX icon indicating the file
 * cannot be rendered as text.
 *
 * Constitution: Named export (2.2), design tokens only (7.14).
 */

import { FileX } from 'lucide-react';

export interface BinaryPlaceholderProps {
  filePath: string;
}

export function BinaryPlaceholder({ filePath }: BinaryPlaceholderProps) {
  const filename = filePath.split('/').pop() ?? filePath;

  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
      <FileX className="w-10 h-10 opacity-50" />
      <p className="text-sm">Binary file -- cannot display</p>
      <p className="text-xs opacity-60 font-[family-name:var(--font-mono)]">{filename}</p>
    </div>
  );
}
