---
phase: 03-structural-cleanup
plan: 02
subsystem: ui
tags: [i18n-removal, react, typescript, settings, sidebar]

# Dependency graph
requires:
  - phase: 03-01
    provides: "22 chat/core components already stripped of i18n; I18nextProvider removed; locale files preserved for this plan"
provides:
  - "All 20 settings/sidebar components use English string literals"
  - "All sidebar subcomponents stripped of TFunction prop threading"
  - "src/i18n/ directory completely deleted"
  - "react-i18next, i18next, i18next-browser-languagedetector packages uninstalled"
  - "Zero i18n references remain anywhere in codebase"
affects: [03-03, 03-04, 03-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Direct English string literals in JSX instead of t() function calls"
    - "Removed TFunction prop threading pattern from sidebar component tree"

key-files:
  created: []
  modified:
    - "src/components/settings/view/**/*.tsx (14 files)"
    - "src/components/sidebar/view/**/*.tsx (10 files)"
    - "src/components/sidebar/hooks/useSidebarController.ts"
    - "src/components/sidebar/utils/utils.ts"
    - "src/utils/dateUtils.ts"
    - "src/components/QuickSettingsPanel.jsx"
    - "package.json"

key-decisions:
  - "Stripped t prop from all sidebar subcomponents rather than creating a lookup function, since plan requires zero i18n references codebase-wide"
  - "Simplified formatTimeAgo and createSessionViewModel to remove TFunction parameter entirely, using inline English strings"

patterns-established:
  - "No i18n: All user-facing strings are English string literals in JSX"

requirements-completed: [FORK-01]

# Metrics
duration: 29min
completed: 2026-03-02
---

# Phase 03 Plan 02: Strip i18n from Settings/Sidebar Summary

**Complete i18n removal: 33 component files converted to English string literals, i18n directory deleted, 3 i18n packages uninstalled, zero references remain codebase-wide**

## Performance

- **Duration:** 29 min
- **Started:** 2026-03-02T16:58:20Z
- **Completed:** 2026-03-02T17:28:18Z
- **Tasks:** 3
- **Files modified:** 33 (Task 1) + 30 deleted (Task 3) = 63 total

## Accomplishments
- Stripped useTranslation and t() calls from all 20 planned settings/sidebar components
- Removed t prop threading through entire sidebar component tree (10 additional subcomponents, controller hook, utility functions)
- Deleted src/i18n/ directory (config, languages, 29 locale JSON files across 4 languages)
- Uninstalled react-i18next, i18next, i18next-browser-languagedetector from dependencies
- Build succeeds with zero i18n-related errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Strip useTranslation from 20 settings/sidebar components** - `2a9059e` (feat)
2. **Task 2: Verify zero i18n references codebase-wide and build** - No commit (verification-only, no changes needed)
3. **Task 3: Delete i18n directory and uninstall i18n packages** - `1303df2` (chore)

## Files Created/Modified
- `src/components/settings/view/Settings.tsx` - Removed useTranslation, English string literals
- `src/components/settings/view/SettingsMainTabs.tsx` - Replaced labelKey with direct label strings
- `src/components/settings/view/modals/ClaudeMcpFormModal.tsx` - Stripped ~25 t() calls
- `src/components/settings/view/modals/CodexMcpFormModal.tsx` - Stripped t() calls
- `src/components/settings/view/tabs/agents-settings/AgentListItem.tsx` - Auth status strings
- `src/components/settings/view/tabs/agents-settings/sections/AgentCategoryTabsSection.tsx` - Category labels
- `src/components/settings/view/tabs/agents-settings/sections/content/AccountContent.tsx` - Agent descriptions
- `src/components/settings/view/tabs/agents-settings/sections/content/McpServersContent.tsx` - MCP server strings
- `src/components/settings/view/tabs/agents-settings/sections/content/PermissionsContent.tsx` - Permission settings
- `src/components/settings/view/tabs/AppearanceSettingsTab.tsx` - Appearance settings strings
- `src/components/settings/view/tabs/api-settings/CredentialsSettingsTab.tsx` - Credentials strings
- `src/components/settings/view/tabs/api-settings/sections/ApiKeysSection.tsx` - API key strings
- `src/components/settings/view/tabs/api-settings/sections/GithubCredentialsSection.tsx` - GitHub token strings
- `src/components/settings/view/tabs/api-settings/sections/NewApiKeyAlert.tsx` - Alert strings
- `src/components/settings/view/tabs/api-settings/sections/VersionInfoSection.tsx` - Version info
- `src/components/settings/view/tabs/git-settings/GitSettingsTab.tsx` - Git config strings
- `src/components/settings/view/tabs/tasks-settings/TasksSettingsTab.tsx` - TaskMaster strings
- `src/components/QuickSettingsPanel.jsx` - Quick settings strings
- `src/components/sidebar/view/Sidebar.tsx` - Removed t prop passing to all subcomponents
- `src/components/sidebar/view/modals/VersionUpgradeModal.tsx` - Version upgrade strings
- `src/components/sidebar/view/subcomponents/SidebarCollapsed.tsx` - Aria labels, settings
- `src/components/sidebar/view/subcomponents/SidebarContent.tsx` - Removed t prop threading
- `src/components/sidebar/view/subcomponents/SidebarFooter.tsx` - Settings, update strings
- `src/components/sidebar/view/subcomponents/SidebarHeader.tsx` - Tooltips, search placeholder
- `src/components/sidebar/view/subcomponents/SidebarModals.tsx` - Delete confirmations
- `src/components/sidebar/view/subcomponents/SidebarProjectItem.tsx` - Project actions
- `src/components/sidebar/view/subcomponents/SidebarProjectList.tsx` - Removed t prop
- `src/components/sidebar/view/subcomponents/SidebarProjectSessions.tsx` - Session strings
- `src/components/sidebar/view/subcomponents/SidebarProjectsState.tsx` - Loading/empty states
- `src/components/sidebar/view/subcomponents/SidebarSessionItem.tsx` - Session actions
- `src/components/sidebar/hooks/useSidebarController.ts` - Removed t from args and alert strings
- `src/components/sidebar/utils/utils.ts` - Removed TFunction from getSessionName/createSessionViewModel
- `src/utils/dateUtils.ts` - Removed TFunction from formatTimeAgo
- `src/i18n/` - DELETED (29 files)
- `package.json` - Removed 3 i18n packages

## Decisions Made
- Stripped t prop from all sidebar subcomponents (10 files beyond the planned 20) rather than creating a t-compatible lookup function. This was necessary because the plan requires "Zero react-i18next imports exist anywhere in the entire codebase" and these subcomponents imported TFunction from i18next.
- Simplified formatTimeAgo(dateString, currentTime, t) to formatTimeAgo(dateString, currentTime) since the fallback English strings already existed in the code.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Extended i18n removal to sidebar subcomponents, hooks, and utils**
- **Found during:** Task 1 (Sidebar.tsx editing)
- **Issue:** Sidebar.tsx passes `t` as a prop to 10 subcomponents (SidebarCollapsed, SidebarContent, SidebarFooter, SidebarHeader, SidebarModals, SidebarProjectItem, SidebarProjectList, SidebarProjectSessions, SidebarProjectsState, SidebarSessionItem), useSidebarController hook, and utility functions (createSessionViewModel, getSessionName, formatTimeAgo). These all import `TFunction` from `i18next`. Removing `useTranslation` from Sidebar.tsx without fixing these would break the build.
- **Fix:** Stripped t prop from all sidebar subcomponents, removed TFunction type imports, replaced all t() calls with English string literals, simplified utility function signatures.
- **Files modified:** 13 additional files (10 subcomponents, 1 hook, 2 utility files)
- **Verification:** TypeScript typecheck passes, build succeeds
- **Committed in:** 2a9059e (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Auto-fix was necessary to satisfy the plan's requirement of zero i18n references codebase-wide. The plan's artifact spec says "All sidebar components use English string literals" which includes these subcomponents. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- i18n system completely eliminated from codebase
- All components use English string literals
- Ready for remaining structural cleanup plans (03-03 through 03-05)

## Self-Check: PASSED

- Commit 2a9059e (Task 1): FOUND
- Commit 1303df2 (Task 3): FOUND
- 03-02-SUMMARY.md: FOUND
- src/i18n/ directory: DELETED (correct)
- i18n references in src/: 0 (correct)

---
*Phase: 03-structural-cleanup*
*Completed: 2026-03-02*
