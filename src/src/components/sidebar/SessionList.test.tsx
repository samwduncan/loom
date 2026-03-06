/**
 * SessionList tests -- date grouping, loading skeleton, empty state.
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { SessionList } from './SessionList';
import { useTimelineStore } from '@/stores/timeline';

// Mock the useSessionList hook to control loading state directly
vi.mock('@/hooks/useSessionList', () => ({
  useSessionList: () => ({ isLoading: false, error: null }),
}));

// Mock project context
vi.mock('@/hooks/useProjectContext', () => ({
  useProjectContext: () => ({ projectName: 'test-project', isLoading: false }),
  _resetProjectContextForTesting: vi.fn(),
}));

// Mock API client (used by SessionContextMenu delete)
vi.mock('@/lib/api-client', () => ({
  apiFetch: vi.fn().mockResolvedValue({}),
}));

function renderSessionList() {
  return render(
    <MemoryRouter>
      <SessionList />
    </MemoryRouter>,
  );
}

describe('SessionList', () => {
  beforeEach(() => {
    useTimelineStore.setState({
      sessions: [],
      activeSessionId: null,
      activeProviderId: 'claude',
    });
  });

  it('shows empty state when no sessions exist', () => {
    renderSessionList();
    expect(screen.getByText('No conversations yet')).toBeInTheDocument();
  });

  it('renders sessions grouped by date with headers', () => {
    const now = new Date();
    useTimelineStore.setState({
      sessions: [
        {
          id: 'sess-today',
          title: 'Today Session',
          messages: [],
          providerId: 'claude',
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
          metadata: { tokenBudget: null, contextWindowUsed: null, totalCost: null },
        },
      ],
      activeSessionId: null,
      activeProviderId: 'claude',
    });

    renderSessionList();
    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('Today Session')).toBeInTheDocument();
  });

  it('renders listbox with proper aria-label', () => {
    useTimelineStore.setState({
      sessions: [
        {
          id: 'sess-1',
          title: 'Session A',
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

    renderSessionList();
    const listbox = screen.getByRole('listbox');
    expect(listbox).toHaveAttribute('aria-label', 'Chat sessions list');
  });

  it('marks the active session', () => {
    useTimelineStore.setState({
      sessions: [
        {
          id: 'sess-active',
          title: 'Active Session',
          messages: [],
          providerId: 'claude',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          metadata: { tokenBudget: null, contextWindowUsed: null, totalCost: null },
        },
      ],
      activeSessionId: 'sess-active',
      activeProviderId: 'claude',
    });

    renderSessionList();
    const option = screen.getByRole('option');
    expect(option).toHaveAttribute('aria-selected', 'true');
  });
});
