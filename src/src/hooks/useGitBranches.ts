/**
 * useGitBranches -- fetches git branch list for the active project.
 *
 * Backend returns { branches: string[] } on success or { error: string } on failure.
 * Transform extracts the branches array and maps to GitBranch objects.
 *
 * Constitution: Named export (2.2), no default export.
 */

import { useApiFetch } from '@/hooks/useApiFetch';
import type { GitBranch } from '@/types/git';

/** Backend response shape for /api/git/branches */
interface BranchesResponse {
  branches?: string[];
  error?: string;
}

/** Transform backend response into GitBranch array */
function transformBranches(response: BranchesResponse): GitBranch[] {
  if (response.error) {
    throw new Error(response.error);
  }
  const branches = response.branches ?? [];
  // Backend returns raw branch name strings -- map to GitBranch objects.
  // Current branch detection is handled by BranchSelector via currentBranch prop comparison.
  // We cannot determine "current" from the backend response alone since the * prefix is stripped.
  return branches.map((name) => ({ name, current: false }));
}

export function useGitBranches(projectName: string): {
  branches: GitBranch[] | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
} {
  const url = projectName
    ? `/api/git/branches?project=${encodeURIComponent(projectName)}`
    : null;

  const { data, loading, error, refetch } = useApiFetch<BranchesResponse, GitBranch[]>(url, {
    transform: transformBranches,
    errorLabel: 'Failed to fetch branches',
  });

  return { branches: data, loading, error, refetch };
}
