---
phase: 74-shell-connection
plan: 04
subsystem: ui
tags: [react-native, connection-banner, websocket, jest, mmkv, reanimated, glass-surface, haptics]

# Dependency graph
requires:
  - phase: 74-shell-connection
    plan: 01
    provides: "LoomTheme system, createStyles factory, Jest config"
  - phase: 74-shell-connection
    plan: 02
    provides: "Root layout with auth gate, WebSocket init, useAuth hook"
  - phase: 74-shell-connection
    plan: 03
    provides: "Drawer navigation, chat screen, session list"
provides:
  - "ConnectionBanner glass overlay with cold-start guard (D-12, D-13)"
  - "D-14 MMKV background stream snapshot verified (data layer for CONN-06)"
  - "16 unit tests: useAuth (6), useConnection (4), websocket-init (6)"
  - "Jest monorepo fixes: worklets mock, React resolution, immer transform"
affects: [75-chat-core, 76-session-interaction, 77-loom-integration]

# Tech tracking
tech-stack:
  added: ["react-native-worklets (reanimated 4.x peer dep)"]
  patterns:
    - "Jest monorepo pattern: modulePaths + moduleNameMapper for React resolution to avoid dual-copy issues"
    - "AppState mock pattern: intercept addEventListener in jest.setup.js, capture callback in beforeEach"
    - "Cold-start guard: useRef(false) set true on first isConnected, banner only shows after first connection"

key-files:
  created:
    - mobile/components/connection/ConnectionBanner.tsx
    - mobile/__tests__/hooks/useAuth.test.ts
    - mobile/__tests__/hooks/useConnection.test.ts
    - mobile/__tests__/lib/websocket-init.test.ts
  modified:
    - mobile/app/_layout.tsx
    - mobile/jest.config.js
    - mobile/jest.setup.js
    - mobile/package.json

key-decisions:
  - "RNTL_SKIP_DEPS_CHECK=1 to bypass strict peer dep check in monorepo (root react@19.2.4 vs mobile react@19.1.0)"
  - "react-native-worklets mock with all 12 symbols required by reanimated 4.x in jest.setup.js"
  - "D-14 verified as already implemented from Phase 69 -- no code changes needed, only test verification"
  - "moduleNameMapper forces react and react-test-renderer to resolve from mobile/node_modules"

patterns-established:
  - "ConnectionBanner cold-start guard: hasConnectedOnce useRef prevents banner flash before first WS connection"
  - "Jest websocket-init test pattern: mock stores/auth/platform, intercept AppState.addEventListener, use fake timers for 30s grace period"

requirements-completed: [CONN-04, CONN-05]

# Metrics
duration: 11min
completed: 2026-04-03
---

# Phase 74 Plan 04: Connection & Testing Summary

**ConnectionBanner glass overlay with cold-start guard and pulsing reconnect animation, D-14 MMKV snapshot data layer verified, and 16 unit tests covering auth flow, connection state, and WebSocket lifecycle including background stream persistence**

## Performance

- **Duration:** 11 min
- **Started:** 2026-04-03T18:56:40Z
- **Completed:** 2026-04-03T19:07:40Z
- **Tasks:** 3 (1 component, 1 verification, 1 test suite)
- **Files modified:** 8 (4 created, 4 modified)

## Accomplishments
- ConnectionBanner (165 lines) with BlurView glass surface, cold-start guard (D-13), Navigation spring slide animation, pulsing reconnect icon, success haptic on reconnect, absolute positioning (no layout push)
- D-14 MMKV background stream snapshot fully verified: saveStreamSnapshot on background during streaming, getStreamSnapshot/clearStreamSnapshot exports, streamContentAccumulator lifecycle -- all present from Phase 69 implementation
- 16 unit tests across 3 test files: useAuth (6 covering checkAuth/login/logout), useConnection (4 covering all status states + error), websocket-init (6 covering init/double-init/disconnect/background/foreground/D-14 snapshot)
- Jest infrastructure hardened for monorepo: react-native-worklets mock, React dual-copy resolution, immer ESM transform, RNTL peer dep bypass

## Task Commits

Each task was committed atomically:

1. **Task 1: ConnectionBanner + root layout wiring** - `49b41dd` (feat)
2. **Task 2: D-14 MMKV verification** - no commit (verification only, all code already present)
3. **Task 3: Unit tests for auth, connection, WebSocket** - `634cd22` (test)

## Files Created/Modified
- `mobile/components/connection/ConnectionBanner.tsx` - Glass overlay banner with cold-start guard, spring animation, haptic feedback
- `mobile/app/_layout.tsx` - Added ConnectionBanner import and render in authenticated branch
- `mobile/__tests__/hooks/useAuth.test.ts` - 6 tests: checkAuth (stored/missing token), login (success/invalid/network error), logout (deleteItemAsync)
- `mobile/__tests__/hooks/useConnection.test.ts` - 4 tests: connected, reconnecting, disconnected, error passthrough
- `mobile/__tests__/lib/websocket-init.test.ts` - 6 tests: init, double-init guard, disconnect, background 30s timer, foreground reconnect, D-14 MMKV snapshot
- `mobile/jest.config.js` - RNTL_SKIP_DEPS_CHECK, modulePaths, moduleNameMapper for React, immer/zustand transform
- `mobile/jest.setup.js` - react-native-worklets mock (12 symbols), AppState.addEventListener setup
- `mobile/package.json` - react-native-worklets dependency added

## Decisions Made
- **RNTL_SKIP_DEPS_CHECK=1**: The monorepo has react@19.2.4 at root (web app) and react@19.1.0 in mobile (Expo SDK pinned). @testing-library/react-native does a strict equality check that fails. The versions are ABI-compatible; skip is safe.
- **React moduleNameMapper**: Forces react, react-test-renderer to resolve from mobile/node_modules to prevent dual React copy (which breaks useState in hooks).
- **D-14 already implemented**: websocket-init.ts from Phase 69 already had the complete MMKV snapshot implementation (saveStreamSnapshot, getStreamSnapshot, clearStreamSnapshot, streamContentAccumulator lifecycle). No code changes needed -- just test verification.
- **react-native-worklets added**: Reanimated 4.1.7 requires worklets as a peer dependency. The jest.setup.js mock provides all 12 symbols reanimated imports from it.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] react-native-worklets missing for reanimated 4.x**
- **Found during:** Task 3 (Jest test execution)
- **Issue:** Reanimated 4.1.7 imports `react-native-worklets` which wasn't installed. Babel plugin and setUpTests() both failed.
- **Fix:** Added comprehensive worklets mock to jest.setup.js with all 12 required symbols (createSerializable, isWorkletFunction, runOnUI, runOnJS, makeShareable, etc.)
- **Files modified:** mobile/jest.setup.js, mobile/package.json
- **Verification:** All test suites load without module resolution errors
- **Committed in:** 634cd22 (Task 3 commit)

**2. [Rule 3 - Blocking] Monorepo React dual-copy issue**
- **Found during:** Task 3 (useAuth/useConnection test execution)
- **Issue:** @testing-library/react-native resolved from root node_modules, loaded root's react@19.2.4, while hooks used mobile's react@19.1.0. Two React copies = "Cannot read properties of null (reading 'useState')"
- **Fix:** Added moduleNameMapper in jest.config.js to force react and react-test-renderer to resolve from mobile/node_modules. Added RNTL_SKIP_DEPS_CHECK=1 to bypass strict version equality check.
- **Files modified:** mobile/jest.config.js
- **Verification:** All 16 tests pass with single React copy
- **Committed in:** 634cd22 (Task 3 commit)

**3. [Rule 3 - Blocking] immer ESM export syntax not transformed by Jest**
- **Found during:** Task 3 (useConnection test execution)
- **Issue:** Zustand middleware imports immer which uses ESM `export` syntax. Jest's default transform excluded it, causing SyntaxError.
- **Fix:** Added `immer|zustand` to transformIgnorePatterns exception list
- **Files modified:** mobile/jest.config.js
- **Verification:** useConnection tests load and pass
- **Committed in:** 634cd22 (Task 3 commit)

---

**Total deviations:** 3 auto-fixed (all blocking issues with Jest infrastructure in monorepo)
**Impact on plan:** All fixes were necessary for test execution. No scope creep -- fixes are standard monorepo Jest configuration patterns.

## Issues Encountered
- react-test-renderer version mismatch: root has react@19.2.4, mobile has react@19.1.0. Resolved via moduleNameMapper to force mobile's React copy.
- @testing-library/react-native hoisted to root node_modules instead of mobile's. Resolved by setting RNTL_SKIP_DEPS_CHECK and using modulePaths.

## Known Stubs
None -- ConnectionBanner reads real state from useConnection hook. Test files exercise real hook/store logic.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 74 complete: theme system, auth gate, drawer navigation, connection banner, and 16 unit tests
- Jest infrastructure fully configured for mobile monorepo (future test files can be added without setup)
- ConnectionBanner wired and ready for real device verification in Phase 75+
- D-14 data layer ready for Phase 77 (CONN-06 interrupted stream UI indicator)
- All hooks and stores have test coverage for regression detection

## Self-Check: PASSED
- All 4 created files found on disk
- Both commit hashes (49b41dd, 634cd22) verified in git log

---
*Phase: 74-shell-connection*
*Completed: 2026-04-03*
