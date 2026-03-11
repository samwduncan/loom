/**
 * useOpenInEditor -- shared hook for opening files from any component.
 *
 * Switches to the Files tab and opens the file in the editor.
 * Used by tool cards (Read, Edit, Write) to make file paths clickable.
 *
 * Constitution: Named export (2.2), selector hooks (4.2), useCallback (perf).
 */

import { useCallback } from 'react';
import { useFileStore } from '@/stores/file';
import { useUIStore } from '@/stores/ui';

export function useOpenInEditor(): (filePath: string) => void {
  const openFile = useFileStore((s) => s.openFile);
  const setActiveTab = useUIStore((s) => s.setActiveTab);

  return useCallback(
    (filePath: string) => {
      setActiveTab('files');
      openFile(filePath);
    },
    [setActiveTab, openFile],
  );
}
