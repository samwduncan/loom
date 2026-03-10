import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCommandPaletteShortcut } from './useCommandPaletteShortcut';
import { useUIStore } from '@/stores/ui';

function fireKeydown(options: Partial<KeyboardEventInit> & { target?: HTMLElement } = {}) {
  const { target, ...eventInit } = options;
  const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...eventInit });
  (target ?? document).dispatchEvent(event);
  return event;
}

describe('useCommandPaletteShortcut', () => {
  beforeEach(() => {
    useUIStore.getState().reset();
  });

  it('toggles commandPaletteOpen on Cmd+K', () => {
    renderHook(() => useCommandPaletteShortcut());

    expect(useUIStore.getState().commandPaletteOpen).toBe(false);
    fireKeydown({ metaKey: true, code: 'KeyK' });
    expect(useUIStore.getState().commandPaletteOpen).toBe(true);
    fireKeydown({ metaKey: true, code: 'KeyK' });
    expect(useUIStore.getState().commandPaletteOpen).toBe(false);
  });

  it('toggles commandPaletteOpen on Ctrl+K', () => {
    renderHook(() => useCommandPaletteShortcut());

    fireKeydown({ ctrlKey: true, code: 'KeyK' });
    expect(useUIStore.getState().commandPaletteOpen).toBe(true);
  });

  it('does nothing when K is pressed without modifier', () => {
    renderHook(() => useCommandPaletteShortcut());

    fireKeydown({ code: 'KeyK' });
    expect(useUIStore.getState().commandPaletteOpen).toBe(false);
  });

  it('does nothing when focus is inside [data-terminal]', () => {
    renderHook(() => useCommandPaletteShortcut());

    const terminal = document.createElement('div');
    terminal.setAttribute('data-terminal', '');
    const input = document.createElement('input');
    terminal.appendChild(input);
    document.body.appendChild(terminal);

    fireKeydown({ metaKey: true, code: 'KeyK', target: input });
    expect(useUIStore.getState().commandPaletteOpen).toBe(false);

    document.body.removeChild(terminal);
  });

  it('does nothing when focus is inside [data-codemirror]', () => {
    renderHook(() => useCommandPaletteShortcut());

    const editor = document.createElement('div');
    editor.setAttribute('data-codemirror', '');
    const input = document.createElement('textarea');
    editor.appendChild(input);
    document.body.appendChild(editor);

    fireKeydown({ metaKey: true, code: 'KeyK', target: input });
    expect(useUIStore.getState().commandPaletteOpen).toBe(false);

    document.body.removeChild(editor);
  });

  it('cleans up listener on unmount', () => {
    const { unmount } = renderHook(() => useCommandPaletteShortcut());

    unmount();
    fireKeydown({ metaKey: true, code: 'KeyK' });
    expect(useUIStore.getState().commandPaletteOpen).toBe(false);
  });
});
