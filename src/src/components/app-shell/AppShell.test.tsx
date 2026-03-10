/**
 * AppShell tests — CSS Grid layout, sidebar state attribute, viewport locking.
 *
 * Tests cover SHELL-01 (3-column grid), SHELL-02 (h-dvh + overflow-hidden).
 */

import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach } from 'vitest';
import { AppShell } from './AppShell';
import { useUIStore } from '@/stores/ui';

function renderWithRouter(initialEntries = ['/chat']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AppShell />
    </MemoryRouter>,
  );
}

describe('AppShell', () => {
  beforeEach(() => {
    useUIStore.setState({ sidebarOpen: true });
  });

  it('renders a grid container with data-sidebar-state attribute', () => {
    renderWithRouter();
    const shell = screen.getByTestId('app-shell');
    expect(shell).toBeInTheDocument();
    expect(shell).toHaveAttribute('data-sidebar-state', 'expanded');
  });

  it('grid container has h-dvh and overflow-hidden classes', () => {
    renderWithRouter();
    const shell = screen.getByTestId('app-shell');
    expect(shell.className).toContain('h-dvh');
    expect(shell.className).toContain('overflow-hidden');
  });

  it('sets data-sidebar-state to collapsed-hidden when sidebar is closed', () => {
    useUIStore.setState({ sidebarOpen: false });
    renderWithRouter();
    const shell = screen.getByTestId('app-shell');
    expect(shell).toHaveAttribute('data-sidebar-state', 'collapsed-hidden');
  });

  it('has inline grid-template-columns style', () => {
    renderWithRouter();
    const shell = screen.getByTestId('app-shell');
    expect(shell.style.gridTemplateColumns).toContain('var(--sidebar-width');
  });

  it('renders a main content area', () => {
    renderWithRouter();
    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
  });
});
