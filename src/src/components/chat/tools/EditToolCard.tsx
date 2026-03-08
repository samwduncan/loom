/**
 * EditToolCard -- unified diff view for Edit tool calls.
 *
 * Shows file path with FilePen icon, and a colored diff with dual line numbers.
 * Green for additions (bg-diff-added), red for deletions (bg-diff-removed),
 * transparent for context lines. No Shiki highlighting inside diffs (line coloring only).
 *
 * Constitution: Named exports only (2.2), cn() for classNames (3.6), memo() wrapped.
 */

import { memo, useMemo } from 'react';
import { FilePen } from 'lucide-react';
import { cn } from '@/utils/cn';
import { computeDiff } from '@/lib/diff-parser';
import type { DiffLine } from '@/lib/diff-parser';
import type { ToolCardProps } from '@/lib/tool-registry';

export const EditToolCard = memo(function EditToolCard({
  input,
  output,
}: ToolCardProps) {
  const filePath =
    typeof input.file_path === 'string' ? input.file_path : 'unknown';
  const oldString =
    typeof input.old_string === 'string' ? input.old_string : null;
  const newString =
    typeof input.new_string === 'string' ? input.new_string : null;

  const diffLines = useMemo((): DiffLine[] | null => {
    // Both present: compute diff
    if (oldString != null && newString != null) {
      return computeDiff(oldString, newString, 3);
    }
    // Only new_string (empty old_string): pure addition
    if (oldString != null && oldString === '' && newString != null) {
      return newString.split('\n').map((line, i) => ({
        type: 'added' as const,
        content: line,
        oldLineNo: null,
        newLineNo: i + 1,
      }));
    }
    // Only new_string, old_string missing entirely
    if (oldString == null && newString != null) {
      return newString.split('\n').map((line, i) => ({
        type: 'added' as const,
        content: line,
        oldLineNo: null,
        newLineNo: i + 1,
      }));
    }
    // Only old_string, new_string missing
    if (oldString != null && newString == null) {
      return oldString.split('\n').map((line, i) => ({
        type: 'removed' as const,
        content: line,
        oldLineNo: i + 1,
        newLineNo: null,
      }));
    }
    // Neither present
    return null;
  }, [oldString, newString]);

  return (
    <div className="rounded-md overflow-hidden bg-[var(--surface-base)]">
      {/* File path header */}
      <div
        className={cn(
          'flex items-center gap-1.5 px-3 py-2',
          'border-b border-[var(--border-subtle)]',
        )}
      >
        <FilePen size={14} className="text-[var(--text-muted)] shrink-0" />
        <span className="font-[family-name:var(--font-mono)] text-xs text-[var(--text-muted)] truncate">
          {filePath}
        </span>
      </div>

      {/* Diff content */}
      {diffLines != null && diffLines.length > 0 && (
        <div className="overflow-x-auto font-[family-name:var(--font-mono)] text-sm">
          {diffLines.map((line, i) => (
            <DiffLineRow key={i} line={line} />
          ))}
        </div>
      )}

      {/* Identical strings -- no changes */}
      {diffLines != null && diffLines.length === 0 && (
        <div className="px-3 py-2 text-xs text-[var(--text-muted)] italic">
          No changes
        </div>
      )}

      {/* Fallback: no diff data, show raw output */}
      {diffLines == null && output != null && (
        <pre className="px-3 py-2 whitespace-pre font-[family-name:var(--font-mono)] text-sm text-[var(--text-primary)] overflow-x-auto">
          {output}
        </pre>
      )}

      {/* No data at all */}
      {diffLines == null && output == null && (
        <div className="px-3 py-2 text-xs text-[var(--text-muted)] italic">
          No content
        </div>
      )}
    </div>
  );
});

// ---------------------------------------------------------------------------
// DiffLineRow -- single line in the diff view
// ---------------------------------------------------------------------------

const SIGN_MAP: Record<DiffLine['type'], string> = {
  added: '+',
  removed: '-',
  context: ' ',
};

const BG_MAP: Record<DiffLine['type'], string> = {
  added: 'bg-diff-added',
  removed: 'bg-diff-removed',
  context: '',
};

function DiffLineRow({ line }: { line: DiffLine }) {
  return (
    <div className={cn('flex', BG_MAP[line.type])}>
      {/* Old line number gutter */}
      <span className="w-10 text-right pr-2 text-[var(--text-muted)] select-none shrink-0 opacity-50">
        {line.oldLineNo ?? ''}
      </span>
      {/* New line number gutter */}
      <span className="w-10 text-right pr-2 text-[var(--text-muted)] select-none shrink-0 opacity-50">
        {line.newLineNo ?? ''}
      </span>
      {/* Sign column */}
      <span className="w-4 select-none shrink-0 text-center">
        {SIGN_MAP[line.type]}
      </span>
      {/* Content */}
      <span className="whitespace-pre overflow-x-auto">
        {line.content}
      </span>
    </div>
  );
}
