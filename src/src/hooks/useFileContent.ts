/**
 * useFileContent -- fetches file content from the backend with binary/size guards.
 *
 * Binary detection: checks extension against known binary file types.
 * Large file detection: if fileSize > 1MB, requires explicit proceed() call.
 * Fetch uses AbortController for cleanup on unmount/path change.
 *
 * Uses "adjust state during rendering" pattern to reset state on path change
 * and FetchState enum to avoid synchronous setState in effects.
 *
 * Constitution: Named export (2.2), no default export.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch } from '@/lib/api-client';
import { isImageFile } from '@/components/file-tree/file-utils';

const LARGE_FILE_THRESHOLD = 1_048_576; // 1 MB

/** Non-image binary extensions that cannot be displayed as text */
const BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.bmp', '.tiff', '.tif',
  '.mp3', '.mp4', '.wav', '.ogg', '.webm', '.avi', '.mov', '.flac', '.aac',
  '.pdf', '.zip', '.tar', '.gz', '.bz2', '.7z', '.rar', '.xz', '.zst',
  '.exe', '.dll', '.so', '.dylib', '.bin',
  '.wasm',
  '.ttf', '.otf', '.woff', '.woff2', '.eot',
  '.sqlite', '.db',
  '.pyc', '.class', '.o', '.obj',
]);

function isBinaryFile(filename: string): boolean {
  // Images are handled separately by the lightbox -- still flag as binary
  if (isImageFile(filename)) return true;
  const dotIndex = filename.lastIndexOf('.');
  if (dotIndex === -1 || dotIndex === 0) return false;
  const ext = filename.slice(dotIndex).toLowerCase();
  return BINARY_EXTENSIONS.has(ext);
}

interface FileContentResult {
  content: string | null;
  loading: boolean;
  error: string | null;
  isBinary: boolean;
  isLarge: boolean;
  proceed: () => void;
}

/**
 * FetchState -- single state variable replaces separate loading/error/content
 * states to avoid synchronous setState in effects.
 * Uses const object (not enum) for erasableSyntaxOnly compatibility.
 */
const FetchState = {
  Idle: 'idle',
  Loading: 'loading',
  Loaded: 'loaded',
  Errored: 'errored',
} as const;

type FetchState = (typeof FetchState)[keyof typeof FetchState];

interface FetchResult {
  state: FetchState;
  content: string | null;
  error: string | null;
}

const IDLE_RESULT: FetchResult = { state: FetchState.Idle, content: null, error: null };

export function useFileContent(
  projectName: string,
  filePath: string | null,
  fileSize?: number,
): FileContentResult {
  const [result, setResult] = useState<FetchResult>(IDLE_RESULT);
  const [confirmed, setConfirmed] = useState(false);
  const [prevPath, setPrevPath] = useState<string | null>(filePath);

  const isBinary = filePath !== null && isBinaryFile(filePath.split('/').pop() ?? '');
  const isLarge = fileSize !== undefined && fileSize > LARGE_FILE_THRESHOLD;

  // "Adjust state during rendering" -- reset on path change
  if (filePath !== prevPath) {
    setPrevPath(filePath);
    setResult(IDLE_RESULT);
    setConfirmed(false);
  }

  const proceed = useCallback(() => {
    setConfirmed(true);
  }, []);

  const abortRef = useRef<AbortController | null>(null);

  // Derive whether we should fetch -- used both for the effect trigger
  // and to set loading state from render (not effect)
  const shouldFetch = Boolean(filePath && projectName && !isBinary && (!isLarge || confirmed));

  // "Adjust state during rendering" -- when deps indicate we should fetch
  // and we're idle, transition to loading without an effect
  if (shouldFetch && result.state === FetchState.Idle && filePath === prevPath) {
    setResult({ state: FetchState.Loading, content: null, error: null });
  }

  useEffect(() => {
    if (!shouldFetch) return;

    const controller = new AbortController();
    abortRef.current = controller;

    apiFetch<{ content: string; path: string }>(
      `/api/projects/${projectName}/file?filePath=${encodeURIComponent(filePath!)}`, // ASSERT: filePath is non-null because shouldFetch guards it
      {},
      controller.signal,
    )
      .then((data) => {
        if (!controller.signal.aborted) {
          setResult({ state: FetchState.Loaded, content: data.content, error: null });
        }
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) {
          const message = err instanceof Error ? err.message : 'Failed to load file';
          setResult({ state: FetchState.Errored, content: null, error: message });
        }
      });

    return () => {
      controller.abort();
      abortRef.current = null;
    };
  }, [shouldFetch, filePath, projectName]);

  return {
    content: result.content,
    loading: result.state === FetchState.Loading,
    error: result.error,
    isBinary,
    isLarge,
    proceed,
  };
}
