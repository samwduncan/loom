/**
 * Session search filtering -- pure function and React hook.
 *
 * filterProjectGroups is exported as a pure function for direct testing.
 * useSessionSearch wraps it with React state for the query string.
 *
 * Constitution: Named exports only (2.2), no default export.
 */

import { useState, useCallback, useMemo } from 'react';
import type { ProjectGroup } from '@/types/session';

/**
 * Filter project groups by session title substring match (case-insensitive).
 * Returns groups unchanged when query is empty/whitespace.
 * Drops empty date groups and empty projects after filtering.
 * Recalculates visibleCount per project.
 */
export function filterProjectGroups(groups: ProjectGroup[], query: string): ProjectGroup[] {
  const trimmed = query.trim();
  if (trimmed === '') return groups;

  const lowerQuery = trimmed.toLowerCase();

  return groups
    .map((project) => {
      const filteredDateGroups = project.dateGroups
        .map((dg) => ({
          ...dg,
          sessions: dg.sessions.filter((s) =>
            s.title.toLowerCase().includes(lowerQuery),
          ),
        }))
        .filter((dg) => dg.sessions.length > 0);

      const visibleCount = filteredDateGroups.reduce(
        (sum, dg) => sum + dg.sessions.length,
        0,
      );

      return {
        ...project,
        dateGroups: filteredDateGroups,
        visibleCount,
      };
    })
    .filter((project) => project.visibleCount > 0);
}

/**
 * React hook wrapping filterProjectGroups with query state.
 * Returns the query, setter, and a bound filter function.
 */
export function useSessionSearch() {
  const [query, setQuery] = useState('');

  const filterGroups = useCallback(
    (groups: ProjectGroup[]): ProjectGroup[] => filterProjectGroups(groups, query),
    [query],
  );

  return useMemo(
    () => ({ query, setQuery, filterGroups }),
    [query, setQuery, filterGroups],
  );
}
