---
phase: 18-activity-scroll-polish
plan: 02
subsystem: ui
tags: [scroll, intersection-observer, resize-observer, content-visibility, react-hooks]

requires:
  - phase: 13-chat-view-scaffold
    provides: "useScrollAnchor hook, ScrollToBottomPill, MessageList, MessageContainer"
provides:
  - "Per-session scroll position preservation via scrollPositionMap"
  - "ResizeObserver bottom lock for dynamic content during streaming"
  - "Unread message count badge on scroll-to-bottom pill"
  - "content-visibility: auto on finalized MessageContainers"
affects: [chat-view, streaming, performance]

tech-stack:
  added: []
  patterns: [ResizeObserver rAF throttle, scroll position map, content-visibility optimization]

key-files:
  created: []
  modified:
    - src/src/hooks/useScrollAnchor.ts
    - src/src/hooks/useScrollAnchor.test.ts
    - src/src/components/chat/view/ScrollToBottomPill.tsx
    - src/src/components/chat/view/scroll-pill.css
    - src/src/components/chat/view/MessageList.tsx
    - src/src/components/chat/view/MessageContainer.tsx
    - src/src/components/chat/view/ActiveMessage.tsx
    - src/vitest-setup.ts

key-decisions:
  - "showPill no longer gated on isStreaming -- pill shows whenever scrolled up 200px+"
  - "ResizeObserver with rAF throttle for bottom lock (not polling)"
  - "content-visibility: auto with containIntrinsicHeight: auto 200px for finalized messages"
  - "useEffect ref sync pattern for unread count tracking (react-hooks/refs compliance)"

patterns-established:
  - "ResizeObserver + rAF throttle: observe content wrapper, skip if frame pending"
  - "Scroll position map: useRef<Map<string, number>> for per-session preservation"
  - "ResizeObserver polyfill in vitest-setup.ts for jsdom testing"

requirements-completed: [NAV-01, NAV-02, NAV-03, NAV-04]

duration: 4min
completed: 2026-03-08
---

# Phase 18 Plan 02: Scroll Anchor Enhancements Summary

**Per-session scroll position preservation, ResizeObserver bottom lock, unread badge on scroll pill, and content-visibility optimization for finalized messages**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-08T21:59:27Z
- **Completed:** 2026-03-08T22:03:49Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Per-session scroll position saved/restored on session switch via scrollPositionMap
- ResizeObserver maintains bottom lock during dynamic content expansion (code blocks, tool cards)
- Unread message count badge on scroll-to-bottom pill with 99+ cap
- content-visibility: auto applied to finalized message containers for off-screen rendering skip

## Task Commits

Each task was committed atomically:

1. **Task 1: useScrollAnchor enhancements** - `433bf50` (feat)
2. **Task 2: MessageList scroll preservation + MessageContainer content-visibility** - `eaa47d2` (feat)

## Files Created/Modified
- `src/src/hooks/useScrollAnchor.ts` - Enhanced with position map, ResizeObserver, unread count, 200px rootMargin
- `src/src/hooks/useScrollAnchor.test.ts` - Updated showPill test, added 3 unread count tests
- `src/src/components/chat/view/ScrollToBottomPill.tsx` - Added unreadCount prop with badge rendering
- `src/src/components/chat/view/scroll-pill.css` - Added position: relative and badge line-height
- `src/src/components/chat/view/MessageList.tsx` - Session-aware scroll save/restore, unread wiring
- `src/src/components/chat/view/MessageContainer.tsx` - content-visibility: auto for finalized messages
- `src/src/components/chat/view/ActiveMessage.tsx` - Pass isStreaming to MessageContainer
- `src/vitest-setup.ts` - ResizeObserver polyfill for jsdom

## Decisions Made
- showPill changed from `!isAtBottom && isStreaming` to `!isAtBottom` -- pill should always be available when scrolled up, not just during streaming
- ResizeObserver with rAF throttle pattern chosen over MutationObserver for dynamic content height changes
- content-visibility with `containIntrinsicHeight: auto 200px` for browser-estimated heights on finalized messages
- useEffect ref sync pattern for unread counting (render-time ref access violates react-hooks/refs ESLint rule)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] ResizeObserver polyfill for jsdom**
- **Found during:** Task 1 (useScrollAnchor enhancements)
- **Issue:** ResizeObserver not defined in jsdom test environment, causing 4 test failures
- **Fix:** Added ResizeObserver polyfill stub in vitest-setup.ts
- **Files modified:** src/vitest-setup.ts
- **Verification:** All 676 tests pass
- **Committed in:** 433bf50

**2. [Rule 1 - Bug] ESLint react-hooks/refs violation in MessageList**
- **Found during:** Task 2 (MessageList scroll preservation)
- **Issue:** Initial implementation used render-time ref access for unread count tracking, violating react-hooks/refs
- **Fix:** Moved to useEffect ref sync pattern
- **Files modified:** src/src/components/chat/view/MessageList.tsx
- **Verification:** ESLint passes clean
- **Committed in:** eaa47d2

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both fixes necessary for test environment and ESLint compliance. No scope creep.

## Issues Encountered
None beyond the auto-fixed deviations above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Scroll system fully enhanced with position preservation, bottom lock, and unread tracking
- content-visibility optimization ready for long conversations
- Ready for Phase 18 Plan 03 (polish/refinement) or next phase

---
*Phase: 18-activity-scroll-polish*
*Completed: 2026-03-08*
