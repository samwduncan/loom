/**
 * useGitOperations -- imperative git operations (commit, push, pull, etc.).
 *
 * Returns an object of async functions that call backend POST endpoints.
 * These are NOT reactive hooks -- they're fire-and-forget actions.
 * Memoized on projectName via useMemo.
 *
 * Constitution: Named export (2.2), no default export.
 */

import { useMemo } from 'react';
import { apiFetch } from '@/lib/api-client';

interface GitOperations {
  commit: (message: string, files: string[]) => Promise<void>;
  push: () => Promise<void>;
  pull: () => Promise<void>;
  fetch: () => Promise<void>;
  checkout: (branch: string) => Promise<void>;
  createBranch: (name: string) => Promise<void>;
  discard: (file: string) => Promise<void>;
  deleteUntracked: (file: string) => Promise<void>;
  generateCommitMessage: (files: string[]) => Promise<string>;
}

export function useGitOperations(projectName: string): GitOperations {
  return useMemo<GitOperations>(() => {
    const post = <T = void>(endpoint: string, body: Record<string, unknown>): Promise<T> =>
      apiFetch<T>(endpoint, {
        method: 'POST',
        body: JSON.stringify({ project: projectName, ...body }),
      });

    return {
      commit: (message: string, files: string[]) =>
        post('/api/git/commit', { message, files }),

      push: () =>
        post('/api/git/push', {}),

      pull: () =>
        post('/api/git/pull', {}),

      fetch: () =>
        post('/api/git/fetch', {}),

      checkout: (branch: string) =>
        post('/api/git/checkout', { branch }),

      createBranch: (name: string) =>
        post('/api/git/create-branch', { name }),

      discard: (file: string) =>
        post('/api/git/discard', { file }),

      deleteUntracked: (file: string) =>
        post('/api/git/delete-untracked', { file }),

      generateCommitMessage: (files: string[]) =>
        post<{ message: string }>('/api/git/generate-commit-message', { files }).then((r) => r.message),
    };
  }, [projectName]);
}
