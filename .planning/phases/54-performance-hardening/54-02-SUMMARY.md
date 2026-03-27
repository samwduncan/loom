---
phase: 54-performance-hardening
plan: 02
subsystem: ui
tags: [react, lazy-loading, code-splitting, performance, suspense]

# Dependency graph
requires:
  - phase: 21-layout
    provides: CSS show/hide panel pattern, TabBar, PanelErrorBoundary
provides:
  - Lazy-mount-on-first-visit pattern for workspace panels
  - PERF-04 skeleton audit confirmation
affects: [content-area, terminal, git-panel]

# Tech tracking
tech-stack:
  added: []
  patterns: [lazy-mount-on-first-visit with visitedTabs state tracking]

key-files:
  created: []
  modified:
    - src/src/components/content-area/view/ContentArea.tsx
    - src/src/components/content-area/view/ContentArea.test.tsx

key-decisions:
  - "useState over useRef for visitedTabs to satisfy React 19 react-hooks/refs lint rule"
  - "PERF-04 skeleton audit: all 7 async areas already have loading states -- no gaps"

patterns-established:
  - "Lazy-mount-on-first-visit: useState<Set<TabId>> tracks visited tabs, conditional rendering gates panel mount"
  - "Adjust-state-during-render: if (!visitedTabs.has(tab)) setVisitedTabs(...) for monotonic state updates"

requirements-completed: [PERF-03, PERF-04]

# Metrics
duration: 3min
completed: 2026-03-27
---

# Phase 54 Plan 02: Lazy Panels & Skeleton Audit Summary

**Lazy-mount-on-first-visit for Shell/Git panels via visitedTabs state + React.lazy(), with full skeleton audit confirming all 7 async areas covered**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-27T00:56:20Z
- **Completed:** 2026-03-27T00:59:43Z
- **Tasks:** 1 (TDD: RED + GREEN)
- **Files modified:** 2

## Accomplishments
- Shell and Git panel JavaScript bundles no longer load at app startup -- only on first tab visit
- After first visit, panels stay mounted (hidden via CSS) preserving terminal sessions and git state
- Chat and Files remain eagerly mounted as before (primary + lightweight)
- All 7 async content areas confirmed to have skeleton loading states (PERF-04 audit documented in ContentArea.tsx header)
- 11 tests covering lazy-mount, mount-once persistence, CSS show/hide, ARIA, mobile override, and error boundaries

## Task Commits

Each task was committed atomically:

1. **Task 1 (RED): Failing tests for lazy-mount-on-first-visit** - `5809cea` (test)
2. **Task 1 (GREEN): Implement lazy-mount-on-first-visit** - `9358ce4` (feat)

## Files Created/Modified
- `src/src/components/content-area/view/ContentArea.tsx` - Refactored from useMemo eager-mount to visitedTabs state-driven lazy-mount
- `src/src/components/content-area/view/ContentArea.test.tsx` - 11 tests: 4 new lazy-mount + 7 updated for new pattern

## Decisions Made
- **useState over useRef for visitedTabs:** React 19's `react-hooks/refs` ESLint rule prohibits reading ref.current during render. Switched to useState with "adjust state during rendering" pattern -- only triggers re-render on genuinely new tab visits (monotonic set growth).
- **PERF-04 already satisfied:** Audit found all 7 async areas (messages, sessions, terminal, git, editor, file tree, settings) already have skeleton loading states. Documented in ContentArea.tsx header comment.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] React 19 lint rule prohibits ref reads during render**
- **Found during:** Task 1 GREEN (implementation)
- **Issue:** Plan specified `useRef<Set<TabId>>` for visitedTabs, but reading `visitedTabs.current.has()` during render triggers `react-hooks/refs` ESLint error (6 violations)
- **Fix:** Replaced useRef with useState + "adjust state during rendering" pattern. Only triggers re-render on first visit to a new tab (Set.has check prevents infinite loops).
- **Files modified:** src/src/components/content-area/view/ContentArea.tsx
- **Verification:** ESLint clean (0 errors), all 11 tests pass
- **Committed in:** 9358ce4 (GREEN commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Functionally identical behavior, better React 19 compliance. No scope creep.

## Issues Encountered
None -- the useRef-to-useState pivot was straightforward.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- ContentArea lazy-mount pattern established and tested
- Terminal and Git bundles will code-split correctly via React.lazy()
- Phase 54 performance hardening complete

---
*Phase: 54-performance-hardening*
*Completed: 2026-03-27*
