/**
 * useProjectContext -- resolves the active project name.
 *
 * On first call, fetches GET /api/projects, takes the first project's name,
 * stores in a module-level variable (singleton -- project doesn't change
 * during session). Returns { projectName, isLoading }.
 *
 * Retries up to 3 times with exponential backoff if the initial fetch fails
 * (handles race with bootstrapAuth() which may not have stored the JWT yet).
 *
 * Uses "adjust state during rendering" pattern to satisfy React 19
 * set-state-in-effect ESLint rule.
 *
 * Constitution: Named export (2.2), no default export.
 */

import { useState, useEffect, useRef } from 'react';
import { apiFetch } from '@/lib/api-client';

const PROJECT_STORAGE_KEY = 'loom-project-name';
const MAX_RETRIES = 3;
const RETRY_BASE_MS = 500;

/** Backend returns either a raw array or { projects: [...] } depending on version */
type ProjectEntry = { name: string; path: string; sessions?: unknown };
type ProjectsResponse = ProjectEntry[] | { projects: ProjectEntry[] };

/** Module-level singleton -- resolved once, reused on subsequent hook calls */
let resolvedProjectName: string | null = null;
let resolvePromise: Promise<string> | null = null;

async function resolveProject(): Promise<string> {
  if (resolvedProjectName) return resolvedProjectName;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const data = await apiFetch<ProjectsResponse>('/api/projects');
      const projects = Array.isArray(data) ? data : data.projects;
      const firstName = projects[0]?.name ?? '';
      resolvedProjectName = firstName;
      if (firstName) {
        localStorage.setItem(PROJECT_STORAGE_KEY, firstName);
      }
      return firstName;
    } catch {
      if (attempt < MAX_RETRIES) {
        // Wait before retrying -- auth token may not be stored yet
        await new Promise((r) => setTimeout(r, RETRY_BASE_MS * Math.pow(2, attempt)));
        continue;
      }
      // All retries exhausted -- fallback to localStorage
      const stored = localStorage.getItem(PROJECT_STORAGE_KEY);
      resolvedProjectName = stored ?? '';
      return resolvedProjectName;
    }
  }

  // TypeScript exhaustiveness -- unreachable
  return '';
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
