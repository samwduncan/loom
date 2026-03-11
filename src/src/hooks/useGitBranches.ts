/**
 * useGitBranches -- fetches git branch list for the active project.
 *
 * Uses FetchState pattern (same as useFileDiff).
 *
 * Constitution: Named export (2.2), no default export.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch } from '@/lib/api-client';
import { FetchState } from '@/types/git';
import type { GitBranch } from '@/types/git';

interface BranchesResult {
  state: FetchState;
  branches: GitBranch[] | null;
  error: string | null;
}

const IDLE_RESULT: BranchesResult = {
  state: FetchState.Idle,
  branches: null,
  error: null,
};

export function useGitBranches(projectName: string): {
  branches: GitBranch[] | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
} {
  const [result, setResult] = useState<BranchesResult>(IDLE_RESULT);
  const [fetchTrigger, setFetchTrigger] = useState(0);
  const mountedRef = useRef(true);

  const shouldFetch = Boolean(projectName);

  if (shouldFetch && result.state === FetchState.Idle) {
    setResult({ ...IDLE_RESULT, state: FetchState.Loading });
  }

  const refetch = useCallback(() => {
    setResult({ ...IDLE_RESULT, state: FetchState.Loading });
    setFetchTrigger((n) => n + 1);
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    if (!shouldFetch) return;

    const controller = new AbortController();

    apiFetch<GitBranch[]>(
      `/api/git/branches?project=${encodeURIComponent(projectName)}`,
      {},
      controller.signal,
    )
      .then((data) => {
        if (!controller.signal.aborted && mountedRef.current) {
          setResult({
            state: FetchState.Loaded,
            branches: data,
            error: null,
          });
        }
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted && mountedRef.current) {
          setResult({
            state: FetchState.Errored,
            branches: null,
            error: err instanceof Error ? err.message : 'Failed to fetch branches',
          });
        }
      });

    return () => {
      mountedRef.current = false;
      controller.abort();
    };
  }, [shouldFetch, projectName, fetchTrigger]);

  return {
    branches: result.branches,
    loading: result.state === FetchState.Loading,
    error: result.error,
    refetch,
  };
}
