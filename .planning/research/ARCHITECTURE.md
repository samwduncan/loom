# Architecture Patterns: M3 "The Workspace" Panel Integration

**Domain:** Workspace panels (Settings, Cmd+K, File Tree, Code Editor, Terminal, Git Panel) integrating into existing AI chat app
**Researched:** 2026-03-09
**Confidence:** HIGH (based on existing V2 source code analysis + V1 feature inventory + backend API contract)

---

## Existing Architecture Summary

Before detailing integration points, here is the current V2 architecture that all new panels must integrate with:

### App Shell (CSS Grid)
```
grid-template-columns: var(--sidebar-width) 1fr var(--artifact-width, 0px)
grid-template-rows: 1fr
```
Three columns: **sidebar** | **content (Outlet)** | **artifact (0px reserved)**. The content column renders via React Router `<Outlet />`. The artifact column is at 0px width, reserved but unused.

### Routing (React Router v7)
```
<Route element={<AppShell />}>
  <Route index element={<Navigate to="/chat" />} />
  <Route path="/chat/:sessionId?" element={<ChatView />} />
  <Route path="/dashboard" element={<DashboardPlaceholder />} />
  <Route path="/settings" element={<SettingsPlaceholder />} />
</Route>
```

### 4 Zustand Stores
| Store | Responsibility | Persisted |
|-------|---------------|-----------|
| `timeline` | Sessions, messages, active session | No |
| `stream` | Streaming state, tool calls, thinking | No |
| `ui` | Sidebar, modals, command palette, theme, activeTab | Partial (theme, sidebarCollapsed, thinkingExpanded) |
| `connection` | WebSocket status per provider | No |

### WebSocket Architecture
- **Chat WS** (`/ws`): Single connection for all AI providers, permissions, session lifecycle
- **Shell WS** (`/shell`): Separate connection for terminal PTY sessions
- `WebSocketClient` class (zero React deps) with callback injection pattern
- Messages typed as discriminated unions (`ServerMessage`, `ClientMessage`)
- `wsClient` singleton exported from `websocket-client.ts`

### API Client
- `apiFetch<T>(path, options, signal)` with JWT auth injection
- All backend endpoints documented in `BACKEND_API_CONTRACT.md`

---

## Recommended Architecture

### Panel Layout Strategy: Content Area Sub-Grid

The current app shell has a single `<Outlet />` in the content column. New workspace panels must coexist with the chat view. Two viable approaches:

**Approach A (RECOMMENDED): Sub-layout within the content column**

The content column gets its own internal layout component that splits into a main view and auxiliary panels. This keeps the outer 3-column grid untouched.

```
AppShell (3-col grid)
  Sidebar | ContentLayout | Artifact(0px)
             |
             ContentLayout (internal layout)
               Header (tab bar: Chat | Files | Git | ...)
               Content area (selected tab content)
               Bottom panel (resizable: Terminal)
```

**Why this over Approach B (artifact column):** The artifact column was designed for a side-by-side panel (like Claude.ai's artifacts). Using it for workspace panels would mean only one panel at a time and awkward layouts. A sub-layout in the content column lets us do tabbed panels (Chat, Files, Git) with an optional persistent bottom panel (Terminal), which matches V1's proven UX and every IDE-like workspace pattern.

**Approach B (REJECTED): Repurpose artifact column**
Would require dynamic grid resizing and only allows one auxiliary panel. V1 used tabbed navigation within the main content area, and that pattern works.

### Content Layout Architecture

```tsx
// New component: src/src/components/content-layout/ContentLayout.tsx
export const ContentLayout = memo(function ContentLayout() {
  const activeTab = useUIStore(s => s.activeTab);
  const bottomPanelHeight = useUIStore(s => s.bottomPanelHeight);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <ContentHeader />          {/* Tab bar + project-level controls */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <Suspense fallback={<PanelSkeleton />}>
          {activeTab === 'chat' && <ChatView />}
          {activeTab === 'files' && <FileTreeWithEditor />}
          {activeTab === 'git' && <GitPanel />}
          {activeTab === 'settings' && <SettingsPanel />}
        </Suspense>
      </div>
      {bottomPanelHeight > 0 && (
        <ResizableBottomPanel height={bottomPanelHeight}>
          <TerminalPanel />
        </ResizableBottomPanel>
      )}
    </div>
  );
});
```

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `ContentLayout` | Tab switching, bottom panel management | UI store (activeTab, bottomPanelHeight) |
| `ContentHeader` | Tab bar rendering, tab click handlers | UI store (activeTab, setActiveTab) |
| `SettingsPanel` | Settings modal/page, 5-tab CRUD forms | REST API (`/api/settings/*`, `/api/cli/*`, `/api/mcp/*`, `/api/user/*`) |
| `CommandPalette` | Cmd+K overlay, fuzzy search, actions | UI store (commandPaletteOpen), REST API (`/api/commands/*`), timeline store (sessions) |
| `FileTreePanel` | File browsing, file selection | REST API (`/api/projects/:name/files`), file store (NEW) |
| `CodeEditorPanel` | File editing with CodeMirror | REST API (`/api/projects/:name/file`), file store (NEW) |
| `TerminalPanel` | xterm.js terminal, Shell WS connection | Shell WebSocket (`/shell`), separate from chat WS |
| `GitPanel` | Git status, staging, commit, history | REST API (`/api/git/*`) |

### Data Flow

```
User clicks tab
  --> UI store.setActiveTab('files')
  --> ContentLayout re-renders selected panel
  --> Panel fetches data via apiFetch() or WebSocket

File Tree:
  GET /api/projects/:name/files --> FileTreePanel renders tree
  User clicks file --> file store.setActiveFile(path)
  --> CodeEditorPanel loads via GET /api/projects/:name/file?path=...

Terminal:
  New WebSocket('/shell?token=...') --> xterm.js
  PTY data flows: Shell WS <--> xterm.js (bypasses chat WS entirely)

Git Panel:
  GET /api/git/status --> renders file changes
  POST /api/git/commit --> commits staged files
  GET /api/git/commits --> renders commit history

Settings:
  GET /api/settings/api-keys --> renders key list
  GET /api/cli/claude/status --> renders auth status
  POST /api/settings/credentials --> saves credentials

Command Palette (Cmd+K):
  Overlay, reads from timeline store (sessions), commands API, file tree
  --> dispatches navigation actions (switch session, open file, change tab)
```

---

## Integration Points: New vs Modified

### NEW Components (create from scratch)

| Component | Directory | Dependencies |
|-----------|-----------|-------------|
| `ContentLayout` | `components/content-layout/` | UI store, React Router |
| `ContentHeader` | `components/content-layout/` | UI store |
| `ResizableBottomPanel` | `components/content-layout/` | UI store, pointer events |
| `SettingsPanel` | `components/settings/` | shadcn (tabs, form, input, switch, select, accordion), REST API |
| `CommandPalette` | `components/command-palette/` | shadcn (command/cmdk), UI store, timeline store |
| `FileTreePanel` | `components/file-tree/` | REST API, file store, lucide icons |
| `CodeEditorPanel` | `components/code-editor/` | @uiw/react-codemirror, REST API, file store |
| `TerminalPanel` | `components/terminal/` | @xterm/xterm, Shell WebSocket |
| `GitPanel` | `components/git-panel/` | REST API, shadcn (select, checkbox, textarea, alert-dialog) |
| File store | `stores/file.ts` | NEW 5th Zustand store |

### MODIFIED Existing Code

| File | Change | Reason |
|------|--------|--------|
| `App.tsx` | Replace `<Outlet />` route structure with ContentLayout, add Cmd+K overlay | ContentLayout becomes the route outlet content |
| `stores/ui.ts` | Add `bottomPanelHeight`, `bottomPanelVisible`, `setBottomPanel()`, expand `TabId` union | Terminal panel state, new tab IDs |
| `types/ui.ts` | Expand `TabId` to include `'files' \| 'git' \| 'terminal'`, add bottom panel types | New panel tabs |
| `components/app-shell/AppShell.tsx` | Add CommandPalette portal overlay | Cmd+K lives above the grid |
| `components/sidebar/Sidebar.tsx` | Add tab icons/buttons for new panels | Navigation to new panels |
| `lib/websocket-client.ts` | No changes needed | Terminal uses separate WS instance |

### UNCHANGED (no modifications needed)

| Area | Why |
|------|-----|
| Chat streaming pipeline | Completely independent of workspace panels |
| Stream multiplexer | Pure functions, no panel awareness |
| Timeline/stream/connection stores | No workspace panel dependencies |
| Tool card system | Self-contained within chat view |
| Composer | Lives within ChatView, no cross-panel deps |

---

## Key Architectural Decisions

### Decision 1: New File Store (5th Zustand Store)

The file tree and code editor need shared state (active file, open files, dirty state) that doesn't belong in any existing store. Create `stores/file.ts`:

```typescript
interface FileState {
  // Data
  activeFilePath: string | null;
  openFiles: OpenFile[];       // tabs in editor
  fileTree: FileTreeNode | null;
  isLoadingTree: boolean;

  // Actions
  setActiveFile: (path: string) => void;
  openFile: (path: string) => void;
  closeFile: (path: string) => void;
  setFileTree: (tree: FileTreeNode) => void;
  markDirty: (path: string, isDirty: boolean) => void;
}
```

**Why not extend UI store:** The UI store holds ephemeral layout state. File state is data-driven (file contents, tree structure) and has different update patterns. Mixing them violates the single-responsibility principle and would make the UI store's `partialize` logic complex.

**Constitution amendment:** The Constitution says "exactly 4 Zustand stores. No more, no fewer without Constitution amendment." This IS the amendment. A 5th store for file/editor state is justified because:
1. It has different persistence needs than any existing store
2. It has different update frequency (low, on user action)
3. It maps to a clear domain (file operations)

### Decision 2: Terminal Uses Separate WebSocket Instance

The terminal panel opens its own WebSocket connection to `/shell`, completely independent of the chat WebSocket at `/ws`. This matches the V1 architecture and the backend's design (separate handlers for `/ws` and `/shell`).

```typescript
// Terminal creates its own connection, NOT using wsClient singleton
const shellWs = new WebSocket(`${protocol}//${host}/shell?token=${token}`);
```

**Why not multiplex over the chat WS:** The backend has separate WebSocket handlers for `/ws` (chat) and `/shell` (PTY). They serve fundamentally different protocols -- chat is JSON messages, shell is raw terminal byte streams. Trying to multiplex would require backend changes and add complexity for zero benefit.

### Decision 3: Settings as Tab (Not Modal)

V1 used a full-screen modal for settings. For V2, settings should be a tab in the content area:

- **Pro tab:** Consistent navigation pattern, URL-routable (`/settings`), no overlay management, can coexist with terminal panel below
- **Pro modal:** V1 familiarity, clear "temporary" semantics
- **Decision:** Tab. The settings route already exists in the router (`/settings` placeholder). A modal would fight the existing routing architecture.

However, the Cmd+K command palette IS a modal/overlay because it's inherently ephemeral and should be accessible from any tab.

### Decision 4: Tab Navigation Lives in Content Header (Not Sidebar)

Tab switching for Chat/Files/Git belongs in a header bar within the content area, not in the sidebar. The sidebar is for session/project navigation. Mixing panel tabs into the sidebar creates confusing hierarchy.

The sidebar MAY have icon shortcuts to switch tabs (like VS Code's activity bar), but the primary tab bar is in the content header.

### Decision 5: Lazy Loading for All New Panels

Every new panel is `React.lazy()` + `<Suspense>`:

```typescript
const SettingsPanel = lazy(() => import('./settings/SettingsPanel'));
const FileTreePanel = lazy(() => import('./file-tree/FileTreePanel'));
const GitPanel = lazy(() => import('./git-panel/GitPanel'));
const TerminalPanel = lazy(() => import('./terminal/TerminalPanel'));
```

This is especially critical for CodeMirror (~300KB) and xterm.js (~200KB). These should only load when the user navigates to those tabs.

### Decision 6: Command Palette (Cmd+K) as Portal Overlay

The command palette renders via `ReactDOM.createPortal` to `document.body`, layered above the entire app shell at `z-[var(--z-modal)]`. It reads from multiple stores (timeline for sessions, file store for files) and dispatches navigation actions.

Built on shadcn's `Command` component (wraps cmdk), which provides fuzzy search, keyboard navigation, and grouping out of the box.

---

## Patterns to Follow

### Pattern 1: Panel Data Fetching with Hooks

Each panel has a dedicated hook for its API data, following the pattern established in chat:

```typescript
// hooks/useGitStatus.ts
export function useGitStatus(projectName: string) {
  const [status, setStatus] = useState<GitStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch<GitStatus>(
        `/api/git/status?project=${projectName}`
      );
      setStatus(data);
    } catch (err) {
      toast.error('Failed to load git status');
    } finally {
      setIsLoading(false);
    }
  }, [projectName]);

  useEffect(() => { refresh(); }, [refresh]);

  return { status, isLoading, refresh };
}
```

### Pattern 2: Resizable Bottom Panel with Pointer Events

The terminal panel needs drag-to-resize. Use pointer events (not mouse events) for touch support:

```typescript
// Drag handle between content and terminal
function ResizeHandle({ onResize }: { onResize: (delta: number) => void }) {
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const startY = e.clientY;
    const onMove = (e: PointerEvent) => onResize(startY - e.clientY);
    const onUp = () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
    };
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  }, [onResize]);

  return <div className="h-1 cursor-row-resize hover:bg-primary/20" onPointerDown={handlePointerDown} />;
}
```

### Pattern 3: Shell WebSocket Lifecycle in Hook

Terminal WebSocket connection managed entirely in a custom hook, matching the chat WS pattern of callback injection:

```typescript
// hooks/useShellConnection.ts
export function useShellConnection(projectPath: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const [state, setState] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');

  const connect = useCallback(() => {
    const token = getToken();
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(
      `${protocol}//${window.location.host}/shell?token=${token}`
    );
    wsRef.current = ws;
    setState('connecting');

    ws.onopen = () => {
      setState('connected');
      ws.send(JSON.stringify({
        type: 'init',
        projectPath,
        provider: 'plain-shell',
        isPlainShell: true,
      }));
    };
    // ... onclose, onerror handlers
  }, [projectPath]);

  return { ws: wsRef, state, connect, disconnect };
}
```

### Pattern 4: File Tree as Recursive Component

```typescript
// Recursive FileNode component with memo
const FileNode = memo(function FileNode({ node, depth }: FileNodeProps) {
  const isExpanded = useFileStore(s => s.expandedDirs.has(node.path));
  const isActive = useFileStore(s => s.activeFilePath === node.path);

  return (
    <>
      <button
        className={cn("flex items-center gap-1 px-2 py-0.5 w-full text-left",
          isActive && "bg-primary/10 text-primary"
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => node.isDirectory ? toggleDir(node.path) : openFile(node.path)}
      >
        {node.isDirectory ? (isExpanded ? <ChevronDown /> : <ChevronRight />) : <FileIcon />}
        <span className="truncate text-sm">{node.name}</span>
      </button>
      {node.isDirectory && isExpanded && node.children?.map(child => (
        <FileNode key={child.path} node={child} depth={depth + 1} />
      ))}
    </>
  );
});
```

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Cross-Panel Store Coupling
**What:** Git panel directly importing and reading from the file store, or terminal store reading from stream store.
**Why bad:** Creates invisible dependencies between panels. Changes to file store break git panel.
**Instead:** Panels communicate through explicit props or shared hooks that compose store selectors. If git panel needs the active file path, pass it as a prop from ContentLayout, don't reach into the file store.

### Anti-Pattern 2: Single WebSocket for Everything
**What:** Trying to send terminal data over the chat WebSocket.
**Why bad:** The backend has separate handlers. Raw terminal bytes are not JSON messages. Different reconnection semantics.
**Instead:** Terminal creates its own WebSocket to `/shell`. Chat WS stays on `/ws`.

### Anti-Pattern 3: God ContentLayout Component
**What:** ContentLayout managing all panel state, data fetching, and keyboard shortcuts.
**Why bad:** Becomes 500+ lines, impossible to test.
**Instead:** ContentLayout is a thin orchestrator. Each panel manages its own data and state via custom hooks. Keyboard shortcuts registered via a central registry hook.

### Anti-Pattern 4: Eager-Loading Heavy Panels
**What:** Importing CodeMirror and xterm.js at the top level.
**Why bad:** Adds ~500KB to initial bundle even if user never opens those panels.
**Instead:** `React.lazy()` + `<Suspense>` for every panel except Chat (which is the default view).

### Anti-Pattern 5: Inline WebSocket Management in Components
**What:** Creating WebSocket connections directly in component useEffect.
**Why bad:** Connection lifecycle doesn't match component lifecycle. Unmount during active session loses state.
**Instead:** Connection hooks with ref-based WS management, cleanup on unmount, reconnection logic.

---

## Build Order (Dependency Chain)

The panels have the following dependency relationships:

```
1. ContentLayout + Tab System (foundation -- all panels need this)
   |
   +--> 2. Settings Panel (no deps on other panels, uses only REST API)
   |
   +--> 3. Command Palette (needs tab switching infra from step 1)
   |
   +--> 4. File Tree + File Store (needs new store, REST API)
   |       |
   |       +--> 5. Code Editor (needs file store from step 4)
   |
   +--> 6. Terminal (independent -- separate WS, separate deps)
   |
   +--> 7. Git Panel (independent -- REST API only, benefits from file store for "open file" action)
```

**Recommended phase ordering:**

1. **ContentLayout + UI Store expansion + Tab navigation** -- Enables all subsequent panels. Small scope, high leverage.
2. **Settings Panel** -- Largest surface area (5 tabs, many forms), but zero dependencies on other panels. Gets the shadcn primitives installed that other panels reuse.
3. **Command Palette (Cmd+K)** -- Small, self-contained, high UX impact. Uses shadcn Command installed in step 2.
4. **File Tree + File Store** -- Creates the file store that the code editor depends on.
5. **Code Editor** -- Requires file store from step 4. Heavy dependency (CodeMirror).
6. **Terminal** -- Independent, can be built in parallel with 4-5 if resources allow. xterm.js dependency.
7. **Git Panel** -- Independent, can be built in parallel with 4-6. Benefits from file store (open changed file in editor) but doesn't require it.

**Parallelizable:** Steps 4+6+7 can run in parallel after step 3 is complete. Steps 2+3 are sequential (settings installs shadcn deps that Cmd+K uses).

---

## Scalability Considerations

| Concern | Current (M3) | At Scale (M5+) |
|---------|-------------|----------------|
| Panel count | 6 panels, tab-switched | Same panels, possibly split-view |
| File tree size | Lazy-load children on expand | Virtual list for 10K+ file repos |
| Terminal sessions | 1 terminal panel | Multiple terminal tabs (M5) |
| Editor tabs | Basic open/close | Tab overflow, split editor (M5) |
| Git diff | One file at a time | Multi-file diff viewer (M5) |

---

## Sources

- V2 source code: `src/src/` (direct analysis)
- Backend API contract: `.planning/BACKEND_API_CONTRACT.md`
- V1 feature inventory: `.planning/V1_FEATURE_INVENTORY.md`
- Component adoption map: `.planning/COMPONENT_ADOPTION_MAP.md`
- Milestone plan: `.planning/MILESTONES.md`
- V2 Constitution: `.planning/V2_CONSTITUTION.md`
- UI store types: `src/src/types/ui.ts`
- WebSocket client: `src/src/lib/websocket-client.ts`
