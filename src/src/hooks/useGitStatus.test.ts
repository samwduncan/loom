import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// Mock apiFetch
const mockApiFetch = vi.fn();
vi.mock('@/lib/api-client', () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
}));

// Mock useProjectContext
vi.mock('@/hooks/useProjectContext', () => ({
  useProjectContext: () => ({ projectName: 'test-project', projectPath: '/test', isLoading: false }),
}));

import { useGitStatus } from '@/hooks/useGitStatus';
import type { GitStatusResponse } from '@/types/git';

const MOCK_STATUS: GitStatusResponse = {
  branch: 'main',
  hasCommits: true,
  modified: ['src/app.ts'],
  added: ['src/new.ts'],
  deleted: ['src/old.ts'],
  untracked: ['notes.txt'],
};

describe('useGitStatus', () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns loading state initially, then loaded with flattened data', async () => {
    mockApiFetch.mockResolvedValueOnce(MOCK_STATUS);

    const { result } = renderHook(() => useGitStatus('test-project'));

    // Initial state is loading
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).not.toBeNull();
    expect(result.current.data!.branch).toBe('main'); // ASSERT: data is non-null after loaded check
    expect(result.current.data!.hasCommits).toBe(true); // ASSERT: data is non-null after loaded check
    expect(result.current.data!.files).toEqual([ // ASSERT: data is non-null after loaded check
      { path: 'src/app.ts', status: 'modified' },
      { path: 'src/new.ts', status: 'added' },
      { path: 'src/old.ts', status: 'deleted' },
      { path: 'notes.txt', status: 'untracked' },
    ]);
    expect(result.current.error).toBeNull();
  });

  it('returns errored state when apiFetch rejects', async () => {
    mockApiFetch.mockRejectedValueOnce(new Error('Network failure'));

    const { result } = renderHook(() => useGitStatus('test-project'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Network failure');
    expect(result.current.data).toBeNull();
  });

  it('refetches when loom:projects-updated CustomEvent fires', async () => {
    mockApiFetch.mockResolvedValueOnce(MOCK_STATUS);

    const { result } = renderHook(() => useGitStatus('test-project'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Set up new response for refetch
    const updatedStatus: GitStatusResponse = {
      ...MOCK_STATUS,
      branch: 'feature',
    };
    mockApiFetch.mockResolvedValueOnce(updatedStatus);

    // Dispatch the custom event
    act(() => {
      window.dispatchEvent(new CustomEvent('loom:projects-updated'));
    });

    await waitFor(() => {
      expect(result.current.data!.branch).toBe('feature'); // ASSERT: data is non-null after loaded check
    });
  });

  it('refetch can be called imperatively', async () => {
    mockApiFetch.mockResolvedValueOnce(MOCK_STATUS);

    const { result } = renderHook(() => useGitStatus('test-project'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const updatedStatus: GitStatusResponse = {
      ...MOCK_STATUS,
      modified: [],
    };
    mockApiFetch.mockResolvedValueOnce(updatedStatus);

    act(() => {
      result.current.refetch();
    });

    await waitFor(() => {
      expect(result.current.data!.files.filter((f) => f.status === 'modified')).toHaveLength(0); // ASSERT: data is non-null after loaded check
    });
  });

  it('aborts fetch on unmount', async () => {
    // Create a never-resolving promise to simulate in-flight request
    mockApiFetch.mockImplementation((_path: string, _opts: unknown, signal: AbortSignal) => {
      return new Promise((_resolve, reject) => {
        signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
      });
    });

    const { unmount } = renderHook(() => useGitStatus('test-project'));

    // Unmount should abort via AbortController
    unmount();

    // Verify apiFetch was called with a signal
    expect(mockApiFetch).toHaveBeenCalledTimes(1);
    const callArgs = mockApiFetch.mock.calls[0]!; // ASSERT: we verified call count above
    expect(callArgs[2]).toBeInstanceOf(AbortSignal);
  });
});
