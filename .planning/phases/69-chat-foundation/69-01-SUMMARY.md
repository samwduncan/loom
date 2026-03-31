---
phase: 69-chat-foundation
plan: 01
subsystem: ui, websocket, mobile
tags: [react-native, reanimated, websocket, markdown, zustand, expo, spring-physics, enriched-markdown]

# Dependency graph
requires:
  - phase: 68-scaffolding-design
    provides: "Expo Router scaffold, design primitives, store factories, auth-provider, platform.ts, MMKV storage adapter"
provides:
  - "6 Soul doc spring configs centralized in springs.ts"
  - "Dynamic color system (colors.ts + useDynamicColor hook) with Reanimated interpolateColor"
  - "Mobile WebSocket init with ALL 21 MultiplexerCallbacks and AppState lifecycle"
  - "useAppState hook for iOS background/foreground lifecycle"
  - "Production MarkdownRenderer using react-native-enriched-markdown with GFM"
  - "Markdown PoC screen with simulated streaming and FPS counter"
affects: [69-02, 69-03, 69-04, 69-05, chat-screen, composer, session-list, connection-banner]

# Tech tracking
tech-stack:
  added: [react-native-keyboard-controller, @shopify/flash-list, expo-symbols, react-native-svg, react-native-enriched-markdown, lucide-react-native]
  patterns: [reanimated-interpolateColor-for-dynamic-color, appstate-lifecycle-with-30s-background-timer, token-aware-reconnect-after-disconnect, module-scoped-ws-init-with-double-init-guard, enriched-markdown-github-flavor-for-gfm]

key-files:
  created:
    - mobile/lib/springs.ts
    - mobile/lib/colors.ts
    - mobile/lib/websocket-init.ts
    - mobile/hooks/useDynamicColor.ts
    - mobile/hooks/useAppState.ts
    - mobile/components/chat/MarkdownRenderer.tsx
    - mobile/components/chat/MarkdownRendererPoC.tsx
    - mobile/app/(stack)/markdown-poc.tsx
  modified:
    - mobile/babel.config.js
    - mobile/package.json
    - mobile/app/(drawer)/index.tsx

key-decisions:
  - "react-native-enriched-markdown chosen over react-native-streamdown -- streamdown lacks GFM table support (CommonMark only), which fails D-02 requirement"
  - "Reanimated babel plugin added explicitly -- NativeWind's babel preset does NOT include it, causing silent worklet failures"
  - "AppState foreground handler uses wsClient.connect(token) not tryReconnect() -- disconnect() nulls internal token, making tryReconnect() a silent no-op"
  - "enriched-markdown flavor='github' for GFM tables, streamingAnimation for built-in tail fade"

patterns-established:
  - "Spring constant pattern: import { SPRING } from 'mobile/lib/springs' then withSpring(value, SPRING.micro)"
  - "Dynamic color pattern: useDynamicColor() returns { backgroundStyle, accentPulse, enterStreaming, exitStreaming, enterError }"
  - "WebSocket init pattern: call initializeWebSocket() once in root layout, getWsClient() for send operations"
  - "AppState pattern: useAppState({ onForeground, onBackground }) ignores inactive state per D-30"
  - "Markdown rendering pattern: <MarkdownRenderer content={text} isStreaming={bool} /> with Soul-doc styling baked in"

requirements-completed: [CHAT-04]

# Metrics
duration: 17min
completed: 2026-03-31
---

# Phase 69 Plan 01: Chat Foundation Core Libraries Summary

**Foundational libs (springs, dynamic color, WebSocket init with 21 callbacks) + production streaming markdown renderer using react-native-enriched-markdown with GFM support**

## Performance

- **Duration:** 17 min
- **Started:** 2026-03-31T22:09:26Z
- **Completed:** 2026-03-31T22:26:29Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments
- All 6 Soul doc spring configs centralized in springs.ts with exact damping/stiffness/mass values from NATIVE-APP-SOUL.md
- Dynamic color system: Reanimated interpolateColor with colorPhase shared value (-1=error, 0=idle, 1=streaming), accent pulse (sinusoidal 0.6-1.0 over 2.5s), and AccessibilityInfo reduce motion support
- WebSocket init with ALL 21 MultiplexerCallbacks wired to real Zustand store action names, AppState lifecycle with 30s background disconnect timer and token-aware foreground reconnect
- Production MarkdownRenderer with full Soul-doc typography: Inter 15px body, JetBrains Mono 14px code blocks on surface-sunken, GFM tables with surface-raised headers, accent blockquote borders
- PoC evaluation screen with simulated streaming (50ms character-by-character), FPS counter, and PoC/Production renderer toggle

## Task Commits

Each task was committed atomically:

1. **Task 1: Install deps + build foundational libs** - `b9e7bb4` (feat)
2. **Task 2: Streaming markdown renderer + PoC screen** - `cf5ac8a` (feat)

## Files Created/Modified
- `mobile/lib/springs.ts` - 6 Soul doc spring configs + pull-to-refresh spring constant
- `mobile/lib/colors.ts` - Dynamic color constants (IDLE_BG, STREAMING_BG, ERROR_BG), 4-tier SURFACE, semantic colors
- `mobile/lib/websocket-init.ts` - Mobile WS init: WebSocketClient + multiplexer + stores + AppState lifecycle
- `mobile/hooks/useDynamicColor.ts` - Reanimated hook for streaming warmth shift and error cooling
- `mobile/hooks/useAppState.ts` - AppState listener hook (foreground/background, ignores inactive)
- `mobile/components/chat/MarkdownRenderer.tsx` - Production markdown with Soul-doc styling via enriched-markdown
- `mobile/components/chat/MarkdownRendererPoC.tsx` - PoC evaluation wrapper with 50ms debounced streaming
- `mobile/app/(stack)/markdown-poc.tsx` - PoC screen: simulate streaming, FPS, production toggle
- `mobile/babel.config.js` - Added react-native-reanimated/plugin
- `mobile/package.json` - Added Phase 69 dependencies
- `mobile/app/(drawer)/index.tsx` - Added Markdown PoC navigation button

## Decisions Made
- **enriched-markdown over streamdown:** A-1 adversarial review finding confirmed streamdown v0.1.1 only supports CommonMark (no GFM tables). D-02 requires tables. react-native-enriched-markdown v0.4.1 has `flavor="github"` with full GFM support plus built-in `streamingAnimation` for tail fade.
- **Explicit reanimated babel plugin:** NativeWind's babel preset does not include the reanimated plugin. Without it, worklet compilation fails silently at runtime. Added as last plugin per reanimated docs.
- **connect(token) not tryReconnect():** WebSocketClient.disconnect() nulls `this.token`. On foreground return from background, calling tryReconnect() would silently no-op because token is null. Instead, we fetch a fresh token from nativeAuthProvider.getToken() and call connect(token) directly.
- **LinkPressEvent.url (not .nativeEvent.url):** enriched-markdown's LinkPressEvent type is `{ url: string }`, not a React Native SyntheticEvent wrapper. Fixed during implementation.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added react-native-reanimated babel plugin**
- **Found during:** Task 1 (babel.config.js review)
- **Issue:** NativeWind's babel preset does not include reanimated/plugin. Without it, all reanimated worklets (springs, interpolateColor, useAnimatedStyle) fail silently at runtime.
- **Fix:** Added `"react-native-reanimated/plugin"` to babel.config.js plugins array
- **Files modified:** mobile/babel.config.js
- **Verification:** No build/config errors
- **Committed in:** b9e7bb4 (Task 1 commit)

**2. [Rule 1 - Bug] Fixed LinkPressEvent type usage in MarkdownRenderer**
- **Found during:** Task 2 (TypeScript check)
- **Issue:** Used `event.nativeEvent.url` but enriched-markdown's LinkPressEvent is `{ url: string }`, not a SyntheticEvent wrapper
- **Fix:** Changed to `event.url`
- **Files modified:** mobile/components/chat/MarkdownRenderer.tsx
- **Verification:** `npx tsc --noEmit` passes for all new files
- **Committed in:** cf5ac8a (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both essential for correctness. No scope creep.

## Issues Encountered
- Pre-existing test failures (151 files) from deleted shared/__tests__/ files. Confirmed not caused by plan changes -- same failures on clean main branch. Out of scope.
- Pre-existing TypeScript errors in design-primitives.tsx (NativeWind className type augmentation issue from Phase 68). Out of scope.

## User Setup Required
None - no external service configuration required.

## Known Stubs
None - all components are fully functional with real data sources wired.

## Next Phase Readiness
- All foundational libs ready for Plans 02-05 consumption
- springs.ts, colors.ts, useDynamicColor, useAppState are direct dependencies for session list (02), chat screen (03), composer (04), and auth/connection (05)
- WebSocket init ready to be called from root layout (Plan 05 will integrate)
- MarkdownRenderer ready for message rendering in chat screen (Plan 03)
- Markdown PoC screen available for on-device evaluation

## Self-Check: PASSED

All 8 created files exist. Both task commits (b9e7bb4, cf5ac8a) verified in git log.

---
*Phase: 69-chat-foundation*
*Completed: 2026-03-31*
