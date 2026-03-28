# Requirements: Loom v2.1 "The Mobile"

**Defined:** 2026-03-27
**Core Value:** Make AI agent work visible, beautiful, and controllable — now as a native-feeling iOS app

## v2.1 Requirements

Requirements for this milestone. Each maps to roadmap phases.

### Platform Foundation

- [x] **PLAT-01**: App detects native vs web platform and configures API/WS URLs accordingly
- [x] **PLAT-02**: All fetch() calls route through centralized URL helper supporting same-origin (web) and remote server (Capacitor bundled) modes
- [x] **PLAT-03**: All WebSocket connections construct absolute URLs for Capacitor bundled mode
- [x] **PLAT-04**: Express backend accepts requests from `capacitor://localhost` origin (CORS whitelist)

### Keyboard & Composer

- [x] **KEY-01**: Capacitor Keyboard plugin provides reliable keyboard height events on iOS
- [x] **KEY-02**: Keyboard avoidance uses native `keyboardWillShow`/`keyboardWillHide` events instead of visualViewport hack
- [x] **KEY-03**: Composer slides smoothly with keyboard animation, maintaining CSS `--keyboard-offset` pattern
- [x] **KEY-04**: Message list auto-scrolls to latest message when keyboard opens
- [x] **KEY-05**: Keyboard resize mode set to `none` — WKWebView doesn't auto-resize

### Touch & Layout

- [x] **TOUCH-01**: All interactive elements have 44px+ touch targets at mobile breakpoint
- [x] **TOUCH-02**: Safe-area insets applied correctly on all four edges
- [x] **TOUCH-03**: App shell prevents rubber-band overscroll at page level
- [x] **TOUCH-04**: Gesture back navigation handled gracefully (no conflict with sidebar drawer)
- [x] **TOUCH-05**: Primary actions (send, stop) positioned within thumb-zone reach

### Native Plugins

- [x] **NATIVE-01**: Status bar shows light text on dark background matching app theme
- [x] **NATIVE-02**: Splash screen matches app background and hides smoothly after React mounts
- [x] **NATIVE-03**: Haptic feedback on message send, tool completion, and error states
- [x] **NATIVE-04**: Capacitor plugins load via dynamic imports (tree-shaken from web builds)

### Motion & Animation

- [x] **MOTION-01**: ProMotion 120Hz rendering enabled via Info.plist opt-in (runtime detection unnecessary for CSS-first motion strategy)
- [x] **MOTION-02**: Spring/transition durations adapted for 120Hz ProMotion displays
- [x] **MOTION-03**: Info.plist includes `CADisableMinimumFrameDurationOnPhone` for ProMotion opt-in

### Bundled Assets

- [x] **BUNDLE-01**: Vite production build syncs to iOS app via `cap sync` pipeline
- [x] **BUNDLE-02**: App loads and functions correctly from bundled assets with remote API
- [x] **BUNDLE-03**: Clear error state when server/VPN connection lost
- [x] **BUNDLE-04**: Splash-to-auth-to-content flow without white flash

## Future Requirements

Deferred to later milestones. Tracked but not in current roadmap.

### Push & Notifications

- **PUSH-01**: Push notifications for long-running task completion (APNS)
- **PUSH-02**: Local notifications for background session events

### Advanced Native

- **ADV-01**: Face ID / Touch ID authentication
- **ADV-02**: Share extension for sharing content into Loom
- **ADV-03**: iPad split-screen layout optimization

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Push notifications | APNS server integration + Apple Dev Program — overkill for personal use |
| Face ID / biometrics | Auth system is JWT with hardcoded creds — biometrics on top is theater |
| Offline conversation cache | AI assistant is inherently online — focus on fast online, not fake offline |
| Share extension | Unclear use case for coding assistant, significant native code |
| iPad split-screen | Portrait-phone-first; current responsive layout works acceptably on iPad |
| Native file picker | Loom has its own backend-connected file tree |
| Camera integration | Not relevant for coding assistant |
| WebGL / Metal graphics | Deferred to v2.3 "The Polish" |
| CoreML on-device | Not needed — all AI inference is server-side |
| Separate mobile entry point | Single codebase, platform detection at runtime |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| PLAT-01 | Phase 59 | Complete |
| PLAT-02 | Phase 59 | Complete |
| PLAT-03 | Phase 59 | Complete |
| PLAT-04 | Phase 59 | Complete |
| KEY-01 | Phase 60 | Complete |
| KEY-02 | Phase 60 | Complete |
| KEY-03 | Phase 60 | Complete |
| KEY-04 | Phase 60 | Complete |
| KEY-05 | Phase 60 | Complete |
| TOUCH-01 | Phase 61 | Complete |
| TOUCH-02 | Phase 61 | Complete |
| TOUCH-03 | Phase 61 | Complete |
| TOUCH-04 | Phase 61 | Complete |
| TOUCH-05 | Phase 61 | Complete |
| NATIVE-01 | Phase 61 | Complete |
| NATIVE-02 | Phase 61 | Complete |
| NATIVE-03 | Phase 62 | Complete |
| NATIVE-04 | Phase 61 | Complete |
| MOTION-01 | Phase 62 | Complete |
| MOTION-02 | Phase 62 | Complete |
| MOTION-03 | Phase 62 | Complete |
| BUNDLE-01 | Phase 63 | Complete |
| BUNDLE-02 | Phase 63 | Complete |
| BUNDLE-03 | Phase 63 | Complete |
| BUNDLE-04 | Phase 63 | Complete |

**Coverage:**
- v2.1 requirements: 25 total
- Mapped to phases: 25/25
- Unmapped: 0

---
*Requirements defined: 2026-03-27*
*Last updated: 2026-03-27 after roadmap creation*
