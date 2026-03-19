/**
 * HistoryView -- commit history list with expandable rows.
 *
 * Shows recent commits with hash, message, author, date.
 * Clicking a commit expands to show stats and fetches diff from backend.
 *
 * Constitution: Named export (2.2), token-based styling (3.1).
 */

import { useState, useRef } from 'react';
import { GitCommit } from 'lucide-react';
import { toast } from 'sonner';
import { useGitCommits } from '@/hooks/useGitCommits';
import { apiFetch } from '@/lib/api-client';
import { EmptyState } from '@/components/shared/EmptyState';
import { CommitRow } from '@/components/git/CommitRow';
import { InlineError } from '@/components/shared/InlineError';

export interface HistoryViewProps {
  projectName: string;
}

export function HistoryView({ projectName }: HistoryViewProps) {
  const { commits, loading, error, refetch } = useGitCommits(projectName);
  const [expandedHash, setExpandedHash] = useState<string | null>(null);
  const [diffContent, setDiffContent] = useState<string | null>(null);
  const [diffLoading, setDiffLoading] = useState(false);
  const activeHashRef = useRef<string | null>(null);

  function handleRowClick(hash: string) {
    if (expandedHash === hash) {
      // Collapse
      setExpandedHash(null);
      setDiffContent(null);
      activeHashRef.current = null;
      return;
    }

    // Expand and fetch diff
    setExpandedHash(hash);
    setDiffContent(null);
    setDiffLoading(true);
    activeHashRef.current = hash;

    apiFetch<{ diff: string }>(
      `/api/git/commit-diff?project=${encodeURIComponent(projectName)}&commit=${encodeURIComponent(hash)}`,
    )
      .then((data) => {
        if (activeHashRef.current === hash) {
          setDiffContent(data.diff);
        }
      })
      .catch((err: unknown) => {
        console.error('Failed to fetch commit diff:', err);
        if (activeHashRef.current === hash) {
          toast.error('Failed to load diff');
          setDiffContent(null);
        }
      })
      .finally(() => {
        if (activeHashRef.current === hash) {
          setDiffLoading(false);
        }
      });
  }

  if (loading) {
    return (
      <div className="git-history-skeleton" role="status" aria-label="Loading commit history" data-testid="history-skeleton">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="git-commit-row-skeleton">
            <div className="git-skeleton-line skeleton-shimmer git-skeleton-short" />
            <div className="git-skeleton-line skeleton-shimmer git-skeleton-long" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <InlineError message={error} onRetry={refetch} className="h-full" />;
  }

  if (!commits || commits.length === 0) {
    return (
      <EmptyState
        icon={<GitCommit className="size-8" />}
        heading="No commits yet"
        description="Make your first commit to see history here"
        className="h-full"
      />
    );
  }

  return (
    <div className="git-history-list">
      {commits.map((commit) => (
        <CommitRow
          key={commit.hash}
          commit={commit}
          isExpanded={expandedHash === commit.hash}
          onClick={() => handleRowClick(commit.hash)}
          diffContent={expandedHash === commit.hash ? diffContent : null}
          diffLoading={expandedHash === commit.hash && diffLoading}
        />
      ))}
    </div>
  );
}
