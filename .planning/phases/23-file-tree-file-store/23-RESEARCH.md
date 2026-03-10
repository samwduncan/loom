# Phase 23: File Tree + File Store - Research

**Researched:** 2026-03-10
**Domain:** File tree UI component, Zustand file store implementation, backend file API integration
**Confidence:** HIGH

## Summary

Phase 23 builds the file browser panel -- a hierarchical file tree in the left portion of the Files tab with the right side reserved for the code editor (Phase 24). The core work is: (1) implementing the stub file store actions that were deferred from Phase 20, (2) building a recursive tree component with expand/collapse, file icons, search filtering, and context menus, (3) wiring to the existing backend `GET /api/projects/:projectName/files` endpoint, and (4) handling real-time updates via the existing `projects_updated` WebSocket event.

The backend already returns a full nested tree (depth 10, hardcoded) with metadata (name, path, type, size, modified, permissions). It already filters `node_modules`, `.git`, `dist`, `build`, `.svn`, `.hg`. The frontend file store skeleton exists with stub actions that throw in dev mode. The ContentArea already renders a `PanelPlaceholder` for the Files tab using the mount-once CSS show/hide pattern. The command palette's `FileGroup` already switches to the Files tab but stubs out the actual file opening (deferred to this phase).

The main complexity is the tree UI itself -- recursive rendering with memoization, icon mapping by file extension, fuzzy search filtering, right-click context menus, and image preview lightbox. No new npm dependencies are needed beyond installing the shadcn `context-menu` primitive. Everything else (lucide-react for icons, existing apiFetch, existing WebSocket infrastructure) is already in place.

**Primary recommendation:** Build the file store implementation first, then the tree UI, then layer on search/context-menu/image-preview. The editor placeholder (right panel) should show "Select a file to view" until Phase 24.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FT-01 | Files tab shows project file tree in left panel (~240px) with code editor in remaining space | ContentArea already renders Files panel via mount-once pattern; needs split layout (tree left, editor placeholder right) |
| FT-02 | File tree renders hierarchical directory structure with indentation per nesting level | Recursive FileNode component with depth-based paddingLeft; backend returns nested children arrays |
| FT-03 | Directories show expand/collapse chevron; clicking toggles children visibility | File store `expandedDirs: string[]` already typed; implement `toggleDir` action |
| FT-04 | Expansion state persists across tab switches (stored in file store) | Mount-once CSS show/hide pattern preserves DOM; file store is ephemeral (no persist middleware) -- state survives tab switches but not page reloads |
| FT-05 | Files and folders display type-appropriate icons using lucide-react | lucide-react already installed; build extension-to-icon map |
| FT-06 | Clicking a file opens it in the code editor panel (right side of Files tab) | File store `openFile` + `setActiveFile` actions; Phase 24 provides actual editor, Phase 23 shows filename/path placeholder |
| FT-07 | Currently open file is highlighted in the tree | File store `activeFilePath` selector; conditional styling in FileNode |
| FT-08 | Search/filter input at top of tree panel filters visible files by fuzzy match | Client-side filter on flattened tree; no dependency needed (simple substring or basic fuzzy) |
| FT-09 | Right-click context menu on files: Copy Path, Copy Relative Path, Open in Editor, Open Containing Folder in Terminal | shadcn context-menu (NOT yet installed, needs `npx shadcn@latest add context-menu`) |
| FT-10 | Right-click context menu on directories: Copy Path, Expand All, Collapse All | Same context-menu primitive; recursive expand/collapse helper on file store |
| FT-11 | Image files open in lightbox preview instead of code editor | shadcn Dialog (already installed) for lightbox; detect image extensions (png, jpg, gif, svg, webp) |
| FT-12 | File tree shows loading skeleton on initial fetch | Skeleton component (NOT installed as shadcn primitive -- use Tailwind animate-pulse divs or install shadcn skeleton) |
| FT-13 | File tree shows error state with retry button if fetch fails | Standard error/retry pattern with apiFetch |
| FT-14 | Directories lazy-load children on expand (not full tree at once) for large projects | Backend currently returns full depth-10 tree with NO lazy-load support. Two options: (A) add `?depth=1&path=` query params to backend, or (B) load full tree on initial fetch and expand/collapse client-side. Option B is simpler and acceptable for M3 -- backend already filters heavy dirs. Option A deferred. |
| FT-15 | node_modules, .git, and other standard ignored directories are hidden by default | Backend already filters these server-side in `getFileTree`. Additional client-side filtering for hidden files (dotfiles) with toggle |
| FT-16 | File tree refreshes when backend sends file change notifications via WebSocket | `projects_updated` event already wired to `window.dispatchEvent(new CustomEvent('loom:projects-updated'))` -- listen for this event and re-fetch |
</phase_requirements>

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| React 19 | ^19.2.0 | UI framework | Installed |
| TypeScript | ~5.9.3 | Type safety | Installed |
| Zustand 5 | ^5.0.11 | File store (5th store) | Installed, stub actions in place |
| lucide-react | ^0.577.0 | File type icons, chevrons | Installed |
| Tailwind v4 | ^4.2.1 | Styling | Installed |

### New Dependencies
| Library | Version | Purpose | Why Needed |
|---------|---------|---------|------------|
| shadcn context-menu | N/A (Radix-based) | Right-click menus on files/dirs | FT-09, FT-10 require context menus |

**No skeleton component is installed.** Phase 20 used Tailwind `animate-pulse` divs for loading states. The Settings phase (21) installed a custom skeleton approach. Check what exists and reuse.

### Already Available shadcn Primitives
- `dialog` -- for image lightbox (FT-11)
- `scroll-area` -- for tree scrolling
- `tooltip` -- for file path tooltips
- `input` -- for search filter
- `button` -- for retry button

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom recursive tree | react-arborist | Adds ~20KB dep for something achievable in ~200 LOC. Custom is better here. |
| fuse.js for fuzzy search | Simple substring filter | fuse.js is overkill for filtering visible tree nodes. Start with case-insensitive includes, upgrade later if needed. |
| Virtualized tree (react-window) | Plain recursive render | Only needed for 1000+ visible nodes. Start without, add if perf issues arise. |

**Installation:**
```bash
cd src && npx shadcn@latest add context-menu
```

## Architecture Patterns

### Recommended Project Structure
```
src/src/
  components/
    file-tree/
      FileTreePanel.tsx        # Main panel: split layout (tree + editor placeholder)
      FileTree.tsx             # Tree container: fetch, search, error/loading states
      FileNode.tsx             # Recursive tree node (memo'd)
      FileIcon.tsx             # Extension-to-icon mapper
      FileTreeSearch.tsx       # Search input with filter state
      FileTreeContextMenu.tsx  # Right-click menu (files + dirs)
      ImagePreview.tsx         # Lightbox for image files
      file-tree.css            # Scoped styles (tree indentation, hover states)
  hooks/
    useFileTree.ts             # Fetch + cache + refresh logic for file tree data
  stores/
    file.ts                    # Implement stub actions (already exists)
  types/
    file.ts                    # Extend with FileTreeNode type (already exists)
```

### Pattern 1: File Store Implementation
**What:** Replace stub actions with real implementations.
**When to use:** First task of the phase -- everything depends on this.
**Key decisions already locked:**
- `expandedDirs: string[]` (not Set) -- avoids JSON serialization issues
- No persist middleware -- ephemeral per session
- String-based paths throughout

```typescript
// Implement the existing stub actions:
toggleDir: (path) => set((state) => ({
  expandedDirs: state.expandedDirs.includes(path)
    ? state.expandedDirs.filter((d) => d !== path)
    : [...state.expandedDirs, path],
})),

openFile: (path) => set((state) => {
  const alreadyOpen = state.openTabs.some((t) => t.filePath === path);
  return {
    activeFilePath: path,
    selectedPath: path,
    openTabs: alreadyOpen
      ? state.openTabs
      : [...state.openTabs, { filePath: path, isDirty: false }],
  };
}),

closeFile: (path) => set((state) => {
  const filtered = state.openTabs.filter((t) => t.filePath !== path);
  return {
    openTabs: filtered,
    activeFilePath: state.activeFilePath === path
      ? (filtered[filtered.length - 1]?.filePath ?? null)
      : state.activeFilePath,
  };
}),
```

### Pattern 2: Backend File Tree Response Shape
**What:** The backend `getFileTree` returns a flat-ish nested structure.
**Source:** Direct analysis of `server/index.js` lines 1841-1915.

```typescript
// Backend response shape (verified from source):
interface BackendFileNode {
  name: string;           // "src"
  path: string;           // "/home/swd/loom/src" (absolute path)
  type: 'file' | 'directory';
  size: number;           // bytes (0 if stat fails)
  modified: string | null; // ISO 8601 or null
  permissions: string;    // "755" octal string
  permissionsRwx: string; // "rwxr-xr-x"
  children?: BackendFileNode[]; // Only on directories, recursed to depth 10
}

// GET /api/projects/:projectName/files returns BackendFileNode[]
// Sorted: directories first, then alphabetical by name
// Already filters: node_modules, .git, dist, build, .svn, .hg
```

### Pattern 3: Recursive Memoized Tree Node
**What:** Each FileNode is memo'd with granular store selectors.
**Why:** Without memo, expanding any directory re-renders the entire tree.

```typescript
const FileNode = memo(function FileNode({ node, depth }: { node: FileTreeNode; depth: number }) {
  const isExpanded = useFileStore((s) => s.expandedDirs.includes(node.path));
  const isActive = useFileStore((s) => s.activeFilePath === node.path);
  const toggleDir = useFileStore((s) => s.toggleDir);
  const openFile = useFileStore((s) => s.openFile);
  // ...render with depth-based indentation
});
```

### Pattern 4: File Tree Data Hook
**What:** Custom hook wraps fetch + WebSocket refresh + error handling.

```typescript
export function useFileTree(projectName: string) {
  const [tree, setTree] = useState<BackendFileNode[]>([]);
  const [fetchState, setFetchState] = useState<'idle' | 'loading' | 'error' | 'success'>('idle');

  const fetchTree = useCallback(async () => {
    setFetchState('loading');
    try {
      const data = await apiFetch<BackendFileNode[]>(
        `/api/projects/${encodeURIComponent(projectName)}/files`
      );
      setTree(data);
      setFetchState('success');
    } catch {
      setFetchState('error');
    }
  }, [projectName]);

  // Initial fetch
  useEffect(() => { void fetchTree(); }, [fetchTree]);

  // WebSocket-driven refresh on file changes
  useEffect(() => {
    const handler = () => void fetchTree();
    window.addEventListener('loom:projects-updated', handler);
    return () => window.removeEventListener('loom:projects-updated', handler);
  }, [fetchTree]);

  return { tree, fetchState, retry: fetchTree };
}
```

### Pattern 5: File Type Icon Mapping
**What:** Map file extensions to lucide-react icons.

```typescript
import {
  File, FileText, FileJson, FileCode, FileImage,
  Folder, FolderOpen, FileType, Coffee, Cog,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  '.ts': FileCode, '.tsx': FileCode, '.js': FileCode, '.jsx': FileCode,
  '.json': FileJson, '.css': FileText, '.md': FileText, '.html': FileCode,
  '.png': FileImage, '.jpg': FileImage, '.gif': FileImage, '.svg': FileImage, '.webp': FileImage,
  '.py': FileCode, '.rs': FileCode, '.go': FileCode,
  '.yaml': Cog, '.yml': Cog, '.toml': Cog,
};

export function getFileIcon(name: string, isDirectory: boolean, isExpanded: boolean) {
  if (isDirectory) return isExpanded ? FolderOpen : Folder;
  const ext = name.includes('.') ? '.' + name.split('.').pop()! : '';
  return ICON_MAP[ext] ?? File;
}
```

### Anti-Patterns to Avoid
- **Re-rendering entire tree on any store change:** Use granular selectors per FileNode (isExpanded, isActive) not `useFileStore(s => s)`.
- **Storing tree data in Zustand:** The file tree response is fetched data, not user state. Keep it in the `useFileTree` hook's local state. The file store holds UI state only (expandedDirs, selectedPath, openTabs, activeFilePath).
- **Modifying backend for lazy-load in this phase:** The backend returns depth 10 which is sufficient. Adding query params is scope creep for M3. The backend already filters heavy directories.
- **Using conditional rendering for the Files panel:** The panel is already mounted via CSS show/hide. Don't change this.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Right-click context menu | Custom div with onClick outside | shadcn context-menu (Radix) | Positioning, keyboard nav, accessibility, portal rendering |
| Image lightbox | Custom modal with zoom | shadcn Dialog + img tag | Dialog already handles focus trap, backdrop, Escape key |
| Scroll container | Overflow div | shadcn scroll-area | Cross-browser scrollbar styling, touch support |
| Clipboard copy | Custom clipboard API wrapper | `navigator.clipboard.writeText()` | Browser API is sufficient; no library needed |

## Common Pitfalls

### Pitfall 1: File Store expandedDirs Performance
**What goes wrong:** `expandedDirs.includes(path)` is O(n) per node. With 500 expanded dirs and 2000 visible nodes, that's 1M comparisons per render.
**Why it happens:** Decision to use `string[]` not `Set` was for serialization.
**How to avoid:** This is acceptable for M3 scale. If perf becomes an issue, convert to a `Record<string, boolean>` lookup (JSON-serializable, O(1) lookup). Don't prematurely optimize.
**Warning signs:** Visible lag when expanding directories in large repos.

### Pitfall 2: Full Tree Fetch Blocking UI
**What goes wrong:** Fetching the full depth-10 tree for a large project (e.g., a monorepo) returns a huge JSON payload that blocks the main thread during parsing.
**Why it happens:** Backend returns everything at once with maxDepth=10.
**How to avoid:** The backend already filters node_modules/dist/build/.git. For typical projects this is fine (< 5000 nodes). If blocking occurs, the fix is backend-side (add `?depth=` query param) -- not a Phase 23 concern. Add a TODO comment noting this.
**Warning signs:** Loading skeleton visible for > 3 seconds.

### Pitfall 3: Stale Tree After Agent File Operations
**What goes wrong:** AI agent creates/deletes/renames files but the tree doesn't update.
**Why it happens:** The `projects_updated` WebSocket event fires when provider session/project files change (`.claude/projects/`), NOT when the user's actual project files change. The backend watcher monitors `~/.claude/projects/` and `~/.codex/sessions/`, not the project directory itself.
**How to avoid:** This is a **real limitation**. The `projects_updated` event won't fire for file changes within the project. Options: (A) Add a manual refresh button (required), (B) poll periodically (wasteful), (C) add a backend file watcher for the active project (out of scope for M3). **Go with option A for now.** Wire `projects_updated` for project-level changes but add an explicit "Refresh" button in the tree header.
**Warning signs:** File tree doesn't update after agent edits.

### Pitfall 4: Path Encoding in API Calls
**What goes wrong:** Project names with special characters (spaces, slashes, dots) break the URL.
**Why it happens:** `extractProjectDirectory` in the backend does a dash-to-slash fallback, but the actual projectName encoding matters.
**How to avoid:** Always `encodeURIComponent(projectName)` in the API URL. The existing `useProjectContext` hook resolves the project name -- use that value consistently.

### Pitfall 5: Context Menu Portal vs Panel Boundaries
**What goes wrong:** Right-click context menu renders inside the scrollable tree container and gets clipped.
**Why it happens:** Radix context-menu uses portals by default, but if configured incorrectly, it can inherit parent overflow.
**How to avoid:** shadcn context-menu uses Radix which portals to document.body by default. Don't wrap it in a container with `overflow: hidden` at the context-menu trigger level. Let Radix handle positioning.

## Code Examples

### File Tree Split Layout (FT-01)
```typescript
// FileTreePanel.tsx -- left tree + right editor placeholder
export function FileTreePanel() {
  return (
    <div className="flex h-full">
      {/* Tree sidebar */}
      <div className="w-60 shrink-0 border-r border-surface-border flex flex-col">
        <FileTreeSearch />
        <ScrollArea className="flex-1">
          <FileTree />
        </ScrollArea>
      </div>
      {/* Editor area (Phase 24) */}
      <div className="flex-1 min-w-0 flex items-center justify-center text-text-tertiary">
        <p className="text-sm">Select a file to view</p>
      </div>
    </div>
  );
}
```

### Image Detection for Lightbox (FT-11)
```typescript
const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico']);

function isImageFile(name: string): boolean {
  const ext = name.includes('.') ? '.' + name.split('.').pop()!.toLowerCase() : '';
  return IMAGE_EXTENSIONS.has(ext);
}
```

### Copy Path to Clipboard (FT-09)
```typescript
async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  } catch {
    toast.error('Failed to copy');
  }
}
```

### Relative Path Computation (FT-09)
```typescript
// Backend returns absolute paths. Compute relative from project root.
function getRelativePath(absolutePath: string, projectRoot: string): string {
  if (absolutePath.startsWith(projectRoot)) {
    return absolutePath.slice(projectRoot.length).replace(/^\//, '');
  }
  return absolutePath;
}
// Note: projectRoot comes from the project context. May need to fetch or derive
// from the first common prefix of all tree paths.
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Load full tree client-side, manage with useState | Zustand store for UI state, hook for fetched data | M3 architecture decision | Clean separation of concerns |
| Set for expandedDirs | string[] for expandedDirs | Phase 20 decision | JSON-serializable, slightly slower lookup but simpler |
| Conditional rendering for panels | CSS show/hide (mount-once) | Phase 20 | Preserves all panel state across tab switches |

## Open Questions

1. **Project root path for relative paths**
   - What we know: Backend returns absolute paths in tree nodes. Context menus need "Copy Relative Path" (FT-09).
   - What's unclear: The project root path isn't stored client-side in an obvious place. `useProjectContext` gives the project *name*, not the filesystem path.
   - Recommendation: The project root can be inferred from the tree -- it's the common prefix of all top-level entries (strip the last path segment from any entry's path). Or fetch it from `GET /api/projects` which returns the project path. Store in the hook or a simple ref.

2. **"Open Containing Folder in Terminal" action (FT-09)**
   - What we know: Terminal is Phase 25. This action needs to switch to Shell tab and `cd` to the directory.
   - What's unclear: Terminal doesn't exist yet.
   - Recommendation: Wire the action to `setActiveTab('shell')` for now. The actual `cd` command can be added in Phase 25 when the terminal exists. Add a TODO comment.

3. **Skeleton component standardization**
   - What we know: shadcn `skeleton` was listed in STACK.md but is NOT installed. Phase 21 used custom loading skeletons (`SettingsTabSkeleton`).
   - What's unclear: Whether to install shadcn skeleton or reuse Phase 21's pattern.
   - Recommendation: Check what `SettingsTabSkeleton` does. If it's just Tailwind `animate-pulse` divs, reuse that pattern. Don't add another shadcn primitive for this.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest + @testing-library/react |
| Config file | `src/vite.config.ts` (vitest section) |
| Quick run command | `cd src && npx vitest run --reporter=verbose` |
| Full suite command | `cd src && npx vitest run --coverage` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FT-01 | FileTreePanel renders split layout with tree and editor placeholder | unit | `cd src && npx vitest run src/src/components/file-tree/FileTreePanel.test.tsx -x` | Wave 0 |
| FT-02 | FileNode renders with indentation at correct depth | unit | `cd src && npx vitest run src/src/components/file-tree/FileNode.test.tsx -x` | Wave 0 |
| FT-03 | Toggle expand/collapse updates store and hides/shows children | unit | `cd src && npx vitest run src/src/stores/file.test.ts -x` | Wave 0 |
| FT-04 | Expansion state persists when panel hidden/shown | integration | `cd src && npx vitest run src/src/components/file-tree/FileTree.test.tsx -x` | Wave 0 |
| FT-05 | Correct icons render for .ts, .json, folder, image files | unit | `cd src && npx vitest run src/src/components/file-tree/FileIcon.test.tsx -x` | Wave 0 |
| FT-06 | Clicking file calls openFile store action | unit | `cd src && npx vitest run src/src/components/file-tree/FileNode.test.tsx -x` | Wave 0 |
| FT-07 | Active file has highlight class | unit | `cd src && npx vitest run src/src/components/file-tree/FileNode.test.tsx -x` | Wave 0 |
| FT-08 | Search input filters tree to matching files | unit | `cd src && npx vitest run src/src/components/file-tree/FileTree.test.tsx -x` | Wave 0 |
| FT-09 | File context menu shows correct actions | unit | `cd src && npx vitest run src/src/components/file-tree/FileTreeContextMenu.test.tsx -x` | Wave 0 |
| FT-10 | Directory context menu shows Expand All/Collapse All | unit | `cd src && npx vitest run src/src/components/file-tree/FileTreeContextMenu.test.tsx -x` | Wave 0 |
| FT-11 | Image file opens dialog instead of setting activeFile | unit | `cd src && npx vitest run src/src/components/file-tree/ImagePreview.test.tsx -x` | Wave 0 |
| FT-12 | Loading skeleton shown while fetch in progress | unit | `cd src && npx vitest run src/src/components/file-tree/FileTree.test.tsx -x` | Wave 0 |
| FT-13 | Error state with retry button renders on fetch failure | unit | `cd src && npx vitest run src/src/components/file-tree/FileTree.test.tsx -x` | Wave 0 |
| FT-14 | Client-side expand/collapse works (full tree loaded) | unit | Same as FT-03 store tests | Wave 0 |
| FT-15 | Hidden files (dotfiles) filtered by default | unit | `cd src && npx vitest run src/src/components/file-tree/FileTree.test.tsx -x` | Wave 0 |
| FT-16 | Tree re-fetches on loom:projects-updated event | integration | `cd src && npx vitest run src/src/hooks/useFileTree.test.ts -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `cd src && npx vitest run --reporter=verbose`
- **Per wave merge:** `cd src && npx vitest run --coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/src/stores/file.test.ts` -- test all implemented store actions (toggleDir, openFile, closeFile, setDirty, setActiveFile, selectPath)
- [ ] `src/src/hooks/useFileTree.test.ts` -- test fetch, error, retry, WebSocket refresh
- [ ] `src/src/components/file-tree/FileTreePanel.test.tsx` -- split layout rendering
- [ ] `src/src/components/file-tree/FileNode.test.tsx` -- indentation, icons, click handlers, active highlight
- [ ] `src/src/components/file-tree/FileTree.test.tsx` -- loading/error/search states
- [ ] `src/src/components/file-tree/FileIcon.test.tsx` -- extension mapping
- [ ] `src/src/components/file-tree/FileTreeContextMenu.test.tsx` -- menu actions
- [ ] `src/src/components/file-tree/ImagePreview.test.tsx` -- lightbox for images

## Sources

### Primary (HIGH confidence)
- `server/index.js` lines 851-880, 1841-1915 -- Backend file tree endpoint and `getFileTree` function (direct source analysis)
- `src/src/stores/file.ts` -- Existing stub file store (direct source analysis)
- `src/src/types/file.ts` -- Existing file types (direct source analysis)
- `src/src/components/content-area/view/ContentArea.tsx` -- Mount-once panel pattern (direct source analysis)
- `src/src/lib/websocket-init.ts` + `src/src/hooks/useSessionList.ts` -- `projects_updated` event wiring (direct source analysis)
- `src/src/components/command-palette/groups/FileGroup.tsx` -- Existing file opening stub (direct source analysis)

### Secondary (MEDIUM confidence)
- `.planning/research/ARCHITECTURE.md` -- M3 architecture patterns
- `.planning/research/FEATURES.md` -- Feature landscape and complexity estimates
- `.planning/research/PITFALLS.md` -- Domain pitfalls (xterm lifecycle, store proliferation)
- `.planning/REQUIREMENTS.md` -- FT-01 through FT-16 requirement definitions

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new deps except one shadcn primitive
- Architecture: HIGH -- all integration points verified in source code
- Pitfalls: HIGH -- backend limitations verified, WebSocket event scope confirmed
- File store: HIGH -- types and stub already exist, implementation is straightforward

**Research date:** 2026-03-10
**Valid until:** 2026-04-10 (stable domain, no fast-moving deps)
