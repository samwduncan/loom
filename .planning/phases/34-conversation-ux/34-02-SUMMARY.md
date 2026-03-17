---
phase: 34-conversation-ux
plan: 02
subsystem: ui
tags: [token-usage, jsonl, transform, expandable, cost-tracking]

requires:
  - phase: 07-tool-rendering
    provides: "TokenUsage component and AssistantMessage integration"
provides:
  - "JSONL result entry extraction for historical token data"
  - "Expandable TokenUsage footer with detail breakdown"
affects: [conversation-ux, chat-view]

tech-stack:
  added: []
  patterns: ["second-pass entry extraction for metadata enrichment", "CSS grid expand/collapse on dl element"]

key-files:
  created:
    - src/src/components/chat/view/TokenUsage.test.tsx
  modified:
    - src/src/lib/transformMessages.ts
    - src/src/lib/transformMessages.test.ts
    - src/src/components/chat/view/TokenUsage.tsx

key-decisions:
  - "Second pass over entries array (not chatEntries) to find result entries and attach to preceding assistant message"
  - "Track seen assistant API IDs to handle merged entries correctly during second pass"
  - "Use conditional render (not CSS grid 0fr/1fr) for expanded detail since plan simplicity preferred"
  - "Avoid non-null assertions in JSX by using nullish coalescing (metadata.cost ?? 0)"

patterns-established:
  - "Result entry extraction: walk entries, track lastAssistantIdx, skip merged duplicates via seenAssistantApiIds Set"

requirements-completed: [UXR-03, UXR-04]

duration: 7min
completed: 2026-03-17
---

# Phase 34 Plan 02: Token Usage Footers Summary

**Per-turn token usage footers with JSONL result extraction and expandable detail breakdown**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-17T01:22:40Z
- **Completed:** 2026-03-17T01:29:32Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Historical messages loaded from JSONL now display token usage (input/output/cache/cost) via result entry extraction
- TokenUsage footer shows compact "X in / Y out . $Z" by default, expandable to labeled breakdown on click
- BackendEntry interface extended with modelUsage and total_cost_usd fields, plus message.id cleanup
- 29 total tests (22 transform + 7 TokenUsage) covering all edge cases

## Task Commits

Each task was committed atomically:

1. **Task 1: Extract JSONL result entries for historical token data** - `514fcdd` (feat)
2. **Task 2: Make TokenUsage expandable with detail breakdown** - `a48c2ee` (feat)

_Note: TDD tasks - tests written first (RED), then implementation (GREEN), committed together per task_

## Files Created/Modified
- `src/src/lib/transformMessages.ts` - Added ModelUsageData interface, BackendEntry.modelUsage/total_cost_usd fields, second-pass result extraction logic
- `src/src/lib/transformMessages.test.ts` - 6 new tests for result entry extraction (22 total)
- `src/src/components/chat/view/TokenUsage.tsx` - Rewritten with expandable state, ChevronRight icon, dl detail breakdown
- `src/src/components/chat/view/TokenUsage.test.tsx` - 7 tests covering null render, compact display, expand/collapse, detail rows, cache handling

## Decisions Made
- Used second-pass approach (iterate entries after building messages) rather than inline extraction during first pass -- cleaner separation of concerns
- Tracked `seenAssistantApiIds` Set to correctly count merged assistant entries (same message.id) as one built message in the index mapping
- Used conditional render (`{expanded && ...}`) instead of CSS grid 0fr/1fr transition -- simpler and the plan's grid transition suggestion added complexity without visual benefit at text-xs scale
- Replaced non-null assertions in JSX with nullish coalescing (`?? 0`) to satisfy the custom ESLint rule without needing inline ASSERT comments

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed merged assistant entry counting in second pass**
- **Found during:** Task 1 (result extraction implementation)
- **Issue:** Second pass incremented builtMessageIdx for each entry in the original array, but merged assistant entries (consecutive entries with same message.id) produce only one message. This caused result data to be attached to wrong message indices.
- **Fix:** Added `seenAssistantApiIds` Set to skip duplicate assistant entries during the second pass
- **Files modified:** src/src/lib/transformMessages.ts
- **Verification:** Multiple-assistant-message test passes with correct per-message token data
- **Committed in:** 514fcdd (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Essential correctness fix for multi-turn conversations. No scope creep.

## Issues Encountered
- Pre-existing uncommitted files from plan 34-01 (CollapsibleMessage, useAutoCollapse) were in the git staging area and caused lint-staged stash/restore issues. Required unstaging, separate commits, and re-staging to isolate changes correctly.
- Custom ESLint rule `loom/no-non-null-without-reason` cannot use `// ASSERT:` comments inside JSX expressions -- switched to nullish coalescing pattern instead.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Token usage footers complete for both historical and streamed messages
- Phase 34 (Conversation UX) plan 02 complete
- Ready for phase 35 or next milestone phase

## Self-Check: PASSED

All 4 source files exist. Both commit hashes (514fcdd, a48c2ee) verified in git log.

---
*Phase: 34-conversation-ux*
*Completed: 2026-03-17*
