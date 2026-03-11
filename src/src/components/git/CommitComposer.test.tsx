import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';

// Mock useGitOperations
const mockCommit = vi.fn();
const mockGenerateCommitMessage = vi.fn();
vi.mock('@/hooks/useGitOperations', () => ({
  useGitOperations: () => ({
    commit: mockCommit,
    discard: vi.fn(),
    deleteUntracked: vi.fn(),
    generateCommitMessage: mockGenerateCommitMessage,
    push: vi.fn(),
    pull: vi.fn(),
    fetch: vi.fn(),
    checkout: vi.fn(),
    createBranch: vi.fn(),
  }),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { CommitComposer } from '@/components/git/CommitComposer';

describe('CommitComposer', () => {
  const mockOnCommitSuccess = vi.fn();
  const emptyStaged = new Set<string>();
  const withStaged = new Set(['src/app.tsx', 'src/utils.ts']);

  beforeEach(() => {
    vi.clearAllMocks();
    mockCommit.mockResolvedValue(undefined);
    mockGenerateCommitMessage.mockResolvedValue('feat: auto-generated message');
  });

  it('commit button disabled when no staged files', () => {
    render(
      <CommitComposer
        stagedFiles={emptyStaged}
        onCommitSuccess={mockOnCommitSuccess}
        projectName="test-project"
      />,
    );

    const commitBtn = screen.getByRole('button', { name: /^commit \(/i });
    expect(commitBtn).toBeDisabled();
  });

  it('commit button disabled when message empty', () => {
    render(
      <CommitComposer
        stagedFiles={withStaged}
        onCommitSuccess={mockOnCommitSuccess}
        projectName="test-project"
      />,
    );

    const commitBtn = screen.getByRole('button', { name: /^commit \(/i });
    expect(commitBtn).toBeDisabled();
  });

  it('commit button enabled when both message and staged files present', async () => {
    const user = userEvent.setup();
    render(
      <CommitComposer
        stagedFiles={withStaged}
        onCommitSuccess={mockOnCommitSuccess}
        projectName="test-project"
      />,
    );

    const textarea = screen.getByPlaceholderText('Commit message...');
    await user.type(textarea, 'fix: some bug');

    const commitBtn = screen.getByRole('button', { name: /^commit \(/i });
    expect(commitBtn).not.toBeDisabled();
  });

  it('successful commit calls toast.success and clears message', async () => {
    const user = userEvent.setup();
    render(
      <CommitComposer
        stagedFiles={withStaged}
        onCommitSuccess={mockOnCommitSuccess}
        projectName="test-project"
      />,
    );

    const textarea = screen.getByPlaceholderText('Commit message...');
    await user.type(textarea, 'fix: some bug');
    await user.click(screen.getByRole('button', { name: /^commit \(/i }));

    expect(mockCommit).toHaveBeenCalledWith('fix: some bug', ['src/app.tsx', 'src/utils.ts']);
    expect(toast.success).toHaveBeenCalledWith('Changes committed');
    expect(mockOnCommitSuccess).toHaveBeenCalled();
    // Message should be cleared
    expect(textarea).toHaveValue('');
  });

  it('failed commit calls toast.error', async () => {
    mockCommit.mockRejectedValue(new Error('Branch is protected'));
    const user = userEvent.setup();
    render(
      <CommitComposer
        stagedFiles={withStaged}
        onCommitSuccess={mockOnCommitSuccess}
        projectName="test-project"
      />,
    );

    const textarea = screen.getByPlaceholderText('Commit message...');
    await user.type(textarea, 'fix: something');
    await user.click(screen.getByRole('button', { name: /^commit \(/i }));

    expect(toast.error).toHaveBeenCalledWith('Branch is protected');
    expect(mockOnCommitSuccess).not.toHaveBeenCalled();
  });

  it('generate message fills textarea with returned message', async () => {
    const user = userEvent.setup();
    render(
      <CommitComposer
        stagedFiles={withStaged}
        onCommitSuccess={mockOnCommitSuccess}
        projectName="test-project"
      />,
    );

    await user.click(screen.getByRole('button', { name: /generate/i }));

    const textarea = screen.getByPlaceholderText('Commit message...');
    expect(textarea).toHaveValue('feat: auto-generated message');
  });

  it('generate button disabled when no staged files', () => {
    render(
      <CommitComposer
        stagedFiles={emptyStaged}
        onCommitSuccess={mockOnCommitSuccess}
        projectName="test-project"
      />,
    );

    const generateBtn = screen.getByRole('button', { name: /generate/i });
    expect(generateBtn).toBeDisabled();
  });
});
