---
phase: 06-streaming-engine-scroll-anchor
plan: 02
subsystem: ui
tags: [react, intersection-observer, scroll, animation, css, hooks]

# Dependency graph
requires:
  - phase: 06-streaming-engine-scroll-anchor
    provides: useStreamStore isStreaming selector (from plan 01 / Phase 4)
  - phase: 01-design-system-foundation
    provides: design tokens (z-index, motion, glass, color tokens)
provides:
  - useScrollAnchor hook with IntersectionObserver sentinel pattern
  - ScrollToBottomPill floating button component with frosted glass effect
  - scroll-pill.css for CSS custom property styles
affects: [07-proof-of-life, streaming-ui, chat-view]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Callback ref pattern for triggering effects on DOM element attachment
    - IntersectionObserver sentinel for passive scroll position tracking
    - rAF auto-scroll loop with anti-oscillation guard
    - Wheel/touchmove event listener for user scroll intent detection
    - CSS class file for color-mix() and vendor-prefixed properties

key-files:
  created:
    - src/src/hooks/useScrollAnchor.ts
    - src/src/hooks/useScrollAnchor.test.ts
    - src/src/components/chat/view/ScrollToBottomPill.tsx
    - src/src/components/chat/view/ScrollToBottomPill.test.tsx
    - src/src/components/chat/view/scroll-pill.css
  modified:
    - src/src/components/chat/view/ActiveMessage.test.tsx

key-decisions:
  - "Callback ref instead of useRef for sentinel -- ensures IntersectionObserver setup fires when sentinel attaches to DOM"
  - "Wheel/touchmove event listener for user scroll detection -- IntersectionObserver alone cannot distinguish user scroll from content growth during auto-scroll"
  - "Anti-oscillation guard via isAutoScrollingRef -- prevents observer 'not intersecting' events from flashing the pill during rAF auto-scroll"
  - "Separate scroll-pill.css file for color-mix() and vendor prefixes -- avoids ESLint inline style ban while keeping token-backed values"
  - "eslint-disable for setState in effect -- valid external store sync pattern (isStreaming edge detection)"

patterns-established:
  - "Callback ref pattern: use useState+useCallback instead of useRef when effect needs to re-run on element attachment"
  - "Frosted glass surface pattern: CSS class with color-mix() + backdrop-filter + vendor prefix"
  - "User scroll detection pattern: wheel/touchmove events for disambiguating user vs programmatic scroll"

requirements-completed: [COMP-03]

# Metrics
duration: 10min
completed: 2026-03-06
---

# Phase 6 Plan 02: Scroll Anchor + Bottom Pill Summary

**IntersectionObserver scroll sentinel with rAF auto-scroll, anti-oscillation guard, frosted glass scroll-to-bottom pill, and 20 tests**

## Performance

- **Duration:** 10 min
- **Started:** 2026-03-06T14:46:46Z
- **Completed:** 2026-03-06T14:57:03Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- useScrollAnchor hook with passive IntersectionObserver sentinel, rAF auto-scroll loop, and anti-oscillation guard
- ScrollToBottomPill component with frosted glass effect, slide animation, down arrow icon, and full accessibility
- 20 comprehensive tests (13 hook + 7 component) all passing, zero regressions across 235 total tests

## Task Commits

Each task was committed atomically:

1. **Task 1: useScrollAnchor hook with IntersectionObserver sentinel** - `545617a` (feat)
2. **Task 2: ScrollToBottomPill component with frosted glass and slide animation** - `071e89a` (feat)

_Both tasks followed TDD: RED (failing tests) -> GREEN (implementation) -> committed together since pre-commit typecheck requires implementation file to exist._

## Files Created/Modified
- `src/src/hooks/useScrollAnchor.ts` - IntersectionObserver scroll anchoring hook with callback ref, rAF auto-scroll, anti-oscillation guard, wheel/touchmove user scroll detection
- `src/src/hooks/useScrollAnchor.test.ts` - 13 tests covering all scroll anchor behaviors
- `src/src/components/chat/view/ScrollToBottomPill.tsx` - Floating pill button with frosted glass surface, SVG arrow, slide animation
- `src/src/components/chat/view/ScrollToBottomPill.test.tsx` - 7 tests for visibility, click, accessibility
- `src/src/components/chat/view/scroll-pill.css` - CSS custom property styles (color-mix, vendor prefixes, token-backed transitions)
- `src/src/components/chat/view/ActiveMessage.test.tsx` - Fixed pre-existing unused import (linter auto-restored needed import)

## Decisions Made
- **Callback ref over useRef**: The sentinel element needs to trigger the IntersectionObserver setup effect when it attaches to the DOM. A plain useRef doesn't cause re-renders, so the observer effect would never fire. A callback ref (useState + useCallback) solves this cleanly.
- **Wheel/touchmove listener addition**: The plan only specified IntersectionObserver for scroll detection. But the anti-oscillation guard (which suppresses "not intersecting" during auto-scroll) made it impossible for the observer alone to detect user scroll during streaming. Adding wheel/touchmove listeners provides explicit user intent signal.
- **Separate CSS file instead of inline styles**: The ESLint no-banned-inline-style rule blocks backgroundColor, WebkitBackdropFilter, transitionDuration, and transitionTimingFunction. Moving these to a CSS class file keeps the code compliant while still using token-backed values.
- **eslint-disable for setState in effect**: The stream re-engagement effect (isStreaming false->true transition) calls setIsAtBottom(true). This is a valid external store synchronization pattern -- the Zustand store change drives a local state update. Added eslint-disable with clear justification.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Callback ref pattern instead of useRef for sentinel**
- **Found during:** Task 1 (useScrollAnchor hook)
- **Issue:** Plan specified `sentinelRef = useRef<HTMLDivElement>(null)` but useRef changes don't trigger effect re-runs. Observer setup effect never fired because sentinelRef.current was always null when the effect ran.
- **Fix:** Changed to callback ref pattern: `useState<HTMLDivElement | null>` + `useCallback` setter. The sentinel element state change triggers the observer setup effect.
- **Files modified:** src/src/hooks/useScrollAnchor.ts
- **Verification:** All 13 tests pass including observer setup and cleanup

**2. [Rule 2 - Missing Critical] Added wheel/touchmove user scroll detection**
- **Found during:** Task 1 (useScrollAnchor hook)
- **Issue:** Anti-oscillation guard (isAutoScrollingRef) suppresses observer "not intersecting" during auto-scroll, which is correct for preventing pill flash. But it also prevents detecting genuine user scroll-up during streaming. The observer alone cannot distinguish user scroll from content growth.
- **Fix:** Added wheel and touchmove event listeners on the scroll container. When fired during auto-scroll, they set isAutoScrollingRef=false and isAtBottom=false, cleanly disengaging auto-scroll.
- **Files modified:** src/src/hooks/useScrollAnchor.ts, src/src/hooks/useScrollAnchor.test.ts
- **Verification:** showPill and auto-scroll-stops tests pass using wheel event simulation

**3. [Rule 3 - Blocking] Moved inline styles to CSS file for ESLint compliance**
- **Found during:** Task 2 (ScrollToBottomPill component)
- **Issue:** ESLint no-banned-inline-style rule blocked backgroundColor, WebkitBackdropFilter, transitionDuration, transitionTimingFunction. These properties use CSS custom properties (color-mix, var()) that Tailwind can't express.
- **Fix:** Created scroll-pill.css with a .scroll-pill class for the non-Tailwind styles. Only zIndex remains inline (allowed by ESLint).
- **Files modified:** src/src/components/chat/view/ScrollToBottomPill.tsx, src/src/components/chat/view/scroll-pill.css
- **Verification:** ESLint passes with zero errors

**4. [Rule 1 - Bug] Fixed JSX.Element return type**
- **Found during:** Task 2 (ScrollToBottomPill component)
- **Issue:** `JSX.Element` return type annotation caused TS2503 "Cannot find namespace 'JSX'" in strict TypeScript with verbatimModuleSyntax.
- **Fix:** Removed explicit return type annotation (TypeScript infers it correctly).
- **Files modified:** src/src/components/chat/view/ScrollToBottomPill.tsx
- **Verification:** `npx tsc --noEmit` passes

---

**Total deviations:** 4 auto-fixed (1 missing critical, 2 blocking, 1 bug)
**Impact on plan:** All auto-fixes necessary for correctness and build compliance. Callback ref and wheel listener are genuine improvements over the plan's approach. No scope creep.

## Issues Encountered
- Pre-existing TypeScript error in ActiveMessage.test.tsx (unused `act` import) blocked typecheck. The linter auto-restored the import since `act` is actually used in the beforeEach/afterEach blocks -- the issue was a phantom removal from a previous session's edit.
- Pre-existing ActiveMessage.test.tsx had 4 failing tests (RED phase from plan 06-01). These passed after the linter restored the correct import, indicating they were likely broken by the same phantom edit.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- useScrollAnchor hook ready for integration in the proof-of-life page (Phase 7)
- ScrollToBottomPill ready for use with useScrollAnchor's showPill and scrollToBottom
- All Phase 6 deliverables (useStreamBuffer, ActiveMessage, useScrollAnchor, ScrollToBottomPill, streaming-cursor.css) now complete
- Phase 7 proof-of-life can wire everything together into a working streaming demo

---
*Phase: 06-streaming-engine-scroll-anchor*
*Plan: 02*
*Completed: 2026-03-06*
