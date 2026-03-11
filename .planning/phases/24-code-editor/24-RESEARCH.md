# Phase 24: Code Editor - Research

**Researched:** 2026-03-10
**Domain:** CodeMirror 6 integration, file editing, multi-tab editor, diff view
**Confidence:** HIGH

## Summary

Phase 24 adds a CodeMirror 6-based code editor to the right panel of the Files tab, replacing the current "Select a file to view" placeholder in `FileTreePanel.tsx`. The editor needs syntax highlighting for 50+ languages (via `@codemirror/language-data` dynamic loading), a custom OKLCH theme, multi-tab support, file save via existing `PUT /api/projects/:projectName/file`, and diff view via `@codemirror/merge`.

The file store already has all the state management needed: `openTabs`, `activeFilePath`, `setDirty`, `openFile`, `closeFile`, `setActiveFile`. The backend read/write endpoints exist and are documented. The command palette's `FileGroup` already calls `openFile()` + `setActiveTab('files')`, proving the pattern works. The main work is building the CodeMirror wrapper, the OKLCH theme, the tab bar, and wiring save/load.

**Primary recommendation:** Use `@uiw/react-codemirror` (v4.25.x) as the React wrapper, `@codemirror/language-data` for dynamic language loading, `@codemirror/merge` for diff view, and `react-codemirror-merge` for the React merge wrapper. Build a custom theme using `EditorView.theme()` with CSS `var()` references to design tokens.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ED-01 | CodeMirror 6 with syntax highlighting for 50+ languages | `@uiw/react-codemirror` + `@codemirror/language-data` provides 50+ languages via dynamic import |
| ED-02 | Dynamic language grammar loading by file extension | `@codemirror/language-data` has `LanguageDescription.matchFilename()` for extension-based lookup with lazy loading |
| ED-03 | Custom OKLCH theme from design tokens | `EditorView.theme()` accepts CSS `var()` in style values; map `--surface-base`, `--text-*`, `--shiki-token-*` |
| ED-04 | Line numbers in gutter | `lineNumbers()` extension from `@codemirror/view` -- single function call |
| ED-05 | Unsaved indicator (dirty dot) on tabs | File store already has `setDirty(path, boolean)` and `isDirty` on `FileTab` |
| ED-06 | Save with Cmd+S via PUT endpoint | `keymap.of([{ key: 'Mod-s', run: saveHandler }])` + `PUT /api/projects/:projectName/file` |
| ED-07 | Save success/error toast | Sonner already installed, used in Settings tabs -- same pattern |
| ED-08 | Multiple file tabs with switching | File store has `openTabs[]`, `activeFilePath`, `setActiveFile()` |
| ED-09 | Tab filename with full path tooltip | Extract `path.split('/').pop()` for display, full path in `title` attribute |
| ED-10 | Tab close with empty state | File store `closeFile()` already handles fallback to last remaining tab; empty state when `openTabs.length === 0` |
| ED-11 | Save/discard confirmation on close | `alert-dialog.tsx` (shadcn) already available -- same sibling pattern as Settings (Phase 21) |
| ED-12 | Cmd+F built-in search | `@codemirror/search` extension -- `search()` enables Cmd+F overlay |
| ED-13 | Word wrap toggle | `EditorView.lineWrapping` extension toggled via React state |
| ED-14 | Diff view via @codemirror/merge | `react-codemirror-merge` (v4.25.x) wraps `MergeView` with Original/Modified components |
| ED-15 | Diff view from git panel | `GET /api/git/file-with-diff` returns `{ currentContent, oldContent, isDeleted, isUntracked }` |
| ED-16 | Click file path in chat tool cards opens in editor | Add click handler to file path in `ReadToolCard`/`EditToolCard`/`WriteToolCard` calling `openFile()` + `setActiveTab('files')` |
| ED-17 | Lazy-loaded via React.lazy + Suspense | Wrap entire editor component in `React.lazy(() => import(...))` -- keeps CM6 out of initial bundle |
| ED-18 | Binary file detection and message | Use `file-utils.ts` patterns + check for common binary extensions; show "cannot display" |
| ED-19 | Large file (>1MB) warning before loading | `FileTreeNode.size` field already available from tree data -- check before fetch |
| ED-20 | Breadcrumb path above editor | Split `activeFilePath` on `/` and render segments with separators |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @uiw/react-codemirror | ^4.25.8 | React wrapper for CodeMirror 6 | Most popular CM6 React wrapper (507 npm dependents). V1 used it. Handles lifecycle, controlled value, extensions. |
| @codemirror/language-data | latest | Dynamic language loading | Official CM6 package. Maps file extensions to language grammars. Lazy-loads on demand (dynamic `import()`). Supports 50+ languages. |
| @codemirror/merge | latest | Diff/merge view | Official CM6 merge extension. MergeView for side-by-side, unifiedMergeView for inline. |
| react-codemirror-merge | ^4.25.4 | React wrapper for @codemirror/merge | Part of @uiw ecosystem. Provides `<CodeMirrorMerge>`, `<Original>`, `<Modified>` components. |
| @uiw/codemirror-themes | ^4.25.x | Theme creation utility | `createTheme()` for building custom themes with settings + highlight styles. |

### Supporting (already installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| sonner | ^2.0.7 | Toast notifications | Save success/error feedback (ED-07) |
| @radix-ui/react-alert-dialog | installed | Confirmation dialogs | Save/discard on dirty tab close (ED-11) |
| lucide-react | installed | Icons | Tab icons, breadcrumb, word wrap toggle |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @uiw/react-codemirror | Raw CodeMirror 6 API | More control but 3x more boilerplate for React lifecycle management |
| @codemirror/language-data | Individual @codemirror/lang-* packages | Manual mapping, no automatic extension matching, more deps to manage |
| react-codemirror-merge | Raw @codemirror/merge | MergeView isn't a React component; need manual DOM management |

**Installation:**
```bash
cd src && npm install @uiw/react-codemirror @codemirror/language-data @codemirror/merge react-codemirror-merge @uiw/codemirror-themes @codemirror/search
```

Note: `@codemirror/view`, `@codemirror/state`, and `@lezer/highlight` are peer deps that come with `@uiw/react-codemirror`.

## Architecture Patterns

### Recommended Component Structure
```
src/src/components/editor/
  CodeEditor.tsx           # Main lazy-loaded editor component (React.lazy boundary)
  EditorTabs.tsx           # Horizontal tab bar for open files
  EditorBreadcrumb.tsx     # Path breadcrumb above editor
  EditorToolbar.tsx        # Word wrap toggle, line/col indicator
  DiffEditor.tsx           # Merge view wrapper (lazy-loaded separately)
  BinaryPlaceholder.tsx    # "Cannot display binary file" message
  LargeFileWarning.tsx     # ">1MB" warning with proceed/cancel
  loom-dark-theme.ts       # Custom OKLCH CodeMirror theme
  language-loader.ts       # Extension-to-language mapping with dynamic import
  editor.css               # Editor-specific styles (scrollbar, gutter tweaks)
src/src/hooks/
  useFileContent.ts        # Fetch file content from backend, handle loading/error
  useFileSave.ts           # PUT file content, toast feedback
```

### Pattern 1: Lazy-Loaded Editor with Suspense (ED-17)
**What:** Entire editor module behind React.lazy to keep CodeMirror (~300KB) out of initial bundle.
**When to use:** Always -- editor is in Files tab, most users start on Chat tab.
**Example:**
```typescript
// In FileTreePanel.tsx -- replace the placeholder div
const CodeEditor = lazy(() => import('@/components/editor/CodeEditor'));

// Render with Suspense
<Suspense fallback={<EditorSkeleton />}>
  <CodeEditor />
</Suspense>
```

### Pattern 2: OKLCH Theme via CSS var() (ED-03)
**What:** Custom CodeMirror theme that reads Loom design tokens at runtime via CSS custom properties.
**When to use:** For all editor surfaces. Keeps theme in sync with design system without hardcoded colors.
**Example:**
```typescript
import { EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';

const loomEditorTheme = EditorView.theme({
  '&': {
    backgroundColor: 'var(--code-surface)',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-mono)',
  },
  '.cm-gutters': {
    backgroundColor: 'var(--surface-base)',
    color: 'var(--text-muted)',
    borderRight: '1px solid var(--border-subtle)',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'var(--surface-active)',
  },
  '.cm-activeLine': {
    backgroundColor: 'var(--surface-active)',
  },
  '&.cm-focused .cm-cursor': {
    borderLeftColor: 'var(--accent-primary)',
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
    backgroundColor: 'var(--accent-primary-muted)',
  },
  '.cm-searchMatch': {
    backgroundColor: 'var(--accent-secondary)',
    opacity: '0.3',
  },
}, { dark: true });

// Syntax highlighting using existing --shiki-token-* variables
const loomHighlightStyle = HighlightStyle.define([
  { tag: tags.keyword, color: 'var(--shiki-token-keyword)' },
  { tag: tags.string, color: 'var(--shiki-token-string)' },
  { tag: tags.comment, color: 'var(--shiki-token-comment)' },
  { tag: tags.function(tags.variableName), color: 'var(--shiki-token-function)' },
  { tag: tags.number, color: 'var(--shiki-token-constant)' },
  { tag: tags.operator, color: 'var(--shiki-token-punctuation)' },
  { tag: tags.typeName, color: 'var(--shiki-token-parameter)' },
  { tag: tags.propertyName, color: 'var(--shiki-token-parameter)' },
  { tag: tags.definition(tags.variableName), color: 'var(--shiki-token-function)' },
  { tag: tags.link, color: 'var(--accent-primary)' },
]);

export const loomDarkTheme = [loomEditorTheme, syntaxHighlighting(loomHighlightStyle)];
```

### Pattern 3: Dynamic Language Loading (ED-02)
**What:** Load language grammars on demand based on file extension, not at import time.
**When to use:** Every file open -- never import language grammars at module level.
**Example:**
```typescript
import { LanguageDescription } from '@codemirror/language';
import { languages } from '@codemirror/language-data';

export async function loadLanguageForFile(filename: string): Promise<LanguageSupport | null> {
  const desc = LanguageDescription.matchFilename(languages, filename);
  if (!desc) return null;
  await desc.load();
  return desc.support!;
}
```

### Pattern 4: File Content Hook with Size Guard (ED-18, ED-19)
**What:** Custom hook that fetches file content, with binary detection and size warning.
**When to use:** When a file is selected in the tree or tabs.
**Example:**
```typescript
export function useFileContent(projectName: string, filePath: string | null) {
  // 1. Check FileTreeNode.size for >1MB warning (from file store or tree data)
  // 2. Check binary extension list before fetching
  // 3. GET /api/projects/:projectName/file?filePath=...
  // 4. Return { content, loading, error, isBinary, isLarge }
}
```

### Pattern 5: Tool Card File Path Click (ED-16)
**What:** Make file paths in Read/Edit/Write tool cards clickable, opening in the editor.
**When to use:** Any tool card displaying a file path.
**Example:**
```typescript
// Shared utility for tool cards
export function useOpenInEditor() {
  const openFile = useFileStore((s) => s.openFile);
  const setActiveTab = useUIStore((s) => s.setActiveTab);

  return useCallback((filePath: string) => {
    setActiveTab('files');
    openFile(filePath);
  }, [openFile, setActiveTab]);
}
```

### Anti-Patterns to Avoid
- **Importing language grammars at module level:** Each grammar is 20-100KB. Import `@codemirror/language-data` and use `LanguageDescription.matchFilename()` for lazy loading.
- **Recreating CodeMirror instance on every file switch:** Use `@uiw/react-codemirror`'s controlled `value` prop. It handles EditorView update diffing internally.
- **Storing file content in Zustand:** File content is large and ephemeral. Keep it in the editor component's local state or a ref. Only store metadata (path, dirty flag) in the file store.
- **Conditional rendering of CodeMirror based on tab:** Mount-once pattern means CodeMirror stays in DOM. CSS hide/show. This is already handled by `ContentArea.tsx`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Syntax highlighting | Custom tokenizer | `@codemirror/language-data` + language grammars | 50+ languages maintained by CodeMirror team |
| Search within file | Custom search UI | `@codemirror/search` extension | Handles regex, case-insensitive, replace, Cmd+F/Cmd+G keybindings |
| Diff view | Custom diff renderer | `@codemirror/merge` + `react-codemirror-merge` | Handles chunk detection, highlighting, gutter markers, collapse unchanged |
| File extension to language mapping | Switch statement | `LanguageDescription.matchFilename()` | Handles 150+ extensions, aliases, MIME types |
| Editor keybindings | Manual keydown handlers | `keymap.of()` from `@codemirror/view` | Proper event priority, conflicts resolved by CodeMirror |
| Line numbers | Custom gutter | `lineNumbers()` extension | Handles folding, breakpoint gutters, active line |

**Key insight:** CodeMirror 6 is extremely modular. Almost everything is an extension. Don't build custom editor features -- compose extensions.

## Common Pitfalls

### Pitfall 1: CodeMirror in Initial Bundle
**What goes wrong:** Importing CodeMirror at top level adds ~300KB to initial bundle.
**Why it happens:** Easy to forget `React.lazy()` or accidentally import a CM type at module level.
**How to avoid:** `React.lazy(() => import('./CodeEditor'))`. Never import `@codemirror/*` in files that aren't behind the lazy boundary. Use type-only imports (`import type`) for TypeScript types.
**Warning signs:** Bundle analyzer showing `@codemirror` in main chunk.

### Pitfall 2: Theme Mismatch with Design System
**What goes wrong:** Default CodeMirror theme looks jarring against Loom's warm charcoal OKLCH surfaces.
**Why it happens:** CM6 ships with a light/neutral theme by default.
**How to avoid:** Build custom theme using `EditorView.theme()` with CSS `var()` references to `tokens.css` variables. Test visually against adjacent panels.
**Warning signs:** Editor background doesn't match `--code-surface` (oklch 0.18).

### Pitfall 3: Cmd+S Captured by Browser
**What goes wrong:** Browser intercepts Cmd+S before CodeMirror sees it, triggering "Save As" dialog.
**Why it happens:** Browser default key handler has higher priority.
**How to avoid:** Use CodeMirror's `keymap.of()` which calls `preventDefault()` when the keybinding matches. Also add a global `keydown` listener with `e.preventDefault()` when the editor panel is active, as a safety net.
**Warning signs:** Browser "Save As" dialog appears instead of file save.

### Pitfall 4: Stale Content on Tab Switch
**What goes wrong:** User edits file A, switches to file B, switches back to file A, and edits are lost.
**Why it happens:** Naive implementation re-fetches content on every tab switch.
**How to avoid:** Cache file content locally (Map keyed by file path). Only re-fetch if the file isn't in cache OR if a WebSocket notification indicates the file changed on disk.
**Warning signs:** Unsaved edits disappear when switching tabs.

### Pitfall 5: Saving Stale Content
**What goes wrong:** User edits a file, but the save handler sends the original fetched content instead of the current editor content.
**Why it happens:** Using React state for content instead of reading from EditorView.
**How to avoid:** On save, read current content from `view.state.doc.toString()`, not from a React state variable. The `onChange` callback from `@uiw/react-codemirror` updates on every keystroke, so it's reliable, but reading from the view is the safest pattern.
**Warning signs:** Saved file doesn't match what's visible in the editor.

### Pitfall 6: Memory Leak from Language Loading
**What goes wrong:** Opening many files loads many language grammars into memory.
**Why it happens:** `@codemirror/language-data` caches loaded languages permanently.
**How to avoid:** This is actually fine -- language grammars are small (20-100KB each) and shared across all files of the same type. Don't worry about cleanup.
**Warning signs:** None expected for reasonable file counts (<100 tabs).

### Pitfall 7: React Strict Mode Double-Mount
**What goes wrong:** CodeMirror initializes twice in development, potentially causing duplicate event listeners.
**Why it happens:** React 19 strict mode mounts/unmounts/remounts in dev.
**How to avoid:** `@uiw/react-codemirror` handles this internally via its ref management. No special handling needed.
**Warning signs:** Console errors about duplicate CM instances (shouldn't happen with @uiw wrapper).

## Code Examples

### Backend API: Read File
```typescript
// GET /api/projects/:projectName/file?filePath=relative/path
// Response: { content: string, path: string }
// Errors: 400 (no path), 403 (outside root), 404 (not found), 403 (permission denied)
```

### Backend API: Save File
```typescript
// PUT /api/projects/:projectName/file
// Body: { filePath: string, content: string }
// Response: { success: true, path: string, message: string }
// Errors: 400 (no path/content), 403 (outside root), 404 (not found), 403 (permission denied)
```

### Backend API: Git Diff
```typescript
// GET /api/git/file-with-diff?project=:projectName&file=:filePath
// Response: { currentContent: string, oldContent: string, isDeleted: boolean, isUntracked: boolean }
```

### Existing File Store Actions (already implemented)
```typescript
// From src/src/stores/file.ts -- all of these exist and work:
openFile(path)        // Adds to openTabs if not there, sets activeFilePath
closeFile(path)       // Removes from openTabs, falls back to last remaining
setDirty(path, bool)  // Marks tab dirty/clean
setActiveFile(path)   // Switches active file
```

### Binary File Detection
```typescript
const BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.webp', '.svg',
  '.mp3', '.wav', '.ogg', '.mp4', '.mov', '.avi', '.webm',
  '.pdf', '.zip', '.gz', '.tar', '.rar', '.7z',
  '.exe', '.dll', '.so', '.dylib', '.wasm',
  '.ttf', '.otf', '.woff', '.woff2', '.eot',
]);

// Note: Images are already handled by isImageFile() in file-utils.ts
// and open in lightbox preview (FT-11). Binary detection here covers non-image binaries.
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Monaco Editor (VS Code) | CodeMirror 6 | 2022+ | 5-10x smaller bundle, modular architecture, better mobile support |
| Individual lang-* imports | @codemirror/language-data | CM6 v6.0+ | Single package handles all language detection and lazy loading |
| CodeMirror 5 merge addon | @codemirror/merge (standalone) | CM6 migration | Separate package, MergeView class, better API |
| createTheme() with hex colors | EditorView.theme() with CSS var() | Always available | Dynamic theming, design system integration |

## Open Questions

1. **Font size from Appearance settings**
   - What we know: `ThemeConfig.fontSize` (12-20px) is in the UI store, persisted. `codeFontFamily` also available.
   - What's unclear: Should the editor use the global `fontSize` or have its own? Appearance tab controls "font size" generically.
   - Recommendation: Use `fontSize` for editor text and `codeFontFamily` for the font family. Both are already in the UI store.

2. **Content caching strategy**
   - What we know: File content shouldn't be in Zustand (too large). Need local cache for tab switching.
   - What's unclear: When to invalidate cache (WebSocket file change notifications exist per FT-16).
   - Recommendation: Use a `Map<string, string>` ref in the editor component. Invalidate on WebSocket file-changed events. Re-fetch on save (optimistically update cache with saved content).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 + @testing-library/react |
| Config file | `src/vite.config.ts` (vitest section) |
| Quick run command | `cd src && npx vitest run --reporter=verbose` |
| Full suite command | `cd src && npx vitest run --coverage` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ED-01 | CodeMirror renders with syntax highlighting | integration | `cd src && npx vitest run src/src/components/editor/CodeEditor.test.tsx -x` | Wave 0 |
| ED-03 | OKLCH theme applies correct CSS vars | unit | `cd src && npx vitest run src/src/components/editor/loom-dark-theme.test.ts -x` | Wave 0 |
| ED-05 | Dirty indicator appears on modified tab | integration | `cd src && npx vitest run src/src/components/editor/EditorTabs.test.tsx -x` | Wave 0 |
| ED-06 | Cmd+S triggers save via PUT endpoint | integration | `cd src && npx vitest run src/src/hooks/useFileSave.test.ts -x` | Wave 0 |
| ED-08 | Multiple tabs render and switch | integration | `cd src && npx vitest run src/src/components/editor/EditorTabs.test.tsx -x` | Wave 0 |
| ED-11 | Close dirty tab shows confirmation | integration | `cd src && npx vitest run src/src/components/editor/EditorTabs.test.tsx -x` | Wave 0 |
| ED-16 | Tool card file path click opens editor | integration | `cd src && npx vitest run src/src/components/chat/tools/ReadToolCard.test.tsx -x` | Existing (needs update) |
| ED-18 | Binary file shows placeholder | unit | `cd src && npx vitest run src/src/components/editor/BinaryPlaceholder.test.tsx -x` | Wave 0 |
| ED-19 | Large file shows warning | unit | `cd src && npx vitest run src/src/components/editor/LargeFileWarning.test.tsx -x` | Wave 0 |
| ED-20 | Breadcrumb renders path segments | unit | `cd src && npx vitest run src/src/components/editor/EditorBreadcrumb.test.tsx -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `cd src && npx vitest run --reporter=verbose`
- **Per wave merge:** `cd src && npx vitest run --coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/src/components/editor/CodeEditor.test.tsx` -- covers ED-01, ED-04, ED-12, ED-13, ED-17
- [ ] `src/src/components/editor/EditorTabs.test.tsx` -- covers ED-05, ED-08, ED-09, ED-10, ED-11
- [ ] `src/src/components/editor/EditorBreadcrumb.test.tsx` -- covers ED-20
- [ ] `src/src/components/editor/BinaryPlaceholder.test.tsx` -- covers ED-18
- [ ] `src/src/components/editor/LargeFileWarning.test.tsx` -- covers ED-19
- [ ] `src/src/components/editor/loom-dark-theme.test.ts` -- covers ED-03
- [ ] `src/src/hooks/useFileContent.test.ts` -- covers fetch, binary, size guard
- [ ] `src/src/hooks/useFileSave.test.ts` -- covers ED-06, ED-07

Note: CodeMirror is notoriously difficult to test in jsdom (no real DOM layout). Tests should focus on:
- Hook behavior (fetch, save, error handling)
- Tab state management (open, close, dirty, switch)
- Utility functions (binary detection, language mapping, breadcrumb parsing)
- Integration tests that verify component renders (not CM6 internals)

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `src/src/stores/file.ts`, `src/src/types/file.ts` -- existing file store with all needed actions
- Codebase analysis: `server/index.js` lines 708-849 -- file read/write endpoints verified
- Codebase analysis: `server/routes/git.js` -- `file-with-diff` endpoint verified
- Codebase analysis: `src/src/styles/tokens.css` -- OKLCH tokens including `--shiki-token-*` and `--code-surface`
- Codebase analysis: `src/src/components/file-tree/FileTreePanel.tsx` -- placeholder to replace
- [CodeMirror 6 Styling](https://codemirror.net/examples/styling/) -- theme API documentation

### Secondary (MEDIUM confidence)
- [@uiw/react-codemirror npm](https://www.npmjs.com/package/@uiw/react-codemirror) -- v4.25.8, latest
- [@codemirror/language-data GitHub](https://github.com/codemirror/language-data) -- dynamic loading API
- [@codemirror/merge npm](https://www.npmjs.com/package/@codemirror/merge) -- MergeView and unifiedMergeView
- [react-codemirror-merge npm](https://www.npmjs.com/package/react-codemirror-merge) -- v4.25.4
- [Creating Themes DeepWiki](https://deepwiki.com/uiwjs/react-codemirror/4.2-creating-themes) -- createTheme API

### Tertiary (LOW confidence)
- CSS `var()` in `EditorView.theme()` -- not explicitly documented but standard CSS applies (CodeMirror uses `style-mod` which generates real CSS rules)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- @uiw/react-codemirror is V1-proven, versions verified on npm
- Architecture: HIGH -- file store, backend API, mount-once pattern all verified in codebase
- Pitfalls: HIGH -- based on codebase analysis and prior M3 research
- Theme approach: MEDIUM -- CSS var() in EditorView.theme() is standard CSS but not explicitly documented in CM6 docs

**Research date:** 2026-03-10
**Valid until:** 2026-04-10 (stable libraries, low churn)
