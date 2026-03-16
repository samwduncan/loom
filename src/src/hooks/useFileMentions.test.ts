/**
 * useFileMentions tests -- @ trigger detection, file search, and picker state management.
 *
 * Tests verify: detectMentionQuery parsing, hook open/close on @ detection,
 * navigation wrapping, selectCurrent correctness.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { detectMentionQuery, useFileMentions } from './useFileMentions';

// ---------------------------------------------------------------------------
// Mock apiFetch
// ---------------------------------------------------------------------------

const MOCK_FILES = [
  { path: 'src/components/App.tsx', name: 'App.tsx', type: 'file' as const },
  { path: 'src/components/Header.tsx', name: 'Header.tsx', type: 'file' as const },
  { path: 'src/utils/cn.ts', name: 'cn.ts', type: 'file' as const },
  { path: 'src/lib/api-client.ts', name: 'api-client.ts', type: 'file' as const },
  { path: 'src/hooks/useAuth.ts', name: 'useAuth.ts', type: 'file' as const },
];

vi.mock('@/lib/api-client', () => ({
  apiFetch: vi.fn(() => Promise.resolve(MOCK_FILES)),
}));

// ---------------------------------------------------------------------------
// detectMentionQuery (pure function tests)
// ---------------------------------------------------------------------------

describe('detectMentionQuery', () => {
  it('returns query after @ at start of text', () => {
    expect(detectMentionQuery('@App', 4)).toBe('App');
  });

  it('returns query after @ preceded by space', () => {
    expect(detectMentionQuery('hello @App.t', 12)).toBe('App.t');
  });

  it('returns null when @ is inside a word (email-like)', () => {
    expect(detectMentionQuery('user@example.com', 16)).toBeNull();
  });

  it('returns null when no @ present', () => {
    expect(detectMentionQuery('hello world', 11)).toBeNull();
  });

  it('handles cursor in middle of text (only scans backward from cursor)', () => {
    // Cursor is at position 6, before the @
    expect(detectMentionQuery('hello @App.tsx', 6)).toBeNull();
  });

  it('returns empty string when cursor is right after @', () => {
    expect(detectMentionQuery('hello @', 7)).toBe('');
  });

  it('returns null when query contains whitespace', () => {
    // "@App tsx" -- space after App means mention ended
    expect(detectMentionQuery('@App tsx', 8)).toBeNull();
  });

  it('finds the nearest @ when multiple exist', () => {
    expect(detectMentionQuery('hello @foo bar @baz', 19)).toBe('baz');
  });
});

// ---------------------------------------------------------------------------
// useFileMentions hook
// ---------------------------------------------------------------------------

describe('useFileMentions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches files on mount when enabled', async () => {
    const { apiFetch } = await import('@/lib/api-client');
    renderHook(() => useFileMentions({ enabled: true, projectName: 'test-project' }));

    expect(apiFetch).toHaveBeenCalledWith(
      '/api/projects/test-project/files',
    );
  });

  it('does not fetch when disabled', async () => {
    const { apiFetch } = await import('@/lib/api-client');
    vi.mocked(apiFetch).mockClear();
    renderHook(() => useFileMentions({ enabled: false, projectName: 'test-project' }));
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it('opens when @ detected, closes when @ removed', async () => {
    const { result } = renderHook(() =>
      useFileMentions({ enabled: true, projectName: 'test-project' }),
    );

    // Wait for files to load
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Type @ -- should open
    act(() => {
      result.current.detectAndOpen('hello @App', 10);
    });
    expect(result.current.isOpen).toBe(true);
    expect(result.current.query).toBe('App');

    // Remove @ -- should close
    act(() => {
      result.current.detectAndOpen('hello world', 11);
    });
    expect(result.current.isOpen).toBe(false);
  });

  it('returns search results filtered by query', async () => {
    const { result } = renderHook(() =>
      useFileMentions({ enabled: true, projectName: 'test-project' }),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.detectAndOpen('@App', 4);
    });

    // Should have results matching "App"
    expect(result.current.results.length).toBeGreaterThan(0);
    expect(result.current.results[0]!.name).toBe('App.tsx'); // ASSERT: length check above guarantees index 0 exists
  });

  it('navigation: moveDown increments, moveUp decrements, wraps around', async () => {
    const { result } = renderHook(() =>
      useFileMentions({ enabled: true, projectName: 'test-project' }),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Open with empty query to get all files
    act(() => {
      result.current.detectAndOpen('@', 1);
    });

    expect(result.current.selectedIndex).toBe(0);

    // Move down
    act(() => result.current.moveDown());
    expect(result.current.selectedIndex).toBe(1);

    // Move down again
    act(() => result.current.moveDown());
    expect(result.current.selectedIndex).toBe(2);

    // Move up
    act(() => result.current.moveUp());
    expect(result.current.selectedIndex).toBe(1);

    // Move up past 0 -- should wrap to last
    act(() => result.current.moveUp());
    expect(result.current.selectedIndex).toBe(0);
    act(() => result.current.moveUp());
    expect(result.current.selectedIndex).toBe(result.current.results.length - 1);
  });

  it('selectCurrent returns the file at selectedIndex', async () => {
    const { result } = renderHook(() =>
      useFileMentions({ enabled: true, projectName: 'test-project' }),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Open with empty query
    act(() => {
      result.current.detectAndOpen('@', 1);
    });

    const selected = result.current.selectCurrent();
    expect(selected).not.toBeNull();
    expect(selected?.path).toBe(MOCK_FILES[0]!.path); // ASSERT: MOCK_FILES has 5 entries, index 0 guaranteed
    expect(selected?.name).toBe(MOCK_FILES[0]!.name); // ASSERT: MOCK_FILES has 5 entries, index 0 guaranteed

    // Move to second item
    act(() => result.current.moveDown());
    const second = result.current.selectCurrent();
    expect(second?.path).toBe(MOCK_FILES[1]!.path); // ASSERT: MOCK_FILES has 5 entries, index 1 guaranteed
  });

  it('selectCurrent returns null when no results', async () => {
    const { result } = renderHook(() =>
      useFileMentions({ enabled: true, projectName: 'test-project' }),
    );

    // Don't open (no results)
    const selected = result.current.selectCurrent();
    expect(selected).toBeNull();
  });

  it('close resets state', async () => {
    const { result } = renderHook(() =>
      useFileMentions({ enabled: true, projectName: 'test-project' }),
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.detectAndOpen('@App', 4);
    });
    expect(result.current.isOpen).toBe(true);

    act(() => result.current.close());
    expect(result.current.isOpen).toBe(false);
    expect(result.current.query).toBe('');
    expect(result.current.selectedIndex).toBe(0);
  });
});
