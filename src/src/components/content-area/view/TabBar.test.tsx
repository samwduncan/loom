/**
 * TabBar tests -- verifies tab rendering, ARIA attributes, and click handlers.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TabBar } from './TabBar';

// Mock useUIStore
const mockSetActiveTab = vi.fn();
let mockActiveTab = 'chat';

vi.mock('@/stores/ui', () => ({
  useUIStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      activeTab: mockActiveTab,
      setActiveTab: mockSetActiveTab,
    }),
}));

describe('TabBar', () => {
  beforeEach(() => {
    mockActiveTab = 'chat';
    mockSetActiveTab.mockClear();
  });

  it('renders 4 tab buttons with correct labels', () => {
    render(<TabBar />);
    expect(screen.getByText('Chat')).toBeInTheDocument();
    expect(screen.getByText('Files')).toBeInTheDocument();
    expect(screen.getByText('Shell')).toBeInTheDocument();
    expect(screen.getByText('Git')).toBeInTheDocument();
  });

  it('each tab button has role="tab" and correct id', () => {
    render(<TabBar />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(4);
    expect(screen.getByRole('tab', { name: /chat/i })).toHaveAttribute('id', 'tab-chat');
    expect(screen.getByRole('tab', { name: /files/i })).toHaveAttribute('id', 'tab-files');
    expect(screen.getByRole('tab', { name: /shell/i })).toHaveAttribute('id', 'tab-shell');
    expect(screen.getByRole('tab', { name: /git/i })).toHaveAttribute('id', 'tab-git');
  });

  it('active tab has aria-selected=true, others false', () => {
    mockActiveTab = 'files';
    render(<TabBar />);
    expect(screen.getByRole('tab', { name: /files/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /chat/i })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('tab', { name: /shell/i })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('tab', { name: /git/i })).toHaveAttribute('aria-selected', 'false');
  });

  it('clicking a tab calls setActiveTab with correct TabId', async () => {
    const user = userEvent.setup();
    render(<TabBar />);
    await user.click(screen.getByRole('tab', { name: /files/i }));
    expect(mockSetActiveTab).toHaveBeenCalledWith('files');
    await user.click(screen.getByRole('tab', { name: /shell/i }));
    expect(mockSetActiveTab).toHaveBeenCalledWith('shell');
  });

  it('tab bar has role="tablist" with aria-label', () => {
    render(<TabBar />);
    const tablist = screen.getByRole('tablist');
    expect(tablist).toHaveAttribute('aria-label', 'Workspace panels');
  });

  it('active tab has visual differentiation via className', () => {
    mockActiveTab = 'chat';
    render(<TabBar />);
    const chatTab = screen.getByRole('tab', { name: /chat/i });
    const filesTab = screen.getByRole('tab', { name: /files/i });
    // Active tab should have text-foreground styling
    expect(chatTab.className).toContain('text-foreground');
    // Inactive tab should have text-muted styling
    expect(filesTab.className).toContain('text-muted');
  });

  it('each tab has aria-controls pointing to its panel', () => {
    render(<TabBar />);
    expect(screen.getByRole('tab', { name: /chat/i })).toHaveAttribute('aria-controls', 'panel-chat');
    expect(screen.getByRole('tab', { name: /files/i })).toHaveAttribute('aria-controls', 'panel-files');
    expect(screen.getByRole('tab', { name: /shell/i })).toHaveAttribute('aria-controls', 'panel-shell');
    expect(screen.getByRole('tab', { name: /git/i })).toHaveAttribute('aria-controls', 'panel-git');
  });
});
