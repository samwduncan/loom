/**
 * File store types — file tree, editor tabs, and file selection state.
 *
 * Consumed by the 5th Zustand store (useFileStore) and future file tree,
 * code editor, and git panel components.
 *
 * Uses string[] for expandedDirs (not Set) to avoid JSON serialization issues.
 */

export interface FileTab {
  filePath: string;
  isDirty: boolean;
}

export interface FileState {
  expandedDirs: string[];
  selectedPath: string | null;
  openTabs: FileTab[];
  activeFilePath: string | null;
}

export interface FileActions {
  toggleDir: (path: string) => void;
  selectPath: (path: string | null) => void;
  openFile: (path: string) => void;
  closeFile: (path: string) => void;
  setDirty: (path: string, isDirty: boolean) => void;
  setActiveFile: (path: string | null) => void;
  reset: () => void;
}

export type FileStore = FileState & FileActions;
