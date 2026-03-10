---
phase: 21-settings-panel
plan: 01
subsystem: ui
tags: [shadcn, radix-ui, react, zustand, settings, modal, tabs]

# Dependency graph
requires:
  - phase: 20-content-layout
    provides: AppShell grid, Sidebar, UI store with modal support
provides:
  - 8 shadcn UI primitives (tabs, input, label, select, slider, switch, alert-dialog, card)
  - Settings types for all backend API responses
  - 5 data fetching hooks for settings domains
  - Settings modal shell with 5-tab navigation
  - Sidebar gear icon wired to open settings
  - Lazy-loaded SettingsModal in AppShell
affects: [21-02, 21-03, appearance-tab, api-keys-tab, agents-tab, git-tab, mcp-tab]

# Tech tracking
tech-stack:
  added: [class-variance-authority (shadcn dep)]
  patterns: [lazy-loaded modal via React.lazy + Suspense, per-domain data hooks with AbortController cleanup]

key-files:
  created:
    - src/src/components/ui/tabs.tsx
    - src/src/components/ui/input.tsx
    - src/src/components/ui/label.tsx
    - src/src/components/ui/select.tsx
    - src/src/components/ui/slider.tsx
    - src/src/components/ui/switch.tsx
    - src/src/components/ui/alert-dialog.tsx
    - src/src/components/ui/card.tsx
    - src/src/components/ui/button.tsx
    - src/src/types/settings.ts
    - src/src/hooks/useSettingsData.ts
    - src/src/hooks/useSettingsData.test.ts
    - src/src/components/settings/SettingsModal.tsx
    - src/src/components/settings/SettingsTabSkeleton.tsx
    - src/src/components/settings/SettingsModal.test.tsx
  modified:
    - src/src/types/ui.ts
    - src/src/stores/ui.ts
    - src/src/stores/ui.test.ts
    - src/src/components/sidebar/Sidebar.tsx
    - src/src/components/app-shell/AppShell.tsx

key-decisions:
  - "ThemeConfig extended with codeFontFamily, UI store persist bumped to v5 with chained migration"
  - "ProviderStatus.defaultModel populated client-side (not from API) using known provider defaults"
  - "SettingsModal lazy-loaded via React.lazy to keep it out of initial bundle (Constitution 10.6)"
  - "shadcn z-50 replaced with z-[var(--z-overlay)] and z-[var(--z-modal)] tokens per Constitution"

patterns-established:
  - "Settings data hooks: useFetchState<T> pattern with AbortController cleanup and mutation+refetch"
  - "Lazy modal pattern: React.lazy + named export transform + Suspense fallback={null}"

requirements-completed: [SET-01, SET-02, SET-03, SET-18]

# Metrics
duration: 8min
completed: 2026-03-10
---

# Phase 21 Plan 01: Settings Shell Summary

**8 shadcn primitives, settings types/hooks with 15 tests, 5-tab modal shell with lazy loading from sidebar gear icon**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-10T19:00:16Z
- **Completed:** 2026-03-10T19:08:22Z
- **Tasks:** 3
- **Files modified:** 20

## Accomplishments
- Installed 8 shadcn UI primitives with z-index tokens adapted to Constitution
- Created comprehensive settings types covering all 5 backend API response shapes
- Built 5 data fetching hooks with abort cleanup, mutation support, and 15 unit tests
- Shipped settings modal shell with 5-tab navigation and loading skeletons
- Wired sidebar gear icon to open lazy-loaded settings modal

## Task Commits

Each task was committed atomically:

1. **Task 1: Install shadcn primitives, settings types/hooks, write tests** - `ec44176` (feat)
2. **Task 2: Build settings modal shell with tab navigation and skeletons** - `9dc29b1` (feat)
3. **Task 3: Add sidebar gear icon and wire lazy-loaded SettingsModal** - `4734529` (feat)

## Files Created/Modified
- `src/src/components/ui/{tabs,input,label,select,slider,switch,alert-dialog,card,button}.tsx` - 9 shadcn primitives
- `src/src/types/settings.ts` - All settings API response interfaces
- `src/src/hooks/useSettingsData.ts` - 5 data fetching hooks (agents, api-keys, creds, git, mcp)
- `src/src/hooks/useSettingsData.test.ts` - 15 unit tests for hooks
- `src/src/components/settings/SettingsModal.tsx` - Dialog overlay with 5-tab Radix navigation
- `src/src/components/settings/SettingsTabSkeleton.tsx` - Animated loading skeleton
- `src/src/components/settings/SettingsModal.test.tsx` - 5 tests for modal behavior
- `src/src/types/ui.ts` - Extended ThemeConfig with codeFontFamily
- `src/src/stores/ui.ts` - Persist v5 with codeFontFamily migration
- `src/src/stores/ui.test.ts` - Updated theme assertions
- `src/src/components/sidebar/Sidebar.tsx` - Added gear icon footer
- `src/src/components/app-shell/AppShell.tsx` - Added lazy SettingsModal in Suspense

## Decisions Made
- Extended ThemeConfig with codeFontFamily (default: JetBrains Mono) -- needed for Appearance tab, adds persist v5 migration
- ProviderStatus.defaultModel populated client-side since backend status endpoints don't return model info
- shadcn z-50 classes replaced with project z-index tokens (--z-overlay, --z-modal) per Constitution
- button.tsx included as shadcn dependency of alert-dialog (auto-generated, kept)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed shadcn file installation path**
- **Found during:** Task 1
- **Issue:** shadcn CLI installed files to literal `src/@/components/ui/` instead of `src/src/components/ui/`
- **Fix:** Moved files to correct location, removed empty directory
- **Files modified:** All 9 shadcn primitives
- **Committed in:** ec44176

**2. [Rule 1 - Bug] Fixed shadcn cn() import paths**
- **Found during:** Task 1
- **Issue:** shadcn generated `from "@/utils"` but project uses `from "@/utils/cn"`
- **Fix:** Updated all 9 files to use correct import path
- **Files modified:** All 9 shadcn primitives
- **Committed in:** ec44176

**3. [Rule 1 - Bug] Fixed raw z-index values in shadcn components**
- **Found during:** Task 1 (pre-commit lint)
- **Issue:** shadcn uses `z-50` which violates Constitution no-raw-z-index rule
- **Fix:** Replaced with `z-[var(--z-overlay)]` and `z-[var(--z-modal)]` tokens
- **Files modified:** alert-dialog.tsx, select.tsx
- **Committed in:** ec44176

**4. [Rule 1 - Bug] Updated existing UI store tests for new ThemeConfig shape**
- **Found during:** Task 1
- **Issue:** 3 existing tests expected theme without codeFontFamily field
- **Fix:** Added codeFontFamily to all theme assertions in ui.test.ts
- **Files modified:** src/src/stores/ui.test.ts
- **Committed in:** ec44176

---

**Total deviations:** 4 auto-fixed (4 bugs)
**Impact on plan:** All fixes necessary for lint compliance and test correctness. No scope creep.

## Issues Encountered
- fireEvent.click doesn't trigger Radix tab switching in jsdom -- switched to userEvent.setup().click() which works correctly
- Radix Dialog warns about missing aria-describedby -- added `aria-describedby={undefined}` to suppress

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All shadcn primitives ready for Plans 02 and 03 tab content
- Data hooks ready for wiring into actual tab forms
- Modal shell skeleton will be replaced by real tab content in next plans

---
*Phase: 21-settings-panel*
*Completed: 2026-03-10*

## Self-Check: PASSED
- All 14 created files verified present
- All 3 task commits verified in git history (ec44176, 9dc29b1, 4734529)
