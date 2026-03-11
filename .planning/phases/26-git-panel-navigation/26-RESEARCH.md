# Phase 26: Git Panel + Navigation - Research

**Researched:** 2026-03-11
**Domain:** Git UI panel (changes/history views, staging, commit, branch ops) + session management (rename, delete)
**Confidence:** HIGH

## Summary

Phase 26 is the final phase of M3 "The Workspace". It replaces the placeholder `<PanelPlaceholder name="Git" icon={GitBranch} />` in ContentArea with a fully functional git panel, and adds session rename/delete capabilities to the sidebar.

The backend is already complete -- `server/routes/git.js` exposes 18 endpoints covering status, diff, commit, branches, push/pull/fetch, remote-status, discard, and AI commit message generation. The frontend work is purely UI: types, hooks for API calls, and React components following established M3 patterns. The DiffEditor component (built in Phase 24) and useFileDiff hook are already wired and ready for integration from the git panel.

For navigation, the timeline store already has `updateSessionTitle` and `removeSession` actions. `SessionList` already has delete wired (calls `DELETE /api/projects/:name/sessions/:id`). The rename handler is a stub (`handleRename` just closes the context menu). NAV-01 requires inline editing in `SessionItem`, and NAV-02 needs a confirmation dialog before delete (currently deletes immediately).

**Primary recommendation:** Build in 3 waves -- (1) git types/hooks/useGitStatus, (2) ChangesView + CommitComposer + BranchSelector, (3) HistoryView + NAV features. No new dependencies needed beyond what's installed.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| GIT-01 | Changes/History sub-tab toggle | TabBar pattern from Phase 20, shadcn Tabs already installed |
| GIT-02 | Changed files grouped by status | Backend `/api/git/status` returns `{modified, added, deleted, untracked}` |
| GIT-03 | File row: status icon, filename, path, checkbox | Standard component, lucide icons for M/A/D/? |
| GIT-04 | Checkbox stages/unstages immediately | Backend `/api/git/commit` accepts files array; stage via add before commit. No dedicated stage/unstage endpoint -- handle client-side with tracked set |
| GIT-05 | Select All / Deselect All buttons | Pure client-side state toggle |
| GIT-06 | Click file opens diff in editor | useFileDiff hook + DiffEditor already exist from Phase 24 |
| GIT-07 | Commit composer with auto-resize textarea | Standard textarea with rows-auto pattern |
| GIT-08 | Successful commit: toast, clear, refresh | sonner toast already wired, re-fetch status after commit |
| GIT-09 | Failed commit: error toast | Error handling pattern from api-client |
| GIT-10 | Branch name in panel header | From `/api/git/status` response `branch` field |
| GIT-11 | Branch dropdown for switching | Backend `/api/git/branches` + `/api/git/checkout`; shadcn Select installed |
| GIT-12 | New Branch inline input | Backend `/api/git/create-branch` |
| GIT-13 | Push/Pull/Fetch buttons with icons | Backend endpoints exist for all three |
| GIT-14 | Loading spinner + success/error toast | FetchState pattern used throughout M3 |
| GIT-15 | Remote ahead/behind indicator | Backend `/api/git/remote-status` returns `{ahead, behind, hasRemote, hasUpstream}` |
| GIT-16 | AI commit message generation | Backend `/api/git/generate-commit-message` uses Claude SDK |
| GIT-17 | Discard changes per file with confirmation | Backend `/api/git/discard`; shadcn AlertDialog for confirmation |
| GIT-18 | History view: recent commits | Backend `/api/git/commits` returns `{hash, author, email, date, message, stats}` |
| GIT-19 | Click commit shows diff | Backend `/api/git/commit-diff`; DiffEditor can render |
| GIT-20 | Auto-refresh on WebSocket events | `projects_updated` event already dispatched as `loom:projects-updated` CustomEvent |
| GIT-21 | Destructive ops need confirmation | shadcn AlertDialog pattern from Phase 21 |
| GIT-22 | Loading skeleton | SettingsTabSkeleton pattern from Phase 21 |
| GIT-23 | Error state with retry | FileTree error pattern from Phase 23 |
| NAV-01 | Rename session via double-click inline edit | Timeline store `updateSessionTitle` exists; no backend rename endpoint -- title is client-side only |
| NAV-02 | Delete session via context menu with confirmation | SessionList already deletes; add AlertDialog confirmation |
| NAV-03 | Deleted session: remove + switch to most recent | `removeSession` already handles activeSessionId null-out; need navigation to most recent |
</phase_requirements>

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React 19 | 19.x | UI framework | Project standard |
| Zustand 5 | 5.x | State management | 5 stores per Constitution |
| lucide-react | latest | Icons | Project-wide icon library |
| sonner | latest | Toasts | Already wired via shadcn |
| @radix-ui/react-alert-dialog | latest | Confirmation dialogs | shadcn AlertDialog installed |
| @radix-ui/react-select | latest | Branch dropdown | shadcn Select installed |
| @radix-ui/react-tabs | latest | Changes/History sub-tabs | shadcn Tabs installed |
| @radix-ui/react-context-menu | latest | File context menus | shadcn ContextMenu installed |

### Supporting (already installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-codemirror-merge | latest | Diff view | Clicking changed files or commits |
| @codemirror/* | latest | Editor extensions | DiffEditor deps from Phase 24 |

### Alternatives Considered
None -- everything needed is already installed.

**Installation:**
```bash
# No new dependencies needed
```

## Architecture Patterns

### Component Structure
```
src/src/components/git/
  GitPanel.tsx              # Top-level, lazy-loaded
  GitPanelHeader.tsx        # Branch name, push/pull/fetch, remote status
  BranchSelector.tsx        # Dropdown + new branch input
  ChangesView.tsx           # File list grouped by status + commit composer
  ChangedFileRow.tsx        # Individual file row with checkbox, status, click-to-diff
  CommitComposer.tsx        # Textarea + commit button + generate message button
  HistoryView.tsx           # Commit list
  CommitRow.tsx             # Individual commit with hash, message, author, date
  CommitDetailView.tsx      # Files changed in a commit + per-file diff
  GitPanelSkeleton.tsx      # Loading state
  git-panel.css             # Panel-specific styles
```

### Hook Structure
```
src/src/hooks/
  useGitStatus.ts           # Polls /api/git/status, listens for WS events
  useGitBranches.ts         # Fetches /api/git/branches
  useGitCommits.ts          # Fetches /api/git/commits
  useGitRemoteStatus.ts     # Fetches /api/git/remote-status
  useGitOperations.ts       # Imperative: commit, push, pull, fetch, discard, checkout, create-branch, generate-message
```

### Type Structure
```
src/src/types/
  git.ts                    # GitStatus, GitFileChange, GitCommit, GitBranch, GitRemoteStatus, etc.
```

### Pattern 1: Client-Side Staging Model
**What:** The backend doesn't have separate stage/unstage endpoints. The `/api/git/commit` endpoint receives a `files` array and stages them before committing. The frontend needs a "staged" concept for the checkbox UI.
**When to use:** Always for the Changes view.
**Implementation:**
```typescript
// Client-side staging set -- NOT actual git staging
// When user checks a file, it goes into this set
// When committing, this set becomes the files[] payload
const [stagedFiles, setStagedFiles] = useState<Set<string>>(new Set());
```
**Key insight:** The backend `/api/git/status` returns files in `modified`, `added`, `deleted`, `untracked` arrays. Files in `added` are already git-staged (status `A `). The porcelain parser treats `M ` (staged modified) and ` M` (unstaged modified) both as "modified". The frontend's checkbox model is a simplification: "which files do you want in the next commit?" -- this is a commit selection UI, not a literal git staging area mirror.

### Pattern 2: FetchState Hook Pattern
**What:** Every git data hook follows the same FetchState pattern used in useFileDiff, useFileContent, etc.
**When to use:** All data-fetching hooks in this phase.
```typescript
const FetchState = {
  Idle: 'idle',
  Loading: 'loading',
  Loaded: 'loaded',
  Errored: 'errored',
} as const;
```

### Pattern 3: Auto-Refresh via WebSocket Events
**What:** Git panel should re-fetch status when files change in the project.
**When to use:** GIT-20 requirement.
```typescript
// Listen for the existing projects_updated CustomEvent
useEffect(() => {
  const handler = () => refetchStatus();
  window.addEventListener('loom:projects-updated', handler);
  return () => window.removeEventListener('loom:projects-updated', handler);
}, [refetchStatus]);
```

### Pattern 4: Lazy Loading in ContentArea
**What:** Replace PanelPlaceholder with a React.lazy loaded GitPanel.
```typescript
const LazyGitPanel = lazy(() =>
  import('@/components/git/GitPanel').then((mod) => ({
    default: mod.GitPanel,
  })),
);
```

### Pattern 5: Inline Edit for Session Rename (NAV-01)
**What:** Double-click on session title toggles to an input field. Enter confirms, Escape cancels.
**Implementation notes:**
- Session titles are client-side only (stored in timeline store, persisted to localStorage).
- No backend rename endpoint exists or is needed -- Claude/Codex sessions are identified by ID, and the title shown in the UI is derived from the first message content by the backend's `getSessions()` function.
- `updateSessionTitle` action already exists in the timeline store.
- The rename should update the store and persist via the existing persist middleware.

### Anti-Patterns to Avoid
- **Don't mirror git staging area exactly:** The backend's `/api/git/commit` already handles `git add` for the files you pass. Trying to maintain a perfect mirror of git's index/staging area would require separate stage/unstage API calls that don't exist. Keep the UI model simple: "select files for commit."
- **Don't poll for status:** Use WebSocket `projects_updated` events for reactivity instead of setInterval. Only fetch on mount and on event.
- **Don't create a 6th store:** Git state is ephemeral per panel render. Use local state in hooks, not a new Zustand store. The file store pattern was justified because multiple components share file tree state; git panel state is contained within the git component tree.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Diff view | Custom diff renderer | DiffEditor + useFileDiff (Phase 24) | Already built, tested, OKLCH themed |
| Confirmation dialogs | Custom modal | shadcn AlertDialog | Already installed, Radix focus trap |
| Branch dropdown | Custom select | shadcn Select | Already installed, accessible |
| Tab switching | Custom tabs | shadcn Tabs | Already installed |
| Toast notifications | Custom toast | sonner (already wired) | Project standard |
| Context menus | Custom context menu | shadcn ContextMenu | Already installed |
| Loading skeletons | Custom skeleton | Pulse animation pattern from Phase 21 | Consistent UX |

**Key insight:** Every UI primitive needed for this phase is already installed from previous phases. Zero new dependencies.

## Common Pitfalls

### Pitfall 1: Backend Status Response Shape
**What goes wrong:** The git status endpoint returns `{modified, added, deleted, untracked}` as string arrays. But the porcelain format has nuance: `M ` vs ` M` vs `MM` all map to "modified", and `A ` and `AM` both map to "added". Files can appear in multiple categories if they have both staged and unstaged changes.
**Why it happens:** `git status --porcelain` encodes two status columns (index and working tree).
**How to avoid:** The backend already flattens this. Trust the backend's categorization. Don't try to re-parse porcelain output on the frontend.
**Warning signs:** A file appearing in both "staged" and "modified" categories.

### Pitfall 2: Session Rename Has No Backend
**What goes wrong:** Trying to persist session title rename to the backend. There is no PUT endpoint for session title.
**Why it happens:** Session titles are derived from JSONL file content (first user message) by `getSessions()`.
**How to avoid:** Rename is purely client-side. `updateSessionTitle` in timeline store handles it. The persist middleware saves it to localStorage. On page reload, the stored title overrides the backend-derived title.
**Warning signs:** Looking for or trying to create a backend rename endpoint.

### Pitfall 3: Commit Message Escaping
**What goes wrong:** The backend `/api/git/commit` uses `execAsync('git commit -m "${message}"')` -- commit messages with double quotes, backticks, or `$` could cause shell injection.
**Why it happens:** Backend uses string interpolation in shell commands.
**How to avoid:** This is a backend concern. On the frontend, send the message as-is in the JSON body. The backend should be using `spawnAsync` with args array for safety, but that's out of scope for this phase. Don't try to escape the message on the frontend.

### Pitfall 4: Race Between Commit and Status Refresh
**What goes wrong:** After a successful commit, the status refresh might still show the committed files as modified.
**Why it happens:** Git operations are async, and the server might respond before the file system watcher triggers.
**How to avoid:** After successful commit, explicitly re-fetch status (don't rely solely on WebSocket event). Add a brief delay or await the status response.

### Pitfall 5: Remote Status When No Remote Exists
**What goes wrong:** Calling `/api/git/remote-status` when there's no remote configured returns `{hasRemote: false}` -- UI must handle this gracefully.
**Why it happens:** Not all projects have a remote origin.
**How to avoid:** Conditionally render push/pull/fetch buttons based on `hasRemote`. Show "No remote configured" when `hasRemote` is false.

### Pitfall 6: refs-during-render Lint Rule
**What goes wrong:** Using `useRef` to store callback functions during render (e.g., for the inline rename input).
**Why it happens:** React 19 strict mode + project ESLint rules catch this pattern.
**How to avoid:** Use the "null-check ref init" pattern from Phase 25 (`== null` guard) or `useCallback` + `useState` instead of refs for mutable state during render.

## Code Examples

### Git Status Hook Pattern
```typescript
// Source: Follows useFileDiff pattern from Phase 24
export function useGitStatus(projectName: string): GitStatusResult {
  const [result, setResult] = useState<GitStatusFetchResult>(IDLE_RESULT);

  // Re-fetch on mount and on projects_updated event
  const refetch = useCallback(() => {
    if (!projectName) return;
    setResult((prev) => ({ ...prev, state: FetchState.Loading }));
    apiFetch<GitStatusResponse>(
      `/api/git/status?project=${encodeURIComponent(projectName)}`,
    )
      .then((data) => {
        if (data.error) {
          setResult({ state: FetchState.Errored, error: data.error, data: null });
        } else {
          setResult({ state: FetchState.Loaded, error: null, data });
        }
      })
      .catch((err) => {
        setResult({
          state: FetchState.Errored,
          error: err instanceof Error ? err.message : 'Failed',
          data: null,
        });
      });
  }, [projectName]);

  // WebSocket auto-refresh
  useEffect(() => {
    const handler = () => refetch();
    window.addEventListener('loom:projects-updated', handler);
    return () => window.removeEventListener('loom:projects-updated', handler);
  }, [refetch]);

  // Initial fetch
  useEffect(() => { refetch(); }, [refetch]);

  return { ...result, refetch };
}
```

### Opening Diff from Git Panel (GIT-06)
```typescript
// Source: useOpenInEditor pattern from Phase 24, extended for diff mode
function handleFileClick(filePath: string) {
  // Switch to Files tab and open in diff mode
  setActiveTab('files');
  openFile(filePath); // Opens in editor tab
  // The DiffEditor is already wired to detect diff mode via useFileDiff
}
```

### Inline Rename Pattern (NAV-01)
```typescript
// In SessionItem: double-click toggles isEditing state
const [isEditing, setIsEditing] = useState(false);
const [editValue, setEditValue] = useState(title);

const handleDoubleClick = useCallback(() => {
  setEditValue(title);
  setIsEditing(true);
}, [title]);

const handleRenameConfirm = useCallback(() => {
  if (editValue.trim() && editValue !== title) {
    updateSessionTitle(id, editValue.trim());
  }
  setIsEditing(false);
}, [editValue, title, id, updateSessionTitle]);
```

### Commit Flow
```typescript
async function handleCommit(message: string, files: string[]) {
  setIsCommitting(true);
  try {
    await apiFetch('/api/git/commit', {
      method: 'POST',
      body: JSON.stringify({ project: projectName, message, files }),
    });
    toast.success('Changes committed');
    setCommitMessage('');
    setStagedFiles(new Set());
    refetchStatus(); // Explicit re-fetch after commit
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Commit failed');
  } finally {
    setIsCommitting(false);
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| 4 Zustand stores | 5 stores (file store added Phase 20) | M3 Phase 20 | Git panel uses file store for openFile/setActiveTab integration |
| Conditional render panels | CSS show/hide mount-once | M3 Phase 20 | Git panel stays mounted, preserves state across tab switches |
| PanelPlaceholder | Lazy-loaded full panel | This phase | GitPanel replaces placeholder in ContentArea |

## Open Questions

1. **Diff view for changed files vs commit diffs**
   - What we know: `useFileDiff` fetches from `/api/git/file-with-diff` (working tree diff). For commits, `/api/git/commit-diff` returns raw `git show` output (text, not structured old/new content).
   - What's unclear: The commit-diff endpoint returns raw `git show` output, not the `{currentContent, oldContent}` format that DiffEditor expects.
   - Recommendation: For commit diffs, parse the `git show` output to extract file-level diffs, or create a simpler text-based diff display for commit details. The merge view (DiffEditor) is ideal for working-tree changes; commit diffs may work better as a plain text diff display with syntax highlighting.

2. **Session rename persistence across devices**
   - What we know: Titles persist to localStorage only. Backend derives titles from JSONL content.
   - What's unclear: If user renames a session, then clears localStorage, the title reverts to the backend-derived one.
   - Recommendation: Accept this limitation. Session rename is a convenience feature. The alternative (modifying JSONL files or adding a metadata DB table) is out of scope for M3.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 + React Testing Library |
| Config file | `src/vite.config.ts` (vitest section) |
| Quick run command | `cd src && npx vitest run --reporter=verbose` |
| Full suite command | `cd src && npx vitest run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| GIT-01 | Sub-tab toggle Changes/History | unit | `cd src && npx vitest run src/src/components/git/GitPanel.test.tsx -x` | Wave 0 |
| GIT-02 | Files grouped by status | unit | `cd src && npx vitest run src/src/components/git/ChangesView.test.tsx -x` | Wave 0 |
| GIT-03 | File row renders status/name/checkbox | unit | `cd src && npx vitest run src/src/components/git/ChangedFileRow.test.tsx -x` | Wave 0 |
| GIT-04 | Checkbox toggles staging | unit | included in ChangesView test | Wave 0 |
| GIT-07 | Commit composer | unit | `cd src && npx vitest run src/src/components/git/CommitComposer.test.tsx -x` | Wave 0 |
| GIT-08 | Commit success flow | integration | included in CommitComposer test | Wave 0 |
| GIT-10 | Branch name display | unit | `cd src && npx vitest run src/src/components/git/GitPanelHeader.test.tsx -x` | Wave 0 |
| GIT-11 | Branch switching | unit | `cd src && npx vitest run src/src/components/git/BranchSelector.test.tsx -x` | Wave 0 |
| GIT-18 | History view commits | unit | `cd src && npx vitest run src/src/components/git/HistoryView.test.tsx -x` | Wave 0 |
| GIT-20 | Auto-refresh on WS events | unit | `cd src && npx vitest run src/src/hooks/useGitStatus.test.ts -x` | Wave 0 |
| GIT-22 | Loading skeleton | unit | included in GitPanel test | Wave 0 |
| GIT-23 | Error state with retry | unit | included in GitPanel test | Wave 0 |
| NAV-01 | Session rename inline edit | unit | `cd src && npx vitest run src/src/components/sidebar/SessionItem.test.tsx -x` | Exists (extend) |
| NAV-02 | Session delete confirmation | unit | `cd src && npx vitest run src/src/components/sidebar/SessionList.test.tsx -x` | Exists (extend) |

### Sampling Rate
- **Per task commit:** `cd src && npx vitest run --reporter=verbose`
- **Per wave merge:** `cd src && npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/src/types/git.ts` -- git type definitions
- [ ] `src/src/hooks/useGitStatus.ts` + test -- status fetching hook
- [ ] `src/src/hooks/useGitOperations.ts` -- imperative operations hook
- [ ] `src/src/components/git/` directory -- all git panel components
- [ ] Extend existing `SessionItem.test.tsx` and `SessionList.test.tsx` for NAV features

## Sources

### Primary (HIGH confidence)
- Backend source: `server/routes/git.js` -- all 18 endpoints verified by direct code reading
- Backend API contract: `.planning/BACKEND_API_CONTRACT.md` -- git section verified
- Existing codebase: ContentArea, DiffEditor, useFileDiff, useOpenInEditor, SessionList, SessionItem, SessionContextMenu -- all read directly
- Timeline store: `updateSessionTitle`, `removeSession` actions verified
- File store: `openFile`, `setActiveFile` actions verified

### Secondary (MEDIUM confidence)
- WebSocket event system: `loom:projects-updated` CustomEvent verified in stream-multiplexer.ts and websocket-init.ts

### Tertiary (LOW confidence)
- None -- all findings verified from source code

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all dependencies already installed, verified in package.json
- Architecture: HIGH -- follows established patterns from Phases 20-25
- Pitfalls: HIGH -- derived from reading actual backend implementation
- Backend API: HIGH -- read server/routes/git.js line by line (1157 lines)

**Research date:** 2026-03-11
**Valid until:** 2026-03-18 (stable -- final phase of M3, no external deps)
