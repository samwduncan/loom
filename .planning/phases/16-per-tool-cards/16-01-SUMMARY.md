---
phase: 16-per-tool-cards
plan: 01
subsystem: ui
tags: [react, ansi, diff, grep, shiki, tool-cards, truncation]

requires:
  - phase: 15-tool-card-shell
    provides: ToolCardShell wrapper and ToolCardProps interface
provides:
  - parseAnsi() ANSI-to-HTML converter with 16 colors + bold + underline
  - computeDiff() client-side unified diff with line numbers
  - parseGrepOutput() ripgrep format parser with file grouping
  - getLanguageFromPath() file extension to Shiki grammar mapping
  - TruncatedContent reusable truncation component
  - BashToolCard terminal-styled card with ANSI color support
  - tool-cards.css ANSI color classes mapped to design tokens
affects: [16-per-tool-cards plans 02 and 03]

tech-stack:
  added: [diff]
  patterns: [parseAnsi className-only spans, TruncatedContent wrapper, tool-cards.css ANSI token mapping]

key-files:
  created:
    - src/src/lib/ansi-parser.ts
    - src/src/lib/diff-parser.ts
    - src/src/lib/grep-parser.ts
    - src/src/components/chat/tools/TruncatedContent.tsx
    - src/src/components/chat/tools/BashToolCard.tsx
    - src/src/components/chat/tools/tool-cards.css
  modified:
    - src/src/lib/shiki-highlighter.ts
    - src/package.json

key-decisions:
  - "Skip backslash lines in diff output (No newline at end of file markers)"
  - "ANSI parser uses CSS classes only (no inline styles) per Constitution 7.14"
  - "TruncatedContent as wrapper component (not hook) for cleaner composition"

patterns-established:
  - "ANSI-to-HTML: parseAnsi emits className spans, CSS maps to design tokens"
  - "Tool card pattern: import tool-cards.css, use TruncatedContent for output"
  - "dangerouslySetInnerHTML with SAFETY comment for parseAnsi output"

requirements-completed: [TOOL-10, ENH-02]

duration: 7min
completed: 2026-03-08
---

# Phase 16 Plan 01: Shared Utilities + BashToolCard Summary

**5 utility modules (ANSI parser, diff parser, grep parser, getLanguageFromPath, TruncatedContent) plus terminal-styled BashToolCard with 16-color ANSI support and 50-line truncation**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-08T04:52:52Z
- **Completed:** 2026-03-08T04:59:25Z
- **Tasks:** 2
- **Files modified:** 15

## Accomplishments
- Built all 5 shared utility modules needed by the 6 per-tool cards
- Delivered BashToolCard with terminal styling, ANSI colors, and truncation
- 54 new tests (589 total suite), all passing
- Installed `diff` npm package for client-side diffing

## Task Commits

Each task was committed atomically:

1. **Task 1: Shared utilities + tool-cards.css** - `815004a` (feat)
2. **Task 2: BashToolCard with ANSI color support** - `cad64ef` (feat)

## Files Created/Modified
- `src/src/lib/ansi-parser.ts` - ANSI escape sequence to CSS class span conversion
- `src/src/lib/diff-parser.ts` - Unified diff computation via diff.structuredPatch
- `src/src/lib/grep-parser.ts` - Ripgrep output parser with file grouping
- `src/src/lib/shiki-highlighter.ts` - Added getLanguageFromPath (40+ extensions)
- `src/src/components/chat/tools/TruncatedContent.tsx` - Reusable show more/less wrapper
- `src/src/components/chat/tools/BashToolCard.tsx` - Terminal-styled Bash card
- `src/src/components/chat/tools/tool-cards.css` - ANSI colors + shared card styles
- `src/src/lib/ansi-parser.test.ts` - 12 tests
- `src/src/lib/diff-parser.test.ts` - 6 tests
- `src/src/lib/grep-parser.test.ts` - 7 tests
- `src/src/lib/shiki-highlighter.test.ts` - 10 new tests added (15 total)
- `src/src/components/chat/tools/TruncatedContent.test.tsx` - 6 tests
- `src/src/components/chat/tools/BashToolCard.test.tsx` - 8 tests
- `src/package.json` - Added diff dependency
- `src/package-lock.json` - Lock file updated

## Decisions Made
- Skip `\ No newline at end of file` markers in diff parser (they broke line type detection)
- ANSI parser uses `no-control-regex` ESLint disable since ANSI escapes are control characters by definition
- TruncatedContent as wrapper component (not hook) for simpler composition across 6 cards
- Used optional chaining (`?.`) instead of non-null assertions in test files for TypeScript strictness

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed diff parser skipping backslash lines**
- **Found during:** Task 1
- **Issue:** `diff` library emits `\ No newline at end of file` lines that start with `\`, which fell through to the context branch producing wrong types
- **Fix:** Added `if (line.startsWith('\\')) continue;` to skip these markers
- **Files modified:** src/src/lib/diff-parser.ts
- **Verification:** All diff-parser tests pass including empty string edge cases
- **Committed in:** 815004a

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Essential fix for diff parser correctness. No scope creep.

## Issues Encountered
- ESLint custom rule `loom/no-non-null-without-reason` requires `// ASSERT:` comments on the same line as `!` operator -- adjusted test assertions to use optional chaining or inline comments
- `no-control-regex` ESLint rule flagged the ANSI escape regex -- added targeted disable comment

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All shared utilities ready for Plans 02 and 03 to consume
- TruncatedContent pattern established for remaining 5 tool cards
- tool-cards.css imported and available for all card styles

## Self-Check: PASSED

All 11 created files verified on disk. Both task commits (815004a, cad64ef) verified in git log.

---
*Phase: 16-per-tool-cards*
*Completed: 2026-03-08*
