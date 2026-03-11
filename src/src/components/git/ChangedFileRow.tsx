/**
 * ChangedFileRow -- individual file row with status icon, name, checkbox, discard button.
 *
 * Clicking the row (except checkbox/discard) opens the file in the diff editor.
 * Checkbox toggles client-side staging. Discard triggers confirmation in parent.
 *
 * Constitution: Named export (2.2), token-based styling (3.1).
 */

import { Trash2 } from 'lucide-react';
import type { GitFileChange, GitFileStatus } from '@/types/git';

export interface ChangedFileRowProps {
  file: GitFileChange;
  isStaged: boolean;
  onToggleStage: (path: string) => void;
  onClickFile: (path: string) => void;
  onDiscard: (file: GitFileChange) => void;
}

/** Status letter + color mapping */
const STATUS_LABEL: Record<GitFileStatus, string> = {
  modified: 'M',
  added: 'A',
  deleted: 'D',
  untracked: '?',
};

/** Extract basename from a file path */
function basename(filePath: string): string {
  const parts = filePath.split('/');
  return parts[parts.length - 1] ?? filePath;
}

/** Extract directory from a file path (empty string if no directory) */
function dirname(filePath: string): string {
  const lastSlash = filePath.lastIndexOf('/');
  return lastSlash === -1 ? '' : filePath.slice(0, lastSlash);
}

export function ChangedFileRow({
  file,
  isStaged,
  onToggleStage,
  onClickFile,
  onDiscard,
}: ChangedFileRowProps) {
  const dir = dirname(file.path);

  return (
    <div
      className="git-file-row"
      onClick={() => onClickFile(file.path)}
      role="row"
    >
      {/* Checkbox */}
      <input
        type="checkbox"
        checked={isStaged}
        onChange={() => onToggleStage(file.path)}
        onClick={(e) => e.stopPropagation()}
        className="git-file-checkbox"
        aria-label={`Stage ${file.path}`}
      />

      {/* Status icon */}
      <span className="git-status-icon" data-status={file.status}>
        {STATUS_LABEL[file.status]}
      </span>

      {/* File name */}
      <span className="git-file-name">{basename(file.path)}</span>

      {/* Directory path (muted) */}
      {dir && <span className="git-file-dir">{dir}</span>}

      {/* Spacer */}
      <span className="git-file-spacer" />

      {/* Discard button */}
      <button
        type="button"
        className="git-file-discard"
        onClick={(e) => {
          e.stopPropagation();
          onDiscard(file);
        }}
        aria-label={`Discard ${file.path}`}
        title="Discard changes"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
