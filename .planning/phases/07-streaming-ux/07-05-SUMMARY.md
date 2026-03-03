---
phase: 07-streaming-ux
plan: 05
subsystem: ui
tags: [react, websocket, connection-status, reconnect, skeleton, aurora]

requires:
  - phase: 07-streaming-ux
    provides: aurora-shimmer.css, ChatMessagesPane with scroll anchor from plans 07-01 through 07-04
provides:
  - ReconnectSkeletons component with aurora aura fade-in placeholders
  - ConnectionStatusDot component (green/amber/red)
  - WebSocketContext connectionState tracking (connected/reconnecting/disconnected)
  - ConnectionStatusDot wired into header bar
  - ReconnectSkeletons wired into ChatMessagesPane
affects: [07-streaming-ux]

tech-stack:
  added: []
  patterns: [ConnectionState enum in WebSocket context, wasConnectedRef for reconnect detection]

key-files:
  created:
    - src/components/chat/view/subcomponents/ReconnectSkeletons.tsx
    - src/components/chat/view/subcomponents/ConnectionStatusDot.tsx
  modified:
    - src/contexts/WebSocketContext.tsx
    - src/components/chat/view/ChatInterface.tsx
    - src/components/chat/view/subcomponents/ChatMessagesPane.tsx

key-decisions:
  - "Replaced skeleton paragraph lines with soft pulsing aurora aura glow bar per user feedback"
  - "Visual polish and scroll integration bugs deferred to UI overhaul phases"

patterns-established:
  - "Aurora aura pattern: two-layer glow (blurred + core) with breathing pulse"

requirements-completed: [STRM-05, STRM-06]

duration: 5min
completed: 2026-03-03
---

# Plan 07-05: Reconnect Skeletons + Connection Status Summary

**Reconnect aurora aura placeholders, connection status dot, and WebSocket state tracking — visual polish deferred to UI overhaul**

## Performance

- **Duration:** ~5 min
- **Tasks:** 3 (2 auto + 1 checkpoint)
- **Files modified:** 5 (+3 redesigned post-checkpoint)

## Accomplishments
- Built ReconnectSkeletons with aurora aura glow bar placeholders (redesigned from skeleton lines per user feedback)
- Built ConnectionStatusDot with green/amber/red states and pulse animation for reconnecting
- Updated WebSocketContext with connectionState (connected/reconnecting/disconnected) and wasConnectedRef
- Wired ConnectionStatusDot into header bar and ReconnectSkeletons into ChatMessagesPane
- Visual checkpoint: user approved with known scroll/glitch issues deferred to UI overhaul phases

## Task Commits

1. **Task 1: Build ReconnectSkeletons, ConnectionStatusDot, update WebSocketContext** - `8863ef4` (feat)
2. **Task 2: Wire ConnectionStatusDot into header, ReconnectSkeletons into ChatMessagesPane** - `533f074` (feat)
3. **Task 3: Visual verification** - Checkpoint approved with deferred issues
4. **Post-checkpoint: Replace skeleton lines with aurora aura** - `f9cbf85` (fix)

## Files Created/Modified
- `src/components/chat/view/subcomponents/ReconnectSkeletons.tsx` - Aurora aura glow bar placeholders with fade-out
- `src/components/chat/view/subcomponents/ConnectionStatusDot.tsx` - Colored dot with pulse for reconnecting state
- `src/contexts/WebSocketContext.tsx` - Added ConnectionState type and connectionState to context
- `src/components/chat/view/ChatInterface.tsx` - ConnectionStatusDot in header
- `src/components/chat/view/subcomponents/ChatMessagesPane.tsx` - ReconnectSkeletons during reconnect loading
- `src/components/chat/styles/aurora-shimmer.css` - Added .aurora-aura and .aurora-aura-core classes
- `src/components/chat/view/subcomponents/PreTokenIndicator.tsx` - Redesigned to use aurora aura

## Decisions Made
- Replaced skeleton paragraph lines with soft pulsing aurora aura glow bar per user feedback
- Visual polish bugs (scrolling glitchiness, integration issues) deferred to upcoming UI overhaul design phases

## Deviations from Plan
- PreTokenIndicator and ReconnectSkeletons redesigned from skeleton lines to aurora aura glow bars based on user feedback during checkpoint

## Depth Compliance

### Task 1: Build ReconnectSkeletons, ConnectionStatusDot, WebSocketContext (Grade A)

| Depth Criterion | Status |
|----------------|--------|
| ConnectionState distinguishes never-connected from reconnecting | VERIFIED |
| wasConnectedRef tracks initial connection | VERIFIED |
| ConnectionStatusDot uses consistent color constants | VERIFIED |
| Reconnecting shows pulse animation | VERIFIED |
| Fade-out (200ms) distinct from PreTokenIndicator collapse (300ms) | VERIFIED |
| Skeleton widths vary for message-like appearance | N/A (redesigned to aura) |

**Score:** 5/6 (1 N/A due to redesign)

## Issues Encountered
- User feedback: skeleton paragraph lines not desired, wanted Gemini-style soft pulsing aurora glow instead — redesigned accordingly
- Visual glitchiness and scroll integration bugs observed — deferred to UI overhaul phases

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All Phase 7 streaming UX architecture in place
- Known visual polish items deferred to UI overhaul phases (1, 2, 4, 9)
- Core hooks, CSS system, and component structure ready for integration

---
*Phase: 07-streaming-ux*
*Completed: 2026-03-03*
