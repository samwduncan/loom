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
  // Backend may return {error, details} on failure with 200 status (not a proper HTTP error).
  // Detect this and throw so useApiFetch routes it to the error handler.
  const errResponse = response as unknown as { error?: string; details?: string };
  if (errResponse.error && !response.branch) {
    throw new Error(errResponse.details ?? errResponse.error);
  }

  // Guard against partially-populated responses
  const modified = response.modified ?? [];
  const added = response.added ?? [];
  const deleted = response.deleted ?? [];
  const untracked = response.untracked ?? [];

  const files: GitFileChange[] = [
    ...modified.map((path) => ({ path, status: 'modified' as const })),
    ...added.map((path) => ({ path, status: 'added' as const })),
    ...deleted.map((path) => ({ path, status: 'deleted' as const })),
    ...untracked.map((path) => ({ path, status: 'untracked' as const })),
  ];
  return {
    branch: response.branch ?? 'unknown',
    hasCommits: response.hasCommits ?? false,
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
