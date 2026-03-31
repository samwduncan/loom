---
phase: 68-scaffolding-design
plan: 02
subsystem: infra
tags: [shared-code, factory-pattern, api-client, websocket, auth-provider, dependency-injection]

# Dependency graph
requires:
  - "68-01: @loom/shared npm workspace with 13 type files and 5 store factories"
provides:
  - "5 shared/lib/ modules: auth, api-client, websocket-client, stream-multiplexer, tool-registry-types"
  - "Web app fully rewired to import from @loom/shared"
  - "AuthProvider interface for platform-agnostic token storage"
  - "createApiClient factory with dependency injection (auth, URL resolver, onAuthRefresh)"
  - "WebSocketClient class with constructor-injected resolveWsUrl(path, token) and AuthProvider"
  - "D-06 regression gate: 1548 tests pass, vite build succeeds"
affects: [68-03, 68-04, 68-05, 68-06, mobile]

# Tech tracking
tech-stack:
  added: []
  patterns: ["AuthProvider interface for platform-agnostic auth", "createApiClient factory with onAuthRefresh callback injection", "WebSocketClient constructor injection replacing module-level platform imports", "Type re-export pattern for backward compatibility (src/types/* -> shared/types/*)"]

key-files:
  created:
    - "shared/lib/auth.ts"
    - "shared/lib/api-client.ts"
    - "shared/lib/websocket-client.ts"
    - "shared/lib/stream-multiplexer.ts"
    - "shared/lib/tool-registry-types.ts"
    - "shared/__tests__/api-client.test.ts"
    - "shared/__tests__/stream-multiplexer.test.ts"
  modified:
    - "shared/index.ts"
    - "src/vite.config.ts"
    - "src/package.json"
    - "src/src/stores/timeline.ts"
    - "src/src/stores/stream.ts"
    - "src/src/stores/connection.ts"
    - "src/src/stores/ui.ts"
    - "src/src/stores/file.ts"
    - "src/src/lib/auth.ts"
    - "src/src/lib/api-client.ts"
    - "src/src/lib/websocket-client.ts"
    - "src/src/lib/stream-multiplexer.ts"
    - "src/src/lib/tool-registry.ts"
    - "src/src/types/*.ts (13 files)"
    - "src/src/lib/api-client.test.ts"
    - "src/src/lib/websocket-client.test.ts"

key-decisions:
  - "WsConnectionState renamed from ConnectionState in shared/ to avoid collision with Zustand ConnectionState; web re-exports as ConnectionState alias"
  - "ToolConfig in shared/ uses `unknown` for icon/renderCard fields since React ComponentType is web-only; web defines its own ToolConfig with proper React types"
  - "Tool chip label helpers extracted to shared/ (bashChipLabel, filePathChipLabel, etc) since they are pure string functions"
  - "Type files converted to re-exports rather than deleted, preserving all @/types/* import paths across web codebase"
  - "WebSocketClient now requires constructor options (breaking change from no-arg constructor); tests updated with mock injections"

patterns-established:
  - "AuthProvider interface: { getToken, setToken, clearToken } -- web uses localStorage, native will use Keychain"
  - "API client factory: createApiClient({ auth, resolveUrl, onAuthRefresh }) returns { apiFetch, clearInflightRequests }"
  - "WebSocket client injection: new WebSocketClient({ resolveWsUrl, auth }) -- no module-level platform imports"
  - "Type re-export pattern: src/src/types/xxx.ts = export * from '@loom/shared/types/xxx'"
  - "Store thin wrapper: import factory from shared, pass localStorage adapter, export hook + re-export types"

requirements-completed: [SCAFF-02, SCAFF-04]

# Metrics
duration: 15min
completed: 2026-03-31
---

# Phase 68 Plan 02: Shared Library Extraction + Web Rewiring Summary

**5 shared/lib/ modules (auth, API client, WebSocket, multiplexer, tool registry types) with dependency injection, web app fully rewired to @loom/shared, 1548 tests passing**

## Performance

- **Duration:** 15 min
- **Started:** 2026-03-31T14:35:24Z
- **Completed:** 2026-03-31T14:50:46Z
- **Tasks:** 2
- **Files modified:** 36

## Accomplishments
- Extracted 5 platform-agnostic library modules to shared/lib/ with zero DOM, window, or import.meta references
- Rewired entire web app (5 stores, 5 lib files, 13 type files) to import from @loom/shared
- Preserved complete backward compatibility: all existing `@/stores/*`, `@/types/*`, and `@/lib/*` imports work unchanged
- D-06 regression gate satisfied: 149 test files (1548 tests) pass, vite production build succeeds
- Added 52 new tests for shared api-client and stream-multiplexer

## Task Commits

Each task was committed atomically:

1. **Task 1: Extract shared/lib/ modules and split tool registry** - `bd0086a` (feat)
2. **Task 2: Rewire web app imports to @loom/shared and run regression gate** - `c225827` (feat)

## Files Created/Modified
- `shared/lib/auth.ts` - AuthProvider interface for platform-agnostic token storage
- `shared/lib/api-client.ts` - createApiClient factory with injected auth, URL resolver, onAuthRefresh
- `shared/lib/websocket-client.ts` - WebSocketClient class with constructor injection
- `shared/lib/stream-multiplexer.ts` - Pure function message router (zero platform deps)
- `shared/lib/tool-registry-types.ts` - ToolCardProps, ToolConfig interfaces, chip label helpers
- `shared/__tests__/api-client.test.ts` - 28 tests for factory-based API client
- `shared/__tests__/stream-multiplexer.test.ts` - 24 tests for stream multiplexer
- `shared/index.ts` - Added lib barrel exports
- `src/vite.config.ts` - Added @loom/shared resolve alias
- `src/package.json` - Added @loom/shared workspace dependency
- `src/src/stores/*.ts` (5 files) - Thin wrappers calling shared/ factory functions
- `src/src/lib/auth.ts` - Added webAuthProvider + AuthProvider import
- `src/src/lib/api-client.ts` - Thin wrapper using createApiClient from shared/
- `src/src/lib/websocket-client.ts` - Singleton wsClient with injected deps
- `src/src/lib/stream-multiplexer.ts` - Re-export from @loom/shared
- `src/src/lib/tool-registry.ts` - Imports chip label helpers from shared/, keeps React components
- `src/src/types/*.ts` (13 files) - Re-exports from @loom/shared/types/*
- `src/src/lib/api-client.test.ts` - Updated mocks for new module structure
- `src/src/lib/websocket-client.test.ts` - Updated constructor to pass options

## Decisions Made
- **WsConnectionState naming**: Shared WebSocket client exports `WsConnectionState` to avoid naming collision with the Zustand `ConnectionState` type. Web re-exports it as `ConnectionState` for backward compat.
- **ToolConfig icon/renderCard as unknown**: Shared ToolConfig uses `unknown` for platform-specific fields (React ComponentType on web, something else on native). Each platform narrows these types.
- **Type re-export pattern**: Rather than updating hundreds of component imports from `@/types/*`, made each type file a `export * from '@loom/shared/types/*'` re-export. Zero consumer changes needed.
- **vi.hoisted() for test mocks**: API client test needed `vi.hoisted()` to make mock functions available during vi.mock() factory hoisting -- standard Vitest pattern for module-level mock injection.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed api-client.test.ts vi.mock hoisting issue**
- **Found during:** Task 2 (regression gate)
- **Issue:** `vi.mock()` factories are hoisted in Vitest, so `const mockGetToken = vi.fn()` was not yet defined when the mock factory ran
- **Fix:** Used `vi.hoisted()` to make mock functions available during hoisting
- **Files modified:** src/src/lib/api-client.test.ts
- **Verification:** All 28 api-client tests pass
- **Committed in:** c225827 (Task 2 commit)

**2. [Rule 1 - Bug] Updated websocket-client.test.ts for constructor options**
- **Found during:** Task 2 (regression gate)
- **Issue:** Test created `new WebSocketClient()` without args, but shared version requires `{ resolveWsUrl, auth }` options
- **Fix:** Passed mock resolveWsUrl and auth to constructor in test setup
- **Files modified:** src/src/lib/websocket-client.test.ts
- **Verification:** All 34 websocket-client tests pass
- **Committed in:** c225827 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Both fixes were necessary due to the constructor signature change. No scope creep. The test changes are the expected consequence of the refactoring.

## Issues Encountered
None beyond the auto-fixed test updates above.

## Known Stubs
None - all shared modules are fully functional with complete implementations.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- shared/ package has 143 tests passing (91 store + 52 lib)
- Web app has 1548 tests passing with all imports pointing to @loom/shared
- Plan 68-03 (Expo scaffold) can import from @loom/shared in mobile/ workspace
- Plan 68-04 can build on the AuthProvider and createApiClient patterns for native

## Self-Check: PASSED

- All 7 created files verified present on disk
- All 2 task commits verified in git log (bd0086a, c225827)
- 143/143 tests passing in shared/ vitest suite
- 1548/1548 tests passing in web vitest suite
- Vite production build succeeds
- Zero platform-specific code in shared/lib/ (import.meta, localStorage, window, document)

---
*Phase: 68-scaffolding-design*
*Completed: 2026-03-31*
