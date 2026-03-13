/**
 * useGitFileMap -- computes a path-to-status lookup map with directory aggregation.
 *
 * Given a GitFileChange[], builds a Map where:
 * - Each file path maps to its git status
 * - Each ancestor directory maps to the highest-priority status among its descendants
 *
 * Priority order: modified > added > deleted > untracked
 *
 * Returns a stable EMPTY_MAP reference for undefined/empty input (useMemo).
 *
 * Constitution: Named export (2.2), no default export.
 */

import { useMemo } from 'react';
import type { GitFileChange, GitFileStatus } from '@/types/git';

/** Priority map -- higher number wins in directory aggregation */
const STATUS_PRIORITY: Record<GitFileStatus, number> = {
  modified: 4,
  added: 3,
  deleted: 2,
  untracked: 1,
};

/** Reverse lookup: priority number -> status. Only contains valid priority values. */
const PRIORITY_TO_STATUS = new Map<number, GitFileStatus>([
  [4, 'modified'],
  [3, 'added'],
  [2, 'deleted'],
  [1, 'untracked'],
]);

/** Stable empty map reference to avoid unnecessary re-renders */
const EMPTY_MAP = new Map<string, GitFileStatus>();

export function useGitFileMap(
  files: GitFileChange[] | undefined,
): Map<string, GitFileStatus> {
  return useMemo(() => {
    if (!files || files.length === 0) return EMPTY_MAP;

    const map = new Map<string, GitFileStatus>();
    // Track numeric priority for directories to compare efficiently
    const dirPriority = new Map<string, number>();

    for (const file of files) {
      // Add the file itself
      map.set(file.path, file.status);

      // Walk up directory segments
      const segments = file.path.split('/');
      const filePriority = STATUS_PRIORITY[file.status];

      // Build directory paths from segments (exclude the last segment which is the file)
      for (let i = segments.length - 1; i > 0; i--) {
        const dirPath = segments.slice(0, i).join('/');
        const currentPriority = dirPriority.get(dirPath) ?? 0;

        if (filePriority > currentPriority) {
          dirPriority.set(dirPath, filePriority);
          map.set(dirPath, PRIORITY_TO_STATUS.get(filePriority)!); // ASSERT: filePriority always matches a valid STATUS_PRIORITY value
        }
      }
    }

    return map;
  }, [files]);
}
