# Phase 60: Keyboard & Composer - Research

**Researched:** 2026-03-28
**Domain:** iOS Capacitor Keyboard plugin integration, WKWebView keyboard avoidance, CSS variable-driven layout
**Confidence:** HIGH

## Summary

Phase 60 replaces the fragile `visualViewport` hack in ChatComposer.tsx (lines 213-251) with native Capacitor Keyboard plugin events for reliable iOS keyboard avoidance. The existing `--keyboard-offset` CSS variable pattern stays -- only the signal source changes from `visualViewport.resize` to `keyboardWillShow`/`keyboardWillHide` native events.

The `@capacitor/keyboard@7.0.6` plugin is the correct version for the project's `@capacitor/core@7.6.1`. It provides `keyboardWillShow` (with `keyboardHeight` in pixels) and `keyboardWillHide` events, plus `setResizeMode({ mode: KeyboardResize.None })` to prevent WKWebView from auto-resizing. The plugin has NO web implementation -- calling any method on web throws "Keyboard does not have web implementation" -- so dynamic import behind `IS_NATIVE` is mandatory.

**Primary recommendation:** Install `@capacitor/keyboard@^7.0.6`, create `native-plugins.ts` for module-level init (resize mode + accessory bar), create `useKeyboardOffset()` hook that branches on IS_NATIVE (Capacitor events vs visualViewport fallback), and strip the inline visualViewport effect from ChatComposer.tsx.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Create `src/src/lib/native-plugins.ts` -- module-level initialization for Capacitor plugins, called before React mounts (same pattern as `initializeWebSocket()` in `websocket-init.ts`)
- **D-02:** Create `useKeyboardOffset()` hook -- platform-aware abstraction that internally branches: Capacitor Keyboard events on native, visualViewport fallback on web
- **D-03:** Dynamic import `@capacitor/keyboard` inside `native-plugins.ts` -- tree-shaken from web builds, no bundle impact
- **D-04:** If Capacitor Keyboard plugin fails to load, log the error and fall back to visualViewport silently -- no user-facing failure
- **D-05:** ChatComposer.tsx removes its inline visualViewport effect (lines 213-251) and calls `useKeyboardOffset()` instead -- platform-unaware
- **D-06:** On native: set `--keyboard-offset` directly from `keyboardWillShow` event height with NO CSS transition
- **D-07:** On web: keep current 100ms ease-out CSS transition on `--keyboard-offset`
- **D-08:** CSS transition property on `.app-shell` padding-bottom should be conditional: remove on native, keep on web
- **D-09:** Investigate Capacitor Keyboard event's exposed `duration` parameter during research (ANSWER: none -- KeyboardInfo only contains `keyboardHeight: number`)
- **D-10:** All IS_NATIVE branching for keyboard confined to `useKeyboardOffset()` hook and `native-plugins.ts` -- nowhere else
- **D-11:** ChatComposer.tsx and composer.css remain fully platform-unaware
- **D-12:** Existing visualViewport code from ChatComposer.tsx moves into `useKeyboardOffset()` as web fallback
- **D-13:** `window.scrollTo(0, 0)` anti-scroll behavior also moves into the hook
- **D-14:** Auto-scroll to latest message ONLY if `useScrollAnchor.isAtBottom` was true before keyboard opened
- **D-15:** Coordinate with `useScrollAnchor` by checking `isAtBottom` before keyboard animation, then triggering `scrollToBottom()` if appropriate
- **D-16:** When keyboard closes, do NOT auto-scroll
- **D-17:** Set `Keyboard.setResizeMode({ mode: KeyboardResize.None })` during native-plugins init
- **D-18:** Set `Keyboard.setAccessoryBarVisible({ isVisible: true })`
- **D-19:** Listen to `keyboardWillShow` (not `keyboardDidShow`) for pre-animation offset, and `keyboardWillHide` for dismiss
- **D-20:** On keyboard open: `--keyboard-offset` replaces safe-area-inset-bottom (don't stack both)
- **D-21:** On keyboard close: `--keyboard-offset` returns to 0, safe-area-inset-bottom takes over via CSS `calc()`
- **D-22:** Test on notched devices (iPhone 16 Pro Max) -- safe area + keyboard must not cause a layout jump

### Claude's Discretion
- Internal structure of `useKeyboardOffset()` hook (useEffect vs useLayoutEffect, cleanup patterns)
- Whether to add the keyboard offset to Zustand UI store vs keep as DOM-only CSS variable
- Unit test structure for the hook (mock Capacitor vs integration)
- JSDoc depth on native-plugins.ts
- Whether `handleScroll` anti-bounce from current hack is needed on native with resize mode `none`

### Deferred Ideas (OUT OF SCOPE)
- Zustand atom for keyboard height (evaluate after basic hook approach ships)
- Haptic feedback on keyboard open/close -- Phase 62 scope
- Android keyboard handling differences -- future if Android Capacitor target added
- ESLint rule preventing visualViewport access outside useKeyboardOffset
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| KEY-01 | Capacitor Keyboard plugin provides reliable keyboard height events on iOS | `@capacitor/keyboard@7.0.6` confirmed: `keyboardWillShow` event provides `{ keyboardHeight: number }`. Plugin is native iOS-only, well-maintained. |
| KEY-02 | Keyboard avoidance uses native `keyboardWillShow`/`keyboardWillHide` events instead of visualViewport hack | Events confirmed in API: `keyboardWillShow` fires before animation (iOS), `keyboardWillHide` fires before dismiss (no height param). Web fallback via visualViewport preserved. |
| KEY-03 | Composer slides smoothly with keyboard animation, maintaining CSS `--keyboard-offset` pattern | No CSS transition needed on native -- iOS drives the animation. `--keyboard-offset` already wired into `.app-shell` and `.composer-safe-area`. Research confirms: CSS transition on top of native creates double-animation lag. |
| KEY-04 | Message list auto-scrolls to latest message when keyboard opens | `useScrollAnchor.isAtBottom` + `scrollToBottom()` available. Hook should check `isAtBottom` state before setting offset, then scroll if was-at-bottom. |
| KEY-05 | Keyboard resize mode set to `none` -- WKWebView doesn't auto-resize | `Keyboard.setResizeMode({ mode: KeyboardResize.None })` confirmed. Must be called during init, before any keyboard interaction. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @capacitor/keyboard | 7.0.6 | Native keyboard events, resize mode control | Official Capacitor plugin for keyboard, compatible with @capacitor/core 7.6.1 |
| @capacitor/core | 7.6.1 (existing) | Plugin runtime, type definitions | Already installed as devDependency |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none) | - | - | No additional packages needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @capacitor/keyboard v7 | @capacitor/keyboard v8 | v8 requires @capacitor/core 8.x and Xcode 26+ -- incompatible with project's Capacitor 7.6.1 and Xcode 16 constraint |
| Capacitor Keyboard plugin | Custom WKWebView plugin | No reason to hand-roll -- official plugin covers all needs |

**Installation:**
```bash
cd src && npm install @capacitor/keyboard@^7.0.6 && npx cap sync ios
```

**Version verification:** `@capacitor/keyboard@7.0.6` is the latest v7 release (verified 2026-03-28 via npm registry). Peer dependency: `@capacitor/core >= 7.0.0`.

## Architecture Patterns

### Files to Create
```
src/src/
  lib/
    native-plugins.ts     # Module-level Capacitor plugin init (before React mounts)
  hooks/
    useKeyboardOffset.ts  # Platform-aware keyboard offset hook
    useKeyboardOffset.test.ts  # Unit tests
```

### Files to Modify
```
src/src/
  main.tsx                                    # Add initializeNativePlugins() call
  components/chat/composer/ChatComposer.tsx    # Remove visualViewport effect, call useKeyboardOffset()
  styles/base.css                             # Conditional CSS transition on .app-shell
  components/chat/composer/composer.css        # Safe area + keyboard offset interaction
```

### Pattern 1: Module-Level Plugin Init (native-plugins.ts)

**What:** Initialize Capacitor plugins before React mounts, same pattern as `initializeWebSocket()`.
**When to use:** Plugin configuration that must happen once at app startup.

```typescript
// Source: CONTEXT.md D-01, D-03, D-17, D-18; verified against websocket-init.ts pattern
import { IS_NATIVE } from '@/lib/platform';

let isInitialized = false;

export async function initializeNativePlugins(): Promise<void> {
  if (isInitialized || !IS_NATIVE) return;
  isInitialized = true;

  try {
    const { Keyboard, KeyboardResize } = await import('@capacitor/keyboard');

    // KEY-05: Prevent WKWebView from auto-resizing viewport
    await Keyboard.setResizeMode({ mode: KeyboardResize.None });

    // D-18: Show standard iOS input accessory bar (Done button)
    await Keyboard.setAccessoryBarVisible({ isVisible: true });
  } catch (err) {
    // D-04: Silent fallback -- visualViewport hack will handle keyboard
    console.warn('[native-plugins] Keyboard plugin init failed:', err);
  }
}
```

### Pattern 2: Platform-Aware Hook (useKeyboardOffset.ts)

**What:** Single hook that provides keyboard offset to CSS, branching internally on IS_NATIVE.
**When to use:** Any component that needs keyboard avoidance -- currently only ChatComposer.

```typescript
// Source: CONTEXT.md D-02, D-06, D-10, D-12, D-14, D-15
import { useEffect, useRef } from 'react';
import { IS_NATIVE } from '@/lib/platform';

interface UseKeyboardOffsetOptions {
  /** Ref to check if scroll is at bottom (for auto-scroll on keyboard open) */
  isAtBottom?: boolean;
  /** Callback to scroll to bottom when keyboard opens and was at bottom */
  scrollToBottom?: () => void;
}

export function useKeyboardOffset(options?: UseKeyboardOffsetOptions): void {
  const wasAtBottomRef = useRef(false);

  useEffect(() => {
    if (IS_NATIVE) {
      // Native path: Capacitor Keyboard events
      let showHandle: { remove: () => Promise<void> } | null = null;
      let hideHandle: { remove: () => Promise<void> } | null = null;

      (async () => {
        try {
          const { Keyboard } = await import('@capacitor/keyboard');

          showHandle = await Keyboard.addListener('keyboardWillShow', (info) => {
            wasAtBottomRef.current = options?.isAtBottom ?? false;
            document.documentElement.style.setProperty(
              '--keyboard-offset', `${info.keyboardHeight}px`
            );
            if (wasAtBottomRef.current) {
              options?.scrollToBottom?.();
            }
          });

          hideHandle = await Keyboard.addListener('keyboardWillHide', () => {
            document.documentElement.style.setProperty('--keyboard-offset', '0px');
            // D-16: Do NOT auto-scroll on keyboard close
          });
        } catch {
          // Fall through to web fallback below
          setupWebFallback();
        }
      })();

      return () => {
        showHandle?.remove();
        hideHandle?.remove();
      };
    } else {
      // Web path: visualViewport fallback (moved from ChatComposer.tsx)
      return setupWebFallback();
    }
  }, [/* stable -- mount once */]);
}
```

### Pattern 3: Conditional CSS Transition via Data Attribute

**What:** Use a `data-native` attribute on `<html>` to conditionally remove the padding-bottom transition on native.
**When to use:** When CSS behavior must differ between native and web without JS per-frame intervention.

```css
/* base.css -- conditional transition */
@media (max-width: 767px) {
  .app-shell {
    padding-bottom: var(--keyboard-offset, 0px);
    transition: padding-bottom 100ms ease-out;
  }
  /* D-06, D-08: No transition on native -- iOS drives the animation */
  html[data-native] .app-shell {
    transition: none;
  }
}
```

Set in `native-plugins.ts`:
```typescript
document.documentElement.setAttribute('data-native', '');
```

### Anti-Patterns to Avoid
- **CSS transition on native keyboard offset:** iOS animates the keyboard natively at ~250ms with a spring curve. Adding a CSS transition creates double-animation: the offset jumps to final value while the keyboard is still sliding up, or lags behind. Result: visible flicker/jank.
- **Using `keyboardDidShow` instead of `keyboardWillShow`:** `keyboardDidShow` fires AFTER the keyboard is fully visible, causing a delayed layout jump. `keyboardWillShow` fires before animation starts, allowing synchronization.
- **Stacking safe-area-inset-bottom and keyboard-offset:** When the keyboard is open, it covers the home indicator area. The keyboard height already accounts for that space. Adding `env(safe-area-inset-bottom)` on top creates extra padding. Solution: when keyboard is open, the `--keyboard-offset` value alone is sufficient; when closed, safe-area takes over.
- **Importing @capacitor/keyboard at top level:** The plugin throws "Keyboard does not have web implementation" on web. Must use dynamic `import()` behind `IS_NATIVE` guard to tree-shake from web builds and prevent runtime errors.
- **Multiple visualViewport + Keyboard handlers active simultaneously:** D-10 mandates all branching in one place. If both handlers run, they'll fight over `--keyboard-offset`, causing flickering.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| iOS keyboard height detection | Manual `visualViewport.height` difference calculation | `@capacitor/keyboard` `keyboardWillShow` event | Native events are pre-animation, provide exact height, account for accessory bar and safe area |
| WKWebView resize prevention | Manual viewport meta tag hacks | `Keyboard.setResizeMode({ mode: KeyboardResize.None })` | Native API is the only reliable way to control WKWebView resize behavior |
| Keyboard accessory bar control | CSS hacks or manual WKWebView config | `Keyboard.setAccessoryBarVisible()` | Accessory bar is a native WKWebView property, not a DOM element |
| Platform detection | Custom UserAgent parsing | `IS_NATIVE` from `platform.ts` (existing) | Already built in Phase 59, uses `window.Capacitor` global |

## Common Pitfalls

### Pitfall 1: Keyboard Plugin Throws on Web
**What goes wrong:** Importing `@capacitor/keyboard` and calling any method on web throws "Keyboard does not have web implementation" as a rejected promise.
**Why it happens:** The Capacitor Keyboard plugin has NO web implementation -- it only works on iOS and Android native.
**How to avoid:** Dynamic `import()` inside `IS_NATIVE` guard. Wrap in try/catch for resilience (D-04).
**Warning signs:** Unhandled promise rejection in console on web dev server.

### Pitfall 2: Double-Animation Jank on Native
**What goes wrong:** Composer slides up in two stages -- first a CSS transition, then the iOS native keyboard animation, or they overlap causing visible jank.
**Why it happens:** Adding a CSS `transition: padding-bottom 100ms ease-out` on top of iOS's native ~250ms spring keyboard animation.
**How to avoid:** D-06/D-08: Remove CSS transition on native path. Set `--keyboard-offset` directly, let iOS drive the animation. Use `html[data-native]` CSS selector to conditionally disable transition.
**Warning signs:** Visible two-step movement when tapping into textarea on iOS.

### Pitfall 3: Safe Area Double-Padding
**What goes wrong:** Extra gap appears below composer when keyboard opens on notched devices.
**Why it happens:** `composer-safe-area` CSS has `calc(1rem + env(safe-area-inset-bottom) + var(--keyboard-offset))`. When keyboard opens, `keyboardHeight` already accounts for the home indicator area, so adding `safe-area-inset-bottom` creates double padding.
**How to avoid:** D-20/D-21: When keyboard is open (offset > 0), the `--keyboard-offset` should replace (not add to) `safe-area-inset-bottom`. Simplest approach: CSS `max()` or conditional class.
**Warning signs:** ~34px extra gap at bottom when keyboard is visible on iPhone with notch/Dynamic Island.

### Pitfall 4: Listener Cleanup with Async Handles
**What goes wrong:** Memory leak or stale listeners if `PluginListenerHandle.remove()` isn't called on unmount.
**Why it happens:** `Keyboard.addListener()` returns `Promise<PluginListenerHandle>`. If the component unmounts before the promise resolves, the cleanup function won't have the handle yet.
**How to avoid:** Store handles in a variable scoped to the async IIFE. In cleanup, call `handle?.remove()` (null-safe). Alternatively, use `Keyboard.removeAllListeners()` as a nuclear cleanup option.
**Warning signs:** "keyboardWillShow" handler fires after navigating away from chat view.

### Pitfall 5: `keyboardWillHide` Has No Height Info
**What goes wrong:** Developer expects `keyboardWillHide` callback to receive `{ keyboardHeight: 0 }` but it receives no arguments.
**Why it happens:** Capacitor API design: `keyboardWillHide` and `keyboardDidHide` listeners receive no parameters (only show events include `KeyboardInfo`).
**How to avoid:** In the `keyboardWillHide` handler, always set `--keyboard-offset` to `0px` unconditionally. Don't try to read height from the event.
**Warning signs:** TypeScript error or undefined access in hide handler.

### Pitfall 6: Dynamic Import Blocks First Keyboard Event
**What goes wrong:** First keyboard open has no avoidance because the dynamic import hasn't resolved yet.
**Why it happens:** `useKeyboardOffset()` does a dynamic `import('@capacitor/keyboard')` inside useEffect. If the user taps the textarea before the import resolves, the listener isn't attached yet.
**How to avoid:** Initialize keyboard listeners in `native-plugins.ts` at startup (before React mounts), not lazily in the hook. The hook can read the module from a module-scoped variable set during init.
**Warning signs:** First keyboard open on cold start doesn't slide composer up.

## Code Examples

### Complete native-plugins.ts Pattern
```typescript
// Source: websocket-init.ts pattern + Capacitor Keyboard API docs
import { IS_NATIVE } from '@/lib/platform';

let isInitialized = false;

// Module-scoped Keyboard reference for use by useKeyboardOffset hook
let KeyboardModule: typeof import('@capacitor/keyboard') | null = null;

export function getKeyboardModule() {
  return KeyboardModule;
}

export async function initializeNativePlugins(): Promise<void> {
  if (isInitialized || !IS_NATIVE) return;
  isInitialized = true;

  // Set data attribute for CSS conditional styling
  document.documentElement.setAttribute('data-native', '');

  try {
    KeyboardModule = await import('@capacitor/keyboard');
    const { Keyboard, KeyboardResize } = KeyboardModule;

    await Keyboard.setResizeMode({ mode: KeyboardResize.None });
    await Keyboard.setAccessoryBarVisible({ isVisible: true });
  } catch (err) {
    console.warn('[native-plugins] Keyboard plugin failed to load:', err);
    KeyboardModule = null;
  }
}
```

### main.tsx Integration Point
```typescript
// Source: existing main.tsx line 9
import { initializeWebSocket } from '@/lib/websocket-init';
import { initializeNativePlugins } from '@/lib/native-plugins';

// Fire-and-forget init BEFORE React render tree mounts.
void initializeNativePlugins();
void initializeWebSocket();
```

### useKeyboardOffset Hook with Scroll Coordination
```typescript
// Source: CONTEXT.md D-02, D-14, D-15, D-19
import { useEffect, useRef } from 'react';
import { IS_NATIVE } from '@/lib/platform';
import { getKeyboardModule } from '@/lib/native-plugins';

interface UseKeyboardOffsetOptions {
  isAtBottom: boolean;
  scrollToBottom: () => void;
}

export function useKeyboardOffset(options: UseKeyboardOffsetOptions): void {
  // Capture isAtBottom in a ref so the Capacitor listener (non-React) reads current value
  const isAtBottomRef = useRef(options.isAtBottom);
  isAtBottomRef.current = options.isAtBottom;

  const scrollToBottomRef = useRef(options.scrollToBottom);
  scrollToBottomRef.current = options.scrollToBottom;

  useEffect(() => {
    if (IS_NATIVE) {
      return setupNativeKeyboard(isAtBottomRef, scrollToBottomRef);
    }
    return setupWebFallback();
  }, []);
}

function setupNativeKeyboard(
  isAtBottomRef: React.RefObject<boolean>,
  scrollToBottomRef: React.RefObject<() => void>,
): (() => void) | undefined {
  const mod = getKeyboardModule();
  if (!mod) {
    // Plugin failed to load during init -- fall back to web
    return setupWebFallback();
  }

  const { Keyboard } = mod;
  let showHandle: { remove: () => Promise<void> } | null = null;
  let hideHandle: { remove: () => Promise<void> } | null = null;

  // Synchronous-looking but handles are resolved quickly
  void (async () => {
    showHandle = await Keyboard.addListener('keyboardWillShow', (info) => {
      document.documentElement.style.setProperty(
        '--keyboard-offset', `${info.keyboardHeight}px`
      );
      // D-14: Auto-scroll only if was at bottom
      if (isAtBottomRef.current) {
        // Small rAF delay lets the layout settle with new offset
        requestAnimationFrame(() => scrollToBottomRef.current());
      }
    });

    hideHandle = await Keyboard.addListener('keyboardWillHide', () => {
      document.documentElement.style.setProperty('--keyboard-offset', '0px');
      // D-16: No auto-scroll on keyboard close
    });
  })();

  return () => {
    showHandle?.remove();
    hideHandle?.remove();
  };
}

function setupWebFallback(): () => void {
  // Moved from ChatComposer.tsx lines 216-251
  const vv = window.visualViewport;
  if (!vv) return () => {};

  const fullHeight = vv.height;

  function handleResize() {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const keyboardHeight = fullHeight - viewport.height;
    document.documentElement.style.setProperty(
      '--keyboard-offset',
      keyboardHeight > 50 ? `${keyboardHeight}px` : '0px',
    );
    window.scrollTo(0, 0);
  }

  function handleScroll() {
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
```

### Safe Area CSS Fix (composer.css)
```css
/* Source: CONTEXT.md D-20, D-21 */
/* When keyboard is open, its height already covers the home indicator area.
   Use max() to pick the larger value, preventing double-padding. */
@supports (padding-bottom: env(safe-area-inset-bottom)) {
  @media (max-width: 767px) {
    .composer-safe-area {
      padding-bottom: calc(1rem + max(env(safe-area-inset-bottom), var(--keyboard-offset, 0px)));
    }
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| visualViewport resize events | Native keyboard plugin events | Capacitor 3+ (2021) | Pre-animation timing, exact height, no calculation needed |
| WKWebView auto-resize (default) | `setResizeMode({ mode: 'none' })` | Capacitor 3+ | Full control over layout -- no viewport unit changes |
| iOS `interactive-widget` meta tag | Not widely supported in WKWebView | 2023+ (Safari only) | Not usable in Capacitor WKWebView context |
| `window.innerHeight` calculation | `keyboardWillShow` height | Always | innerHeight is unreliable in WKWebView -- viewport and innerHeight change together |

**Deprecated/outdated:**
- Capacitor v2 keyboard API (different import path, no TypeScript, no setResizeMode)
- `cordova-plugin-ionic-keyboard` (Cordova predecessor, incompatible with Capacitor 7)

## Open Questions

1. **`handleScroll` anti-bounce on native with resize mode `none`**
   - What we know: The current hack uses `window.scrollTo(0, 0)` on scroll events to prevent WKWebView from translating the viewport when focusing an input. With `KeyboardResize.None`, WKWebView should not resize or translate.
   - What's unclear: Whether WKWebView still attempts viewport translation even with resize mode `none`. Edge cases with Dynamic Island / notch devices.
   - Recommendation: Start WITHOUT the anti-scroll hack on native path. Add it back if testing reveals viewport translation. This is a Claude's Discretion item.

2. **Safe area + keyboard transition moment**
   - What we know: D-20/D-21 require smooth handoff between safe-area-only and keyboard-only.
   - What's unclear: Whether there's a single frame where both are zero (flash of wrong padding) during the transition.
   - Recommendation: Use CSS `max()` approach which handles the handoff atomically -- whichever value is larger wins. No flash possible.

3. **useEffect vs useLayoutEffect for the hook**
   - What we know: `useEffect` fires after paint, `useLayoutEffect` fires before paint but blocks.
   - What's unclear: Whether the async dynamic import inside useEffect creates a visible flash on first mount.
   - Recommendation: Use `useEffect` -- the listener setup is async anyway (dynamic import + `addListener` returns Promise). `useLayoutEffect` would block paint without benefit since the async work can't be synchronous. The `native-plugins.ts` init runs before React mount, so the Keyboard module is already loaded by the time the hook mounts.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 |
| Config file | `src/vite.config.ts` (test section) |
| Quick run command | `cd src && npx vitest run src/src/hooks/useKeyboardOffset.test.ts` |
| Full suite command | `cd src && npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| KEY-01 | Keyboard plugin provides height events | unit (mock Capacitor) | `cd src && npx vitest run src/src/hooks/useKeyboardOffset.test.ts -x` | Wave 0 |
| KEY-02 | Native events used instead of visualViewport | unit (mock IS_NATIVE) | `cd src && npx vitest run src/src/hooks/useKeyboardOffset.test.ts -x` | Wave 0 |
| KEY-03 | Composer slides smoothly (CSS variable set) | unit (assert CSS var) | `cd src && npx vitest run src/src/hooks/useKeyboardOffset.test.ts -x` | Wave 0 |
| KEY-04 | Message list auto-scrolls when keyboard opens | unit (mock scrollToBottom) | `cd src && npx vitest run src/src/hooks/useKeyboardOffset.test.ts -x` | Wave 0 |
| KEY-05 | Resize mode set to none | unit (mock Keyboard.setResizeMode) | `cd src && npx vitest run src/src/lib/native-plugins.test.ts -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `cd src && npx vitest run src/src/hooks/useKeyboardOffset.test.ts src/src/lib/native-plugins.test.ts -x`
- **Per wave merge:** `cd src && npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/src/hooks/useKeyboardOffset.test.ts` -- covers KEY-01 through KEY-04
- [ ] `src/src/lib/native-plugins.test.ts` -- covers KEY-05 (init configuration)
- [ ] Mock setup: `vi.mock('@/lib/platform')` for IS_NATIVE toggle, mock `import('@capacitor/keyboard')` dynamic import

### Test Mocking Strategy

The `@capacitor/keyboard` module has no web implementation, so tests must mock it entirely:

```typescript
// Mock the dynamic import
vi.mock('@capacitor/keyboard', () => ({
  Keyboard: {
    addListener: vi.fn().mockResolvedValue({ remove: vi.fn() }),
    setResizeMode: vi.fn().mockResolvedValue(undefined),
    setAccessoryBarVisible: vi.fn().mockResolvedValue(undefined),
    removeAllListeners: vi.fn().mockResolvedValue(undefined),
  },
  KeyboardResize: {
    Body: 'body',
    Ionic: 'ionic',
    Native: 'native',
    None: 'none',
  },
}));

// Mock platform detection
vi.mock('@/lib/platform', () => ({
  IS_NATIVE: true, // or false for web path tests
}));
```

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| @capacitor/core | Keyboard plugin peer dep | Yes | 7.6.1 | -- |
| @capacitor/keyboard | KEY-01 through KEY-05 | No (must install) | 7.0.6 (target) | -- |
| @capacitor/cli | `cap sync` after install | Yes | 7.6.1 | -- |
| @capacitor/ios | iOS native project | Yes | 7.6.1 | -- |
| iOS project (Xcode) | `cap sync ios` | Yes (src/ios/) | -- | -- |
| Node.js | Build tooling | Yes | 22.22.1 | -- |

**Missing dependencies with no fallback:**
- `@capacitor/keyboard` must be installed (`npm install @capacitor/keyboard@^7.0.6`)

**Missing dependencies with fallback:**
- None

## Sources

### Primary (HIGH confidence)
- [Capacitor Keyboard Plugin API Docs](https://capacitorjs.com/docs/apis/keyboard) -- Full API reference: methods, events, enums, configuration
- [capacitor-plugins GitHub definitions.ts](https://github.com/ionic-team/capacitor-plugins/blob/7.x/keyboard/src/definitions.ts) -- TypeScript types: `KeyboardInfo { keyboardHeight: number }`, `KeyboardResize` enum
- npm registry: `@capacitor/keyboard@7.0.6` -- version verification, peer dependencies

### Secondary (MEDIUM confidence)
- [Smooth keyboard animation blog post](https://www.bar-tech.dev/blog/smooth-keyboard-animation-on-ios-mobile-app-with-capacitor) -- CSS transition strategy, `cubic-bezier(0.32, 0, 0.68, 1) 0.2s` for web, no-transition on native
- [Capacitor GitHub Issue #1919](https://github.com/ionic-team/capacitor/issues/1919) -- Confirms "Keyboard does not have web implementation" error on web
- [Capacitor GitHub Issue #6223](https://github.com/ionic-team/capacitor/issues/6223) -- Black gap when keyboard type changes (resize mode edge case)
- [WebKit Bug #192564](https://bugs.webkit.org/show_bug.cgi?id=192564) -- WKWebView viewport-fit=cover keyboard dismissal regression context

### Tertiary (LOW confidence)
- iOS native keyboard animation timing (~250ms spring) -- widely reported but not officially documented by Capacitor

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- `@capacitor/keyboard@7.0.6` verified against npm, API confirmed against official docs
- Architecture: HIGH -- Pattern matches existing `websocket-init.ts`, all decisions locked in CONTEXT.md
- Pitfalls: HIGH -- Verified against GitHub issues, official docs, and existing codebase analysis

**Research date:** 2026-03-28
**Valid until:** 2026-04-28 (Capacitor 7.x is stable, unlikely to change)
