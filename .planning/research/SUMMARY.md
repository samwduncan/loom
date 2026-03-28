# Project Research Summary

**Project:** Loom v2.2 "The Touch"
**Domain:** iOS-native gesture and visual polish for existing React + Capacitor chat app
**Researched:** 2026-03-28
**Confidence:** HIGH

## Executive Summary

Loom v2.2 is about making an existing, fully functional web-based chat app *feel* native on iOS. The research is clear: this is not a feature build -- it is a polish milestone. The app already works in Capacitor 7.6.1 on iPhone 16 Pro Max with keyboard handling, haptics, status bar, and sidebar swipe-to-close. What it lacks are the micro-interactions that iOS users attempt within seconds of opening any app: swipe-to-delete on lists, long-press context menus, pull-to-refresh, and the visual refinements (OLED backgrounds, glass effects, spring curves) that signal "this was built for this device." Without these, Loom feels like a website in a wrapper.

The recommended approach is custom gesture hooks built on raw `touchStart`/`touchMove`/`touchEnd` -- the same zero-dependency pattern already proven in `Sidebar.tsx`. No gesture library needed. Four new Capacitor plugins (App lifecycle, Clipboard, Share, Action Sheet) address real gaps: WebSocket reconnection on app resume, reliable clipboard access over HTTP, native share sheet, and native confirmation dialogs. All are official Capacitor 7.x plugins with verified compatibility. The visual work (OLED backgrounds, glass surfaces, spring animation tuning) must use CSS transitions exclusively because WKWebView caps `requestAnimationFrame` at 60fps while CSS animations run at 120Hz on ProMotion displays.

The primary risks are WKWebView-specific: passive event listeners silently blocking `preventDefault()` on touch events, `overscroll-behavior: none` being ignored by native UIScrollView, nested `backdrop-filter` causing rendering artifacts, and the iOS back gesture conflicting with custom swipe gestures. All have documented workarounds. The critical implementation rule is: **test every change on the physical iPhone**, not the simulator. The simulator uses Mac GPU resources and does not reproduce WKWebView's real compositor behavior, OLED smearing, or touch-action quirks.

## Key Findings

### Recommended Stack

The existing stack (Vite 7, React 19, Capacitor 7.6.1, Zustand, Tailwind v4) requires no changes. Four official Capacitor plugins should be added as Tier 1 installs; two more as Tier 2 stretch goals.

**New Tier 1 plugins (install for v2.2):**
- `@capacitor/app@^7.1.2`: App lifecycle events -- WebSocket reconnect on foreground return, pause streaming on background
- `@capacitor/clipboard@^7.0.4`: Native pasteboard -- bypasses HTTPS requirement that breaks `navigator.clipboard` in server.url mode
- `@capacitor/share@^7.0.4`: Native share sheet (UIActivityViewController) -- share code/conversations to Messages, Slack, Notes
- `@capacitor/action-sheet@^7.0.4`: Native confirmation dialogs -- iOS-standard destructive action sheets for delete confirmations

**New Tier 2 plugins (stretch goals):**
- `@capacitor/network@^7.0.4`: Proactive connectivity monitoring before WebSocket dies
- `@capacitor/browser@^7.0.5`: In-app SFSafariViewController for links in AI responses

**Not to install:** CapacitorHttp (breaks WebSocket), @capacitor/preferences (conflicts with Zustand persist), any camera/filesystem/geolocation plugins, any third-party swipe gesture plugins.

**Build-in-app (no plugin):** Swipe-to-delete (custom touch handlers), pull-to-refresh (custom touch handlers), long-press context menus (timer + Radix ContextMenu), spring animations (CSS transitions + `spring-easing` package already installed).

### Expected Features

**Must have (table stakes -- missing = "feels like a website"):**
- TS-1: Swipe-to-delete on session list (every iOS list app has this)
- TS-2: Long-press context menu on sessions (replaces right-click)
- TS-3: Long-press context menu on messages (Copy Text, Retry, Share)
- TS-4: Pull-to-refresh on session list (universal since iOS 6)
- TS-5: Status bar tap-to-scroll-top (5 lines of code, deeply ingrained muscle memory)
- TS-8: Code block copy button at 44px touch target
- TS-9: Haptic feedback on all new gesture completions
- TS-10/11/12: Existing sidebar swipe, keyboard transitions, text selection (verify working)

**Should have (differentiators -- "feels better than native"):**
- D-2: Share sheet integration via @capacitor/share
- D-6: Contextual haptic language (consistent feedback policy across all actions)
- D-7: Inline code block expand to full-screen sheet
- D-10: Tap code block to copy (whole block, quick-tap gesture)

**Defer to v2.3+:**
- D-1: Swipe-to-reply (high complexity, requires backend threading support that may not exist)
- D-3: Keyboard accessory toolbar (risk of conflicting with native keyboard resize mode)
- D-5: Spring navigation transitions (10-16h, diminishing returns for SPA)
- D-8: Two-direction swipe on sessions (doubles gesture complexity)
- D-9: Sticky date headers (requires message list restructuring)
- Local notifications, biometric auth, privacy screen plugins

### Architecture Approach

All gesture logic lives in three custom hooks (`useSwipeAction`, `usePullToRefresh`, `useLongPress`) under `src/hooks/`, extending the existing raw touch event pattern from `Sidebar.tsx`. No gesture library. Each hook checks `useMobile()` internally and returns no-op handlers on desktop. Visual position updates use direct DOM mutation via refs (same as the streaming buffer's useRef + rAF pattern) -- never `useState` for drag positions, which would cause 60 re-renders/second. New shared components (`SwipeableRow`, `PullToRefreshIndicator`, `LongPressContextMenu`) compose these hooks. No Zustand store changes needed -- all gesture state is local. Total bundle impact: ~2.4KB gzipped of application code versus ~6-10KB for `@use-gesture/react`.

**Major components:**
1. **Gesture hooks** (`useSwipeAction`, `usePullToRefresh`, `useLongPress`) -- platform-conditional touch event tracking, threshold detection, haptic integration
2. **SwipeableRow** wrapper -- translates child content to reveal action buttons behind, single-active-row enforcement
3. **PullToRefreshIndicator** -- spinner that follows pull gesture distance with rubber-band resistance
4. **LongPressContextMenu** -- message-level context menu with Copy Text, Retry, Share actions
5. **Native plugin utilities** (`clipboard.ts`, `app-lifecycle.ts`, `share.ts`) -- following existing `haptics.ts` setter-injection pattern

### Critical Pitfalls

1. **React passive event listeners block `preventDefault()` on touch events** -- React 17+ attaches all listeners passively. Calling `e.preventDefault()` in `onTouchMove` is silently a no-op. Use `useEffect` with DOM `addEventListener({ passive: false })` for any swipe gesture that needs to block scrolling. This is the number-one gotcha and will cause immediate confusion.

2. **iOS back gesture conflicts with custom horizontal swipes** -- WKWebView's `allowsBackForwardNavigationGestures` is true by default. Must disable in Swift `ViewController.swift` since Loom is an SPA with no navigation stack. Also reserve left 20px edge zone.

3. **`touch-action: pan-y` does not work reliably in Safari/WKWebView** -- Do not rely on CSS `touch-action` for gesture discrimination. Use JavaScript direction-commitment heuristic: track first 10px of movement, commit to horizontal or vertical, then act accordingly.

4. **`overscroll-behavior: none` ignored by WKWebView's native UIScrollView** -- Pull-to-refresh cannot rely on CSS overscroll control. Either implement via native `UIRefreshControl` Capacitor plugin or disable `scrollView.bounces` in Swift and build a pure-web pull indicator.

5. **rAF capped at 60fps in WKWebView** -- CSS transitions run at 120Hz on ProMotion, JS animations do not. All visible animations must use CSS transitions. rAF is for logic only (scroll position, intersection detection).

6. **Nested `backdrop-filter: blur()` causes rendering artifacts** -- Limit to one visible blur layer at a time. Use smaller blur radius on mobile (6px vs 10px). Increase glass surface opacity on mobile for readability in bright ambient light.

## Implications for Roadmap

Based on research, the work breaks cleanly into 4 phases following the dependency chain: touch foundations first, then gestures that build on them, then visual polish, then plugin integration that enhances the complete experience.

### Phase 1: Touch Foundations and Scroll Performance

**Rationale:** Touch targets, typography legibility, scroll performance, and keyboard behavior form the foundation that all gesture and visual work builds on. Fixing a 32px button after building swipe-to-delete means re-testing every gesture. Scroll performance issues (GPU layers, sticky positioning, keyboard viewport bugs) must be resolved before adding gesture complexity.
**Delivers:** All interactive elements at 44px touch targets, mobile-optimized typography, validated scroll performance on real device, keyboard dismiss bug workarounds, LiveSessionBanner sticky behavior verified.
**Addresses:** Touch target sizing (TS-8), text selection verification (TS-12), input focus transitions (TS-11), scroll anchoring validation (TS-7), rubber band verification (TS-6)
**Avoids:** Pitfall 5 (keyboard viewport shift), Pitfall 11 (will-change GPU memory), Pitfall 13 (CSS transitions broken after keyboard), Pitfall 16 (sticky positioning in nested scroll)

### Phase 2: Core Gesture System

**Rationale:** The three gesture hooks are the highest-impact work. Swipe-to-delete, long-press context menus, and pull-to-refresh are what users try within seconds of opening the app. They must be built after touch foundations are solid, and they share architectural patterns (raw touch events, direction commitment, haptic integration) that should be implemented together.
**Delivers:** Swipe-to-delete on sessions, long-press context menus on sessions and messages, pull-to-refresh on session list, status bar tap-to-scroll-top, comprehensive haptic feedback across all interactions.
**Addresses:** TS-1 (swipe-to-delete), TS-2 (long-press sessions), TS-3 (long-press messages), TS-4 (pull-to-refresh), TS-5 (status bar tap), TS-9 (haptics), D-6 (haptic language)
**Avoids:** Pitfall 1 (iOS back gesture conflict), Pitfall 2 (touch-action:pan-y), Pitfall 3 (passive event listeners), Pitfall 4 (overscroll-behavior ignored), Pitfall 7 (native context menu conflict), Pitfall 9 (pull-to-refresh vs overscroll), Pitfall 12 (swipe vs sidebar gesture conflict)

### Phase 3: Visual Polish

**Rationale:** OLED backgrounds, glass surfaces, and spring animation tuning are visual refinements that should come after the interaction model is stable. Changing visual layers while gesture thresholds are still being tuned creates unnecessary churn. Glass effects interact with backdrop-filter nesting (Pitfall 8) and must be tested after all modals/overlays are in their final state.
**Delivers:** OLED-optimized near-black background, glass morphism surfaces with mobile-tuned opacity, CSS spring curves for sidebar/modal transitions, contrast audit for mobile readability.
**Addresses:** VISUAL-01 (OLED), VISUAL-02 (glass), VISUAL-03/04/05 (springs), VISUAL-08 (contrast)
**Avoids:** Pitfall 6 (rAF 60fps cap -- CSS only), Pitfall 8 (nested backdrop-filter), Pitfall 14 (OLED smearing), Pitfall 15 (glass unreadable on mobile)

### Phase 4: Native Plugin Integration and Differentiators

**Rationale:** Capacitor plugins (App lifecycle, Clipboard, Share, Action Sheet, Browser, Network) enhance the gesture and visual work from phases 2-3 but do not block it. WebSocket reconnect on app resume is important but the app works without it. Share sheet wires into the long-press context menus built in Phase 2. Clipboard plugin enhances the copy functionality already working via web APIs. These are last-mile improvements.
**Delivers:** App lifecycle handling (WS reconnect on foreground), native clipboard, share sheet on code blocks and messages, native action sheets for destructive confirmations, in-app browser for links, network status monitoring.
**Addresses:** D-2 (share sheet), D-7 (code expand), D-10 (tap to copy), app lifecycle resilience
**Avoids:** Pitfall 10 (server.url caching -- version check on app resume)

### Phase Ordering Rationale

- **Touch foundations before gestures:** A 32px button inside a SwipeableRow creates a maddening touch target problem. Fix foundations first.
- **Gestures before visual polish:** Gesture threshold tuning requires real-device testing loops. Do not add visual complexity until interactions are stable.
- **Visual polish before plugins:** Glass effects and OLED backgrounds affect the visual context of share sheets and action sheets. Get the visual layer right, then wire in native chrome.
- **All phases need real-device testing:** The simulator does not reproduce WKWebView compositor behavior, OLED physics, or touch-action quirks. Every phase must include on-device validation.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2 (Gestures):** Pull-to-refresh implementation choice (native UIRefreshControl via custom Capacitor plugin vs pure-web) needs a spike. The research identified that `overscroll-behavior: none` is ignored in WKWebView, which may force the native approach. Also: the swipe-to-delete vs sidebar swipe-to-close conflict (Pitfall 12) needs careful prototyping.
- **Phase 3 (Visual):** Glass effect performance and readability on real device needs empirical testing -- the research provides guidelines (6px blur, higher opacity) but the exact values depend on Loom's specific color palette and surface hierarchy.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Touch Foundations):** Well-documented CSS changes (touch targets, typography). The pitfalls are known and have clear workarounds.
- **Phase 4 (Plugins):** All plugins are official Capacitor with stable APIs. The integration follows the established `native-plugins.ts` pattern exactly. No research needed.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All plugin versions verified via npm registry 2026-03-28. Peer deps confirmed. Zero version conflicts. Existing native-plugins.ts pattern provides clear integration template. |
| Features | HIGH | Table stakes derived from Apple HIG + NNGroup research + reference app analysis (iMessage, WhatsApp, Telegram, Discord, GitHub Mobile). Complexity estimates based on existing codebase architecture. |
| Architecture | HIGH | Primary reference is existing Sidebar.tsx swipe implementation (proven in production). Custom hook pattern matches established codebase conventions. Bundle size estimates grounded in source-level analysis. |
| Pitfalls | HIGH | Every critical pitfall sourced from official WebKit bug trackers, Capacitor GitHub issues, or framework-level documentation. WKWebView-specific behaviors verified against multiple independent sources. |

**Overall confidence:** HIGH

### Gaps to Address

- **Pull-to-refresh implementation choice:** Research identified two viable paths (native UIRefreshControl vs pure-web). A 2-hour spike during Phase 2 planning should build both prototypes and compare feel on device. The web approach is simpler but may fight WKWebView's native UIScrollView bounce.
- **Long-press vs text selection coexistence:** The recommended CSS approach (user-select:none on container, user-select:text on content) is theoretically sound and matches how Discord/Telegram handle it, but needs real-device validation. If it does not work, fall back to whole-message copy only (Discord's approach).
- **Swipe-to-reply backend support:** Deferred to v2.3+, but worth a quick investigation during v2.2 to determine if the Claude SDK session protocol can accept reply context. This would inform whether D-1 is feasible for a future milestone.
- **Server.url caching in WKWebView:** Vite's content-hashed filenames should handle this, but nginx cache headers should be audited during Phase 1 to confirm. No code change needed if headers are correct.

## Sources

### Primary (HIGH confidence)
- [Apple HIG: Gestures](https://developer.apple.com/design/human-interface-guidelines/gestures)
- [Apple HIG: Context Menus](https://developer.apple.com/design/human-interface-guidelines/context-menus)
- [Capacitor Official Plugin APIs](https://capacitorjs.com/docs/apis) -- App, Clipboard, Share, Action Sheet, Network, Browser
- [NNGroup: Contextual Swipe](https://www.nngroup.com/articles/contextual-swipe/)
- [WebKit Bug Trackers](https://bugs.webkit.org/) -- 192564 (keyboard viewport), 176454 (overscroll-behavior), 173434 (120Hz rAF)
- Existing codebase: Sidebar.tsx, haptics.ts, native-plugins.ts, platform.ts, useKeyboardOffset.ts, base.css
- npm registry version verification (2026-03-28)

### Secondary (MEDIUM confidence)
- [Capacitor GitHub Issues/Discussions](https://github.com/ionic-team/capacitor) -- gesture conflicts, WKWebView behavior, keyboard issues
- [@use-gesture/react documentation](https://use-gesture.netlify.app/docs/faq/) -- passive event listener analysis
- [Ionic/Cordova iOS issues](https://github.com/apache/cordova-ios/issues) -- CSS animation compositor bug, overscroll behavior
- Reference app analysis (iMessage, WhatsApp, Telegram, Discord, GitHub Mobile, Blink Shell, Working Copy)

### Tertiary (LOW confidence)
- Community blog posts on WKWebView scroll bounce control -- multiple approaches documented, effectiveness varies by iOS version
- @capacitor-community/privacy-screen compatibility claim -- peer dep says >=7.0.0 but no first-party verification

---
*Research completed: 2026-03-28*
*Ready for roadmap: yes*
