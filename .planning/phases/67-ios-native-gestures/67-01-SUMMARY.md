---
phase: 67-ios-native-gestures
plan: 01
subsystem: native
tags: [capacitor, gestures, haptics, use-gesture, clipboard, share, action-sheet, app-lifecycle, ios]

# Dependency graph
requires:
  - phase: 62-haptics-motion
    provides: "hapticImpact, hapticNotification, hapticSelection base functions"
  - phase: 59-platform-foundation
    provides: "IS_NATIVE, platform.ts, native-plugins.ts pattern"
provides:
  - "@use-gesture/react v10 gesture library for swipe/pull-to-refresh hooks"
  - "4 Capacitor plugins: @capacitor/app, @capacitor/share, @capacitor/action-sheet, @capacitor/clipboard"
  - "hapticEvent() centralized event map with 7 named gesture-feedback events"
  - "useAppLifecycle hook for WebSocket reconnect on foreground return"
  - "nativeClipboardWrite() cross-platform clipboard utility"
  - "nativeShare() cross-platform share utility with Web Share API fallback"
  - "showDestructiveConfirmation() native action sheet for destructive ops"
  - "initAppLifecycle() foreground listener with cleanup return"
affects: [67-02, 67-03, 67-04, swipe-to-delete, pull-to-refresh, context-menus]

# Tech tracking
tech-stack:
  added: ["@use-gesture/react@^10.3.1", "@capacitor/app@^7.1.2", "@capacitor/share@^7.0.4", "@capacitor/action-sheet@^7.0.4", "@capacitor/clipboard@^7.0.4"]
  patterns: ["hapticEvent centralized grammar", "IS_NATIVE + dynamic import pattern for Capacitor plugins", "useAppLifecycle foreground reconnect with debounce"]

key-files:
  created:
    - src/src/lib/native-clipboard.ts
    - src/src/lib/native-share.ts
    - src/src/lib/native-actions.ts
    - src/src/lib/app-lifecycle.ts
    - src/src/hooks/useAppLifecycle.ts
    - src/src/lib/native-clipboard.test.ts
    - src/src/lib/native-share.test.ts
    - src/src/lib/native-actions.test.ts
    - src/src/hooks/useAppLifecycle.test.ts
  modified:
    - src/package.json
    - src/src/lib/haptics.ts
    - src/src/lib/haptics.test.ts

key-decisions:
  - "All Capacitor plugins installed as production dependencies (not dev) to avoid tree-shaking in iOS builds"
  - "hapticEvent() uses Record lookup with optional chaining for silent no-op on unknown events"
  - "useAppLifecycle debounces at 300ms to prevent reconnection storms on rapid foreground/background cycles"
  - "native-share falls back to clipboard write when Web Share API unavailable (not all web browsers support navigator.share)"
  - "native-actions returns false on web -- caller uses Radix AlertDialog for web destructive confirmations"
  - "AbortError in native-share is silently ignored (user cancelled share sheet, not a real error)"

patterns-established:
  - "hapticEvent('eventName') centralized grammar: all gesture feedback goes through named events"
  - "Capacitor utility module pattern: IS_NATIVE guard, dynamic import, try/catch, fire-and-forget"
  - "initAppLifecycle returns cleanup function (not exported separately) to prevent double-cleanup"

requirements-completed: [GESTURE-05, GESTURE-07, GESTURE-08, GESTURE-09, GESTURE-10]

# Metrics
duration: 4min
completed: 2026-03-29
---

# Phase 67 Plan 01: Foundation Dependencies Summary

**@use-gesture/react + 4 Capacitor plugins installed, hapticEvent centralized map with 7 events, and useAppLifecycle foreground reconnect hook with 300ms debounce**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-29T21:17:18Z
- **Completed:** 2026-03-29T21:22:17Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments
- Installed all 5 npm packages (@use-gesture/react, 4 Capacitor plugins) as production dependencies at correct 7.x versions
- Created 4 cross-platform Capacitor utility modules (clipboard, share, action sheet, app lifecycle) following established IS_NATIVE + dynamic import pattern
- Extended haptics.ts with hapticEvent() centralized event map mapping 7 named events to impact/notification/selection calls
- Created useAppLifecycle hook with 300ms debounce that reconnects WebSocket on foreground return when disconnected
- Full TDD cycle for Task 2: 53 tests across 5 test files, all passing; 1507 total tests, zero regressions

## Task Commits

Each task was committed atomically:

1. **Task 1: Install dependencies and create Capacitor utility modules** - `b4ce800` (feat)
2. **Task 2 RED: Failing tests for hapticEvent, useAppLifecycle, and native utilities** - `323ed15` (test)
3. **Task 2 GREEN: Implement hapticEvent and useAppLifecycle** - `a04af54` (feat)

## Files Created/Modified
- `src/package.json` - Added 5 production dependencies (@use-gesture/react, 4 Capacitor plugins)
- `src/src/lib/native-clipboard.ts` - Cross-platform clipboard write with IS_NATIVE guard and toast
- `src/src/lib/native-share.ts` - Native share sheet with Web Share API and clipboard fallbacks
- `src/src/lib/native-actions.ts` - Native iOS action sheet for destructive confirmations
- `src/src/lib/app-lifecycle.ts` - Capacitor App foreground listener with cleanup return
- `src/src/hooks/useAppLifecycle.ts` - React hook for WebSocket reconnect on foreground with 300ms debounce
- `src/src/lib/haptics.ts` - Extended with hapticEvent() and HapticEventName type (7 events)
- `src/src/lib/haptics.test.ts` - Extended with 8 hapticEvent tests
- `src/src/hooks/useAppLifecycle.test.ts` - 6 tests for foreground reconnect behavior
- `src/src/lib/native-clipboard.test.ts` - 6 tests for clipboard success/failure paths
- `src/src/lib/native-share.test.ts` - 5 tests for native/web/fallback share paths
- `src/src/lib/native-actions.test.ts` - 6 tests for action sheet confirmation behavior

## Decisions Made
- All Capacitor plugins installed as production deps (not devDependencies) to avoid tree-shaking in iOS builds -- matches existing @capacitor/keyboard pattern
- hapticEvent uses Record<HapticEventName, () => void> with optional chaining for silent no-op on unknown events -- extensible without breaking
- useAppLifecycle debounces at 300ms (D-19) to prevent connection storms from rapid iOS foreground/background cycles
- native-share silently ignores AbortError from user cancelling share sheet -- not a real error condition
- native-actions returns false on web path (no UI rendered) -- web uses existing DeleteSessionDialog with Radix AlertDialog

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Known Stubs

None - all modules are fully wired with real implementations.

## Next Phase Readiness
- @use-gesture/react ready for swipe hooks in Plan 02 (useDrag axis:'x' for swipe-to-delete)
- hapticEvent() grammar ready for gesture feedback integration
- useAppLifecycle ready to mount in AppShell
- All Capacitor utilities ready for integration in Plans 02-04

## Self-Check: PASSED

- All 12 files verified present on disk
- All 3 task commits verified in git log (b4ce800, 323ed15, a04af54)

---
*Phase: 67-ios-native-gestures*
*Completed: 2026-03-29*
