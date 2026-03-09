---
phase: 17-tool-grouping-permissions
plan: 02
subsystem: ui
tags: [react, streaming, tool-calls, grouping, useMemo]

# Dependency graph
requires:
  - phase: 17-tool-grouping-permissions
    provides: ToolCallGroup component, groupToolCalls algorithm (Plan 01)
provides:
  - Streaming tool grouping in ActiveMessage via ToolCallGroupFromStore
  - Render-time segment chunking with useMemo-derived renderChunks
affects: [17-03-permission-banners]

# Tech tracking
tech-stack:
  added: []
  patterns: [render-time-segment-chunking, streaming-tool-group-subscription]

key-files:
  created: []
  modified:
    - src/src/components/chat/view/ActiveMessage.tsx

key-decisions:
  - "Render-time segment chunking via useMemo instead of modifying segment model"
  - "ToolCallGroupFromStore subscribes to individual tool calls for granular updates"
  - "Streaming groups start expanded (defaultExpanded=true) for real-time visibility"

patterns-established:
  - "Render-time grouping: useMemo derives leadingText/toolSegs/trailingText from segments array"
  - "Atomic group appearance: single React commit when 2nd tool arrives via adjust-state-during-rendering"

requirements-completed: [TOOL-20, TOOL-21, TOOL-22, TOOL-23]

# Metrics
duration: 2min
completed: 2026-03-08
---

# Phase 17 Plan 02: Streaming Tool Grouping Summary

**Real-time tool grouping in ActiveMessage via useMemo render chunks and ToolCallGroupFromStore with atomic group appearance on 2nd tool arrival**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-08T17:59:03Z
- **Completed:** 2026-03-08T18:01:30Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- ToolCallGroupFromStore component subscribes to multiple tool calls from stream store, renders ToolCallGroup with error extraction
- useMemo-derived renderChunks splits segments into leadingText, toolSegs, trailingText for clean JSX rendering
- 2+ consecutive streaming tool calls atomically appear inside ToolCallGroup on 2nd tool arrival (no flicker)
- Single tool renders as ToolChipFromStore, seamlessly upgrades to group when 2nd arrives
- Streaming groups start expanded so users see real-time tool activity

## Task Commits

Each task was committed atomically:

1. **Task 1: Add streaming tool grouping to ActiveMessage** - `82fea4a` (feat)

## Files Created/Modified
- `src/src/components/chat/view/ActiveMessage.tsx` - Added ToolCallGroupFromStore component, useMemo renderChunks derivation, grouped JSX rendering for streaming tool calls

## Decisions Made
- **Render-time chunking over segment model changes**: Instead of modifying the Segment type or the adjust-state-during-rendering block, used a useMemo to derive render chunks from the existing segments array. This keeps the segment model and checkpoint logic untouched.
- **ToolCallGroupFromStore with per-ID subscription**: Each tool call ID is looked up individually in the stream store selector, providing granular re-renders when individual tool states change.
- **Streaming groups start expanded**: defaultExpanded=true on streaming ToolCallGroup so users can watch tool activity in real time (unlike historical groups which start collapsed).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Added ASSERT comments for non-null assertions**
- **Found during:** Task 1
- **Issue:** ESLint loom/no-non-null-without-reason rule requires ASSERT comments on non-null assertions
- **Fix:** Added descriptive ASSERT comments to two non-null assertions
- **Files modified:** src/src/components/chat/view/ActiveMessage.tsx
- **Verification:** ESLint passes clean
- **Committed in:** 82fea4a

---

**Total deviations:** 1 auto-fixed (1 lint compliance)
**Impact on plan:** Trivial lint fix. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Streaming tool grouping complete, ready for permission banners (Plan 03, already completed)
- ToolCallGroupFromStore available for any future streaming group needs

## Self-Check: PASSED

- [x] ActiveMessage.tsx exists and contains ToolCallGroupFromStore
- [x] Commit 82fea4a verified in git log

---
*Phase: 17-tool-grouping-permissions*
*Completed: 2026-03-08*
