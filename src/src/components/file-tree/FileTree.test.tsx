/**
 * FileTree container tests.
 *
 * Tests loading, error, and success states. Validates dotfile hiding,
 * search filtering, and retry behavior.
 *
 * Mocks useFileTree hook and useProjectContext for isolation.
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileTree } from './FileTree';
import type { FileTreeNode } from '@/types/file';

// Mock useProjectContext
vi.mock('@/hooks/useProjectContext', () => ({
  useProjectContext: vi.fn(() => ({ projectName: 'test-project', isLoading: false })),
}));

// Mock useFileTree
const mockRetry = vi.fn();
vi.mock('@/hooks/useFileTree', () => ({
  useFileTree: vi.fn(() => ({
    tree: [],
    fetchState: 'idle' as const,
    retry: mockRetry,
    projectRoot: null,
  })),
}));

// Import after mocking
import { useFileTree } from '@/hooks/useFileTree';
const mockedUseFileTree = useFileTree as Mock;

const makeFile = (name: string, path: string): FileTreeNode => ({
  name,
  path,
  type: 'file',
  size: 100,
  modified: null,
});

const makeDir = (
  name: string,
  path: string,
  children: FileTreeNode[] = [],
): FileTreeNode => ({
  name,
  path,
  type: 'directory',
  size: 0,
  modified: null,
  children,
});

describe('FileTree', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading skeleton when fetchState is loading', () => {
    mockedUseFileTree.mockReturnValue({
      tree: [],
      fetchState: 'loading',
      retry: mockRetry,
      projectRoot: null,
    });
    render(<FileTree />);
    expect(screen.getByTestId('file-tree-skeleton')).toBeInTheDocument();
  });

  it('shows error message and retry button when fetchState is error', () => {
    mockedUseFileTree.mockReturnValue({
      tree: [],
      fetchState: 'error',
      retry: mockRetry,
      projectRoot: null,
    });
    render(<FileTree />);
    expect(screen.getByText('Failed to load file tree')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('calls retry when retry button is clicked', async () => {
    const user = userEvent.setup();
    mockedUseFileTree.mockReturnValue({
      tree: [],
      fetchState: 'error',
      retry: mockRetry,
      projectRoot: null,
    });
    render(<FileTree />);
    await user.click(screen.getByRole('button', { name: /retry/i }));
    expect(mockRetry).toHaveBeenCalledOnce();
  });

  it('renders tree nodes on success', () => {
    mockedUseFileTree.mockReturnValue({
      tree: [
        makeFile('README.md', '/project/README.md'),
        makeDir('src', '/project/src'),
      ],
      fetchState: 'success',
      retry: mockRetry,
      projectRoot: '/project',
    });
    render(<FileTree />);
    expect(screen.getByText('README.md')).toBeInTheDocument();
    expect(screen.getByText('src')).toBeInTheDocument();
  });

  it('hides dotfiles by default', () => {
    mockedUseFileTree.mockReturnValue({
      tree: [
        makeFile('.env', '/project/.env'),
        makeFile('README.md', '/project/README.md'),
        makeDir('.git', '/project/.git'),
      ],
      fetchState: 'success',
      retry: mockRetry,
      projectRoot: '/project',
    });
    render(<FileTree />);
    expect(screen.queryByText('.env')).not.toBeInTheDocument();
    expect(screen.queryByText('.git')).not.toBeInTheDocument();
    expect(screen.getByText('README.md')).toBeInTheDocument();
  });

  it('filters nodes by search input', async () => {
    const user = userEvent.setup();
    mockedUseFileTree.mockReturnValue({
      tree: [
        makeFile('README.md', '/project/README.md'),
        makeFile('index.ts', '/project/index.ts'),
        makeFile('app.tsx', '/project/app.tsx'),
      ],
      fetchState: 'success',
      retry: mockRetry,
      projectRoot: '/project',
    });
    render(<FileTree />);
    const searchInput = screen.getByPlaceholderText('Filter files...');
    await user.type(searchInput, 'index');
    expect(screen.getByText('index.ts')).toBeInTheDocument();
    expect(screen.queryByText('README.md')).not.toBeInTheDocument();
    expect(screen.queryByText('app.tsx')).not.toBeInTheDocument();
  });

  it('shows empty filter message when no nodes match search', async () => {
    const user = userEvent.setup();
    mockedUseFileTree.mockReturnValue({
      tree: [
        makeFile('README.md', '/project/README.md'),
      ],
      fetchState: 'success',
      retry: mockRetry,
      projectRoot: '/project',
    });
    render(<FileTree />);
    const searchInput = screen.getByPlaceholderText('Filter files...');
    await user.type(searchInput, 'zzzzz');
    expect(screen.getByText('No files match filter')).toBeInTheDocument();
  });
});
