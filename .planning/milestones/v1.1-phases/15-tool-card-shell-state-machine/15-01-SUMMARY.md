---
phase: 15-tool-card-shell-state-machine
plan: 01
subsystem: ui
tags: [react, css-grid, animation, tool-cards, elapsed-time, state-machine]

requires:
  - phase: 07-tool-registry-proof-of-life
    provides: "ToolConfig interface, tool-registry, ToolChip, tool-chip.css status dots"
provides:
  - "formatElapsed utility for human-readable elapsed time"
  - "useElapsedTime hook with 100ms live timer and freeze-on-complete"
  - "ToolCardShell wrapper component with header, expand animation, error treatment"
  - "tool-card-shell.css with CSS Grid expand/collapse and error styling"
affects: [16-per-tool-cards, 17-tool-grouping]

tech-stack:
  added: [lucide-react AlertTriangle]
  patterns: [CSS Grid 0fr/1fr expand with spring easing, adjust-state-during-rendering for completedAt, useEffect ref sync]

key-files:
  created:
    - src/src/lib/format-elapsed.ts
    - src/src/lib/format-elapsed.test.ts
    - src/src/hooks/useElapsedTime.ts
    - src/src/components/chat/tools/ToolCardShell.tsx
    - src/src/components/chat/tools/ToolCardShell.test.tsx
    - src/src/components/chat/tools/tool-card-shell.css
  modified: []

key-decisions:
  - "Adjust-state-during-rendering pattern for completedAt transitions (avoids setState-in-effect ESLint rule)"
  - "useEffect ref sync for completedAtRef (react-hooks/refs compliance)"
  - "Status labels: Starting/Running/Done/Failed"
  - "onToggle callback prop on ToolCardShell for parent-controlled expand state"

patterns-established:
  - "formatElapsed: sub-60s one-decimal seconds, 60s+ minutes+seconds format"
  - "useElapsedTime: frozen value for completed, 100ms interval for live, belt-and-suspenders ref guard"
  - "ToolCardShell: data-status + data-expanded CSS attributes for state-driven styling"
  - "oklch(from var(--status-error) l c h / alpha) for error treatment tinting"

requirements-completed: [TOOL-01, TOOL-03, TOOL-04, TOOL-05]

duration: 3min
completed: 2026-03-07
---

# Phase 15 Plan 01: ToolCardShell + State Machine Summary

**Elapsed time utility, useElapsedTime hook, and ToolCardShell wrapper with CSS Grid expand/collapse animation and error state treatment**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-07T21:33:51Z
- **Completed:** 2026-03-07T21:37:25Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- formatElapsed utility handles sub-second, second, and minute ranges with consistent formatting
- useElapsedTime hook manages 100ms interval lifecycle with proper cleanup and freeze-on-complete
- ToolCardShell provides consistent header layout with icon, name, status dot, label, elapsed time
- CSS Grid 0fr/1fr expand/collapse animation with spring cubic-bezier easing
- Error state visual treatment with red border/background tint and AlertTriangle icon
- 18 new tests (534 total), zero regressions

## Task Commits

Each task was committed atomically:

1. **Task 1: formatElapsed utility + useElapsedTime hook** - `ee07014` (feat)
2. **Task 2: ToolCardShell component + CSS** - `e4cb2b9` (feat)

## Files Created/Modified
- `src/src/lib/format-elapsed.ts` - Elapsed time formatting utility (sub-60s "1.2s", 60s+ "1m 23s")
- `src/src/lib/format-elapsed.test.ts` - 8 boundary case tests for formatElapsed
- `src/src/hooks/useElapsedTime.ts` - Hook wrapping setInterval + cleanup for live elapsed time
- `src/src/components/chat/tools/ToolCardShell.tsx` - Shared card wrapper with header, expand animation, error treatment
- `src/src/components/chat/tools/ToolCardShell.test.tsx` - 10 tests covering header, expand, error, children
- `src/src/components/chat/tools/tool-card-shell.css` - CSS for card shell expand animation, error treatment, header layout

## Decisions Made
- Used "adjust state during rendering" pattern for completedAt transitions to avoid triggering the react-hooks/set-state-in-effect ESLint rule
- Used useEffect ref sync pattern (not render-time assignment) for completedAtRef per react-hooks/refs rule
- Status labels: "Starting" (invoked), "Running" (executing), "Done" (resolved), "Failed" (rejected)
- Added onToggle callback prop to ToolCardShell for parent-controlled expansion state

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed ref assignment during render**
- **Found during:** Task 1 (useElapsedTime hook)
- **Issue:** `completedAtRef.current = completedAt` during render violates react-hooks/refs ESLint rule
- **Fix:** Moved ref sync into a dedicated useEffect
- **Files modified:** src/src/hooks/useElapsedTime.ts
- **Verification:** ESLint passes, pre-commit hook succeeds

**2. [Rule 1 - Bug] Fixed setState in effect body**
- **Found during:** Task 1 (useElapsedTime hook)
- **Issue:** `setElapsed()` call in effect body violates react-hooks/set-state-in-effect ESLint rule
- **Fix:** Used "adjust state during rendering" pattern with prevCompletedAt tracking
- **Files modified:** src/src/hooks/useElapsedTime.ts
- **Verification:** ESLint passes, pre-commit hook succeeds

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Both fixes required for ESLint compliance. No scope creep.

## Issues Encountered
None beyond the ESLint fixes documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- ToolCardShell ready for Phase 16 per-tool card implementations to render inside
- Phase 17 tool grouping can use data-status attribute for force-expand logic
- All design token references verified (--surface-raised, --border-subtle, --status-error, etc.)

---
*Phase: 15-tool-card-shell-state-machine*
*Completed: 2026-03-07*
