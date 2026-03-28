/**
 * useKeyboardOffset -- platform-aware keyboard offset hook.
 *
 * On native (Capacitor): listens to keyboardWillShow/keyboardWillHide events
 * from the Capacitor Keyboard plugin, sets --keyboard-offset CSS variable.
 *
 * On web: relocates the visualViewport resize/scroll hack from ChatComposer.tsx,
 * computing keyboard height from viewport size difference.
 *
 * Both paths set document.documentElement.style --keyboard-offset, which is
 * consumed by .app-shell and .composer-safe-area CSS rules.
 *
 * Decisions: D-02, D-06, D-10, D-12, D-13, D-14, D-15, D-16, D-19
 * Constitution: Named exports only (2.2), no default export.
 */

import { useEffect } from 'react';
import type { RefObject } from 'react';
import { IS_NATIVE } from '@/lib/platform';
import { getKeyboardModule, nativePluginsReady } from '@/lib/native-plugins';

/** Options for the useKeyboardOffset hook. */
interface UseKeyboardOffsetOptions {
  /** Ref to the scroll container for keyboard-open scroll coordination. */
  scrollContainerRef?: RefObject<HTMLElement | null>;
}

/**
 * Sets the `--keyboard-offset` CSS variable on `<html>` based on keyboard state.
 *
 * On native: uses Capacitor Keyboard plugin events (keyboardWillShow/keyboardWillHide).
 * On web: uses visualViewport resize events as a fallback.
 *
 * Scroll coordination: when the keyboard opens and the scroll container was at the
 * bottom, auto-scrolls to bottom (smooth) so the latest message stays visible.
 * When the keyboard closes, no auto-scroll occurs (D-16).
 *
 * @param options - Optional scroll container ref for scroll coordination
 */
export function useKeyboardOffset(options?: UseKeyboardOffsetOptions): void {
  useEffect(() => {
    if (IS_NATIVE) {
      return setupNativeKeyboard(options);
    }
    return setupWebFallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/**
 * Native keyboard path: Capacitor Keyboard plugin events.
 *
 * Awaits nativePluginsReady to avoid cold-start race where React mounts
 * before the dynamic import resolves. Uses a `cancelled` flag to prevent
 * async listener registration after fast unmount (StrictMode / navigation).
 */
function setupNativeKeyboard(
  options?: UseKeyboardOffsetOptions,
): (() => void) | undefined {
  let cancelled = false;

  // PluginListenerHandle shape from @capacitor/core
  type Handle = { remove: () => void | Promise<void> };
  let showHandle: Handle | null = null;
  let hideHandle: Handle | null = null;

  void (async () => {
    // Wait for native-plugins.ts init to complete (dynamic import + config)
    await nativePluginsReady;

    const mod = getKeyboardModule();
    if (!mod || cancelled) {
      // Plugin failed to load or component unmounted during await -- fall back to web
      if (!cancelled) {
        const webCleanup = setupWebFallback();
        // Stash cleanup so the outer return function can call it
        showHandle = { remove: () => webCleanup() };
      }
      return;
    }

    const { Keyboard } = mod;

    showHandle = await Keyboard.addListener('keyboardWillShow', (info) => {
      // D-14: Check if user is at bottom of scroll container BEFORE changing offset
      const el = options?.scrollContainerRef?.current;
      const isAtBottom = el
        ? el.scrollHeight - el.scrollTop - el.clientHeight < 150
        : false;

      // D-06, D-19: Set offset directly from native event height (no CSS transition)
      document.documentElement.style.setProperty(
        '--keyboard-offset',
        `${info.keyboardHeight}px`,
      );

      // D-15: Scroll to bottom if was at bottom, using rAF for layout settlement
      if (isAtBottom) {
        requestAnimationFrame(() => {
          const scrollEl = options?.scrollContainerRef?.current;
          if (scrollEl) {
            scrollEl.scrollTo({ top: scrollEl.scrollHeight, behavior: 'smooth' });
          }
        });
      }
    });

    hideHandle = await Keyboard.addListener('keyboardWillHide', () => {
      // Reset offset -- iOS animates the keyboard natively
      document.documentElement.style.setProperty('--keyboard-offset', '0px');
      // D-16: Do NOT auto-scroll on keyboard close
    });

    // If unmount happened while we were awaiting, clean up immediately
    if (cancelled) {
      showHandle.remove();
      hideHandle.remove();
    }
  })();

  return () => {
    cancelled = true;
    showHandle?.remove();
    hideHandle?.remove();
  };
}

/**
 * Web fallback path: visualViewport resize/scroll events.
 *
 * Relocated from ChatComposer.tsx lines 213-251.
 * Computes keyboard height from viewport size difference and sets
 * --keyboard-offset CSS variable. Includes anti-scroll hack (D-13).
 */
function setupWebFallback(): () => void {
  const vv = window.visualViewport;
  if (!vv) return () => {};

  const fullHeight = vv.height;

  function handleResize(): void {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const keyboardHeight = fullHeight - viewport.height;
    document.documentElement.style.setProperty(
      '--keyboard-offset',
      keyboardHeight > 50 ? `${keyboardHeight}px` : '0px',
    );

    // D-13: Prevent iOS WKWebView from translating the viewport on focus
    window.scrollTo(0, 0);
  }

  function handleScroll(): void {
    if (window.scrollY !== 0) window.scrollTo(0, 0);
  }

  vv.addEventListener('resize', handleResize);
  vv.addEventListener('scroll', handleScroll);
  window.addEventListener('scroll', handleScroll, { passive: true });

  return () => {
    vv.removeEventListener('resize', handleResize);
    vv.removeEventListener('scroll', handleScroll);
    window.removeEventListener('scroll', handleScroll);
  };
}
