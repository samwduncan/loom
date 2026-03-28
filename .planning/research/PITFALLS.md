# Domain Pitfalls: v2.1 "The Mobile" -- Capacitor Native Plugins & Bundled Assets

**Domain:** Adding Capacitor Keyboard/Haptics/StatusBar/SplashScreen plugins and bundled assets mode to a 55K+ LOC React SPA (Vite 7, Zustand, OKLCH dark theme) running in WKWebView on iPhone 16 Pro Max
**Researched:** 2026-03-27
**Confidence:** HIGH for plugin-specific issues (confirmed via GitHub issues, official docs, community reports); MEDIUM for 120Hz/ProMotion (WKWebView rAF throttling is documented but workarounds are evolving)

---

## Critical Pitfalls

Mistakes that cause broken UX, architectural rewrites, or features that silently fail on device.

### Pitfall 1: Keyboard Plugin `resize: "none"` Creates Race Condition with Existing visualViewport Hack

**What goes wrong:**
The existing `ChatComposer.tsx` keyboard avoidance (lines 216-251) listens to `visualViewport.resize` events and computes `--keyboard-offset` from the initial fullHeight. When you add the Capacitor Keyboard plugin, two systems fight for control: the plugin's `keyboardWillShow`/`keyboardDidShow` events AND the existing visualViewport listener both try to set the keyboard offset. The result is flickering, double-offsets, or the offset being set and then immediately overridden.

**Why it happens:**
The Keyboard plugin fires `keyboardWillShow` with `keyboardHeight` BEFORE the viewport actually resizes. The visualViewport listener fires AFTER the viewport resizes. With `resize: "none"` (the correct mode for manual control), the WKWebView itself does not resize -- but `visualViewport.height` may still change slightly, triggering the old handler. With `resize: "native"`, the WKWebView shrinks, which changes `visualViewport.height`, and the old handler computes a SECOND offset on top of the native resize.

**Consequences:**
- Composer jumps violently on keyboard open/close
- Double padding (plugin offset + visualViewport offset)
- Keyboard dismiss leaves permanent dead space (known Capacitor bug: [#2194](https://github.com/ionic-team/capacitor-plugins/issues/2194))

**Prevention:**
1. Use `resize: "none"` in `capacitor.config.ts` keyboard config -- this is the only mode compatible with manual CSS offset control
2. When Capacitor is detected (`Capacitor.isNativePlatform()`), completely disable the visualViewport hack. Do not run both systems.
3. Listen exclusively to `Keyboard.addListener('keyboardWillShow', ...)` and `Keyboard.addListener('keyboardWillHide', ...)` for keyboard height
4. Set `--keyboard-offset` from the plugin's `keyboardHeight` value only
5. Keep the `window.scrollTo(0, 0)` call -- WKWebView still auto-scrolls on focus regardless of which keyboard detection method you use

**Detection (warning signs):**
- Composer bounces twice when keyboard opens
- Bottom padding remains after keyboard closes
- Testing only in Safari (where visualViewport works differently) misses the issue

**Phase to address:** First phase -- Keyboard plugin integration

---

### Pitfall 2: Bundled Assets CORS -- `capacitor://localhost` Origin Breaks All Fetch + WebSocket

**What goes wrong:**
In bundled assets mode, the SPA loads from `capacitor://localhost`. Every `fetch('/api/sessions')` call resolves to `capacitor://localhost/api/sessions` which does not exist. Every WebSocket connection via `window.location.host` (see `websocket-client.ts:63-64`) constructs `ws://localhost/ws` which connects to nothing. The entire app is non-functional.

**Why it happens:**
The existing codebase uses relative URLs everywhere:
- `api-client.ts:52` -- `fetch(path, ...)` where path is `/api/sessions`, `/api/settings`, etc.
- `websocket-client.ts:63-64` -- `${protocol}//${window.location.host}/ws`
- `shell-ws-client.ts:71-72` -- Same pattern for terminal WebSocket
- `auth.ts` -- Token refresh uses relative URL

In browser mode (dev server or nginx), relative URLs resolve against the same origin. In Capacitor bundled mode, the origin is `capacitor://localhost` -- a custom scheme with no server behind it. Capacitor's `WebViewAssetHandler.swift` serves static files from the bundle, but there is no API server at that origin.

**Consequences:**
- App loads (HTML/CSS/JS from bundle) but shows empty state -- no sessions, no connection
- WebSocket fails silently (no error page like a browser would show)
- JWT auth flow fails (can't reach `/api/auth`)
- Every API call throws network error

**Prevention:**
1. Create a centralized `getApiBaseUrl()` function:
   ```typescript
   import { Capacitor } from '@capacitor/core';

   export function getApiBaseUrl(): string {
     if (Capacitor.isNativePlatform()) {
       return 'http://100.86.4.57:5555'; // or from env/config
     }
     return ''; // relative URLs for web
   }
   ```
2. Refactor `api-client.ts` to prefix all paths with `getApiBaseUrl()`
3. Refactor `websocket-client.ts` and `shell-ws-client.ts` to construct absolute `ws://` URLs when native
4. Add `capacitor://localhost` to Express CORS whitelist (`server/index.js`)
5. The `getApiBaseUrl()` value should come from a build-time config, not hardcoded -- use `import.meta.env.VITE_API_BASE_URL` with a Capacitor-specific `.env.capacitor` file

**Detection:**
- App loads but spinner never resolves
- Network tab shows `capacitor://localhost/api/sessions` 404s
- WebSocket connection state stays "connecting" forever

**Phase to address:** First phase -- this is a prerequisite for everything else in bundled mode

---

### Pitfall 3: CapacitorHttp Native Fetch Patching Breaks WebSocket Connections

**What goes wrong:**
Capacitor 7 includes `CapacitorHttp` which can patch the global `fetch()` and `XMLHttpRequest` to route through native HTTP instead of WKWebView's network stack. When enabled (either explicitly or via default config), this native HTTP interceptor interferes with WebSocket upgrade requests, causing HTTP 400 errors or silent connection failures. The interceptor adds `localhost/capacitor_https_interceptor` to URLs on iOS ([#7585](https://github.com/ionic-team/capacitor/issues/7585)).

**Why it happens:**
CapacitorHttp patches `window.fetch` globally. While it's supposed to skip WebSocket-related requests, edge cases exist where Socket.IO/Engine.IO protocol negotiation (HTTP polling before WS upgrade) gets intercepted and broken ([#7568](https://github.com/ionic-team/capacitor/issues/7568)). Even if Loom uses raw WebSocket (not Socket.IO), the global fetch patch can still interfere with the auth token fetch that precedes WebSocket connection.

**Consequences:**
- WebSocket connects in browser, fails in Capacitor app
- Auth flow works intermittently (native HTTP vs WKWebView HTTP behave differently for cookies/headers)
- Hard to debug because the fetch patching is transparent

**Prevention:**
1. Explicitly disable CapacitorHttp in `capacitor.config.ts`:
   ```typescript
   plugins: {
     CapacitorHttp: {
       enabled: false
     }
   }
   ```
2. Since Loom's Express backend will have proper CORS headers for `capacitor://localhost`, native HTTP bypass is unnecessary
3. If you need CapacitorHttp for some requests later, use the plugin API directly (`CapacitorHttp.request()`) instead of the global fetch patch

**Detection:**
- API calls work but WebSocket fails
- Random "HTTP 400 Bad Request" on WebSocket endpoints
- Works in Safari, fails in Capacitor app

**Phase to address:** First phase -- configure alongside CORS and API base URL

---

### Pitfall 4: SplashScreen-to-WKWebView Transition Flashes White on Dark Theme

**What goes wrong:**
Between the native splash screen dismissing and the WKWebView rendering the first frame, there is a brief flash of the WKWebView's default background color (white). On a dark-themed app like Loom (`--surface-base` is a warm dark brown), this creates a jarring white flash that looks broken.

**Consequences:**
- Professional appearance ruined on every app launch
- Users perceive the app as slow/broken
- Particularly noticeable on OLED screens where white flash is physically painful in dark environments

**Why it happens:**
WKWebView's default background is white. The native splash screen (LaunchScreen.storyboard) is shown by iOS during app launch. When the splash screen is hidden (either automatically or via `SplashScreen.hide()`), the WKWebView becomes visible. But the web content may not have fully rendered yet -- CSS hasn't loaded, fonts haven't loaded, React hasn't mounted. The gap between "WKWebView visible" and "first meaningful paint" shows the white background.

**Prevention:**
1. Set the WKWebView background color in `AppDelegate.swift` or Capacitor config:
   ```swift
   // In AppDelegate.swift or a custom CAPBridgeViewController
   webView?.isOpaque = false
   webView?.backgroundColor = UIColor(red: 0.169, green: 0.145, blue: 0.129, alpha: 1.0) // matches --surface-base
   webView?.scrollView.backgroundColor = UIColor(red: 0.169, green: 0.145, blue: 0.129, alpha: 1.0)
   ```
   The Capacitor config also supports `backgroundColor` in the iOS section.
2. Match the LaunchScreen.storyboard background color to `--surface-base` (the warm dark #2b2521)
3. Use `SplashScreen` plugin with `launchAutoHide: false`, then call `SplashScreen.hide()` from `useEffect` in the root App component AFTER React has mounted and the first render is committed
4. Add `fadeOutDuration: 200` for a smooth crossfade instead of an abrupt cut
5. Set `<meta name="theme-color" content="#2b2521">` (already present in index.html -- good)

**Detection:**
- Brief white flash between splash and app content
- More noticeable on first launch (cold start) than subsequent launches

**Phase to address:** SplashScreen phase -- but WKWebView backgroundColor should be set in the first phase when configuring the Xcode project

---

## Major Pitfalls

Mistakes that cause significant UX degradation or require multi-file refactoring.

### Pitfall 5: StatusBar Plugin setBackgroundColor Does NOT Work on iOS

**What goes wrong:**
Developers call `StatusBar.setBackgroundColor({ color: '#2b2521' })` expecting the status bar area to match the app's dark theme. On iOS, this method is a no-op. The status bar background on iOS is always transparent -- it's the content behind it that determines the visual appearance. You can only control the text/icon color (light or dark) via `setStyle()`.

**Why it happens:**
iOS status bar architecture is fundamentally different from Android. On iOS, the status bar is an overlay -- it draws on top of whatever content is beneath it. The "background color" is determined by your app's content that extends behind the status bar (enabled via `viewport-fit=cover` and safe-area padding). On Android, the status bar is a separate system chrome bar with its own background color.

**Consequences:**
- Android-style StatusBar color code silently fails on iOS
- Developers waste time debugging why the color doesn't apply
- If `overlaysWebView` is set to `false` on iOS, you get a black bar instead of transparent overlay

**Prevention:**
1. Use `StatusBar.setStyle({ style: Style.Dark })` for light text on dark background (correct for Loom's dark theme)
2. Do NOT call `setBackgroundColor` on iOS -- guard with platform check or just don't use it
3. Ensure `viewport-fit=cover` is in the viewport meta tag (already present in `index.html`)
4. The existing `.app-shell { padding-top: env(safe-area-inset-top) }` in `base.css` handles the content offset correctly -- the status bar area will show the app-shell background color
5. Set `overlaysWebView: true` (the default on iOS) to let web content extend behind the status bar

**Detection:**
- Status bar area appears as a different color than expected
- Black bar at top of screen when `overlaysWebView` is incorrectly set to `false`

**Phase to address:** StatusBar integration phase

---

### Pitfall 6: Haptics Fire on Every Re-render in React Without useCallback/Ref Guard

**What goes wrong:**
Developers add `Haptics.impact({ style: ImpactStyle.Light })` inside event handlers that are recreated on every render, or inside effects that run more frequently than expected. On iOS, rapid haptic firing (10+ per second) causes the Taptic Engine to enter a protective throttle mode where it stops responding for several seconds. The user experiences haptics that work initially, then go dead.

**Why it happens:**
React re-renders frequently. If a haptic call is placed in an `onClick` handler that isn't memoized, the closure captures a new reference each render. More critically, if haptics are added to scroll events, intersection observers, or animation callbacks, they fire at 60fps, overwhelming the Taptic Engine.

**Consequences:**
- Haptics work for a few seconds then stop entirely (Taptic Engine thermal protection)
- Battery drain from unnecessary haptic motor activation
- Haptics feel "buzzy" instead of crisp when fired too rapidly

**Prevention:**
1. Use `useCallback` for all haptic-triggering event handlers
2. Debounce haptic calls -- minimum 50ms between impact triggers
3. Create a centralized `useHaptic()` hook that handles platform detection, debouncing, and reduced-motion preference:
   ```typescript
   function useHaptic() {
     const lastFired = useRef(0);
     return useCallback(async (style: ImpactStyle = ImpactStyle.Light) => {
       if (prefersReducedMotion()) return;
       if (!Capacitor.isNativePlatform()) return;
       const now = Date.now();
       if (now - lastFired.current < 50) return;
       lastFired.current = now;
       await Haptics.impact({ style });
     }, []);
   }
   ```
4. Never put haptics in scroll handlers, rAF loops, or resize observers
5. Respect `prefers-reduced-motion` -- haptics are a form of motion feedback

**Detection:**
- Haptics work on first interaction but not subsequent ones
- Device feels warm near the Taptic Engine area
- `console.log` in haptic handler shows it firing hundreds of times

**Phase to address:** Touch-first interactions phase

---

### Pitfall 7: requestAnimationFrame Capped at 60fps in WKWebView -- Spring Animations Cannot Hit 120Hz

**What goes wrong:**
Loom's spring animations (defined in `motion.ts`) use `SPRING_GENTLE`, `SPRING_SNAPPY`, and `SPRING_BOUNCY` configs. If these are driven by JavaScript `requestAnimationFrame` (via Framer Motion or a custom spring solver), they will run at 60fps maximum in WKWebView, even on 120Hz ProMotion displays. The animations feel subtly choppy compared to native iOS apps or even CSS animations in the same WKWebView.

**Why it happens:**
Apple throttles `requestAnimationFrame` to 60Hz in WKWebView to conserve battery. This is documented in [WebKit bug #173434](https://bugs.webkit.org/show_bug.cgi?id=173434). CSS animations and transitions DO run at 120Hz because they're compositor-driven and don't go through the JavaScript event loop. Safari 18.3+ has an experimental flag for unlocked rAF framerates, but this flag does NOT apply to WKWebView.

**Consequences:**
- JS-driven springs (Framer Motion `animate()`, custom spring solvers) capped at 60fps
- CSS-based animations run at 120fps on the same device, creating a jarring inconsistency
- "Halving spring durations for ProMotion" is pointless if the animation can only sample 60 times per second -- you get the same number of frames, just with a shorter duration, making them feel abrupt rather than smooth

**Prevention:**
1. Prefer CSS transitions and animations over JS-driven animations wherever possible:
   - Sidebar slide: use CSS `transform: translateX()` with `transition` (already works at 120Hz)
   - Modal/dialog enter/exit: CSS `@keyframes` (already works at 120Hz)
   - Tool card expand/collapse: CSS `grid-template-rows: 0fr/1fr` transition (already works at 120Hz)
2. For spring physics that CSS cannot express, use the Web Animations API (`element.animate()`) which is compositor-driven and can hit 120Hz
3. The existing CSS spring approximations in `tokens.css` (`--ease-spring-gentle: cubic-bezier(...)`) already run at 120Hz -- lean into these rather than replacing with JS springs
4. Do NOT "halve durations" for ProMotion. Instead, keep the same spring configs and let the higher framerate produce smoother interpolation. Only reduce durations if the animation FEELS too slow, not because of framerate math
5. Reserve Framer Motion's `LazyMotion` for gesture-driven interactions (drag, swipe) where CSS cannot provide the interactivity

**Detection:**
- Animations feel slightly stuttery in Capacitor app but smooth in Safari
- Chrome DevTools Performance panel shows 16.67ms frame intervals (60fps) instead of 8.33ms
- CSS animations on the same page feel smoother than JS-driven ones

**Phase to address:** 120Hz spring profiles phase

---

### Pitfall 8: `window.location.host` Returns `localhost` in Bundled Mode -- Auth Flow Breaks

**What goes wrong:**
In bundled mode, `window.location` returns:
```
protocol: "capacitor:"
host: "localhost"
hostname: "localhost"
port: ""
origin: "capacitor://localhost"
```
Any code that constructs URLs from `window.location` properties will point to the wrong host. The auth flow in `auth.ts` fetches a token from a relative URL, which resolves to `capacitor://localhost/api/auth` -- a non-existent endpoint.

**Why it happens:**
Capacitor serves bundled assets via the `capacitor://` custom scheme with the hostname `localhost`. This is intentional (Apple's App Transport Security requires a hostname, and `localhost` is conventional). But code written for browser deployment assumes `window.location.host` refers to the actual API server.

**Consequences:**
- Auth token fetch fails -- app cannot authenticate
- WebSocket URLs are wrong (this overlaps with Pitfall 2 but is more specific)
- Any diagnostic display showing "Connected to {hostname}:{port}" shows wrong info (see `ProofOfLife.tsx:159`)
- Deep links and route-based session loading break if they reconstruct URLs

**Prevention:**
1. NEVER use `window.location` for API URL construction in Capacitor-aware code
2. Use the centralized `getApiBaseUrl()` from Pitfall 2's prevention
3. Audit every occurrence of `window.location` in the codebase (currently 12+ occurrences across 7 files)
4. For route-based logic (like `window.location.pathname.match(/\/chat\/(.+)/)` in `websocket-init.ts:114`), these are fine -- the React Router hash/path still works correctly in Capacitor

**Detection:**
- Auth flow hangs or returns network error
- "Connected to localhost:" shown in ProofOfLife component

**Phase to address:** First phase -- alongside Pitfall 2

---

### Pitfall 9: Safe-Area Insets Not Updated for Keyboard on iOS -- Double-Offset or Missing Offset

**What goes wrong:**
`env(safe-area-inset-bottom)` does NOT update when the keyboard appears on iOS. The composer CSS (`composer.css:219-225`) adds `env(safe-area-inset-bottom) + var(--keyboard-offset)`. When the keyboard is open, the safe-area-inset-bottom still reports its original value (34px on iPhone 16 Pro Max). If the keyboard offset already accounts for the full distance from bottom of screen to top of keyboard, the safe-area-inset-bottom adds an extra 34px of dead space.

**Why it happens:**
WebKit intentionally does NOT update `env(safe-area-inset-bottom)` when the keyboard is visible. The rationale is that safe-area-insets represent physical device geometry (notch, home indicator), not transient UI like the keyboard. This is [confirmed behavior](https://webventures.rejh.nl/blog/2025/safe-area-inset-bottom-does-not-update/) across all WebKit versions.

**Consequences:**
- Composer floats 34px above the keyboard (wasted space) on iPhone with home indicator
- Or worse: if keyboard offset is measured from viewport bottom (not safe area bottom), the composer is 34px too high when keyboard is open and correctly positioned when keyboard is closed

**Prevention:**
1. The Capacitor Keyboard plugin's `keyboardHeight` value includes the distance from the bottom of the keyboard to the bottom of the screen (including safe area). When setting `--keyboard-offset` from the plugin, the safe-area-inset-bottom is already "inside" that value.
2. Adjust the CSS to be keyboard-aware:
   ```css
   /* When keyboard is CLOSED: include safe-area */
   .composer-safe-area {
     padding-bottom: calc(1rem + env(safe-area-inset-bottom));
   }
   /* When keyboard is OPEN: keyboard-offset replaces safe-area */
   .composer-safe-area[data-keyboard-open="true"] {
     padding-bottom: calc(1rem + var(--keyboard-offset, 0px));
   }
   ```
3. Toggle a `data-keyboard-open` attribute (or CSS class) on the composer container from the Keyboard plugin's show/hide events
4. Test with AND without the home indicator bar (iPhone SE vs iPhone 16 Pro Max)

**Detection:**
- Gap between keyboard top and composer bottom
- Composer at different heights when keyboard-offset is applied vs when safe-area-inset-bottom is used

**Phase to address:** Keyboard plugin integration phase

---

### Pitfall 10: Font Loading Fails Intermittently in Bundled WKWebView

**What goes wrong:**
Self-hosted `.woff2` fonts (Inter, Instrument Serif, JetBrains Mono) declared in `base.css` with `url('/fonts/...')` paths occasionally fail to load in WKWebView's bundled mode. The app renders with system fallback fonts, breaking the editorial typography design. This happens approximately 20% of cold starts on some iOS versions.

**Why it happens:**
WKWebView loads bundled assets via the `capacitor://localhost` custom scheme through a native `WKURLSchemeHandler`. Font loading in WKWebView has a documented race condition: if CSS is parsed and font loading starts before the scheme handler is fully initialized, the font request fails silently. This is worse on cold start (no cached assets) and with `font-display: swap` (which tells the browser to render with fallback immediately, then swap -- but the swap never happens if the font request fails entirely).

**Consequences:**
- App renders with system sans-serif instead of Inter Variable
- Code blocks use system monospace instead of JetBrains Mono
- Layout shifts when fonts eventually load (if they do)
- The editorial personality of Loom's typography is lost

**Prevention:**
1. Preload critical fonts in `index.html`:
   ```html
   <link rel="preload" href="/fonts/inter-variable.woff2" as="font" type="font/woff2" crossorigin>
   <link rel="preload" href="/fonts/jetbrains-mono-variable.woff2" as="font" type="font/woff2" crossorigin>
   ```
   Note: The `crossorigin` attribute is required even for same-origin fonts -- this is a browser spec requirement for font preloads
2. Keep `font-display: swap` (already present) as fallback
3. Test font loading on device with cold starts -- kill the app from the app switcher, relaunch 10 times
4. If the intermittent failure persists, consider inlining the most critical font (Inter Variable) as a base64 data URL in the CSS. This is ~100KB but guarantees first-paint typography. Do this ONLY if testing reveals the problem.
5. Verify font paths resolve correctly -- `/fonts/inter-variable.woff2` should map to `ios/App/App/public/fonts/inter-variable.woff2` after `cap sync`

**Detection:**
- System font visible on cold start
- DevTools Network tab shows failed font requests (if debugging is enabled)
- Typography looks "wrong" but only sometimes

**Phase to address:** Bundled assets phase -- verify during first device testing

---

## Moderate Pitfalls

### Pitfall 11: `position: fixed` Breaks Inside CSS Transform Context in WKWebView

**What goes wrong:**
Any element with `position: fixed` that is a descendant of an element with a CSS `transform` (including `transform: translateZ(0)` or `will-change: transform`) loses its fixed positioning. Instead of being fixed relative to the viewport, it becomes fixed relative to the transformed ancestor. This is per CSS spec, not a bug, but WKWebView enforces it more aggressively than Chrome.

**Loom exposure:**
- The composer (floating pill at bottom) uses fixed-like positioning
- ElectricBorder effect uses CSS transforms
- Modal overlays and command palette may have transform-based entrance animations
- Sidebar drawer animation uses `translateX`

**Prevention:**
1. Audit all `position: fixed` elements to ensure they are NOT descendants of transformed elements
2. The composer should be a direct child of the root layout, not nested inside a transformed container
3. For elements that need both fixed positioning and transform animations, apply the transform to a child element, not the fixed-positioned parent
4. WKWebView is stricter about `will-change: transform` creating a new stacking context -- remove `will-change` from ancestors of fixed elements

**Phase to address:** Mobile layout polish phase

---

### Pitfall 12: Landscape Orientation Breaks Safe-Area Layout

**What goes wrong:**
When the iPhone is rotated to landscape, `env(safe-area-inset-left)` and `env(safe-area-inset-right)` become non-zero (for the notch/Dynamic Island). If the app doesn't account for left/right safe areas, content is obscured behind the notch. Additionally, there's a documented WKWebView bug where `viewport-fit=cover` causes layout collapse on rotation ([WebKit bug](https://github.com/ccorcos/WkWebView-Safe-Area-Inset-Bug)).

**Loom exposure:**
The current CSS in `base.css` only handles `safe-area-inset-top` and `safe-area-inset-bottom`. There's no left/right safe-area handling. The sidebar panel is flush-left, which means in landscape-left orientation, the sidebar content extends behind the notch.

**Prevention:**
1. Add left/right safe-area padding to the app shell:
   ```css
   .app-shell {
     padding-left: env(safe-area-inset-left);
     padding-right: env(safe-area-inset-right);
   }
   ```
2. Or, if landscape is not a priority for v2.1, lock orientation to portrait in `Info.plist`:
   ```xml
   <key>UISupportedInterfaceOrientations</key>
   <array>
     <string>UIInterfaceOrientationPortrait</string>
   </array>
   ```
3. If supporting landscape, test rotation transitions -- WKWebView can briefly show incorrect safe-area values during the rotation animation

**Phase to address:** Mobile layout polish phase (or defer by locking to portrait)

---

### Pitfall 13: Building iOS App from Linux Requires Cloud Build or Mac Access

**What goes wrong:**
Developers attempt to build and deploy the iOS app entirely from Linux, hit a wall at the Xcode build step, and lose time trying workarounds. While `cap add ios` and `cap sync` work on Linux (confirmed in Phase 57), actually compiling Swift code and producing an `.ipa` requires Xcode, which only runs on macOS.

**Why it happens:**
Apple's iOS toolchain (Xcode, `xcodebuild`, codesigning, provisioning profiles) is macOS-only. There is no cross-compilation path. Even cloud solutions still use Mac hardware -- they just rent it.

**Prevention:**
1. Development workflow: Edit web code on Linux, run `cap sync ios` on Linux, then use a Mac ONLY for `xcodebuild` / `cap run ios`
2. Cloud build options that work with Capacitor:
   - **Capgo Build** -- uploads synced iOS project, builds on cloud Mac, returns `.ipa`
   - **Xcode Cloud** -- Apple's own CI, free tier available
   - **GitHub Actions with macOS runner** -- `macos-latest` image has Xcode pre-installed
3. Minimize trips to Mac: batch native changes (plugin configs, storyboard, Info.plist) and only build when native code changes. Web-only changes can be tested via `server.url` mode pointed at the Linux dev server.
4. Do NOT attempt to install macOS in a VM on Linux for Xcode -- it violates Apple's EULA and the toolchain doesn't work reliably in VMs

**Detection:**
- `cap run ios` fails with "Xcode not found"
- `pod install` fails (no CocoaPods on Linux) -- use SPM as fallback (already working)
- `xcodebuild` command not available

**Phase to address:** Build/deploy infrastructure phase

---

### Pitfall 14: WKWebView Keyboard Dismiss Leaves Blank Space (The "Black Gap" Bug)

**What goes wrong:**
After the keyboard closes, WKWebView occasionally fails to resize back to its original dimensions. A black (or white, depending on WKWebView background color) gap remains where the keyboard was. This persists until the user scrolls, interacts with another element, or the view is forced to re-layout. Reported in [Capacitor #2194](https://github.com/ionic-team/capacitor-plugins/issues/2194) and confirmed on multiple iOS versions.

**Why it happens:**
This is a WKWebView rendering bug, not a Capacitor bug. It appears more frequently in Low Power Mode and on older devices. The WKWebView's internal `UIScrollView` doesn't properly recalculate its content inset when the keyboard animation completes.

**Prevention:**
1. In the `keyboardDidHide` listener, force a re-layout:
   ```typescript
   Keyboard.addListener('keyboardDidHide', () => {
     document.documentElement.style.setProperty('--keyboard-offset', '0px');
     // Force WKWebView to recalculate layout
     window.scrollTo(0, 0);
     // Trigger a reflow
     document.body.style.overflow = 'hidden';
     requestAnimationFrame(() => {
       document.body.style.overflow = '';
     });
   });
   ```
2. Use `resize: "none"` mode (already recommended in Pitfall 1) -- this mode has fewer instances of the bug because WKWebView isn't trying to resize itself
3. Add a `keyboardWillHide` listener that starts the CSS transition BEFORE WKWebView tries to re-layout, masking any brief gap

**Detection:**
- Black or colored gap at bottom of screen after keyboard dismiss
- More frequent when device is in Low Power Mode
- Does not reproduce consistently -- test 20+ keyboard open/close cycles

**Phase to address:** Keyboard plugin integration phase

---

### Pitfall 15: Capacitor Plugin Imports Crash on Web (Non-Native) Platform

**What goes wrong:**
Code like `Haptics.impact({ style: ImpactStyle.Light })` throws or silently fails when running in a regular browser (not Capacitor app). If plugin calls are not guarded, the web version of Loom breaks when the same codebase runs in development (Vite dev server) or production (nginx).

**Why it happens:**
Capacitor plugins have web implementations that are stubs or no-ops. But importing and calling them adds bundle weight and may trigger console warnings. More critically, `Capacitor.isNativePlatform()` returns `false` on web, so if you forget to check, the plugin may throw on platforms where native functionality doesn't exist.

**Prevention:**
1. Always guard plugin calls:
   ```typescript
   import { Capacitor } from '@capacitor/core';

   async function triggerHaptic() {
     if (!Capacitor.isNativePlatform()) return;
     const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
     await Haptics.impact({ style: ImpactStyle.Light });
   }
   ```
2. Use dynamic imports (`import()`) for all Capacitor plugins to avoid loading native code on web
3. Create a `src/lib/native.ts` module that centralizes all Capacitor plugin access behind platform-guarded wrappers
4. Test the web version after adding every Capacitor plugin -- run `npm run dev` and verify no console errors

**Detection:**
- Console warnings about "Capacitor plugin not available" on web
- Web build size increases significantly after adding plugins
- Errors in CI tests (which run in jsdom, not Capacitor)

**Phase to address:** Every plugin phase -- establish the pattern in the first phase

---

## Minor Pitfalls

### Pitfall 16: `-webkit-overflow-scrolling: touch` Causes Render Artifacts

**What goes wrong:**
Adding `-webkit-overflow-scrolling: touch` to scrollable containers (message list, sidebar) causes white flickering and disappearing elements during fast scrolling in WKWebView.

**Prevention:**
Loom does not currently use `-webkit-overflow-scrolling: touch` (it was removed from modern WebKit). Do NOT add it. Modern WKWebView provides momentum scrolling by default on `overflow: auto/scroll` elements. The property is deprecated and causes more problems than it solves.

**Phase to address:** N/A -- just don't add it

---

### Pitfall 17: `max-scale=1.0, user-scalable=no` Ignored for Programmatic Zoom

**What goes wrong:**
The viewport meta tag already includes `maximum-scale=1.0, user-scalable=no` (index.html:7). This prevents pinch-to-zoom, which is correct for an app. However, WKWebView can still programmatically zoom when focusing on small text inputs (auto-zoom on focus). If the font size of the `<textarea>` is less than 16px, iOS zooms in.

**Prevention:**
The composer textarea uses `text-base md:text-sm` which resolves to 16px on mobile and 14px on desktop. The 16px mobile size should prevent auto-zoom. Verify this is the case on device. If any other inputs (settings modal, command palette) use font sizes below 16px on mobile, they will trigger auto-zoom.

**Phase to address:** Touch-first interactions phase -- audit all focusable inputs

---

### Pitfall 18: `process.env` in `capacitor.config.ts` Only Resolves at Sync Time

**What goes wrong:**
Developers expect `process.env.CAPACITOR_SERVER_URL` to be a runtime variable. It is not. The `.ts` config is evaluated by the Capacitor CLI during `cap sync`, and the resolved values are baked into `capacitor.config.json` inside the iOS project. Changing the env var after sync has no effect until the next `cap sync`.

**Prevention:**
This is already documented in the existing `capacitor.config.ts` comments (line 9-10) and the IOS-ASSESSMENT.md. Reinforce it:
1. Run `cap sync ios` after changing environment variables
2. Do NOT try to read `process.env` in client-side code -- use `import.meta.env` (Vite's mechanism)
3. Document the `cap sync` workflow clearly: `CAPACITOR_SERVER_URL=http://... npx cap sync ios`

**Phase to address:** Build/deploy documentation

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Severity | Mitigation |
|-------------|---------------|----------|------------|
| Keyboard plugin | Pitfall 1: Dual keyboard detection systems fight | Critical | Disable visualViewport hack when Capacitor detected |
| Keyboard plugin | Pitfall 9: Safe-area + keyboard double offset | Major | Toggle safe-area off when keyboard open |
| Keyboard plugin | Pitfall 14: Black gap after dismiss | Major | Force re-layout in keyboardDidHide |
| Bundled assets | Pitfall 2: All fetch/WS URLs broken | Critical | Centralized getApiBaseUrl() first |
| Bundled assets | Pitfall 3: CapacitorHttp breaks WebSocket | Critical | Disable CapacitorHttp explicitly |
| Bundled assets | Pitfall 8: window.location returns capacitor://localhost | Major | Audit all window.location usage |
| Bundled assets | Pitfall 10: Font loading race condition | Major | Preload critical fonts |
| StatusBar | Pitfall 5: setBackgroundColor is no-op on iOS | Major | Use setStyle only; rely on web content for visual |
| SplashScreen | Pitfall 4: White flash on dark theme | Critical | Set WKWebView backgroundColor to match theme |
| Haptics | Pitfall 6: Taptic Engine throttle from rapid firing | Major | Debounce with 50ms minimum, useHaptic hook |
| 120Hz springs | Pitfall 7: rAF capped at 60fps in WKWebView | Major | Prefer CSS transitions; use Web Animations API |
| Layout polish | Pitfall 11: Fixed positioning breaks under transforms | Moderate | Audit DOM nesting of fixed elements |
| Layout polish | Pitfall 12: Landscape safe-area not handled | Moderate | Lock to portrait or add left/right safe-area |
| Build/deploy | Pitfall 13: No Xcode on Linux | Moderate | Cloud build or Mac-only for final compile |
| All plugins | Pitfall 15: Plugin calls crash on web | Major | Platform guard + dynamic imports pattern |
| Touch inputs | Pitfall 17: Auto-zoom on small font inputs | Minor | Ensure 16px minimum on mobile inputs |

## Sources

- [Capacitor Keyboard Plugin Docs](https://capacitorjs.com/docs/apis/keyboard)
- [Capacitor StatusBar Plugin Docs](https://capacitorjs.com/docs/apis/status-bar)
- [Capacitor Haptics Plugin Docs](https://capacitorjs.com/docs/apis/haptics)
- [Capacitor SplashScreen Plugin Docs](https://capacitorjs.com/docs/apis/splash-screen)
- [WKWebView resize after keyboard close -- #2194](https://github.com/ionic-team/capacitor-plugins/issues/2194)
- [CapacitorHttp breaks WebSocket -- #7568](https://github.com/ionic-team/capacitor/issues/7568)
- [CapacitorHttp interceptor URL mangling -- #7585](https://github.com/ionic-team/capacitor/issues/7585)
- [Keyboard height not recalculated on input type change -- #2301](https://github.com/ionic-team/capacitor-plugins/issues/2301)
- [iOS WKWebView keyboard jump -- #1366](https://github.com/ionic-team/capacitor/issues/1366)
- [WKWebView 120Hz rAF support -- WebKit #173434](https://bugs.webkit.org/show_bug.cgi?id=173434)
- [StatusBar setBackgroundColor iOS limitation -- #777](https://github.com/ionic-team/capacitor/issues/777)
- [SplashScreen black screen on dark theme](https://forum.ionicframework.com/t/black-screen-after-splashscreen-capacitor-react-ios/237108)
- [WKWebView fixed position broken with scrollView.bounce -- WebKit #158325](https://bugs.webkit.org/show_bug.cgi?id=158325)
- [Safe-area-inset-bottom does not update for keyboard](https://webventures.rejh.nl/blog/2025/safe-area-inset-bottom-does-not-update/)
- [WKWebView safe-area rotation bug](https://github.com/ccorcos/WkWebView-Safe-Area-Inset-Bug)
- [Capacitor font loading production bug -- #5147](https://github.com/ionic-team/capacitor/issues/5147)
- [Capgo Build -- iOS from non-Mac](https://capgo.app/blog/build-ios-app-from-windows-capacitor-capgo-build/)
- [Capawesome iOS Troubleshooting](https://capawesome.io/blog/troubleshooting-capacitor-ios-issues/)
- [CORS with capacitor://localhost -- #1143](https://github.com/ionic-team/capacitor/issues/1143)
