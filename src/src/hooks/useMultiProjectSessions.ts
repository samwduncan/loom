/**
 * useMultiProjectSessions -- fetches all projects with sessions, groups by project > date.
 *
 * Returns hierarchical ProjectGroup[] with junk filtering, plus expand/collapse state
 * persisted to localStorage. Listens for loom:projects-updated to refetch.
 *
 * This hook maintains its own state -- it does NOT touch the timeline store.
 * The existing useSessionList + timeline store continue to work for message fetching
 * when a session is clicked.
 *
 * Constitution: Named export (2.2), selector-only store access (4.2), no default export.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { apiFetch } from '@/lib/api-client';
import { transformBackendSession } from '@/lib/transformMessages';
import type { BackendSessionData } from '@/lib/transformMessages';
import { groupSessionsByProject } from '@/lib/sessionGrouping';
import type { ProjectGroup } from '@/types/session';
import { useProjectContext } from '@/hooks/useProjectContext';

const EXPANDED_STORAGE_KEY = 'loom-expanded-projects';

/** Backend shape for GET /api/projects response item. */
interface BackendProject {
  name: string;
  path: string;
  displayName: string;
  fullPath: string;
  isCustomName: boolean;
  sessions: BackendSessionData[];
  sessionMeta: { hasMore: boolean; total: number };
}

interface UseMultiProjectSessionsResult {
  projectGroups: ProjectGroup[];
  isLoading: boolean;
  error: string | null;
  expandedProjects: Set<string>;
  toggleProject: (name: string) => void;
}

/** Load expanded projects set from localStorage. */
function loadExpanded(): Set<string> {
  try {
    const stored = localStorage.getItem(EXPANDED_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as string[];
      return new Set(parsed);
    }
  } catch {
    // Ignore parse errors
  }
  return new Set();
}

/** Persist expanded projects set to localStorage. */
function saveExpanded(expanded: Set<string>): void {
  try {
    localStorage.setItem(EXPANDED_STORAGE_KEY, JSON.stringify([...expanded]));
  } catch {
    // Ignore quota errors
  }
}

export function useMultiProjectSessions(): UseMultiProjectSessionsResult {
  const { projectName: currentProject } = useProjectContext();

  const [projectGroups, setProjectGroups] = useState<ProjectGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(() => {
    const stored = loadExpanded();
    // If nothing stored, expand the current project by default
    if (stored.size === 0 && currentProject) {
      stored.add(currentProject);
    }
    return stored;
  });

  // Refs for stable access from event listener
  const expandedRef = useRef(expandedProjects);
  useEffect(() => {
    expandedRef.current = expandedProjects;
  }, [expandedProjects]);

  // Abort controller ref for cancelling in-flight fetches on refetch
  const fetchControllerRef = useRef<AbortController | null>(null);

  /** Fetch all projects and their sessions. */
  const fetchProjects = useCallback(async (opts?: { signal?: AbortSignal }) => {
    // Cancel any in-flight fetch before starting a new one
    fetchControllerRef.current?.abort();
    const controller = new AbortController();
    fetchControllerRef.current = controller;
    const signal = opts?.signal ?? controller.signal;

    setIsLoading(true);
    try {
      const projects = await apiFetch<BackendProject[]>('/api/projects', {}, signal);

      // For each project with hasMore, fetch full session list if expanded
      const projectInputs = await Promise.all(
        projects.map(async (project) => {
          let sessions: BackendSessionData[];

          if (project.sessionMeta.hasMore && expandedRef.current.has(project.name)) {
            try {
              const fullData = await apiFetch<{ sessions: BackendSessionData[]; total: number; hasMore: boolean }>(
                `/api/projects/${encodeURIComponent(project.name)}/sessions?limit=999`,
                {},
                signal,
              );
              sessions = fullData.sessions;
            } catch {
              // Fallback to embedded sessions
              sessions = project.sessions;
            }
          } else {
            sessions = project.sessions;
          }

          return {
            projectName: project.name,
            displayName: project.displayName,
            projectPath: project.path,
            sessions: sessions.map(transformBackendSession),
          };
        }),
      );

      const grouped = groupSessionsByProject(projectInputs);
      setProjectGroups(grouped);
      setError(null);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      const message = err instanceof Error ? err.message : 'Failed to load projects';
      setError(message);
      setProjectGroups([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    void fetchProjects();
    return () => { fetchControllerRef.current?.abort(); };
  }, [fetchProjects]);

  // Listen for projects-updated event to refetch
  useEffect(() => {
    const handleProjectsUpdated = () => {
      void fetchProjects();
    };

    window.addEventListener('loom:projects-updated', handleProjectsUpdated);
    return () => {
      window.removeEventListener('loom:projects-updated', handleProjectsUpdated);
    };
  }, [fetchProjects]);

  const toggleProject = useCallback((name: string) => {
    setExpandedProjects((prev) => {
      const next = new Set(prev);
      const isExpanding = !next.has(name);
      if (isExpanding) {
        next.add(name);
      } else {
        next.delete(name);
      }
      saveExpanded(next);

      // Refetch when expanding — a newly expanded project may need full session data
      if (isExpanding) {
        // Update the ref immediately so fetchProjects sees the new expanded state
        expandedRef.current = next;
        void fetchProjects();
      }

      return next;
    });
  }, [fetchProjects]);

  return { projectGroups, isLoading, error, expandedProjects, toggleProject };
}
