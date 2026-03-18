/**
 * Session pin management -- localStorage-backed hook for pinning sessions.
 *
 * Stores pinned session IDs as a JSON array in localStorage.
 * Returns a new Set reference on each toggle to trigger React re-renders.
 *
 * Constitution: Named exports only (2.2), no default export.
 */

import { useState, useCallback, useMemo } from 'react';

const STORAGE_KEY = 'loom-pinned-sessions';

/** Read pinned IDs from localStorage. Returns empty Set on any error. */
function loadPins(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((item): item is string => typeof item === 'string'));
  } catch {
    return new Set();
  }
}

/** Write pinned IDs to localStorage as JSON array. */
function savePins(pins: Set<string>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...pins]));
  } catch {
    // Silently fail on storage quota or privacy mode
  }
}

/**
 * Hook for managing pinned sessions.
 * Persists to localStorage under 'loom-pinned-sessions' key.
 */
export function useSessionPins() {
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(() => loadPins());

  const togglePin = useCallback((id: string) => {
    setPinnedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      savePins(next);
      return next;
    });
  }, []);

  const isPinned = useCallback(
    (id: string): boolean => pinnedIds.has(id),
    [pinnedIds],
  );

  return useMemo(
    () => ({ pinnedIds, togglePin, isPinned }),
    [pinnedIds, togglePin, isPinned],
  );
}
