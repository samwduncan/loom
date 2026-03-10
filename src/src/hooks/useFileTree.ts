/**
 * useFileTree -- fetches file tree data from backend and refreshes on events.
 *
 * Accepts projectName, returns tree data with fetchState lifecycle.
 * Re-fetches on `loom:projects-updated` CustomEvent (fired by WebSocket handler).
 *
 * Uses "adjust state during rendering" pattern for projectName changes
 * (avoids react-hooks/set-state-in-effect violation).
 *
 * Constitution: Named export (2.2), async error handling (8.2).
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { apiFetch } from '@/lib/api-client';
import type { FileTreeNode } from '@/types/file';

type FetchState = 'idle' | 'loading' | 'error' | 'success';

const EMPTY_TREE: FileTreeNode[] = [];

export interface UseFileTreeResult {
  tree: FileTreeNode[];
  fetchState: FetchState;
  retry: () => void;
  projectRoot: string | null;
}

/**
 * Derive project root from tree entries.
 * Takes any top-level entry's path and strips the last segment.
 */
function deriveProjectRoot(tree: FileTreeNode[]): string | null {
  const first = tree[0];
  if (!first) return null;
  const lastSlash = first.path.lastIndexOf('/');
  if (lastSlash < 0) return null;
  return lastSlash === 0 ? '/' : first.path.slice(0, lastSlash);
}

export function useFileTree(projectName: string): UseFileTreeResult {
  const [tree, setTree] = useState<FileTreeNode[]>(EMPTY_TREE);
  const [fetchState, setFetchState] = useState<FetchState>(
    projectName ? 'loading' : 'idle',
  );
  const abortRef = useRef<AbortController | null>(null);
  const [fetchTrigger, setFetchTrigger] = useState(0);
  // Track previous projectName with state for "adjust during rendering" pattern
  const [prevProjectName, setPrevProjectName] = useState(projectName);

  // Adjust state during rendering when projectName changes
  if (projectName !== prevProjectName) {
    setPrevProjectName(projectName);
    if (!projectName) {
      setFetchState('idle');
      setTree(EMPTY_TREE);
    } else {
      setFetchState('loading');
    }
  }

  // Derive projectRoot from tree data (computed, not stored)
  const projectRoot = useMemo(() => deriveProjectRoot(tree), [tree]);

  const doFetch = useCallback(async (name: string, controller: AbortController) => {
    try {
      const data = await apiFetch<FileTreeNode[]>(
        `/api/projects/${encodeURIComponent(name)}/files`,
        {},
        controller.signal,
      );
      if (!controller.signal.aborted) {
        setTree(data);
        setFetchState('success');
      }
    } catch (err) {
      if (!(err instanceof DOMException && err.name === 'AbortError')) {
        if (!controller.signal.aborted) {
          setFetchState('error');
          console.error('Failed to fetch file tree:', err);
        }
      }
    }
  }, []);

  const retry = useCallback(() => {
    setFetchTrigger((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!projectName) return;

    // Create abort controller for this effect lifecycle
    const controller = new AbortController();
    abortRef.current = controller;

    // Fetch asynchronously -- fetchState is already 'loading' from
    // initial state or from the "adjust during rendering" block above
    doFetch(projectName, controller); // eslint-disable-line react-hooks/set-state-in-effect -- Fetching external data is a valid effect use case

    const handleProjectsUpdated = () => {
      // Abort any in-flight fetch before starting a new one
      controller.abort();
      const newController = new AbortController();
      abortRef.current = newController;
      setFetchState('loading');  
      doFetch(projectName, newController);  
    };

    window.addEventListener('loom:projects-updated', handleProjectsUpdated);

    return () => {
      controller.abort();
      window.removeEventListener('loom:projects-updated', handleProjectsUpdated);
    };
  }, [projectName, fetchTrigger, doFetch]);

  return { tree, fetchState, retry, projectRoot };
}
