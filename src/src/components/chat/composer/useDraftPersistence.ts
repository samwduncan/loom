/**
 * useDraftPersistence -- saves/restores composer draft text per session.
 *
 * In-memory Map for fast access during session switches, localStorage
 * for reload survival. Debounces localStorage writes by 500ms on save,
 * flushes immediately on clear (post-send). Dispatches custom event
 * 'loom-drafts-changed' for cross-component reactivity (sidebar dot).
 *
 * Constitution: Named export (2.2), no external store mutation (4.3).
 */

import { useRef, useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'loom-composer-drafts';
const DEBOUNCE_MS = 500;
const DRAFTS_CHANGED_EVENT = 'loom-drafts-changed';

function readFromStorage(): Map<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Map();
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return new Map();
    return new Map(Object.entries(parsed));
  } catch {
    return new Map();
  }
}

function writeToStorage(map: Map<string, string>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(map)));
  window.dispatchEvent(new Event(DRAFTS_CHANGED_EVENT));
}

// Module-level initial hydration (runs once on import, avoids ref access during render)
const initialDrafts = readFromStorage();

export function useDraftPersistence() {
  const draftsRef = useRef<Map<string, string>>(initialDrafts);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [sessionsWithDrafts, setSessionsWithDrafts] = useState<Set<string>>(
    () => new Set(initialDrafts.keys()),
  );

  // Sync the sessionsWithDrafts state from the Map
  const updateDraftSet = useCallback(() => {
    setSessionsWithDrafts(new Set(draftsRef.current.keys()));
  }, []);

  // Debounced localStorage write
  const debouncedSync = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      writeToStorage(draftsRef.current);
      timerRef.current = null;
    }, DEBOUNCE_MS);
  }, []);

  const saveDraft = useCallback(
    (sessionId: string, text: string) => {
      const trimmed = text.trim();
      if (trimmed) {
        draftsRef.current.set(sessionId, text);
      } else {
        draftsRef.current.delete(sessionId);
      }
      updateDraftSet();
      debouncedSync();
    },
    [updateDraftSet, debouncedSync],
  );

  const loadDraft = useCallback((sessionId: string): string => {
    return draftsRef.current.get(sessionId) ?? '';
  }, []);

  const clearDraft = useCallback(
    (sessionId: string) => {
      draftsRef.current.delete(sessionId);
      updateDraftSet();
      // Immediate sync on clear (post-send)
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      writeToStorage(draftsRef.current);
    },
    [updateDraftSet],
  );

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return { saveDraft, loadDraft, clearDraft, sessionsWithDrafts };
}

export { DRAFTS_CHANGED_EVENT };
