---
phase: 15-tool-call-display
plan: 02
subsystem: ui
tags: [react, tailwind, accordion, state-management]

requires:
  - phase: 15-tool-call-display
    provides: Pill-shaped ToolActionCard (plan 01)
provides:
  - Pill-styled ToolCallGroup header with count and error badges
  - State-aware auto-expand/collapse behavior for grouped tool calls
affects: [tool-call-display, chat-view]

tech-stack:
  added: []
  patterns: [state-aware-accordion, count-badge-ui]

key-files:
  created: []
  modified:
    - src/components/chat/view/subcomponents/ToolCallGroup.tsx

key-decisions:
  - "Simplified header text to 'Tool Calls' label + count badge instead of verbose summary -- cleaner pill aesthetic"
  - "500ms delay before auto-collapse after all tools complete -- prevents jarring immediate collapse"
  - "Used useRef to track prevHasRunning for transition detection (running → complete)"

patterns-established:
  - "Count badge pattern: bg-muted/30 rounded-full px-1.5 py-0.5 font-mono tabular-nums"
  - "Error badge pattern: bg-red-500/15 text-red-400 rounded-full with failure count"
  - "State-aware accordion: auto-expand on running/error, delayed auto-collapse on completion"

requirements-completed: [TOOL-05]

duration: 5min
completed: 2026-03-03
---

# Phase 15: Tool Call Display — Plan 02 Summary

**Pill-styled accordion group header with count badges and state-aware auto-expand/collapse for 3+ consecutive tool calls**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-03
- **Completed:** 2026-03-03
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Group header restyled as rounded-xl pill bar matching ToolActionCard aesthetic
- Numeric count badge showing total tool calls in group
- Red error count badge with failure count when errors exist
- "running..." text indicator during active execution
- Auto-expand for running and error groups, auto-collapse 500ms after all complete
- Full summary text preserved as tooltip on hover

## Task Commits

1. **Task 1: Restyle ToolCallGroup header with pill shape and count badges** - `438baff` (feat)

## Files Created/Modified
- `src/components/chat/view/subcomponents/ToolCallGroup.tsx` - Pill header, badges, state-aware expand

## Decisions Made
- Used "Tool Calls" as clean label instead of verbose summary in header text
- 500ms auto-collapse delay prevents visual jarring after tools finish
- useRef prevHasRunning tracks transition from running to complete state

## Deviations from Plan
None - plan executed exactly as written

## Depth Compliance

### Task 1: Restyle ToolCallGroup header (Grade B)

| Depth Criterion | Status |
|----------------|--------|
| Running state: expanded with "running..." indicator | VERIFIED |
| Error state: expanded, red error badge | VERIFIED |
| All-complete state: collapsed, count badge shows total | VERIFIED |
| Count badge: tabular-nums, bg-muted/30 pill | VERIFIED |
| Error badge: bg-red-500/15 with red-400 text | VERIFIED |
| Edge case: mounts with all complete -- starts collapsed | VERIFIED |
| Edge case: both running and failed -- stays expanded | VERIFIED |
| Tooltip: full summary via title attribute | VERIFIED |

**Score:** 8/8

## Issues Encountered
None

## Next Phase Readiness
- Tool call display phase complete -- all pill styling and state behavior in place
- Ready for sidebar and global polish phases

---
*Phase: 15-tool-call-display*
*Completed: 2026-03-03*
