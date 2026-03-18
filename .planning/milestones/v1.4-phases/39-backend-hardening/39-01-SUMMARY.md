---
phase: 39-backend-hardening
plan: 01
subsystem: auth, websocket
tags: [jwt, 401-retry, websocket, heartbeat, ping-pong, reconnect]

# Dependency graph
requires:
  - phase: 06-websocket
    provides: WebSocket client singleton with reconnection state machine
  - phase: 04-auth
    provides: JWT auth module with bootstrapAuth, getToken, setToken, clearToken
provides:
  - refreshAuth() with in-flight promise deduplication for 401 recovery
  - apiFetch 401 auto-retry (single attempt, no infinite loop)
  - Server-side WS ping/pong heartbeat (15s interval, 30s dead client cleanup)
  - Client-side pong timeout detection (30s silence triggers reconnect)
  - WS auth failure recovery (4401 close code triggers refreshAuth + reconnect)
affects: [api-client consumers, websocket-client, connection resilience]

# Tech tracking
tech-stack:
  added: []
  patterns: [401-retry-with-dedup, ws-ping-pong-heartbeat, pong-timeout-detection, auth-failure-recovery]

key-files:
  created: []
  modified:
    - src/src/lib/auth.ts
    - src/src/lib/auth.test.ts
    - src/src/lib/api-client.ts
    - src/src/lib/api-client.test.ts
    - src/src/lib/websocket-client.ts
    - src/src/lib/websocket-client.test.ts
    - src/src/lib/websocket-init.ts
    - src/src/lib/websocket-init.test.ts
    - server/index.js

key-decisions:
  - "refreshAuth uses module-level promise dedup to prevent concurrent 401 retries from hammering the auth endpoint"
  - "apiFetch retries exactly once on 401 using local boolean tracking, not recursion"
  - "Server WS ping interval is 15s with 2-missed-pong termination (30s dead client detection)"
  - "Client pong timeout is 30s, triggers ws.close(4000) which feeds into existing reconnect logic"
  - "WS auth failure uses close code 4401 to distinguish from normal disconnects"

patterns-established:
  - "401 auto-retry pattern: detect 401 -> refreshAuth -> retry once -> throw on second failure"
  - "Promise dedup pattern: module-level variable holds in-flight promise, cleared in finally block"
  - "WS heartbeat pattern: server ping + client pong timeout + getLastCloseCode for auth recovery"

requirements-completed: [BACK-01, BACK-04]

# Metrics
duration: 6min
completed: 2026-03-17
---

# Phase 39 Plan 01: Auth Auto-Retry and WebSocket Heartbeat Summary

**Self-healing connection layer: 401 auto-retry with promise dedup, server ping/pong heartbeat (15s/30s), and WS auth failure recovery via close code 4401**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-17T23:31:48Z
- **Completed:** 2026-03-17T23:38:13Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- refreshAuth() clears stale token and re-bootstraps, with in-flight promise deduplication
- apiFetch auto-retries once on 401 via refreshAuth, propagates on second failure or non-401
- Server pings all WS clients every 15s, terminates unresponsive clients after 30s (2 missed pongs)
- Client detects WS silence within 30s via pong timeout, triggers close -> reconnect
- WS close code 4401 triggers automatic token refresh and reconnect

## Task Commits

Each task was committed atomically:

1. **Task 1: Auth auto-retry on 401 and API client resilience** - `a362f08` (feat)
2. **Task 2: WebSocket ping/pong heartbeat with silent disconnect detection** - `8a39fd8` (feat)

_Note: Both tasks used TDD flow (RED -> GREEN within single commits)_

## Files Created/Modified
- `src/src/lib/auth.ts` - Added refreshAuth() with promise dedup
- `src/src/lib/auth.test.ts` - 3 new tests for refreshAuth (clear+re-bootstrap, failure propagation, dedup)
- `src/src/lib/api-client.ts` - 401 auto-retry with single-attempt guard
- `src/src/lib/api-client.test.ts` - 4 new tests for 401 retry behavior
- `src/src/lib/websocket-client.ts` - Pong timeout, lastCloseCode tracking, clearPongTimer
- `src/src/lib/websocket-client.test.ts` - 7 new tests for heartbeat and close code
- `src/src/lib/websocket-init.ts` - Auth failure recovery on 4401 close code
- `src/src/lib/websocket-init.test.ts` - 3 new tests for WS auth recovery
- `server/index.js` - Server-side ping interval with dead client cleanup

## Decisions Made
- refreshAuth uses module-level promise dedup to prevent concurrent 401 retries from hammering the auth endpoint
- apiFetch retries exactly once on 401 using a local doFetch closure, not recursion
- Server WS ping interval is 15s with 2-missed-pong termination (30s dead client detection)
- Client pong timeout is 30s, triggers ws.close(4000) which feeds into existing scheduleReconnect logic
- WS auth failure uses close code 4401 to distinguish from normal disconnects

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- ESLint custom rule `loom/no-non-null-without-reason` required inline `// ASSERT:` comment for non-null assertion in test -- fixed by placing comment on same line as the assertion.
- `vi.clearAllMocks()` needed in api-client test beforeEach to prevent mock state leak between tests causing inflated call counts.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Connection layer is now self-healing for both HTTP 401s and WebSocket disconnects
- Server restart recovery is automatic (frontend re-auths and reconnects)
- Ready for remaining backend hardening plans (rate limiting, input validation, etc.)

---
*Phase: 39-backend-hardening*
*Completed: 2026-03-17*
