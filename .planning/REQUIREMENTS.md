# Requirements: Loom v2.1 "The Mobile"

**Defined:** 2026-03-27
**Core Value:** Make AI agent work visible, beautiful, and controllable — now as a native-feeling iOS app

## v2.1 Requirements

Requirements for this milestone. Each maps to roadmap phases.

### Platform Foundation

- [ ] **PLAT-01**: App detects native vs web platform and configures API/WS URLs accordingly
- [ ] **PLAT-02**: All fetch() calls route through centralized URL helper supporting same-origin (web) and remote server (Capacitor bundled) modes
- [ ] **PLAT-03**: All WebSocket connections construct absolute URLs for Capacitor bundled mode
- [ ] **PLAT-04**: Express backend accepts requests from `capacitor://localhost` origin (CORS whitelist)

### Keyboard & Composer

- [ ] **KEY-01**: Capacitor Keyboard plugin provides reliable keyboard height events on iOS
- [ ] **KEY-02**: Keyboard avoidance uses native `keyboardWillShow`/`keyboardWillHide` events instead of visualViewport hack
- [ ] **KEY-03**: Composer slides smoothly with keyboard animation, maintaining CSS `--keyboard-offset` pattern
- [ ] **KEY-04**: Message list auto-scrolls to latest message when keyboard opens
- [ ] **KEY-05**: Keyboard resize mode set to `none` — WKWebView doesn't auto-resize

### Touch & Layout

- [ ] **TOUCH-01**: All interactive elements have 44px+ touch targets at mobile breakpoint
- [ ] **TOUCH-02**: Safe-area insets applied correctly on all four edges
- [ ] **TOUCH-03**: App shell prevents rubber-band overscroll at page level
- [ ] **TOUCH-04**: Gesture back navigation handled gracefully (no conflict with sidebar drawer)
- [ ] **TOUCH-05**: Primary actions (send, stop) positioned within thumb-zone reach

### Native Plugins

- [ ] **NATIVE-01**: Status bar shows light text on dark background matching app theme
- [ ] **NATIVE-02**: Splash screen matches app background and hides smoothly after React mounts
- [ ] **NATIVE-03**: Haptic feedback on message send, tool completion, and error states
- [ ] **NATIVE-04**: Capacitor plugins load via dynamic imports (tree-shaken from web builds)

### Motion & Animation

- [ ] **MOTION-01**: Device refresh rate detected (60Hz vs 120Hz) at runtime
- [ ] **MOTION-02**: Spring/transition durations adapted for 120Hz ProMotion displays
- [ ] **MOTION-03**: Info.plist includes `CADisableMinimumFrameDurationOnPhone` for ProMotion opt-in

### Bundled Assets

- [ ] **BUNDLE-01**: Vite production build syncs to iOS app via `cap sync` pipeline
- [ ] **BUNDLE-02**: App loads and functions correctly from bundled assets with remote API
- [ ] **BUNDLE-03**: Clear error state when server/VPN connection lost
- [ ] **BUNDLE-04**: Splash-to-auth-to-content flow without white flash

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
| PLAT-01 | — | Pending |
| PLAT-02 | — | Pending |
| PLAT-03 | — | Pending |
| PLAT-04 | — | Pending |
| KEY-01 | — | Pending |
| KEY-02 | — | Pending |
| KEY-03 | — | Pending |
| KEY-04 | — | Pending |
| KEY-05 | — | Pending |
| TOUCH-01 | — | Pending |
| TOUCH-02 | — | Pending |
| TOUCH-03 | — | Pending |
| TOUCH-04 | — | Pending |
| TOUCH-05 | — | Pending |
| NATIVE-01 | — | Pending |
| NATIVE-02 | — | Pending |
| NATIVE-03 | — | Pending |
| NATIVE-04 | — | Pending |
| MOTION-01 | — | Pending |
| MOTION-02 | — | Pending |
| MOTION-03 | — | Pending |
| BUNDLE-01 | — | Pending |
| BUNDLE-02 | — | Pending |
| BUNDLE-03 | — | Pending |
| BUNDLE-04 | — | Pending |

**Coverage:**
- v2.1 requirements: 25 total
- Mapped to phases: 0
- Unmapped: 25

---
*Requirements defined: 2026-03-27*
*Last updated: 2026-03-27 after initial definition*
