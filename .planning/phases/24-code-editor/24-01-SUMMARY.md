---
phase: 24-code-editor
plan: 01
subsystem: ui
tags: [codemirror, code-editor, oklch, syntax-highlighting, react-lazy]

# Dependency graph
requires:
  - phase: 23-file-tree
    provides: file store, file tree panel, file-utils
  - phase: 21-settings
    provides: UI store themeConfig (fontSize, codeFontFamily)
provides:
  - CodeEditor component with OKLCH theme and dynamic language loading
  - useFileContent hook with binary/size guards
  - useFileSave hook with PUT save and toast feedback
  - EditorBreadcrumb, BinaryPlaceholder, LargeFileWarning guard components
  - loomDarkTheme CodeMirror extension using CSS var() tokens
  - loadLanguageForFile dynamic grammar loader
affects: [24-02-tab-bar-save, 24-03-diff-view]

# Tech tracking
tech-stack:
  added: ["@uiw/react-codemirror", "@codemirror/language-data", "@codemirror/merge", "react-codemirror-merge", "@uiw/codemirror-themes", "@codemirror/search"]
  patterns: [module-level-save-binding, adjust-state-during-rendering-for-hooks, const-enum-for-erasable-syntax]

key-files:
  created:
    - src/src/components/editor/CodeEditor.tsx
    - src/src/components/editor/loom-dark-theme.ts
    - src/src/components/editor/language-loader.ts
    - src/src/components/editor/EditorBreadcrumb.tsx
    - src/src/components/editor/BinaryPlaceholder.tsx
    - src/src/components/editor/LargeFileWarning.tsx
    - src/src/components/editor/editor.css
    - src/src/hooks/useFileContent.ts
    - src/src/hooks/useFileSave.ts
  modified:
    - src/package.json

key-decisions:
  - "EditorView.theme() with CSS var() over createTheme() -- stays in sync with design system at runtime"
  - "Module-level _saveFn binding for Cmd+S keymap -- avoids ref-during-render lint violation"
  - "domEventHandlers (not keymap.of) for save -- works with module-level function without render-time ref access"
  - "const object pattern over enum for FetchState -- erasableSyntaxOnly compatibility"
  - "useFileStore.getState() in event handlers only (not render) -- Constitution-compatible store reads"
  - "Adjust-state-during-rendering for path change resets in useFileContent and CodeEditor"

patterns-established:
  - "Module-level function binding: update via effect, read in event handlers"
  - "Const-object-as-enum: replaces TypeScript enum for erasableSyntaxOnly mode"
  - "CSS custom property wrapper: --editor-font-size on parent div avoids inline style lint"

requirements-completed: [ED-01, ED-02, ED-03, ED-04, ED-12, ED-13, ED-17, ED-18, ED-19, ED-20]

# Metrics
duration: 8min
completed: 2026-03-11
---

# Phase 24 Plan 01: Code Editor Core Summary

**CodeMirror 6 editor with OKLCH theme, dynamic syntax highlighting, file content/save hooks, and binary/large file guards**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-11T00:11:41Z
- **Completed:** 2026-03-11T00:19:59Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- CodeMirror 6 editor renders with full OKLCH theme matching Loom design tokens via CSS var()
- Dynamic language loading for TypeScript, JavaScript, JSON, CSS, Markdown via @codemirror/language-data
- File content fetching with binary detection (30+ extensions) and large file (>1MB) warning gate
- Cmd+S save with PUT endpoint integration and sonner toast feedback
- Breadcrumb path display, word wrap toggle, cursor position indicator (Ln/Col)

## Task Commits

Each task was committed atomically:

1. **Task 1: Install deps, build OKLCH theme and language loader** - `52e2f78` (feat)
2. **Task 2: Build hooks, editor component, breadcrumb, guards** - `459a00c` (feat)

## Files Created/Modified
- `src/src/components/editor/loom-dark-theme.ts` - OKLCH CodeMirror theme using CSS var() tokens, HighlightStyle with lezer tag mapping
- `src/src/components/editor/language-loader.ts` - Dynamic language loading by filename via @codemirror/language-data
- `src/src/components/editor/CodeEditor.tsx` - Main lazy-loadable editor wrapper with theme, search, save, wrap, guards
- `src/src/components/editor/EditorBreadcrumb.tsx` - Path segments with mono font above editor
- `src/src/components/editor/BinaryPlaceholder.tsx` - "Cannot display" placeholder for binary files
- `src/src/components/editor/LargeFileWarning.tsx` - Size warning with Open Anyway/Cancel actions
- `src/src/components/editor/editor.css` - CM6 container sizing, scrollbar, font-size CSS variable
- `src/src/hooks/useFileContent.ts` - File fetch hook with binary/size guards, adjust-state-during-rendering
- `src/src/hooks/useFileSave.ts` - PUT save hook with toast and dirty state management
- `src/package.json` - Added 6 CodeMirror 6 dependencies

## Decisions Made
- Used `EditorView.theme()` with CSS `var()` instead of `createTheme()` from `@uiw/codemirror-themes` -- simpler, stays in sync with design system at runtime, no theme value duplication
- Module-level `_saveFn` binding pattern for Cmd+S keymap -- avoids React 19 refs-during-render lint violation while keeping save function up to date via effect
- Used `EditorView.domEventHandlers()` instead of `keymap.of()` for save -- works with module-level function binding without requiring ref access during render
- Const object pattern for FetchState instead of TypeScript enum -- `erasableSyntaxOnly` enabled in tsconfig
- `useFileStore.getState()` used only in event handler callbacks (not render path) -- Constitution 4.2/4.5 compliant

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed refs-during-render lint violations**
- **Found during:** Task 2 (CodeEditor implementation)
- **Issue:** React 19 lint rules prohibit ref access during render; `keymap.of()` with ref-based save handler and `useRef.current` assignment during render both flagged
- **Fix:** Replaced with module-level `_saveFn` binding updated via effect, and `EditorView.domEventHandlers()` for save keymap
- **Files modified:** src/src/components/editor/CodeEditor.tsx
- **Verification:** ESLint passes with 0 warnings

**2. [Rule 3 - Blocking] Fixed set-state-in-effect violations**
- **Found during:** Task 2 (useFileContent implementation)
- **Issue:** Synchronous setState calls in effects flagged by React 19 lint rules
- **Fix:** Used "adjust state during rendering" pattern with prevPath tracking and single FetchResult state object
- **Files modified:** src/src/hooks/useFileContent.ts
- **Verification:** ESLint passes with 0 warnings

**3. [Rule 3 - Blocking] Fixed erasableSyntaxOnly enum restriction**
- **Found during:** Task 2 (useFileContent)
- **Issue:** TypeScript `enum FetchState` not allowed with `erasableSyntaxOnly` enabled
- **Fix:** Replaced with `const FetchState = {} as const` + type alias pattern
- **Files modified:** src/src/hooks/useFileContent.ts
- **Verification:** TypeScript compiles clean

**4. [Rule 3 - Blocking] Fixed inline style lint violation**
- **Found during:** Task 2 (CodeEditor)
- **Issue:** `style={{ fontSize }}` banned by `loom/no-banned-inline-style` Constitution rule
- **Fix:** Used CSS custom property `--editor-font-size` on wrapper div, consumed in editor.css
- **Files modified:** src/src/components/editor/CodeEditor.tsx, editor.css
- **Verification:** ESLint passes

---

**Total deviations:** 4 auto-fixed (4 blocking)
**Impact on plan:** All fixes addressed strict React 19 lint rules and Constitution enforcement. No scope creep.

## Issues Encountered
None beyond the lint/type deviations documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- CodeEditor is ready for lazy-loading integration (Plan 02 wires tab bar and save)
- Content cache supports multi-tab editing (Map keyed by file path)
- All guard components (Binary, LargeFile) ready for use
- Plan 03 (diff view) can import @codemirror/merge (already installed)

---
*Phase: 24-code-editor*
*Completed: 2026-03-11*
