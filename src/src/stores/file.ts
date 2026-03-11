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
  expandedDirs: new Set<string>(),
  selectedPath: null,
  openTabs: [],
  activeFilePath: null,
};

export const useFileStore = create<FileStore>()((set) => ({
  ...INITIAL_FILE_STATE,

  toggleDir: (path: string) => {
    set((state) => {
      const next = new Set(state.expandedDirs);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return { expandedDirs: next };
    });
  },

  selectPath: (path: string | null) => {
    set({ selectedPath: path });
  },

  openFile: (path: string, fileSize?: number) => {
    set((state) => {
      const alreadyOpen = state.openTabs.some((tab) => tab.filePath === path);
      return {
        activeFilePath: path,
        selectedPath: path,
        openTabs: alreadyOpen
          ? state.openTabs
          : [...state.openTabs, { filePath: path, isDirty: false, fileSize }],
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

  expandDirs: (paths: string[]) => {
    set((state) => {
      const next = new Set(state.expandedDirs);
      for (const p of paths) next.add(p);
      return { expandedDirs: next };
    });
  },

  collapseDirs: (paths: string[]) => {
    set((state) => {
      const next = new Set(state.expandedDirs);
      for (const p of paths) next.delete(p);
      return { expandedDirs: next };
    });
  },

  reset: () => {
    set({ ...INITIAL_FILE_STATE, expandedDirs: new Set<string>() });
  },
}));
