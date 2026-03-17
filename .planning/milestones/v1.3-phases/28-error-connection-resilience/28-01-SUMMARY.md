---
phase: 28-error-connection-resilience
plan: 01
subsystem: ui
tags: [react, zustand, websocket, connection-status, error-handling]

# Dependency graph
requires:
  - phase: 07-tool-call
    provides: WebSocketClient singleton, connection store
provides:
  - ConnectionStatusIndicator component (colored dot for connection health)
  - ConnectionBanner component (error banner + reconnection overlay)
  - tryReconnect() public method on WebSocketClient
affects: [29-session-recovery, error-handling, connection-resilience]

# Tech tracking
tech-stack:
  added: []
  patterns: [connection-status-dot, error-banner-overlay, reconnect-button]

key-files:
  created:
    - src/src/components/shared/ConnectionStatusIndicator.tsx
    - src/src/components/shared/ConnectionStatusIndicator.test.tsx
    - src/src/components/shared/ConnectionBanner.tsx
    - src/src/components/shared/ConnectionBanner.test.tsx
    - src/src/components/shared/connection-banner.css
  modified:
    - src/src/components/sidebar/Sidebar.tsx
    - src/src/components/app-shell/AppShell.tsx
    - src/src/lib/websocket-client.ts

key-decisions:
  - "Used tryReconnect() method instead of re-bootstrapping auth for manual reconnect button"
  - "Banner uses fixed positioning with z-toast to overlay the entire app shell"

patterns-established:
  - "Connection status dot: selector-only subscription to providers.claude.status"
  - "Error overlay: fixed positioning above grid, auto-dismiss on status change"

requirements-completed: [ERR-01, ERR-02, ERR-05]

# Metrics
duration: 7min
completed: 2026-03-12
---

# Phase 28 Plan 01: Connection Health UI Summary

**Connection status dot indicator (sidebar) and error/reconnection banner overlay (app shell) with 13 tests**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-12T15:36:15Z
- **Completed:** 2026-03-12T15:43:00Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- ConnectionStatusIndicator renders color-coded dot (green/yellow/red) with pulse animation for transient states
- ConnectionBanner shows error alert on disconnect+error, reconnection overlay with attempt count, and connection-lost with manual reconnect
- Both components wired into Sidebar header and AppShell overlay respectively
- 13 new tests covering all 4 connection states and banner variants

## Task Commits

Each task was committed atomically:

1. **Task 1: ConnectionStatusIndicator and ConnectionBanner components** - `699d9f1` (feat)
2. **Task 2: Wire components into AppShell and Sidebar** - `76d4501` (feat)

_Note: Task 1 was TDD (tests written first, then implementation)_

## Files Created/Modified
- `src/src/components/shared/ConnectionStatusIndicator.tsx` - Colored dot indicator for connection health
- `src/src/components/shared/ConnectionStatusIndicator.test.tsx` - 6 tests for dot rendering per state
- `src/src/components/shared/ConnectionBanner.tsx` - Error banner + reconnection overlay + connection lost states
- `src/src/components/shared/ConnectionBanner.test.tsx` - 7 tests for banner state rendering
- `src/src/components/shared/connection-banner.css` - Backdrop blur styles for reconnection overlay
- `src/src/lib/websocket-client.ts` - Added public tryReconnect() method
- `src/src/components/sidebar/Sidebar.tsx` - Added ConnectionStatusIndicator to header
- `src/src/components/app-shell/AppShell.tsx` - Added ConnectionBanner as overlay

## Decisions Made
- Used `tryReconnect()` (new public method on WebSocketClient) instead of `initializeWebSocket()` for the manual reconnect button, because the init function has a double-init guard that prevents re-calling. `tryReconnect()` reuses the stored token from the last successful connection.
- ConnectionBanner renders as a sibling before the grid div in AppShell (not inside it), so it can overlay the entire viewport with fixed positioning.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added tryReconnect() to WebSocketClient**
- **Found during:** Task 1 (ConnectionBanner implementation)
- **Issue:** Plan specified `wsClient.connect()` for reconnect button, but connect() requires a token parameter. No public reconnect method existed.
- **Fix:** Added `tryReconnect()` public method that reuses the stored token from last successful connection.
- **Files modified:** src/src/lib/websocket-client.ts
- **Verification:** Tests pass with mocked tryReconnect, TypeScript compiles
- **Committed in:** 699d9f1 (Task 1 commit)

**2. [Rule 3 - Blocking] Fixed implicit any types in useNavigateAwayGuard.test.ts**
- **Found during:** Task 1 (pre-commit hook typecheck)
- **Issue:** Pre-existing test file had `([event])` destructuring without type annotations, blocking tsc --noEmit
- **Fix:** Added `[string, ...unknown[]]` type annotations to destructured parameters
- **Files modified:** src/src/hooks/useNavigateAwayGuard.test.ts
- **Verification:** tsc --noEmit passes
- **Committed in:** 699d9f1 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both auto-fixes necessary for functionality and build. No scope creep.

## Issues Encountered
None beyond the auto-fixed deviations.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Connection health UI complete, ready for reconnection logic improvements in later plans
- Status indicator and banner will automatically reflect state changes from the connection store
- Future plans can add more sophisticated reconnection strategies (exponential backoff tuning, max attempts)

---
*Phase: 28-error-connection-resilience*
*Completed: 2026-03-12*
