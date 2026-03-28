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
  // Mock visualViewport for web path tests
  let mockViewport: {
    height: number;
    addEventListener: ReturnType<typeof vi.fn>;
    removeEventListener: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    setPropertySpy.mockClear();

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
  // Native uses WKWebView's default Body resize — no manual keyboard offset.

  describe('native path', () => {
    beforeEach(() => {
      platformMock.IS_NATIVE = true;
      nativePluginsMock.getKeyboardModule.mockReturnValue({ Keyboard: mockKeyboard });
    });

    it('is a no-op on native — WKWebView handles keyboard resize', async () => {
      const { useKeyboardOffset } = await importHook();
      renderHook(() => useKeyboardOffset());

      await act(async () => {
        await nativePluginsMock.nativePluginsReady;
      });

      // Should NOT register any keyboard listeners — WKWebView Body resize handles it
      expect(mockKeyboard.addListener).not.toHaveBeenCalled();
      // Should NOT set --keyboard-offset
      expect(setPropertySpy).not.toHaveBeenCalled();
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
        resizeHandler!(); // ASSERT: resize handler registered by setupWebFallback
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
        resizeHandler!(); // ASSERT: resize handler registered by setupWebFallback
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
        resizeHandler!(); // ASSERT: resize handler registered by setupWebFallback
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

  // Native path is a no-op — no fallback or offset behavior to test.
  // WKWebView Body resize handles keyboard avoidance natively.
});
