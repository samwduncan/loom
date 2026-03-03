---
phase: 12-specialty-surfaces
plan: 01
subsystem: ui
tags: [catppuccin-mocha, xterm, terminal, color-palette, design-system]

requires:
  - phase: 11-hardcoded-color-sweep
    provides: charcoal + rose CSS custom properties and semantic token system
provides:
  - Shared Catppuccin Mocha color constants (catppuccin-mocha.ts)
  - Terminal re-themed with Catppuccin Mocha ANSI colors on charcoal base
affects: [12-02, 12-03, 12-04]

tech-stack:
  added: []
  patterns: [shared-color-constants, catppuccin-mocha-warm-shift]

key-files:
  created: [src/shared/catppuccin-mocha.ts]
  modified: [src/components/shell/constants/constants.ts]

key-decisions:
  - "Warm-shift base/surface/text colors to app charcoal, keep accent tokens pure Catppuccin"
  - "Use mantle (#191817) as code block background — slightly darker than surface-base"
  - "Remove extendedAnsi array — xterm derives 256-color palette from 16 base ANSI colors"

patterns-established:
  - "Shared color constants: All specialty surfaces import from src/shared/catppuccin-mocha.ts"
  - "Warm-shift convention: base→app values, accents→pure Catppuccin"

requirements-completed: [SURF-01, SURF-02]

duration: 3min
completed: 2026-03-03
---

# Phase 12-01: Specialty Surfaces Summary

**Shared Catppuccin Mocha color palette with warm-shifted charcoal base + terminal re-themed with bar cursor, JetBrains Mono, and Catppuccin ANSI colors**

## Performance

- **Duration:** 3 min
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Created shared catppuccin-mocha.ts with 26 colors (12 warm-shifted base, 14 pure accent tokens)
- Exported syntaxColors semantic mapping and shikiBaseReplacements for Shiki integration
- Terminal switched from VS Code Dark+ ANSI palette to Catppuccin Mocha
- Terminal now uses JetBrains Mono, bar cursor, 1.2 line height

## Task Commits

1. **Task 1 + 2: Shared constants + Terminal theming** - `2663803` (feat)

## Files Created/Modified
- `src/shared/catppuccin-mocha.ts` - Shared Catppuccin Mocha color constants with warm-shifted base and pure accent tokens
- `src/components/shell/constants/constants.ts` - Terminal options with Catppuccin Mocha ANSI theme, bar cursor, JetBrains Mono

## Decisions Made
- Warm-shifted 12 base/surface/text colors to match app's CSS custom properties exactly
- Used mantle (#191817) as code block background (slightly darker than surface-base #1b1a19)
- Removed extendedAnsi array — xterm.js generates 256-color palette from the 16 base ANSI colors automatically

## Deviations from Plan
None - plan executed exactly as written

## Depth Compliance
No depth criteria — all tasks were Grade B.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Shared color constants ready for Plans 02, 03, and 04 to import
- Terminal integration complete — background matches app charcoal base

---
*Phase: 12-specialty-surfaces*
*Completed: 2026-03-03*
