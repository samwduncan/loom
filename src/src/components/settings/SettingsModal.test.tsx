/**
 * SettingsModal tests -- open/close behavior, tab navigation, content rendering.
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SettingsModal } from './SettingsModal';
import { useUIStore } from '@/stores/ui';

// Mock Dialog portal to render inline for testing
vi.mock('radix-ui', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('radix-ui');
  return {
    ...actual,
    Dialog: {
      // ASSERT: actual.Dialog exists from radix-ui
      ...(actual['Dialog'] as Record<string, unknown>),
      Portal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    },
  };
});

describe('SettingsModal', () => {
  beforeEach(() => {
    useUIStore.getState().reset();
  });

  it('renders when modalState.type === "settings"', () => {
    useUIStore.getState().openModal({ type: 'settings' });
    render(<SettingsModal />);

    expect(screen.getByTestId('settings-modal')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('does not render dialog content when modalState is null', () => {
    render(<SettingsModal />);

    expect(screen.queryByTestId('settings-modal')).not.toBeInTheDocument();
  });

  it('all 5 tab triggers are present with correct labels', () => {
    useUIStore.getState().openModal({ type: 'settings' });
    render(<SettingsModal />);

    expect(screen.getByTestId('settings-tab-agents')).toHaveTextContent('Agents');
    expect(screen.getByTestId('settings-tab-api-keys')).toHaveTextContent('API Keys');
    expect(screen.getByTestId('settings-tab-appearance')).toHaveTextContent('Appearance');
    expect(screen.getByTestId('settings-tab-git')).toHaveTextContent('Git');
    expect(screen.getByTestId('settings-tab-mcp')).toHaveTextContent('MCP');
  });

  it('clicking a tab switches active state via data attribute', async () => {
    const user = userEvent.setup();
    useUIStore.getState().openModal({ type: 'settings' });
    render(<SettingsModal />);

    const agentsTab = screen.getByTestId('settings-tab-agents');
    const gitTab = screen.getByTestId('settings-tab-git');

    // Agents is default active tab
    expect(agentsTab).toHaveAttribute('data-state', 'active');
    expect(gitTab).toHaveAttribute('data-state', 'inactive');

    // Click git tab
    await user.click(gitTab);

    expect(gitTab).toHaveAttribute('data-state', 'active');
    expect(agentsTab).toHaveAttribute('data-state', 'inactive');
  });

  it('close button calls closeModal', async () => {
    useUIStore.getState().openModal({ type: 'settings' });
    render(<SettingsModal />);

    const closeButton = screen.getByRole('button', { name: /close/i });
    await userEvent.click(closeButton);

    expect(useUIStore.getState().modalState).toBeNull();
  });
});
