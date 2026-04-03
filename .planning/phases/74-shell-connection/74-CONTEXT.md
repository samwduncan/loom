# Phase 74: Shell & Connection - Context

**Gathered:** 2026-04-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver the app shell: auth flow, WebSocket lifecycle, drawer navigation with stub session list, theme system, and safe area compliance. User can launch the app, authenticate with a token, see a working drawer, navigate to a chat screen placeholder, and maintain a live WebSocket connection that reconnects on disruption and resumes on foreground.

Requirements: CONN-01, CONN-02, CONN-03, CONN-04, CONN-05, CONN-07, NAV-01, NAV-02, NAV-03, NAV-04

</domain>

<decisions>
## Implementation Decisions

### Styling Foundation (BREAKING CHANGE from Phase 69)
- **D-01:** Drop NativeWind entirely. Use `StyleSheet.create` + typed Theme object following Private Mind's `createStyles(theme)` pattern. All Soul doc values (colors, spacing, typography, springs) centralized in a single `theme.ts` file. No `className` prop anywhere in mobile/.
- **D-02:** Remove `nativewind` and `react-native-css-interop` from mobile/package.json. Delete `tailwind.config.ts`, `global.css`, `postcss.config.js` from mobile/. Remove NativeWind preset from `babel.config.js`.
- **D-03:** Theme values pulled directly from NATIVE-APP-SOUL.md: warm charcoal base `rgb(38,35,33)`, accent `rgb(196,108,88)`, Inter typography, all 6 spring configs (Micro/Standard/Navigation/Drawer/Expand/Dramatic), 4 surface tiers. Dark mode only -- no light mode.

### Phase 69 Code Cleanup
- **D-04:** Full cleanup. Delete ALL Phase 69 components (`mobile/components/**` -- 26 files) and route screens (`mobile/app/**` -- 9 files). Start fresh with empty directories. Keep: `mobile/hooks/` (7 hooks), `mobile/lib/` (6 files), Expo config files (`app.json`, `eas.json`, `metro.config.js`, `tsconfig.json`).

### Auth Flow
- **D-05:** Token input screen on first launch. Full-screen with Loom branding, server URL field (pre-filled with Tailscale IP `100.86.4.57:5555`), JWT token field, Connect button. Shows on first launch or when stored token is invalid. After successful connect, never shown again unless user clears token. Developer-tool UX -- no username/password form.
- **D-06:** Auto-connect on subsequent launches. App tries stored token from iOS Keychain (expo-secure-store). If valid: straight to chat shell. If invalid/missing: show token input screen. Carries forward Phase 69 D-07/D-09.

### Drawer Navigation
- **D-07:** Use `@react-navigation/drawer` (already a dependency) with `drawerType: 'slide'`, custom `drawerContent` component, `swipeEdgeWidth: width` (full-width swipe area), `overlayColor: 'rgba(0,0,0,0.4)'`. Matches Private Mind's exact pattern from PATTERNS-PLAYBOOK.
- **D-08:** Stub session list in drawer: Loom branding at top, "New Chat" button, flat list of sessions (title + relative date, no grouping/search/pin/context menus). Connection status dot in drawer footer. Enough for navigation. Full session management is Phase 76 scope.
- **D-09:** Parallax effect: main content shifts 20px right during drawer open, per Soul doc. Drawer spring: damping 20, stiffness 100, ~350ms settle.

### Chat Screen (Placeholder)
- **D-10:** Empty state + composer shell. Shows empty chat state (Claude icon + "How can I help?" in Body text) and a visual-only composer bar (text input + disabled send button). Proves layout, safe areas, and keyboard avoidance work. No actual message sending -- that's Phase 75. Hamburger icon in header opens drawer.

### Connection Resilience (Carries Forward Phase 69 D-27 through D-30)
- **D-11:** Background: disconnect WebSocket after 30s grace period. Foreground: detect disconnected state, trigger reconnect with exponential backoff (shared WebSocket client already has this logic). AppState listener in root layout.
- **D-12:** Connection banner: fixed overlay at top of chat content (does NOT push layout down). Glass surface, slides down with Navigation spring (damping 22, stiffness 130) on disconnect, slides up on reconnect. Auto-dismisses on successful reconnect. Content stays in place underneath.
- **D-13:** Cold-start guard: `hasConnectedOnce` useRef pattern. No banner flash before first connection attempt. Banner only appears after first connection failure or a subsequent disconnect.
- **D-14:** Active stream interrupted by backgrounding: persist partial message to MMKV. On foreground return, show partial message with "interrupted" indicator. User can retry.

### Testing
- **D-15:** Jest (Expo default) + unit tests on logic. Test auth flow (login, token persist, token clear, invalid token), WebSocket lifecycle (connect, reconnect, foreground resume, 30s background grace, cold-start guard), and drawer navigation state. No component rendering/snapshot tests -- focus on hooks and state logic.

### Claude's Discretion
- Theme object structure (exact TypeScript type, how to organize colors/spacing/typography sub-objects)
- Drawer header design (Loom branding layout, icon choice)
- Connection banner text content ("Reconnecting..." vs "Connection lost" etc.)
- Auth screen visual polish (button styling, input field design, error states)
- How to handle the NativeWind removal in babel/metro config

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Visual Contract (PRIMARY)
- `.planning/NATIVE-APP-SOUL.md` -- The authoritative visual contract. Spring configs, surface tiers, dynamic color, haptics, screen specs, anti-patterns. Every component must comply.

### Reference App Patterns
- `mobile/.planning/research/PATTERNS-PLAYBOOK.md` -- Copy-paste-ready patterns for drawer, sessions, theme system, context menus, message list, streaming. Primary implementation reference.

### v3.1 Strategy
- `.planning/ROADMAP.md` -- Phase 74-77 definitions, success criteria, dependencies, known risks
- `.planning/REQUIREMENTS.md` -- CONN-01 through CONN-07, NAV-01 through NAV-04 acceptance criteria
- `.planning/PROJECT.md` -- Core value, architecture, constraints

### Prior Phase Context
- `.planning/phases/68-scaffolding-design/68-CONTEXT.md` -- Workspace structure, store factories, auth interface, Expo Router setup
- `.planning/phases/69-chat-foundation/69-CONTEXT.md` -- Phase 69 decisions (D-27 through D-30 connection lifecycle carry forward)

### API & Backend
- `.planning/BACKEND_API_CONTRACT.md` -- 47+ endpoints, WebSocket protocol. Required for auth, session list, WebSocket connection.

### Existing Shared Code
- `shared/lib/websocket-client.ts` -- WebSocket client with reconnection state machine
- `shared/lib/api-client.ts` -- API client with auth injection
- `shared/lib/auth.ts` -- AuthProvider interface
- `shared/stores/` -- 5 Zustand factory stores
- `shared/types/` -- Type definitions

### Existing Mobile Code (KEEP)
- `mobile/hooks/` -- useAuth, useConnection, useSessions, useMessageList, useAppState, useDynamicColor, useScrollToBottom
- `mobile/lib/auth-provider.ts` -- iOS Keychain auth provider (expo-secure-store)
- `mobile/lib/platform.ts` -- Tailscale API/WS URLs
- `mobile/lib/storage-adapter.ts` -- MMKV storage adapter
- `mobile/lib/websocket-init.ts` -- WebSocket client instantiation
- `mobile/lib/colors.ts` -- Color utilities
- `mobile/lib/springs.ts` -- Spring config constants

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **7 custom hooks** in `mobile/hooks/` -- useAuth (auth state machine), useConnection (WS lifecycle), useSessions (session CRUD), useMessageList (message state), useAppState (foreground/background), useDynamicColor (color shifts), useScrollToBottom (scroll pill logic). All may need refactoring to remove NativeWind/className dependencies but business logic transfers.
- **6 lib files** in `mobile/lib/` -- auth-provider (SecureStore), platform (Tailscale URLs), storage-adapter (MMKV), websocket-init (WS client setup), colors (color utils), springs (Soul doc spring configs). These are styling-agnostic and transfer as-is.
- **5 Zustand stores** via shared/ factory pattern -- connection, stream, timeline, ui, file stores all instantiated with MMKV adapter.

### Established Patterns
- **Factory stores** -- `createTimelineStore(storageAdapter)`. Web passes localStorage, native passes MMKV.
- **Callback injection** -- WebSocket client and multiplexer use callback injection, not direct store imports.
- **Expo Router** -- File-based routing with drawer+stack groups: `(drawer)/index.tsx` = session list, `(drawer)/(stack)/chat/[id].tsx` = chat screen.

### Integration Points
- **Root layout** (`mobile/app/_layout.tsx`) -- WebSocket client instantiation, store wiring, auth check, AppState listener
- **Backend** (port 5555) -- WebSocket + REST API, platform-agnostic. Tailscale IP: 100.86.4.57
- **Drawer** -- Expo Router drawer component with custom content for session list

</code_context>

<specifics>
## Specific Ideas

- **Private Mind as pattern reference, not fork.** Copy patterns file-by-file with modifications. Own every line. Drawer layout, theme system, session grouping logic all come from PATTERNS-PLAYBOOK.md.
- **swd's priority order:** (1) Works smoothly, animations clean, layout optimized for iOS. (2) Matches familiar LLM chat app design. (3) Just works, daily-driver quality. The app is a vehicle for Loom's power.
- **NativeWind removal is Plan 1 scope.** Clean break before writing any new components. Remove deps, delete Phase 69 components, set up Theme object and createStyles pattern.
- **Keyboard avoidance validation.** Even though the composer is non-functional in Phase 74, it should correctly animate with the iOS keyboard via react-native-keyboard-controller. This validates the pattern for Phase 75.

</specifics>

<quality_bar>
## Quality Bar (Bard Assessment)

**Good:**
- Auth works (token screen, auto-connect, Keychain persistence)
- Drawer opens/closes with animation, session list shows real data from API
- WebSocket connects, reconnects, banner appears on disconnect
- Safe areas respected on all screens

**Exceptional:**
- The drawer parallax feels physical -- content shifts with mass and the overlay dims proportionally. Spring constants are hand-tuned, not defaults.
- Auth screen has Loom's warmth -- not a generic form. The token field and connect button use Soul doc surface tiers and spring feedback.
- Connection banner is genuinely glass -- blur shows the content beneath, and the slide-down animation has weight. Auto-dismiss on reconnect feels satisfying.
- Every tap in the app produces spring feedback + haptic. No silent taps anywhere -- the hamburger, session items, new chat button, connect button all respond physically.
- The theme system is so clean that Phase 75 can start building components immediately without any styling infrastructure work. `createStyles(theme)` pattern is established and documented.
- Cold start is fast and graceful: splash -> auth check -> connected chat shell, with no flashes, no layout shifts, no banner false alarms.

**What separates good from exceptional:** The delta is whether the shell feels like a finished app or a prototype. Good = things work. Exceptional = the drawer has spatial depth, the auth screen has personality, the connection banner has physical presence, and every interaction has spring physics. The user opens the app and thinks "this is polished" before they've even sent a message.

</quality_bar>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope.

</deferred>

---

*Phase: 74-shell-connection*
*Context gathered: 2026-04-03*
