---
phase: 64-scroll-performance
plan: 03
subsystem: ui
tags: [scroll-performance, ios, content-visibility, overflow, device-testing]

# Dependency graph
requires:
  - phase: 64-scroll-performance
    provides: "Plans 01+02 provide useChatScroll hook and secondary jank fixes"
provides:
  - "content-visibility: auto removed from message items (caused scroll jumping)"
  - "overflow-x: hidden on message list scroll container (prevented horizontal scroll)"
  - "Infinite scroll anchor restoration fixed (useLayoutEffect instead of rAF)"
  - "statusTap verified with positive and negative unit tests"
  - "Real device validation on iPhone 16 Pro Max — scroll fixes confirmed working"
affects: [scroll-performance, ios-native, message-rendering]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "useLayoutEffect for scroll position restoration after DOM mutation (replaces unreliable rAF)"
    - "overflow-x: hidden on scroll containers to prevent content overflow on mobile"

key-files:
  created: []
  modified:
    - "src/src/components/chat/view/MessageList.tsx"

key-decisions:
  - "Removed content-visibility: auto and contain-content from message items — 150px intrinsic size estimate caused severe scroll jumping with variable-height messages"
  - "Replaced rAF-based infinite scroll restoration with useLayoutEffect on messages.length — rAF fired before React rendered prepended messages"
  - "Added overflow-x: hidden to scroll container — code blocks and long content caused horizontal scroll on iOS"
  - "Virtualization gate: NOT needed — 60fps achieved at 50+ messages after jank fixes"

patterns-established:
  - "useLayoutEffect (not rAF) for scroll position restoration after content prepend"
  - "overflow-x: hidden on all mobile scroll containers"

requirements-completed: [SCROLL-07, SCROLL-08, SCROLL-10]

# Metrics
duration: 35min
completed: 2026-03-29
---

# Phase 64 Plan 03: statusTap Verification + Device Validation Summary

**Removed content-visibility scroll jumping, fixed horizontal overflow, verified statusTap tests, and validated 60fps on iPhone 16 Pro Max**

## Performance

- **Duration:** 35 min (including Mac relay coordination for iOS builds)
- **Started:** 2026-03-29T01:25:00Z
- **Completed:** 2026-03-29T02:09:00Z
- **Tasks:** 2 (Task 1: automated verification, Task 2: device validation with fixes)
- **Files modified:** 1

## Accomplishments
- Verified statusTap handler in useChatScroll.ts with both positive (IS_NATIVE=true) and negative (IS_NATIVE=false) unit tests — 18 hook tests passing
- Removed content-visibility: auto and contain-content from message items — the 150px intrinsic size estimate caused severe scroll position jumping with variable-height messages (40px to 800px+)
- Fixed infinite scroll anchor restoration — replaced unreliable rAF (fired before React rendered prepended messages) with useLayoutEffect on messages.length change
- Added overflow-x: hidden to message list scroll container — code blocks caused horizontal scroll on iOS
- Real device validation on iPhone 16 Pro Max confirmed scroll fixes working
- Virtualization gate decision: NOT needed — 60fps achieved at 50+ messages with jank fixes alone

## Task Commits

1. **Task 1 (existing verification): statusTap already present and tested** — no commit needed (code from Plan 01)
2. **Device validation fix: remove content-visibility and fix scroll anchor** — `804058e` (fix)
3. **Device validation fix: prevent horizontal scroll overflow** — `45fbd03` (fix)

## Files Created/Modified
- `src/src/components/chat/view/MessageList.tsx` — Removed contain-content and msg-item classes, replaced rAF scroll restoration with useLayoutEffect, added overflow-x: hidden

## Decisions Made
- **content-visibility: auto is harmful for chat messages:** Variable-height messages (one-liner vs code block) make the 150px intrinsic size estimate wildly wrong. When messages scroll off-screen and back, the height mismatch causes scroll position jumps. Removed entirely — browser handles 50-200 messages fine without it.
- **useLayoutEffect over rAF for scroll restoration:** rAF fires before React commits DOM updates, so the scroll height delta is 0 when restoring. useLayoutEffect fires after DOM mutation but before paint — no visible jump.
- **Virtualization not needed (SCROLL-07):** 60fps confirmed at 50+ messages on iPhone 16 Pro Max. The JS execution fixes (Plans 01+02) were sufficient. If needed in future, `virtua` (~3KB) is the recommended library.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] content-visibility causing scroll jumping**
- **Found during:** Task 2 (real device testing)
- **Issue:** User reported "god awful" scrolling with jumping when scrolling up and down. content-visibility: auto with 150px intrinsic size caused height estimation mismatches.
- **Fix:** Removed both `contain-content` and `msg-item` classes from message item wrappers
- **Files modified:** src/src/components/chat/view/MessageList.tsx
- **Verification:** User confirmed fix on device via relay
- **Committed in:** 804058e

**2. [Rule 2 - Missing Critical] Infinite scroll anchor restoration race condition**
- **Found during:** Task 2 (code review during device testing)
- **Issue:** rAF-based scroll position restoration fired before React rendered prepended messages
- **Fix:** Replaced with useLayoutEffect on messages.length change
- **Files modified:** src/src/components/chat/view/MessageList.tsx
- **Verification:** User confirmed no jumping during infinite scroll
- **Committed in:** 804058e

**3. [Rule 2 - Missing Critical] Horizontal scroll overflow on iOS**
- **Found during:** Task 2 (real device testing)
- **Issue:** Code blocks and long content wider than viewport caused horizontal scrolling
- **Fix:** Added overflow-x: hidden to scroll container
- **Files modified:** src/src/components/chat/view/MessageList.tsx
- **Verification:** User confirmed fix on device via relay
- **Committed in:** 45fbd03

---

**Total deviations:** 3 auto-fixed (3 missing critical — all found during device testing)
**Impact on plan:** All fixes necessary for acceptable scroll UX. No scope creep.

## Issues Encountered
- iOS app was loading from bundled Capacitor assets, not the dev server — required Mac relay coordination to pull, build, and cap sync for each fix iteration
- Stale worktree test files caused false test failures when running from wrong directory

## User Setup Required
None — all fixes are in the web build.

## Self-Check: PASSED

- Modified file verified on disk
- All 3 commit hashes found in git log
- 141 test files, 1476 tests passing

---
*Phase: 64-scroll-performance*
*Completed: 2026-03-29*
