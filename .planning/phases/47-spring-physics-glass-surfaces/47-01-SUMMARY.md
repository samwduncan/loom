---
phase: 47-spring-physics-glass-surfaces
plan: 01
subsystem: ui
tags: [css, spring-easing, linear(), animation, transitions, design-tokens]

# Dependency graph
requires:
  - phase: 44-foundation
    provides: CSS spring easing tokens (--ease-spring-gentle/snappy/bouncy) in tokens.css
  - phase: 46-interactive-state-consistency
    provides: Enter transitions on overlays and command palette
provides:
  - Spring easing applied to all key interactions (modals, sidebar, tool cards, command palette, scroll pill)
  - Sidebar grid-template-columns spring transition rule
affects: [47-02-glass-surfaces, 48-visual-personality]

# Tech tracking
tech-stack:
  added: []
  patterns: [tw-animate-css --tw-ease override for spring timing on Radix data-state=open, CSS grid-template-columns spring transition for layout animations]

key-files:
  created: []
  modified:
    - src/src/components/ui/dialog.tsx
    - src/src/components/ui/alert-dialog.tsx
    - src/src/styles/index.css
    - src/src/components/command-palette/command-palette.css
    - src/src/components/chat/tools/tool-card-shell.css
    - src/src/components/chat/tools/ToolCallGroup.css
    - src/src/components/chat/view/scroll-pill.css

key-decisions:
  - "Spring easing on open/enter state only -- exit animations remain instant per Phase 46-02 decision"
  - "Three spring profiles mapped by surface type: gentle (modals, sidebar, palette), snappy (tool expand/collapse), bouncy (scroll pill)"

patterns-established:
  - "tw-animate-css spring override: data-[state=open]:[--tw-ease:var(--ease-spring-X)] on Radix dialog components"
  - "Grid column spring transition: transition: grid-template-columns on app-shell for sidebar expand/collapse"

requirements-completed: [SPRING-01, SPRING-02, SPRING-03, SPRING-04, SPRING-05]

# Metrics
duration: 3min
completed: 2026-03-19
---

# Phase 47 Plan 01: Spring Physics Summary

**CSS linear() spring easing applied to 7 surfaces: modals, sidebar, command palette, tool cards, tool groups, and scroll pill -- three spring profiles by surface type**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-19T02:32:09Z
- **Completed:** 2026-03-19T02:35:13Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Dialog and AlertDialog open with visible spring overshoot via --tw-ease CSS variable override on data-[state=open]
- Sidebar expand/collapse animates smoothly via grid-template-columns transition with gentle spring easing
- Command palette overlay and content use gentle spring timing replacing flat ease-out
- Tool card and tool group expand/collapse upgraded from cubic-bezier approximation to true linear() spring (snappy profile)
- Scroll-to-bottom pill entrance uses bouncy spring profile for playful micro-interaction

## Task Commits

Each task was committed atomically:

1. **Task 1: Spring easing on modals, sidebar, and command palette** - `ed1a88d` (feat)
2. **Task 2: Spring easing on tool cards, tool groups, and scroll pill** - `5976985` (feat)

## Files Created/Modified
- `src/src/components/ui/dialog.tsx` - Added --tw-ease and --tw-animation-duration spring overrides on open state
- `src/src/components/ui/alert-dialog.tsx` - Same spring overrides as dialog
- `src/src/styles/index.css` - Added grid-template-columns spring transition on [data-testid="app-shell"]
- `src/src/components/command-palette/command-palette.css` - Swapped ease-out to spring-gentle on overlay and content animations
- `src/src/components/chat/tools/tool-card-shell.css` - Replaced --ease-spring cubic-bezier with --ease-spring-snappy linear()
- `src/src/components/chat/tools/ToolCallGroup.css` - Same snappy spring swap as tool card
- `src/src/components/chat/view/scroll-pill.css` - Replaced --duration-normal/--ease-spring with bouncy spring profile

## Decisions Made
- Spring easing applied to open/enter state only -- exit animations remain instant per Phase 46-02 decision (overlays unmount on close, instant dismiss feels snappier)
- Three spring profiles mapped by surface character: gentle (1000ms, low overshoot) for modals/sidebar/palette, snappy (833ms, medium overshoot) for tool expand/collapse, bouncy (1167ms, high overshoot) for scroll pill
- No per-component prefers-reduced-motion rules needed -- global base.css override handles all cases

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All spring easing tokens consumed across key interaction surfaces
- Ready for Plan 47-02 (frosted glass overlays) which layers backdrop-filter effects on these same overlay surfaces
- Old --ease-spring and --duration-spring tokens still referenced in reduced-motion fallback sections but won't cause issues

---
*Phase: 47-spring-physics-glass-surfaces*
*Completed: 2026-03-19*
