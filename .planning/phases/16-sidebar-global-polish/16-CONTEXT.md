# Phase 16: Sidebar & Global Polish - Context

**Gathered:** 2026-03-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Every non-chat surface -- sidebar, settings, modals, mobile nav -- matches the charcoal + rose palette with density improvements and polished interactions. Sessions get time-based grouping, the sidebar gets a functional collapse mode, and all dialogs/overlays use glassmorphic blur with the design system tokens.

</domain>

<decisions>
## Implementation Decisions

### Session List Density & Grouping
- Sessions grouped by time categories: Today, Yesterday, Last 7 Days, Older
- Group headers are collapsible with chevron toggle and session counts
- Active session highlighted with 2px dusty rose left border + subtle bg-accent tint (replaces current green dot)
- Compact single-line density: session name + tiny timestamp on one line, ~28-30px per row (like Claude.ai sidebar)
- Provider logo remains as small inline icon

### Sidebar Collapse Behavior
- Collapsed strip shows navigation icons only: expand, new session, settings, update indicator
- Smooth width animation from 48px to 288px (w-72) over ~200ms with content fade-in after width settles
- Collapsed strip width stays at current 48px
- Keyboard shortcut Cmd/Ctrl+B to toggle sidebar

### Settings & Modal Styling
- Settings keeps full-screen overlay pattern, restyled with charcoal surfaces and rose accents
- Replace blue-600 settings icon and save button with dusty rose primary color
- All modal/dialog backdrops use glassmorphic blur: backdrop-blur-xl with bg-background/60
- Confirmation dialogs (delete session, delete project) get both palette swap AND layout refresh -- better spacing, icon treatment, button positioning
- Keep blue-600 for primary action buttons (Save, Submit) -- blue stands out as "do something" against charcoal. Rose is for ambient theming (icons, borders, highlights), not actions

### Mobile Navigation
- Keep floating glassmorphic bottom bar style -- just apply charcoal+rose palette treatment
- Active tab uses rose pill behind icon+label (replacing current primary color highlight)
- Mobile sidebar gets same time-grouping treatment as desktop (Today/Yesterday/Older)
- Keep separate mobile-optimized card style for session items (larger tap targets, touch-friendly) -- don't converge with desktop ghost buttons

### Claude's Discretion
- Exact animation easing curves and timing
- Group header typography and spacing
- Session item hover/focus states on desktop
- Modal border radius and shadow intensity
- Mobile safe-area handling details

</decisions>

<specifics>
## Specific Ideas

- Session grouping should match the ChatGPT/Claude.ai sidebar pattern -- time categories are familiar
- Collapsed sidebar inspired by VS Code's activity bar -- slim, functional, icon-driven
- Glassmorphic blur on modals should be consistent with the Phase 14 patterns already in chat composer and nav-glass
- Settings should feel like a natural part of the app, not a separate "settings page" -- charcoal+rose all the way through

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `SidebarCollapsed` component (src/components/sidebar/view/subcomponents/SidebarCollapsed.tsx): Already has the collapsed strip structure -- needs content and styling updates
- `SidebarSessionItem` component: Has separate mobile/desktop rendering (md:hidden / hidden md:block pattern) -- can add grouping layer above it
- `OverlayPortal` component (src/components/ui/overlay-portal.tsx): Used by all modals for portal rendering -- no changes needed
- `nav-glass` CSS class: Glassmorphic styling for mobile nav -- extend pattern to modal backdrops
- `ScrollArea` component: Used in sidebar content for scrollable session list

### Established Patterns
- Z-index scale: --z-sticky(10), --z-overlay(40), --z-modal(50) -- Phase 14 tokens
- Glassmorphic blur: backdrop-blur-sm on sidebar (bg-background/80), backdrop-blur on nav-glass -- extend to modals
- Design system tokens: All colors use CSS variables (--background, --foreground, --primary, --accent, --muted-foreground, --border)
- Surface elevation: bg-surface-raised, bg-surface-elevated classes available
- Mobile responsive: md: breakpoint used throughout for mobile/desktop splits

### Integration Points
- `useSidebarController` hook: Central controller for sidebar state -- will need grouping logic added
- `SidebarProjectSessions` component: Currently renders flat session list -- needs time-group wrapper
- `Settings` component: Full overlay structure at src/components/settings/view/Settings.tsx -- needs color/styling pass
- `MobileNav` component: Standalone JSX component -- needs palette update
- `SidebarModals` component: Orchestrates all sidebar-related modals -- entry point for modal styling

</code_context>

<deferred>
## Deferred Ideas

- Keyboard shortcut for sidebar toggle (Cmd/Ctrl+B) -- belongs in ADV-01
- Session search and filtering -- belongs in ADV-02

</deferred>

---

*Phase: 16-sidebar-global-polish*
*Context gathered: 2026-03-03*
