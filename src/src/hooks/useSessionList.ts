/**
 * useSessionList -- fetches session list on mount and populates timeline store.
 *
 * Sessions are read from the timeline store by consumers (Sidebar, SessionList).
 * This hook handles the initial fetch and error state only.
 *
 * Uses selectors for store access (no getState() in hooks -- ESLint ban).
 * Uses async callback pattern for setState to satisfy set-state-in-effect rule.
 *
 * Constitution: Named export (2.2), selector-only store access (4.2), no default export.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { apiFetch } from '@/lib/api-client';
import { transformBackendSession } from '@/lib/transformMessages';
import type { BackendSessionData } from '@/lib/transformMessages';
import { useTimelineStore } from '@/stores/timeline';
import { useProjectContext } from '@/hooks/useProjectContext';

interface BackendSessionsResponse {
  sessions: BackendSessionData[];
  total: number;
  hasMore: boolean;
}

export function useSessionList(): { isLoading: boolean; error: string | null } {
  const { projectName, isLoading: projectLoading } = useProjectContext();

  // Derive initial loading state from project context
  const [isLoading, setIsLoading] = useState(() => {
    if (!projectLoading && !projectName) return false;
    return true;
  });
  const [error, setError] = useState<string | null>(null);

  // Use selectors for store actions (Constitution 4.2 -- no getState in hooks)
  const addSession = useTimelineStore((s) => s.addSession);

  // Capture sessions as a ref via effect (React 19 ESLint -- no ref write in render body)
  const sessions = useTimelineStore((s) => s.sessions);
  const sessionsRef = useRef(sessions);
  useEffect(() => {
    sessionsRef.current = sessions;
  }, [sessions]);

  // Refs for stable access from event listener (avoids setState in event-driven effect)
  const projectNameRef = useRef(projectName);
  useEffect(() => {
    projectNameRef.current = projectName;
  }, [projectName]);

  const addSessionRef = useRef(addSession);
  useEffect(() => {
    addSessionRef.current = addSession;
  }, [addSession]);

  // Initial mount fetch -- inline async to satisfy react-hooks/set-state-in-effect
  useEffect(() => {
    if (projectLoading || !projectName) return;

    let cancelled = false;

    async function fetchSessions() {
      try {
        const data = await apiFetch<BackendSessionsResponse>(
          `/api/projects/${encodeURIComponent(projectName)}/sessions?limit=999`,
        );

        if (cancelled) return;

        const existingIds = new Set(sessionsRef.current.map((s) => s.id));

        for (const backendSession of data.sessions) {
          if (!existingIds.has(backendSession.id)) {
            const session = transformBackendSession(backendSession);
            addSession(session);
          }
        }

        setIsLoading(false);
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'Failed to load sessions';
        console.error('useSessionList: fetch error:', message);
        setError(message);
        setIsLoading(false);
      }
    }

    void fetchSessions();
    return () => { cancelled = true; };
  }, [projectName, projectLoading, addSession]);

  // Stable refetch function for event listener -- uses refs to avoid closure staling,
  // does not call setState (background refresh, no loading/error UI state changes).
  const refetchSessions = useCallback(async () => {
    const name = projectNameRef.current;
    if (!name) return;

    try {
      const data = await apiFetch<BackendSessionsResponse>(
        `/api/projects/${encodeURIComponent(name)}/sessions?limit=999`,
      );

      const existingIds = new Set(sessionsRef.current.map((s) => s.id));

      for (const backendSession of data.sessions) {
        if (!existingIds.has(backendSession.id)) {
          const session = transformBackendSession(backendSession);
          addSessionRef.current(session);
        }
      }
    } catch (err) {
      console.error('useSessionList: refetch error:', err);
    }
  }, []);

  // Listen for projects_updated WebSocket events to refetch session list
  useEffect(() => {
    const handleProjectsUpdated = () => {
      void refetchSessions();
    };

    window.addEventListener('loom:projects-updated', handleProjectsUpdated);
    return () => {
      window.removeEventListener('loom:projects-updated', handleProjectsUpdated);
    };
  }, [refetchSessions]);

  return { isLoading, error };
}
