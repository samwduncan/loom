/**
 * useFileMentions -- hook managing @ mention trigger detection, file search, and picker state.
 *
 * Fetches project files via API, builds a Fuse.js index for fuzzy matching,
 * and exposes state/actions for the MentionPicker popup.
 *
 * Constitution: Named exports (2.2), selector-only store access (4.2).
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import Fuse from 'fuse.js';
import { apiFetch } from '@/lib/api-client';
import type { FileEntry } from '@/types/file';
import type { FileMention } from '@/types/mention';

const FUSE_OPTIONS = {
  keys: ['path', 'name'],
  threshold: 0.3,
};

const MAX_RESULTS = 8;

/**
 * Detect an @ mention query by scanning backward from the cursor position.
 *
 * Returns the query string after @ (e.g., "App.t" for "hello @App.t|"),
 * or null if no valid @ trigger is found.
 *
 * The @ must be at position 0 OR preceded by whitespace (rejects email-like patterns).
 */
export function detectMentionQuery(text: string, cursorPos: number): string | null {
  // Only look at text up to the cursor
  const before = text.slice(0, cursorPos);

  // Scan backward to find the nearest @
  const atIndex = before.lastIndexOf('@');
  if (atIndex === -1) return null;

  // The @ must be at start or preceded by whitespace
  if (atIndex > 0 && !/\s/.test(before.charAt(atIndex - 1))) return null;

  // Extract query after @
  const query = before.slice(atIndex + 1);

  // Reject if query contains whitespace (user moved past the mention)
  // Allow empty query (just typed @)
  if (/\s/.test(query)) return null;

  return query;
}

export function useFileMentions(options: { enabled: boolean; projectName: string }): {
  isOpen: boolean;
  query: string;
  results: FileMention[];
  selectedIndex: number;
  detectAndOpen: (text: string, cursorPos: number) => void;
  close: () => void;
  moveUp: () => void;
  moveDown: () => void;
  selectCurrent: () => FileMention | null;
  isLoading: boolean;
} {
  const { enabled, projectName } = options;
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [fetchState, setFetchState] = useState<'idle' | 'loading' | 'done'>('idle');
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Derive isLoading from fetch state
  const isLoading = fetchState === 'loading';

  // Fetch files when enabled/projectName changes. Local cancelled flag per effect run
  // prevents stale writes from previous fetches (matches useCommandSearch pattern).
  useEffect(() => {
    if (!enabled || !projectName) return;

    let cancelled = false;

    // Defer state update to avoid synchronous setState in effect body
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
        if (!cancelled) {
          setFetchState('done');
        }
      });

    return () => {
      cancelled = true;
      setFetchState('idle');
    };
  }, [enabled, projectName]);

  // Build Fuse index
  const fuse = useMemo(() => new Fuse(files, FUSE_OPTIONS), [files]);

  // Search files, mapping FileEntry -> FileMention
  const searchFiles = useCallback(
    (q: string): FileMention[] => {
      if (!q) {
        // Empty query: show first N files
        return files.slice(0, MAX_RESULTS).map((f) => ({ path: f.path, name: f.name }));
      }
      return fuse
        .search(q, { limit: MAX_RESULTS })
        .map((r) => ({ path: r.item.path, name: r.item.name }));
    },
    [fuse, files],
  );

  // Current results based on query
  const results = useMemo(() => searchFiles(query), [searchFiles, query]);

  const detectAndOpen = useCallback(
    (text: string, cursorPos: number) => {
      const detected = detectMentionQuery(text, cursorPos);
      if (detected !== null) {
        setIsOpen(true);
        setQuery(detected);
        setSelectedIndex(0);
      } else {
        setIsOpen(false);
        setQuery('');
        setSelectedIndex(0);
      }
    },
    [],
  );

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setSelectedIndex(0);
  }, []);

  const moveDown = useCallback(() => {
    setSelectedIndex((prev) => {
      const len = results.length;
      if (len === 0) return 0;
      return (prev + 1) % len;
    });
  }, [results.length]);

  const moveUp = useCallback(() => {
    setSelectedIndex((prev) => {
      const len = results.length;
      if (len === 0) return 0;
      return (prev - 1 + len) % len;
    });
  }, [results.length]);

  const selectCurrent = useCallback((): FileMention | null => {
    if (results.length === 0) return null;
    const idx = Math.min(selectedIndex, results.length - 1);
    return results[idx] ?? null;
  }, [results, selectedIndex]);

  return {
    isOpen,
    query,
    results,
    selectedIndex,
    detectAndOpen,
    close,
    moveUp,
    moveDown,
    selectCurrent,
    isLoading,
  };
}
