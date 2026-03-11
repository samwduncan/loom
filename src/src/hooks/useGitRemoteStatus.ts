/**
 * useGitRemoteStatus -- fetches remote tracking status for the active project.
 *
 * Uses FetchState pattern (same as useFileDiff).
 *
 * Constitution: Named export (2.2), no default export.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch } from '@/lib/api-client';
import { FetchState } from '@/types/git';
import type { GitRemoteStatus } from '@/types/git';

interface RemoteStatusResult {
  state: FetchState;
  remoteStatus: GitRemoteStatus | null;
  error: string | null;
}

const IDLE_RESULT: RemoteStatusResult = {
  state: FetchState.Idle,
  remoteStatus: null,
  error: null,
};

export function useGitRemoteStatus(projectName: string): {
  remoteStatus: GitRemoteStatus | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
} {
  const [result, setResult] = useState<RemoteStatusResult>(IDLE_RESULT);
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

    apiFetch<GitRemoteStatus>(
      `/api/git/remote-status?project=${encodeURIComponent(projectName)}`,
      {},
      controller.signal,
    )
      .then((data) => {
        if (!controller.signal.aborted && mountedRef.current) {
          setResult({
            state: FetchState.Loaded,
            remoteStatus: data,
            error: null,
          });
        }
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted && mountedRef.current) {
          setResult({
            state: FetchState.Errored,
            remoteStatus: null,
            error: err instanceof Error ? err.message : 'Failed to fetch remote status',
          });
        }
      });

    return () => {
      mountedRef.current = false;
      controller.abort();
    };
  }, [shouldFetch, projectName, fetchTrigger]);

  return {
    remoteStatus: result.remoteStatus,
    loading: result.state === FetchState.Loading,
    error: result.error,
    refetch,
  };
}
