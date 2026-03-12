---
phase: 24-code-editor
plan: 03
subsystem: ui
tags: [codemirror, merge-view, diff, editor, tool-cards, zustand]

# Dependency graph
requires:
  - phase: 24-code-editor (plan 01)
    provides: loom-dark-theme, language-loader, EditorBreadcrumb, editor.css
  - phase: 24-code-editor (plan 02)
    provides: CodeEditor, EditorTabs, file store wiring
provides:
  - DiffEditor component (CodeMirror merge view wrapper)
  - useFileDiff hook (fetches diff data from git endpoint)
  - useOpenInEditor hook (shared file-opening utility)
  - Clickable file paths in Read, Edit, Write tool cards
affects: [26-git-panel, chat-tools]

# Tech tracking
tech-stack:
  added: [react-codemirror-merge]
  patterns: [FetchState single-state pattern for diff hook, useOpenInEditor shared action hook]

key-files:
  created:
    - src/src/components/editor/DiffEditor.tsx
    - src/src/hooks/useFileDiff.ts
    - src/src/hooks/useOpenInEditor.ts
  modified:
    - src/src/components/editor/editor.css
    - src/src/components/chat/tools/ReadToolCard.tsx
    - src/src/components/chat/tools/EditToolCard.tsx

key-decisions:
  - "FetchState pattern (same as useFileContent) for useFileDiff to avoid setState-in-effect lint violations"
  - "No default export on DiffEditor -- uses named export remapping pattern for lazy() like CodeEditor"
  - "useOpenInEditor as shared hook rather than inline logic per tool card"

patterns-established:
  - "useOpenInEditor: reusable hook for any component needing to open a file in the editor"
  - "Diff CSS via .diff-editor-wrapper scoping on cm-changedLine/cm-deletedChunk"

requirements-completed: [ED-14, ED-15, ED-16]

# Metrics
duration: 4min
completed: 2026-03-11
---

# Phase 24 Plan 03: Diff View and Tool Card File Links Summary

**CodeMirror merge view for diffs plus clickable file paths in Read/Edit/Write chat tool cards**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-11T00:32:04Z
- **Completed:** 2026-03-11T00:36:09Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- DiffEditor component with side-by-side merge view using OKLCH theme and diff-colored backgrounds
- useFileDiff hook fetching diff data from /api/git/file-with-diff with AbortController cleanup
- Clickable file paths in all three tool cards (Read, Edit, Write) that switch to Files tab and open the file

## Task Commits

Each task was committed atomically:

1. **Task 1: Build DiffEditor and useFileDiff hook** - `0546aab` (feat)
2. **Task 2: Make tool card file paths clickable to open in editor** - `32d45e7` (feat)

## Files Created/Modified
- `src/src/components/editor/DiffEditor.tsx` - CodeMirror merge view wrapper with OKLCH theme
- `src/src/hooks/useFileDiff.ts` - Fetches old/new content from git diff endpoint
- `src/src/hooks/useOpenInEditor.ts` - Shared hook: setActiveTab('files') + openFile(path)
- `src/src/components/editor/editor.css` - Added diff-specific CSS for merge view backgrounds
- `src/src/components/chat/tools/ReadToolCard.tsx` - File path span changed to clickable button (FileContentCard, shared with WriteToolCard)
- `src/src/components/chat/tools/EditToolCard.tsx` - File path span changed to clickable button

## Decisions Made
- FetchState single-state pattern reused from useFileContent for useFileDiff -- avoids react-hooks/set-state-in-effect lint violations
- No default export on DiffEditor -- project uses named export remapping pattern (`import().then(mod => ({ default: mod.DiffEditor }))`) for React.lazy
- useOpenInEditor as a shared hook (not inline per component) -- DRY and reusable for future components

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed default export from DiffEditor**
- **Found during:** Task 1
- **Issue:** Plan said "Export as named export and default export" but ESLint Constitution 2.2 rule bans default exports
- **Fix:** Removed default export; DiffEditor uses named export only (lazy loading uses remapping pattern)
- **Files modified:** src/src/components/editor/DiffEditor.tsx
- **Verification:** ESLint passes clean
- **Committed in:** 0546aab

**2. [Rule 1 - Bug] Rewrote useFileDiff to use FetchState pattern**
- **Found during:** Task 1
- **Issue:** Initial implementation used individual setState calls in effect, triggering react-hooks/set-state-in-effect lint error
- **Fix:** Adopted FetchState single-state pattern (same as useFileContent) with "adjust state during rendering"
- **Files modified:** src/src/hooks/useFileDiff.ts
- **Verification:** ESLint passes clean, TypeScript compiles
- **Committed in:** 0546aab

---

**Total deviations:** 2 auto-fixed (2 bugs/lint violations)
**Impact on plan:** Both fixes necessary for lint compliance. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 24 (Code Editor) is now complete with all 3 plans delivered
- DiffEditor ready for Phase 26 (Git Panel) wiring
- useOpenInEditor available for any future component needing editor file opening
- 920 tests passing, 0 lint errors

## Self-Check: PASSED

All 6 files verified present. Both commit hashes (0546aab, 32d45e7) confirmed in git log.

---
*Phase: 24-code-editor*
*Completed: 2026-03-11*
