# Project Research Summary

**Project:** Loom v2.1 "The Mobile"
**Domain:** iOS native-feeling AI chat workspace via Capacitor WKWebView
**Researched:** 2026-03-27
**Confidence:** HIGH (official Capacitor docs, Apple developer forums, GitHub issue tracking)

## Executive Summary

Loom v2.1 turns a 55K+ LOC React SPA into a native-feeling iOS app by adding four official Capacitor 7 plugins (Keyboard, Haptics, StatusBar, SplashScreen) and a platform abstraction layer that routes API/WebSocket traffic to the remote Express server. The approach is well-understood: Capacitor's plugin ecosystem is mature, the codebase's architecture (centralized network layer, tiered animation system, CSS custom property keyboard offset) is already well-suited for native integration, and the required changes are surgical rather than structural. No new architectural patterns are needed — the work fits cleanly into established codebase patterns.

The recommended approach is a dependency-ordered five-phase execution: (1) platform abstraction and CORS foundation — prerequisite for everything else; (2) keyboard plugin replacing the fragile `visualViewport` hack; (3) status bar, splash screen, and touch polish; (4) haptics and 120Hz motion tuning; (5) bundled assets validation on device. The foundation phase must come first because every other feature depends on correct API URL construction. Skipping it produces an app that loads HTML but silently fails all network calls — a particularly deceptive failure mode.

The key risks are all known and preventable. The most dangerous is the dual-keyboard-handler race condition: when Capacitor's Keyboard plugin coexists with the existing `visualViewport` hack, they fight over `--keyboard-offset`, producing visible UI thrashing. Prevention is a single `if (IS_NATIVE) return` guard in ChatComposer.tsx. The second critical risk is the `capacitor://localhost` CORS gap: every fetch and WebSocket call must be prefixed with the server's absolute URL in native mode, or the app is completely non-functional despite appearing to load. A centralized `platform.ts` module with `API_BASE` and `WS_BASE` constants handles this with ~5 lines of production code. Both pitfalls are well-documented with clear prevention strategies.

## Key Findings

### Recommended Stack

Four official Capacitor 7 plugins cover all required native capabilities. All are thin TypeScript wrappers over UIKit APIs, adding ~2-5KB each to the web bundle. The critical architectural addition is `platform.ts` — a module-level constants file that resolves `API_BASE` and `WS_BASE` once at import time using `Capacitor.isNativePlatform()`. This zero-overhead approach matches the existing codebase pattern for constants in `motion.ts` and `auth.ts`.

`@capacitor/core` must move from `devDependencies` to `dependencies` since `platform.ts` imports from it at runtime. All plugin imports use dynamic `import()` inside `IS_NATIVE` guards so Vite tree-shakes them out of the web bundle entirely. No new devDependencies are needed. The existing Vite build pipeline (`npm run build` → `npx cap sync ios`) requires no modifications.

**Core technologies:**
- `@capacitor/keyboard@7.0.6`: Reliable `keyboardWillShow`/`keyboardWillHide` events with exact pixel height — replaces fragile `visualViewport` hack. `resize: 'none'` mode is critical.
- `@capacitor/haptics@7.0.5`: UIKit UIImpactFeedbackGenerator/UINotificationFeedbackGenerator — thin wrapper, graceful no-op on web and devices without Taptic Engine
- `@capacitor/status-bar@7.0.6`: `Style.Dark` for light text on dark background — `setBackgroundColor()` is a NO-OP on iOS; style only
- `@capacitor/splash-screen@7.0.5`: Manual hide timing (`launchAutoHide: false`) — prevents white flash during WKWebView init
- `platform.ts` (new, zero deps): Module-level `IS_NATIVE`, `API_BASE`, `WS_BASE` constants — single source of truth for all URL construction
- `native-plugins.ts` (new, ~60 LOC): Dynamic plugin init before React mounts — matches existing `initializeWebSocket()` pattern in main.tsx

**Do NOT use:** `@capacitor-community/react-hooks` — not updated for Capacitor 7. `CapacitorHttp` — patches global `fetch`, breaks WebSocket upgrade. `@capacitor/system-bars` — Capacitor 8+ only.

### Expected Features

The features divide cleanly into table stakes (things that make the app feel non-broken) and differentiators (things that make it feel premium).

**Must have (table stakes):**
- Reliable keyboard avoidance — current `visualViewport` hack breaks on orientation change, remount, and multitasking split
- Status bar dark style — single API call; without it the light status bar looks broken on dark theme
- Smooth splash-to-content transition — white flash on every app launch screams "web wrapper"
- Touch targets ≥44px — Apple HIG minimum; desktop-optimized controls fail this audit
- Safe-area inset compliance — all four edges; existing CSS only handles top/bottom

**Should have (differentiators):**
- Haptic feedback on message send, errors, and key interactions — physically confirms actions
- 120Hz spring animation tuning — CSS transitions auto-upgrade to 120Hz; spring configs should be tightened for iOS via CSS media query, not JS
- Bundled assets mode — sub-second app launch, UI shell loads without network
- Keyboard-aware composer with scroll preservation — composer stays pinned above keyboard, auto-scrolls to latest message on keyboard open

**Defer to v2.2+:**
- Push notifications — APNS backend integration, not needed for personal use
- Face ID / biometric auth — current JWT auth doesn't warrant it
- Offline conversation cache — fundamentally incompatible with AI assistant purpose
- iPad split-screen, share extension, native file picker — all add complexity for unclear value

### Architecture Approach

The architecture introduces a thin two-layer abstraction below the existing React/Zustand stack. The Platform Abstraction Layer (`platform.ts`) centralizes URL construction — all four network files (`api-client.ts`, `auth.ts`, `websocket-client.ts`, `shell-ws-client.ts`) import from it and prepend `API_BASE` or `WS_BASE`. On web, both are empty strings, making the change a zero-cost no-op. The Plugin Bridge Layer (`native-plugins.ts`) initializes all four Capacitor plugins before React mounts, following the existing `initializeWebSocket()` precedent. Components remain completely platform-unaware: ChatComposer.tsx gains one `if (IS_NATIVE) return` guard; everything else is CSS consuming the `--keyboard-offset` custom property set by the plugin layer.

**Major components:**
1. `platform.ts` — Module-level `IS_NATIVE`/`API_BASE`/`WS_BASE` constants; zero runtime overhead after module load; everything else imports from here
2. `native-plugins.ts` — Plugin lifecycle management; dynamic imports for tree-shaking; sets CSS variables directly, no React coupling
3. `api-client.ts` / `auth.ts` — One-line `${API_BASE}${path}` prepend; behavior unchanged on web (empty prefix)
4. `websocket-client.ts` / `shell-ws-client.ts` — `IS_NATIVE` branch for absolute WS URL construction
5. `capacitor.config.ts` — `Keyboard.resize: 'none'` is critical; `SplashScreen.launchAutoHide: false`; `CapacitorHttp.enabled: false`
6. `server/index.js` — One-line CORS addition: `'capacitor://localhost'`

**Architectural constraint to enforce:** Platform checks MUST NOT be scattered through UI components. They belong only in `platform.ts` (URL logic) and `native-plugins.ts` (plugin lifecycle). Components are platform-unaware and consume CSS variables or call `getSpring()` from `motion.ts`.

### Critical Pitfalls

1. **Dual keyboard handler race condition** — Capacitor Keyboard plugin + existing `visualViewport` hack both set `--keyboard-offset`, causing double-offset or visible thrashing. Prevention: `if (IS_NATIVE) return` at the top of ChatComposer's keyboard effect. `resize: 'none'` in capacitor.config.ts is mandatory. Must be addressed in the keyboard integration phase.

2. **`capacitor://localhost` breaks all fetch/WebSocket** — In bundled mode, relative URLs like `/api/sessions` resolve to `capacitor://localhost/api/sessions` (nonexistent). App loads HTML but has no data — silent total failure. Prevention: centralized `API_BASE` constant in `platform.ts`, `capacitor://localhost` in Express CORS whitelist. Must be the first change made.

3. **CapacitorHttp global fetch patch breaks WebSocket** — Capacitor 7's optional HTTP interceptor patches `window.fetch` globally and interferes with WebSocket upgrade requests. Prevention: explicitly set `CapacitorHttp: { enabled: false }` in capacitor.config.ts.

4. **SplashScreen white flash on dark theme** — WKWebView default background is white; flashes between splash and first meaningful paint. Prevention: set WKWebView `backgroundColor` in Swift to match `--surface-base` (~#2b2521), `launchAutoHide: false`, call `SplashScreen.hide()` from `useEffect` after React mounts.

5. **rAF capped at 60fps in WKWebView — JS springs cannot hit 120Hz** — Apple throttles `requestAnimationFrame` to 60fps in WKWebView (WebKit Bug 173434, filed 2017, unresolved for embedded WKWebView as of 2026). CSS transitions/animations DO run at 120Hz. Prevention: lean into CSS transitions for motion; tune CSS duration tokens via `@media (hover: none) and (pointer: coarse)` (not duration math based on frame counts); reserve Framer LazyMotion only for gesture-driven interactions.

6. **Safe-area `env()` does not update during keyboard** — `env(safe-area-inset-bottom)` stays at its resting value (34px on iPhone 16 Pro Max) when keyboard is open. Capacitor's `keyboardHeight` already includes this distance from screen bottom. Prevention: toggle `data-keyboard-open` attribute from Keyboard plugin events to switch CSS from `env(safe-area-inset-bottom)` to `var(--keyboard-offset)` padding strategy.

7. **Font loading race in WKWebView** — Self-hosted woff2 fonts (Inter, JetBrains Mono) fail intermittently (~20% cold starts) due to WKURLSchemeHandler initialization race. Prevention: `<link rel="preload" crossorigin>` for critical fonts in index.html. The `crossorigin` attribute is required by spec even for same-origin fonts.

8. **iOS build requires macOS** — `cap sync` works on Linux; `xcodebuild` does not. Options: Xcode Cloud (Apple CI), GitHub Actions macOS runner, or direct Mac access. Plan this before Phase 5 begins.

Additional pitfalls (moderate severity): `position: fixed` inside CSS transform contexts loses viewport-relative positioning in WKWebView (audit ElectricBorder, modal overlays, sidebar animations); `StatusBar.setBackgroundColor()` is a no-op on iOS — status bar background is always the content behind it; haptics must be debounced (50ms minimum) or the Taptic Engine throttles and goes silent.

## Implications for Roadmap

All changes follow a strict dependency order: platform abstraction first (everything depends on it), then native plugin integration, then polish and device validation.

### Phase 1: Platform Foundation
**Rationale:** Every other feature requires correct URL routing and CORS. Without this, the app is completely non-functional in bundled mode regardless of how well other features are implemented. Zero user-visible changes on web — pure infrastructure with zero behavioral risk.
**Delivers:** `platform.ts` with `IS_NATIVE`/`API_BASE`/`WS_BASE`; `api-client.ts` / `auth.ts` / `websocket-client.ts` / `shell-ws-client.ts` updated to use absolute URLs on native; `capacitor://localhost` CORS origin added to Express; `CapacitorHttp.enabled: false` in capacitor.config.ts
**Avoids:** Pitfall 2 (CORS/URL failure), Pitfall 3 (CapacitorHttp interference), Pitfall 8 (window.location.host in bundled mode)

### Phase 2: Keyboard and Composer
**Rationale:** Keyboard handling is the highest-impact UX change — it is what makes the app feel broken or native on first use. Must come before haptics or 120Hz work because it establishes the `native-plugins.ts` init pattern and `IS_NATIVE` guard pattern that subsequent phases follow.
**Delivers:** `native-plugins.ts` with Keyboard plugin listeners; `capacitor.config.ts` with `Keyboard.resize: 'none'`; ChatComposer.tsx `IS_NATIVE` early return; `keyboardDidHide` reflow fix; `data-keyboard-open` attribute for CSS safe-area switching; scroll-to-latest-message on keyboard open
**Avoids:** Pitfall 1 (dual handler race), Pitfall 9 (safe-area double-offset), Pitfall 14 (black gap on keyboard dismiss)

### Phase 3: Status Bar, Splash Screen, and Touch Polish
**Rationale:** These are additive to `native-plugins.ts` (same init pattern, same file) with no new architectural surface. Splash screen and status bar remove the most visually jarring "web wrapper" tells. Touch targets and safe-area audit are best done together as a single layout review pass.
**Delivers:** StatusBar `Style.Dark` + `overlaysWebView: true`; SplashScreen with `launchAutoHide: false` and color-matched background; WKWebView `backgroundColor` in Swift; touch target audit (44px enforcement on all interactive elements); full safe-area audit (all four edges); font preload in index.html; landscape lock (`UISupportedInterfaceOrientations` to portrait) or left/right safe-area padding
**Avoids:** Pitfall 4 (white flash), Pitfall 5 (StatusBar iOS color limitations), Pitfall 10 (font loading race), Pitfall 11 (position:fixed in transform context), Pitfall 12 (landscape safe-area)

### Phase 4: Haptics and Motion
**Rationale:** Haptics require correct touch targets (Phase 3) to be meaningful — haptic feedback on a 30px target is worse than no haptic. 120Hz CSS tuning is a stylesheet change and safe to do alongside haptics.
**Delivers:** `useHaptic()` hook with 50ms debounce and `prefers-reduced-motion` guard; haptic calls on message send, errors, navigation, and key interactions; CSS duration tokens tuned for touch devices via `@media (hover: none) and (pointer: coarse)`; `getSpring()` in `motion.ts` returning platform-aware configs; `CADisableMinimumFrameDurationOnPhone: true` in Info.plist
**Avoids:** Pitfall 6 (haptic throttle from over-firing), Pitfall 7 (rAF 60fps — CSS-first strategy avoids the problem)

### Phase 5: Bundled Assets Validation
**Rationale:** Building and running the actual Capacitor app requires Mac access and is the integration test for all previous phases. Separating this from implementation avoids arranging Mac access multiple times and enables Phases 1-4 to be written and unit-tested on Linux.
**Delivers:** Full `npm run build` → `cap sync ios` → `xcodebuild` pipeline validated; all features tested on device; font loading confirmed; API calls from `capacitor://localhost` origin confirmed; `VITE_API_BASE_URL` build-time env var workflow documented
**Avoids:** Pitfall 13 (Linux build limitation), Pitfall 10 (font race confirmed on device), Pitfall 18 (cap sync env var timing)

### Phase Ordering Rationale

- **Foundation first, features second:** Pitfalls 2, 3, and 8 all cause silent total failure that is discovered only on device and can mask every other problem. Fix URL routing before writing a single plugin call.
- **Keyboard before haptics:** `native-plugins.ts` is established in Phase 2; Phase 4 adds to it. Avoids creating the file twice and ensures consistent guard pattern throughout.
- **Touch audit before haptics:** Haptic feedback on elements that lack proper touch targets is a net negative — it signals an interaction on something that was hard to hit. Phase 3 audit precedes Phase 4 haptic integration.
- **Mac build last:** Phases 1-4 are written and unit-tested on Linux. Mac access is a scarce resource; consolidate all Xcode work into one session.
- **CSS motion before JS motion:** The 120Hz wins are CSS-native. Duration token changes in Phase 4 alongside haptics is correct — it is a stylesheet change, not an architectural one.

### Research Flags

Phases with standard patterns (skip `/gsd:research-phase`):
- **Phase 1:** URL abstraction is a well-documented Capacitor pattern; `isNativePlatform()` is authoritative; CORS change is one line
- **Phase 2:** Keyboard plugin API is fully documented; `resize: 'none'` + CSS variable pattern is established in both official docs and community issues
- **Phase 3:** StatusBar and SplashScreen APIs are single-purpose; touch target audit is mechanical HTML/CSS work

Phases that may benefit from targeted pre-planning research:
- **Phase 4:** `useHaptic()` hook design — review existing Loom hook patterns (`src/src/hooks/`) before implementing to ensure consistency; Web Animations API as potential alternative to Framer Motion for compositor-driven 120Hz springs
- **Phase 5:** Xcode Cloud or GitHub Actions macOS runner setup — cloud CI options evolve rapidly; verify current pricing and Capacitor compatibility before committing to a build path

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All four plugins are official Capacitor 7 releases; npm versions verified 2026-03-27; peerDeps confirmed against existing @capacitor/core 7.6.1 |
| Features | HIGH | Apple HIG requirements are stable; Capacitor plugin APIs are stable; anti-features correctly scoped based on project purpose and existing architecture |
| Architecture | HIGH | Existing codebase analyzed directly (file:line references in ARCHITECTURE.md); patterns derived from existing `initializeWebSocket()` and `motion.ts` constants; all 4 network files identified and integration surface bounded |
| Pitfalls | HIGH for plugin issues, MEDIUM for 120Hz | Pitfalls 1-9 confirmed via GitHub issues (#1143, #2194, #7585), official docs, and WebKit bug tracker; 120Hz rAF unlock in WKWebView is unconfirmed for third-party apps |

**Overall confidence:** HIGH

### Gaps to Address

- **120Hz rAF in WKWebView:** Whether `CADisableMinimumFrameDurationOnPhone` in Info.plist unlocks `requestAnimationFrame` (not just CAAnimation) in embedded WKWebView is not officially confirmed. The CSS-first strategy is the correct hedge regardless. Requires device testing to measure actual rAF frame intervals.
- **Spring duration tuning values:** The stiffness/damping multipliers for iOS spring configs are aesthetic estimates — no published benchmarks exist for ProMotion spring configs. On-device iteration required after Phase 4 implementation.
- **Font preload `crossorigin` attribute:** Required by spec for font preloads but can cause double-fetches in some WKWebView versions. Verify no duplicate font requests in Xcode network profiler during Phase 5.
- **Mac build access:** Phase 5 is blocked until a Mac build environment is arranged. Resolve this before starting Phase 4 so there is no idle wait time after implementation.
- **`safe-area-inset-bottom` keyboard behavior:** Research documents this stays static — device testing in Phase 5 should confirm the `data-keyboard-open` CSS toggle mitigation works correctly on iPhone 16 Pro Max.

## Sources

### Primary (HIGH confidence)
- [Capacitor Keyboard Plugin API](https://capacitorjs.com/docs/apis/keyboard) — resize modes, event payloads, keyboardHeight units
- [Capacitor Haptics Plugin API](https://capacitorjs.com/docs/apis/haptics) — ImpactStyle/NotificationStyle enums, graceful degradation
- [Capacitor Status Bar Plugin API](https://capacitorjs.com/docs/apis/status-bar) — Style.Dark, iOS backgroundColor no-op, overlaysWebView
- [Capacitor Splash Screen Plugin API](https://capacitorjs.com/docs/apis/splash-screen) — launchAutoHide, fadeOutDuration, hide() timing
- [Capacitor JavaScript Utilities](https://capacitorjs.com/docs/basics/utilities) — isNativePlatform(), getPlatform()
- [Apple Human Interface Guidelines: Touch Targets](https://developer.apple.com/design/human-interface-guidelines/accessibility#Controls-and-interactions) — 44pt minimum
- [Ionic CORS Troubleshooting](https://ionicframework.com/docs/troubleshooting/cors) — capacitor://localhost origin handling
- [WebKit Bug 173434](https://bugs.webkit.org/show_bug.cgi?id=173434) — rAF 60fps throttle in WKWebView (filed 2017)
- [Apple Developer Forums: WKWebView 120Hz](https://developer.apple.com/forums/thread/773222) — rAF cap confirmed; CSS at 120Hz confirmed

### Secondary (MEDIUM confidence)
- [Capacitor CORS Issue #1143](https://github.com/ionic-team/capacitor/issues/1143) — capacitor:// scheme CORS handling
- [Capacitor Plugins Issue #2194](https://github.com/ionic-team/capacitor-plugins/issues/2194) — WKWebView black gap on keyboard dismiss
- [Capacitor Issue #7585](https://github.com/ionic-team/capacitor/issues/7585) — CapacitorHttp WebSocket interference
- [Flutter CADisableMinimumFrameDurationOnPhone](https://github.com/flutter/flutter/issues/94508) — Info.plist ProMotion key documentation
- [safe-area-inset-bottom keyboard behavior](https://webventures.rejh.nl/blog/2025/safe-area-inset-bottom-does-not-update/) — does not update with keyboard
- [Capacitor best practice for mobile-only plugin imports](https://forum.ionicframework.com/t/best-practice-for-importing-mobile-only-capacitor-plugins/210090) — dynamic import pattern

### Tertiary (LOW confidence)
- Spring duration multipliers (stiffness * 1.2, damping * 1.1 for 120Hz) — aesthetic estimate; no established benchmark; requires device iteration

---
*Research completed: 2026-03-27*
*Ready for roadmap: yes*
