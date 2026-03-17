/**
 * useQuickSettingsShortcut tests -- Cmd+, / Ctrl+, global keyboard shortcut.
 *
 * Verifies the shortcut fires callback, respects modifier requirements,
 * and skips terminal/codemirror contexts.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useQuickSettingsShortcut } from './useQuickSettingsShortcut';

function fireKeydown(opts: Partial<KeyboardEvent> & { code: string }) {
  const event = new KeyboardEvent('keydown', {
    bubbles: true,
    cancelable: true,
    ...opts,
  });
  document.dispatchEvent(event);
}

describe('useQuickSettingsShortcut', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Cmd+Comma fires callback', () => {
    const cb = vi.fn();
    renderHook(() => useQuickSettingsShortcut(cb));
    fireKeydown({ code: 'Comma', metaKey: true });
    expect(cb).toHaveBeenCalledOnce();
  });

  it('Ctrl+Comma fires callback (non-Mac)', () => {
    const cb = vi.fn();
    renderHook(() => useQuickSettingsShortcut(cb));
    fireKeydown({ code: 'Comma', ctrlKey: true });
    expect(cb).toHaveBeenCalledOnce();
  });

  it('plain Comma does NOT fire callback', () => {
    const cb = vi.fn();
    renderHook(() => useQuickSettingsShortcut(cb));
    fireKeydown({ code: 'Comma' });
    expect(cb).not.toHaveBeenCalled();
  });

  it('skips when target is inside [data-terminal]', () => {
    const cb = vi.fn();
    renderHook(() => useQuickSettingsShortcut(cb));

    const container = document.createElement('div');
    container.setAttribute('data-terminal', '');
    const input = document.createElement('input');
    container.appendChild(input);
    document.body.appendChild(container);

    const event = new KeyboardEvent('keydown', {
      code: 'Comma',
      metaKey: true,
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(event, 'target', { value: input });
    document.dispatchEvent(event);

    expect(cb).not.toHaveBeenCalled();
    document.body.removeChild(container);
  });

  it('skips when target is inside [data-codemirror]', () => {
    const cb = vi.fn();
    renderHook(() => useQuickSettingsShortcut(cb));

    const container = document.createElement('div');
    container.setAttribute('data-codemirror', '');
    const input = document.createElement('input');
    container.appendChild(input);
    document.body.appendChild(container);

    const event = new KeyboardEvent('keydown', {
      code: 'Comma',
      metaKey: true,
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(event, 'target', { value: input });
    document.dispatchEvent(event);

    expect(cb).not.toHaveBeenCalled();
    document.body.removeChild(container);
  });
});
