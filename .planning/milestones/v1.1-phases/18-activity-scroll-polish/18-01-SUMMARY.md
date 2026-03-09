---
phase: 18-activity-scroll-polish
plan: 01
subsystem: ui
tags: [react, zustand, css-animations, streaming, design-tokens]

# Dependency graph
requires:
  - phase: 17-tool-grouping-permissions
    provides: ActiveMessage streaming architecture, ThinkingDisclosure component
provides:
  - StatusLine component for activity text display
  - StreamingCursor React component with primary/muted variants
  - Debounced activity text in websocket-init
affects: [19-session-sidebar-settings]

# Tech tracking
tech-stack:
  added: []
  patterns: [CSS class for transitions instead of inline styles per Constitution 7.14]

key-files:
  created:
    - src/src/components/chat/view/StatusLine.tsx
    - src/src/components/chat/view/StreamingCursor.tsx
    - src/src/components/chat/styles/status-line.css
  modified:
    - src/src/components/chat/view/ChatView.tsx
    - src/src/components/chat/view/ActiveMessage.tsx
    - src/src/components/chat/view/ThinkingDisclosure.tsx
    - src/src/components/chat/styles/streaming-cursor.css
    - src/src/lib/websocket-init.ts

key-decisions:
  - "CSS class for StatusLine transition (Constitution 7.14 bans inline styles)"
  - "Smooth pulse animation (0.4-1.0 opacity) replaces hard blink (step-end)"
  - "StreamingCursor shown inline within incomplete thinking block paragraphs"

patterns-established:
  - "StatusLine pattern: outside scroll container, opacity fade via CSS class"
  - "Module-scoped debounce timer for store updates (websocket-init)"

requirements-completed: [ACT-01, ACT-02, ACT-03, ACT-04, POL-02, POL-03, POL-04]

# Metrics
duration: 3min
completed: 2026-03-08
---

# Phase 18 Plan 01: Activity Status Line + Streaming Cursor Summary

**StatusLine component with 200ms debounced activity text, StreamingCursor React component with smooth pulse and primary/muted variants**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-08T21:59:27Z
- **Completed:** 2026-03-08T22:02:52Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- StatusLine renders activity text from stream store with opacity fade, positioned outside scroll container
- StreamingCursor is a reusable React component with primary (accent) and muted (thinking) variants
- Activity text debounced to 200ms at websocket-init module scope, timer cleared on stream end
- Cursor animation upgraded from hard step-end blink to smooth ease-in-out pulse

## Task Commits

Each task was committed atomically:

1. **Task 1: StatusLine component + ChatView grid integration + activity debounce** - `0d450f6` (feat)
2. **Task 2: StreamingCursor React component + ActiveMessage/ThinkingDisclosure integration** - `598e85e` (feat)

## Files Created/Modified
- `src/src/components/chat/view/StatusLine.tsx` - Activity status line with opacity fade
- `src/src/components/chat/view/StreamingCursor.tsx` - Reusable cursor with variant prop
- `src/src/components/chat/styles/status-line.css` - Transition using design tokens
- `src/src/components/chat/styles/streaming-cursor.css` - Pulse animation + muted variant
- `src/src/components/chat/view/ChatView.tsx` - 4-row grid with StatusLine slot
- `src/src/components/chat/view/ActiveMessage.tsx` - Uses StreamingCursor component
- `src/src/components/chat/view/ThinkingDisclosure.tsx` - Muted cursor in active thinking
- `src/src/lib/websocket-init.ts` - 200ms debounce + timer cleanup on stream end

## Decisions Made
- Used CSS class (.status-line) for opacity transition instead of inline style — Constitution 7.14 bans inline styles, ESLint enforces it
- Smooth pulse animation (opacity 0.4-1.0, ease-in-out) replaces hard blink (step-end) per POL-02
- StreamingCursor rendered inline within incomplete thinking block paragraphs (not after the block container) for natural cursor placement

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Inline style banned by ESLint**
- **Found during:** Task 1 (StatusLine component)
- **Issue:** Plan specified `style={{ transitionDuration: 'var(--duration-normal)' }}` but Constitution ESLint rule `loom/no-banned-inline-style` rejects inline styles
- **Fix:** Created `status-line.css` with `.status-line` class using `transition: opacity var(--duration-normal) var(--ease-out)`
- **Files modified:** StatusLine.tsx, status-line.css
- **Verification:** ESLint passes, commit hook passes
- **Committed in:** 0d450f6

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary fix for ESLint compliance. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- StatusLine and StreamingCursor ready for integration testing with live backend
- Chat view grid supports additional rows if needed
- Activity debounce pattern reusable for other high-frequency store updates

---
*Phase: 18-activity-scroll-polish*
*Completed: 2026-03-08*
