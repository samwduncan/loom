/**
 * ConnectionBanner tests — error banner and reconnection overlay.
 *
 * Tests verify correct rendering for each connection state combination.
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the connection store
const mockUseConnectionStore = vi.fn();
vi.mock('@/stores/connection', () => ({
  useConnectionStore: (selector: (s: unknown) => unknown) =>
    selector(mockUseConnectionStore()),
}));

// Mock wsClient
vi.mock('@/lib/websocket-client', () => ({
  wsClient: { tryReconnect: vi.fn() },
}));

import { ConnectionBanner } from './ConnectionBanner';

function setConnectionState(status: string, error: string | null = null, reconnectAttempts = 0) {
  mockUseConnectionStore.mockReturnValue({
    providers: {
      claude: { status, error, reconnectAttempts, lastConnected: null, modelId: null },
      codex: { status: 'disconnected', error: null, reconnectAttempts: 0, lastConnected: null, modelId: null },
      gemini: { status: 'disconnected', error: null, reconnectAttempts: 0, lastConnected: null, modelId: null },
    },
  });
}

describe('ConnectionBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when connected', () => {
    setConnectionState('connected');
    const { container } = render(<ConnectionBanner />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when initially connecting', () => {
    setConnectionState('connecting');
    const { container } = render(<ConnectionBanner />);
    expect(container.firstChild).toBeNull();
  });

  it('renders error banner when disconnected with error', () => {
    setConnectionState('disconnected', 'Backend process crashed');
    render(<ConnectionBanner />);
    expect(screen.getByText(/Backend process crashed/)).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renders reconnection overlay with attempt count', () => {
    setConnectionState('reconnecting', null, 3);
    render(<ConnectionBanner />);
    expect(screen.getByText(/Reconnecting/)).toBeInTheDocument();
    expect(screen.getByText(/Attempt 3/)).toBeInTheDocument();
  });

  it('renders connection lost banner with reconnect button when disconnected without error', () => {
    setConnectionState('disconnected', null);
    render(<ConnectionBanner />);
    expect(screen.getByText(/Connection lost/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reconnect/i })).toBeInTheDocument();
  });

  it('calls wsClient.tryReconnect when reconnect button is clicked', async () => {
    const { wsClient } = await import('@/lib/websocket-client');
    setConnectionState('disconnected', null);
    render(<ConnectionBanner />);
    const button = screen.getByRole('button', { name: /Reconnect/i });
    button.click();
    expect(wsClient.tryReconnect).toHaveBeenCalled();
  });

  it('error banner includes the error message from the store', () => {
    setConnectionState('disconnected', 'Server returned 500');
    render(<ConnectionBanner />);
    expect(screen.getByText(/Server returned 500/)).toBeInTheDocument();
  });
});
