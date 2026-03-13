/**
 * FileTree container tests.
 *
 * Tests loading, error, and success states. Validates dotfile hiding,
 * search filtering, and retry behavior.
 *
 * FileTree receives data as props from FileTreePanel (no hook mocking needed).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileTree } from './FileTree';
import type { FileTreeNode } from '@/types/file';
import type { FileTreeProps } from './FileTree';
import type { GitFileStatus } from '@/types/git';

const mockRetry = vi.fn();

const defaultProps: FileTreeProps = {
  tree: [],
  fetchState: 'idle',
  retry: mockRetry,
  projectRoot: null,
  projectName: 'test-project',
};

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
    render(<FileTree {...defaultProps} fetchState="loading" />);
    expect(screen.getByTestId('file-tree-skeleton')).toBeInTheDocument();
  });

  it('shows error message and retry button when fetchState is error', () => {
    render(<FileTree {...defaultProps} fetchState="error" />);
    expect(screen.getByText('Failed to load file tree')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('calls retry when retry button is clicked', async () => {
    const user = userEvent.setup();
    render(<FileTree {...defaultProps} fetchState="error" />);
    await user.click(screen.getByRole('button', { name: /retry/i }));
    expect(mockRetry).toHaveBeenCalledOnce();
  });

  it('renders tree nodes on success', () => {
    render(
      <FileTree
        {...defaultProps}
        fetchState="success"
        tree={[
          makeFile('README.md', '/project/README.md'),
          makeDir('src', '/project/src'),
        ]}
        projectRoot="/project"
      />,
    );
    expect(screen.getByText('README.md')).toBeInTheDocument();
    expect(screen.getByText('src')).toBeInTheDocument();
  });

  it('hides dotfiles by default', () => {
    render(
      <FileTree
        {...defaultProps}
        fetchState="success"
        tree={[
          makeFile('.env', '/project/.env'),
          makeFile('README.md', '/project/README.md'),
          makeDir('.git', '/project/.git'),
        ]}
        projectRoot="/project"
      />,
    );
    expect(screen.queryByText('.env')).not.toBeInTheDocument();
    expect(screen.queryByText('.git')).not.toBeInTheDocument();
    expect(screen.getByText('README.md')).toBeInTheDocument();
  });

  it('filters nodes by search input', async () => {
    const user = userEvent.setup();
    render(
      <FileTree
        {...defaultProps}
        fetchState="success"
        tree={[
          makeFile('README.md', '/project/README.md'),
          makeFile('index.ts', '/project/index.ts'),
          makeFile('app.tsx', '/project/app.tsx'),
        ]}
        projectRoot="/project"
      />,
    );
    const searchInput = screen.getByPlaceholderText('Filter files...');
    await user.type(searchInput, 'index');
    expect(screen.getByText('index.ts')).toBeInTheDocument();
    expect(screen.queryByText('README.md')).not.toBeInTheDocument();
    expect(screen.queryByText('app.tsx')).not.toBeInTheDocument();
  });

  it('passes gitStatusMap to FileNode children (status dot renders)', () => {
    const gitStatusMap: Map<string, GitFileStatus> = new Map([
      ['/project/README.md', 'modified'],
    ]);
    render(
      <FileTree
        {...defaultProps}
        fetchState="success"
        tree={[makeFile('README.md', '/project/README.md')]}
        projectRoot="/project"
        gitStatusMap={gitStatusMap}
      />,
    );
    const dot = screen.getByTestId('file-node-status');
    expect(dot).toHaveAttribute('data-status', 'modified');
  });

  it('shows empty filter message when no nodes match search', async () => {
    const user = userEvent.setup();
    render(
      <FileTree
        {...defaultProps}
        fetchState="success"
        tree={[makeFile('README.md', '/project/README.md')]}
        projectRoot="/project"
      />,
    );
    const searchInput = screen.getByPlaceholderText('Filter files...');
    await user.type(searchInput, 'zzzzz');
    expect(screen.getByText('No files match filter')).toBeInTheDocument();
  });
});
