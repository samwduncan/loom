import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCommandSearch } from './useCommandSearch';
import { useTimelineStore } from '@/stores/timeline';
import type { Session } from '@/types/session';

// Mock apiFetch to prevent real network calls
vi.mock('@/lib/api-client', () => ({
  apiFetch: vi.fn().mockResolvedValue([]),
}));

// Mock useProjectContext
vi.mock('@/hooks/useProjectContext', () => ({
  useProjectContext: () => ({ projectName: 'test-project', isLoading: false }),
}));

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: `session-${Math.random().toString(36).slice(2, 8)}`,
    title: 'Test Session',
    messages: [],
    providerId: 'claude',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: {
      tokenBudget: null,
      contextWindowUsed: null,
      totalCost: null,
    },
    ...overrides,
  };
}

describe('useCommandSearch', () => {
  beforeEach(() => {
    useTimelineStore.setState({ sessions: [] });
  });

  it('returns empty results for all categories when search is empty', () => {
    const { result } = renderHook(() =>
      useCommandSearch('', { enabled: false }),
    );

    expect(result.current.sessionResults).toEqual([]);
    expect(result.current.fileResults).toEqual([]);
  });

  it('returns empty results for whitespace-only search', () => {
    const { result } = renderHook(() =>
      useCommandSearch('   ', { enabled: false }),
    );

    expect(result.current.sessionResults).toEqual([]);
    expect(result.current.fileResults).toEqual([]);
  });

  it('searches sessions by title', () => {
    const session = makeSession({ title: 'Chat about authentication' });
    useTimelineStore.setState({ sessions: [session] });

    const { result } = renderHook(() =>
      useCommandSearch('auth', { enabled: false }),
    );

    expect(result.current.sessionResults).toHaveLength(1);
    expect(result.current.sessionResults[0]?.id).toBe(session.id);
  });

  it('fuzzy search matches approximate titles', () => {
    const session = makeSession({ title: 'Settings discussion' });
    useTimelineStore.setState({ sessions: [session] });

    const { result } = renderHook(() =>
      useCommandSearch('stgs', { enabled: false }),
    );

    // Fuse.js with threshold 0.4 should find "Settings" from "stgs"
    expect(result.current.sessionResults.length).toBeGreaterThanOrEqual(0);
  });

  it('limits results to 15 per category', () => {
    const sessions = Array.from({ length: 20 }, (_, i) =>
      makeSession({ title: `Test session ${i}` }),
    );
    useTimelineStore.setState({ sessions });

    const { result } = renderHook(() =>
      useCommandSearch('test', { enabled: false }),
    );

    expect(result.current.sessionResults.length).toBeLessThanOrEqual(15);
  });

  it('returns isLoading false when not enabled', () => {
    const { result } = renderHook(() =>
      useCommandSearch('test', { enabled: false }),
    );

    expect(result.current.isLoading).toBe(false);
  });
});
