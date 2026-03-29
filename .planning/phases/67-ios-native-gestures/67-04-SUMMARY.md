---
phase: 67-ios-native-gestures
plan: 04
subsystem: ui
tags: [app-lifecycle, haptics, sidebar, gestures, ios, capacitor, websocket-reconnect]

# Dependency graph
requires:
  - phase: 67-ios-native-gestures
    plan: 01
    provides: "useAppLifecycle hook, hapticEvent centralized map"
  - phase: 67-ios-native-gestures
    plan: 02
    provides: "Sidebar swipe-to-delete, pull-to-refresh, context menus"
  - phase: 67-ios-native-gestures
    plan: 03
    provides: "Message context menus with Copy/Retry/Share"
provides:
  - "useAppLifecycle mounted in AppShell for foreground WebSocket reconnect (GESTURE-08)"
  - "hapticEvent('sidebarToggle') on all sidebar toggle buttons (GESTURE-05)"
  - "Complete Phase 67 integration: all gesture features wired and ready for device validation"
affects: [68-visual-polish, ios-gestures, app-shell]

# Tech tracking
tech-stack:
  added: []
  patterns: ["handleToggleWithHaptic callback wrapping toggleSidebar + hapticEvent for button-triggered toggles"]

key-files:
  created: []
  modified:
    - src/src/components/app-shell/AppShell.tsx
    - src/src/components/sidebar/Sidebar.tsx

key-decisions:
  - "Haptic feedback added only to button onClick handlers, not to swipe-to-close touch handler (D-02 preserved)"
  - "handleToggleWithHaptic useCallback wraps both hapticEvent and toggleSidebar for all 4 toggle buttons"
  - "Auto-close on route change still uses raw toggleSidebar (no haptic on programmatic close)"

patterns-established:
  - "hapticEvent wrapper callback pattern: useCallback(() => { hapticEvent('name'); action(); }, [action])"

requirements-completed: [GESTURE-04, GESTURE-05, GESTURE-08]

# Metrics
duration: 3min
completed: 2026-03-29
---

# Phase 67 Plan 04: AppShell Wiring and Sidebar Haptic Summary

**useAppLifecycle foreground reconnect mounted in AppShell, hapticEvent('sidebarToggle') on all 4 sidebar toggle buttons, swipe-to-close handlers preserved per D-02**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-29T21:39:39Z
- **Completed:** 2026-03-29T21:43:00Z
- **Tasks:** 1/2 (Task 2 is human checkpoint -- pending device verification)
- **Files modified:** 2

## Accomplishments
- Mounted useAppLifecycle() in AppShell for GESTURE-08 foreground WebSocket reconnect (no-op on web, listens for Capacitor App foreground events on native)
- Added hapticEvent('sidebarToggle') via handleToggleWithHaptic callback to all 4 sidebar toggle buttons: mobile hamburger, desktop chevron, header close/collapse, mobile backdrop
- Preserved swipe-to-close touch handlers completely untouched per D-02 constraint
- 1541 tests pass, TypeScript compiles clean, zero regressions

## Task Commits

Each task was committed atomically:

1. **Task 1: Mount useAppLifecycle in AppShell and add haptic sidebar toggle** - `dc213e1` (feat)

**Task 2: Real-device validation** - PENDING (human checkpoint, requires iPhone 16 Pro Max testing)

## Files Created/Modified
- `src/src/components/app-shell/AppShell.tsx` - Import and call useAppLifecycle() for foreground reconnect
- `src/src/components/sidebar/Sidebar.tsx` - Import hapticEvent, create handleToggleWithHaptic wrapper, apply to all 4 toggle buttons

## Decisions Made
- Haptic feedback on button onClick handlers only (not on programmatic auto-close from route change, not on swipe-to-close)
- handleToggleWithHaptic wraps hapticEvent + toggleSidebar in useCallback with toggleSidebar dependency
- Auto-close effect on route change uses raw toggleSidebar (no haptic on programmatic close -- user didn't initiate the action)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Known Stubs

None - all functionality is fully wired.

## Pending Human Checkpoint

**Task 2 (checkpoint:human-verify)** requires real-device validation of all 10 GESTURE requirements on iPhone 16 Pro Max and desktop web. See 67-04-PLAN.md Task 2 for the full verification checklist.

## Next Phase Readiness
- All Phase 67 code is complete and integrated
- Phase 68 (Visual Polish) can proceed after device validation confirms no gesture regressions
- 10 GESTURE requirements implemented across 4 plans

## Self-Check: PASSED

- [x] AppShell.tsx has useAppLifecycle import and call (verified)
- [x] Sidebar.tsx has hapticEvent import and handleToggleWithHaptic wrapper (verified)
- [x] Task 1 commit dc213e1 verified in git log
- [x] 1541 tests pass, TypeScript clean

---
*Phase: 67-ios-native-gestures*
*Completed: 2026-03-29 (Task 1 only; Task 2 pending device verification)*
