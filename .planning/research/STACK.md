# Technology Stack: v2.1 "The Mobile"

**Project:** Loom iOS Native Features
**Researched:** 2026-03-27
**Scope:** Capacitor native plugins, 120Hz ProMotion, bundled assets mode

## Recommended Stack Additions

### Capacitor Native Plugins (Production Dependencies)

| Package | Version | Purpose | Why |
|---------|---------|---------|-----|
| `@capacitor/keyboard` | 7.0.6 | Native keyboard height events, show/hide control | Replaces fragile visualViewport hack with reliable `keyboardWillShow`/`keyboardWillHide` events that deliver exact `keyboardHeight` in pixels. The current hack compares `visualViewport.height` against a captured initial height -- this breaks when the viewport is resized for other reasons (rotation, multitasking) and has timing issues with the scroll-reset workaround. |
| `@capacitor/haptics` | 7.0.5 | Taptic Engine feedback on interactions | Provides `impact()`, `notification()`, `vibrate()`, `selectionStart/Changed/End()` mapped to UIKit's UIImpactFeedbackGenerator, UINotificationFeedbackGenerator, and UISelectionFeedbackGenerator. Graceful no-op on devices without Taptic Engine. |
| `@capacitor/status-bar` | 7.0.6 | Status bar style and overlay control | `setStyle(Style.Dark)` matches Loom's dark-only UI. `setOverlaysWebView(true)` allows content to extend behind status bar for immersive feel. Required Info.plist key: `UIViewControllerBasedStatusBarAppearance: YES`. |
| `@capacitor/splash-screen` | 7.0.5 | Native splash screen with fade transition | Controls show/hide timing, fade-in/fade-out duration, auto-hide delay. Prevents white flash during WKWebView initialization. Default auto-hide at 500ms is too fast for Loom's asset loading -- configure `launchAutoHide: false` and call `SplashScreen.hide()` after React mounts. |

All four plugins require `@capacitor/core >=7.0.0` (satisfied by existing 7.6.1).

### Move to Production Dependencies

| Package | Current Location | New Location | Why |
|---------|-----------------|--------------|-----|
| `@capacitor/core` | devDependencies | **dependencies** | Runtime bridge between web app and native APIs. All Capacitor plugin imports resolve through `@capacitor/core` at runtime. Vite bundles it regardless of placement, but semantically it's a runtime dependency -- every plugin call goes through `Capacitor.Plugins` at runtime in the WKWebView. |

### Keep in devDependencies

| Package | Version | Why Stays |
|---------|---------|-----------|
| `@capacitor/cli` | ^7.6.1 | Build/sync tool only, never bundled |
| `@capacitor/ios` | ^7.6.1 | Native platform template, not imported by web code |
| `spring-easing` | ^2.3.3 | Already present. Generates `linear()` CSS easing keyframes from spring physics params. Used at build time or in utility functions -- not a runtime animation engine. |

### No New Dependencies Required

| Capability | Why No Package Needed |
|------------|----------------------|
| 120Hz ProMotion detection | Runtime rAF timestamp measurement (see Architecture section below). No library exists for this. |
| API base URL abstraction | Pure TypeScript utility module -- `getApiBaseUrl()` and `getWsBaseUrl()`. Zero dependencies. |
| CORS for `capacitor://localhost` | Backend change to existing `cors` middleware configuration (already installed). |
| Touch target enforcement | CSS-only changes to existing components. |
| Safe-area refinement | CSS `env()` functions already in use. |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Keyboard handling | `@capacitor/keyboard` plugin | Keep visualViewport hack | The hack captures `fullHeight` once on mount and compares -- breaks on orientation change, multitasking split, and any future viewport resize. The native plugin fires events with exact keyboard height from iOS, which is the ground truth. |
| Status bar | `@capacitor/status-bar` (7.x) | `@capacitor/system-bars` (8.x) | System Bars is Capacitor 8+ only (bundled with core, not yet published to npm). Sticking with 7.x ecosystem. |
| Haptics | `@capacitor/haptics` | `capacitor-haptics` (community) | Official plugin, same API, maintained by Ionic team. Community version offers no advantage. |
| Splash screen | `@capacitor/splash-screen` | Native LaunchScreen.storyboard only | Storyboard alone gives no programmatic control over hide timing. Plugin adds `show()`/`hide()` with fade animation, essential for smooth web-to-native transition. |
| 120Hz detection | rAF timestamp delta measurement | `screen.refreshRate` | `screen.refreshRate` is not available in WKWebView. rAF delta measurement over ~10 frames gives reliable Hz classification (60 vs 120). |
| Spring animation tuning | Adjust existing `motion.ts` constants per device tier | New animation library (Motion/GSAP) | Current architecture uses CSS `linear()` via `spring-easing` + Framer LazyMotion. Adding another animation runtime would violate the tiered animation architecture and bloat bundle. Tune spring configs for high-refresh displays. |
| CORS bypass | Add `capacitor://localhost` to Express CORS whitelist | `@capacitor/core` CapacitorHttp (patches fetch) | CapacitorHttp patches global `fetch` which breaks assumptions in auth.ts and throughout the codebase. Adding one origin to the CORS whitelist is a 1-line change vs patching all HTTP behavior. |

## Capacitor Plugin API Reference

### @capacitor/keyboard (7.0.6)

**Configuration** (in `capacitor.config.ts` under `plugins.Keyboard`):
```typescript
Keyboard: {
  resize: 'none',              // Don't let WKWebView auto-resize
  style: 'dark',               // Match Loom's dark theme
  resizeOnFullScreen: false,    // No resize in fullscreen either
}
```

**KeyboardResize modes (iOS only):**
| Mode | Behavior | Use When |
|------|----------|----------|
| `native` (default) | Resizes entire WKWebView, affects `vh` units | Simple apps that don't need custom keyboard handling |
| `body` | Resizes only `<body>`, viewport unchanged | Apps with fixed headers/footers using viewport units |
| `ionic` | Resizes `<ion-app>` element | Ionic framework apps only |
| **`none`** | No resize at all -- keyboard overlays content | **Use this.** We handle offset ourselves via `--keyboard-offset` CSS variable. |

**Events:**
| Event | Payload | Timing |
|-------|---------|--------|
| `keyboardWillShow` | `{ keyboardHeight: number }` | Before animation starts -- use this for CSS transition |
| `keyboardDidShow` | `{ keyboardHeight: number }` | After animation completes |
| `keyboardWillHide` | `{}` | Before hide animation starts |
| `keyboardDidHide` | `{}` | After hide animation completes |

**Methods:**
| Method | Platform | Description |
|--------|----------|-------------|
| `show()` | Android only | Programmatically show keyboard |
| `hide()` | iOS + Android | Programmatically dismiss keyboard |
| `setAccessoryBarVisible()` | iOS only | Show/hide the toolbar above keyboard |
| `setScroll()` | iOS only | Enable/disable WebView scroll |

**Integration pattern** (replaces current `visualViewport` hack in ChatComposer.tsx:213-249):
```typescript
import { Keyboard } from '@capacitor/keyboard';
import { Capacitor } from '@capacitor/core';

// Only register on native platform
if (Capacitor.isNativePlatform()) {
  Keyboard.addListener('keyboardWillShow', (info) => {
    document.documentElement.style.setProperty(
      '--keyboard-offset', `${info.keyboardHeight}px`
    );
  });
  Keyboard.addListener('keyboardWillHide', () => {
    document.documentElement.style.setProperty('--keyboard-offset', '0px');
  });
}
// Web fallback: keep existing visualViewport listener for mobile Safari
```

**Confidence: HIGH** -- Official Capacitor plugin, well-documented API, `keyboardHeight` is the iOS-reported value from `UIKeyboardFrameEndUserInfoKey`.

### @capacitor/haptics (7.0.5)

**Methods and Use Cases:**

| Method | Parameter | iOS Native Equivalent | Loom Use Case |
|--------|-----------|----------------------|---------------|
| `impact({ style: ImpactStyle.Light })` | Light/Medium/Heavy | UIImpactFeedbackGenerator | Button taps, toggle switches |
| `impact({ style: ImpactStyle.Medium })` | | | Message send, navigation |
| `impact({ style: ImpactStyle.Heavy })` | | | Error states, destructive actions |
| `notification({ type: NotificationType.Success })` | Success/Warning/Error | UINotificationFeedbackGenerator | Send confirmation, error feedback |
| `vibrate({ duration: 300 })` | duration (ms) | AudioServicesPlaySystemSound | Fallback vibration |
| `selectionStart()` / `selectionChanged()` / `selectionEnd()` | none | UISelectionFeedbackGenerator | Scrolling through picker items |

**Graceful degradation:** All methods resolve as no-op on web and devices without Taptic Engine. No try/catch needed.

**Confidence: HIGH** -- Thin wrapper around UIKit feedback generators.

### @capacitor/status-bar (7.0.6)

**Methods:**

| Method | iOS Support | Description |
|--------|-------------|-------------|
| `setStyle({ style: Style.Dark })` | YES | Light content (white text) on dark background |
| `setStyle({ style: Style.Light })` | YES | Dark content on light background |
| `setBackgroundColor({ color: '#hex' })` | **NO (Android only)** | iOS ignores this -- status bar is transparent |
| `setOverlaysWebView({ overlay: true })` | YES | Content extends behind status bar |
| `show({ animation: Animation.Fade })` | YES | Show status bar with animation |
| `hide({ animation: Animation.Fade })` | YES | Hide status bar with animation |

**iOS limitations:**
- `setBackgroundColor()` does nothing on iOS. Status bar background comes from the content behind it (use `env(safe-area-inset-top)` padding with a dark background).
- Requires `UIViewControllerBasedStatusBarAppearance: YES` in Info.plist (Capacitor sets this by default).

**Loom config:** `Style.Dark` (light text) + `overlay: true` (content behind status bar, handled by existing `safe-area-inset-top` CSS).

**Confidence: HIGH** -- Simple API, well-understood iOS behavior.

### @capacitor/splash-screen (7.0.5)

**Configuration** (in `capacitor.config.ts` under `plugins.SplashScreen`):
```typescript
SplashScreen: {
  launchAutoHide: false,        // We control hide timing
  launchShowDuration: 0,        // Show indefinitely until hide() called
  fadeInDuration: 0,            // Instant show (it's the launch screen)
  fadeOutDuration: 300,         // Smooth fade to web content
  backgroundColor: '#333029',   // Match --surface-base (oklch 0.20 approximated)
  showSpinner: false,           // No spinner -- we show our own loading state
}
```

**Methods:**
| Method | Description |
|--------|-------------|
| `show({ fadeInDuration, fadeOutDuration, showDuration, autoHide })` | Show splash with options |
| `hide({ fadeOutDuration })` | Hide splash with optional fade |

**Integration pattern:**
```typescript
// In main.tsx or App.tsx, after React mounts and initial data loads:
import { SplashScreen } from '@capacitor/splash-screen';
import { Capacitor } from '@capacitor/core';

if (Capacitor.isNativePlatform()) {
  SplashScreen.hide({ fadeOutDuration: 300 });
}
```

**iOS-specific setup:**
- Splash screen is defined in `LaunchScreen.storyboard` (already in Capacitor scaffold)
- Background color should match Loom's `--surface-base` to prevent flash
- App icon and splash assets go in `ios/App/App/Assets.xcassets/`

**Confidence: HIGH** -- Standard Capacitor plugin pattern.

## 120Hz ProMotion Strategy

### The Problem

WKWebView is locked to 60Hz `requestAnimationFrame` by default. CSS animations and scrolling can run at 120Hz, but JS-driven animations (Framer Motion springs, rAF loops) are capped at 60fps.

### The Solution: Two-Part

**Part 1: Enable 120Hz at the Native Level**

Add to `ios/App/App/Info.plist`:
```xml
<key>CADisableMinimumFrameDurationOnPhone</key>
<true/>
```

This is Apple's opt-in key for third-party apps to access ProMotion refresh rates. Without it, the app is hard-capped at 60Hz regardless of device capability. Battery impact is minimal because ProMotion dynamically adjusts -- it only renders at 120Hz when content is changing.

**Caveat:** This enables 120Hz for native CAAnimation/CADisplayLink. Whether WKWebView's rAF honors this key in third-party apps is UNCERTAIN -- Safari 18.3+ has an unlocked framerate flag, but it applies to Safari itself, not necessarily WKWebView in embedded apps. CSS animations and scrolling should still benefit from ProMotion regardless.

**Confidence: MEDIUM** -- The Info.plist key is well-documented for native apps. Its effect on WKWebView's rAF specifically is not officially documented. Needs device testing.

**Part 2: Detect and Adapt Spring Durations**

Even if rAF stays at 60Hz, spring animation *durations* should be tuned for 120Hz screens because:
1. CSS transitions/animations DO run at 120Hz on ProMotion
2. Shorter durations feel more appropriate on high-refresh displays
3. The same spring settling at 500ms on 60Hz feels sluggish on 120Hz

**Detection approach** (runtime, no dependencies):
```typescript
/** Detect approximate display refresh rate via rAF timing */
function detectRefreshRate(): Promise<number> {
  return new Promise((resolve) => {
    let frames = 0;
    let startTime = 0;
    const SAMPLE_FRAMES = 10;

    function tick(timestamp: number) {
      if (frames === 0) startTime = timestamp;
      frames++;
      if (frames >= SAMPLE_FRAMES) {
        const elapsed = timestamp - startTime;
        const avgFrameTime = elapsed / (SAMPLE_FRAMES - 1);
        const hz = Math.round(1000 / avgFrameTime);
        // Classify: anything > 90Hz is "high refresh"
        resolve(hz > 90 ? 120 : 60);
      } else {
        requestAnimationFrame(tick);
      }
    }
    requestAnimationFrame(tick);
  });
}
```

**Spring adaptation** (extend existing `motion.ts`):
```typescript
// Existing spring configs in motion.ts:
// SPRING_GENTLE: { stiffness: 120, damping: 14 }
// SPRING_SNAPPY: { stiffness: 300, damping: 20 }
// SPRING_BOUNCY: { stiffness: 180, damping: 12 }

// For 120Hz: increase stiffness ~20%, increase damping ~10%
// This shortens settling time without changing the character of the motion
export function adaptSpring(base: SpringConfig, isHighRefresh: boolean): SpringConfig {
  if (!isHighRefresh) return base;
  return {
    stiffness: base.stiffness * 1.2,
    damping: base.damping * 1.1,
    mass: base.mass,
  };
}

// CSS duration scaling: reduce by ~35% for 120Hz
export function adaptDuration(ms: number, isHighRefresh: boolean): number {
  return isHighRefresh ? Math.round(ms * 0.65) : ms;
}
```

**Confidence: MEDIUM** -- The rAF detection reliably classifies 60 vs 120 when rAF runs unlocked. If WKWebView caps rAF at 60Hz even on ProMotion devices, detection would always return 60. Fallback strategy: use `navigator.userAgent` to detect iPhone Pro models as a secondary signal, or use CSS `@media (dynamic-range: high)` as a proxy for newer hardware.

## API Base URL Abstraction

### What Needs to Change

Currently, all API calls use relative paths that resolve against `window.location.origin`:
- `fetch('/api/auth/status')` in `auth.ts` (3 fetch calls)
- `fetch('/api/...')` in `useFetch` hooks and direct fetches throughout
- `` `${protocol}//${window.location.host}/ws` `` in `websocket-client.ts` line 64
- `` `${protocol}//${window.location.host}/shell` `` in `shell-ws-client.ts` line 72

In bundled Capacitor mode, `window.location.origin` is `capacitor://localhost` -- these paths would resolve to `capacitor://localhost/api/sessions` which doesn't exist.

### Solution: Central URL Module

New file: `src/src/lib/api-config.ts`
```typescript
import { Capacitor } from '@capacitor/core';

/** Server URL for API calls. Empty string for same-origin (web). */
function getServerOrigin(): string {
  if (Capacitor.isNativePlatform()) {
    return import.meta.env.VITE_API_BASE_URL || 'http://100.86.4.57:5555';
  }
  return ''; // Same-origin for web (dev proxy or production nginx)
}

export function apiUrl(path: string): string {
  return `${getServerOrigin()}${path}`;
}

export function wsUrl(path: string, token: string): string {
  const origin = getServerOrigin();
  if (origin) {
    const url = new URL(origin);
    const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${url.host}${path}?token=${token}`;
  }
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}${path}?token=${token}`;
}
```

### Files Requiring URL Changes

| File | Current Pattern | Change To |
|------|----------------|-----------|
| `src/lib/auth.ts` | `fetch('/api/auth/status')` etc. | `fetch(apiUrl('/api/auth/status'))` |
| `src/lib/websocket-client.ts` | `` `${protocol}//${window.location.host}/ws?token=${token}` `` | `wsUrl('/ws', token)` |
| `src/lib/shell-ws-client.ts` | `` `${protocol}//${window.location.host}/shell?token=${token}` `` | `wsUrl('/shell', token)` |
| All hooks using `fetch('/api/...')` | Relative fetch paths | `fetch(apiUrl('/api/...'))` |

**Confidence: HIGH** -- This is a well-understood pattern. `Capacitor.isNativePlatform()` is the official detection method. On web, `getServerOrigin()` returns empty string so `apiUrl('/api/foo')` returns `'/api/foo'` -- zero behavioral change for web.

## CORS Configuration for Capacitor

### Backend Change

In `server/index.js` line 340:
```javascript
// Current:
origin: ['https://samsara.tailad2401.ts.net:5443', 'http://100.86.4.57:5184', 'http://localhost:5184'],

// Updated:
origin: [
  'https://samsara.tailad2401.ts.net:5443',
  'http://100.86.4.57:5184',
  'http://localhost:5184',
  'capacitor://localhost',  // Capacitor iOS bundled mode
],
```

**Why `capacitor://localhost`:** When `iosScheme` is the default (`capacitor`), the `Origin` header sent by WKWebView is `capacitor://localhost`. The Express `cors` middleware handles this correctly -- it's a string match on the `Origin` header.

**Alternative considered:** Setting `iosScheme: 'https'` in capacitor.config.ts makes the origin `https://localhost`, which some CORS implementations handle more reliably. However, this changes cookie scoping and localStorage isolation. Stick with the default `capacitor://` scheme.

**Confidence: HIGH** -- Well-documented pattern, confirmed in multiple Capacitor CORS issues.

## Info.plist Additions

Keys to add to `ios/App/App/Info.plist` (beyond Capacitor defaults):

| Key | Value | Purpose |
|-----|-------|---------|
| `CADisableMinimumFrameDurationOnPhone` | `true` | Enable ProMotion 120Hz for animations |

Keys already set by Capacitor (verify, don't re-add):

| Key | Value | Set By |
|-----|-------|--------|
| `UIViewControllerBasedStatusBarAppearance` | `YES` | Capacitor default (required by StatusBar plugin) |
| `NSAllowsArbitraryLoads` | `true` | Capacitor default (allows HTTP to Tailscale IP) |

## Installation

```bash
cd src/

# Production dependencies (runtime imports in web code)
npm install @capacitor/keyboard@7.0.6 @capacitor/haptics@7.0.5 \
  @capacitor/status-bar@7.0.6 @capacitor/splash-screen@7.0.5

# Move @capacitor/core to production dependencies
npm install @capacitor/core@^7.6.1
# (This moves it from devDependencies to dependencies)

# Sync native plugins to iOS project
npx cap sync ios
```

**Total new production dependencies: 4** (Keyboard, Haptics, StatusBar, SplashScreen)
**Moved to production: 1** (@capacitor/core)
**New devDependencies: 0**
**Bundle impact: Minimal** -- Capacitor plugins are thin TypeScript wrappers around `Capacitor.Plugins.X.method()` calls. The native code runs in Swift, not in the JS bundle. Each plugin adds ~2-5KB to the web bundle.

## Confidence Assessment

| Component | Confidence | Reasoning |
|-----------|------------|-----------|
| @capacitor/keyboard | HIGH | Official plugin, peerDeps verified on npm, API documented |
| @capacitor/haptics | HIGH | Official plugin, simple wrapper around UIKit |
| @capacitor/status-bar | HIGH | Official plugin, iOS limitations well-documented |
| @capacitor/splash-screen | HIGH | Official plugin, standard pattern |
| 120Hz ProMotion (Info.plist) | MEDIUM | Key is documented for native apps; WKWebView rAF effect unconfirmed |
| 120Hz detection (rAF) | MEDIUM | Works when rAF is unlocked; may always read 60Hz in WKWebView |
| API base URL abstraction | HIGH | Standard Capacitor pattern, `isNativePlatform()` is authoritative |
| CORS `capacitor://localhost` | HIGH | Documented, multiple community confirmations |
| Spring duration tuning | LOW | Aesthetic choices requiring device testing, no established benchmarks |

## Sources

- [Capacitor Keyboard Plugin API](https://capacitorjs.com/docs/apis/keyboard) -- Official docs, KeyboardResize enum, event payloads
- [Capacitor Haptics Plugin API](https://capacitorjs.com/docs/apis/haptics) -- Official docs, ImpactStyle/NotificationStyle enums
- [Capacitor Status Bar Plugin API](https://capacitorjs.com/docs/apis/status-bar) -- Official docs, iOS limitations (no setBackgroundColor)
- [Capacitor Splash Screen Plugin API](https://capacitorjs.com/docs/apis/splash-screen) -- Official docs, configuration options
- [Capacitor Configuration](https://capacitorjs.com/docs/config) -- iosScheme, hostname, server options
- [WebKit Bug 173434](https://bugs.webkit.org/show_bug.cgi?id=173434) -- 120Hz rAF support tracking
- [Apple Developer Forums: WKWebView 120Hz](https://developer.apple.com/forums/thread/773222) -- ProMotion in WKWebView status
- [Flutter CADisableMinimumFrameDurationOnPhone](https://github.com/flutter/flutter/issues/94508) -- Info.plist key documentation
- [Capacitor CORS Issue #1143](https://github.com/ionic-team/capacitor/issues/1143) -- CORS with capacitor:// scheme
- [Ionic CORS Troubleshooting](https://ionicframework.com/docs/troubleshooting/cors) -- Official CORS guidance
- npm registry version checks (verified 2026-03-27): all 7.x plugins require `@capacitor/core >=7.0.0`
