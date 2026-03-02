---
phase: 03-structural-cleanup
plan: 01
subsystem: ui
tags: [i18n, react-i18next, string-literals, component-cleanup]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: working app with i18n wiring in place
provides:
  - 22 chat/core components with hardcoded English strings (no t() calls)
  - App.tsx without I18nextProvider wrapper
  - main.jsx without i18n config import
  - LanguageSelector.jsx deleted
affects: [03-02-settings-sidebar-i18n, 03-structural-cleanup]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Direct English string literals replacing i18n t() calls"
    - "Static MODE_LABELS record replacing dynamic t() lookup in ThinkingModeSelector"
    - "Changed TabDefinition type from labelKey to label for MainContentTabSwitcher"
    - "Removed TFunction parameter from formatRelativeTime in fileTreeUtils"

key-files:
  created: []
  modified:
    - src/App.tsx
    - src/main.jsx
    - src/components/app/AppContent.tsx
    - src/components/chat/view/ChatInterface.tsx
    - src/components/chat/view/subcomponents/ChatComposer.tsx
    - src/components/chat/view/subcomponents/ChatInputControls.tsx
    - src/components/chat/view/subcomponents/ChatMessagesPane.tsx
    - src/components/chat/view/subcomponents/Markdown.tsx
    - src/components/chat/view/subcomponents/MessageComponent.tsx
    - src/components/chat/view/subcomponents/ProviderSelectionEmptyState.tsx
    - src/components/chat/view/subcomponents/ThinkingModeSelector.tsx
    - src/components/code-editor/view/CodeEditor.tsx
    - src/components/file-tree/view/FileTree.tsx
    - src/components/file-tree/view/FileTreeBody.tsx
    - src/components/file-tree/view/FileTreeDetailedColumns.tsx
    - src/components/file-tree/view/FileTreeHeader.tsx
    - src/components/file-tree/view/FileTreeLoadingState.tsx
    - src/components/file-tree/utils/fileTreeUtils.ts
    - src/components/main-content/view/subcomponents/MainContentStateView.tsx
    - src/components/main-content/view/subcomponents/MainContentTabSwitcher.tsx
    - src/components/main-content/view/subcomponents/MainContentTitle.tsx
    - src/components/LoginForm.jsx
    - src/components/ProjectCreationWizard.jsx
    - src/components/TaskList.jsx
    - src/components/shell/view/Shell.tsx
    - src/components/QuickSettingsPanel.jsx
    - src/components/settings/view/tabs/AppearanceSettingsTab.tsx

key-decisions:
  - "Preserved src/i18n/ directory for plan 03-02 to read locale files before deletion"
  - "Left sidebar/settings i18n imports untouched since those files are plan 03-02 scope"
  - "Used static MODE_LABELS record in ThinkingModeSelector instead of dynamic t() lookup"
  - "Changed TabDefinition type from labelKey to label for direct string usage"

patterns-established:
  - "i18n removal pattern: remove import, remove const {t}, replace t() with English string or template literal"
  - "For interpolated i18n strings: t('key', {var}) becomes template literal with ${var}"

requirements-completed: [FORK-01]

# Metrics
duration: 15min
completed: 2026-03-02
---

# Phase 03 Plan 01: Strip i18n from Chat/Core Components Summary

**Removed react-i18next from 22 chat/core components, unwrapped I18nextProvider from App.tsx, deleted LanguageSelector, replaced all t() calls with English string literals**

## Performance

- **Duration:** 15 min
- **Started:** 2026-03-02T16:34:00Z
- **Completed:** 2026-03-02T16:49:06Z
- **Tasks:** 2
- **Files modified:** 27

## Accomplishments
- Stripped useTranslation imports and t() calls from 22 component files across chat, file-tree, code-editor, main-content, shell, and top-level components
- Removed I18nextProvider wrapper from App.tsx and i18n config import from main.jsx
- Deleted LanguageSelector.jsx and cleaned its references from AppearanceSettingsTab and QuickSettingsPanel
- All replaced strings show correct English text sourced from locale JSON files
- TypeScript typecheck passes cleanly with zero errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Strip useTranslation from 22 component files** - `47c8ae1` (feat)
2. **Task 2: Remove i18n wiring and LanguageSelector** - `bb635a0` (feat)

## Files Created/Modified
- `src/App.tsx` - Removed I18nextProvider wrapper and i18n import
- `src/main.jsx` - Removed i18n config import
- `src/components/LanguageSelector.jsx` - DELETED
- `src/components/app/AppContent.tsx` - Replaced t() calls with English strings
- `src/components/chat/view/ChatInterface.tsx` - Replaced provider labels and input placeholder
- `src/components/chat/view/subcomponents/ChatComposer.tsx` - Replaced attach images and hint strings
- `src/components/chat/view/subcomponents/ChatInputControls.tsx` - Replaced permission mode labels
- `src/components/chat/view/subcomponents/ChatMessagesPane.tsx` - Replaced session/loading strings
- `src/components/chat/view/subcomponents/Markdown.tsx` - Replaced copy/copied strings
- `src/components/chat/view/subcomponents/MessageComponent.tsx` - Replaced message type and permission strings
- `src/components/chat/view/subcomponents/ProviderSelectionEmptyState.tsx` - Replaced provider selection UI strings
- `src/components/chat/view/subcomponents/ThinkingModeSelector.tsx` - Replaced dynamic t() with static MODE_LABELS record
- `src/components/code-editor/view/CodeEditor.tsx` - Replaced toolbar/header/footer labels
- `src/components/file-tree/view/FileTree.tsx` - Updated formatRelativeTime call
- `src/components/file-tree/view/FileTreeBody.tsx` - Replaced file tree strings
- `src/components/file-tree/view/FileTreeDetailedColumns.tsx` - Replaced column header strings
- `src/components/file-tree/view/FileTreeHeader.tsx` - Replaced header strings
- `src/components/file-tree/view/FileTreeLoadingState.tsx` - Replaced loading strings
- `src/components/file-tree/utils/fileTreeUtils.ts` - Removed TFunction import and parameter, inlined English strings
- `src/components/main-content/view/subcomponents/MainContentStateView.tsx` - Replaced loading/project strings
- `src/components/main-content/view/subcomponents/MainContentTabSwitcher.tsx` - Changed labelKey to label in type
- `src/components/main-content/view/subcomponents/MainContentTitle.tsx` - Removed t parameter from getTabTitle
- `src/components/LoginForm.jsx` - Replaced auth form strings
- `src/components/ProjectCreationWizard.jsx` - Replaced ~45 t() calls with English strings
- `src/components/TaskList.jsx` - Replaced ~80+ t() calls with English strings
- `src/components/shell/view/Shell.tsx` - Replaced shell UI strings
- `src/components/QuickSettingsPanel.jsx` - Removed LanguageSelector import and usage
- `src/components/settings/view/tabs/AppearanceSettingsTab.tsx` - Removed LanguageSelector import and usage

## Decisions Made
- Preserved src/i18n/ directory for plan 03-02 to read locale files before final deletion
- Left sidebar and settings component i18n imports untouched (plan 03-02 scope)
- Used static MODE_LABELS record in ThinkingModeSelector instead of trying to maintain dynamic lookup
- Changed MainContentTabSwitcher TabDefinition type from labelKey:string to label:string for direct string usage
- Left dateUtils.ts and sidebar/utils/utils.ts TFunction imports in place since they serve sidebar components (03-02 scope)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None - all 22 files were mechanically processed, locale JSON lookups were straightforward, and TypeScript typecheck passed cleanly after both tasks.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Plan 03-02 can now proceed to strip i18n from settings/sidebar components
- Plan 03-02 can read src/i18n/locales/en/*.json for replacement strings
- Plan 03-02 is responsible for deleting src/i18n/ directory and running npm uninstall react-i18next i18next
- All 22 chat/core components are clean and ready for further structural cleanup in plans 03-03 through 03-05

## Self-Check: PASSED

- Commit 47c8ae1: FOUND
- Commit bb635a0: FOUND
- src/components/LanguageSelector.jsx: CONFIRMED DELETED
- src/i18n/ directory: CONFIRMED PRESERVED
- src/App.tsx: FOUND (no I18nextProvider)
- src/main.jsx: FOUND (no i18n import)
- 03-01-SUMMARY.md: FOUND

---
*Phase: 03-structural-cleanup*
*Completed: 2026-03-02*
