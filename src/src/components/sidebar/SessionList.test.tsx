/**
 * SessionList tests -- date grouping, loading skeleton, empty state.
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { SessionList } from './SessionList';
import { useTimelineStore } from '@/stores/timeline';

// Track navigate calls
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

// Mock the useSessionList hook to control loading state directly
vi.mock('@/hooks/useSessionList', () => ({
  useSessionList: () => ({ isLoading: false, error: null }),
}));

// Mock project context
vi.mock('@/hooks/useProjectContext', () => ({
  useProjectContext: () => ({ projectName: 'test-project', isLoading: false }),
  _resetProjectContextForTesting: vi.fn(),
}));

// Mock API client (used by SessionContextMenu delete)
vi.mock('@/lib/api-client', () => ({
  apiFetch: vi.fn().mockResolvedValue({}),
}));

// Mock stream store for streaming indicator
const mockStreamState = {
  isStreaming: false,
  activeSessionId: null as string | null,
};
vi.mock('@/stores/stream', () => ({
  useStreamStore: (selector: (s: typeof mockStreamState) => unknown) => selector(mockStreamState),
}));

function renderSessionList() {
  return render(
    <MemoryRouter>
      <SessionList />
    </MemoryRouter>,
  );
}

describe('SessionList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStreamState.isStreaming = false;
    mockStreamState.activeSessionId = null;
    useTimelineStore.setState({
      sessions: [],
      activeSessionId: null,
      activeProviderId: 'claude',
    });
  });

  it('shows empty state when no sessions exist', () => {
    renderSessionList();
    expect(screen.getByText('No conversations yet')).toBeInTheDocument();
  });

  it('renders sessions grouped by date with headers', () => {
    const now = new Date();
    useTimelineStore.setState({
      sessions: [
        {
          id: 'sess-today',
          title: 'Today Session',
          messages: [],
          providerId: 'claude',
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
          metadata: { tokenBudget: null, contextWindowUsed: null, totalCost: null },
        },
      ],
      activeSessionId: null,
      activeProviderId: 'claude',
    });

    renderSessionList();
    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('Today Session')).toBeInTheDocument();
  });

  it('renders listbox with proper aria-label', () => {
    useTimelineStore.setState({
      sessions: [
        {
          id: 'sess-1',
          title: 'Session A',
          messages: [],
          providerId: 'claude',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          metadata: { tokenBudget: null, contextWindowUsed: null, totalCost: null },
        },
      ],
      activeSessionId: null,
      activeProviderId: 'claude',
    });

    renderSessionList();
    const listbox = screen.getByRole('listbox');
    expect(listbox).toHaveAttribute('aria-label', 'Chat sessions list');
  });

  it('marks the active session', () => {
    useTimelineStore.setState({
      sessions: [
        {
          id: 'sess-active',
          title: 'Active Session',
          messages: [],
          providerId: 'claude',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          metadata: { tokenBudget: null, contextWindowUsed: null, totalCost: null },
        },
      ],
      activeSessionId: 'sess-active',
      activeProviderId: 'claude',
    });

    renderSessionList();
    const option = screen.getByRole('option');
    expect(option).toHaveAttribute('aria-selected', 'true');
  });

  it('navigates to /chat/:sessionId when session is clicked', async () => {
    const user = userEvent.setup();
    useTimelineStore.setState({
      sessions: [
        {
          id: 'sess-nav',
          title: 'Navigate Session',
          messages: [],
          providerId: 'claude',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          metadata: { tokenBudget: null, contextWindowUsed: null, totalCost: null },
        },
      ],
      activeSessionId: null,
      activeProviderId: 'claude',
    });

    renderSessionList();
    const option = screen.getByRole('option');
    await user.click(option);

    expect(mockNavigate).toHaveBeenCalledWith('/chat/sess-nav');
    // SessionList only navigates — ChatView coordinates session switching via URL
  });

  // -- Streaming indicator --

  it('passes isStreaming prop based on stream store activeSessionId', () => {
    mockStreamState.isStreaming = true;
    mockStreamState.activeSessionId = 'sess-streaming';

    useTimelineStore.setState({
      sessions: [
        {
          id: 'sess-streaming',
          title: 'Streaming Session',
          messages: [],
          providerId: 'claude',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          metadata: { tokenBudget: null, contextWindowUsed: null, totalCost: null },
        },
        {
          id: 'sess-idle',
          title: 'Idle Session',
          messages: [],
          providerId: 'claude',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          metadata: { tokenBudget: null, contextWindowUsed: null, totalCost: null },
        },
      ],
      activeSessionId: null,
      activeProviderId: 'claude',
    });

    renderSessionList();

    // Streaming session should have the streaming dot
    expect(screen.getByLabelText('Streaming')).toBeInTheDocument();
    // Only one streaming dot
    expect(screen.getAllByLabelText('Streaming')).toHaveLength(1);
  });

  // -- Delete confirmation dialog tests --

  describe('delete confirmation', () => {
    const makeSession = (id: string, title: string, updatedAt?: string) => ({
      id,
      title,
      messages: [],
      providerId: 'claude' as const,
      createdAt: updatedAt ?? new Date().toISOString(),
      updatedAt: updatedAt ?? new Date().toISOString(),
      metadata: { tokenBudget: null, contextWindowUsed: null, totalCost: null },
    });

    it('shows confirmation dialog when Delete is clicked from context menu', async () => {
      const user = userEvent.setup();
      useTimelineStore.setState({
        sessions: [makeSession('sess-del', 'Delete Me')],
        activeSessionId: null,
        activeProviderId: 'claude',
      });

      renderSessionList();
      const option = screen.getByRole('option');
      await user.pointer({ keys: '[MouseRight]', target: option });

      // Context menu should appear with Delete button
      const deleteBtn = screen.getByRole('menuitem', { name: 'Delete' });
      await user.click(deleteBtn);

      // Confirmation dialog should appear
      expect(screen.getByText('Delete session?')).toBeInTheDocument();
      expect(screen.getByText(/permanently delete/i)).toBeInTheDocument();
    });

    it('closes dialog without deleting when Cancel is clicked', async () => {
      const user = userEvent.setup();
      useTimelineStore.setState({
        sessions: [makeSession('sess-cancel', 'Keep Me')],
        activeSessionId: null,
        activeProviderId: 'claude',
      });

      renderSessionList();
      const option = screen.getByRole('option');
      await user.pointer({ keys: '[MouseRight]', target: option });

      const deleteBtn = screen.getByRole('menuitem', { name: 'Delete' });
      await user.click(deleteBtn);

      // Click cancel
      const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
      await user.click(cancelBtn);

      // Session should still exist
      expect(screen.getByText('Keep Me')).toBeInTheDocument();
      // Dialog should be gone
      expect(screen.queryByText('Delete session?')).not.toBeInTheDocument();
    });

    it('deletes session and removes from list when confirmed', async () => {
      const { apiFetch } = await import('@/lib/api-client');
      const mockApiFetch = vi.mocked(apiFetch);
      mockApiFetch.mockResolvedValue({});

      const user = userEvent.setup();
      useTimelineStore.setState({
        sessions: [makeSession('sess-confirm', 'Delete This')],
        activeSessionId: null,
        activeProviderId: 'claude',
      });

      renderSessionList();
      const option = screen.getByRole('option');
      await user.pointer({ keys: '[MouseRight]', target: option });

      const deleteBtn = screen.getByRole('menuitem', { name: 'Delete' });
      await user.click(deleteBtn);

      // Confirm deletion
      const confirmBtn = screen.getByRole('button', { name: 'Delete' });
      await user.click(confirmBtn);

      // Session should be removed
      expect(screen.queryByText('Delete This')).not.toBeInTheDocument();
    });

    it('navigates to most recent session when active session is deleted', async () => {
      const { apiFetch } = await import('@/lib/api-client');
      const mockApiFetch = vi.mocked(apiFetch);
      mockApiFetch.mockResolvedValue({});

      const user = userEvent.setup();
      const olderTime = new Date(Date.now() - 60000).toISOString();
      const newerTime = new Date().toISOString();
      useTimelineStore.setState({
        sessions: [
          makeSession('sess-old', 'Older Session', olderTime),
          makeSession('sess-new', 'Newer Session', newerTime),
        ],
        activeSessionId: 'sess-new',
        activeProviderId: 'claude',
      });

      renderSessionList();
      // Right-click the active (newer) session
      const options = screen.getAllByRole('option');
      // Find the newer session option
      const newerOption = options.find(
        (opt) => opt.textContent?.includes('Newer Session'),
      );
      expect(newerOption).toBeDefined();
      await user.pointer({ keys: '[MouseRight]', target: newerOption! }); // ASSERT: checked above

      const deleteBtn = screen.getByRole('menuitem', { name: 'Delete' });
      await user.click(deleteBtn);

      const confirmBtn = screen.getByRole('button', { name: 'Delete' });
      await user.click(confirmBtn);

      // Should navigate to the remaining older session
      expect(mockNavigate).toHaveBeenCalledWith('/chat/sess-old');
    });

    it('navigates to /chat when last session is deleted', async () => {
      const { apiFetch } = await import('@/lib/api-client');
      const mockApiFetch = vi.mocked(apiFetch);
      mockApiFetch.mockResolvedValue({});

      const user = userEvent.setup();
      useTimelineStore.setState({
        sessions: [makeSession('sess-last', 'Last One')],
        activeSessionId: 'sess-last',
        activeProviderId: 'claude',
      });

      renderSessionList();
      const option = screen.getByRole('option');
      await user.pointer({ keys: '[MouseRight]', target: option });

      const deleteBtn = screen.getByRole('menuitem', { name: 'Delete' });
      await user.click(deleteBtn);

      const confirmBtn = screen.getByRole('button', { name: 'Delete' });
      await user.click(confirmBtn);

      // Should navigate to empty chat
      expect(mockNavigate).toHaveBeenCalledWith('/chat');
    });
  });

  // -- Rename with backend PATCH --

  describe('session rename', () => {
    const makeSession = (id: string, title: string) => ({
      id,
      title,
      messages: [],
      providerId: 'claude' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: { tokenBudget: null, contextWindowUsed: null, totalCost: null },
    });

    it('calls apiFetch PATCH with correct URL and body on rename', async () => {
      const { apiFetch } = await import('@/lib/api-client');
      const mockApiFetch = vi.mocked(apiFetch);
      mockApiFetch.mockResolvedValue({ success: true, title: 'New Title' });

      const user = userEvent.setup();
      useTimelineStore.setState({
        sessions: [makeSession('sess-rename', 'Old Title')],
        activeSessionId: null,
        activeProviderId: 'claude',
      });

      renderSessionList();

      // Right-click to open context menu
      const option = screen.getByRole('option');
      await user.pointer({ keys: '[MouseRight]', target: option });

      // Click Rename from context menu
      const renameBtn = screen.getByRole('menuitem', { name: 'Rename' });
      await user.click(renameBtn);

      // Type new title in the input
      const input = screen.getByDisplayValue('Old Title');
      await user.clear(input);
      await user.type(input, 'New Title');

      // Blur to confirm edit
      await user.tab();

      // Verify PATCH was called with correct URL and body
      expect(mockApiFetch).toHaveBeenCalledWith(
        '/api/projects/test-project/sessions/sess-rename',
        { method: 'PATCH', body: JSON.stringify({ title: 'New Title' }) },
      );
    });

    it('rolls back title and shows toast on PATCH failure', async () => {
      const { apiFetch } = await import('@/lib/api-client');
      const mockApiFetch = vi.mocked(apiFetch);
      mockApiFetch.mockRejectedValueOnce(new Error('Network error'));

      // Mock toast
      const { toast } = await import('sonner');
      const toastErrorSpy = vi.spyOn(toast, 'error');

      const user = userEvent.setup();
      useTimelineStore.setState({
        sessions: [makeSession('sess-fail', 'Original Title')],
        activeSessionId: null,
        activeProviderId: 'claude',
      });

      renderSessionList();

      // Right-click -> Rename
      const option = screen.getByRole('option');
      await user.pointer({ keys: '[MouseRight]', target: option });
      const renameBtn = screen.getByRole('menuitem', { name: 'Rename' });
      await user.click(renameBtn);

      // Type new title and blur
      const input = screen.getByDisplayValue('Original Title');
      await user.clear(input);
      await user.type(input, 'Failed Title');
      await user.tab();

      // Wait for async error handling
      await vi.waitFor(() => {
        expect(toastErrorSpy).toHaveBeenCalledWith('Failed to rename session');
      });

      // Title should have rolled back
      expect(screen.getByText('Original Title')).toBeInTheDocument();

      toastErrorSpy.mockRestore();
    });

    it('keeps new title on successful PATCH', async () => {
      const { apiFetch } = await import('@/lib/api-client');
      const mockApiFetch = vi.mocked(apiFetch);
      mockApiFetch.mockResolvedValue({ success: true, title: 'Kept Title' });

      const user = userEvent.setup();
      useTimelineStore.setState({
        sessions: [makeSession('sess-success', 'Before Rename')],
        activeSessionId: null,
        activeProviderId: 'claude',
      });

      renderSessionList();

      // Right-click -> Rename
      const option = screen.getByRole('option');
      await user.pointer({ keys: '[MouseRight]', target: option });
      const renameBtn = screen.getByRole('menuitem', { name: 'Rename' });
      await user.click(renameBtn);

      // Type new title and blur
      const input = screen.getByDisplayValue('Before Rename');
      await user.clear(input);
      await user.type(input, 'Kept Title');
      await user.tab();

      // Wait for PATCH to resolve
      await vi.waitFor(() => {
        expect(mockApiFetch).toHaveBeenCalled();
      });

      // Title should remain as new value
      expect(screen.getByText('Kept Title')).toBeInTheDocument();
    });
  });
});
