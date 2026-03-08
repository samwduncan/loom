/**
 * GlobToolCard -- file list card for glob results.
 *
 * Shows glob pattern, file count, and bulleted file list with
 * file-type icons. Truncates at 20 files via TruncatedContent.
 *
 * Constitution: Named exports only (2.2), cn() for classNames (3.6), memo() wrapped.
 */

import { memo, useMemo } from 'react';
import { FileCode, FileText, Folder } from 'lucide-react';
import { cn } from '@/utils/cn';
import { TruncatedContent } from './TruncatedContent';
import type { ToolCardProps } from '@/lib/tool-registry';

const GLOB_TRUNCATION_THRESHOLD = 20;

const CODE_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.py', '.rs', '.go', '.java',
  '.c', '.cpp', '.rb', '.cs', '.swift', '.kt', '.vue', '.svelte',
]);

function getFileIcon(path: string) {
  if (path.endsWith('/')) {
    return <Folder size={14} className="text-[var(--text-muted)] shrink-0" />;
  }
  const dotIdx = path.lastIndexOf('.');
  if (dotIdx !== -1 && CODE_EXTENSIONS.has(path.slice(dotIdx))) {
    return <FileCode size={14} className="text-[var(--text-muted)] shrink-0" />;
  }
  return <FileText size={14} className="text-[var(--text-muted)] shrink-0" />;
}

function truncatePath(path: string, maxLen = 60): string {
  if (path.length <= maxLen) return path;
  return '...' + path.slice(-(maxLen - 3));
}

export const GlobToolCard = memo(function GlobToolCard({
  input,
  output,
}: ToolCardProps) {
  const pattern = typeof input.pattern === 'string' ? input.pattern : '*';

  const files = useMemo(() => {
    if (output == null) return null;
    return output.split('\n').filter((line) => line.trim() !== '');
  }, [output]);

  return (
    <div
      className={cn(
        'rounded-md overflow-hidden',
        'bg-[var(--surface-base)] text-[length:var(--text-body)]',
      )}
    >
      {/* Pattern header */}
      <div
        className={cn(
          'px-3 py-2',
          'border-b border-[var(--border-subtle)]',
        )}
      >
        <code className="text-xs text-[var(--text-muted)] font-[family-name:var(--font-mono)]">
          {pattern}
        </code>
        {files != null && (
          <span className="text-xs text-[var(--text-muted)] ml-2">
            {files.length} {files.length === 1 ? 'file' : 'files'} found
          </span>
        )}
      </div>

      {/* File list */}
      {files != null && files.length > 0 && (
        <div className="px-3 py-2">
          <TruncatedContent
            items={files}
            threshold={GLOB_TRUNCATION_THRESHOLD}
            unit="files"
            renderItem={renderFileItem}
          />
        </div>
      )}
    </div>
  );
});

function renderFileItem(filePath: string, index: number) {
  return (
    <div
      key={index}
      className="flex items-center gap-2 py-0.5 font-[family-name:var(--font-mono)] text-xs text-[var(--text-secondary)]"
    >
      {getFileIcon(filePath)}
      <span>{truncatePath(filePath)}</span>
    </div>
  );
}
