/**
 * useProjectContext -- resolves the active project name.
 *
 * On first call, fetches GET /api/projects, takes the first project's name,
 * stores in a module-level variable (singleton -- project doesn't change
 * during session). Returns { projectName, isLoading }.
 *
 * Uses "adjust state during rendering" pattern to satisfy React 19
 * set-state-in-effect ESLint rule.
 *
 * Constitution: Named export (2.2), no default export.
 */

import { useState, useEffect, useRef } from 'react';
import { apiFetch } from '@/lib/api-client';

const PROJECT_STORAGE_KEY = 'loom-project-name';

interface ProjectsResponse {
  projects: Array<{ name: string; path: string; sessions: number }>;
}

/** Module-level singleton -- resolved once, reused on subsequent hook calls */
let resolvedProjectName: string | null = null;
let resolvePromise: Promise<string> | null = null;

/** Reset for testing */
export function _resetProjectContextForTesting(): void {
  resolvedProjectName = null;
  resolvePromise = null;
}

async function resolveProject(): Promise<string> {
  if (resolvedProjectName) return resolvedProjectName;

  try {
    const data = await apiFetch<ProjectsResponse>('/api/projects');
    const firstName = data.projects[0]?.name ?? '';
    resolvedProjectName = firstName;
    if (firstName) {
      localStorage.setItem(PROJECT_STORAGE_KEY, firstName);
    }
    return firstName;
  } catch {
    // Fallback to localStorage if backend unavailable
    const stored = localStorage.getItem(PROJECT_STORAGE_KEY);
    resolvedProjectName = stored ?? '';
    return resolvedProjectName;
  }
}

export function useProjectContext(): { projectName: string; isLoading: boolean } {
  // "Adjust state during rendering" pattern -- initialize from resolved value
  // instead of setting state in effect synchronously (React 19 ESLint rule).
  const [projectName, setProjectName] = useState<string>(() => resolvedProjectName ?? '');
  const [isLoading, setIsLoading] = useState<boolean>(() => resolvedProjectName === null);
  const mountedRef = useRef(true);

  // If already resolved at render time, adjust state immediately (no effect needed)
  if (resolvedProjectName !== null && projectName !== resolvedProjectName) {
    setProjectName(resolvedProjectName);
    setIsLoading(false);
  }

  useEffect(() => {
    mountedRef.current = true;

    if (resolvedProjectName !== null) return;

    // Deduplicate concurrent calls
    if (!resolvePromise) {
      resolvePromise = resolveProject();
    }

    resolvePromise.then((name) => {
      if (mountedRef.current) {
        setProjectName(name);
        setIsLoading(false);
      }
    });

    return () => { mountedRef.current = false; };
  }, []);

  return { projectName, isLoading };
}
