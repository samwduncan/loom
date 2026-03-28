# Architecture Research: Capacitor Native Plugin Integration

**Domain:** Capacitor native plugin integration into existing Vite+React+Zustand SPA
**Researched:** 2026-03-27
**Confidence:** HIGH (Capacitor patterns well-documented, existing codebase thoroughly analyzed)

## System Overview

```
                            EXISTING (unchanged)
┌─────────────────────────────────────────────────────────────────┐
│                    React Component Tree                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ ChatView │  │ Composer │  │ AppShell │  │ Sidebar  │        │
│  └────┬─────┘  └─────┬────┘  └─────┬────┘  └────┬─────┘        │
│       │              │             │             │              │
├───────┴──────────────┴─────────────┴─────────────┴──────────────┤
│                    Zustand Stores (5)                            │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐              │
│  │ time │  │stream│  │  ui  │  │ conn │  │ file │              │
│  └──────┘  └──────┘  └──────┘  └──────┘  └──────┘              │
├─────────────────────────────────────────────────────────────────┤
│              Network Layer (websocket-client, api-client)        │
│  ┌────────────────────────┐  ┌───────────────────────┐          │
│  │    WebSocketClient     │  │      apiFetch()       │          │
│  │  (ws://host/ws)        │  │  (fetch /api/...)     │          │
│  └────────────────────────┘  └───────────────────────┘          │
└─────────────────────────────────────────────────────────────────┘

                           NEW (this milestone)
┌─────────────────────────────────────────────────────────────────┐
│                     Platform Abstraction Layer                   │
│  ┌─────────────┐  ┌──────────────────┐  ┌──────────────────┐   │
│  │ getApiBase()│  │ getPlatformInfo()│  │ getWsBase()      │   │
│  │ (URL prefix)│  │ (ios/web/android)│  │ (ws:// prefix)   │   │
│  └──────┬──────┘  └────────┬─────────┘  └────────┬─────────┘   │
│         │                  │                     │              │
│  ┌──────┴──────────────────┴─────────────────────┴──────────┐   │
│  │              src/lib/platform.ts (single file)            │   │
│  └───────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                  Capacitor Plugin Bridge Layer                   │
│  ┌───────────┐  ┌────────┐  ┌───────────┐  ┌──────────────┐    │
│  │ Keyboard  │  │Haptics │  │ StatusBar │  │ SplashScreen │    │
│  └─────┬─────┘  └───┬────┘  └─────┬─────┘  └──────┬───────┘    │
│        │            │             │               │             │
│  ┌─────┴────────────┴─────────────┴───────────────┴──────────┐  │
│  │          src/lib/native-plugins.ts (lazy init)             │  │
│  └────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | New vs Modified | Location |
|-----------|---------------|-----------------|----------|
| `platform.ts` | API base URL, WS base URL, platform detection | **NEW** | `src/lib/platform.ts` |
| `native-plugins.ts` | Capacitor plugin initialization and lifecycle | **NEW** | `src/lib/native-plugins.ts` |
| `api-client.ts` | Prefix all fetch paths with `API_BASE` | **MODIFIED** (1 line) | `src/lib/api-client.ts` |
| `auth.ts` | Prefix auth fetch paths with `API_BASE` | **MODIFIED** (3 lines) | `src/lib/auth.ts` |
| `websocket-client.ts` | Use `WS_BASE` for WS URL construction | **MODIFIED** (2 call sites) | `src/lib/websocket-client.ts` |
| `shell-ws-client.ts` | Use `WS_BASE` for WS URL construction | **MODIFIED** (1 call site) | `src/lib/shell-ws-client.ts` |
| `ChatComposer.tsx` | Replace `visualViewport` hack with Keyboard plugin on native | **MODIFIED** (1 effect) | `src/components/chat/composer/ChatComposer.tsx` |
| `main.tsx` | Add native plugin init before React mount | **MODIFIED** (1 import + 1 call) | `src/main.tsx` |
| `motion.ts` | Add 120Hz-aware spring configs | **MODIFIED** (add configs) | `src/lib/motion.ts` |
| `capacitor.config.ts` | Add Keyboard plugin config section | **MODIFIED** (add plugins) | `capacitor.config.ts` |
| Express CORS | Add `capacitor://localhost` origin | **MODIFIED** (1 line) | `server/index.js` |

## New File Structure

```
src/src/
├── lib/
│   ├── platform.ts              # NEW: Platform detection, URL resolution
│   ├── native-plugins.ts        # NEW: Capacitor plugin init/lifecycle
│   ├── api-client.ts            # MODIFIED: Use API_BASE
│   ├── auth.ts                  # MODIFIED: Use API_BASE
│   ├── websocket-client.ts      # MODIFIED: Use WS_BASE
│   ├── shell-ws-client.ts       # MODIFIED: Use WS_BASE
│   └── motion.ts                # MODIFIED: Add ProMotion spring configs
└── components/
    └── chat/composer/
        └── ChatComposer.tsx     # MODIFIED: Guard keyboard effect with IS_NATIVE
```

## Architectural Patterns

### Pattern 1: Platform Abstraction via Module-Level Constants

**What:** A single `platform.ts` module that resolves platform identity and URL bases at import time. Every network call reads from this module instead of computing URLs inline.

**When to use:** Always -- this is the foundation all other patterns build on.

**Trade-offs:**
- PRO: Single source of truth for all URL construction
- PRO: Zero runtime overhead after module initialization (constants, not functions)
- PRO: Trivially testable -- mock the module in tests
- CON: Requires `@capacitor/core` as a runtime dependency (not just devDependency)

**Implementation:**

```typescript
// src/lib/platform.ts
import { Capacitor } from '@capacitor/core';

/**
 * Platform detection -- resolved once at module load.
 * On web: 'web'. On iOS native: 'ios'. On Android: 'android'.
 */
export const PLATFORM = Capacitor.getPlatform() as 'web' | 'ios' | 'android';
export const IS_NATIVE = Capacitor.isNativePlatform();

/**
 * API base URL.
 * - Web (dev): '' (empty -- Vite proxy handles /api -> localhost:5555)
 * - Web (prod): '' (empty -- nginx proxies /api -> localhost:5555)
 * - Native: 'http://100.86.4.57:5555' (direct to Express)
 *
 * Configurable via VITE_API_BASE_URL build-time env var for flexibility.
 */
export const API_BASE = IS_NATIVE
  ? (import.meta.env.VITE_API_BASE_URL || 'http://100.86.4.57:5555')
  : '';

/**
 * WebSocket base URL.
 * - Web: '' (empty -- browser constructs from window.location)
 * - Native: 'ws://100.86.4.57:5555' (direct to Express)
 */
export const WS_BASE = IS_NATIVE
  ? (import.meta.env.VITE_WS_BASE_URL || 'ws://100.86.4.57:5555')
  : '';
```

**Why `@capacitor/core` import, not `window.Capacitor`?** The `window.Capacitor` global exists in native shells without importing, but the import gives TypeScript type safety. `@capacitor/core` is ~8KB minified+gzipped -- negligible for this app's bundle. On web builds, `Capacitor.getPlatform()` returns `'web'` and `isNativePlatform()` returns `false`.

**Why module-level constants, not functions?** The platform never changes at runtime. Computing once at module load avoids repeated checks. The existing codebase uses this pattern (see `motion.ts` constants, the `TOKEN_KEY` in `auth.ts`).

### Pattern 2: One-Line Integration into Existing Network Layer

**What:** Modify `api-client.ts` and `websocket-client.ts` to prefix paths with the platform-resolved base URL. The change is minimal -- a string concatenation.

**Why this matters:** The existing codebase has exactly 4 files that make network requests: `api-client.ts`, `auth.ts`, `websocket-client.ts`, `shell-ws-client.ts`. All other code goes through these. The integration surface is small and well-bounded.

**Implementation in api-client.ts (doFetch function, line 51-52):**

```typescript
// BEFORE:
return fetch(path, { ...options, signal, headers: { ... } });

// AFTER:
import { API_BASE } from '@/lib/platform';
return fetch(`${API_BASE}${path}`, { ...options, signal, headers: { ... } });
```

When `API_BASE` is `''` (web), this is a no-op -- `'' + '/api/sessions'` = `'/api/sessions'`.
When `API_BASE` is `'http://100.86.4.57:5555'` (native), it becomes `'http://100.86.4.57:5555/api/sessions'`.

**Implementation in auth.ts (3 fetch calls at lines 77, 81, 94):**

```typescript
import { API_BASE } from '@/lib/platform';
// Line 77: fetch(`${API_BASE}/api/auth/status`)
// Line 81: fetch(`${API_BASE}/api/auth/register`, ...)
// Line 94: fetch(`${API_BASE}/api/auth/login`, ...)
```

**Implementation in websocket-client.ts (connect at line 63, reconnect at line 298):**

```typescript
import { WS_BASE, IS_NATIVE } from '@/lib/platform';

// In connect() and reconnect():
const url = IS_NATIVE
  ? `${WS_BASE}/ws?token=${token}`
  : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws?token=${token}`;
```

**Implementation in shell-ws-client.ts (connect at line 72):**

```typescript
import { WS_BASE, IS_NATIVE } from '@/lib/platform';

const url = IS_NATIVE
  ? `${WS_BASE}/shell?token=${token}`
  : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/shell?token=${token}`;
```

### Pattern 3: Capacitor Plugin Initialization Outside React

**What:** Initialize Capacitor native plugins in `main.tsx` before the React tree mounts, matching the existing `initializeWebSocket()` pattern.

**When to use:** For plugins that need to be ready before any React component renders (Keyboard, StatusBar, SplashScreen).

**Rationale:** The existing codebase already does this -- `initializeWebSocket()` runs before `createRoot()`. Native plugin init follows the same established pattern. Plugins like Keyboard must register listeners before the user can interact with the app.

**Implementation:**

```typescript
// src/lib/native-plugins.ts
import { IS_NATIVE, PLATFORM } from '@/lib/platform';

let initialized = false;

/**
 * Initialize native Capacitor plugins. Called once before React mounts.
 * No-ops on web -- every plugin import is guarded by IS_NATIVE.
 */
export async function initializeNativePlugins(): Promise<void> {
  if (initialized || !IS_NATIVE) return;
  initialized = true;

  if (PLATFORM === 'ios') {
    // Dynamic imports -- only loaded in native builds, tree-shaken on web
    const { Keyboard } = await import('@capacitor/keyboard');
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    const { SplashScreen } = await import('@capacitor/splash-screen');

    // Configure keyboard: we handle layout ourselves via --keyboard-offset
    // "none" resize mode (set in capacitor.config.ts) prevents WKWebView
    // from resizing the viewport -- we control offset via CSS custom property
    Keyboard.addListener('keyboardWillShow', (info) => {
      document.documentElement.style.setProperty(
        '--keyboard-offset',
        `${info.keyboardHeight}px`,
      );
    });
    Keyboard.addListener('keyboardWillHide', () => {
      document.documentElement.style.setProperty('--keyboard-offset', '0px');
    });

    // Dark status bar to match Loom's dark theme
    await StatusBar.setStyle({ style: Style.Dark });

    // Hide splash screen once plugins are initialized
    await SplashScreen.hide();
  }
}
```

```typescript
// src/main.tsx (modified)
import { initializeNativePlugins } from '@/lib/native-plugins';

// Init native plugins before React mount (no-ops on web)
void initializeNativePlugins();

// Existing WS init (unchanged)
void initializeWebSocket();

createRoot(document.getElementById('root')!).render(
  <StrictMode><App /></StrictMode>,
);
```

**Why dynamic imports inside `initializeNativePlugins()`?** Plugin packages like `@capacitor/keyboard` contain native bridge code that should not be bundled for web builds. Dynamic `import()` inside the `IS_NATIVE` guard means Vite will code-split these into a separate chunk that is never loaded on web. The guard returns early on web before hitting any `import()`, so the chunks are never fetched.

**Why not React hooks for plugin init?** The existing pattern (`initializeWebSocket()` in `main.tsx`) works and avoids coupling plugin lifecycle to React component lifecycle. Keyboard events must fire regardless of which component is mounted. A global listener in `native-plugins.ts` sets the CSS custom property that any component can consume.

### Pattern 4: Keyboard Plugin Replacing visualViewport Hack

**What:** Replace the `ChatComposer.tsx` visualViewport resize listener with the Capacitor Keyboard plugin's `keyboardWillShow`/`keyboardWillHide` events when running natively.

**Current implementation (ChatComposer.tsx lines 213-251):**
- Listens to `window.visualViewport` resize events
- Compares current viewport height to initial height to infer keyboard presence
- Sets `--keyboard-offset` CSS custom property when delta > 50px
- Prevents iOS scroll bouncing with `window.scrollTo(0, 0)`

**Problems with the current approach:**
1. The visualViewport fires DURING resize, causing a visible layout lag
2. The 50px threshold is a heuristic -- misfires on small viewport changes (e.g., address bar collapse)
3. Cannot distinguish keyboard from other viewport changes (orientation, address bar)
4. Captures `fullHeight` at mount time -- if the component remounts after keyboard was open, the reference height is wrong

**New implementation:**
- On native: Keyboard plugin fires `keyboardWillShow` BEFORE the keyboard animates, providing exact `keyboardHeight` in pixels. The listener is registered globally in `native-plugins.ts`.
- On web: Keep the existing visualViewport hack unchanged (still needed for PWA/Safari mobile)
- The CSS consumer (`--keyboard-offset`) stays identical -- zero CSS changes

```typescript
// In ChatComposer.tsx, modify the keyboard effect:
import { IS_NATIVE } from '@/lib/platform';

useEffect(() => {
  // On native, keyboard events are handled globally by native-plugins.ts.
  // The --keyboard-offset CSS var is set there. Skip the visualViewport hack.
  if (IS_NATIVE) return;

  // Web fallback: existing visualViewport hack (unchanged)
  if (typeof window === 'undefined') return;
  const vv = window.visualViewport;
  if (!vv) return;
  const fullHeight = vv.height;
  // ... rest of existing code ...
}, []);
```

**Capacitor Keyboard config required in `capacitor.config.ts`:**

```typescript
const config: CapacitorConfig = {
  // ... existing config ...
  plugins: {
    Keyboard: {
      resize: 'none',           // We handle layout ourselves via CSS
      style: 'dark',            // Match Loom's dark theme
      resizeOnFullScreen: false, // Don't resize in fullscreen either
    },
  },
};
```

The `resize: 'none'` setting is **critical** -- it tells iOS not to resize the WKWebView when the keyboard appears. Loom handles this via `--keyboard-offset` CSS custom property on `.app-shell` and `.composer-safe-area`. Without `resize: 'none'`, the WebView would shrink AND Loom would apply its offset, causing double-shrink.

### Pattern 5: 120Hz Spring Animation (CSS-First Strategy)

**What:** Optimize spring animations for ProMotion displays by relying on CSS animations (which run at 120Hz in WKWebView) rather than JS-driven rAF animations (which are capped at 60Hz).

**Critical finding:** In WKWebView on iOS, `requestAnimationFrame` is **throttled to 60fps** even on ProMotion 120Hz devices. This is a deliberate Apple battery-saving decision. CSS animations and CSS transitions run at the native display refresh rate (120Hz). The Safari 18.3+ feature flag for unlocked rAF rates does NOT apply to WKWebView -- only to Safari itself. There is no workaround.

**Implication for Loom:** The existing tiered animation system (CSS -> tailwindcss-animate -> LazyMotion) is already architecturally correct. CSS transitions already run at 120Hz on ProMotion. The spring configs in `motion.ts` used with Framer Motion's LazyMotion will be capped at 60fps in WKWebView -- but LazyMotion is only used for complex gestures, not routine UI transitions.

**Changes to `motion.ts`:**

```typescript
import { PLATFORM } from '@/lib/platform';

/**
 * ProMotion-tuned springs: halved duration for 120Hz displays.
 * 120Hz displays complete visual motion in half the frames,
 * so tighter springs feel responsive rather than sluggish.
 */
export const SPRING_SNAPPY_IOS: SpringConfig = {
  stiffness: 400,
  damping: 28,
};

export const SPRING_GENTLE_IOS: SpringConfig = {
  stiffness: 180,
  damping: 18,
};

/**
 * Platform-aware spring selection.
 * Returns iOS-tuned springs on native iOS, standard springs on web.
 */
export function getSpring(name: 'gentle' | 'snappy' | 'bouncy'): SpringConfig {
  const isIOS = PLATFORM === 'ios';
  switch (name) {
    case 'gentle': return isIOS ? SPRING_GENTLE_IOS : SPRING_GENTLE;
    case 'snappy': return isIOS ? SPRING_SNAPPY_IOS : SPRING_SNAPPY;
    case 'bouncy': return SPRING_BOUNCY; // Bouncy stays the same -- playful feel
  }
}
```

**More important -- CSS transition duration tokens:**

The real 120Hz win is in CSS custom properties. Add iOS-tuned duration tokens using a touch device media query as a proxy:

```css
/* tokens.css addition */
@media (hover: none) and (pointer: coarse) {
  :root {
    --duration-spring-gentle: 350ms;  /* down from 500ms */
    --duration-spring-snappy: 150ms;  /* down from 250ms */
  }
}
```

On 120Hz displays, shorter durations feel equally smooth because each frame covers less distance. The existing CSS transitions that reference these tokens automatically pick up the faster values. This is the bulk of the animation improvement -- no JS changes needed for CSS-driven motion.

### Pattern 6: CORS Configuration for capacitor://localhost

**What:** Add the `capacitor://localhost` origin to the Express CORS whitelist.

**Current CORS config (server/index.js lines 339-341):**

```javascript
app.use(cors({
    origin: ['https://samsara.tailad2401.ts.net:5443', 'http://100.86.4.57:5184', 'http://localhost:5184'],
}));
```

**Modified:**

```javascript
app.use(cors({
    origin: [
      'https://samsara.tailad2401.ts.net:5443',
      'http://100.86.4.57:5184',
      'http://localhost:5184',
      'capacitor://localhost',  // iOS Capacitor bundled assets mode
    ],
}));
```

**Why `capacitor://localhost`?** When Capacitor loads bundled assets on iOS, the WKWebView origin is `capacitor://localhost` -- a custom URL scheme, not `http://localhost`. This must be added explicitly to the CORS whitelist. The `cors` npm package (already used by Loom's Express backend) handles non-HTTP schemes correctly.

**WebSocket CORS note:** WebSocket upgrade requests do NOT enforce CORS in browsers. The browser sends the `Origin` header but the server is not required to validate it. Loom's `ws` library verifyClient validates the JWT token, not the origin. WebSocket connections from `capacitor://localhost` work without WS-specific changes.

**Alternative considered and rejected: `CapacitorHttp` native plugin.** This routes HTTP through the native networking layer, bypassing CORS entirely. It would require reimplementing all of `apiFetch()`'s deduplication, auth injection, and 401 retry logic. Two HTTP stacks means twice the bugs. The one-line CORS change is better.

## Data Flow

### API Request Flow (Modified)

```
[React Component]
    |
    v  (calls useApiFetch / apiFetch directly)
[api-client.ts] --> prepend API_BASE --> [fetch()]
    |
    |--- Web: same-origin /api/... (Vite proxy or nginx)
    |--- Native: http://100.86.4.57:5555/api/... (direct to Express)
    |
    v
[Express :5555] --> processes --> [Response]
    |
    v
[api-client.ts] --> JSON parse, 401 retry --> [React Component]
```

### WebSocket Connection Flow (Modified)

```
[main.tsx]
    |
    v  (initializeWebSocket)
[websocket-init.ts] --> bootstrapAuth() --> [auth.ts uses API_BASE for /api/auth/*]
    |
    v  (got JWT token)
[websocket-client.ts] --> connect(token)
    |
    |--- Web: ws://host/ws?token=... (from window.location)
    |--- Native: ws://100.86.4.57:5555/ws?token=... (from WS_BASE)
    |
    v
[Express :5555 WebSocket server] --> bidirectional streaming
```

### Keyboard Event Flow (New on Native)

```
[iOS keyboard appears]
    |
    v  (native event, fires BEFORE keyboard animation starts)
[@capacitor/keyboard plugin] --> keyboardWillShow { keyboardHeight: 336 }
    |
    v  (listener registered in native-plugins.ts at app init)
[document.documentElement.style.setProperty('--keyboard-offset', '336px')]
    |
    v  (CSS cascade -- no React re-render needed)
[.app-shell padding-bottom: var(--keyboard-offset)]
[.composer-safe-area padding-bottom: calc(1rem + env(safe-area-inset-bottom) + var(--keyboard-offset))]
    |
    v  (100ms CSS transition on .app-shell padding-bottom)
[UI shifts up, composer visible above keyboard]
```

### Native Plugin Initialization Flow

```
[App launch]
    |
    v
[main.tsx]
    |--- void initializeNativePlugins()     <-- NEW (no-ops on web)
    |       |
    |       |--- IS_NATIVE = false? --> return immediately
    |       |--- IS_NATIVE = true? -->
    |           |--- dynamic import @capacitor/keyboard --> register listeners
    |           |--- dynamic import @capacitor/status-bar --> set Style.Dark
    |           |--- dynamic import @capacitor/splash-screen --> hide()
    |
    |--- void initializeWebSocket()         <-- EXISTING (unchanged)
    |
    |--- createRoot().render(<App />)       <-- EXISTING (unchanged)
```

## Build Pipeline Changes

### Vite Build: Zero Modifications Required

The Vite build pipeline needs **no changes**:

1. **`webDir: 'dist'`** in `capacitor.config.ts` already points to Vite's default output directory
2. **`npm run build`** (`tsc -b && vite build`) produces the same `dist/` that `cap sync ios` copies to `ios/App/App/public/`
3. **New `@capacitor/*` imports** are resolved by Vite's standard module resolution
4. **Dynamic `import()`** calls in `native-plugins.ts` are automatically code-split by Vite/Rollup into separate chunks. On web, these chunks are never fetched.
5. **Manual chunks** in `vite.config.ts` do not need updating -- Capacitor packages are small enough to stay in the default chunk

The existing build pipeline is: `npm run build` -> `npx cap sync ios` (already in `package.json` as `cap:sync`).

### Dependency Changes

```bash
# Move @capacitor/core to production dependencies (needed at runtime for platform detection)
npm install @capacitor/core

# Add native plugins as production dependencies (dynamically imported, tree-shaken on web)
npm install @capacitor/keyboard @capacitor/status-bar @capacitor/haptics @capacitor/splash-screen

# Keep @capacitor/cli and @capacitor/ios as devDependencies (build tools only)
```

**Why move `@capacitor/core` to dependencies?** Currently it is a devDependency. But `platform.ts` imports from it at runtime. The `Capacitor.getPlatform()` and `Capacitor.isNativePlatform()` calls need the runtime code. On web, the `@capacitor/core` web implementation (~8KB gzipped) returns `'web'` and `false` respectively. This is a negligible bundle impact for an app that already ships React, Shiki, CodeMirror, and xterm.js.

## Anti-Patterns

### Anti-Pattern 1: Platform Checks Scattered Throughout Components

**What people do:** Put `if (Capacitor.isNativePlatform())` checks in UI components, hooks, and event handlers across the codebase.

**Why it is wrong:** Unmaintainable platform-conditional logic across dozens of files. Impossible to test web and native behavior independently. Violates single-responsibility.

**Do this instead:** Centralize platform logic in `platform.ts` (URL resolution) and `native-plugins.ts` (plugin lifecycle). Components should be platform-unaware. The keyboard example demonstrates this: ChatComposer does NOT import Capacitor. It checks the `IS_NATIVE` constant from `platform.ts` to decide whether to run the web fallback. The actual Keyboard plugin listener lives in `native-plugins.ts`, setting a CSS variable that any component can consume.

### Anti-Pattern 2: Using CapacitorHttp to Bypass CORS

**What people do:** Use `@capacitor/core`'s `CapacitorHttp` to route HTTP through the native layer, bypassing CORS entirely.

**Why it is wrong:** Creates a completely separate HTTP path for native vs web. Loom's `apiFetch()` request deduplication, auth header injection, and 401 auto-retry logic would need to be reimplemented or abandoned. Two HTTP stacks = twice the bugs.

**Do this instead:** Add `capacitor://localhost` to the Express CORS whitelist. One line. Keeps the entire `fetch()` pipeline identical across platforms.

### Anti-Pattern 3: Using @capacitor-community/react-hooks

**What people do:** Install the `@capacitor-community/react-hooks` package for `useKeyboard()`, `useHaptics()`, etc.

**Why it is wrong:** That package is maintained for Capacitor 3-5, has not been updated for Capacitor 7, and adds a dependency for functionality that is trivially hand-written. Loom's established pattern of module-level initialization (see `websocket-init.ts`) is superior to hooks for cross-cutting concerns like keyboard height that affect global CSS, not a single component.

**Do this instead:** Register plugin listeners in `native-plugins.ts`. If a component later needs reactive keyboard state (e.g., to show/hide a button), write a thin 20-line `useNativeKeyboard()` hook. But for v2.1, the CSS custom property approach requires no hook at all.

### Anti-Pattern 4: Trying to Unlock 120Hz rAF in WKWebView

**What people do:** Search for hacks, Safari feature flags, or workarounds to get `requestAnimationFrame` running at 120Hz in WKWebView.

**Why it is wrong:** Apple deliberately throttles rAF to 60Hz in WKWebView for battery life. The Safari 18.3+ feature flag for unlocked frame rates does NOT apply to WKWebView. There is no workaround, and this has been a known limitation since WebKit Bug 173434 (2017).

**Do this instead:** Use CSS transitions and CSS animations for 120Hz-smooth motion. They run at the native display refresh rate automatically. Reserve JS-driven animations (Framer Motion/LazyMotion) for complex interactive gestures, accepting they will cap at 60fps in WKWebView. The existing tiered animation system (CSS -> tailwindcss-animate -> LazyMotion) already follows this approach.

### Anti-Pattern 5: Importing Plugins at Top Level

**What people do:** Static `import { Keyboard } from '@capacitor/keyboard'` at the top of components or lib files.

**Why it is wrong:** Vite cannot tree-shake the plugin bridge code out of the web build. Every plugin import adds native bridge stubs to the main bundle even though they do nothing on web.

**Do this instead:** Dynamic `import()` inside the `IS_NATIVE` guard. Vite code-splits dynamic imports into separate chunks. When `IS_NATIVE` is `false` (web), the `import()` call is never reached and the chunk is never fetched.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Express :5555 | HTTP + WebSocket via platform-resolved URLs | Add `capacitor://localhost` to CORS |
| Tailscale VPN | System-wide tunnel routes WKWebView traffic | Must be active; detect loss and show error state |
| iOS Keyboard | Capacitor Keyboard plugin, resize: 'none' | Replaces visualViewport hack on native |
| iOS Haptics | Capacitor Haptics plugin, dynamic import | Impact on send, selection on scroll |
| iOS StatusBar | Style.Dark at init, overlays WebView content | Matches Loom's dark OKLCH theme |
| iOS SplashScreen | Auto-hide after native-plugins.ts init | Brief branding moment, then app takes over |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `platform.ts` -> `api-client.ts` | Import `API_BASE` constant | String concat prefix on fetch path |
| `platform.ts` -> `websocket-client.ts` | Import `WS_BASE`, `IS_NATIVE` | URL construction branch in connect/reconnect |
| `platform.ts` -> `auth.ts` | Import `API_BASE` constant | Prefix 3 fetch calls |
| `native-plugins.ts` -> CSS | `document.documentElement.style.setProperty` | Same pattern as existing keyboard code in ChatComposer |
| `native-plugins.ts` -> React components | None (fire-and-forget) | Plugins set CSS vars; components consume via CSS |
| `motion.ts` -> CSS tokens | `getSpring()` returns platform-tuned configs | Components call `getSpring('snappy')` for JS animations |

## Suggested Build Order (Dependencies Determine Sequence)

Each phase can be independently tested. Dependencies flow downward.

1. **Platform abstraction** (`platform.ts`)
   - Pure logic, no side effects, no visual changes
   - Unit test: mock Capacitor to return `'web'` vs `'ios'`, verify constants
   - Everything below depends on this file existing

2. **API base URL integration** (`api-client.ts`, `auth.ts`)
   - Modify the 2 files that make HTTP fetch requests
   - Test: verify web still works identically (API_BASE = '')
   - This is the "single highest-value prep work" from the iOS assessment
   - Depends on: Step 1

3. **WebSocket URL integration** (`websocket-client.ts`, `shell-ws-client.ts`)
   - Same pattern as Step 2 but for WebSocket connections
   - Test: verify WS reconnection still works on web
   - Depends on: Step 1

4. **Express CORS** (`server/index.js`)
   - One-line change to add `capacitor://localhost` to origin array
   - Test: `curl -H "Origin: capacitor://localhost" -I http://localhost:5555/api/auth/status`
   - Independent of Steps 2-3 but needed before native testing

5. **Capacitor Keyboard plugin** (`native-plugins.ts`, `capacitor.config.ts`, `ChatComposer.tsx`)
   - Largest behavior change: new file + config + component modification
   - The keyboard listener in native-plugins.ts replaces the visualViewport hack
   - ChatComposer.tsx change is a 1-line guard (`if (IS_NATIVE) return`)
   - Depends on: Step 1

6. **120Hz spring tuning** (`motion.ts`, CSS tokens)
   - Add ProMotion spring configs and platform-aware `getSpring()` function
   - Add touch-device media query for shorter CSS durations
   - Can be done in parallel with Step 5
   - Depends on: Step 1

7. **StatusBar + SplashScreen + Haptics** (additions to `native-plugins.ts`)
   - Polish features: dark status bar, splash screen hide, haptic feedback
   - Low risk, high perceived-quality payoff
   - Depends on: Step 5 (same init pattern, same file)

## Sources

- [Capacitor Keyboard Plugin API](https://capacitorjs.com/docs/apis/keyboard) -- keyboardWillShow event, resize modes, configuration
- [Capacitor JavaScript Utilities](https://capacitorjs.com/docs/basics/utilities) -- isNativePlatform(), getPlatform()
- [Capacitor Web API](https://capacitorjs.com/docs/core-apis/web) -- How @capacitor/core behaves on web
- [Capacitor Status Bar Plugin](https://capacitorjs.com/docs/apis/status-bar) -- Style.Dark, iOS Info.plist requirements
- [Capacitor Haptics Plugin](https://capacitorjs.com/docs/apis/haptics) -- impact(), notification(), selectionChanged()
- [Capacitor Splash Screen Plugin](https://capacitorjs.com/docs/apis/splash-screen) -- launchAutoHide, manual hide()
- [Ionic CORS Troubleshooting](https://ionicframework.com/docs/troubleshooting/cors) -- capacitor://localhost origin handling
- [WebKit Bug 173434](https://bugs.webkit.org/show_bug.cgi?id=173434) -- rAF 60fps throttle in WKWebView, filed 2017
- [Apple Developer Forums: WKWebView 120Hz](https://developer.apple.com/forums/thread/773222) -- Confirms rAF 60fps cap, CSS runs at 120Hz
- [@capacitor/core on Bundlephobia](https://bundlephobia.com/package/@capacitor/core) -- ~8KB gzipped
- [Best practice for importing mobile-only plugins](https://forum.ionicframework.com/t/best-practice-for-importing-mobile-only-capacitor-plugins/210090) -- Dynamic import pattern
- [Capacitor keyboard resize:none discussion](https://github.com/ionic-team/capacitor/discussions/6424) -- Non-Ionic keyboard handling
- [Native platform check without importing](https://www.leonelngande.com/native-platform-check-without-importing-capacitor/) -- window.Capacitor global analysis
- [Capacitor App Initialization Guide](https://capgo.app/blog/capacitor-app-initialization-step-by-step-guide/) -- Plugin init lifecycle

---
*Architecture research for: Capacitor native plugin integration into Loom v2.1 "The Mobile"*
*Researched: 2026-03-27*
