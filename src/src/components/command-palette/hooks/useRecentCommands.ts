/**
 * useRecentCommands -- localStorage-based recent command tracking.
 *
 * Stores the last MAX_RECENT command selections with deduplication by id.
 * Re-reads from localStorage after each addRecent call.
 *
 * Constitution: Named export (2.2).
 */

import { useState, useCallback } from 'react';

const STORAGE_KEY = 'loom-recent-commands';
const MAX_RECENT = 10;

export interface RecentEntry {
  id: string;
  label: string;
  group: string;
  timestamp: number;
}

function readRecents(): RecentEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return (parsed as unknown[]).filter(
      (e): e is RecentEntry =>
        typeof (e as RecentEntry).id === 'string' &&
        typeof (e as RecentEntry).label === 'string' &&
        typeof (e as RecentEntry).group === 'string' &&
        typeof (e as RecentEntry).timestamp === 'number',
    );
  } catch {
    return [];
  }
}

function writeRecents(entries: RecentEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export interface UseRecentCommandsReturn {
  recents: RecentEntry[];
  addRecent: (entry: Omit<RecentEntry, 'timestamp'>) => void;
  clearRecents: () => void;
}

export function useRecentCommands(): UseRecentCommandsReturn {
  // useState initializer reads from localStorage synchronously on mount
  const [recents, setRecents] = useState<RecentEntry[]>(readRecents);

  const addRecent = useCallback((entry: Omit<RecentEntry, 'timestamp'>) => {
    const current = readRecents();
    const deduplicated = current.filter((r) => r.id !== entry.id);
    const updated = [{ ...entry, timestamp: Date.now() }, ...deduplicated].slice(0, MAX_RECENT);
    writeRecents(updated);
    setRecents(updated);
  }, []);

  const clearRecents = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setRecents([]);
  }, []);

  return { recents, addRecent, clearRecents };
}
