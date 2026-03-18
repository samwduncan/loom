# Phase 42: Session Discovery - Research

**Researched:** 2026-03-18
**Domain:** Sidebar session search, pinning, and bulk deletion
**Confidence:** HIGH

## Summary

Phase 42 adds three features to the existing multi-project sidebar: inline search filtering, session pinning, and bulk delete. All three operate on the existing `ProjectGroup` / `useMultiProjectSessions` architecture from Phase 41. The codebase is well-structured for these additions -- search is pure client-side filtering on already-fetched data, pinning is a localStorage-persisted Set (same pattern as `expandedProjects`), and bulk delete chains the existing single-delete endpoint in parallel.

No new libraries are needed. No backend changes are required for search or pinning (both are client-side). Bulk delete can use the existing `DELETE /api/projects/:projectName/sessions/:sessionId` endpoint called N times in parallel -- a dedicated bulk endpoint would be premature optimization for a single-user tool.

**Primary recommendation:** Keep all three features client-side except for the delete API calls. Use the existing `useMultiProjectSessions` hook's `projectGroups` as the search corpus. Persist pins to localStorage. Add a shadcn Checkbox component for bulk selection mode.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SESS-07 | Sidebar has inline search/filter bar that filters sessions by title across all projects | Client-side filter on `projectGroups` with highlight via `<mark>` tag. Search input placed between NewChatButton and SessionList in Sidebar. |
| SESS-08 | User can pin sessions to the top of their project group | localStorage Set of session IDs. `groupSessionsByProject` modified to hoist pinned sessions into a "Pinned" pseudo-date-group at top of each project. Pin toggle via context menu + pin icon on SessionItem. |
| SESS-09 | User can select multiple sessions and delete them in bulk | Selection mode toggled by context menu "Select" or dedicated button. Checkboxes on SessionItems. Bulk action bar with count + Delete button. Parallel DELETE calls with optimistic removal + rollback on failure. |
</phase_requirements>

## Standard Stack

### Core (already installed, no new deps)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React 19 | 19.x | Component framework | Existing stack |
| Zustand 5 | 5.x | State management (timeline store) | Existing stack |
| lucide-react | latest | Icons (Pin, Search, X, Trash2, CheckSquare) | Already used throughout sidebar |
| sonner | latest | Toast notifications for bulk delete feedback | Already used for error toasts |
| @radix-ui/react-alert-dialog | latest | DeleteSessionDialog confirmation | Already installed via shadcn |

### Supporting (may need shadcn CLI install)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn Checkbox | - | Bulk select checkboxes | Need to run `npx shadcn@latest add checkbox` if not already installed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Client-side search | fuse.js fuzzy search | Overkill for title-only matching; simple `includes()` is sufficient for <500 sessions |
| localStorage pins | Zustand persist store | Pins are view-layer preference, not app state -- localStorage matches `expandedProjects` pattern |
| Parallel single DELETEs | New bulk DELETE endpoint | Single-user tool, N is small (user won't select 100+), adding endpoint is unwarranted |

## Architecture Patterns

### Recommended Changes to Existing Structure
```
src/src/
  components/sidebar/
    SessionList.tsx          # MODIFY: add search state, selection state, bulk actions
    SessionItem.tsx          # MODIFY: add checkbox, pin icon, highlight support
    SessionContextMenu.tsx   # MODIFY: add Pin/Unpin and Select menu items
    DeleteSessionDialog.tsx  # MODIFY: support count > 1 in message text
    SearchInput.tsx          # NEW: inline search bar component
    BulkActionBar.tsx        # NEW: floating bar with count + delete button
    ProjectHeader.tsx        # MODIFY: minor -- pinned count in badge
    sidebar.css              # MODIFY: add pinned-session, search-input, bulk-action styles
  hooks/
    useSessionSearch.ts      # NEW: search state + filtered results
    useSessionPins.ts        # NEW: localStorage pin management
    useSessionSelection.ts   # NEW: selection state + bulk delete logic
  lib/
    sessionGrouping.ts       # MODIFY: accept pinnedIds, hoist pinned sessions
```

### Pattern 1: Client-Side Search Filtering
**What:** Filter `projectGroups` by title match, flatten results across projects during search
**When to use:** When search query is non-empty
**Example:**
```typescript
// In useSessionSearch.ts
function filterProjectGroups(
  groups: ProjectGroup[],
  query: string,
): ProjectGroup[] {
  if (!query.trim()) return groups;
  const lower = query.toLowerCase();
  return groups
    .map((project) => ({
      ...project,
      dateGroups: project.dateGroups
        .map((dg) => ({
          ...dg,
          sessions: dg.sessions.filter((s) =>
            s.title.toLowerCase().includes(lower),
          ),
        }))
        .filter((dg) => dg.sessions.length > 0),
      visibleCount: project.dateGroups.reduce(
        (sum, dg) => sum + dg.sessions.filter((s) =>
          s.title.toLowerCase().includes(lower),
        ).length, 0,
      ),
    }))
    .filter((p) => p.visibleCount > 0);
}
```

### Pattern 2: Search Highlight with `<mark>` Tag
**What:** Wrap matching substring in `<mark>` for visual highlight
**When to use:** When rendering session title during active search
**Example:**
```typescript
// In SessionItem.tsx -- highlight helper
function highlightMatch(title: string, query: string): React.ReactNode {
  if (!query) return title;
  const lower = title.toLowerCase();
  const idx = lower.indexOf(query.toLowerCase());
  if (idx === -1) return title;
  return (
    <>
      {title.slice(0, idx)}
      <mark className="bg-accent-primary/20 text-foreground rounded-sm px-0.5">
        {title.slice(idx, idx + query.length)}
      </mark>
      {title.slice(idx + query.length)}
    </>
  );
}
```

### Pattern 3: Pin Persistence (localStorage Set)
**What:** Same pattern as `expandedProjects` -- localStorage-backed Set of session IDs
**When to use:** Pin/unpin toggle
**Example:**
```typescript
// useSessionPins.ts
const PINS_STORAGE_KEY = 'loom-pinned-sessions';

function loadPins(): Set<string> {
  try {
    const stored = localStorage.getItem(PINS_STORAGE_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch { return new Set(); }
}

function savePins(pins: Set<string>): void {
  localStorage.setItem(PINS_STORAGE_KEY, JSON.stringify([...pins]));
}
```

### Pattern 4: Pinned Session Hoisting in groupSessionsByProject
**What:** Accept a `pinnedIds: Set<string>` parameter, extract matching sessions into a "Pinned" pseudo-date-group at the top of each project
**When to use:** When rendering the session list
**Example:**
```typescript
// In sessionGrouping.ts -- modified groupSessionsByProject
// After filtering junk, partition into pinned vs unpinned
const pinned = visibleSessions.filter((s) => pinnedIds.has(s.id));
const unpinned = visibleSessions.filter((s) => !pinnedIds.has(s.id));
const dateGroups: ProjectSessionGroup[] = [];
if (pinned.length > 0) {
  dateGroups.push({ label: 'Pinned' as SessionDateGroup, sessions: pinned });
}
dateGroups.push(...groupIntoDateBuckets(unpinned));
```

Note: `SessionDateGroup` type needs to add `'Pinned'` to the union.

### Pattern 5: Bulk Delete with Parallel Requests
**What:** Fire N DELETE requests via `Promise.allSettled`, optimistically remove from store, rollback failures
**When to use:** When user confirms bulk delete
**Example:**
```typescript
// In useSessionSelection.ts or SessionList.tsx
async function bulkDelete(
  selectedIds: Set<string>,
  projectGroups: ProjectGroup[],
) {
  // Build session-to-project mapping from projectGroups
  const sessionProjectMap = new Map<string, string>();
  for (const pg of projectGroups) {
    for (const dg of pg.dateGroups) {
      for (const s of dg.sessions) {
        sessionProjectMap.set(s.id, pg.projectName);
      }
    }
  }

  const results = await Promise.allSettled(
    [...selectedIds].map((id) => {
      const project = sessionProjectMap.get(id);
      if (!project) return Promise.reject(new Error(`No project for ${id}`));
      return apiFetch(
        `/api/projects/${encodeURIComponent(project)}/sessions/${encodeURIComponent(id)}`,
        { method: 'DELETE' },
      );
    }),
  );

  const failed = results.filter((r) => r.status === 'rejected');
  if (failed.length > 0) {
    toast.error(`Failed to delete ${failed.length} session(s)`);
  }
}
```

### Anti-Patterns to Avoid
- **Building a backend search endpoint:** Sessions are already fully fetched client-side by `useMultiProjectSessions`. Server-side search adds latency and complexity for zero benefit at this scale.
- **Storing pins in a Zustand store with persist:** Pins are a UI preference like `expandedProjects` -- keeping them in plain localStorage with a custom hook avoids coupling to store rehydration mechanics.
- **Bulk delete via single POST with array body:** Requires a new backend endpoint. The existing per-session DELETE is sufficient. `Promise.allSettled` handles partial failures gracefully.
- **Fuzzy search with fuse.js:** Already installed but overkill for exact title substring matching. Simple `String.includes()` is faster and more predictable.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Confirmation dialog | Custom modal | Existing `DeleteSessionDialog` (shadcn AlertDialog) | Already built, just needs count parameterization |
| Checkbox visual | Custom CSS checkbox | `shadcn Checkbox` (Radix) | Accessible, themed, keyboard-navigable |
| Toast notifications | Custom notification system | `sonner` (already installed) | Consistent with existing error/success patterns |
| Search debounce | Manual setTimeout/clearTimeout | Direct `onChange` filtering | Session count is small (<500), no debounce needed |

## Common Pitfalls

### Pitfall 1: Search + Collapsed Projects
**What goes wrong:** Search only filters sessions in expanded projects, missing matches in collapsed ones
**Why it happens:** Current rendering conditionally hides collapsed project sessions
**How to avoid:** During active search, force all projects to "appear expanded" so matches are visible. Store a `searchQuery` and when non-empty, bypass the `expandedProjects` check in the rendering loop.
**Warning signs:** User types query, sees no results, but matching session exists in a collapsed project

### Pitfall 2: Pinned Sessions in Wrong Project
**What goes wrong:** Pin IDs are global (just session IDs), but sessions must appear pinned within their correct project group
**Why it happens:** Session IDs are globally unique but the pin set doesn't track project association
**How to avoid:** The `groupSessionsByProject` function already knows which project each session belongs to. Pass `pinnedIds` and let it hoist within each project group. No project association needed in the pin set.
**Warning signs:** Pinned session appears in wrong project or in all projects

### Pitfall 3: Stale Selection After Refetch
**What goes wrong:** User selects sessions, then `loom:projects-updated` event fires and refetches, but selection references old session objects
**Why it happens:** Selection stores session IDs (strings), but the UI needs to reconcile against new data
**How to avoid:** Store selection as `Set<string>` of IDs (not session object references). On render, filter `selectedIds` against current visible session IDs to prune stale selections.
**Warning signs:** Selected count shows higher number than actual visible selected sessions

### Pitfall 4: Bulk Delete of Active Session
**What goes wrong:** Active session is in the bulk delete set; after deletion, app doesn't navigate away
**Why it happens:** Existing single-delete logic handles this, but bulk delete bypasses it
**How to avoid:** After bulk delete completes, check if `activeSessionId` was in the deleted set. If so, navigate to the most recent remaining session (or `/chat` if none).
**Warning signs:** Blank chat view with no session loaded after bulk delete

### Pitfall 5: Timeline Store vs MultiProject Store Sync
**What goes wrong:** Sessions deleted from backend but still appear because `useMultiProjectSessions` cached old data
**Why it happens:** Two data sources -- `useTimelineStore.sessions` and `useMultiProjectSessions.projectGroups` -- can get out of sync
**How to avoid:** After successful bulk delete, (1) call `removeSession` for each deleted ID on timeline store, AND (2) dispatch `loom:projects-updated` event to trigger a refetch in `useMultiProjectSessions`.
**Warning signs:** Deleted sessions reappear after navigating or collapsing/expanding project

### Pitfall 6: SessionList Exceeds 200-Line Constitution Limit
**What goes wrong:** Adding search, selection, and bulk delete state/handlers to SessionList pushes it well past 200 lines
**Why it happens:** SessionList is already ~200 lines with current functionality
**How to avoid:** Extract search, selection, and bulk delete into separate custom hooks (`useSessionSearch`, `useSessionPins`, `useSessionSelection`). Keep SessionList as the composition layer. Extract `BulkActionBar` and `SearchInput` as separate components.
**Warning signs:** File exceeds 200 lines during development

## Code Examples

### Search Input Component
```typescript
// SearchInput.tsx
import { Search, X } from 'lucide-react';
import { cn } from '@/utils/cn';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchInput({ value, onChange }: SearchInputProps) {
  return (
    <div className={cn('relative px-2 py-1.5')}>
      <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search sessions..."
        className={cn(
          'w-full pl-7 pr-7 py-1.5 rounded-md',
          'bg-surface-base border border-border',
          'text-[length:var(--text-body)] text-foreground placeholder:text-muted',
          'focus:outline-none focus:border-[var(--accent-primary)]',
          'transition-colors duration-[var(--duration-fast)]',
        )}
        aria-label="Search sessions"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
          aria-label="Clear search"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
```

### Context Menu with Pin and Select
```typescript
// Addition to SessionContextMenu -- new menu items
<button className="context-menu-item" onClick={onPin} role="menuitem" type="button">
  {isPinned ? 'Unpin' : 'Pin to top'}
</button>
<button className="context-menu-item" onClick={onSelect} role="menuitem" type="button">
  Select
</button>
// Existing Rename and Delete items follow
```

### Bulk Action Bar
```typescript
// BulkActionBar.tsx -- fixed bar at bottom of session list
import { Trash2, X } from 'lucide-react';
import { cn } from '@/utils/cn';

interface BulkActionBarProps {
  count: number;
  onDelete: () => void;
  onCancel: () => void;
}

export function BulkActionBar({ count, onDelete, onCancel }: BulkActionBarProps) {
  return (
    <div className={cn(
      'flex items-center justify-between gap-2',
      'px-3 py-2 border-t border-border bg-surface-raised',
    )}>
      <span className="text-[length:var(--text-body)] text-muted">
        {count} selected
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onDelete}
          className={cn(
            'p-1.5 rounded-md text-[var(--status-error)]',
            'hover:bg-[var(--status-error)]/10 transition-colors',
          )}
          aria-label={`Delete ${count} sessions`}
        >
          <Trash2 size={16} />
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="p-1.5 rounded-md text-muted hover:text-foreground transition-colors"
          aria-label="Cancel selection"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single project session list | Multi-project with collapsible groups | Phase 41 (2026-03-18) | Search must work across all project groups |
| Single delete via context menu | Single delete with confirmation dialog | Phase 41 (2026-03-18) | Bulk delete extends this pattern |

## Open Questions

1. **Pinned section label**
   - What we know: Need a "Pinned" label at top of each project group
   - What's unclear: Should "Pinned" use the same `DateGroupHeader` component or a visually distinct header with a pin icon?
   - Recommendation: Reuse `DateGroupHeader` with a pin icon prefix for consistency. Low risk, easy to change later.

2. **Entering bulk select mode**
   - What we know: Need a way to toggle into selection mode where checkboxes appear
   - What's unclear: Should it be a dedicated sidebar button, context menu "Select" item, or long-press?
   - Recommendation: Context menu "Select" item enters selection mode with that session pre-selected. A secondary "Select mode" button near the search bar for discovery. Escape exits selection mode.

3. **Search behavior when selecting**
   - What we know: Search and select are both sidebar features
   - What's unclear: Can user search while in selection mode?
   - Recommendation: Yes -- search narrows visible sessions, checkboxes still work. This lets users search-then-select efficiently.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.x + @testing-library/react |
| Config file | `src/vite.config.ts` (vitest section) |
| Quick run command | `cd src && npx vitest run --reporter=verbose` |
| Full suite command | `cd src && npx vitest run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SESS-07 | Search filters sessions by title across projects | unit | `cd src && npx vitest run src/src/hooks/useSessionSearch.test.ts -x` | Wave 0 |
| SESS-07 | Search highlights matching text in results | unit | `cd src && npx vitest run src/src/components/sidebar/SessionItem.test.tsx -x` | Existing (extend) |
| SESS-07 | All projects shown during search (even collapsed) | unit | `cd src && npx vitest run src/src/components/sidebar/SessionList.test.tsx -x` | Existing (extend) |
| SESS-08 | Pin toggle persists to localStorage | unit | `cd src && npx vitest run src/src/hooks/useSessionPins.test.ts -x` | Wave 0 |
| SESS-08 | Pinned sessions appear at top of project group | unit | `cd src && npx vitest run src/src/lib/sessionGrouping.test.ts -x` | Existing (extend) |
| SESS-09 | Bulk selection adds/removes session IDs | unit | `cd src && npx vitest run src/src/hooks/useSessionSelection.test.ts -x` | Wave 0 |
| SESS-09 | Bulk delete calls API for each selected session | unit | `cd src && npx vitest run src/src/components/sidebar/SessionList.test.tsx -x` | Existing (extend) |
| SESS-09 | Confirmation dialog shows correct count | unit | `cd src && npx vitest run src/src/components/sidebar/DeleteSessionDialog.test.tsx -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `cd src && npx vitest run --reporter=verbose`
- **Per wave merge:** `cd src && npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/src/hooks/useSessionSearch.test.ts` -- covers SESS-07 search filtering
- [ ] `src/src/hooks/useSessionPins.test.ts` -- covers SESS-08 pin persistence
- [ ] `src/src/hooks/useSessionSelection.test.ts` -- covers SESS-09 selection state + bulk delete
- [ ] `src/src/components/sidebar/DeleteSessionDialog.test.tsx` -- covers SESS-09 count display
- [ ] shadcn Checkbox install: `cd src && npx shadcn@latest add checkbox` -- if not already present

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection of `src/src/components/sidebar/` (SessionList, SessionItem, ProjectHeader, DateGroupHeader, DeleteSessionDialog, SessionContextMenu)
- Direct codebase inspection of `src/src/hooks/useMultiProjectSessions.ts`, `src/src/lib/sessionGrouping.ts`
- Direct codebase inspection of `src/src/types/session.ts` (SessionMetadata, ProjectGroup, Session types)
- Backend endpoint inspection: `server/index.js` line 534 (DELETE session endpoint)
- `.planning/BACKEND_API_CONTRACT.md` line 170 (DELETE session API)

### Secondary (MEDIUM confidence)
- Architecture patterns derived from existing codebase conventions (expandedProjects localStorage pattern, optimistic update pattern from rename)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new deps, all patterns proven in codebase
- Architecture: HIGH - extends existing Phase 41 patterns directly
- Pitfalls: HIGH - identified from direct code analysis of current data flow
- Search: HIGH - simple substring match on fetched data, no backend needed
- Pinning: HIGH - mirrors expandedProjects localStorage pattern exactly
- Bulk delete: HIGH - chains existing DELETE endpoint, Promise.allSettled for resilience

**Research date:** 2026-03-18
**Valid until:** 2026-04-18 (stable -- no external dependencies)
