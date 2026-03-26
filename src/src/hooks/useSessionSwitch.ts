/**
 * useSessionSwitch -- coordinates session switching with AbortController protection.
 *
 * Handles:
 * - Aborting pending fetches on rapid session switching
 * - Aborting active streams when switching away
 * - Memory cache check (skip fetch if messages already loaded)
 * - Fetching and transforming backend messages on cache miss
 * - URL navigation via React Router
 *
 * Uses getState() for store reads in the callback (infrastructure hook pattern
 * established in websocket-init.ts). This is not a React component -- it's a
 * coordinator callback that runs outside the render cycle.
 *
 * Constitution: Named exports (2.2), selector-only store access in components (4.2).
 */

import { useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '@/lib/api-client';
import { transformBackendMessages } from '@/lib/transformMessages';
import { useTimelineStore } from '@/stores/timeline';
import { useStreamStore } from '@/stores/stream';
import { wsClient } from '@/lib/websocket-client';
import type { PaginatedMessagesResponse } from '@/types/api';

export function useSessionSwitch(
  onPaginationInit?: (hasMore: boolean, total: number) => void,
) {
  const abortRef = useRef<AbortController | null>(null);
  const navigate = useNavigate();
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const switchSession = useCallback(
    async (projectName: string, sessionId: string) => {
      // 1. Cancel any pending fetch
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      // 2. If streaming, abort current stream
      // eslint-disable-next-line loom/no-external-store-mutation -- infrastructure hook reads state, not mutation
      const streamState = useStreamStore.getState();
      if (streamState.isStreaming) {
        const activeStreamSessionId = streamState.activeSessionId;
        if (activeStreamSessionId) {
          wsClient.send({
            type: 'abort-session',
            sessionId: activeStreamSessionId,
            provider: 'claude',
          });
        }
        streamState.reset();
      }

      // 3. Check memory cache -- session with messages already loaded
      // eslint-disable-next-line loom/no-external-store-mutation -- infrastructure hook reads state, not mutation
      const timelineState = useTimelineStore.getState();
      const cached = timelineState.sessions.find((s) => s.id === sessionId);
      if (cached && cached.messages.length > 0) {
        timelineState.setActiveSession(sessionId);
        navigate(`/chat/${sessionId}`);
        return;
      }

      // 4. Set active + navigate (shows loading skeleton)
      timelineState.setActiveSession(sessionId);
      navigate(`/chat/${sessionId}`);
      setIsLoadingMessages(true);

      // 5. Ensure session exists in store before fetching messages.
      // On reload or deep-link, persistence rehydrates without this session.
      // eslint-disable-next-line loom/no-external-store-mutation -- infrastructure hook ensures session exists
      const storeBeforeFetch = useTimelineStore.getState();
      if (!storeBeforeFetch.sessions.find((s) => s.id === sessionId)) {
        storeBeforeFetch.addSession({
          id: sessionId,
          title: 'Loading…',
          messages: [],
          providerId: 'claude',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          metadata: { tokenBudget: null, contextWindowUsed: null, totalCost: null },
        });
      }

      // 6. Fetch messages with abort signal (load all messages to avoid pagination scroll jumps)
      try {
        const data = await apiFetch<PaginatedMessagesResponse>(
          `/api/projects/${projectName}/sessions/${sessionId}/messages?limit=10000&offset=0`,
          {},
          abortRef.current.signal,
        );

        const messages = transformBackendMessages(data.messages);
        // Batch: single store update instead of 100 individual addMessage calls
        // eslint-disable-next-line loom/no-external-store-mutation -- infrastructure hook sets messages after fetch
        useTimelineStore.getState().prependMessages(sessionId, messages);

        // Initialize pagination state for usePaginatedMessages
        onPaginationInit?.(data.hasMore, data.total);

        setIsLoadingMessages(false);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          // Expected on rapid session switch -- silently ignore
          return;
        }
        console.error('[useSessionSwitch] Failed to fetch messages:', err);
        setIsLoadingMessages(false);
      }
    },
    [navigate, onPaginationInit],
  );

  return { switchSession, isLoadingMessages };
}
