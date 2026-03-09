# Domain Pitfalls: M3 "The Workspace" -- Panel Integration

**Domain:** Adding Settings, Cmd+K, File Tree, Terminal, Git Panel, and Code Editor to an existing AI chat application
**Researched:** 2026-03-09

## Critical Pitfalls

Mistakes that cause rewrites or major issues.

### Pitfall 1: xterm.js Lifecycle vs React Lifecycle Mismatch
**What goes wrong:** xterm.js `Terminal` instances must be attached to a DOM element via `terminal.open(container)`. If the React component unmounts and remounts (tab switch), the terminal instance is destroyed and all session state is lost.
**Why it happens:** React tab switching destroys inactive tab DOM. xterm.js doesn't support detach/reattach.
**Consequences:** User loses terminal history and active shell session every time they switch to another tab and back.
**Prevention:** Keep the terminal DOM element mounted but hidden (`display: none` or `visibility: hidden`) when the terminal tab is inactive. Use CSS to show/hide rather than conditional React rendering (`{activeTab === 'terminal' && <Terminal />}` is WRONG). Alternatively, store terminal output in a buffer and replay on remount, but this loses interactive state.
**Detection:** Terminal goes blank when switching tabs.

### Pitfall 2: CodeMirror Initial Bundle Impact
**What goes wrong:** Importing CodeMirror at the top level adds ~300KB+ to the initial bundle, slowing first paint even for users who never open the editor.
**Why it happens:** CodeMirror 6 is modular but the base + language modes + extensions add up fast.
**Consequences:** 1-2 second slower initial load.
**Prevention:** `React.lazy(() => import('./CodeEditorPanel'))` with `<Suspense>`. CodeMirror languages should also be dynamically imported based on the file extension being opened. Never import a language grammar at the module level.
**Detection:** Bundle analyzer showing CodeMirror in the main chunk.

### Pitfall 3: Shell WebSocket Connection Leak
**What goes wrong:** Opening a terminal creates a WebSocket to `/shell`. If the component unmounts without properly closing the connection, the backend PTY session stays alive (30-minute timeout) and the WS connection leaks.
**Why it happens:** React strict mode double-mounts in dev. Tab switching unmounts. Navigation away from workspace.
**Consequences:** Multiple orphaned PTY processes on the server. Memory leak. Port exhaustion at scale.
**Prevention:** Connection cleanup in `useEffect` return function. Track connection in a ref, not state. Close WS with code 1000 on cleanup. For strict mode, use a ref guard to prevent double-connection.
**Detection:** `lsof -i | grep node-pty` showing multiple processes.

### Pitfall 4: Zustand Store Proliferation Without Constitution Update
**What goes wrong:** Adding the 5th store (file) without updating the Constitution's "exactly 4 stores" rule leads to confusion in future milestones about whether more stores are acceptable.
**Why it happens:** Expedient to just add a store without updating governance docs.
**Consequences:** Store count creeps to 7-8 without clear boundaries. Cross-store dependencies become a maze.
**Prevention:** Formally amend the Constitution when adding the file store. Document the store's responsibility boundary. Establish a clear rule: "5 stores for M3, any additional requires explicit justification."
**Detection:** `grep -r 'create<' stores/` showing unexpected store files.

### Pitfall 5: Settings Panel Race Condition with Backend State
**What goes wrong:** User changes a setting, gets success toast, but the backend fails silently or the change doesn't persist across server restart.
**Why it happens:** Some settings are in SQLite (API keys, credentials), some are in environment variables (not mutable), some are written to config files. The frontend doesn't distinguish between these persistence mechanisms.
**Consequences:** User thinks settings are saved when they're not. Phantom configuration.
**Prevention:** Map every setting to its backend persistence mechanism during implementation. Settings that write to environment variables should show "requires restart" notice. Use optimistic UI only for SQLite-backed settings. Always read-after-write to confirm.
**Detection:** Settings resetting after server restart.

## Moderate Pitfalls

### Pitfall 6: File Tree Performance with Large Repositories
**What goes wrong:** The `/api/projects/:name/files` endpoint returns the entire file tree as a nested JSON structure. For large repos (node_modules not gitignored, monorepos), this can be 50,000+ entries.
**Prevention:** Backend already filters `.git` and common ignore patterns. Frontend should: (1) lazy-load directory children on expand (if backend supports it), (2) virtualize the tree list for repos with 1000+ visible nodes, (3) set a depth limit on initial load. Start simple (no virtualization), add if needed.

### Pitfall 7: Git Panel Stale State
**What goes wrong:** Git status shown in the panel becomes stale when the AI agent makes changes (edits files, creates commits). User sees outdated diff.
**Prevention:** Listen for `projects_updated` WebSocket events (already emitted by backend file watchers) and trigger git status refresh. Add a manual refresh button as fallback.

### Pitfall 8: Command Palette Focus Trap Conflicts
**What goes wrong:** Cmd+K opens the command palette, but the chat composer also captures keyboard events. Typing in the palette accidentally sends a chat message or triggers composer shortcuts.
**Prevention:** Command palette must implement proper focus trap (shadcn Command handles this). The composer should check if a modal/overlay is open before processing keyboard events. Use `useUIStore(s => s.commandPaletteOpen)` as a guard in composer keyboard handler.

### Pitfall 9: Tab Switch Loses Chat Scroll Position
**What goes wrong:** User scrolls up in chat to read old messages, switches to Files tab, switches back to Chat, and scroll position resets to bottom.
**Prevention:** Chat scroll position must be preserved when tab switches away. Two approaches: (1) keep ChatView mounted but hidden (like terminal), (2) save scrollTop to a ref and restore on remount. Option 1 is simpler and preserves all chat state including streaming.

### Pitfall 10: CodeMirror Theme Mismatch
**What goes wrong:** CodeMirror uses its own theme system. Default themes look jarring against Loom's OKLCH design tokens.
**Prevention:** Create a custom CodeMirror theme that reads from Loom's CSS custom properties. V1 had `loom-dark.ts` theme -- reimplement using OKLCH tokens. Map surface tokens to CodeMirror's background/gutterBackground/selection colors.

## Minor Pitfalls

### Pitfall 11: shadcn Component Style Leaks
**What goes wrong:** shadcn components ship with Tailwind classes that reference default shadcn CSS variables (--background, --foreground, etc.) which may conflict with Loom's existing token names.
**Prevention:** Loom already uses the same variable names as shadcn (intentionally chosen). Verify after installation that shadcn's CSS doesn't override Loom's `:root` tokens. If conflicts arise, the shadcn overrides file resolves them.

### Pitfall 12: Terminal Resize Thrashing
**What goes wrong:** Resizing the bottom terminal panel fires continuous resize events. Each resize triggers xterm.js FitAddon to recalculate dimensions and send a resize message to the backend PTY.
**Prevention:** Debounce the FitAddon.fit() call during drag resize. Only send the final dimensions to the backend on pointer-up.

### Pitfall 13: Git Commit Without Staged Files
**What goes wrong:** User clicks commit without staging any files. Backend returns error.
**Prevention:** Disable commit button when no files are staged. Show clear UI indication of staged vs unstaged files.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| ContentLayout + Tabs | Tab switching destroys component state | Keep Chat and Terminal mounted, hide with CSS |
| Settings Panel | Backend persistence inconsistency | Map each setting to its storage mechanism |
| Command Palette | Focus trap conflicts with composer | Guard composer keyboard events when palette open |
| File Tree | Large repo performance | Lazy-load children, virtualize if needed |
| Code Editor | Bundle size, theme mismatch | React.lazy(), custom OKLCH theme |
| Terminal | WS leak, lifecycle mismatch | Ref-based cleanup, CSS show/hide instead of unmount |
| Git Panel | Stale state after agent changes | WebSocket event-driven refresh |

## Sources

- V1 implementation analysis (terminal lifecycle bugs observed in V1)
- Backend API contract (persistence mechanisms)
- xterm.js documentation (attach/detach limitations)
- CodeMirror 6 documentation (theming, bundle)
- Zustand documentation (store patterns)
- React 19 strict mode behavior
