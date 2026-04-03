# Requirements: Loom v3.1 "The App (Rebuilt)"

**Defined:** 2026-04-03
**Core Value:** Make AI agent work visible, beautiful, and controllable — every tool call, every code write, every MCP interaction should be a satisfying visual experience that enhances understanding of what the agent is doing.

## v3.1 Requirements

Requirements for this milestone. Each maps to roadmap phases.

### Navigation & Layout

- [ ] **NAV-01**: User sees slide drawer with session list on swipe-right or hamburger tap
- [ ] **NAV-02**: User navigates between drawer and chat screen with animated transition
- [ ] **NAV-03**: App shell respects iOS safe areas (notch, Dynamic Island, home indicator)
- [ ] **NAV-04**: Main content shifts with parallax effect when drawer opens

### Chat UI

- [ ] **CHAT-01**: User sees messages in inverted FlatList — user bubbles right/accent, assistant left/neutral
- [ ] **CHAT-02**: User sees streaming markdown rendered with syntax highlighting as AI responds
- [ ] **CHAT-03**: User sees thinking indicator before first token arrives
- [ ] **CHAT-04**: Message list auto-scrolls to latest during streaming
- [ ] **CHAT-05**: User sees scroll-to-bottom button when scrolled up
- [ ] **CHAT-06**: User can copy message text via long-press
- [ ] **CHAT-07**: Messages appear with spring-physics entering animation
- [ ] **CHAT-08**: Elevated surfaces use glass/blur effects per Soul doc hierarchy
- [ ] **CHAT-09**: Thinking disclosure blocks expand/collapse

### Composer

- [ ] **COMP-01**: Composer auto-grows as user types (up to max height, then scrolls)
- [ ] **COMP-02**: Keyboard avoidance smoothly pushes content up (react-native-keyboard-controller)
- [ ] **COMP-03**: Send button reflects state (disabled/empty, enabled/ready, stop/streaming)
- [ ] **COMP-04**: Haptic feedback on message send
- [ ] **COMP-05**: New chat shows prompt suggestion chips that pre-fill composer
- [ ] **COMP-06**: Stop button replaces send during active streaming

### Session Management

- [ ] **SESS-01**: Sessions grouped by date in drawer (Today, Yesterday, Last Week, etc.)
- [ ] **SESS-02**: User can create new session from drawer
- [ ] **SESS-03**: User can switch sessions by tapping in drawer
- [ ] **SESS-04**: User can search sessions by title
- [ ] **SESS-05**: User can pin sessions to top of list
- [ ] **SESS-06**: User can delete sessions via swipe or context menu
- [ ] **SESS-07**: Sessions grouped by project with collapsible project headers
- [ ] **SESS-08**: Native iOS context menu on session items (rename, pin, delete) via zeego

### Loom Tools

- [ ] **TOOL-01**: Tool call cards appear inline in message stream (Bash, Read, Edit, Write, Glob, Grep)
- [ ] **TOOL-02**: Tool cards show state transitions (pending → running → complete/error)
- [ ] **TOOL-03**: User can expand/collapse tool call details
- [ ] **TOOL-04**: Permission requests appear as elevated inline cards with approve/deny
- [ ] **TOOL-05**: User can approve/deny permission with single tap + haptic
- [ ] **TOOL-06**: Multiple consecutive tool calls collapse into accordion group

### Connection & Auth

- [x] **CONN-01**: User authenticates via login screen
- [x] **CONN-02**: Auth token persists in iOS Keychain (SecureStore)
- [x] **CONN-03**: WebSocket connects on app launch
- [ ] **CONN-04**: WebSocket reconnects on disconnect with exponential backoff
- [ ] **CONN-05**: Connection banner shows when disconnected
- [ ] **CONN-06**: Stream content persists during app background (MMKV snapshot)
- [x] **CONN-07**: App resumes WebSocket on foreground with correct auth

## Future Requirements

Deferred to future milestones. Tracked but not in current roadmap.

### Push & Live (v4.0)

- **PUSH-01**: User receives push notification when Claude asks a question
- **PUSH-02**: User can approve/deny permission from notification action
- **PUSH-03**: Dynamic Island shows active session status and model name
- **PUSH-04**: Live Activities track long-running sessions

### Multi-Provider (v4.0)

- **PROV-01**: User can switch between Claude, Codex, Gemini providers
- **PROV-02**: Provider tabs show concurrent sessions
- **PROV-03**: Shared context between provider tabs

### Extended Features (v4.0)

- **EXT-01**: File upload from iOS photo library or Files app
- **EXT-02**: Integrated terminal/shell
- **EXT-03**: Settings screen (appearance, API keys, providers)
- **EXT-04**: Model selector in composer area

### Visual Polish (v5.0)

- **VIS-01**: Dynamic color shifts during streaming (hue warmth, accent pulse)
- **VIS-02**: Aurora/ambient effects during streaming
- **VIS-03**: Advanced glass surface effects (frosted, animated)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Android app | iOS-first; defer until iOS is daily-driver quality |
| Swipe-to-reply | Needs backend reply threading support |
| Character-by-character typewriter | Soul doc explicitly forbids; anti-pattern |
| Gifted-chat as base | Wrong abstraction for AI streaming (fights customization) |
| Paid chat SDK (Stream, Sendbird) | Vendor lock-in, overkill for single-user app |
| Pure black backgrounds | Soul doc: darkest surface is rgb(38,35,33), not #000 |
| Port web UI to React Native | Redesign from scratch, don't convert div/span to View/Text |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| NAV-01 | Phase 74 | Pending |
| NAV-02 | Phase 74 | Pending |
| NAV-03 | Phase 74 | Pending |
| NAV-04 | Phase 74 | Pending |
| CHAT-01 | Phase 75 | Pending |
| CHAT-02 | Phase 75 | Pending |
| CHAT-03 | Phase 75 | Pending |
| CHAT-04 | Phase 75 | Pending |
| CHAT-05 | Phase 76 | Pending |
| CHAT-06 | Phase 76 | Pending |
| CHAT-07 | Phase 77 | Pending |
| CHAT-08 | Phase 77 | Pending |
| CHAT-09 | Phase 75 | Pending |
| COMP-01 | Phase 75 | Pending |
| COMP-02 | Phase 75 | Pending |
| COMP-03 | Phase 75 | Pending |
| COMP-04 | Phase 76 | Pending |
| COMP-05 | Phase 76 | Pending |
| COMP-06 | Phase 75 | Pending |
| SESS-01 | Phase 76 | Pending |
| SESS-02 | Phase 76 | Pending |
| SESS-03 | Phase 76 | Pending |
| SESS-04 | Phase 76 | Pending |
| SESS-05 | Phase 76 | Pending |
| SESS-06 | Phase 76 | Pending |
| SESS-07 | Phase 76 | Pending |
| SESS-08 | Phase 76 | Pending |
| TOOL-01 | Phase 77 | Pending |
| TOOL-02 | Phase 77 | Pending |
| TOOL-03 | Phase 77 | Pending |
| TOOL-04 | Phase 77 | Pending |
| TOOL-05 | Phase 77 | Pending |
| TOOL-06 | Phase 77 | Pending |
| CONN-01 | Phase 74 | Complete |
| CONN-02 | Phase 74 | Complete |
| CONN-03 | Phase 74 | Complete |
| CONN-04 | Phase 74 | Pending |
| CONN-05 | Phase 74 | Pending |
| CONN-06 | Phase 77 | Pending |
| CONN-07 | Phase 74 | Complete |

**Coverage:**
- v3.1 requirements: 35 total
- Mapped to phases: 35
- Unmapped: 0

---
*Requirements defined: 2026-04-03*
*Last updated: 2026-04-03 after roadmap creation — all 35 requirements mapped to Phases 74-77*
