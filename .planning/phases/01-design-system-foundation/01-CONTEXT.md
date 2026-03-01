# Phase 1: Design System Foundation - Context

**Gathered:** 2026-03-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish the warm earthy visual identity for the entire app: CSS variable palette with correct alpha-value contract, JetBrains Mono typography, dense 4-8px grid spacing, scrollbar styling, status colors, and fork governance (upstream-sync branch, attribution). This is the foundation every subsequent phase builds on. No component-level color migration (that's Phase 2).

</domain>

<decisions>
## Implementation Decisions

### Dark mode strategy
- **Dark only** — remove light theme entirely. No toggle, no fallback.
- Merge warm palette directly into `:root`. Remove `.dark` class, `DarkModeToggle.tsx`, and all `.dark`-scoped CSS overrides.
- Strip all Tailwind `dark:` prefixes from components in this phase (not deferred to Phase 2). Phase 1 output should be fully consistent — no dead `dark:` classes.
- No `prefers-color-scheme` respect. This is a self-hosted dev tool; warm dark is the identity.

### Surface hierarchy
- **3-tier depth model:** deeper = further back
  - **Base (#1c1210):** main background, chat area
  - **Surface 1 (#2a1f1a):** sidebar, cards, input fields
  - **Surface 2 (#3d2e25):** hover states, active items, elevated popovers
- Borders at **every tier transition** using rgba(196, 168, 130, 0.15). Not just key junctions — every surface elevation change gets a subtle border.
- Text hierarchy: cream (#f5e6d3) for body text, headings, code. Muted gold (#c4a882) for timestamps, labels, placeholder text, secondary info.

### Accent color roles
- **Claude's Discretion** — user wants an innovative, cohesive accent system rather than mechanical mapping of three hex values.
- **Personality: "Earthy craft"** — organic, textured feel. Think artisan pottery, natural dyes, hand-thrown ceramics. Clay and rust tones.
- **Interaction weight: context-dependent** — primary actions (send, confirm) should be bold/confident. Secondary actions (settings, nav items) should be subtle/understated. Two tiers of visual weight.
- **Status colors: warm but not forced** — UI status colors (success/warning/error) use warm-tinted variants per DSGN-07. But syntax highlighting and code diffs can use standard colors for readability. Function over aesthetic where it matters.
- The three reference accents from requirements (amber #d4a574, copper #c17f59, terracotta #b85c3a) are a starting point, not the final palette. Claude should design the full accent system.

### Density
- **Claude.ai density** — comfortable reading space in chat, compact controls in sidebar/settings. ~6-8px base unit.
- **Font: JetBrains Mono everywhere** — not just code blocks. Chat prose, sidebar labels, settings, all monospace. Full developer tool aesthetic.
- **Body font size: 13px** — tight, Linear-like. Works well with monospace since letter spacing is uniform.

### Claude's Discretion
- Popover/dropdown floating treatment (shadow vs 4th surface tier)
- Full accent color palette design (innovate from the earthy craft direction)
- Exact line-height and letter-spacing values for 13px JetBrains Mono
- Font loading strategy (self-host vs CDN, subsetting, FOUT handling)
- Scrollbar thumb/track exact colors (must be warm-tinted, thin)
- Fork governance implementation details (upstream-sync branch strategy, attribution format)

</decisions>

<specifics>
## Specific Ideas

- "Claude.ai-level density" and "Linear-level attention to detail" are the two reference points
- Earthy craft personality: artisan pottery, natural dyes, hand-thrown ceramics — organic and textured
- Primary actions bold, secondary actions subtle — two visual weight tiers
- The palette should feel designed, not generated
- JetBrains Mono as the universal font gives the whole app a terminal/developer tool feel

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- CSS variable system already exists in `index.css` with `:root` and `.dark` blocks (HSL format)
- Tailwind config references CSS variables: `background: "hsl(var(--background))"` etc.
- `scrollbar-thin` utility class already defined with customizable colors
- Nav glass surface utilities (`.nav-glass`, `.nav-tab-active`, `.mobile-nav-float`)
- `DarkModeToggle.tsx` exists (to be removed)

### Established Patterns
- CSS variables use HSL format: `--variable: H S% L%` consumed as `hsl(var(--variable))`
- Current alpha-value contract is BROKEN — `hsl(var(--variable))` doesn't support Tailwind opacity modifiers. Must switch to `<alpha-value>` pattern.
- Dark mode via `.dark` class (shadcn/ui pattern) — to be eliminated in favor of `:root` only
- Tailwind v3.4 with `class` dark mode strategy
- Body font currently: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`

### Integration Points
- `index.css` `:root` block: primary location for CSS variable palette
- `tailwind.config.js` `theme.extend.colors`: where semantic aliases reference CSS variables
- `index.html`: where font loading `<link>` tags would go
- 86+ component files use hardcoded Tailwind color classes AND `dark:` prefixes (both to be swept)
- `postcss.config.js`: PostCSS pipeline exists
- `DarkModeToggle.tsx`: to be removed
- Body font-family in `index.css @layer base` body rule: to be replaced with JetBrains Mono

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-design-system-foundation*
*Context gathered: 2026-03-01*
