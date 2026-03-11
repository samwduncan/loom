# Roadmap: Loom V2

## Milestones

- v1.0 "The Skeleton" - Phases 1-10 (shipped 2026-03-07)
- v1.1 "The Chat" - Phases 11-19 (shipped 2026-03-09)
- **v1.2 "The Workspace"** - Phases 20-26 (in progress)

## Phases

<details>
<summary>v1.0 "The Skeleton" (Phases 1-10) -- SHIPPED 2026-03-07</summary>

- [x] Phase 1: Design Token System (3/3 plans) -- completed 2026-03-05
- [x] Phase 2: Enforcement + Testing Infrastructure (3/3 plans) -- completed 2026-03-05
- [x] Phase 3: App Shell + Error Boundaries (2/2 plans) -- completed 2026-03-05
- [x] Phase 4: State Architecture (2/2 plans) -- completed 2026-03-05
- [x] Phase 5: WebSocket Bridge + Stream Multiplexer (2/2 plans) -- completed 2026-03-06
- [x] Phase 6: Streaming Engine + Scroll Anchor (2/2 plans) -- completed 2026-03-06
- [x] Phase 7: Tool Registry + Proof of Life (2/2 plans) -- completed 2026-03-06
- [x] Phase 8: Navigation + Session Management (2/2 plans) -- completed 2026-03-06
- [x] Phase 9: E2E Integration Wiring + Playwright Verification (2/2 plans) -- completed 2026-03-06
- [x] Phase 10: Pre-Archive Cleanup (1/1 plan) -- completed 2026-03-07

</details>

<details>
<summary>v1.1 "The Chat" (Phases 11-19) -- SHIPPED 2026-03-09</summary>

- [x] Phase 11: Markdown + Code Blocks + UI Primitives (3/3 plans) -- completed 2026-03-07
- [x] Phase 12: Streaming Markdown + Marker Interleaving (3/3 plans) -- completed 2026-03-07
- [x] Phase 13: Composer (3/3 plans) -- completed 2026-03-07
- [x] Phase 14: Message Types (3/3 plans) -- completed 2026-03-07
- [x] Phase 15: Tool Card Shell + State Machine (2/2 plans) -- completed 2026-03-07
- [x] Phase 16: Per-Tool Cards (3/3 plans) -- completed 2026-03-08
- [x] Phase 17: Tool Grouping + Permissions (3/3 plans) -- completed 2026-03-08
- [x] Phase 18: Activity, Scroll, Polish (3/3 plans) -- completed 2026-03-08
- [x] Phase 19: Visual Effects + Enhancements (3/3 plans) -- completed 2026-03-09

</details>

### v1.2 "The Workspace" (Phases 20-26) -- IN PROGRESS

**Milestone Goal:** Make Loom a usable daily-driver by building workspace panels: content layout with tab switching, settings, command palette, file tree, code editor, terminal, and git panel.

**Phase Numbering:**
- Integer phases (20, 21, ...): Planned milestone work
- Decimal phases (20.1, 20.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 20: Content Layout + Tab System** - Tab bar, CSS show/hide panel switching, file store, keyboard shortcuts (completed 2026-03-10)
- [x] **Phase 21: Settings Panel** - Full-screen settings modal with 5 tabs, installs shadcn primitives for later phases (completed 2026-03-10)
- [x] **Phase 22: Command Palette** - Cmd+K overlay with fuzzy search, session/file/command navigation (completed 2026-03-10)
- [x] **Phase 23: File Tree + File Store** - Hierarchical file browser, file type icons, context menus, lazy-load directories (completed 2026-03-10)
- [x] **Phase 24: Code Editor** - CodeMirror 6 with syntax highlighting, file tabs, read/write, diff view, OKLCH theme (completed 2026-03-11)
- [ ] **Phase 25: Terminal** - xterm.js terminal with separate /shell WebSocket, auto-resize, connection state
- [ ] **Phase 26: Git Panel + Navigation** - Changes/history views, staging, commit, branch ops, session management

## Phase Details

### Phase 20: Content Layout + Tab System
**Goal**: Users can switch between workspace panels (Chat, Files, Shell, Git) without losing state in any panel
**Depends on**: Nothing (first phase of milestone)
**Requirements**: LAY-01, LAY-02, LAY-03, LAY-04, LAY-05, LAY-06, LAY-07, LAY-08, LAY-09
**Success Criteria** (what must be TRUE):
  1. User can click tab bar items (Chat, Files, Shell, Git) and the corresponding panel becomes visible while others hide
  2. Switching away from a panel and back preserves all state (scroll position, input content, terminal session)
  3. User can press Cmd+1/2/3/4 to switch between tabs without using the mouse
  4. On mobile viewports (<768px), only the Chat tab is accessible; the tab bar is hidden
  5. A crash in one panel (e.g., Files) does not take down other panels (Chat continues working)
**Plans**: 2 plans

Plans:
- [x] 20-01-PLAN.md -- Types + stores (TabId update, file store, UI store migration)
- [x] 20-02-PLAN.md -- TabBar, ContentArea, keyboard shortcuts, AppShell/App.tsx rewiring

### Phase 21: Settings Panel
**Goal**: Users can view and manage all application settings (agents, API keys, appearance, git config, MCP servers) from within the app
**Depends on**: Phase 20
**Requirements**: SET-01, SET-02, SET-03, SET-04, SET-05, SET-06, SET-07, SET-08, SET-09, SET-10, SET-11, SET-12, SET-13, SET-14, SET-15, SET-16, SET-17, SET-18, SET-19, SET-20
**Success Criteria** (what must be TRUE):
  1. User can open Settings from sidebar gear icon, see 5 tabs (Agents, API Keys, Appearance, Git, MCP), and close with Escape or backdrop click
  2. User can see which AI providers are connected/disconnected and view their model/version info in the Agents tab
  3. User can add, view (masked), and delete API keys with confirmation dialogs and success/error feedback
  4. User can change font size with a slider and see it apply immediately without page reload
  5. User can add/remove MCP servers per provider, and settings that require restart are clearly marked
**Plans**: 3 plans

Plans:
- [x] 21-01-PLAN.md -- shadcn primitives, settings types/hooks, modal shell with 5-tab navigation
- [x] 21-02-PLAN.md -- Agents tab, API Keys tab with credentials, Git tab
- [x] 21-03-PLAN.md -- Appearance tab with live preview, MCP tab

### Phase 22: Command Palette
**Goal**: Users can discover and execute any action in the app via a single keyboard shortcut
**Depends on**: Phase 20, Phase 21
**Requirements**: CMD-01, CMD-02, CMD-03, CMD-04, CMD-05, CMD-06, CMD-07, CMD-08, CMD-09, CMD-10, CMD-11, CMD-12, CMD-13, CMD-14, CMD-15
**Success Criteria** (what must be TRUE):
  1. User presses Cmd+K and a centered overlay appears above all content (including Settings modal) with auto-focused search input
  2. User can type to fuzzy-search sessions, files, and commands -- results update in real-time with grouped sections
  3. User can navigate results with arrow keys, select with Enter, and see keyboard shortcut hints on applicable items
  4. Selecting a session switches to Chat tab and navigates to it; selecting a file opens it in the editor (Files tab)
  5. Recent/frequent commands appear when the search input is empty; "No results found" shows when nothing matches
**Plans**: 2 plans

Plans:
- [x] 22-01-PLAN.md -- Core palette shell (cmdk + fuse.js), CSS, keyboard shortcut, search + recent hooks
- [x] 22-02-PLAN.md -- All 7 command groups (Navigation, Session, File, Action, Slash, Project, Recent) + wiring

### Phase 23: File Tree + File Store
**Goal**: Users can browse their project's file structure and open files for viewing/editing
**Depends on**: Phase 20
**Requirements**: FT-01, FT-02, FT-03, FT-04, FT-05, FT-06, FT-07, FT-08, FT-09, FT-10, FT-11, FT-12, FT-13, FT-14, FT-15, FT-16
**Success Criteria** (what must be TRUE):
  1. User sees a hierarchical file tree in the Files tab left panel with proper indentation, expand/collapse chevrons, and file type icons
  2. User can click a file to open it in the editor panel; the currently open file is highlighted in the tree
  3. User can right-click files and directories for context menu actions (Copy Path, Open in Editor, etc.)
  4. User can filter the file tree by typing in the search input; node_modules/.git are hidden by default
  5. File tree updates automatically when the backend sends file change notifications via WebSocket
**Plans**: 3 plans

Plans:
- [x] 23-01-PLAN.md -- File store implementation, FileTreeNode type, useFileTree hook, FileIcon, FileTreePanel layout
- [x] 23-02-PLAN.md -- FileNode recursive component, FileTree container, search/filter, loading/error states, wire into ContentArea
- [x] 23-03-PLAN.md -- Context menus (shadcn context-menu), image lightbox, wire FileGroup in command palette

### Phase 24: Code Editor
**Goal**: Users can view and edit project files with full syntax highlighting and multi-tab support
**Depends on**: Phase 23
**Requirements**: ED-01, ED-02, ED-03, ED-04, ED-05, ED-06, ED-07, ED-08, ED-09, ED-10, ED-11, ED-12, ED-13, ED-14, ED-15, ED-16, ED-17, ED-18, ED-19, ED-20
**Success Criteria** (what must be TRUE):
  1. User can open files from the tree and see syntax-highlighted content with line numbers in a CodeMirror editor using the OKLCH design system theme
  2. User can edit a file and save with Cmd+S; unsaved files show a dot indicator on their tab; success/error toast confirms the operation
  3. User can open multiple files as tabs, switch between them, and close tabs (with save/discard confirmation for dirty files)
  4. User can click a file path in a chat tool card (Read, Edit, Write) and it opens in the editor on the Files tab
  5. Binary files show a "cannot display" message; files >1MB show a size warning before loading
**Plans**: 3 plans

Plans:
- [x] 24-01-PLAN.md -- CM6 deps, OKLCH theme, language loader, file hooks, CodeEditor component, breadcrumb, binary/large guards
- [x] 24-02-PLAN.md -- EditorTabs with dirty indicators and close confirmation, wire CodeEditor into FileTreePanel via React.lazy
- [x] 24-03-PLAN.md -- DiffEditor merge view, useFileDiff hook, clickable file paths in tool cards

### Phase 25: Terminal
**Goal**: Users can run shell commands directly within Loom without switching to an external terminal
**Depends on**: Phase 20
**Requirements**: TERM-01, TERM-02, TERM-03, TERM-04, TERM-05, TERM-06, TERM-07, TERM-08, TERM-09, TERM-10, TERM-11, TERM-12, TERM-13, TERM-14, TERM-15
**Success Criteria** (what must be TRUE):
  1. User sees a fully functional terminal in the Shell tab with ANSI color support and the project root as working directory
  2. Terminal session persists when switching to other tabs and back (CSS show/hide, not unmount)
  3. User sees connection state (connecting/connected/disconnected) in the header and can restart or reconnect
  4. Terminal auto-resizes to fill the available space when the browser window resizes
  5. Copy/paste works via Cmd+C/V, and URLs in terminal output are clickable
**Plans**: 2 plans

Plans:
- [ ] 25-01-PLAN.md -- Types, deps, OKLCH terminal theme, shell WebSocket client + hook
- [ ] 25-02-PLAN.md -- TerminalView, TerminalHeader, TerminalOverlay, TerminalPanel, ContentArea wiring

### Phase 26: Git Panel + Navigation
**Goal**: Users can manage git operations (stage, commit, branch, push/pull) and organize their sessions without leaving Loom
**Depends on**: Phase 20, Phase 24
**Requirements**: GIT-01, GIT-02, GIT-03, GIT-04, GIT-05, GIT-06, GIT-07, GIT-08, GIT-09, GIT-10, GIT-11, GIT-12, GIT-13, GIT-14, GIT-15, GIT-16, GIT-17, GIT-18, GIT-19, GIT-20, GIT-21, GIT-22, GIT-23, NAV-01, NAV-02, NAV-03
**Success Criteria** (what must be TRUE):
  1. User can see all changed files grouped by status (staged/modified/untracked/deleted) and stage/unstage files via checkboxes
  2. User can write a commit message and commit staged changes; successful commits show a toast and clear the form
  3. User can switch branches, create new branches, and push/pull/fetch with loading indicators and success/error feedback
  4. User can click a changed file to view its diff in the code editor; commit history shows recent commits with click-to-view-diff
  5. User can rename sessions (double-click in sidebar) and delete sessions (right-click context menu with confirmation)
**Plans**: TBD

Plans:
- [ ] 26-01: TBD
- [ ] 26-02: TBD
- [ ] 26-03: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 20 -> 21 -> 22 -> 23 -> 24 -> 25 -> 26

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-10 | v1.0 | 21/21 | Complete | 2026-03-07 |
| 11-19 | v1.1 | 26/26 | Complete | 2026-03-09 |
| 20. Content Layout + Tab System | 2/2 | Complete    | 2026-03-10 | - |
| 21. Settings Panel | 3/3 | Complete    | 2026-03-10 | - |
| 22. Command Palette | 2/2 | Complete    | 2026-03-10 | - |
| 23. File Tree + File Store | 3/3 | Complete    | 2026-03-10 | - |
| 24. Code Editor | 3/3 | Complete    | 2026-03-11 | - |
| 25. Terminal | v1.2 | 0/2 | Not started | - |
| 26. Git Panel + Navigation | v1.2 | 0/3 | Not started | - |

## Backlog (Future Milestones)

- **Subagent Monitoring Panel** -- When Claude spawns subagents (Agent tool), show active subagents in a panel/overlay. Click to view a subagent's real-time conversation stream. Requires backend multiplexing of child process output through parent WebSocket. Inspired by [claude-esp](https://github.com/phiat/claude-esp). (M4/M5 scope -- needs backend `claude-sdk.js` changes to expose child process streams.)

---
*Created: 2026-03-07*
*Last updated: 2026-03-11 after Phase 25 planning*
