---
phase: 64-scroll-performance
plan: 01
subsystem: ui
tags: [react, intersectionobserver, resizeobserver, scroll, hooks, ios, capacitor]

# Dependency graph
requires: []
provides:
  - "useChatScroll hook: IO sentinel atBottom detection, ResizeObserver auto-follow, debounced pill state"
  - "MessageList refactored to consume useChatScroll (zero inline scroll logic)"
  - "Dead useScrollAnchor.ts deleted with no orphaned imports"
affects: [scroll-performance, chat-view, proof-of-life]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Ref-based scroll state with debounced React updates (200ms) for pill visibility"
    - "IO sentinel with rootMargin for atBottom detection (no DOM reads in scroll path)"
    - "ResizeObserver + rAF throttle guard for streaming auto-follow"
    - "Direct scrollTop assignment instead of scrollIntoView"

key-files:
  created:
    - src/src/hooks/useChatScroll.ts
    - src/src/hooks/useChatScroll.test.ts
  modified:
    - src/src/components/chat/view/MessageList.tsx
    - src/src/components/chat/view/MessageList.test.tsx
    - src/src/components/dev/ProofOfLife.tsx
    - src/src/components/dev/ProofOfLife.test.tsx

key-decisions:
  - "Single IO threshold at -150px instead of dual 200px/100px hysteresis -- debounce absorbs flicker"
  - "isAutoScrollingRef initialized from isStreaming prop to handle mount-with-active-stream case"
  - "Sentinel placed outside content wrapper (after it in DOM) for correct IO viewport detection"

patterns-established:
  - "useChatScroll hook pattern: IO sentinel + ResizeObserver + ref-based state + debounced React updates"
  - "loadMoreSentinelRef naming convention to distinguish from atBottom sentinel"
  - "contentWrapperRef wired to inner content div for ResizeObserver observation"

requirements-completed: [SCROLL-01, SCROLL-02, SCROLL-03, SCROLL-06]

# Metrics
duration: 9min
completed: 2026-03-28
---

# Phase 64 Plan 01: useChatScroll Hook Summary

**IO sentinel + ResizeObserver scroll hook replacing 120 lines of inline scroll jank in MessageList, with ref-based state (zero setState in scroll path), debounced pill updates, and dead useScrollAnchor deletion**

## Performance

- **Duration:** 9 min
- **Started:** 2026-03-28T20:31:48Z
- **Completed:** 2026-03-28T20:40:27Z
- **Tasks:** 2 (Task 1 TDD: RED + GREEN)
- **Files modified:** 8 (2 created, 4 modified, 2 deleted)

## Accomplishments
- Created useChatScroll hook with IntersectionObserver sentinel for atBottom detection (ref-based, no React state in scroll path), ResizeObserver for streaming auto-follow (rAF-throttled scrollTop assignment), debounced pill state (200ms), user gesture detection, stream re-engagement, session switch reset, unread tracking, scroll position save/restore via sessionStorage, and iOS statusTap support
- Refactored MessageList.tsx to consume the hook -- removed ~120 lines of inline scroll logic (handleScroll callback, auto-follow useEffect, scroll listener attachment, scrollToBottom callback, scroll save/restore effects, atBottom/unreadCount useState)
- Deleted useScrollAnchor.ts and useScrollAnchor.test.ts with zero orphaned imports across the codebase

## Task Commits

Each task was committed atomically:

1. **Task 1 (TDD RED): Failing tests for useChatScroll** - `8a96093` (test)
2. **Task 1 (TDD GREEN): useChatScroll hook implementation** - `6863a68` (feat)
3. **Task 2: Integrate into MessageList, delete useScrollAnchor** - `30c715a` (feat)

_TDD task had separate RED and GREEN commits._

## Files Created/Modified
- `src/src/hooks/useChatScroll.ts` - New scroll hook with IO sentinel, ResizeObserver, ref-based state
- `src/src/hooks/useChatScroll.test.ts` - 17 unit tests covering all behaviors
- `src/src/components/chat/view/MessageList.tsx` - Refactored to consume useChatScroll, removed inline scroll logic
- `src/src/components/chat/view/MessageList.test.tsx` - Added IO/RO/rAF mocks for useChatScroll
- `src/src/components/dev/ProofOfLife.tsx` - Updated to use useChatScroll with contentWrapperRef
- `src/src/components/dev/ProofOfLife.test.tsx` - Updated mocks for useChatScroll
- `src/src/hooks/useScrollAnchor.ts` - DELETED (dead code)
- `src/src/hooks/useScrollAnchor.test.ts` - DELETED (dead code tests)

## Decisions Made
- Used single IO threshold at -150px rootMargin instead of dual 200px/100px hysteresis from D-05. The 200ms debounce on schedulePillUpdate() absorbs rapid sentinel enter/exit cycles, making dual thresholds unnecessary. 150px is a middle ground.
- Initialized isAutoScrollingRef from the isStreaming prop value rather than false, to handle the case where the hook mounts while streaming is already active (avoids missing the false->true transition detection).
- Placed the sentinel div outside the contentWrapperRef div (as a sibling after it in the scroll container) so IntersectionObserver correctly detects when the sentinel exits the viewport during scroll.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed isAutoScrollingRef initialization for mount-during-streaming**
- **Found during:** Task 1 (TDD GREEN phase)
- **Issue:** Anti-oscillation guard test failed because isAutoScrollingRef was initialized to false. When hook mounts with streaming=true, the false->true transition is never detected, so auto-scrolling never engages.
- **Fix:** Initialize isAutoScrollingRef from the isStreaming prop: `useRef(isStreaming)` instead of `useRef(false)`
- **Files modified:** src/src/hooks/useChatScroll.ts
- **Verification:** Anti-oscillation test passes
- **Committed in:** 6863a68 (Task 1 GREEN commit)

**2. [Rule 3 - Blocking] Added IO/RO/rAF mocks to MessageList.test.tsx**
- **Found during:** Task 2 (full test suite run)
- **Issue:** MessageList tests crashed with "IntersectionObserver is not defined" because useChatScroll (now consumed by MessageList) uses browser APIs not available in jsdom
- **Fix:** Added IntersectionObserver, ResizeObserver, and requestAnimationFrame mocks to MessageList.test.tsx
- **Files modified:** src/src/components/chat/view/MessageList.test.tsx
- **Verification:** All 4 MessageList tests pass
- **Committed in:** 30c715a (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking)
**Impact on plan:** Both fixes necessary for correctness. No scope creep.

## Issues Encountered
- vi.useFakeTimers() overrides requestAnimationFrame by default, conflicting with custom rAF mock in useChatScroll tests. Fixed by specifying exact timers to fake: `vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'] })`.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- useChatScroll hook ready for Plan 02 (secondary scroll jank fixes: useAutoResize, ActiveMessage finalization, overscroll-behavior)
- Plan 03 (validation on real device) can proceed after Plan 02
- contentWrapperRef pattern established for ResizeObserver observation in any scroll container

---
*Phase: 64-scroll-performance*
*Completed: 2026-03-28*

## Self-Check: PASSED

- All 5 created/modified files exist
- Both deleted files confirmed absent
- All 3 commit hashes found in git log
