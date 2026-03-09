# Feature Landscape: M3 "The Workspace"

**Domain:** AI coding tool workspace -- Settings, Cmd+K, File Tree, Terminal, Git Panel, Code Editor
**Researched:** 2026-03-09
**Confidence:** HIGH (V1 code analyzed, backend API contract verified, competitive analysis complete)

**Scope:** NEW features only. M1+M2 delivered: complete chat with streaming markdown, Shiki highlighting, tool cards, permissions, sidebar with sessions, composer with auto-resize/image attachments/FSM, 4 Zustand stores.

---

## Table Stakes

Features users expect from an AI coding tool workspace. Missing = product feels incomplete or unusable as a daily driver.

### Settings Panel

| Feature | Why Expected | Complexity | Dependencies |
|---------|--------------|------------|--------------|
| Agent auth status display (Claude/Codex/Gemini) | Can't know which providers are connected without it | Medium | `GET /api/cli/claude/status`, `/codex/status`, `/gemini/status` |
| API key management (CRUD) | Core security credential management | Low | `GET/POST/DELETE /api/settings/api-keys` |
| GitHub/GitLab credential management | Required for git operations | Low | `GET/POST/DELETE /api/settings/credentials` |
| Git user config (name/email) | Commits need author identity | Low | `GET/POST /api/user/git-config` |
| Appearance: font size, code editor prefs | Every dev tool has customizable appearance | Low | localStorage persistence |
| Tab-based navigation (5 tabs like V1) | Organized settings are expected | Low | shadcn Tabs (planned in component adoption map) |
| Modal or full-panel presentation | Settings must be accessible without leaving context | Low | shadcn Dialog (installed) |

### Command Palette (Cmd+K)

| Feature | Why Expected | Complexity | Dependencies |
|---------|--------------|------------|--------------|
| Global keyboard shortcut (Cmd+K / Ctrl+K) | Universal convention: VS Code, Linear, Raycast, Claude.ai, ChatGPT | Low | UI store `commandPaletteOpen` already exists |
| Session search and switching | Primary navigation accelerator | Medium | Timeline store sessions data |
| Project switching | Multi-project navigation without sidebar | Medium | `GET /api/projects` |
| Fuzzy search filtering | Users type partial names, expect instant matches | Low | cmdk handles this natively |
| Keyboard navigation (arrows + Enter + Escape) | Expected from every command palette | Low | cmdk handles this natively |
| Grouped commands (Navigation, Actions, Settings) | Organization prevents cognitive overload | Low | cmdk CommandGroup |

### File Tree Panel

| Feature | Why Expected | Complexity | Dependencies |
|---------|--------------|------------|--------------|
| Hierarchical directory browsing | Core file navigation | Medium | `GET /api/projects/:name/files` |
| File/folder expand/collapse | Standard tree behavior | Low | Local state |
| File type icons | Visual differentiation (folder, JS, TS, JSON, etc.) | Low | lucide-react (installed) |
| Click-to-open in code editor | Primary file opening mechanism | Low | Wires to Code Editor tab/panel |
| Current project scoping | Tree shows active project only | Low | Timeline store active project context |
| Loading state | Skeleton/spinner during file tree fetch | Low | shadcn Skeleton |

### Code Editor

| Feature | Why Expected | Complexity | Dependencies |
|---------|--------------|------------|--------------|
| Syntax highlighting (50+ languages) | Core editor function | Low | CodeMirror lang-* packages |
| Read-only file viewing | View files agent is working on | Low | CodeMirror readOnly extension |
| File save (write-back) | Edit files without leaving Loom | Medium | `PUT /api/projects/:name/file` |
| Line numbers | Standard editor feature | Low | CodeMirror lineNumbers() |
| Search within file (Cmd+F) | Basic text search | Low | CodeMirror search extension |
| File tab bar (open files) | Multiple files open simultaneously | Medium | Local UI state |
| Markdown preview | View rendered markdown for docs | Medium | react-markdown (installed) |
| OKLCH-themed syntax colors | Must match Loom design system | Medium | Custom CodeMirror theme using CSS vars |

### Terminal / Shell

| Feature | Why Expected | Complexity | Dependencies |
|---------|--------------|------------|--------------|
| Full terminal emulation | Run commands, see output with ANSI colors | Medium | xterm.js + WebSocket `/shell` |
| Auto-resize to container | Terminal fills available space | Low | @xterm/addon-fit |
| Clickable URLs in output | Convenience for links in terminal output | Low | @xterm/addon-web-links |
| Connection state UI (connecting/connected/disconnected) | Users need to know terminal status | Low | Connection store or local state |
| Project-scoped working directory | Terminal opens in project root | Low | `projectPath` in shell init message |
| Session persistence (30min buffer) | Reconnect without losing output | Low | Backend already handles this |
| Restart / disconnect controls | Recovery from stuck terminals | Low | Header buttons |

### Git Panel

| Feature | Why Expected | Complexity | Dependencies |
|---------|--------------|------------|--------------|
| Changes view (modified/added/deleted/untracked) | See what agent changed | Medium | `GET /api/git/status` |
| File staging (checkbox per file) | Selective commit | Medium | Local state + `POST /api/git/commit` with files array |
| Commit message input | Write commit messages | Low | Auto-resize textarea |
| Commit action | Commit staged files | Low | `POST /api/git/commit` |
| Current branch display | Know which branch you are on | Low | From git status response |
| Diff viewer (per file) | Review changes before committing | High | `GET /api/git/diff` + custom diff renderer |
| Commit history list | See recent commits | Medium | `GET /api/git/commits` |

---

## Differentiators

Features that set Loom apart from typical AI coding tool UIs. Not expected, but valued.

### Settings Panel

| Feature | Value Proposition | Complexity | Dependencies |
|---------|-------------------|------------|--------------|
| MCP server management (list/add/remove) | Most AI UIs don't expose MCP config visually | High | `GET/POST/DELETE /api/mcp/cli/*` |
| Per-provider MCP management (Claude + Codex) | Provider-specific server configs | Medium | Separate API routes per provider |
| Quick Settings overlay (chat prefs) | Instant toggle for auto-expand tools, show thinking, show raw params without opening full settings | Medium | localStorage + Zustand |

### Command Palette (Cmd+K)

| Feature | Value Proposition | Complexity | Dependencies |
|---------|-------------------|------------|--------------|
| Slash command execution from palette | Run `/help`, `/model`, `/cost` etc. without typing in composer | Medium | `POST /api/commands/execute` |
| Recent commands / frequent actions | Personalized command ranking | Low | localStorage history |
| Quick action: New session | Create session from palette | Low | Existing session creation flow |
| Quick action: Toggle thinking visibility | Preference toggle without opening settings | Low | UI store `toggleThinking` |
| Tab switching (Chat/Files/Shell/Git) | Navigate workspace areas without mouse | Low | UI store `setActiveTab` |
| Fuzzy file search from palette | Cmd+K then type filename, opens in editor | Medium | Compose with file tree data |

### File Tree Panel

| Feature | Value Proposition | Complexity | Dependencies |
|---------|-------------------|------------|--------------|
| File search/filter with fuzzy matching | Fast file finding in large projects | Medium | Local filter, fuse.js or native |
| Context menu (copy path, open in editor, open in terminal) | Right-click power user actions | Medium | shadcn Context-menu |
| Image preview (inline or lightbox) | View screenshots/assets without external tool | Medium | shadcn Dialog for lightbox |
| File change indicators (dots on modified files) | See which files git says changed, in the tree | Medium | Cross-reference with git status |
| Detailed view mode (size, modified date) | Extra metadata for power users | Low | Backend already returns file metadata |

### Code Editor

| Feature | Value Proposition | Complexity | Dependencies |
|---------|-------------------|------------|--------------|
| Diff view mode (side-by-side or unified) | Review agent edits in-place | High | @codemirror/merge |
| Word wrap toggle | Preference for long lines | Low | CodeMirror lineWrapping |
| "Open file from tool card" flow | Click file path in tool card -> opens in editor | Medium | Event bus or callback from chat to editor |
| Markdown preview split | Edit + preview side by side | Medium | react-markdown + split pane |

### Terminal / Shell

| Feature | Value Proposition | Complexity | Dependencies |
|---------|-------------------|------------|--------------|
| Plain shell mode (no AI provider) | Just a terminal, no Claude/Codex/Gemini | Low | `provider: 'plain-shell'` in init |
| Auth URL detection and display | Auto-handle browser auth flows from CLI | Low | Backend sends `auth_url` messages |

### Git Panel

| Feature | Value Proposition | Complexity | Dependencies |
|---------|-------------------|------------|--------------|
| Branch switching | Change branches from UI | Medium | `POST /api/git/checkout` |
| New branch creation | Create feature branches from UI | Medium | `POST /api/git/create-branch` |
| Remote status (ahead/behind) | Know if you need to push/pull | Medium | `GET /api/git/remote-status` |
| Push / Pull / Fetch actions | Full git workflow from UI | Medium | `POST /api/git/push`, `/pull`, `/fetch` |
| AI-generated commit messages | One-click smart commit messages | Medium | `POST /api/git/generate-commit-message` |
| Discard changes (per file) | Undo agent modifications | Medium | `POST /api/git/discard` |
| Commit detail diff view | Click commit to see what changed | Medium | `GET /api/git/commit-diff` |
| Select all / deselect all for staging | Bulk staging convenience | Low | Local UI state |

---

## Anti-Features

Features to explicitly NOT build in M3. These are traps that add complexity without proportional value.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Full IDE replacement (LSP, intellisense, debugging) | Out of scope per PROJECT.md. Loom complements VS Code, doesn't replace it. | Keep editor focused on viewing agent work, light edits, and diffs. |
| Monaco editor (vs CodeMirror) | Monaco is 5-10MB, poor mobile support, VS Code coupling. CodeMirror 6 is modular (~200KB), mobile-friendly, used by ChatGPT Canvas. | Use @uiw/react-codemirror (same as V1). |
| Real-time collaborative editing | Single-user tool, no multi-user requirement. | N/A |
| Git merge conflict resolution UI | Extremely complex, better handled in real IDE. | Show conflicts as diffs, let user resolve in VS Code. |
| Settings sync across devices | Single-server deployment, one user. | localStorage is sufficient. |
| File creation/rename/delete from tree | Agent handles file ops. Adding write operations creates dangerous dual-path mutation. | Read-only tree. Agent creates files. |
| Terminal multiplexer (split panes, tmux-like) | Massive complexity for marginal value in a web UI. | Single terminal is sufficient. |
| Multiple terminal tabs | Extra complexity for M3, limited value with single terminal. | Single terminal session, consider for M5 if requested. |
| Inline git blame / annotations | Complex, low value for AI coding workflow. | Show in commit history instead. |
| Custom keybinding configuration | Enormous complexity, almost no one uses it in web apps. | Hard-code sensible defaults (Cmd+K, Cmd+S, Escape). |
| Light mode | PROJECT.md: "Dark-only for M1-M3". | Dark mode only. |
| Aurora/ambient effects | M4 "The Polish" scope per milestone restructuring. | No gradient overlays on panels. |
| Inline code completion | Requires LSP integration, not Loom's value prop. | Out of scope entirely. |
| Editor minimap | Visual noise, rarely used in V1 per user feedback. | Omit for M3, add if requested in M4. |
| Settings import/export | Low value for single-user tool. | Defer indefinitely. |
| Split editor panes | High complexity, low value for M3 scope. | Single editor, consider for M5. |
| File search (ripgrep) | Would need new backend endpoint. | Use Cmd+K for file name search only. |
| Git stash management | Niche feature. | Defer to M5+. |

---

## Feature Dependencies

```
Content Layout + Tab System (FOUNDATION -- must exist before any panel renders)
  |
  +--> Settings Panel (independent overlay, no panel deps)
  +--> Terminal / Shell (independent panel, no deps)
  +--> Cmd+K Command Palette (independent overlay, better after other panels exist)
  |
  +--> File Tree -----> Code Editor (tree opens files IN editor)
  |      |                  |
  |      v                  v
  +--> Git Panel -------> Code Editor Diff Mode (diff opens IN editor)
         |
         v
       File Tree + Git Status (change indicators on tree nodes -- OPTIONAL polish)
```

**Critical path:** Content Layout + Tab System is the foundation. File Tree must exist before Code Editor is useful. Git Panel benefits from Code Editor for diff view but works standalone for status + commit. Terminal and Settings are fully independent.

---

## MVP Recommendation

**Phase 1 -- Foundation + Independent Panels:**
1. Content Layout + Tab System (tab bar, active tab routing, keyboard shortcuts Cmd+1/2/3/4)
2. Settings Panel (Agents, API Keys, Appearance, Git tabs -- modal overlay)
3. Terminal / Shell (xterm.js + WebSocket -- fully independent)

**Phase 2 -- Navigation Acceleration:**
4. Cmd+K Command Palette (session search, project switching, tab switching, slash commands)

**Phase 3 -- File Workspace:**
5. File Tree (hierarchical browsing, expand/collapse, file type icons, click-to-open)
6. Code Editor (CodeMirror 6, syntax highlighting, file tabs, read/write, OKLCH theme)

**Phase 4 -- Git Workflow:**
7. Git Panel (changes view, staging, commit, branch display, diff viewer, commit history)

**Defer to later milestones:**
- MCP server management UI (complex, M5 "The Power" scope per MILESTONES.md)
- File change indicators in tree from git status (M4 polish)
- AI-generated commit messages (convenience, not critical path)
- Editor minimap (M4 polish if requested)
- Multiple terminal sessions (M5 if requested)

---

## Panel Layout Strategy

The existing AppShell uses a 3-column CSS Grid: `sidebar | content | artifact (0px)`.

**Recommendation:** The content column should contain a tab-based workspace where Chat, Files, Shell, and Git are tabs. This matches V1's approach and the `activeTab` / `TabId` type already defined in the UI store.

The artifact column (currently 0px) should remain reserved for M5 (multi-provider tabs, artifacts panel). Do NOT use it for workspace panels in M3.

**Tab layout within content area:**
```
+------------------------------------------+
| Tab Bar: [Chat] [Files] [Shell] [Git]    |
+------------------------------------------+
| Active Tab Content                        |
|                                           |
| (Chat = existing ChatView)               |
| (Files = File Tree + Code Editor split)  |
| (Shell = Terminal full-height)           |
| (Git = Changes + History views)          |
+------------------------------------------+
```

The Files tab needs an internal split (tree sidebar + editor main). Use CSS Grid or flexbox with the tree at ~240px and editor taking remaining space.

Settings and Cmd+K are **overlays** (modal/dialog), not tabs. They appear on top of any active tab.

---

## Complexity Assessment

| Panel | Estimated Complexity | LOC Estimate | Rationale |
|-------|---------------------|--------------|-----------|
| Content Layout + Tabs | Low | 200-400 | Tab bar + route rendering. Foundation for everything. |
| Settings | Medium | 1500-2500 | 5 tabs, CRUD forms, provider auth status. shadcn primitives handle most UI. |
| Cmd+K | Low-Medium | 500-800 | cmdk/shadcn Command handles heavy lifting. Custom groups + actions. |
| File Tree | Medium | 800-1200 | Recursive tree rendering, expand/collapse state, search filter. |
| Code Editor | Medium-High | 1200-2000 | CodeMirror setup, custom OKLCH theme, file tabs, diff mode, markdown preview. |
| Terminal | Low-Medium | 400-700 | xterm.js handles emulation; we wire WebSocket + fit addon + connection state. |
| Git Panel | High | 1500-2500 | Changes view, staging, commit flow, branch mgmt, diff viewer, history list. |
| **Total** | | **~6100-10100** | Comparable to M2's 10,363 net LOC. |

---

## Existing Infrastructure to Leverage

| What Exists | Where | How M3 Uses It |
|-------------|-------|----------------|
| `activeTab: TabId` in UI store | `src/src/stores/ui.ts` | Tab switching between Chat/Files/Shell/Git |
| `commandPaletteOpen` in UI store | `src/src/stores/ui.ts` | Cmd+K toggle state |
| `modalState: ModalState` in UI store | `src/src/stores/ui.ts` | Settings modal state |
| `toggleCommandPalette()` action | `src/src/stores/ui.ts` | Cmd+K keyboard shortcut handler |
| `setActiveTab()` action | `src/src/stores/ui.ts` | Tab navigation from Cmd+K |
| AppShell 3-column grid | `src/src/components/app-shell/AppShell.tsx` | Content column hosts tab workspace |
| PanelErrorBoundary | `src/src/components/shared/ErrorBoundary.tsx` | Wrap each panel |
| shadcn Dialog (installed) | shadcn/ui | Settings modal |
| shadcn Scroll-area (installed) | shadcn/ui | File tree, commit history scrolling |
| shadcn Tooltip (installed) | shadcn/ui | Icon button tooltips in panel headers |
| shadcn Kbd (installed) | shadcn/ui | Keyboard shortcuts in Cmd+K |
| shadcn Collapsible (installed) | shadcn/ui | File tree directories |
| react-markdown (installed) | npm | Code editor markdown preview |
| Shiki (installed) | npm | Code editor syntax highlighting reuse |
| lucide-react (installed) | npm | File type icons, panel controls |
| OKLCH design tokens | `src/src/styles/tokens.css` | All panel styling |
| cn() utility | `src/src/utils/cn.ts` | Class composition |
| Backend git routes (18 endpoints) | `server/routes/git.js` | Full git workflow API |
| Backend settings routes (8 endpoints) | `server/routes/settings.js` | API keys, credentials CRUD |
| Backend MCP routes (6 endpoints) | `server/routes/mcp.js` | MCP server management |
| Backend shell WebSocket (`/shell`) | `server/index.js` | Terminal PTY sessions |
| Backend file routes (3 endpoints) | inline in `server/index.js` | File tree + content reading |
| Backend commands routes (3 endpoints) | `server/routes/commands.js` | Slash commands for Cmd+K |
| Backend CLI auth routes (3 endpoints) | `server/routes/cli-auth.js` | Agent auth status for settings |

---

## Key Competitive Insights

**What Cursor/Windsurf have that Loom should match (table stakes for AI coding tools):**
- File explorer with tree navigation
- Integrated terminal with AI awareness
- Git source control panel with diff view
- Settings accessible via both UI and command palette
- Cmd+K / Ctrl+Shift+P command palette for everything

**What Loom can do that IDE forks cannot:**
- Beautiful, opinionated dark-only design (not VS Code's generic theme)
- OKLCH-based color system with warm charcoal aesthetic
- Purpose-built tool cards showing exactly what the agent is doing
- Streaming-first architecture with 60fps rendering
- Cross-provider support (Claude + Codex + Gemini in one workspace)

**Key lesson from reference analysis:** Claude.ai and ChatGPT keep their workspace panels minimal and focused. These panels exist to support the chat workflow, not replace a real IDE. Build the minimum viable version of each panel, then polish in M4.

---

## Sources

- V1 Feature Inventory (`.planning/V1_FEATURE_INVENTORY.md`) -- HIGH confidence, source-code verified
- Backend API Contract (`.planning/BACKEND_API_CONTRACT.md`) -- HIGH confidence, 47+ endpoints documented
- Component Adoption Map (`.planning/COMPONENT_ADOPTION_MAP.md`) -- HIGH confidence
- Reference App Analysis (`.planning/reference-app-analysis.md`) -- HIGH confidence, 6 products analyzed
- M3 Deferred Context (`.planning/M3-POLISH-DEFERRED-CONTEXT.md`) -- HIGH confidence
- UI Store (`src/src/stores/ui.ts`) -- HIGH confidence, verified in codebase
- [Cursor Features](https://cursor.com/features) -- MEDIUM confidence
- [shadcn Command](https://ui.shadcn.com/docs/components/radix/command) -- HIGH confidence
- [cmdk](https://cmdk.paco.me/) -- HIGH confidence
- [CodeMirror 6](https://codemirror.net/) -- HIGH confidence
- [xterm.js](https://xtermjs.org/) -- HIGH confidence
- [react-codemirror](https://uiwjs.github.io/react-codemirror/) -- HIGH confidence
- [Windsurf Docs](https://docs.windsurf.com/) -- MEDIUM confidence
