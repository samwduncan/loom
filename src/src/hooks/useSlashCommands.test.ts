/**
 * useSlashCommands tests -- / trigger detection, command filtering, and picker state management.
 *
 * Tests verify: detectSlashQuery parsing, hook open/close on / detection,
 * filtering by query, navigation wrapping, selectCurrent correctness.
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { detectSlashQuery, useSlashCommands } from './useSlashCommands';

// ---------------------------------------------------------------------------
// detectSlashQuery (pure function tests)
// ---------------------------------------------------------------------------

describe('detectSlashQuery', () => {
  it('returns "" for "/" at position 1 (empty query, show all)', () => {
    expect(detectSlashQuery('/', 1)).toBe('');
  });

  it('returns "cl" for "/cl" at position 3', () => {
    expect(detectSlashQuery('/cl', 3)).toBe('cl');
  });

  it('returns null when / is not at position 0', () => {
    expect(detectSlashQuery('hello /cl', 9)).toBeNull();
  });

  it('returns null for empty text', () => {
    expect(detectSlashQuery('', 0)).toBeNull();
  });

  it('returns null when no / present', () => {
    expect(detectSlashQuery('hello', 5)).toBeNull();
  });

  it('returns null when query contains whitespace after /', () => {
    expect(detectSlashQuery('/clear arg', 10)).toBeNull();
  });

  it('returns full command text for "/clear" at position 6', () => {
    expect(detectSlashQuery('/clear', 6)).toBe('clear');
  });

  it('returns partial when cursor is mid-word', () => {
    expect(detectSlashQuery('/model', 3)).toBe('mo');
  });
});

// ---------------------------------------------------------------------------
// SLASH_COMMANDS registry
// ---------------------------------------------------------------------------

describe('SLASH_COMMANDS', () => {
  it('contains required commands: clear, help, compact, model', async () => {
    const { SLASH_COMMANDS } = await import('@/lib/slash-commands');
    expect(SLASH_COMMANDS.length).toBeGreaterThanOrEqual(4);
    const ids = SLASH_COMMANDS.map((c) => c.id);
    expect(ids).toContain('clear');
    expect(ids).toContain('help');
    expect(ids).toContain('compact');
    expect(ids).toContain('model');
  });
});

// ---------------------------------------------------------------------------
// useSlashCommands hook
// ---------------------------------------------------------------------------

describe('useSlashCommands', () => {
  it('starts closed with no results', () => {
    const { result } = renderHook(() => useSlashCommands());
    expect(result.current.isOpen).toBe(false);
    expect(result.current.results).toEqual([]);
    expect(result.current.selectedIndex).toBe(0);
  });

  it('typing "/" at position 0 opens picker with all commands', () => {
    const { result } = renderHook(() => useSlashCommands());

    act(() => {
      result.current.detectAndOpen('/', 1);
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.results).toHaveLength(4);
  });

  it('typing "/cl" filters to /clear only', () => {
    const { result } = renderHook(() => useSlashCommands());

    act(() => {
      result.current.detectAndOpen('/cl', 3);
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.results).toHaveLength(1);
    expect(result.current.results[0]?.id).toBe('clear'); // ASSERT: length check above guarantees index 0
  });

  it('typing "/c" filters to /clear and /compact', () => {
    const { result } = renderHook(() => useSlashCommands());

    act(() => {
      result.current.detectAndOpen('/c', 2);
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.results).toHaveLength(2);
    const ids = result.current.results.map((c) => c.id);
    expect(ids).toContain('clear');
    expect(ids).toContain('compact');
  });

  it('moveDown increments, moveUp decrements, wraps around', () => {
    const { result } = renderHook(() => useSlashCommands());

    // Open with all commands
    act(() => {
      result.current.detectAndOpen('/', 1);
    });

    expect(result.current.selectedIndex).toBe(0);

    act(() => result.current.moveDown());
    expect(result.current.selectedIndex).toBe(1);

    act(() => result.current.moveDown());
    expect(result.current.selectedIndex).toBe(2);

    act(() => result.current.moveUp());
    expect(result.current.selectedIndex).toBe(1);

    // Wrap around down: go to end, then wrap
    act(() => result.current.moveDown());
    act(() => result.current.moveDown());
    expect(result.current.selectedIndex).toBe(3);
    act(() => result.current.moveDown());
    expect(result.current.selectedIndex).toBe(0);

    // Wrap around up: from 0 to last
    act(() => result.current.moveUp());
    expect(result.current.selectedIndex).toBe(result.current.results.length - 1);
  });

  it('selectCurrent returns the selected command', () => {
    const { result } = renderHook(() => useSlashCommands());

    act(() => {
      result.current.detectAndOpen('/', 1);
    });

    const first = result.current.selectCurrent();
    expect(first).not.toBeNull();
    expect(first?.id).toBe('clear');

    act(() => result.current.moveDown());
    const second = result.current.selectCurrent();
    expect(second?.id).toBe('help');
  });

  it('selectCurrent returns null when no results', () => {
    const { result } = renderHook(() => useSlashCommands());

    // Not opened, no results
    const selected = result.current.selectCurrent();
    expect(selected).toBeNull();
  });

  it('close resets state', () => {
    const { result } = renderHook(() => useSlashCommands());

    act(() => {
      result.current.detectAndOpen('/cl', 3);
    });
    expect(result.current.isOpen).toBe(true);

    act(() => result.current.close());
    expect(result.current.isOpen).toBe(false);
    expect(result.current.selectedIndex).toBe(0);
    expect(result.current.results).toEqual([]);
  });

  it('removes stale results when / is removed from text', () => {
    const { result } = renderHook(() => useSlashCommands());

    act(() => {
      result.current.detectAndOpen('/cl', 3);
    });
    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.detectAndOpen('hello', 5);
    });
    expect(result.current.isOpen).toBe(false);
  });
});
