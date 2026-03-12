/**
 * DiffEditorWrapper -- data-fetching wrapper for DiffEditor.
 *
 * Uses useFileDiff to fetch old/new content, then renders DiffEditor.
 * Shows loading/error states. Adds data-codemirror attribute for
 * keyboard shortcut escape guard (DiffEditor has CodeMirror merge view).
 *
 * Constitution: Named export (2.2), design tokens (3.1), no inline styles.
 */

import { useProjectContext } from '@/hooks/useProjectContext';
import { useFileDiff } from '@/hooks/useFileDiff';
import { DiffEditor } from '@/components/editor/DiffEditor';

export interface DiffEditorWrapperProps {
  filePath: string;
}

export function DiffEditorWrapper({ filePath }: DiffEditorWrapperProps) {
  const { projectName } = useProjectContext();
  const { oldContent, newContent, loading, error } = useFileDiff(projectName, filePath);

  if (loading) {
    return (
      <div
        data-codemirror=""
        className="flex-1 flex items-center justify-center text-muted-foreground text-sm"
      >
        Loading diff...
      </div>
    );
  }

  if (error) {
    return (
      <div
        data-codemirror=""
        className="flex-1 flex flex-col items-center justify-center gap-2 text-muted-foreground"
      >
        <p className="text-sm text-[var(--status-error)]">Failed to load diff</p>
        <p className="text-xs">{error}</p>
      </div>
    );
  }

  return (
    <div data-codemirror="" className="flex-1 min-h-0 flex flex-col">
      <DiffEditor
        oldContent={oldContent ?? ''}
        newContent={newContent ?? ''}
        filePath={filePath}
      />
    </div>
  );
}
