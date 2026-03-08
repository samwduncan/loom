---
phase: 17-tool-grouping-permissions
plan: 01
subsystem: ui
tags: [react, css-grid, accordion, tool-calls, grouping]

# Dependency graph
requires:
  - phase: 15-tool-card-shell
    provides: ToolCardShell CSS Grid animation pattern, ToolChip component
  - phase: 16-per-tool-cards
    provides: Per-tool card components, tool-registry with Lucide icons
provides:
  - groupToolCalls() pure function for partitioning tool arrays
  - ToolCallGroup collapsible accordion component
  - ToolCallGroup.css with CSS Grid 0fr/1fr animation
  - AssistantMessage rendering grouped tools after markdown content
affects: [17-02-streaming-tool-grouping, 17-03-permission-banners]

# Tech tracking
tech-stack:
  added: []
  patterns: [tool-call-grouping-algorithm, two-level-expand, error-extraction-from-groups]

key-files:
  created:
    - src/src/lib/groupToolCalls.ts
    - src/src/lib/groupToolCalls.test.ts
    - src/src/components/chat/tools/ToolCallGroup.tsx
    - src/src/components/chat/tools/ToolCallGroup.css
    - src/src/components/chat/tools/ToolCallGroup.test.tsx
  modified:
    - src/src/components/chat/tools/ToolChip.tsx
    - src/src/components/chat/view/AssistantMessage.tsx

key-decisions:
  - "Render tools as React components after markdown content instead of marker injection into markdown"
  - "div[role=button] for group header to allow nested Expand all button (avoid button-in-button)"
  - "defaultExpanded prop on ToolChip for group Expand all via key remounting"

patterns-established:
  - "Tool grouping: error extraction with demotion when <2 non-error tools remain"
  - "Two-level expand: group accordion -> individual ToolChips -> individual ToolCards"

requirements-completed: [TOOL-20, TOOL-21, TOOL-22, TOOL-23]

# Metrics
duration: 5min
completed: 2026-03-08
---

# Phase 17 Plan 01: Tool Call Grouping Summary

**Pure groupToolCalls algorithm partitioning consecutive tool calls into collapsible ToolCallGroup accordions with CSS Grid animation, error extraction, and two-level expand**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-08T17:47:29Z
- **Completed:** 2026-03-08T17:52:15Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- groupToolCalls() correctly partitions arrays: groups (2+ non-error), singles, error extraction with demotion
- ToolCallGroup renders collapsed header with count + deduplicated type summary, CSS Grid expand/collapse, "Expand all" button
- AssistantMessage uses grouping for historical messages -- tools render after markdown content as React components
- Error tools always visible below group as standalone force-expanded ToolChip components

## Task Commits

Each task was committed atomically:

1. **Task 1: groupToolCalls utility + ToolCallGroup component + CSS** - `1407402` (feat)
2. **Task 2: Wire ToolCallGroup into AssistantMessage** - `58849a8` (feat)

## Files Created/Modified
- `src/src/lib/groupToolCalls.ts` - Pure function partitioning tool calls into groups/singles with error extraction
- `src/src/lib/groupToolCalls.test.ts` - 7 unit tests for grouping algorithm
- `src/src/components/chat/tools/ToolCallGroup.tsx` - Collapsible group container with two-level expand
- `src/src/components/chat/tools/ToolCallGroup.css` - Group container styles, CSS Grid 0fr/1fr animation, reduced-motion support
- `src/src/components/chat/tools/ToolCallGroup.test.tsx` - 4 component tests for rendering/interaction
- `src/src/components/chat/tools/ToolChip.tsx` - Added defaultExpanded prop for group integration
- `src/src/components/chat/view/AssistantMessage.tsx` - Replaced marker injection with groupToolCalls + React component rendering

## Decisions Made
- **Tools as React components after markdown**: Instead of injecting tool markers into markdown content and processing them through the rehype pipeline, tool calls now render as separate React components after the MarkdownRenderer. This is cleaner because historical tool calls are always appended after text content -- never inline.
- **div[role=button] for group header**: The "Expand all" button lives inside the group header. Using a `<button>` parent would create invalid HTML nesting. Using `div[role=button]` with keyboard handlers solves this.
- **defaultExpanded prop on ToolChip**: Rather than hacking ToolCallState with extra fields, added an optional `defaultExpanded` prop to ToolChip. Combined with key remounting (expandAllCounter), this cleanly implements "Expand all" without complex state management.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed button-in-button HTML nesting**
- **Found during:** Task 1 (ToolCallGroup component)
- **Issue:** "Expand all" button was nested inside the header `<button>`, causing React hydration warning
- **Fix:** Changed header from `<button>` to `<div role="button">` with keyboard handlers
- **Files modified:** src/src/components/chat/tools/ToolCallGroup.tsx
- **Verification:** React warning no longer appears in test output
- **Committed in:** 58849a8 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor fix for valid HTML. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- ToolCallGroup ready for streaming integration (Plan 02)
- groupToolCalls() can be called reactively in ActiveMessage's render body
- ToolChip defaultExpanded prop available for streaming group defaults

---
*Phase: 17-tool-grouping-permissions*
*Completed: 2026-03-08*
