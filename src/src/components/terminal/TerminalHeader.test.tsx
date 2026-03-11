/**
 * TerminalHeader tests.
 *
 * Verifies connection state dots, labels, and button behavior.
 */

import { render, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, afterEach } from 'vitest';
import { TerminalHeader } from './TerminalHeader';

describe('TerminalHeader', () => {
  const baseProps = {
    state: 'connected' as const,
    onRestart: vi.fn(),
    onDisconnect: vi.fn(),
  };

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders "Shell" label', () => {
    const { getByText } = render(<TerminalHeader {...baseProps} />);
    expect(getByText('Shell')).toBeInTheDocument();
  });

  it('renders green dot when connected', () => {
    const { getByTestId } = render(
      <TerminalHeader {...baseProps} state="connected" />,
    );
    const dot = getByTestId('connection-dot');
    expect(dot.className).toContain('bg-[var(--status-success)]');
  });

  it('renders yellow pulsing dot when connecting', () => {
    const { getByTestId } = render(
      <TerminalHeader {...baseProps} state="connecting" />,
    );
    const dot = getByTestId('connection-dot');
    expect(dot.className).toContain('bg-[var(--status-warning)]');
    expect(dot.className).toContain('animate-pulse');
  });

  it('renders red dot when disconnected', () => {
    const { getByTestId } = render(
      <TerminalHeader {...baseProps} state="disconnected" />,
    );
    const dot = getByTestId('connection-dot');
    expect(dot.className).toContain('bg-[var(--status-error)]');
  });

  it('calls onRestart when Restart button clicked', async () => {
    const user = userEvent.setup();
    const onRestart = vi.fn();
    const { getByTitle } = render(
      <TerminalHeader {...baseProps} onRestart={onRestart} />,
    );

    await user.click(getByTitle('Restart'));
    expect(onRestart).toHaveBeenCalledOnce();
  });

  it('calls onDisconnect when Disconnect button clicked', async () => {
    const user = userEvent.setup();
    const onDisconnect = vi.fn();
    const { getByTitle } = render(
      <TerminalHeader {...baseProps} onDisconnect={onDisconnect} />,
    );

    await user.click(getByTitle('Disconnect'));
    expect(onDisconnect).toHaveBeenCalledOnce();
  });

  it('disables Disconnect when disconnected', () => {
    const { getByTitle } = render(
      <TerminalHeader {...baseProps} state="disconnected" />,
    );
    expect(getByTitle('Disconnect')).toBeDisabled();
  });

  it('disables both buttons when connecting', () => {
    const { getByTitle } = render(
      <TerminalHeader {...baseProps} state="connecting" />,
    );
    expect(getByTitle('Restart')).toBeDisabled();
    expect(getByTitle('Disconnect')).toBeDisabled();
  });
});
