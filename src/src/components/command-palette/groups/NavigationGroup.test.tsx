import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NavigationGroup } from './NavigationGroup';
import { useUIStore } from '@/stores/ui';

// cmdk requires a Command wrapper for its context
import { Command } from 'cmdk';

function renderInCommand(ui: React.ReactElement) {
  return render(<Command>{ui}</Command>);
}

describe('NavigationGroup', () => {
  const mockAddRecent = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useUIStore.getState().reset();
  });

  it('renders 5 navigation items', () => {
    renderInCommand(<NavigationGroup onClose={mockOnClose} addRecent={mockAddRecent} />);
    expect(screen.getByText('Switch to Chat')).toBeInTheDocument();
    expect(screen.getByText('Switch to Files')).toBeInTheDocument();
    expect(screen.getByText('Switch to Shell')).toBeInTheDocument();
    expect(screen.getByText('Switch to Git')).toBeInTheDocument();
    expect(screen.getByText('Open Settings')).toBeInTheDocument();
  });

  it('renders Navigation heading', () => {
    renderInCommand(<NavigationGroup onClose={mockOnClose} addRecent={mockAddRecent} />);
    expect(screen.getByText('Navigation')).toBeInTheDocument();
  });

  it('clicking "Switch to Chat" calls setActiveTab with chat', async () => {
    const user = userEvent.setup();
    renderInCommand(<NavigationGroup onClose={mockOnClose} addRecent={mockAddRecent} />);

    await user.click(screen.getByText('Switch to Chat'));

    expect(useUIStore.getState().activeTab).toBe('chat');
    expect(mockOnClose).toHaveBeenCalledOnce();
    expect(mockAddRecent).toHaveBeenCalledWith({
      id: 'nav-chat',
      label: 'Switch to Chat',
      group: 'Navigation',
    });
  });

  it('clicking "Switch to Files" calls setActiveTab with files', async () => {
    const user = userEvent.setup();
    renderInCommand(<NavigationGroup onClose={mockOnClose} addRecent={mockAddRecent} />);

    await user.click(screen.getByText('Switch to Files'));

    expect(useUIStore.getState().activeTab).toBe('files');
    expect(mockOnClose).toHaveBeenCalledOnce();
  });

  it('clicking "Open Settings" opens settings modal', async () => {
    const user = userEvent.setup();
    renderInCommand(<NavigationGroup onClose={mockOnClose} addRecent={mockAddRecent} />);

    await user.click(screen.getByText('Open Settings'));

    expect(useUIStore.getState().modalState).toEqual({ type: 'settings' });
    expect(mockOnClose).toHaveBeenCalledOnce();
  });
});
