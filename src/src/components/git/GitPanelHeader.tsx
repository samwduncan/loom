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

interface GitPanelHeaderProps {
  branch: string;
  projectName: string;
  onRefresh: () => void;
}

export function GitPanelHeader({ branch, projectName, onRefresh }: GitPanelHeaderProps) {
  const { remoteStatus, refetch: refetchRemote } = useGitRemoteStatus(projectName);
  const operations = useGitOperations(projectName);

  const [pushing, setPushing] = useState(false);
  const [pulling, setPulling] = useState(false);
  const [fetching, setFetching] = useState(false);

  const hasRemote = remoteStatus?.hasRemote ?? false;
  const hasUpstream = remoteStatus?.hasUpstream ?? false;

  async function handlePush() {
    setPushing(true);
    try {
      await operations.push();
      toast.success('Push successful');
      refetchRemote();
      onRefresh();
    } catch (err) {
      toast.error(`Push failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setPushing(false);
    }
  }

  async function handlePull() {
    setPulling(true);
    try {
      await operations.pull();
      toast.success('Pull successful');
      refetchRemote();
      onRefresh();
    } catch (err) {
      toast.error(`Pull failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setPulling(false);
    }
  }

  async function handleFetch() {
    setFetching(true);
    try {
      await operations.fetch();
      toast.success('Fetch successful');
      refetchRemote();
      onRefresh();
    } catch (err) {
      toast.error(`Fetch failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setFetching(false);
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
            onClick={handlePush}
            disabled={pushing}
          >
            {pushing ? <Loader2 size={14} className="git-spinner" /> : <ArrowUp size={14} />}
          </button>
          <button
            type="button"
            className="git-action-btn"
            title="Pull"
            onClick={handlePull}
            disabled={pulling}
          >
            {pulling ? <Loader2 size={14} className="git-spinner" /> : <ArrowDown size={14} />}
          </button>
          <button
            type="button"
            className="git-action-btn"
            title="Fetch"
            onClick={handleFetch}
            disabled={fetching}
          >
            {fetching ? <Loader2 size={14} className="git-spinner" /> : <RefreshCw size={14} />}
          </button>
        </div>
      )}
    </div>
  );
}
