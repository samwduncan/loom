/**
 * SessionList tests -- multi-project rendering, collapse toggle, junk filtering,
 * plus preserved existing tests for rename, delete, streaming, navigation.
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { SessionList } from './SessionList';
import { useTimelineStore } from '@/stores/timeline';
import type { ProjectGroup } from '@/types/session';
import type { Session } from '@/types/session';

// Track navigate calls
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

// Mock useSessionList (still called for timeline store population)
vi.mock('@/hooks/useSessionList', () => ({
  useSessionList: () => ({ isLoading: false, error: null }),
}));

// Mock project context
vi.mock('@/hooks/useProjectContext', () => ({
  useProjectContext: () => ({ projectName: 'test-project', isLoading: false }),
  _resetProjectContextForTesting: vi.fn(),
}));

// Mock API client
vi.mock('@/lib/api-client', () => ({
  apiFetch: vi.fn().mockResolvedValue({}),
}));

// Mock stream store
const mockStreamState = {
  isStreaming: false,
  activeSessionId: null as string | null,
  liveAttachedSessions: new Set<string>(),
  notifiedSessions: new Set<string>(),
  clearNotifiedSession: vi.fn(),
  attachLiveSession: vi.fn(),
};
vi.mock('@/stores/stream', () => ({
  useStreamStore: Object.assign(
    (selector: (s: typeof mockStreamState) => unknown) => selector(mockStreamState),
    { getState: () => mockStreamState },
  ),
}));

// Mock useMobile -- default desktop
vi.mock('@/hooks/useMobile', () => ({
  useMobile: () => false,
}));

// Mock usePullToRefresh -- no-op
vi.mock('@/hooks/usePullToRefresh', () => ({
  usePullToRefresh: () => ({
    bind: () => ({}),
    pullDistance: 0,
    isRefreshing: false,
  }),
}));

// Mock useSwipeToDelete -- no-op (used by SessionItem)
vi.mock('@/hooks/useSwipeToDelete', () => ({
  useSwipeToDelete: () => ({
    bind: () => ({}),
    offset: 0,
    revealed: false,
    active: false,
    reset: vi.fn(),
  }),
}));

// Mock haptics
vi.mock('@/lib/haptics', () => ({
  hapticEvent: vi.fn(),
}));

// Mock native share
vi.mock('@/lib/native-share', () => ({
  nativeShare: vi.fn(),
}));

// Mock websocket client
vi.mock('@/lib/websocket-client', () => ({
  wsClient: { send: vi.fn() },
}));

// Capture SessionItemContextMenu callbacks for testing
let capturedContextMenuCallbacks: Record<string, { onRename: () => void; onDelete: () => void; onPin: () => void; onExport?: () => void; onSelect?: () => void }> = {};
vi.mock('./SessionItemContextMenu', () => ({
  SessionItemContextMenu: ({ children, sessionId, onRename, onDelete, onPin, onExport, onSelect }: {
    children: React.ReactNode;
    sessionId: string;
    onRename: () => void;
    onDelete: () => void;
    onPin: () => void;
    onExport?: () => void;
    onSelect?: () => void;
    isPinned: boolean;
  }) => {
    capturedContextMenuCallbacks[sessionId] = { onRename, onDelete, onPin, ...(onExport && { onExport }), ...(onSelect && { onSelect }) };
    return children;
  },
}));

// Mock useMultiProjectSessions
const mockToggleProject = vi.fn();
let mockMultiProjectResult = {
  projectGroups: [] as ProjectGroup[],
  isLoading: false,
  error: null as string | null,
  expandedProjects: new Set<string>(),
  toggleProject: mockToggleProject,
};

vi.mock('@/hooks/useMultiProjectSessions', () => ({
  useMultiProjectSessions: () => mockMultiProjectResult,
}));

function renderSessionList() {
  return render(
    <MemoryRouter>
      <SessionList />
    </MemoryRouter>,
  );
}

function makeSession(id: string, title: string, updatedAt?: string): Session {
  return {
    id,
    title,
    messages: [],
    providerId: 'claude',
    createdAt: updatedAt ?? new Date().toISOString(),
    updatedAt: updatedAt ?? new Date().toISOString(),
    metadata: { tokenBudget: null, contextWindowUsed: null, totalCost: null },
  };
}

function makeProjectGroup(
  name: string,
  sessions: Session[],
): ProjectGroup {
  return {
    projectName: name,
    displayName: name.replace(/-/g, ' '),
    projectPath: `/home/user/${name}`,
    sessionCount: sessions.length,
    visibleCount: sessions.length,
    dateGroups: sessions.length > 0
      ? [{ label: 'Today' as const, sessions }]
      : [],
  };
}

describe('SessionList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedContextMenuCallbacks = {};
    mockStreamState.isStreaming = false;
    mockStreamState.activeSessionId = null;
    useTimelineStore.setState({
      sessions: [],
      activeSessionId: null,
      activeProviderId: 'claude',
    });
    mockMultiProjectResult = {
      projectGroups: [],
      isLoading: false,
      error: null,
      expandedProjects: new Set<string>(),
      toggleProject: mockToggleProject,
    };
  });

  // -- Multi-project rendering tests --

  it('shows empty state when all projects have zero visible sessions', () => {
    mockMultiProjectResult.projectGroups = [
      { ...makeProjectGroup('empty-project', []), visibleCount: 0 },
    ];
    renderSessionList();
    expect(screen.getByText('No conversations yet')).toBeInTheDocument();
  });

  it('renders project headers with session counts', () => {
    const sessions1 = [makeSession('s1', 'First'), makeSession('s2', 'Second')];
    const sessions2 = [makeSession('s3', 'Third')];
    mockMultiProjectResult.projectGroups = [
      makeProjectGroup('project-alpha', sessions1),
      makeProjectGroup('project-beta', sessions2),
    ];
    renderSessionList();

    expect(screen.getByText('project alpha')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('project beta')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('collapsed project hides its sessions', () => {
    mockMultiProjectResult.projectGroups = [
      makeProjectGroup('collapsed-proj', [makeSession('s1', 'Hidden Session')]),
    ];
    // expandedProjects is empty, so project is collapsed
    mockMultiProjectResult.expandedProjects = new Set();
    renderSessionList();

    expect(screen.getByText('collapsed proj')).toBeInTheDocument();
    expect(screen.queryByText('Hidden Session')).not.toBeInTheDocument();
  });

  it('expanded project shows date groups and sessions', () => {
    mockMultiProjectResult.projectGroups = [
      makeProjectGroup('open-proj', [makeSession('s1', 'Visible Session')]),
    ];
    mockMultiProjectResult.expandedProjects = new Set(['open-proj']);
    renderSessionList();

    expect(screen.getByText('open proj')).toBeInTheDocument();
    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('Visible Session')).toBeInTheDocument();
  });

  it('calls toggleProject when ProjectHeader is clicked', async () => {
    const user = userEvent.setup();
    mockMultiProjectResult.projectGroups = [
      makeProjectGroup('toggle-proj', [makeSession('s1', 'Some Session')]),
    ];
    renderSessionList();

    const header = screen.getByText('toggle proj');
    await user.click(header);
    expect(mockToggleProject).toHaveBeenCalledWith('toggle-proj');
  });

  // -- Preserved existing tests --

  it('renders listbox with proper aria-label', () => {
    mockMultiProjectResult.projectGroups = [
      makeProjectGroup('test-project', [makeSession('s1', 'Session A')]),
    ];
    mockMultiProjectResult.expandedProjects = new Set(['test-project']);
    renderSessionList();
    const listbox = screen.getByRole('listbox');
    expect(listbox).toHaveAttribute('aria-label', 'Chat sessions list');
  });

  it('marks the active session', () => {
    useTimelineStore.setState({ activeSessionId: 'sess-active', activeProviderId: 'claude', sessions: [] });
    mockMultiProjectResult.projectGroups = [
      makeProjectGroup('test-project', [makeSession('sess-active', 'Active Session')]),
    ];
    mockMultiProjectResult.expandedProjects = new Set(['test-project']);
    renderSessionList();
    const option = screen.getByRole('option');
    expect(option).toHaveAttribute('aria-selected', 'true');
  });

  it('navigates to /chat/:sessionId when session is clicked', async () => {
    const user = userEvent.setup();
    mockMultiProjectResult.projectGroups = [
      makeProjectGroup('test-project', [makeSession('sess-nav', 'Navigate Session')]),
    ];
    mockMultiProjectResult.expandedProjects = new Set(['test-project']);
    renderSessionList();
    const option = screen.getByRole('option');
    await user.click(option);
    expect(mockNavigate).toHaveBeenCalledWith('/chat/sess-nav');
  });

  it('passes isStreaming prop based on stream store activeSessionId', () => {
    mockStreamState.isStreaming = true;
    mockStreamState.activeSessionId = 'sess-streaming';
    mockMultiProjectResult.projectGroups = [
      makeProjectGroup('test-project', [
        makeSession('sess-streaming', 'Streaming Session'),
        makeSession('sess-idle', 'Idle Session'),
      ]),
    ];
    mockMultiProjectResult.expandedProjects = new Set(['test-project']);
    renderSessionList();
    expect(screen.getByLabelText('Streaming')).toBeInTheDocument();
    expect(screen.getAllByLabelText('Streaming')).toHaveLength(1);
  });

  // -- Delete confirmation dialog tests --

  describe('delete confirmation', () => {
    it('shows confirmation dialog when Delete is triggered from context menu', async () => {
      const user = userEvent.setup();
      useTimelineStore.setState({
        sessions: [makeSession('sess-del', 'Delete Me')],
        activeSessionId: null, activeProviderId: 'claude',
      });
      mockMultiProjectResult.projectGroups = [
        makeProjectGroup('test-project', [makeSession('sess-del', 'Delete Me')]),
      ];
      mockMultiProjectResult.expandedProjects = new Set(['test-project']);
      renderSessionList();

      // Trigger delete via captured context menu callback
      const { act } = await import('@testing-library/react');
      act(() => { capturedContextMenuCallbacks['sess-del']!.onDelete(); }); // ASSERT: test session created in setup
      expect(screen.getByText('Delete session?')).toBeInTheDocument();
      // Clean up by clicking Cancel
      const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
      await user.click(cancelBtn);
    });

    it('closes dialog without deleting when Cancel is clicked', async () => {
      const user = userEvent.setup();
      useTimelineStore.setState({
        sessions: [makeSession('sess-cancel', 'Keep Me')],
        activeSessionId: null, activeProviderId: 'claude',
      });
      mockMultiProjectResult.projectGroups = [
        makeProjectGroup('test-project', [makeSession('sess-cancel', 'Keep Me')]),
      ];
      mockMultiProjectResult.expandedProjects = new Set(['test-project']);
      renderSessionList();

      const { act } = await import('@testing-library/react');
      act(() => { capturedContextMenuCallbacks['sess-cancel']!.onDelete(); }); // ASSERT: test session created in setup
      const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
      await user.click(cancelBtn);
      expect(screen.getByText('Keep Me')).toBeInTheDocument();
      expect(screen.queryByText('Delete session?')).not.toBeInTheDocument();
    });

    it('deletes session and removes from list when confirmed', async () => {
      const { apiFetch } = await import('@/lib/api-client');
      vi.mocked(apiFetch).mockResolvedValue({});

      const user = userEvent.setup();
      useTimelineStore.setState({
        sessions: [makeSession('sess-confirm', 'Delete This')],
        activeSessionId: null, activeProviderId: 'claude',
      });
      mockMultiProjectResult.projectGroups = [
        makeProjectGroup('test-project', [makeSession('sess-confirm', 'Delete This')]),
      ];
      mockMultiProjectResult.expandedProjects = new Set(['test-project']);
      renderSessionList();

      const { act } = await import('@testing-library/react');
      act(() => { capturedContextMenuCallbacks['sess-confirm']!.onDelete(); }); // ASSERT: test session created in setup
      const confirmBtn = screen.getByRole('button', { name: 'Delete' });
      await user.click(confirmBtn);

      // removeSession called on timeline store
      expect(useTimelineStore.getState().sessions).toHaveLength(0);
    });

    it('navigates to most recent session when active session is deleted', async () => {
      const { apiFetch } = await import('@/lib/api-client');
      vi.mocked(apiFetch).mockResolvedValue({});

      const user = userEvent.setup();
      const olderTime = new Date(Date.now() - 60000).toISOString();
      const newerTime = new Date().toISOString();
      useTimelineStore.setState({
        sessions: [
          makeSession('sess-old', 'Older Session', olderTime),
          makeSession('sess-new', 'Newer Session', newerTime),
        ],
        activeSessionId: 'sess-new', activeProviderId: 'claude',
      });
      mockMultiProjectResult.projectGroups = [
        makeProjectGroup('test-project', [
          makeSession('sess-new', 'Newer Session', newerTime),
          makeSession('sess-old', 'Older Session', olderTime),
        ]),
      ];
      mockMultiProjectResult.expandedProjects = new Set(['test-project']);
      renderSessionList();

      const { act } = await import('@testing-library/react');
      act(() => { capturedContextMenuCallbacks['sess-new']!.onDelete(); }); // ASSERT: test session created in setup
      const confirmBtn = screen.getByRole('button', { name: 'Delete' });
      await user.click(confirmBtn);
      expect(mockNavigate).toHaveBeenCalledWith('/chat/sess-old');
    });

    it('navigates to /chat when last session is deleted', async () => {
      const { apiFetch } = await import('@/lib/api-client');
      vi.mocked(apiFetch).mockResolvedValue({});

      const user = userEvent.setup();
      useTimelineStore.setState({
        sessions: [makeSession('sess-last', 'Last One')],
        activeSessionId: 'sess-last', activeProviderId: 'claude',
      });
      mockMultiProjectResult.projectGroups = [
        makeProjectGroup('test-project', [makeSession('sess-last', 'Last One')]),
      ];
      mockMultiProjectResult.expandedProjects = new Set(['test-project']);
      renderSessionList();

      const { act } = await import('@testing-library/react');
      act(() => { capturedContextMenuCallbacks['sess-last']!.onDelete(); }); // ASSERT: test session created in setup
      const confirmBtn = screen.getByRole('button', { name: 'Delete' });
      await user.click(confirmBtn);
      expect(mockNavigate).toHaveBeenCalledWith('/chat');
    });
  });

  // -- Rename with backend PATCH --

  describe('session rename', () => {
    it('calls apiFetch PATCH with correct URL and body on rename', async () => {
      const { apiFetch } = await import('@/lib/api-client');
      vi.mocked(apiFetch).mockResolvedValue({ success: true, title: 'New Title' });

      const user = userEvent.setup();
      useTimelineStore.setState({
        sessions: [makeSession('sess-rename', 'Old Title')],
        activeSessionId: null, activeProviderId: 'claude',
      });
      mockMultiProjectResult.projectGroups = [
        makeProjectGroup('test-project', [makeSession('sess-rename', 'Old Title')]),
      ];
      mockMultiProjectResult.expandedProjects = new Set(['test-project']);
      renderSessionList();

      // Trigger rename via captured context menu callback
      const { act } = await import('@testing-library/react');
      act(() => { capturedContextMenuCallbacks['sess-rename']!.onRename(); }); // ASSERT: test session created in setup

      const input = screen.getByDisplayValue('Old Title');
      await user.clear(input);
      await user.type(input, 'New Title');
      await user.tab();

      expect(apiFetch).toHaveBeenCalledWith(
        '/api/projects/test-project/sessions/sess-rename',
        { method: 'PATCH', body: JSON.stringify({ title: 'New Title' }) },
      );
    });

    it('rolls back title and shows toast on PATCH failure', async () => {
      const { apiFetch } = await import('@/lib/api-client');
      vi.mocked(apiFetch).mockRejectedValueOnce(new Error('Network error'));
      const { toast } = await import('sonner');
      const toastErrorSpy = vi.spyOn(toast, 'error');

      const user = userEvent.setup();
      useTimelineStore.setState({
        sessions: [makeSession('sess-fail', 'Original Title')],
        activeSessionId: null, activeProviderId: 'claude',
      });
      mockMultiProjectResult.projectGroups = [
        makeProjectGroup('test-project', [makeSession('sess-fail', 'Original Title')]),
      ];
      mockMultiProjectResult.expandedProjects = new Set(['test-project']);
      renderSessionList();

      const { act } = await import('@testing-library/react');
      act(() => { capturedContextMenuCallbacks['sess-fail']!.onRename(); }); // ASSERT: test session created in setup

      const input = screen.getByDisplayValue('Original Title');
      await user.clear(input);
      await user.type(input, 'Failed Title');
      await user.tab();

      await vi.waitFor(() => {
        expect(toastErrorSpy).toHaveBeenCalledWith('Failed to rename session');
      });
      expect(screen.getByText('Original Title')).toBeInTheDocument();
      toastErrorSpy.mockRestore();
    });

    it('keeps new title in timeline store on successful PATCH', async () => {
      const { apiFetch } = await import('@/lib/api-client');
      vi.mocked(apiFetch).mockResolvedValue({ success: true, title: 'Kept Title' });

      const user = userEvent.setup();
      useTimelineStore.setState({
        sessions: [makeSession('sess-success', 'Before Rename')],
        activeSessionId: null, activeProviderId: 'claude',
      });
      mockMultiProjectResult.projectGroups = [
        makeProjectGroup('test-project', [makeSession('sess-success', 'Before Rename')]),
      ];
      mockMultiProjectResult.expandedProjects = new Set(['test-project']);
      renderSessionList();

      const { act } = await import('@testing-library/react');
      act(() => { capturedContextMenuCallbacks['sess-success']!.onRename(); }); // ASSERT: test session created in setup

      const input = screen.getByDisplayValue('Before Rename');
      await user.clear(input);
      await user.type(input, 'Kept Title');
      await user.tab();

      await vi.waitFor(() => { expect(apiFetch).toHaveBeenCalled(); });
      // Timeline store should have the new title (optimistic update kept)
      const storeSession = useTimelineStore.getState().sessions.find((s) => s.id === 'sess-success');
      expect(storeSession?.title).toBe('Kept Title');
    });
  });
});
