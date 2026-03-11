/**
 * useGitCommits -- fetches git commit history for the active project.
 *
 * Constitution: Named export (2.2), no default export.
 */

import { useApiFetch } from '@/hooks/useApiFetch';
import type { GitCommit } from '@/types/git';

interface CommitsResponse {
  commits: GitCommit[];
}

export function useGitCommits(projectName: string): {
  commits: GitCommit[] | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
} {
  const url = projectName
    ? `/api/git/commits?project=${encodeURIComponent(projectName)}`
    : null;

  const { data, loading, error, refetch } = useApiFetch<CommitsResponse, GitCommit[]>(url, {
    transform: (res) => res.commits,
    errorLabel: 'Failed to fetch commits',
  });

  return { commits: data, loading, error, refetch };
}
