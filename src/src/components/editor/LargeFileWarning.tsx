/**
 * LargeFileWarning -- shown when a file exceeds the 1MB threshold.
 *
 * Displays formatted size and offers Open Anyway / Cancel actions.
 * Uses shadcn Button for Constitution-compliant styling.
 *
 * Constitution: Named export (2.2), design tokens only (7.14).
 */

import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface LargeFileWarningProps {
  filePath: string;
  fileSize: number;
  onProceed: () => void;
  onCancel: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
}

export function LargeFileWarning({ filePath, fileSize, onProceed, onCancel }: LargeFileWarningProps) {
  const filename = filePath.split('/').pop() ?? filePath;

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
      <AlertTriangle className="w-10 h-10 text-[var(--status-warning)]" />
      <div className="text-center space-y-1">
        <p className="text-sm text-foreground">Large file</p>
        <p className="text-xs font-[family-name:var(--font-mono)]">{filename}</p>
        <p className="text-xs">{formatFileSize(fileSize)}</p>
      </div>
      <p className="text-xs max-w-[280px] text-center">
        Opening large files may affect editor performance.
      </p>
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" onClick={onProceed}>
          Open Anyway
        </Button>
      </div>
    </div>
  );
}
