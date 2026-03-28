---
phase: 60-keyboard-composer
plan: 01
subsystem: mobile
tags: [capacitor, keyboard, ios, native-plugins, wkwebview]

# Dependency graph
requires:
  - phase: 59-capacitor-foundation
    provides: platform.ts with IS_NATIVE detection, @capacitor/core + @capacitor/ios
provides:
  - "@capacitor/keyboard installed and configured (resize mode None, accessory bar visible)"
  - "native-plugins.ts initialization module with getKeyboardModule export"
  - "nativePluginsReady promise for downstream hooks to await"
  - "data-native attribute on <html> for CSS conditional styling"
  - "CSS transition override for native keyboard animation"
affects: [60-02-keyboard-hook, mobile, ios]

# Tech tracking
tech-stack:
  added: ["@capacitor/keyboard@^7.0.6"]
  patterns: ["Module-level native plugin init with dynamic import behind IS_NATIVE guard", "data-native CSS attribute pattern for native-vs-web styling"]

key-files:
  created:
    - src/src/lib/native-plugins.ts
    - src/src/lib/native-plugins.test.ts
  modified:
    - src/package.json
    - src/src/main.tsx
    - src/src/styles/base.css

key-decisions:
  - "@capacitor/keyboard as devDependency (matches existing @capacitor/* convention -- Capacitor bundles at build time)"
  - "Dynamic import behind IS_NATIVE guard: zero web bundle impact, plugin only loads on native"
  - "data-native attribute pattern: CSS can conditionally style native vs web without JS class toggles"
  - "transition: none override inside matching media query scope to prevent double-animation jank"

patterns-established:
  - "Native plugin init pattern: module-scoped guard + dynamic import + readiness promise + _resetForTesting"
  - "vi.hoisted() for test mock objects referenced in vi.mock factories (avoids hoisting TDZ errors)"

requirements-completed: [KEY-01, KEY-05]

# Metrics
duration: 3min
completed: 2026-03-28
---

# Phase 60 Plan 01: Keyboard Plugin Foundation Summary

**Capacitor Keyboard plugin installed with native-plugins.ts init module -- resize mode None, accessory bar visible, readiness promise for downstream hooks, and conditional CSS transition override**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-28T02:22:41Z
- **Completed:** 2026-03-28T02:26:20Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Installed @capacitor/keyboard@^7.0.6 as devDependency with Keyboard resize mode set to None (app controls layout, not WKWebView)
- Created native-plugins.ts with dynamic import, init guard, getKeyboardModule export, and nativePluginsReady promise
- Wired initializeNativePlugins() into main.tsx before WebSocket init
- Added conditional CSS: `html[data-native] .app-shell { transition: none }` to prevent double-animation
- 7 passing tests covering init, skip-on-web, error fallback, data-native attribute, double-init guard, and readiness promise

## Task Commits

Each task was committed atomically:

1. **Task 1: Install @capacitor/keyboard and create native-plugins.ts** - `5411551` (feat)
2. **Task 2: Wire native-plugins into main.tsx, update base.css, and create tests** - `bbed686` (feat)

## Files Created/Modified
- `src/src/lib/native-plugins.ts` - Module-level Capacitor plugin init with dynamic import, readiness promise, and test reset
- `src/src/lib/native-plugins.test.ts` - 7 tests for native-plugins init behavior
- `src/package.json` - Added @capacitor/keyboard@^7.0.6 to devDependencies
- `src/src/main.tsx` - Added initializeNativePlugins() call before initializeWebSocket()
- `src/src/styles/base.css` - Keyboard avoidance CSS + native transition override

## Decisions Made
- @capacitor/keyboard installed as devDependency to match existing @capacitor/* convention (Capacitor bundles at build time)
- Dynamic import behind IS_NATIVE guard ensures zero web bundle impact
- data-native attribute on `<html>` provides CSS-only branching for native vs web
- Used vi.hoisted() pattern for test mocks to avoid vitest hoisting TDZ errors

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added keyboard avoidance CSS from main branch**
- **Found during:** Task 2 (base.css update)
- **Issue:** Plan referenced existing `@media (max-width: 767px) { .app-shell { padding-bottom ... } }` rule at lines 138-146, but worktree's base.css didn't have it (added by concurrent phase 59)
- **Fix:** Added both the keyboard avoidance padding-bottom rule AND the native transition override, matching main branch content
- **Files modified:** src/src/styles/base.css
- **Verification:** CSS rules present, full test suite green
- **Committed in:** bbed686 (Task 2 commit)

**2. [Rule 3 - Blocking] Brought platform.ts from main branch**
- **Found during:** Task 1 (native-plugins.ts creation)
- **Issue:** native-plugins.ts imports IS_NATIVE from @/lib/platform, but platform.ts was added in phase 59 and not present in worktree
- **Fix:** Checked out platform.ts and platform.test.ts from main branch
- **Files modified:** src/src/lib/platform.ts, src/src/lib/platform.test.ts
- **Verification:** Import resolves correctly, all tests pass
- **Committed in:** 5411551 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both were necessary to resolve missing dependencies from concurrent phase work. No scope creep.

## Issues Encountered
- vitest vi.mock factory hoisting caused TDZ error when referencing `platformMock` -- solved with `vi.hoisted()` pattern to declare mock objects in the hoisted scope

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- native-plugins.ts ready for Plan 02's useKeyboardOffset hook to consume via getKeyboardModule() and nativePluginsReady
- data-native attribute available for any future native-specific CSS rules
- All 1427 tests passing (zero regressions)

## Self-Check: PASSED

- [x] native-plugins.ts exists
- [x] native-plugins.test.ts exists
- [x] SUMMARY.md exists
- [x] Commit 5411551 found
- [x] Commit bbed686 found

---
*Phase: 60-keyboard-composer*
*Completed: 2026-03-28*
