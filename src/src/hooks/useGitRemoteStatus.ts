/**
 * useGitRemoteStatus -- fetches remote tracking status for the active project.
 *
 * Constitution: Named export (2.2), no default export.
 */

import { useApiFetch } from '@/hooks/useApiFetch';
import type { GitRemoteStatus } from '@/types/git';

export function useGitRemoteStatus(projectName: string): {
  remoteStatus: GitRemoteStatus | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
} {
  const url = projectName
    ? `/api/git/remote-status?project=${encodeURIComponent(projectName)}`
    : null;

  const { data, loading, error, refetch } = useApiFetch<GitRemoteStatus>(url, {
    errorLabel: 'Failed to fetch remote status',
  });

  return { remoteStatus: data, loading, error, refetch };
}
