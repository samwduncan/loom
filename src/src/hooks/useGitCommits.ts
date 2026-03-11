/**
 * useGitCommits -- fetches git commit history for the active project.
 *
 * Uses FetchState pattern (same as useFileDiff).
 *
 * Constitution: Named export (2.2), no default export.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch } from '@/lib/api-client';
import { FetchState } from '@/types/git';
import type { GitCommit } from '@/types/git';

interface CommitsResponse {
  commits: GitCommit[];
}

interface CommitsResult {
  state: FetchState;
  commits: GitCommit[] | null;
  error: string | null;
}

const IDLE_RESULT: CommitsResult = {
  state: FetchState.Idle,
  commits: null,
  error: null,
};

export function useGitCommits(projectName: string): {
  commits: GitCommit[] | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
} {
  const [result, setResult] = useState<CommitsResult>(IDLE_RESULT);
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

    apiFetch<CommitsResponse>(
      `/api/git/commits?project=${encodeURIComponent(projectName)}`,
      {},
      controller.signal,
    )
      .then((data) => {
        if (!controller.signal.aborted && mountedRef.current) {
          setResult({
            state: FetchState.Loaded,
            commits: data.commits,
            error: null,
          });
        }
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted && mountedRef.current) {
          setResult({
            state: FetchState.Errored,
            commits: null,
            error: err instanceof Error ? err.message : 'Failed to fetch commits',
          });
        }
      });

    return () => {
      mountedRef.current = false;
      controller.abort();
    };
  }, [shouldFetch, projectName, fetchTrigger]);

  return {
    commits: result.commits,
    loading: result.state === FetchState.Loading,
    error: result.error,
    refetch,
  };
}
