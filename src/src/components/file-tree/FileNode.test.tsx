/**
 * FileNode + FileTreeSearch tests.
 *
 * Tests recursive tree node rendering, indentation, expand/collapse,
 * active file highlighting, and search input behavior.
 *
 * Uses actual file store (reset between tests) for realistic integration.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useFileStore } from '@/stores/file';
import { FileNode } from './FileNode';
import { FileTreeSearch } from './FileTreeSearch';
import type { FileTreeNode } from '@/types/file';

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

describe('FileNode', () => {
  beforeEach(() => {
    useFileStore.getState().reset();
  });

  it('renders file name', () => {
    const node = makeFile('README.md', '/project/README.md');
    render(<FileNode node={node} depth={0} />);
    expect(screen.getByText('README.md')).toBeInTheDocument();
  });

  it('renders directory name with chevron', () => {
    const node = makeDir('src', '/project/src');
    render(<FileNode node={node} depth={0} />);
    expect(screen.getByText('src')).toBeInTheDocument();
    // Directory should have a chevron indicator
    expect(screen.getByTestId('file-node-chevron')).toBeInTheDocument();
  });

  it('does not render chevron for file nodes', () => {
    const node = makeFile('index.ts', '/project/index.ts');
    render(<FileNode node={node} depth={0} />);
    expect(screen.queryByTestId('file-node-chevron')).not.toBeInTheDocument();
  });

  it('calls openFile when clicking a file', async () => {
    const user = userEvent.setup();
    const node = makeFile('app.tsx', '/project/app.tsx');
    render(<FileNode node={node} depth={0} />);
    await user.click(screen.getByText('app.tsx'));
    expect(useFileStore.getState().activeFilePath).toBe('/project/app.tsx');
  });

  it('calls toggleDir when clicking a directory', async () => {
    const user = userEvent.setup();
    const node = makeDir('src', '/project/src');
    render(<FileNode node={node} depth={0} />);
    await user.click(screen.getByText('src'));
    expect(useFileStore.getState().expandedDirs.has('/project/src')).toBe(true);
  });

  it('applies active CSS class when file is active', () => {
    const node = makeFile('main.ts', '/project/main.ts');
    useFileStore.getState().openFile('/project/main.ts');
    render(<FileNode node={node} depth={0} />);
    const row = screen.getByText('main.ts').closest('[data-testid="file-node-row"]');
    expect(row).toHaveClass('file-node-active');
  });

  it('renders children when directory is expanded', () => {
    const child = makeFile('index.ts', '/project/src/index.ts');
    const node = makeDir('src', '/project/src', [child]);
    // Expand the directory
    useFileStore.setState({ expandedDirs: new Set(['/project/src']) });
    render(<FileNode node={node} depth={0} />);
    expect(screen.getByText('index.ts')).toBeInTheDocument();
  });

  it('does not render children when directory is collapsed', () => {
    const child = makeFile('index.ts', '/project/src/index.ts');
    const node = makeDir('src', '/project/src', [child]);
    render(<FileNode node={node} depth={0} />);
    expect(screen.queryByText('index.ts')).not.toBeInTheDocument();
  });

  it('applies indentation via CSS custom property', () => {
    const node = makeFile('deep.ts', '/project/a/b/deep.ts');
    render(<FileNode node={node} depth={2} />);
    const row = screen.getByText('deep.ts').closest('[data-testid="file-node-row"]');
    expect(row).toHaveStyle({ '--depth': '2' });
  });

  describe('git status indicators', () => {
    it('renders status dot when file is in gitStatusMap', () => {
      const node = makeFile('index.ts', 'src/index.ts');
      const gitStatusMap = new Map([['src/index.ts', 'modified' as const]]);
      render(<FileNode node={node} depth={0} gitStatusMap={gitStatusMap} />);
      const dot = screen.getByTestId('file-node-status');
      expect(dot).toBeInTheDocument();
      expect(dot).toHaveAttribute('data-status', 'modified');
    });

    it('does not render status dot when file is not in gitStatusMap', () => {
      const node = makeFile('clean.ts', 'src/clean.ts');
      const gitStatusMap = new Map([['src/other.ts', 'modified' as const]]);
      render(<FileNode node={node} depth={0} gitStatusMap={gitStatusMap} />);
      expect(screen.queryByTestId('file-node-status')).not.toBeInTheDocument();
    });

    it('does not render status dot when gitStatusMap is undefined', () => {
      const node = makeFile('app.ts', 'src/app.ts');
      render(<FileNode node={node} depth={0} />);
      expect(screen.queryByTestId('file-node-status')).not.toBeInTheDocument();
    });

    it('renders status dot for directory with aggregate status', () => {
      const child = makeFile('index.ts', 'src/lib/index.ts');
      const node = makeDir('lib', 'src/lib', [child]);
      const gitStatusMap = new Map([
        ['src/lib/index.ts', 'added' as const],
        ['src/lib', 'added' as const],
      ]);
      render(<FileNode node={node} depth={0} gitStatusMap={gitStatusMap} />);
      const dot = screen.getByTestId('file-node-status');
      expect(dot).toHaveAttribute('data-status', 'added');
    });

    it('renders correct data-status for each git status type', () => {
      const statuses = ['modified', 'added', 'deleted', 'untracked'] as const;
      for (const status of statuses) {
        const node = makeFile(`${status}.ts`, `src/${status}.ts`);
        const gitStatusMap = new Map([[`src/${status}.ts`, status]]);
        const { unmount } = render(<FileNode node={node} depth={0} gitStatusMap={gitStatusMap} />);
        const dot = screen.getByTestId('file-node-status');
        expect(dot).toHaveAttribute('data-status', status);
        unmount();
      }
    });
  });
});

describe('FileTreeSearch', () => {
  it('renders search input with placeholder', () => {
    render(<FileTreeSearch value="" onChange={() => {}} />);
    expect(screen.getByPlaceholderText('Filter files...')).toBeInTheDocument();
  });

  it('calls onChange on each keystroke', async () => {
    const user = userEvent.setup();
    let value = '';
    const onChange = (v: string) => { value = v; };
    render(<FileTreeSearch value="" onChange={onChange} />);
    const input = screen.getByPlaceholderText('Filter files...');
    await user.type(input, 'abc');
    expect(value).toBe('c'); // last keystroke value
  });

  it('has correct test id', () => {
    render(<FileTreeSearch value="" onChange={() => {}} />);
    expect(screen.getByTestId('file-tree-search')).toBeInTheDocument();
  });
});
