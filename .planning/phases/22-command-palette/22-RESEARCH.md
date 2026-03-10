# Phase 22: Command Palette - Research

**Researched:** 2026-03-10
**Domain:** Command palette UI, fuzzy search, keyboard navigation
**Confidence:** HIGH

## Summary

Phase 22 implements a Cmd+K command palette using `cmdk` (the de facto React command palette library by Pacocoursey) with `fuse.js` for fuzzy search on sessions and files. Both were already identified as planned M3 dependencies but are not yet installed.

The codebase is well-prepared for this phase. The UI store already has `commandPaletteOpen` boolean and `toggleCommandPalette()` action. The Dialog/portal pattern from SettingsModal provides the z-index and overlay blueprint. The keyboard shortcut pattern from `useTabKeyboardShortcuts` shows how to wire Cmd+K globally. Session data lives in the timeline store. The backend has APIs for file tree listing (`GET /api/projects/:projectName/files`), project listing (`GET /api/projects`), and slash command listing (`POST /api/commands/list`).

**Primary recommendation:** Use cmdk's `Command.Dialog` component (which wraps Radix Dialog internally) rendered as a standalone portal at z-critical (9999) so it layers above the Settings modal (z-modal: 50). Use fuse.js for session and file fuzzy search with `shouldFilter={false}` on cmdk (disabling its built-in filter) so we control ranking ourselves. Wire Cmd+K via a dedicated `useCommandPaletteShortcut` hook following the same pattern as `useTabKeyboardShortcuts`.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CMD-01 | Cmd+K (Mac) / Ctrl+K (Linux/Windows) opens command palette with backdrop blur | cmdk `Command.Dialog` with `open`/`onOpenChange` props + global keydown handler |
| CMD-02 | Palette renders as portal above all content, including Settings modal | Portal with z-critical (9999) -- above z-modal (50) used by Settings |
| CMD-03 | Search input auto-focused with placeholder text | cmdk `Command.Input` auto-focuses by default |
| CMD-04 | Escape key or clicking backdrop closes palette | cmdk `Command.Dialog` handles Escape natively; overlay click via `onOpenChange` |
| CMD-05 | Commands grouped into sections with headers | cmdk `Command.Group` with `heading` prop |
| CMD-06 | Navigation group with tab switching commands + keyboard hints | Static Command.Item entries with onSelect calling `setActiveTab()` |
| CMD-07 | Sessions fuzzy search by title, sorted by recency | fuse.js searching timeline store sessions with `shouldFilter={false}` |
| CMD-08 | Selecting session switches to Chat tab and navigates | onSelect: `setActiveTab('chat')` + `navigate(/chat/${sessionId})` |
| CMD-09 | Actions group: New Session, Toggle Thinking, Toggle Sidebar | Static Command.Item entries calling existing store actions |
| CMD-10 | File search by path/name, selecting opens in editor (Files tab) | fuse.js on `GET /api/projects/:projectName/files` response |
| CMD-11 | Slash commands listed and executable from palette | Fetch `POST /api/commands/list`, render as Command.Items |
| CMD-12 | Arrow key navigation, Enter selects, keyboard shortcut hints | cmdk handles arrow/Enter natively; render `<Kbd>` component for hints |
| CMD-13 | Empty state shows "No results found" | cmdk `Command.Empty` component |
| CMD-14 | Recent/frequent commands at top when search is empty | localStorage-based recency tracking, rendered as default group |
| CMD-15 | Project switching group lists available projects | Fetch `GET /api/projects`, render as Command.Group |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| cmdk | ^1.0.0 | Command palette component | De facto React command palette. Used by Vercel, shadcn, Linear. Wraps Radix Dialog. Unstyled, accessible, handles keyboard nav. |
| fuse.js | ^7.1.0 | Fuzzy search engine | Lightweight (~5KB gzip), zero deps, client-side fuzzy matching with configurable thresholds. Industry standard. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| radix-ui | already installed | Dialog primitive underlying cmdk | cmdk composes Radix Dialog internally -- no extra install |
| lucide-react | already installed | Icons for command items | Search icon, navigation icons, action icons |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| cmdk | kbar | kbar is heavier, more opinionated styling. cmdk is lighter, aligns with existing Radix ecosystem |
| fuse.js | @leeoniya/ufuzzy | ufuzzy is faster but less mature. fuse.js has wider adoption and better TypeScript support |
| fuse.js | cmdk built-in filter | cmdk's built-in filter is substring-based, not true fuzzy. Won't match "settings" from "stgs" |

**Installation:**
```bash
cd /home/swd/loom/src && npm install cmdk fuse.js
```

## Architecture Patterns

### Recommended Project Structure
```
src/src/
  components/
    command-palette/
      CommandPalette.tsx          # Main component wrapping Command.Dialog
      CommandPaletteItem.tsx      # Styled item with icon + shortcut hint
      groups/
        NavigationGroup.tsx       # Tab switching commands (Chat, Files, Shell, Git, Settings)
        SessionGroup.tsx          # Fuzzy-searched session list
        FileGroup.tsx             # Fuzzy-searched file list
        ActionGroup.tsx           # New Session, Toggle Thinking, Toggle Sidebar
        CommandGroup.tsx          # Slash commands from backend
        ProjectGroup.tsx          # Project switching
        RecentGroup.tsx           # Recent/frequent commands (empty-state default)
      hooks/
        useCommandPaletteShortcut.ts  # Global Cmd+K keydown handler
        useCommandSearch.ts           # Orchestrates fuse.js across multiple sources
        useRecentCommands.ts          # localStorage-based recency tracking
      command-palette.css         # Minimal CSS for cmdk styling with design tokens
  hooks/
    (existing hooks untouched)
```

### Pattern 1: cmdk with External Fuzzy Search (fuse.js)
**What:** Disable cmdk's built-in filter (`shouldFilter={false}`) and use fuse.js to search across multiple data sources (sessions, files, commands), then render results as cmdk groups.
**When to use:** When you need fuzzy matching across heterogeneous data sources with different search keys.
**Example:**
```typescript
// Source: cmdk docs + fuse.js docs
import { Command } from 'cmdk';
import Fuse from 'fuse.js';

const fuse = new Fuse(sessions, {
  keys: ['title'],
  threshold: 0.4,
  includeScore: true,
});

function CommandPalette() {
  const [search, setSearch] = useState('');
  const results = search ? fuse.search(search) : [];

  return (
    <Command shouldFilter={false}>
      <Command.Input value={search} onValueChange={setSearch} />
      <Command.List>
        <Command.Empty>No results found</Command.Empty>
        <Command.Group heading="Sessions">
          {results.map(({ item }) => (
            <Command.Item key={item.id} onSelect={() => selectSession(item.id)}>
              {item.title}
            </Command.Item>
          ))}
        </Command.Group>
      </Command.List>
    </Command>
  );
}
```

### Pattern 2: Z-Index Layering for Command Palette
**What:** Command palette must render ABOVE the Settings modal. Settings uses z-modal (50). Command palette uses z-critical (9999).
**When to use:** Any overlay that must appear above all other modals.
**Example:**
```typescript
// cmdk's Command.Dialog accepts a container prop for portal target
// But simpler: use CSS to override z-index on the cmdk dialog
<Command.Dialog
  open={open}
  onOpenChange={setOpen}
  className="command-palette-dialog"
>
```
```css
/* command-palette.css */
[cmdk-dialog] {
  z-index: var(--z-critical);
}
[cmdk-overlay] {
  z-index: var(--z-critical);
  backdrop-filter: blur(var(--glass-blur));
}
```

### Pattern 3: Keyboard Shortcut Hook (Cmd+K)
**What:** Global keydown listener that toggles command palette, following the established pattern.
**When to use:** Global keyboard shortcuts outside React component scope.
**Example:**
```typescript
// Following useTabKeyboardShortcuts pattern
export function useCommandPaletteShortcut(): void {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.code === 'KeyK') {
        e.preventDefault();
        // eslint-disable-next-line loom/no-external-store-mutation
        useUIStore.getState().toggleCommandPalette();
      }
    }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);
}
```

### Pattern 4: Recent Commands via localStorage
**What:** Track command executions with timestamps in localStorage. On empty search, show most recent items.
**When to use:** CMD-14 requires recent/frequent commands at top when search is empty.
**Example:**
```typescript
const RECENT_KEY = 'loom-recent-commands';
const MAX_RECENT = 10;

interface RecentEntry {
  id: string;
  label: string;
  group: string;
  timestamp: number;
}

function addRecent(entry: Omit<RecentEntry, 'timestamp'>) {
  const stored = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]') as RecentEntry[];
  const filtered = stored.filter(e => e.id !== entry.id);
  filtered.unshift({ ...entry, timestamp: Date.now() });
  localStorage.setItem(RECENT_KEY, JSON.stringify(filtered.slice(0, MAX_RECENT)));
}
```

### Anti-Patterns to Avoid
- **Re-implementing keyboard navigation:** cmdk handles arrow keys, Enter, and Escape natively. Do NOT add custom keydown listeners for navigation within the palette.
- **Using cmdk's built-in filter for fuzzy search:** It's substring-based, not fuzzy. Use `shouldFilter={false}` + fuse.js for proper fuzzy matching.
- **Mounting cmdk inside Settings modal:** The command palette must be a sibling portal, NOT nested inside another dialog. Nested Radix dialogs cause focus trap conflicts.
- **Fetching files on every keystroke:** Debounce file search or fetch the file tree once on palette open and search locally.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Command palette UI | Custom modal + list + keyboard nav | cmdk `Command.Dialog` | Handles accessibility, keyboard nav, focus management, scroll-into-view. 100s of edge cases. |
| Fuzzy search | Custom string matching | fuse.js | Proper fuzzy matching with scoring, threshold tuning, multi-key search. Levenshtein distance + bitap algorithm. |
| Dialog/portal management | Custom portal + backdrop | cmdk's built-in Radix Dialog | Already handles overlay, Escape to close, focus trap, portal rendering. |
| Keyboard shortcut hints | Custom component | Existing `<Kbd>` component | Already in `src/src/components/ui/kbd.tsx` with design token styling |

**Key insight:** cmdk handles ~80% of the command palette requirements out of the box (dialog, input, list, groups, empty state, keyboard nav, Escape handling). The main implementation work is data sourcing (sessions, files, commands from APIs/stores) and styling with design tokens.

## Common Pitfalls

### Pitfall 1: cmdk Dialog Z-Index Under Settings Modal
**What goes wrong:** Command palette appears behind Settings modal because both use Radix Dialog portals.
**Why it happens:** Default Radix Dialog portals append to document.body in render order. The one rendered first is below.
**How to avoid:** Apply z-critical (9999) via CSS attribute selector `[cmdk-dialog]` and `[cmdk-overlay]`. This is above z-modal (50) used by Settings.
**Warning signs:** Cmd+K while Settings is open and nothing visually appears.

### Pitfall 2: Focus Trap Conflict with Settings Modal
**What goes wrong:** Radix Dialog's focus trap in Settings prevents interaction with the command palette dialog.
**Why it happens:** Two Radix Dialogs open simultaneously fight over focus.
**How to avoid:** When command palette opens, close the Settings modal first (or use cmdk's `container` prop to render inside a separate portal). Alternatively, since cmdk Dialog uses its own Radix Dialog instance, the newer dialog should naturally steal focus.
**Warning signs:** Cannot type in command palette input when Settings is open.

### Pitfall 3: Stale Session Data in Search
**What goes wrong:** Sessions created after the palette was last opened don't appear in search results.
**Why it happens:** Fuse.js index is created once and not updated.
**How to avoid:** Recreate the Fuse instance (or update its collection) each time the palette opens, using `useMemo` keyed on `sessions` array reference.
**Warning signs:** Newly created sessions not appearing in palette search.

### Pitfall 4: File Search Performance
**What goes wrong:** Large projects (10k+ files) cause lag when searching files.
**Why it happens:** Fetching full file tree and running fuse.js on every keystroke.
**How to avoid:** Fetch file tree once on palette open, debounce search input (150-200ms), and limit fuse.js results with `{ limit: 20 }`.
**Warning signs:** Noticeable delay between typing and results appearing.

### Pitfall 5: Cmd+K Intercepted by Browser/OS
**What goes wrong:** Cmd+K may be intercepted by browser (e.g., Chrome's address bar focus on some platforms).
**Why it happens:** Browser-level shortcuts take precedence.
**How to avoid:** Call `e.preventDefault()` in the capture phase if needed, though in practice Cmd+K is NOT a standard browser shortcut (Cmd+L is address bar). Should work fine.
**Warning signs:** Nothing happens on Cmd+K in certain browsers.

### Pitfall 6: Styling cmdk with Tailwind v4
**What goes wrong:** cmdk uses data attributes for styling (`[cmdk-item]`, `[data-selected]`), which need CSS attribute selectors.
**Why it happens:** cmdk is unstyled by default -- all visual styling must be provided.
**How to avoid:** Use a dedicated `command-palette.css` file with attribute selectors targeting cmdk's data attributes. Map all colors to design tokens. Do NOT use Tailwind `@apply` on attribute selectors (fragile). Use plain CSS with token custom properties.
**Warning signs:** Palette renders as unstyled list of text.

## Code Examples

### cmdk Dialog with External Fuzzy Search
```typescript
// CommandPalette.tsx -- main component
import { Command } from 'cmdk';
import { useUIStore } from '@/stores/ui';
import { useTimelineStore } from '@/stores/timeline';

export function CommandPalette() {
  const open = useUIStore((s) => s.commandPaletteOpen);
  const toggle = useUIStore((s) => s.toggleCommandPalette);
  const sessions = useTimelineStore((s) => s.sessions);

  return (
    <Command.Dialog
      open={open}
      onOpenChange={(v) => { if (!v) toggle(); }}
      shouldFilter={false}
      label="Command Palette"
    >
      <Command.Input placeholder="Type a command or search..." />
      <Command.List>
        <Command.Empty>No results found</Command.Empty>
        {/* Groups rendered here */}
      </Command.List>
    </Command.Dialog>
  );
}
```

### fuse.js Session Search
```typescript
import Fuse from 'fuse.js';
import type { Session } from '@/types/session';

const sessionFuse = new Fuse<Session>([], {
  keys: ['title'],
  threshold: 0.4,        // 0 = exact, 1 = match anything
  includeScore: true,
  sortFn: (a, b) => {
    // Primary: fuse score (lower is better)
    // Secondary: recency (newer first)
    if (a.score !== b.score) return (a.score ?? 1) - (b.score ?? 1);
    return 0; // handled by pre-sorting input
  },
});

// Update collection when sessions change
sessionFuse.setCollection(sessions);

// Search
const results = sessionFuse.search(query, { limit: 10 });
```

### Slash Command Fetching
```typescript
// Backend API: POST /api/commands/list
interface SlashCommand {
  name: string;         // e.g. '/help', '/compact'
  description: string;
  namespace: 'builtin' | 'project' | 'user';
}

async function fetchSlashCommands(): Promise<SlashCommand[]> {
  const data = await apiFetch<{ builtIn: SlashCommand[]; custom: SlashCommand[]; count: number }>(
    '/api/commands/list',
    { method: 'POST', body: JSON.stringify({}) },
  );
  return [...data.builtIn, ...data.custom];
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom modal + manual keyboard handling | cmdk library | 2022+ | Eliminates 500+ lines of custom code for a11y, focus management, scroll |
| Substring matching | Fuzzy search (fuse.js) | Standard | Users expect fuzzy matching -- "stgs" should find "Settings" |
| Single search scope | Multi-source search (sessions + files + commands) | Modern pattern | Slack, VS Code, Linear all search across multiple data types |

## Open Questions

1. **File tree API response shape**
   - What we know: `GET /api/projects/:projectName/files` exists and returns file tree
   - What's unclear: Exact response shape (flat list vs nested tree? field names?)
   - Recommendation: Inspect the actual API response during implementation. The file search only needs `path` and `name` fields from each entry.

2. **Slash command execution feedback**
   - What we know: `POST /api/commands/execute` returns different shapes for built-in vs custom commands
   - What's unclear: How should execution results display? Toast? Inline?
   - Recommendation: Show results as toast notification (sonner already installed). Custom commands with content could show in a temporary panel.

3. **Cmd+K while Settings modal is open -- close Settings or overlay it?**
   - What we know: CMD-02 says palette must render above Settings. Both use Radix Dialog.
   - What's unclear: UX preference -- close Settings first, or truly layer above?
   - Recommendation: Layer above using z-critical. When command palette closes, Settings remains open underneath. If focus trap conflicts arise, close Settings on palette open as fallback.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.x + @testing-library/react 16.x |
| Config file | `src/vite.config.ts` (vitest config section) |
| Quick run command | `cd /home/swd/loom/src && npx vitest run --reporter=verbose` |
| Full suite command | `cd /home/swd/loom/src && npx vitest run --coverage` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CMD-01 | Cmd+K opens palette | unit | `cd /home/swd/loom/src && npx vitest run src/components/command-palette/hooks/useCommandPaletteShortcut.test.ts -x` | Wave 0 |
| CMD-02 | Portal above all content | unit | `cd /home/swd/loom/src && npx vitest run src/components/command-palette/CommandPalette.test.tsx -x` | Wave 0 |
| CMD-03 | Auto-focused input | unit | Same as CMD-02 | Wave 0 |
| CMD-04 | Escape/backdrop closes | unit | Same as CMD-02 (cmdk handles natively, verify via test) | Wave 0 |
| CMD-05 | Grouped sections | unit | Same as CMD-02 | Wave 0 |
| CMD-06 | Navigation group items | unit | `cd /home/swd/loom/src && npx vitest run src/components/command-palette/groups/NavigationGroup.test.tsx -x` | Wave 0 |
| CMD-07 | Session fuzzy search | unit | `cd /home/swd/loom/src && npx vitest run src/components/command-palette/hooks/useCommandSearch.test.ts -x` | Wave 0 |
| CMD-08 | Session select navigates | unit | Same as CMD-07 (integration in CommandPalette test) | Wave 0 |
| CMD-09 | Action group items | unit | `cd /home/swd/loom/src && npx vitest run src/components/command-palette/groups/ActionGroup.test.tsx -x` | Wave 0 |
| CMD-10 | File fuzzy search | unit | Same as CMD-07 | Wave 0 |
| CMD-11 | Slash commands listed | unit | `cd /home/swd/loom/src && npx vitest run src/components/command-palette/groups/CommandGroup.test.tsx -x` | Wave 0 |
| CMD-12 | Arrow/Enter navigation + hints | unit | Same as CMD-02 (cmdk native, verify selected state) | Wave 0 |
| CMD-13 | Empty state | unit | Same as CMD-02 | Wave 0 |
| CMD-14 | Recent commands on empty | unit | `cd /home/swd/loom/src && npx vitest run src/components/command-palette/hooks/useRecentCommands.test.ts -x` | Wave 0 |
| CMD-15 | Project switching | unit | `cd /home/swd/loom/src && npx vitest run src/components/command-palette/groups/ProjectGroup.test.tsx -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `cd /home/swd/loom/src && npx vitest run --reporter=verbose`
- **Per wave merge:** `cd /home/swd/loom/src && npx vitest run --coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/src/components/command-palette/CommandPalette.test.tsx` -- covers CMD-02, CMD-03, CMD-04, CMD-05, CMD-12, CMD-13
- [ ] `src/src/components/command-palette/hooks/useCommandPaletteShortcut.test.ts` -- covers CMD-01
- [ ] `src/src/components/command-palette/hooks/useCommandSearch.test.ts` -- covers CMD-07, CMD-08, CMD-10
- [ ] `src/src/components/command-palette/hooks/useRecentCommands.test.ts` -- covers CMD-14
- [ ] `src/src/components/command-palette/groups/NavigationGroup.test.tsx` -- covers CMD-06
- [ ] `src/src/components/command-palette/groups/ActionGroup.test.tsx` -- covers CMD-09
- [ ] `src/src/components/command-palette/groups/CommandGroup.test.tsx` -- covers CMD-11
- [ ] `src/src/components/command-palette/groups/ProjectGroup.test.tsx` -- covers CMD-15
- [ ] Install cmdk and fuse.js: `cd /home/swd/loom/src && npm install cmdk fuse.js`

## Sources

### Primary (HIGH confidence)
- cmdk GitHub (https://github.com/dip/cmdk) -- API docs, component props, filtering, Command.Dialog
- fuse.js official site (https://www.fusejs.io/) -- API reference, configuration options
- Codebase: `src/src/stores/ui.ts` -- commandPaletteOpen and toggleCommandPalette already exist
- Codebase: `src/src/components/content-area/hooks/useTabKeyboardShortcuts.ts` -- keyboard shortcut pattern
- Codebase: `src/src/components/ui/dialog.tsx` -- Radix Dialog portal/z-index pattern
- Codebase: `src/src/styles/tokens.css` -- z-index dictionary (z-modal: 50, z-critical: 9999)

### Secondary (MEDIUM confidence)
- Backend API contract: `/api/commands/list`, `/api/projects/:projectName/files`, `/api/projects`
- npm: cmdk v1.0.0, fuse.js v7.1.0

### Tertiary (LOW confidence)
- File tree API response shape -- documented endpoint exists but exact response fields not specified in contract

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- cmdk and fuse.js are well-established, already planned for M3
- Architecture: HIGH -- all integration points (UI store, timeline store, APIs) verified in codebase
- Pitfalls: HIGH -- z-index conflicts, focus traps, and performance concerns are well-understood from similar implementations

**Research date:** 2026-03-10
**Valid until:** 2026-04-10 (stable libraries, unlikely to change)
