# Requirements: Loom v3.0 "The App"

**Defined:** 2026-03-30
**Core Value:** Make AI agent work visible, beautiful, and controllable — now with native iOS capabilities the web can't provide

## v3.0 Requirements

Requirements for the native iOS app. Each maps to roadmap phases.

### Scaffolding

- [ ] **SCAFF-01**: Developer can build and install Expo dev build on iPhone 16 Pro Max via EAS Build
- [ ] **SCAFF-02**: Monorepo configured with npm workspaces — `packages/shared/`, `apps/web/`, `apps/mobile/`
- [ ] **SCAFF-03**: Shared package contains types, Zustand store factories, WebSocket client, stream multiplexer, and API client
- [ ] **SCAFF-04**: Both Vite (web) and Metro (native) resolve shared package imports correctly
- [ ] **SCAFF-05**: Apple Developer Program enrolled with APNs certificates configured for push notifications
- [ ] **SCAFF-06**: NativeWind v4 configured with representative styling validated on device

### Chat

- [ ] **CHAT-01**: User can view a scrollable list of chat sessions grouped by project
- [ ] **CHAT-02**: User can create a new chat session and select a project
- [ ] **CHAT-03**: User can switch between sessions via sidebar drawer (swipe from left edge)
- [ ] **CHAT-04**: User can send a message and see streaming markdown response in real-time
- [ ] **CHAT-05**: User can see tool call cards (Read/Write/Execute/Search/Bash/MCP) with expand/collapse and status indicators
- [ ] **CHAT-06**: User can see thinking blocks with expand/collapse disclosure
- [ ] **CHAT-07**: User can see code blocks with syntax-appropriate monospace rendering
- [ ] **CHAT-08**: User can scroll through 50+ messages at 60fps with no jank
- [ ] **CHAT-09**: User can authenticate via JWT token with secure storage (iOS Keychain)
- [ ] **CHAT-10**: User sees connection status banner when WebSocket disconnects
- [ ] **CHAT-11**: App reconnects WebSocket automatically on foreground with exponential backoff
- [ ] **CHAT-12**: Keyboard avoidance animates at 120Hz in sync with iOS keyboard

### Native Feel

- [ ] **NATIVE-01**: All interactive elements have haptic feedback (send, tool complete, permission, error, swipe)
- [ ] **NATIVE-02**: All transitions use spring physics via react-native-reanimated at 120Hz ProMotion
- [ ] **NATIVE-03**: User can swipe-to-delete sessions from the session list
- [ ] **NATIVE-04**: User can long-press messages for context menu (Copy, Retry, Share)
- [ ] **NATIVE-05**: User can pull-to-refresh the session list
- [ ] **NATIVE-06**: Status bar adapts to content (light/dark based on surface)
- [ ] **NATIVE-07**: Safe area insets correctly handle notch, Dynamic Island, and home indicator
- [ ] **NATIVE-08**: All animations respect Reduce Motion accessibility setting

### Agent

- [ ] **AGENT-01**: User can approve or deny permission requests inline in the chat interface
- [ ] **AGENT-02**: User receives push notification when Claude requests permission (file write, command execution)
- [ ] **AGENT-03**: User can approve or deny permission directly from the push notification (without opening the app)
- [ ] **AGENT-04**: User receives push notification when a session completes or encounters an error
- [ ] **AGENT-05**: Push notification taps deep-link to the relevant session
- [ ] **AGENT-06**: Backend registers device push tokens and sends notifications via Expo Push Service
- [ ] **AGENT-07**: Silent push keeps session state in sync when app is backgrounded

### Polish

- [ ] **POLISH-01**: Code blocks have syntax highlighting (approach TBD: native Text or WebView-per-block)
- [ ] **POLISH-02**: User can share code blocks or full conversations via native iOS share sheet
- [ ] **POLISH-03**: User can copy message content via context menu
- [ ] **POLISH-04**: Follow-up suggestion chips appear after assistant responses
- [ ] **POLISH-05**: Full VoiceOver accessibility — all elements labeled, navigation order logical
- [ ] **POLISH-06**: User can pin sessions for quick access
- [ ] **POLISH-07**: User can search sessions by title

## Future Requirements (v3.1+)

### Dynamic Island & Live Activities

- **DYNISLAND-01**: Dynamic Island shows active session status (model, thinking/writing/executing)
- **DYNISLAND-02**: Live Activity shows token count and elapsed time for long sessions

### Advanced Features

- **ADV-01**: Share Extension receives content INTO Loom from other apps
- **ADV-02**: Spotlight search indexes session titles
- **ADV-03**: Siri Shortcuts for common actions (new session, resume last)
- **ADV-04**: Image attachment support (camera, photo library, paste)
- **ADV-05**: Swipe-to-reply on individual messages

### Platform Expansion

- **PLAT-01**: Android support via React Native (same codebase)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Terminal/shell on mobile | Mobile is a remote control for the agent, not a workstation |
| File tree/editor on mobile | Same — use desktop web for workspace features |
| Offline mode | Loom requires server connection by design |
| Bottom tab navigation | Anti-pattern for chat apps — sidebar drawer matches ChatGPT/Claude iOS |
| WebView for chat rendering | Exact problem we're escaping from Capacitor |
| Character-by-character typewriter | Anti-pattern — batch rendering via debounced setState |
| Android in v3.0 | iOS-only first — doubles testing surface if done in parallel |
| Port web UI components to RN | 100% new components designed mobile-first from reference apps |
| Light mode | Dark-only for v3.0 — matches web app constraint |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SCAFF-01 | — | Pending |
| SCAFF-02 | — | Pending |
| SCAFF-03 | — | Pending |
| SCAFF-04 | — | Pending |
| SCAFF-05 | — | Pending |
| SCAFF-06 | — | Pending |
| CHAT-01 | — | Pending |
| CHAT-02 | — | Pending |
| CHAT-03 | — | Pending |
| CHAT-04 | — | Pending |
| CHAT-05 | — | Pending |
| CHAT-06 | — | Pending |
| CHAT-07 | — | Pending |
| CHAT-08 | — | Pending |
| CHAT-09 | — | Pending |
| CHAT-10 | — | Pending |
| CHAT-11 | — | Pending |
| CHAT-12 | — | Pending |
| NATIVE-01 | — | Pending |
| NATIVE-02 | — | Pending |
| NATIVE-03 | — | Pending |
| NATIVE-04 | — | Pending |
| NATIVE-05 | — | Pending |
| NATIVE-06 | — | Pending |
| NATIVE-07 | — | Pending |
| NATIVE-08 | — | Pending |
| AGENT-01 | — | Pending |
| AGENT-02 | — | Pending |
| AGENT-03 | — | Pending |
| AGENT-04 | — | Pending |
| AGENT-05 | — | Pending |
| AGENT-06 | — | Pending |
| AGENT-07 | — | Pending |
| POLISH-01 | — | Pending |
| POLISH-02 | — | Pending |
| POLISH-03 | — | Pending |
| POLISH-04 | — | Pending |
| POLISH-05 | — | Pending |
| POLISH-06 | — | Pending |
| POLISH-07 | — | Pending |

**Coverage:**
- v3.0 requirements: 39 total
- Mapped to phases: 0
- Unmapped: 39 ⚠️

---
*Requirements defined: 2026-03-30*
*Last updated: 2026-03-30 after initial definition*
