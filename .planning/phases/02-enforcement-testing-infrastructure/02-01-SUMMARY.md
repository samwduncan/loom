---
phase: 02-enforcement-testing-infrastructure
plan: 01
subsystem: testing
tags: [eslint, custom-rules, linting, constitution-enforcement, ast-visitors]

requires:
  - phase: 01-design-system-foundation
    provides: "tokens.css, motion.ts, cn.ts, TokenPreview.tsx, eslint.config.js flat config"
provides:
  - "9 custom ESLint rules enforcing V2 Constitution banned patterns"
  - "Local ESLint plugin (src/eslint-rules/) wired into flat config"
  - "Default export override for route/page files"
  - "Phase 1 codebase passing all 9 rules with zero errors/warnings"
affects: [all-future-phases, coding-conventions, ci-pipeline]

tech-stack:
  added: []
  patterns: [local-eslint-plugin, eslint-disable-for-dev-tools, ast-visitor-rules]

key-files:
  created:
    - src/eslint-rules/index.js
    - src/eslint-rules/no-hardcoded-colors.js
    - src/eslint-rules/no-raw-z-index.js
    - src/eslint-rules/no-classname-concat.js
    - src/eslint-rules/no-whole-store-subscription.js
    - src/eslint-rules/no-external-store-mutation.js
    - src/eslint-rules/no-banned-inline-style.js
    - src/eslint-rules/no-any-without-reason.js
    - src/eslint-rules/no-non-null-without-reason.js
    - src/eslint-rules/no-token-shadowing.js
  modified:
    - src/eslint.config.js
    - src/src/components/dev/TokenPreview.tsx
    - src/src/main.tsx
    - src/src/utils/cn.test.ts
    - src/src/styles/tokens.test.ts
    - src/src/components/dev/TokenPreview.test.tsx

key-decisions:
  - "File-level eslint-disable for TokenPreview.tsx no-banned-inline-style (dev visualization tool legitimately needs dynamic styles)"
  - "Replaced z-10 Tailwind utility with var(--z-sticky) token in TokenPreview.tsx"
  - "Upgraded @typescript-eslint/no-unused-vars from warn to error (Phase 2 enforcement level)"
  - "eslint-rules/ directory added to ESLint ignores (plain JS, not linted as app code)"

patterns-established:
  - "Local ESLint plugin: src/eslint-rules/index.js exports all rules, imported in eslint.config.js as 'loom' namespace"
  - "Exception comment pattern: // ANY: [reason] for explicit any, // ASSERT: [reason] for non-null assertions (10+ char reason required)"
  - "eslint-disable justification: file-level disable allowed for dev tools with documented reason"

requirements-completed: [ENF-01]

duration: 8min
completed: 2026-03-05
---

# Phase 2 Plan 01: Custom ESLint Rules Summary

**9 custom ESLint rules as local plugin enforcing V2 Constitution banned patterns: hardcoded colors, raw z-index, className concatenation, whole-store subscriptions, external store mutations, banned inline styles (two-tier), untyped any, non-null assertions, and CSS token shadowing**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-05T02:05:48Z
- **Completed:** 2026-03-05T02:14:08Z
- **Tasks:** 2
- **Files modified:** 16

## Accomplishments

- Created 9 custom ESLint rules covering every Constitution-banned pattern
- Two-tier inline style validation: property allowlist + token-backed value enforcement (zIndex/gap must use var())
- Hex color detection in ANY JSX attribute (not just className) -- catches `<Icon color="#ff0000" />`
- Existing Phase 1 codebase passes all rules with zero errors and zero warnings

## Task Commits

Each task was committed atomically:

1. **Task 1: Create all 9 custom ESLint rules as local plugin** - `c6a9aad` (feat)
2. **Task 2: Wire custom rules into eslint.config.js with default export exception** - Changes committed as part of 02-02 plan commits (`17f921b` and predecessors) due to concurrent execution

**Plan metadata:** (this summary commit)

## Files Created/Modified

- `src/eslint-rules/index.js` - Plugin entry point exporting all 9 rules
- `src/eslint-rules/no-hardcoded-colors.js` - Bans Tailwind color utilities + hex in className/cn() + hex in any JSX attribute
- `src/eslint-rules/no-raw-z-index.js` - Bans z-[N] arbitrary and z-N utility classes
- `src/eslint-rules/no-classname-concat.js` - Bans string concat / template literals in className (must use cn())
- `src/eslint-rules/no-whole-store-subscription.js` - Bans useXStore() without selector argument
- `src/eslint-rules/no-external-store-mutation.js` - Bans setState/getState outside /stores/ directory
- `src/eslint-rules/no-banned-inline-style.js` - Two-tier: property allowlist + var() enforcement for token-backed props
- `src/eslint-rules/no-any-without-reason.js` - Requires // ANY: [reason] with 10+ chars, rejects placeholder words
- `src/eslint-rules/no-non-null-without-reason.js` - Requires // ASSERT: [reason] with 10+ chars, rejects placeholder words
- `src/eslint-rules/no-token-shadowing.js` - Bans CSS custom property declarations with token-reserved prefixes
- `src/eslint.config.js` - Added loom plugin, all 9 rules at ERROR, route/page default export override
- `src/src/components/dev/TokenPreview.tsx` - File-level eslint-disable for inline styles, z-10 -> var(--z-sticky)
- `src/src/main.tsx` - Added ASSERT comment for getElementById non-null assertion
- `src/src/utils/cn.test.ts` - Fixed constant truthiness, added eslint-disable for color merge test
- `src/src/styles/tokens.test.ts` - Added ASSERT comment for rootMatch non-null assertion
- `src/src/components/dev/TokenPreview.test.tsx` - Added ASSERT comments for all non-null assertions

## Decisions Made

1. **File-level eslint-disable for TokenPreview.tsx**: The token preview page is a dev visualization tool that inherently needs dynamic inline styles (backgroundColor for color swatches, transitions for animation demos, gradients for glass effects). Applied file-level `eslint-disable loom/no-banned-inline-style` with documented justification rather than weakening the rule.

2. **z-10 replaced with var(--z-sticky)**: TokenPreview.tsx used Tailwind `z-10` utility class. Replaced with `style={{ zIndex: 'var(--z-sticky)' }}` to comply with the no-raw-z-index rule while maintaining the same visual behavior.

3. **Upgraded unused-vars to error**: `@typescript-eslint/no-unused-vars` promoted from `warn` to `error` as specified for Phase 2 enforcement level.

4. **eslint-rules/ added to ignores**: Rule files are plain JS (not TypeScript), should not be linted by app-level TypeScript rules.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed existing code violations caught by new rules**
- **Found during:** Task 2 (wiring rules into config)
- **Issue:** 31 violations in existing Phase 1 code: banned inline styles in TokenPreview.tsx (16), non-null assertions without ASSERT comments (8), constant truthiness in cn.test.ts (2), hardcoded Tailwind colors in cn.test.ts (2), raw z-index utility in TokenPreview.tsx (1), duplicate eslint output (2)
- **Fix:** File-level eslint-disable for TokenPreview inline styles, ASSERT comments on all non-null assertions, variable extraction for constant booleans, eslint-disable on test utility color merge assertions, z-10 to var(--z-sticky) conversion
- **Files modified:** TokenPreview.tsx, TokenPreview.test.tsx, main.tsx, cn.test.ts, tokens.test.ts
- **Verification:** `npx eslint src/ --max-warnings=0` exits 0
- **Committed in:** Changes captured in 02-02 commits due to concurrent execution

---

**Total deviations:** 1 auto-fixed (bug fix -- existing code violated new rules)
**Impact on plan:** Required fix for correctness. All existing Phase 1 code now passes the full rule set. No scope creep.

## Issues Encountered

- **Concurrent plan execution**: Plan 02-02 (Vitest setup) ran concurrently and committed some of the Task 2 changes (eslint.config.js modifications, source file fixes) as part of its own commits. The changes are correct and present in the codebase, but attributed to 02-02 commit hashes rather than a dedicated 02-01 Task 2 commit.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All 9 Constitution-enforcement ESLint rules active at ERROR level
- Any new code adding banned patterns will immediately fail ESLint
- Default export override pre-configured for future route/page files
- Ready for Plan 02-02 (Vitest) and Plan 02-03 (pre-commit hooks)

## Self-Check: PASSED

- All 11 key files verified to exist on disk
- Commits c6a9aad and 17f921b verified in git history
- `npx eslint src/ --max-warnings=0` exits 0 (zero errors, zero warnings)
- Plugin exports exactly 9 rules

---
*Phase: 02-enforcement-testing-infrastructure*
*Completed: 2026-03-05*
