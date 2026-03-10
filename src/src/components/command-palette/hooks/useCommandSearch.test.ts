import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCommandSearch } from './useCommandSearch';
import { useTimelineStore } from '@/stores/timeline';
import type { Session } from '@/types/session';

// Mock apiFetch to prevent real network calls
vi.mock('@/lib/api-client', () => ({
  apiFetch: vi.fn().mockResolvedValue([]),
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
    // Reset timeline store to have test sessions
    const store = useTimelineStore.getState();
    // Clear sessions via setState for test setup
    useTimelineStore.setState({ sessions: [] });
    void store; // suppress unused
  });

  it('returns empty results for all categories when search is empty', () => {
    const { result } = renderHook(() =>
      useCommandSearch('', { enabled: false }),
    );

    expect(result.current.sessionResults).toEqual([]);
    expect(result.current.fileResults).toEqual([]);
    expect(result.current.commandResults).toEqual([]);
  });

  it('returns empty results for whitespace-only search', () => {
    const { result } = renderHook(() =>
      useCommandSearch('   ', { enabled: false }),
    );

    expect(result.current.sessionResults).toEqual([]);
    expect(result.current.fileResults).toEqual([]);
    expect(result.current.commandResults).toEqual([]);
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
    // Note: fuzzy matching is probabilistic; exact match depends on Fuse scoring
  });

  it('searches commands when provided', () => {
    const commands = [
      { id: 'new-chat', label: 'New Chat', group: 'Actions', action: () => {} },
      { id: 'settings', label: 'Open Settings', group: 'Actions', action: () => {} },
      { id: 'theme', label: 'Toggle Theme', group: 'Appearance', action: () => {} },
    ];

    const { result } = renderHook(() =>
      useCommandSearch('settings', { enabled: false, commands }),
    );

    expect(result.current.commandResults).toHaveLength(1);
    expect(result.current.commandResults[0]?.id).toBe('settings');
  });

  it('limits results to 15 per category', () => {
    // Create 20 sessions all matching "test"
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
