/**
 * App routing tests — React Router route structure with AppShell layout.
 *
 * Tests cover SHELL-03 (routes inside AppShell content area).
 */

import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach } from 'vitest';
import { AppRoutes } from './App';
import { useUIStore } from '@/stores/ui';

function renderWithRouter(initialEntries: string[]) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AppRoutes />
    </MemoryRouter>,
  );
}

describe('App routing', () => {
  beforeEach(() => {
    useUIStore.setState({ sidebarOpen: true, sidebarState: 'expanded' });
  });

  it('navigating to /chat renders inside AppShell with "Start a conversation" placeholder', () => {
    renderWithRouter(['/chat']);
    expect(screen.getByText('Start a conversation')).toBeInTheDocument();
    expect(screen.getByTestId('app-shell')).toBeInTheDocument();
  });

  it('navigating to /chat/some-session-id renders inside AppShell with chat placeholder', () => {
    renderWithRouter(['/chat/some-session-id']);
    expect(screen.getByText('Chat')).toBeInTheDocument();
    expect(screen.getByText('some-session-id')).toBeInTheDocument();
    expect(screen.getByTestId('app-shell')).toBeInTheDocument();
  });

  it('navigating to /dashboard renders "Dashboard" placeholder inside AppShell', () => {
    renderWithRouter(['/dashboard']);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByTestId('app-shell')).toBeInTheDocument();
  });

  it('navigating to /settings renders "Settings" placeholder inside AppShell', () => {
    renderWithRouter(['/settings']);
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByTestId('app-shell')).toBeInTheDocument();
  });

  it('navigating to /dev/tokens renders TokenPreview OUTSIDE AppShell', () => {
    renderWithRouter(['/dev/tokens']);
    expect(screen.queryByTestId('app-shell')).not.toBeInTheDocument();
    // TokenPreview renders its own content
    expect(screen.getByText('Design Token Preview')).toBeInTheDocument();
  });

  it('root path / redirects to /chat', () => {
    renderWithRouter(['/']);
    expect(screen.getByText('Start a conversation')).toBeInTheDocument();
    expect(screen.getByTestId('app-shell')).toBeInTheDocument();
  });
});
