/**
 * FileTreePanel tests -- verifies split layout structure with tree and editor.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FileTreePanel } from './FileTreePanel';

// Mock CodeEditor module -- covers both direct import and React.lazy dynamic import
vi.mock('@/components/editor/CodeEditor', () => ({
  CodeEditor: function MockCodeEditor() {
    return <div data-testid="code-editor">CodeEditor</div>;
  },
  contentCache: new Map(),
}));

// Mock EditorTabs (imported directly, not lazy)
vi.mock('@/components/editor/EditorTabs', () => ({
  EditorTabs: function MockEditorTabs() {
    return <div data-testid="editor-tabs" />;
  },
}));

describe('FileTreePanel', () => {
  it('renders split layout with tree sidebar and editor area', async () => {
    render(<FileTreePanel />);
    // Tree sidebar exists
    expect(screen.getByText('Files')).toBeInTheDocument();
    // Editor area exists (lazy CodeEditor renders via Suspense -- use findBy for async)
    expect(await screen.findByTestId('code-editor')).toBeInTheDocument();
  });

  it('renders refresh button in tree header', () => {
    render(<FileTreePanel />);
    expect(screen.getByLabelText('Refresh file tree')).toBeInTheDocument();
  });

  it('renders editor tabs above the editor', () => {
    render(<FileTreePanel />);
    expect(screen.getByTestId('editor-tabs')).toBeInTheDocument();
  });
});
