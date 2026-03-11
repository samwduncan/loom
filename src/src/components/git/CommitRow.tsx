/**
 * CommitRow -- individual commit entry in the history list.
 *
 * Shows short hash, message, author, relative date.
 * Expandable to show commit stats and diff.
 *
 * Constitution: Named export (2.2), token-based styling (3.1).
 */

import type { GitCommit } from '@/types/git';

interface CommitRowProps {
  commit: GitCommit;
  isExpanded: boolean;
  onClick: () => void;
  diffContent?: string | null;
  diffLoading?: boolean;
}

/** Format ISO date string to relative time (e.g., "2 hours ago") */
function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

/** Truncate commit message to max length */
function truncateMessage(msg: string, maxLen = 60): string {
  if (msg.length <= maxLen) return msg;
  return msg.slice(0, maxLen - 3) + '...';
}

export function CommitRow({ commit, isExpanded, onClick, diffContent, diffLoading }: CommitRowProps) {
  return (
    <div
      className="git-commit-row"
      data-testid="commit-row"
      data-expanded={isExpanded}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="git-commit-row-main">
        <span className="git-commit-hash">{commit.hash.slice(0, 7)}</span>
        <span className="git-commit-message">{truncateMessage(commit.message)}</span>
      </div>
      <div className="git-commit-row-meta">
        <span className="git-commit-author">{commit.author}</span>
        <span className="git-commit-date">{formatRelativeDate(commit.date)}</span>
      </div>

      {isExpanded && (
        <div className="git-commit-expanded">
          <div className="git-commit-stats">{commit.stats}</div>
          {diffLoading && <div className="git-commit-diff-loading">Loading diff...</div>}
          {diffContent && (
            <pre className="git-commit-diff"><code>{diffContent}</code></pre>
          )}
        </div>
      )}
    </div>
  );
}
