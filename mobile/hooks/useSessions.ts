/**
 * Session data management hook -- fetches, groups, searches, and manages sessions.
 *
 * Data flow:
 *   GET /api/projects -> Project[]
 *   GET /api/projects/:name/sessions?limit=50 -> SessionsResponse per project
 *
 * Session creation uses the "stub" pattern:
 *   1. Create a stub session with `stub-{timestamp}` ID in timeline store
 *   2. Navigate to chat immediately (user sees empty chat)
 *   3. First user message includes projectPath -- backend creates real session
 *   4. onSessionCreated callback in websocket-init.ts replaces stub ID with real ID
 *
 * Pinned sessions stored in MMKV (local-only, not synced to backend).
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { MMKV } from 'react-native-mmkv';
import { router } from 'expo-router';
import { createApiClient } from '@loom/shared/lib/api-client';
import { nativeAuthProvider } from '../lib/auth-provider';
import { resolveApiUrl } from '../lib/platform';
import { useTimelineStore } from '../stores/index';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProjectFromApi {
  name: string;
  displayName: string;
  path: string;
  provider: 'claude' | 'codex' | 'gemini';
  sessionCount: number;
  lastActivity: string;
}

interface SessionFromApi {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  metadata?: {
    tokenBudget?: number | null;
    contextWindowUsed?: number | null;
    totalCost?: number | null;
    messageCount?: number | null;
  };
}

interface SessionsApiResponse {
  sessions: SessionFromApi[];
  total: number;
  hasMore: boolean;
}

export interface SessionData {
  id: string;
  title: string;
  updatedAt: string;
  provider: string;
  projectName: string;
  projectPath: string;
  isPinned: boolean;
}

export interface ProjectWithSessions {
  name: string;
  displayName: string;
  path: string;
  provider: string;
  sessions: SessionData[];
}

export interface UseSessionsReturn {
  projects: ProjectWithSessions[];
  pinnedSessions: SessionData[];
  isLoading: boolean;
  error: string | null;
  activeSessionId: string | null;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  fetchSessions: () => Promise<void>;
  createSession: (projectName: string, projectPath: string) => void;
  deleteSession: (projectName: string, sessionId: string) => Promise<void>;
  setActiveSession: (sessionId: string) => void;
  togglePin: (sessionId: string) => void;
}

// ---------------------------------------------------------------------------
// MMKV for pinned sessions
// ---------------------------------------------------------------------------

const mmkv = new MMKV();
const PINNED_KEY = 'loom-pinned-sessions';

function getPinnedIds(): string[] {
  const raw = mmkv.getString(PINNED_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

function setPinnedIds(ids: string[]): void {
  mmkv.set(PINNED_KEY, JSON.stringify(ids));
}

// ---------------------------------------------------------------------------
// API client (module-scoped singleton)
// ---------------------------------------------------------------------------

const apiClient = createApiClient({
  auth: nativeAuthProvider,
  resolveUrl: resolveApiUrl,
});

// ---------------------------------------------------------------------------
// Relative time formatter
// ---------------------------------------------------------------------------

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export { relativeTime };

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useSessions(): UseSessionsReturn {
  const [allProjects, setAllProjects] = useState<ProjectWithSessions[]>([]);
  const [pinnedIds, setPinnedIdsState] = useState<string[]>(getPinnedIds);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const activeSessionId = useTimelineStore((s) => s.activeSessionId);

  // -------------------------------------------------------------------------
  // Fetch all projects and their sessions
  // -------------------------------------------------------------------------

  const fetchSessions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const projects = await apiClient.apiFetch<ProjectFromApi[]>('/api/projects');

      const projectsWithSessions: ProjectWithSessions[] = await Promise.all(
        projects.map(async (project) => {
          try {
            const resp = await apiClient.apiFetch<SessionsApiResponse>(
              `/api/projects/${encodeURIComponent(project.name)}/sessions?limit=50`,
            );

            const currentPinned = getPinnedIds();
            const sessions: SessionData[] = resp.sessions.map((s) => ({
              id: s.id,
              title: s.title || 'Untitled',
              updatedAt: s.updatedAt,
              provider: project.provider,
              projectName: project.name,
              projectPath: project.path,
              isPinned: currentPinned.includes(s.id),
            }));

            // Sort by last activity descending
            sessions.sort(
              (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
            );

            return {
              name: project.name,
              displayName: project.displayName,
              path: project.path,
              provider: project.provider,
              sessions,
            };
          } catch {
            // If a single project fails, return it with empty sessions
            return {
              name: project.name,
              displayName: project.displayName,
              path: project.path,
              provider: project.provider,
              sessions: [],
            };
          }
        }),
      );

      // Sort projects by most recent session activity
      projectsWithSessions.sort((a, b) => {
        const aTime = a.sessions[0]?.updatedAt ?? '';
        const bTime = b.sessions[0]?.updatedAt ?? '';
        return bTime.localeCompare(aTime);
      });

      setAllProjects(projectsWithSessions);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load sessions');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // -------------------------------------------------------------------------
  // Search filtering
  // -------------------------------------------------------------------------

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return allProjects;

    const query = searchQuery.toLowerCase();
    return allProjects
      .map((project) => ({
        ...project,
        sessions: project.sessions.filter((s) =>
          s.title.toLowerCase().includes(query),
        ),
      }))
      .filter((p) => p.sessions.length > 0);
  }, [allProjects, searchQuery]);

  // -------------------------------------------------------------------------
  // Pinned sessions (flat list across all projects)
  // -------------------------------------------------------------------------

  const pinnedSessions = useMemo(() => {
    const allSessions = allProjects.flatMap((p) => p.sessions);
    return allSessions
      .filter((s) => pinnedIds.includes(s.id))
      .sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
  }, [allProjects, pinnedIds]);

  // -------------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------------

  const createSession = useCallback(
    (projectName: string, projectPath: string) => {
      const stubId = `stub-${Date.now()}`;

      // Create stub session in timeline store
      useTimelineStore.getState().addSession({
        id: stubId,
        title: 'New Chat',
        messages: [],
        providerId: 'claude',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
          tokenBudget: null,
          contextWindowUsed: null,
          totalCost: null,
        },
      });

      // Mark as active
      useTimelineStore.getState().setActiveSession(stubId);

      // Navigate immediately -- user sees empty chat.
      // First message from composer will include { projectPath } in options,
      // which triggers backend session creation. onSessionCreated in
      // websocket-init.ts will replace stubId with real ID.
      router.push({
        pathname: '/(stack)/chat/[id]',
        params: { id: stubId, projectName, projectPath },
      });
    },
    [],
  );

  const deleteSession = useCallback(
    async (projectName: string, sessionId: string) => {
      try {
        await apiClient.apiFetch(
          `/api/projects/${encodeURIComponent(projectName)}/sessions/${encodeURIComponent(sessionId)}`,
          { method: 'DELETE' },
        );

        // Remove from timeline store
        useTimelineStore.getState().removeSession(sessionId);

        // Remove from pinned if present
        const currentPinned = getPinnedIds();
        if (currentPinned.includes(sessionId)) {
          const updated = currentPinned.filter((id) => id !== sessionId);
          setPinnedIds(updated);
          setPinnedIdsState(updated);
        }

        // Refetch to stay in sync
        await fetchSessions();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to delete session');
      }
    },
    [fetchSessions],
  );

  const setActiveSession = useCallback((sessionId: string) => {
    useTimelineStore.getState().setActiveSession(sessionId);
  }, []);

  const togglePin = useCallback((sessionId: string) => {
    const current = getPinnedIds();
    const updated = current.includes(sessionId)
      ? current.filter((id) => id !== sessionId)
      : [...current, sessionId];
    setPinnedIds(updated);
    setPinnedIdsState(updated);
  }, []);

  return {
    projects: filteredProjects,
    pinnedSessions,
    isLoading,
    error,
    activeSessionId,
    searchQuery,
    setSearchQuery,
    fetchSessions,
    createSession,
    deleteSession,
    setActiveSession,
    togglePin,
  };
}
