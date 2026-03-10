/**
 * useFileTree hook tests -- verifies data fetching, event-based refresh, and error handling.
 *
 * Mocks apiFetch to isolate from backend.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useFileTree } from '@/hooks/useFileTree';
import type { FileTreeNode } from '@/types/file';

vi.mock('@/lib/api-client', () => ({
  apiFetch: vi.fn(),
}));

const mockTree: FileTreeNode[] = [
  {
    name: 'src',
    path: '/home/swd/loom/src',
    type: 'directory',
    size: 0,
    modified: null,
    children: [
      {
        name: 'index.ts',
        path: '/home/swd/loom/src/index.ts',
        type: 'file',
        size: 256,
        modified: '2026-03-10T00:00:00Z',
      },
    ],
  },
];

describe('useFileTree', () => {
  let apiFetchMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    const mod = await import('@/lib/api-client');
    apiFetchMock = mod.apiFetch as ReturnType<typeof vi.fn>;
    apiFetchMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches tree data and transitions to success', async () => {
    apiFetchMock.mockResolvedValueOnce(mockTree);

    const { result } = renderHook(() => useFileTree('test-project'));

    expect(result.current.fetchState).toBe('loading');

    await waitFor(() => {
      expect(result.current.fetchState).toBe('success');
    });

    expect(result.current.tree).toEqual(mockTree);
    expect(result.current.projectRoot).toBe('/home/swd/loom');
    expect(apiFetchMock).toHaveBeenCalledWith(
      '/api/projects/test-project/files',
      expect.anything(),
      expect.anything(),
    );
  });

  it('sets fetchState to error on fetch failure', async () => {
    apiFetchMock.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useFileTree('test-project'));

    await waitFor(() => {
      expect(result.current.fetchState).toBe('error');
    });

    expect(result.current.tree).toEqual([]);
  });

  it('retry triggers re-fetch', async () => {
    apiFetchMock.mockRejectedValueOnce(new Error('fail'));

    const { result } = renderHook(() => useFileTree('test-project'));

    await waitFor(() => {
      expect(result.current.fetchState).toBe('error');
    });

    apiFetchMock.mockResolvedValueOnce(mockTree);

    act(() => {
      result.current.retry();
    });

    await waitFor(() => {
      expect(result.current.fetchState).toBe('success');
    });

    expect(result.current.tree).toEqual(mockTree);
  });

  it('re-fetches on loom:projects-updated event', async () => {
    apiFetchMock.mockResolvedValueOnce(mockTree);

    const { result } = renderHook(() => useFileTree('test-project'));

    await waitFor(() => {
      expect(result.current.fetchState).toBe('success');
    });

    const updatedTree: FileTreeNode[] = [
      { name: 'lib', path: '/home/swd/loom/lib', type: 'directory', size: 0, modified: null },
    ];
    apiFetchMock.mockResolvedValueOnce(updatedTree);

    act(() => {
      window.dispatchEvent(new CustomEvent('loom:projects-updated'));
    });

    await waitFor(() => {
      expect(result.current.tree).toEqual(updatedTree);
    });
  });

  it('returns idle state without fetching when projectName is empty', () => {
    const { result } = renderHook(() => useFileTree(''));

    expect(result.current.fetchState).toBe('idle');
    expect(result.current.tree).toEqual([]);
    expect(apiFetchMock).not.toHaveBeenCalled();
  });
});
