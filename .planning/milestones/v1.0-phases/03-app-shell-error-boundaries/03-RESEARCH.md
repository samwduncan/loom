# Phase 3: App Shell + Error Boundaries - Research

**Researched:** 2026-03-05
**Domain:** React app shell layout (CSS Grid), routing (React Router v7), error containment (React Error Boundaries)
**Confidence:** HIGH

## Summary

Phase 3 builds the spatial skeleton of Loom V2: a CSS Grid shell with three columns (sidebar, content, artifact-at-0px), React Router declarative routing for `/chat/:sessionId?`, `/dashboard`, and `/settings` placeholders, and a three-tier error boundary system (App, Panel, Message). All visual tokens, enforcement rules, and test infrastructure from Phases 1-2 are in place and ready to consume.

The technical domain is well-understood. CSS Grid for full-viewport app shells is a mature, battle-tested pattern. React Router v7.13.1 is already installed and its declarative mode (`BrowserRouter` + `Routes` + `Route` + `Outlet`) provides exactly what this phase needs. Error boundaries remain class-component-only in React 19, but the `react-error-boundary` library (v6.1.1) wraps this cleanly with a functional API including `fallbackRender`, `onError`, `onReset`, and `resetKeys`. The recommendation is to use `react-error-boundary` for all three tiers to avoid writing custom class components.

**Primary recommendation:** Use `react-error-boundary` v6.1.1 for all error boundary tiers. Use React Router v7 declarative mode (already installed). Build CSS Grid shell with CSS custom properties for column widths and a `data-sidebar-state` attribute for sidebar state management.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Error fallback aesthetics:** Gentle and warm -- muted styling using `--surface-overlay` background with `--text-secondary` text and `--status-warning` accent. Hidden details by default with "Show details" link revealing component stack trace and error message.
- **Recovery actions:** Reset + Reload. Error boundaries reset internal error state and optionally clear relevant store data. App-level offers full page reload. Panel/Message-level offer "Try again" that resets boundary state and re-mounts children.
- **Message-level boundary:** Compact inline placeholder -- "Failed to render this message" with retry icon. Does NOT take up full message height.
- **Panel and App-level boundaries:** Centered card with warning icon, friendly message, try again/reload button, and collapsible details section.
- **Sidebar (Phase 3):** Branded header only -- "Loom" wordmark in Instrument Serif (italic) at the top, `--surface-raised` background, `--border-subtle` separator below header. Rest of sidebar is empty.
- **Route placeholders:** Centered label only -- route name in `--text-muted`. Minimal.
- **Chat content area:** Empty state with centered prompt -- "Start a conversation" in `--text-muted`.
- **/dev/tokens:** Stays outside AppShell as a standalone full-page route.
- **Sidebar separation:** 1px right border using `--border-subtle` (Constitution 7.13). Surface contrast (`--surface-raised` vs `--surface-base`).
- **Collapse toggle:** Basic show/hide toggle in Phase 3. Chevron button in top-right of sidebar header.
- **Collapsed state:** Hidden completely (width: 0px). Content area takes full width. Small expand trigger chevron at left edge, positioned at `--z-sticky`.
- **Artifact column:** CSS variable only -- `var(--artifact-width, 0px)`. No UI trigger.
- **Responsive:** Basic breakpoint at 768px. Below 768px, sidebar auto-collapses. Simple CSS media query.
- **Sidebar width:** Fixed 280px. Grid columns via CSS variables. Use `data-sidebar-state` attribute on shell element (`expanded`, `collapsed-hidden`; M3 adds `collapsed-rail`).

### Claude's Discretion
- Exact expand trigger styling when sidebar is collapsed (edge button appearance, position)
- Error boundary component internal structure and hook patterns
- Whether to use `react-error-boundary` library or custom class components
- Animation on sidebar collapse (instant vs simple CSS transition in Phase 3)
- Reset logic implementation details (which store slices to clear, if any)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SHELL-01 | CSS Grid AppShell with `grid-template-columns: var(--sidebar-width, 280px) 1fr var(--artifact-width, 0px)`, rows `1fr`, composition-based children | CSS Grid patterns documented, CSS variable approach verified, `data-sidebar-state` attribute pattern for future extensibility |
| SHELL-02 | Root HTML `height: 100dvh`, `overflow: hidden` on html+body, no document scrollbar ever | Already partially implemented in `base.css` (html `height: 100dvh`, `overflow: hidden`; body `margin: 0`, `overflow: hidden`). Grid shell must use `h-dvh` or `height: 100dvh` and `overflow: hidden` on grid container. |
| SHELL-03 | React Router routes for `/chat/:sessionId?`, `/dashboard`, `/settings` inside AppShell content area | React Router v7.13.1 already installed. Declarative mode (`BrowserRouter` + `Routes` + `Route` + `Outlet`) fully supported. Layout route pattern with `<Outlet />` for content slot. |
| SHELL-04 | Three error boundaries: App (full-screen fallback + reload), Panel (inline error card + retry), Message (compact "Failed to render" + retry). Each logs error with component stack trace. | `react-error-boundary` v6.1.1 provides `ErrorBoundary` component with `fallbackRender`, `onError` (receives Error + ErrorInfo with component stack), `onReset`, `resetKeys`. Works with React 19. Three wrapper components built on top of this library. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react | 19.2.0 | UI framework | Already installed, React 19 with improved error boundary behavior |
| react-dom | 19.2.0 | DOM renderer | Already installed |
| react-router-dom | 7.13.1 | Client-side routing | Already installed, declarative mode provides `BrowserRouter`, `Routes`, `Route`, `Outlet`, `useParams`, `useNavigate` |
| react-error-boundary | 6.1.1 | Error containment | De facto standard (1857 dependents on npm). Wraps class component boilerplate. Provides `fallbackRender`, `onError`, `onReset`, `resetKeys`. Works with React 19. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| clsx | 2.1.1 | Class name utility | Already installed, used by `cn()` |
| tailwind-merge | 3.5.0 | Tailwind class dedup | Already installed, used by `cn()` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-error-boundary | Custom class components | Custom class components require boilerplate (getDerivedStateFromError, componentDidCatch, state management, TypeScript typing). Library is <2KB, well-maintained, and provides hooks + reset functionality for free. Library wins. |
| React Router declarative mode | createBrowserRouter (data mode) | Data mode adds loader/action patterns not needed in Phase 3 (no data loading yet). Declarative mode is simpler, already in use, and matches the existing App.tsx pattern. Stay declarative. |

**Installation:**
```bash
cd /home/swd/loom/src && npm install react-error-boundary
```

## Architecture Patterns

### Recommended Project Structure
```
src/src/components/
  app-shell/
    AppShell.tsx              # CSS Grid container, sidebar state, layout
    AppShell.test.tsx          # Grid rendering, sidebar toggle
  shared/
    ErrorBoundary.tsx          # All 3 tiers: AppErrorBoundary, PanelErrorBoundary, MessageErrorBoundary
    ErrorBoundary.test.tsx     # Error catching, fallback rendering, reset
    ErrorFallback.tsx          # Shared fallback UI components (card + inline variants)
  sidebar/
    Sidebar.tsx               # Phase 3: branded header + collapse toggle only
    Sidebar.test.tsx           # Header rendering, collapse toggle

src/src/App.tsx               # Restructured: AppErrorBoundary > BrowserRouter > Routes
```

### Pattern 1: CSS Grid App Shell with CSS Variable Columns
**What:** A full-viewport CSS Grid with columns driven by CSS custom properties and a `data-sidebar-state` attribute for state-driven layout changes.
**When to use:** Always -- this is the foundational shell for the entire application.
**Example:**
```tsx
// Source: CONTEXT.md decisions + CSS Grid best practices
export interface AppShellProps {
  children?: React.ReactNode;
}

export const AppShell = memo(function AppShell({ children }: AppShellProps) {
  const isSidebarOpen = useUIStore(state => state.sidebarOpen);

  return (
    <div
      className="grid h-dvh overflow-hidden bg-surface-base"
      data-sidebar-state={isSidebarOpen ? 'expanded' : 'collapsed-hidden'}
      style={{
        gridTemplateColumns: 'var(--sidebar-width, 280px) 1fr var(--artifact-width, 0px)',
        gridTemplateRows: '1fr',
      } as React.CSSProperties}
    >
      <PanelErrorBoundary panelName="sidebar">
        <Sidebar />
      </PanelErrorBoundary>

      <main role="main" className="overflow-hidden">
        <PanelErrorBoundary panelName="content">
          <Outlet />
        </PanelErrorBoundary>
      </main>

      {/* Artifact column: 0px width, reserved for future */}
    </div>
  );
});
```

**CSS for sidebar state:**
```css
/* In AppShell or via Tailwind data-* variants */
[data-sidebar-state="collapsed-hidden"] {
  --sidebar-width: 0px;
}
[data-sidebar-state="expanded"] {
  --sidebar-width: 280px;
}

/* Responsive: auto-collapse below 768px */
@media (max-width: 767px) {
  [data-sidebar-state="expanded"] {
    --sidebar-width: 0px;
  }
}
```

### Pattern 2: Layout Route with Outlet
**What:** React Router layout route pattern where `AppShell` is the layout component and child routes render via `<Outlet />`.
**When to use:** For all routes that should render inside the app shell.
**Example:**
```tsx
// Source: React Router v7 declarative mode docs
export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Routes inside AppShell */}
        <Route element={<AppShell />}>
          <Route path="/" element={<Navigate to="/chat" replace />} />
          <Route path="/chat/:sessionId?" element={<ChatPlaceholder />} />
          <Route path="/dashboard" element={<DashboardPlaceholder />} />
          <Route path="/settings" element={<SettingsPlaceholder />} />
        </Route>

        {/* Dev routes outside AppShell */}
        <Route path="/dev/tokens" element={<TokenPreview />} />
      </Routes>
    </BrowserRouter>
  );
}
```

### Pattern 3: Three-Tier Error Boundaries with react-error-boundary
**What:** Three wrapper components built on `react-error-boundary`'s `ErrorBoundary`, each with distinct fallback UI and logging.
**When to use:** App-level wraps the entire React tree. Panel-level wraps each grid area. Message-level wraps individual messages (future phases).
**Example:**
```tsx
// Source: react-error-boundary v6.1.1 API
import { ErrorBoundary } from 'react-error-boundary';

// --- App-level: full-screen fallback ---
export function AppErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }) => (
        <AppErrorFallback error={error} onReload={() => window.location.reload()} />
      )}
      onError={(error, info) => {
        console.error('[AppErrorBoundary]', error);
        console.error('[AppErrorBoundary] Component stack:', info.componentStack);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

// --- Panel-level: inline error card ---
export function PanelErrorBoundary({
  children,
  panelName,
}: {
  children: React.ReactNode;
  panelName: string;
}) {
  return (
    <ErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }) => (
        <PanelErrorFallback
          error={error}
          panelName={panelName}
          onRetry={resetErrorBoundary}
        />
      )}
      onError={(error, info) => {
        console.error(`[PanelErrorBoundary:${panelName}]`, error);
        console.error(`[PanelErrorBoundary:${panelName}] Component stack:`, info.componentStack);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

// --- Message-level: compact inline placeholder ---
export function MessageErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }) => (
        <MessageErrorFallback error={error} onRetry={resetErrorBoundary} />
      )}
      onError={(error, info) => {
        console.error('[MessageErrorBoundary]', error);
        console.error('[MessageErrorBoundary] Component stack:', info.componentStack);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
```

### Pattern 4: Sidebar Collapse with CSS Variable Override
**What:** Sidebar collapse driven by setting `--sidebar-width` CSS variable to `0px`, with the sidebar element itself hiding via `overflow: hidden` and the expand trigger appearing at the left edge.
**When to use:** Sidebar toggle behavior.
**Example:**
```tsx
// The sidebar hides when parent grid column is 0px
// Expand trigger appears fixed at left edge when collapsed
export const Sidebar = memo(function Sidebar() {
  const isSidebarOpen = useUIStore(state => state.sidebarOpen);
  const toggleSidebar = useUIStore(state => state.toggleSidebar);

  if (!isSidebarOpen) {
    return (
      <button
        onClick={toggleSidebar}
        className={cn(
          "fixed left-0 top-1/2 -translate-y-1/2",
          "z-[var(--z-sticky)] p-2",
          "bg-surface-raised rounded-r-md border-r border-border",
          "text-muted hover:text-foreground",
          "transition-colors duration-[var(--duration-fast)]"
        )}
        aria-label="Expand sidebar"
      >
        {/* Chevron right icon */}
      </button>
    );
  }

  return (
    <aside
      role="complementary"
      aria-label="Navigation"
      className="bg-surface-raised border-r border-border overflow-hidden flex flex-col"
    >
      <header className="flex items-center justify-between p-4 border-b border-border">
        <span className="font-serif italic text-lg text-foreground">Loom</span>
        <button onClick={toggleSidebar} aria-label="Collapse sidebar">
          {/* Chevron left icon */}
        </button>
      </header>
      {/* Rest of sidebar empty in Phase 3 */}
    </aside>
  );
});
```

### Anti-Patterns to Avoid
- **Animating `grid-template-columns` directly:** CSS Grid column transitions are poorly supported across browsers and janky. Use CSS variable swaps (instant or with a brief transition on the sidebar element itself).
- **Using `display: none` for sidebar collapse:** Destroys the grid structure. Instead, set column width to `0px` with `overflow: hidden` on the sidebar element.
- **Putting error boundaries inside the error boundary fallback UI:** Creates infinite loops. Fallback components must be simple and cannot throw.
- **Using React Context for sidebar state:** Violates Constitution 4.4 (no Context for mutable state). Use `ui` Zustand store with selectors.
- **Default exports on components:** Banned by Constitution and ESLint enforcement.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Error boundary class component | Custom `getDerivedStateFromError` + `componentDidCatch` class | `react-error-boundary` v6.1.1 | Handles reset logic, TypeScript types, `resetKeys`, `onError` callback with component stack. ~2KB. Well-maintained. |
| Sidebar expand/collapse animation | Custom `requestAnimationFrame` animation loop | CSS `transition` on sidebar element opacity/transform | CSS transitions are GPU-composited, simpler, and sufficient for Phase 3. |
| Route matching | Custom URL parsing | React Router v7 `useParams`, `Route path` patterns | Already installed. Handles optional params (`/:sessionId?`), nested routes, navigation. |

**Key insight:** Phase 3 is structural scaffolding. Every component is a thin shell that future phases fill with content. Resist the urge to add functionality beyond the skeleton.

## Common Pitfalls

### Pitfall 1: Document-Level Scrollbar Leak
**What goes wrong:** A scrollbar appears on `<html>` or `<body>` at certain viewport sizes, violating SHELL-02.
**Why it happens:** Content inside the grid exceeds `100dvh` because grid items have `min-height: auto` (CSS Grid default) or child content overflows.
**How to avoid:** Set `overflow: hidden` on the grid container AND `min-height: 0` (or `overflow: hidden`) on each grid child. The `base.css` already handles html/body, but the grid container itself needs the same treatment.
**Warning signs:** Scrollbar appearing when browser window is resized to small heights.

### Pitfall 2: Error Boundary Not Catching Async Errors
**What goes wrong:** An error in `useEffect` or an event handler crashes the page instead of being caught by the boundary.
**Why it happens:** React error boundaries only catch errors during rendering (in the component tree). `useEffect` callbacks, event handlers, and `setTimeout`/`Promise` rejections are NOT caught.
**How to avoid:** Phase 3 only needs render-time error catching (SHELL-04 specifies "throw an error inside a message component"). For async errors, future phases will use try/catch + toast system. Do not try to solve async errors with boundaries.
**Warning signs:** Tests that throw in `useEffect` expecting the boundary to catch them will fail.

### Pitfall 3: Sidebar Expand Trigger z-index Conflict
**What goes wrong:** The sidebar expand chevron (positioned fixed at left edge) overlaps or is hidden by content.
**Why it happens:** Fixed positioning takes the element out of the grid flow, and z-index wars emerge.
**How to avoid:** Use `z-[var(--z-sticky)]` (10) per CONTEXT.md decision. The content area is at `--z-base` (0), so the trigger sits above it. Modal overlays at `--z-modal` (50) will sit above the trigger.
**Warning signs:** Expand button disappearing behind content or appearing above modals.

### Pitfall 4: React Router v7 Import Path
**What goes wrong:** Importing from `react-router` instead of `react-router-dom` or vice versa causes confusing TypeScript errors.
**Why it happens:** React Router v7 unified the packages. The `react-router-dom` package re-exports everything from `react-router`. Both work, but the project already uses `react-router-dom` imports.
**How to avoid:** Import from `react-router-dom` consistently (matches existing App.tsx pattern).
**Warning signs:** TypeScript errors about missing types or duplicate type declarations.

### Pitfall 5: Optional Route Params in React Router v7
**What goes wrong:** `/chat/:sessionId?` -- the `?` makes `sessionId` optional, but `useParams()` types it as `string | undefined` which requires null checks everywhere.
**Why it happens:** TypeScript correctly types optional params as possibly undefined.
**How to avoid:** Accept the `string | undefined` typing and handle both cases explicitly. Do NOT use `as string` casts.
**Warning signs:** Runtime errors when navigating to `/chat` without a sessionId.

### Pitfall 6: Grid Column Collapse Without overflow:hidden
**What goes wrong:** Setting sidebar column to `0px` width causes sidebar content to overflow into the content area.
**Why it happens:** CSS Grid column width of `0px` doesn't automatically hide content. Text and elements spill out.
**How to avoid:** Always pair `--sidebar-width: 0px` with `overflow: hidden` on the sidebar element.
**Warning signs:** Sidebar text visible when sidebar should be collapsed.

## Code Examples

### Verified: React Router v7 Layout Route with Outlet
```tsx
// Source: React Router v7 declarative mode (reactrouter.com/start/modes)
// App.tsx structure
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';

export function App() {
  return (
    <AppErrorBoundary>
      <BrowserRouter>
        <Routes>
          {/* Layout route: AppShell renders <Outlet /> for child routes */}
          <Route element={<AppShell />}>
            <Route index element={<Navigate to="/chat" replace />} />
            <Route path="/chat/:sessionId?" element={<ChatPlaceholder />} />
            <Route path="/dashboard" element={<DashboardPlaceholder />} />
            <Route path="/settings" element={<SettingsPlaceholder />} />
          </Route>
          {/* Standalone routes outside the shell */}
          <Route path="/dev/tokens" element={<TokenPreview />} />
        </Routes>
      </BrowserRouter>
    </AppErrorBoundary>
  );
}
```

### Verified: react-error-boundary FallbackRender with Error Logging
```tsx
// Source: react-error-boundary v6.1.1 GitHub README
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';

// onError receives (error: Error, info: { componentStack: string })
// fallbackRender receives ({ error: Error, resetErrorBoundary: () => void })

function PanelFallback({ error, resetErrorBoundary }: FallbackProps) {
  const [isDetailsOpen, setDetailsOpen] = useState(false);

  return (
    <div className="flex items-center justify-center h-full p-6">
      <div className="bg-surface-overlay rounded-lg p-6 max-w-md text-center space-y-4">
        {/* Warning icon */}
        <p className="text-secondary-foreground">Something went wrong in this panel</p>
        <button
          onClick={resetErrorBoundary}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md"
        >
          Try again
        </button>
        <button
          onClick={() => setDetailsOpen(!isDetailsOpen)}
          className="text-muted text-xs underline"
        >
          {isDetailsOpen ? 'Hide details' : 'Show details'}
        </button>
        {isDetailsOpen && (
          <pre className="text-left text-xs text-muted overflow-auto max-h-40 bg-surface-base p-3 rounded">
            {error.message}
          </pre>
        )}
      </div>
    </div>
  );
}
```

### Verified: CSS Grid Shell with Data Attribute State
```css
/* Source: CSS Grid spec + data-attribute pattern */
/* These rules go in the AppShell component or a dedicated CSS file */

.app-shell {
  display: grid;
  grid-template-columns: var(--sidebar-width, 280px) 1fr var(--artifact-width, 0px);
  grid-template-rows: 1fr;
  height: 100dvh;
  overflow: hidden;
}

.app-shell[data-sidebar-state="expanded"] {
  --sidebar-width: 280px;
}

.app-shell[data-sidebar-state="collapsed-hidden"] {
  --sidebar-width: 0px;
}

/* Responsive auto-collapse */
@media (max-width: 767px) {
  .app-shell {
    --sidebar-width: 0px;
  }
}

/* Sidebar overflow control */
.app-shell > aside {
  overflow: hidden;
  min-width: 0; /* Prevent grid blowout */
}

/* Content area overflow control */
.app-shell > main {
  overflow: hidden;
  min-width: 0;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom class component error boundaries | `react-error-boundary` library | v4+ (2023) | Eliminates boilerplate, adds reset/retry, TypeScript-first |
| React 18 double-render on error | React 19 single-render on error | React 19 (2024) | Error boundaries now bail out after first error, reducing noise |
| React Router v6 createBrowserRouter only | v7 declarative mode (BrowserRouter) still supported | RR v7 (2024) | Both patterns work; declarative mode is simpler for apps without data loading |
| `vh` for viewport height | `dvh` (dynamic viewport height) | 2023+ | Handles mobile browser address bar correctly |

**Deprecated/outdated:**
- `React.Component` with `componentDidCatch` alone: Still works, but `getDerivedStateFromError` is also needed for proper fallback rendering
- `react-router-dom` v5 patterns (`<Switch>`, `component` prop): Fully replaced by v7 `<Routes>`, `element` prop
- `100vh` for mobile layouts: Use `100dvh` to account for dynamic browser chrome

## Open Questions

1. **UI Store dependency ordering**
   - What we know: Phase 3 needs `sidebarOpen` and `toggleSidebar` from the `ui` Zustand store, but STATE-01 (store creation) is Phase 4.
   - What's unclear: Should Phase 3 create a minimal `ui` store stub, or should it use local React state for sidebar toggle?
   - Recommendation: Create a minimal `ui` store in `src/src/stores/ui.ts` with just `sidebarOpen`, `toggleSidebar`, and `sidebarState` ('expanded' | 'collapsed-hidden'). Phase 4 will expand this store with the full schema. This avoids local state (which violates Constitution 4.4's spirit) and establishes the store file early.

2. **Error boundary component stack format**
   - What we know: `react-error-boundary`'s `onError` callback receives `ErrorInfo` which has `componentStack: string`.
   - What's unclear: React 19 may have changed the component stack format slightly.
   - Recommendation: Log `componentStack` as-is. The format is human-readable regardless of minor changes.

3. **Sidebar collapse animation in Phase 3**
   - What we know: CONTEXT.md gives discretion on "instant vs simple CSS transition."
   - What's unclear: Whether to use CSS transition on the sidebar width/opacity or make it instant.
   - Recommendation: Use a simple CSS transition (`transition: opacity var(--duration-fast)`) on the sidebar content. The grid column change should be instant (no transition on `grid-template-columns`). This provides subtle feedback without the complexity of animating grid columns.

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
| SHELL-01 | AppShell renders 3-column CSS Grid filling 100dvh | unit | `cd /home/swd/loom/src && npx vitest run src/components/app-shell/AppShell.test.tsx -x` | -- Wave 0 |
| SHELL-02 | No document scrollbar at any viewport size | unit | `cd /home/swd/loom/src && npx vitest run src/components/app-shell/AppShell.test.tsx -x` | -- Wave 0 |
| SHELL-03 | React Router serves /chat/:sessionId?, /dashboard, /settings inside content area | unit | `cd /home/swd/loom/src && npx vitest run src/components/app-shell/AppShell.test.tsx -x` | -- Wave 0 |
| SHELL-04 | Three error boundary tiers catch/log errors independently | unit | `cd /home/swd/loom/src && npx vitest run src/components/shared/ErrorBoundary.test.tsx -x` | -- Wave 0 |

### Sampling Rate
- **Per task commit:** `cd /home/swd/loom/src && npx vitest run --reporter=verbose`
- **Per wave merge:** `cd /home/swd/loom/src && npx vitest run --coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/src/components/app-shell/AppShell.test.tsx` -- covers SHELL-01, SHELL-02, SHELL-03 (grid rendering, no scrollbar, route rendering)
- [ ] `src/src/components/shared/ErrorBoundary.test.tsx` -- covers SHELL-04 (error catching, fallback rendering, logging, reset)
- [ ] `src/src/components/sidebar/Sidebar.test.tsx` -- covers sidebar header rendering, collapse toggle
- [ ] `react-error-boundary` package install: `cd /home/swd/loom/src && npm install react-error-boundary`

## Sources

### Primary (HIGH confidence)
- React Router v7 official docs (reactrouter.com/start/modes) -- declarative mode API, BrowserRouter/Routes/Route/Outlet
- react-error-boundary v6.1.1 GitHub README -- full API: ErrorBoundary component props, FallbackProps, onError/onReset/resetKeys
- React 19 official docs (react.dev/reference/react/Component) -- error boundary lifecycle methods, React 19 behavior changes
- Existing codebase: `src/src/App.tsx`, `src/src/styles/base.css`, `src/package.json` -- current state of routing, viewport setup, dependencies

### Secondary (MEDIUM confidence)
- [React 19 Error Boundary Behaves Differently](https://andrei-calazans.com/posts/react-19-error-boundary-changed/) -- React 19 bails out after first error (optimization, not breaking)
- [CSS Grid Complete Guide](https://css-tricks.com/snippets/css/complete-guide-grid/) -- grid-template-columns, data-attribute patterns
- [MDN grid-template-columns](https://developer.mozilla.org/en-US/docs/Web/CSS/grid-template-columns) -- CSS variable usage in grid templates

### Tertiary (LOW confidence)
- None -- all findings verified with primary or secondary sources.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed (except react-error-boundary which is well-documented). React Router v7 declarative mode verified. react-error-boundary v6.1.1 API verified from GitHub README.
- Architecture: HIGH -- CSS Grid app shell is a mature pattern. Layout route with Outlet is standard React Router. Three-tier error boundaries are documented in the V2 Constitution.
- Pitfalls: HIGH -- documented from real CSS Grid gotchas (min-height:auto, overflow behavior) and React error boundary limitations (async errors not caught).

**Research date:** 2026-03-05
**Valid until:** 2026-04-05 (stable domain, no fast-moving dependencies)
