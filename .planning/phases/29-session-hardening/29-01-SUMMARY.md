---
phase: 29-session-hardening
plan: 01
subsystem: ui
tags: [zustand, websocket, sidebar, streaming, session-management, css-animation]

# Dependency graph
requires:
  - phase: 28-error-connection-resilience
    provides: WebSocket reconnect and connection state management
provides:
  - replaceSessionId atomic action in timeline store
  - prependMessages action in timeline store (for Plan 02 pagination)
  - Streaming pulse dot on active session in sidebar
  - onActiveSessions wiring for reconnect state sync
  - getActiveStreamingSessions export for session ID set
  - Stub session cleanup timer (30s)
affects: [29-02-PLAN, session-management, sidebar]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Atomic session ID swap via Immer mutable state"
    - "CSS pulse animation with prefers-reduced-motion support"
    - "Single stream store subscription in list parent, prop drilldown to items"

key-files:
  created: []
  modified:
    - src/src/stores/timeline.ts
    - src/src/stores/timeline.test.ts
    - src/src/lib/websocket-init.ts
    - src/src/lib/websocket-init.test.ts
    - src/src/components/sidebar/SessionItem.tsx
    - src/src/components/sidebar/SessionItem.test.tsx
    - src/src/components/sidebar/SessionList.tsx
    - src/src/components/sidebar/SessionList.test.tsx
    - src/src/components/sidebar/sidebar.css

key-decisions:
  - "Streaming dot takes visual priority over draft dot when both active"
  - "onActiveSessions clears stale streaming state on reconnect if active session no longer in backend set"
  - "Draft key migration is best-effort (try/catch, no error surfacing)"

patterns-established:
  - "Atomic ID swap: replaceSessionId mutates in-place via Immer instead of add+copy+remove"
  - "Module-scoped Set for activeStreamingSessions with readonly getter export"

requirements-completed: [SESS-02, SESS-03]

# Metrics
duration: 5min
completed: 2026-03-13
---

# Phase 29 Plan 01: Streaming Indicator & Stub ID Hardening Summary

**Streaming pulse dot on sidebar sessions, atomic stub-to-real ID swap via replaceSessionId, and prependMessages action for pagination**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-13T21:50:18Z
- **Completed:** 2026-03-13T21:55:15Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Atomic `replaceSessionId` action replaces fragile add+copy+remove pattern for stub reconciliation
- `prependMessages` action ready for Plan 02 pagination
- Streaming pulse dot on active session with reduced-motion support and aria-label
- `onActiveSessions` wired to clear stale streaming state on WS reconnect
- Draft key migration from stub ID to real ID in localStorage
- 30s stub cleanup timer for leaked stub- sessions

## Task Commits

Each task was committed atomically:

1. **Task 1: Store actions + stub ID hardening** - `feaaae3` (feat)
2. **Task 2: Streaming pulse dot in sidebar SessionItem** - `2a048c1` (feat)

## Files Created/Modified
- `src/src/stores/timeline.ts` - Added replaceSessionId and prependMessages actions
- `src/src/stores/timeline.test.ts` - 7 new tests for new actions
- `src/src/lib/websocket-init.ts` - Atomic swap, draft migration, stub cleanup, onActiveSessions wiring
- `src/src/lib/websocket-init.test.ts` - 3 new tests for reconciliation and active sessions
- `src/src/components/sidebar/SessionItem.tsx` - isStreaming prop, streaming dot rendering
- `src/src/components/sidebar/SessionItem.test.tsx` - 5 new tests for streaming indicator
- `src/src/components/sidebar/SessionList.tsx` - Stream store subscription, isStreaming prop pass-through
- `src/src/components/sidebar/SessionList.test.tsx` - 1 new test for streaming prop
- `src/src/components/sidebar/sidebar.css` - session-pulse keyframes and streaming dot styles

## Decisions Made
- Streaming dot takes visual priority over draft dot (streaming implies active use)
- onActiveSessions clears stale streaming state on reconnect
- Draft key migration is best-effort (silent failure acceptable)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- `prependMessages` action ready for Plan 02 paginated message loading
- `getActiveStreamingSessions` export available if Plan 02 needs it
- All 1065 tests passing, clean tsc and eslint

---
*Phase: 29-session-hardening*
*Completed: 2026-03-13*
