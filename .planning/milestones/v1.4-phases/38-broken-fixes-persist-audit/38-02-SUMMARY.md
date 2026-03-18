---
phase: 38-broken-fixes-persist-audit
plan: 02
subsystem: stores
tags: [zustand, persist, rehydration, deep-merge, localStorage]

# Dependency graph
requires:
  - phase: 38-broken-fixes-persist-audit-01
    provides: connection store NaN fix (FIX-04)
provides:
  - ui store deep merge function preventing shallow-merge clobber
  - comprehensive rehydration safety tests for all 3 persisted stores
affects: [stores, persistence, settings]

# Tech tracking
tech-stack:
  added: []
  patterns: [persist-merge-function-pattern]

key-files:
  created: []
  modified:
    - src/src/stores/ui.ts
    - src/src/stores/ui.test.ts
    - src/src/stores/connection.test.ts
    - src/src/stores/timeline.test.ts

key-decisions:
  - "Deep merge theme object in ui store to preserve nested defaults like codeFontFamily"
  - "Nullish coalescing for scalar fields to fall back to currentState defaults"

patterns-established:
  - "Persist merge pattern: every persisted store must have an explicit merge function that deep-merges nested objects and uses ?? for scalar fallbacks"

requirements-completed: [FIX-04, PERS-01, PERS-02]

# Metrics
duration: 4min
completed: 2026-03-17
---

# Phase 38 Plan 02: Persist Rehydration Audit Summary

**Deep merge function for ui store persist + rehydration safety tests for all 3 persisted Zustand stores**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-17T23:00:28Z
- **Completed:** 2026-03-17T23:04:32Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Added explicit merge function to ui store preventing shallow-merge clobber of theme.codeFontFamily and new scalar fields
- Verified FIX-04 NaN fix passes (connection store existing test + new rehydration test)
- All 3 persisted stores (connection, timeline, ui) now have partialize + merge + migrate + rehydration tests
- 7 new rehydration safety tests across 3 store test files

## Task Commits

Each task was committed atomically:

1. **Task 1: Add merge function to ui store + rehydration tests** - `4857652` (feat)
2. **Task 2: Verify FIX-04 NaN fix + rehydration tests for connection and timeline** - `6e1fbd8` (test)

_Note: TDD Task 1 RED phase couldn't be committed separately due to pre-commit hook running tests. RED + GREEN committed together._

## Files Created/Modified
- `src/src/stores/ui.ts` - Added merge function to persist config for deep theme merge + scalar fallbacks
- `src/src/stores/ui.test.ts` - 3 rehydration safety tests (stale state, partial theme, partialize shape)
- `src/src/stores/connection.test.ts` - 1 rehydration test verifying ephemeral defaults survive modelId-only rehydration
- `src/src/stores/timeline.test.ts` - 2 rehydration tests (sessions get empty messages, empty state doesn't crash)

## Decisions Made
- Deep merge for theme object (nested): `{ ...currentState.theme, ...(persisted.theme ?? {}) }` preserves new keys like codeFontFamily
- Nullish coalescing (`??`) for scalar fields: allows `false` to persist correctly while defaulting `undefined` to currentState

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-commit hook blocks TDD RED commits (failing tests trigger hook failure). Resolved by combining RED + GREEN into single commit for Task 1.
- TypeScript strict null checks on array index access required `!` assertion with ASSERT comment per project ESLint rule.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All 3 persisted stores verified safe for rehydration
- No store produces undefined/NaN values after localStorage clear + reload
- 91 total store tests passing, no type errors

---
*Phase: 38-broken-fixes-persist-audit*
*Completed: 2026-03-17*
