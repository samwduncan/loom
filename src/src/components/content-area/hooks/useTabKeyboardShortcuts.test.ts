/**
 * useTabKeyboardShortcuts tests -- verifies keyboard shortcut handling.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTabKeyboardShortcuts } from './useTabKeyboardShortcuts';

// Mock useUIStore
const mockSetActiveTab = vi.fn();
vi.mock('@/stores/ui', () => ({
  useUIStore: {
    getState: () => ({
      setActiveTab: mockSetActiveTab,
    }),
  },
}));

function fireKeydown(options: KeyboardEventInit) {
  const event = new KeyboardEvent('keydown', { ...options, bubbles: true, cancelable: true });
  document.dispatchEvent(event);
  return event;
}

describe('useTabKeyboardShortcuts', () => {
  beforeEach(() => {
    mockSetActiveTab.mockClear();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('Cmd+Digit1 fires setActiveTab("chat")', () => {
    renderHook(() => useTabKeyboardShortcuts());
    fireKeydown({ code: 'Digit1', metaKey: true });
    expect(mockSetActiveTab).toHaveBeenCalledWith('chat');
  });

  it('Cmd+Digit2 fires setActiveTab("files")', () => {
    renderHook(() => useTabKeyboardShortcuts());
    fireKeydown({ code: 'Digit2', metaKey: true });
    expect(mockSetActiveTab).toHaveBeenCalledWith('files');
  });

  it('Cmd+Digit3 fires setActiveTab("shell")', () => {
    renderHook(() => useTabKeyboardShortcuts());
    fireKeydown({ code: 'Digit3', metaKey: true });
    expect(mockSetActiveTab).toHaveBeenCalledWith('shell');
  });

  it('Cmd+Digit4 fires setActiveTab("git")', () => {
    renderHook(() => useTabKeyboardShortcuts());
    fireKeydown({ code: 'Digit4', metaKey: true });
    expect(mockSetActiveTab).toHaveBeenCalledWith('git');
  });

  it('Ctrl+Digit1 also works (Linux/Windows)', () => {
    renderHook(() => useTabKeyboardShortcuts());
    fireKeydown({ code: 'Digit1', ctrlKey: true });
    expect(mockSetActiveTab).toHaveBeenCalledWith('chat');
  });

  it('plain Digit1 (no meta) does NOT trigger tab switch', () => {
    renderHook(() => useTabKeyboardShortcuts());
    fireKeydown({ code: 'Digit1' });
    expect(mockSetActiveTab).not.toHaveBeenCalled();
  });

  it('does NOT trigger when target is inside [data-terminal]', () => {
    const terminalEl = document.createElement('div');
    terminalEl.setAttribute('data-terminal', '');
    const inputEl = document.createElement('textarea');
    terminalEl.appendChild(inputEl);
    document.body.appendChild(terminalEl);

    renderHook(() => useTabKeyboardShortcuts());

    // Dispatch from the textarea inside the terminal element
    const event = new KeyboardEvent('keydown', {
      code: 'Digit1',
      metaKey: true,
      bubbles: true,
      cancelable: true,
    });
    inputEl.dispatchEvent(event);
    expect(mockSetActiveTab).not.toHaveBeenCalled();
  });

  it('does NOT trigger when target is inside [data-codemirror]', () => {
    const cmEl = document.createElement('div');
    cmEl.setAttribute('data-codemirror', '');
    const inputEl = document.createElement('div');
    cmEl.appendChild(inputEl);
    document.body.appendChild(cmEl);

    renderHook(() => useTabKeyboardShortcuts());

    const event = new KeyboardEvent('keydown', {
      code: 'Digit1',
      metaKey: true,
      bubbles: true,
      cancelable: true,
    });
    inputEl.dispatchEvent(event);
    expect(mockSetActiveTab).not.toHaveBeenCalled();
  });

  it('cleans up event listener on unmount', () => {
    const spy = vi.spyOn(document, 'removeEventListener');
    const { unmount } = renderHook(() => useTabKeyboardShortcuts());
    unmount();
    expect(spy).toHaveBeenCalledWith('keydown', expect.any(Function));
    spy.mockRestore();
  });
});
