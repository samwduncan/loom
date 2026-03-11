/**
 * GitPanel -- Top-level git panel with Changes/History sub-tab toggle.
 *
 * Shows loading skeleton while fetching status, error state with retry,
 * and placeholder content areas for Changes (Plan 02) and History (Plan 03).
 *
 * Constitution: Named export (2.2), cn() for classes (3.6), token-based styling (3.1).
 */

import { useState } from 'react';
import { useProjectContext } from '@/hooks/useProjectContext';
import { useGitStatus } from '@/hooks/useGitStatus';
import { GitPanelSkeleton } from '@/components/git/GitPanelSkeleton';
import { GitPanelHeader } from '@/components/git/GitPanelHeader';
import { ChangesView } from '@/components/git/ChangesView';
import { HistoryView } from '@/components/git/HistoryView';
import type { GitSubView } from '@/types/git';
import './git-panel.css';

export function GitPanel() {
  const { projectName } = useProjectContext();
  const { data, loading, error, refetch } = useGitStatus(projectName);
  const [activeView, setActiveView] = useState<GitSubView>('changes');

  return (
    <div className="git-panel">
      {/* Header with branch selector and remote actions */}
      {data && !loading && !error && (
        <GitPanelHeader
          branch={data.branch}
          projectName={projectName}
          onRefresh={refetch}
        />
      )}

      {/* Sub-tab bar */}
      <div className="git-sub-tabs">
        <button
          type="button"
          className="git-sub-tab"
          data-active={activeView === 'changes'}
          onClick={() => setActiveView('changes')}
        >
          Changes
        </button>
        <button
          type="button"
          className="git-sub-tab"
          data-active={activeView === 'history'}
          onClick={() => setActiveView('history')}
        >
          History
        </button>
      </div>

      {/* Content area */}
      {loading && <GitPanelSkeleton />}

      {error && (
        <div className="git-error">
          <p className="git-error-message">{error}</p>
          <button type="button" className="git-error-retry" onClick={refetch}>
            Retry
          </button>
        </div>
      )}

      {data && !loading && !error && (
        <div className="git-panel-content">
          {activeView === 'changes' && (
            <ChangesView files={data.files} refetchStatus={refetch} />
          )}
          {activeView === 'history' && (
            <HistoryView projectName={projectName} />
          )}
        </div>
      )}
    </div>
  );
}
