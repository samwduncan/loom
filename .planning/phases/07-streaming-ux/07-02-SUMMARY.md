---
phase: 07-streaming-ux
plan: 02
subsystem: ui
tags: [react, hooks, intersection-observer, scroll, state-management]

requires:
  - phase: 05-chat-message-architecture
    provides: Chat message rendering pipeline, useChatSessionState scroll infrastructure
provides:
  - IntersectionObserver-based scroll tracking hook (useScrollAnchor)
  - Turn counter hook for scroll pill badge (useNewTurnCounter)
  - overflow-anchor CSS on scroll container
affects: [07-streaming-ux]

tech-stack:
  added: []
  patterns: [IntersectionObserver sentinel pattern, synchronous ref mirrors for event handlers, state-driven callback refs]

key-files:
  created:
    - src/components/chat/hooks/useScrollAnchor.ts
    - src/components/chat/hooks/useNewTurnCounter.ts
  modified:
    - src/components/chat/hooks/useChatSessionState.ts

key-decisions:
  - "State-driven callback ref pattern for sentinel so IntersectionObserver re-runs when DOM node attaches"
  - "Synchronous isAtBottomRef mirror prevents stale reads in wheel/touch handlers"
  - "100px rootMargin tolerance for near-bottom detection"

patterns-established:
  - "IntersectionObserver sentinel pattern for scroll detection (replaces onScroll handlers)"
  - "Synchronous ref mirrors for React state used in event handlers"

requirements-completed: [STRM-02]

duration: 3min
completed: 2026-03-02
---

# Plan 07-02: Scroll Tracking Hooks Summary

**IntersectionObserver-based scroll anchor with zero scroll-event overhead and turn delta counter for scroll pill**

## Performance

- **Duration:** ~3 min
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Created useScrollAnchor hook with IntersectionObserver sentinel replacing onScroll-based detection
- Created useNewTurnCounter hook tracking new assistant turns since user scrolled away
- Applied overflow-anchor: auto CSS on scroll container for browser-native scroll stability

## Task Commits

Each task was committed atomically:

1. **Task 1: Create useScrollAnchor hook with IntersectionObserver sentinel** - `8595c7a` (feat)
2. **Task 2: Create useNewTurnCounter hook and update useChatSessionState** - `8a01762` (feat)

## Files Created/Modified
- `src/components/chat/hooks/useScrollAnchor.ts` - IntersectionObserver-based scroll tracking with sentinelRef, isAtBottom, isUserScrolledUp, handleUserScroll, scrollToBottom
- `src/components/chat/hooks/useNewTurnCounter.ts` - Turn delta tracking with snapshot/reset logic
- `src/components/chat/hooks/useChatSessionState.ts` - overflow-anchor: auto applied on scroll container mount

## Decisions Made
- Used state-driven callback ref (`setSentinelNode`) instead of plain useRef so IntersectionObserver effect re-runs when sentinel DOM attaches
- No changes to ChatMessagesPane or ChatInterface — wiring deferred to Plan 07-03

## Deviations from Plan
None - plan executed exactly as written

## Depth Compliance

### Task 1: Create useScrollAnchor hook (Grade B)

| Depth Criterion | Status |
|----------------|--------|
| isAtBottomRef synchronous mirror prevents stale reads | VERIFIED |
| rootMargin: '100px' tolerance zone | VERIFIED |
| Smooth scroll behavior for scrollToBottom | VERIFIED |
| Observer cleanup on unmount | VERIFIED |
| No debounce on handleUserScroll | VERIFIED |

**Score:** 5/5

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- useScrollAnchor and useNewTurnCounter ready for consumption by ChatMessagesPane (Plan 07-03)
- Existing useChatSessionState scroll exports unchanged — Plan 07-03 will refactor the wiring
- overflow-anchor already applied for scroll stability

---
*Phase: 07-streaming-ux*
*Completed: 2026-03-02*
