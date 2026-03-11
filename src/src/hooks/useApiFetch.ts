/**
 * useApiFetch -- generic data-fetching hook with FetchState pattern.
 *
 * Encapsulates the repeated pattern across useGitStatus, useGitBranches,
 * useGitCommits, useGitRemoteStatus, etc: AbortController, mounted ref,
 * FetchState machine, fetchTrigger counter, and "adjust state during rendering".
 *
 * Accepts an optional transform function for response reshaping.
 *
 * Constitution: Named export (2.2), no default export.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch } from '@/lib/api-client';
import { FetchState } from '@/types/git';

interface ApiFetchResult<T> {
  state: FetchState;
  data: T | null;
  error: string | null;
}

function idleResult<T>(): ApiFetchResult<T> {
  return { state: FetchState.Idle, data: null, error: null };
}

export function useApiFetch<TResponse, TData = TResponse>(
  url: string | null,
  options?: {
    transform?: (response: TResponse) => TData;
    errorLabel?: string;
  },
): {
  data: TData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
} {
  const [result, setResult] = useState<ApiFetchResult<TData>>(idleResult);
  const [fetchTrigger, setFetchTrigger] = useState(0);
  const mountedRef = useRef(true);

  const shouldFetch = url !== null;

  // "Adjust state during rendering" -- transition to loading
  if (shouldFetch && result.state === FetchState.Idle) {
    setResult({ state: FetchState.Loading, data: null, error: null });
  }

  const refetch = useCallback(() => {
    setResult({ state: FetchState.Loading, data: null, error: null });
    setFetchTrigger((n) => n + 1);
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    if (!shouldFetch || !url) return;

    const controller = new AbortController();

    apiFetch<TResponse>(url, {}, controller.signal)
      .then((response) => {
        if (!controller.signal.aborted && mountedRef.current) {
          const data = options?.transform ? options.transform(response) : (response as unknown as TData);
          setResult({ state: FetchState.Loaded, data, error: null });
        }
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted && mountedRef.current) {
          setResult({
            state: FetchState.Errored,
            data: null,
            error: err instanceof Error ? err.message : (options?.errorLabel ?? 'Fetch failed'),
          });
        }
      });

    return () => {
      mountedRef.current = false;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- options is an object literal, url drives refetch
  }, [shouldFetch, url, fetchTrigger]);

  return {
    data: result.data,
    loading: result.state === FetchState.Loading,
    error: result.error,
    refetch,
  };
}
