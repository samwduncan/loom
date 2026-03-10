/**
 * File Store -- File tree, editor tabs, and file selection state.
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

  toggleDir: (path: string) => {
    set((state) => ({
      expandedDirs: state.expandedDirs.includes(path)
        ? state.expandedDirs.filter((d) => d !== path)
        : [...state.expandedDirs, path],
    }));
  },

  selectPath: (path: string | null) => {
    set({ selectedPath: path });
  },

  openFile: (path: string) => {
    set((state) => {
      const alreadyOpen = state.openTabs.some((tab) => tab.filePath === path);
      return {
        activeFilePath: path,
        selectedPath: path,
        openTabs: alreadyOpen
          ? state.openTabs
          : [...state.openTabs, { filePath: path, isDirty: false }],
      };
    });
  },

  closeFile: (path: string) => {
    set((state) => {
      const remaining = state.openTabs.filter((tab) => tab.filePath !== path);
      const isClosingActive = state.activeFilePath === path;
      return {
        openTabs: remaining,
        activeFilePath: isClosingActive
          ? (remaining[remaining.length - 1]?.filePath ?? null)
          : state.activeFilePath,
      };
    });
  },

  setDirty: (path: string, isDirty: boolean) => {
    set((state) => ({
      openTabs: state.openTabs.map((tab) =>
        tab.filePath === path ? { ...tab, isDirty } : tab,
      ),
    }));
  },

  setActiveFile: (path: string | null) => {
    set({ activeFilePath: path });
  },

  reset: () => {
    set({ ...INITIAL_FILE_STATE });
  },
}));
