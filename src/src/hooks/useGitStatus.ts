/**
 * useGitStatus -- fetches git status for the active project.
 *
 * Flattens backend's separate arrays (modified, added, deleted, untracked)
 * into a single GitFileChange[] for simpler frontend consumption.
 *
 * Auto-refetches on `loom:projects-updated` CustomEvent (fired when backend
 * detects file changes via WebSocket). Supports imperative refetch().
 *
 * Constitution: Named export (2.2), no default export.
 */

import { useEffect } from 'react';
import { useApiFetch } from '@/hooks/useApiFetch';
import type { GitStatusResponse, GitStatusData, GitFileChange } from '@/types/git';

/** Flatten backend arrays into a single GitFileChange[] */
function flattenStatus(response: GitStatusResponse): GitStatusData {
  const files: GitFileChange[] = [
    ...response.modified.map((path) => ({ path, status: 'modified' as const })),
    ...response.added.map((path) => ({ path, status: 'added' as const })),
    ...response.deleted.map((path) => ({ path, status: 'deleted' as const })),
    ...response.untracked.map((path) => ({ path, status: 'untracked' as const })),
  ];
  return {
    branch: response.branch,
    hasCommits: response.hasCommits,
    files,
  };
}

export function useGitStatus(projectName: string): {
  data: GitStatusData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
} {
  const url = projectName
    ? `/api/git/status?project=${encodeURIComponent(projectName)}`
    : null;

  const result = useApiFetch<GitStatusResponse, GitStatusData>(url, {
    transform: flattenStatus,
    errorLabel: 'Failed to fetch git status',
  });

  const { refetch } = result;

  // Listen for loom:projects-updated to auto-refetch
  useEffect(() => {
    const handler = () => refetch();
    window.addEventListener('loom:projects-updated', handler);
    return () => window.removeEventListener('loom:projects-updated', handler);
  }, [refetch]);

  return result;
}
