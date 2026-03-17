---
phase: 31-editor-tool-enhancements
plan: 02
subsystem: ui
tags: [react, lucide, zustand, terminal, tool-cards, tdd]

# Dependency graph
requires:
  - phase: 07-tool-calls
    provides: "BashToolCard component and ToolCardProps interface"
  - phase: 25-terminal
    provides: "sendToShell imperative API and shell tab"
provides:
  - "Run in Terminal action button on BashToolCard"
  - "One-click command re-execution from chat to terminal"
affects: [tool-cards, terminal-integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "useUIStore selector pattern for store actions in components (not getState())"
    - "rAF delay between tab switch and terminal send for CSS visibility"

key-files:
  created: []
  modified:
    - src/src/components/chat/tools/BashToolCard.tsx
    - src/src/components/chat/tools/BashToolCard.test.tsx

key-decisions:
  - "Used useUIStore selector instead of getState() to comply with no-external-store-mutation ESLint rule"
  - "Used rAF + 500ms retry for sendToShell to handle terminal not yet mounted after tab switch"

patterns-established:
  - "Action buttons on tool cards: conditional on resolved status, ghost variant, design tokens only"

requirements-completed: [FTE-04, FTE-05]

# Metrics
duration: 5min
completed: 2026-03-16
---

# Phase 31 Plan 02: Run in Terminal Button Summary

**BashToolCard "Run in Terminal" action button with tab switch and sendToShell wiring via TDD**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-16T15:55:55Z
- **Completed:** 2026-03-16T16:00:55Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Added "Run in Terminal" ghost button with Play icon on resolved Bash tool cards
- Button switches to shell tab and sends command to terminal in one click
- 5 new test cases covering visibility states and click behavior (TDD)
- All 1106 tests pass across 113 test files, no regressions

## Task Commits

Each task was committed atomically:

1. **Task 1: Add "Run in Terminal" button tests (RED)** - `bde46f2` (test)
2. **Task 2: Implement "Run in Terminal" button (GREEN)** - `1c84402` (feat)

_Note: TDD plan -- Task 1 is RED (failing tests), Task 2 is GREEN (implementation passes all)_

## Files Created/Modified
- `src/src/components/chat/tools/BashToolCard.tsx` - Added status prop destructuring, useUIStore selector, handleRunInTerminal handler, conditional Play button
- `src/src/components/chat/tools/BashToolCard.test.tsx` - Added 5 test cases for button visibility and click behavior, mocks for sendToShell and useUIStore

## Decisions Made
- Used `useUIStore((s) => s.setActiveTab)` selector pattern instead of `useUIStore.getState()` to comply with project's `no-external-store-mutation` ESLint rule
- Used `requestAnimationFrame` delay between tab switch and sendToShell to ensure CSS show/hide panel visibility triggers before terminal receives input
- Added 500ms retry fallback if sendToShell returns false (terminal not yet connected after tab switch)
- Corrected plan's status values from 'pending'/'running' to actual ToolCallStatus values 'invoked'/'executing'

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected ToolCallStatus values in tests**
- **Found during:** Task 1 (RED phase)
- **Issue:** Plan specified 'pending' and 'running' but actual ToolCallStatus type is 'invoked' | 'executing' | 'resolved' | 'rejected'
- **Fix:** Changed test cases to use 'invoked' and 'executing'
- **Files modified:** src/src/components/chat/tools/BashToolCard.test.tsx
- **Verification:** TypeScript compilation passes
- **Committed in:** bde46f2 (Task 1 commit)

**2. [Rule 3 - Blocking] Used selector pattern instead of getState()**
- **Found during:** Task 2 (GREEN phase)
- **Issue:** ESLint rule `loom/no-external-store-mutation` blocks useUIStore.getState() in component files
- **Fix:** Switched to `useUIStore((s) => s.setActiveTab)` selector pattern matching existing codebase convention
- **Files modified:** src/src/components/chat/tools/BashToolCard.tsx, BashToolCard.test.tsx
- **Verification:** ESLint + typecheck + tests all pass
- **Committed in:** 1c84402 (Task 2 commit)

**3. [Rule 1 - Bug] Updated existing null-output test assertion**
- **Found during:** Task 2 (GREEN phase)
- **Issue:** Existing test "renders no output area when output is null" used `container.querySelector('button')` to assert no button, but new Run in Terminal button now renders for resolved + non-empty command
- **Fix:** Changed assertion to specifically check for absence of "Show more" truncation button
- **Files modified:** src/src/components/chat/tools/BashToolCard.test.tsx
- **Verification:** All 13 BashToolCard tests pass
- **Committed in:** 1c84402 (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (2 bugs, 1 blocking)
**Impact on plan:** All auto-fixes necessary for correctness and lint compliance. No scope creep.

## Issues Encountered
None beyond the deviations documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Run in Terminal feature complete and tested
- Ready for Phase 31 Plan 01 (editor minimap) or next phase
- Tool card action button pattern established for future tool-specific actions

---
*Phase: 31-editor-tool-enhancements*
*Completed: 2026-03-16*
