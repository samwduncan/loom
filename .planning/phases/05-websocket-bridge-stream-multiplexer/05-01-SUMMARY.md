---
phase: 05-websocket-bridge-stream-multiplexer
plan: 01
subsystem: websocket
tags: [websocket, jwt, auth, reconnection, typescript, discriminated-union, singleton]

# Dependency graph
requires:
  - phase: 04-state-architecture
    provides: ConnectionStore with updateProviderStatus/setProviderError/incrementReconnectAttempts actions
provides:
  - ServerMessage discriminated union covering 17+ backend message types
  - ClientMessage discriminated union covering 7 client message types
  - ClaudeSDKData union for SDK message subtypes
  - ContentBlock union for text/tool_use/thinking blocks
  - isServerMessage type guard for envelope validation
  - Auth module (getToken/setToken/clearToken/bootstrapAuth)
  - WebSocketClient class singleton with reconnection state machine
  - Content stream subscription with backlog buffer for late subscribers
affects: [05-02-stream-multiplexer, 05-03-websocket-init, 06-streaming-ui]

# Tech tracking
tech-stack:
  added: []
  patterns: [class-singleton-with-callback-injection, subscribable-content-stream, exponential-backoff-reconnection, stream-backlog-buffer]

key-files:
  created:
    - src/src/types/websocket.ts
    - src/src/lib/auth.ts
    - src/src/lib/auth.test.ts
    - src/src/lib/websocket-client.ts
    - src/src/lib/websocket-client.test.ts
  modified: []

key-decisions:
  - "WebSocketClient uses callback injection (configure method) instead of direct store imports -- keeps network layer decoupled from React/Zustand"
  - "handleClose schedules reconnect from any non-disconnected state (not just connected/reconnecting) for robustness during reconnection failures"
  - "disconnect() clears stored token to prevent phantom reconnects after explicit disconnect"
  - "Content stream uses Set-based listener pattern with stream backlog buffer for late subscribers"
  - "Exponential backoff increments before calculating delay: first retry at 2s (1000*2^1), not 1s"

patterns-established:
  - "Class singleton with configure() for callback injection: network layer owns lifecycle, React layer subscribes via callbacks"
  - "Stream backlog buffer: emitContent buffers tokens when no listeners exist, subscribeContent replays backlog to late subscribers"
  - "startContentStream/endContentStream lifecycle: buffer cleared on new stream start, preserved after end for late replay"

requirements-completed: [STRM-01]

# Metrics
duration: 6min
completed: 2026-03-06
---

# Phase 5 Plan 01: WebSocket Type System + Client Summary

**Discriminated union type system for all 17+ backend message types, auto-auth JWT module, and class-based WebSocket client singleton with exponential backoff reconnection and stream backlog buffer**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-06T00:46:27Z
- **Completed:** 2026-03-06T00:52:42Z
- **Tasks:** 2
- **Files created:** 5

## Accomplishments
- Full TypeScript discriminated union (ServerMessage) covering all 17+ backend WebSocket message types including Claude streaming, permissions, session lifecycle, token budget, and M4 provider stubs (codex/gemini)
- Auto-auth module that bootstraps JWT acquisition (auto-register on first boot, auto-login thereafter) with env var credential overrides
- WebSocket client singleton with reconnection state machine (disconnected -> connecting -> connected -> reconnecting), exponential backoff (2s/4s/8s/16s/30s cap), and content stream subscription pattern with backlog buffer for Phase 6

## Task Commits

Each task was committed atomically:

1. **Task 1: WebSocket type system + auth module** - `dc987a7` (feat)
2. **Task 2: WebSocket client singleton with reconnection and tests** - `34e3568` (feat)

## Files Created/Modified
- `src/src/types/websocket.ts` - ServerMessage, ClientMessage, ClaudeSDKData, ContentBlock discriminated unions + isServerMessage type guard
- `src/src/lib/auth.ts` - JWT storage (localStorage), auto-auth bootstrap with register/login flow
- `src/src/lib/auth.test.ts` - 7 tests: token round-trip, bootstrapAuth auto-register, auto-login, failure handling
- `src/src/lib/websocket-client.ts` - WebSocketClient class singleton with connect/disconnect/send, reconnection state machine, subscribeContent with backlog buffer
- `src/src/lib/websocket-client.test.ts` - 25 tests: connection, reconnection, exponential backoff, disconnect, send, message handling, content subscription, stream backlog, state change callbacks

## Decisions Made
- WebSocketClient uses callback injection via `configure()` method rather than direct store imports -- keeps the network layer decoupled from React/Zustand and testable with simple mocks
- `handleClose` schedules reconnect from any non-disconnected state (not just connected/reconnecting) -- handles edge case where reconnection attempt itself fails immediately
- `disconnect()` clears stored token to prevent phantom reconnect attempts after explicit disconnect
- Content stream uses Set-based listener pattern (not EventTarget or EventEmitter) -- lightest option, zero dependencies, trivially testable
- Exponential backoff formula: `min(1000 * 2^attempts, 30000)` with attempts incrementing before delay calculation -- first retry at 2s

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed reconnection from connecting state**
- **Found during:** Task 2 (exponential backoff tests)
- **Issue:** Original `handleClose` only reconnected when state was 'connected' or 'reconnecting'. If a reconnection attempt failed during 'connecting' state, no further reconnection would occur.
- **Fix:** Changed condition to reconnect from any non-disconnected state when token exists and close code is not 1000 (normal closure)
- **Files modified:** src/src/lib/websocket-client.ts
- **Verification:** Exponential backoff test passes through multiple failed reconnection cycles
- **Committed in:** 34e3568 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Essential for correct reconnection behavior. No scope creep.

## Issues Encountered
- ESLint `loom/no-non-null-without-reason` rule caught a non-null assertion in test code (`sentMessages[0]!`). Fixed by using `toBeDefined()` assertion followed by `as string` cast instead of `!`.
- TypeScript strict mode required typed mock functions (`vi.fn<(msg: ServerMessage) => void>()`) for `configure()` callback parameters. Untyped `vi.fn()` was incompatible with the callback signatures.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- WebSocket type system ready for Plan 02 (stream multiplexer) to route ServerMessage subtypes to store actions
- Auth module ready for Plan 03 (websocket-init) to bootstrap connection at app startup
- WebSocketClient.configure() ready for callback wiring in Plan 03
- Content stream subscription (subscribeContent/emitContent) ready for Phase 6 streaming UI

---
*Phase: 05-websocket-bridge-stream-multiplexer*
*Plan: 01*
*Completed: 2026-03-06*
