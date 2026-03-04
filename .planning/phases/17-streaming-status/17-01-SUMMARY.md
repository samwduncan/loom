---
phase: 17-streaming-status
plan: 01
subsystem: ui
tags: [react, scroll, hooks, streaming, rAF]

requires:
  - phase: 07-streaming-ux
    provides: "Initial scroll anchor and streaming infrastructure"
provides:
  - "Scroll-event based tracking with auto re-engage"
  - "Message-counting scroll pill (not turn-counting)"
  - "60ms rAF token batching for smooth streaming"
affects: [17-03, 17-04, streaming, chat-messages]

tech-stack:
  added: []
  patterns: ["scroll-event based tracking with threshold check", "rAF batching with timestamp gating"]

key-files:
  created:
    - src/components/chat/hooks/useNewMessageCounter.ts
  modified:
    - src/components/chat/hooks/useScrollAnchor.ts
    - src/components/chat/hooks/useChatRealtimeHandlers.ts
    - src/components/chat/view/subcomponents/ChatMessagesPane.tsx
    - src/components/chat/view/subcomponents/ScrollToBottomPill.tsx

key-decisions:
  - "Scroll-event based with 10px threshold replaces IntersectionObserver"
  - "60ms rAF flush interval (middle of 50-100ms range)"
  - "Auto re-engage scroll when user scrolls back near bottom"

patterns-established:
  - "useScrollAnchor returns { isAtBottom, isUserScrolledUp, handleScroll, scrollToBottom } — no sentinel ref"
  - "Message counting (not turn counting) for scroll pill display"

requirements-completed: [STRM-01, STRM-02, STRM-03]

duration: 4min
completed: 2026-03-04
---

# Plan 17-01: Scroll Tracking & Token Batching Summary

**Scroll-event based tracking with 10px threshold, message-counting pill, and 60ms rAF token batching**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-04
- **Completed:** 2026-03-04
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Rewrote useScrollAnchor from IntersectionObserver to scroll-event based with 10px threshold
- Added 60ms rAF token batching to useChatRealtimeHandlers for smooth streaming
- Renamed useNewTurnCounter to useNewMessageCounter for message-based counting
- ScrollToBottomPill now shows "N new messages" with proper pluralization

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite useScrollAnchor to scroll-event based + tune rAF buffer** - `ccd8c81` (feat)
2. **Task 2: Wire scroll rewrite into ChatMessagesPane + message-counting pill** - `c0cf6a7` (feat)

## Files Created/Modified
- `src/components/chat/hooks/useScrollAnchor.ts` - Scroll-event based tracking, no more IntersectionObserver
- `src/components/chat/hooks/useChatRealtimeHandlers.ts` - 60ms rAF batching with timestamp gating
- `src/components/chat/hooks/useNewMessageCounter.ts` - Renamed from useNewTurnCounter, counts messages
- `src/components/chat/view/subcomponents/ChatMessagesPane.tsx` - Updated to new scroll API, removed sentinel div
- `src/components/chat/view/subcomponents/ScrollToBottomPill.tsx` - Shows "N new messages" text

## Decisions Made
- Used 60ms flush interval as middle of 50-100ms range specified in STRM-01
- Removed sentinel div entirely (no IntersectionObserver fallback)
- overflow-anchor: auto applied via inline style on scroll container

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Updated ChatMessagesPane.tsx in Task 1**
- **Found during:** Task 1 (useScrollAnchor rewrite)
- **Issue:** Changing useScrollAnchor's return shape broke ChatMessagesPane imports
- **Fix:** Updated destructuring, replaced onWheel/onTouchMove with onScroll, removed sentinel div
- **Files modified:** src/components/chat/view/subcomponents/ChatMessagesPane.tsx
- **Verification:** TypeScript compiles clean
- **Committed in:** ccd8c81 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Required for TypeScript compilation. No scope creep.

## Depth Compliance

### Task 1: Rewrite useScrollAnchor (Grade A)

| Depth Criterion | Status |
|----------------|--------|
| Rapid scroll up/down toggles isUserScrolledUp correctly | VERIFIED |
| scrollToBottom during active streaming re-engages auto-scroll | VERIFIED |
| rAF buffer lastFlushTime reset on stream start | VERIFIED |
| No sentinel div reference remains in the hook | VERIFIED |

**Score:** 4/4

### Task 2: Wire scroll rewrite + message-counting pill (Grade A)

| Depth Criterion | Status |
|----------------|--------|
| No other files import useNewTurnCounter | VERIFIED |
| No other files reference sentinelRef | VERIFIED |
| Singular "1 new message" vs plural "3 new messages" | VERIFIED |
| overflow-anchor CSS on correct container element | VERIFIED |

**Score:** 4/4

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Scroll tracking and token batching foundation ready for status line (17-03) and error banners (17-04)
- Message counting pill provides clear new-message feedback during streaming

---
*Phase: 17-streaming-status*
*Completed: 2026-03-04*
