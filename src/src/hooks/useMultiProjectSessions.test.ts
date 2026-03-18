/**
 * useMultiProjectSessions tests -- verifies multi-project fetch, grouping, and expand/collapse.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useMultiProjectSessions } from './useMultiProjectSessions';

// Mock apiFetch
const mockApiFetch = vi.fn();
vi.mock('@/lib/api-client', () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
}));

// Mock useProjectContext
vi.mock('@/hooks/useProjectContext', () => ({
  useProjectContext: () => ({ projectName: '-home-user-alpha', projectPath: '/home/user/alpha', isLoading: false }),
}));

/** Build a mock projects response with dates relative to now for stable grouping. */
function makeMockProjects() {
  const now = new Date();
  const todayStr = new Date(now.getTime() - 3600_000).toISOString(); // 1 hour ago
  const yesterdayStr = new Date(now.getTime() - 86_400_000 - 3600_000).toISOString();

  return [
    {
      name: '-home-user-alpha',
      path: '/home/user/alpha',
      displayName: 'alpha',
      fullPath: '/home/user/alpha',
      isCustomName: false,
      sessions: [
        { id: 'a1', summary: 'Alpha session 1', messageCount: 5, lastActivity: todayStr, cwd: '/home/user/alpha' },
        { id: 'a2', summary: 'Alpha session 2', messageCount: 3, lastActivity: yesterdayStr, cwd: '/home/user/alpha' },
      ],
      sessionMeta: { hasMore: false, total: 2 },
    },
    {
      name: '-home-user-zebra',
      path: '/home/user/zebra',
      displayName: 'zebra',
      fullPath: '/home/user/zebra',
      isCustomName: false,
      sessions: [
        { id: 'z1', summary: 'Zebra session', messageCount: 2, lastActivity: todayStr, cwd: '/home/user/zebra' },
        { id: 'z2', summary: 'New Session', messageCount: 0, lastActivity: todayStr, cwd: '/home/user/zebra' },
      ],
      sessionMeta: { hasMore: false, total: 2 },
    },
  ];
}

describe('useMultiProjectSessions', () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
    localStorage.clear();
  });

  it('fetches projects and returns grouped data', async () => {
    mockApiFetch.mockResolvedValueOnce(makeMockProjects());

    const { result } = renderHook(() => useMultiProjectSessions());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.projectGroups).toHaveLength(2);
    // Projects sorted alphabetically
    expect(result.current.projectGroups[0]?.displayName).toBe('alpha');
    expect(result.current.projectGroups[1]?.displayName).toBe('zebra');
  });

  it('filters junk sessions from grouped output', async () => {
    mockApiFetch.mockResolvedValueOnce(makeMockProjects());

    const { result } = renderHook(() => useMultiProjectSessions());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Zebra has 2 sessions total but "New Session" with messageCount=0 is junk
    const zebra = result.current.projectGroups.find((p) => p.displayName === 'zebra');
    expect(zebra?.sessionCount).toBe(2);
    expect(zebra?.visibleCount).toBe(1);
  });

  it('toggleProject adds/removes from expanded set', async () => {
    mockApiFetch.mockResolvedValueOnce(makeMockProjects());

    const { result } = renderHook(() => useMultiProjectSessions());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Current project should be expanded by default
    expect(result.current.expandedProjects.has('-home-user-alpha')).toBe(true);

    // Toggle it off
    act(() => {
      result.current.toggleProject('-home-user-alpha');
    });
    expect(result.current.expandedProjects.has('-home-user-alpha')).toBe(false);

    // Toggle it back on
    act(() => {
      result.current.toggleProject('-home-user-alpha');
    });
    expect(result.current.expandedProjects.has('-home-user-alpha')).toBe(true);
  });

  it('refetches on loom:projects-updated event', async () => {
    mockApiFetch.mockResolvedValueOnce(makeMockProjects());

    const { result } = renderHook(() => useMultiProjectSessions());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockApiFetch).toHaveBeenCalledTimes(1);

    // Trigger projects-updated event
    mockApiFetch.mockResolvedValueOnce(makeMockProjects());
    act(() => {
      window.dispatchEvent(new Event('loom:projects-updated'));
    });

    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledTimes(2);
    });
  });

  it('sets error state on fetch failure', async () => {
    mockApiFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useMultiProjectSessions());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.projectGroups).toHaveLength(0);
  });
});
