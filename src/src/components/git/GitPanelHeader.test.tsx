/**
 * GitPanelHeader tests -- branch selector, push/pull/fetch buttons, remote status.
 */

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toast } from 'sonner';

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock hooks
const mockBranchesRefetch = vi.fn();
const mockUseGitBranches = vi.fn();
vi.mock('@/hooks/useGitBranches', () => ({
  useGitBranches: (...args: unknown[]) => mockUseGitBranches(...args),
}));

const mockRemoteRefetch = vi.fn();
const mockUseGitRemoteStatus = vi.fn();
vi.mock('@/hooks/useGitRemoteStatus', () => ({
  useGitRemoteStatus: (...args: unknown[]) => mockUseGitRemoteStatus(...args),
}));

const mockOperations = {
  push: vi.fn(),
  pull: vi.fn(),
  fetch: vi.fn(),
  checkout: vi.fn(),
  createBranch: vi.fn(),
  commit: vi.fn(),
  discard: vi.fn(),
  deleteUntracked: vi.fn(),
  generateCommitMessage: vi.fn(),
};
vi.mock('@/hooks/useGitOperations', () => ({
  useGitOperations: () => mockOperations,
}));

import { GitPanelHeader } from '@/components/git/GitPanelHeader';

const defaultBranches = [
  { name: 'main', current: true },
  { name: 'feature/login', current: false },
  { name: 'fix/typo', current: false },
];

describe('GitPanelHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseGitBranches.mockReturnValue({
      branches: defaultBranches,
      loading: false,
      error: null,
      refetch: mockBranchesRefetch,
    });

    mockUseGitRemoteStatus.mockReturnValue({
      remoteStatus: {
        hasRemote: true,
        hasUpstream: true,
        branch: 'main',
        remoteBranch: 'origin/main',
        ahead: 2,
        behind: 1,
        isUpToDate: false,
      },
      loading: false,
      error: null,
      refetch: mockRemoteRefetch,
    });

    mockOperations.push.mockResolvedValue(undefined);
    mockOperations.pull.mockResolvedValue(undefined);
    mockOperations.fetch.mockResolvedValue(undefined);
    mockOperations.checkout.mockResolvedValue(undefined);
    mockOperations.createBranch.mockResolvedValue(undefined);
  });

  it('shows current branch name', () => {
    render(
      <GitPanelHeader branch="main" projectName="test-project" onRefresh={vi.fn()} />,
    );

    expect(screen.getByText('main')).toBeInTheDocument();
  });

  it('renders push/pull/fetch buttons when hasRemote is true', () => {
    render(
      <GitPanelHeader branch="main" projectName="test-project" onRefresh={vi.fn()} />,
    );

    expect(screen.getByTitle('Push')).toBeInTheDocument();
    expect(screen.getByTitle('Pull')).toBeInTheDocument();
    expect(screen.getByTitle('Fetch')).toBeInTheDocument();
  });

  it('hides push/pull/fetch buttons when hasRemote is false', () => {
    mockUseGitRemoteStatus.mockReturnValue({
      remoteStatus: {
        hasRemote: false,
        hasUpstream: false,
        branch: 'main',
      },
      loading: false,
      error: null,
      refetch: mockRemoteRefetch,
    });

    render(
      <GitPanelHeader branch="main" projectName="test-project" onRefresh={vi.fn()} />,
    );

    expect(screen.queryByTitle('Push')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Pull')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Fetch')).not.toBeInTheDocument();
  });

  it('displays ahead/behind counts when remote exists', () => {
    render(
      <GitPanelHeader branch="main" projectName="test-project" onRefresh={vi.fn()} />,
    );

    const badge = screen.getByTestId('remote-badge');
    expect(within(badge).getByText(/2/)).toBeInTheDocument();
    expect(within(badge).getByText(/1/)).toBeInTheDocument();
  });

  it('clicking push calls operations.push and shows toast', async () => {
    const user = userEvent.setup();
    const onRefresh = vi.fn();

    render(
      <GitPanelHeader branch="main" projectName="test-project" onRefresh={onRefresh} />,
    );

    await user.click(screen.getByTitle('Push'));

    expect(mockOperations.push).toHaveBeenCalledTimes(1);
    expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('Push'));
    expect(onRefresh).toHaveBeenCalled();
  });

  it('shows branches in dropdown when branch button clicked', async () => {
    const user = userEvent.setup();

    render(
      <GitPanelHeader branch="main" projectName="test-project" onRefresh={vi.fn()} />,
    );

    // Click branch name to open dropdown
    await user.click(screen.getByTestId('branch-trigger'));

    expect(screen.getByText('feature/login')).toBeInTheDocument();
    expect(screen.getByText('fix/typo')).toBeInTheDocument();
  });

  it('switching branch calls checkout and shows toast', async () => {
    const user = userEvent.setup();
    const onRefresh = vi.fn();

    render(
      <GitPanelHeader branch="main" projectName="test-project" onRefresh={onRefresh} />,
    );

    await user.click(screen.getByTestId('branch-trigger'));
    await user.click(screen.getByText('feature/login'));

    expect(mockOperations.checkout).toHaveBeenCalledWith('feature/login');
    expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('feature/login'));
    expect(onRefresh).toHaveBeenCalled();
  });

  it('new branch creation via inline input', async () => {
    const user = userEvent.setup();
    const onRefresh = vi.fn();

    render(
      <GitPanelHeader branch="main" projectName="test-project" onRefresh={onRefresh} />,
    );

    // Open dropdown
    await user.click(screen.getByTestId('branch-trigger'));
    // Click "New Branch" button
    await user.click(screen.getByText(/new branch/i));
    // Type branch name
    const input = screen.getByPlaceholderText(/branch name/i);
    await user.type(input, 'my-new-branch{Enter}');

    expect(mockOperations.createBranch).toHaveBeenCalledWith('my-new-branch');
    expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('my-new-branch'));
    expect(onRefresh).toHaveBeenCalled();
  });

  it('shows error toast when push fails', async () => {
    const user = userEvent.setup();
    mockOperations.push.mockRejectedValue(new Error('Auth failed'));

    render(
      <GitPanelHeader branch="main" projectName="test-project" onRefresh={vi.fn()} />,
    );

    await user.click(screen.getByTitle('Push'));

    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Push failed'));
  });
});
