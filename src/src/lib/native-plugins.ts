/**
 * Native plugin initialization -- configures Capacitor plugins at app startup.
 *
 * Called once from main.tsx before React mounts. On native (Capacitor),
 * dynamically imports @capacitor/keyboard, @capacitor/status-bar,
 * @capacitor/splash-screen, and @capacitor/haptics. On web, this is a no-op.
 *
 * The dynamic imports ensure native-only packages are never bundled in the web build.
 *
 * Constitution: Named exports only (2.2), no default export.
 */

import { IS_NATIVE } from '@/lib/platform';
import { setHapticsModule } from '@/lib/haptics';
import { useConnectionStore } from '@/stores/connection';

/** The dynamically imported @capacitor/keyboard module, or null on web / failure. */
type KeyboardModule = typeof import('@capacitor/keyboard') | null;

/** The dynamically imported @capacitor/splash-screen module, or null on web / failure. */
type SplashModule = typeof import('@capacitor/splash-screen') | null;

/** Double-init guard -- prevents redundant initialization from React strict mode. */
let isInitialized = false;

/** Cached reference to the dynamically imported @capacitor/keyboard module. */
let keyboardModule: KeyboardModule = null;

/** Cached reference to the dynamically imported @capacitor/splash-screen module. */
let splashModule: SplashModule = null;

/** Fallback timer ID for splash dismiss -- cleared on connection or reset. */
let splashFallbackTimer: ReturnType<typeof setTimeout> | null = null;

/** Resolve function for the readiness promise. */
let resolveReady: () => void;

/**
 * Promise that resolves once native plugin initialization completes (success or failure).
 *
 * Downstream hooks (e.g., useKeyboardOffset) can await this before reading
 * getKeyboardModule() to avoid a cold-start race where React mounts before
 * the dynamic import resolves.
 */
export let nativePluginsReady: Promise<void> = new Promise<void>((resolve) => {
  resolveReady = resolve;
});

/**
 * Returns the dynamically imported @capacitor/keyboard module, or null
 * if running on web or if the import failed.
 *
 * @returns The keyboard module or null
 */
export function getKeyboardModule(): KeyboardModule {
  return keyboardModule;
}

/**
 * Reset module state for testing. Follows the websocket-init.ts precedent
 * of exposing a test reset function instead of relying on vi.resetModules().
 *
 * Resets the init guard, clears the cached modules, clears pending timers,
 * and re-creates the readiness promise so each test starts fresh.
 */
export function _resetForTesting(): void {
  isInitialized = false;
  keyboardModule = null;
  splashModule = null;
  setHapticsModule(null);
  if (splashFallbackTimer !== null) {
    clearTimeout(splashFallbackTimer);
    splashFallbackTimer = null;
  }
  nativePluginsReady = new Promise<void>((resolve) => {
    resolveReady = resolve;
  });
}

/**
 * Initialize native Capacitor plugins.
 *
 * On native platforms:
 * 1. Sets the `data-native` attribute on `<html>` for CSS conditional styling
 * 2. Dynamically imports @capacitor/keyboard and configures resize mode + accessory bar
 * 3. Dynamically imports @capacitor/status-bar and sets dark style with app background
 * 4. Dynamically imports @capacitor/splash-screen and caches module for hideSplashWhenReady()
 * 5. Dynamically imports @capacitor/haptics and injects module into haptics.ts via setHapticsModule()
 *
 * On web, this is a no-op that returns immediately.
 *
 * SS-7: Each plugin has its own try/catch -- failure in one does NOT affect others.
 * Errors are caught and logged -- a failed plugin should not crash the app.
 */
export async function initializeNativePlugins(): Promise<void> {
  if (isInitialized || !IS_NATIVE) {
    resolveReady();
    return;
  }
  isInitialized = true;

  // Mark the document for CSS conditional styling (D-08).
  // Must be set before React renders so CSS rules are active on first paint.
  document.documentElement.setAttribute('data-native', '');

  try {
    // --- Keyboard plugin (separate try/catch -- SS-7) ---
    try {
      const mod = await import('@capacitor/keyboard');
      keyboardModule = mod;

      const { Keyboard } = mod;

      // Let WKWebView handle keyboard avoidance natively (default Body resize).
      // Previously used KeyboardResize.None + manual --keyboard-offset, but this
      // causes an intermittent race condition on real devices where setResizeMode()
      // fires async after mount, breaking the layout. Native resize is reliable.

      // D-18: Show the iOS input accessory bar (Done button) for text inputs.
      await Keyboard.setAccessoryBarVisible({ isVisible: true });
    } catch (err: unknown) {
      console.warn('[native-plugins] Keyboard plugin failed to load:', err);
      keyboardModule = null;
    }

    // --- StatusBar plugin (separate try/catch -- SS-7) ---
    try {
      const { StatusBar, Style } = await import('@capacitor/status-bar');
      await StatusBar.setStyle({ style: Style.Dark });
      // setBackgroundColor is Android-only — skip on iOS to avoid console warning
    } catch (err: unknown) {
      console.warn('[native-plugins] StatusBar plugin failed to load:', err);
    }

    // --- SplashScreen plugin (separate try/catch -- SS-7) ---
    try {
      splashModule = await import('@capacitor/splash-screen');
    } catch (err: unknown) {
      console.warn('[native-plugins] SplashScreen plugin failed to load:', err);
      splashModule = null;
    }

    // --- Haptics plugin (separate try/catch -- SS-7) ---
    try {
      const hapticsMod = await import('@capacitor/haptics');
      setHapticsModule(hapticsMod);
    } catch (err: unknown) {
      console.warn('[native-plugins] Haptics plugin failed to load:', err);
      setHapticsModule(null);
    }
  } finally {
    resolveReady();
  }
}

/**
 * Hide the splash screen when the WebSocket connection is established.
 *
 * SS-2: Awaits nativePluginsReady before checking splashModule to avoid
 * the cold-start race where initializeNativePlugins() hasn't resolved yet.
 *
 * SS-1: Uses the one-argument subscribe form on useConnectionStore because
 * the store uses only `persist` middleware, NOT `subscribeWithSelector`.
 * The two-argument form silently fails.
 *
 * D-10: Falls back to hiding after 3 seconds even if connection never reaches 'connected'.
 */
export async function hideSplashWhenReady(): Promise<void> {
  if (!IS_NATIVE) return;

  // SS-2: Wait for plugins to finish loading before checking splashModule.
  // initializeNativePlugins() is fire-and-forget from main.tsx, so splashModule
  // may still be null when this function is called.
  await nativePluginsReady;

  if (!splashModule) return;

  let dismissed = false;
  // Declare before dismiss() to avoid temporal dead zone if code is reordered.
  let unsubscribe: () => void = () => {};

  const dismiss = () => {
    if (dismissed) return;
    dismissed = true;
    splashModule?.SplashScreen.hide({ fadeOutDuration: 300 });
    unsubscribe();
    if (splashFallbackTimer !== null) {
      clearTimeout(splashFallbackTimer);
      splashFallbackTimer = null;
    }
  };

  // SS-1: One-argument subscribe form. The store uses `persist` middleware only,
  // NOT `subscribeWithSelector`. The two-argument form silently fails.
  unsubscribe = useConnectionStore.subscribe((state) => {
    if (state.providers.claude.status === 'connected') dismiss();
  });

  // Check current state immediately (connection may already be established)
  // eslint-disable-next-line loom/no-external-store-mutation -- startup utility, not a component
  const currentState = useConnectionStore.getState();
  if (currentState.providers.claude.status === 'connected') {
    dismiss();
    return;
  }

  // D-10: Fallback timeout -- hide after 3s even if connection fails
  splashFallbackTimer = setTimeout(dismiss, 3000);
}
