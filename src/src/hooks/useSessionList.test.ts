/**
 * useSessionList tests -- fetch on mount, error handling, session population.
 */

import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSessionList } from './useSessionList';
import { useTimelineStore } from '@/stores/timeline';

// Mock API client
const mockApiFetch = vi.fn();
vi.mock('@/lib/api-client', () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
}));

// Mock project context
vi.mock('@/hooks/useProjectContext', () => ({
  useProjectContext: () => ({ projectName: 'test-project', isLoading: false }),
  _resetProjectContextForTesting: vi.fn(),
}));

describe('useSessionList', () => {
  beforeEach(() => {
    useTimelineStore.setState({
      sessions: [],
      activeSessionId: null,
      activeProviderId: 'claude',
    });
    mockApiFetch.mockReset();
  });

  it('fetches sessions on mount and populates timeline store', async () => {
    mockApiFetch.mockResolvedValue({
      sessions: [
        {
          id: 'sess-1',
          summary: 'Test Session',
          messageCount: 5,
          lastActivity: '2026-03-06T12:00:00Z',
          cwd: '/home/user',
        },
      ],
      total: 1,
      hasMore: false,
    });

    const { result } = renderHook(() => useSessionList());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeNull();
    const sessions = useTimelineStore.getState().sessions;
    expect(sessions).toHaveLength(1);
    expect(sessions[0]?.title).toBe('Test Session');
  });

  it('sets error state on fetch failure', async () => {
    mockApiFetch.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useSessionList());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Network error');
  });

  it('does not add duplicate sessions to store', async () => {
    // Pre-populate store with a session
    useTimelineStore.setState({
      sessions: [
        {
          id: 'sess-existing',
          title: 'Existing',
          messages: [],
          providerId: 'claude',
          createdAt: '2026-03-06T12:00:00Z',
          updatedAt: '2026-03-06T12:00:00Z',
          metadata: { tokenBudget: null, contextWindowUsed: null, totalCost: null },
        },
      ],
      activeSessionId: null,
      activeProviderId: 'claude',
    });

    mockApiFetch.mockResolvedValue({
      sessions: [
        {
          id: 'sess-existing',
          summary: 'Existing',
          messageCount: 1,
          lastActivity: '2026-03-06T12:00:00Z',
          cwd: '/home/user',
        },
        {
          id: 'sess-new',
          summary: 'New Session',
          messageCount: 0,
          lastActivity: '2026-03-06T13:00:00Z',
          cwd: '/home/user',
        },
      ],
      total: 2,
      hasMore: false,
    });

    const { result } = renderHook(() => useSessionList());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const sessions = useTimelineStore.getState().sessions;
    expect(sessions).toHaveLength(2); // existing + new, NOT duplicate of existing
  });
});
