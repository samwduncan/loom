---
phase: 68-scaffolding-design
plan: 03
subsystem: infra
tags: [expo, react-native, expo-router, nativewind, mmkv, secure-store, drawer-navigation]

# Dependency graph
requires:
  - "68-01: @loom/shared npm workspace with store factories"
  - "68-02: shared/lib/ modules (auth, api-client, websocket-client)"
provides:
  - "Expo SDK 54 app scaffold in mobile/ with file-based routing"
  - "Drawer+Stack navigation with 7 route files"
  - "MMKV StateStorage adapter for Zustand persist on native"
  - "SecureStore AuthProvider for JWT token storage (sync APIs)"
  - "5 Zustand store instances wired to @loom/shared factory functions"
  - "EAS build configuration (development, development-simulator, preview, production)"
  - "Metro config for monorepo workspace resolution"
affects: [68-04, 68-05, 68-06, 69, 70, 71, 72, mobile]

# Tech tracking
tech-stack:
  added: ["expo ~54.0.33", "expo-router ~5.0.7", "nativewind ^4.1.23", "react-native-mmkv ^3.2.0", "expo-secure-store ~14.2.3", "react-native-reanimated ~3.19.5", "@react-navigation/drawer ^7.3.9", "expo-dev-client ~5.1.8", "expo-haptics ~14.1.4", "expo-blur ~14.1.5", "tailwindcss 3.4.17 (devDep)", "eas-cli 18.4.0 (global)"]
  patterns: ["Expo Router file-based Drawer+Stack navigation", "MMKV StateStorage adapter for Zustand persist", "SecureStore sync API for AuthProvider", "Monorepo Metro config with watchFolders + nodeModulesPaths", "Inline styles for colors before NativeWind custom tokens configured"]

key-files:
  created:
    - "mobile/package.json"
    - "mobile/app.json"
    - "mobile/eas.json"
    - "mobile/tsconfig.json"
    - "mobile/babel.config.js"
    - "mobile/metro.config.js"
    - "mobile/global.css"
    - "mobile/nativewind-env.d.ts"
    - "mobile/lib/platform.ts"
    - "mobile/lib/storage-adapter.ts"
    - "mobile/lib/auth-provider.ts"
    - "mobile/stores/index.ts"
    - "mobile/app/_layout.tsx"
    - "mobile/app/(drawer)/_layout.tsx"
    - "mobile/app/(drawer)/index.tsx"
    - "mobile/app/(drawer)/settings.tsx"
    - "mobile/app/(stack)/_layout.tsx"
    - "mobile/app/(stack)/chat/[id].tsx"
    - "mobile/app/(stack)/notifications.tsx"
  modified:
    - "mobile/package.json (replaced placeholder)"
    - "package-lock.json"

key-decisions:
  - "Used react-native-reanimated 3.19.5 (not v4) -- v4 requires react-native-worklets peer dep, v3 has simpler dep tree and full @react-navigation/drawer compatibility"
  - "Expo SDK 54 (not 55) -- 54 is latest stable from create-expo-app template; plan referenced 55 which does not exist"
  - "Metro watchFolders includes monorepo root for shared/ workspace live updates"
  - "expo-router entry point (main: expo-router/entry) replaces default App.tsx/index.ts for file-based routing"
  - "Placeholder screens use inline styles for colors -- NativeWind custom tokens not configured until Plan 04"
  - "EAS projectId left as TBD -- requires eas login + eas init (auth gate for human)"

patterns-established:
  - "MMKV StateStorage adapter: 6-line wrapper mapping MMKV getString/set/delete to Zustand's getItem/setItem/removeItem"
  - "SecureStore AuthProvider: synchronous getItem/setItem/deleteItem APIs (not async versions)"
  - "Expo Router Drawer+Stack pattern: root _layout.tsx with Drawer wrapping (drawer) and (stack) groups"
  - "Placeholder screen pattern: SafeAreaView edges=['bottom'] + centered View with heading + muted body text"

requirements-completed: [SCAFF-01, SCAFF-03]

# Metrics
duration: 6min
completed: 2026-03-31
---

# Phase 68 Plan 03: Expo App Scaffold + Navigation Summary

**Expo SDK 54 app with Drawer+Stack file-based routing, MMKV storage adapter, SecureStore auth, and 5 shared/ store instances -- 19 files, ready for EAS build**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-31T14:55:25Z
- **Completed:** 2026-03-31T15:01:56Z
- **Tasks:** 2 of 2 auto tasks completed (checkpoint auto-approved)
- **Files modified:** 19

## Accomplishments
- Created full Expo SDK 54 app in mobile/ with file-based Expo Router navigation
- Scaffolded 7 route files: root drawer layout, drawer index/settings screens, stack layout, chat/[id]/notifications screens
- Wired 5 Zustand store instances to @loom/shared factory functions via MMKV StateStorage adapter
- Configured NativeWind v4 + Tailwind v3 build tooling (babel, metro, global.css)
- Set up EAS build profiles for development, simulator, preview, and production
- Metro configured for monorepo with watchFolders and nodeModulesPaths for shared/ resolution
- Web regression gate passed: 1548 tests, all passing

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Expo app, install dependencies, configure build tooling** - `7b31b3c` (feat)
2. **Task 2: Scaffold Expo Router Drawer+Stack navigation with placeholder screens** - `e38ad3d` (feat)

## Files Created/Modified
- `mobile/package.json` - @loom/mobile workspace package with all Expo + RN deps
- `mobile/app.json` - Expo config: Loom, dark mode, com.siteboon.loom bundle ID
- `mobile/eas.json` - 4 EAS build profiles (dev, dev-simulator, preview, production)
- `mobile/tsconfig.json` - Strict TS with @loom/shared path mapping
- `mobile/babel.config.js` - NativeWind + expo preset with JSX import source
- `mobile/metro.config.js` - Monorepo-aware Metro config with NativeWind
- `mobile/global.css` - Tailwind v3 directives for NativeWind
- `mobile/nativewind-env.d.ts` - NativeWind type declarations
- `mobile/lib/platform.ts` - API_BASE, WS_BASE, resolveApiUrl, resolveWsUrl(path, token)
- `mobile/lib/storage-adapter.ts` - MMKV StateStorage adapter for Zustand persist
- `mobile/lib/auth-provider.ts` - SecureStore AuthProvider (sync APIs)
- `mobile/stores/index.ts` - 5 store hooks using @loom/shared factory functions
- `mobile/app/_layout.tsx` - Root Drawer layout with GestureHandlerRootView
- `mobile/app/(drawer)/_layout.tsx` - Drawer screens (index + settings)
- `mobile/app/(drawer)/index.tsx` - Session list placeholder ("No sessions yet")
- `mobile/app/(drawer)/settings.tsx` - Settings placeholder ("Phase 70")
- `mobile/app/(stack)/_layout.tsx` - Stack navigator with dark header
- `mobile/app/(stack)/chat/[id].tsx` - Chat screen placeholder
- `mobile/app/(stack)/notifications.tsx` - Notifications placeholder ("Phase 72")

## Decisions Made
- **Reanimated v3 over v4:** react-native-reanimated 4.x requires react-native-worklets as a peer dependency. v3.19.5 has a simpler dependency tree, is fully compatible with @react-navigation/drawer >= 2.0.0, and avoids adding another native module. Upgrade to v4 can be done later if worklets features are needed.
- **Expo SDK 54 (not 55):** The plan referenced SDK 55 which does not exist. create-expo-app@latest generates SDK 54 which is the current stable release.
- **Inline styles for colors:** Plan correctly specified inline styles (not NativeWind custom token classes) since tailwind.config.js with custom color tokens is not created until Plan 04. All colors use raw rgb() values matching the design spec.
- **Metro monorepo config:** Added watchFolders pointing to monorepo root and nodeModulesPaths for both mobile and root node_modules. This ensures shared/ imports resolve correctly and Metro watches for changes in shared/ during development.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed react-native-reanimated version (v4 -> v3)**
- **Found during:** Task 1 (npm install)
- **Issue:** Plan specified `~3.17.8` which does not exist; reanimated is on v4.x. v4.x requires react-native-worklets peer dep causing ERESOLVE errors
- **Fix:** Used react-native-reanimated@~3.19.5 (latest v3 stable) which has clean peer deps
- **Files modified:** mobile/package.json
- **Verification:** npm install completes cleanly, no peer dep conflicts
- **Committed in:** 7b31b3c (Task 1 commit)

**2. [Rule 3 - Blocking] Added missing expo-constants and expo-linking deps**
- **Found during:** Task 1 (dependency resolution)
- **Issue:** expo-router@5.0.7 has peerDependencies on expo-constants and expo-linking which were not in the plan's dependency list
- **Fix:** Added expo-constants@~17.1.6 and expo-linking@~7.1.5 to mobile/package.json
- **Files modified:** mobile/package.json
- **Verification:** npm install completes, expo-router peer deps satisfied
- **Committed in:** 7b31b3c (Task 1 commit)

**3. [Rule 3 - Blocking] Added react-native-screens dep**
- **Found during:** Task 1 (dependency resolution)
- **Issue:** @react-navigation/drawer requires react-native-screens >= 4.0.0 as peer dep
- **Fix:** Added react-native-screens@~4.11.1 to mobile/package.json
- **Files modified:** mobile/package.json
- **Verification:** npm install completes, no peer dep warnings for screens
- **Committed in:** 7b31b3c (Task 1 commit)

---

**Total deviations:** 3 auto-fixed (3 blocking -- dependency version corrections)
**Impact on plan:** All fixes necessary for npm install to succeed. No functional scope creep. The plan's architecture and intent are fully preserved.

## EAS Build Steps (Requires Human Action)

The following steps require Expo account authentication and Apple Developer enrollment:

1. **Login to Expo:** `cd mobile && eas login` (requires Expo account credentials)
2. **Initialize project:** `cd mobile && eas init` (links to Expo account, generates projectId)
3. **Update app.json:** Replace `"TBD_AFTER_EAS_INIT"` with actual projectId from eas init
4. **Register device:** `eas device:create` (registers iPhone 16 Pro Max UDID for ad-hoc)
5. **Build:** `cd mobile && eas build --profile development --platform ios`
6. **Install:** Download and install via EAS build link on device
7. **Connect Metro:** `cd mobile && REACT_NATIVE_PACKAGER_HOSTNAME=100.86.4.57 npx expo start --dev-client`

## Known Stubs

**1. EAS projectId placeholder**
- **File:** mobile/app.json, line 24
- **Value:** `"projectId": "TBD_AFTER_EAS_INIT"`
- **Reason:** Requires `eas init` which needs Expo account login (auth gate)
- **Resolution:** Will be set when user runs `eas login && eas init` in mobile/

## Issues Encountered
None beyond the auto-fixed dependency version corrections above.

## User Setup Required

**EAS build and device testing require manual steps.** The code scaffold is complete but the following external actions are needed:

1. **Expo account login:** `cd mobile && eas login`
2. **EAS project initialization:** `cd mobile && eas init` (updates projectId in app.json)
3. **Apple Developer enrollment:** Must be completed for ad-hoc distribution builds
4. **Device registration:** `eas device:create` to register iPhone UDID
5. **Build submission:** `eas build --profile development --platform ios`

## Next Phase Readiness
- mobile/ scaffold is complete with all 19 files
- All 5 shared/ store instances are wired and importable
- Plan 04 (NativeWind custom tokens + tailwind.config.js) can proceed immediately
- EAS build/device testing can happen independently in parallel with Plan 04-06

## Self-Check: PASSED

- All 19 created files verified present on disk
- All 2 task commits verified in git log (7b31b3c, e38ad3d)
- Web regression gate: 1548/1548 tests passing
- 1 known stub: EAS projectId (auth gate -- requires eas login)

---
*Phase: 68-scaffolding-design*
*Completed: 2026-03-31*
