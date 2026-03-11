/**
 * useGitBranches -- fetches git branch list for the active project.
 *
 * Constitution: Named export (2.2), no default export.
 */

import { useApiFetch } from '@/hooks/useApiFetch';
import type { GitBranch } from '@/types/git';

export function useGitBranches(projectName: string): {
  branches: GitBranch[] | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
} {
  const url = projectName
    ? `/api/git/branches?project=${encodeURIComponent(projectName)}`
    : null;

  const { data, loading, error, refetch } = useApiFetch<GitBranch[]>(url, {
    errorLabel: 'Failed to fetch branches',
  });

  return { branches: data, loading, error, refetch };
}
