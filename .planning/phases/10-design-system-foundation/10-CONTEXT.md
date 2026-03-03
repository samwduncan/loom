# Phase 10: Design System Foundation - Context

**Gathered:** 2026-03-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace the warm brown/amber palette with a charcoal base + dusty rose accent. Establish the CSS variable token system (colors, surfaces, transitions, effects) that all subsequent v1.1 phases build on. Fix the global transition reset. This phase does NOT migrate hardcoded hex values (Phase 11) or restyle specialty surfaces (Phase 12).

</domain>

<decisions>
## Implementation Decisions

### Palette & Visual References
- Primary reference: Claude.ai dark mode — neutral charcoal, minimal accent, clean and spacious
- Secondary influence: ChatGPT (post-GPT5) — subtle rainbow/gradient background effects (atmospheric, not functional)
- Charcoal base: very slight warm tint (#1b1a19 range), barely perceptible warmth — not pure neutral, not obviously warm
- Dusty rose accent: ~#D4736C range for interactive elements (buttons, links, focus states)
- Lighter rose text variant: leans pink/cooler (#E8A0A0 range), must pass WCAG AA on charcoal backgrounds
- Rainbow/gradient touches are background effects only — dusty rose remains the sole UI accent color
- Ambient page gradient: slowly shifting (30-60s CSS animation cycle), wide spectrum (rose, violet, teal, warm amber), all very muted and low opacity — atmospheric, not loud
- Aurora shimmer: keep/enhance existing effect during streaming, also as tokens

### Surface Elevation
- 3-tier model: base, raised, elevated
- Lightness steps: subtle 2-3% between tiers — barely perceptible, Claude.ai-like
- Sidebar: same tier as base (page background) — separation via subtle border/divider, not lightness
- Elevated surfaces (modals/overlays): include glassmorphic backdrop blur in addition to lightness step
- Elevation expressed through lightness only — no drop shadows for tier separation

### Token Architecture
- Keep shadcn/ui-style names (--background, --card, --primary, etc.) — downstream components work without migration
- Add elevation-specific aliases alongside: --surface-base, --surface-raised, --surface-elevated
- FX tokens: --fx-gradient-rose, --fx-gradient-violet, --fx-gradient-teal, --fx-aurora-* for ambient and streaming effects
- Status colors (success, warning, error, info): define charcoal-appropriate muted values now, updating existing --status-* tokens
- Transition duration tokens: --transition-fast (100ms), --transition-normal (200ms), --transition-slow (300ms)

### Transition Fix
- Remove global `transition: none` on `*` entirely — no longer needed with stable palette
- Clean up manual transition overrides (.transition-all, .transition-transform, .transition-opacity, .transition-scale, .transition-shadow) since they become unnecessary
- Keep the prefers-reduced-motion media query as-is (accessibility requirement)
- Keep existing element-specific transitions (button:hover duration, sidebar-transition, modal-transition, message-transition, height-transition)

### Claude's Discretion
- Exact HSL values for the 3 surface elevation tiers
- Exact HSL values for muted status colors (success/warning/error/info)
- Exact opacity values for ambient gradient colors
- Aurora shimmer token values
- Which manual transition overrides are truly redundant vs still needed
- Glassmorphic blur radius values for elevated surfaces

</decisions>

<specifics>
## Specific Ideas

- "Most heavily towards Claude.ai with hints of the rainbow and gradients from post-GPT5 ChatGPT"
- Ambient gradient should include the wider color spectrum that ChatGPT uses (not just rose family)
- Very very slight warm tint on the charcoal — not pure neutral, but barely noticeable
- Lighter rose text variant should lean pink/cooler, not salmon/warm

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `index.css` (:root block): Full HSL-based CSS variable system already in place — values need replacing, structure stays
- `tailwind.config.js`: Already wires CSS variables via `hsl(var(--xxx))` pattern — no config changes needed for palette swap
- `.scrollbar-thin` utility class: Exists with warm gold colors, needs color update
- `.nav-glass` utility: Glassmorphic blur already implemented — needs token update
- Aurora shimmer CSS (`chat/styles/aurora-shimmer.css`): Existing streaming effect to enhance
- Streaming cursor CSS (`chat/styles/streaming-cursor.css`): Existing streaming visual

### Established Patterns
- HSL color format: All tokens use `H S% L%` format (no alpha in variable, alpha applied at usage site)
- shadcn/ui semantic naming: --background, --foreground, --card, --primary, --secondary, --muted, --accent, --destructive, --border, --input, --ring
- Alpha via Tailwind: Colors use `<alpha-value>` placeholder in tailwind.config.js for opacity support
- Status token pattern: --status-connected, --status-reconnecting, --status-disconnected, --status-error

### Integration Points
- `index.css` :root block: Where all CSS variable values live — primary edit target
- `tailwind.config.js` colors.extend: Where new token aliases (surface-base, etc.) need to be registered
- 144+ hardcoded hex refs across 15 source files: NOT this phase's concern (Phase 11), but token system must support the migration
- `transition: none` on `*` (index.css:107): Must be removed, along with dependent manual overrides

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 10-design-system-foundation*
*Context gathered: 2026-03-03*
