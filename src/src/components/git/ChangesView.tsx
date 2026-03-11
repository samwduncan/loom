/**
 * ChangesView -- file list grouped by status with staging checkboxes and commit composer.
 *
 * Groups changed files into Modified/Added/Deleted/Untracked sections.
 * Client-side staging model (Set<string>) -- checking files adds them to the commit set.
 * Discard per-file with confirmation AlertDialog.
 *
 * Constitution: Named export (2.2), cn() for classes (3.6), token-based styling (3.1).
 */

import { useState, useCallback } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useProjectContext } from '@/hooks/useProjectContext';
import { useGitOperations } from '@/hooks/useGitOperations';
import { useOpenInEditor } from '@/hooks/useOpenInEditor';
import { ChangedFileRow } from '@/components/git/ChangedFileRow';
import { CommitComposer } from '@/components/git/CommitComposer';
import type { GitFileChange, GitFileStatus } from '@/types/git';

interface ChangesViewProps {
  files: GitFileChange[];
  refetchStatus: () => void;
}

/** Section display order and labels */
const SECTIONS: { status: GitFileStatus; label: string }[] = [
  { status: 'modified', label: 'Modified' },
  { status: 'added', label: 'Added' },
  { status: 'deleted', label: 'Deleted' },
  { status: 'untracked', label: 'Untracked' },
];

export function ChangesView({ files, refetchStatus }: ChangesViewProps) {
  const { projectName } = useProjectContext();
  const ops = useGitOperations(projectName);
  const openInEditor = useOpenInEditor();

  const [stagedFiles, setStagedFiles] = useState<Set<string>>(new Set());
  const [discardTarget, setDiscardTarget] = useState<GitFileChange | null>(null);

  // Group files by status
  const grouped = new Map<GitFileStatus, GitFileChange[]>();
  for (const file of files) {
    const group = grouped.get(file.status) ?? [];
    group.push(file);
    grouped.set(file.status, group);
  }

  const handleToggleStage = useCallback((path: string) => {
    setStagedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setStagedFiles(new Set(files.map((f) => f.path)));
  }, [files]);

  const handleDeselectAll = useCallback(() => {
    setStagedFiles(new Set());
  }, []);

  const handleClickFile = useCallback(
    (path: string) => {
      openInEditor(path);
    },
    [openInEditor],
  );

  const handleRequestDiscard = useCallback((file: GitFileChange) => {
    setDiscardTarget(file);
  }, []);

  const handleConfirmDiscard = useCallback(async () => {
    if (!discardTarget) return;

    try {
      if (discardTarget.status === 'untracked') {
        await ops.deleteUntracked(discardTarget.path);
      } else {
        await ops.discard(discardTarget.path);
      }
      refetchStatus();
    } finally {
      setDiscardTarget(null);
    }
  }, [discardTarget, ops, refetchStatus]);

  const handleCancelDiscard = useCallback(() => {
    setDiscardTarget(null);
  }, []);

  const handleCommitSuccess = useCallback(() => {
    setStagedFiles(new Set());
    refetchStatus();
  }, [refetchStatus]);

  // Empty state
  if (files.length === 0) {
    return (
      <div className="git-empty-state">
        <p className="git-empty-message">No changes</p>
      </div>
    );
  }

  return (
    <div className="git-changes-view">
      {/* Batch toggle buttons */}
      <div className="git-batch-actions">
        <button
          type="button"
          className="git-batch-btn"
          onClick={handleSelectAll}
        >
          Select All
        </button>
        <button
          type="button"
          className="git-batch-btn"
          onClick={handleDeselectAll}
        >
          Deselect All
        </button>
        <span className="git-staged-count">
          {stagedFiles.size} of {files.length} staged
        </span>
      </div>

      {/* Grouped file list */}
      <div className="git-file-list" role="grid">
        {SECTIONS.map(({ status, label }) => {
          const groupFiles = grouped.get(status);
          if (!groupFiles || groupFiles.length === 0) return null;

          return (
            <div key={status} className="git-file-group">
              <div className="git-section-header">{label}</div>
              {groupFiles.map((file) => (
                <ChangedFileRow
                  key={file.path}
                  file={file}
                  isStaged={stagedFiles.has(file.path)}
                  onToggleStage={handleToggleStage}
                  onClickFile={handleClickFile}
                  onDiscard={handleRequestDiscard}
                />
              ))}
            </div>
          );
        })}
      </div>

      {/* Commit composer */}
      <CommitComposer
        stagedFiles={stagedFiles}
        onCommitSuccess={handleCommitSuccess}
        projectName={projectName}
      />

      {/* Discard confirmation dialog (AlertDialog sibling pattern) */}
      <AlertDialog open={discardTarget !== null} onOpenChange={(open) => { if (!open) handleCancelDiscard(); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard changes?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. Changes to{' '}
              <strong>{discardTarget?.path}</strong> will be permanently lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDiscard}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
