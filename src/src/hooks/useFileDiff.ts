/**
 * useFileDiff -- fetches diff data for a file from the git endpoint.
 *
 * Returns old and new content for side-by-side merge view, plus metadata
 * about deleted/untracked status.
 *
 * Uses FetchState pattern (same as useFileContent) to avoid synchronous
 * setState calls within effects.
 *
 * Constitution: Named export (2.2), no default export.
 */

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api-client';

interface FileDiffResponse {
  currentContent: string;
  oldContent: string;
  isDeleted: boolean;
  isUntracked: boolean;
}

interface FileDiffResult {
  oldContent: string | null;
  newContent: string | null;
  loading: boolean;
  error: string | null;
  isDeleted: boolean;
  isUntracked: boolean;
}

const FetchState = {
  Idle: 'idle',
  Loading: 'loading',
  Loaded: 'loaded',
  Errored: 'errored',
} as const;

type FetchState = (typeof FetchState)[keyof typeof FetchState];

interface DiffFetchResult {
  state: FetchState;
  oldContent: string | null;
  newContent: string | null;
  error: string | null;
  isDeleted: boolean;
  isUntracked: boolean;
}

const IDLE_RESULT: DiffFetchResult = {
  state: FetchState.Idle,
  oldContent: null,
  newContent: null,
  error: null,
  isDeleted: false,
  isUntracked: false,
};

export function useFileDiff(
  projectName: string,
  filePath: string | null,
): FileDiffResult {
  const [result, setResult] = useState<DiffFetchResult>(IDLE_RESULT);
  const [prevPath, setPrevPath] = useState<string | null>(filePath);

  // "Adjust state during rendering" -- reset on path change
  if (filePath !== prevPath) {
    setPrevPath(filePath);
    setResult(IDLE_RESULT);
  }

  const shouldFetch = Boolean(filePath && projectName);

  // "Adjust state during rendering" -- transition to loading from render
  if (shouldFetch && result.state === FetchState.Idle && filePath === prevPath) {
    setResult({ ...IDLE_RESULT, state: FetchState.Loading });
  }

  useEffect(() => {
    if (!shouldFetch) return;

    const controller = new AbortController();

    apiFetch<FileDiffResponse>(
      `/api/git/file-with-diff?project=${encodeURIComponent(projectName)}&file=${encodeURIComponent(filePath!)}`, // ASSERT: filePath is non-null because shouldFetch guards it
      {},
      controller.signal,
    )
      .then((data) => {
        if (!controller.signal.aborted) {
          setResult({
            state: FetchState.Loaded,
            oldContent: data.oldContent,
            newContent: data.currentContent,
            error: null,
            isDeleted: data.isDeleted,
            isUntracked: data.isUntracked,
          });
        }
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) {
          setResult({
            state: FetchState.Errored,
            oldContent: null,
            newContent: null,
            error: err instanceof Error ? err.message : 'Failed to fetch diff',
            isDeleted: false,
            isUntracked: false,
          });
        }
      });

    return () => {
      controller.abort();
    };
  }, [shouldFetch, filePath, projectName]);

  return {
    oldContent: result.oldContent,
    newContent: result.newContent,
    loading: result.state === FetchState.Loading,
    error: result.error,
    isDeleted: result.isDeleted,
    isUntracked: result.isUntracked,
  };
}
