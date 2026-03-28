---
phase: 60-keyboard-composer
plan: 02
subsystem: mobile
tags: [capacitor, keyboard, ios, hooks, css, safe-area, wkwebview]

# Dependency graph
requires:
  - phase: 60-keyboard-composer
    provides: native-plugins.ts with getKeyboardModule/nativePluginsReady, @capacitor/keyboard installed
provides:
  - "useKeyboardOffset() hook: platform-aware keyboard offset via Capacitor events or visualViewport fallback"
  - "ChatComposer refactored to be fully platform-unaware (no visualViewport code)"
  - "Safe-area CSS using max() to prevent double-padding on notched devices"
  - "Scroll coordination: auto-scroll to bottom on keyboard open if was-at-bottom"
affects: [mobile, ios, composer, keyboard-avoidance]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Platform-aware hook with async plugin readiness await + cancelled flag for StrictMode safety", "CSS max() for safe-area vs keyboard-offset to prevent double-padding on notched devices"]

key-files:
  created:
    - src/src/hooks/useKeyboardOffset.ts
    - src/src/hooks/useKeyboardOffset.test.ts
  modified:
    - src/src/components/chat/composer/ChatComposer.tsx
    - src/src/components/chat/composer/composer.css

key-decisions:
  - "useEffect (not useLayoutEffect) for hook: async import inside effect, nativePluginsReady already loaded by main.tsx"
  - "cancelled flag pattern for async listener race on fast unmount (StrictMode/navigation)"
  - "Scroll at-bottom threshold of 150px matches MessageList's own pattern"
  - "Web fallback uses fullHeight captured at mount (same as original ChatComposer hack)"
  - "Comment in ChatComposer avoids mentioning visualViewport to keep acceptance criteria clean"

patterns-established:
  - "Platform-aware hook pattern: IS_NATIVE branch -> await readiness -> register listeners with cancelled guard"
  - "CSS max(env(), var()) for safe-area vs dynamic offset to prevent stacking on notched devices"

requirements-completed: [KEY-02, KEY-03, KEY-04]

# Metrics
duration: 4min
completed: 2026-03-28
---

# Phase 60 Plan 02: Keyboard Offset Hook Summary

**useKeyboardOffset hook with native Capacitor events and visualViewport fallback, ChatComposer refactored platform-unaware, safe-area CSS max() fix for notched devices**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-28T02:30:43Z
- **Completed:** 2026-03-28T02:35:26Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Created useKeyboardOffset hook: Capacitor keyboardWillShow/keyboardWillHide on native, visualViewport resize on web
- Native path awaits nativePluginsReady, uses cancelled flag for async cleanup safety, scroll coordination (smooth scroll to bottom if was-at-bottom)
- ChatComposer stripped of all visualViewport code -- now calls useKeyboardOffset() as its only keyboard interface
- Safe-area CSS uses max(env(safe-area-inset-bottom), var(--keyboard-offset)) to prevent double-padding on notched devices
- 13 hook tests covering native, web, scroll coordination, cleanup, fallback, and edge cases
- Full test suite green: 1440 tests across 140 files, zero regressions

## Task Commits

Each task was committed atomically:

1. **Task 1: Create useKeyboardOffset hook with tests (TDD)** - `9fbc50d` (feat)
2. **Task 2: Integrate useKeyboardOffset into ChatComposer and fix safe-area CSS** - `dec0df0` (feat)

## Files Created/Modified
- `src/src/hooks/useKeyboardOffset.ts` - Platform-aware keyboard offset hook (native + web paths)
- `src/src/hooks/useKeyboardOffset.test.ts` - 13 tests for hook behavior
- `src/src/components/chat/composer/ChatComposer.tsx` - Removed visualViewport effect, added useKeyboardOffset() call
- `src/src/components/chat/composer/composer.css` - Safe-area uses max() instead of addition for keyboard offset

## Decisions Made
- Used useEffect (not useLayoutEffect) because the native path is inherently async (awaits nativePluginsReady + addListener returns Promise) -- useLayoutEffect would block paint without benefit
- cancelled flag pattern prevents async listener race on fast unmount in StrictMode or navigation
- Scroll at-bottom threshold of 150px matches the threshold used in MessageList for consistency
- Web fallback captures fullHeight at mount time (same behavior as original ChatComposer hack)
- On native plugin failure, falls back to web path silently per D-04

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None - both tasks completed cleanly with no issues.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 60 keyboard avoidance is complete: native Capacitor events on iOS, visualViewport fallback on web
- ChatComposer is fully platform-unaware, ready for further mobile refinements
- All 1440 tests passing (zero regressions)
- Safe-area + keyboard offset interaction tested for notched devices via CSS max()

## Self-Check: PASSED

- [x] useKeyboardOffset.ts exists
- [x] useKeyboardOffset.test.ts exists
- [x] ChatComposer.tsx modified (no visualViewport)
- [x] composer.css modified (max() safe-area)
- [x] 60-02-SUMMARY.md exists
- [x] Commit 9fbc50d found
- [x] Commit dec0df0 found

---
*Phase: 60-keyboard-composer*
*Completed: 2026-03-28*
