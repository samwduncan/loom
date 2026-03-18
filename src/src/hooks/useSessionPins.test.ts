/**
 * Tests for useSessionPins -- localStorage-backed pin management.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSessionPins } from './useSessionPins';

const STORAGE_KEY = 'loom-pinned-sessions';

describe('useSessionPins', () => {
  let mockStorage: Record<string, string>;

  beforeEach(() => {
    mockStorage = {};
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key: string) => mockStorage[key] ?? null);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key: string, value: string) => {
      mockStorage[key] = value;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes with empty set when localStorage is empty', () => {
    const { result } = renderHook(() => useSessionPins());
    expect(result.current.pinnedIds.size).toBe(0);
  });

  it('loads existing pins from localStorage', () => {
    mockStorage[STORAGE_KEY] = JSON.stringify(['s1', 's2']);
    const { result } = renderHook(() => useSessionPins());
    expect(result.current.pinnedIds.size).toBe(2);
    expect(result.current.isPinned('s1')).toBe(true);
    expect(result.current.isPinned('s2')).toBe(true);
  });

  it('returns empty set on corrupt localStorage data', () => {
    mockStorage[STORAGE_KEY] = 'not-valid-json{{{';
    const { result } = renderHook(() => useSessionPins());
    expect(result.current.pinnedIds.size).toBe(0);
  });

  it('returns empty set when localStorage has non-array JSON', () => {
    mockStorage[STORAGE_KEY] = JSON.stringify({ foo: 'bar' });
    const { result } = renderHook(() => useSessionPins());
    expect(result.current.pinnedIds.size).toBe(0);
  });

  it('togglePin adds a session ID', () => {
    const { result } = renderHook(() => useSessionPins());
    act(() => result.current.togglePin('s1'));
    expect(result.current.isPinned('s1')).toBe(true);
    expect(JSON.parse(mockStorage[STORAGE_KEY] ?? '[]')).toContain('s1');
  });

  it('togglePin removes an already-pinned session ID', () => {
    mockStorage[STORAGE_KEY] = JSON.stringify(['s1']);
    const { result } = renderHook(() => useSessionPins());
    expect(result.current.isPinned('s1')).toBe(true);
    act(() => result.current.togglePin('s1'));
    expect(result.current.isPinned('s1')).toBe(false);
    expect(JSON.parse(mockStorage[STORAGE_KEY] ?? '[]')).not.toContain('s1');
  });

  it('isPinned returns false for non-pinned IDs', () => {
    const { result } = renderHook(() => useSessionPins());
    expect(result.current.isPinned('nonexistent')).toBe(false);
  });
});
