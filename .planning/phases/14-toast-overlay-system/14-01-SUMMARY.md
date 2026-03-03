---
phase: 14-toast-overlay-system
plan: 01
subsystem: ui
tags: [sonner, z-index, css-variables, portal, toast, overlay]

requires:
  - phase: 12-specialty-surfaces
    provides: glass tokens (--glass-blur, --glass-saturate, --glass-bg-opacity), status color tokens
provides:
  - Formal z-index CSS custom property scale (--z-base through --z-critical)
  - Sonner toast provider with glassmorphic dark theming
  - #overlay-root portal target element
  - OverlayPortal reusable component
  - All non-modal z-index values migrated to formal scale
affects: [14-02-PLAN, 14-03-PLAN, modal-system, dropdown-system, toast-notifications]

tech-stack:
  added: [sonner@^2.0.7]
  patterns: [z-index-css-variables, overlay-portal-pattern, css-only-toast-theming]

key-files:
  created:
    - src/components/ui/overlay-portal.tsx
  modified:
    - src/index.css
    - src/App.tsx
    - index.html
    - package.json
    - 16 component files (z-index migration)

key-decisions:
  - "7-tier z-index scale: base(0), sticky(10), dropdown(20), scroll-pill(30), overlay(40), modal(50), toast(60), critical(9999)"
  - "Sonner theming via CSS data-attribute selectors instead of props — keeps Toaster props minimal"
  - "OverlayPortal falls back to document.body if #overlay-root missing"
  - "Component-relative z-10 values left as-is (not part of global scale)"

patterns-established:
  - "Z-index via CSS variables: use z-[var(--z-tier)] in Tailwind, var(--z-tier) in inline styles"
  - "Toast status colors: left border using --status-connected/error/reconnecting/rose-accent tokens"
  - "Portal rendering: OverlayPortal component for escaping stacking contexts"

requirements-completed: [TOST-01, TOST-02]

duration: ~25min
completed: 2026-03-03
---

# Plan 14-01: Z-index Scale, Sonner & Portal Infrastructure Summary

**Formal 7-tier z-index CSS variable scale, Sonner toast provider with glassmorphic theming, and 16-file z-index migration to the new scale**

## Performance

- **Duration:** ~25 min
- **Tasks:** 3 completed
- **Files modified:** 21 (5 infrastructure + 16 migration)

## Accomplishments
- Defined 7-tier z-index scale as CSS custom properties in :root (base/sticky/dropdown/scroll-pill/overlay/modal/toast/critical)
- Installed Sonner and mounted Toaster with CSS-only glassmorphic dark theming using existing glass and status color tokens
- Created #overlay-root portal target and reusable OverlayPortal component
- Migrated all non-modal ad-hoc z-index values across 16 components to the formal scale

## Task Commits

1. **Task 1: Define z-index scale and install Sonner** - `c1a60cb` (feat)
2. **Task 2: Create overlay portal and mount Sonner provider** - `7de6198` (feat)
3. **Task 3: Migrate all ad-hoc z-index values to formal scale** - `7768265` (feat)

## Files Created/Modified
- `src/index.css` - Z-index scale in :root, Sonner CSS overrides with glass tokens
- `package.json` - Added sonner@^2.0.7
- `index.html` - Added #overlay-root div
- `src/components/ui/overlay-portal.tsx` - OverlayPortal component (createPortal to #overlay-root)
- `src/App.tsx` - Sonner Toaster mounted at bottom-right
- 16 component files - Z-index values migrated (TurnToolbar, CollapsibleSection, ScrollToBottomPill, CommandMenu, ShellMinimalView, MobileNav, ChatMessagesPane, ProviderDropdown, ComposerProviderPicker, GitPanelHeader, TaskList, Tooltip, QuickSettingsPanel, AppContent, TaskMasterPanel, ChatComposer)

## Decisions Made
- Chose 7-tier scale (not 5 or 10) to match the distinct semantic layers found in the z-index audit
- Used CSS data-attribute selectors for Sonner theming to avoid prop-based styling
- Left component-relative z-10 values (e.g., ChatComposer inner z-10) unchanged — they operate within their own stacking context
- MobileNav z-50 mapped to --z-sticky (not modal) since it's persistent navigation

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Minor] MobileNav inner z-10 kept as-is**
- **Found during:** Task 3 (z-index migration)
- **Issue:** Plan said to migrate MobileNav inner z-10 to z-[var(--z-sticky)], but these are component-relative values
- **Fix:** Left inner z-10 as-is since they only stack within the MobileNav's own context
- **Verification:** MobileNav renders correctly, no visual regression

---

**Total deviations:** 1 auto-fixed (minor)
**Impact on plan:** Minimal — kept component-relative z-indexes unchanged for correctness.

## Depth Compliance

No depth criteria — all tasks were Grade C or below.

## Issues Encountered
None — plan executed cleanly.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Z-index scale and toast infrastructure ready for Wave 2
- Plan 02 can now migrate modals to portals using OverlayPortal + z-[var(--z-modal)]
- Plan 03 can now use `toast()` from Sonner for WebSocket status notifications

---
*Phase: 14-toast-overlay-system*
*Completed: 2026-03-03*
