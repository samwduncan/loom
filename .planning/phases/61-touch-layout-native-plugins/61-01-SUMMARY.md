---
phase: 61-touch-layout-native-plugins
plan: 01
subsystem: native
tags: [capacitor, statusbar, splashscreen, ios, safe-area, overscroll, native-plugins]

requires:
  - phase: 60-keyboard-composer
    provides: "native-plugins.ts foundation with Keyboard init and nativePluginsReady promise"
  - phase: 59-platform-capacitor-foundation
    provides: "IS_NATIVE detection, platform.ts, capacitor.config.ts"
provides:
  - "StatusBar dark style + background color on native launch"
  - "SplashScreen connection-gated dismiss with 300ms fade and 3s fallback"
  - "hideSplashWhenReady() exported for main.tsx lifecycle"
  - "Overscroll prevention via overscroll-behavior: none"
  - "Safe-area insets on all four edges (top, bottom, left, right)"
affects: [63-bundled-assets, 62-spring-profiles]

tech-stack:
  added: ["@capacitor/status-bar@^7.0.6", "@capacitor/splash-screen@^7.0.5"]
  patterns: ["SS-7: separate try/catch per plugin for failure isolation", "SS-2: await nativePluginsReady before accessing cached modules", "SS-1: one-argument subscribe form for persist-only stores"]

key-files:
  created: []
  modified:
    - "src/src/lib/native-plugins.ts"
    - "src/src/lib/native-plugins.test.ts"
    - "src/capacitor.config.ts"
    - "src/src/main.tsx"
    - "src/src/styles/base.css"
    - "src/src/components/app-shell/AppShell.tsx"

key-decisions:
  - "SS-7: Each Capacitor plugin (Keyboard, StatusBar, SplashScreen) in its own try/catch -- failure in one cannot affect others"
  - "SS-2: hideSplashWhenReady() awaits nativePluginsReady to avoid cold-start race with fire-and-forget init"
  - "SS-1: One-argument subscribe form on persist-only store -- two-argument form silently fails"
  - "S-4: No touch-action: pan-y -- would break sidebar swipe and horizontal scroll on FollowUpPills"
  - "3s fallback timeout on splash dismiss -- user never stuck on splash even if connection fails"

patterns-established:
  - "SS-7: One try/catch per Capacitor plugin in initializeNativePlugins()"
  - "Connection-gated splash dismiss pattern: subscribe + getState immediate check + setTimeout fallback"
  - "Defensive safe-area CSS: env(safe-area-inset-*) values default to 0px when not applicable"

requirements-completed: [NATIVE-01, NATIVE-02, NATIVE-04, TOUCH-02, TOUCH-03]

duration: 3min
completed: 2026-03-28
---

# Phase 61 Plan 01: StatusBar + SplashScreen + Overscroll + Safe-Area Summary

**StatusBar dark style with SplashScreen connection-gated dismiss, iOS overscroll prevention, and four-edge safe-area coverage**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-28T04:47:34Z
- **Completed:** 2026-03-28T04:51:11Z
- **Tasks:** 2
- **Files modified:** 8 (6 source + package.json + package-lock.json)

## Accomplishments
- StatusBar configured with Dark style and #2b2521 background on native init, with isolated try/catch (SS-7)
- SplashScreen hides on WebSocket connection ready (300ms fade) with 3s fallback timeout, async-safe with nativePluginsReady await (SS-2)
- iOS page-level rubber-band overscroll prevented via overscroll-behavior: none on html and body
- Safe-area insets now cover all four edges: top (base.css), bottom (composer.css), left/right (AppShell)
- 18 tests covering all plugin init paths, failure isolation, dismiss guards, timer cleanup, and connection subscription

## Task Commits

Each task was committed atomically:

1. **Task 1: Install plugins, extend native-plugins.ts with StatusBar + SplashScreen, update capacitor.config.ts** - `5ef6d03` (feat)
2. **Task 2: Add overscroll prevention CSS and complete safe-area inset audit** - `a384635` (feat)

## Files Created/Modified
- `src/src/lib/native-plugins.ts` - Extended with StatusBar, SplashScreen init + hideSplashWhenReady()
- `src/src/lib/native-plugins.test.ts` - 18 tests (7 existing + 11 new) covering all plugin behaviors
- `src/capacitor.config.ts` - SplashScreen plugin config: launchAutoHide false, dark background
- `src/src/main.tsx` - hideSplashWhenReady() called after React mount
- `src/src/styles/base.css` - overscroll-behavior: none on html and body
- `src/src/components/app-shell/AppShell.tsx` - Left/right safe-area padding on grid div
- `src/package.json` - @capacitor/status-bar and @capacitor/splash-screen devDependencies
- `src/package-lock.json` - Lockfile updated

## Decisions Made
- SS-7: Each plugin gets its own try/catch -- StatusBar failure cannot null keyboardModule, keyboard failure cannot block StatusBar/SplashScreen
- SS-2: hideSplashWhenReady() is async and awaits nativePluginsReady before accessing splashModule (prevents cold-start race)
- SS-1: One-argument subscribe form on useConnectionStore (persist-only store, two-argument form silently fails)
- S-4: No touch-action: pan-y anywhere -- it breaks sidebar swipe-to-close and FollowUpPills horizontal scroll
- 3s fallback timeout ensures user is never stuck on splash screen even if WebSocket connection fails

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Known Stubs

None - all functionality is fully wired.

## Next Phase Readiness
- All native plugins (Keyboard, StatusBar, SplashScreen) initialized with failure isolation
- hideSplashWhenReady() lifecycle integrated into main.tsx
- Safe-area insets complete on all four edges
- Ready for Phase 61 Plan 02 (touch gestures / remaining native work)
- Phase 62 (spring profiles) can reference nativePluginsReady for timing
- Phase 63 (bundled assets) can rely on SplashScreen config being in place

## Self-Check: PASSED

- All 6 source files verified present
- Commit 5ef6d03 (Task 1) verified in git log
- Commit a384635 (Task 2) verified in git log
- 1451 tests pass across 140 files (zero regressions)

---
*Phase: 61-touch-layout-native-plugins*
*Completed: 2026-03-28*
