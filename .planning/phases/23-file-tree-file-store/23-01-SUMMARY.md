---
phase: 23-file-tree-file-store
plan: 01
subsystem: ui
tags: [zustand, react, lucide-react, file-tree, hooks]

requires:
  - phase: 20-workspace-shell
    provides: File store skeleton with stub actions
provides:
  - Fully implemented file store with 7 actions (toggleDir, selectPath, openFile, closeFile, setDirty, setActiveFile, reset)
  - FileTreeNode type matching backend response shape
  - useFileTree hook for fetching tree data from backend API
  - FileIcon component with 20+ extension-to-icon mappings
  - FileTreePanel split layout shell (240px sidebar + editor placeholder)
affects: [23-02, 23-03, 24-terminal, 25-git-panel, 26-code-editor]

tech-stack:
  added: []
  patterns: [createElement for dynamic icon rendering, adjust-state-during-rendering for param changes]

key-files:
  created:
    - src/src/hooks/useFileTree.ts
    - src/src/hooks/useFileTree.test.ts
    - src/src/components/file-tree/FileIcon.tsx
    - src/src/components/file-tree/FileIcon.test.tsx
    - src/src/components/file-tree/FileTreePanel.tsx
    - src/src/components/file-tree/FileTreePanel.test.tsx
    - src/src/components/file-tree/file-tree.css
    - src/src/components/file-tree/file-icons.ts
  modified:
    - src/src/stores/file.ts
    - src/src/stores/file.test.ts
    - src/src/types/file.ts

key-decisions:
  - "createElement over JSX for dynamic icon rendering (avoids react-hooks/static-components lint violation)"
  - "file-icons.ts separated from FileIcon.tsx for react-refresh compatibility (function + component exports in same file triggers warning)"
  - "Adjust-state-during-rendering pattern with useState (not useRef) for prev-projectName tracking per react-hooks/refs rule"

patterns-established:
  - "Dynamic icon pattern: getFileIcon returns component type, FileIcon uses createElement to render"
  - "Tree fetch pattern: doFetch callback + event listener re-fetch + abort controller per effect lifecycle"

requirements-completed: [FT-01, FT-03, FT-04, FT-05, FT-14, FT-16]

duration: 7min
completed: 2026-03-10
---

# Phase 23 Plan 01: File Store + Tree Foundation Summary

**File store with 7 real actions, useFileTree hook fetching from backend API, FileIcon mapping 20+ extensions to lucide-react icons, and FileTreePanel 240px/flex-1 split layout shell**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-10T23:05:42Z
- **Completed:** 2026-03-10T23:13:09Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments
- Replaced all 6 stub actions in file store with real implementations (toggleDir, selectPath, openFile, closeFile, setDirty, setActiveFile)
- Added FileTreeNode type matching backend GET /api/projects/:name/files response shape
- Created useFileTree hook with fetch lifecycle, loom:projects-updated event re-fetch, retry support, and abort cleanup
- Created FileIcon component mapping .ts/.tsx/.js/.jsx/.json/.css/.md/.txt/.png/.jpg/.svg/.yaml/.yml/.toml/.env and more to appropriate lucide-react icons
- Created FileTreePanel with 240px tree sidebar (header + refresh button + placeholder) and flex-1 editor placeholder

## Task Commits

Each task was committed atomically:

1. **Task 1: File store implementation + FileTreeNode type** - `12b2bce` (feat)
2. **Task 2: useFileTree hook + FileIcon + FileTreePanel layout** - `99f6385` (feat)

## Files Created/Modified
- `src/src/types/file.ts` - Added FileTreeNode interface
- `src/src/stores/file.ts` - Replaced all stub actions with real implementations
- `src/src/stores/file.test.ts` - 18 tests covering all 7 store actions
- `src/src/hooks/useFileTree.ts` - Tree data fetching hook with event-based refresh
- `src/src/hooks/useFileTree.test.ts` - 5 tests covering fetch lifecycle, retry, events
- `src/src/components/file-tree/file-icons.ts` - Extension-to-icon mapping logic (separated for react-refresh)
- `src/src/components/file-tree/FileIcon.tsx` - Icon rendering component using createElement
- `src/src/components/file-tree/FileIcon.test.tsx` - 15 tests covering all extension categories
- `src/src/components/file-tree/FileTreePanel.tsx` - Split layout shell with header and placeholders
- `src/src/components/file-tree/FileTreePanel.test.tsx` - 2 tests for layout structure
- `src/src/components/file-tree/file-tree.css` - Tree node indentation, hover, and active styles

## Decisions Made
- Used `createElement` over JSX for dynamic icon rendering to avoid react-hooks/static-components lint violation (assigning a function result to a const and using it as JSX is flagged as "creating components during render")
- Separated `getFileIcon` into `file-icons.ts` from `FileIcon.tsx` because react-refresh warns when a file exports both components and functions
- Used `useState` (not `useRef`) for tracking previous projectName in useFileTree, since react-hooks/refs rule forbids reading refs during render in the "adjust state during rendering" pattern

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] React lint rule compliance for FileIcon**
- **Found during:** Task 2 (commit attempt)
- **Issue:** react-hooks/static-components flagged JSX with dynamic component. react-refresh/only-export-components warned about mixed exports.
- **Fix:** Split getFileIcon into separate file-icons.ts, used createElement instead of JSX for dynamic icon rendering
- **Files modified:** src/src/components/file-tree/FileIcon.tsx, src/src/components/file-tree/file-icons.ts
- **Verification:** ESLint passes, all tests pass
- **Committed in:** 99f6385

**2. [Rule 3 - Blocking] React lint rule compliance for useFileTree**
- **Found during:** Task 2 (commit attempt)
- **Issue:** react-hooks/set-state-in-effect flagged synchronous fetchTree() call in effect body. react-hooks/refs flagged ref access during render.
- **Fix:** Restructured to separate doFetch callback with eslint-disable comment (matching existing useSettingsData pattern), used useState instead of useRef for prev-projectName tracking
- **Files modified:** src/src/hooks/useFileTree.ts
- **Verification:** ESLint passes, all tests pass
- **Committed in:** 99f6385

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes necessary for lint compliance. No scope creep. Final architecture is cleaner with separated concerns.

## Issues Encountered
None beyond the lint issues documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- File store fully operational -- Plan 02 (recursive FileTree component) can consume all store actions
- useFileTree hook ready for integration into FileTreePanel in Plan 02
- FileIcon component ready for use in tree node rendering
- FileTreePanel layout shell provides the mounting point for tree and editor components

## Self-Check: PASSED

All 11 files verified present. Both task commits (12b2bce, 99f6385) verified in git log.

---
*Phase: 23-file-tree-file-store*
*Completed: 2026-03-10*
