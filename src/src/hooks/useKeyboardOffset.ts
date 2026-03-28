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
import { IS_NATIVE } from '@/lib/platform';

/**
 * Sets the `--keyboard-offset` CSS variable on `<html>` based on keyboard state.
 *
 * On native: no-op. WKWebView's default Body resize handles keyboard avoidance
 * automatically — the web view shrinks when the keyboard opens.
 *
 * On web: uses visualViewport resize events to compute keyboard height and set
 * --keyboard-offset, which .app-shell consumes via padding-bottom.
 */
export function useKeyboardOffset(): void {
  useEffect(() => {
    // Native: WKWebView's default Body resize handles keyboard avoidance.
    // No manual --keyboard-offset needed — the web view shrinks automatically.
    if (IS_NATIVE) return;
    return setupWebFallback();
  }, []);
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
