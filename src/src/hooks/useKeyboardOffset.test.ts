/**
 * Tests for useKeyboardOffset -- platform-aware keyboard offset hook.
 *
 * Tests both native (Capacitor Keyboard events) and web (visualViewport) paths.
 * Uses vi.hoisted() pattern for mock objects referenced in vi.mock factories.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';

// Hoisted mocks: vi.hoisted runs before vi.mock factory functions,
// so these objects are available for the mock factory closures.
const { platformMock, nativePluginsMock, mockKeyboard } = vi.hoisted(() => {
  const mockKeyboard = {
    addListener: vi.fn(),
    removeAllListeners: vi.fn(),
  };

  return {
    platformMock: { IS_NATIVE: false },
    nativePluginsMock: {
      getKeyboardModule: vi.fn(() => null as unknown),
      nativePluginsReady: Promise.resolve(),
    },
    mockKeyboard,
  };
});

vi.mock('@/lib/platform', () => platformMock);
vi.mock('@/lib/native-plugins', () => nativePluginsMock);

// Mock document.documentElement.style.setProperty
const setPropertySpy = vi.spyOn(document.documentElement.style, 'setProperty');

// Mock requestAnimationFrame to fire synchronously in tests
vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
  cb(0);
  return 0;
});

describe('useKeyboardOffset', () => {
  // Store captured callbacks for native path tests
  let showCallback: ((info: { keyboardHeight: number }) => void) | null = null;
  let hideCallback: (() => void) | null = null;

  // Mock visualViewport for web path tests
  let mockViewport: {
    height: number;
    addEventListener: ReturnType<typeof vi.fn>;
    removeEventListener: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    setPropertySpy.mockClear();
    showCallback = null;
    hideCallback = null;

    // Default: web mode
    platformMock.IS_NATIVE = false;
    nativePluginsMock.getKeyboardModule.mockReturnValue(null);
    nativePluginsMock.nativePluginsReady = Promise.resolve();

    // Mock visualViewport
    mockViewport = {
      height: 800,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    vi.stubGlobal('visualViewport', mockViewport);

    // Mock window.scrollTo
    vi.stubGlobal('scrollTo', vi.fn());

    // Setup native keyboard mock for tests that need it
    mockKeyboard.addListener.mockImplementation(
      (event: string, cb: (...args: unknown[]) => void) => {
        if (event === 'keyboardWillShow') showCallback = cb as typeof showCallback;
        if (event === 'keyboardWillHide') hideCallback = cb as typeof hideCallback;
        return Promise.resolve({ remove: vi.fn() });
      },
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    // Re-stub rAF after unstub
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    });
  });

  // Helper to import hook fresh (module state depends on mocks set before import)
  async function importHook() {
    return import('./useKeyboardOffset');
  }

  // ── Native Path Tests ─────────────────────────────────────────────────

  describe('native path', () => {
    beforeEach(() => {
      platformMock.IS_NATIVE = true;
      nativePluginsMock.getKeyboardModule.mockReturnValue({ Keyboard: mockKeyboard });
    });

    it('sets --keyboard-offset to "{height}px" on keyboardWillShow', async () => {
      const { useKeyboardOffset } = await importHook();
      renderHook(() => useKeyboardOffset());

      // Wait for async setup (nativePluginsReady + addListener)
      await act(async () => {
        await nativePluginsMock.nativePluginsReady;
        await vi.dynamicImportSettled?.() ?? Promise.resolve();
      });

      expect(showCallback).not.toBeNull();
      act(() => {
        showCallback!({ keyboardHeight: 346 });
      });

      expect(setPropertySpy).toHaveBeenCalledWith('--keyboard-offset', '346px');
    });

    it('sets --keyboard-offset to "0px" on keyboardWillHide', async () => {
      const { useKeyboardOffset } = await importHook();
      renderHook(() => useKeyboardOffset());

      await act(async () => {
        await nativePluginsMock.nativePluginsReady;
      });

      expect(hideCallback).not.toBeNull();
      act(() => {
        hideCallback!();
      });

      expect(setPropertySpy).toHaveBeenCalledWith('--keyboard-offset', '0px');
    });

    it('scrolls to bottom on keyboardWillShow when scroll was at bottom', async () => {
      const mockScrollEl = {
        scrollHeight: 1000,
        scrollTop: 850,
        clientHeight: 150,
        scrollTo: vi.fn(),
      };
      const scrollRef = { current: mockScrollEl as unknown as HTMLDivElement };

      const { useKeyboardOffset } = await importHook();
      renderHook(() => useKeyboardOffset({ scrollContainerRef: scrollRef }));

      await act(async () => {
        await nativePluginsMock.nativePluginsReady;
      });

      act(() => {
        showCallback!({ keyboardHeight: 346 });
      });

      // scrollHeight - scrollTop - clientHeight = 1000 - 850 - 150 = 0 < 150 -> at bottom
      expect(mockScrollEl.scrollTo).toHaveBeenCalledWith({
        top: mockScrollEl.scrollHeight,
        behavior: 'smooth',
      });
    });

    it('does NOT scroll to bottom on keyboardWillShow when scroll was NOT at bottom', async () => {
      const mockScrollEl = {
        scrollHeight: 1000,
        scrollTop: 200,
        clientHeight: 150,
        scrollTo: vi.fn(),
      };
      const scrollRef = { current: mockScrollEl as unknown as HTMLDivElement };

      const { useKeyboardOffset } = await importHook();
      renderHook(() => useKeyboardOffset({ scrollContainerRef: scrollRef }));

      await act(async () => {
        await nativePluginsMock.nativePluginsReady;
      });

      act(() => {
        showCallback!({ keyboardHeight: 346 });
      });

      // scrollHeight - scrollTop - clientHeight = 1000 - 200 - 150 = 650 > 150 -> NOT at bottom
      expect(mockScrollEl.scrollTo).not.toHaveBeenCalled();
    });

    it('does NOT auto-scroll on keyboardWillHide (D-16)', async () => {
      const mockScrollEl = {
        scrollHeight: 1000,
        scrollTop: 850,
        clientHeight: 150,
        scrollTo: vi.fn(),
      };
      const scrollRef = { current: mockScrollEl as unknown as HTMLDivElement };

      const { useKeyboardOffset } = await importHook();
      renderHook(() => useKeyboardOffset({ scrollContainerRef: scrollRef }));

      await act(async () => {
        await nativePluginsMock.nativePluginsReady;
      });

      act(() => {
        hideCallback!();
      });

      expect(mockScrollEl.scrollTo).not.toHaveBeenCalled();
    });

    it('cleans up Capacitor event listeners on unmount', async () => {
      const removeShow = vi.fn();
      const removeHide = vi.fn();
      mockKeyboard.addListener.mockImplementation(
        (event: string, cb: (...args: unknown[]) => void) => {
          if (event === 'keyboardWillShow') showCallback = cb as typeof showCallback;
          if (event === 'keyboardWillHide') hideCallback = cb as typeof hideCallback;
          return Promise.resolve({
            remove: event === 'keyboardWillShow' ? removeShow : removeHide,
          });
        },
      );

      const { useKeyboardOffset } = await importHook();
      const { unmount } = renderHook(() => useKeyboardOffset());

      await act(async () => {
        await nativePluginsMock.nativePluginsReady;
      });

      unmount();

      expect(removeShow).toHaveBeenCalled();
      expect(removeHide).toHaveBeenCalled();
    });

    it('handles null scrollContainerRef without errors', async () => {
      const scrollRef = { current: null };

      const { useKeyboardOffset } = await importHook();
      renderHook(() =>
        useKeyboardOffset({ scrollContainerRef: scrollRef as React.RefObject<HTMLDivElement | null> }),
      );

      await act(async () => {
        await nativePluginsMock.nativePluginsReady;
      });

      // Should not throw
      expect(() => {
        act(() => {
          showCallback!({ keyboardHeight: 346 });
        });
      }).not.toThrow();

      // Offset is still set
      expect(setPropertySpy).toHaveBeenCalledWith('--keyboard-offset', '346px');
    });
  });

  // ── Web Fallback Path Tests ───────────────────────────────────────────

  describe('web fallback', () => {
    it('sets --keyboard-offset based on visualViewport height difference', async () => {
      const { useKeyboardOffset } = await importHook();
      renderHook(() => useKeyboardOffset());

      // Get the resize handler that was registered
      expect(mockViewport.addEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
      const resizeHandler = mockViewport.addEventListener.mock.calls.find(
        (c: unknown[]) => c[0] === 'resize',
      )?.[1] as (() => void) | undefined;

      // Simulate keyboard opening: viewport shrinks from 800 to 400
      mockViewport.height = 400;
      act(() => {
        resizeHandler!();
      });

      // fullHeight (800) - current height (400) = 400 > 50
      expect(setPropertySpy).toHaveBeenCalledWith('--keyboard-offset', '400px');
    });

    it('sets --keyboard-offset to "0px" when height difference <= 50', async () => {
      const { useKeyboardOffset } = await importHook();
      renderHook(() => useKeyboardOffset());

      const resizeHandler = mockViewport.addEventListener.mock.calls.find(
        (c: unknown[]) => c[0] === 'resize',
      )?.[1] as (() => void) | undefined;

      // Simulate small resize (not a keyboard): height changes by only 30
      mockViewport.height = 770;
      act(() => {
        resizeHandler!();
      });

      // fullHeight (800) - current height (770) = 30 <= 50
      expect(setPropertySpy).toHaveBeenCalledWith('--keyboard-offset', '0px');
    });

    it('calls window.scrollTo(0, 0) on resize (anti-scroll hack, D-13)', async () => {
      const { useKeyboardOffset } = await importHook();
      renderHook(() => useKeyboardOffset());

      const resizeHandler = mockViewport.addEventListener.mock.calls.find(
        (c: unknown[]) => c[0] === 'resize',
      )?.[1] as (() => void) | undefined;

      mockViewport.height = 400;
      act(() => {
        resizeHandler!();
      });

      expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
    });

    it('cleans up visualViewport event listeners on unmount', async () => {
      const { useKeyboardOffset } = await importHook();
      const { unmount } = renderHook(() => useKeyboardOffset());

      unmount();

      expect(mockViewport.removeEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
      expect(mockViewport.removeEventListener).toHaveBeenCalledWith('scroll', expect.any(Function));
    });
  });

  // ── Fallback when Plugin Fails ────────────────────────────────────────

  describe('native with plugin failure', () => {
    it('falls back to web when getKeyboardModule() returns null', async () => {
      platformMock.IS_NATIVE = true;
      nativePluginsMock.getKeyboardModule.mockReturnValue(null);

      const { useKeyboardOffset } = await importHook();
      renderHook(() => useKeyboardOffset());

      await act(async () => {
        await nativePluginsMock.nativePluginsReady;
      });

      // Should have set up visualViewport listeners as fallback
      expect(mockViewport.addEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
    });
  });

  // ── Undefined scrollContainerRef ──────────────────────────────────────

  describe('undefined scrollContainerRef', () => {
    it('handles keyboard open without errors when scrollContainerRef is undefined', async () => {
      platformMock.IS_NATIVE = true;
      nativePluginsMock.getKeyboardModule.mockReturnValue({ Keyboard: mockKeyboard });

      const { useKeyboardOffset } = await importHook();
      renderHook(() => useKeyboardOffset());

      await act(async () => {
        await nativePluginsMock.nativePluginsReady;
      });

      // Should not throw -- no scrollContainerRef passed
      expect(() => {
        act(() => {
          showCallback!({ keyboardHeight: 346 });
        });
      }).not.toThrow();

      expect(setPropertySpy).toHaveBeenCalledWith('--keyboard-offset', '346px');
    });
  });
});
