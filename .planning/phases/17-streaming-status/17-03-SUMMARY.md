---
phase: 17-streaming-status
plan: 03
subsystem: ui
tags: [react, hooks, streaming, status-line, composer, activity-text]

requires:
  - phase: 17-streaming-status
    provides: "Scroll tracking and aurora indicators from plans 01-02"
provides:
  - "Always-visible status line below composer"
  - "Semantic activity text from tool events"
  - "Send/stop button CSS crossfade morph"
  - "Consolidated token/cost display in status line"
affects: [17-04, streaming, chat-composer, status]

tech-stack:
  added: []
  patterns: ["persistent status line with idle/streaming states", "CSS crossfade morph for button state changes", "semantic tool activity parsing"]

key-files:
  created:
    - src/components/chat/hooks/useActivityStatus.ts
    - src/components/chat/view/subcomponents/StatusLine.tsx
  modified:
    - src/components/chat/view/subcomponents/ChatComposer.tsx
    - src/components/chat/view/subcomponents/ChatInputControls.tsx
    - src/components/chat/view/subcomponents/ClaudeStatus.tsx
    - src/components/chat/view/ChatInterface.tsx

key-decisions:
  - "Status line is persistent — never unmounts, content changes between idle and streaming"
  - "Send/stop button uses CSS crossfade with absolute-positioned icon layers"
  - "Stop button uses bg-destructive (red), not rose"
  - "Activity text parses real tool names: Read → 'Reading file.ts...', Grep → 'Searching for pattern...'"

patterns-established:
  - "StatusLine component below composer for persistent session dashboard"
  - "useActivityStatus hook for semantic tool activity parsing"
  - "Centered dot separator between status info items"

requirements-completed: [STRM-08, STRM-09, STRM-10, STRM-11, STRM-12]

duration: 5min
completed: 2026-03-04
---

# Plan 17-03: Status Line & Send/Stop Morph Summary

**Always-visible status line below composer with semantic activity text, send/stop crossfade morph, and consolidated token display**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-04
- **Completed:** 2026-03-04
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Created useActivityStatus hook that parses real tool names into semantic activity text
- Built persistent StatusLine component below composer (idle: provider/model/cost, streaming: activity/elapsed/tokens)
- Implemented send/stop button CSS crossfade morph with destructive red stop state
- Moved TokenUsagePie from ChatInputControls to StatusLine
- Removed old ClaudeStatus full-width bar

## Task Commits

Each task was committed atomically:

1. **Task 1: Create useActivityStatus hook + StatusLine component** - `e0ec383` (feat)
2. **Task 2: Send/stop morph + wire StatusLine + remove ClaudeStatus** - `776d890` (feat)

## Files Created/Modified
- `src/components/chat/hooks/useActivityStatus.ts` - Semantic activity text parser with elapsed timer
- `src/components/chat/view/subcomponents/StatusLine.tsx` - Persistent status line with idle/streaming states
- `src/components/chat/view/subcomponents/ChatComposer.tsx` - Send/stop crossfade morph, StatusLine wiring
- `src/components/chat/view/subcomponents/ChatInputControls.tsx` - Removed token/cost display (moved to StatusLine)
- `src/components/chat/view/subcomponents/ClaudeStatus.tsx` - Emptied/replaced with noop
- `src/components/chat/view/ChatInterface.tsx` - Updated props threading for StatusLine

## Decisions Made
- Activity text handles 7 known tool names with semantic descriptions
- Stop button in both status line and composer button for two stop affordances
- Centered dot (·) separator between status info items

## Deviations from Plan
None - plan executed exactly as written

## Depth Compliance

### Task 1: Create useActivityStatus hook + StatusLine (Grade A)

| Depth Criterion | Status |
|----------------|--------|
| Idle handles null sessionCost gracefully | VERIFIED |
| Streaming shows activity/elapsed/tokens/esc hint | VERIFIED |
| Stop button shared onAbort callback | VERIFIED |
| Timer cleanup on unmount | VERIFIED |
| TokenUsagePie moved from ChatInputControls | VERIFIED |
| parseActivityText handles undefined gracefully | VERIFIED |

**Score:** 6/6

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Status line and send/stop morph provide the activity dashboard foundation
- Error banners (17-04) can now build on the streaming state infrastructure

---
*Phase: 17-streaming-status*
*Completed: 2026-03-04*
