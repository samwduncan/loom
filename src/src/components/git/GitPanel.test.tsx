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

    // Initially shows Changes content
    expect(screen.getByText(/changes view/i)).toBeInTheDocument();

    // Click History tab
    await user.click(screen.getByRole('button', { name: /history/i }));

    expect(screen.getByText(/history view/i)).toBeInTheDocument();
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
