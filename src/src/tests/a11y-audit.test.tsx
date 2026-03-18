/**
 * ARIA audit tests -- SkipLink, TabBar roving tabindex, semantic roles.
 *
 * Validates that key interactive components have correct ARIA attributes
 * and keyboard navigation patterns per WAI-ARIA best practices.
 *
 * Constitution: Named imports (2.2), vitest conventions.
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { SkipLink } from '@/components/a11y/SkipLink';
import { TabBar } from '@/components/content-area/view/TabBar';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { useTimelineStore } from '@/stores/timeline';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Mock useSessionList for Sidebar
vi.mock('@/hooks/useSessionList', () => ({
  useSessionList: () => ({ isLoading: false, error: null }),
}));

// Mock useProjectContext
vi.mock('@/hooks/useProjectContext', () => ({
  useProjectContext: () => ({ projectName: 'test-project', isLoading: false }),
  _resetProjectContextForTesting: vi.fn(),
}));

// Mock useMultiProjectSessions for multi-project rendering
const mockMultiProjectResult = {
  projectGroups: [] as import('@/types/session').ProjectGroup[],
  isLoading: false,
  error: null as string | null,
  expandedProjects: new Set<string>(),
  toggleProject: vi.fn(),
};
vi.mock('@/hooks/useMultiProjectSessions', () => ({
  useMultiProjectSessions: () => mockMultiProjectResult,
}));

// Mock API client
vi.mock('@/lib/api-client', () => ({
  apiFetch: vi.fn().mockResolvedValue({}),
}));

// TabBar mock -- inline selector function so we can change activeTab
let mockActiveTab = 'chat';
const mockSetActiveTab = vi.fn().mockImplementation((id: string) => {
  mockActiveTab = id;
});

vi.mock('@/stores/ui', async () => {
  const actual = await vi.importActual<typeof import('@/stores/ui')>('@/stores/ui');
  return {
    ...actual,
    useUIStore: (selector: (state: Record<string, unknown>) => unknown) =>
      selector({
        ...actual.useUIStore.getState(),
        activeTab: mockActiveTab,
        setActiveTab: mockSetActiveTab,
        sidebarOpen: true,
        toggleSidebar: vi.fn(),
        openModal: vi.fn(),
      }),
  };
});

// ---------------------------------------------------------------------------
// 1. SkipLink
// ---------------------------------------------------------------------------

describe('SkipLink', () => {
  it('renders and is focusable with correct href', async () => {
    const user = userEvent.setup();
    render(<SkipLink />);

    const link = screen.getByText('Skip to main content');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '#main-content');
    expect(link.tagName).toBe('A');

    // Tab to the link
    await user.tab();
    expect(link).toHaveFocus();
  });

  it('has sr-only class that becomes visible on focus', () => {
    render(<SkipLink />);
    const link = screen.getByText('Skip to main content');
    // The sr-only class should be present
    expect(link.className).toContain('sr-only');
    // The focus:not-sr-only class should also be present
    expect(link.className).toContain('focus:not-sr-only');
  });
});

// ---------------------------------------------------------------------------
// 2. TabBar roving tabindex
// ---------------------------------------------------------------------------

describe('TabBar roving tabindex', () => {
  beforeEach(() => {
    mockActiveTab = 'chat';
    mockSetActiveTab.mockClear();
  });

  it('only active tab has tabIndex=0, others have tabIndex=-1', () => {
    render(<TabBar />);
    const tabs = screen.getAllByRole('tab');

    const chatTab = screen.getByRole('tab', { name: /chat/i });
    expect(chatTab).toHaveAttribute('tabindex', '0');

    // All other tabs should have tabindex -1
    tabs.filter((t) => t !== chatTab).forEach((tab) => {
      expect(tab).toHaveAttribute('tabindex', '-1');
    });
  });

  it('ArrowRight moves to next tab', async () => {
    const user = userEvent.setup();
    render(<TabBar />);

    const chatTab = screen.getByRole('tab', { name: /chat/i });
    chatTab.focus();
    expect(chatTab).toHaveFocus();

    await user.keyboard('{ArrowRight}');
    expect(mockSetActiveTab).toHaveBeenCalledWith('files');
  });

  it('ArrowLeft wraps from first to last tab', async () => {
    const user = userEvent.setup();
    render(<TabBar />);

    const chatTab = screen.getByRole('tab', { name: /chat/i });
    chatTab.focus();

    await user.keyboard('{ArrowLeft}');
    expect(mockSetActiveTab).toHaveBeenCalledWith('git');
  });

  it('Home key moves to first tab', async () => {
    mockActiveTab = 'git';
    const user = userEvent.setup();
    render(<TabBar />);

    const gitTab = screen.getByRole('tab', { name: /git/i });
    gitTab.focus();

    await user.keyboard('{Home}');
    expect(mockSetActiveTab).toHaveBeenCalledWith('chat');
  });

  it('End key moves to last tab', async () => {
    const user = userEvent.setup();
    render(<TabBar />);

    const chatTab = screen.getByRole('tab', { name: /chat/i });
    chatTab.focus();

    await user.keyboard('{End}');
    expect(mockSetActiveTab).toHaveBeenCalledWith('git');
  });
});

// ---------------------------------------------------------------------------
// 3. All buttons have accessible names
// ---------------------------------------------------------------------------

describe('All buttons have accessible names', () => {
  beforeEach(() => {
    useTimelineStore.setState({
      sessions: [],
      activeSessionId: null,
      activeProviderId: 'claude',
    });
  });

  it('Sidebar buttons all have aria-label or text content', () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>,
    );

    const buttons = screen.getAllByRole('button');
    buttons.forEach((button) => {
      const hasAriaLabel = button.hasAttribute('aria-label');
      const hasTextContent = (button.textContent ?? '').trim().length > 0;
      expect(
        hasAriaLabel || hasTextContent,
        `Button missing accessible name: ${button.outerHTML.slice(0, 120)}`,
      ).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// 4. SessionItem listbox semantics
// ---------------------------------------------------------------------------

describe('SessionItem listbox semantics', () => {
  beforeEach(() => {
    const session = {
      id: 'session-1',
      title: 'Test Session',
      messages: [],
      providerId: 'claude' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: { tokenBudget: null, contextWindowUsed: null, totalCost: null },
    };
    useTimelineStore.setState({
      sessions: [session],
      activeSessionId: 'session-1',
      activeProviderId: 'claude',
    });
    mockMultiProjectResult.projectGroups = [{
      projectName: 'test-project',
      displayName: 'test project',
      projectPath: '/home/user/test-project',
      sessionCount: 1,
      visibleCount: 1,
      dateGroups: [{ label: 'Today' as const, sessions: [session] }],
    }];
    mockMultiProjectResult.expandedProjects = new Set(['test-project']);
  });

  it('session list has listbox role and session items have option role with aria-selected', () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>,
    );

    const listbox = screen.getByRole('listbox');
    expect(listbox).toHaveAttribute('aria-label', 'Chat sessions list');

    const options = screen.getAllByRole('option');
    expect(options.length).toBeGreaterThanOrEqual(1);

    // The active session should have aria-selected=true
    const activeOption = options.find(
      (opt) => opt.getAttribute('aria-selected') === 'true',
    );
    expect(activeOption).toBeTruthy();
  });
});
