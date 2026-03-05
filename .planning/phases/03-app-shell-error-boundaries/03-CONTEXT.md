# Phase 3: App Shell + Error Boundaries - Context

**Gathered:** 2026-03-05
**Status:** Ready for planning
**Reviewed by:** Gemini Architect (review mode) -- corrections applied

<domain>
## Phase Boundary

CSS Grid skeleton providing the spatial structure for all future content -- sidebar, main content, and a reserved artifact column -- with error containment at every level. Routes for chat, dashboard, and settings render inside the content area. Three-tier error boundaries (App, Panel, Message) isolate failures. No real chat, session, or settings functionality -- this is the frame that everything else builds into.

</domain>

<decisions>
## Implementation Decisions

### Error fallback aesthetics
- **Tone:** Gentle and warm -- muted styling using `--surface-overlay` background with `--text-secondary` text and `--status-warning` accent. Feels like part of the app, not alarming.
- **Technical details:** Hidden by default, with a small "Show details" link that reveals the component stack trace and error message on demand
- **Recovery actions:** Reset + Reload. Error boundaries reset their internal error state and optionally clear relevant store data before re-mounting. App-level offers full page reload. Panel-level and Message-level offer a "Try again" that resets the boundary state and re-mounts the children.
- **Message-level boundary:** Compact inline placeholder -- small muted line like "Failed to render this message" with a retry icon. Does NOT take up full message height.
- **Panel and App-level boundaries:** Centered card with warning icon, friendly message, try again/reload button, and collapsible details section

### Shell placeholder content
- **Sidebar (Phase 3):** Branded header only -- "Loom" wordmark in Instrument Serif (italic) at the top, `--surface-raised` background, `--border-subtle` separator below header. Rest of sidebar is empty.
- **Route placeholders (/dashboard, /settings):** Centered label only -- route name in `--text-muted`. Minimal, clearly communicates the route works.
- **Chat content area (/chat/:sessionId?):** Empty state with centered prompt -- "Start a conversation" in `--text-muted`. Feels like a real app waiting for input.
- **/dev/tokens:** Stays outside AppShell as a standalone full-page route. It's a dev tool with its own layout.

### Sidebar initial styling
- **Separation:** 1px right border on sidebar using `--border-subtle` (Constitution 7.13 compliance). Surface contrast (`--surface-raised` vs `--surface-base`) provides the tonal distinction; the border adds precision.
- **Collapse toggle:** Basic show/hide toggle in Phase 3 (not deferred to M3). Chevron button in top-right of sidebar header, next to the Loom wordmark.
- **Collapsed state:** Hidden completely (width: 0px). Content area takes full width. A small expand trigger chevron appears at the left edge to bring sidebar back, positioned at `--z-sticky` (DS-04 compliance).
- **Width:** Fixed at 280px when expanded. No drag-resize in M1.

### Grid layout & responsiveness
- **Artifact column:** CSS variable only -- `var(--artifact-width, 0px)` in grid template. No UI trigger. Future phases set the variable to expand it.
- **Responsive:** Basic breakpoint at 768px. Below 768px, sidebar auto-collapses (hidden). Content goes full-width. Simple CSS media query.
- **Sidebar width:** Fixed 280px, no drag-resize. Grid columns driven entirely via CSS variables. Use `data-sidebar-state` attribute on the shell element to support future states (`expanded`, `collapsed-hidden`, `collapsed-rail`) without JS logic changes. Phase 3 implements `expanded` and `collapsed-hidden`; M3 POLISH-05 adds `collapsed-rail` (~48px icon mode).

### Claude's Discretion
- Exact expand trigger styling when sidebar is collapsed (edge button appearance, position)
- Error boundary component internal structure and hook patterns
- Whether to use `react-error-boundary` library or custom class components
- Animation on sidebar collapse (instant vs simple CSS transition in Phase 3)
- Reset logic implementation details (which store slices to clear, if any)

</decisions>

<specifics>
## Specific Ideas

- Sidebar header: "Loom" in Instrument Serif italic -- establishes the brand identity from the first visible component
- Error boundaries should feel like a natural part of the app, not alarming -- "oops" energy, not "CRITICAL FAILURE" energy
- Surface contrast + subtle border between sidebar and content -- precision without heaviness
- TokenPreview stays independent -- don't constrain a dev tool inside the app shell
- Grid architecture should be multi-state ready from day one (data-sidebar-state attribute pattern)

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `App.tsx`: Already has BrowserRouter + Routes setup -- Phase 3 restructures this to wrap routes in AppShell
- `tokens.css`: Surface tokens (`--surface-base`, `--surface-raised`, `--surface-overlay`), border tokens, status colors all ready to use
- `index.css`: Tailwind theme mappings -- `bg-surface-base`, `bg-surface-raised`, `text-muted` etc. all available as utilities
- `base.css`: Already sets `overflow: hidden` on html/body -- SHELL-02 viewport lock partially in place
- `cn.ts`: clsx + tailwind-merge utility for className composition

### Established Patterns
- ESLint Constitution enforcement active -- all new components must use token-based styling
- Tailwind v4 CSS-first `@theme` -- no config file, tokens in CSS
- Named exports only (ESLint enforced)
- Pre-commit hooks run lint + typecheck + tests

### Integration Points
- `App.tsx` needs restructuring: wrap app routes in AppShell, keep /dev/tokens outside
- Component directories exist but empty: `app-shell/`, `sidebar/`, `shared/`, `chat/`, `settings/`
- No existing error boundary code -- building from scratch

</code_context>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope

</deferred>

---

*Phase: 03-app-shell-error-boundaries*
*Context gathered: 2026-03-05*
*Gemini architect review: Approved with corrections applied (border separator, reset recovery, multi-state grid, z-index compliance)*
