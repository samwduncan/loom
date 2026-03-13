/**
 * usePaginatedMessages -- manages paginated message loading for long conversations.
 *
 * Provides loadMore() to fetch older messages on demand (scroll-up trigger).
 * Deduplicates by message ID before prepending to timeline store.
 * Guards against concurrent fetches and fetching when no more pages exist.
 *
 * Initial pagination state (hasMore, total) is set by useSessionSwitch after
 * the initial paginated fetch via setInitialPaginationState().
 *
 * Constitution: Named exports (2.2), selector-only store access in components (4.2).
 */

import { useState, useCallback, useRef } from 'react';
import { apiFetch } from '@/lib/api-client';
import { transformBackendMessages, type BackendEntry } from '@/lib/transformMessages';
import { useTimelineStore } from '@/stores/timeline';

interface PaginatedMessagesResponse {
  messages: BackendEntry[];
  total: number;
  hasMore: boolean;
  offset: number;
  limit: number;
}

export function usePaginatedMessages(
  projectName: string | null,
  sessionId: string | null,
) {
  const [paginationState, setPaginationState] = useState({
    hasMore: false,
    isFetchingMore: false,
    totalMessages: 0,
    trackedSessionId: sessionId,
  });

  // Reset when sessionId changes using "adjust state during rendering" pattern.
  // React explicitly supports setState during render if guarded by a condition.
  if (paginationState.trackedSessionId !== sessionId) {
    setPaginationState({
      hasMore: false,
      isFetchingMore: false,
      totalMessages: 0,
      trackedSessionId: sessionId,
    });
  }

  const isFetchingRef = useRef(false);

  const setInitialPaginationState = useCallback(
    (initialHasMore: boolean, total: number) => {
      setPaginationState((prev) => ({
        ...prev,
        hasMore: initialHasMore,
        totalMessages: total,
      }));
    },
    [],
  );

  const loadMore = useCallback(() => {
    if (!projectName || !sessionId || isFetchingRef.current || !paginationState.hasMore) return;

    isFetchingRef.current = true;
    setPaginationState((prev) => ({ ...prev, isFetchingMore: true }));

    // eslint-disable-next-line loom/no-external-store-mutation -- infrastructure hook reads state for offset calculation
    const store = useTimelineStore.getState();
    const session = store.sessions.find((s) => s.id === sessionId);
    const offset = session?.messages.length ?? 0;

    apiFetch<PaginatedMessagesResponse>(
      `/api/projects/${projectName}/sessions/${sessionId}/messages?limit=50&offset=${offset}`,
      {},
      undefined,
    )
      .then((data) => {
        const transformed = transformBackendMessages(data.messages);

        // Deduplicate: filter out messages already in the store
        // eslint-disable-next-line loom/no-external-store-mutation -- infrastructure hook reads state for dedup check
        const currentStore = useTimelineStore.getState();
        const currentSession = currentStore.sessions.find((s) => s.id === sessionId);
        const existingIds = new Set(currentSession?.messages.map((m) => m.id) ?? []);
        const newMessages = transformed.filter((m) => !existingIds.has(m.id));

        if (newMessages.length > 0) {
          currentStore.prependMessages(sessionId, newMessages);
        }

        setPaginationState((prev) => ({
          ...prev,
          hasMore: data.hasMore,
          totalMessages: data.total,
        }));
      })
      .catch((err) => {
        console.error('[usePaginatedMessages] Failed to fetch more messages:', err);
      })
      .finally(() => {
        isFetchingRef.current = false;
        setPaginationState((prev) => ({ ...prev, isFetchingMore: false }));
      });
  }, [projectName, sessionId, paginationState.hasMore]);

  return {
    hasMore: paginationState.hasMore,
    isFetchingMore: paginationState.isFetchingMore,
    totalMessages: paginationState.totalMessages,
    loadMore,
    setInitialPaginationState,
  };
}
