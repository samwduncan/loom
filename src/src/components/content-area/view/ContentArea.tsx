/**
 * ContentArea -- Lazy-mount-on-first-visit container with CSS show/hide for workspace panels.
 *
 * PERF-03: Shell and Git panels use lazy-mount-on-first-visit -- their JavaScript
 * bundles only load when the user first navigates to that tab. After first visit,
 * the panel stays mounted (preserving terminal sessions, git state) via CSS show/hide.
 *
 * Chat and Files are always eagerly mounted (chat is the primary view, files is lightweight).
 *
 * PERF-04 Skeleton Audit (verified 2026-03-27):
 * All async content areas have skeleton loading states with zero layout shift:
 *   - Messages: MessageListSkeleton (in ChatView)
 *   - Session list: SessionListSkeleton (in SessionList)
 *   - Terminal: TerminalSkeleton (Suspense fallback here)
 *   - Git: GitPanelSkeleton (Suspense fallback here)
 *   - Editor: EditorSkeleton (Suspense fallback in FileTreePanel)
 *   - File tree: inline skeleton (in FileTree component, fetchState === 'loading')
 *   - Settings tabs: SettingsTabSkeleton (in settings components)
 *
 * Mobile viewports (<768px) override activeTab to 'chat' in the render path
 * (no store mutation) to ensure Chat is always visible on small screens.
 *
 * Constitution: Named export (2.2), cn() for classes (3.6), selector-only store (4.2),
 * token-based styling (3.1).
 */

import { lazy, Suspense, useState } from 'react';
import { cn } from '@/utils/cn';
import { useUIStore } from '@/stores/ui';
import { useMobile } from '@/hooks/useMobile';
import type { TabId } from '@/types/ui';
import { TabBar } from './TabBar';
import { useTabKeyboardShortcuts } from '../hooks/useTabKeyboardShortcuts';
import { PanelErrorBoundary } from '@/components/shared/ErrorBoundary';
import { Skeleton } from '@/components/shared/Skeleton';
import { ChatView } from '@/components/chat/view/ChatView';
import { FileTreePanel } from '@/components/file-tree/FileTreePanel';
import { GitPanelSkeleton } from '@/components/git/GitPanelSkeleton';

const LazyTerminalPanel = lazy(() =>
  import('@/components/terminal/TerminalPanel').then((mod) => ({
    default: mod.TerminalPanel,
  })),
);

const LazyGitPanel = lazy(() =>
  import('@/components/git/GitPanel').then((mod) => ({
    default: mod.GitPanel,
  })),
);

function TerminalSkeleton() {
  const widths = ['w-[20%]', 'w-[75%]', 'w-[60%]', 'w-[85%]', 'w-[70%]', 'w-[90%]', 'w-[55%]', 'w-[80%]', 'w-[65%]', 'w-[45%]'];
  return (
    <div className="h-full p-3 space-y-2 bg-[var(--surface-base)]" role="status" aria-label="Loading terminal">
      {widths.map((w, i) => (
        <Skeleton key={i} className={cn('h-3', w)} />
      ))}
    </div>
  );
}

export function ContentArea() {
  useTabKeyboardShortcuts();

  const rawActiveTab = useUIStore((s) => s.activeTab);

  // Mobile override: force chat on small viewports (LAY-06)
  // Synchronous in the render path -- no useEffect flash, no store mutation
  const isMobile = useMobile();
  const activeTab = isMobile ? 'chat' : rawActiveTab;

  // PERF-03: Track which tabs have been visited. Chat and files are always eager.
  // Uses "adjust state during rendering" pattern (React docs): set state in the render
  // path only when the value actually changes. This is safe because it's monotonic
  // (tabs are only added, never removed) and React handles it without an extra commit.
  const [visitedTabs, setVisitedTabs] = useState<Set<TabId>>(() => new Set(['chat', 'files']));

  // Mark current tab as visited -- only triggers re-render on first visit to a new tab
  if (!visitedTabs.has(activeTab)) {
    setVisitedTabs((prev) => new Set(prev).add(activeTab));
  }

  const shellVisited = visitedTabs.has('shell');
  const gitVisited = visitedTabs.has('git');

  return (
    <div className="flex h-full flex-col">
      <TabBar />
      <div className="relative flex-1 min-h-0">
        {/* Chat: always rendered (primary panel) */}
        <div
          id="panel-chat"
          role="tabpanel"
          tabIndex={-1}
          aria-labelledby="tab-chat"
          className={activeTab === 'chat' ? 'h-full outline-none' : 'hidden'}
        >
          <PanelErrorBoundary panelName="chat" resetKeys={activeTab === 'chat' ? [activeTab] : []}>
            <ChatView />
          </PanelErrorBoundary>
        </div>

        {/* Files: always rendered (lightweight, preserves tree state) */}
        <div
          id="panel-files"
          role="tabpanel"
          tabIndex={-1}
          aria-labelledby="tab-files"
          className={activeTab === 'files' ? 'h-full outline-none' : 'hidden'}
        >
          <PanelErrorBoundary panelName="files" resetKeys={activeTab === 'files' ? [activeTab] : []}>
            <FileTreePanel />
          </PanelErrorBoundary>
        </div>

        {/* Shell: lazy-mount-on-first-visit */}
        {shellVisited && (
          <div
            id="panel-shell"
            role="tabpanel"
            tabIndex={-1}
            aria-labelledby="tab-shell"
            className={activeTab === 'shell' ? 'h-full outline-none' : 'hidden'}
          >
            <PanelErrorBoundary panelName="shell" resetKeys={activeTab === 'shell' ? [activeTab] : []}>
              <Suspense fallback={<TerminalSkeleton />}>
                <LazyTerminalPanel />
              </Suspense>
            </PanelErrorBoundary>
          </div>
        )}

        {/* Git: lazy-mount-on-first-visit */}
        {gitVisited && (
          <div
            id="panel-git"
            role="tabpanel"
            tabIndex={-1}
            aria-labelledby="tab-git"
            className={activeTab === 'git' ? 'h-full outline-none' : 'hidden'}
          >
            <PanelErrorBoundary panelName="git" resetKeys={activeTab === 'git' ? [activeTab] : []}>
              <Suspense fallback={<GitPanelSkeleton />}>
                <LazyGitPanel />
              </Suspense>
            </PanelErrorBoundary>
          </div>
        )}
      </div>
    </div>
  );
};
