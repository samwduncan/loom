# Phase 11: Hardcoded Color Sweep - Context

**Gathered:** 2026-03-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace every hardcoded color reference in the codebase with semantic CSS variable tokens. Zero hardcoded hex values in Tailwind arbitrary classes and zero generic gray/slate/zinc/neutral utilities remain. All visible surfaces render the charcoal + rose palette established in Phase 10.

Syntax highlighting and specialty surface theming (CodeMirror, Shiki, terminal Catppuccin) belong to Phase 12.

</domain>

<decisions>
## Implementation Decisions

### Warm-brown artifact handling
- Retain subtle warmth — the charcoal tokens already carry a 30° warm hue tint, so warm-brown hex values map to warm-charcoal equivalents, not cold neutrals
- Gold text (#c4a882) → `muted-foreground` token. No colored secondary text — everything dim goes neutral
- Cream text (#f5e6d3) → `foreground` token. Direct replacement, visually close
- Brown backgrounds (#3d2e25, #241a14, #2a1f1a) → existing 3-tier surface system (surface-base / surface-raised / surface-elevated). No new surface-deep tier

### Code surface treatment
- Code blocks and diff viewers blend into the standard charcoal surface hierarchy — no special "code-surface" tier
- Code block headers use `surface-raised` with a subtle bottom border separating from `surface-base` content area
- Add dedicated `--diff-added-bg` and `--diff-removed-bg` CSS variable tokens for diff line backgrounds (gives Phase 12 independent tuning control)
- Syntax highlighting colors (keywords, strings, links within code) are **deferred to Phase 12** — Phase 11 only sweeps structural colors (backgrounds, borders, text)

### Status & feedback colors
- Map hardcoded status hex values to existing Phase 10 tokens: error hex → `status-error`, success hex → `status-connected`, warning hex → `status-reconnecting`
- Add new `--status-info` token for links and informational text (muted blue tone) — the old #6bacce blue gets its own semantic name
- Status message backgrounds use the status token at low opacity (e.g., `bg-status-error/5`) — no explicit background variant tokens
- Status message borders use the status token at low opacity (e.g., `border-status-error/20`) — color-coded borders reinforce status type

### Gray utility mapping strategy
- **Strict mapping table** for backgrounds: gray-900/slate-900 → `surface-base`, gray-800/slate-800 → `surface-raised`, gray-700 → `surface-elevated`. Applied mechanically across the codebase
- **Add `--foreground-secondary`** token for mid-tone text: gray-300/gray-400 map here (between `foreground` bright and `muted-foreground` dim)
- **Single border token** with opacity variants: all gray/slate/zinc borders → standard `border` token (white at 8%). Use opacity modifiers (/10, /15) for emphasis variation
- **Strip light-mode dead code**: Remove all light-mode conditional gray classes (e.g., `bg-gray-100`). Loom is dark-only — these are dead code

### Hover & focus states
- **Hover backgrounds**: Step up one surface tier (base → raised, raised → elevated). Consistent visual hierarchy
- **Hover text**: Muted text brightens to `foreground` on hover. Clean brightness shift, no color change
- **Button hovers**: Follow the same surface-step-up pattern. No rose-tinted hovers — uniform behavior
- **Focus states**: Rose glow ring (`--rose-focus-glow`) on all focus states universally, including shell/terminal inputs. No exceptions

### Claude's Discretion
- Exact opacity values for status backgrounds and borders (approximate ranges given: /5-/10 for backgrounds, /20-/30 for borders)
- How to handle any edge cases in the strict mapping table (components where mechanical mapping produces wrong visual weight)
- Whether to add the `status-info` token to the Tailwind config `status` color group or keep it separate
- Handling of any remaining hardcoded colors not covered by the categories above

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- **CSS variable token system** (src/index.css): Complete 3-tier surface hierarchy, rose accent variants, status colors, nav tokens, FX tokens, glass tokens
- **Tailwind config** (tailwind.config.ts): Semantic color aliases already mapped — `background`, `foreground`, `card`, `muted`, `accent`, `surface-*`, `status-*`
- **Phase 10 foundation**: Border token (white at 8%), rose focus glow, ambient gradient, scrollbar styling all established

### Established Patterns
- **HSL color model**: All tokens use HSL values in `:root` (e.g., `--background: 30 3.8% 10.2%`), consumed via `hsl(var(--token) / <alpha-value>)` in Tailwind
- **Opacity via Tailwind alpha**: Colors support alpha modifiers (e.g., `bg-surface-base/50`) through the `<alpha-value>` pattern in config
- **Warm tint convention**: Base charcoal uses 30° hue, not pure neutral — established in Phase 10

### Integration Points
- **New tokens needed**: `--foreground-secondary`, `--diff-added-bg`, `--diff-removed-bg`, `--status-info` — add to `:root` in src/index.css and map in tailwind.config.ts
- **Files to sweep** (~40 files): Heaviest in chat/view/subcomponents (21), shell/ (8), code-editor/ (6), settings/ (6), sidebar/ (3), file-tree/ (2)
- **Current counts**: 10 files with hardcoded hex in Tailwind classes, 356 instances of generic gray/slate/zinc utilities

</code_context>

<specifics>
## Specific Ideas

- The existing charcoal tokens already have warm tinting — lean into that warmth rather than going cold/neutral when replacing warm-brown hex values
- Code blocks should feel like part of the page, not a separate embedded widget — unified surface hierarchy
- Links/info should remain visually distinct from action buttons through the dedicated info color, not rose accent
- The diff tokens (--diff-added-bg, --diff-removed-bg) are a forward investment for Phase 12 Specialty Surfaces

</specifics>

<deferred>
## Deferred Ideas

- Syntax highlighting theme (keywords, strings, etc.) — Phase 12: Specialty Surfaces
- Terminal Catppuccin Mocha theme — Phase 12: Specialty Surfaces
- CodeMirror/Shiki color remapping — Phase 12: Specialty Surfaces
- Light mode support — not planned (Loom is dark-only)

</deferred>

---

*Phase: 11-hardcoded-color-sweep*
*Context gathered: 2026-03-03*
