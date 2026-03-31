---
phase: 68-scaffolding-design
plan: 01
subsystem: infra
tags: [npm-workspaces, zustand, factory-pattern, cross-platform, typescript, vitest]

# Dependency graph
requires: []
provides:
  - "@loom/shared npm workspace package"
  - "13 shared type files (platform-agnostic)"
  - "5 Zustand store factories with StateStorage adapter pattern"
  - "shared/ test suite (91 tests, Node environment)"
  - "npm workspace configuration at repo root"
affects: [68-02, 68-03, 68-04, 68-05, 68-06, 68-07, mobile]

# Tech tracking
tech-stack:
  added: ["@loom/shared workspace package"]
  patterns: ["Zustand factory pattern with StateStorage injection", "npm workspaces for monorepo code sharing", "React overrides for single-version resolution"]

key-files:
  created:
    - "shared/package.json"
    - "shared/tsconfig.json"
    - "shared/vitest.config.ts"
    - "shared/index.ts"
    - "shared/types/*.ts (13 files)"
    - "shared/stores/*.ts (5 files)"
    - "shared/__tests__/*.test.ts (5 files)"
    - "mobile/package.json"
  modified:
    - "package.json"
    - "package-lock.json"

key-decisions:
  - "Inline BackendEntry in shared/types/api.ts instead of importing from web-specific @/lib/transformMessages"
  - "Rename websocket ThinkingBlock to WsThinkingBlock to resolve export name collision with message.ts ThinkingBlock"
  - "Use named re-exports for websocket.ts in barrel to handle ThinkingBlock collision"
  - "Create mobile/package.json placeholder so npm workspace resolution succeeds"
  - "React overrides pin ^19.0.0 across all workspaces (single 19.2.4 resolution)"

patterns-established:
  - "Factory store pattern: createXxxStore(storage: StateStorage) for persisted, createXxxStore() for ephemeral"
  - "Mock StateStorage in tests: { getItem, setItem, removeItem } returning null/void"
  - "Fresh store instance per test via beforeEach to prevent state leakage"
  - "shared/ types use relative imports only (no @/ aliases, no platform deps)"

requirements-completed: [SCAFF-02, SCAFF-04]

# Metrics
duration: 12min
completed: 2026-03-31
---

# Phase 68 Plan 01: Shared Package Foundation Summary

**npm workspace with 13 platform-agnostic type files, 5 Zustand store factories using StateStorage injection, and 91-test shared suite**

## Performance

- **Duration:** 12 min
- **Started:** 2026-03-31T14:19:46Z
- **Completed:** 2026-03-31T14:32:00Z
- **Tasks:** 3
- **Files modified:** 26

## Accomplishments
- Created @loom/shared npm workspace package with zustand/immer as peerDependencies
- Extracted all 13 type files from src/src/types/ to shared/types/ with zero platform-specific code
- Refactored 5 Zustand stores into factory functions: 3 persisted (StateStorage adapter), 2 ephemeral (no args)
- Migrated 91 store tests to shared/__tests__/ using factory pattern with mock storage
- Configured npm workspaces with React 19 overrides for single-version resolution across all workspaces

## Task Commits

Each task was committed atomically:

1. **Task 1: Create npm workspace root and shared/ package skeleton** - `3e4c0d6` (feat)
2. **Task 2: Extract types and refactor Zustand stores to factory pattern** - `f542953` (feat)
3. **Task 3: Migrate store tests to shared/ and verify test suite** - `f9e5fa8` (test)

## Files Created/Modified
- `package.json` - Added workspaces array, React overrides, workspace scripts
- `shared/package.json` - @loom/shared package definition with peer deps
- `shared/tsconfig.json` - Strict TS config without DOM types
- `shared/vitest.config.ts` - Node environment test configuration
- `shared/index.ts` - Barrel export for all 13 type files and 5 store factories
- `shared/types/*.ts` (13 files) - Platform-agnostic type definitions
- `shared/stores/timeline.ts` - createTimelineStore(storage) factory with persist+immer
- `shared/stores/connection.ts` - createConnectionStore(storage) factory with persist
- `shared/stores/ui.ts` - createUIStore(storage) factory with persist+migrations
- `shared/stores/stream.ts` - createStreamStore() factory (ephemeral)
- `shared/stores/file.ts` - createFileStore() factory (ephemeral)
- `shared/__tests__/*.test.ts` (5 files) - 91 tests using factory pattern
- `mobile/package.json` - Placeholder for workspace resolution

## Decisions Made
- **Inlined BackendEntry:** The api.ts type originally imported from `@/lib/transformMessages` (web-only). Inlined the type definition in shared/types/api.ts so shared/ has zero web dependencies.
- **WsThinkingBlock rename:** Both message.ts and websocket.ts export `ThinkingBlock` with different shapes. Renamed the websocket version to `WsThinkingBlock` and used named re-exports in the barrel to avoid collision.
- **Mobile placeholder:** Created mobile/package.json so npm install succeeds with the workspaces array. The actual Expo project will replace this in plan 68-03.
- **React override strategy:** Used npm `overrides` with explicit `^19.0.0` (not `$react` syntax) since root had 18.x. Verified single 19.2.4 resolution via `npm why react`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created mobile/package.json placeholder**
- **Found during:** Task 1 (npm workspace setup)
- **Issue:** Plan lists `"mobile"` in workspaces array but mobile/ directory does not exist; npm install would fail
- **Fix:** Created mobile/package.json with minimal fields for workspace resolution
- **Files modified:** mobile/package.json
- **Verification:** npm install completes, npm ls @loom/shared resolves
- **Committed in:** 3e4c0d6 (Task 1 commit)

**2. [Rule 1 - Bug] Resolved ThinkingBlock export name collision**
- **Found during:** Task 2 (barrel export finalization)
- **Issue:** Both message.ts and websocket.ts export `ThinkingBlock` with incompatible shapes; `export *` from both would cause TypeScript error
- **Fix:** Renamed websocket's ThinkingBlock to WsThinkingBlock; used selective named re-exports for websocket.ts in barrel
- **Files modified:** shared/types/websocket.ts, shared/index.ts
- **Verification:** TypeScript compiles, all tests pass
- **Committed in:** f542953 (Task 2 commit)

**3. [Rule 2 - Missing Critical] Inlined BackendEntry type in shared/types/api.ts**
- **Found during:** Task 2 (types extraction)
- **Issue:** api.ts imported BackendEntry from `@/lib/transformMessages` which is a web-only module; shared/ cannot depend on web code
- **Fix:** Defined BackendEntry interface directly in shared/types/api.ts with all necessary sub-types
- **Files modified:** shared/types/api.ts
- **Verification:** No @/ imports in shared/, TypeScript compiles
- **Committed in:** f542953 (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (1 blocking, 1 bug, 1 missing critical)
**Impact on plan:** All auto-fixes necessary for correctness. No scope creep. The plan's intent is fully preserved.

## Issues Encountered
None beyond the auto-fixed deviations above.

## Known Stubs
None - all types and stores are fully functional with complete implementations.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- shared/ package is fully operational with 91 passing tests
- All subsequent plans in Phase 68 can import from @loom/shared
- Plan 68-02 (web rewiring) can update src/ imports to use @loom/shared
- Plan 68-03 (Expo scaffold) can reference shared/ in mobile/ workspace

## Self-Check: PASSED

- All 28 created files verified present on disk
- All 3 task commits verified in git log (3e4c0d6, f542953, f9e5fa8)
- 91/91 tests passing in shared/ vitest suite
- Zero platform-specific code in shared/ (import.meta, localStorage, window, document)

---
*Phase: 68-scaffolding-design*
*Completed: 2026-03-31*
