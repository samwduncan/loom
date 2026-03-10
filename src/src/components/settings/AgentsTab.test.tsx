/**
 * AgentsTab tests -- provider status display with dots, email, model info, errors.
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AgentsTab } from './AgentsTab';

const mockUseAgentStatuses = vi.fn();

vi.mock('@/hooks/useSettingsData', () => ({
  useAgentStatuses: () => mockUseAgentStatuses(),
}));

describe('AgentsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading skeleton when isLoading=true', () => {
    mockUseAgentStatuses.mockReturnValue({
      data: [],
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    });

    render(<AgentsTab />);
    expect(screen.getByTestId('settings-tab-skeleton')).toBeInTheDocument();
  });

  it('renders 3 provider rows when loaded', () => {
    mockUseAgentStatuses.mockReturnValue({
      data: [
        { provider: 'claude', authenticated: true, email: 'user@test.com', defaultModel: 'Sonnet' },
        { provider: 'codex', authenticated: false, email: null },
        { provider: 'gemini', authenticated: false, email: null },
      ],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<AgentsTab />);
    expect(screen.getByTestId('agents-tab')).toBeInTheDocument();
    expect(screen.getByTestId('provider-row-claude')).toBeInTheDocument();
    expect(screen.getByTestId('provider-row-codex')).toBeInTheDocument();
    expect(screen.getByTestId('provider-row-gemini')).toBeInTheDocument();
  });

  it('connected provider shows green dot, email, and default model name', () => {
    mockUseAgentStatuses.mockReturnValue({
      data: [
        { provider: 'claude', authenticated: true, email: 'user@test.com', defaultModel: 'Sonnet' },
      ],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<AgentsTab />);

    const dot = screen.getByTestId('status-dot-claude');
    expect(dot).toHaveClass('bg-[var(--color-success)]');
    expect(screen.getByText('Connected')).toBeInTheDocument();
    expect(screen.getByText('user@test.com')).toBeInTheDocument();
    expect(screen.getByTestId('model-claude')).toHaveTextContent('Model: Sonnet');
  });

  it('disconnected provider shows red dot and "Disconnected"', () => {
    mockUseAgentStatuses.mockReturnValue({
      data: [
        { provider: 'codex', authenticated: false, email: null },
      ],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<AgentsTab />);

    const dot = screen.getByTestId('status-dot-codex');
    expect(dot).toHaveClass('bg-[var(--color-destructive)]');
    expect(screen.getByText('Disconnected')).toBeInTheDocument();
  });

  it('error state shows warning dot and error message', () => {
    mockUseAgentStatuses.mockReturnValue({
      data: [
        { provider: 'gemini', authenticated: false, email: null, error: 'Auth token expired' },
      ],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<AgentsTab />);

    const dot = screen.getByTestId('status-dot-gemini');
    expect(dot).toHaveClass('bg-[var(--color-warning)]');
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByTestId('error-gemini')).toHaveTextContent('Auth token expired');
  });
});
