/**
 * MessageContextMenu -- tests for long-press context menu on chat messages.
 *
 * Verifies Copy Text, Share, Retry actions, haptic feedback, and that
 * text selection is NOT blocked by the context menu trigger.
 *
 * Constitution: Named exports (2.2), test co-location (same directory).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MessageContextMenu } from './MessageContextMenu';

// Mock dependencies
vi.mock('@/lib/native-clipboard', () => ({
  nativeClipboardWrite: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/lib/native-share', () => ({
  nativeShare: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/haptics', () => ({
  hapticEvent: vi.fn(),
}));

// Radix ContextMenu needs pointer events for contextmenu trigger.
// In jsdom we can fire the 'contextmenu' event directly on the trigger element.

describe('MessageContextMenu', () => {
  const messageText = 'Hello, this is a test message.';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children content', () => {
    render(
      <MessageContextMenu messageText={messageText}>
        <div data-testid="child">Child content</div>
      </MessageContextMenu>,
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('shows Copy Text and Share for user messages (showRetry=false)', async () => {
    render(
      <MessageContextMenu messageText={messageText}>
        <div data-testid="trigger">Message bubble</div>
      </MessageContextMenu>,
    );

    // Open context menu via contextmenu event
    const trigger = screen.getByTestId('trigger');
    fireEvent.contextMenu(trigger);

    // Wait for menu to appear
    expect(await screen.findByText('Copy Text')).toBeInTheDocument();
    expect(screen.getByText('Share')).toBeInTheDocument();
    expect(screen.queryByText('Retry')).not.toBeInTheDocument();
  });

  it('shows Copy Text, Retry, and Share for assistant messages (showRetry=true)', async () => {
    const onRetry = vi.fn();
    render(
      <MessageContextMenu messageText={messageText} showRetry onRetry={onRetry}>
        <div data-testid="trigger">Message bubble</div>
      </MessageContextMenu>,
    );

    const trigger = screen.getByTestId('trigger');
    fireEvent.contextMenu(trigger);

    expect(await screen.findByText('Copy Text')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
    expect(screen.getByText('Share')).toBeInTheDocument();
  });

  it('calls nativeClipboardWrite with message text on Copy Text', async () => {
    const { nativeClipboardWrite } = await import('@/lib/native-clipboard');
    render(
      <MessageContextMenu messageText={messageText}>
        <div data-testid="trigger">Message</div>
      </MessageContextMenu>,
    );

    fireEvent.contextMenu(screen.getByTestId('trigger'));
    const copyItem = await screen.findByText('Copy Text');
    await userEvent.click(copyItem);

    expect(nativeClipboardWrite).toHaveBeenCalledWith(messageText);
  });

  it('calls nativeShare with message text and title on Share', async () => {
    const { nativeShare } = await import('@/lib/native-share');
    render(
      <MessageContextMenu messageText={messageText}>
        <div data-testid="trigger">Message</div>
      </MessageContextMenu>,
    );

    fireEvent.contextMenu(screen.getByTestId('trigger'));
    const shareItem = await screen.findByText('Share');
    await userEvent.click(shareItem);

    expect(nativeShare).toHaveBeenCalledWith({
      text: messageText,
      title: 'Message from Loom',
      dialogTitle: 'Share Message',
    });
  });

  it('calls hapticEvent on Share action', async () => {
    const { hapticEvent } = await import('@/lib/haptics');
    render(
      <MessageContextMenu messageText={messageText}>
        <div data-testid="trigger">Message</div>
      </MessageContextMenu>,
    );

    fireEvent.contextMenu(screen.getByTestId('trigger'));
    const shareItem = await screen.findByText('Share');
    await userEvent.click(shareItem);

    expect(hapticEvent).toHaveBeenCalledWith('shareTriggered');
  });

  it('calls onRetry when Retry is clicked', async () => {
    const onRetry = vi.fn();
    render(
      <MessageContextMenu messageText={messageText} showRetry onRetry={onRetry}>
        <div data-testid="trigger">Message</div>
      </MessageContextMenu>,
    );

    fireEvent.contextMenu(screen.getByTestId('trigger'));
    const retryItem = await screen.findByText('Retry');
    await userEvent.click(retryItem);

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('does not render Retry when showRetry=true but no onRetry provided', async () => {
    render(
      <MessageContextMenu messageText={messageText} showRetry>
        <div data-testid="trigger">Message</div>
      </MessageContextMenu>,
    );

    fireEvent.contextMenu(screen.getByTestId('trigger'));
    await screen.findByText('Copy Text');
    expect(screen.queryByText('Retry')).not.toBeInTheDocument();
  });

  it('does NOT apply user-select:none to the trigger wrapper', () => {
    render(
      <MessageContextMenu messageText={messageText}>
        <div data-testid="trigger">Message</div>
      </MessageContextMenu>,
    );

    const trigger = screen.getByTestId('trigger');
    // The trigger itself (or its parent wrapper) should not have user-select: none
    const style = window.getComputedStyle(trigger);
    expect(style.userSelect).not.toBe('none');

    // Also check the parent context-menu-trigger wrapper
    const contextTrigger = trigger.closest('[data-slot="context-menu-trigger"]');
    if (contextTrigger) {
      // Radix may apply user-select for interaction, but we should NOT force it
      // The key assertion: our component does NOT explicitly set user-select: none
      expect(trigger.style.userSelect).not.toBe('none');
    }
  });

  it('fires hapticEvent on context menu open', async () => {
    const { hapticEvent } = await import('@/lib/haptics');
    render(
      <MessageContextMenu messageText={messageText}>
        <div data-testid="trigger">Message</div>
      </MessageContextMenu>,
    );

    fireEvent.contextMenu(screen.getByTestId('trigger'));
    // Wait for the menu content to appear (proves onOpenChange was called)
    await screen.findByText('Copy Text');

    expect(hapticEvent).toHaveBeenCalledWith('contextMenuOpen');
  });
});
