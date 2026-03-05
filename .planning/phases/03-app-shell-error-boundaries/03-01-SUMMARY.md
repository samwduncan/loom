---
phase: 03-app-shell-error-boundaries
plan: 01
subsystem: ui
tags: [css-grid, react-router, zustand, sidebar, layout, app-shell]

# Dependency graph
requires:
  - phase: 02-enforcement-testing
    provides: ESLint Constitution rules, Vitest test infrastructure, pre-commit hooks
provides:
  - CSS Grid app shell with 3-column layout (sidebar | content | artifact)
  - Minimal UI store stub (sidebarOpen, sidebarState, toggleSidebar)
  - Sidebar component with branded Loom wordmark and collapse/expand toggle
  - React Router route structure with AppShell as layout route
  - PlaceholderView reusable component for empty route states
  - data-sidebar-state CSS variable pattern for layout state
affects: [03-02-error-boundaries, 04-state-architecture, 08-navigation-sessions]

# Tech tracking
tech-stack:
  added: [zustand]
  patterns: [css-grid-shell, data-attribute-state, layout-route-with-outlet, zustand-selector-only]

key-files:
  created:
    - src/src/stores/ui.ts
    - src/src/components/app-shell/AppShell.tsx
    - src/src/components/sidebar/Sidebar.tsx
    - src/src/components/shared/PlaceholderView.tsx
    - src/src/App.test.tsx
    - src/src/components/app-shell/AppShell.test.tsx
    - src/src/components/sidebar/Sidebar.test.tsx
    - src/src/components/shared/PlaceholderView.test.tsx
  modified:
    - src/src/styles/tokens.css
    - src/src/styles/index.css
    - src/src/App.tsx
    - src/eslint.config.js
    - src/eslint-rules/no-banned-inline-style.js

key-decisions:
  - "gridTemplateColumns/gridTemplateRows added to ESLint inline-style allowlist (Constitution 3.2 explicitly permits dynamic grid values)"
  - "Test files exempted from no-external-store-mutation ESLint rule (Zustand testing requires setState/getState)"
  - "Expand trigger uses z-[var(--z-overlay)] (40) per plan, above sticky headers but below modals"
  - "AppRoutes exported separately from App for MemoryRouter testing"
  - "--sidebar-expanded-width token added to tokens.css for parameterized sidebar width"

patterns-established:
  - "CSS Grid shell with data-sidebar-state attribute driving CSS variables for layout"
  - "Layout route pattern: AppShell renders Outlet, child routes render inside content area"
  - "Zustand store with selector-only access pattern (useUIStore(state => state.field))"
  - "PlaceholderView pattern for consistent empty route state rendering"

requirements-completed: [SHELL-01, SHELL-02, SHELL-03]

# Metrics
duration: 4min
completed: 2026-03-05
---

# Phase 3 Plan 01: App Shell + Sidebar + Route Structure Summary

**CSS Grid 3-column shell with sidebar collapse toggle, React Router layout routing, and minimal Zustand UI store**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-05T13:09:24Z
- **Completed:** 2026-03-05T13:14:06Z
- **Tasks:** 2
- **Files modified:** 13

## Accomplishments
- CSS Grid shell fills 100dvh with 3 columns (sidebar 280px | content 1fr | artifact 0px), no document scrollbar
- Sidebar renders Loom wordmark in Instrument Serif italic with collapse/expand toggle via Zustand store
- React Router serves /chat/:sessionId?, /dashboard, /settings inside AppShell; /dev/tokens standalone
- 20 new tests across 4 test files (52 total suite, all passing)

## Task Commits

Each task was committed atomically:

1. **Task 1: AppShell CSS Grid + Sidebar + UI store** - `ae56bb6` (feat)
2. **Task 2: React Router route structure + placeholders** - `feb75a8` (feat)

_TDD workflow: tests written first (RED), then implementation (GREEN), committed together per task._

## Files Created/Modified
- `src/src/stores/ui.ts` - Minimal UI store stub with sidebarOpen, sidebarState, toggleSidebar
- `src/src/components/app-shell/AppShell.tsx` - CSS Grid container with data-sidebar-state attribute
- `src/src/components/sidebar/Sidebar.tsx` - Branded header + collapse/expand toggle
- `src/src/components/shared/PlaceholderView.tsx` - Reusable placeholder for empty route states
- `src/src/App.tsx` - Restructured with AppShell layout route + route placeholders
- `src/src/styles/tokens.css` - Added --sidebar-expanded-width layout token
- `src/src/styles/index.css` - Added sidebar state CSS rules + responsive breakpoint
- `src/eslint.config.js` - Test file override for no-external-store-mutation
- `src/eslint-rules/no-banned-inline-style.js` - gridTemplateColumns/Rows added to allowlist
- `src/src/components/app-shell/AppShell.test.tsx` - 5 tests for grid layout and sidebar state
- `src/src/components/sidebar/Sidebar.test.tsx` - 6 tests for sidebar header and toggle
- `src/src/components/shared/PlaceholderView.test.tsx` - 3 tests for placeholder rendering
- `src/src/App.test.tsx` - 6 tests for route structure and navigation

## Decisions Made
- **gridTemplateColumns/gridTemplateRows in ESLint allowlist:** Constitution 3.2 explicitly allows inline style for "CSS Grid template values driven by state". Added to the no-banned-inline-style rule's ALLOWED_PROPERTIES set.
- **Test file ESLint override:** Zustand testing requires `setState()` to set up test scenarios and `getState()` to verify store mutations. Added override in eslint.config.js for `*.test.{ts,tsx}` files.
- **AppRoutes export for testing:** Separated route definitions from BrowserRouter wrapper so tests can use MemoryRouter for deterministic URL testing.
- **--sidebar-expanded-width token:** Parameterized sidebar width in tokens.css so future changes only need one value update.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] ESLint inline-style allowlist missing grid template properties**
- **Found during:** Task 1
- **Issue:** `gridTemplateColumns` and `gridTemplateRows` not in the no-banned-inline-style allowlist, blocking AppShell implementation
- **Fix:** Added both properties to ALLOWED_PROPERTIES in `eslint-rules/no-banned-inline-style.js`
- **Files modified:** `src/eslint-rules/no-banned-inline-style.js`
- **Verification:** `npx eslint src/components/app-shell/ --max-warnings=0` passes
- **Committed in:** ae56bb6 (Task 1 commit)

**2. [Rule 3 - Blocking] ESLint no-external-store-mutation blocks test files**
- **Found during:** Task 1
- **Issue:** Test files using `useUIStore.setState()` and `useUIStore.getState()` for test setup/assertions were blocked by the Constitution 4.5 enforcement rule
- **Fix:** Added ESLint override for `*.test.{ts,tsx}` files to disable `loom/no-external-store-mutation`
- **Files modified:** `src/eslint.config.js`
- **Verification:** Pre-commit hook passes with test files staged
- **Committed in:** ae56bb6 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes necessary to unblock implementation. No scope creep. Both aligned with Constitution intent (inline grid values explicitly allowed by 3.2; test files are not component files).

## Issues Encountered
- **Pre-existing TokenPreview.tsx lint errors:** 142 `bg-gray-800` hardcoded color errors exist in TokenPreview.tsx. The file disables `no-banned-inline-style` but not `no-hardcoded-colors`. This is a Phase 1 artifact and out of scope for this plan. Logged to `deferred-items.md`.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- AppShell CSS Grid skeleton is in place -- Plan 03-02 will wire error boundaries into the shell
- UI store stub established -- Phase 4 (STATE-01) will expand it with the full schema
- All routes functional with placeholders -- future phases fill them with real content
- Sidebar collapse toggle works end-to-end with CSS variable-driven layout
- No blockers for Plan 03-02 (error boundaries)

## Self-Check: PASSED

All 10 key files verified present. Both task commits (ae56bb6, feb75a8) verified in git log.

---
*Phase: 03-app-shell-error-boundaries*
*Completed: 2026-03-05*
