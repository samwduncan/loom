---
phase: 59-platform-foundation
plan: 02
subsystem: infra
tags: [capacitor, fetch-migration, url-resolution, api-client, auth]

# Dependency graph
requires:
  - phase: 59-platform-foundation
    provides: "platform.ts resolveApiUrl, fetchAnon exports"
provides:
  - "All HTTP fetch calls route through platform URL resolution"
  - "Zero bare fetch('/api/...') calls remain in production code"
affects: [59-03 websocket-cors]

# Tech tracking
tech-stack:
  added: []
  patterns: ["resolveApiUrl() in api-client doFetch for all authenticated requests", "fetchAnon() in auth.ts for unauthenticated bootstrap", "apiFetch() replaces manual getToken + fetch in hooks"]

key-files:
  created: []
  modified:
    - src/src/lib/api-client.ts
    - src/src/lib/auth.ts
    - src/src/hooks/useUsageMetrics.ts

key-decisions:
  - "No test modifications needed -- web mode resolveApiUrl returns paths unchanged"
  - "fetchAnon replaces bare fetch in auth.ts, removing manual Content-Type headers"
  - "apiFetch replaces manual getToken + header injection in useUsageMetrics"

patterns-established:
  - "All authenticated HTTP calls go through apiFetch (api-client.ts)"
  - "All unauthenticated HTTP calls go through fetchAnon (platform.ts)"
  - "No direct fetch('/api/...') in any production file"

requirements-completed: [PLAT-02]

# Metrics
duration: 3min
completed: 2026-03-28
---

# Phase 59 Plan 02: Fetch Migration Summary

**Migrated all HTTP fetch calls to platform URL resolution -- zero bare fetch('/api/...') calls remain in production code**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-28T01:35:31Z
- **Completed:** 2026-03-28T01:38:17Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Wired resolveApiUrl into api-client.ts doFetch for all authenticated API requests
- Replaced 3 bare fetch() calls in auth.ts with fetchAnon (status, register, login)
- Migrated useUsageMetrics.ts from manual getToken + fetch to apiFetch (2 call sites)
- Verified zero bare fetch('/api/...') calls remain in src/src/ production code
- All 1420 tests pass across 138 test files without modification

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire resolveApiUrl into api-client.ts and fetchAnon into auth.ts** - `7321650` (feat)
2. **Task 2: Migrate useUsageMetrics.ts to apiFetch** - `b53bfc1` (feat)

## Files Created/Modified
- `src/src/lib/api-client.ts` - Added resolveApiUrl import, doFetch now resolves URLs through platform layer
- `src/src/lib/auth.ts` - Added fetchAnon import, all 3 bootstrap fetch calls use fetchAnon, removed manual Content-Type headers
- `src/src/hooks/useUsageMetrics.ts` - Replaced getToken import with apiFetch, both fetch sites use apiFetch with generics

## Decisions Made
- No test modifications needed: in web mode (IS_NATIVE=false), resolveApiUrl returns paths unchanged, so all existing test assertions still match
- Removed manual Content-Type headers from auth.ts since fetchAnon already injects them
- apiFetch throws on non-ok responses, so useUsageMetrics catch blocks handle errors identically to the old res.ok check pattern

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Worktree missing node_modules, resolved by running npm install before tests
- Worktree did not have Plan 01 changes, resolved by merging worktree-agent-a59625e1 branch

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All HTTP fetch calls now route through platform.ts URL resolution
- Plan 03 (WebSocket/CORS migration) can proceed -- resolveWsUrl and resolveShellWsUrl exports are ready
- Capacitor native mode will automatically use absolute URLs for all HTTP requests

## Self-Check: PASSED

All 3 modified files verified on disk. Both commit hashes (7321650, b53bfc1) found in git log.

---
*Phase: 59-platform-foundation*
*Completed: 2026-03-28*
