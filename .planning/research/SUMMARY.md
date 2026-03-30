# Project Research Summary

**Project:** Loom v3.0 "The App" — React Native + Expo iOS
**Domain:** Native iOS chat client for an AI coding agent, extending an existing web + backend project
**Researched:** 2026-03-30
**Confidence:** HIGH

## Executive Summary

Loom v3.0 is a native iOS app that replaces Capacitor/WKWebView as the mobile surface for the existing Loom AI coding agent platform. The web app (Vite + React + Tailwind) and Express backend (port 5555) remain unchanged — the iOS app is an additive layer, not a migration. The recommended approach is Expo SDK 55 (React Native 0.83, New Architecture only) with Expo Router for navigation, react-native-reanimated + react-native-gesture-handler for native-quality gesture physics, FlashList for the chat message list, and Zustand as the shared state layer. Approximately 35% of the existing web app's business logic (types, Zustand stores, WebSocket client, stream multiplexer) can be extracted into a shared package and reused directly in the native app. UI components are 100% new code — no porting from web.

The central value proposition of the native app is not a feature-for-feature port of the web experience. It is three things the web app cannot do: actionable push notifications for permission requests (approve/deny file writes from the lock screen), Dynamic Island status for active coding sessions, and 120Hz native gesture physics that actually feel like iOS. These differentiators — along with tool call visualization and streaming markdown — make the native app worth building. ChatGPT and Claude iOS have none of them. This is the entire justification for v3.0.

The primary risks are creative, not technical. React Native is a mature platform for this use case; the libraries are proven; the backend needs only one new endpoint (push token registration). The danger is vision fragmentation across 15+ phases (the exact pattern that made the web app functional but not beautiful) and the reflexive instinct to port the web UI rather than redesign for mobile from scratch. The mitigation is a strict phase limit (3-5 phases for v3.0), a "Native App Soul" document as a design gate before any code, and daily device testing against ChatGPT iOS as the quality benchmark.

## Key Findings

### Recommended Stack

The stack is well-researched and the version decisions are deliberate. Expo SDK 55 is chosen over SDK 54 specifically because it is New Architecture only — no Legacy Arch dead weight for a greenfield project. React 19.2 (bundled with SDK 55) matches the web app's React version, which is the primary code-sharing enabler. NativeWind v4 (Tailwind v3 syntax) is chosen over the pre-release v5 despite the web app using Tailwind v4 — production stability outweighs syntactic parity for v3.0.

The single most important stack decision is react-native-gesture-handler + react-native-reanimated. These are the exact libraries that fix the gesture conflicts that made Capacitor/WKWebView architecturally unfixable. They provide native UIGestureRecognizer access, UI-thread worklet animations, and spring physics that run at 120Hz on ProMotion displays. Everything else is supporting cast.

**Core technologies:**
- Expo SDK 55 + React Native 0.83: App framework — New Architecture only, auto-detects monorepo, EAS Build handles iOS signing
- react-native-reanimated 4.3.0: 120Hz UI-thread animations — the reason Capacitor failed is that this could not run in WKWebView
- react-native-gesture-handler 2.30.1: Native gesture recognizers — composable gestures solve swipe conflict bugs architecturally
- NativeWind 4.2.3: Tailwind classes in RN — rapid development for a developer who already knows Tailwind
- Zustand 5.0.12: Shared state — same 5 stores as web app, primary code-sharing vector between platforms
- react-native-mmkv 4.3.0: Fast persistent storage — 30-100x faster than AsyncStorage, Zustand persist adapter exists
- @shopify/flash-list 2.3.1: Chat message list — cell recycling is mandatory for variable-height streaming messages
- react-native-streamdown 0.1.1: Streaming markdown — Software Mansion, processes on worklet thread, purpose-built for LLM streaming
- expo-notifications 55.0.14: Push notifications — Expo Push Service handles APNs complexity, free tier sufficient
- expo-haptics 55.0.9: Taptic Engine access — replaces @capacitor/haptics directly
- expo-secure-store 55.0.9: JWT storage — iOS Keychain, never store tokens in MMKV/AsyncStorage
- Expo Router 55.0.8: File-based navigation — built on React Navigation, typed routes, deep linking for notification taps
- react-native-keyboard-controller 1.21.0+: Keyboard avoidance — purpose-built for chat apps, 120Hz keyboard animations
- @shopify/react-native-skia 2.5.4: GPU effects — defer to Phase 5+ ("Elevation"), not initial implementation

**Monorepo structure:** npm workspaces (not Turborepo/pnpm) with `packages/shared/` for business logic, `apps/web/` for the existing frontend, `apps/mobile/` for the new Expo app. The web frontend moves from `src/` to `apps/web/` as part of monorepo setup.

**One backend addition required:** `POST /api/push/register` endpoint + Expo Push Service integration + new `push_tokens` SQLite table. Estimated 2-3 days. Everything else on the backend is platform-agnostic and needs zero changes.

### Expected Features

The research defines a clear 4-phase feature structure for v3.0 and a hard scope boundary for v3.1+.

**Must have (table stakes — Phase 2: Chat Core):**
- Streaming markdown with tool call visualization — without this, there is no product
- Session list with create/switch — FlashList, timeline store transfers
- Native-quality keyboard avoidance — react-native-keyboard-controller (NOT KeyboardAvoidingView)
- Safe area handling — notch/Dynamic Island/home indicator via react-native-safe-area-context
- Network status awareness — connection store transfers, existing ConnectionBanner concept

**Must have (feel native — Phase 3: Native Polish):**
- Sidebar drawer for session navigation — swipe from left edge, no bottom tabs (anti-feature AF-3)
- Haptic feedback grammar — expo-haptics, existing haptic grammar from v2.2 transfers conceptually
- Spring physics on all interactive elements — Reanimated withSpring(), 120Hz ProMotion
- Swipe-to-delete sessions, long-press context menus — native iOS patterns
- Pull-to-refresh on session list

**Must have (core value — Phase 4: Agent Features):**
- Tool call visualization — Loom's signature differentiator, no competitor has this
- Permission handling inline — Approve/Deny above composer
- Push notifications for permission requests with actionable Approve/Deny buttons — the killer feature
- Push for session completion/errors
- Silent push for background state sync

**Should have (Phase 5: Polish):**
- Native share sheet, message context menu, follow-up suggestion chips
- Code syntax highlighting (plain code blocks acceptable in Phases 1-4)
- Full VoiceOver accessibility pass

**Defer to v3.1+:**
- Dynamic Island / Live Activities — requires push infrastructure first, Swift widget code
- Share Extension (receive INTO Loom) — App Extension Swift code, low urgency
- Spotlight search — differentiator, not core
- Siri Shortcuts / App Intents — Swift native code, complex
- Swipe-to-reply, code fullscreen expand, image attachments
- Android support — iOS-only for v3.0, testing surface doubles if done in parallel

**Explicit anti-features (do not build):** Bottom tab navigation, WebView for chat rendering, terminal/file tree/editor on mobile, offline mode, character-by-character typewriter animation, Android in v3.0.

### Architecture Approach

The architecture is a three-layer system: unchanged Express backend (port 5555), a new `packages/shared/` package containing ~35% of current web app business logic, and two platform apps (web at `apps/web/`, native at `apps/mobile/`) that share business logic but have completely separate UI component trees.

The stream multiplexer is already callback-injected with zero DOM/React Native dependencies — it moves to shared unchanged. The three Zustand stores that use `persist` middleware (timeline, connection) become factory functions accepting a `StateStorage` adapter; web passes `localStorage`, native passes an MMKV adapter. The WebSocket client needs one refactor: constructor-injected URL resolver instead of importing from `platform.ts`. Types and stream store move as-is.

**Major components:**
1. `packages/shared/` — Types (6 files), Zustand store factories (3 stores), WebSocketClient (URL-resolver injected), stream-multiplexer (unchanged), apiFetch (configureApi pattern)
2. `apps/mobile/app/` — Expo Router file-based routes: `(auth)/login`, `(app)/(chat)/index`, `(app)/(chat)/[id]`, `modal/permission`
3. `apps/mobile/src/components/` — 100% new RN components (View/Text/Pressable primitives, NativeWind classes)
4. `apps/mobile/src/hooks/` — useNativeStreamBuffer (batched to ~100ms intervals, not rAF/innerHTML), useAppLifecycleWebSocket (AppState listener)
5. Backend push service — new module watching for permission requests + session completion, sends via Expo Push API

**Navigation:** Drawer (session sidebar) + nested stack (chat screens). No bottom tabs. Matches ChatGPT iOS navigation exactly.

**Token streaming on native:** Cannot use rAF + innerHTML (no DOM). Use useRef accumulator + debounced setState at ~100ms intervals (~10 re-renders/second instead of ~100 tokens/second). FlashList handles scroll stability with `maintainVisibleContentPosition`. Render the actively-streaming message outside the list (pinned to bottom), move it into the list on stream completion.

### Critical Pitfalls

1. **Porting web UI instead of redesigning** — Copy business logic only (stores, types, API). All UI components are new code designed mobile-first from ChatGPT/Claude iOS references. swd explicitly approves visual direction before any component code is written. Recovery cost is HIGH — no shortcuts here.

2. **Vision fragmentation across too many phases** — Cap v3.0 at 5 phases maximum. Create a "Native App Soul" document before Phase 2. Every phase reads it. Every device test compares side-by-side with ChatGPT iOS. Bard reviews every visual component as creative collaborator.

3. **WebSocket lifecycle mismanagement on iOS** — iOS halts JS execution 5-30 seconds after backgrounding. Implement AppState listener from day one: explicit disconnect on background, reconnect with backoff on foreground, queue outgoing messages during disconnect. Never assume `readyState === OPEN` means the server-side connection is alive.

4. **FlatList performance death with streaming + variable heights** — Use FlashList (not FlatList) from the start. Render the actively-streaming message outside the list (pinned to bottom), move it in on stream completion. Memoize all message components. Profile before 50+ messages accumulate.

5. **Push notification complexity cascade** — Push spans Apple Developer Program, APNs keys, EAS Build pipeline, device token registration, notification actions, deep linking, and token refresh. Dedicate a focused phase. Set up EAS Build and Apple Developer credentials in Phase 1 (scaffolding), not when push is actually needed.

6. **Expo Go comfort zone** — Skip Expo Go entirely. Start with development builds in the first hour. `eas build --profile development` before any feature code. Development builds still support hot reload for JS changes — iteration speed penalty is only for native code changes.

7. **Over-sharing code / monorepo pain** — The shareable 35% is all platform-agnostic. Accept that UI is 0% shared. If npm workspace resolution causes more than one day of friction in Phase 1, fall back to a plain `shared/` directory. Validate that both Vite and Metro can import shared code before writing any features.

## Implications for Roadmap

Based on combined research, the recommended phase structure is 5 phases for v3.0 with a hard scope gate. Phase ordering follows the pitfall-to-phase mapping from PITFALLS.md and the dependency graph from FEATURES.md.

### Phase 1: Scaffolding & Foundation

**Rationale:** The Apple Developer certificate maze (Pitfall 11) and Expo Go trap (Pitfall 6) must be resolved before any feature work. Apple enrollment takes 24-48 hours. A working development build on a physical iPhone is the required exit criteria, not a nice-to-have.
**Delivers:** npm workspaces configured, `packages/shared/` with types + stream-multiplexer + WebSocket client + 3 Zustand store factories, `apps/mobile/` with Expo Router, EAS Build running, dev build installed on iPhone 16 Pro Max, NativeWind styling validated with 3-4 representative components, AppState WebSocket lifecycle hook scaffolded
**Addresses:** Foundation for all subsequent phases, prevents P6/P7/P11/P13
**Avoids:** Expo Go dependency, certificate surprises mid-project, monorepo resolution surprises mid-project
**Research flag:** Standard patterns — follow Expo's official monorepo guide exactly. No research-phase needed.

### Phase 2: Chat Core

**Rationale:** Streaming markdown is the heart of the product. Everything else — tool cards, permission UI, notifications — renders within or alongside the stream. This phase proves the native streaming architecture before other features build on it.
**Delivers:** FlashList chat message list, streaming markdown via react-native-streamdown (with proof-of-concept validation as first plan), keyboard avoidance via react-native-keyboard-controller, session list (TS-3), basic sidebar drawer (TS-12), network status banner, auth flow (JWT in SecureStore)
**Addresses:** TS-1, TS-3, TS-6, TS-10, TS-11, TS-18
**Avoids:** P3 (AppState WebSocket lifecycle from Phase 1), P4 (FlashList + streaming isolation pattern), P8 (design from ChatGPT iOS reference — no web porting), P9 (react-native-streamdown + debounced flush)
**Research flag:** react-native-streamdown v0.1.1 is high-risk. The first plan of this phase MUST be a standalone streaming proof-of-concept. If it fails, fall back to manual Reanimated + Text incremental renderer. Commit to neither until tested on device.

### Phase 3: Native Polish

**Rationale:** Haptics, springs, 120Hz, and gesture interactions must be validated before building agent features on top. Polish applied to a broken foundation is wasted. This phase locks in what "feels native" means for the rest of the project.
**Delivers:** Haptic feedback grammar (send, receive, permission, tool complete, swipe), spring physics on all interactive elements, swipe-to-delete sessions, long-press context menus, pull-to-refresh, status bar integration, 120Hz ProMotion on all animations
**Addresses:** TS-7, TS-8, TS-9, TS-12, TS-13, TS-14, TS-16, TS-17
**Avoids:** P1 (this is the phase where web-ported design reveals itself — Bard visual review required), P2 (vision fragmentation — side-by-side comparison with ChatGPT iOS at every device test), P10 (Reanimated useSharedValue pattern established here)
**Research flag:** Technical patterns are well-documented. Creative direction is the actual risk. Requires swd + Bard design review before plans are written.

### Phase 4: Agent Features

**Rationale:** Tool call visualization and permission handling are Loom's entire differentiator — the reason to install the app rather than open Safari. Push notifications complete the picture. These require Phase 2-3 foundations.
**Delivers:** Tool call card components (Read/Write/Execute/Search/Bash/MCP with expand/collapse), inline permission request UI with Approve/Deny, push notification backend endpoint + push_tokens table, Expo Push Service integration, actionable push notifications with Approve/Deny buttons (iOS UNNotificationAction), session completion notifications, silent push for background sync
**Addresses:** TS-4, TS-5, D-1, D-2, D-3, D-4
**Avoids:** P5 (dedicated phase isolates push complexity from UI work), P12 (app lifecycle for push background processing)
**Research flag:** Push notifications need `/gsd:research-phase` during planning. Backend push service is new work with multiple external dependencies (APNs keys, Expo Push API, notification action registration, deep linking on cold start, token refresh). Budget 2-3 days for backend alone before UI work begins.

### Phase 5: Polish & Differentiators

**Rationale:** Elevates from "works" to "award-winning." Code syntax highlighting, share sheet, message context menus, follow-up chips, VoiceOver accessibility, and a final quality bar review before v3.0 ships. Sets the foundation for v3.1+ (Dynamic Island).
**Delivers:** Code syntax highlighting (approach decided in first plan), native share sheet (code blocks + conversations), message context menu (Copy/Retry/Share), follow-up suggestion chips, session pinning, full VoiceOver pass, Reduce Motion support
**Addresses:** TS-2, TS-15, D-7, D-13, D-14, D-16, D-17, D-18
**Avoids:** P2 (this is the quality gate before shipping — vision fragmentation stops here)
**Research flag:** Standard patterns throughout. Decide syntax highlighting approach (react-native-syntax-highlighter vs WebView-per-block) in first plan as a low-risk prototype.

### Phase Ordering Rationale

- Apple Developer Program enrollment has a 24-48 hour activation delay that must be triggered before any development work
- Streaming rendering is the foundational dependency: tool cards, permission UI, thinking blocks, and follow-up suggestions all render within or adjacent to the streaming message component
- Native polish (Phase 3) precedes agent features (Phase 4) because haptics/springs on a broken foundation is waste, and because this is the phase where web-porting tendencies manifest — catching it before Phase 4 saves a potential redesign
- Push notifications are deliberately the last major feature because they require EAS Build to be proven, Apple Developer credentials to be active, and the base chat to be reliable on device; debugging push infrastructure and chat UI simultaneously doubles the problem space
- Dynamic Island stays in v3.1+: D-5 explicitly depends on D-1-D-4 push infrastructure, requires Swift widget code, and should not be in the v3.0 critical path

### Research Flags

Phases needing `/gsd:research-phase` during planning:
- **Phase 4 (Agent Features):** Push notification integration is high complexity with multiple failure modes (APNs, Expo Push API, notification action categories, deep linking on cold start, token refresh lifecycle). Backend push service is entirely new. Needs dedicated research before planning.
- **Phase 2 (Chat Core, first plan):** react-native-streamdown v0.1.1 needs empirical validation before the full chat screen is planned. First plan should be a 1-day streaming proof-of-concept, not a full chat implementation.

Phases with standard patterns (skip `/gsd:research-phase`):
- **Phase 1 (Scaffolding):** Expo official monorepo guide covers all steps. EAS credential setup is documented. Apple Developer enrollment is mechanical.
- **Phase 3 (Native Polish):** Reanimated + Gesture Handler patterns are thoroughly documented at Software Mansion docs. The risk is creative, not technical.
- **Phase 5 (Polish):** All APIs are documented. Decide syntax highlighting approach empirically in first plan.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Versions verified via npm 2026-03-30. Official Expo/RN docs consulted. Version compatibility matrix validated. react-native-streamdown is the one MEDIUM confidence item (v0.1.1, very new). |
| Features | HIGH | Reference app analysis verified against ChatGPT iOS, Claude iOS, Discord RN. Apple developer docs consulted for push notification categories and actionable notifications. Dependency graph is definitive. |
| Architecture | HIGH | Existing codebase audited file-by-file. Shared vs. platform-specific boundary is definitive, not estimated. Code patterns (store factories, WebSocket URL injection, API config) are production-ready and ready to copy. |
| Pitfalls | HIGH | Grounded in Loom's own Capacitor failure (15 plans, 5/7 bugs architecturally unfixable). Cross-referenced with React Native community sources, Discord's RN post-mortem, Expo's official guidance, and Fernando Rojo's web-to-native migration post. |

**Overall confidence:** HIGH

### Gaps to Address

- **react-native-streamdown stability:** v0.1.1 is too new to trust blindly. Phase 2's first plan must be a standalone streaming proof-of-concept on a real device. Fallback is Reanimated + Text with manual incremental parser. This decision cannot wait until Phase 2 is in progress.
- **Code syntax highlighting approach:** react-native-enriched-markdown (streamdown's dependency) lacks syntax highlighting. Two options: react-native-syntax-highlighter (native Text, lower fidelity, faster) or WebView-per-block with Shiki (slower but matches web app quality). Decide in Phase 5 first plan. For Phases 1-4, ship plain monospace code blocks.
- **Dynamic Island library choice:** expo-widgets (alpha, Expo official) vs expo-live-activity (Software Mansion Labs, more mature predefined layout). Both are viable. Defer to v3.1 planning.
- **Monorepo vs simple shared directory:** ARCHITECTURE.md recommends npm workspaces from the start; PITFALLS.md recommends starting simpler. Attempt npm workspaces in Phase 1; if Metro resolution causes more than one day of friction, fall back to a plain `shared/` directory at the repo root. Document the decision in MEMORY.md.
- **Expo Push Service vs direct APNs:** For a single-user personal tool on Tailscale, Expo Push Service (free tier: 600/sec) is sufficient and significantly simpler. Validate this assumption during Phase 4 research — direct APNs is the fallback if Expo Push Service proves limiting.

## Sources

### Primary (HIGH confidence)
- [Expo SDK 55 Changelog](https://expo.dev/changelog/sdk-55) — RN 0.83, React 19.2, New Architecture only
- [Expo Monorepo Guide](https://docs.expo.dev/guides/monorepos/) — Workspace configuration, Metro auto-detection
- [Expo Router Documentation](https://docs.expo.dev/router/introduction/) — File-based routing, drawer navigation
- [Expo Push Notifications Setup](https://docs.expo.dev/push-notifications/push-notifications-setup/) — APNs configuration
- [Expo Notifications API](https://docs.expo.dev/versions/latest/sdk/notifications/) — Categories, interactive actions
- [Apple: Declaring Actionable Notification Types](https://developer.apple.com/documentation/usernotifications/declaring-your-actionable-notification-types) — Approve/Deny notification actions
- [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/) — UI thread worklets, spring physics
- [React Native Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/) — Native gesture recognizers
- [FlashList v2 Announcement](https://shopify.engineering/flashlist-v2) — Cell recycling, maintainVisibleContentPosition
- [react-native-keyboard-controller](https://kirillzyusko.github.io/react-native-keyboard-controller/) — Chat keyboard avoidance, 120Hz
- [NativeWind v4 Docs](https://www.nativewind.dev/) — Tailwind CSS in RN, compatibility table
- [Expo: Development Builds vs Expo Go](https://expo.dev/blog/expo-go-vs-development-builds) — When Expo Go breaks
- [Discord: How Discord achieves native iOS performance with React Native](https://discord.com/blog/how-discord-achieves-native-ios-performance-with-react-native) — Chat list patterns
- npm registry (versions verified 2026-03-30): expo@55.0.9, react-native-reanimated@4.3.0, @shopify/flash-list@2.3.1, nativewind@4.2.3, react-native-mmkv@4.3.0, react-native-streamdown@0.1.1

### Secondary (MEDIUM confidence)
- [Software Mansion: react-native-streamdown](https://github.com/software-mansion-labs/react-native-streamdown) — Streaming markdown, v0.1.1
- [Software Mansion: expo-live-activity](https://github.com/software-mansion-labs/expo-live-activity) — Dynamic Island from RN
- [Zustand + MMKV Integration](https://github.com/mrousavy/react-native-mmkv/blob/main/docs/WRAPPER_ZUSTAND_PERSIST_MIDDLEWARE.md) — Persist middleware storage adapter
- [Fernando Rojo: Web developer RN mistakes](https://fernandorojo.co/mistakes) — Pitfall validation
- [Expo: Best Practices for Reducing Lag](https://expo.dev/blog/best-practices-for-reducing-lag-in-expo-apps) — React Compiler, worklets

### Tertiary (LOW confidence — verify before using)
- react-native-haptic-feedback claimed 2-4x faster than expo-haptics — unverified; expo-haptics is sufficient for this project
- FlashList v2 inverted scroll chat UX regression (Issue #1844) — may be resolved by v3.0 build time, check before implementing
- Expo Widgets alpha stability for Live Activities — needs real-device testing before committing; defer to v3.1

### Project-specific (HIGH confidence)
- `.planning/phases/67.1-ios-bug-fixes/PLATFORM-RESEARCH.md` — Competitor analysis (ChatGPT, Claude, Discord architecture)
- `.planning/phases/67.1-ios-bug-fixes/LIBRARY-RESEARCH.md` — Animation, visual effects, component libraries
- `src/src/stores/`, `src/src/lib/`, `src/src/types/` — Audited file-by-file for shareability
- Loom v2.2 Capacitor post-mortem — 5/7 iOS bugs architecturally unfixable in WKWebView

---
*Research completed: 2026-03-30*
*Ready for roadmap: yes*
