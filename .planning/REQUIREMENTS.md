# Requirements: Loom V2

**Defined:** 2026-03-09
**Core Value:** Make AI agent work visible, beautiful, and controllable -- every tool call, every code write, every MCP interaction should be a satisfying visual experience that enhances understanding of what the agent is doing.

## v1.2 Requirements

Requirements for M3 "The Workspace" milestone. Each maps to roadmap phases.

### Layout (LAY)

- [x] **LAY-01**: Content area renders a horizontal tab bar at the top with tabs: Chat, Files, Shell, Git
- [x] **LAY-02**: Clicking a tab switches the visible panel below the tab bar
- [x] **LAY-03**: Tab switching uses CSS display (show/hide), NOT conditional rendering -- all panels stay mounted to preserve state (terminal session, scroll position, editor content)
- [x] **LAY-04**: Active tab has a visual indicator (underline or highlight using design tokens)
- [x] **LAY-05**: Keyboard shortcuts Cmd+1/2/3/4 switch to Chat/Files/Shell/Git respectively
- [x] **LAY-06**: Tab bar does not render on mobile (< 768px) -- only Chat tab visible, other panels accessible via Cmd+K or menu
- [x] **LAY-07**: New Zustand file store (5th store) manages file tree state, open editor tabs, active file, dirty file tracking -- Constitution amended
- [x] **LAY-08**: Each panel wrapped in PanelErrorBoundary to isolate crashes from other panels
- [x] **LAY-09**: TabId union type extended to include 'chat' | 'files' | 'shell' | 'git' in UI store

### Settings (SET)

- [x] **SET-01**: Settings opens as a full-screen modal overlay (portal) accessible from sidebar gear icon and Cmd+K
- [x] **SET-02**: Settings modal has 5 tabs: Agents, API Keys, Appearance, Git, MCP
- [x] **SET-03**: Settings modal closes on Escape key or clicking backdrop
- [x] **SET-04**: Agents tab displays connection status (connected/disconnected/error) for Claude, Codex, and Gemini with colored status dots
- [x] **SET-05**: Agents tab shows provider version info when connected (model name, CLI version)
- [x] **SET-06**: API Keys tab lists existing API keys (masked except last 4 chars) with delete buttons
- [x] **SET-07**: API Keys tab has "Add API Key" form with name, key, provider fields and validation (non-empty, minimum length)
- [x] **SET-08**: Deleting an API key shows confirmation dialog before deletion
- [x] **SET-09**: API Keys tab shows success/error toast after add/delete operations
- [x] **SET-10**: Git tab displays current git user name and email with editable fields and Save button
- [x] **SET-11**: Git tab shows success/error feedback on save
- [x] **SET-12**: Appearance tab has font size slider (12-20px) with live preview
- [x] **SET-13**: Appearance tab has code font selection (JetBrains Mono default)
- [x] **SET-14**: Appearance preferences persist to localStorage and apply immediately without page reload
- [x] **SET-15**: MCP tab lists all configured MCP servers per provider (Claude, Codex) with name and status
- [x] **SET-16**: MCP tab has "Add Server" form with name, command, args, env fields per provider
- [x] **SET-17**: MCP tab allows removing servers with confirmation dialog
- [x] **SET-18**: All settings tabs show loading skeletons while fetching data from backend
- [x] **SET-19**: Settings that require server restart display a "(requires restart)" indicator
- [x] **SET-20**: GitHub/GitLab credentials section allows adding/viewing/deleting credentials with token masking

### Command Palette (CMD)

- [x] **CMD-01**: Cmd+K (Mac) / Ctrl+K (Linux/Windows) opens command palette as centered modal overlay with backdrop blur
- [x] **CMD-02**: Palette renders as portal above all content, including Settings modal
- [x] **CMD-03**: Search input is auto-focused on open with placeholder "Type a command or search..."
- [x] **CMD-04**: Escape key or clicking backdrop closes palette
- [x] **CMD-05**: Commands grouped into sections: Navigation, Sessions, Actions, Settings -- each with section header
- [x] **CMD-06**: Navigation group includes: Switch to Chat (Cmd+1), Switch to Files (Cmd+2), Switch to Shell (Cmd+3), Switch to Git (Cmd+4), Open Settings
- [x] **CMD-07**: Sessions group lists all sessions with fuzzy search matching on title, sorted by recency
- [x] **CMD-08**: Selecting a session switches to Chat tab and navigates to that session
- [x] **CMD-09**: Actions group includes: New Session, Toggle Thinking Visibility, Toggle Sidebar
- [x] **CMD-10**: User can type file paths/names to fuzzy-search project files; selecting opens in editor (switches to Files tab)
- [x] **CMD-11**: Slash commands (/) are listed and executable from palette -- results shown as toast or inline
- [x] **CMD-12**: Arrow keys navigate between items, Enter selects, items show keyboard shortcut hints where applicable
- [x] **CMD-13**: Empty state shows "No results found" when search matches nothing
- [ ] **CMD-14**: Recent/frequent commands appear at top of list when search input is empty *(deferred — requires command registry for re-execution)*
- [x] **CMD-15**: Project switching group lists available projects; selecting switches active project

### File Tree (FT)

- [x] **FT-01**: Files tab shows project file tree in left panel (~240px) with code editor in remaining space
- [x] **FT-02**: File tree renders hierarchical directory structure with indentation per nesting level
- [x] **FT-03**: Directories show expand/collapse chevron; clicking toggles children visibility
- [x] **FT-04**: Expansion state persists across tab switches (stored in file store)
- [x] **FT-05**: Files and folders display type-appropriate icons (folder, TypeScript, JavaScript, JSON, CSS, Markdown, image, etc.) using lucide-react
- [x] **FT-06**: Clicking a file opens it in the code editor panel (right side of Files tab)
- [x] **FT-07**: Currently open file is highlighted in the tree
- [x] **FT-08**: Search/filter input at top of tree panel filters visible files/folders by fuzzy match as user types
- [x] **FT-09**: Right-click context menu on files with actions: Copy Path, Copy Relative Path, Open in Editor, Open Containing Folder in Terminal
- [x] **FT-10**: Right-click context menu on directories with actions: Copy Path, Expand All, Collapse All
- [x] **FT-11**: Image files (png, jpg, gif, svg, webp) open in lightbox preview instead of code editor
- [x] **FT-12**: File tree shows loading skeleton on initial fetch
- [x] **FT-13**: File tree shows error state with retry button if fetch fails
- [x] **FT-14**: Full tree loaded upfront (backend depth 10); expand/collapse is client-side. Lazy-load deferred to future optimization.
- [x] **FT-15**: node_modules, .git, and other standard ignored directories are hidden by default
- [x] **FT-16**: File tree refreshes when backend sends file change notifications via WebSocket

### Code Editor (ED)

- [x] **ED-01**: CodeMirror 6 editor renders in right panel of Files tab with syntax highlighting for 50+ languages
- [x] **ED-02**: Language grammar loaded dynamically based on file extension (not bundled at module level)
- [x] **ED-03**: Editor uses custom OKLCH theme built from design system tokens (--color-* CSS variables)
- [x] **ED-04**: Editor displays line numbers in gutter
- [x] **ED-05**: User can edit file content; modified files show unsaved indicator (dot) on their tab
- [x] **ED-06**: User can save file with Cmd+S / Ctrl+S -- writes back to backend via PUT endpoint
- [x] **ED-07**: Save shows success/error toast; error toast includes reason (permission denied, file not found, etc.)
- [x] **ED-08**: Multiple files open as horizontal tabs above editor -- clicking switches editor content
- [x] **ED-09**: File tabs show filename; hovering shows full path in tooltip
- [x] **ED-10**: File tabs have close button (x); closing last tab shows empty state ("Open a file from the tree or Cmd+K")
- [x] **ED-11**: Closing a tab with unsaved changes shows confirmation dialog ("Save / Discard / Cancel")
- [x] **ED-12**: Cmd+F / Ctrl+F opens CodeMirror's built-in search within active file
- [x] **ED-13**: User can toggle word wrap via button in editor header
- [x] **ED-14**: Editor supports diff view mode -- shows unified or side-by-side diff using @codemirror/merge
- [x] **ED-15**: Diff view activated when opening files from git panel's changed files list
- [x] **ED-16**: Clicking a file path in a chat tool card (Read, Edit, Write) switches to Files tab and opens that file in the editor
- [x] **ED-17**: Editor is lazy-loaded via React.lazy() + Suspense with loading skeleton -- not in initial bundle
- [x] **ED-18**: Binary files show "Binary file -- cannot display" message instead of editor
- [x] **ED-19**: Large files (>1MB) show warning before loading with option to proceed or cancel
- [x] **ED-20**: Editor panel shows breadcrumb path of active file above the editor surface

### Terminal (TERM)

- [x] **TERM-01**: Shell tab renders xterm.js terminal with full PTY emulation and ANSI 256-color support
- [x] **TERM-02**: Terminal connects via separate WebSocket to /shell endpoint (independent from chat WS)
- [x] **TERM-03**: Terminal auto-resizes to fill container using @xterm/addon-fit, debounced to prevent layout thrashing
- [x] **TERM-04**: URLs in terminal output are clickable and open in new browser tab via @xterm/addon-web-links
- [x] **TERM-05**: Connection state indicator in panel header: connecting (yellow pulse), connected (green dot), disconnected (red dot)
- [x] **TERM-06**: Terminal opens with working directory set to active project root
- [x] **TERM-07**: Plain shell mode available (no AI provider attached) -- dropdown or toggle in header
- [x] **TERM-08**: Auth URLs from CLI providers are detected and displayed as clickable links
- [x] **TERM-09**: Header has Restart and Disconnect buttons with icons and tooltips
- [x] **TERM-10**: Terminal is lazy-loaded via React.lazy() + Suspense -- not in initial bundle
- [x] **TERM-11**: Terminal stays DOM-mounted when switching to other tabs (CSS display:none) -- session state preserved
- [x] **TERM-12**: React strict mode double-mount handled via ref-based WebSocket guard (no duplicate PTY sessions)
- [x] **TERM-13**: Disconnected state shows reconnect button and "Session ended" message overlay
- [x] **TERM-14**: Terminal uses custom OKLCH-derived color scheme matching design system (not default xterm colors)
- [x] **TERM-15**: Copy/paste works via Cmd+C / Cmd+V within terminal

### Git Panel (GIT)

- [x] **GIT-01**: Git tab shows two switchable views: Changes and History, toggled via sub-tab bar
- [x] **GIT-02**: Changes view lists all changed files grouped by status: Staged, Modified, Untracked, Deleted
- [x] **GIT-03**: Each file row shows: status icon (M/A/D/?), filename, relative path, checkbox for staging
- [x] **GIT-04**: Clicking checkbox stages/unstages the file (immediate API call)
- [x] **GIT-05**: "Select All" and "Deselect All" buttons above the file list
- [x] **GIT-06**: Clicking a changed file opens its diff in the code editor (switches to Files tab, activates diff view)
- [x] **GIT-07**: Commit composer at bottom: auto-resize textarea for message, "Commit" button disabled when nothing staged or message empty
- [x] **GIT-08**: Successful commit shows toast, clears message, refreshes changes list
- [x] **GIT-09**: Failed commit shows error toast with reason
- [ ] **GIT-10**: Panel header shows current branch name with branch icon
- [ ] **GIT-11**: Branch dropdown allows switching between existing local branches
- [ ] **GIT-12**: "New Branch" button opens inline input for branch name with Create/Cancel
- [ ] **GIT-13**: Push, Pull, Fetch buttons in panel header with icons and tooltips
- [ ] **GIT-14**: Push/Pull/Fetch show loading spinner during operation and success/error toast on completion
- [ ] **GIT-15**: Remote status indicator shows ahead/behind count relative to tracking branch
- [x] **GIT-16**: "Generate Message" button uses AI to generate commit message from staged changes -- fills textarea
- [x] **GIT-17**: Discard changes action per file (right-click or button) with confirmation dialog ("This cannot be undone")
- [ ] **GIT-18**: History view shows recent commits (20-30) with: hash (short), message, author, relative date
- [ ] **GIT-19**: Clicking a commit in history opens its diff summary (files changed + per-file diff)
- [x] **GIT-20**: Git panel auto-refreshes when backend sends file/project change WebSocket events
- [x] **GIT-21**: All destructive operations (discard, force push) require confirmation dialog
- [x] **GIT-22**: Loading skeleton shown while fetching git status/history
- [x] **GIT-23**: Error state with retry button if git operations fail (e.g., not a git repo)

### Navigation (NAV)

- [x] **NAV-01**: User can rename sessions via double-click on session title in sidebar -- inline edit with Enter to confirm, Escape to cancel
- [x] **NAV-02**: User can delete sessions via right-click context menu -- confirmation dialog before deletion
- [x] **NAV-03**: Deleted session removed from sidebar list immediately; if it was active, switches to most recent remaining session

## Future Requirements

Deferred to later milestones. Tracked but not in current roadmap.

### Visual Polish (M4 "The Polish")

- **POL-01**: Spring physics animations on all interactions
- **POL-02**: Aurora/ambient overlay during streaming
- **POL-03**: Glass surface effects for modals and overlays
- **POL-04**: File change indicators (dots) on file tree nodes from git status
- **POL-05**: Sidebar slim collapse mode (icon-only rail)
- **POL-06**: Full accessibility pass (ARIA roles, keyboard nav, screen reader)
- **POL-07**: Performance audit (FPS during streaming, memory profiling)
- **POL-08**: Editor minimap
- **POL-09**: "Run in Terminal" button on Bash tool cards
- **POL-10**: Markdown preview in code editor

### Multi-Provider (M5 "The Power")

- **PWR-01**: Tabbed interface for simultaneous Claude/Gemini/Codex work
- **PWR-02**: Background task execution with tab notifications
- **PWR-03**: Shared context between provider tabs
- **PWR-04**: Multiple terminal sessions
- **PWR-05**: Editor split panes
- **PWR-06**: Active file/tab context injection into agent messages
- **PWR-07**: File mentions (@) in composer with fuzzy search

### Integrations (M6 "The Vision")

- **VIS-01**: GSD visual dashboard
- **VIS-02**: Nextcloud integration (file picker, screenshot upload)
- **VIS-03**: Companion system (conditional on feasibility)
- **VIS-04**: CodeRabbit integration

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Full IDE replacement (LSP, intellisense, debugging) | Loom complements VS Code, doesn't replace it |
| Monaco editor | 5-10MB bundle, VS Code coupling. CodeMirror 6 is modular (~200KB) |
| Real-time collaborative editing | Single-user tool |
| Git merge conflict resolution UI | Too complex; handle in real IDE |
| Settings sync across devices | Single-server deployment |
| File creation/rename/delete from tree | Agent handles file ops; dual-path mutation is dangerous |
| Terminal multiplexer (split panes, tmux-like) | Massive complexity for marginal value |
| Multiple terminal tabs | Defer to M5 if requested |
| Inline git blame / annotations | Complex, low value for AI coding workflow |
| Custom keybinding configuration | Enormous complexity, almost no one uses in web apps |
| Light mode | Dark-only for M1-M3; potential M4+ stretch |
| Inline code completion / LSP | Not Loom's value prop; agent handles code |
| Full git history (infinite scroll) | Recent 20-30 commits sufficient for M3 |
| Git stash management | Niche feature, defer to M5+ |
| Semantic code search / RAG indexing | Over-engineering for single-user; native grep/glob sufficient |
| Character-by-character typewriter | Anti-pattern; batch rendering via rAF buffer |
| Conversation branching | High complexity, low value for single-user tool |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| LAY-01 | Phase 20 | Complete |
| LAY-02 | Phase 20 | Complete |
| LAY-03 | Phase 20 | Complete |
| LAY-04 | Phase 20 | Complete |
| LAY-05 | Phase 20 | Complete |
| LAY-06 | Phase 20 | Complete |
| LAY-07 | Phase 20 | Complete |
| LAY-08 | Phase 20 | Complete |
| LAY-09 | Phase 20 | Complete |
| SET-01 | Phase 21 | Complete |
| SET-02 | Phase 21 | Complete |
| SET-03 | Phase 21 | Complete |
| SET-04 | Phase 21 | Complete |
| SET-05 | Phase 21 | Complete |
| SET-06 | Phase 21 | Complete |
| SET-07 | Phase 21 | Complete |
| SET-08 | Phase 21 | Complete |
| SET-09 | Phase 21 | Complete |
| SET-10 | Phase 21 | Complete |
| SET-11 | Phase 21 | Complete |
| SET-12 | Phase 21 | Complete |
| SET-13 | Phase 21 | Complete |
| SET-14 | Phase 21 | Complete |
| SET-15 | Phase 21 | Complete |
| SET-16 | Phase 21 | Complete |
| SET-17 | Phase 21 | Complete |
| SET-18 | Phase 21 | Complete |
| SET-19 | Phase 21 | Complete |
| SET-20 | Phase 21 | Complete |
| CMD-01 | Phase 22 | Complete |
| CMD-02 | Phase 22 | Complete |
| CMD-03 | Phase 22 | Complete |
| CMD-04 | Phase 22 | Complete |
| CMD-05 | Phase 22 | Complete |
| CMD-06 | Phase 22 | Complete |
| CMD-07 | Phase 22 | Complete |
| CMD-08 | Phase 22 | Complete |
| CMD-09 | Phase 22 | Complete |
| CMD-10 | Phase 22 | Complete |
| CMD-11 | Phase 22 | Complete |
| CMD-12 | Phase 22 | Complete |
| CMD-13 | Phase 22 | Complete |
| CMD-14 | Deferred | Deferred — needs command registry |
| CMD-15 | Phase 22 | Complete |
| FT-01 | Phase 23 | Complete |
| FT-02 | Phase 23 | Complete |
| FT-03 | Phase 23 | Complete |
| FT-04 | Phase 23 | Complete |
| FT-05 | Phase 23 | Complete |
| FT-06 | Phase 23 | Complete |
| FT-07 | Phase 23 | Complete |
| FT-08 | Phase 23 | Complete |
| FT-09 | Phase 23 | Complete |
| FT-10 | Phase 23 | Complete |
| FT-11 | Phase 23 | Complete |
| FT-12 | Phase 23 | Complete |
| FT-13 | Phase 23 | Complete |
| FT-14 | Phase 23 | Complete |
| FT-15 | Phase 23 | Complete |
| FT-16 | Phase 23 | Complete |
| ED-01 | Phase 24 | Complete |
| ED-02 | Phase 24 | Complete |
| ED-03 | Phase 24 | Complete |
| ED-04 | Phase 24 | Complete |
| ED-05 | Phase 24 | Complete |
| ED-06 | Phase 24 | Complete |
| ED-07 | Phase 24 | Complete |
| ED-08 | Phase 24 | Complete |
| ED-09 | Phase 24 | Complete |
| ED-10 | Phase 24 | Complete |
| ED-11 | Phase 24 | Complete |
| ED-12 | Phase 24 | Complete |
| ED-13 | Phase 24 | Complete |
| ED-14 | Phase 24 | Complete |
| ED-15 | Phase 24 | Complete |
| ED-16 | Phase 24 | Complete |
| ED-17 | Phase 24 | Complete |
| ED-18 | Phase 24 | Complete |
| ED-19 | Phase 24 | Complete |
| ED-20 | Phase 24 | Complete |
| TERM-01 | Phase 25 | Complete |
| TERM-02 | Phase 25 | Complete |
| TERM-03 | Phase 25 | Complete |
| TERM-04 | Phase 25 | Complete |
| TERM-05 | Phase 25 | Complete |
| TERM-06 | Phase 25 | Complete |
| TERM-07 | Phase 25 | Complete |
| TERM-08 | Phase 25 | Complete |
| TERM-09 | Phase 25 | Complete |
| TERM-10 | Phase 25 | Complete |
| TERM-11 | Phase 25 | Complete |
| TERM-12 | Phase 25 | Complete |
| TERM-13 | Phase 25 | Complete |
| TERM-14 | Phase 25 | Complete |
| TERM-15 | Phase 25 | Complete |
| GIT-01 | Phase 26 | Complete |
| GIT-02 | Phase 26 | Complete |
| GIT-03 | Phase 26 | Complete |
| GIT-04 | Phase 26 | Complete |
| GIT-05 | Phase 26 | Complete |
| GIT-06 | Phase 26 | Complete |
| GIT-07 | Phase 26 | Complete |
| GIT-08 | Phase 26 | Complete |
| GIT-09 | Phase 26 | Complete |
| GIT-10 | Phase 26 | Pending |
| GIT-11 | Phase 26 | Pending |
| GIT-12 | Phase 26 | Pending |
| GIT-13 | Phase 26 | Pending |
| GIT-14 | Phase 26 | Pending |
| GIT-15 | Phase 26 | Pending |
| GIT-16 | Phase 26 | Complete |
| GIT-17 | Phase 26 | Complete |
| GIT-18 | Phase 26 | Pending |
| GIT-19 | Phase 26 | Pending |
| GIT-20 | Phase 26 | Complete |
| GIT-21 | Phase 26 | Complete |
| GIT-22 | Phase 26 | Complete |
| GIT-23 | Phase 26 | Complete |
| NAV-01 | Phase 26 | Complete |
| NAV-02 | Phase 26 | Complete |
| NAV-03 | Phase 26 | Complete |

**Coverage:**
- v1.2 requirements: 121 total
- Mapped to phases: 121
- Unmapped: 0

---
*Requirements defined: 2026-03-09*
*Last updated: 2026-03-09 after roadmap creation (traceability populated)*
