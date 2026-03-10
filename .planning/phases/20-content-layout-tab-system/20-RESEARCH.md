# Phase 20: Content Layout + Tab System - Research

**Researched:** 2026-03-10
**Domain:** React layout architecture, CSS show/hide panel management, Zustand store design
**Confidence:** HIGH

## Summary

Phase 20 transforms Loom from a single-view chat app into a multi-panel workspace. The core challenge is straightforward: mount all four panels (Chat, Files, Shell, Git) simultaneously and toggle visibility via CSS `display: none` / `display: block` (or similar), driven by an `activeTab` state in the UI store. This is a well-understood pattern used by VS Code, Cursor, and every tabbed IDE.

The implementation touches three concerns: (1) a tab bar component with visual indicators, (2) a content area that always-mounts all panels but shows only the active one, and (3) a 5th Zustand store for file/editor state. The file store is the only genuinely new data architecture -- everything else is wiring existing primitives (PanelErrorBoundary, TabId type, setActiveTab action) into a new layout.

**Primary recommendation:** Replace the React Router `<Outlet />` pattern in AppShell's content column with a `ContentArea` component that renders all four panels simultaneously behind CSS visibility toggles. The tab bar sits above this area. Keep it simple -- no animation, no lazy loading of panels in this phase (Files/Shell/Git panels will be placeholder stubs until their respective phases).

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| LAY-01 | Content area renders horizontal tab bar with Chat, Files, Shell, Git | Tab bar component with TabId-driven rendering, lucide-react icons |
| LAY-02 | Clicking a tab switches the visible panel | setActiveTab action already exists in UI store; panel container toggles CSS display |
| LAY-03 | Tab switching uses CSS display (show/hide), NOT conditional rendering | Mount-once pattern: all panels always in DOM, `hidden` attribute or `display:none` class |
| LAY-04 | Active tab has visual indicator | Bottom border or background highlight using accent token |
| LAY-05 | Keyboard shortcuts Cmd+1/2/3/4 switch tabs | Global keydown listener with metaKey/ctrlKey check, same pattern as existing Cmd+F |
| LAY-06 | Tab bar hidden on mobile (<768px), only Chat visible | Tailwind `hidden md:flex` on tab bar, force activeTab to 'chat' on mobile |
| LAY-07 | New file store (5th Zustand store) | New `stores/file.ts` with file tree state, open tabs, active file, dirty tracking |
| LAY-08 | Each panel wrapped in PanelErrorBoundary | PanelErrorBoundary already exists -- wrap each panel stub |
| LAY-09 | TabId union type extended to 'chat' \| 'files' \| 'shell' \| 'git' | Update `types/ui.ts`, update UI store initial state and test |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | ^19.2.0 | Component rendering | Already installed |
| Zustand | ^5.0.11 | State management (UI store + new file store) | Already installed, project standard |
| react-router-dom | ^7.13.1 | Routing (needs adaptation for tab system) | Already installed |
| lucide-react | ^0.577.0 | Tab bar icons | Already installed |
| tailwindcss | ^4.2.1 | Styling | Already installed |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-error-boundary | ^6.1.1 | Panel crash isolation | Already installed, PanelErrorBoundary exists |
| clsx + tailwind-merge (cn()) | installed | Conditional class composition | All className construction |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CSS `display:none` | CSS `visibility:hidden` + `position:absolute` | visibility:hidden keeps layout space; display:none is cleaner and what the requirement specifies |
| HTML `hidden` attribute | Tailwind `hidden` class | `hidden` attribute is semantic HTML; Tailwind `hidden` maps to `display:none` -- equivalent, either works |
| React Router tabs | Direct Zustand state | React Router adds URL complexity for workspace tabs that don't need URLs. Chat keeps its `/chat/:sessionId` route; other tabs don't need routes. |

**Installation:**
```bash
# No new packages needed for Phase 20
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  components/
    content-area/
      view/
        ContentArea.tsx        # Mount-once container, renders all panels
        TabBar.tsx             # Horizontal tab bar with icons + labels
      hooks/
        useTabKeyboardShortcuts.ts  # Cmd+1/2/3/4 handler
  stores/
    file.ts                    # 5th Zustand store (file tree, editor tabs, dirty tracking)
    file.test.ts               # Store tests
  types/
    ui.ts                      # Updated TabId union
    file.ts                    # File store types (FileNode, EditorTab, etc.)
```

### Pattern 1: CSS Show/Hide (Mount-Once)
**What:** All panels render in the DOM simultaneously. Only the active panel has `display: block`; others have `display: none`.
**When to use:** When panels have expensive internal state that must survive tab switches (terminal sessions, scroll positions, WebSocket connections).
**Example:**
```typescript
// ContentArea.tsx
import { useUIStore } from '@/stores/ui';
import type { TabId } from '@/types/ui';

const TAB_IDS: TabId[] = ['chat', 'files', 'shell', 'git'];

export function ContentArea() {
  const activeTab = useUIStore((state) => state.activeTab);

  return (
    <div className="relative h-full overflow-hidden">
      <TabBar activeTab={activeTab} />
      <div className="h-[calc(100%-var(--tab-bar-height))] relative">
        <div className={activeTab === 'chat' ? 'h-full' : 'hidden'}>
          <PanelErrorBoundary panelName="chat">
            <ChatView />
          </PanelErrorBoundary>
        </div>
        <div className={activeTab === 'files' ? 'h-full' : 'hidden'}>
          <PanelErrorBoundary panelName="files">
            <FilesPlaceholder />
          </PanelErrorBoundary>
        </div>
        {/* ... shell, git */}
      </div>
    </div>
  );
}
```

### Pattern 2: Tab Bar with Active Indicator
**What:** Horizontal tab bar with icon + label for each tab, active tab highlighted with bottom border.
**When to use:** Standard pattern for workspace-style apps.
**Example:**
```typescript
// TabBar.tsx
import { MessageSquare, FolderTree, Terminal, GitBranch } from 'lucide-react';
import { useUIStore } from '@/stores/ui';
import { cn } from '@/utils/cn';
import type { TabId } from '@/types/ui';

interface TabConfig {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut: string;
}

const TABS: TabConfig[] = [
  { id: 'chat', label: 'Chat', icon: MessageSquare, shortcut: '1' },
  { id: 'files', label: 'Files', icon: FolderTree, shortcut: '2' },
  { id: 'shell', label: 'Shell', icon: Terminal, shortcut: '3' },
  { id: 'git', label: 'Git', icon: GitBranch, shortcut: '4' },
];

export function TabBar({ activeTab }: { activeTab: TabId }) {
  const setActiveTab = useUIStore((state) => state.setActiveTab);

  return (
    <nav
      role="tablist"
      aria-label="Workspace panels"
      className={cn(
        'hidden md:flex items-center gap-1 px-2',
        'h-10 border-b border-border/8 bg-surface-base',
      )}
    >
      {TABS.map(({ id, label, icon: Icon, shortcut }) => (
        <button
          key={id}
          role="tab"
          aria-selected={activeTab === id}
          aria-controls={`panel-${id}`}
          onClick={() => setActiveTab(id)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md',
            'transition-colors duration-[var(--transition-fast)]',
            activeTab === id
              ? 'text-foreground bg-surface-raised'
              : 'text-muted hover:text-foreground hover:bg-surface-raised/50',
          )}
        >
          <Icon className="size-4" />
          <span>{label}</span>
          <kbd className="hidden lg:inline-block ml-1 text-[10px] text-muted opacity-60">
            {'\u2318'}{shortcut}
          </kbd>
        </button>
      ))}
    </nav>
  );
}
```

### Pattern 3: Keyboard Shortcut Hook
**What:** Global keydown listener for Cmd+1/2/3/4 tab switching.
**When to use:** Workspace-level keyboard shortcuts.
**Example:**
```typescript
// useTabKeyboardShortcuts.ts
import { useEffect } from 'react';
import { useUIStore } from '@/stores/ui';
import type { TabId } from '@/types/ui';

const KEY_TO_TAB: Record<string, TabId> = {
  '1': 'chat',
  '2': 'files',
  '3': 'shell',
  '4': 'git',
};

export function useTabKeyboardShortcuts() {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey)) return;
      const tab = KEY_TO_TAB[e.key];
      if (tab) {
        e.preventDefault();
        useUIStore.getState().setActiveTab(tab);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
}
```

### Pattern 4: File Store (5th Zustand Store)
**What:** New store managing file tree state, open editor tabs, active file, and dirty file tracking. Skeleton in Phase 20, fully populated in Phase 23/24.
**When to use:** Any component that needs file/editor state.
**Example:**
```typescript
// stores/file.ts
import { create } from 'zustand';

interface FileTab {
  filePath: string;
  isDirty: boolean;
}

interface FileState {
  // File tree
  expandedDirs: Set<string>;
  selectedPath: string | null;

  // Editor tabs
  openTabs: FileTab[];
  activeFilePath: string | null;

  // Actions
  toggleDir: (path: string) => void;
  selectPath: (path: string | null) => void;
  openFile: (path: string) => void;
  closeFile: (path: string) => void;
  setDirty: (path: string, isDirty: boolean) => void;
  setActiveFile: (path: string | null) => void;
  reset: () => void;
}
```

### Pattern 5: Router Adaptation
**What:** Transition from React Router `<Outlet />` to direct panel rendering while keeping `/chat/:sessionId` URL routing.
**When to use:** Phase 20 -- the content column changes from route-based to tab-based.
**Key decisions:**
- Keep BrowserRouter for `/chat/:sessionId` URLs (session deep-linking must survive)
- Remove `/dashboard` and `/settings` routes (Settings becomes a modal in Phase 21, dashboard removed)
- ContentArea replaces `<Outlet />` in AppShell
- ChatView reads `sessionId` from URL params as before -- no change to chat routing
- Tab state lives in Zustand (not URL), so switching to Files/Shell/Git doesn't change the URL

### Anti-Patterns to Avoid
- **Conditional rendering for panels:** `{activeTab === 'chat' && <ChatView />}` destroys state. Use CSS show/hide.
- **URL-based tab routing:** `/files`, `/shell`, `/git` routes would fight with session URLs and add unnecessary complexity.
- **Animating tab transitions:** Not in scope for Phase 20. CSS display toggle is instant. Polish (fade, slide) deferred to M4.
- **Lazy loading panel stubs:** The placeholder panels are tiny. React.lazy adds complexity for no bundle benefit. Real lazy loading happens in Phases 23-25 when actual heavy components load.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Error boundaries | Custom try/catch wrappers | `PanelErrorBoundary` (already exists) | Battle-tested, consistent fallback UI |
| Icon rendering | Custom SVGs for tabs | `lucide-react` icons | Consistent with existing codebase |
| Class composition | String concatenation | `cn()` utility | Constitution requirement 3.6 |
| Keyboard event detection | Raw keyCodes | `e.key` + `e.metaKey`/`e.ctrlKey` | Modern, cross-browser, readable |
| Mobile detection | JS window.innerWidth polling | Tailwind `md:` breakpoint + `hidden` | CSS-native, no JS overhead, no resize listener |

**Key insight:** Phase 20 introduces almost no new libraries -- it's purely structural, wiring existing primitives into a new layout pattern.

## Common Pitfalls

### Pitfall 1: ChatView loses URL routing
**What goes wrong:** Removing `<Outlet />` breaks `useParams()` in ChatView since it's no longer a route child.
**Why it happens:** ChatView relies on `useParams<{ sessionId: string }>()` from react-router-dom.
**How to avoid:** Keep ChatView rendered inside a `<Route>` element. The ContentArea component should still be wrapped in React Router's route structure so ChatView can read URL params. Simplest approach: render ChatView inside a Routes/Route block within the content area, or use `useSearchParams`/`useParams` at the ContentArea level and pass down.
**Warning signs:** ChatView's `sessionId` is always `undefined` after refactor.

### Pitfall 2: Tab bar steals Cmd+1/2/3/4 from terminal
**What goes wrong:** When the terminal (xterm.js) has focus, Cmd+1 switches tabs instead of being processed by the terminal.
**Why it happens:** Global `document.addEventListener('keydown')` fires before xterm's internal handler.
**How to avoid:** Check if the active element is inside a terminal container before handling tab shortcuts. Add an escape hatch: `if (document.activeElement?.closest('[data-terminal]')) return;`
**Warning signs:** Users can't use Cmd+1/2/3/4 shortcuts inside terminal.

### Pitfall 3: Mobile tab state gets stuck
**What goes wrong:** User on mobile, tab hidden, but activeTab is 'files' from a previous desktop session.
**Why it happens:** activeTab persists in Zustand (or localStorage). Mobile hides the tab bar but doesn't force activeTab back to 'chat'.
**How to avoid:** On mobile viewports, always override activeTab to 'chat'. Use a `useEffect` with a media query match, or handle it in the ContentArea render -- if viewport < 768px, always show chat regardless of store value.
**Warning signs:** Mobile users see blank screen (Files placeholder with no content).

### Pitfall 4: PanelErrorBoundary doesn't reset properly
**What goes wrong:** Panel crashes, user clicks "Try again", but the error persists because the boundary's key hasn't changed.
**Why it happens:** react-error-boundary needs a `resetKeys` prop or a key change to re-attempt rendering.
**How to avoid:** Pass `resetKeys={[activeTab]}` or give each panel a `key` that changes on reset. The existing PanelErrorBoundary uses `resetErrorBoundary()` which should work, but test it.
**Warning signs:** "Try again" button does nothing.

### Pitfall 5: Zustand persist version mismatch
**What goes wrong:** Adding `activeTab` to the persist whitelist with the new TabId values causes hydration issues for existing users.
**Why it happens:** Stored 'dashboard' or 'settings' TabId values from M1/M2 are invalid in the new union.
**How to avoid:** Increment the persist `version` in the UI store and add a migration that maps old TabId values to 'chat'. The current store already uses version 2 with a `migrate` function.
**Warning signs:** App loads with blank content area because activeTab is 'dashboard' (no longer valid).

### Pitfall 6: Set serialization in Zustand
**What goes wrong:** File store's `expandedDirs: Set<string>` doesn't serialize to JSON properly.
**Why it happens:** `JSON.stringify(new Set(...))` produces `{}`, not an array.
**How to avoid:** Either use arrays in the store state (convert at usage site) or use Zustand's `storage` option with a custom serializer. Simplest: use `string[]` and convert to Set in selectors if needed.
**Warning signs:** Expanded directories reset on page reload.

## Code Examples

### Updating TabId Union Type
```typescript
// types/ui.ts -- BEFORE
export type TabId = 'chat' | 'dashboard' | 'settings';

// types/ui.ts -- AFTER
export type TabId = 'chat' | 'files' | 'shell' | 'git';
```

### Updating UI Store Persist Migration
```typescript
// stores/ui.ts -- increment version to 3, add migration
{
  name: 'loom-ui',
  version: 3,
  partialize: (state) => ({
    theme: state.theme,
    sidebarCollapsed: state.sidebarCollapsed,
    thinkingExpanded: state.thinkingExpanded,
    // Note: activeTab intentionally NOT persisted -- always start on Chat
  }),
  migrate: (persistedState: unknown, version: number) => {
    const state = persistedState as Record<string, unknown>;
    if (version < 2) {
      return { ...state, thinkingExpanded: true };
    }
    if (version < 3) {
      // Reset any stale TabId values from M1/M2
      return { ...state, activeTab: 'chat' };
    }
    return state;
  },
}
```

### AppShell Adaptation
```typescript
// AppShell.tsx -- BEFORE: <Outlet />
// AppShell.tsx -- AFTER: <ContentArea />
<main role="main" className="overflow-hidden min-w-0">
  <PanelErrorBoundary panelName="content">
    <ContentArea />
  </PanelErrorBoundary>
</main>
```

### Panel Placeholder Pattern
```typescript
// Reusable placeholder for panels not yet implemented
export function PanelPlaceholder({ name, icon: Icon }: {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-muted">
      <Icon className="size-12 opacity-30" />
      <p className="text-sm">{name} panel coming soon</p>
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Route-based content (`<Outlet />`) | Tab-based content (CSS show/hide) | Phase 20 | Preserves panel state across switches |
| 4 Zustand stores | 5 Zustand stores (+file) | Phase 20 | Constitution amendment |
| `TabId = 'chat' \| 'dashboard' \| 'settings'` | `TabId = 'chat' \| 'files' \| 'shell' \| 'git'` | Phase 20 | Breaking change to type union |
| `/dashboard` and `/settings` routes | Settings as modal (Phase 21), dashboard removed | Phase 20 | Simplifies routing |

**Deprecated/outdated:**
- `PlaceholderView` component used for Dashboard/Settings routes -- will be replaced by panel-specific placeholders
- `DashboardPlaceholder` and `SettingsPlaceholder` in App.tsx -- removed
- `/dashboard` and `/settings` URL routes -- removed (Settings becomes modal in Phase 21)

## Open Questions

1. **Should activeTab be persisted across page reloads?**
   - What we know: Currently activeTab is NOT in the persist whitelist (good). Starting on Chat is safest.
   - What's unclear: Whether users would prefer returning to their last tab.
   - Recommendation: Do NOT persist activeTab. Always start on Chat. Add persistence later if requested.

2. **Should tab switches be animated?**
   - What we know: M4 "The Polish" handles all animations. Phase 20 is structural.
   - What's unclear: Whether an instant display toggle feels jarring.
   - Recommendation: No animation in Phase 20. CSS `display:none` toggle is instant and clean. Add crossfade in M4.

3. **How should ChatView coexist with the new layout?**
   - What we know: ChatView uses `useParams()` which requires React Router context.
   - What's unclear: Exact wiring to keep URL routing for chat while tab-switching for others.
   - Recommendation: Render ChatView inside a minimal `<Routes><Route>` block within ContentArea's chat panel div. Other panels don't need routes.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 + React Testing Library 16.3.2 |
| Config file | `src/vite.config.ts` (test section) |
| Quick run command | `cd /home/swd/loom/src && npx vitest run --reporter=verbose` |
| Full suite command | `cd /home/swd/loom/src && npx vitest run --coverage` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LAY-01 | Tab bar renders 4 tabs with correct labels | unit | `cd /home/swd/loom/src && npx vitest run src/components/content-area/view/TabBar.test.tsx -x` | Wave 0 |
| LAY-02 | Clicking tab calls setActiveTab | unit | `cd /home/swd/loom/src && npx vitest run src/components/content-area/view/TabBar.test.tsx -x` | Wave 0 |
| LAY-03 | Non-active panels have display:none | unit | `cd /home/swd/loom/src && npx vitest run src/components/content-area/view/ContentArea.test.tsx -x` | Wave 0 |
| LAY-04 | Active tab has aria-selected=true + visual class | unit | `cd /home/swd/loom/src && npx vitest run src/components/content-area/view/TabBar.test.tsx -x` | Wave 0 |
| LAY-05 | Cmd+1/2/3/4 switches tabs | unit | `cd /home/swd/loom/src && npx vitest run src/components/content-area/hooks/useTabKeyboardShortcuts.test.ts -x` | Wave 0 |
| LAY-06 | Tab bar hidden on mobile | unit | Manual -- Tailwind responsive classes tested visually | N/A |
| LAY-07 | File store actions work correctly | unit | `cd /home/swd/loom/src && npx vitest run src/stores/file.test.ts -x` | Wave 0 |
| LAY-08 | PanelErrorBoundary wraps each panel | unit | `cd /home/swd/loom/src && npx vitest run src/components/content-area/view/ContentArea.test.tsx -x` | Wave 0 |
| LAY-09 | TabId type includes new values | unit | Compile-time check (tsc) + UI store test update | Existing (update needed) |

### Sampling Rate
- **Per task commit:** `cd /home/swd/loom/src && npx vitest run --reporter=verbose`
- **Per wave merge:** `cd /home/swd/loom/src && npx vitest run --coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/src/components/content-area/view/TabBar.test.tsx` -- covers LAY-01, LAY-02, LAY-04
- [ ] `src/src/components/content-area/view/ContentArea.test.tsx` -- covers LAY-03, LAY-08
- [ ] `src/src/components/content-area/hooks/useTabKeyboardShortcuts.test.ts` -- covers LAY-05
- [ ] `src/src/stores/file.test.ts` -- covers LAY-07
- [ ] `src/src/stores/ui.test.ts` -- UPDATE existing test for new TabId values (LAY-09)
- [ ] `src/src/types/file.ts` -- type definitions needed before store implementation

## Sources

### Primary (HIGH confidence)
- Codebase inspection: `src/src/stores/ui.ts`, `src/src/types/ui.ts`, `src/src/components/app-shell/AppShell.tsx`, `src/src/components/shared/ErrorBoundary.tsx`
- Codebase inspection: `src/src/components/chat/view/ChatView.tsx` (URL params pattern)
- Codebase inspection: `src/package.json` (dependency versions)
- `.planning/V2_CONSTITUTION.md` (coding conventions)
- `.planning/REQUIREMENTS.md` (LAY-01 through LAY-09)

### Secondary (MEDIUM confidence)
- CSS `display:none` for mount-once panels is a standard, well-documented pattern used by VS Code, Cursor, and similar IDEs

### Tertiary (LOW confidence)
- None -- this phase is entirely codebase-internal with no external library research needed

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new libraries, purely existing stack
- Architecture: HIGH -- CSS show/hide is a trivial pattern, existing primitives cover 90%
- Pitfalls: HIGH -- identified from direct codebase inspection (URL routing, persist migration, Set serialization)

**Research date:** 2026-03-10
**Valid until:** 2026-04-10 (stable -- no external dependencies changing)
