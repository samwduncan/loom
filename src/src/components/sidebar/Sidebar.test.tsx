/**
 * Sidebar tests — Branded header, collapse/expand toggle, accessibility.
 *
 * Tests cover sidebar display states per SHELL-01 requirements.
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import { Sidebar } from './Sidebar';
import { useUIStore } from '@/stores/ui';

describe('Sidebar', () => {
  beforeEach(() => {
    useUIStore.setState({ sidebarOpen: true, sidebarState: 'expanded' });
  });

  it('renders "Loom" wordmark in Instrument Serif italic font', () => {
    render(<Sidebar />);
    const wordmark = screen.getByText('Loom');
    expect(wordmark).toBeInTheDocument();
    expect(wordmark.className).toContain('font-serif');
    expect(wordmark.className).toContain('italic');
  });

  it('has role="complementary" and aria-label', () => {
    render(<Sidebar />);
    const aside = screen.getByRole('complementary');
    expect(aside).toBeInTheDocument();
    expect(aside).toHaveAttribute('aria-label', 'Navigation');
  });

  it('has a collapse toggle button that is accessible', () => {
    render(<Sidebar />);
    const button = screen.getByRole('button', { name: /collapse sidebar/i });
    expect(button).toBeInTheDocument();
  });

  it('clicking collapse toggle calls toggleSidebar from UI store', async () => {
    const user = userEvent.setup();
    render(<Sidebar />);
    const button = screen.getByRole('button', { name: /collapse sidebar/i });
    await user.click(button);
    expect(useUIStore.getState().sidebarOpen).toBe(false);
    expect(useUIStore.getState().sidebarState).toBe('collapsed-hidden');
  });

  it('when sidebarOpen is false, renders expand trigger button instead of full sidebar', () => {
    useUIStore.setState({ sidebarOpen: false, sidebarState: 'collapsed-hidden' });
    render(<Sidebar />);
    const expandButton = screen.getByRole('button', { name: /expand sidebar/i });
    expect(expandButton).toBeInTheDocument();
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
  });

  it('expand trigger has z-[var(--z-overlay)] positioning', () => {
    useUIStore.setState({ sidebarOpen: false, sidebarState: 'collapsed-hidden' });
    render(<Sidebar />);
    const expandButton = screen.getByRole('button', { name: /expand sidebar/i });
    expect(expandButton.className).toContain('z-[var(--z-overlay)]');
  });
});
