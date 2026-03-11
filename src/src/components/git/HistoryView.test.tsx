/**
 * HistoryView tests -- commit list rendering, expand/collapse, loading/empty states.
 */

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock useGitCommits
const mockRefetch = vi.fn();
const mockUseGitCommits = vi.fn();
vi.mock('@/hooks/useGitCommits', () => ({
  useGitCommits: (...args: unknown[]) => mockUseGitCommits(...args),
}));

// Mock apiFetch for commit-diff fetching
const mockApiFetch = vi.fn();
vi.mock('@/lib/api-client', () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
}));

import { HistoryView } from '@/components/git/HistoryView';

const mockCommits = [
  {
    hash: 'abc1234567890',
    author: 'Test Author',
    email: 'test@example.com',
    date: '2026-03-11T00:00:00Z',
    message: 'feat: add authentication module with JWT tokens',
    stats: ' 3 files changed, 42 insertions(+), 5 deletions(-)',
  },
  {
    hash: 'def4567890123',
    author: 'Other Dev',
    email: 'other@example.com',
    date: '2026-03-10T23:00:00Z',
    message: 'fix: resolve null pointer in user service',
    stats: ' 1 file changed, 3 insertions(+), 1 deletion(-)',
  },
];

describe('HistoryView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApiFetch.mockResolvedValue('diff --git a/file.ts\n+added line');
  });

  it('renders commit rows with hash, message, author, date', () => {
    mockUseGitCommits.mockReturnValue({
      commits: mockCommits,
      loading: false,
      error: null,
      refetch: mockRefetch,
    });

    render(<HistoryView projectName="test-project" />);

    // Short hash (7 chars)
    expect(screen.getByText('abc1234')).toBeInTheDocument();
    expect(screen.getByText('def4567')).toBeInTheDocument();

    // Messages
    expect(screen.getByText(/add authentication module/)).toBeInTheDocument();
    expect(screen.getByText(/resolve null pointer/)).toBeInTheDocument();

    // Authors
    expect(screen.getByText('Test Author')).toBeInTheDocument();
    expect(screen.getByText('Other Dev')).toBeInTheDocument();
  });

  it('clicking row expands to show stats', async () => {
    const user = userEvent.setup();
    mockUseGitCommits.mockReturnValue({
      commits: mockCommits,
      loading: false,
      error: null,
      refetch: mockRefetch,
    });

    render(<HistoryView projectName="test-project" />);

    // Click first commit row
    const firstRow = screen.getByText('abc1234').closest('[data-testid="commit-row"]');
    expect(firstRow).toBeTruthy();
    // ASSERT: firstRow is non-null (checked above)
    await user.click(firstRow!);

    // Stats should be visible
    expect(screen.getByText(/3 files changed/)).toBeInTheDocument();
  });

  it('clicking expanded row collapses it', async () => {
    const user = userEvent.setup();
    mockUseGitCommits.mockReturnValue({
      commits: mockCommits,
      loading: false,
      error: null,
      refetch: mockRefetch,
    });

    render(<HistoryView projectName="test-project" />);

    const firstRow = screen.getByText('abc1234').closest('[data-testid="commit-row"]');
    // ASSERT: firstRow is non-null
    await user.click(firstRow!);
    expect(screen.getByText(/3 files changed/)).toBeInTheDocument();

    // Click again to collapse
    await user.click(firstRow!);
    expect(screen.queryByText(/3 files changed/)).not.toBeInTheDocument();
  });

  it('loading state shows skeleton', () => {
    mockUseGitCommits.mockReturnValue({
      commits: null,
      loading: true,
      error: null,
      refetch: mockRefetch,
    });

    render(<HistoryView projectName="test-project" />);

    expect(screen.getByTestId('history-skeleton')).toBeInTheDocument();
  });

  it('empty state shows "No commits yet"', () => {
    mockUseGitCommits.mockReturnValue({
      commits: [],
      loading: false,
      error: null,
      refetch: mockRefetch,
    });

    render(<HistoryView projectName="test-project" />);

    expect(screen.getByText(/no commits yet/i)).toBeInTheDocument();
  });
});
