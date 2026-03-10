/**
 * useCommandSearch -- Fuse.js search orchestration across sessions and files.
 *
 * Searches across sessions (from timeline store) and files (fetched from API).
 * Returns typed results per category.
 *
 * Constitution: Named export (2.2), selector-only store access (4.2).
 */

import { useMemo, useState, useEffect } from 'react';
import Fuse, { type IFuseOptions } from 'fuse.js';
import { useTimelineStore } from '@/stores/timeline';
import { useProjectContext } from '@/hooks/useProjectContext';
import { apiFetch } from '@/lib/api-client';
import type { Session } from '@/types/session';

export interface FileEntry {
  path: string;
  name: string;
  type: 'file' | 'directory';
}

export interface UseCommandSearchReturn {
  sessionResults: Session[];
  fileResults: FileEntry[];
  isLoading: boolean;
}

const SEARCH_LIMIT = 15;

const FUSE_SESSION_OPTIONS: IFuseOptions<Session> = {
  keys: ['title'],
  threshold: 0.4,
};

const FUSE_FILE_OPTIONS: IFuseOptions<FileEntry> = {
  keys: ['path', 'name'],
  threshold: 0.3,
};

type FetchState = 'idle' | 'loading' | 'done';

export function useCommandSearch(
  search: string,
  options: { enabled?: boolean } = {},
): UseCommandSearchReturn {
  const { enabled = true } = options;
  const sessions = useTimelineStore((s) => s.sessions);
  const { projectName } = useProjectContext();
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [fetchState, setFetchState] = useState<FetchState>('idle');

  // Fetch files when palette opens. Reset on close so next open re-fetches.
  useEffect(() => {
    if (!enabled || !projectName) return;

    let cancelled = false;

    Promise.resolve().then(() => {
      if (!cancelled) setFetchState('loading');
    });

    apiFetch<FileEntry[]>(`/api/projects/${encodeURIComponent(projectName)}/files`)
      .then((data) => {
        if (!cancelled) {
          setFiles(data);
          setFetchState('done');
        }
      })
      .catch(() => {
        if (!cancelled) setFetchState('done');
      });

    return () => {
      cancelled = true;
      setFetchState('idle');
    };
  }, [enabled, projectName]);

  const isLoading = fetchState === 'loading';

  const sessionFuse = useMemo(
    () => new Fuse(sessions, FUSE_SESSION_OPTIONS),
    [sessions],
  );

  const fileFuse = useMemo(
    () => new Fuse(files, FUSE_FILE_OPTIONS),
    [files],
  );

  // When search is empty, return empty arrays (caller shows recent commands instead)
  const sessionResults = useMemo(() => {
    if (!search.trim()) return [];
    return sessionFuse.search(search, { limit: SEARCH_LIMIT }).map((r) => r.item);
  }, [search, sessionFuse]);

  const fileResults = useMemo(() => {
    if (!search.trim()) return [];
    return fileFuse.search(search, { limit: SEARCH_LIMIT }).map((r) => r.item);
  }, [search, fileFuse]);

  return { sessionResults, fileResults, isLoading };
}
