/**
 * EditorTabs tests -- tab rendering, active state, close behavior, dirty indicators.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EditorTabs } from './EditorTabs';

// Mock file store
const mockSetActiveFile = vi.fn();
const mockCloseFile = vi.fn();
let mockOpenTabs: Array<{ filePath: string; isDirty: boolean }> = [];
let mockActiveFilePath: string | null = null;

vi.mock('@/stores/file', () => ({
  useFileStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      openTabs: mockOpenTabs,
      activeFilePath: mockActiveFilePath,
      setActiveFile: mockSetActiveFile,
      closeFile: mockCloseFile,
    }),
}));

const mockOnSave = vi.fn().mockResolvedValue(true);

describe('EditorTabs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOpenTabs = [];
    mockActiveFilePath = null;
  });

  it('renders nothing when no tabs are open', () => {
    const { container } = render(<EditorTabs onSave={mockOnSave} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders a tab for each open file with correct filename', () => {
    mockOpenTabs = [
      { filePath: '/src/components/App.tsx', isDirty: false },
      { filePath: '/src/lib/utils.ts', isDirty: false },
    ];
    render(<EditorTabs onSave={mockOnSave} />);
    expect(screen.getByText('App.tsx')).toBeInTheDocument();
    expect(screen.getByText('utils.ts')).toBeInTheDocument();
  });

  it('active tab has distinct styling', () => {
    mockOpenTabs = [
      { filePath: '/src/App.tsx', isDirty: false },
      { filePath: '/src/utils.ts', isDirty: false },
    ];
    mockActiveFilePath = '/src/App.tsx';
    render(<EditorTabs onSave={mockOnSave} />);

    const activeTab = screen.getByText('App.tsx').closest('[role="tab"]');
    expect(activeTab?.className).toContain('surface-raised');

    const inactiveTab = screen.getByText('utils.ts').closest('[role="tab"]');
    expect(inactiveTab?.className).toContain('muted-foreground');
  });

  it('clicking a tab calls setActiveFile', () => {
    mockOpenTabs = [{ filePath: '/src/App.tsx', isDirty: false }];
    render(<EditorTabs onSave={mockOnSave} />);

    fireEvent.click(screen.getByText('App.tsx'));
    expect(mockSetActiveFile).toHaveBeenCalledWith('/src/App.tsx');
  });

  it('close button on clean tab calls closeFile immediately', () => {
    mockOpenTabs = [{ filePath: '/src/App.tsx', isDirty: false }];
    render(<EditorTabs onSave={mockOnSave} />);

    fireEvent.click(screen.getByLabelText('Close App.tsx'));
    expect(mockCloseFile).toHaveBeenCalledWith('/src/App.tsx');
  });

  it('dirty dot renders when isDirty is true', () => {
    mockOpenTabs = [{ filePath: '/src/App.tsx', isDirty: true }];
    render(<EditorTabs onSave={mockOnSave} />);

    expect(screen.getByLabelText('Unsaved changes')).toBeInTheDocument();
  });

  it('no dirty dot when isDirty is false', () => {
    mockOpenTabs = [{ filePath: '/src/App.tsx', isDirty: false }];
    render(<EditorTabs onSave={mockOnSave} />);

    expect(screen.queryByLabelText('Unsaved changes')).not.toBeInTheDocument();
  });

  it('hovering tab shows full path via title attribute', () => {
    mockOpenTabs = [{ filePath: '/src/components/App.tsx', isDirty: false }];
    render(<EditorTabs onSave={mockOnSave} />);

    const tab = screen.getByText('App.tsx').closest('[role="tab"]');
    expect(tab).toHaveAttribute('title', '/src/components/App.tsx');
  });

  it('close button on dirty tab shows confirmation dialog', () => {
    mockOpenTabs = [{ filePath: '/src/App.tsx', isDirty: true }];
    render(<EditorTabs onSave={mockOnSave} />);

    fireEvent.click(screen.getByLabelText('Close App.tsx'));
    // closeFile should NOT be called yet
    expect(mockCloseFile).not.toHaveBeenCalled();
    // Dialog should appear
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText('Discard')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('discard button in dialog closes without saving', () => {
    mockOpenTabs = [{ filePath: '/src/App.tsx', isDirty: true }];
    render(<EditorTabs onSave={mockOnSave} />);

    fireEvent.click(screen.getByLabelText('Close App.tsx'));
    fireEvent.click(screen.getByText('Discard'));
    expect(mockCloseFile).toHaveBeenCalledWith('/src/App.tsx');
    expect(mockOnSave).not.toHaveBeenCalled();
  });
});
