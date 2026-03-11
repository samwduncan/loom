/**
 * useGitStatus -- fetches git status for the active project.
 *
 * Flattens backend's separate arrays (modified, added, deleted, untracked)
 * into a single GitFileChange[] for simpler frontend consumption.
 *
 * Auto-refetches on `loom:projects-updated` CustomEvent (fired when backend
 * detects file changes via WebSocket). Supports imperative refetch().
 *
 * Uses FetchState pattern (same as useFileDiff) to avoid synchronous
 * setState calls within effects.
 *
 * Constitution: Named export (2.2), no default export.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch } from '@/lib/api-client';
import { FetchState } from '@/types/git';
import type { GitStatusResponse, GitStatusData, GitFileChange } from '@/types/git';

interface GitStatusResult {
  state: FetchState;
  data: GitStatusData | null;
  error: string | null;
}

const IDLE_RESULT: GitStatusResult = {
  state: FetchState.Idle,
  data: null,
  error: null,
};

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
  const [result, setResult] = useState<GitStatusResult>(IDLE_RESULT);
  const [fetchTrigger, setFetchTrigger] = useState(0);
  const mountedRef = useRef(true);

  const shouldFetch = Boolean(projectName);

  // "Adjust state during rendering" -- transition to loading
  if (shouldFetch && result.state === FetchState.Idle) {
    setResult({ ...IDLE_RESULT, state: FetchState.Loading });
  }

  const refetch = useCallback(() => {
    setResult({ ...IDLE_RESULT, state: FetchState.Loading });
    setFetchTrigger((n) => n + 1);
  }, []);

  // Listen for loom:projects-updated to auto-refetch
  useEffect(() => {
    const handler = () => refetch();
    window.addEventListener('loom:projects-updated', handler);
    return () => window.removeEventListener('loom:projects-updated', handler);
  }, [refetch]);

  useEffect(() => {
    mountedRef.current = true;

    if (!shouldFetch) return;

    const controller = new AbortController();

    apiFetch<GitStatusResponse>(
      `/api/git/status?project=${encodeURIComponent(projectName)}`,
      {},
      controller.signal,
    )
      .then((data) => {
        if (!controller.signal.aborted && mountedRef.current) {
          setResult({
            state: FetchState.Loaded,
            data: flattenStatus(data),
            error: null,
          });
        }
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted && mountedRef.current) {
          setResult({
            state: FetchState.Errored,
            data: null,
            error: err instanceof Error ? err.message : 'Failed to fetch git status',
          });
        }
      });

    return () => {
      mountedRef.current = false;
      controller.abort();
    };
  }, [shouldFetch, projectName, fetchTrigger]);

  return {
    data: result.data,
    loading: result.state === FetchState.Loading,
    error: result.error,
    refetch,
  };
}
