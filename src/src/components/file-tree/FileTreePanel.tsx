/**
 * FileTreePanel -- split layout with tree sidebar and lazy-loaded code editor.
 *
 * Left: 240px (w-60) tree sidebar with header, refresh button, and FileTree.
 * Right: flex-1 editor area with EditorTabs + CodeEditor (lazy-loaded).
 *
 * Owns the useFileTree hook instance -- passes results as props to FileTree
 * to avoid duplicate fetches.
 *
 * Constitution: Named export (2.2), design tokens only (3.1), cn() for classes (3.6).
 */

import { lazy, Suspense, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useProjectContext } from '@/hooks/useProjectContext';
import { useFileTree } from '@/hooks/useFileTree';
import { useFileSave } from '@/hooks/useFileSave';
import { useGitStatus } from '@/hooks/useGitStatus';
import { useGitFileMap } from '@/hooks/useGitFileMap';
import { useFileStore } from '@/stores/file';
import { EditorTabs } from '@/components/editor/EditorTabs';
import { contentCache } from '@/components/editor/content-cache';
import { FileTree } from './FileTree';
import './styles/file-tree.css';

const LazyCodeEditor = lazy(() =>
  import('@/components/editor/CodeEditor').then((mod) => ({
    default: mod.CodeEditor,
  })),
);

const LazyDiffEditorWrapper = lazy(() =>
  import('@/components/editor/DiffEditorWrapper').then((mod) => ({
    default: mod.DiffEditorWrapper,
  })),
);

function EditorSkeleton() {
  return (
    <div className="flex-1 flex items-center justify-center animate-pulse bg-[var(--surface-base)]">
      <span className="text-xs text-muted-foreground">Loading editor...</span>
    </div>
  );
}

export interface FileTreePanelProps {
  className?: string;
}

export const FileTreePanel = function FileTreePanel({ className }: FileTreePanelProps) {
  const { projectName } = useProjectContext();
  const { tree, fetchState, retry, projectRoot } = useFileTree(projectName);
  const { save } = useFileSave(projectName);
  const gitStatus = useGitStatus(projectName);
  const gitStatusMap = useGitFileMap(gitStatus.data?.files);
  const activeFilePath = useFileStore((s) => s.activeFilePath);
  const diffFilePath = useFileStore((s) => s.diffFilePath);
  const isDiffMode = diffFilePath != null && diffFilePath === activeFilePath;

  const handleTabSave = useCallback(
    async (filePath: string): Promise<boolean> => {
      const cachedContent = contentCache.get(filePath);
      if (cachedContent === undefined) return false;
      return save(filePath, cachedContent);
    },
    [save],
  );

  return (
    <div className={cn('flex h-full', className)}>
      {/* Tree sidebar */}
      <div className="w-60 shrink-0 border-r border-border/8 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border/8">
          <span className="text-xs font-medium text-foreground uppercase tracking-wider">
            Files
          </span>
          <button
            type="button"
            className="p-1 rounded-sm text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Refresh file tree"
            onClick={retry}
          >
            <RefreshCw size={14} />
          </button>
        </div>

        {/* File tree */}
        <FileTree
          className="flex-1 min-h-0 flex flex-col"
          tree={tree}
          fetchState={fetchState}
          retry={retry}
          projectRoot={projectRoot}
          projectName={projectName}
          gitStatusMap={gitStatusMap}
        />
      </div>

      {/* Editor area */}
      <div className="flex-1 min-w-0 flex flex-col">
        <EditorTabs onSave={handleTabSave} />
        <Suspense fallback={<EditorSkeleton />}>
          {isDiffMode ? (
            <LazyDiffEditorWrapper filePath={activeFilePath} />
          ) : (
            <LazyCodeEditor />
          )}
        </Suspense>
      </div>
    </div>
  );
};
