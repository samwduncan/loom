# Phase 10: Design System Foundation - Research

**Researched:** 2026-03-03
**Domain:** CSS design tokens, color palette, Tailwind CSS v3, CSS custom properties, CSS animations
**Confidence:** HIGH

## Summary

Phase 10 replaces Loom's warm brown/amber palette with a charcoal + dusty rose design system. The existing CSS architecture is well-structured -- 46 CSS custom properties in HSL format, a shadcn/ui-compatible Tailwind config, and clear token naming. The work is primarily a value replacement (not structural), plus adding new tokens for surface elevation aliases, FX effects, transition durations, and the ambient gradient.

The main technical risk is the `transition: none` removal. Currently, 105 Tailwind transition utility class usages across 48 component files are effectively neutered by the global `* { transition: none }` in `@layer base`. Removing it will immediately activate all those transitions. This is the desired outcome, but the custom `.transition-all`, `.transition-transform`, `.transition-opacity`, `.transition-scale`, and `.transition-shadow` overrides in index.css become redundant once Tailwind utilities work natively, and should be cleaned up.

**Primary recommendation:** Replace all :root CSS variable values in a single pass, add new token categories (surface aliases, FX, transition durations), remove the transition reset, clean up redundant manual overrides, and add ::selection / focus glow / scrollbar restyling -- all within index.css and tailwind.config.js only. No component file changes in this phase.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Primary reference: Claude.ai dark mode -- neutral charcoal, minimal accent, clean and spacious
- Secondary influence: ChatGPT (post-GPT5) -- subtle rainbow/gradient background effects (atmospheric, not functional)
- Charcoal base: very slight warm tint (#1b1a19 range), barely perceptible warmth -- not pure neutral, not obviously warm
- Dusty rose accent: ~#D4736C range for interactive elements (buttons, links, focus states)
- Lighter rose text variant: leans pink/cooler (#E8A0A0 range), must pass WCAG AA on charcoal backgrounds
- Rainbow/gradient touches are background effects only -- dusty rose remains the sole UI accent color
- Ambient page gradient: slowly shifting (30-60s CSS animation cycle), wide spectrum (rose, violet, teal, warm amber), all very muted and low opacity -- atmospheric, not loud
- Aurora shimmer: keep/enhance existing effect during streaming, also as tokens
- 3-tier surface model: base, raised, elevated
- Lightness steps: subtle 2-3% between tiers -- barely perceptible, Claude.ai-like
- Sidebar: same tier as base (page background) -- separation via subtle border/divider, not lightness
- Elevated surfaces (modals/overlays): include glassmorphic backdrop blur in addition to lightness step
- Elevation expressed through lightness only -- no drop shadows for tier separation
- Keep shadcn/ui-style names (--background, --card, --primary, etc.) -- downstream components work without migration
- Add elevation-specific aliases alongside: --surface-base, --surface-raised, --surface-elevated
- FX tokens: --fx-gradient-rose, --fx-gradient-violet, --fx-gradient-teal, --fx-aurora-* for ambient and streaming effects
- Status colors: define charcoal-appropriate muted values, updating existing --status-* tokens
- Transition duration tokens: --transition-fast (100ms), --transition-normal (200ms), --transition-slow (300ms)
- Remove global `transition: none` on `*` entirely
- Clean up manual transition overrides (.transition-all, .transition-transform, .transition-opacity, .transition-scale, .transition-shadow)
- Keep prefers-reduced-motion media query as-is
- Keep existing element-specific transitions (sidebar-transition, modal-transition, message-transition, height-transition)

### Claude's Discretion
- Exact HSL values for the 3 surface elevation tiers
- Exact HSL values for muted status colors (success/warning/error/info)
- Exact opacity values for ambient gradient colors
- Aurora shimmer token values
- Which manual transition overrides are truly redundant vs still needed
- Glassmorphic blur radius values for elevated surfaces

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DSGN-09 | Charcoal base palette with 3-4 tier surface elevation -- base (#1a1a1a), cards, elevated, overlays | HSL color calculations, surface tier definitions, token architecture |
| DSGN-10 | Dusty rose accent (~#D4736C) applied sparingly with WCAG AA-compliant lighter variant for text | WCAG contrast verification, HSL values for both rose variants |
| DSGN-11 | All hard borders replaced with subtle white at 6-10% opacity | Border token update, existing `* { border-color }` rule modification |
| DSGN-12 | Input focus glow ring (box-shadow with accent at 15% opacity) | Ring token update, focus-visible CSS patterns |
| DSGN-13 | Custom text selection color using dusty rose at 25% opacity | ::selection CSS rule (new -- does not exist yet) |
| DSGN-14 | Scrollbars themed for charcoal palette -- thin, subtle, matching dark surfaces | Scrollbar utility class update (.scrollbar-thin, .chat-input-placeholder) |
| DSGN-15 | Global `transition: none` reset resolved so Tailwind transition utilities work | Transition reset removal, manual override cleanup analysis |
</phase_requirements>

## Standard Stack

### Core (already installed, no changes needed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tailwind CSS | 3.4.17 | Utility-first CSS framework | Already configured with shadcn/ui pattern |
| PostCSS | 8.4.x | CSS processing | Required by Tailwind |
| Vite | 7.1.8 | Build tool with CSS HMR | Already configured, instant CSS feedback |
| @tailwindcss/typography | 0.5.16 | Prose content styling | Already configured for markdown rendering |

### Supporting (no new installs)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| CSS @property | Native CSS | GPU-accelerated custom property animation | Already used in aurora-shimmer.css for angle animation |
| CSS oklch() | Native CSS | Perceptually uniform color stops | Already used in aurora gradient stops |
| CSS @layer | Native CSS | Cascade layer ordering | Already used (base, components, utilities) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CSS custom properties | CSS-in-JS (styled-components, emotion) | Custom properties already established; CSS-in-JS would be a rewrite |
| HSL color format | oklch format | HSL already used throughout; oklch only for gradient stops where perceptual uniformity matters |
| Manual scrollbar CSS | tailwind-scrollbar plugin | Plugin adds dependency; manual CSS already works and is minimal |

**Installation:**
```bash
# No new dependencies needed. All work uses existing CSS and Tailwind configuration.
```

## Architecture Patterns

### Files to Modify
```
src/
  index.css                            # PRIMARY: All token values, transition fix, scrollbar, selection, focus
  components/chat/styles/
    streaming-cursor.css               # Update cursor color from #d4a574 to rose
    aurora-shimmer.css                  # Add/update token references (may stay as-is)
tailwind.config.js                     # Add surface-*, fx-*, transition-* token aliases
```

### Pattern 1: HSL Token Value Format
**What:** All CSS custom properties use bare HSL channels `H S% L%` without `hsl()` wrapper
**When to use:** Every token definition in :root
**Why:** Enables Tailwind's `<alpha-value>` pattern for per-usage opacity control
**Example:**
```css
/* Source: existing index.css pattern */
:root {
  --background: 30 3.8% 10.2%;          /* #1b1a19 -- charcoal base */
  --foreground: 0 7.8% 90%;             /* warm white text */
}
```
Usage in Tailwind: `bg-background/50` generates `background-color: hsl(30 3.8% 10.2% / 0.5)`

### Pattern 2: Surface Elevation via Parallel Aliases
**What:** Elevation-specific tokens alias into the existing shadcn structure
**When to use:** When components need explicit tier targeting beyond card/secondary
**Example:**
```css
:root {
  /* shadcn semantic tokens (primary system) */
  --background: 30 3.8% 10.2%;    /* base */
  --card: 30 3.0% 12.9%;          /* raised */
  --secondary: 30 2.8% 14.5%;     /* elevated */
  --popover: 30 2.4% 16.5%;       /* overlay */

  /* Elevation aliases (supplementary, pointing to same values) */
  --surface-base: 30 3.8% 10.2%;
  --surface-raised: 30 3.0% 12.9%;
  --surface-elevated: 30 2.4% 16.5%;
}
```

### Pattern 3: Ambient Gradient via CSS Animation + @property
**What:** Slow-cycling background gradient using registered CSS custom properties for GPU acceleration
**When to use:** Page-level atmospheric effect
**Example:**
```css
@property --ambient-hue {
  syntax: "<number>";
  initial-value: 0;
  inherits: false;
}

@keyframes ambient-cycle {
  0%   { --ambient-hue: 0; }    /* rose */
  25%  { --ambient-hue: 270; }  /* violet */
  50%  { --ambient-hue: 180; }  /* teal */
  75%  { --ambient-hue: 30; }   /* warm amber */
  100% { --ambient-hue: 0; }    /* rose (loop) */
}

/* Applied to body or #root as a very subtle radial gradient overlay */
```

### Pattern 4: FX Tokens for Gradient Colors
**What:** CSS variables for each gradient stop color, enabling ambient and aurora effects to share a palette
**When to use:** Ambient gradient, aurora shimmer, streaming effects
**Example:**
```css
:root {
  --fx-gradient-rose: 0 40% 65%;
  --fx-gradient-violet: 270 35% 60%;
  --fx-gradient-teal: 180 30% 55%;
  --fx-gradient-amber: 30 40% 60%;
  --fx-aurora-speed: 4s;
  --fx-aurora-blur: 6px;
  --fx-ambient-speed: 45s;
  --fx-ambient-opacity: 0.04;
}
```

### Anti-Patterns to Avoid
- **Hardcoding hex values in CSS:** Use `hsl(var(--token))` always. Phase 11 will hunt down all hardcoded hex in components; don't create new ones in Phase 10.
- **Using `transition` shorthand in @layer base for utilities:** Tailwind utilities use individual transition-property/duration/timing. The `* { transition: none }` shorthand overrides all three at once. Don't replace it with another shorthand; just remove it.
- **Creating separate dark/light modes:** This project is dark-only. No `:root` / `.dark` split. Single :root block.
- **Drop shadows for elevation:** Decisions explicitly state lightness-only elevation. No `box-shadow` for tier separation (glow effects for focus states are allowed).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| WCAG contrast checking | Custom contrast calculator | Pre-verified values (see table below) | Already calculated -- just use the verified HSL values |
| CSS transition system | Custom transition utility classes | Tailwind's built-in `transition-*` + `duration-*` | 105 existing usages across 48 files already use Tailwind classes |
| Scrollbar styling | JavaScript scrollbar library | Native CSS `scrollbar-width` + `::-webkit-scrollbar` | Already implemented in index.css, just needs color update |
| Color format conversion | Runtime HSL/RGB conversion | Pre-computed HSL values in :root | All conversion done at research time, values ready to paste |

**Key insight:** Phase 10 is a value-replacement phase, not a structural phase. The CSS architecture (token system, Tailwind wiring, layer ordering) is already correct. Don't restructure -- just update values and add new tokens.

## Common Pitfalls

### Pitfall 1: Transition Avalanche After Reset Removal
**What goes wrong:** Removing `* { transition: none }` instantly activates 105 Tailwind transition utility usages. Some may produce unwanted animations on mount, page load, or state changes that weren't visible before.
**Why it happens:** Those transition classes were always in the DOM but neutered. Now they work.
**How to avoid:** After removing `transition: none`, also remove the manual `.transition-all`, `.transition-transform`, `.transition-opacity`, `.transition-scale`, `.transition-shadow` overrides in @layer base. These were workarounds for the reset. With the reset gone, Tailwind's native utilities handle everything. Keep the element-specific named transitions (`.sidebar-transition`, `.modal-transition`, `.message-transition`, `.height-transition`) as they encode specific durations/easings.
**Warning signs:** Elements animating on page load or state change where they didn't before.

### Pitfall 2: Border Opacity Mismatch
**What goes wrong:** The existing `* { border-color: hsl(var(--border) / 0.15) }` uses `--border` which is currently `34.5 35.9% 63.9%` (warm gold). Changing `--border` to a white/neutral value changes the computed color at 15% opacity, but the requirement says 6-10% opacity.
**Why it happens:** The border opacity is baked into the global `*` rule, not the token itself.
**How to avoid:** Update BOTH the `--border` token value AND the opacity in the `*` rule simultaneously. New rule: `* { border-color: hsl(var(--border) / 0.08) }` with `--border` set to near-white (`0 0% 100%` or similar).
**Warning signs:** Borders appearing either invisible or too prominent.

### Pitfall 3: Interactive Element Transition Override
**What goes wrong:** The `button, a, input, textarea, select, [role="button"], .transition-all` rule in @layer base (line 162-170) applies `transition: all 150ms` as a catch-all. After removing `transition: none`, this rule still applies to ALL buttons/links/inputs. Combined with Tailwind utility classes, this creates conflicting transition definitions.
**Why it happens:** Two sources of truth: the @layer base rule and Tailwind utility classes.
**How to avoid:** Consider simplifying the @layer base interactive element rule to only set `transition-property: color, background-color, border-color, opacity, box-shadow, transform` (matching Tailwind's `transition` class) rather than `all`. Or remove it entirely and let Tailwind utility classes on each component handle transitions. The safest approach is to keep it but change `all` to specific properties, since it provides good defaults for elements that don't have explicit Tailwind transition classes.
**Warning signs:** Double-duration animations, unexpected properties transitioning.

### Pitfall 4: Scrollbar Color Hardcoded in Multiple Places
**What goes wrong:** Scrollbar colors are hardcoded HSL values (not using CSS variables) in multiple places: `.scrollbar-thin` and `.chat-input-placeholder` both use `hsl(34.5 35.9% 63.9% / 0.3)` directly.
**Why it happens:** Scrollbar pseudo-elements have limited CSS variable support in some browsers, so the original code hardcoded values.
**How to avoid:** Replace the hardcoded HSL values directly. Modern browsers (Chrome 90+, Firefox 64+) support CSS variables in scrollbar styles. Use `hsl(var(--muted-foreground) / 0.2)` or define a dedicated `--scrollbar-thumb` token.
**Warning signs:** Warm gold scrollbar thumbs remaining after palette swap.

### Pitfall 5: Streaming Cursor Color Hardcoded
**What goes wrong:** The streaming cursor in `streaming-cursor.css` uses `color: #d4a574` (hardcoded amber hex), not a CSS variable.
**Why it happens:** It was a quick implementation that bypassed the token system.
**How to avoid:** Replace with `color: hsl(var(--primary))` or `color: hsl(var(--accent))` so it automatically picks up the new rose accent.
**Warning signs:** Amber blinking cursor appearing against charcoal background.

### Pitfall 6: Select Dropdown Arrow SVG Hardcoded
**What goes wrong:** The `select` element's dropdown arrow SVG in index.css (line 628) uses `stroke='%23c4a882'` (URL-encoded warm gold hex).
**Why it happens:** SVG data URIs can't reference CSS variables.
**How to avoid:** Replace the hardcoded hex in the SVG data URI with the new muted foreground color. This is a known limitation -- SVG data URIs don't support `var()`. Must update the hex manually.
**Warning signs:** Warm gold dropdown arrow on select elements.

## Code Examples

### Complete :root Token Replacement

Verified HSL values with WCAG contrast ratios calculated against the charcoal base:

```css
/* Source: Direct calculation from hex values in CONTEXT.md */
:root {
  /* Surface hierarchy -- 3-tier depth model + overlay */
  --background: 30 3.8% 10.2%;          /* #1b1a19 -- base layer (warm-tinted charcoal) */
  --foreground: 0 10% 88%;              /* #e4dbd9 -- warm white primary text */

  --card: 30 3.0% 12.9%;               /* #222120 -- raised surface (+2.7%) */
  --card-foreground: 0 10% 88%;         /* matches foreground */

  --popover: 30 2.4% 16.5%;            /* #2b2a29 -- elevated surface (+6.3%) */
  --popover-foreground: 0 10% 88%;     /* matches foreground */

  --primary: 4 54.7% 62.7%;            /* #D4736C -- dusty rose accent */
  --primary-foreground: 30 3.8% 10.2%; /* charcoal text on rose buttons */

  --secondary: 30 2.8% 14.5%;          /* #252423 -- between raised and elevated */
  --secondary-foreground: 0 10% 88%;

  --muted: 30 2.8% 14.5%;              /* same as secondary */
  --muted-foreground: 0 3% 59%;        /* #989494 -- dim text */

  --accent: 4 54.7% 62.7%;             /* same as primary -- rose is the sole accent */
  --accent-foreground: 0 10% 88%;

  --destructive: 0 50% 50%;            /* #bf4040 -- muted red, charcoal-appropriate */
  --destructive-foreground: 0 10% 88%;

  --border: 0 0% 100%;                 /* pure white -- used at 8% opacity via global rule */
  --input: 30 3.0% 12.9%;              /* raised surface */
  --ring: 4 54.7% 62.7%;               /* dusty rose focus ring */

  /* Surface elevation aliases */
  --surface-base: 30 3.8% 10.2%;
  --surface-raised: 30 3.0% 12.9%;
  --surface-elevated: 30 2.4% 16.5%;

  /* Status colors -- muted for charcoal palette */
  --status-connected: 140 35% 50%;     /* muted green */
  --status-reconnecting: 35 50% 55%;   /* muted amber */
  --status-disconnected: 0 40% 50%;    /* muted red */
  --status-error: 0 45% 48%;           /* darker muted red */

  /* FX tokens -- ambient gradient palette */
  --fx-gradient-rose: 0 40% 65%;
  --fx-gradient-violet: 270 35% 60%;
  --fx-gradient-teal: 180 30% 55%;
  --fx-gradient-amber: 30 40% 60%;
  --fx-ambient-speed: 45s;
  --fx-ambient-opacity: 0.04;

  /* FX tokens -- aurora shimmer */
  --fx-aurora-speed: 4s;
  --fx-aurora-blur: 6px;
  --fx-aurora-pulse-min: 0.3;
  --fx-aurora-pulse-max: 0.6;

  /* Transition duration tokens */
  --transition-fast: 100ms;
  --transition-normal: 200ms;
  --transition-slow: 300ms;

  /* Glassmorphic tokens */
  --glass-blur: 16px;
  --glass-saturate: 1.4;
  --glass-bg-opacity: 0.7;

  /* Rose accent variants */
  --rose-accent: 4 54.7% 62.7%;        /* #D4736C -- interactive elements */
  --rose-text: 352 50% 75%;            /* #DFA0A8 -- WCAG AA text on charcoal (8.07:1) */
  --rose-focus-glow: 4 54.7% 62.7%;    /* same as accent, used at 15% opacity */
  --rose-selection: 4 54.7% 62.7%;     /* same as accent, used at 25% opacity */
}
```

### WCAG Contrast Verification Table

| Color | Hex | On #1b1a19 | WCAG AA (4.5:1) | WCAG AA Large (3:1) |
|-------|-----|-----------|-----------------|---------------------|
| Dusty rose accent | #D4736C | 5.35:1 | PASS | PASS |
| Light rose text | #E8A0A0 | 8.25:1 | PASS | PASS |
| Cool pink rose text | #DFA0A8 | 8.07:1 | PASS | PASS |
| Foreground white | ~#e4dbd9 | ~13.0:1 | PASS | PASS |
| Muted foreground | ~#989494 | ~5.1:1 | PASS | PASS |
| Light rose on raised | #E8A0A0 on #222120 | 7.63:1 | PASS | PASS |
| Light rose on elevated | #E8A0A0 on #2b2a29 | 6.80:1 | PASS | PASS |

Note: The STATE.md blocker about "#D4736C on #1a1a1a = 4.2:1 failing" appears to have been calculated incorrectly. Our verification shows 5.36:1 which passes WCAG AA. The warm-tinted charcoal #1b1a19 is essentially the same at 5.35:1. The lighter rose variant (#E8A0A0 range) is well above threshold at 8.25:1.

### Border Update
```css
/* Source: index.css line 105 -- change opacity from 0.15 to 0.08 */
* {
  border-color: hsl(var(--border) / 0.08);
  box-sizing: border-box;
  /* transition: none -- REMOVED */
}
```

### Text Selection
```css
/* Source: New rule -- does not exist yet */
::selection {
  background-color: hsl(var(--primary) / 0.25);
  color: hsl(var(--foreground));
}

::-moz-selection {
  background-color: hsl(var(--primary) / 0.25);
  color: hsl(var(--foreground));
}
```

### Focus Glow Ring
```css
/* Source: Update existing focus-visible rules */
input:focus-visible,
textarea:focus-visible,
select:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px hsl(var(--background)),
              0 0 0 4px hsl(var(--ring) / 0.15);
}
```

### Scrollbar Update
```css
/* Source: Replace hardcoded HSL values in .scrollbar-thin */
.scrollbar-thin {
  scrollbar-width: thin;
  scrollbar-color: hsl(var(--muted-foreground) / 0.2) transparent;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background-color: hsl(var(--muted-foreground) / 0.2);
  border-radius: 3px;
}

.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background-color: hsl(var(--muted-foreground) / 0.35);
}
```

### Ambient Gradient (New CSS)
```css
/* Source: New -- ambient background effect */
@property --ambient-hue {
  syntax: "<number>";
  initial-value: 0;
  inherits: false;
}

@keyframes ambient-cycle {
  0%   { --ambient-hue: 0; }     /* rose */
  25%  { --ambient-hue: 270; }   /* violet */
  50%  { --ambient-hue: 180; }   /* teal */
  75%  { --ambient-hue: 35; }    /* warm amber */
  100% { --ambient-hue: 360; }   /* rose (wrap) */
}

.ambient-gradient {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background: radial-gradient(
    ellipse at 50% 0%,
    hsl(var(--ambient-hue) 35% 55% / var(--fx-ambient-opacity, 0.04)) 0%,
    transparent 70%
  );
  animation: ambient-cycle var(--fx-ambient-speed, 45s) linear infinite;
}

@media (prefers-reduced-motion: reduce) {
  .ambient-gradient {
    animation: none;
    background: radial-gradient(
      ellipse at 50% 0%,
      hsl(0 35% 55% / 0.03) 0%,
      transparent 70%
    );
  }
}
```

### Tailwind Config Additions
```js
// Source: tailwind.config.js -- add to colors.extend
surface: {
  base: "hsl(var(--surface-base) / <alpha-value>)",
  raised: "hsl(var(--surface-raised) / <alpha-value>)",
  elevated: "hsl(var(--surface-elevated) / <alpha-value>)",
},
// Transition duration tokens accessible via Tailwind
// transitionDuration: { fast: 'var(--transition-fast)', normal: 'var(--transition-normal)', slow: 'var(--transition-slow)' }
// Note: Tailwind already supports duration-100, duration-200, duration-300 natively
// Custom tokens are for CSS usage; Tailwind classes use the built-in values
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `transition: none` on `*` | No global transition reset | Phase 10 | 105 Tailwind transition utilities start working |
| Warm brown HSL (#1c1210) | Warm-tinted charcoal (#1b1a19) | Phase 10 | Entire app shifts to dark charcoal base |
| Amber accent (#d4a574) | Dusty rose accent (#D4736C) | Phase 10 | Interactive elements shift from warm gold to rose |
| Cream text (#f5e6d3) | Warm white (#e4dbd9) | Phase 10 | Text becomes more neutral, less overtly warm |
| Warm gold borders (15% opacity) | White borders (8% opacity) | Phase 10 | Subtler, more premium border treatment |
| No text selection styling | Rose selection at 25% | Phase 10 | Branded selection color |
| No ambient gradient | Slow-cycling atmospheric gradient | Phase 10 | ChatGPT-inspired atmospheric background effect |

**Deprecated/outdated:**
- Custom `.transition-all`, `.transition-transform`, `.transition-opacity`, `.transition-scale`, `.transition-shadow` classes in @layer base: Redundant once `transition: none` is removed. Tailwind's native utility classes handle these.
- Warm gold scrollbar hex values: Replaced with token-based muted foreground references.

## Transition Fix Analysis

### What the `transition: none` Reset Does
Line 107 of index.css: `* { transition: none; }` in `@layer base`.

This sets the CSS `transition` shorthand to `none`, which is equivalent to:
- `transition-property: none`
- `transition-duration: 0s`
- `transition-timing-function: ease`
- `transition-delay: 0s`

### Why Tailwind Utilities Still Work (Sometimes)
Tailwind utility classes are generated in `@layer utilities`, which has higher cascade priority than `@layer base`. So `transition-all` (Tailwind) does override `transition: none` (base). **However**, the custom `.transition-all` etc. definitions on lines 168-189 of index.css are ALSO in `@layer base`, creating confusion about which source of truth is active.

### Cleanup Strategy
1. **Remove:** `transition: none` from `* {}` block (line 107)
2. **Remove:** Custom `.transition-all`, `.transition-transform`, `.transition-opacity`, `.transition-scale`, `.transition-shadow` classes (lines 168-189) -- Tailwind handles these natively
3. **Keep:** Interactive element defaults (lines 162-167: `button, a, input...`) -- provides sensible defaults for elements without explicit Tailwind classes
4. **Keep:** Named transitions: `.sidebar-transition`, `.modal-transition`, `.message-transition`, `.height-transition` -- these encode specific multi-property transitions with custom easings
5. **Keep:** Hover/active duration overrides (lines 207-218) -- reasonable UX defaults
6. **Keep:** Focus-visible transitions (lines 220-227) -- accessibility
7. **Keep:** `@media (prefers-reduced-motion: reduce)` (lines 193-202) -- accessibility requirement

### Manual Overrides: Redundant vs Keep

| Override | Lines | Verdict | Reason |
|----------|-------|---------|--------|
| `.transition-all` | 168-170 | REMOVE | Tailwind `transition-all` does the same |
| `.transition-transform` | 173-175 | REMOVE | Tailwind `transition-transform` does the same |
| `.transition-opacity` | 178-180 | REMOVE | Tailwind `transition-opacity` does the same |
| `.transition-scale` | 183-185 | REMOVE | Maps to `transition-transform` with different duration; component-specific |
| `.transition-shadow` | 188-190 | REMOVE | Tailwind `transition-shadow` does the same |
| `.sidebar-transition` | 231-233 | KEEP | Multi-property with specific easing |
| `.modal-transition` | 273-275 | KEEP | Multi-property with specific easing |
| `.message-transition` | 279-281 | KEEP | Multi-property with specific easing |
| `.height-transition` | 285-287 | KEEP | Multi-property with specific easing |
| button/a/input defaults | 162-170 | SIMPLIFY | Keep but remove `.transition-all` from selector list |

## Nav Token Updates

The nav design tokens (lines 64-73 of index.css) need value updates:

```css
/* Nav design tokens -- charcoal + rose palette */
--nav-glass-bg: 30 3.0% 12.9% / 0.7;       /* raised surface, semi-transparent */
--nav-glass-blur: 16px;                       /* use --glass-blur token */
--nav-glass-saturate: 1.4;                    /* use --glass-saturate token */
--nav-tab-glow: 4 54.7% 62.7% / 0.25;       /* rose glow */
--nav-tab-ring: 4 54.7% 62.7% / 0.15;       /* rose ring */
--nav-float-shadow: 0 0% 0% / 0.35;          /* unchanged -- black shadow */
--nav-float-ring: 30 2.8% 14.5% / 0.3;      /* elevated surface ring */
--nav-divider-color: 0 0% 100% / 0.08;       /* white at 8% -- matches borders */
--nav-input-bg: 30 2.8% 14.5% / 0.5;        /* secondary surface */
--nav-input-focus-ring: 4 54.7% 62.7% / 0.25; /* rose focus */
```

## Open Questions

1. **Ambient gradient implementation location**
   - What we know: The gradient needs to be a fixed, full-viewport overlay with pointer-events: none
   - What's unclear: Should it be a CSS class applied to body/`#root`, or a dedicated div in the React component tree?
   - Recommendation: Add a CSS class `.ambient-gradient` in index.css, then apply it to a new sibling `<div>` inside `#root` (before `<App />`), or apply as a `::before` pseudo-element on body. The pseudo-element approach avoids React component tree changes.

2. **Interactive element transition defaults scope**
   - What we know: The `button, a, input...` rule provides transition defaults for all interactive elements
   - What's unclear: After removing `transition: none`, will any elements get unwanted animations from this catch-all rule?
   - Recommendation: Change `transition: all 150ms` to `transition-property: color, background-color, border-color, opacity, box-shadow; transition-duration: 150ms; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1)` to avoid transitioning `transform`, `width`, `height` etc. by default.

## Project Tooling

| Tool | Command | Detected From |
|------|---------|---------------|
| Lint | Not detected | No eslint config found |
| Type Check | `npm run typecheck` | package.json scripts |
| Build | `npm run build` | package.json scripts |
| Test | Not detected | No test script found |

*Written to `.planning/config.json` under `tooling` key for executor use.*

## Sources

### Primary (HIGH confidence)
- `/home/swd/loom/src/index.css` -- Complete existing CSS token system (46 variables), transition rules, scrollbar styles, all manually inspected
- `/home/swd/loom/tailwind.config.js` -- Existing Tailwind configuration with shadcn/ui color wiring
- `/home/swd/loom/src/components/chat/styles/aurora-shimmer.css` -- Existing aurora gradient implementation using @property and oklch
- `/home/swd/loom/src/components/chat/styles/streaming-cursor.css` -- Hardcoded amber cursor color
- `/home/swd/loom/src/main.jsx` -- CSS import order, dark mode setup

### Secondary (MEDIUM confidence)
- WCAG contrast ratios: Calculated programmatically using W3C luminance algorithm -- verified multiple combinations
- Tailwind CSS v3.4 transition utility behavior: Based on Tailwind documentation and @layer cascade ordering
- CSS @property specification: Based on existing working usage in aurora-shimmer.css

### Tertiary (LOW confidence)
- Ambient gradient implementation pattern: Based on general CSS knowledge. No specific reference implementation consulted. The @property approach for hue animation is verified by the existing aurora-shimmer.css precedent, but the specific radial-gradient + fixed overlay pattern should be tested.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all tools already installed and configured, no new dependencies
- Architecture: HIGH -- existing CSS architecture well-understood from direct inspection of all 3 CSS files and tailwind.config.js
- Color values: HIGH -- all HSL values calculated programmatically with WCAG verification
- Transition fix: HIGH -- source code directly inspected, cascade layer behavior well-understood
- Ambient gradient: MEDIUM -- pattern is sound but specific visual tuning (opacity, speed, gradient shape) needs visual testing
- Pitfalls: HIGH -- identified from direct codebase inspection (hardcoded values found via grep)

**Research date:** 2026-03-03
**Valid until:** 2026-04-03 (stable domain -- CSS custom properties and Tailwind v3 are mature)
