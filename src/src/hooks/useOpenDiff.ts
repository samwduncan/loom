/**
 * useOpenDiff -- hook for opening files in diff mode from any component.
 *
 * Switches to the Files tab, opens the file, and sets diffFilePath so
 * FileTreePanel renders DiffEditorWrapper instead of CodeEditor.
 *
 * Constitution: Named export (2.2), selector hooks (4.2), useCallback (perf).
 */

import { useCallback } from 'react';
import { useFileStore } from '@/stores/file';
import { useUIStore } from '@/stores/ui';

export function useOpenDiff(): (filePath: string) => void {
  const openFile = useFileStore((s) => s.openFile);
  const openDiff = useFileStore((s) => s.openDiff);
  const setActiveTab = useUIStore((s) => s.setActiveTab);

  return useCallback(
    (filePath: string) => {
      setActiveTab('files');
      openFile(filePath);
      openDiff(filePath);
    },
    [setActiveTab, openFile, openDiff],
  );
}
