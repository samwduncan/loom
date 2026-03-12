---
phase: 28-error-connection-resilience
plan: 02
subsystem: networking
tags: [websocket, reconnection, beforeunload, streaming-guard]

requires:
  - phase: 05-websocket
    provides: WebSocketClient singleton with reconnection state machine
provides:
  - useNavigateAwayGuard hook for tab-close protection during streaming
  - Hardened WS reconnect with old handler cleanup
  - Test coverage for reconnection backoff, reset, and state sync
affects: [chat, streaming, connection-resilience]

tech-stack:
  added: []
  patterns: [beforeunload guard tied to Zustand selector, defensive WS handler nulling]

key-files:
  created:
    - src/src/hooks/useNavigateAwayGuard.ts
    - src/src/hooks/useNavigateAwayGuard.test.ts
  modified:
    - src/src/lib/websocket-client.ts
    - src/src/lib/websocket-client.test.ts
    - src/src/components/chat/view/ChatView.tsx

key-decisions:
  - "useNavigateAwayGuard created in plan 28-01 (deviation Rule 3), hardening and wiring completed in 28-02"
  - "Defensive null-out of old WS handlers before reconnect to prevent ghost callbacks"

patterns-established:
  - "beforeunload guard pattern: useEffect with isStreaming dependency, cleanup on false/unmount"

requirements-completed: [ERR-03, ERR-04]

duration: 9min
completed: 2026-03-12
---

# Phase 28 Plan 02: WebSocket Reconnect Hardening & Navigate-Away Guard Summary

**Hardened WS reconnect with old handler cleanup, beforeunload guard during streaming, ChatView wired**

## Performance

- **Duration:** 9 min
- **Started:** 2026-03-12T15:36:13Z
- **Completed:** 2026-03-12T15:45:09Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- WebSocket reconnect now nulls out old handlers before creating new connection (prevents ghost callbacks)
- useNavigateAwayGuard hook protects against accidental tab close during active streaming
- ChatView wired with navigate-away guard (single-line hook call)
- 27 WS client tests + 5 guard tests all passing

## Task Commits

Each task was committed atomically:

1. **Task 1: useNavigateAwayGuard hook with tests** - Already committed in `699d9f1` (28-01, deviation Rule 3)
2. **Task 2: WebSocket reconnect tests and ChatView wiring** - `81b8b98` (feat)

**Plan metadata:** [pending] (docs: complete plan)

_Note: Task 1 was completed as part of plan 28-01 (deviation fix for tsc errors). Task 2 added the WS hardening, new test, and ChatView wiring._

## Files Created/Modified
- `src/src/hooks/useNavigateAwayGuard.ts` - beforeunload guard hook (created in 28-01)
- `src/src/hooks/useNavigateAwayGuard.test.ts` - 5 tests for guard behavior (created in 28-01)
- `src/src/lib/websocket-client.ts` - Added handler cleanup in reconnect()
- `src/src/lib/websocket-client.test.ts` - Added test for handler nulling on reconnect
- `src/src/components/chat/view/ChatView.tsx` - Wired useNavigateAwayGuard hook call

## Decisions Made
- Task 1 artifacts already existed from 28-01 (deviation Rule 3 fix for tsc blocking). No re-implementation needed.
- Defensive handler cleanup in reconnect() is a small but important hardening against potential ghost event handlers on stale WebSocket references.

## Deviations from Plan

None for this plan execution. Task 1 was already completed by plan 28-01 as a deviation fix.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Connection resilience complete (ERR-01 through ERR-05 now covered across plans 28-01 and 28-02)
- Ready for next phase

---
*Phase: 28-error-connection-resilience*
*Completed: 2026-03-12*
