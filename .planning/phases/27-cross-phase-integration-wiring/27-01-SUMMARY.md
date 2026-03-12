---
phase: 27-cross-phase-integration-wiring
plan: 01
subsystem: ui
tags: [codemirror, zustand, xterm, diff-editor, context-menu, keyboard-shortcuts]

# Dependency graph
requires:
  - phase: 24-code-editor
    provides: CodeEditor, DiffEditor, useFileDiff, useOpenInEditor
  - phase: 25-terminal
    provides: TerminalPanel, useShellWebSocket
  - phase: 26-git-panel-navigation
    provides: ChangesView, GitPanel, FileContextMenu
provides:
  - useOpenDiff hook for diff-mode file opening
  - DiffEditorWrapper data-fetching wrapper for DiffEditor
  - shell-input module for cross-component terminal input
  - "Open in Terminal" context menu item in file tree
  - Keyboard escape guard data attributes on editor/terminal
affects: [milestone-audit, polish]

# Tech tracking
tech-stack:
  added: []
  patterns: [module-level-ref-for-imperative-io, conditional-lazy-loading]

key-files:
  created:
    - src/src/hooks/useOpenDiff.ts
    - src/src/hooks/useOpenDiff.test.ts
    - src/src/lib/shell-input.ts
    - src/src/lib/shell-input.test.ts
    - src/src/components/editor/DiffEditorWrapper.tsx
  modified:
    - src/src/types/file.ts
    - src/src/stores/file.ts
    - src/src/components/file-tree/FileTreePanel.tsx
    - src/src/components/git/ChangesView.tsx
    - src/src/components/git/ChangesView.test.tsx
    - src/src/components/file-tree/FileTreeContextMenu.tsx
    - src/src/components/file-tree/FileTreeContextMenu.test.tsx
    - src/src/components/terminal/TerminalPanel.tsx
    - src/src/components/editor/CodeEditor.tsx
    - src/src/components/editor/DiffEditor.tsx

key-decisions:
  - "Module-level ref pattern for shell-input (same as CodeEditor _saveFn) -- imperative IO, not reactive state"
  - "DiffEditorWrapper as thin data-fetching layer between file store and DiffEditor"
  - "diffFilePath === activeFilePath guard for diff mode activation in FileTreePanel"

patterns-established:
  - "Module-level register/deregister pattern for imperative cross-component communication"
  - "Conditional lazy-loading in FileTreePanel (DiffEditorWrapper vs CodeEditor based on diffFilePath)"

requirements-completed: [ED-15, GIT-06, FT-09]

# Metrics
duration: 6min
completed: 2026-03-12
---

# Phase 27 Plan 01: Cross-Phase Integration Wiring Summary

**Wire DiffEditor to git panel, add "Open in Terminal" to file tree, and place keyboard escape guard attributes on editor/terminal components**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-12T00:59:47Z
- **Completed:** 2026-03-12T01:05:29Z
- **Tasks:** 3
- **Files modified:** 15

## Accomplishments
- DiffEditor now renders when clicking a changed file in git panel ChangesView (via useOpenDiff -> diffFilePath -> DiffEditorWrapper)
- File tree context menu has "Open in Terminal" item that switches to Shell tab and sends cd command
- Keyboard shortcuts (Cmd+1-4, Cmd+K) are suppressed when focus is inside terminal or code editor via data attributes

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire DiffEditor to git panel ChangesView** - `ab9f593` (feat)
2. **Task 2: Add "Open in Terminal" to file context menu** - `8825fce` (feat)
3. **Task 3: Add keyboard escape guard data attributes** - `334c4ed` (fix)

## Files Created/Modified
- `src/src/types/file.ts` - Added diffFilePath to FileState, openDiff/closeDiff to FileActions
- `src/src/stores/file.ts` - Implemented openDiff, closeDiff actions; diffFilePath clearing in closeFile/setActiveFile
- `src/src/hooks/useOpenDiff.ts` - Hook to open files in diff mode (setActiveTab + openFile + openDiff)
- `src/src/hooks/useOpenDiff.test.ts` - Tests for useOpenDiff hook
- `src/src/components/editor/DiffEditorWrapper.tsx` - Data-fetching wrapper using useFileDiff, renders DiffEditor
- `src/src/components/file-tree/FileTreePanel.tsx` - Conditional lazy render of DiffEditorWrapper vs CodeEditor
- `src/src/components/git/ChangesView.tsx` - Replaced useOpenInEditor with useOpenDiff
- `src/src/components/git/ChangesView.test.tsx` - Updated mocks for useOpenDiff
- `src/src/lib/shell-input.ts` - Module-level register/deregister for shell WebSocket sendInput
- `src/src/lib/shell-input.test.ts` - Tests for shell-input module
- `src/src/components/file-tree/FileTreeContextMenu.tsx` - Added "Open in Terminal" menu item
- `src/src/components/file-tree/FileTreeContextMenu.test.tsx` - Tests for Open in Terminal
- `src/src/components/terminal/TerminalPanel.tsx` - Register shell input on mount, data-terminal attribute
- `src/src/components/editor/CodeEditor.tsx` - data-codemirror attribute on root div
- `src/src/components/editor/DiffEditor.tsx` - data-codemirror attribute on root div

## Decisions Made
- Module-level ref pattern for shell-input (same as CodeEditor _saveFn) -- terminal input is imperative IO, not reactive state suitable for Zustand
- DiffEditorWrapper as thin data-fetching layer between file store and DiffEditor -- keeps DiffEditor pure (props-only)
- diffFilePath === activeFilePath guard for diff mode activation -- prevents stale diff views when switching tabs

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- ESLint custom rule `loom/no-non-null-without-reason` caught a non-null assertion in test file -- added ASSERT comment (standard convention)

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All three cross-phase integration gaps (ED-15, GIT-06, FT-09) are now closed
- v1.2 milestone requirements should be fully satisfied
- Ready for milestone audit or completion

---
*Phase: 27-cross-phase-integration-wiring*
*Completed: 2026-03-12*
