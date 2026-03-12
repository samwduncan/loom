/**
 * shell-input tests -- register/unregister/sendToShell behavior.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerShellInput, unregisterShellInput, sendToShell } from '@/lib/shell-input';

describe('shell-input', () => {
  beforeEach(() => {
    // Clean up between tests
    unregisterShellInput();
  });

  it('sendToShell returns false when no function is registered', () => {
    expect(sendToShell('test')).toBe(false);
  });

  it('sendToShell returns true and calls the registered function', () => {
    const mockSendInput = vi.fn();
    registerShellInput(mockSendInput);

    expect(sendToShell('ls -la\r')).toBe(true);
    expect(mockSendInput).toHaveBeenCalledWith('ls -la\r');
  });

  it('sendToShell returns false after unregisterShellInput', () => {
    const mockSendInput = vi.fn();
    registerShellInput(mockSendInput);
    unregisterShellInput();

    expect(sendToShell('test')).toBe(false);
    expect(mockSendInput).not.toHaveBeenCalled();
  });

  it('registerShellInput replaces the previous function', () => {
    const first = vi.fn();
    const second = vi.fn();

    registerShellInput(first);
    registerShellInput(second);

    sendToShell('hello');

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith('hello');
  });
});
