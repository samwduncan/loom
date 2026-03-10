/**
 * App routing tests -- React Router route structure with AppShell layout.
 *
 * Tests cover SHELL-03 (routes inside AppShell content area).
 * Updated for Phase 8: ChatPlaceholder replaced by ChatView.
 */

import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppRoutes } from './App';
import { useUIStore } from '@/stores/ui';
import { useTimelineStore } from '@/stores/timeline';
import { useStreamStore } from '@/stores/stream';

// Mock useProjectContext for ChatView
vi.mock('@/hooks/useProjectContext', () => ({
  useProjectContext: () => ({ projectName: 'test-project', isLoading: false }),
}));

// Mock useSessionSwitch for ChatView
vi.mock('@/hooks/useSessionSwitch', () => ({
  useSessionSwitch: () => ({
    switchSession: vi.fn(),
    isLoadingMessages: false,
  }),
}));

// Mock wsClient for ChatComposer
vi.mock('@/lib/websocket-client', () => ({
  wsClient: { send: vi.fn().mockReturnValue(true) },
}));

// Mock IntersectionObserver for scroll anchor
vi.stubGlobal('IntersectionObserver', class {
  constructor() { /* noop */ }
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
});

function renderWithRouter(initialEntries: string[]) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AppRoutes />
    </MemoryRouter>,
  );
}

describe('App routing', () => {
  beforeEach(() => {
    useUIStore.setState({ sidebarOpen: true });
    useTimelineStore.getState().reset();
    useStreamStore.getState().reset();
  });

  it('navigating to /chat renders ChatView empty state inside AppShell', () => {
    renderWithRouter(['/chat']);
    const emptyState = screen.getByTestId('chat-empty-state');
    expect(emptyState).toBeInTheDocument();
    expect(screen.getByText('What would you like to work on?')).toBeInTheDocument();
    expect(screen.getByTestId('app-shell')).toBeInTheDocument();
  });

  it('navigating to /chat/some-session-id renders ChatView inside AppShell', () => {
    renderWithRouter(['/chat/some-session-id']);
    // ChatView renders but may show skeleton (no session data in store)
    expect(screen.getByTestId('chat-view')).toBeInTheDocument();
    expect(screen.getByTestId('app-shell')).toBeInTheDocument();
  });

  it('navigating to /dev/tokens renders TokenPreview OUTSIDE AppShell', () => {
    renderWithRouter(['/dev/tokens']);
    expect(screen.queryByTestId('app-shell')).not.toBeInTheDocument();
    // TokenPreview renders its own content
    expect(screen.getByText('Design Token Preview')).toBeInTheDocument();
  });

  it('root path / redirects to /chat (shows ChatView empty state)', () => {
    renderWithRouter(['/']);
    expect(screen.getByTestId('chat-empty-state')).toBeInTheDocument();
    expect(screen.getByTestId('app-shell')).toBeInTheDocument();
  });
});
