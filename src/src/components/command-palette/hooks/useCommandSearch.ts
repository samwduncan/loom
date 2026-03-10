/**
 * useCommandSearch -- Fuse.js search orchestration across multiple data sources.
 *
 * Searches across sessions (from timeline store), files (fetched from API),
 * and built-in commands. Returns typed results per category.
 *
 * Constitution: Named export (2.2), selector-only store access (4.2).
 */

import { useMemo, useState, useEffect } from 'react';
import Fuse, { type IFuseOptions } from 'fuse.js';
import { useTimelineStore } from '@/stores/timeline';
import { apiFetch } from '@/lib/api-client';
import type { Session } from '@/types/session';

export interface FileEntry {
  path: string;
  name: string;
  type: 'file' | 'directory';
}

export interface CommandEntry {
  id: string;
  label: string;
  group: string;
  shortcut?: string;
  action: () => void;
}

export interface UseCommandSearchReturn {
  sessionResults: Session[];
  fileResults: FileEntry[];
  commandResults: CommandEntry[];
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

const FUSE_COMMAND_OPTIONS: IFuseOptions<CommandEntry> = {
  keys: ['label', 'group'],
  threshold: 0.3,
};

type FetchState = 'idle' | 'loading' | 'done';

export function useCommandSearch(
  search: string,
  options: { enabled?: boolean; commands?: CommandEntry[] } = {},
): UseCommandSearchReturn {
  const { enabled = true, commands = [] } = options;
  const sessions = useTimelineStore((s) => s.sessions);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [fetchState, setFetchState] = useState<FetchState>('idle');

  // Fetch files once when palette opens (enabled transitions to true)
  // setState calls are in async callbacks, not synchronously in the effect body.
  useEffect(() => {
    if (!enabled || fetchState !== 'idle') return;

    let cancelled = false;

    // Mark loading asynchronously via microtask to avoid synchronous setState in effect
    Promise.resolve().then(() => {
      if (!cancelled) setFetchState('loading');
    });

    // Try to get the project name from the URL or use a default
    const projectName = window.location.pathname.split('/')[1] || 'default';

    apiFetch<FileEntry[]>(`/api/projects/${projectName}/files`)
      .then((data) => {
        if (!cancelled) {
          setFiles(data);
          setFetchState('done');
        }
      })
      .catch(() => {
        // Graceful degradation: file search stays empty on fetch failure
        if (!cancelled) setFetchState('done');
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, fetchState]);

  const isLoading = fetchState === 'loading';

  const sessionFuse = useMemo(
    () => new Fuse(sessions, FUSE_SESSION_OPTIONS),
    [sessions],
  );

  const fileFuse = useMemo(
    () => new Fuse(files, FUSE_FILE_OPTIONS),
    [files],
  );

  const commandFuse = useMemo(
    () => new Fuse(commands, FUSE_COMMAND_OPTIONS),
    [commands],
  );

  // When search is empty, return empty arrays (caller shows recent commands instead)
  if (!search.trim()) {
    return {
      sessionResults: [],
      fileResults: [],
      commandResults: [],
      isLoading,
    };
  }

  const sessionResults = sessionFuse
    .search(search, { limit: SEARCH_LIMIT })
    .map((r) => r.item);

  const fileResults = fileFuse
    .search(search, { limit: SEARCH_LIMIT })
    .map((r) => r.item);

  const commandResults = commandFuse
    .search(search, { limit: SEARCH_LIMIT })
    .map((r) => r.item);

  return { sessionResults, fileResults, commandResults, isLoading };
}
