# Phase 1: Design Token System - Research

**Researched:** 2026-03-04
**Domain:** CSS Design Tokens (OKLCH), Tailwind CSS v4, Typography, Motion System
**Confidence:** HIGH

## Summary

Phase 1 scaffolds the entire V2 project from scratch (Vite + React 18 + TypeScript + Tailwind v4) and establishes the design token system that every subsequent phase builds upon. The critical technical decision is migrating from V1's HSL-based tokens in Tailwind v3 to OKLCH-based tokens in Tailwind v4's CSS-first `@theme` architecture. This is a clean-room build -- no V1 code is reused.

Tailwind v4 introduces a fundamentally different configuration model: the JavaScript `tailwind.config.js` is replaced by CSS `@theme` directives. Color tokens are defined as OKLCH values directly in CSS custom properties, opacity modifiers work natively with OKLCH's 4th alpha parameter (`oklch(L C H / alpha)`), and spacing is derived from a single `--spacing` base variable. The `@theme inline` variant is specifically designed for semantic tokens that reference runtime CSS variables -- exactly the pattern needed for the surface hierarchy.

**Primary recommendation:** Use `@theme inline` with `:root` CSS custom properties for all semantic color tokens (surface-base, surface-raised, etc.), `@theme` for static values (font families, spacing), and self-hosted .woff2 files via `@font-face` for all three font families. Spring physics constants go in a TypeScript module (`src/lib/motion.ts`) since CSS cannot express spring physics natively.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Color space:** OKLCH for all color tokens (DS-01 requirement)
- **Surface tone:** Warm charcoal with slight brown/amber undertone (Hue 30). NOT neutral or cool gray.
- **Primary accent:** Dusty rose (#D4736C) -- locked from requirements and architectural consensus
- **Secondary accent:** Amber/gold -- warm complement to dusty rose
- **Saturation:** Jewel tones -- deep, rich, saturated but not neon
- **Contrast:** HIGH -- accents should punch against charcoal surfaces
- **Borders:** Mixed opacity -- subtle (6-8%) for content, more visible (12-18%) for interactive. Two tokens: `--border-subtle` and `--border-interactive`
- **Reference products:** Warp terminal, Arc browser, Linear
- **Constitution constraint:** Dusty rose max 5% of UI surface
- **Body font:** Inter Variable at 14px base size. Monospace is NOT body font (V1 bug fixed).
- **Heading font:** Instrument Serif -- session titles, major section headings, modal titles
- **Code font:** JetBrains Mono -- code blocks and inline code only
- **Heading scale:** 14px (body) -> 18px (H3) -> 24px (H2) -> 32px (H1)
- **Line height:** 1.5 for body text
- **Font loading:** Self-hosted .woff2 via @font-face with font-display: swap. No CDN.
- **Density:** Adaptive -- 8px base unit in sidebar/controls, 12px in chat/content areas
- **Source directory:** Fresh directory separate from V1 src/ (e.g., src/ or clean branch)
- **Scaffold:** `npm create vite@latest` -- clean dependency tree
- **Tailwind v4:** CSS-first `@theme` configuration. No tailwind.config.js.
- **Dev server:** Vite proxy to backend on port 5555
- **Directory layout:** Must reflect V2 Constitution Section 1.1 from first commit
- **Token preview:** Comprehensive stress test at permanent /tokens or /dev/tokens route. Must include Spring Lab section.
- **Status colors:** Warm-tinted but highly readable on dark surfaces. Clarity over forced warmth.
- **Code presentation:** Subtle background shift for code blocks, faint background pill for inline code

### Claude's Discretion
- FX/decorative token design (aurora shimmer, glow effects, gradient overlays)
- Token preview page format (React route vs. static HTML)
- Chat vs. sidebar typographic differentiation
- Popover/dropdown floating treatment (shadow vs. 4th surface tier)
- Exact OKLCH values for the full palette (warm charcoal + dusty rose + amber/gold + status)
- Code block surface color differentiation approach

### Deferred Ideas (OUT OF SCOPE)
- Pulling enforcement (ESLint rules, TS strict) into Phase 1 -- stays in Phase 2
- Storybook for component documentation -- consider for M2 or M3
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DS-01 | Create `src/styles/tokens.css` with ALL color tokens as CSS custom properties using OKLCH | Tailwind v4 `@theme inline` + `:root` pattern verified. OKLCH syntax: `oklch(L C H)`. Opacity via 4th param: `oklch(L C H / alpha)`. All tokens in single `:root` block per Constitution 7.14. |
| DS-02 | Define motion tokens in CSS + spring physics in JS | CSS easing tokens via `@theme` (`--ease-spring`, `--ease-out`, `--ease-in-out`). Duration tokens as CSS custom properties. Spring configs (stiffness/damping/mass) as TypeScript constants in `src/lib/motion.ts` -- CSS cannot express spring physics. |
| DS-03 | Define spacing scale on 4px grid as CSS custom properties | Tailwind v4 `--spacing: 0.25rem` base variable generates all spacing utilities automatically (`p-1` = 4px through `p-16` = 64px). Custom spacing tokens `--space-1` through `--space-16` on `:root` for non-Tailwind usage. |
| DS-04 | Define z-index dictionary with 8 named tiers | 8 CSS custom properties on `:root`: `--z-base` through `--z-critical`. Used via `z-[var(--z-modal)]` in Tailwind. Values locked in Constitution Section 3.3. |
| DS-05 | Configure three font families with @font-face | Self-hosted .woff2 files in `public/fonts/`. `@font-face` declarations in `src/styles/base.css`. Tailwind v4 `@theme` maps `--font-sans`, `--font-serif`, `--font-mono`. Inter Variable, Instrument Serif, JetBrains Mono all available as .woff2. |
| DS-06 | Implement surface hierarchy via lightness steps only | Three OKLCH surfaces with increasing lightness (L channel). No box-shadow for elevation. Borders at 6-8% opacity between surfaces. Verified via token preview page with side-by-side surface comparison. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| tailwindcss | 4.x (latest) | Utility CSS framework | CSS-first config via `@theme`, native OKLCH support, Vite plugin |
| @tailwindcss/vite | 4.x (latest) | Vite integration plugin | Replaces PostCSS plugin from v3; 3-10x faster builds |
| vite | 6.x (latest) | Build tool + dev server | Fast HMR, proxy config, React plugin |
| @vitejs/plugin-react | latest | React Fast Refresh | Required for JSX/TSX compilation |
| react | 18.x | UI framework | Locked by architectural decision |
| react-dom | 18.x | React DOM renderer | Required peer of react |
| react-router-dom | 7.x | Client-side routing | Route structure needed for token preview page |
| typescript | 5.x | Type safety | Strict mode per Constitution |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| clsx | 2.x | Conditional class names | Every `className` composition |
| tailwind-merge | 3.x | Tailwind class conflict resolution | Combined with clsx in `cn()` utility |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @tailwindcss/vite | postcss + tailwindcss | PostCSS is v3 pattern; v4 Vite plugin is faster and simpler |
| Self-hosted fonts | Google Fonts CDN | CDN violates locked decision; self-hosting gives full control |
| Fontsource packages | Manual .woff2 files | Fontsource adds npm deps; manual .woff2 is simpler for 3 fonts |

**Installation:**
```bash
# V2 project scaffolding (fresh directory)
npm create vite@latest loom-v2 -- --template react-ts
cd loom-v2
npm install tailwindcss @tailwindcss/vite
npm install react-router-dom
npm install clsx tailwind-merge
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  components/      # React components (per Constitution 1.1)
  hooks/           # Custom hooks
  stores/          # Zustand stores (Phase 4)
  types/           # Shared TypeScript types
  utils/           # Pure utility functions (cn.ts lives here)
  styles/          # Global CSS
    tokens.css     # ALL color/motion/spacing/z-index tokens (:root)
    base.css       # @font-face, reset, body defaults
    index.css      # @import "tailwindcss" + @theme directives
  lib/             # Third-party wrappers
    motion.ts      # Spring physics constants
public/
  fonts/
    inter-variable.woff2
    instrument-serif-regular.woff2
    instrument-serif-italic.woff2
    jetbrains-mono-variable.woff2
```

### Pattern 1: Tailwind v4 CSS-First Token Architecture
**What:** All design tokens defined in CSS using `@theme`, `@theme inline`, and `:root` custom properties. No JavaScript configuration file.
**When to use:** Every color, spacing, font, and motion value in the project.

The token system uses a three-layer architecture:

```css
/* src/styles/index.css -- Entry point */
@import "tailwindcss";
@import "./tokens.css";
@import "./base.css";

/* Static theme values -- generate utility classes directly */
@theme {
  --font-sans: 'Inter Variable', 'Inter', ui-sans-serif, system-ui, sans-serif;
  --font-serif: 'Instrument Serif', Georgia, serif;
  --font-mono: 'JetBrains Mono Variable', 'JetBrains Mono', ui-monospace, monospace;
  --color-white: oklch(1 0 0);
  --color-black: oklch(0 0 0);
  --radius-sm: calc(0.5rem - 4px);
  --radius-md: calc(0.5rem - 2px);
  --radius-lg: 0.5rem;
}

/* Semantic tokens referencing :root variables -- @theme inline */
@theme inline {
  --color-surface-base: var(--surface-base);
  --color-surface-raised: var(--surface-raised);
  --color-surface-overlay: var(--surface-overlay);
  --color-background: var(--surface-base);
  --color-foreground: var(--text-primary);
  --color-primary: var(--accent-primary);
  --color-primary-foreground: var(--accent-primary-fg);
  --color-muted: var(--text-muted);
  --color-muted-foreground: var(--text-muted);
  --color-border: var(--border-color);
  --color-ring: var(--accent-primary);
  /* ...all semantic mappings */
}
```

```css
/* src/styles/tokens.css -- ALL token values */
:root {
  /* Surface hierarchy -- OKLCH, lightness steps only */
  --surface-base: oklch(0.20 0.01 50);
  --surface-raised: oklch(0.23 0.008 50);
  --surface-overlay: oklch(0.27 0.007 50);

  /* Text hierarchy */
  --text-primary: oklch(0.90 0.02 30);
  --text-secondary: oklch(0.76 0.01 30);
  --text-muted: oklch(0.60 0.008 30);

  /* Accent -- dusty rose */
  --accent-primary: oklch(0.63 0.14 20);
  --accent-primary-hover: oklch(0.68 0.15 20);
  --accent-primary-muted: oklch(0.63 0.14 20 / 0.15);
  --accent-primary-fg: oklch(0.20 0.01 50);

  /* Secondary accent -- amber/gold */
  --accent-secondary: oklch(0.72 0.14 70);

  /* Status colors */
  --status-success: oklch(0.65 0.15 145);
  --status-error: oklch(0.58 0.18 25);
  --status-warning: oklch(0.72 0.14 70);
  --status-info: oklch(0.65 0.12 240);

  /* Borders */
  --border-subtle: oklch(1 0 0 / 0.07);
  --border-interactive: oklch(1 0 0 / 0.15);
  --border-color: oklch(1 0 0 / 0.07);

  /* Motion tokens */
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --duration-fast: 100ms;
  --duration-normal: 200ms;
  --duration-slow: 400ms;
  --duration-spring: 500ms;

  /* Z-index dictionary -- 8 tiers */
  --z-base: 0;
  --z-sticky: 10;
  --z-dropdown: 20;
  --z-scroll-pill: 30;
  --z-overlay: 40;
  --z-modal: 50;
  --z-toast: 60;
  --z-critical: 9999;

  /* Spacing custom properties (for non-Tailwind usage) */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;

  /* FX tokens */
  --fx-gradient-rose: oklch(0.65 0.12 0);
  --fx-gradient-violet: oklch(0.60 0.10 270);
  --fx-gradient-teal: oklch(0.60 0.09 180);
  --fx-gradient-amber: oklch(0.65 0.12 70);
  --fx-ambient-speed: 45s;
  --fx-ambient-opacity: 0.04;
  --fx-aurora-speed: 4s;
  --fx-aurora-blur: 6px;
  --fx-aurora-pulse-min: 0.3;
  --fx-aurora-pulse-max: 0.6;

  /* Glassmorphic tokens */
  --glass-blur: 16px;
  --glass-saturate: 1.4;
  --glass-bg-opacity: 0.7;

  /* Rose accent variants */
  --rose-accent: oklch(0.63 0.14 20);
  --rose-text: oklch(0.75 0.10 350);
  --rose-focus-glow: oklch(0.63 0.14 20);
  --rose-selection: oklch(0.63 0.14 20);

  /* Diff colors */
  --diff-added-bg: oklch(0.25 0.06 145);
  --diff-removed-bg: oklch(0.25 0.06 25);

  /* Code block surface */
  --code-surface: oklch(0.18 0.008 50);
  --code-inline-bg: oklch(1 0 0 / 0.06);
}
```

**CRITICAL NOTE:** The OKLCH values above are approximate starting points. The exact values MUST be tuned visually during implementation using oklch.fyi or similar tools. The V1 HSL values in `src/index.css` serve as the tonal reference -- the V2 OKLCH values should produce visually similar results with the same warm charcoal personality.

### Pattern 2: @theme inline for Semantic Tokens
**What:** `@theme inline` generates Tailwind utility classes that resolve to CSS variable references at runtime, enabling dynamic theming.
**When to use:** When token values reference `:root` CSS custom properties rather than static values.

```css
/* @theme inline prevents Tailwind from inlining the value */
/* Instead, bg-surface-base resolves to var(--surface-base) at runtime */
@theme inline {
  --color-surface-base: var(--surface-base);
}

/* This means utility classes like bg-surface-base, text-surface-base */
/* all reference the CSS variable, not a baked-in oklch() value */
```

**Why this matters:** The V1 codebase uses `hsl(var(--background))` everywhere. In v4, `@theme inline` eliminates this verbosity -- `bg-background` just works because the utility resolves to the variable.

### Pattern 3: Font Loading with @font-face
**What:** Self-hosted variable font files loaded via CSS `@font-face` with `font-display: swap`.
**When to use:** All three font families (Inter, Instrument Serif, JetBrains Mono).

```css
/* src/styles/base.css */
@font-face {
  font-family: 'Inter Variable';
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
  src: url('/fonts/inter-variable.woff2') format('woff2');
}

@font-face {
  font-family: 'Instrument Serif';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('/fonts/instrument-serif-regular.woff2') format('woff2');
}

@font-face {
  font-family: 'Instrument Serif';
  font-style: italic;
  font-weight: 400;
  font-display: swap;
  src: url('/fonts/instrument-serif-italic.woff2') format('woff2');
}

@font-face {
  font-family: 'JetBrains Mono Variable';
  font-style: normal;
  font-weight: 100 800;
  font-display: swap;
  src: url('/fonts/jetbrains-mono-variable.woff2') format('woff2');
}
```

### Pattern 4: Spring Physics as TypeScript Constants
**What:** Spring physics configs that cannot be expressed in CSS, exported as typed constants.
**When to use:** Any animation using Framer Motion LazyMotion or a custom spring solver.

```typescript
// src/lib/motion.ts
export interface SpringConfig {
  stiffness: number;
  damping: number;
  mass?: number;
}

export const SPRING_GENTLE: SpringConfig = {
  stiffness: 120,
  damping: 14,
};

export const SPRING_SNAPPY: SpringConfig = {
  stiffness: 300,
  damping: 20,
};

export const SPRING_BOUNCY: SpringConfig = {
  stiffness: 180,
  damping: 12,
};

// CSS easing token references for JS usage
export const EASING = {
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  out: 'cubic-bezier(0.16, 1, 0.3, 1)',
  inOut: 'cubic-bezier(0.65, 0, 0.35, 1)',
} as const;

export const DURATION = {
  fast: 100,
  normal: 200,
  slow: 400,
  spring: 500,
} as const;
```

### Pattern 5: cn() Utility Function
**What:** Combines clsx (conditional classes) with tailwind-merge (conflict resolution).
**When to use:** Every `className` prop in every component (Constitution Section 3.6).

```typescript
// src/utils/cn.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

### Anti-Patterns to Avoid
- **Splitting tokens across files:** ALL color tokens MUST live in a single `:root` block (Constitution 7.14). Spacing, z-index, and motion tokens can share the same file.
- **Using `@theme` for variable references:** Static `@theme` will inline the `var()` call as a literal string. Use `@theme inline` when the value references a CSS variable.
- **Using HSL values:** V2 uses OKLCH exclusively. No `hsl()` anywhere in new code.
- **Using `tailwind.config.js`:** Tailwind v4 uses CSS-first config. The JS config file is deprecated for new projects.
- **Using `@tailwind` directives:** V4 uses `@import "tailwindcss"` instead.
- **Using `hsl(var(--token) / <alpha-value>)` pattern:** This is the v3 opacity modifier pattern. V4 uses OKLCH with native alpha: `oklch(L C H / alpha)` and utility opacity modifiers (`bg-primary/50`) work automatically.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Class name merging | String concatenation | `cn()` (clsx + tailwind-merge) | Tailwind specificity conflicts are deceptively complex |
| Spacing system | Custom spacing values | Tailwind v4 `--spacing: 0.25rem` base | Single variable generates entire scale automatically |
| OKLCH value calculation | Manual math for lightness steps | oklch.fyi or similar visual tool | Perceptual uniformity requires visual verification |
| Font subsetting | Manual font file optimization | Pre-built variable font .woff2 files | Variable fonts already optimized; subsetting risks breaking glyphs |
| Vite proxy config | Custom middleware | Vite built-in `server.proxy` | Handles WebSocket upgrade, path rewriting natively |

**Key insight:** Tailwind v4's `@theme` directive is the design token system. It generates both CSS custom properties AND utility classes from a single source of truth. Fighting this by maintaining separate token systems creates drift.

## Common Pitfalls

### Pitfall 1: @theme vs @theme inline Confusion
**What goes wrong:** Defining semantic tokens (that reference CSS variables) in plain `@theme` instead of `@theme inline`. The utility classes appear to work but resolve to literal `var(--x)` strings instead of the resolved values.
**Why it happens:** The difference is subtle and poorly documented.
**How to avoid:** Static literal values go in `@theme`. References to CSS variables go in `@theme inline`. Test by inspecting computed styles in DevTools.
**Warning signs:** Colors appear as `var(--x)` in computed styles instead of resolved oklch values; opacity modifiers don't work on semantic tokens.

### Pitfall 2: V3-to-V4 Color Syntax Migration
**What goes wrong:** Using the V3 pattern `hsl(var(--token) / <alpha-value>)` which relies on splitting the HSL value into space-separated components. V4 expects full color values.
**Why it happens:** V1 codebase uses this pattern everywhere (`hsl(var(--background) / 0.5)`).
**How to avoid:** In V2, tokens store complete OKLCH values: `--surface-base: oklch(0.20 0.01 50)`. Opacity applied via OKLCH 4th parameter or Tailwind utility modifiers: `bg-surface-base/50`.
**Warning signs:** Colors rendering as black or transparent; alpha values not applied.

### Pitfall 3: Default Border Color Change in Tailwind v4
**What goes wrong:** `border` class renders with `currentColor` instead of gray-200.
**Why it happens:** Tailwind v4 changed the default border color from `gray-200` to `currentColor`.
**How to avoid:** Explicitly set border colors on all bordered elements, or add a base layer rule restoring the V3 behavior. Since we use `border-border` tokens anyway, this should be handled in base styles.
**Warning signs:** Unexpected border colors throughout the UI.

### Pitfall 4: OKLCH Gamut Differences
**What goes wrong:** Colors that look fine in the OKLCH picker render differently in the browser because OKLCH's wider gamut maps colors to sRGB clipping.
**Why it happens:** OKLCH can express colors outside the sRGB gamut. Browsers clamp to sRGB for most displays.
**How to avoid:** Use OKLCH values with moderate chroma (C < 0.2 for UI colors). Test on actual displays, not just picker tools. Keep chroma low for surface colors (< 0.015 for charcoal).
**Warning signs:** Surfaces appearing too saturated or shifting hue unexpectedly.

### Pitfall 5: Font Loading Flash
**What goes wrong:** Visible layout shift when web fonts load, especially if fallback font metrics differ significantly from the target font.
**Why it happens:** `font-display: swap` intentionally shows text in fallback font first.
**How to avoid:** Choose fallback fonts with similar metrics. Inter's fallbacks (system-ui, -apple-system) have similar metrics. For Instrument Serif, Georgia is a close match. `size-adjust`, `ascent-override`, and `descent-override` descriptors can fine-tune the fallback.
**Warning signs:** Text reflowing when fonts load; layout shifting on page load.

### Pitfall 6: Tailwind v4 Browser Requirements
**What goes wrong:** Styles don't apply in older browsers.
**Why it happens:** Tailwind v4 requires Safari 16.4+, Chrome 111+, Firefox 128+. It uses modern CSS features like `@layer`, `@property`, `color-mix()`.
**How to avoid:** This project targets desktop usage on modern browsers, so this is acceptable. Document the requirement.
**Warning signs:** Broken styles in older browser versions.

## Code Examples

### Complete Vite Configuration for V2
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5184,
    proxy: {
      '/api': 'http://localhost:5555',
      '/ws': {
        target: 'ws://localhost:5555',
        ws: true,
      },
      '/shell': {
        target: 'ws://localhost:5555',
        ws: true,
      },
    },
  },
  build: {
    outDir: 'dist',
  },
});
```

### Surface Hierarchy Verification Pattern
```css
/* Verify three distinct surfaces are perceptible */
/* Lightness steps: base (0.20) -> raised (0.23) -> overlay (0.27) */
/* Delta of ~0.03-0.04 in L channel creates subtle but perceptible distinction */
/* Chroma decreases slightly at higher lightness to maintain warmth */
:root {
  --surface-base:    oklch(0.20 0.010 50);  /* deepest -- app background */
  --surface-raised:  oklch(0.23 0.008 50);  /* cards, sidebar */
  --surface-overlay: oklch(0.27 0.007 50);  /* modals, dropdowns */
}
```

### Adaptive Density Pattern
```css
/* Two density contexts per CONTEXT.md decision */
:root {
  --density-compact: 8px;   /* sidebar, controls */
  --density-comfortable: 12px; /* chat, content */
}

/* Usage via utility classes or direct CSS */
.sidebar { padding: var(--density-compact); }
.chat-content { padding: var(--density-comfortable); }
```

### Typography Scale
```css
/* Heading scale per CONTEXT.md: 14 -> 18 -> 24 -> 32 */
:root {
  --text-body: 0.875rem;    /* 14px */
  --text-h3: 1.125rem;      /* 18px */
  --text-h2: 1.5rem;        /* 24px */
  --text-h1: 2rem;          /* 32px */
}
```

## State of the Art

| Old Approach (V1 / Tailwind v3) | Current Approach (V2 / Tailwind v4) | When Changed | Impact |
|----------------------------------|--------------------------------------|--------------|--------|
| `tailwind.config.js` for theme | `@theme` / `@theme inline` in CSS | Tailwind v4 (Jan 2025) | No JS config file; tokens in CSS |
| `@tailwind base/components/utilities` | `@import "tailwindcss"` | Tailwind v4 | Single import replaces three directives |
| `hsl(var(--token) / <alpha-value>)` | OKLCH with native alpha `oklch(L C H / a)` | Tailwind v4 | No more space-separated HSL hacks |
| PostCSS plugin for Tailwind | `@tailwindcss/vite` plugin | Tailwind v4 | 3-10x faster builds; no postcss.config.js |
| `content: [...]` array for class scanning | Automatic content detection | Tailwind v4 | No configuration needed |
| Default border color gray-200 | Default border color `currentColor` | Tailwind v4 | Must explicitly set border colors |
| `!` at start of class (`!p-4`) | `!` at end of class (`p-4!`) | Tailwind v4 | Important modifier position changed |

**Deprecated/outdated:**
- `tailwind.config.js` -- still supported but not auto-detected in v4. New projects should use CSS-first config.
- `postcss.config.js` for Tailwind -- replaced by `@tailwindcss/vite` plugin for Vite projects.
- HSL color space for tokens -- OKLCH is perceptually uniform and is Tailwind v4's native color space.

## OKLCH Migration Notes

The V1 codebase defines tokens as HSL components (e.g., `--background: 30 3.8% 10.2%` which is consumed as `hsl(var(--background))`). V2 defines tokens as complete OKLCH values:

| V1 Token | V1 HSL Value | V2 OKLCH Equivalent (approximate) | Notes |
|----------|-------------|-----------------------------------|-------|
| `--background` | `30 3.8% 10.2%` | `oklch(0.20 0.010 50)` | Warm charcoal base |
| `--card` | `30 3.0% 12.9%` | `oklch(0.23 0.008 50)` | Raised surface |
| `--popover` | `30 2.4% 16.5%` | `oklch(0.27 0.007 50)` | Overlay surface |
| `--primary` | `4 54.7% 62.7%` (#D4736C) | `oklch(0.63 0.14 20)` | Dusty rose |
| `--foreground` | `0 10% 88%` | `oklch(0.90 0.02 30)` | Primary text |
| `--muted-foreground` | `0 3% 59%` | `oklch(0.60 0.008 30)` | Muted text |

**These values are starting points and MUST be visually tuned.** Use oklch.fyi to adjust. The hue (H) values may need tweaking to maintain the warm charcoal feel.

## Font Acquisition

| Font | Source | File(s) | Size (approx) |
|------|--------|---------|---------------|
| Inter Variable | https://github.com/rsms/inter/releases | `InterVariable.woff2` | ~300KB |
| Instrument Serif | Google Fonts (via google-webfonts-helper or direct download) | `instrument-serif-v1-latin-regular.woff2`, `-italic.woff2` | ~20KB each |
| JetBrains Mono Variable | https://github.com/JetBrains/JetBrainsMono/releases | `JetBrainsMono-Variable.woff2` | ~150KB |

Download .woff2 files and place in `public/fonts/`. Do not use npm packages (Fontsource) -- self-hosting from `public/` is simpler and avoids build-time font processing.

## Open Questions

1. **Exact OKLCH values for warm charcoal**
   - What we know: V1 HSL values for surface hierarchy. OKLCH equivalents are approximate.
   - What's unclear: Whether the mathematical conversion preserves the exact warm feel. The hue channel in OKLCH (H=50 = yellow-ish) may not perfectly match HSL hue 30 (orange).
   - Recommendation: Start with the converted values, visually tune in the token preview page, adjust until the warmth matches. This is Claude's discretion per CONTEXT.md.

2. **Tailwind v4 + @theme inline opacity modifier behavior**
   - What we know: `@theme inline` values reference CSS variables. Opacity modifiers (`bg-primary/50`) need the underlying value to be a valid color.
   - What's unclear: Whether OKLCH values stored in CSS variables correctly support opacity modifiers when referenced via `@theme inline`.
   - Recommendation: Test early in Plan 01-01 scaffolding. If opacity modifiers don't work with variable references, fall back to defining opacity variants explicitly.

3. **V2 source directory approach**
   - What we know: CONTEXT.md says "fresh directory separate from V1 src/". Options: `src/`, clean branch, or scaffold in project root.
   - What's unclear: Whether to scaffold inside the existing loom repo or create a separate directory.
   - Recommendation: Scaffold in the existing loom repo root -- replace V1 `src/` on a new branch. The existing `server/` directory stays untouched. V1 `src/` can be renamed to `src-v1/` for reference.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (Phase 2 sets up fully; Phase 1 can include minimal validation) |
| Config file | None in Phase 1 -- Vitest setup is Phase 2 (ENF-03) |
| Quick run command | `npx vitest run --reporter=verbose` (once configured in Phase 2) |
| Full suite command | `npm run test` (once configured in Phase 2) |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DS-01 | All color tokens as OKLCH CSS custom properties | manual-only | Visual inspection via token preview page | N/A -- visual |
| DS-02 | Motion tokens in CSS + spring configs in TS | unit (Phase 2) | `vitest run src/lib/motion.test.ts` | No -- Wave 0 (Phase 2) |
| DS-03 | Spacing scale on 4px grid | manual-only | Visual inspection via token preview page | N/A -- visual |
| DS-04 | Z-index 8-tier dictionary | manual-only | Grep for raw z-index values | N/A -- enforcement in Phase 2 |
| DS-05 | Three font families load correctly | manual-only | Visual inspection + DevTools Network tab | N/A -- visual |
| DS-06 | Surface hierarchy via lightness steps | manual-only | Visual inspection of 3 surface tiers in preview | N/A -- visual |

**Note:** Phase 1 is primarily a visual/CSS phase. Automated testing infrastructure is Phase 2 (ENF-03). The token preview page serves as the primary validation mechanism for Phase 1.

### Sampling Rate
- **Per task commit:** Visual inspection of token preview page
- **Per wave merge:** Full visual review of all token categories
- **Phase gate:** All surfaces perceptible, fonts loading, motion tokens defined, preview page complete

### Wave 0 Gaps
- None -- Phase 1 does not require test infrastructure. The token preview page IS the validation artifact. Automated testing is deferred to Phase 2 per user's locked decision (enforcement stays in Phase 2).

## Sources

### Primary (HIGH confidence)
- [Tailwind CSS v4 Theme Variables docs](https://tailwindcss.com/docs/theme) - @theme and @theme inline syntax, namespace conventions, OKLCH color definitions
- [Tailwind CSS v4 Upgrade Guide](https://tailwindcss.com/docs/upgrade-guide) - Breaking changes from v3, installation with Vite, border color defaults
- [Tailwind CSS v4 Colors docs](https://tailwindcss.com/docs/customizing-colors) - OKLCH color definition, opacity modifiers, @theme inline for variable references
- [Tailwind v4 Vite installation](https://tailwindcss.com/docs) - @tailwindcss/vite plugin setup
- [V1 src/index.css](../../../src/index.css) - Existing HSL token values as tonal reference

### Secondary (MEDIUM confidence)
- [GitHub Discussion: Theming best practices in v4](https://github.com/tailwindlabs/tailwindcss/discussions/18471) - @theme inline pattern for semantic tokens with variable references
- [GitHub Discussion: @theme vs @theme inline](https://github.com/tailwindlabs/tailwindcss/discussions/18560) - Differences between the two directives
- [Fontsource: Instrument Serif](https://fontsource.org/fonts/instrument-serif/install) - Font weight/style availability, package name
- [JetBrains Mono GitHub](https://github.com/JetBrains/JetBrainsMono) - Variable font woff2 availability
- [Josh Comeau: Spring Physics](https://www.joshwcomeau.com/animation/a-friendly-introduction-to-spring-physics/) - Spring parameter guidance (stiffness, damping, mass)

### Tertiary (LOW confidence)
- [oklch.fyi](https://oklch.fyi) - OKLCH color picker/converter for visual tuning (tool, not documentation)
- [Evil Martians: OKLCH in CSS](https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl) - Background on why OKLCH > HSL

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Tailwind v4 @theme architecture verified via official docs; Vite + React 18 + TS is locked decision
- Architecture: HIGH - Three-layer token pattern (@theme + @theme inline + :root) verified via official docs and community discussions
- Pitfalls: HIGH - V3-to-V4 migration pitfalls well-documented in official upgrade guide; @theme inline behavior confirmed
- Font loading: HIGH - @font-face with font-display: swap is web standard; font files available as .woff2
- OKLCH values: MEDIUM - Approximate conversions from V1 HSL; need visual tuning during implementation
- Motion system: HIGH - DS-02 requirements clearly specify exact values; CSS cubic-bezier + JS spring constants is industry standard

**Research date:** 2026-03-04
**Valid until:** 2026-04-04 (Tailwind v4 is stable; patterns unlikely to change within 30 days)
