import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ActionGroup } from './ActionGroup';
import { useUIStore } from '@/stores/ui';
import { Command } from 'cmdk';

function renderInCommand(ui: React.ReactElement) {
  return render(
    <MemoryRouter>
      <Command>{ui}</Command>
    </MemoryRouter>,
  );
}

describe('ActionGroup', () => {
  const mockAddRecent = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useUIStore.getState().reset();
  });

  it('renders 3 action items', () => {
    renderInCommand(<ActionGroup onClose={mockOnClose} addRecent={mockAddRecent} />);
    expect(screen.getByText('New Session')).toBeInTheDocument();
    expect(screen.getByText('Toggle Thinking Visibility')).toBeInTheDocument();
    expect(screen.getByText('Toggle Sidebar')).toBeInTheDocument();
  });

  it('renders Actions heading', () => {
    renderInCommand(<ActionGroup onClose={mockOnClose} addRecent={mockAddRecent} />);
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  it('clicking "Toggle Sidebar" calls toggleSidebar', async () => {
    const user = userEvent.setup();
    const initialSidebar = useUIStore.getState().sidebarOpen;
    renderInCommand(<ActionGroup onClose={mockOnClose} addRecent={mockAddRecent} />);

    await user.click(screen.getByText('Toggle Sidebar'));

    expect(useUIStore.getState().sidebarOpen).toBe(!initialSidebar);
    expect(mockOnClose).toHaveBeenCalledOnce();
  });

  it('clicking "Toggle Thinking Visibility" calls toggleThinking', async () => {
    const user = userEvent.setup();
    const initialThinking = useUIStore.getState().thinkingExpanded;
    renderInCommand(<ActionGroup onClose={mockOnClose} addRecent={mockAddRecent} />);

    await user.click(screen.getByText('Toggle Thinking Visibility'));

    expect(useUIStore.getState().thinkingExpanded).toBe(!initialThinking);
    expect(mockOnClose).toHaveBeenCalledOnce();
  });
});
