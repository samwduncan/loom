/**
 * File Store — File tree, editor tabs, and file selection state.
 *
 * 5th Zustand store per M3 architectural decision. No persist middleware
 * (file state is ephemeral per session).
 *
 * Constitution: Selector-only access (4.2), named actions (4.5), no default export (2.2).
 */

import { create } from 'zustand';
import type { FileState, FileStore } from '@/types/file';

const INITIAL_FILE_STATE: FileState = {
  expandedDirs: [],
  selectedPath: null,
  openTabs: [],
  activeFilePath: null,
};

export const useFileStore = create<FileStore>()((set) => ({
  ...INITIAL_FILE_STATE,

  // Stub actions — throw in dev to surface wiring mistakes early.
  // Full implementation deferred to Phase 23 when consumers exist.
  toggleDir: () => { if (import.meta.env.DEV) throw new Error('FileStore.toggleDir not implemented — Phase 23'); },
  selectPath: () => { if (import.meta.env.DEV) throw new Error('FileStore.selectPath not implemented — Phase 23'); },
  openFile: () => { if (import.meta.env.DEV) throw new Error('FileStore.openFile not implemented — Phase 23'); },
  closeFile: () => { if (import.meta.env.DEV) throw new Error('FileStore.closeFile not implemented — Phase 23'); },
  setDirty: () => { if (import.meta.env.DEV) throw new Error('FileStore.setDirty not implemented — Phase 23'); },
  setActiveFile: () => { if (import.meta.env.DEV) throw new Error('FileStore.setActiveFile not implemented — Phase 23'); },

  reset: () => {
    set({ ...INITIAL_FILE_STATE });
  },
}));
