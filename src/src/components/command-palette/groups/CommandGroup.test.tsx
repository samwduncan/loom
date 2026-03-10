import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { CommandGroup } from './CommandGroup';
import { Command } from 'cmdk';

// Mock apiFetch
vi.mock('@/lib/api-client', () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from '@/lib/api-client';

const mockApiFetch = vi.mocked(apiFetch);

function renderInCommand(ui: React.ReactElement) {
  return render(<Command>{ui}</Command>);
}

describe('CommandGroup', () => {
  const mockAddRecent = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockApiFetch.mockResolvedValue({
      builtIn: [
        { name: '/help', description: 'Show help', namespace: 'built-in' },
        { name: '/clear', description: 'Clear session', namespace: 'built-in' },
      ],
      custom: [
        { name: '/deploy', description: 'Deploy to production', namespace: 'custom' },
      ],
      count: 3,
    });
  });

  it('fetches and renders slash commands when search starts with /', async () => {
    renderInCommand(
      <CommandGroup search="/h" onClose={mockOnClose} addRecent={mockAddRecent} />,
    );

    await waitFor(() => {
      expect(screen.getByText('/help')).toBeInTheDocument();
    });
  });

  it('shows Commands heading', async () => {
    renderInCommand(
      <CommandGroup search="/" onClose={mockOnClose} addRecent={mockAddRecent} />,
    );

    await waitFor(() => {
      expect(screen.getByText('Commands')).toBeInTheDocument();
    });
  });

  it('does not render when search does not match any commands', async () => {
    renderInCommand(
      <CommandGroup search="zzzzz" onClose={mockOnClose} addRecent={mockAddRecent} />,
    );

    // Wait for fetch to complete
    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledOnce();
    });

    expect(screen.queryByText('Commands')).not.toBeInTheDocument();
  });

  it('renders nothing when empty search', () => {
    renderInCommand(
      <CommandGroup search="" onClose={mockOnClose} addRecent={mockAddRecent} />,
    );

    expect(screen.queryByText('Commands')).not.toBeInTheDocument();
  });
});
