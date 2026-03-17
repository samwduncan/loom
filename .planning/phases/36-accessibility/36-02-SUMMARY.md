---
phase: 36-accessibility
plan: 02
subsystem: ui
tags: [a11y, aria-live, focus-management, screen-reader, react]

# Dependency graph
requires:
  - phase: 36-accessibility
    provides: "SkipLink, ARIA roles, semantic headings from plan 01"
provides:
  - "LiveAnnouncer component for screen reader announcements"
  - "useStreamAnnouncements hook for streaming/tool event announcements"
  - "useFocusRestore hook for non-Radix overlay focus management"
  - "TabBar panel focus on tab switch"
affects: [36-accessibility]

# Tech tracking
tech-stack:
  added: []
  patterns: [useSyncExternalStore for ref-backed external state, rAF panel focus on tab switch]

key-files:
  created:
    - src/src/components/a11y/LiveAnnouncer.tsx
    - src/src/components/a11y/useStreamAnnouncements.ts
    - src/src/components/a11y/useFocusRestore.ts
    - src/src/tests/a11y-focus.test.tsx
    - src/src/tests/a11y-announcer.test.tsx
  modified:
    - src/src/components/content-area/view/TabBar.tsx
    - src/src/components/content-area/view/ContentArea.tsx
    - src/src/components/chat/view/ChatView.tsx

key-decisions:
  - "useSyncExternalStore + ref pattern for LiveAnnouncer to satisfy both set-state-in-effect and refs-during-render lint rules"
  - "ImageLightbox uses Radix Dialog so no custom focus trap needed"
  - "rAF delay for panel focus to let DOM settle after CSS show/hide switch"

patterns-established:
  - "useSyncExternalStore + subscribersRef pattern for effect-driven UI state that avoids React 19 lint rules"
  - "tabIndex={-1} + outline-none on tabpanel divs for programmatic focus"

requirements-completed: [A11Y-03, A11Y-04]

# Metrics
duration: 9min
completed: 2026-03-17
---

# Phase 36 Plan 02: Focus Management & Screen Reader Announcements Summary

**LiveAnnouncer with stream/tool event announcements, useFocusRestore hook, and TabBar panel focus-on-switch for keyboard and screen reader accessibility**

## Performance

- **Duration:** 9 min
- **Started:** 2026-03-17T03:08:38Z
- **Completed:** 2026-03-17T03:17:52Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- LiveAnnouncer component renders visually-hidden aria-live region for screen reader announcements
- useStreamAnnouncements hook announces streaming start/end and tool completion/failure events
- useFocusRestore hook saves and restores focus for non-Radix overlays
- TabBar moves focus into the active panel container on tab switch (critical for CSS show/hide pattern)
- 11 new tests (3 focus + 8 announcer), all passing, 1272 total tests

## Task Commits

Each task was committed atomically:

1. **Task 1: Focus management -- panel switch focus, useFocusRestore hook** - `32cf467` (feat)
2. **Task 2: LiveAnnouncer component wired to streaming and tool events** - `5716417` (feat)

## Files Created/Modified
- `src/src/components/a11y/LiveAnnouncer.tsx` - Visually-hidden aria-live region with clear-then-set re-announcement
- `src/src/components/a11y/useStreamAnnouncements.ts` - Hook deriving announcements from stream store state
- `src/src/components/a11y/useFocusRestore.ts` - Hook for saving/restoring focus on overlay open/close
- `src/src/components/content-area/view/TabBar.tsx` - Added handleTabClick with rAF panel focus
- `src/src/components/content-area/view/ContentArea.tsx` - Added tabIndex={-1} and outline-none to tabpanel divs
- `src/src/components/chat/view/ChatView.tsx` - Wired LiveAnnouncer + useStreamAnnouncements
- `src/src/tests/a11y-focus.test.tsx` - 3 focus management tests
- `src/src/tests/a11y-announcer.test.tsx` - 8 announcer and stream announcement tests
- `src/src/tests/a11y-contrast.test.ts` - Fixed pre-existing TS errors (ASSERT comments on regex groups)
- `src/src/tests/a11y-audit.test.tsx` - Fixed unused import (pre-existing TS error)

## Decisions Made
- Used useSyncExternalStore + ref pattern for both LiveAnnouncer and useStreamAnnouncements to satisfy React 19's strict lint rules (no setState in effects, no ref access during render)
- ImageLightbox uses Radix Dialog which handles focus trapping internally -- no custom implementation needed
- Used rAF for panel focus after tab switch to ensure DOM has settled after CSS show/hide transition

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed pre-existing TS errors in a11y-contrast.test.ts**
- **Found during:** Task 1
- **Issue:** Regex match groups typed as `string | undefined` but passed to `parseFloat(string)`
- **Fix:** Extracted to named variables with ASSERT comments per custom lint rule
- **Files modified:** src/src/tests/a11y-contrast.test.ts
- **Verification:** tsc --noEmit passes
- **Committed in:** 32cf467 (Task 1 commit)

**2. [Rule 3 - Blocking] Fixed unused import in a11y-audit.test.tsx**
- **Found during:** Task 2
- **Issue:** `useUIStore` imported but only used via `vi.importActual` inside mock factory
- **Fix:** Removed unused import
- **Files modified:** src/src/tests/a11y-audit.test.tsx
- **Verification:** tsc --noEmit passes
- **Committed in:** 5716417 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking -- pre-existing TS errors in other test files)
**Impact on plan:** Both fixes were to pre-existing issues in files from plan 01. No scope creep.

## Issues Encountered
- React 19 lint rules (`react-hooks/set-state-in-effect` and `react-hooks/refs`) required using `useSyncExternalStore` + `subscribersRef` pattern instead of the simpler `useState` + `useEffect` approach. This is a more complex pattern but satisfies all lint rules while maintaining the same behavior.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Focus management and screen reader announcements complete
- Plan 03 (reduced motion / performance) can proceed independently
- All 1272 tests passing, no type errors

---
*Phase: 36-accessibility*
*Completed: 2026-03-17*
