/**
 * FileTreeContextMenu tests -- context menus for file and directory nodes.
 *
 * Tests clipboard operations, menu item rendering, and store integration.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileContextMenu, DirContextMenu } from './FileTreeContextMenu';
import { useFileStore } from '@/stores/file';
import type { FileTreeNode } from '@/types/file';

// Mock toast
vi.mock('sonner', () => ({
  toast: { success: vi.fn() },
}));

// Reset stores between tests
beforeEach(() => {
  vi.clearAllMocks();
  useFileStore.getState().reset();
});

/**
 * Helper: set up user-event then spy on clipboard.writeText AFTER setup
 * (user-event replaces navigator.clipboard during setup).
 */
function setupWithClipboardSpy() {
  const user = userEvent.setup();
  const spy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
  return { user, clipboardSpy: spy };
}

describe('FileContextMenu', () => {
  it('renders children', () => {
    render(
      <FileContextMenu filePath="/home/project/src/main.ts" projectRoot="/home/project">
        <span>File content</span>
      </FileContextMenu>,
    );
    expect(screen.getByText('File content')).toBeInTheDocument();
  });

  it('shows menu items on context menu trigger', async () => {
    const { user } = setupWithClipboardSpy();

    render(
      <FileContextMenu filePath="/home/project/src/main.ts" projectRoot="/home/project">
        <span>Right-click me</span>
      </FileContextMenu>,
    );

    await user.pointer({ keys: '[MouseRight]', target: screen.getByText('Right-click me') });

    expect(screen.getByText('Copy Path')).toBeInTheDocument();
    expect(screen.getByText('Copy Relative Path')).toBeInTheDocument();
    expect(screen.getByText('Open in Editor')).toBeInTheDocument();
    expect(screen.getByText('Open in Terminal')).toBeInTheDocument();
  });

  it('Copy Path copies absolute path to clipboard', async () => {
    const { user, clipboardSpy } = setupWithClipboardSpy();

    render(
      <FileContextMenu filePath="/home/project/src/main.ts" projectRoot="/home/project">
        <span>Right-click me</span>
      </FileContextMenu>,
    );

    await user.pointer({ keys: '[MouseRight]', target: screen.getByText('Right-click me') });
    await user.click(screen.getByText('Copy Path'));

    expect(clipboardSpy).toHaveBeenCalledWith('/home/project/src/main.ts');
  });

  it('Copy Relative Path strips project root prefix', async () => {
    const { user, clipboardSpy } = setupWithClipboardSpy();

    render(
      <FileContextMenu filePath="/home/project/src/main.ts" projectRoot="/home/project">
        <span>Right-click me</span>
      </FileContextMenu>,
    );

    await user.pointer({ keys: '[MouseRight]', target: screen.getByText('Right-click me') });
    await user.click(screen.getByText('Copy Relative Path'));

    expect(clipboardSpy).toHaveBeenCalledWith('src/main.ts');
  });

  it('Copy Relative Path falls back to full path when projectRoot is null', async () => {
    const { user, clipboardSpy } = setupWithClipboardSpy();

    render(
      <FileContextMenu filePath="/home/project/src/main.ts" projectRoot={null}>
        <span>Right-click me</span>
      </FileContextMenu>,
    );

    await user.pointer({ keys: '[MouseRight]', target: screen.getByText('Right-click me') });
    await user.click(screen.getByText('Copy Relative Path'));

    expect(clipboardSpy).toHaveBeenCalledWith('/home/project/src/main.ts');
  });
});

describe('DirContextMenu', () => {
  const dirNode: FileTreeNode = {
    name: 'src',
    path: '/home/project/src',
    type: 'directory',
    size: 0,
    modified: null,
    children: [
      {
        name: 'utils',
        path: '/home/project/src/utils',
        type: 'directory',
        size: 0,
        modified: null,
        children: [
          { name: 'cn.ts', path: '/home/project/src/utils/cn.ts', type: 'file', size: 100, modified: null },
        ],
      },
      { name: 'main.ts', path: '/home/project/src/main.ts', type: 'file', size: 200, modified: null },
    ],
  };

  it('renders children', () => {
    render(
      <DirContextMenu dirPath={dirNode.path} node={dirNode} projectRoot="/home/project">
        <span>Dir content</span>
      </DirContextMenu>,
    );
    expect(screen.getByText('Dir content')).toBeInTheDocument();
  });

  it('shows directory-specific menu items', async () => {
    const { user } = setupWithClipboardSpy();

    render(
      <DirContextMenu dirPath={dirNode.path} node={dirNode} projectRoot="/home/project">
        <span>Right-click dir</span>
      </DirContextMenu>,
    );

    await user.pointer({ keys: '[MouseRight]', target: screen.getByText('Right-click dir') });

    expect(screen.getByText('Copy Path')).toBeInTheDocument();
    expect(screen.getByText('Expand All')).toBeInTheDocument();
    expect(screen.getByText('Collapse All')).toBeInTheDocument();
  });

  it('Expand All adds all descendant directories to expandedDirs', async () => {
    const { user } = setupWithClipboardSpy();

    render(
      <DirContextMenu dirPath={dirNode.path} node={dirNode} projectRoot="/home/project">
        <span>Right-click dir</span>
      </DirContextMenu>,
    );

    await user.pointer({ keys: '[MouseRight]', target: screen.getByText('Right-click dir') });
    await user.click(screen.getByText('Expand All'));

    const { expandedDirs } = useFileStore.getState();
    expect(expandedDirs).toContain('/home/project/src');
    expect(expandedDirs).toContain('/home/project/src/utils');
  });

  it('Collapse All removes descendant directories from expandedDirs', async () => {
    const { user } = setupWithClipboardSpy();

    // Pre-expand dirs
    useFileStore.setState({
      expandedDirs: ['/home/project/src', '/home/project/src/utils', '/other/dir'],
    });

    render(
      <DirContextMenu dirPath={dirNode.path} node={dirNode} projectRoot="/home/project">
        <span>Right-click dir</span>
      </DirContextMenu>,
    );

    await user.pointer({ keys: '[MouseRight]', target: screen.getByText('Right-click dir') });
    await user.click(screen.getByText('Collapse All'));

    const { expandedDirs } = useFileStore.getState();
    expect(expandedDirs).not.toContain('/home/project/src');
    expect(expandedDirs).not.toContain('/home/project/src/utils');
    // Should preserve unrelated dirs
    expect(expandedDirs).toContain('/other/dir');
  });
});
