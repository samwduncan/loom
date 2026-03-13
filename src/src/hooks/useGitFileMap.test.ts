/**
 * useGitFileMap tests -- verifies path-to-status lookup map with directory aggregation.
 *
 * Tests the hook's memoization, empty input handling, file-level mapping,
 * directory aggregation with priority ordering, and root-level files.
 */

import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useGitFileMap } from './useGitFileMap';
import type { GitFileChange, GitFileStatus } from '@/types/git';

describe('useGitFileMap', () => {
  it('returns an empty Map for undefined input', () => {
    const { result } = renderHook(() => useGitFileMap(undefined));
    expect(result.current.size).toBe(0);
  });

  it('returns an empty Map for empty array input', () => {
    const { result } = renderHook(() => useGitFileMap([]));
    expect(result.current.size).toBe(0);
  });

  it('maps a single file to its status', () => {
    const files: GitFileChange[] = [{ path: 'src/foo.ts', status: 'modified' }];
    const { result } = renderHook(() => useGitFileMap(files));
    expect(result.current.get('src/foo.ts')).toBe('modified');
  });

  it('aggregates directory status from a single file', () => {
    const files: GitFileChange[] = [{ path: 'src/lib/bar.ts', status: 'added' }];
    const { result } = renderHook(() => useGitFileMap(files));
    expect(result.current.get('src/lib/bar.ts')).toBe('added');
    expect(result.current.get('src/lib')).toBe('added');
    expect(result.current.get('src')).toBe('added');
  });

  it('uses priority order for mixed directory children: modified > added > deleted > untracked', () => {
    const files: GitFileChange[] = [
      { path: 'a/x.ts', status: 'untracked' },
      { path: 'a/y.ts', status: 'modified' },
    ];
    const { result } = renderHook(() => useGitFileMap(files));
    expect(result.current.get('a')).toBe('modified');
  });

  it('deleted beats untracked in directory aggregation', () => {
    const files: GitFileChange[] = [
      { path: 'a/x.ts', status: 'deleted' },
      { path: 'a/y.ts', status: 'untracked' },
    ];
    const { result } = renderHook(() => useGitFileMap(files));
    expect(result.current.get('a')).toBe('deleted');
  });

  it('added beats deleted in directory aggregation', () => {
    const files: GitFileChange[] = [
      { path: 'a/x.ts', status: 'deleted' },
      { path: 'a/y.ts', status: 'added' },
    ];
    const { result } = renderHook(() => useGitFileMap(files));
    expect(result.current.get('a')).toBe('added');
  });

  it('handles files at root level (no directory segments) without error', () => {
    const files: GitFileChange[] = [{ path: 'README.md', status: 'modified' }];
    const { result } = renderHook(() => useGitFileMap(files));
    expect(result.current.get('README.md')).toBe('modified');
    // Should only have 1 entry (the file itself, no directory)
    expect(result.current.size).toBe(1);
  });

  it('returns the same Map reference when input is referentially stable', () => {
    const files: GitFileChange[] = [{ path: 'a.ts', status: 'added' }];
    const { result, rerender } = renderHook(() => useGitFileMap(files));
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });

  it('returns stable EMPTY_MAP reference for undefined across rerenders', () => {
    const { result, rerender } = renderHook(() => useGitFileMap(undefined));
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });

  it('handles deeply nested paths with correct aggregation at every level', () => {
    const files: GitFileChange[] = [
      { path: 'src/components/ui/Button.tsx', status: 'modified' },
    ];
    const { result } = renderHook(() => useGitFileMap(files));
    expect(result.current.get('src/components/ui/Button.tsx')).toBe('modified');
    expect(result.current.get('src/components/ui')).toBe('modified');
    expect(result.current.get('src/components')).toBe('modified');
    expect(result.current.get('src')).toBe('modified');
    expect(result.current.size).toBe(4); // 1 file + 3 directories
  });

  it('skips unknown git statuses without crashing', () => {
    // Simulate backend returning a status not in our priority map
    const files: GitFileChange[] = [
      { path: 'src/a.ts', status: 'renamed' as GitFileStatus },
      { path: 'src/b.ts', status: 'modified' },
    ];
    const { result } = renderHook(() => useGitFileMap(files));
    // Renamed file is skipped, only modified file + its directory
    expect(result.current.has('src/a.ts')).toBe(false);
    expect(result.current.get('src/b.ts')).toBe('modified');
    expect(result.current.get('src')).toBe('modified');
  });

  it('returns same Map reference when new array has identical content', () => {
    const files1: GitFileChange[] = [{ path: 'a.ts', status: 'added' }];
    const files2: GitFileChange[] = [{ path: 'a.ts', status: 'added' }];
    let files = files1;
    const { result, rerender } = renderHook(() => useGitFileMap(files));
    const first = result.current;
    files = files2; // new reference, same content
    rerender();
    expect(result.current).toBe(first);
  });

  it('early-exits directory walk when parent already has higher priority', () => {
    const files: GitFileChange[] = [
      { path: 'a/b/c/high.ts', status: 'modified' },
      { path: 'a/b/c/low.ts', status: 'untracked' },
    ];
    const { result } = renderHook(() => useGitFileMap(files));
    // All directories should show 'modified' (highest priority)
    expect(result.current.get('a/b/c')).toBe('modified');
    expect(result.current.get('a/b')).toBe('modified');
    expect(result.current.get('a')).toBe('modified');
  });
});
