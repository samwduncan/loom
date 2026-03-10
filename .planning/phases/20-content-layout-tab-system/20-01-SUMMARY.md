---
phase: 20-content-layout-tab-system
plan: 01
subsystem: ui
tags: [zustand, typescript, stores, file-tree]

# Dependency graph
requires: []
provides:
  - "Updated TabId union type (chat|files|shell|git)"
  - "File store skeleton (useFileStore) with type contracts"
  - "UI store persist migration v3"
affects: [20-02-content-layout-tab-system, 23-code-editor]

# Tech tracking
tech-stack:
  added: []
  patterns: ["stub-action pattern for deferred store implementation"]

key-files:
  created:
    - src/src/types/file.ts
    - src/src/stores/file.ts
    - src/src/stores/file.test.ts
  modified:
    - src/src/types/ui.ts
    - src/src/stores/ui.ts
    - src/src/stores/ui.test.ts

key-decisions:
  - "File store uses string[] for expandedDirs (not Set) to avoid JSON serialization pitfalls"
  - "No persist middleware on file store — file state is ephemeral per session"
  - "Stub actions pattern with deferred implementation comment for Phase 23"

patterns-established:
  - "Stub-action store: create skeleton with typed contracts and no-op actions, defer implementation"

requirements-completed: [LAY-07, LAY-09]

# Metrics
duration: 3min
completed: 2026-03-10
---

# Phase 20 Plan 01: Store Contracts & Type Foundation Summary

**TabId union updated to chat|files|shell|git with 5th Zustand file store skeleton and full type contracts**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-10T16:03:52Z
- **Completed:** 2026-03-10T16:06:30Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- TabId type changed from 'chat'|'dashboard'|'settings' to 'chat'|'files'|'shell'|'git' — all consumers compile
- UI store persist version bumped to 3 with no-op migration (activeTab is not persisted)
- 5th Zustand store created with FileTab, FileState, FileActions, FileStore type contracts
- 16 tests pass (14 UI store + 2 file store), TypeScript compiles clean

## Task Commits

Each task was committed atomically:

1. **Task 1: Update TabId type + UI store migration + update existing tests** - `1c6daa2` (feat)
2. **Task 2: Create file store types + minimal store skeleton + tests** - `2de93eb` (feat)

## Files Created/Modified
- `src/src/types/ui.ts` - TabId union updated to 'chat' | 'files' | 'shell' | 'git'
- `src/src/types/file.ts` - FileTab, FileState, FileActions, FileStore type definitions
- `src/src/stores/ui.ts` - Persist version bumped to 3, no-op migration added
- `src/src/stores/ui.test.ts` - Tests updated with new TabId values, exhaustive test added
- `src/src/stores/file.ts` - 5th Zustand store with reset() and stub actions
- `src/src/stores/file.test.ts` - 2 tests: initial state + reset behavior

## Decisions Made
- File store uses string[] for expandedDirs (not Set) to avoid JSON serialization pitfalls
- No persist middleware on file store — file state is ephemeral per session
- Stub actions pattern: typed contracts now, implementation deferred to Phase 23 when consumers exist

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- TabId and file store types ready for Plan 02 (ContentArea + TabBar components)
- All type contracts established for downstream consumers
- No blockers

---
*Phase: 20-content-layout-tab-system*
*Completed: 2026-03-10*
