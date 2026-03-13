/**
 * usePaginatedMessages -- unit tests.
 *
 * Tests pagination hook behavior: loadMore fetches, deduplication,
 * guards (isFetchingMore, hasMore), and state reset on session change.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePaginatedMessages } from './usePaginatedMessages';
import { useTimelineStore } from '@/stores/timeline';

// Mock apiFetch
vi.mock('@/lib/api-client', () => ({
  apiFetch: vi.fn(),
}));

// Mock transformBackendMessages
vi.mock('@/lib/transformMessages', () => ({
  transformBackendMessages: vi.fn((entries: unknown[]) =>
    (entries as Array<{ uuid: string; text: string }>).map((e) => ({
      id: e.uuid,
      role: 'assistant' as const,
      content: e.text,
      metadata: {
        timestamp: new Date().toISOString(),
        tokenCount: null,
        inputTokens: null,
        outputTokens: null,
        cacheReadTokens: null,
        cost: null,
        duration: null,
      },
      providerContext: { providerId: 'claude' as const, modelId: '', agentName: null },
    })),
  ),
}));

import { apiFetch } from '@/lib/api-client';

const mockApiFetch = vi.mocked(apiFetch);

function setupSession(sessionId: string, messages: Array<{ id: string; role: string; content: string }>) {
  const store = useTimelineStore.getState();
  store.addSession({
    id: sessionId,
    title: 'Test Session',
    messages: messages.map((m) => ({
      ...m,
      role: m.role as 'user' | 'assistant',
      metadata: {
        timestamp: new Date().toISOString(),
        tokenCount: null,
        inputTokens: null,
        outputTokens: null,
        cacheReadTokens: null,
        cost: null,
        duration: null,
      },
      providerContext: { providerId: 'claude' as const, modelId: '', agentName: null },
    })),
    providerId: 'claude',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: { tokenBudget: null, contextWindowUsed: null, totalCost: null },
  });
}

describe('usePaginatedMessages', () => {
  beforeEach(() => {
    useTimelineStore.getState().reset();
    vi.clearAllMocks();
  });

  afterEach(() => {
    useTimelineStore.getState().reset();
  });

  it('returns initial state with hasMore=false and isFetchingMore=false', () => {
    const { result } = renderHook(() => usePaginatedMessages('project', 'session-1'));
    expect(result.current.hasMore).toBe(false);
    expect(result.current.isFetchingMore).toBe(false);
    expect(result.current.totalMessages).toBe(0);
  });

  it('loadMore is a no-op when hasMore is false', async () => {
    const { result } = renderHook(() => usePaginatedMessages('project', 'session-1'));

    await act(async () => {
      result.current.loadMore();
    });

    expect(mockApiFetch).not.toHaveBeenCalled();
  });

  it('loadMore fetches next page with correct offset after setInitialPaginationState', async () => {
    setupSession('session-1', [
      { id: 'msg-1', role: 'user', content: 'Hello' },
      { id: 'msg-2', role: 'assistant', content: 'Hi' },
    ]);

    mockApiFetch.mockResolvedValueOnce({
      messages: [{ uuid: 'msg-0', text: 'Earlier message' }],
      total: 10,
      hasMore: true,
      offset: 2,
      limit: 50,
    });

    const { result } = renderHook(() => usePaginatedMessages('project', 'session-1'));

    // Initialize pagination state (simulating what useSessionSwitch would do)
    act(() => {
      result.current.setInitialPaginationState(true, 10);
    });

    expect(result.current.hasMore).toBe(true);
    expect(result.current.totalMessages).toBe(10);

    await act(async () => {
      result.current.loadMore();
    });

    expect(mockApiFetch).toHaveBeenCalledWith(
      '/api/projects/project/sessions/session-1/messages?limit=50&offset=2',
      {},
      undefined,
    );
  });

  it('deduplicates messages by ID before prepending', async () => {
    setupSession('session-1', [
      { id: 'msg-1', role: 'user', content: 'Hello' },
      { id: 'msg-2', role: 'assistant', content: 'Hi' },
    ]);

    // Response includes msg-1 which already exists
    mockApiFetch.mockResolvedValueOnce({
      messages: [
        { uuid: 'msg-0', text: 'New message' },
        { uuid: 'msg-1', text: 'Duplicate' },
      ],
      total: 10,
      hasMore: false,
      offset: 2,
      limit: 50,
    });

    const { result } = renderHook(() => usePaginatedMessages('project', 'session-1'));

    act(() => {
      result.current.setInitialPaginationState(true, 10);
    });

    await act(async () => {
      result.current.loadMore();
    });

    // Only msg-0 should be prepended (msg-1 is duplicate)
    const session = useTimelineStore.getState().sessions.find((s) => s.id === 'session-1');
    const ids = session?.messages.map((m) => m.id);
    expect(ids).toEqual(['msg-0', 'msg-1', 'msg-2']);
  });

  it('prevents concurrent fetches (isFetchingMore guard)', async () => {
    setupSession('session-1', [
      { id: 'msg-1', role: 'user', content: 'Hello' },
    ]);

    // Slow response that won't resolve immediately
    let resolvePromise: (value: unknown) => void;
    const slowPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    mockApiFetch.mockReturnValueOnce(slowPromise as Promise<unknown>);

    const { result } = renderHook(() => usePaginatedMessages('project', 'session-1'));

    act(() => {
      result.current.setInitialPaginationState(true, 10);
    });

    // Start first fetch (won't resolve yet)
    act(() => {
      result.current.loadMore();
    });

    expect(result.current.isFetchingMore).toBe(true);

    // Try second fetch -- should be a no-op
    await act(async () => {
      result.current.loadMore();
    });

    expect(mockApiFetch).toHaveBeenCalledTimes(1);

    // Resolve the first fetch
    await act(async () => {
      resolvePromise({ // ASSERT: resolvePromise is assigned by Promise constructor above
        messages: [],
        total: 10,
        hasMore: false,
        offset: 1,
        limit: 50,
      });
    });

    await waitFor(() => {
      expect(result.current.isFetchingMore).toBe(false);
    });
  });

  it('resets state when sessionId changes', () => {
    const { result, rerender } = renderHook(
      ({ sessionId }) => usePaginatedMessages('project', sessionId),
      { initialProps: { sessionId: 'session-1' } },
    );

    act(() => {
      result.current.setInitialPaginationState(true, 100);
    });

    expect(result.current.hasMore).toBe(true);
    expect(result.current.totalMessages).toBe(100);

    // Switch session
    rerender({ sessionId: 'session-2' });

    expect(result.current.hasMore).toBe(false);
    expect(result.current.totalMessages).toBe(0);
  });

  it('loadMore is a no-op when projectName is null', async () => {
    const { result } = renderHook(() => usePaginatedMessages(null, 'session-1'));

    act(() => {
      result.current.setInitialPaginationState(true, 10);
    });

    await act(async () => {
      result.current.loadMore();
    });

    expect(mockApiFetch).not.toHaveBeenCalled();
  });

  it('loadMore is a no-op when sessionId is null', async () => {
    const { result } = renderHook(() => usePaginatedMessages('project', null));

    act(() => {
      result.current.setInitialPaginationState(true, 10);
    });

    await act(async () => {
      result.current.loadMore();
    });

    expect(mockApiFetch).not.toHaveBeenCalled();
  });

  it('updates hasMore from response', async () => {
    setupSession('session-1', [
      { id: 'msg-1', role: 'user', content: 'Hello' },
    ]);

    mockApiFetch.mockResolvedValueOnce({
      messages: [{ uuid: 'msg-0', text: 'Older' }],
      total: 3,
      hasMore: false,
      offset: 1,
      limit: 50,
    });

    const { result } = renderHook(() => usePaginatedMessages('project', 'session-1'));

    act(() => {
      result.current.setInitialPaginationState(true, 3);
    });

    expect(result.current.hasMore).toBe(true);

    await act(async () => {
      result.current.loadMore();
    });

    expect(result.current.hasMore).toBe(false);
  });
});
