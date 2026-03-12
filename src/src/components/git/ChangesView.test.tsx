import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { GitFileChange } from '@/types/git';

// Mock useProjectContext
vi.mock('@/hooks/useProjectContext', () => ({
  useProjectContext: () => ({ projectName: 'test-project', projectPath: '/test', isLoading: false }),
}));

// Mock useGitOperations
const mockDiscard = vi.fn().mockResolvedValue(undefined);
const mockDeleteUntracked = vi.fn().mockResolvedValue(undefined);
const mockCommit = vi.fn().mockResolvedValue(undefined);
const mockGenerateCommitMessage = vi.fn().mockResolvedValue('generated message');
vi.mock('@/hooks/useGitOperations', () => ({
  useGitOperations: () => ({
    commit: mockCommit,
    discard: mockDiscard,
    deleteUntracked: mockDeleteUntracked,
    generateCommitMessage: mockGenerateCommitMessage,
    push: vi.fn(),
    pull: vi.fn(),
    fetch: vi.fn(),
    checkout: vi.fn(),
    createBranch: vi.fn(),
  }),
}));

// Mock useOpenDiff
const mockOpenDiff = vi.fn();
vi.mock('@/hooks/useOpenDiff', () => ({
  useOpenDiff: () => mockOpenDiff,
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { ChangesView } from '@/components/git/ChangesView';

const mockFiles: GitFileChange[] = [
  { path: 'src/app.tsx', status: 'modified' },
  { path: 'src/utils/helper.ts', status: 'modified' },
  { path: 'src/new-file.ts', status: 'added' },
  { path: 'src/old-file.ts', status: 'deleted' },
  { path: 'README.md', status: 'untracked' },
];

describe('ChangesView', () => {
  const mockRefetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders file rows grouped by status', () => {
    render(<ChangesView files={mockFiles} refetchStatus={mockRefetch} />);

    // Section headers
    expect(screen.getByText('Modified')).toBeInTheDocument();
    expect(screen.getByText('Added')).toBeInTheDocument();
    expect(screen.getByText('Deleted')).toBeInTheDocument();
    expect(screen.getByText('Untracked')).toBeInTheDocument();

    // File names (basenames)
    expect(screen.getByText('app.tsx')).toBeInTheDocument();
    expect(screen.getByText('helper.ts')).toBeInTheDocument();
    expect(screen.getByText('new-file.ts')).toBeInTheDocument();
    expect(screen.getByText('old-file.ts')).toBeInTheDocument();
    expect(screen.getByText('README.md')).toBeInTheDocument();
  });

  it('hides section headers for empty groups', () => {
    const files: GitFileChange[] = [{ path: 'src/app.tsx', status: 'modified' }];
    render(<ChangesView files={files} refetchStatus={mockRefetch} />);

    expect(screen.getByText('Modified')).toBeInTheDocument();
    expect(screen.queryByText('Added')).not.toBeInTheDocument();
    expect(screen.queryByText('Deleted')).not.toBeInTheDocument();
    expect(screen.queryByText('Untracked')).not.toBeInTheDocument();
  });

  it('checking checkbox adds file to staged set', async () => {
    const user = userEvent.setup();
    render(<ChangesView files={mockFiles} refetchStatus={mockRefetch} />);

    const checkboxes = screen.getAllByRole('checkbox');
    const firstCheckbox = checkboxes[0]! // ASSERT: mockFiles guarantees >= 1 file;
    // All unchecked initially
    expect(firstCheckbox).not.toBeChecked();

    await user.click(firstCheckbox);
    expect(firstCheckbox).toBeChecked();
  });

  it('Select All checks all files', async () => {
    const user = userEvent.setup();
    render(<ChangesView files={mockFiles} refetchStatus={mockRefetch} />);

    await user.click(screen.getByText('Select All'));

    const checkboxes = screen.getAllByRole('checkbox');
    checkboxes.forEach((cb) => expect(cb).toBeChecked());
  });

  it('Deselect All unchecks all files', async () => {
    const user = userEvent.setup();
    render(<ChangesView files={mockFiles} refetchStatus={mockRefetch} />);

    // Select all first
    await user.click(screen.getByText('Select All'));
    // Then deselect all
    await user.click(screen.getByText('Deselect All'));

    const checkboxes = screen.getAllByRole('checkbox');
    checkboxes.forEach((cb) => expect(cb).not.toBeChecked());
  });

  it('clicking file row calls openDiff', async () => {
    const user = userEvent.setup();
    render(<ChangesView files={mockFiles} refetchStatus={mockRefetch} />);

    // Click the file name text (not checkbox)
    await user.click(screen.getByText('app.tsx'));

    expect(mockOpenDiff).toHaveBeenCalledWith('src/app.tsx');
  });

  it('discard button shows confirmation dialog', async () => {
    const user = userEvent.setup();
    render(<ChangesView files={mockFiles} refetchStatus={mockRefetch} />);

    const discardButtons = screen.getAllByRole('button', { name: /discard/i });
    await user.click(discardButtons[0]!); // ASSERT: mockFiles guarantees >= 1 discard button

    // Confirmation dialog should appear
    expect(screen.getByText(/cannot be undone/i)).toBeInTheDocument();
  });

  it('confirming discard calls discard for tracked files', async () => {
    const user = userEvent.setup();
    render(<ChangesView files={mockFiles} refetchStatus={mockRefetch} />);

    const discardButtons = screen.getAllByRole('button', { name: /discard/i });
    await user.click(discardButtons[0]!); // ASSERT: first file is modified (tracked)

    // Click confirm
    const confirmBtn = screen.getByRole('button', { name: /confirm/i });
    await user.click(confirmBtn);

    expect(mockDiscard).toHaveBeenCalledWith('src/app.tsx');
  });

  it('confirming discard calls deleteUntracked for untracked files', async () => {
    const user = userEvent.setup();
    const files: GitFileChange[] = [{ path: 'README.md', status: 'untracked' }];
    render(<ChangesView files={files} refetchStatus={mockRefetch} />);

    const discardButton = screen.getByRole('button', { name: /discard/i });
    await user.click(discardButton);

    const confirmBtn = screen.getByRole('button', { name: /confirm/i });
    await user.click(confirmBtn);

    expect(mockDeleteUntracked).toHaveBeenCalledWith('README.md');
  });

  it('renders empty state when no files', () => {
    render(<ChangesView files={[]} refetchStatus={mockRefetch} />);

    expect(screen.getByText(/no changes/i)).toBeInTheDocument();
  });
});
