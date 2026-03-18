---
phase: 40-session-titles-rename
plan: 01
subsystem: ui
tags: [session-titles, rename, optimistic-update, toast, xml-stripping]

requires:
  - phase: 39-backend-hardening
    provides: PATCH /api/projects/:name/sessions/:id endpoint for title persistence
provides:
  - extractSessionTitle utility for clean title extraction from raw messages
  - Backend-persisted session rename with optimistic rollback
  - ChatComposer stub sessions with clean extracted titles
affects: [session-management, sidebar, chat-composer]

tech-stack:
  added: []
  patterns: [optimistic-update-with-rollback, xml-stripping-pipeline]

key-files:
  created:
    - src/src/lib/extract-session-title.ts
    - src/src/lib/extract-session-title.test.ts
  modified:
    - src/src/components/chat/composer/ChatComposer.tsx
    - src/src/components/sidebar/SessionList.tsx
    - src/src/components/sidebar/SessionList.test.tsx

key-decisions:
  - "System prefix detection uses startsWith matching for 8 known prefixes (command tags, Caveat, continuation, API key)"
  - "XML wrapper stripping iterates through 7 known GSD/orchestrator tags sequentially before fallback generic tag strip"
  - "Word-boundary truncation uses 60% minimum break threshold to avoid mid-word cuts"

patterns-established:
  - "Optimistic update with rollback: capture previous value, apply optimistic change, try PATCH, rollback + toast on failure"

requirements-completed: [SESS-01, SESS-02, SESS-03]

duration: 3min
completed: 2026-03-18
---

# Phase 40 Plan 01: Session Titles & Rename Summary

**extractSessionTitle utility stripping system/XML/JSON noise from titles, wired to ChatComposer stubs and backend-persisted rename with optimistic rollback**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-18T00:05:00Z
- **Completed:** 2026-03-18T00:08:23Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Created extractSessionTitle utility that strips system prefixes, XML wrapper blocks, JSON Task Master content, and truncates at word boundaries
- Replaced raw `trimmed.slice(0, 50)` in ChatComposer with clean title extraction
- Wired SessionList rename handler to backend PATCH endpoint with optimistic update and rollback on failure
- 24 new tests (21 extraction + 3 rename PATCH), 1323 total suite green

## Task Commits

Each task was committed atomically:

1. **Task 1: Create extractSessionTitle utility with tests** - `7d2fac5` (feat, TDD)
2. **Task 2: Wire title extraction to ChatComposer and rename to backend PATCH** - `ac4db9c` (feat)

## Files Created/Modified
- `src/src/lib/extract-session-title.ts` - Title extraction utility with system prefix, XML, JSON detection
- `src/src/lib/extract-session-title.test.ts` - 21 unit tests covering all edge cases
- `src/src/components/chat/composer/ChatComposer.tsx` - Uses extractSessionTitle for stub session titles
- `src/src/components/sidebar/SessionList.tsx` - Async handleSessionRename with PATCH + optimistic rollback
- `src/src/components/sidebar/SessionList.test.tsx` - 3 new tests for PATCH success, failure, and rollback

## Decisions Made
- System prefix detection uses startsWith matching for 8 known prefixes rather than regex for performance
- XML wrapper stripping iterates through 7 known GSD/orchestrator tags sequentially before a fallback generic tag strip
- Word-boundary truncation uses 60% minimum break threshold to avoid mid-word cuts on short maxLength values

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Session title lifecycle complete: clean extraction on create, backend-persisted rename
- Ready for next plan or phase

---
*Phase: 40-session-titles-rename*
*Completed: 2026-03-18*

## Self-Check: PASSED
