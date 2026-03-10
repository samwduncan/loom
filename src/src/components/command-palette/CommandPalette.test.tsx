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

// Mock useCommandSearch to control search results
vi.mock('./hooks/useCommandSearch', () => ({
  useCommandSearch: vi.fn().mockReturnValue({
    sessionResults: [],
    fileResults: [],
    commandResults: [],
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
      commandResults: [],
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
      commandResults: [],
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
});
