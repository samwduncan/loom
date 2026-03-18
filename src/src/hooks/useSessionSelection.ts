/**
 * useSessionSelection -- selection state management and bulk delete logic.
 *
 * Manages a set of selected session IDs, selection mode toggle, and
 * parallel bulk delete with partial failure handling.
 *
 * Constitution: Named exports only (2.2), no default export.
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api-client';
import type { ProjectGroup, Session } from '@/types/session';

type NavigateFunction = (path: string) => void;
type RemoveSessionFunction = (id: string) => void;

export function useSessionSelection() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);

  const toggle = useCallback((id: string) => {
    setIsSelecting(true);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback((ids: string[]) => {
    setIsSelecting(true);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const id of ids) {
        next.add(id);
      }
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setSelectedIds(new Set());
    setIsSelecting(false);
  }, []);

  const bulkDelete = useCallback(
    async (
      projectGroups: ProjectGroup[],
      activeSessionId: string | null,
      navigate: NavigateFunction,
      removeSession: RemoveSessionFunction,
    ) => {
      // Build session-to-project map
      const sessionProjectMap = new Map<string, string>();
      for (const group of projectGroups) {
        for (const dg of group.dateGroups) {
          for (const session of dg.sessions) {
            sessionProjectMap.set(session.id, group.projectName);
          }
        }
      }

      // Capture current selection before clearing
      const toDelete = [...selectedIds];

      // Fire parallel DELETE requests
      const results = await Promise.allSettled(
        toDelete.map(async (sessionId) => {
          const projectName = sessionProjectMap.get(sessionId);
          if (!projectName) {
            throw new Error(`No project found for session ${sessionId}`);
          }
          await apiFetch(
            `/api/projects/${encodeURIComponent(projectName)}/sessions/${encodeURIComponent(sessionId)}`,
            { method: 'DELETE' },
          );
          return sessionId;
        }),
      );

      // Process results
      let failCount = 0;
      for (const result of results) {
        if (result.status === 'fulfilled') {
          removeSession(result.value);
        } else {
          failCount++;
        }
      }

      if (failCount > 0) {
        toast.error(`Failed to delete ${failCount} session(s)`);
      }

      // Dispatch refetch event
      window.dispatchEvent(new Event('loom:projects-updated'));

      // Navigate if active session was in the delete set
      const deleteSet = new Set(toDelete);
      if (activeSessionId && deleteSet.has(activeSessionId)) {
        // Collect all remaining sessions (those not in the delete set that succeeded)
        const deletedIds = new Set(
          results
            .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled')
            .map((r) => r.value),
        );

        const remaining: Session[] = [];
        for (const group of projectGroups) {
          for (const dg of group.dateGroups) {
            for (const session of dg.sessions) {
              if (!deletedIds.has(session.id)) {
                remaining.push(session);
              }
            }
          }
        }

        remaining.sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        );

        if (remaining.length > 0) {
          navigate(`/chat/${remaining[0]!.id}`); // ASSERT: length check above
        } else {
          navigate('/chat');
        }
      }

      clear();
    },
    [selectedIds, clear],
  );

  // Escape key listener to exit selection mode
  useEffect(() => {
    if (!isSelecting) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        clear();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => { window.removeEventListener('keydown', handleKeyDown); };
  }, [isSelecting, clear]);

  return useMemo(
    () => ({ selectedIds, isSelecting, toggle, selectAll, clear, bulkDelete }),
    [selectedIds, isSelecting, toggle, selectAll, clear, bulkDelete],
  );
}
