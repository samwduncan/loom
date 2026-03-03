# Phase 14: Toast & Overlay System - Context

**Gathered:** 2026-03-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Formal layering system and non-disruptive notification infrastructure. Toasts for transient events, portals for overlays, glassmorphic blur for floating elements. WebSocket status communicated via toasts. All overlays use portal architecture with consistent z-index scale.

</domain>

<decisions>
## Implementation Decisions

### Toast behavior & styling
- Position: bottom-right, standard app notification placement
- Animation: slide up + fade in, fade out on dismiss (Sonner default)
- Auto-dismiss: 2-4 seconds per roadmap spec
- Visual: glassmorphic blur treatment (semi-transparent charcoal + backdrop-blur)
- Blur intensity: match nav glass tokens (--glass-blur: 16px, --glass-saturate: 1.4)
- Color variants: status-connected green (success), status-reconnecting amber (warning), status-error red (error), rose accent (info)
- Must not block the chat interface

### Portal & glassmorphism strategy
- Single shared portal root (#overlay-root) at document.body level for all overlays
- Glassmorphic blur applied to: toasts and dropdowns
- Modals keep solid dark overlay (bg-black/60 + blur-sm) for strong focus isolation
- Existing modals (SidebarModals, ConfirmActionModal, NewBranchModal, VersionUpgradeModal, ImageLightbox) standardized to use the portal root and consistent backdrop pattern during this phase
- Glass tokens already exist: --glass-blur, --glass-saturate, --glass-bg-opacity

### Z-index architecture
- Formalize z-index scale as CSS custom properties (Claude's discretion on exact tiers)
- Must cover: sticky headers, dropdowns, modals, toasts, critical overlays
- All existing z-index ad-hoc values (z-10/20/30/50 scattered across components) migrated to the formal scale

### WebSocket status toasts
- Disconnect triggers warning toast, reconnect triggers success toast (per TOST-03)
- Claude's discretion on debouncing, timing, and any additional transient event toasts

### Claude's Discretion
- Exact z-index tier values and naming convention
- Toast stacking behavior when multiple toasts fire simultaneously
- Sonner configuration details (theme customization, rich content support)
- WebSocket toast debouncing logic (avoid rapid fire on flaky connections)
- Dropdown glassmorphism specifics (which dropdowns, blur intensity)
- Migration order for existing modals to portal root

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. User selected recommended options throughout, indicating trust in established patterns (Sonner defaults, existing glass tokens, status color reuse).

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `--glass-blur: 16px`, `--glass-saturate: 1.4`, `--glass-bg-opacity: 0.7` — glass tokens in index.css ready for toast/dropdown use
- `--status-connected`, `--status-reconnecting`, `--status-error`, `--rose-accent` — color tokens for toast variants
- `ConnectionStatusDot` (src/components/chat/view/subcomponents/ConnectionStatusDot.tsx) — already maps ConnectionState to color classes
- `WebSocketContext` (src/contexts/WebSocketContext.tsx) — tracks `connected | reconnecting | disconnected` state, can trigger toasts on state transitions
- `SidebarModals.tsx` — 4 existing `ReactDOM.createPortal` calls to document.body, pattern to extend

### Established Patterns
- Tailwind utility classes for all styling (no CSS modules)
- `backdrop-blur-sm` already used on sidebar, nav, composer, turn toolbar — glass is an established visual language
- Surface elevation tokens: `--surface-base`, `--surface-raised`, `--surface-elevated` — toast can use elevated tier
- Transition tokens: `--transition-fast/normal/slow` available for animation timing

### Integration Points
- `WebSocketContext.tsx` onopen/onclose handlers — where to fire connect/disconnect toasts
- `index.html` — add #overlay-root div
- `App.tsx` or root layout — mount Sonner `<Toaster />` provider
- Existing modals in: SidebarModals, ConfirmActionModal, NewBranchModal, VersionUpgradeModal, ImageLightbox, ImageViewer — all need portal migration
- `CommandMenu.tsx` — has inline `zIndex: 1000`, needs migration to formal scale
- `TaskMasterPanel.tsx` — has ad-hoc notification system (useState + timeout) that could be replaced with toast calls

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 14-toast-overlay-system*
*Context gathered: 2026-03-03*
