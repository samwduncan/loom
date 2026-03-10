/**
 * Sidebar tests -- branded header, collapse/expand toggle, new chat button,
 * session list integration, accessibility.
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useUIStore } from '@/stores/ui';
import { useTimelineStore } from '@/stores/timeline';

// Mock the useSessionList hook to control loading/session state directly
vi.mock('@/hooks/useSessionList', () => ({
  useSessionList: () => ({ isLoading: false, error: null }),
}));

// Mock useProjectContext to avoid async project resolution
vi.mock('@/hooks/useProjectContext', () => ({
  useProjectContext: () => ({ projectName: 'test-project', isLoading: false }),
  _resetProjectContextForTesting: vi.fn(),
}));

// Mock API client (used by SessionContextMenu delete)
vi.mock('@/lib/api-client', () => ({
  apiFetch: vi.fn().mockResolvedValue({}),
}));

function renderSidebar() {
  return render(
    <MemoryRouter>
      <Sidebar />
    </MemoryRouter>,
  );
}

describe('Sidebar', () => {
  beforeEach(() => {
    useUIStore.setState({ sidebarOpen: true });
    useTimelineStore.setState({
      sessions: [],
      activeSessionId: null,
      activeProviderId: 'claude',
    });
  });

  it('renders "Loom" wordmark in Instrument Serif italic font', () => {
    renderSidebar();
    const wordmark = screen.getByText('Loom');
    expect(wordmark).toBeInTheDocument();
    expect(wordmark.className).toContain('font-serif');
    expect(wordmark.className).toContain('italic');
  });

  it('has role="complementary" and aria-label="Chat sessions"', () => {
    renderSidebar();
    const aside = screen.getByRole('complementary');
    expect(aside).toBeInTheDocument();
    expect(aside).toHaveAttribute('aria-label', 'Chat sessions');
  });

  it('has a collapse toggle button that is accessible', () => {
    renderSidebar();
    const button = screen.getByRole('button', { name: /collapse sidebar/i });
    expect(button).toBeInTheDocument();
  });

  it('clicking collapse toggle calls toggleSidebar from UI store', async () => {
    const user = userEvent.setup();
    renderSidebar();
    const button = screen.getByRole('button', { name: /collapse sidebar/i });
    await user.click(button);
    expect(useUIStore.getState().sidebarOpen).toBe(false);
  });

  it('when sidebarOpen is false, renders expand trigger button instead of full sidebar', () => {
    useUIStore.setState({ sidebarOpen: false });
    renderSidebar();
    const expandButton = screen.getByRole('button', { name: /expand sidebar/i });
    expect(expandButton).toBeInTheDocument();
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
  });

  it('expand trigger has z-[var(--z-overlay)] positioning', () => {
    useUIStore.setState({ sidebarOpen: false });
    renderSidebar();
    const expandButton = screen.getByRole('button', { name: /expand sidebar/i });
    expect(expandButton.className).toContain('z-[var(--z-overlay)]');
  });

  it('renders New Chat button when sidebar is open', () => {
    renderSidebar();
    const newChatButtons = screen.getAllByRole('button', { name: /new chat/i });
    expect(newChatButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('shows empty state when no sessions exist', () => {
    renderSidebar();
    expect(screen.getByText('No conversations yet')).toBeInTheDocument();
  });

  it('renders session list when sessions exist', () => {
    useTimelineStore.setState({
      sessions: [
        {
          id: 'sess-1',
          title: 'Test Session',
          messages: [],
          providerId: 'claude',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          metadata: { tokenBudget: null, contextWindowUsed: null, totalCost: null },
        },
      ],
      activeSessionId: null,
      activeProviderId: 'claude',
    });
    renderSidebar();
    expect(screen.getByText('Test Session')).toBeInTheDocument();
  });
});
