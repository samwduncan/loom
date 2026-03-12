/**
 * ConnectionStatusIndicator tests — colored dot for connection health.
 *
 * Tests verify correct dot color and tooltip for each ConnectionStatus value.
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the connection store
const mockUseConnectionStore = vi.fn();
vi.mock('@/stores/connection', () => ({
  useConnectionStore: (selector: (s: unknown) => unknown) =>
    selector(mockUseConnectionStore()),
}));

import { ConnectionStatusIndicator } from './ConnectionStatusIndicator';

function setStatus(status: string) {
  mockUseConnectionStore.mockReturnValue({
    providers: {
      claude: { status, error: null, reconnectAttempts: 0, lastConnected: null, modelId: null },
      codex: { status: 'disconnected', error: null, reconnectAttempts: 0, lastConnected: null, modelId: null },
      gemini: { status: 'disconnected', error: null, reconnectAttempts: 0, lastConnected: null, modelId: null },
    },
  });
}

describe('ConnectionStatusIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a green dot when connected', () => {
    setStatus('connected');
    render(<ConnectionStatusIndicator />);
    const dot = screen.getByTitle('Connected');
    expect(dot).toBeInTheDocument();
    expect(dot.querySelector('span')).toHaveClass('bg-success');
  });

  it('renders a yellow pulsing dot when connecting', () => {
    setStatus('connecting');
    render(<ConnectionStatusIndicator />);
    const dot = screen.getByTitle('Connecting...');
    expect(dot).toBeInTheDocument();
    expect(dot.querySelector('span')).toHaveClass('bg-warning');
  });

  it('renders a yellow pulsing dot when reconnecting', () => {
    setStatus('reconnecting');
    render(<ConnectionStatusIndicator />);
    const dot = screen.getByTitle('Reconnecting...');
    expect(dot).toBeInTheDocument();
    expect(dot.querySelector('span')).toHaveClass('bg-warning');
  });

  it('renders a red dot when disconnected', () => {
    setStatus('disconnected');
    render(<ConnectionStatusIndicator />);
    const dot = screen.getByTitle('Disconnected');
    expect(dot).toBeInTheDocument();
    expect(dot.querySelector('span')).toHaveClass('bg-destructive');
  });

  it('applies pulse animation for connecting and reconnecting states', () => {
    setStatus('reconnecting');
    render(<ConnectionStatusIndicator />);
    const dot = screen.getByTitle('Reconnecting...');
    expect(dot.querySelector('span')).toHaveClass('animate-pulse');
  });

  it('does not apply pulse animation for connected state', () => {
    setStatus('connected');
    render(<ConnectionStatusIndicator />);
    const dot = screen.getByTitle('Connected');
    expect(dot.querySelector('span')).not.toHaveClass('animate-pulse');
  });
});
