---
phase: 67-ios-native-gestures
plan: 02
subsystem: ui
tags: [gestures, swipe-to-delete, pull-to-refresh, context-menu, radix, use-gesture, haptics, ios]

# Dependency graph
requires:
  - phase: 67-ios-native-gestures
    plan: 01
    provides: "@use-gesture/react, hapticEvent centralized map, Capacitor utility modules"
provides:
  - "useSwipeToDelete hook: horizontal swipe with 80px threshold, velocity detection, haptic feedback"
  - "usePullToRefresh hook: vertical pull with scrollTop guard, 60px threshold, live session re-attach"
  - "SessionItemContextMenu: Radix context menu with Copy ID, Rename, Select, Pin, Export, Delete"
  - "PullToRefreshSpinner: SVG spinner with proportional arc and rotation animation"
  - "DeleteSessionDialog native branch: iOS action sheet with dynamic count-aware title"
  - "Swipe-to-delete CSS: mobile-only 80px delete zone with design tokens"
affects: [67-03, 67-04, sidebar, session-management, ios-gestures]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Swipe-to-delete: useSwipeToDelete + translateX offset + absolute-positioned delete button"
    - "Pull-to-refresh: usePullToRefresh + PullToRefreshSpinner + live session snapshot/re-attach"
    - "Radix ContextMenu: SessionItemContextMenu wrapping SessionItem via ContextMenuTrigger asChild"
    - "Native action sheet: IS_NATIVE useEffect branch in DeleteSessionDialog"
    - "Gesture hook testing: mock useDrag handler capture, simulate active/release states"

key-files:
  created:
    - src/src/hooks/useSwipeToDelete.ts
    - src/src/hooks/useSwipeToDelete.test.ts
    - src/src/hooks/usePullToRefresh.ts
    - src/src/hooks/usePullToRefresh.test.ts
    - src/src/components/sidebar/SessionItemContextMenu.tsx
    - src/src/components/sidebar/PullToRefreshSpinner.tsx
  modified:
    - src/src/components/sidebar/SessionItem.tsx
    - src/src/components/sidebar/SessionItem.test.tsx
    - src/src/components/sidebar/SessionList.tsx
    - src/src/components/sidebar/SessionList.test.tsx
    - src/src/components/sidebar/DeleteSessionDialog.tsx
    - src/src/components/sidebar/sidebar.css

key-decisions:
  - "Export handler shares session title+ID via nativeShare (not full conversation markdown) -- full export deferred"
  - "SessionContextMenu.tsx deprecated but not deleted -- still on disk, no imports"
  - "Swipe-to-delete mobile-only via useMobile() guard on bind() spread"
  - "PTR wrapper uses touchAction:pan-x on mobile, auto on desktop"
  - "Swipe wrapper uses touchAction:pan-y on mobile, auto on desktop"
  - "DeleteSessionDialog uses useEffect for native path to avoid double-render"
  - "Test migration: SessionList tests use captured context menu callbacks instead of simulated right-click"

patterns-established:
  - "Gesture hook pattern: useDrag with axis lock, filterTaps, threshold, pointer.touch"
  - "Swipe-to-delete structure: relative overflow-hidden container > absolute delete zone + translateX content"
  - "Context menu migration: Radix ContextMenu wrapping children replaces custom portal pattern"
  - "Native/web dialog branching: IS_NATIVE check + useEffect for native, null return + Radix for web"

requirements-completed: [GESTURE-01, GESTURE-02, GESTURE-03, GESTURE-04]

# Metrics
duration: 9min
completed: 2026-03-29
---

# Phase 67 Plan 02: Swipe, Pull-to-Refresh, and Context Menu Summary

**Swipe-to-delete (80px threshold + velocity), pull-to-refresh with live session re-attachment, and Radix long-press context menu with 6 actions wired into sidebar session list**

## Performance

- **Duration:** 9 min
- **Started:** 2026-03-29T21:25:05Z
- **Completed:** 2026-03-29T21:35:48Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments

- Created useSwipeToDelete hook with @use-gesture/react useDrag: axis:x, 80px threshold, velocity > 0.5 auto-reveal, -120px clamp, from() for smooth resume, haptic on threshold crossing
- Created usePullToRefresh hook with scrollTop guard, 60px threshold, isRefreshing state management, error toast, haptic on successful refresh
- Created SessionItemContextMenu (Radix pattern from FileTreeContextMenu): Copy ID, Rename, Select, Pin/Unpin, Export, Delete (destructive), haptic on open
- Created PullToRefreshSpinner: 24px SVG circle with proportional arc during pull, spin animation during refresh, var(--accent-primary) stroke
- Wired SessionItem with swipe-to-delete (mobile-only), keyboard Delete/Backspace, hapticEvent('sessionSelect') on click
- Wired SessionList with pull-to-refresh including live session re-attachment after refetch, Radix context menus replacing custom portal, export via nativeShare
- Added native action sheet branch to DeleteSessionDialog with dynamic count-aware title
- Added swipe-delete-btn CSS with design tokens (var(--status-error), var(--text-primary))
- Migrated all 39 SessionItem + SessionList tests, 1531 total tests passing, zero regressions

## Task Commits

Each task was committed atomically:

1. **Task 1: Create gesture hooks, context menu, and PTR spinner** - `696526f` (feat, TDD)
2. **Task 2: Wire gestures into SessionItem, SessionList, DeleteSessionDialog** - `70fefdf` (feat)

## Files Created/Modified

- `src/src/hooks/useSwipeToDelete.ts` - Horizontal swipe hook with 80px threshold, velocity detection, haptic feedback
- `src/src/hooks/useSwipeToDelete.test.ts` - 14 tests covering swipe directions, thresholds, velocity, reset, config
- `src/src/hooks/usePullToRefresh.ts` - Vertical pull hook with scrollTop guard, 60px threshold, error handling
- `src/src/hooks/usePullToRefresh.test.ts` - 10 tests covering pull thresholds, scrollTop guard, error toast, haptic
- `src/src/components/sidebar/SessionItemContextMenu.tsx` - Radix context menu with 6 menu items + haptic on open
- `src/src/components/sidebar/PullToRefreshSpinner.tsx` - SVG spinner with proportional arc and spin animation
- `src/src/components/sidebar/SessionItem.tsx` - Added swipe-to-delete wrapper, removed onContextMenu, added keyboard Delete
- `src/src/components/sidebar/SessionItem.test.tsx` - Migrated tests for prop removal, added mocks for new hooks
- `src/src/components/sidebar/SessionList.tsx` - PTR, Radix context menus, live session re-attach, export handler
- `src/src/components/sidebar/SessionList.test.tsx` - Migrated to captured callback pattern for context menu tests
- `src/src/components/sidebar/DeleteSessionDialog.tsx` - Native action sheet branch with dynamic count
- `src/src/components/sidebar/sidebar.css` - Added swipe-delete-btn styles with design tokens

## Decisions Made

- Export handler shares session title + ID via nativeShare (not full markdown conversation) -- full conversation export would require assembling message content which adds complexity; deferred to a future plan
- SessionContextMenu.tsx deprecated but not deleted -- file exists on disk but has zero imports
- Swipe and PTR gestures are mobile-only (useMobile guard), context menu works on both desktop (right-click) and mobile (long-press)
- Test migration uses captured context menu callbacks instead of simulated right-click since Radix ContextMenu doesn't open in jsdom
- DeleteSessionDialog native path uses useEffect triggered by isOpen to show native action sheet

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed test assertions for new DOM structure**
- **Found during:** Task 2, Step 4
- **Issue:** SessionItem now has an outer wrapper div (`relative overflow-hidden`) which broke tests checking `container.firstChild` for CSS classes
- **Fix:** Updated tests to query by `role="option"` instead of `firstChild`
- **Files modified:** `src/src/components/sidebar/SessionItem.test.tsx`
- **Commit:** `70fefdf`

**2. [Rule 3 - Blocking] Added required mocks for new hook imports**
- **Found during:** Task 2, Step 4
- **Issue:** SessionItem now imports useMobile, useSwipeToDelete, haptics -- tests fail without mocks
- **Fix:** Added vi.mock for useMobile, useSwipeToDelete, haptics in both SessionItem.test.tsx and SessionList.test.tsx
- **Files modified:** `SessionItem.test.tsx`, `SessionList.test.tsx`
- **Commit:** `70fefdf`

**3. [Rule 3 - Blocking] Migrated SessionList context menu tests from right-click to callback pattern**
- **Found during:** Task 2, Step 4
- **Issue:** Radix ContextMenu doesn't open on simulated right-click in jsdom (no pointer events API)
- **Fix:** Mocked SessionItemContextMenu as passthrough that captures callbacks, tests trigger callbacks directly
- **Files modified:** `SessionList.test.tsx`
- **Commit:** `70fefdf`

## Known Stubs

None -- all modules are fully wired with real implementations.

## Self-Check: PASSED

- All 12 files verified present on disk
- Both task commits verified in git log (696526f, 70fefdf)

---
*Phase: 67-ios-native-gestures*
*Completed: 2026-03-29*
