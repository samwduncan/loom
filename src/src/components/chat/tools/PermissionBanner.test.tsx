/**
 * PermissionBanner tests -- inline permission request banner.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PermissionBanner } from './PermissionBanner';
import { useStreamStore } from '@/stores/stream';
import type { PermissionRequest } from '@/stores/stream';

// Mock wsClient
const mockSend = vi.fn().mockReturnValue(true);
vi.mock('@/lib/websocket-client', () => ({
  wsClient: {
    send: (...args: unknown[]) => mockSend(...args),
  },
}));

function setPermission(request: PermissionRequest | null) {
  useStreamStore.setState({ activePermissionRequest: request });
}

function makeRequest(overrides?: Partial<PermissionRequest>): PermissionRequest {
  return {
    requestId: 'pr-1',
    toolName: 'Bash',
    input: { command: 'npm test' },
    sessionId: 'session-1',
    receivedAt: Date.now(),
    ...overrides,
  };
}

describe('PermissionBanner', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    useStreamStore.getState().reset();
    mockSend.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders banner when permission request exists with matching session', () => {
    setPermission(makeRequest());
    render(<PermissionBanner sessionId="session-1" />);
    expect(screen.getByTestId('permission-banner')).toBeInTheDocument();
    expect(screen.getByText('Bash')).toBeInTheDocument();
  });

  it('does not render when session does not match', () => {
    setPermission(makeRequest({ sessionId: 'other-session' }));
    render(<PermissionBanner sessionId="session-1" />);
    expect(screen.queryByTestId('permission-banner')).not.toBeInTheDocument();
  });

  it('does not render when no permission request', () => {
    render(<PermissionBanner sessionId="session-1" />);
    expect(screen.queryByTestId('permission-banner')).not.toBeInTheDocument();
  });

  it('Allow button sends permission response with allow:true', async () => {
    setPermission(makeRequest());
    render(<PermissionBanner sessionId="session-1" />);

    const allowBtn = screen.getByRole('button', { name: /allow/i });
    await userEvent.click(allowBtn);

    expect(mockSend).toHaveBeenCalledWith({
      type: 'claude-permission-response',
      requestId: 'pr-1',
      allow: true,
    });
  });

  it('Deny button sends permission response with allow:false', async () => {
    setPermission(makeRequest());
    render(<PermissionBanner sessionId="session-1" />);

    const denyBtn = screen.getByRole('button', { name: /deny/i });
    await userEvent.click(denyBtn);

    expect(mockSend).toHaveBeenCalledWith({
      type: 'claude-permission-response',
      requestId: 'pr-1',
      allow: false,
    });
  });

  it('banner dismissed after Allow click', async () => {
    setPermission(makeRequest());
    render(<PermissionBanner sessionId="session-1" />);

    const allowBtn = screen.getByRole('button', { name: /allow/i });
    await userEvent.click(allowBtn);

    expect(useStreamStore.getState().activePermissionRequest).toBeNull();
  });

  it('shows correct tool-aware preview for Bash tool', () => {
    setPermission(makeRequest({ toolName: 'Bash', input: { command: 'rm -rf /tmp/test' } }));
    render(<PermissionBanner sessionId="session-1" />);
    expect(screen.getByText(/rm -rf \/tmp\/test/)).toBeInTheDocument();
  });

  it('shows correct tool-aware preview for Write tool', () => {
    setPermission(makeRequest({ toolName: 'Write', input: { file_path: '/home/test.ts' } }));
    render(<PermissionBanner sessionId="session-1" />);
    expect(screen.getByText(/\/home\/test.ts/)).toBeInTheDocument();
  });

  it('countdown displays remaining seconds', () => {
    setPermission(makeRequest({ receivedAt: Date.now() }));
    render(<PermissionBanner sessionId="session-1" />);
    // Should show ~55 seconds initially
    expect(screen.getByText('55')).toBeInTheDocument();
  });

  it('countdown decrements over time', () => {
    setPermission(makeRequest({ receivedAt: Date.now() }));
    render(<PermissionBanner sessionId="session-1" />);

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.getByText('52')).toBeInTheDocument();
  });
});
