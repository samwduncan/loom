---
phase: 01-design-system-foundation
plan: 01
subsystem: ui
tags: [css-variables, tailwind, hsl, alpha-value, typography, jetbrains-mono, scrollbar, design-tokens]

# Dependency graph
requires: []
provides:
  - "Warm earthy CSS variable palette in :root (bare HSL channels)"
  - "Fixed Tailwind alpha-value contract for opacity modifiers"
  - "JetBrains Mono font loading via Google Fonts CDN"
  - "Status color CSS variables and Tailwind tokens"
  - "Warm-tinted scrollbar utilities"
  - "Global border default at warm gold 15% opacity"
affects: [02-component-color-migration, 03-dark-mode-cleanup, 04-terminal-theme, 05-chat-rendering]

# Tech tracking
tech-stack:
  added: [JetBrains Mono (Google Fonts CDN)]
  patterns: [bare-hsl-channel-variables, alpha-value-contract, dark-only-theme, 3-tier-surface-hierarchy]

key-files:
  created: []
  modified: [src/index.css, tailwind.config.js, index.html]

key-decisions:
  - "Border color defined as bare HSL channels with 15% default opacity in global * rule, preserving alpha-value contract"
  - "Textarea/placeholder styles consolidated using CSS variables instead of .dark-scoped hardcoded colors"
  - "Select dropdown arrow SVG updated to warm muted gold (#c4a882) for theme consistency"
  - "Chat input expanded shadow uses warm-dark values directly (no .dark variant needed)"

patterns-established:
  - "CSS variables use bare HSL channels (no hsl() wrapper): --color: H S% L%"
  - "Tailwind config uses alpha-value contract: hsl(var(--color) / <alpha-value>)"
  - "No .dark class, no dark: prefixes - warm palette is always active via :root"
  - "Status colors accessed via text-status-connected, bg-status-error, etc."

requirements-completed: [DSGN-01, DSGN-02, DSGN-03, DSGN-04, DSGN-05, DSGN-07, DSGN-08]

# Metrics
duration: 3min
completed: 2026-03-01
---

# Phase 1 Plan 01: Design System Foundation Summary

**Warm earthy CSS variable palette with fixed Tailwind alpha-value contract, JetBrains Mono typography at 13px, and warm-tinted scrollbar/status color tokens**

## Performance

- **Duration:** 3 min 30s
- **Started:** 2026-03-01T20:00:05Z
- **Completed:** 2026-03-01T20:03:35Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Replaced entire CSS variable palette with warm earthy colors (chocolate brown base, cream text, amber/copper/terracotta accents)
- Fixed broken Tailwind alpha-value contract -- all 23 color references now use `hsl(var(--x) / <alpha-value>)` pattern, enabling opacity modifiers like `bg-primary/50`
- Established JetBrains Mono as universal font at 13px with -0.01em letter spacing for developer-tool aesthetic
- Added 4 warm-tinted status color tokens (connected, reconnecting, disconnected, error) as both CSS variables and Tailwind utilities
- Removed all `.dark` class blocks, dark-mode scrollbar overrides, dark checkbox/radio/textarea/select overrides (403 lines removed)

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace CSS variable palette and clean up index.css** - `44e7c63` (feat)
2. **Task 2: Fix alpha-value contract in tailwind.config.js and add status colors** - `f505305` (feat)
3. **Task 3: Add JetBrains Mono font loading and update HTML meta tags** - `453d126` (feat)

## Files Created/Modified
- `src/index.css` - Warm earthy :root palette, scrollbar utilities, typography base, status colors, global border opacity
- `tailwind.config.js` - Alpha-value contract fix for all color tokens, status color group, darkMode removed
- `index.html` - JetBrains Mono font loading with preconnect, title/meta tags updated to Loom with #1c1210 theme color

## Decisions Made
- Border color defined as bare HSL channels (`34.5 35.9% 63.9%`) with default 15% opacity applied via `hsl(var(--border) / 0.15)` in the global `*` rule -- preserves alpha-value contract while providing correct default appearance
- Textarea and placeholder styles consolidated to use CSS variable references (`hsl(var(--muted-foreground) / 0.6)`) instead of hardcoded rgb values with `.dark` prefixes
- Select dropdown chevron SVG updated to use muted gold stroke color (`#c4a882`) matching the warm theme
- Ring offset colors updated to reference `hsl(var(--background))` instead of hardcoded gray-800

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] npm dependencies not installed**
- **Found during:** Overall verification (typecheck/build)
- **Issue:** `tsc` and `vite` commands not found -- node_modules not present
- **Fix:** Ran `npm install` to install all dependencies
- **Files modified:** node_modules/ (not committed)
- **Verification:** `npm run typecheck` and `npm run build` both succeed
- **Committed in:** N/A (node_modules not tracked)

**2. [Rule 1 - Bug] Textarea/placeholder dark-mode styles needed warm equivalents**
- **Found during:** Task 1 (index.css cleanup)
- **Issue:** Removing `.dark textarea` blocks would leave textarea text invisible on dark background. Plan didn't specify replacement styles.
- **Fix:** Added warm-theme-native textarea styles using CSS variables (`color-scheme: dark`, placeholder colors via `hsl(var(--muted-foreground) / 0.6)`)
- **Files modified:** src/index.css
- **Verification:** Build succeeds, no `.dark` references remain
- **Committed in:** 44e7c63 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both auto-fixes essential for functionality. No scope creep.

## Issues Encountered
- `tsc` command not found when running `npm run typecheck` -- resolved by running `npm install` first. Pre-existing issue (dependencies weren't installed).

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- CSS variable palette is complete and verified via successful build
- Alpha-value contract is working -- downstream components can use opacity modifiers (`bg-primary/50`, `text-foreground/80`)
- Status colors are available as Tailwind utilities (`text-status-connected`, `bg-status-error`)
- Ready for Plan 01-02 (component color migration, ThemeContext removal, dark: prefix sweep)

## Self-Check: PASSED

All files exist, all commits verified.

---
*Phase: 01-design-system-foundation*
*Completed: 2026-03-01*
