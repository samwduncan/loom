---
phase: 52-live-session-attach
plan: 02
subsystem: ui
tags: [websocket, zustand, multiplexer, sidebar, streaming, css-animation]

# Dependency graph
requires:
  - phase: 52-live-session-attach
    provides: Backend SessionWatcher with attach-session/detach-session WS handlers and live-session-data broadcast
provides:
  - ServerMessage types for live-session-data, live-session-attached, live-session-detached
  - ClientMessage types for attach-session, detach-session
  - Multiplexer routing for live session data to timeline store
  - Stream store liveAttachedSessions state tracking
  - Sidebar green pulsing dot for live-attached sessions
affects: [52-03 ChatView integration, future attach/detach UI controls]

# Tech tracking
tech-stack:
  added: []
  patterns: [callback-injection-for-live-data, set-based-session-tracking]

key-files:
  created: []
  modified: [src/src/types/websocket.ts, src/src/lib/stream-multiplexer.ts, src/src/stores/stream.ts, src/src/lib/websocket-init.ts, src/src/components/sidebar/SessionItem.tsx, src/src/components/sidebar/SessionList.tsx, src/src/components/sidebar/sidebar.css]

key-decisions:
  - "Static import of transformBackendMessages in websocket-init rather than dynamic import -- simpler, tree-shakeable"
  - "Green dot (oklch 0.72 0.19 142) distinct from blue streaming dot -- visual separation of live-attached vs Loom-owned streams"
  - "2s pulse animation (slower than 1.5s streaming pulse) for live dot -- visual differentiation"

patterns-established:
  - "Live session state as Set<string> in stream store -- O(1) membership checks for sidebar rendering"
  - "Multiplexer callback pattern extended to live session data routing -- same injection architecture"

requirements-completed: [LIVE-01, LIVE-02, LIVE-04]

# Metrics
duration: 4min
completed: 2026-03-27
---

# Phase 52 Plan 02: Frontend Live Session Data Flow Summary

**WebSocket types, multiplexer routing, stream store tracking, and sidebar green pulse indicator for live-attached sessions**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-27T00:05:24Z
- **Completed:** 2026-03-27T00:09:29Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Three new ServerMessage types and two new ClientMessage types for live session attach protocol
- Multiplexer routes live-session-data entries through transformBackendMessages to timeline store addMessage
- Stream store tracks live-attached sessions via Set with attach/detach/isAttached actions
- Sidebar shows green pulsing dot (2s animation, reduced-motion safe) for live-attached sessions

## Task Commits

Each task was committed atomically:

1. **Task 1: Add WebSocket types + multiplexer callback + store state** - `5690a2c` (feat)
2. **Task 2: Wire multiplexer callbacks + sidebar live indicator** - `e60589f` (feat)

## Files Created/Modified
- `src/src/types/websocket.ts` - Three ServerMessage variants (live-session-data/attached/detached) and two ClientMessage variants (attach-session/detach-session)
- `src/src/lib/stream-multiplexer.ts` - MultiplexerCallbacks extended with onLiveSessionData/Attached/Detached, routing in routeServerMessage switch
- `src/src/stores/stream.ts` - liveAttachedSessions Set, attachLiveSession/detachLiveSession/isSessionLiveAttached actions
- `src/src/lib/websocket-init.ts` - Callbacks wired: live data transforms to timeline messages, attached/detached update stream store
- `src/src/components/sidebar/SessionItem.tsx` - isLiveAttached prop, green session-live-dot before streaming dot
- `src/src/components/sidebar/SessionList.tsx` - liveAttachedSessions selector from stream store, passed as isLiveAttached prop
- `src/src/components/sidebar/sidebar.css` - session-live-dot class with 2s green pulse animation, prefers-reduced-motion support
- `src/src/lib/stream-multiplexer.test.ts` - Mock callbacks updated with new live session entries
- `src/src/components/sidebar/SessionList.test.tsx` - Mock stream state updated with liveAttachedSessions Set

## Decisions Made
- Static import of transformBackendMessages in websocket-init (not dynamic import) -- simpler and tree-shakeable since the module is already in the bundle
- Green success color (oklch 0.72 0.19 142) for live dot vs blue accent-primary for streaming dot -- clear visual distinction between external CLI session watching and Loom-owned streaming
- 2s animation cycle (vs 1.5s streaming) -- slower pulse visually differentiates the two states

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Updated multiplexer test mock with new callbacks**
- **Found during:** Task 1 (pre-commit typecheck)
- **Issue:** stream-multiplexer.test.ts createMockCallbacks() missing onLiveSessionData/Attached/Detached
- **Fix:** Added three vi.fn() entries to the mock callbacks object
- **Files modified:** src/src/lib/stream-multiplexer.test.ts
- **Verification:** TypeScript compilation passes, all 96 affected tests pass
- **Committed in:** 5690a2c (Task 1 commit)

**2. [Rule 3 - Blocking] Updated SessionList test mock with liveAttachedSessions**
- **Found during:** Task 2 (pre-commit test run)
- **Issue:** SessionList.test.tsx mock stream state missing liveAttachedSessions Set, causing 13 test failures
- **Fix:** Added liveAttachedSessions: new Set<string>() to mockStreamState
- **Files modified:** src/src/components/sidebar/SessionList.test.tsx
- **Verification:** All 17 SessionList tests pass (96 total affected tests pass)
- **Committed in:** e60589f (Task 2 commit)

**3. [Rule 3 - Blocking] Added placeholder callbacks to websocket-init for type safety**
- **Found during:** Task 1 (pre-commit typecheck)
- **Issue:** Adding new required callbacks to MultiplexerCallbacks broke websocket-init.ts compilation (Task 2's file)
- **Fix:** Added placeholder no-op callbacks in Task 1, replaced with real implementation in Task 2
- **Files modified:** src/src/lib/websocket-init.ts
- **Verification:** TypeScript compilation passes
- **Committed in:** 5690a2c (Task 1 commit), replaced in e60589f (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (3 blocking)
**Impact on plan:** All auto-fixes were necessary for type safety and test passing. No scope creep.

## Issues Encountered
None -- all issues were test/type blocking issues resolved by deviation rules.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Frontend data flow complete: backend live-session-data messages are transformed and added to timeline store
- Stream store tracks which sessions are live-attached, sidebar shows visual indicator
- Ready for Plan 03 (ChatView integration with attach/detach controls)
- Backend (Plan 01) + frontend data flow (Plan 02) form the complete pipe; Plan 03 adds the UI surface

---
*Phase: 52-live-session-attach*
*Completed: 2026-03-27*
