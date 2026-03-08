/**
 * useSessionSwitch tests — session switching with AbortController protection.
 *
 * Tests verify:
 * - New AbortController per switch (previous aborted)
 * - Cache hit: instant switch without fetch
 * - Cache miss: fetch messages, transform, add to store
 * - AbortError caught silently
 * - Real errors set loading to false
 * - Streaming abort: sends abort-session + resets stream store
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSessionSwitch } from './useSessionSwitch';
import { useTimelineStore } from '@/stores/timeline';
import { useStreamStore } from '@/stores/stream';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock api-client
const mockApiFetch = vi.fn();
vi.mock('@/lib/api-client', () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
}));

// Mock wsClient
const mockWsSend = vi.fn();
vi.mock('@/lib/websocket-client', () => ({
  wsClient: { send: (...args: unknown[]) => mockWsSend(...args) },
}));

// Mock transformBackendMessages -- simple transform for testing
vi.mock('@/lib/transformMessages', () => ({
  transformBackendMessages: (entries: unknown[]) => {
    interface MockEntry { message?: { role: string; content: string } }
    return (entries as MockEntry[])
      .filter((e): e is MockEntry & { message: { role: string; content: string } } => Boolean(e.message?.role))
      .map((e, i) => ({
        id: `msg-${i}`,
        role: e.message.role,
        content: typeof e.message.content === 'string' ? e.message.content : '',
        metadata: { timestamp: new Date().toISOString(), tokenCount: null, inputTokens: null, outputTokens: null, cacheReadTokens: null, cost: null, duration: null },
        providerContext: { providerId: 'claude', modelId: '', agentName: null },
      }));
  },
}));

describe('useSessionSwitch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useTimelineStore.getState().reset();
    useStreamStore.getState().reset();
    mockApiFetch.mockReset();
  });

  it('sets active session and navigates on switch', async () => {
    mockApiFetch.mockResolvedValue({ messages: [] });

    const { result } = renderHook(() => useSessionSwitch());

    await act(async () => {
      await result.current.switchSession('my-project', 'session-123');
    });

    expect(useTimelineStore.getState().activeSessionId).toBe('session-123');
    expect(mockNavigate).toHaveBeenCalledWith('/chat/session-123');
  });

  it('skips fetch when session has cached messages', async () => {
    // Pre-populate store with a session that has messages
    useTimelineStore.getState().addSession({
      id: 'cached-session',
      title: 'Test',
      messages: [
        {
          id: 'msg-1',
          role: 'user',
          content: 'hello',
          metadata: { timestamp: '2026-01-01', tokenCount: null, inputTokens: null, outputTokens: null, cacheReadTokens: null, cost: null, duration: null },
          providerContext: { providerId: 'claude', modelId: '', agentName: null },
        },
      ],
      providerId: 'claude',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
      metadata: { tokenBudget: null, contextWindowUsed: null, totalCost: null },
    });

    const { result } = renderHook(() => useSessionSwitch());

    await act(async () => {
      await result.current.switchSession('my-project', 'cached-session');
    });

    expect(mockApiFetch).not.toHaveBeenCalled();
    expect(useTimelineStore.getState().activeSessionId).toBe('cached-session');
    expect(mockNavigate).toHaveBeenCalledWith('/chat/cached-session');
  });

  it('fetches and transforms messages on cache miss', async () => {
    // Add a session with empty messages (cache miss)
    useTimelineStore.getState().addSession({
      id: 'empty-session',
      title: 'Empty',
      messages: [],
      providerId: 'claude',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
      metadata: { tokenBudget: null, contextWindowUsed: null, totalCost: null },
    });

    mockApiFetch.mockResolvedValue({
      messages: [
        { type: 'message', message: { role: 'user', content: 'hello' }, sessionId: 'empty-session' },
        { type: 'message', message: { role: 'assistant', content: 'hi there' }, sessionId: 'empty-session' },
      ],
    });

    const { result } = renderHook(() => useSessionSwitch());

    await act(async () => {
      await result.current.switchSession('my-project', 'empty-session');
    });

    expect(mockApiFetch).toHaveBeenCalledWith(
      '/api/projects/my-project/sessions/empty-session/messages',
      {},
      expect.any(AbortSignal),
    );

    // Messages should be added to the store
    const session = useTimelineStore.getState().sessions.find((s) => s.id === 'empty-session');
    expect(session?.messages.length).toBe(2);
  });

  it('aborts previous fetch on rapid switch', async () => {
    // First switch: slow fetch that we control
    let rejectFirst: ((reason: Error) => void) | undefined;
    mockApiFetch.mockImplementationOnce(
      () =>
        new Promise((_resolve, reject) => {
          rejectFirst = reject;
        }),
    );
    // Second switch: fast fetch
    mockApiFetch.mockResolvedValueOnce({ messages: [] });

    const { result } = renderHook(() => useSessionSwitch());

    // Start first switch (won't resolve)
    const firstPromise = act(async () => {
      await result.current.switchSession('proj', 'session-a');
    });

    // Immediately switch to second
    await act(async () => {
      await result.current.switchSession('proj', 'session-b');
    });

    // First fetch should have been aborted -- simulate the abort
    if (rejectFirst) {
      rejectFirst(new DOMException('The operation was aborted.', 'AbortError'));
    }
    await firstPromise;

    // Active session should be session-b
    expect(useTimelineStore.getState().activeSessionId).toBe('session-b');
  });

  it('sends abort-session and resets stream when switching during streaming', async () => {
    mockApiFetch.mockResolvedValue({ messages: [] });

    // Set stream store to streaming state
    useStreamStore.getState().startStream();
    useStreamStore.getState().setActiveSessionId('streaming-session');

    const { result } = renderHook(() => useSessionSwitch());

    await act(async () => {
      await result.current.switchSession('proj', 'new-session');
    });

    // Should have sent abort for the streaming session
    expect(mockWsSend).toHaveBeenCalledWith({
      type: 'abort-session',
      sessionId: 'streaming-session',
      provider: 'claude',
    });

    // Stream store should be reset
    expect(useStreamStore.getState().isStreaming).toBe(false);
  });

  it('catches AbortError silently', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockApiFetch.mockRejectedValue(new DOMException('Aborted', 'AbortError'));

    const { result } = renderHook(() => useSessionSwitch());

    await act(async () => {
      await result.current.switchSession('proj', 'session-x');
    });

    // No error logged for AbortError
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('logs real fetch errors', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockApiFetch.mockRejectedValue(new Error('Network failure'));

    const { result } = renderHook(() => useSessionSwitch());

    await act(async () => {
      await result.current.switchSession('proj', 'session-y');
    });

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(result.current.isLoadingMessages).toBe(false);
    consoleErrorSpy.mockRestore();
  });
});
