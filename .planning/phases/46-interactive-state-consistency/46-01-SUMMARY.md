---
phase: 46-interactive-state-consistency
plan: 01
subsystem: ui
tags: [css, focus-visible, hover, disabled, a11y, design-tokens, tailwind]

# Dependency graph
requires:
  - phase: 45-loading-error-empty-states
    provides: Empty/error states that may introduce new interactive elements
provides:
  - Canonical .focus-ring and .interactive-disabled CSS utility classes in base.css
  - Consistent focus-visible rings on all custom interactive elements
  - Normalized disabled states (opacity-50, pointer-events-none) across all buttons
  - Token-based hover backgrounds replacing ad-hoc color-mix and HSL fallbacks
affects: [47-spring-physics-glass-surfaces, 48-visual-personality, 49-spacing-typography-polish]

# Tech tracking
tech-stack:
  added: []
  patterns: [focus-visible over focus for ring styles, hover:not(:disabled) guard in CSS, pointer-events-none over cursor-not-allowed for disabled]

key-files:
  created: []
  modified:
    - src/src/styles/base.css
    - src/src/components/sidebar/sidebar.css
    - src/src/components/file-tree/styles/file-tree.css
    - src/src/components/git/git-panel.css
    - src/src/components/chat/tools/tool-chip.css
    - src/src/components/chat/tools/tool-card-shell.css
    - src/src/components/chat/composer/composer.css
    - src/src/components/ui/dialog.tsx
    - src/src/components/content-area/view/TabBar.tsx
    - src/src/components/terminal/TerminalHeader.tsx
    - src/src/components/sidebar/BulkActionBar.tsx
    - src/src/components/sidebar/QuickSettingsPanel.tsx
    - src/src/components/sidebar/ProjectHeader.tsx
    - src/src/components/chat/view/CollapsibleMessage.tsx
    - src/src/components/chat/view/CodeBlock.tsx
    - src/src/components/chat/view/TokenUsage.tsx
    - src/src/components/editor/EditorTabs.tsx
    - src/src/components/chat/view/ImageLightbox.tsx
    - src/src/components/sidebar/SearchInput.tsx
    - src/src/components/chat/composer/ChatComposer.tsx

key-decisions:
  - "focus-visible: over focus: for all ring styles -- keyboard-only indicator is correct a11y pattern, bare focus: triggers on mouse click too"
  - "pointer-events-none replaces cursor-not-allowed for disabled -- matches shadcn pattern, cursor never visible when pointer events are blocked"
  - "SkipLink keeps focus: (not focus-visible:) intentionally -- sr-only/not-sr-only visibility pattern requires focus: for all layout classes"

patterns-established:
  - "CSS focus ring: .component:focus-visible { outline: none; box-shadow: 0 0 0 2px var(--accent-primary); }"
  - "Tailwind focus ring: focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
  - "CSS disabled: :disabled { opacity: 0.5; pointer-events: none; }"
  - "Tailwind disabled: disabled:opacity-50 disabled:pointer-events-none"
  - "CSS hover guard: :hover:not(:disabled) prevents hover styles on disabled elements"

requirements-completed: [INTER-01, INTER-02, INTER-03]

# Metrics
duration: 6min
completed: 2026-03-19
---

# Phase 46 Plan 01: Standardize Interactive States Summary

**Canonical focus-visible rings, token-based hovers, and normalized disabled states across 20 files -- every custom interactive element now matches shadcn patterns**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-19T01:31:34Z
- **Completed:** 2026-03-19T01:37:50Z
- **Tasks:** 2
- **Files modified:** 20

## Accomplishments
- Added canonical `.focus-ring` and `.interactive-disabled` CSS utility classes to base.css for CSS-styled components
- Swept 7 CSS files: replaced HSL fallbacks with design tokens, added focus-visible rings to all interactive selectors, normalized disabled states to opacity-0.5 + pointer-events-none, guarded hover rules with :not(:disabled)
- Swept 13 TSX components: added focus-visible:ring-2 ring classes, fixed dialog.tsx and ImageLightbox close buttons from focus: to focus-visible:, normalized TerminalHeader disabled opacity from 0.4 to 0.5, added hover backgrounds to buttons that only had text color hover

## Task Commits

Each task was committed atomically:

1. **Task 1: CSS utility classes + CSS-file component sweep** - `62d1e04` (feat)
2. **Task 2: TSX component sweep** - `555ee9d` (feat)

## Files Created/Modified
- `src/src/styles/base.css` - Added .focus-ring and .interactive-disabled canonical utility classes
- `src/src/components/sidebar/sidebar.css` - Replaced color-mix hover with var(--surface-active), added focus-visible
- `src/src/components/file-tree/styles/file-tree.css` - Replaced HSL fallbacks with design tokens, added focus-visible
- `src/src/components/git/git-panel.css` - Added focus-visible to 10 button selectors, normalized disabled states, added :not(:disabled) hover guards
- `src/src/components/chat/tools/tool-chip.css` - Added focus-visible ring
- `src/src/components/chat/tools/tool-card-shell.css` - Added focus-visible ring to header
- `src/src/components/chat/composer/composer.css` - Changed mention-chip-remove to bg hover, added focus-visible to picker items
- `src/src/components/ui/dialog.tsx` - Fixed close button from focus: to focus-visible:
- `src/src/components/content-area/view/TabBar.tsx` - Added focus-visible ring to tab buttons
- `src/src/components/terminal/TerminalHeader.tsx` - Changed hover to surface-raised, disabled 0.4 to 0.5, added focus-visible
- `src/src/components/sidebar/BulkActionBar.tsx` - Normalized delete hover, added cancel bg hover, added focus-visible
- `src/src/components/sidebar/QuickSettingsPanel.tsx` - Added hover bg and focus-visible to trigger
- `src/src/components/sidebar/ProjectHeader.tsx` - Added focus-visible ring
- `src/src/components/chat/view/CollapsibleMessage.tsx` - Added focus-visible ring
- `src/src/components/chat/view/CodeBlock.tsx` - Added focus-visible ring to copy button
- `src/src/components/chat/view/TokenUsage.tsx` - Added focus-visible ring
- `src/src/components/editor/EditorTabs.tsx` - Added focus-visible ring to tabs and close buttons
- `src/src/components/chat/view/ImageLightbox.tsx` - Fixed close button from focus: to focus-visible: (deviation Rule 2)
- `src/src/components/sidebar/SearchInput.tsx` - Fixed focus: to focus-visible: on input, added to clear button (deviation Rule 2)
- `src/src/components/chat/composer/ChatComposer.tsx` - Fixed disabled:opacity-40 to disabled:opacity-50 (deviation Rule 2)

## Decisions Made
- **focus-visible: over focus:** for all ring styles -- keyboard-only indicator is the correct a11y pattern; bare `focus:` triggers on mouse click too which creates visual noise
- **pointer-events-none replaces cursor-not-allowed** for disabled state -- matches shadcn pattern and is more robust (cursor change never visible when pointer events are blocked anyway)
- **SkipLink keeps focus: intentionally** -- the `sr-only focus:not-sr-only` visibility pattern requires `focus:` for ALL layout classes; since skip links are only triggered via keyboard, focus: and focus-visible: are equivalent, and mixing them in one className would be confusing

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Fixed ImageLightbox close button using bare focus:**
- **Found during:** Task 2 verification (grep for bare focus:ring)
- **Issue:** ImageLightbox.tsx close button used `focus:ring-2 focus:ring-ring focus:outline-hidden` instead of focus-visible variants
- **Fix:** Changed to `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`
- **Files modified:** src/src/components/chat/view/ImageLightbox.tsx
- **Verification:** grep confirms no bare focus:ring remaining (except intentional SkipLink)
- **Committed in:** 555ee9d (Task 2 commit)

**2. [Rule 2 - Missing Critical] Fixed SearchInput using bare focus:**
- **Found during:** Task 2 verification (grep for bare focus:ring)
- **Issue:** SearchInput.tsx used `focus:ring-1 focus:ring-primary` on input, and clear button had no focus ring
- **Fix:** Changed to `focus-visible:ring-2 focus-visible:ring-ring`, added focus-visible to clear button
- **Files modified:** src/src/components/sidebar/SearchInput.tsx
- **Verification:** grep confirms fix
- **Committed in:** 555ee9d (Task 2 commit)

**3. [Rule 2 - Missing Critical] Fixed ChatComposer disabled opacity inconsistency**
- **Found during:** Task 2 verification (grep for opacity-40 disabled)
- **Issue:** Send and Stop buttons in ChatComposer.tsx used `disabled:opacity-40 disabled:cursor-not-allowed`
- **Fix:** Changed to `disabled:opacity-50 disabled:pointer-events-none` to match canonical pattern
- **Files modified:** src/src/components/chat/composer/ChatComposer.tsx
- **Verification:** grep confirms zero disabled opacity-40 remaining
- **Committed in:** 555ee9d (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (3 missing critical -- Rule 2)
**Impact on plan:** All auto-fixes were discovered by running the plan's own success criteria checks and are necessary for the "zero bare focus:ring" and "zero disabled opacity-40" guarantees. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All custom interactive elements now have consistent hover, focus, and disabled states
- Ready for Plan 46-02 (enter transitions for command palette, pickers, and branch selector)
- Ready for Phase 47 (spring physics) which will layer spring easing on top of these now-consistent interactive states

## Self-Check: PASSED

All 20 modified files verified present. Both task commits (62d1e04, 555ee9d) verified in git log.

---
*Phase: 46-interactive-state-consistency*
*Completed: 2026-03-19*
