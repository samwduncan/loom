# Phase 69: Chat Foundation - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver the core native messaging loop end-to-end: user sends a message, sees streaming markdown response, manages sessions, authenticates, and stays connected. Every component ships Soul-doc-compliant with spring physics, correct surface tiers, and dynamic color from day one. No "polish later" debt.

Requirements: CHAT-01, CHAT-02, CHAT-03, CHAT-04, CHAT-09, CHAT-10, CHAT-11

</domain>

<decisions>
## Implementation Decisions

### Streaming Markdown Strategy
- **D-01:** Parallel evaluation in Plan 1: test react-native-streamdown AND build a minimal custom renderer spike. Compare rendering quality, performance, and styling control. Pick the winner for remaining plans.
- **D-02:** Phase 69 markdown scope: full markdown minus syntax-highlighted code blocks. Headings, bold, italic, inline code, lists, blockquotes, tables, horizontal rules, links. Code blocks render as unstyled monospace on surface-sunken background. Syntax highlighting is Phase 70 (Shiki integration per Soul doc).
- **D-03:** If both approaches fail the PoC, fallback to plain text streaming with basic inline markup (bold, italic, code) as an emergency baseline. Streaming must work — markdown quality can be iterated.

### Soul Doc Visual Fidelity
- **D-04:** Soul-compliant from the start. Every component built in Phase 69 implements the NATIVE-APP-SOUL.md specification: correct spring configs (Micro/Standard/Navigation/Drawer/Expand/Dramatic), 4-tier surface hierarchy, dynamic color shifts, proper typography. No deferred motion debt.
- **D-05:** Dynamic color implemented from the start: streaming warmth shift (hue 32→35, accent pulse), idle (neutral), error (cooler hue toward 20, desaturated). Thinking and permission color states also included if those UI elements exist in Phase 69.
- **D-06:** All Soul doc anti-patterns enforced from Phase 69: no instant state changes (#2), no silent interactions (#11), no loading spinners without context (#13), no stale state after backgrounding (#14).

### Auth & First Launch
- **D-07:** Auto-connect with token prompt. App auto-detects the Tailscale backend URL (prefilled from platform.ts). Only prompts for JWT/API key on first launch or when token is missing/invalid. Minimal friction.
- **D-08:** If connection fails, show error with manual server URL override option. Settings screen (already scaffolded) becomes the fallback for manual configuration.
- **D-09:** No separate onboarding flow or tutorial. First launch: token prompt → connect → empty session state. Developer-tool UX — assume the user knows what Loom is.

### Session List
- **D-10:** Full Soul doc session list in Phase 69. Grouped by project (project headers in Caption style), pinned sessions section at top, search input (glass background, expands on tap), swipe-to-delete with destructive action surface, staggered item appearance animations (30ms delay per item, max 10).
- **D-11:** Active session indicator: surface-raised background with 3px left accent border. Streaming indicator: accent dot pulses with opacity animation.
- **D-12:** Pull-to-refresh with custom spring (damping 25, stiffness 120), triggers at 60pt overscroll.
- **D-13:** "New Chat" button at top of drawer: accent background, 44px height, rounded-xl. Tapping opens project selection sheet (list of available projects from API). After selecting project, navigates to new chat screen.

### Composer
- **D-14:** Full Soul doc composer. Glass backdrop (blur showing last messages), single-line expanding to multi-line (max 6 lines, Standard spring on height change), send/stop toggle (accent→destructive with 200ms color transition), status bar below input (token count, model name, connection dot).
- **D-15:** Attachment button (+) present as visual placeholder, non-functional in Phase 69. Expands to empty action sheet or shows "Coming soon" toast. File attachment is Phase 70+ scope.
- **D-16:** Keyboard avoidance: perfect sync with iOS keyboard via react-native-keyboard-controller. NOT a spring — matches system curve exactly per Soul doc.
- **D-17:** If glass backdrop has performance issues on device, fallback to opaque surface-raised. Test glass first, measure FPS, decide during implementation.

### Message Layout
- **D-18:** Full Soul doc message layout. User messages: rounded bubble (surface-raised, rounded-2xl, p-4), right-aligned in layout, left-aligned text within. Assistant messages: free-flowing on surface-base, no container.
- **D-19:** 24px provider avatar at top-left of assistant messages (Claude terracotta icon). 24px turn spacing between different roles, 8px between same-role consecutive messages.
- **D-20:** Timestamps: shown after 5-minute gaps between messages (Caption, 12px, muted). Long-press timestamp reveal deferred — long-press context menu (Copy/Retry/Share) is Phase 71 gesture scope.
- **D-21:** Message entrance: user messages use Standard spring (opacity 0→1, translateY 20→0). Assistant first token fades in (150ms opacity). Streaming text flows without per-character animation.
- **D-22:** Scroll-to-bottom pill: glass surface, accent text, bounces once on appearance with Standard spring. Tapping animates scroll to bottom, pill fades out.

### Empty States & Loading
- **D-23:** New session empty state: provider avatar (24px) + model name + "How can I help?" in Body text on surface-base. If session has project context, show project name below. Understated, contextual.
- **D-24:** Empty session list: centered text "No sessions yet" (Body, text-muted) + "New Chat" button (accent, 44px). Spring entrance on first load.
- **D-25:** Loading states must have context per Soul doc anti-pattern #13: "Loading sessions..." with skeleton items (surface-raised rectangles pulsing), "Connecting to server..." with connection dot animating, "Sending..." on composer status bar during send.
- **D-26:** Streaming indicator: thin 2px accent-colored line at bottom of message area, pulsing (opacity 0.3→0.8, 1.5s cycle). Disappears when streaming completes.

### WebSocket Lifecycle on iOS
- **D-27:** Full AppState integration. Background: disconnect WebSocket after 30s grace period (iOS kills it anyway). Foreground: detect disconnected state, trigger reconnect with exponential backoff (shared WebSocket client already has this logic).
- **D-28:** Active stream interrupted by backgrounding: persist partial message to Zustand/MMKV. On foreground return, show partial message with "interrupted" indicator. User can retry to continue.
- **D-29:** Connection banner: Soul-doc compliant. Glass surface, slides down with Navigation spring (22/130), destructive tint for errors, auto-dismisses on successful reconnect with slide-up Standard spring. Connection dot in drawer footer transitions success→destructive→success.
- **D-30:** AppState listener registered in root layout (_layout.tsx). Handles: foreground→reconnect, background→start 30s disconnect timer, inactive→no action.

### Claude's Discretion
- Markdown renderer internal architecture (AST walker vs regex vs hybrid) — pick what performs best on device
- FlashList vs FlatList for message list — profile and choose based on 50+ message performance
- WebSocket message buffering strategy during reconnection — implementation detail
- Project selection sheet UI pattern (bottom sheet vs modal vs inline) — pick what fits Expo Router best

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Visual Contract (PRIMARY — supersedes all other visual specs)
- `.planning/NATIVE-APP-SOUL.md` — The authoritative visual contract for v3.0. Spring configs, surface tiers, dynamic color, haptics, screen specs, anti-patterns. **Every component must comply.**
- `.planning/phases/68-scaffolding-design/68-UI-SPEC.md` — Baseline design tokens (typography, color, spacing). Soul doc inherits these except where explicitly overridden.

### Phase 68 Context (Foundation this builds on)
- `.planning/phases/68-scaffolding-design/68-CONTEXT.md` — All Phase 68 decisions: workspace structure, store factories, auth interface, NativeWind validation, Expo Router setup

### Strategic Direction
- `.planning/ROADMAP.md` — Phase 69-73 definitions, success criteria, dependencies
- `.planning/REQUIREMENTS.md` — CHAT-01 through CHAT-11 acceptance criteria
- `.planning/PROJECT.md` — Core value, architecture, constraints

### API & Backend
- `.planning/BACKEND_API_CONTRACT.md` — 47+ endpoints, WebSocket protocol, session management API. Required for session list, create session, send message flows.

### Prior Research
- `.planning/phases/67.1-ios-bug-fixes/PLATFORM-RESEARCH.md` — Competitor architecture analysis (ChatGPT, Claude, Discord iOS)
- `.planning/phases/67.1-ios-bug-fixes/LIBRARY-RESEARCH.md` — React Native component library ecosystem

### Constitution
- `.planning/V2_CONSTITUTION.md` — Coding conventions. Section 13 (Touch Targets) transfers to native. Other sections may need native-specific amendments.

### Existing Shared Code (extraction source)
- `shared/lib/websocket-client.ts` — Class-based WebSocket client with reconnection state machine
- `shared/lib/stream-multiplexer.ts` — Callback-based message router (platform-agnostic)
- `shared/lib/api-client.ts` — API client with auth injection
- `shared/lib/auth.ts` — AuthProvider interface definition
- `shared/stores/` — 5 Zustand factory stores (connection, file, stream, timeline, ui)
- `shared/types/` — 13 type files (websocket, message, session, stream, etc.)

### Existing Mobile Code (Phase 68 scaffolding)
- `mobile/stores/index.ts` — Store instantiation with MMKV adapter
- `mobile/lib/auth-provider.ts` — iOS Keychain auth provider (expo-secure-store)
- `mobile/lib/platform.ts` — Tailscale API/WS URLs
- `mobile/lib/storage-adapter.ts` — MMKV storage adapter
- `mobile/components/primitives/` — 5 validated design primitives (Button, GlassSurface, ListItem, SurfaceCard, TextHierarchy)
- `mobile/app/` — Expo Router drawer+stack with placeholder screens

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **5 Zustand stores** already instantiated in `mobile/stores/index.ts` with MMKV — useTimelineStore, useConnectionStore, useUIStore, useStreamStore, useFileStore
- **WebSocketClient class** in shared — constructor accepts `resolveWsUrl` and `auth` (AuthProvider). Has reconnection state machine with exponential backoff. Configure method injects callbacks.
- **Stream multiplexer** in shared — pure function router with MultiplexerCallbacks interface. Routes content tokens, thinking blocks, tool use/result, activity text, stream start/end, errors.
- **AuthProvider** interface (`getToken`, `setToken`, `clearToken`) — native implementation exists in `mobile/lib/auth-provider.ts` using expo-secure-store
- **5 design primitives** validated in Phase 68: Button (with Micro spring press), GlassSurface (blur + overlay), ListItem (56px height, Soul-doc press feedback), SurfaceCard (Tier 2, shadow), TextHierarchy (all Soul doc text roles)
- **Platform config** — API_BASE and WS_BASE hardcoded to Tailscale IP, resolveApiUrl/resolveWsUrl helpers

### Established Patterns
- **Factory stores** — `createTimelineStore(storageAdapter)` pattern. Web passes localStorage, native passes MMKV. Already working.
- **Callback injection** — WebSocket client and stream multiplexer both use callback injection, not direct store imports. Wiring happens at app init.
- **NativeWind v4 / Tailwind v3** — className-based styling with Tailwind v3 syntax. Design primitives validated this pipeline.
- **Expo Router** — File-based routing with drawer+stack groups. `(drawer)/index.tsx` = session list, `(stack)/chat/[id].tsx` = chat screen.

### Integration Points
- **App init** (`mobile/app/_layout.tsx`) — Root layout needs: WebSocket client instantiation, store wiring, auth check, AppState listener
- **Session list** → API client GET `/sessions` → Zustand timeline store
- **Chat screen** → WebSocket client connect + stream multiplexer → stream store → message rendering
- **Drawer** → Expo Router drawer component. Custom drawer content component for Soul-doc session list.
- **Composer** → WebSocket client `send()` method → stream store tracks outgoing

</code_context>

<specifics>
## Specific Ideas

- **Parallel markdown evaluation:** Plan 1 tests both react-native-streamdown and a custom renderer side by side against real Claude streaming output. Winner gets adopted for remaining plans.
- **Soul-doc compliance is non-negotiable:** swd explicitly chose Soul-compliant from the start over functional-first. Every component must implement correct springs, surfaces, and dynamic color. This is the quality bar.
- **Auto-connect pattern:** App assumes Tailscale backend is reachable at hardcoded IP. Only prompts for JWT token. Manual URL override in Settings as escape hatch.
- **Glass backdrop on composer:** Try glass first, measure FPS. Fall back to opaque surface-raised if performance is unacceptable. Glass is preferred.
- **Partial stream persistence:** If user backgrounds during streaming, partial message persists. On foreground return, show what arrived with "interrupted" state. User can retry.

</specifics>

<quality_bar>
## Quality Bar (Bard Assessment)

Bard's 10/10 for Phase 69 (adjusted for swd's Soul-doc-from-start decision):

1. **Core loop works flawlessly** — send message, see streaming response, no dropped tokens, no lag, no buffering artifacts
2. **Markdown renders completely** — headings, bold, italic, inline code, lists, blockquotes, tables, links all render correctly. Code blocks show as monospace on dark surface (no syntax highlighting yet). No broken rendering.
3. **Every interaction has physical response** — per Soul doc: spring press feedback on every button, spring entrance on every appearance, dynamic color during streaming. A "silent tap" is a bug.
4. **Auth works silently** — token stored in Keychain, WebSocket connects on launch, reconnects on foreground. No console errors, no auth failures visible to user.
5. **Session management is complete** — grouped by project, pinned sessions, search, swipe-to-delete, create new session with project picker. Full Soul doc session list, not a placeholder.
6. **Error resilience** — disconnection shows Soul-doc banner, reconnect works, partial messages persist through backgrounding, no data loss, no silent failures.

**What separates good from exceptional:** The delta is whether the streaming experience "feels alive." Good = text appears and scroll follows. Exceptional = the background warms subtly as Claude streams, the accent line pulses, the scroll-to-bottom pill bounces with spring physics, and when streaming ends the warmth fades back. The user feels the conversation breathing.

**Bard's risk flag (noted, not adopted):** Bard recommended deferring dynamic color and most motion to Phase 70-71. swd explicitly overruled this — Soul-doc compliance from day one. This increases Phase 69 scope but eliminates polish debt.

</quality_bar>

<deferred>
## Deferred Ideas

- **Syntax-highlighted code blocks** — Phase 70 scope (Shiki integration per Soul doc)
- **Long-press context menu** (Copy/Retry/Share) — Phase 71 gesture scope
- **Haptic pairing on all interactions** — Phase 71 (Native Feel). Phase 69 implements springs but haptics are Phase 71's explicit domain per roadmap.
- **Tool cards** — Phase 70 (Chat Polish). Phase 69 streams text only. Tool call data flows through multiplexer but renders as plain text indicators.
- **Thinking block disclosure** — Phase 70
- **File attachment in composer** — Phase 70+. Attachment button present but non-functional.
- **Multiple providers** — Phase 72+. Phase 69 is Claude-only.
- **Push notifications** — Phase 72 (Agent Features)
- **Deep linking** — Phase 72
- **Share sheet** — Phase 73

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 69-chat-foundation*
*Context gathered: 2026-03-31*
