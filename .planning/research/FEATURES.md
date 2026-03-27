# Feature Landscape: v2.1 "The Mobile"

**Domain:** iOS native-feeling AI chat workspace via Capacitor
**Researched:** 2026-03-27
**Confidence:** HIGH (Capacitor plugin APIs verified, Apple developer docs cross-referenced)

## Table Stakes

Features users expect from a native iOS app. Missing = app feels like a wrapped website.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Reliable keyboard avoidance | Every native iOS app handles this correctly. The current visualViewport hack is fragile. | Med | Replace with @capacitor/keyboard `keyboardWillShow` event. CSS `--keyboard-offset` pattern stays, just the source of the height changes. |
| Status bar matches app theme | Light text on dark status bar is the bare minimum for a dark-themed app. White/default looks broken. | Low | `StatusBar.setStyle(Style.Dark)` on app init. One call. |
| Smooth splash-to-content transition | White flash during WKWebView init screams "web wrapper". | Low | @capacitor/splash-screen with `launchAutoHide: false`, hide after React mounts. Background color must match `--surface-base`. |
| Touch targets >= 44px | Apple HIG minimum. Many desktop-optimized controls are smaller. | Med | Audit all interactive elements at mobile breakpoint. Some already 44px (sidebar items, composer buttons), others need work (tool card actions, file tree items). |
| Safe-area-inset compliance | Content behind notch/Dynamic Island/home indicator looks broken on iPhone. | Low | Already partially implemented (`env(safe-area-inset-top)` in base.css). Needs audit for all edges. |
| No scroll bounce on app shell | Native apps don't rubber-band at the page level. Individual scroll containers can. | Low | `overscroll-behavior: none` on body/html. May need `-webkit-overflow-scrolling` tuning in WKWebView. |
| Gesture back navigation | iOS users swipe from left edge to go back. Must not conflict with sidebar drawer. | Med | Sidebar drawer already uses swipe. Need to either (a) reserve left-edge gesture for iOS back or (b) disable iOS back gesture since Loom is single-screen SPA. |

## Differentiators

Features that make Loom feel premium, not just "not broken."

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Haptic feedback on key interactions | Confirms actions feel physically real. Message send "thunk", permission grant "tick", error "buzz". | Low | @capacitor/haptics -- `impact(Light)` for taps, `notification(Success)` for send, `notification(Error)` for failures. |
| 120Hz spring animations | ProMotion displays expose sluggish 60Hz-tuned animations. Crisp springs feel native. | Med | `CADisableMinimumFrameDurationOnPhone` in Info.plist + adaptive spring configs in motion.ts. CSS transitions benefit automatically. |
| Bundled assets mode | Sub-second app launch (no network fetch for UI). Works on airplane if API isn't needed. | High | API base URL abstraction across all fetch/WS calls. CORS whitelist. Vite build -> cap sync pipeline. |
| Keyboard-aware composer | Composer slides up smoothly with keyboard, stays pinned above it, scroll position preserved. | Med | Combination of Keyboard plugin events + CSS transition on `--keyboard-offset`. Current visualViewport hack partially works but needs the native height source for reliability. |
| Thumb-zone optimization | Bottom-heavy layout for one-handed use. Primary actions (send, stop) within thumb reach. | Med | Composer is already at bottom. Command palette trigger, navigation, and quick settings need to be reachable without stretching. |
| Scroll-to-bottom momentum | After keyboard opens and pushes content up, auto-scroll to latest message to maintain reading position. | Med | Integrate keyboard events with existing useScrollAnchor hook. On `keyboardWillShow`, trigger scroll anchor re-evaluation. |

## Anti-Features

Features to explicitly NOT build for v2.1.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Push notifications | Requires APNS server-side integration, Apple Developer Program enrollment, significant backend work. Not needed for personal use. | Defer to v2.2 or later. Local notifications for long-running tasks could be a simpler alternative. |
| Face ID / biometric auth | Current auth is JWT with hardcoded credentials. Adding biometrics on top of that is theater. | Defer until auth system is meaningful. |
| Offline conversation cache | Would require syncing conversation data to device. Loom is inherently online (talks to AI APIs). | Show a clear "disconnected" state instead. Cached UI shell is enough. |
| Share extension | Significant native code, unclear use case for a coding assistant. | Defer to v3.0 if ever. |
| Native file picker | Loom has its own file tree connected to the backend's filesystem. Native picker would be disconnected. | Keep existing web-based file tree. |
| iPad split-screen support | Adds complexity for a portrait-phone-first app. iPad layout is fundamentally different. | Defer. Current responsive layout works acceptably on iPad Safari. |
| Full offline mode | AI coding assistant requires network to function. Offline UI is lipstick on a pig. | Focus on fast online experience with bundled assets, not offline capability. |

## Feature Dependencies

```
Keyboard Plugin -> Keyboard-Aware Composer (needs keyboardHeight events)
Keyboard Plugin -> Scroll-to-Bottom on Keyboard (needs keyboard show/hide timing)
API Base URL Abstraction -> Bundled Assets Mode (fetch/WS need remote server URL)
CORS Whitelist Update -> Bundled Assets Mode (backend must accept capacitor:// origin)
Status Bar Plugin -> Immersive Layout (overlay mode with safe-area padding)
120Hz Detection -> Adaptive Spring Configs (needs Hz classification)
Info.plist ProMotion Key -> 120Hz CSS Animations (enables high refresh for CAAnimation)
Splash Screen Plugin -> Smooth App Launch (hide after React mount)
Touch Target Audit -> Haptic Feedback (haptics on elements that already have proper touch targets)
```

## MVP Recommendation

**Phase 1: Foundation (must-have for any native feel)**
1. Keyboard plugin + replace visualViewport hack (biggest UX win)
2. Status bar dark style (1 line, instant improvement)
3. Splash screen with fade (prevents white flash)
4. API base URL abstraction (prerequisite for bundled mode)
5. CORS whitelist update (prerequisite for bundled mode)

**Phase 2: Touch & Motion**
1. Touch target audit (44px enforcement)
2. Haptic feedback on key interactions
3. Safe-area audit (all four edges)
4. 120Hz detection + Info.plist key + spring tuning

**Phase 3: Bundled Assets**
1. Cap sync pipeline with production build
2. Bundled mode testing (all features work with remote API)
3. App launch flow (splash -> auth -> content)

**Defer:**
- Push notifications: Not needed for personal use, large backend effort
- Face ID: Auth system doesn't warrant it
- Offline mode: Fundamentally incompatible with app purpose

## Sources

- [Apple Human Interface Guidelines: Touch Targets](https://developer.apple.com/design/human-interface-guidelines/accessibility#Controls-and-interactions) -- 44pt minimum
- [Capacitor Plugin APIs](https://capacitorjs.com/docs/apis) -- All four plugin docs
- Phase 57 iOS Assessment (local) -- Deployment model analysis
- Phase 58 iOS fixes (local) -- Existing keyboard/safe-area implementation
