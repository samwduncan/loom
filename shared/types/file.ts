/**
 * File store types -- file tree, editor tabs, and file selection state.
 *
 * Consumed by the 5th Zustand store (useFileStore) and future file tree,
 * code editor, and git panel components.
 *
 * Uses Set<string> for expandedDirs (O(1) lookups, no persist middleware).
 */

export interface FileTab {
  filePath: string;
  isDirty: boolean;
  fileSize?: number;
}

export interface FileState {
  expandedDirs: Set<string>;
  selectedPath: string | null;
  openTabs: FileTab[];
  activeFilePath: string | null;
  diffFilePath: string | null;
}

export interface FileActions {
  toggleDir: (path: string) => void;
  selectPath: (path: string | null) => void;
  openFile: (path: string, fileSize?: number) => void;
  closeFile: (path: string) => void;
  setDirty: (path: string, isDirty: boolean) => void;
  setActiveFile: (path: string | null) => void;
  openDiff: (path: string) => void;
  closeDiff: () => void;
  expandDirs: (paths: string[]) => void;
  collapseDirs: (paths: string[]) => void;
  reset: () => void;
}

export type FileStore = FileState & FileActions;

/**
 * FileEntry -- flat file reference from project file search endpoints.
 *
 * Used by command palette search, file mention picker, and any feature
 * that works with the flat /api/projects/:name/files listing.
 */
export interface FileEntry {
  path: string;
  name: string;
  type: 'file' | 'directory';
}

/**
 * FileTreeNode -- matches backend response shape from
 * GET /api/projects/:projectName/files
 *
 * Recursive tree structure: directories have children array.
 */
export interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size: number;
  modified: string | null;
  children?: FileTreeNode[];
}
