# Phase 1: Design System Foundation - Research

**Researched:** 2026-03-01
**Domain:** CSS design tokens, Tailwind CSS theming, typography, fork governance
**Confidence:** HIGH

## Summary

Phase 1 transforms the existing shadcn/ui-derived blue/gray palette into a warm earthy dark-only theme. The core technical challenge is fixing the broken `<alpha-value>` CSS variable contract so Tailwind opacity modifiers (`bg-primary/50`) actually work, while simultaneously replacing every color token with the new warm palette. The existing CSS variable system in `index.css` and Tailwind config in `tailwind.config.js` already follow the shadcn/ui pattern (`:root` + `.dark` blocks, `hsl(var(--variable))` references), so the migration is structural, not architectural. The `.dark` class, `DarkModeToggle.tsx`, `ThemeContext.jsx`, and all `dark:` prefixes must be removed since Loom is dark-only.

JetBrains Mono is available on Google Fonts (v24, 8 weights, variable font) and can be loaded via a single `<link>` tag in `index.html`. The font replaces the current system sans-serif stack for all text in the app, establishing the developer-tool aesthetic.

Fork governance requires an `upstream-sync` branch tracking the CloudCLI repo verbatim, a baseline tag on the current fork commit, and a GPL-3.0 ATTRIBUTION file crediting CloudCLI authors. The existing LICENSE file is already GPL-3.0.

**Primary recommendation:** Fix the alpha-value contract first (CSS variables as bare HSL channels, Tailwind config using `hsl(var(--variable) / <alpha-value>)`), then replace palette values, then remove dark mode toggling, then typography/density, then fork governance.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Dark mode strategy:** Dark only -- remove light theme entirely. No toggle, no fallback. Merge warm palette directly into `:root`. Remove `.dark` class, `DarkModeToggle.tsx`, and all `.dark`-scoped CSS overrides. Strip all Tailwind `dark:` prefixes from components in this phase. No `prefers-color-scheme` respect.
- **Surface hierarchy:** 3-tier depth model -- Base (#1c1210), Surface 1 (#2a1f1a), Surface 2 (#3d2e25). Borders at every tier transition using rgba(196, 168, 130, 0.15). Text hierarchy: cream (#f5e6d3) body text, muted gold (#c4a882) secondary text.
- **Density:** Claude.ai density -- comfortable reading space in chat, compact controls in sidebar/settings. ~6-8px base unit. Font: JetBrains Mono everywhere. Body font size: 13px.
- **Status colors: warm but not forced** -- UI status colors use warm-tinted variants per DSGN-07. Syntax highlighting and code diffs can use standard colors for readability.

### Claude's Discretion
- Popover/dropdown floating treatment (shadow vs 4th surface tier)
- Full accent color palette design (innovate from the earthy craft direction)
- Exact line-height and letter-spacing values for 13px JetBrains Mono
- Font loading strategy (self-host vs CDN, subsetting, FOUT handling)
- Scrollbar thumb/track exact colors (must be warm-tinted, thin)
- Fork governance implementation details (upstream-sync branch strategy, attribution format)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DSGN-01 | App uses warm earthy CSS palette -- deep chocolate brown base, warm surfaces, cream/beige text, amber/copper/terracotta accents | HSL conversions computed, alpha-value contract pattern documented, surface hierarchy defined |
| DSGN-02 | All CSS variables use correct HSL `<alpha-value>` contract so Tailwind opacity modifiers work | Context7 Tailwind v3 docs confirm bare-channel pattern; current codebase confirmed broken |
| DSGN-03 | Typography uses JetBrains Mono as primary monospace font with fallback chain | Google Fonts CDN link confirmed (v24, 8 weights), font-display: swap, fallback chain documented |
| DSGN-04 | Layout follows dense 4-8px grid spacing -- compact padding, tight line heights | 13px base size locked, line-height/letter-spacing recommendations provided |
| DSGN-05 | Scrollbar styling matches warm dark theme (subtle, thin, warm-tinted track and thumb) | Existing `.scrollbar-thin` utility found, warm color values computed |
| DSGN-07 | Status colors are warm-tinted -- connected, reconnecting, disconnected, error | HSL values computed for warm-tinted status colors |
| DSGN-08 | Borders use subtle rgba transparency for warm-tinted separation lines | Border color from CONTEXT.md: rgba(196, 168, 130, 0.15) |
| FORK-04 | Upstream-sync branch established and documented | Branch strategy documented, upstream remote pattern defined |
| FORK-05 | GPL-3.0 license maintained with proper attribution | Existing LICENSE is GPL-3.0 (confirmed), ATTRIBUTION file format documented |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tailwind CSS | 3.4.17 (installed) | Utility-first CSS framework with design token system | Already in project; CSS variables + theme.extend.colors pattern is the standard way to theme |
| PostCSS | 8.5.6 (installed) | CSS processing pipeline | Already configured with Tailwind and Autoprefixer |
| Vite | 7.1.8 (installed) | Build tool, dev server, CSS pipeline | Already configured; handles PostCSS/Tailwind processing automatically |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| JetBrains Mono | v24 (Google Fonts) | Primary font for entire app | Loaded via `<link>` in index.html; no npm package needed |
| Google Fonts CDN | N/A | Font delivery | `fonts.googleapis.com` with `font-display: swap` for FOUT prevention |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Google Fonts CDN | Self-hosted woff2 files | Self-hosting avoids external dependency but adds build complexity and ~200KB to repo. CDN has global edge cache and browser-level font cache sharing. **Recommendation: Use Google Fonts CDN** for simplicity; self-host later if performance audit warrants it. |
| Bare HSL channels in CSS vars | oklch or modern color spaces | oklch is perceptually uniform (better for generating palettes) but has no Tailwind v3 alpha-value support out of the box. Stick with HSL for Tailwind v3 compatibility. |

**Installation:**
No new npm packages required. JetBrains Mono loaded via HTML `<link>` tag.

## Architecture Patterns

### Recommended CSS Variable Structure

The current broken pattern:
```css
/* BROKEN -- hsl() wrapping prevents Tailwind opacity modifiers */
:root {
  --background: 222.2 84% 4.9%;
}
/* In tailwind.config.js: */
background: "hsl(var(--background))"
/* Result: bg-background/50 does NOT apply 50% opacity */
```

The fixed pattern (from Tailwind v3 official docs):
```css
/* CORRECT -- bare channels, no hsl() wrapper in CSS variable */
:root {
  --background: 10 27.3% 8.6%;  /* #1c1210 base */
}
```
```javascript
// In tailwind.config.js:
background: "hsl(var(--background) / <alpha-value>)"
// Result: bg-background/50 correctly renders at 50% opacity
```

Source: Context7 /websites/v3_tailwindcss - "Define your CSS variables as channels with no color space function. Don't include the color space function or opacity modifiers won't work."

### Pattern 1: Dark-Only Theme (No Toggle)

**What:** Merge all color tokens into `:root` directly. Remove `.dark` class, `DarkModeToggle.tsx`, `ThemeContext.jsx` toggle logic, and all `dark:` Tailwind prefixes.

**When to use:** When the app has a single visual identity with no light/dark switching.

**Implementation:**
```css
@layer base {
  :root {
    /* Warm earthy palette -- dark only, no .dark class needed */
    --background: 10 27.3% 8.6%;          /* #1c1210 base */
    --foreground: 33.5 63% 89.4%;         /* #f5e6d3 cream */
    --card: 18.8 23.5% 13.3%;             /* #2a1f1a surface-1 */
    --card-foreground: 33.5 63% 89.4%;    /* #f5e6d3 cream */
    --popover: 18.8 23.5% 13.3%;          /* #2a1f1a surface-1 */
    --popover-foreground: 33.5 63% 89.4%; /* #f5e6d3 cream */
    --muted: 22.5 24.5% 19.2%;            /* #3d2e25 surface-2 */
    --muted-foreground: 34.5 35.9% 63.9%; /* #c4a882 muted gold */
    /* ... accent, primary, secondary, destructive, etc. */
    --border: 34.5 35.9% 63.9% / 0.15;    /* warm border -- NOTE: special handling */
    --radius: 0.5rem;
  }
  /* NO .dark {} block */
}
```

**Border color note:** The border color `rgba(196, 168, 130, 0.15)` includes alpha. For Tailwind's `border-border` to work with this, the `--border` variable needs special handling: either bake the opacity into the variable value (and accept that `border-border/50` won't further modify it), or use a separate `--border-opacity` variable. **Recommendation:** Define `--border` as `34.5 35.9% 63.9%` (bare channels) and apply the 0.15 opacity via Tailwind's `/15` modifier or a utility class. This preserves the alpha-value contract.

**Tailwind config change:**
```javascript
darkMode: ["class"],  // REMOVE this line entirely (or set to "media" -- irrelevant since no dark: prefixes remain)
```

### Pattern 2: Surface Hierarchy Token Naming

**What:** Name CSS variables by their semantic role, not their visual appearance.

```css
:root {
  /* Surface depth: deeper number = further back */
  --background: 10 27.3% 8.6%;       /* Base layer -- chat area, main bg */
  --card: 18.8 23.5% 13.3%;          /* Surface 1 -- sidebar, cards, inputs */
  --muted: 22.5 24.5% 19.2%;         /* Surface 2 -- hover, active, popovers */

  /* Text hierarchy */
  --foreground: 33.5 63% 89.4%;      /* Primary text -- body, headings, code */
  --muted-foreground: 34.5 35.9% 63.9%; /* Secondary text -- timestamps, labels, placeholders */
}
```

This maps cleanly to the 3-tier depth model from CONTEXT.md decisions.

### Pattern 3: Accent Color System (Claude's Discretion)

**What:** Design a cohesive accent palette from the "earthy craft" direction.

**Recommended accent system:**

| Role | Color | HSL | Hex | Usage |
|------|-------|-----|-----|-------|
| Primary accent (amber) | Warm amber | 30.6 52.7% 64.3% | #d4a574 | Primary actions (send, confirm), active nav items |
| Secondary accent (copper) | Rich copper | 21.9 45.6% 55.3% | #c17f59 | Secondary actions, links, focus rings |
| Emphasis accent (terracotta) | Deep terracotta | 16.2 52.1% 47.5% | #b85c3a | Destructive actions, error tints, strong emphasis |
| Hover tint | Lighter amber | ~32 55% 72% | ~#ddb98a | Hover state brightening of primary accent |
| Subtle accent | Muted warm | ~30 25% 25% | ~#4d3c2f | Subtle backgrounds, selected states |

**Two-tier visual weight:**
- **Bold tier:** Primary actions use amber at full saturation with visible contrast. Send button, confirm dialogs, active tabs.
- **Subtle tier:** Secondary actions use copper at reduced opacity or muted warm tones. Settings icons, nav labels, metadata links.

### Anti-Patterns to Avoid

- **Hardcoded hex/rgb in components:** Never write `bg-[#1c1210]` or `style={{ color: '#f5e6d3' }}`. Always use semantic tokens: `bg-background`, `text-foreground`.
- **Mixing HSL wrapper styles:** Don't have some variables using `hsl(var(--x))` and others using `hsl(var(--x) / <alpha-value>)`. All color references in tailwind.config.js must consistently use the `<alpha-value>` pattern.
- **Orphaned dark: prefixes:** After removing the `.dark` class, any remaining `dark:` prefixes in component JSX become dead code that confuses future developers. Must sweep all 438 occurrences across 30 files.
- **Theme transition CSS:** The current `index.css` has `transition: background-color 200ms` on many elements for light/dark switching. With dark-only theme, these are unnecessary and add layout overhead. Remove them.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Font loading | Custom @font-face declarations | Google Fonts `<link>` tag | Google Fonts handles subsetting, format negotiation (woff2/ttf), and `font-display: swap` automatically |
| Color space conversion | Manual hex-to-HSL math in code | Pre-computed HSL values in CSS variables | Conversion is a one-time operation; store results, don't compute at runtime |
| Scrollbar cross-browser styling | Per-browser CSS hacks | `scrollbar-width: thin` + `::-webkit-scrollbar` pattern (already exists) | The existing `.scrollbar-thin` utility in index.css already handles this; just update the colors |
| CSS variable fallbacks | Complex fallback chains | Single `:root` block with all tokens | Dark-only means no fallback needed; one source of truth |

**Key insight:** The existing codebase already has the right CSS architecture (CSS variables + Tailwind semantic colors + scrollbar utilities). The work is value replacement and cleanup, not structural redesign.

## Common Pitfalls

### Pitfall 1: Alpha-Value Contract Break

**What goes wrong:** CSS variables defined as `--color: H S% L%` but consumed as `hsl(var(--color))` in Tailwind config. Tailwind's opacity modifier generates `hsl(var(--color) / 0.5)` which works. But `hsl(var(--color))` without `<alpha-value>` placeholder means Tailwind can't inject the opacity. The current codebase has this exact bug.

**Why it happens:** The shadcn/ui init template generates `hsl(var(--color))` format, which is technically valid CSS but prevents Tailwind opacity modifiers from working.

**How to avoid:** Every color in `tailwind.config.js` MUST use the `<alpha-value>` pattern:
```javascript
background: "hsl(var(--background) / <alpha-value>)",
```
NOT:
```javascript
background: "hsl(var(--background))",
```

**Warning signs:** `bg-primary/50` renders at full opacity instead of 50%. Inspect element shows `background-color: hsl(30.6 52.7% 64.3%)` with no alpha channel.

### Pitfall 2: Orphaned Dark-Mode Code

**What goes wrong:** Removing the `.dark` class from `<html>` but leaving `dark:` prefixes in JSX/TSX. The classes become dead code -- they never activate, but they bloat the HTML and confuse developers.

**Why it happens:** 438 occurrences across 30 files. Easy to miss some during manual sweep.

**How to avoid:** Use grep/search for `dark:` across all `.jsx`, `.tsx`, `.css` files. Strip prefixes programmatically where possible. Verify with `grep -r "dark:" src/` after cleanup.

**Warning signs:** Any `dark:` class visible in component source after Phase 1 completion.

### Pitfall 3: ThemeContext Removal Cascade

**What goes wrong:** Removing `ThemeContext.jsx` breaks 7 files that import `useTheme` or `ThemeProvider`.

**Why it happens:** `ThemeProvider` wraps the entire app in `App.tsx`. `useTheme` is imported in `DarkModeToggle.tsx`, `QuickSettingsPanel.jsx`, `useSettingsController.ts`, `CodexLogo.tsx`, `CursorLogo.tsx`.

**How to avoid:**
1. Simplify `ThemeContext.jsx` to always-dark (don't toggle, just set dark) OR remove entirely.
2. If removing: remove `ThemeProvider` from `App.tsx`, remove `useTheme` imports from all consumers.
3. The `CodexLogo.tsx` and `CursorLogo.tsx` imports are moot if Codex/Cursor get stripped in Phase 3.

**Recommendation:** Replace `ThemeContext.jsx` with a one-time side-effect in `main.jsx` that sets `document.documentElement.style.colorScheme = 'dark'` and the meta theme-color. No context needed.

### Pitfall 4: CSS Variable Border with Embedded Alpha

**What goes wrong:** Defining `--border: 34.5 35.9% 63.9% / 0.15` (with alpha baked in) breaks the `<alpha-value>` contract. `border-border/50` would try to inject another alpha, resulting in invalid CSS.

**Why it happens:** The design spec calls for `rgba(196, 168, 130, 0.15)` borders. Tempting to bake the alpha into the variable.

**How to avoid:** Define `--border` as bare channels `34.5 35.9% 63.9%` and apply the low opacity in the Tailwind config or via utility classes. For the default border color, define a custom utility or override the default in a separate variable:
```css
:root {
  --border: 34.5 35.9% 63.9%;
  --border-opacity: 0.15;
}
```
```javascript
// tailwind.config.js
border: "hsl(var(--border) / var(--border-opacity, 0.15))",
```
Or simpler: use `border-border/[0.15]` in components. But this spreads the opacity value across 86+ files. Better to set a default opacity in the Tailwind config reference.

### Pitfall 5: Font Flash (FOUT) on First Load

**What goes wrong:** Page renders with system font, then JetBrains Mono loads and text reflows, causing layout shift.

**Why it happens:** Google Fonts uses `font-display: swap` by default. The font is ~50-100KB per weight for woff2.

**How to avoid:**
1. Preconnect to Google Fonts CDN: `<link rel="preconnect" href="https://fonts.googleapis.com">` and `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`.
2. Load only needed weights (400 regular, 500 medium, 700 bold -- not all 8).
3. `font-display: swap` is correct behavior; the FOUT is brief (~100-200ms) and acceptable for a self-hosted dev tool.

**Warning signs:** Visible text reflow on page load. Measure with Lighthouse "Cumulative Layout Shift" metric.

## Code Examples

Verified patterns from official sources:

### CSS Variable Palette (index.css :root block)

```css
/* Source: Tailwind CSS v3 docs - Context7 /websites/v3_tailwindcss */
@layer base {
  :root {
    /* Surface hierarchy -- 3-tier depth model */
    --background: 10 27.3% 8.6%;          /* #1c1210 -- base layer */
    --foreground: 33.5 63% 89.4%;         /* #f5e6d3 -- cream primary text */

    --card: 18.8 23.5% 13.3%;             /* #2a1f1a -- surface 1 */
    --card-foreground: 33.5 63% 89.4%;    /* #f5e6d3 -- cream */

    --popover: 18.8 23.5% 13.3%;          /* #2a1f1a -- surface 1 */
    --popover-foreground: 33.5 63% 89.4%; /* #f5e6d3 -- cream */

    --primary: 30.6 52.7% 64.3%;          /* #d4a574 -- amber accent */
    --primary-foreground: 10 27.3% 8.6%;  /* #1c1210 -- dark text on amber */

    --secondary: 22.5 24.5% 19.2%;        /* #3d2e25 -- surface 2 */
    --secondary-foreground: 33.5 63% 89.4%; /* #f5e6d3 -- cream */

    --muted: 22.5 24.5% 19.2%;            /* #3d2e25 -- surface 2 */
    --muted-foreground: 34.5 35.9% 63.9%; /* #c4a882 -- muted gold */

    --accent: 21.9 45.6% 55.3%;           /* #c17f59 -- copper */
    --accent-foreground: 33.5 63% 89.4%;  /* #f5e6d3 -- cream */

    --destructive: 16.2 52.1% 47.5%;      /* #b85c3a -- terracotta */
    --destructive-foreground: 33.5 63% 89.4%; /* #f5e6d3 -- cream */

    --border: 34.5 35.9% 63.9%;           /* #c4a882 -- warm gold, used at low opacity */
    --input: 18.8 23.5% 13.3%;            /* #2a1f1a -- surface 1 */
    --ring: 30.6 52.7% 64.3%;             /* #d4a574 -- amber focus ring */

    --radius: 0.5rem;

    /* Status colors -- warm tinted */
    --status-connected: 109.4 44.3% 54.9%;    /* #6bbf59 -- warm green */
    --status-reconnecting: 30.6 52.7% 64.3%;  /* #d4a574 -- amber */
    --status-disconnected: 8.1 49% 52.4%;     /* #c15a4a -- warm red */
    --status-error: 16.2 52.1% 47.5%;         /* #b85c3a -- terracotta */
  }
}
```

### Tailwind Config (alpha-value contract)

```javascript
// Source: Tailwind CSS v3 docs - Context7 /websites/v3_tailwindcss
/** @type {import('tailwindcss').Config} */
export default {
  // NO darkMode config needed (or remove the line entirely)
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border) / <alpha-value>)",
        input: "hsl(var(--input) / <alpha-value>)",
        ring: "hsl(var(--ring) / <alpha-value>)",
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        primary: {
          DEFAULT: "hsl(var(--primary) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
          foreground: "hsl(var(--secondary-foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
          foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "hsl(var(--popover) / <alpha-value>)",
          foreground: "hsl(var(--popover-foreground) / <alpha-value>)",
        },
        card: {
          DEFAULT: "hsl(var(--card) / <alpha-value>)",
          foreground: "hsl(var(--card-foreground) / <alpha-value>)",
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
```

### JetBrains Mono Loading (index.html)

```html
<!-- Preconnect for performance -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

<!-- Load JetBrains Mono: 400 (body), 500 (medium emphasis), 700 (bold/headings) -->
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,400;0,500;0,700;1,400&display=swap" rel="stylesheet">
```

### Font Stack (index.css body rule)

```css
body {
  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'SF Mono', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.5;        /* 19.5px at 13px base -- good for monospace readability */
  letter-spacing: -0.01em; /* Slight tightening for monospace at small sizes */
}
```

### Scrollbar Styling (warm-tinted)

```css
.scrollbar-thin {
  scrollbar-width: thin;
  scrollbar-color: hsl(34.5 35.9% 63.9% / 0.3) transparent;  /* muted gold at 30% */
}

.scrollbar-thin::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background-color: hsl(34.5 35.9% 63.9% / 0.3);  /* muted gold at 30% */
  border-radius: 3px;
}

.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background-color: hsl(34.5 35.9% 63.9% / 0.5);  /* muted gold at 50% on hover */
}
```

### Upstream-Sync Branch Strategy

```bash
# One-time setup: add upstream remote
git remote add upstream https://github.com/siteboon/claudecodeui.git

# Create upstream-sync branch tracking upstream/main verbatim
git fetch upstream
git checkout -b upstream-sync upstream/main

# Tag current fork baseline
git checkout main
git tag -a fork-baseline -m "Loom fork baseline from CloudCLI v1.21.0"

# Future cherry-picking workflow:
git checkout upstream-sync
git fetch upstream
git merge upstream/main        # Fast-forward to latest upstream
git checkout main
git cherry-pick <commit>       # Pick specific fixes from upstream-sync
```

### ATTRIBUTION File

```
ATTRIBUTION
===========

Loom is a fork of CloudCLI UI (https://github.com/siteboon/claudecodeui),
originally created by CloudCLI UI Contributors.

The original work is licensed under the GNU General Public License v3.0.
This fork maintains the same license.

Original Project: CloudCLI UI
Original Repository: https://github.com/siteboon/claudecodeui
Original Authors: CloudCLI UI Contributors
Fork Date: 2026-03-01
Fork Baseline: v1.21.0

Modifications in this fork:
- Complete visual redesign with warm earthy dark theme
- Removal of i18n (English only)
- Removal of Cursor CLI and OpenAI Codex integrations
- Addition of companion mascot system
- Custom chat rendering and streaming UX
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `hsl(var(--color))` in Tailwind config | `hsl(var(--color) / <alpha-value>)` | Tailwind v3.1 (2022) | Enables opacity modifiers on custom colors |
| `darkMode: 'class'` | `darkMode: 'selector'` | Tailwind v3.4.1 (2024) | More flexible dark mode targeting; but irrelevant for dark-only apps |
| Google Fonts `@import` in CSS | `<link>` in HTML `<head>` | Long-standing best practice | `<link>` is non-render-blocking; `@import` blocks rendering |
| System font stack for UI | Monospace-first stacks for dev tools | Trend since ~2023 | Linear, Vercel, Raycast all use monospace UI. Developer tool aesthetic. |

**Deprecated/outdated:**
- `darkMode: 'class'` -- superseded by `'selector'` in Tailwind v3.4.1. The `'class'` value still works (backwards-compatible) but `'selector'` is the documented approach. Since we're removing dark mode entirely, this is moot.
- `rgba()` legacy format -- modern CSS uses `rgb()` / `hsl()` with space-separated values and `/` alpha syntax. Both work, but the modern syntax is recommended.

## Project Tooling

| Tool | Command | Detected From |
|------|---------|---------------|
| Lint | Not detected | No eslint config found |
| Type Check | `npm run typecheck` | package.json scripts (`tsc --noEmit -p tsconfig.json`) |
| Build | `npm run build` | package.json scripts (`vite build`) |
| Test | Not detected | No test script in package.json |

*Written to `.planning/config.json` under `tooling` key for executor use.*

## Open Questions

1. **Border default opacity approach**
   - What we know: Design calls for `rgba(196, 168, 130, 0.15)` borders. The alpha-value contract requires bare channels in CSS variables.
   - What's unclear: Should the default 0.15 opacity be in the Tailwind config reference (`hsl(var(--border) / var(--border-opacity, 0.15))`) or applied per-component via `/[0.15]`?
   - Recommendation: Use a `--border-opacity` CSS variable with 0.15 default, referenced in the Tailwind config. This keeps the alpha-value contract intact while providing the correct default. Components can still override with `/50` etc.

2. **ThemeContext removal vs simplification**
   - What we know: 7 files import from ThemeContext. `useTheme` is used in settings, logos, and the toggle.
   - What's unclear: Whether Phase 3 (strip Cursor/Codex) will remove `CodexLogo.tsx` and `CursorLogo.tsx` first, making 2 of those 7 imports moot.
   - Recommendation: Remove ThemeContext entirely in Phase 1. Replace with a one-liner in `main.jsx`. The 2 logo files will get cleaned up in Phase 3 anyway; for now just remove their `useTheme` imports if they only use it for dark/light branching.

3. **Transition CSS cleanup scope**
   - What we know: `index.css` has ~30 lines of transition CSS for light/dark switching (lines 188-197, background-color/border-color/color transitions on all elements).
   - What's unclear: Whether some of these transitions are desired for hover/interaction effects, not just theme switching.
   - Recommendation: Remove the blanket element transitions (lines 188-197) since they were for theme switching. Keep the interactive element transitions (buttons, links, etc.) on lines 178-186. Verify interactivity feels responsive after removal.

## Sources

### Primary (HIGH confidence)
- Context7 /websites/v3_tailwindcss - CSS variable alpha-value contract, opacity modifier syntax, dark mode configuration
- Tailwind CSS v3 docs (https://v3.tailwindcss.com/docs/colors) - "Using CSS variables" section confirming bare-channel requirement
- Google Fonts CDN - JetBrains Mono v24 confirmed available, 8 weights (100-800), font-display: swap

### Secondary (MEDIUM confidence)
- Codebase analysis: `index.css` (908 lines), `tailwind.config.js`, `ThemeContext.jsx`, `DarkModeToggle.tsx`, `App.tsx` -- all read directly
- HSL color conversions: computed via Node.js from hex values in REQUIREMENTS.md
- Git repository analysis: 53 tags, origin remote at siteboon/claudecodeui, GPL-3.0 LICENSE confirmed

### Tertiary (LOW confidence)
- JetBrains Mono version (v2.304 from GitHub README may be stale; Google Fonts shows v24 which is a different versioning scheme)
- Exact line-height/letter-spacing values for 13px JetBrains Mono (1.5 / -0.01em are reasonable starting points but should be visually validated)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already installed and configured; versions confirmed from package-lock.json
- Architecture: HIGH - alpha-value pattern verified with Context7 official Tailwind v3 docs; existing codebase structure well-understood
- Pitfalls: HIGH - 5 pitfalls identified from direct codebase analysis; the alpha-value bug is confirmed broken in the current code
- Font loading: MEDIUM - Google Fonts CDN approach is standard but exact weight selection and line-height values need visual validation
- Fork governance: MEDIUM - git branching strategy is standard; ATTRIBUTION format is a reasonable convention but not legally prescribed

**Research date:** 2026-03-01
**Valid until:** 2026-03-31 (stable domain -- CSS/Tailwind v3 not changing rapidly)
