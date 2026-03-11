/**
 * GitPanelHeader -- branch selector, push/pull/fetch buttons, remote status badge.
 *
 * Displays current branch with BranchSelector dropdown, ahead/behind counts,
 * and action buttons for push/pull/fetch with loading states and toast feedback.
 *
 * Constitution: Named export (2.2), cn() for classes (3.6), token-based styling (3.1).
 */

import { useState } from 'react';
import { ArrowUp, ArrowDown, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useGitRemoteStatus } from '@/hooks/useGitRemoteStatus';
import { useGitOperations } from '@/hooks/useGitOperations';
import { BranchSelector } from '@/components/git/BranchSelector';

export interface GitPanelHeaderProps {
  branch: string;
  projectName: string;
  onRefresh: () => void;
}

type RemoteOp = 'push' | 'pull' | 'fetch';

export function GitPanelHeader({ branch, projectName, onRefresh }: GitPanelHeaderProps) {
  const { remoteStatus, refetch: refetchRemote } = useGitRemoteStatus(projectName);
  const operations = useGitOperations(projectName);

  const [activeOp, setActiveOp] = useState<RemoteOp | null>(null);

  const hasRemote = remoteStatus?.hasRemote ?? false;
  const hasUpstream = remoteStatus?.hasUpstream ?? false;

  async function handleRemoteOp(op: RemoteOp) {
    if (activeOp) return;
    setActiveOp(op);
    try {
      await operations[op]();
      toast.success(`${op.charAt(0).toUpperCase() + op.slice(1)} successful`);
      refetchRemote();
      onRefresh();
    } catch (err) {
      toast.error(`${op.charAt(0).toUpperCase() + op.slice(1)} failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setActiveOp(null);
    }
  }

  function handleBranchChange() {
    refetchRemote();
    onRefresh();
  }

  return (
    <div className="git-header">
      <BranchSelector
        currentBranch={branch}
        projectName={projectName}
        onBranchChange={handleBranchChange}
      />

      {hasRemote && hasUpstream && (
        <div className="git-remote-badge" data-testid="remote-badge">
          {(remoteStatus?.ahead ?? 0) > 0 && (
            <span className="git-ahead">
              <ArrowUp size={10} />
              {remoteStatus?.ahead}
            </span>
          )}
          {(remoteStatus?.behind ?? 0) > 0 && (
            <span className="git-behind">
              <ArrowDown size={10} />
              {remoteStatus?.behind}
            </span>
          )}
          {remoteStatus?.isUpToDate && (
            <span className="git-up-to-date">up to date</span>
          )}
        </div>
      )}

      {hasRemote && !hasUpstream && (
        <span className="git-no-upstream">No upstream</span>
      )}

      {hasRemote && (
        <div className="git-action-buttons">
          <button
            type="button"
            className="git-action-btn"
            title="Push"
            onClick={() => handleRemoteOp('push')}
            disabled={activeOp !== null}
          >
            {activeOp === 'push' ? <Loader2 size={14} className="git-spinner" /> : <ArrowUp size={14} />}
          </button>
          <button
            type="button"
            className="git-action-btn"
            title="Pull"
            onClick={() => handleRemoteOp('pull')}
            disabled={activeOp !== null}
          >
            {activeOp === 'pull' ? <Loader2 size={14} className="git-spinner" /> : <ArrowDown size={14} />}
          </button>
          <button
            type="button"
            className="git-action-btn"
            title="Fetch"
            onClick={() => handleRemoteOp('fetch')}
            disabled={activeOp !== null}
          >
            {activeOp === 'fetch' ? <Loader2 size={14} className="git-spinner" /> : <RefreshCw size={14} />}
          </button>
        </div>
      )}
    </div>
  );
}
