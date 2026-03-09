---
phase: 12-streaming-markdown-marker-interleaving
plan: 03
subsystem: ui
tags: [streamdown, streaming-markdown, evaluation, react, rAF]

# Dependency graph
requires:
  - phase: 12-streaming-markdown-marker-interleaving
    provides: Custom streaming markdown converter (12-01)
provides:
  - Streamdown evaluation documenting why custom converter is the correct choice
  - 10 comparison test fixtures usable as regression tests for the streaming converter
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns: [evaluation-prototype-pattern]

key-files:
  created:
    - src/src/lib/streamdown-eval.ts
    - src/src/lib/streamdown-eval.test.ts
  modified: []

key-decisions:
  - "Custom streaming converter over Streamdown -- Streamdown is a React component incompatible with rAF architecture"

patterns-established:
  - "Evaluation prototype: build both approaches against identical fixtures, score on explicit criteria, winner-takes-all"

requirements-completed: [ENH-01]

# Metrics
duration: 4min
completed: 2026-03-07
---

# Phase 12 Plan 03: Streamdown Evaluation Summary

**Custom streaming converter wins over Streamdown -- Streamdown is a React component (MemoExoticComponent) incompatible with rAF paint loop architecture**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-07T18:07:37Z
- **Completed:** 2026-03-07T18:11:53Z
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments
- Evaluated Streamdown v2.1.0 against custom converter on 4 criteria (visual quality, edge cases, integration fit, bundle size)
- Documented that Streamdown exports only React components (Streamdown, Block, CodeBlock, etc.) with no pure `string -> string` conversion function
- Custom converter wins decisively on integration fit: pure function callable from rAF vs React render cycle
- Streamdown installed, evaluated, and uninstalled in single task -- no residual dependency
- 47 comparison tests across 10 fixtures serve as evaluation record

## Task Commits

Each task was committed atomically:

1. **Task 1: Streamdown evaluation prototype + comparison** - `1ad2f60` (feat)

**Plan metadata:** (pending final commit)

## Files Created/Modified
- `src/src/lib/streamdown-eval.ts` - Evaluation module with 10 shared fixtures, converter wrappers, and 4-criteria scoring
- `src/src/lib/streamdown-eval.test.ts` - 47 tests documenting the evaluation (custom output quality, Streamdown disqualification, XSS sanitization, comparison matrix)

## Decisions Made

**Custom converter over Streamdown (decisive)**

Streamdown v2.1.0 by Vercel is a React component (`react.MemoExoticComponent`) that manages its own rendering lifecycle. Our architecture requires a pure `string -> string` function callable from `requestAnimationFrame` without triggering React reconciliation. This is a fundamental incompatibility -- not a quality issue.

Four-criteria scoring:
| Criteria | Winner | Rationale |
|----------|--------|-----------|
| Visual quality | Custom (default) | Streamdown cannot be called as pure function; no output to compare |
| Edge cases | Custom (default) | Custom handles unclosed fences, incomplete tables, XSS via DOMPurify |
| Integration fit | Custom (decisive) | Pure function in rAF vs React component requiring render cycle |
| Bundle size | Custom | ~30KB (DOMPurify) vs 67KB chunk + Shiki/Mermaid/remend transitive deps |

Streamdown's `parseMarkdownIntoBlocks` is a pure function but only splits markdown into `string[]` blocks -- it does not convert to HTML.

## Deviations from Plan

None - plan executed exactly as written. The plan anticipated the React component disqualification scenario and specified: "If Streamdown's API is purely a React component, that's an automatic disqualification."

## Issues Encountered

- ESLint custom rule `loom/no-non-null-without-reason` flagged `!` assertions in test file -- required inline `// ASSERT:` comments on same line (not preceding line)
- ESLint forbidden placeholder word detection caught "temp" substring in "attempt" -- rephrased ASSERT comment to avoid false positive

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 12 complete (all 3 plans done): streaming converter, crossfade + markers, Streamdown evaluation
- Custom converter confirmed as the right architecture choice for rAF paint loop
- Ready for Phase 13 (Composer)

---
*Phase: 12-streaming-markdown-marker-interleaving*
*Completed: 2026-03-07*
