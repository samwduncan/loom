/**
 * HistoryView -- commit history list with expandable rows.
 *
 * Shows recent commits with hash, message, author, date.
 * Clicking a commit expands to show stats and fetches diff from backend.
 *
 * Constitution: Named export (2.2), token-based styling (3.1).
 */

import { useState } from 'react';
import { useGitCommits } from '@/hooks/useGitCommits';
import { apiFetch } from '@/lib/api-client';
import { CommitRow } from '@/components/git/CommitRow';

interface HistoryViewProps {
  projectName: string;
}

export function HistoryView({ projectName }: HistoryViewProps) {
  const { commits, loading, error } = useGitCommits(projectName);
  const [expandedHash, setExpandedHash] = useState<string | null>(null);
  const [diffContent, setDiffContent] = useState<string | null>(null);
  const [diffLoading, setDiffLoading] = useState(false);

  function handleRowClick(hash: string) {
    if (expandedHash === hash) {
      // Collapse
      setExpandedHash(null);
      setDiffContent(null);
      return;
    }

    // Expand and fetch diff
    setExpandedHash(hash);
    setDiffContent(null);
    setDiffLoading(true);

    apiFetch<string>(
      `/api/git/commit-diff?project=${encodeURIComponent(projectName)}&hash=${encodeURIComponent(hash)}`,
    )
      .then((data) => {
        setDiffContent(typeof data === 'string' ? data : JSON.stringify(data));
      })
      .catch(() => {
        setDiffContent(null);
      })
      .finally(() => {
        setDiffLoading(false);
      });
  }

  if (loading) {
    return (
      <div className="git-history-skeleton" data-testid="history-skeleton">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="git-commit-row-skeleton">
            <div className="git-skeleton-line git-skeleton-short" />
            <div className="git-skeleton-line git-skeleton-long" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="git-empty-state">
        <p className="git-empty-message">{error}</p>
      </div>
    );
  }

  if (!commits || commits.length === 0) {
    return (
      <div className="git-empty-state">
        <p className="git-empty-message">No commits yet</p>
      </div>
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
