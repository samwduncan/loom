import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CommandPalette } from './CommandPalette';
import { useUIStore } from '@/stores/ui';

// cmdk calls scrollIntoView which jsdom doesn't implement
Element.prototype.scrollIntoView = vi.fn();

// Mock apiFetch to return appropriate responses per endpoint
vi.mock('@/lib/api-client', () => ({
  apiFetch: vi.fn().mockImplementation((path: string) => {
    if (path === '/api/projects') return Promise.resolve([]);
    if (path === '/api/commands/list') return Promise.resolve({ builtIn: [], custom: [], count: 0 });
    return Promise.resolve({});
  }),
}));

// Mock useProjectContext
vi.mock('@/hooks/useProjectContext', () => ({
  useProjectContext: () => ({ projectName: 'test-project', isLoading: false }),
}));

// Mock useCommandSearch to control search results
vi.mock('./hooks/useCommandSearch', () => ({
  useCommandSearch: vi.fn().mockReturnValue({
    sessionResults: [],
    fileResults: [],
    isLoading: false,
  }),
}));

import { useCommandSearch } from './hooks/useCommandSearch';

const mockUseCommandSearch = vi.mocked(useCommandSearch);

function renderPalette() {
  return render(
    <MemoryRouter>
      <CommandPalette />
    </MemoryRouter>,
  );
}

describe('CommandPalette', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useUIStore.getState().reset();
    mockUseCommandSearch.mockReturnValue({
      sessionResults: [],
      fileResults: [],
      isLoading: false,
    });
  });

  it('does not render dialog content when closed', () => {
    renderPalette();
    expect(screen.queryByPlaceholderText('Type a command or search...')).not.toBeInTheDocument();
  });

  it('renders dialog with input when open', () => {
    useUIStore.setState({ commandPaletteOpen: true });
    renderPalette();
    expect(screen.getByPlaceholderText('Type a command or search...')).toBeInTheDocument();
  });

  it('renders Navigation and Actions group headers by default', () => {
    useUIStore.setState({ commandPaletteOpen: true });
    renderPalette();
    expect(screen.getByText('Navigation')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  it('has the correct dialog label for accessibility', () => {
    useUIStore.setState({ commandPaletteOpen: true });
    renderPalette();
    expect(screen.getByRole('dialog', { name: 'Command Palette' })).toBeInTheDocument();
  });

  it('renders session results when search returns sessions', () => {
    useUIStore.setState({ commandPaletteOpen: true });
    mockUseCommandSearch.mockReturnValue({
      sessionResults: [
        {
          id: 'sess-1',
          title: 'Test Session',
          messages: [],
          providerId: 'claude',
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
          metadata: { tokenBudget: null, contextWindowUsed: null, totalCost: null },
        },
      ],
      fileResults: [],
      isLoading: false,
    });
    renderPalette();
    expect(screen.getByText('Sessions')).toBeInTheDocument();
    expect(screen.getByText('Test Session')).toBeInTheDocument();
  });

  it('renders navigation items with correct labels', () => {
    useUIStore.setState({ commandPaletteOpen: true });
    renderPalette();
    expect(screen.getByText('Switch to Chat')).toBeInTheDocument();
    expect(screen.getByText('Switch to Files')).toBeInTheDocument();
    expect(screen.getByText('Switch to Shell')).toBeInTheDocument();
    expect(screen.getByText('Switch to Git')).toBeInTheDocument();
    expect(screen.getByText('Open Settings')).toBeInTheDocument();
  });

  it('renders action items', () => {
    useUIStore.setState({ commandPaletteOpen: true });
    renderPalette();
    expect(screen.getByText('New Session')).toBeInTheDocument();
    expect(screen.getByText('Toggle Thinking Visibility')).toBeInTheDocument();
    expect(screen.getByText('Toggle Sidebar')).toBeInTheDocument();
  });

  it('renders designed empty state with description inside Command.Empty', async () => {
    // Reset module cache so doMock takes effect on fresh import
    vi.resetModules();

    // Mock all groups to render nothing, so Command.Empty becomes visible
    vi.doMock('./groups/NavigationGroup', () => ({
      NavigationGroup: () => null,
    }));
    vi.doMock('./groups/SessionGroup', () => ({
      SessionGroup: () => null,
    }));
    vi.doMock('./groups/FileGroup', () => ({
      FileGroup: () => null,
    }));
    vi.doMock('./groups/ActionGroup', () => ({
      ActionGroup: () => null,
    }));
    vi.doMock('./groups/CommandGroup', () => ({
      CommandGroup: () => null,
    }));
    vi.doMock('./groups/ProjectGroup', () => ({
      ProjectGroup: () => null,
    }));

    // Re-import with mocked groups
    const { CommandPalette: CP } = await import('./CommandPalette');
    const { useUIStore: freshUIStore } = await import('@/stores/ui');
    freshUIStore.setState({ commandPaletteOpen: true });
    render(
      <MemoryRouter>
        <CP />
      </MemoryRouter>,
    );

    // Command.Empty shows when all groups return null (zero items)
    expect(screen.getByText('No results found')).toBeInTheDocument();
    expect(screen.getByText('Try a different search term or command')).toBeInTheDocument();
  });
});
