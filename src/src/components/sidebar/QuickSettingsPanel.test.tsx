/**
 * QuickSettingsPanel tests -- Popover with three toggle switches for display preferences.
 *
 * Verifies rendering, toggle behavior, and popover staying open after toggling.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuickSettingsPanel } from './QuickSettingsPanel';
import { useUIStore } from '@/stores/ui';

// Mock the shortcut hook -- we don't test keyboard events here
vi.mock('@/hooks/useQuickSettingsShortcut', () => ({
  useQuickSettingsShortcut: vi.fn(),
}));

describe('QuickSettingsPanel', () => {
  beforeEach(() => {
    useUIStore.getState().reset();
  });

  it('renders trigger button with aria-label "Quick settings"', () => {
    render(<QuickSettingsPanel />);
    expect(screen.getByRole('button', { name: 'Quick settings' })).toBeInTheDocument();
  });

  it('clicking trigger opens popover with three toggles', async () => {
    const user = userEvent.setup();
    render(<QuickSettingsPanel />);

    await user.click(screen.getByRole('button', { name: 'Quick settings' }));

    expect(screen.getByText('Show thinking')).toBeInTheDocument();
    expect(screen.getByText('Auto-expand tools')).toBeInTheDocument();
    expect(screen.getByText('Show raw params')).toBeInTheDocument();
  });

  it('"Show thinking" toggle reflects thinkingExpanded store value', async () => {
    const user = userEvent.setup();
    render(<QuickSettingsPanel />);

    await user.click(screen.getByRole('button', { name: 'Quick settings' }));

    // thinkingExpanded defaults to true
    const toggle = screen.getByRole('switch', { name: 'Show thinking' });
    expect(toggle).toHaveAttribute('aria-checked', 'true');
  });

  it('"Auto-expand tools" toggle reflects autoExpandTools store value', async () => {
    const user = userEvent.setup();
    render(<QuickSettingsPanel />);

    await user.click(screen.getByRole('button', { name: 'Quick settings' }));

    // autoExpandTools defaults to false
    const toggle = screen.getByRole('switch', { name: 'Auto-expand tools' });
    expect(toggle).toHaveAttribute('aria-checked', 'false');
  });

  it('"Show raw params" toggle reflects showRawParams store value', async () => {
    const user = userEvent.setup();
    render(<QuickSettingsPanel />);

    await user.click(screen.getByRole('button', { name: 'Quick settings' }));

    // showRawParams defaults to false
    const toggle = screen.getByRole('switch', { name: 'Show raw params' });
    expect(toggle).toHaveAttribute('aria-checked', 'false');
  });

  it('toggling "Show thinking" calls toggleThinking', async () => {
    const user = userEvent.setup();
    render(<QuickSettingsPanel />);

    await user.click(screen.getByRole('button', { name: 'Quick settings' }));

    const toggle = screen.getByRole('switch', { name: 'Show thinking' });
    expect(toggle).toHaveAttribute('aria-checked', 'true');

    await user.click(toggle);
    expect(useUIStore.getState().thinkingExpanded).toBe(false);
  });

  it('toggling "Auto-expand tools" calls toggleAutoExpandTools', async () => {
    const user = userEvent.setup();
    render(<QuickSettingsPanel />);

    await user.click(screen.getByRole('button', { name: 'Quick settings' }));

    const toggle = screen.getByRole('switch', { name: 'Auto-expand tools' });
    await user.click(toggle);
    expect(useUIStore.getState().autoExpandTools).toBe(true);
  });

  it('toggling "Show raw params" calls toggleShowRawParams', async () => {
    const user = userEvent.setup();
    render(<QuickSettingsPanel />);

    await user.click(screen.getByRole('button', { name: 'Quick settings' }));

    const toggle = screen.getByRole('switch', { name: 'Show raw params' });
    await user.click(toggle);
    expect(useUIStore.getState().showRawParams).toBe(true);
  });

  it('popover stays open after toggling (not DropdownMenu behavior)', async () => {
    const user = userEvent.setup();
    render(<QuickSettingsPanel />);

    await user.click(screen.getByRole('button', { name: 'Quick settings' }));

    // Toggle one switch
    const toggle = screen.getByRole('switch', { name: 'Auto-expand tools' });
    await user.click(toggle);

    // Popover should still be open -- all three labels still visible
    expect(screen.getByText('Show thinking')).toBeInTheDocument();
    expect(screen.getByText('Auto-expand tools')).toBeInTheDocument();
    expect(screen.getByText('Show raw params')).toBeInTheDocument();
  });
});
