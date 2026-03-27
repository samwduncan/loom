---
phase: 54-performance-hardening
plan: 01
subsystem: api, ui
tags: [fetch, deduplication, optimistic-update, rollback, zustand]

# Dependency graph
requires:
  - phase: none
    provides: existing api-client and SessionList
provides:
  - GET request deduplication via inflightRequests Map
  - Optimistic session delete with rollback on failure
affects: [any component calling apiFetch for GET, session management]

# Tech tracking
tech-stack:
  added: []
  patterns: [inflight-dedup-map, response-clone-per-consumer, optimistic-delete-with-rollback]

key-files:
  created:
    - src/src/lib/api-client.test.ts (5 new dedup tests added)
  modified:
    - src/src/lib/api-client.ts
    - src/src/components/sidebar/SessionList.tsx

key-decisions:
  - "Dedup map stores raw fetch Promise<Response>, consumers clone independently"
  - "Only GET requests are deduplicated -- POST/PATCH/DELETE are mutation-safe"
  - "Optimistic delete for single sessions only; bulk delete waits for API"

patterns-established:
  - "inflightRequests Map pattern: store fetch promise, clone per consumer, .finally() cleanup"
  - "Optimistic delete: capture -> remove -> API -> rollback on error with addSession()"

requirements-completed: [PERF-01, PERF-02]

# Metrics
duration: 3min
completed: 2026-03-27
---

# Phase 54 Plan 01: Request Dedup & Optimistic Delete Summary

**GET request deduplication via inflight Map with Response.clone(), plus optimistic session delete with rollback on API failure**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-27T00:56:18Z
- **Completed:** 2026-03-27T01:00:30Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Concurrent identical GET requests now share a single fetch call via inflightRequests Map
- Session delete removes from sidebar instantly, fires API in background, rolls back on failure
- 5 new dedup tests (15 total in api-client.test.ts), all passing

## Task Commits

Each task was committed atomically:

1. **Task 1: Add request deduplication to api-client** - `b188a88` (feat)
2. **Task 2: Make session delete optimistic with rollback** - `1b5915a` (feat)

## Files Created/Modified
- `src/src/lib/api-client.ts` - Added inflightRequests Map, clearInflightRequests(), processResponse(), clone-based dedup for GET
- `src/src/lib/api-client.test.ts` - 5 new dedup tests: shared promise, cleanup, mutation safety, error propagation, URL isolation
- `src/src/components/sidebar/SessionList.tsx` - Optimistic single delete with capture/remove/rollback, PERF-02 comments on rename and pin

## Decisions Made
- Dedup map stores the raw `fetch()` Promise<Response>; both original caller and dedup waiters clone independently so the stored response stays unconsumed
- Only GET requests are deduplicated (method undefined or 'GET'); POST/PATCH/DELETE mutations never share promises
- Optimistic delete applies only to single-session deletes; bulk delete waits for API response due to complexity
- clearInflightRequests() exported for test cleanup only

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Response body "already read" errors in tests: `mockResolvedValue` reuses the same Response object across calls. Fixed by using `mockImplementation` with factory function for non-dedup tests (POST, different URLs) to produce fresh Response instances.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- API client dedup is transparent to all callers -- no migration needed
- Optimistic delete pattern can be extended to bulk delete in future if needed
- All verification passing: 15 tests, TypeScript clean, ESLint clean

---
*Phase: 54-performance-hardening*
*Completed: 2026-03-27*
