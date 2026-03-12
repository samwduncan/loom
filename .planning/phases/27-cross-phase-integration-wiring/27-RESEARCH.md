# Phase 27: Cross-Phase Integration Wiring - Research

**Researched:** 2026-03-12
**Domain:** React component integration, Zustand store extension, DOM attribute wiring
**Confidence:** HIGH

## Summary

Phase 27 closes three integration gaps discovered during the M3 milestone audit. All three are wiring issues -- the components and infrastructure already exist, they just need to be connected. No new libraries, no new patterns, no new backend endpoints required.

The three gaps are: (1) DiffEditor exists but is orphaned -- ChangesView opens plain CodeEditor instead of diff view when clicking changed files, (2) FileContextMenu has 3 of 4 required menu items -- "Open Containing Folder in Terminal" is missing, (3) `data-terminal` and `data-codemirror` escape guard attributes exist in keyboard shortcut handlers but are never placed on any DOM elements, causing Cmd+1-4 and Cmd+K to fire inside terminal and editor.

**Primary recommendation:** This is purely a wiring phase. Use the existing file store to add a `diffFile` action, add `data-terminal`/`data-codemirror` attributes to component root divs, and add the missing context menu item with `setActiveTab('shell')`.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ED-15 | Diff view activated when opening files from git panel's changed files list | DiffEditor.tsx (82 lines) and useFileDiff.ts (127 lines) exist and are tested. Need to wire into FileTreePanel via file store state. Backend endpoint `/api/git/file-with-diff` exists and returns `{ currentContent, oldContent, isDeleted, isUntracked }`. |
| GIT-06 | Clicking a changed file opens its diff in the code editor (switches to Files tab, activates diff view) | ChangesView.handleClickFile currently calls `openInEditor(path)` which opens plain file. Need new hook or store action to open file in diff mode. Same root cause as ED-15. |
| FT-09 | Right-click context menu on files with actions: Copy Path, Copy Relative Path, Open in Editor, Open Containing Folder in Terminal | FileTreeContextMenu.tsx has 3 of 4 items. Need to add "Open Containing Folder in Terminal" item that switches to shell tab. Terminal `sendInput` for `cd` command requires cross-component communication. |
</phase_requirements>

## Standard Stack

### Core (already installed)

| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| zustand | 5.x | State management (5 stores) | Installed, file store needs extension |
| @codemirror/merge | 6.x | Side-by-side diff view | Installed, DiffEditor.tsx uses it |
| react-codemirror-merge | 6.x | React wrapper for CM merge | Installed, DiffEditor.tsx uses it |
| lucide-react | latest | Icons for menu items | Installed |
| sonner | latest | Toast notifications | Installed |
| shadcn ContextMenu | - | Right-click menus (Radix-based) | Installed, used by FileTreeContextMenu |

### No new dependencies needed

This phase requires zero new npm packages.

## Architecture Patterns

### Pattern 1: File Store Diff State Extension

**What:** Add diff-mode state to the file store so FileTreePanel can conditionally render DiffEditor vs CodeEditor.

**Current file store shape:**
```typescript
interface FileState {
  expandedDirs: Set<string>;
  selectedPath: string | null;
  openTabs: FileTab[];
  activeFilePath: string | null;
}
```

**Required addition:**
```typescript
interface FileState {
  // ... existing fields
  diffFilePath: string | null;  // when set, active file renders in DiffEditor
}

interface FileActions {
  // ... existing actions
  openDiff: (path: string) => void;
  closeDiff: () => void;
}
```

**Why this pattern:** The file store already controls what the editor renders via `activeFilePath`. Adding `diffFilePath` follows the same single-source-of-truth pattern. When `activeFilePath === diffFilePath`, render DiffEditor; otherwise render CodeEditor. `closeDiff` clears diffFilePath when navigating away or closing the tab.

**Alternative considered:** A boolean `isDiffMode` on each `FileTab`. Rejected because diff mode is contextual (same file can be opened normally from the file tree and in diff from git panel) and the git panel doesn't create persistent tabs -- it's a transient view.

### Pattern 2: useOpenDiff Hook (parallel to useOpenInEditor)

**What:** A shared hook that switches to Files tab and opens a file in diff mode.

```typescript
export function useOpenDiff(): (filePath: string) => void {
  const openFile = useFileStore((s) => s.openFile);
  const openDiff = useFileStore((s) => s.openDiff);
  const setActiveTab = useUIStore((s) => s.setActiveTab);

  return useCallback(
    (filePath: string) => {
      setActiveTab('files');
      openFile(filePath);
      openDiff(filePath);
    },
    [setActiveTab, openFile, openDiff],
  );
}
```

**Why:** Mirrors the existing `useOpenInEditor` pattern (Constitution 4.2 selector hooks). ChangesView replaces `useOpenInEditor` with `useOpenDiff` in its `handleClickFile`.

### Pattern 3: Conditional Editor Rendering in FileTreePanel

**What:** FileTreePanel conditionally renders DiffEditor or CodeEditor based on store state.

```typescript
// In FileTreePanel.tsx
const LazyDiffEditor = lazy(() =>
  import('@/components/editor/DiffEditor').then((mod) => ({
    default: mod.DiffEditor,
  })),
);

// Inside the editor area:
{isDiffMode ? (
  <Suspense fallback={<EditorSkeleton />}>
    <LazyDiffEditor filePath={activeFilePath} />
  </Suspense>
) : (
  <Suspense fallback={<EditorSkeleton />}>
    <LazyCodeEditor />
  </Suspense>
)}
```

**Critical detail:** DiffEditor is self-contained -- it uses `useFileDiff` internally to fetch diff data from `/api/git/file-with-diff`. But the current DiffEditor takes `oldContent`/`newContent` as props. This means FileTreePanel needs to either:
- (a) Use `useFileDiff` in FileTreePanel and pass results as props, OR
- (b) Create a `DiffEditorWrapper` that owns `useFileDiff` and passes to `DiffEditor`

Option (b) keeps FileTreePanel clean and DiffEditor reusable. Recommend a thin wrapper component.

### Pattern 4: Terminal "cd" via Module-Level Ref

**What:** Expose the shell WebSocket's `sendInput` function via a module-level register/deregister pattern (same pattern as `_saveFn` in CodeEditor.tsx).

```typescript
// shell-input.ts (new module)
let _shellSendInput: ((data: string) => void) | null = null;

export function registerShellInput(fn: (data: string) => void): void {
  _shellSendInput = fn;
}

export function unregisterShellInput(): void {
  _shellSendInput = null;
}

export function sendToShell(data: string): boolean {
  if (!_shellSendInput) return false;
  _shellSendInput(data);
  return true;
}
```

**Where to register:** TerminalPanel.tsx registers `sendInput` from `useShellWebSocket` on mount, deregisters on unmount.

**Where to consume:** FileContextMenu calls `sendToShell(`cd "${dirPath}"\r`)` after `setActiveTab('shell')`.

**Why this over Zustand:** Terminal input is imperative, not reactive state. A store action for "pending cd command" would require polling/effects and adds unnecessary complexity. The module-level ref pattern is already established in the codebase (CodeEditor's `_saveFn`).

**Edge case:** If terminal is not yet connected (not mounted, or WS disconnected), `sendToShell` returns false. Show a toast: "Terminal not connected." The CSS show/hide pattern means TerminalPanel IS mounted after first visit to the Shell tab, so this only fails on very first use before Shell tab is ever visited.

### Pattern 5: Data Attribute Placement

**What:** Add `data-terminal=""` and `data-codemirror=""` DOM attributes to component root divs.

```typescript
// TerminalPanel.tsx - line 80
<div data-terminal="" className="flex h-full flex-col">

// CodeEditor.tsx - line 212
<div data-codemirror="" className="flex flex-col h-full overflow-hidden">
```

**Why on these elements:** The keyboard shortcut handlers use `target.closest('[data-terminal]')` and `target.closest('[data-codemirror]')`. The attribute must be on an ancestor of the focused element (xterm's textarea for terminal, CodeMirror's contenteditable for editor). Both TerminalPanel and CodeEditor are the outermost wrappers containing these interactive elements.

**Edge case for CodeEditor:** The empty state (no file selected), binary placeholder, and large file warning should NOT suppress shortcuts since they don't have a text input. Only the actual editor surface needs the guard. This means `data-codemirror` should go on the div wrapping the `<CodeMirror>` component, not the outermost div.

Actually, reconsidering: the escape guards exist to prevent Cmd+1-4 from firing *while typing in the editor*. If no file is open (empty state), there's no text input, so shortcuts should still work. Placing `data-codemirror` on the `<CodeMirror>` wrapper div (the `flex-1 min-h-0` div at line 232) is more precise. But placing it on the outermost div is simpler and functionally equivalent (keyboard shortcuts only fire from focused elements, and only CodeMirror's contenteditable receives focus). Either works -- recommend the simpler approach (outermost div) since the only focused descendant IS the CodeMirror instance.

### Anti-Patterns to Avoid

- **Adding diffFilePath to useOpenInEditor:** Don't overload the existing hook. Create a separate `useOpenDiff` hook to maintain single-responsibility.
- **Putting cd commands in Zustand:** Terminal input is imperative, not state. Don't add `pendingCdCommand` to any store.
- **Removing DiffEditor's props interface:** Keep DiffEditor as a pure presentation component that takes `oldContent`/`newContent` props. The data fetching wrapper is a separate concern.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Diff rendering | Custom diff algorithm | @codemirror/merge (already in DiffEditor.tsx) | Complex, edge-case-heavy |
| Context menu | Custom right-click handler | shadcn ContextMenu (already in FileTreeContextMenu.tsx) | Accessibility, positioning |
| Diff data fetching | Custom fetch logic | useFileDiff hook (already built, 127 lines) | Abort controller, FetchState pattern |

## Common Pitfalls

### Pitfall 1: DiffEditor Receives Stale Props on Tab Switch
**What goes wrong:** User opens diff for file A, switches to file B in tabs, then back -- DiffEditor may flash old content.
**Why it happens:** useFileDiff fetches asynchronously; the component shows stale data during the fetch.
**How to avoid:** useFileDiff already handles this with the "adjust state during rendering" pattern (resets to IDLE on path change, transitions to Loading in the same render). Just make sure the DiffEditorWrapper passes the correct `filePath` from store.
**Warning signs:** Content flash when switching between diff-open tabs.

### Pitfall 2: diffFilePath Persists After Closing Tab
**What goes wrong:** User views diff, closes the tab, opens same file normally -- still in diff mode.
**Why it happens:** `closeFile` doesn't clear `diffFilePath`.
**How to avoid:** `closeFile` action must also clear `diffFilePath` when the closed file matches it. Also clear `diffFilePath` when `setActiveFile` changes to a different path.

### Pitfall 3: Terminal cd Command with Special Characters
**What goes wrong:** Path contains spaces, quotes, or special characters -- `cd` command breaks.
**Why it happens:** Naive string interpolation.
**How to avoid:** Use single-quote wrapping with escaped single quotes: `cd '${path.replace(/'/g, "'\\''")}'\\r`

### Pitfall 4: data-codemirror on DiffEditor Too
**What goes wrong:** Keyboard shortcuts fire inside the diff view.
**Why it happens:** DiffEditor has its own CodeMirror instance that receives focus, but `data-codemirror` is only on CodeEditor.
**How to avoid:** Add `data-codemirror=""` to DiffEditor's root div as well, or to the wrapper component in FileTreePanel.

### Pitfall 5: "Open in Terminal" When Terminal Never Mounted
**What goes wrong:** User right-clicks file, selects "Open in Terminal" before ever visiting Shell tab.
**Why it happens:** CSS show/hide means TerminalPanel mounts on first tab visit. If never visited, no shell WS exists.
**How to avoid:** Check `sendToShell` return value. If false, show toast "Switch to Shell tab first." Or: consider force-mounting TerminalPanel if it hasn't been (but this adds complexity -- toast is simpler).

## Code Examples

### DiffEditorWrapper (data fetching layer)
```typescript
// Source: project codebase patterns (useFileDiff + DiffEditor)
import { useFileDiff } from '@/hooks/useFileDiff';
import { useProjectContext } from '@/hooks/useProjectContext';
import { DiffEditor } from '@/components/editor/DiffEditor';

export function DiffEditorWrapper({ filePath }: { filePath: string }) {
  const { projectName } = useProjectContext();
  const { oldContent, newContent, loading, error } = useFileDiff(projectName, filePath);

  if (loading) return <div className="...">Loading diff...</div>;
  if (error) return <div className="...">Diff error: {error}</div>;
  if (oldContent === null || newContent === null) return null;

  return <DiffEditor oldContent={oldContent} newContent={newContent} filePath={filePath} />;
}
```

### FileContextMenu "Open in Terminal" Item
```typescript
// Source: existing FileTreeContextMenu.tsx patterns
import { Terminal } from 'lucide-react';
import { useUIStore } from '@/stores/ui';
import { sendToShell } from '@/lib/shell-input';

// Inside FileContextMenu component:
const setActiveTab = useUIStore((s) => s.setActiveTab);

const handleOpenInTerminal = () => {
  const dirPath = filePath.slice(0, filePath.lastIndexOf('/'));
  setActiveTab('shell');
  const sent = sendToShell(`cd '${dirPath.replace(/'/g, "'\\''")}'\r`);
  if (!sent) {
    toast.error('Terminal not connected');
  }
};

// In JSX:
<ContextMenuSeparator />
<ContextMenuItem onSelect={handleOpenInTerminal}>
  <Terminal size={14} />
  Open Containing Folder in Terminal
</ContextMenuItem>
```

### Data Attribute Placement
```typescript
// TerminalPanel.tsx root div
<div data-terminal="" className="flex h-full flex-col">

// CodeEditor.tsx root div (the actual editor return, not empty/binary/large states)
<div data-codemirror="" className="flex flex-col h-full overflow-hidden">

// DiffEditor.tsx root div
<div data-codemirror="" className="flex flex-col h-full overflow-hidden">
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest + @testing-library/react |
| Config file | `src/vite.config.ts` (vitest section) |
| Quick run command | `cd src && npx vitest run --reporter=verbose` |
| Full suite command | `cd src && npx vitest run` |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ED-15 | DiffEditor renders when diffFilePath matches activeFilePath | unit | `cd src && npx vitest run src/src/components/file-tree/FileTreePanel.test.tsx -x` | Needs update |
| ED-15 | useOpenDiff hook switches tab and sets diffFilePath | unit | `cd src && npx vitest run src/src/hooks/useOpenDiff.test.ts -x` | Wave 0 |
| GIT-06 | ChangesView.handleClickFile calls openDiff, not openInEditor | unit | `cd src && npx vitest run src/src/components/git/ChangesView.test.tsx -x` | Exists, needs update |
| FT-09 | FileContextMenu renders "Open in Terminal" item | unit | `cd src && npx vitest run src/src/components/file-tree/FileTreeContextMenu.test.tsx -x` | Exists, needs update |
| FT-09 | Clicking "Open in Terminal" calls setActiveTab('shell') and sendToShell | unit | `cd src && npx vitest run src/src/components/file-tree/FileTreeContextMenu.test.tsx -x` | Exists, needs update |
| (integration) | data-terminal attribute on TerminalPanel root | unit | `cd src && npx vitest run src/src/components/terminal/TerminalPanel.test.tsx -x` | Needs check |
| (integration) | data-codemirror attribute on CodeEditor root | unit | `cd src && npx vitest run src/src/components/editor/CodeEditor.test.tsx -x` | Needs check |
| (integration) | Keyboard shortcuts suppressed inside [data-terminal] | unit | `cd src && npx vitest run src/src/components/content-area/hooks/useTabKeyboardShortcuts.test.ts -x` | Exists (tests already pass with mock attributes) |

### Sampling Rate
- **Per task commit:** `cd src && npx vitest run --reporter=verbose`
- **Per wave merge:** `cd src && npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/src/hooks/useOpenDiff.test.ts` -- covers ED-15/GIT-06 hook behavior
- [ ] `src/src/lib/shell-input.test.ts` -- covers register/unregister/sendToShell
- [ ] Update `FileTreeContextMenu.test.tsx` for "Open in Terminal" item
- [ ] Update `ChangesView.test.tsx` to verify openDiff instead of openInEditor
- [ ] Verify `FileTreePanel.test.tsx` handles conditional DiffEditor/CodeEditor

## Open Questions

1. **DiffEditor for deleted files**
   - What we know: `useFileDiff` returns `isDeleted` flag. Backend sends empty `currentContent` for deleted files.
   - What's unclear: Should DiffEditor show the deleted file content (old only) or show a special "file deleted" message?
   - Recommendation: Show DiffEditor normally with empty right side (new content = ""). The merge view handles this gracefully.

2. **DiffEditor for untracked files**
   - What we know: `useFileDiff` returns `isUntracked` flag. `oldContent` would be empty for new files.
   - What's unclear: Is showing a diff view useful for untracked files (empty left, full right)?
   - Recommendation: Yes, show it. This matches VS Code and other editors. It visually confirms "this is all new content."

3. **Should closeDiff auto-trigger on tab navigation?**
   - What we know: When user clicks a file tab (not from git panel), they expect normal editor.
   - What's unclear: Should switching tabs via EditorTabs clear diffFilePath?
   - Recommendation: Yes. `setActiveFile` should clear `diffFilePath` when the new path differs from `diffFilePath`. This means clicking between tabs always shows normal editor unless you clicked from git panel.

## Sources

### Primary (HIGH confidence)
- Codebase inspection: `ChangesView.tsx`, `DiffEditor.tsx`, `useFileDiff.ts`, `useOpenInEditor.ts`, `FileTreeContextMenu.tsx`, `TerminalPanel.tsx`, `CodeEditor.tsx`, `FileTreePanel.tsx`
- Codebase inspection: `useTabKeyboardShortcuts.ts`, `useCommandPaletteShortcut.ts` (escape guard patterns)
- Codebase inspection: `stores/file.ts`, `stores/ui.ts` (store shapes and actions)
- Backend: `server/routes/git.js` line 251 (`/api/git/file-with-diff` endpoint)

### Secondary (MEDIUM confidence)
- Milestone audit: `.planning/v1.2-MILESTONE-AUDIT.md` (gap identification and fix recommendations)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed, no new deps
- Architecture: HIGH -- all patterns follow existing codebase conventions (module-level ref, selector hooks, store actions)
- Pitfalls: HIGH -- identified from direct code inspection of existing components

**Research date:** 2026-03-12
**Valid until:** 2026-04-12 (stable -- internal wiring, no external dependencies)
