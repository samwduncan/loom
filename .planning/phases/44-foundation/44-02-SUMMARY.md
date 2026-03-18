---
phase: 44-foundation
plan: 02
subsystem: ui
tags: [css, spring-easing, linear, motion, design-tokens, animation]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: "Design token system (tokens.css) and motion.ts spring configs"
provides:
  - "CSS linear() spring easing custom properties (--ease-spring-gentle, --ease-spring-snappy, --ease-spring-bouncy)"
  - "Corresponding duration tokens (--duration-spring-gentle, --duration-spring-snappy, --duration-spring-bouncy)"
  - "Generation script for reproducible token regeneration"
  - "Tailwind v4 utility access via @theme inline"
affects: [47-spring-physics-glass, 48-visual-personality]

# Tech tracking
tech-stack:
  added: [spring-easing (devDependency only)]
  patterns: [one-shot-generation-script, linear-css-spring-easing, full-fidelity-64-point-curves]

key-files:
  created:
    - src/scripts/generate-spring-tokens.mjs
  modified:
    - src/src/styles/tokens.css
    - src/src/styles/index.css
    - src/src/lib/motion.ts
    - src/src/lib/motion.test.ts
    - src/package.json

key-decisions:
  - "Used SpringEasing raw frames (64 points) instead of CSSSpringEasing simplified output -- CSSSpringEasing reduces to 17-22 points via lossy simplification, raw frames give full-fidelity curves"
  - "spring-easing as devDependency only -- zero runtime cost, one-shot generation"
  - "Preserved existing --ease-spring cubic-bezier as legacy fallback"

patterns-established:
  - "One-shot generation script: Run once, paste output into tokens, script exists for reproducibility"
  - "Spring token naming: --ease-spring-{name} + --duration-spring-{name} pairs"

requirements-completed: [FOUND-03]

# Metrics
duration: 4min
completed: 2026-03-18
---

# Phase 44 Plan 02: Generate CSS Spring Easing Tokens Summary

**CSS linear() spring easing tokens (gentle/snappy/bouncy) generated from motion.ts physics configs via spring-easing, 64-point full-fidelity curves with visible overshoot**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-18T23:23:33Z
- **Completed:** 2026-03-18T23:28:11Z
- **Tasks:** 1
- **Files modified:** 7

## Accomplishments
- Generated 6 new CSS custom properties in tokens.css (3 easing with linear() values, 3 durations in ms)
- Created reproducible generation script at src/scripts/generate-spring-tokens.mjs
- Exposed spring tokens through Tailwind v4 @theme inline for utility class access
- Added 10 tests verifying token existence, linear() format, 30+ point count, and duration format
- All 1378 tests pass, TypeScript compiles clean

## Task Commits

Each task was committed atomically:

1. **Task 1: Install spring-easing, generate tokens, add to tokens.css** - `f40f827` (feat)

_Note: TDD RED commit was combined with GREEN due to pre-commit hook requiring passing tests._

## Files Created/Modified
- `src/scripts/generate-spring-tokens.mjs` - One-shot Node ESM script generating CSS spring tokens from physics params
- `src/src/styles/tokens.css` - Added 6 new spring easing CSS custom properties (3 linear() + 3 duration)
- `src/src/styles/index.css` - Exposed spring tokens via @theme inline for Tailwind utility access
- `src/src/lib/motion.ts` - Added JSDoc cross-references to CSS token equivalents
- `src/src/lib/motion.test.ts` - Added 10 tests for CSS spring token validation
- `src/package.json` - Added spring-easing devDependency
- `src/package-lock.json` - Lockfile update

## Decisions Made
- Used `SpringEasing` raw frames (64 points) instead of `CSSSpringEasing` simplified output -- the simplified version reduces to 17-22 points via lossy compression using percentage-based point placement, which is fewer than the 30-point fidelity target
- Kept `numPoints: 64` and `decimal: 3` for a good balance between curve fidelity and CSS file size
- spring-easing as devDependency only -- no runtime dependency, generation is a one-time operation

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] CSSSpringEasing output lacks linear() wrapper**
- **Found during:** Task 1 (Step 3)
- **Issue:** `CSSSpringEasing` returns raw comma-separated points without `linear()` wrapper
- **Fix:** Wrapped output in `linear()` in the generation script
- **Files modified:** src/scripts/generate-spring-tokens.mjs
- **Verification:** Generated output contains `linear(` prefix

**2. [Rule 3 - Blocking] CSSSpringEasing lossy simplification yields fewer than 30 points**
- **Found during:** Task 1 (Step 3)
- **Issue:** `CSSSpringEasing` aggressively simplifies curves to 17-22 points using percentage-based placement, failing the 30+ point test requirement
- **Fix:** Switched to `SpringEasing` for raw frame output (64 points), used `CSSSpringEasing` only for duration calculation
- **Files modified:** src/scripts/generate-spring-tokens.mjs
- **Verification:** All 3 spring curves have 64 comma-separated points, tests pass

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes necessary for correct generation. The full-fidelity approach actually produces better spring curves than the simplified version. No scope creep.

## Issues Encountered
- Pre-commit hook runs tests, preventing separate TDD RED commit (tests fail by design in RED phase). Combined RED + GREEN into single commit.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Spring easing tokens ready for Phase 47 (Spring Physics & Glass Surfaces)
- Tokens consumable via `transition-timing-function: var(--ease-spring-gentle)` and `transition-duration: var(--duration-spring-gentle)`
- Also available as Tailwind utilities via @theme inline mapping
- Phase 44 Foundation complete (both plans done)

---
*Phase: 44-foundation*
*Completed: 2026-03-18*
