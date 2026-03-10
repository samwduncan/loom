import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRecentCommands } from './useRecentCommands';

const STORAGE_KEY = 'loom-recent-commands';

describe('useRecentCommands', () => {
  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY);
  });

  it('returns empty array when nothing stored', () => {
    const { result } = renderHook(() => useRecentCommands());
    expect(result.current.recents).toEqual([]);
  });

  it('addRecent stores entry in localStorage', () => {
    const { result } = renderHook(() => useRecentCommands());

    act(() => {
      result.current.addRecent({ id: 'cmd-1', label: 'Test', group: 'Commands' });
    });

    expect(result.current.recents).toHaveLength(1);
    expect(result.current.recents[0]?.id).toBe('cmd-1');
    expect(result.current.recents[0]?.label).toBe('Test');
    expect(result.current.recents[0]?.timestamp).toBeGreaterThan(0);

    // Verify localStorage was written
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    expect(stored).toHaveLength(1);
  });

  it('recents are sorted by timestamp (most recent first)', () => {
    const { result } = renderHook(() => useRecentCommands());

    act(() => {
      result.current.addRecent({ id: 'cmd-1', label: 'First', group: 'Commands' });
    });
    act(() => {
      result.current.addRecent({ id: 'cmd-2', label: 'Second', group: 'Commands' });
    });

    expect(result.current.recents[0]?.id).toBe('cmd-2');
    expect(result.current.recents[1]?.id).toBe('cmd-1');
  });

  it('addRecent deduplicates by id (moves to top)', () => {
    const { result } = renderHook(() => useRecentCommands());

    act(() => {
      result.current.addRecent({ id: 'cmd-1', label: 'First', group: 'Commands' });
    });
    act(() => {
      result.current.addRecent({ id: 'cmd-2', label: 'Second', group: 'Commands' });
    });
    act(() => {
      result.current.addRecent({ id: 'cmd-1', label: 'First Updated', group: 'Commands' });
    });

    expect(result.current.recents).toHaveLength(2);
    expect(result.current.recents[0]?.id).toBe('cmd-1');
    expect(result.current.recents[0]?.label).toBe('First Updated');
    expect(result.current.recents[1]?.id).toBe('cmd-2');
  });

  it('max 10 entries kept', () => {
    const { result } = renderHook(() => useRecentCommands());

    act(() => {
      for (let i = 0; i < 15; i++) {
        result.current.addRecent({ id: `cmd-${i}`, label: `Cmd ${i}`, group: 'Commands' });
      }
    });

    expect(result.current.recents).toHaveLength(10);
    // Most recent should be cmd-14
    expect(result.current.recents[0]?.id).toBe('cmd-14');
  });

  it('clearRecents empties the list', () => {
    const { result } = renderHook(() => useRecentCommands());

    act(() => {
      result.current.addRecent({ id: 'cmd-1', label: 'Test', group: 'Commands' });
    });
    expect(result.current.recents).toHaveLength(1);

    act(() => {
      result.current.clearRecents();
    });
    expect(result.current.recents).toEqual([]);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('handles corrupted localStorage gracefully', () => {
    localStorage.setItem(STORAGE_KEY, 'not-valid-json');
    const { result } = renderHook(() => useRecentCommands());
    expect(result.current.recents).toEqual([]);
  });

  it('filters out entries with invalid shape from localStorage', () => {
    const mixed = [
      { id: 'valid', label: 'Valid', group: 'Commands', timestamp: 100 },
      { id: null, label: 'Bad ID', group: 'Commands', timestamp: 200 },
      { id: 'missing-fields' },
      'not-an-object',
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mixed));
    const { result } = renderHook(() => useRecentCommands());
    expect(result.current.recents).toHaveLength(1);
    expect(result.current.recents[0]?.id).toBe('valid');
  });
});
