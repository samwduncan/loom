/**
 * Tests for native-plugins.ts -- Capacitor Keyboard plugin initialization.
 *
 * Uses _resetForTesting() to reset module state between tests (follows
 * websocket-init.ts precedent). Does NOT use vi.resetModules() which is brittle
 * with module-scoped state.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// vi.hoisted() runs BEFORE vi.mock hoisting, so these refs are available in mock factories.
const { platformMock, mockKeyboard, mockKeyboardResize } = vi.hoisted(() => ({
  platformMock: { IS_NATIVE: false },
  mockKeyboard: {
    setResizeMode: vi.fn().mockResolvedValue(undefined),
    setAccessoryBarVisible: vi.fn().mockResolvedValue(undefined),
  },
  mockKeyboardResize: { None: 'none' },
}));

vi.mock('@/lib/platform', () => platformMock);

vi.mock('@capacitor/keyboard', () => ({
  Keyboard: mockKeyboard,
  KeyboardResize: mockKeyboardResize,
}));

import {
  initializeNativePlugins,
  getKeyboardModule,
  _resetForTesting,
} from '@/lib/native-plugins';

describe('native-plugins', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    _resetForTesting();
    platformMock.IS_NATIVE = false;
    mockKeyboard.setResizeMode.mockClear();
    mockKeyboard.setAccessoryBarVisible.mockClear();
    document.documentElement.removeAttribute('data-native');
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('skips init when IS_NATIVE is false', async () => {
    platformMock.IS_NATIVE = false;
    await initializeNativePlugins();

    expect(mockKeyboard.setResizeMode).not.toHaveBeenCalled();
    expect(mockKeyboard.setAccessoryBarVisible).not.toHaveBeenCalled();
    expect(document.documentElement.hasAttribute('data-native')).toBe(false);
  });

  it('initializes Keyboard plugin on native', async () => {
    platformMock.IS_NATIVE = true;
    await initializeNativePlugins();

    expect(mockKeyboard.setResizeMode).toHaveBeenCalledWith({ mode: 'none' });
    expect(mockKeyboard.setAccessoryBarVisible).toHaveBeenCalledWith({ isVisible: true });
  });

  it('sets data-native attribute on document', async () => {
    platformMock.IS_NATIVE = true;
    await initializeNativePlugins();

    expect(document.documentElement.getAttribute('data-native')).toBe('');
  });

  it('handles Keyboard plugin load failure gracefully', async () => {
    platformMock.IS_NATIVE = true;

    // Override the mock to reject on next call
    mockKeyboard.setResizeMode.mockRejectedValueOnce(new Error('Plugin unavailable'));

    await initializeNativePlugins();

    // Should not throw -- error is caught and warned
    expect(warnSpy).toHaveBeenCalledWith(
      '[native-plugins] Keyboard plugin failed to load:',
      expect.any(Error),
    );
    // Module should be null after failure
    expect(getKeyboardModule()).toBe(null);
  });

  it('double init guard prevents second initialization', async () => {
    platformMock.IS_NATIVE = true;
    await initializeNativePlugins();
    await initializeNativePlugins();

    expect(mockKeyboard.setResizeMode).toHaveBeenCalledTimes(1);
  });

  it('nativePluginsReady resolves after successful init', async () => {
    platformMock.IS_NATIVE = true;
    await initializeNativePlugins();

    const { nativePluginsReady: ready } = await import('@/lib/native-plugins');
    // Should resolve without hanging
    await expect(ready).resolves.toBeUndefined();
  });

  it('nativePluginsReady resolves even on init failure', async () => {
    platformMock.IS_NATIVE = true;
    mockKeyboard.setResizeMode.mockRejectedValueOnce(new Error('Crash'));

    await initializeNativePlugins();

    const { nativePluginsReady: ready } = await import('@/lib/native-plugins');
    // Should resolve even when init failed (finally block)
    await expect(ready).resolves.toBeUndefined();
  });
});
