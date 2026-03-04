---
phase: 17-streaming-status
plan: 04
subsystem: ui
tags: [react, error-handling, animation, tool-cards, css]

requires:
  - phase: 17-streaming-status
    provides: "Status line and streaming infrastructure from plans 01-03"
  - phase: 15
    provides: "ToolActionCard with pill styling and state-driven borders"
provides:
  - "Persistent inline error banners for process crashes and exit codes"
  - "Pulsing border glow on active tool cards during streaming"
affects: [error-handling, streaming, tool-display]

tech-stack:
  added: []
  patterns: ["inline error banners with muted destructive styling", "CSS-only pulsing box-shadow for active state"]

key-files:
  created:
    - src/components/chat/view/subcomponents/ErrorBanner.tsx
  modified:
    - src/components/chat/view/subcomponents/ChatMessagesPane.tsx
    - src/components/chat/view/subcomponents/ToolActionCard.tsx
    - src/index.css

key-decisions:
  - "Error banners use muted destructive (10% bg, 2px left border) — not screaming red"
  - "Tool card glow uses box-shadow not border to avoid layout shift"
  - "dismissedErrorsRef Set tracks dismissed errors to prevent reappearance"
  - "Error detection scans last 5 messages for error types and non-zero exit codes"

patterns-established:
  - "Inline error banners inside scroll container for persistent conversation-level errors"
  - "CSS-only pulsing box-shadow animation for active/running states"

requirements-completed: []

duration: 2min
completed: 2026-03-04
---

# Plan 17-04: Error Banners & Tool Card Glow Summary

**Persistent inline error banners with muted red styling and CSS-only pulsing border glow on active tool cards**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-04
- **Completed:** 2026-03-04
- **Tasks:** 1
- **Files modified:** 4

## Accomplishments
- Created ErrorBanner component with muted destructive styling (10% bg, 2px left border)
- Integrated error detection in ChatMessagesPane scanning for crashes and exit codes
- Added pulsing box-shadow glow to ToolActionCard during running state
- Entry animation with subtle opacity + translateY transition

## Task Commits

Each task was committed atomically:

1. **Task 1: Create ErrorBanner + integrate + tool card glow** - `e2dace1` (feat)

## Files Created/Modified
- `src/components/chat/view/subcomponents/ErrorBanner.tsx` - Inline error banner with dismiss functionality
- `src/components/chat/view/subcomponents/ChatMessagesPane.tsx` - Error detection and banner placement
- `src/components/chat/view/subcomponents/ToolActionCard.tsx` - Pulsing border glow for running state
- `src/index.css` - CSS keyframes for tool card pulse animation

## Decisions Made
- Used dismissedErrorsRef Set to track dismissed errors without triggering re-renders
- Error detection scans last 5 messages for both error message types and Bash non-zero exit codes
- Box-shadow animation oscillates primary color opacity 0.15-0.4 over 1.5s

## Deviations from Plan
None - plan executed exactly as written

## Depth Compliance

### Task 1: ErrorBanner + ChatMessagesPane + tool card glow (Grade S)

| Depth Criterion | Status |
|----------------|--------|
| Entry animation subtle (200ms opacity + translateY) | VERIFIED |
| Red accent muted (10% bg, 2px left border) | VERIFIED |
| Text foreground color for readability | VERIFIED |
| Dismiss prevents reappearance for same error | VERIFIED |
| Tool card glow uses box-shadow not border | VERIFIED |
| Tool card glow CSS-only, compositor thread | VERIFIED |
| Error detection handles exit codes and crashes | VERIFIED |

**Score:** 7/7

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All streaming & status phase components complete
- Ready for phase verification

---
*Phase: 17-streaming-status*
*Completed: 2026-03-04*
