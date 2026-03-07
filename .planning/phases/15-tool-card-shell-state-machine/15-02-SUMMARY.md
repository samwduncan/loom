---
phase: 15-tool-card-shell-state-machine
plan: 02
subsystem: ui
tags: [react, tool-cards, elapsed-time, error-treatment, css-grid, state-machine]

requires:
  - phase: 15-tool-card-shell-state-machine
    provides: "ToolCardShell, useElapsedTime, formatElapsed from Plan 01"
  - phase: 07-tool-registry-proof-of-life
    provides: "ToolChip, tool-chip.css, tool-registry DefaultToolCard"
provides:
  - "ToolChip with elapsed time display and error force-expand behavior"
  - "ToolCardShell integration for animated expand/collapse in ToolChip"
  - "DefaultToolCard structured key-value layout (replaces raw JSON)"
  - "Rejected chip red border tint"
affects: [16-per-tool-cards, 17-tool-grouping]

tech-stack:
  added: []
  patterns: [adjust-state-during-rendering for error force-expand, always-mounted ToolCardShell with CSS Grid animation]

key-files:
  created: []
  modified:
    - src/src/components/chat/tools/ToolChip.tsx
    - src/src/components/chat/tools/ToolChip.test.tsx
    - src/src/components/chat/tools/tool-chip.css
    - src/src/lib/tool-registry.ts

key-decisions:
  - "Always-mounted ToolCardShell (not conditional render) for smooth CSS Grid animation"
  - "Adjust-state-during-rendering for error force-expand on status transition to rejected"
  - "Middle dot separator for elapsed time on chip (not dash or pipe)"
  - "DefaultToolCard no-truncation policy (full output, scrollable container handles overflow)"

patterns-established:
  - "ToolChip error auto-expand: useState init + adjust-state-during-rendering for transition"
  - "DefaultToolCard key-value rows: string values as text, non-strings as formatted JSON"
  - "tool-chip--rejected class for error border tint via oklch alpha"

requirements-completed: [TOOL-02, TOOL-06]

duration: 4min
completed: 2026-03-07
---

# Phase 15 Plan 02: ToolChip Integration + DefaultToolCard Upgrade Summary

**ToolChip wired to ToolCardShell with elapsed time display, error force-expand, and DefaultToolCard upgraded from raw JSON to structured key-value layout**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-07T21:39:32Z
- **Completed:** 2026-03-07T21:43:15Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- ToolChip displays elapsed time with middle dot separator using useElapsedTime hook
- Error tool calls auto-expand on mount and on transition to rejected via adjust-state-during-rendering
- ToolCardShell always mounted below chip (CSS Grid 0fr/1fr animation instead of conditional render)
- Rejected chips show red border tint via oklch alpha
- DefaultToolCard renders structured key-value rows instead of raw JSON.stringify
- Full output display with scrollable container (max-height 200px, no truncation)
- 540 tests passing (16 in ToolChip suite: 8 updated + 6 new)

## Task Commits

Each task was committed atomically:

1. **Task 1: ToolChip refactor -- elapsed time, error force-expand, ToolCardShell wiring** - `0b25154` (feat)
2. **Task 2: DefaultToolCard structured key-value upgrade** - `32ba4e2` (feat)

## Files Created/Modified
- `src/src/components/chat/tools/ToolChip.tsx` - Refactored with useElapsedTime, ToolCardShell integration, error force-expand
- `src/src/components/chat/tools/ToolChip.test.tsx` - Updated 8 tests for ToolCardShell compat, added 6 new tests (16 total)
- `src/src/components/chat/tools/tool-chip.css` - Added elapsed time, separator, rejected border, DefaultToolCard structured layout CSS
- `src/src/lib/tool-registry.ts` - DefaultToolCard upgraded to Object.entries key-value rows with no-truncation output

## Decisions Made
- Always-mounted ToolCardShell: CSS Grid 0fr/1fr requires element in DOM for animation. Conditional render would cause instant pop-in.
- No-truncation policy for DefaultToolCard output: ToolCardShell body scrolls, and full error output is important per user decision from Phase 15 planning.
- Middle dot separator for elapsed time on chip (matches ToolCardShell header style).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed duplicate text element in tests**
- **Found during:** Task 1 (ToolChip tests)
- **Issue:** ToolCardShell also renders displayName, causing `getByText('Bash')` to find multiple elements
- **Fix:** Changed tests to use `container.querySelector('button.tool-chip .tool-chip-name')` for chip-specific assertions
- **Files modified:** src/src/components/chat/tools/ToolChip.test.tsx
- **Verification:** All 16 tests pass

**2. [Rule 1 - Bug] Preserved tool-card-output--error class on DefaultToolCard**
- **Found during:** Task 2 (DefaultToolCard upgrade)
- **Issue:** New class string dropped `tool-card-output--error`, breaking existing test selector
- **Fix:** Added both `tool-card-output--error` and `default-tool-card-output--error` classes for backward compat
- **Files modified:** src/src/lib/tool-registry.ts
- **Verification:** Error output test passes, 540 total tests green

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Both fixes necessary for test compatibility with always-mounted ToolCardShell. No scope creep.

## Issues Encountered
None beyond the test compatibility fixes documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 15 complete: ToolCardShell + ToolChip integration fully wired
- Phase 16 per-tool cards can register custom renderCard components that render inside ToolCardShell
- Phase 17 tool grouping can leverage data-status/data-expanded attributes for force-expand logic

---
*Phase: 15-tool-card-shell-state-machine*
*Completed: 2026-03-07*
