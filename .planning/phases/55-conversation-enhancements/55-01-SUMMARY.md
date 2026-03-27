---
phase: 55-conversation-enhancements
plan: 01
subsystem: ui
tags: [react, chat, follow-up-pills, empty-state, templates, heuristics]

# Dependency graph
requires:
  - phase: 09-chat-view
    provides: ChatView grid layout, ChatEmptyState component, suggestion click handler
provides:
  - FollowUpPills component with client-side content heuristics
  - Categorized ChatEmptyState with 3 template groups (Code, Create, Learn)
  - Follow-up suggestion wiring into ChatView grid
affects: [conversation-enhancements, chat-view]

# Tech tracking
tech-stack:
  added: []
  patterns: [client-side content heuristic for contextual suggestions, categorized template chips]

key-files:
  created:
    - src/src/components/chat/view/FollowUpPills.tsx
    - src/src/components/chat/view/follow-up-pills.css
  modified:
    - src/src/components/chat/view/ChatEmptyState.tsx
    - src/src/components/chat/view/ChatView.tsx

key-decisions:
  - "Client-side heuristics for follow-up suggestions (regex content matching, no backend endpoint)"
  - "4 suggestion categories: code blocks, error words, lists/steps, default fallback"

patterns-established:
  - "Content heuristic pattern: regex-based category matching on assistant message content"
  - "Categorized template grid: label + chip group with responsive stacking"

requirements-completed: [CONV-01, CONV-02]

# Metrics
duration: 3min
completed: 2026-03-27
---

# Phase 55 Plan 01: Follow-up Pills & Enhanced Templates Summary

**Client-side follow-up suggestion pills with content heuristics (code/error/list/default) and categorized empty-state templates in 3 groups (Code, Create, Learn)**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-27T01:12:40Z
- **Completed:** 2026-03-27T01:15:14Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- FollowUpPills component that derives 2-3 contextual suggestions based on assistant message content (code blocks, errors, lists, or default)
- ChatEmptyState enhanced from flat 4-chip array to 3 categorized template groups with 12 total chips
- Follow-up pills wired into ChatView grid between LiveSessionBanner and StatusLine, using existing handleSuggestionClick callback

## Task Commits

Each task was committed atomically:

1. **Task 1: Follow-up pills and enhanced empty state templates** - `c1d5dc8` (feat)
2. **Task 2: Wire follow-up pills into ChatView** - `b8db49a` (feat)

## Files Created/Modified
- `src/src/components/chat/view/FollowUpPills.tsx` - Follow-up suggestion pills with content heuristic engine
- `src/src/components/chat/view/follow-up-pills.css` - Horizontal scroll mobile, flex-wrap desktop layout
- `src/src/components/chat/view/ChatEmptyState.tsx` - Categorized template chips (Code, Create, Learn)
- `src/src/components/chat/view/ChatView.tsx` - Import FollowUpPills, derive lastAssistantMessage, read isStreaming, render in grid

## Decisions Made
- Client-side regex heuristics for follow-up suggestions instead of backend endpoint (per deferred decision in plan)
- 4 heuristic categories with priority: code blocks > error words > lists > default
- Grid-rows template extended with one more auto row for pills slot

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Follow-up pills and templates ready for visual verification
- Plan 55-02 can proceed independently

---
*Phase: 55-conversation-enhancements*
*Completed: 2026-03-27*
