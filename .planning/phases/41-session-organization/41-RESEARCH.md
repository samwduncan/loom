# Phase 41: Session Organization - Research

**Researched:** 2026-03-18
**Domain:** Sidebar UI refactor -- multi-project session grouping, date subgroups, junk filtering
**Confidence:** HIGH

## Summary

Phase 41 transforms the sidebar from a flat single-project session list into a hierarchical project > date > session structure. The current implementation (`SessionList.tsx`) reads sessions from the timeline store for one project, groups them via `groupSessionsByDate()` into 4 date buckets, and renders `DateGroupHeader` + `SessionItem` pairs. The phase requires: (1) fetching sessions across ALL projects, (2) grouping by project with collapsible headings, (3) date subgroups within each project, and (4) filtering out junk sessions.

The existing codebase provides strong foundations: `BackendSessionData` already includes `messageCount` and `summary` fields needed for junk detection, the backend `GET /api/projects` returns all projects with embedded session previews (first 5) plus `sessionMeta.hasMore/total`, and `GET /api/projects/:name/sessions?limit=999` fetches full session lists. The `formatTime.ts` grouping logic needs a minor extension (4 buckets to 5: add "This Week" and "This Month"). No new dependencies are needed.

An existing Plan 01 already covers the data layer (types, grouping functions, `useMultiProjectSessions` hook). A Plan 02 is needed for the UI layer -- replacing `SessionList` internals with project-grouped rendering, adding `ProjectHeader` component with collapse/expand, and wiring the junk filter.

**Primary recommendation:** Build the data layer first (pure functions + hook), then swap the SessionList rendering to consume the new hook's `ProjectGroup[]` output. Keep existing `SessionItem`, `DateGroupHeader`, and `SessionContextMenu` components unchanged -- they already work well.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SESS-04 | Sidebar groups sessions by project with collapsible project headings showing session count | Backend `GET /api/projects` returns all projects with session counts. New `useMultiProjectSessions` hook + `ProjectHeader` component with expand/collapse toggle. |
| SESS-05 | Date subgroups within each project group (Today, Yesterday, This Week, This Month, Older) | Extend existing `groupSessionsByDate` from 4 to 5 buckets. Reuse `DateGroupHeader` component. Pure function change + tests. |
| SESS-06 | Junk sessions filtered from sidebar (notification classifier, system utility, blank) | `BackendSessionData.messageCount` enables zero-message detection. `summary` field enables title-based heuristics. Pure `isJunkSession()` filter function. |
</phase_requirements>

## Standard Stack

### Core (already in project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19 | Component rendering | Project standard |
| Zustand | 5 | State management | 5-store architecture established |
| Vitest | latest | Testing | Project standard with jsdom |
| TypeScript | strict | Type safety | Project standard |

### Supporting (already in project)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | latest | Icons (ChevronDown/Right for collapse) | Project header expand/collapse indicator |
| tailwindcss | v4 | Styling | All component styling |

### No New Dependencies
This phase requires zero new packages. Everything is achievable with existing tools.

## Architecture Patterns

### Current Sidebar Structure
```
Sidebar.tsx
  -> NewChatButton
  -> SessionList.tsx (reads timeline store, groups by date)
       -> DateGroupHeader (sticky date label)
       -> SessionItem (session row with title, time, provider)
  -> QuickSettingsPanel
```

### Target Sidebar Structure
```
Sidebar.tsx
  -> NewChatButton
  -> SessionList.tsx (refactored to use useMultiProjectSessions)
       -> ProjectHeader (collapsible, shows project name + count)
       -> DateGroupHeader (unchanged, nested under project)
       -> SessionItem (unchanged, nested under date group)
  -> QuickSettingsPanel
```

### Recommended File Structure
```
src/src/
  types/session.ts              # Add ProjectGroup, SessionDateGroup types
  lib/
    sessionGrouping.ts          # NEW: groupSessionsByProject, isJunkSession
    sessionGrouping.test.ts     # NEW: pure function tests
    formatTime.ts               # MODIFY: 4 buckets -> 5 buckets
    formatTime.test.ts          # MODIFY: cover new buckets
  hooks/
    useMultiProjectSessions.ts  # NEW: multi-project fetch + grouping hook
    useMultiProjectSessions.test.ts # NEW: hook tests
  components/sidebar/
    ProjectHeader.tsx           # NEW: collapsible project heading
    SessionList.tsx             # MODIFY: consume useMultiProjectSessions
    SessionList.test.tsx        # MODIFY: update for multi-project rendering
```

### Pattern 1: Pure Grouping Functions (Data Layer)
**What:** All grouping, filtering, and sorting logic lives in pure functions, separate from React.
**When to use:** Always -- keeps logic testable without rendering overhead.
**Example:**
```typescript
// sessionGrouping.ts
export function isJunkSession(session: Session & { messageCount?: number }): boolean {
  // Zero messages = junk
  if (session.messageCount !== undefined && session.messageCount === 0) return true;
  // Default title with no content
  if ((session.title === 'New Session' || session.title === 'New Chat') && !session.messages.length) return true;
  // Notification/classifier patterns
  if (/^(notification|classifier)/i.test(session.title)) return true;
  return false;
}

export function groupSessionsByProject(
  projects: Array<{ projectName: string; displayName: string; projectPath: string; sessions: Session[] }>
): ProjectGroup[] {
  // Filter junk, group by date within each project, sort projects alphabetically
}
```

### Pattern 2: Collapsible Section with Scroll Preservation
**What:** Expanding/collapsing a project group must NOT reset scroll position.
**When to use:** Project header toggle.
**Why it matters:** Success criteria #1 explicitly requires "expanding/collapsing preserves scroll position."
**Implementation:** Use CSS `display: none` / `display: block` (not conditional rendering) to hide collapsed content. This preserves DOM position and avoids scroll jumps. Alternatively, since the list re-renders with new data shape, use `scrollTop` save/restore around state changes.
```typescript
// In SessionList, when toggling:
const scrollRef = useRef<HTMLDivElement>(null);
const handleToggle = (projectName: string) => {
  const scrollTop = scrollRef.current?.scrollTop ?? 0;
  toggleProject(projectName);
  // React batches state updates, so restore in rAF
  requestAnimationFrame(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollTop;
  });
};
```

### Pattern 3: localStorage Persistence for UI State
**What:** Expanded/collapsed project state persists across page reloads.
**When to use:** The `expandedProjects` Set in useMultiProjectSessions.
**Example:**
```typescript
const STORAGE_KEY = 'loom-expanded-projects';
const [expandedProjects, setExpandedProjects] = useState<Set<string>>(() => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch { return new Set(); }
});
// Sync to localStorage on change
useEffect(() => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...expandedProjects]));
}, [expandedProjects]);
```

### Anti-Patterns to Avoid
- **Subscribing to store per-item:** SessionItem receives data as props, NOT via store selectors. This is already correct and must stay that way.
- **Conditional rendering for collapse:** Don't unmount collapsed sections -- use CSS display toggle or height animation. Unmounting causes scroll jumps and loses internal state.
- **Fetching all sessions on every render:** Fetch once on mount + on `loom:projects-updated` event. Use refs for stable event listener callbacks (established pattern in useSessionList).
- **Putting multi-project data in timeline store:** The timeline store holds the ACTIVE project's sessions for message display. Multi-project grouping is sidebar-only UI state -- keep it in the hook.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Date grouping logic | New date library | Extend existing `groupSessionsByDate` in `formatTime.ts` | Already working, just needs 2 more buckets |
| Session type extensions | New session model | Add optional fields to existing `Session`/`SessionMetadata` | Non-breaking additions, existing consumers unaffected |
| Collapsible sections | Custom accordion | Simple state toggle + CSS | shadcn Accordion is overkill for 2-3 project groups |
| Scroll position management | Scroll library | `scrollTop` save/restore in rAF | Simple DOM property, no library needed |

## Common Pitfalls

### Pitfall 1: Timeline Store Conflict
**What goes wrong:** Putting multi-project session data into the timeline store breaks existing single-project message loading.
**Why it happens:** The timeline store is designed for the ACTIVE session's messages. Adding sessions from other projects would cause wrong sessions to appear in ChatView.
**How to avoid:** `useMultiProjectSessions` maintains its own state via useState. It does NOT write to the timeline store. When a session from another project is clicked, navigate to the URL and let the existing session-switch flow handle it.
**Warning signs:** If you see `useTimelineStore` imports in `useMultiProjectSessions`, something is wrong.

### Pitfall 2: N+1 Fetch Problem
**What goes wrong:** Fetching full session lists for ALL projects on mount causes slow initial load with many projects.
**Why it happens:** Backend returns only first 5 sessions per project in `GET /api/projects`. Fetching all remaining sessions for all projects is wasteful.
**How to avoid:** Only fetch full session lists for EXPANDED projects. Collapsed projects display just the header with `sessionMeta.total` count. Lazy-fetch when user expands a project.
**Warning signs:** Multiple parallel session fetches on page load.

### Pitfall 3: Scroll Position Jump on Collapse Toggle
**What goes wrong:** Collapsing a project above the viewport causes the visible content to jump.
**Why it happens:** Removing DOM elements above the scroll position changes scrollHeight without adjusting scrollTop.
**How to avoid:** Save `scrollTop` before toggle, restore after React re-renders via `requestAnimationFrame`.
**Warning signs:** Content visibly jumps when toggling project sections.

### Pitfall 4: Junk Session False Positives
**What goes wrong:** Legitimate sessions get filtered as "junk" because their title matches a pattern too broadly.
**Why it happens:** Overly aggressive regex matching (e.g., filtering any session with "New" in the title).
**How to avoid:** Be specific: `messageCount === 0` is the strongest signal. Title-based heuristics should be narrow (exact match "New Session"/"New Chat" with no content, or explicit "notification-classifier" prefix).
**Warning signs:** Users reporting missing sessions from the sidebar.

### Pitfall 5: Cross-Project Session Click Navigation
**What goes wrong:** Clicking a session from a different project doesn't load messages because `useProjectContext` still points to the old project.
**Why it happens:** `useProjectContext` is a singleton -- resolved once, never changes.
**How to avoid:** For MVP, clicking cross-project sessions should either (a) only be possible within the current project, or (b) update the project context. Since this is a multi-project sidebar, approach (b) is needed but complex. **Recommendation for Plan 02:** Initially, only the current project starts expanded by default. Clicking a session from another project triggers a project switch + navigation. This is a non-trivial interaction that needs careful planning.

### Pitfall 6: BackendSessionData vs Frontend Session Type Mismatch
**What goes wrong:** `BackendSessionData` has `messageCount` and `summary` but frontend `Session` type doesn't have `messageCount`.
**Why it happens:** `transformBackendSession` drops `messageCount` during transformation.
**How to avoid:** Either: (a) add `messageCount` to `SessionMetadata` (non-breaking), or (b) run junk filtering BEFORE `transformBackendSession` while we still have the raw backend data. Option (b) is simpler and cleaner.

## Code Examples

### Backend API Response Shape (from server/projects.js)
```typescript
// GET /api/projects returns:
interface ProjectResponse {
  name: string;           // e.g., "-home-swd-loom"
  path: string;           // e.g., "/home/swd/loom"
  displayName: string;    // e.g., "loom"
  fullPath: string;       // same as path
  isCustomName: boolean;
  sessions: BackendSessionData[];  // first 5
  sessionMeta: { hasMore: boolean; total: number };
}

// GET /api/projects/:name/sessions?limit=999 returns:
interface SessionsResponse {
  sessions: BackendSessionData[];
  total: number;
  hasMore: boolean;
}

// BackendSessionData (from transformMessages.ts):
interface BackendSessionData {
  id: string;
  summary: string;        // Used as session title; "New Session" for empty
  messageCount: number;   // Key field for junk detection
  lastActivity: string;   // ISO timestamp
  cwd: string;
  lastUserMessage?: string;
  lastAssistantMessage?: string;
}
```

### Existing groupSessionsByDate Pattern (from formatTime.ts)
```typescript
// Current: 4 buckets using midnight boundaries
// Target: 5 buckets -- add "This Week" (2-7 days) and "This Month" (8-30 days)
// "Previous 7 Days" renamed to "This Week"
export type SessionDateGroup = 'Today' | 'Yesterday' | 'This Week' | 'This Month' | 'Older';
```

### Existing Event Pattern (from useSessionList.ts)
```typescript
// Listen for backend-triggered session updates
window.addEventListener('loom:projects-updated', handleProjectsUpdated);
// Stable callback via ref pattern to avoid closure staling
```

### ProjectHeader Component Shape
```typescript
interface ProjectHeaderProps {
  displayName: string;
  sessionCount: number;
  isExpanded: boolean;
  onToggle: () => void;
}

export function ProjectHeader({ displayName, sessionCount, isExpanded, onToggle }: ProjectHeaderProps) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'w-full flex items-center gap-2 px-3 py-2',
        'text-[length:var(--text-body)] font-medium text-foreground',
        'hover:bg-[color-mix(in_oklch,var(--text-muted)_5%,var(--surface-raised))]',
      )}
      aria-expanded={isExpanded}
    >
      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      <span className="truncate flex-1 text-left">{displayName}</span>
      <span className="text-[length:0.75rem] text-muted">{sessionCount}</span>
    </button>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single project, flat date list | Multi-project hierarchy (this phase) | Phase 41 | Sidebar becomes navigable for users with multiple projects |
| 4 date buckets | 5 date buckets (add This Week, This Month) | Phase 41 | Better granularity for sessions 2-30 days old |
| No junk filtering | Filter zero-message and system sessions | Phase 41 | Cleaner sidebar, only meaningful sessions shown |

## Open Questions

1. **Cross-project session click behavior**
   - What we know: `useProjectContext` is a singleton that resolves once. Sessions from other projects need a different project context to load messages.
   - What's unclear: Should clicking a session from another project trigger a full project switch? Or should the sidebar only show sessions from other projects as read-only info?
   - Recommendation: For Plan 02, start with current-project sessions fully interactive, other projects show name + count in collapsed state. Expanding shows session list but clicking navigates to the project (full reload or context switch). This can be refined later.

2. **Session count in header: total or visible?**
   - What we know: Plan 01 defines both `sessionCount` (total including junk) and `visibleCount` (after filtering).
   - What's unclear: Which count to show in the project header?
   - Recommendation: Show `visibleCount` -- users care about how many meaningful sessions they have, not how many junk entries the backend tracked.

3. **Existing SessionList consumers**
   - What we know: `Sidebar.tsx` imports `SessionList` directly. No other consumers.
   - What's unclear: Whether `SessionList` should be split or refactored in place.
   - Recommendation: Refactor in place. The component stays at ~200 lines (Constitution 2.4) by extracting `ProjectHeader` as a separate component.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest + jsdom |
| Config file | src/vite.config.ts (vitest section) |
| Quick run command | `cd /home/swd/loom/src && npx vitest run src/src/lib/sessionGrouping.test.ts --reporter=verbose` |
| Full suite command | `cd /home/swd/loom/src && npx vitest run --reporter=verbose` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SESS-04 | Sessions grouped by project with collapsible headings | unit | `cd /home/swd/loom/src && npx vitest run src/src/lib/sessionGrouping.test.ts -x` | Wave 0 |
| SESS-04 | ProjectHeader renders with count and toggle | unit | `cd /home/swd/loom/src && npx vitest run src/src/components/sidebar/SessionList.test.tsx -x` | Existing, needs update |
| SESS-05 | Date subgroups use 5 buckets | unit | `cd /home/swd/loom/src && npx vitest run src/src/lib/formatTime.test.ts -x` | Existing, needs update |
| SESS-06 | Junk sessions filtered | unit | `cd /home/swd/loom/src && npx vitest run src/src/lib/sessionGrouping.test.ts -x` | Wave 0 |
| SESS-06 | Hook excludes junk from output | unit | `cd /home/swd/loom/src && npx vitest run src/src/hooks/useMultiProjectSessions.test.ts -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `cd /home/swd/loom/src && npx vitest run src/src/lib/sessionGrouping.test.ts src/src/lib/formatTime.test.ts --reporter=verbose`
- **Per wave merge:** `cd /home/swd/loom/src && npx vitest run --reporter=verbose`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/src/lib/sessionGrouping.test.ts` -- covers SESS-04, SESS-06 (pure grouping + junk filter)
- [ ] `src/src/hooks/useMultiProjectSessions.test.ts` -- covers SESS-04 (hook integration)
- [ ] Update `src/src/lib/formatTime.test.ts` -- covers SESS-05 (5-bucket date grouping)

## Sources

### Primary (HIGH confidence)
- **Codebase analysis:** Direct file reads of SessionList.tsx, SessionItem.tsx, DateGroupHeader.tsx, Sidebar.tsx, formatTime.ts, useSessionList.ts, useProjectContext.ts, transformMessages.ts, timeline store, session types, sidebar CSS
- **Backend API:** server/index.js (GET /api/projects, GET /api/projects/:name/sessions), server/projects.js (getProjects function returning full project shape with sessionMeta)
- **Existing Plan 01:** .planning/phases/41-session-organization/41-01-PLAN.md (data layer already designed)
- **Phase 40 Summary:** extract-session-title utility delivered, SESS-01/02/03 complete

### Secondary (MEDIUM confidence)
- Scroll position preservation via rAF -- standard React pattern, widely documented

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new dependencies, all existing tools
- Architecture: HIGH - extending well-understood existing patterns (date grouping, event-driven refetch, component composition)
- Pitfalls: HIGH - identified from direct codebase analysis (timeline store singleton, useProjectContext singleton, BackendSessionData shape)

**Research date:** 2026-03-18
**Valid until:** 2026-04-17 (stable -- internal codebase, no external API changes expected)
