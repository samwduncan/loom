---
phase: 36-accessibility
plan: 03
subsystem: ui
tags: [wcag, a11y, reduced-motion, contrast, oklch, css]

requires:
  - phase: 01-foundation
    provides: design tokens (tokens.css, motion.ts)
provides:
  - Global reduced-motion CSS override for all animations/transitions
  - prefersReducedMotion() JS helper for imperative animations
  - WCAG AA contrast audit test as regression gate
  - Token adjustments for --status-error and --border-interactive
affects: [visual-polish, theming, any future token changes]

tech-stack:
  added: []
  patterns: [OKLCH-to-sRGB conversion for contrast verification, global reduced-motion override pattern]

key-files:
  created:
    - src/src/tests/a11y-reduced-motion.test.tsx
    - src/src/tests/a11y-contrast.test.ts
  modified:
    - src/src/styles/base.css
    - src/src/lib/motion.ts
    - src/src/styles/tokens.css

key-decisions:
  - "Used 0.01ms (not 0ms) for reduced-motion override to preserve JS animationend/transitionend events"
  - "Kept existing per-component reduced-motion blocks as documentation of intent"
  - "Adjusted --status-error lightness 0.58->0.65 and --border-interactive alpha 0.15->0.34 for WCAG AA compliance"

patterns-established:
  - "Global reduced-motion override: single @media rule in base.css covers all CSS animations/transitions"
  - "Contrast audit test: OKLCH-to-sRGB conversion with OKLab intermediary for programmatic WCAG verification"

requirements-completed: [A11Y-05, A11Y-06]

duration: 5min
completed: 2026-03-17
---

# Phase 36 Plan 03: Reduced Motion & Color Contrast Summary

**Global prefers-reduced-motion CSS override plus WCAG AA contrast audit with OKLCH-to-sRGB verification for all 13 text/surface token pairs**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-17T03:08:49Z
- **Completed:** 2026-03-17T03:13:45Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Global reduced-motion override in base.css covers all ~30 animate-pulse uses, custom @keyframes, and CSS transitions
- prefersReducedMotion() helper exported from motion.ts for JS-driven (framer-motion) animations
- 13-test WCAG AA contrast audit covering all text-on-surface, accent, status, and border token pairs
- Two token adjustments for WCAG AA compliance: --status-error and --border-interactive

## Task Commits

Each task was committed atomically:

1. **Task 1: Global reduced-motion override and per-file cleanup** - `c92cb53` (feat)
2. **Task 2: WCAG AA contrast ratio audit for all design token color pairs** - `b2db8a9` (feat)

## Files Created/Modified
- `src/src/styles/base.css` - Added global @media (prefers-reduced-motion: reduce) override
- `src/src/lib/motion.ts` - Added prefersReducedMotion() helper function
- `src/src/styles/tokens.css` - Adjusted --status-error (0.58->0.65) and --border-interactive (0.15->0.34)
- `src/src/tests/a11y-reduced-motion.test.tsx` - 4 tests for reduced-motion override and helper
- `src/src/tests/a11y-contrast.test.ts` - 13 tests for WCAG AA contrast ratio verification

## Decisions Made
- Used 0.01ms duration (not 0ms) for reduced-motion to preserve animationend/transitionend JS event firing
- Kept existing per-component reduced-motion blocks -- they're harmless and document intent
- Adjusted --status-error lightness from 0.58 to 0.65 (was 3.87:1, now passes 4.5:1)
- Adjusted --border-interactive alpha from 0.15 to 0.34 (was 1.56:1, now passes 3:1)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] --status-error failed WCAG AA contrast**
- **Found during:** Task 2 (contrast audit)
- **Issue:** --status-error oklch(0.58 0.18 25) on --surface-base produced only 3.87:1 ratio
- **Fix:** Increased lightness to 0.65 for compliant 4.5:1+ ratio
- **Files modified:** src/src/styles/tokens.css
- **Verification:** Contrast test passes
- **Committed in:** b2db8a9

**2. [Rule 1 - Bug] --border-interactive failed WCAG AA contrast**
- **Found during:** Task 2 (contrast audit)
- **Issue:** --border-interactive oklch(1 0 0 / 0.15) composited on surface-base produced only 1.56:1 ratio
- **Fix:** Increased alpha to 0.34 for compliant 3:1+ ratio
- **Files modified:** src/src/styles/tokens.css
- **Verification:** Contrast test passes
- **Committed in:** b2db8a9

---

**Total deviations:** 2 auto-fixed (2 bugs -- token values failing contrast requirements)
**Impact on plan:** Both fixes were anticipated by the plan as potential adjustments. Minimal visual impact.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All accessibility requirements for phase 36 are complete (plans 01-03)
- Reduced-motion and contrast audit tests serve as regression gates for future changes
- Any future token changes will be caught by the contrast audit test

---
*Phase: 36-accessibility*
*Completed: 2026-03-17*
