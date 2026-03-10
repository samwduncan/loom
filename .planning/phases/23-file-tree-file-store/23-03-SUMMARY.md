---
phase: 23-file-tree-file-store
plan: 03
subsystem: ui
tags: [context-menu, radix, shadcn, lightbox, clipboard, file-tree]

# Dependency graph
requires:
  - phase: 23-file-tree-file-store
    provides: "File store, FileNode component, FileTree, command palette FileGroup"
provides:
  - "Right-click context menus on file and directory tree nodes"
  - "Image lightbox preview dialog"
  - "Command palette file opening wired to file store"
  - "expandDirs/collapseDirs store actions"
  - "isImageFile utility"
affects: [25-terminal, 26-code-editor]

# Tech tracking
tech-stack:
  added: [shadcn context-menu, radix-ui context-menu]
  patterns: [vi.spyOn clipboard after user-event setup, react-refresh file separation for mixed exports]

key-files:
  created:
    - src/src/components/file-tree/FileTreeContextMenu.tsx
    - src/src/components/file-tree/FileTreeContextMenu.test.tsx
    - src/src/components/file-tree/ImagePreview.tsx
    - src/src/components/file-tree/ImagePreview.test.tsx
    - src/src/components/file-tree/image-utils.ts
    - src/src/components/ui/context-menu.tsx
  modified:
    - src/src/components/file-tree/FileNode.tsx
    - src/src/components/file-tree/FileTree.tsx
    - src/src/components/command-palette/groups/FileGroup.tsx
    - src/src/stores/file.ts
    - src/src/types/file.ts

key-decisions:
  - "Selector hooks over getState() for context menu store actions (Constitution 4.2/4.5 compliance)"
  - "expandDirs/collapseDirs as named store actions instead of external setState calls"
  - "isImageFile extracted to image-utils.ts for react-refresh compatibility"
  - "vi.spyOn clipboard AFTER user-event setup to avoid replacement conflicts"

patterns-established:
  - "Context menu wrapping pattern: ContextMenu > ContextMenuTrigger asChild > content"
  - "Image detection via file extension utility (image-utils.ts)"

requirements-completed: [FT-09, FT-10, FT-11]

# Metrics
duration: 9min
completed: 2026-03-10
---

# Phase 23 Plan 03: Context Menus, Image Preview, and File Opening Summary

**Right-click context menus on file/directory nodes, image lightbox dialog, and command palette file selection wired to file store**

## Performance

- **Duration:** 9 min
- **Started:** 2026-03-10T23:22:02Z
- **Completed:** 2026-03-10T23:31:00Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments
- Right-click context menus on file nodes (Copy Path, Copy Relative Path, Open in Editor, Open in Terminal)
- Right-click context menus on directory nodes (Copy Path, Expand All recursive, Collapse All recursive)
- Image lightbox preview dialog for .png/.jpg/.gif/.svg/.webp/.ico files
- Command palette file selection now calls openFile on file store and switches to Files tab
- 17 new tests (926 total), all passing

## Task Commits

Each task was committed atomically:

1. **Task 1: Install shadcn context-menu + build context menus + image lightbox** - `dde5027` (feat)
2. **Task 2: Wire context menus into FileNode + wire FileGroup** - `8880006` (feat)

## Files Created/Modified
- `src/src/components/ui/context-menu.tsx` - shadcn context-menu primitive (z-index tokens fixed)
- `src/src/components/file-tree/FileTreeContextMenu.tsx` - FileContextMenu + DirContextMenu components
- `src/src/components/file-tree/FileTreeContextMenu.test.tsx` - 9 tests for context menus
- `src/src/components/file-tree/ImagePreview.tsx` - Lightbox dialog for image files
- `src/src/components/file-tree/ImagePreview.test.tsx` - 8 tests for image preview + isImageFile
- `src/src/components/file-tree/image-utils.ts` - isImageFile utility (extracted for react-refresh)
- `src/src/components/file-tree/FileNode.tsx` - Wrapped in context menus, image preview on click
- `src/src/components/file-tree/FileTree.tsx` - Passes projectRoot/projectName to FileNode
- `src/src/components/command-palette/groups/FileGroup.tsx` - Now calls openFile on selection
- `src/src/stores/file.ts` - Added expandDirs/collapseDirs actions
- `src/src/types/file.ts` - Added expandDirs/collapseDirs to FileActions

## Decisions Made
- Used selector hooks for store access in context menu handlers (not getState()) per Constitution lint rule
- Added expandDirs/collapseDirs as proper named store actions instead of external setState calls
- Extracted isImageFile to separate image-utils.ts to avoid react-refresh warning (mixed exports)
- Used vi.spyOn(navigator.clipboard, 'writeText') after userEvent.setup() to avoid clipboard replacement conflicts

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] shadcn context-menu import path and z-index**
- **Found during:** Task 1
- **Issue:** Generated context-menu imported from `@/utils` (wrong) and used `z-50` (banned)
- **Fix:** Fixed import to `@/utils/cn`, replaced z-50 with `z-[var(--z-dropdown)]`
- **Files modified:** `src/src/components/ui/context-menu.tsx`
- **Committed in:** dde5027

**2. [Rule 3 - Blocking] ESLint no-external-store-mutation violation**
- **Found during:** Task 1
- **Issue:** Plan specified `useFileStore.getState()` and `useFileStore.setState()` in component -- blocked by custom ESLint rule
- **Fix:** Refactored to selector hooks for actions, added expandDirs/collapseDirs store actions
- **Files modified:** FileTreeContextMenu.tsx, file.ts, file types
- **Committed in:** dde5027

**3. [Rule 3 - Blocking] react-refresh mixed export warning**
- **Found during:** Task 1
- **Issue:** ImagePreview.tsx exporting both component and isImageFile utility triggers react-refresh warning
- **Fix:** Extracted isImageFile to separate image-utils.ts file
- **Files modified:** ImagePreview.tsx, image-utils.ts, ImagePreview.test.tsx
- **Committed in:** dde5027

---

**Total deviations:** 3 auto-fixed (1 bug, 2 blocking)
**Impact on plan:** All fixes necessary for lint/Constitution compliance. No scope creep.

## Issues Encountered
- user-event clipboard replacement: @testing-library/user-event replaces navigator.clipboard on setup(), causing mock assertions to fail. Solved by using vi.spyOn after setup() instead of module-level Object.defineProperty.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Phase 23 complete -- file tree with store, UI, context menus, image preview, and command palette integration
- Ready for Phase 24 (Terminal) or Phase 25 (Git Panel) per ROADMAP
- Open in Terminal action stubs Phase 25 cd command (TODO comment in place)

## Self-Check: PASSED

All 11 files verified present. Both task commits (dde5027, 8880006) confirmed in git log.

---
*Phase: 23-file-tree-file-store*
*Completed: 2026-03-10*
