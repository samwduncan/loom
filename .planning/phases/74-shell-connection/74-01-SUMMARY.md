---
phase: 74-shell-connection
plan: 01
subsystem: ui
tags: [react-native, theme, jest, expo, nativewind-removal, createStyles]

# Dependency graph
requires:
  - phase: 68-expo-scaffold
    provides: "Expo scaffold, NativeWind primitives, shared/ extraction"
  - phase: 69-native-ui
    provides: "Phase 69 components and routes (deleted in this plan)"
provides:
  - "LoomTheme typed interface with colors, typography, spacing, springs, shadows, radii"
  - "theme.ts concrete values from Soul doc and colors.ts/springs.ts"
  - "createStyles(factory) pattern for StyleSheet.create with theme injection"
  - "Jest test infrastructure with jest-expo preset and native module mocks"
  - "Clean slate: no NativeWind, no Phase 69 UI code"
affects: [74-02, 74-03, 74-04, 75-chat-core, 76-session-interaction, 77-loom-integration]

# Tech tracking
tech-stack:
  added: ["@testing-library/react-native", "jest-expo (devDep)", "@types/jest (devDep)"]
  patterns: ["createStyles factory pattern for theme-aware StyleSheet.create"]

key-files:
  created:
    - mobile/theme/types.ts
    - mobile/theme/theme.ts
    - mobile/theme/createStyles.ts
    - mobile/jest.config.js
    - mobile/jest.setup.js
  modified:
    - mobile/package.json
    - mobile/metro.config.js
    - mobile/babel.config.js
    - mobile/app/_layout.tsx

key-decisions:
  - "Moved jest/jest-expo/@types/jest from dependencies to devDependencies for correctness"
  - "Added testPathIgnorePatterns for .reference/ to prevent Private Mind tests from running"

patterns-established:
  - "createStyles pattern: const styles = createStyles((t) => ({ ... })) at module scope for theme-aware styling"
  - "Jest mock pattern: Reanimated setUpTests first, then jest.mock for native modules"

requirements-completed: []

# Metrics
duration: 4min
completed: 2026-04-03
---

# Phase 74 Plan 01: Clean Slate Summary

**NativeWind fully removed, 34 Phase 69 files deleted, LoomTheme system with createStyles factory pattern established, Jest test infrastructure configured with native module mocks**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-03T18:40:51Z
- **Completed:** 2026-04-03T18:44:51Z
- **Tasks:** 2
- **Files modified:** 41 changed (Task 1) + 8 created (Task 2) = 49 total

## Accomplishments
- NativeWind completely purged from all config files and package.json (metro.config.js, babel.config.js, global.css, tailwind.config.js deleted)
- All 26 Phase 69 component files and 8 route screen files deleted, replaced with minimal _layout.tsx placeholder
- Complete LoomTheme type system with 60+ design tokens: 4 surfaces, accent/destructive/success, 3 text levels, 2 border levels, 3 background states, 4 typography scales, 7 spacing values, 6 spring configs, 4 shadow presets, 5 border radii
- createStyles factory pattern ready for all future components
- Jest configured with jest-expo preset, Reanimated mock, and 5 native module mocks (SecureStore, Haptics, MMKV, Blur, KeyboardController)

## Task Commits

Each task was committed atomically:

1. **Task 1: NativeWind removal + Phase 69 code deletion** - `c8e117f` (feat)
2. **Task 2: Theme system + createStyles pattern + Jest config** - `83127e8` (feat)

## Files Created/Modified
- `mobile/theme/types.ts` - LoomTheme TypeScript interface with full design token type definitions
- `mobile/theme/theme.ts` - Concrete theme object importing from colors.ts and springs.ts
- `mobile/theme/createStyles.ts` - StyleSheet.create factory with theme injection
- `mobile/jest.config.js` - Jest config with jest-expo preset, .reference/ excluded
- `mobile/jest.setup.js` - Test mocks for Reanimated, SecureStore, Haptics, MMKV, Blur, KeyboardController
- `mobile/package.json` - NativeWind removed, test deps moved to devDependencies
- `mobile/metro.config.js` - withNativeWind wrapper removed, monorepo resolution preserved
- `mobile/babel.config.js` - NativeWind presets removed, reanimated plugin preserved
- `mobile/app/_layout.tsx` - Rewritten to minimal placeholder

## Decisions Made
- Moved jest, jest-expo, @types/jest from dependencies to devDependencies (they were incorrectly placed in production deps from Phase 68)
- Added testPathIgnorePatterns for .reference/ directory to prevent Private Mind's test files from being discovered by Jest

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added testPathIgnorePatterns to exclude .reference/ from Jest**
- **Found during:** Task 2 (Jest configuration)
- **Issue:** Jest was discovering and running tests from mobile/.reference/private-mind/__tests__/ directory, causing failures due to missing dependencies
- **Fix:** Added `testPathIgnorePatterns: ['/node_modules/', '/.reference/']` to jest.config.js
- **Files modified:** mobile/jest.config.js
- **Verification:** `npx jest --passWithNoTests --silent` exits 0
- **Committed in:** 83127e8 (Task 2 commit)

**2. [Rule 1 - Bug] Moved test dependencies from dependencies to devDependencies**
- **Found during:** Task 1 (package.json cleanup)
- **Issue:** @types/jest, jest, and jest-expo were listed in production dependencies instead of devDependencies
- **Fix:** Moved all three to devDependencies section
- **Files modified:** mobile/package.json
- **Verification:** package.json devDependencies contains all test packages
- **Committed in:** c8e117f (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both fixes were necessary for correctness. No scope creep.

## Issues Encountered
- npm install initially failed with peer dependency conflict -- resolved with `--legacy-peer-deps` flag (consistent with existing monorepo pattern)

## Known Stubs
None -- this plan establishes infrastructure only, no UI rendering stubs.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Theme system ready for Plan 02 (auth gate + connection banner) to import `createStyles` and `theme`
- Jest ready for Plan 02+ test files in `__tests__/{hooks,lib,theme}/`
- _layout.tsx placeholder ready for Plan 02 to rewrite with full auth gate
- All hooks, lib files, and stores preserved intact for reuse

## Self-Check: PASSED
- All 8 created files found on disk
- All 4 deleted paths confirmed absent
- Both commit hashes (c8e117f, 83127e8) verified in git log

---
*Phase: 74-shell-connection*
*Completed: 2026-04-03*
