/**
 * useGitFileMap -- computes a path-to-status lookup map with directory aggregation.
 *
 * Given a GitFileChange[], builds a Map where:
 * - Each file path maps to its git status
 * - Each ancestor directory maps to the highest-priority status among its descendants
 *
 * Priority order: modified > added > deleted > untracked
 *
 * Uses a content-derived fingerprint as useMemo dependency to avoid recomputing
 * when the files array has a new reference but identical content.
 *
 * Constitution: Named export (2.2), no default export.
 */

import { useMemo } from 'react';
import type { GitFileChange, GitFileStatus } from '@/types/git';

/** Priority map -- higher number wins in directory aggregation. Unknown statuses get 0. */
const STATUS_PRIORITY: Partial<Record<string, number>> = {
  modified: 4,
  added: 3,
  deleted: 2,
  untracked: 1,
};

/** Reverse lookup from priority to status */
/** Map priority number back to status string */
function priorityToStatus(priority: number): GitFileStatus {
  switch (priority) {
    case 4: return 'modified';
    case 3: return 'added';
    case 2: return 'deleted';
    default: return 'untracked';
  }
}

/** Stable empty map reference to avoid unnecessary re-renders */
const EMPTY_MAP = new Map<string, GitFileStatus>();

/**
 * Create a stable fingerprint of the files array for useMemo dependency.
 * Changes only when actual file paths or statuses change, not on new array refs.
 */
function filesFingerprint(files: GitFileChange[] | undefined): string {
  if (!files || files.length === 0) return '';
  let fp = '';
  for (const f of files) {
    fp += f.path;
    fp += ':';
    fp += f.status;
    fp += '\n';
  }
  return fp;
}

export function useGitFileMap(
  files: GitFileChange[] | undefined,
): Map<string, GitFileStatus> {
  // Derive a content fingerprint so useMemo only recomputes on actual data changes
  const fingerprint = filesFingerprint(files);

  return useMemo(() => {
    if (!files || files.length === 0) return EMPTY_MAP;

    const map = new Map<string, GitFileStatus>();
    const dirPriority = new Map<string, number>();

    for (const file of files) {
      const filePriority = STATUS_PRIORITY[file.status] ?? 0;

      // Skip unknown statuses (renamed, copied, unmerged, etc.)
      if (filePriority === 0) continue;

      // Add the file itself
      map.set(file.path, file.status);

      // Walk up directory paths using lastIndexOf instead of split/join
      const path = file.path;
      let slashIdx = path.lastIndexOf('/');
      while (slashIdx > 0) {
        const dirPath = path.slice(0, slashIdx);
        const currentPriority = dirPriority.get(dirPath) ?? 0;

        if (filePriority > currentPriority) {
          dirPriority.set(dirPath, filePriority);
          map.set(dirPath, priorityToStatus(filePriority));
        } else {
          // Parent already has equal or higher priority — ancestors will too
          break;
        }

        slashIdx = dirPath.lastIndexOf('/');
      }
    }

    return map;
  // eslint-disable-next-line react-hooks/exhaustive-deps -- fingerprint is derived from files content; using it instead of files reference for stability
  }, [fingerprint]);
}
