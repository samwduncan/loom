# Project Research Summary

**Project:** Loom V2 -- M3 "The Workspace"
**Domain:** AI coding tool workspace panels (Settings, Cmd+K, File Tree, Terminal, Git Panel, Code Editor)
**Researched:** 2026-03-09
**Confidence:** HIGH

## Executive Summary

M3 "The Workspace" transforms Loom from a chat-only interface into a usable daily-driver coding tool by adding six workspace panels: Settings, Command Palette (Cmd+K), File Tree, Code Editor, Terminal, and Git Panel. The existing V2 architecture (AppShell CSS Grid, 4 Zustand stores, WebSocket client, React Router v7) is well-structured to absorb these panels. The core stack is already installed -- only three new dependency clusters are needed: xterm.js for the terminal, CodeMirror 6 for the code editor, and cmdk for the command palette. The bulk of the UI will be built from shadcn/ui primitives (14 components to install), which ride on the already-installed Radix foundation with zero incremental bundle cost.

The recommended approach is a tab-based workspace inside the existing content column, with Chat, Files, Shell, and Git as switchable tabs and Settings/Cmd+K as overlays. This matches V1's proven UX, aligns with every IDE-like workspace pattern, and requires minimal changes to the existing AppShell grid. A 5th Zustand store (file store) is needed for shared state between the file tree and code editor -- this is the only structural change to the existing architecture. The terminal uses a separate WebSocket connection to `/shell`, completely independent of the chat WebSocket, matching the backend's design.

The key risks are: (1) xterm.js lifecycle mismatch with React tab switching -- the terminal DOM must stay mounted but hidden, not conditionally rendered, or all session state is lost; (2) CodeMirror's ~300KB bundle must be lazy-loaded to avoid degrading initial paint; (3) shell WebSocket connection leaks from React strict mode double-mounts need ref-based guards; and (4) git panel state going stale when the AI agent makes changes, requiring WebSocket event-driven refresh. All of these have known solutions documented in the pitfalls research.

## Key Findings

### Recommended Stack

The core stack (React 19, TypeScript, Vite 7, Tailwind v4, Zustand 5) is fully installed and requires zero changes. Three new dependency clusters are needed, all with proven V1 precedent or industry-standard adoption. See [STACK.md](STACK.md) for full details.

**New dependencies:**
- **@xterm/xterm + addons**: Terminal emulation -- only viable option for browser terminals, V1 proven (~200KB, lazy-loaded)
- **@uiw/react-codemirror + lang-***: Code editor -- best React wrapper for CodeMirror 6, 5x smaller than Monaco (~300KB, lazy-loaded)
- **cmdk**: Command palette core -- powers shadcn Command component, fuzzy search + keyboard nav out of the box (~8KB)
- **14 shadcn/ui primitives**: tabs, form, input, label, switch, select, accordion, slider, checkbox, card, command, textarea, alert-dialog, context-menu, table, skeleton -- zero incremental bundle (Radix already installed)

### Expected Features

See [FEATURES.md](FEATURES.md) for full feature landscape with complexity estimates.

**Must have (table stakes):**
- Settings panel with agent auth status, API key management, git config, appearance prefs (5-tab layout)
- Command palette (Cmd+K) with session search, project switching, fuzzy filtering, grouped commands
- File tree with hierarchical browsing, expand/collapse, file type icons, click-to-open-in-editor
- Code editor with syntax highlighting, read/write, file tabs, line numbers, search, OKLCH theme
- Terminal with full PTY emulation, auto-resize, connection state UI, project-scoped cwd
- Git panel with changes view, file staging, commit, branch display, diff viewer, commit history

**Should have (differentiators):**
- MCP server management in settings
- Slash command execution from Cmd+K
- Context menu in file tree (copy path, open in editor/terminal)
- "Open file from tool card" flow (click file path in chat -> opens in editor)
- Branch switching/creation, push/pull/fetch, AI commit messages in git panel

**Defer to later milestones:**
- MCP server management UI (M5 "The Power")
- File change indicators from git status (M4 "The Polish")
- Multiple terminal sessions (M5)
- Editor minimap, split panes (M4/M5)
- Git stash management, merge conflict UI (M5+)
- Light mode, aurora effects (M4)

### Architecture Approach

All panels integrate into a new `ContentLayout` component within the existing content column of the AppShell CSS grid. Panels are tab-switched (Chat/Files/Git) with the terminal as a resizable bottom panel and Settings/Cmd+K as overlays. A 5th Zustand store handles file tree + editor state. See [ARCHITECTURE.md](ARCHITECTURE.md) for full component boundaries and data flow.

**Major components:**
1. **ContentLayout** -- Tab switching orchestrator, bottom panel management, thin coordination layer
2. **ContentHeader** -- Tab bar rendering (Chat, Files, Git), keyboard shortcuts (Cmd+1/2/3)
3. **SettingsPanel** -- 5-tab settings page (Agents, API Keys, Appearance, Git, Tasks), REST API CRUD
4. **CommandPalette** -- Portal overlay with cmdk/shadcn Command, reads from timeline + file stores
5. **FileTreePanel + FileStore** -- Recursive tree component, new 5th Zustand store for file state
6. **CodeEditorPanel** -- CodeMirror 6 with custom OKLCH theme, file tabs, lazy-loaded languages
7. **TerminalPanel** -- xterm.js with separate WebSocket to `/shell`, CSS show/hide (not unmount)
8. **GitPanel** -- Changes/history views, staging checkboxes, commit flow, diff viewer

### Critical Pitfalls

See [PITFALLS.md](PITFALLS.md) for all 13 pitfalls with full prevention strategies.

1. **xterm.js lifecycle mismatch** -- Terminal must stay mounted but hidden via CSS when tab switches away. Conditional rendering (`{activeTab === 'terminal' && <Terminal />}`) destroys session state. Same applies to ChatView for scroll position preservation.
2. **CodeMirror bundle bloat** -- Must use `React.lazy()` + `<Suspense>`. Language grammars must be dynamically imported per file extension, never at module level.
3. **Shell WebSocket connection leak** -- React strict mode double-mounts cause duplicate PTY processes. Use ref-based guards and close WS with code 1000 on cleanup.
4. **Settings persistence inconsistency** -- Some settings are SQLite-backed, some are env vars (not mutable at runtime). Map every setting to its persistence mechanism; show "requires restart" where appropriate.
5. **Git panel stale state** -- Agent changes files without the git panel knowing. Listen for `projects_updated` WebSocket events to trigger automatic refresh.

## Implications for Roadmap

Based on research, suggested phase structure (7 phases):

### Phase 1: Content Layout + Tab System
**Rationale:** Every other panel depends on this. It is the foundation for rendering any workspace panel. Highest leverage, smallest scope.
**Delivers:** Tab bar component, tab switching (Chat/Files/Git tabs), UI store expansion (TabId union, bottomPanelHeight), ContentLayout component, keyboard shortcuts (Cmd+1/2/3/4).
**Addresses:** Panel layout strategy from FEATURES.md, content area sub-grid from ARCHITECTURE.md.
**Avoids:** Tab switching destroying component state (Pitfall 9) -- implement CSS show/hide for Chat from the start.

### Phase 2: Settings Panel
**Rationale:** Zero dependencies on other panels. Largest surface area (5 tabs, many forms) so starting early burns down the biggest unknown. Installing 14 shadcn primitives here benefits all subsequent phases.
**Delivers:** Complete settings page with Agents, API Keys, Appearance, Git Config tabs. Agent auth status display. API key CRUD. shadcn primitives installed.
**Uses:** shadcn tabs, form, input, label, switch, select, accordion, slider, card from STACK.md.
**Avoids:** Settings persistence inconsistency (Pitfall 5) -- map each setting to its backend storage mechanism.

### Phase 3: Command Palette (Cmd+K)
**Rationale:** Small scope, high UX impact. Uses shadcn Command installed in Phase 2. Better after other panels exist (can navigate to them).
**Delivers:** Global Cmd+K overlay with session search, project switching, tab navigation, grouped commands. Fuzzy search via cmdk.
**Uses:** cmdk + shadcn Command from STACK.md.
**Avoids:** Focus trap conflicts with composer (Pitfall 8) -- guard composer keyboard events when palette is open.

### Phase 4: File Tree + File Store
**Rationale:** Code editor depends on file store. File tree is the gateway to the file workspace experience.
**Delivers:** 5th Zustand store (file state), recursive file tree component, file type icons, expand/collapse, click-to-open. Constitution amendment for 5th store.
**Avoids:** Large repo performance (Pitfall 6) -- lazy-load children on expand, defer virtualization. Store proliferation (Pitfall 4) -- formal Constitution amendment.

### Phase 5: Code Editor
**Rationale:** Requires file store from Phase 4. Heavy dependency (CodeMirror ~300KB) that must be lazy-loaded.
**Delivers:** CodeMirror 6 editor, syntax highlighting, file tabs, read/write, OKLCH custom theme, markdown preview, Cmd+F search.
**Uses:** @uiw/react-codemirror + lang-* packages from STACK.md.
**Avoids:** Bundle bloat (Pitfall 2) -- React.lazy() + dynamic language imports. Theme mismatch (Pitfall 10) -- custom OKLCH theme from day one.

### Phase 6: Terminal
**Rationale:** Fully independent of other panels. Could be parallelized with Phases 4-5 but serialized here for single-developer workflow.
**Delivers:** xterm.js terminal, Shell WebSocket connection, auto-resize, connection state UI, project-scoped cwd, plain shell mode.
**Uses:** @xterm/xterm + addons from STACK.md.
**Avoids:** Lifecycle mismatch (Pitfall 1) -- CSS show/hide, not conditional rendering. WS leak (Pitfall 3) -- ref-based cleanup with strict mode guard. Resize thrashing (Pitfall 12) -- debounce FitAddon.fit().

### Phase 7: Git Panel
**Rationale:** Independent REST API panel. Benefits from file store (open changed file in editor) but works standalone. Highest complexity panel, so placing it last gives maximum context from prior phases.
**Delivers:** Changes view, file staging with checkboxes, commit message + action, branch display, diff viewer, commit history, branch switching, push/pull/fetch.
**Uses:** shadcn checkbox, textarea, alert-dialog, select, table from STACK.md. diff package (already installed).
**Avoids:** Stale state (Pitfall 7) -- WebSocket event-driven refresh. Commit without staged files (Pitfall 13) -- disable button when nothing staged.

### Phase Ordering Rationale

- **Dependency-driven:** Content Layout must come first (all panels render inside it). File Store must precede Code Editor. Settings installs shadcn primitives reused everywhere.
- **Risk front-loading:** Settings (largest surface, most form complexity) is early to surface integration issues with shadcn and REST APIs before tackling heavier panels.
- **Independence exploitation:** Terminal and Git Panel have zero cross-panel dependencies. They are placed last because they can be deferred without blocking other work if the milestone runs long.
- **Pitfall-aware:** The most dangerous pitfalls (xterm lifecycle, CodeMirror bundle) are addressed in their specific phases with explicit prevention strategies.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2 (Settings):** Backend persistence mapping -- which settings are SQLite vs env vars vs config files needs verification per endpoint.
- **Phase 5 (Code Editor):** CodeMirror 6 OKLCH theme API -- custom theme creation needs hands-on experimentation. V1's `loom-dark.ts` is a starting reference but used different token system.
- **Phase 7 (Git Panel):** Diff rendering approach -- custom diff viewer vs @codemirror/merge for inline diffs. Need to evaluate visual quality vs complexity tradeoff.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Content Layout):** Tab bar + CSS grid sub-layout is trivial. Well-understood pattern.
- **Phase 3 (Cmd+K):** cmdk/shadcn Command is extremely well-documented with examples. Drop-in.
- **Phase 4 (File Tree):** Recursive tree component is a solved problem. No research needed.
- **Phase 6 (Terminal):** xterm.js integration is well-documented. V1 code serves as direct reference.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All deps are V1-proven or industry-standard. Versions verified against current package.json. |
| Features | HIGH | Feature landscape derived from V1 inventory, backend API contract, and competitive analysis of 6 products. |
| Architecture | HIGH | Based on direct analysis of existing V2 source code, not speculation. Integration points verified. |
| Pitfalls | HIGH | Terminal and CodeMirror pitfalls from V1 experience. Settings and git pitfalls from backend API analysis. |

**Overall confidence:** HIGH

All four research files drew from high-quality primary sources: the existing V2 codebase, V1 implementation (which actually shipped), the documented backend API contract, and verified dependency documentation. No research area relied on speculation or single secondary sources.

### Gaps to Address

- **File tree API response shape:** The exact structure of `GET /api/projects/:name/files` needs verification during Phase 4 planning. The backend contract documents it exists but the response schema may need runtime validation.
- **Settings persistence mapping:** Which specific settings endpoints write to SQLite vs env vars vs config files is not fully documented. Needs investigation during Phase 2 implementation.
- **CodeMirror 6 OKLCH theme API:** Custom theme creation for CodeMirror 6 needs hands-on testing. The `EditorView.theme()` API has changed across versions. V1's theme file is a reference but not directly portable.
- **Git diff rendering strategy:** Whether to use a custom diff component (like V1) or @codemirror/merge for a richer inline diff experience. Decision can be deferred to Phase 7 planning.

## Sources

### Primary (HIGH confidence)
- V2 source code (`src/src/`) -- direct analysis of stores, components, routing, WebSocket client
- V1 Feature Inventory (`.planning/V1_FEATURE_INVENTORY.md`) -- verified feature list
- Backend API Contract (`.planning/BACKEND_API_CONTRACT.md`) -- 47+ endpoints documented
- Component Adoption Map (`.planning/COMPONENT_ADOPTION_MAP.md`) -- shadcn primitive mapping
- Reference App Analysis (`.planning/reference-app-analysis.md`) -- 6 competitive products

### Secondary (MEDIUM confidence)
- [Cursor Features](https://cursor.com/features) -- competitive feature baseline
- [Windsurf Docs](https://docs.windsurf.com/) -- competitive feature baseline
- [xterm.js](https://xtermjs.org/) -- terminal integration patterns
- [CodeMirror 6](https://codemirror.net/) -- editor architecture and theming
- [cmdk](https://cmdk.paco.me/) -- command palette API
- [shadcn Command](https://ui.shadcn.com/docs/components/radix/command) -- component docs

---
*Research completed: 2026-03-09*
*Ready for roadmap: yes*
