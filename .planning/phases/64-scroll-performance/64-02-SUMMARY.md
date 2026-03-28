---
phase: 64-scroll-performance
plan: 02
subsystem: ui
tags: [css, scroll-performance, content-visibility, overscroll-behavior, ios, reflow, animation]

# Dependency graph
requires:
  - phase: 64-scroll-performance
    provides: "Plan 01 refactors MessageList scroll logic; this plan fixes secondary jank sources"
provides:
  - "Deferred ActiveMessage finalization reflow (rAF + 50ms setTimeout)"
  - "CSS .msg-item class for content-visibility (single source, 150px intrinsic)"
  - "CSS .native-scroll rule without overscroll-behavior-y: contain (iOS rubber band)"
  - "overscroll-behavior: none on html/body (page-level bounce prevention)"
  - "Documented useAutoResize write-read-write as acceptable per SCROLL-04 / D-09"
affects: [scroll-performance, ios-native, message-rendering]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "rAF + setTimeout deferral for non-critical forced reflows"
    - "CSS-only content-visibility (no inline styles)"
    - "Selective overscroll-behavior: none on html/body but auto on scroll containers"

key-files:
  created: []
  modified:
    - "src/src/components/chat/view/ActiveMessage.tsx"
    - "src/src/components/chat/view/ActiveMessage.test.tsx"
    - "src/src/components/chat/composer/useAutoResize.ts"
    - "src/src/styles/base.css"
    - "src/src/components/chat/view/MessageContainer.tsx"
    - "src/src/components/chat/view/MessageContainer.test.tsx"

key-decisions:
  - "ActiveMessage finalization reflow deferred by rAF + 50ms setTimeout (D-12)"
  - "useAutoResize write-read-write kept as-is, documented as acceptable (D-09)"
  - "content-visibility single source: CSS .msg-item class at 150px intrinsic height"
  - "overscroll-behavior: none added to html/body (was missing from codebase)"
  - ".native-scroll rule omits overscroll-behavior-y to preserve iOS rubber band bounce"

patterns-established:
  - "rAF + setTimeout(50) for deferring forced reflows out of scroll-critical path"
  - "CSS .msg-item class is the single authoritative source for content-visibility on messages"

requirements-completed: [SCROLL-04, SCROLL-05, SCROLL-09]

# Metrics
duration: 5min
completed: 2026-03-28
---

# Phase 64 Plan 02: Secondary Scroll Jank Fixes Summary

**Deferred ActiveMessage finalization reflow via rAF+setTimeout, restored iOS rubber band bounce, and consolidated content-visibility to single CSS source**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-28T20:32:23Z
- **Completed:** 2026-03-28T20:37:37Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- ActiveMessage finalization forced reflow deferred by rAF + 50ms setTimeout so it cannot block scroll frames during streaming
- iOS native rubber band bounce restored on .native-scroll containers by omitting overscroll-behavior-y: contain
- Inline content-visibility style removed from MessageContainer.tsx; CSS .msg-item class is now the single source with 150px intrinsic height
- useAutoResize verified as acceptable frequency (10-20Hz) and documented with SCROLL-04 / D-09 reference
- overscroll-behavior: none added to html/body to prevent page-level bounce

## Task Commits

Each task was committed atomically:

1. **Task 1: Defer ActiveMessage finalization reflow and verify useAutoResize** - `7eaf37f` (fix)
2. **Task 2: Fix overscroll-behavior for rubber band bounce and reconcile content-visibility sources** - `2a3bed2` (fix)

## Files Created/Modified
- `src/src/components/chat/view/ActiveMessage.tsx` - Wrapped finalization rAF body in setTimeout(50ms) for D-12 deferred reflow
- `src/src/components/chat/view/ActiveMessage.test.tsx` - Updated 4 tests to account for 50ms deferred setTimeout
- `src/src/components/chat/composer/useAutoResize.ts` - Added documentation comment for SCROLL-04 / D-09
- `src/src/styles/base.css` - Added .msg-item, .native-scroll CSS rules, overscroll-behavior: none on html/body
- `src/src/components/chat/view/MessageContainer.tsx` - Removed inline contentVisibilityStyle and CSSProperties import
- `src/src/components/chat/view/MessageContainer.test.tsx` - Updated tests to verify no inline content-visibility styles

## Decisions Made
- **rAF + setTimeout(50) deferral pattern:** The forced reflow in ActiveMessage is required for FLIP animation but now fires 50ms after the rAF, outside the scroll-critical path. This is the minimum viable deferral -- longer delays would cause visible finalization lag.
- **150px intrinsic height:** Compromise between the old CSS value (120px) and the old inline value (200px). Represents a reasonable average message height estimate for content-visibility scroll position predictions.
- **Added overscroll-behavior: none to html/body:** The plan assumed these existed (referenced at "line ~44, ~53") but they were missing from the codebase. Added per Rule 2 (missing critical functionality for correct iOS behavior).
- **void isStreaming in MessageContainer:** Kept isStreaming prop in the API for backwards compatibility even though it's no longer used for inline styles. The CSS .msg-item class handles optimization at the MessageList level.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added overscroll-behavior: none to html/body**
- **Found during:** Task 2 (overscroll-behavior fix)
- **Issue:** Plan assumed html/body had overscroll-behavior: none at lines ~44 and ~53, but these declarations did not exist in the codebase. Without them, page-level bounce is not prevented on iOS.
- **Fix:** Added `overscroll-behavior: none` to both html and body rules in base.css
- **Files modified:** src/src/styles/base.css
- **Verification:** grep confirms 2 property declarations plus 1 comment reference
- **Committed in:** 2a3bed2 (Task 2 commit)

**2. [Rule 2 - Missing Critical] Created .msg-item and .native-scroll CSS rules**
- **Found during:** Task 2 (content-visibility reconciliation)
- **Issue:** Plan assumed .msg-item and html[data-native] .native-scroll CSS rules already existed at specific line numbers in base.css. They did not exist. These are needed for the content-visibility single-source pattern and native scroll optimization.
- **Fix:** Created both CSS rules in base.css with the correct properties
- **Files modified:** src/src/styles/base.css
- **Verification:** grep confirms contain-intrinsic-size: auto 150px (1 match), will-change: scroll-position in .native-scroll
- **Committed in:** 2a3bed2 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 missing critical)
**Impact on plan:** Both auto-fixes necessary for correctness. The plan's research identified the correct patterns but referenced a codebase state that didn't match reality. The CSS rules and overscroll-behavior declarations were created rather than modified. No scope creep.

## Issues Encountered
- jsdom dependency missing in worktree -- installed before running tests (not a code issue, just test infrastructure in git worktree)
- Plan referenced non-existent CSS rules at specific line numbers -- adapted by creating the rules instead of modifying them

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All secondary scroll jank sources addressed
- CSS rules (.msg-item, .native-scroll) ready for Plan 01's MessageList refactoring to apply class names
- Plan 03 (statusTap, virtualization gate) can proceed independently

## Self-Check: PASSED

- All 6 modified files verified on disk
- Both task commits (7eaf37f, 2a3bed2) verified in git log
- 137 test files, 1403 tests all passing

---
*Phase: 64-scroll-performance*
*Completed: 2026-03-28*
