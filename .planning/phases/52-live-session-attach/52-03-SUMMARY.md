---
phase: 52-live-session-attach
plan: 03
subsystem: ui
tags: [websocket, zustand, react, chat-view, session-switch, banner, auto-attach]

# Dependency graph
requires:
  - phase: 52-live-session-attach
    provides: WebSocket types, multiplexer routing, stream store liveAttachedSessions, sidebar live indicator
provides:
  - LiveSessionBanner component with "Watching live session" text and Detach button
  - ChatView auto-attach on navigate to recently-active session
  - ChatView auto-detach on navigate away via useEffect cleanup
  - useSessionSwitch auto-detach of all live sessions before switching
affects: [future live session enhancements, permission flow for attached sessions]

# Tech tracking
tech-stack:
  added: []
  patterns: [didAttachRef-tracking, selector-only-store-access-in-components]

key-files:
  created: [src/src/components/chat/view/LiveSessionBanner.tsx]
  modified: [src/src/components/chat/view/ChatView.tsx, src/src/hooks/useSessionSwitch.ts]

key-decisions:
  - "didAttachRef pattern for cleanup: tracks whether auto-attach was sent so cleanup only detaches when necessary"
  - "Selector-only store access in ChatView (no getState) -- Constitution 4.5 compliance"
  - "Banner placed between messages and StatusLine for non-intrusive visibility"

patterns-established:
  - "Auto-attach lifecycle: attach on navigate-to (if recent), detach on navigate-away or session switch"
  - "Dual detach paths: ChatView cleanup for navigation, useSessionSwitch for explicit session changes"

requirements-completed: [LIVE-02, LIVE-04, LIVE-05]

# Metrics
duration: 4min
completed: 2026-03-27
---

# Phase 52 Plan 03: ChatView Live Session Integration Summary

**LiveSessionBanner with auto-attach/detach lifecycle in ChatView and useSessionSwitch for seamless live session watching UX**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-27T00:11:32Z
- **Completed:** 2026-03-27T00:15:55Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Created LiveSessionBanner component with Radio icon, green success-toned styling, and Detach button
- ChatView auto-sends attach-session WS message when navigating to a session active within the last 5 minutes
- ChatView auto-detaches on navigate away via useEffect cleanup with didAttachRef tracking
- useSessionSwitch detaches all live-attached sessions before switching, preventing orphaned backend file watchers

## Task Commits

Each task was committed atomically:

1. **Task 1: Create LiveSessionBanner and integrate into ChatView with auto-attach** - `762ab24` (feat)
2. **Task 2: Add auto-detach to useSessionSwitch** - `19b969c` (feat)

## Files Created/Modified
- `src/src/components/chat/view/LiveSessionBanner.tsx` - Banner UI with Radio icon, "Watching live session" text, Detach button, green success tones
- `src/src/components/chat/view/ChatView.tsx` - Auto-attach useEffect, LiveSessionBanner rendering, grid row update, live session state selectors
- `src/src/hooks/useSessionSwitch.ts` - Detach all live-attached sessions in switchSession flow (step 2.5)

## Decisions Made
- Used `didAttachRef` pattern instead of stale closure reads -- ref is written inside useEffect (not during render), satisfying React 19's refs rule while allowing cleanup to check whether we actually sent an attach
- All store access in ChatView uses selectors (Constitution 4.5) -- `isLiveAttached`, `detachLiveSession`, `sessionUpdatedAt` all via selector hooks, no getState() calls
- Banner placed between messages area and StatusLine in the CSS Grid layout, with an additional auto row added to grid-rows
- Green oklch tones (hue 145) consistent with sidebar live dot and status-success token

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed Constitution 4.5 violations (no getState in components)**
- **Found during:** Task 1 (pre-commit ESLint)
- **Issue:** Plan specified `useStreamStore.getState()` and `useTimelineStore.getState()` calls in ChatView.tsx, which violates ESLint rule `loom/no-external-store-mutation`
- **Fix:** Replaced all getState() calls with selector hooks (`useStreamStore((s) => ...)`, `useTimelineStore((s) => ...)`), used `didAttachRef` pattern for cleanup closure tracking
- **Files modified:** src/src/components/chat/view/ChatView.tsx, src/src/components/chat/view/LiveSessionBanner.tsx
- **Verification:** ESLint passes, TypeScript compiles clean
- **Committed in:** 762ab24 (Task 1 commit)

**2. [Rule 3 - Blocking] Fixed React 19 refs-during-render violation**
- **Found during:** Task 1 (pre-commit ESLint)
- **Issue:** Initial approach wrote `liveAttachedRef.current = isLiveAttached` during render, which React 19's `react-hooks/refs` rule rejects
- **Fix:** Switched to `didAttachRef` written only inside useEffect body, never during render
- **Files modified:** src/src/components/chat/view/ChatView.tsx
- **Verification:** ESLint passes
- **Committed in:** 762ab24 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both auto-fixes necessary for Constitution and React 19 compliance. No scope creep.

## Issues Encountered
None beyond the auto-fixed deviations above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 52 (Live Session Attach) is complete: backend watcher (Plan 01) + frontend data flow (Plan 02) + UI integration (Plan 03)
- Full end-to-end live session attach flow: navigate to active session, see green pulse in sidebar, "Watching live session" banner, real-time message updates, permission prompts via existing PermissionBanner, clean detach on navigate away or session switch
- Permission prompts from live sessions flow through existing multiplexer routing to PermissionBanner (no additional code needed)

---
*Phase: 52-live-session-attach*
*Completed: 2026-03-27*
