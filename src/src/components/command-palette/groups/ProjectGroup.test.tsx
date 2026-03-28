import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ProjectGroup } from './ProjectGroup';
import { Command } from 'cmdk';
import { MemoryRouter } from 'react-router-dom';

// Mock apiFetch
vi.mock('@/lib/api-client', () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from '@/lib/api-client';

const mockApiFetch = vi.mocked(apiFetch);

function renderInCommand(ui: React.ReactElement) {
  return render(<MemoryRouter><Command>{ui}</Command></MemoryRouter>);
}

describe('ProjectGroup', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches and renders projects when multiple exist', async () => {
    mockApiFetch.mockResolvedValue([
      { name: 'loom', path: '/home/swd/loom', isActive: true },
      { name: 'rowlab', path: '/home/swd/rowlab', isActive: false },
    ]);

    renderInCommand(<ProjectGroup onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('loom')).toBeInTheDocument();
      expect(screen.getByText('rowlab')).toBeInTheDocument();
    });
  });

  it('shows Projects heading', async () => {
    mockApiFetch.mockResolvedValue([
      { name: 'loom', path: '/home/swd/loom' },
      { name: 'rowlab', path: '/home/swd/rowlab' },
    ]);

    renderInCommand(<ProjectGroup onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('Projects')).toBeInTheDocument();
    });
  });

  it('hides when only 1 project exists', async () => {
    mockApiFetch.mockResolvedValue([
      { name: 'loom', path: '/home/swd/loom', isActive: true },
    ]);

    renderInCommand(<ProjectGroup onClose={mockOnClose} />);

    // Wait for fetch to complete
    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledOnce();
    });

    expect(screen.queryByText('Projects')).not.toBeInTheDocument();
  });

  it('hides when fetch fails', async () => {
    mockApiFetch.mockRejectedValue(new Error('Network error'));

    renderInCommand(<ProjectGroup onClose={mockOnClose} />);

    // Wait for fetch to fail
    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledOnce();
    });

    expect(screen.queryByText('Projects')).not.toBeInTheDocument();
  });
});
