---
phase: 20-content-layout-tab-system
plan: 02
subsystem: ui
tags: [react, zustand, tabs, css-show-hide, accessibility, keyboard-shortcuts]

# Dependency graph
requires:
  - phase: 20-content-layout-tab-system/01
    provides: TabId type, activeTab/setActiveTab in UI store, file store
provides:
  - TabBar component with 4 workspace tabs (Chat, Files, Shell, Git)
  - ContentArea with mount-once CSS show/hide panel switching
  - useTabKeyboardShortcuts hook (Cmd/Ctrl+1-4)
  - PanelPlaceholder stubs for Files, Shell, Git
  - Mobile viewport override (render-path, no store mutation)
  - PanelErrorBoundary resetKeys support
affects: [21-settings, 22-command-palette, 23-file-tree, 24-code-editor, 25-terminal, 26-git-panel]

# Tech tracking
tech-stack:
  added: []
  patterns: [mount-once-css-show-hide, useSyncExternalStore-for-media-query, render-path-override]

key-files:
  created:
    - src/src/components/content-area/view/ContentArea.tsx
    - src/src/components/content-area/view/TabBar.tsx
    - src/src/components/content-area/view/PanelPlaceholder.tsx
    - src/src/components/content-area/hooks/useTabKeyboardShortcuts.ts
    - src/src/components/content-area/view/ContentArea.test.tsx
    - src/src/components/content-area/view/TabBar.test.tsx
    - src/src/components/content-area/hooks/useTabKeyboardShortcuts.test.ts
  modified:
    - src/src/components/shared/ErrorBoundary.tsx
    - src/src/components/app-shell/AppShell.tsx
    - src/src/App.tsx
    - src/src/App.test.tsx

key-decisions:
  - "useSyncExternalStore for mobile media query detection -- synchronous in render path, no useEffect flash"
  - "matchMedia called per-invocation (not cached at module level) for test mockability"
  - "Defensive typeof check for target.closest in keyboard handler -- Document objects lack .closest"
  - "ChatView rendered directly by ContentArea, /chat/:sessionId? route has element={null} for useParams context only"

patterns-established:
  - "Mount-once CSS show/hide: all panels always in DOM, toggle via hidden class"
  - "Mobile override: useSyncExternalStore + matchMedia, derive in render path without store mutation"
  - "Terminal escape hatch: data-terminal and data-codemirror attributes prevent keyboard shortcut theft"
  - "Tab ARIA pattern: tablist > tab (id=tab-{id}, aria-controls) + tabpanel (aria-labelledby=tab-{id})"

requirements-completed: [LAY-01, LAY-02, LAY-03, LAY-04, LAY-05, LAY-06, LAY-08]

# Metrics
duration: 7min
completed: 2026-03-10
---

# Phase 20 Plan 02: Content Area + Tab System Summary

**Tab bar with 4 workspace tabs, CSS show/hide content area, Cmd+1-4 keyboard shortcuts, and mobile chat-only override**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-10T16:08:55Z
- **Completed:** 2026-03-10T16:16:08Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments
- TabBar renders Chat/Files/Shell/Git with icons, labels, kbd hints, and full ARIA tablist/tab/tabpanel linkage
- ContentArea mounts all 4 panels simultaneously; CSS hidden class toggles visibility while preserving state
- Mobile viewports (<768px) force chat tab visible via useSyncExternalStore (no store mutation, no flash)
- PanelErrorBoundary now accepts resetKeys, clearing error state on tab switch
- App.tsx cleaned up: /dashboard and /settings routes removed, /chat/:sessionId? provides useParams context

## Task Commits

Each task was committed atomically:

1. **Task 1: TabBar + PanelPlaceholder + keyboard shortcuts** - `3918027` (feat)
2. **Task 2: ContentArea + AppShell/App.tsx rewiring** - `0b3cce7` (feat)

## Files Created/Modified
- `src/src/components/content-area/view/TabBar.tsx` - Tab bar with 4 tabs, icons, ARIA, kbd hints
- `src/src/components/content-area/view/ContentArea.tsx` - Mount-once CSS show/hide container
- `src/src/components/content-area/view/PanelPlaceholder.tsx` - Stub placeholder for future panels
- `src/src/components/content-area/hooks/useTabKeyboardShortcuts.ts` - Cmd/Ctrl+1-4 shortcuts
- `src/src/components/content-area/view/TabBar.test.tsx` - 7 tests for TabBar
- `src/src/components/content-area/view/ContentArea.test.tsx` - 7 tests for ContentArea
- `src/src/components/content-area/hooks/useTabKeyboardShortcuts.test.ts` - 9 tests for shortcuts
- `src/src/components/shared/ErrorBoundary.tsx` - Added resetKeys prop pass-through
- `src/src/components/app-shell/AppShell.tsx` - Replaced Outlet with ContentArea
- `src/src/App.tsx` - Removed dashboard/settings routes, kept /chat/:sessionId? with element={null}
- `src/src/App.test.tsx` - Removed obsolete dashboard/settings route tests

## Decisions Made
- Used `useSyncExternalStore` with `window.matchMedia` for mobile detection -- synchronous in render path, avoids useEffect flash that would briefly show wrong tab
- Made matchMedia non-cached (called per-invocation) to support test mocking without module-level side effects
- Added defensive `typeof target.closest === 'function'` check in keyboard handler because Document (event target when dispatching on document) lacks the `.closest` method
- ChatView rendered directly by ContentArea rather than via React Router Outlet -- /chat/:sessionId? route exists solely for useParams match context

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Defensive closest() check in keyboard handler**
- **Found during:** Task 1 (keyboard shortcuts)
- **Issue:** jsdom's Document object doesn't have `.closest()` method, causing TypeError when keyboard events target the document
- **Fix:** Added `typeof target.closest === 'function'` guard before calling `.closest()`
- **Files modified:** `src/src/components/content-area/hooks/useTabKeyboardShortcuts.ts`
- **Verification:** All 9 keyboard shortcut tests pass
- **Committed in:** `3918027`

**2. [Rule 1 - Bug] Removed obsolete App.tsx route tests**
- **Found during:** Task 2 (full test suite verification)
- **Issue:** Tests for /dashboard and /settings routes failed after those routes were removed
- **Fix:** Removed 2 obsolete test cases from App.test.tsx
- **Files modified:** `src/src/App.test.tsx`
- **Verification:** All 743 tests pass
- **Committed in:** `0b3cce7`

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Both fixes necessary for correctness. No scope creep.

## Issues Encountered
None beyond the auto-fixed items above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 20 complete: UI store contracts, type foundation, tab bar, content area all wired
- All 4 panel slots ready for real implementations in Phases 21-26
- PanelPlaceholder stubs in Files, Shell, Git will be replaced by real components
- Terminal components must add `data-terminal` attribute for keyboard shortcut escape hatch
- CodeMirror components must add `data-codemirror` attribute similarly

---
*Phase: 20-content-layout-tab-system*
*Completed: 2026-03-10*
