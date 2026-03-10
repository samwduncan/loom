/**
 * File Store — File tree, editor tabs, and file selection state.
 *
 * 5th Zustand store per M3 architectural decision. No persist middleware
 * (file state is ephemeral per session).
 *
 * Constitution: Selector-only access (4.2), named actions (4.5), no default export (2.2).
 */

import { create } from 'zustand';
import type { FileStore } from '@/types/file';

const INITIAL_FILE_STATE = {
  expandedDirs: [] as string[],
  selectedPath: null as string | null,
  openTabs: [] as { filePath: string; isDirty: boolean }[],
  activeFilePath: null as string | null,
};

export const useFileStore = create<FileStore>()((set) => ({
  ...INITIAL_FILE_STATE,

  // Stub actions — full implementation deferred to Phase 23 when consumers exist
  toggleDir: () => {},
  selectPath: () => {},
  openFile: () => {},
  closeFile: () => {},
  setDirty: () => {},
  setActiveFile: () => {},

  reset: () => {
    set({ ...INITIAL_FILE_STATE });
  },
}));
