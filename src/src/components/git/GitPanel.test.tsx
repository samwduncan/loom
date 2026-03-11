import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock useProjectContext
vi.mock('@/hooks/useProjectContext', () => ({
  useProjectContext: () => ({ projectName: 'test-project', projectPath: '/test', isLoading: false }),
}));

// Mock useGitStatus
const mockRefetch = vi.fn();
const mockUseGitStatus = vi.fn();
vi.mock('@/hooks/useGitStatus', () => ({
  useGitStatus: (...args: unknown[]) => mockUseGitStatus(...args),
}));

// Mock useGitOperations (used by ChangesView)
vi.mock('@/hooks/useGitOperations', () => ({
  useGitOperations: () => ({
    commit: vi.fn(),
    discard: vi.fn(),
    deleteUntracked: vi.fn(),
    generateCommitMessage: vi.fn(),
    push: vi.fn(),
    pull: vi.fn(),
    fetch: vi.fn(),
    checkout: vi.fn(),
    createBranch: vi.fn(),
  }),
}));

// Mock useOpenInEditor (used by ChangesView)
vi.mock('@/hooks/useOpenInEditor', () => ({
  useOpenInEditor: () => vi.fn(),
}));

// Mock sonner toast (used by CommitComposer, GitPanelHeader)
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// Mock useGitRemoteStatus (used by GitPanelHeader)
vi.mock('@/hooks/useGitRemoteStatus', () => ({
  useGitRemoteStatus: () => ({
    remoteStatus: { hasRemote: false, hasUpstream: false, branch: 'main' },
    loading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

// Mock useGitBranches (used by BranchSelector)
vi.mock('@/hooks/useGitBranches', () => ({
  useGitBranches: () => ({
    branches: [{ name: 'main', current: true }],
    loading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

// Mock useGitCommits (used by HistoryView)
vi.mock('@/hooks/useGitCommits', () => ({
  useGitCommits: () => ({
    commits: [],
    loading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

import { GitPanel } from '@/components/git/GitPanel';

describe('GitPanel', () => {
  beforeEach(() => {
    mockRefetch.mockReset();
    mockUseGitStatus.mockReset();
  });

  it('renders Changes and History sub-tab buttons', () => {
    mockUseGitStatus.mockReturnValue({
      data: { branch: 'main', hasCommits: true, files: [] },
      loading: false,
      error: null,
      refetch: mockRefetch,
    });

    render(<GitPanel />);

    expect(screen.getByRole('button', { name: /changes/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /history/i })).toBeInTheDocument();
  });

  it('shows skeleton when loading', () => {
    mockUseGitStatus.mockReturnValue({
      data: null,
      loading: true,
      error: null,
      refetch: mockRefetch,
    });

    render(<GitPanel />);

    expect(screen.getByTestId('git-panel-skeleton')).toBeInTheDocument();
  });

  it('shows error message and Retry button when errored', () => {
    mockUseGitStatus.mockReturnValue({
      data: null,
      loading: false,
      error: 'Git not initialized',
      refetch: mockRefetch,
    });

    render(<GitPanel />);

    expect(screen.getByText(/git not initialized/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('clicking Retry calls refetch', async () => {
    const user = userEvent.setup();

    mockUseGitStatus.mockReturnValue({
      data: null,
      loading: false,
      error: 'Connection failed',
      refetch: mockRefetch,
    });

    render(<GitPanel />);

    await user.click(screen.getByRole('button', { name: /retry/i }));

    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it('clicking History tab switches activeView', async () => {
    const user = userEvent.setup();

    mockUseGitStatus.mockReturnValue({
      data: { branch: 'main', hasCommits: true, files: [] },
      loading: false,
      error: null,
      refetch: mockRefetch,
    });

    render(<GitPanel />);

    // Initially shows Changes content (ChangesView with empty files shows "No changes")
    expect(screen.getByText(/no changes/i)).toBeInTheDocument();

    // Click History tab
    await user.click(screen.getByRole('button', { name: /history/i }));

    // HistoryView renders with empty commits (shows "No commits yet")
    expect(screen.getByText(/no commits yet/i)).toBeInTheDocument();
  });

  it('Changes tab has active styling by default', () => {
    mockUseGitStatus.mockReturnValue({
      data: { branch: 'main', hasCommits: true, files: [] },
      loading: false,
      error: null,
      refetch: mockRefetch,
    });

    render(<GitPanel />);

    const changesBtn = screen.getByRole('button', { name: /changes/i });
    expect(changesBtn.getAttribute('data-active')).toBe('true');
  });
});
