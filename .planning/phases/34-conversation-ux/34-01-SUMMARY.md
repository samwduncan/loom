---
phase: 34-conversation-ux
plan: 01
subsystem: ui
tags: [react, intersection-observer, auto-collapse, css-grid, hooks]

# Dependency graph
requires:
  - phase: 29-session-hardening
    provides: paginated message list with scroll container ref
provides:
  - useAutoCollapse hook with IntersectionObserver-based collapse detection
  - CollapsibleMessage component with compact summary and expand toggle
  - MessageList integration with auto-collapse behavior
affects: [37-performance, 36-accessibility]

# Tech tracking
tech-stack:
  added: []
  patterns: [IntersectionObserver per-message with debounced collapse, CSS grid 0fr/1fr transition for collapsible content]

key-files:
  created:
    - src/src/hooks/useAutoCollapse.ts
    - src/src/hooks/useAutoCollapse.test.ts
    - src/src/components/chat/view/CollapsibleMessage.tsx
    - src/src/components/chat/view/CollapsibleMessage.test.tsx
  modified:
    - src/src/components/chat/view/MessageList.tsx

key-decisions:
  - "useEffect (not render-time) for ref updates to satisfy react-hooks/refs ESLint rule"
  - "Capture refs inside useEffect cleanup to satisfy exhaustive-deps for ref cleanup patterns"

patterns-established:
  - "IntersectionObserver per-message: one observer per collapsible message with scroll container as root"
  - "Debounced collapse / immediate expand: 300ms delay on collapse prevents flicker, expand is instant"
  - "Pin/unpin toggle: user can lock a message open regardless of IntersectionObserver state"

requirements-completed: [UXR-01, UXR-02]

# Metrics
duration: 7min
completed: 2026-03-17
---

# Phase 34 Plan 01: Auto-Collapse Summary

**IntersectionObserver-based auto-collapse for old messages with 300ms debounce, pin/unpin toggle, and CSS grid transition**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-17T01:22:33Z
- **Completed:** 2026-03-17T01:30:08Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- useAutoCollapse hook creates per-message IntersectionObservers with debounced collapse and immediate expand
- CollapsibleMessage renders compact summary (role label + truncated content + tool count) or full children
- MessageList wraps each message in CollapsibleMessage with observeRef on outer div
- 21 new tests (11 hook + 10 component), full suite green at 1208 tests

## Task Commits

Each task was committed atomically:

1. **Task 1: Create useAutoCollapse hook and CollapsibleMessage component** - `a76db59` (feat)
2. **Task 2: Wire auto-collapse into MessageList** - `a48c2ee` (feat, shared with 34-02 TokenUsage changes)

_Note: Task 1 followed TDD (RED -> GREEN). Task 2 MessageList changes were committed alongside concurrent 34-02 work._

## Files Created/Modified
- `src/src/hooks/useAutoCollapse.ts` - IntersectionObserver-based collapse detection hook
- `src/src/hooks/useAutoCollapse.test.ts` - 11 tests: observer creation, debounce, pinning, cleanup
- `src/src/components/chat/view/CollapsibleMessage.tsx` - Wrapper with collapsed summary and expand toggle
- `src/src/components/chat/view/CollapsibleMessage.test.tsx` - 10 tests: summary rendering, truncation, tool count
- `src/src/components/chat/view/MessageList.tsx` - Integrated useAutoCollapse and CollapsibleMessage

## Decisions Made
- Used useEffect (not render-time assignment) for syncing messageCount/threshold refs to satisfy react-hooks/refs rule
- Captured ref values inside useEffect before cleanup function to satisfy react-hooks/exhaustive-deps
- Reused CSS grid 0fr/1fr transition pattern from ThinkingDisclosure for consistent expand/collapse animations

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed react-hooks/refs ESLint violations**
- **Found during:** Task 1 (GREEN phase commit)
- **Issue:** Setting ref.current during render violates react-hooks/refs rule in React 19 ESLint
- **Fix:** Moved messageCountRef and thresholdRef updates into useEffect
- **Files modified:** src/src/hooks/useAutoCollapse.ts
- **Verification:** ESLint passes, all tests pass
- **Committed in:** a76db59 (part of Task 1 commit)

**2. [Rule 3 - Blocking] Fixed react-hooks/exhaustive-deps for cleanup refs**
- **Found during:** Task 1 (GREEN phase commit)
- **Issue:** Cleanup function accessing ref.current directly triggers stale-ref warning
- **Fix:** Captured observersRef.current and timeoutsRef.current into local variables inside useEffect
- **Files modified:** src/src/hooks/useAutoCollapse.ts
- **Verification:** ESLint passes, cleanup tests pass
- **Committed in:** a76db59 (part of Task 1 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes required for ESLint compliance. No scope creep.

## Issues Encountered
- Concurrent 34-02 agent activity caused a mixed commit (stash collision during lint-staged). Resolved by resetting the bad commit, re-committing Task 1 cleanly, and Task 2 was captured in the concurrent commit.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Auto-collapse foundation complete for conversation UX
- Plan 34-02 (token usage footers) can proceed independently
- Accessibility audit (Phase 36) should verify collapsed summary keyboard navigation and ARIA

## Self-Check: PASSED

- All 5 source/test files exist on disk
- Commit a76db59 (Task 1) verified in git log
- Commit a48c2ee (Task 2) verified in git log
- Full test suite: 1208 tests passing, 121 files, 0 failures

---
*Phase: 34-conversation-ux*
*Completed: 2026-03-17*
