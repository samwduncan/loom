/**
 * TerminalOverlay tests.
 *
 * Verifies disconnected overlay, reconnect button, and auth URL banner.
 */

import { render, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, afterEach } from 'vitest';
import { TerminalOverlay } from './TerminalOverlay';

describe('TerminalOverlay', () => {
  const baseProps = {
    visible: false,
    onReconnect: vi.fn(),
    authUrl: null,
    onDismissAuth: vi.fn(),
  };

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders nothing when visible=false and authUrl=null', () => {
    const { container } = render(<TerminalOverlay {...baseProps} />);
    expect(container.innerHTML).toBe('');
  });

  it('shows "Session ended" and Reconnect button when visible=true', () => {
    const { getByText, getByTestId } = render(
      <TerminalOverlay {...baseProps} visible={true} />,
    );
    expect(getByText('Session ended')).toBeInTheDocument();
    expect(getByTestId('reconnect-button')).toBeInTheDocument();
  });

  it('calls onReconnect when Reconnect button clicked', async () => {
    const user = userEvent.setup();
    const onReconnect = vi.fn();
    const { getByTestId } = render(
      <TerminalOverlay {...baseProps} visible={true} onReconnect={onReconnect} />,
    );

    await user.click(getByTestId('reconnect-button'));
    expect(onReconnect).toHaveBeenCalledOnce();
  });

  it('renders auth URL banner when authUrl is set', () => {
    const { getByTestId } = render(
      <TerminalOverlay
        {...baseProps}
        authUrl={{ url: 'https://example.com/auth', autoOpen: false }}
      />,
    );
    expect(getByTestId('auth-url-banner')).toBeInTheDocument();
    const link = getByTestId('auth-url-link');
    expect(link).toHaveAttribute('href', 'https://example.com/auth');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('auth URL link opens in new tab', () => {
    const { getByTestId } = render(
      <TerminalOverlay
        {...baseProps}
        authUrl={{ url: 'https://example.com/auth', autoOpen: false }}
      />,
    );
    const link = getByTestId('auth-url-link');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('dismiss button calls onDismissAuth', async () => {
    const user = userEvent.setup();
    const onDismissAuth = vi.fn();
    const { getByTestId } = render(
      <TerminalOverlay
        {...baseProps}
        authUrl={{ url: 'https://example.com/auth', autoOpen: false }}
        onDismissAuth={onDismissAuth}
      />,
    );

    await user.click(getByTestId('dismiss-auth'));
    expect(onDismissAuth).toHaveBeenCalledOnce();
  });

  it('auto-opens URL when autoOpen is true', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    render(
      <TerminalOverlay
        {...baseProps}
        authUrl={{ url: 'https://example.com/auth', autoOpen: true }}
      />,
    );
    expect(openSpy).toHaveBeenCalledWith('https://example.com/auth', '_blank');
    openSpy.mockRestore();
  });

  it('blocks javascript: URLs from auto-opening', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    const { container } = render(
      <TerminalOverlay
        {...baseProps}
        authUrl={{ url: 'javascript:alert(1)', autoOpen: true }}
      />,
    );
    expect(openSpy).not.toHaveBeenCalled();
    // Unsafe URLs should not render the banner at all
    expect(container.innerHTML).toBe('');
    openSpy.mockRestore();
  });

  it('blocks data: URLs from rendering in banner', () => {
    const { container } = render(
      <TerminalOverlay
        {...baseProps}
        authUrl={{ url: 'data:text/html,<script>alert(1)</script>', autoOpen: false }}
      />,
    );
    expect(container.innerHTML).toBe('');
  });
});
