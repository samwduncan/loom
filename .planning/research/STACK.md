# Technology Stack: v1.1 Visual Redesign

**Project:** Loom -- v1.1 Design Overhaul
**Researched:** 2026-03-03
**Scope:** NEW stack additions/changes for the visual redesign milestone only
**Confidence:** HIGH (verified via npm registry, Gemini research, codebase audit)

---

## Baseline Stack (Validated -- No Changes)

These are inherited and already working. This research does NOT cover them.

| Technology | Version | Status |
|------------|---------|--------|
| React 18 + TypeScript | ^18.2.0 / ^5.9.3 | Keep |
| Vite | ^7.0.4 | Keep |
| Tailwind CSS | ^3.4.17 (installed) | Keep |
| CSS Variables (HSL) | `hsl(var(--token) / <alpha-value>)` | Keep -- migrate values only |
| CVA + tailwind-merge + clsx | 0.7.1 / 3.3.1 / 2.1.1 | Keep |
| Shiki v4 | ^4.0.1 | Keep (added in v1.0 research) |
| react-markdown + rehype/remark | ^10.1.0 | Keep |
| react-diff-viewer-continued | ^4.1.2 | Keep |
| lucide-react | ^0.515.0 | Keep |
| @xterm/xterm | ^5.5.0 | Keep -- retheme only |
| CodeMirror 6 | ^4.23.13 (@uiw/react-codemirror) | Keep -- retheme only |
| useScrollAnchor (custom hook) | IntersectionObserver + sentinel | Keep -- already implements smart auto-scroll |

---

## New Stack Additions for v1.1

### 1. Toast Notifications: Sonner

**Add: `sonner` ^2.0.7**

| Library | Version | Unpacked Size | Gzipped | Confidence |
|---------|---------|---------------|---------|-----------|
| `sonner` | ^2.0.7 | ~166KB unpacked | ~3KB gzipped | HIGH |

**Why Sonner:**

The v1.1 milestone requires transient toast notifications for: error states, copy confirmations, connection status changes, successful actions, and async operation lifecycle (promise toasts). The codebase currently has zero toast infrastructure -- errors are either `console.error`'d or shown inline with ad-hoc patterns.

Sonner is the right choice because:

1. **Dark theme native.** `theme="dark"` works immediately. Custom CSS variables (`--normal-bg`, `--normal-border`, `--normal-text`, `--error-bg`, etc.) map directly to Loom's CSS variable architecture via `[data-sonner-toast]` selectors.
2. **Exit animations handled internally.** Sonner manages its own mount/unmount lifecycle with smooth slide-out transitions. No need for `isExiting` state patterns or animation libraries for toasts.
3. **Promise toasts.** `toast.promise(fetchData(), { loading, success, error })` covers the async operation pattern needed for git operations, session saves, and settings changes.
4. **3KB gzipped.** Negligible bundle impact. Zero dependencies.
5. **Used by shadcn/ui.** Battle-tested in the most popular React component library ecosystem.

**Integration with Loom's palette:**

```css
/* In index.css -- charcoal + rose toast overrides */
[data-sonner-toast][data-theme='dark'] {
  --normal-bg: hsl(var(--card));
  --normal-border: hsl(var(--border) / 0.3);
  --normal-text: hsl(var(--foreground));
  --success-bg: hsl(140 20% 12%);
  --success-border: hsl(140 30% 25%);
  --success-text: hsl(140 60% 70%);
  --error-bg: hsl(0 25% 14%);
  --error-border: hsl(0 35% 30%);
  --error-text: hsl(0 60% 75%);
  --warning-bg: hsl(35 25% 14%);
  --warning-border: hsl(35 35% 30%);
  --warning-text: hsl(35 60% 70%);
  font-family: var(--font-mono, 'JetBrains Mono', monospace);
  border-radius: var(--radius);
}
```

**Toaster placement:**

```tsx
// In App.tsx or AppContent.tsx
import { Toaster } from 'sonner'

<Toaster
  theme="dark"
  position="bottom-right"
  richColors
  toastOptions={{
    className: 'font-mono text-xs',
    duration: 4000,
  }}
/>
```

**Why NOT react-hot-toast:** react-hot-toast (202KB unpacked) requires manual dark mode styling, has no native `richColors` or promise toast lifecycle, and its default bright white appearance requires significant CSS overrides for dark themes. Sonner was purpose-built for the modern dark UI pattern.

**Why NOT @radix-ui/react-toast:** Radix toast is headless/unstyled -- it provides accessibility primitives but requires building the entire visual layer. Sonner provides both accessibility and polished defaults with customization hooks. For a project where we want to SHIP a redesign, not build a design system from scratch, Sonner is faster.

---

### 2. Animation: tailwindcss-animate (NOT Motion/Framer Motion)

**Add: `tailwindcss-animate` ^1.0.7**
**REMOVE from plan: `motion` (Framer Motion)**

| Library | Version | Unpacked Size | Runtime JS Cost | Confidence |
|---------|---------|---------------|-----------------|-----------|
| `tailwindcss-animate` | ^1.0.7 | ~18KB (Tailwind plugin) | 0KB -- CSS only | HIGH |

**Why tailwindcss-animate INSTEAD of Motion:**

The previous v1.0 stack research recommended `motion` (Framer Motion) at ^12.x for layout animations and `AnimatePresence`. After deeper analysis of the actual v1.1 requirements and existing codebase patterns, this recommendation is revised:

**The exit animation problem is already solved for every case we need:**

1. **Toasts:** Sonner handles its own enter/exit lifecycle. No external animation library needed.
2. **Modals:** Already use `backdrop-blur-sm` overlays with conditional rendering. The `isExiting` + `onTransitionEnd` pattern (already used in 46+ components via `isVisible`/`isOpen`/`isExpanded` state) handles exit transitions in 10 lines of code. No library needed.
3. **Tool panel expand/collapse:** CSS `grid-template-rows: 0fr -> 1fr` transition handles animated height to/from zero. Already supported by Tailwind 3.4 via `grid-rows-[0fr]` / `grid-rows-[1fr]` with `transition-[grid-template-rows]`. No library needed.
4. **Thinking disclosure, tool call groups:** Same grid-rows trick. Already expand/collapse via `isExpanded` state.
5. **Scroll pill enter/exit:** Already uses CSS `@keyframes pill-enter` with conditional rendering. Exit is instant unmount (acceptable -- pill is small).
6. **Message entrance:** `fade-in` + `slide-in-from-bottom-2` via tailwindcss-animate utilities. No exit animation needed (messages don't leave).
7. **Sidebar slide:** Already uses CSS `transform` transition via `.sidebar-transition` class.

**What tailwindcss-animate provides that Tailwind core does not:**

- Composable `animate-in` / `animate-out` base classes
- `fade-in`, `fade-out`, `slide-in-from-top`, `slide-out-to-bottom`, `zoom-in-95`, `zoom-out-95`
- Data attribute support: `data-[state=open]:animate-in data-[state=closed]:animate-out`
- Fill mode utilities: `fill-mode-forwards`
- All CSS-only -- zero runtime JavaScript, zero bundle size impact on JS

**Example usage for v1.1 components:**

```tsx
// Modal overlay with enter/exit
<div className={cn(
  "fixed inset-0 bg-black/60 backdrop-blur-sm",
  "animate-in fade-in-0 duration-200",
  isExiting && "animate-out fade-out-0 duration-150"
)} />

// Tool panel expand
<div className={cn(
  "grid transition-[grid-template-rows] duration-200 ease-out",
  isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
)}>
  <div className="overflow-hidden">
    {children}
  </div>
</div>

// New message entrance
<div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
  <MessageComponent />
</div>
```

**Why NOT motion (Framer Motion):**

| Concern | Motion | tailwindcss-animate |
|---------|--------|---------------------|
| Gzipped JS cost | 34KB standard, 55KB with layout+gestures | 0KB (CSS only) |
| Runtime overhead | JS animation engine on main thread | Browser compositor thread (GPU) |
| Learning curve | New API (`<m.div>`, `LazyMotion`, `AnimatePresence`) | Tailwind utility classes (team already knows) |
| `height: auto` animation | Solved with `layout` prop | Solved with `grid-rows-[0fr/1fr]` trick |
| Exit animations | `AnimatePresence` -- elegant but heavy | `isExiting` state + CSS -- 10 lines, already used in 46 components |
| Bundle size impact on 1.38MB main JS | +2.5-4% | 0% |

The codebase already has 281 instances of `transition`/`animation`/`@keyframes` across 77 files, all CSS-based. Introducing a JS animation library for the 3-4 cases that need exit animations is not justified when the CSS pattern is already established and working.

**The one case where Motion would genuinely help:** Spring-physics easing. CSS `cubic-bezier` cannot perfectly replicate spring dynamics. However, Loom's design language targets "professional and clean" (Claude.ai, Linear), not "playful and bouncy" (Notion, Arc). `cubic-bezier(0.4, 0, 0.2, 1)` (Tailwind's default ease-out) is the correct easing for this product.

**Tailwind config addition:**

```js
// tailwind.config.js
plugins: [
  require('@tailwindcss/typography'),
  require('tailwindcss-animate'),  // Add
],
```

---

### 3. Color System Migration: CSS Variable Value Swap

**No new library needed. Strategy change only.**

The existing CSS variable architecture (`hsl(var(--token) / <alpha-value>)` in tailwind.config.js, `:root {}` definitions in index.css) is exactly right. The v1.1 migration is a VALUE swap, not an architecture change.

**Current palette (warm earthy -- to be replaced):**

```css
--background: 10 27.3% 8.6%;      /* #1c1210 chocolate */
--foreground: 33.5 63% 89.4%;     /* #f5e6d3 cream */
--primary: 30.6 52.7% 64.3%;      /* #d4a574 amber */
--accent: 21.9 45.6% 55.3%;       /* #c17f59 copper */
```

**New palette (charcoal + dusty rose):**

```css
--background: 0 0% 10.2%;         /* #1a1a1a charcoal */
--foreground: 0 0% 93%;           /* #ededed near-white */
--primary: 4 38% 63%;             /* ~#D4736C dusty rose */
--accent: 4 25% 55%;              /* ~#C97B7B muted pink */
```

**What changes:**
- Replace ALL HSL values in `:root {}` block of `index.css`
- Update `--nav-glass-bg`, `--nav-*` token values
- Replace hardcoded HSL values in scrollbar styles (currently hardcoded `34.5 35.9% 63.9%`)
- Replace hardcoded hex colors in `ScrollToBottomPill.tsx` (`#2a1f1a`, `#c4a882`, `#f5e6d3`, `#3d2e25`)
- Replace hardcoded `#d4a574` in `streaming-cursor.css`
- Replace select dropdown SVG stroke color (`%23c4a882` URL-encoded)
- Add CSS variables for scrollbar colors instead of hardcoded values

**New CSS variables to add (not in current system):**

```css
:root {
  /* Scrollbar -- currently hardcoded, should be tokenized */
  --scrollbar-thumb: 0 0% 35%;
  --scrollbar-thumb-hover: 0 0% 45%;

  /* Surface hierarchy -- more granular for charcoal */
  --surface-0: 0 0% 10.2%;        /* #1a1a1a -- deepest */
  --surface-1: 0 0% 13.3%;        /* #222222 -- cards, panels */
  --surface-2: 0 0% 16.5%;        /* #2a2a2a -- elevated */
  --surface-3: 0 0% 20%;          /* #333333 -- highest elevation */

  /* Rose accent scale */
  --rose-50: 4 38% 63%;           /* Primary rose */
  --rose-muted: 4 20% 45%;        /* Muted for borders/subtle */
  --rose-glow: 4 45% 70%;         /* Bright for active states */
}
```

**Why surface hierarchy matters:** The current 3-tier model (`--background`, `--card`, `--secondary`) maps cleanly. Adding explicit `--surface-N` tokens makes the charcoal depth system more intentional, since pure charcoal grays lack the natural contrast that warm browns provided.

**Hardcoded colors audit (must be converted to CSS variables):**

| File | Hardcoded Value | Replace With |
|------|----------------|--------------|
| `ScrollToBottomPill.tsx` | `bg-[#2a1f1a]`, `border-[#c4a882]/30`, `text-[#f5e6d3]`, `hover:bg-[#3d2e25]` | `bg-card`, `border-border/30`, `text-foreground`, `hover:bg-secondary` |
| `streaming-cursor.css` | `color: #d4a574` | `color: hsl(var(--primary))` |
| `index.css` (scrollbar) | `hsl(34.5 35.9% 63.9% / 0.3)` | `hsl(var(--scrollbar-thumb))` |
| `index.css` (select SVG) | `stroke='%23c4a882'` | Use CSS `mask-image` or new variable |
| `ShellMinimalView.tsx` | Multiple `gray-700`, `gray-800`, `gray-900` | Semantic tokens |
| `TurnToolbar.tsx` | `gray-500`, `gray-900/80`, `gray-700/50` | Semantic tokens |

---

### 4. Glassmorphism / Blur Effects

**No new library needed. Already established in codebase.**

The codebase already has 25+ instances of `backdrop-blur-sm` and a complete `nav-glass` utility class system with CSS variable tokens:

```css
.nav-glass {
  background: hsl(var(--nav-glass-bg));
  backdrop-filter: blur(var(--nav-glass-blur)) saturate(var(--nav-glass-saturate));
}
```

**What to change for v1.1:**
- Update `--nav-glass-bg` HSL values to charcoal
- Audit `backdrop-blur-sm` vs `backdrop-blur-md` usage for consistency
- Consider adding a `glass-surface` utility class for panels (not just nav) that want the frost effect

**No performance concern:** `backdrop-filter: blur()` is GPU-composited. The existing usage across 25+ components confirms it performs well on the target hardware.

---

### 5. Scroll Behavior

**No new library needed. Already implemented.**

The `useScrollAnchor` hook already implements the optimal smart auto-scroll pattern:
- IntersectionObserver + sentinel div (zero scroll-event overhead)
- `isAtBottom` state driven by observer
- `isUserScrolledUp` for disengage detection
- `scrollToBottom('smooth')` for re-engage
- 100px rootMargin tolerance

**What to change for v1.1:**
- Improve the `ScrollToBottomPill` visual design (currently hardcoded warm colors -- see color audit above)
- Add new message count badge styling to match charcoal + rose palette
- Consider adding subtle `animate-in slide-in-from-bottom-2` entrance via tailwindcss-animate

**What NOT to add:** No virtualization library (`@tanstack/react-virtual`) needed yet. Chat sessions rarely exceed 100 turns, and CSS `contain: content` on `.message-streaming` already prevents layout thrash.

---

### 6. Micro-Interactions

**No new library needed. CSS transitions + tailwindcss-animate cover all cases.**

The codebase already has a solid transition foundation:

```css
/* Global interactive element transitions */
button, a, input, textarea, select, [role="button"], .transition-all {
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

**v1.1 micro-interaction patterns (all achievable with CSS):**

| Interaction | CSS Approach |
|------------|-------------|
| Button hover glow | `hover:shadow-[0_0_12px_hsl(var(--primary)/0.3)]` |
| Button active press | `active:scale-[0.98]` (already in codebase) |
| Icon rotation on expand | `transition-transform duration-200` + conditional `rotate-180` |
| Focus ring with rose accent | `focus-visible:ring-2 ring-primary/40 ring-offset-2 ring-offset-background` |
| Sidebar item hover | `hover:bg-surface-2` with `transition-colors duration-150` |
| Code block copy feedback | Swap icon from Copy to Check with `animate-in fade-in-0 zoom-in-75` |
| Input focus border glow | `focus-within:border-primary/40 focus-within:shadow-[0_0_8px_hsl(var(--primary)/0.15)]` |

**Easing tokens to standardize:**

```js
// tailwind.config.js extend
transitionTimingFunction: {
  'ease-out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',   // Fast start, gentle decelerate
  'ease-in-out-smooth': 'cubic-bezier(0.4, 0, 0.2, 1)', // Default (already used)
},
transitionDuration: {
  'fast': '100ms',    // Active states
  'normal': '150ms',  // Hover states
  'slow': '300ms',    // Layout changes
  'slower': '500ms',  // Page-level transitions
},
```

---

## Packages to Add

```bash
# Toast notifications
npm install sonner

# Animation utilities (Tailwind plugin -- CSS only, zero JS runtime)
npm install -D tailwindcss-animate
```

**Total JS bundle impact: ~3KB gzipped** (Sonner only; tailwindcss-animate adds zero JS)

---

## Packages NOT to Add (Revised from v1.0 Research)

| Package | Previous Recommendation | Why NOT for v1.1 |
|---------|------------------------|-------------------|
| `motion` (Framer Motion) | v1.0 research: ADD | 34-55KB gzipped JS for 3-4 exit animation cases; CSS `grid-rows` trick + `isExiting` pattern + tailwindcss-animate covers all v1.1 needs at 0KB JS cost |
| `@formkit/auto-animate` | Not previously considered | 56KB unpacked for "magic" list transitions; insufficient control for specific animation timing |
| `react-hot-toast` | Not recommended | Worse dark mode support than Sonner; requires manual CSS overrides for charcoal theme |
| `@radix-ui/react-toast` | Not recommended | Headless/unstyled -- would need to build entire visual layer; Sonner provides both a11y + visuals |
| `@tanstack/react-virtual` | Not recommended for v1.1 | Premature optimization; chat sessions rarely exceed 100 turns; `contain: content` already prevents layout thrash |
| `tailwind-scrollbar` | Not recommended | Custom scrollbar styling already implemented via CSS in index.css; a plugin would just duplicate what exists |

---

## Alternatives Considered (v1.1 Specific)

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Toast | `sonner` ^2.0.7 | `react-hot-toast` | No native dark theme, no richColors, no promise toasts; requires manual CSS overrides |
| Toast | `sonner` ^2.0.7 | `@radix-ui/react-toast` | Headless only -- must build all visuals; slower to ship |
| Toast | `sonner` ^2.0.7 | Custom implementation | Toast lifecycle (stacking, timing, exit animation, accessibility) is deceptively complex; Sonner handles it in 3KB |
| Animation | `tailwindcss-animate` | `motion` (Framer Motion) | 34-55KB JS overhead for cases solvable with CSS; team already uses CSS transition patterns throughout 77 files |
| Animation | `tailwindcss-animate` | CSS-only (no plugin) | Plugin provides composable `animate-in`/`animate-out` + `fade-in`/`slide-in-from-*` utilities; writing these as raw `@keyframes` in index.css is viable but messier |
| Animation | `tailwindcss-animate` | `react-transition-group` | Heavier than the `isExiting` pattern already used; adds React component wrapper overhead |
| Scroll | `useScrollAnchor` (keep) | `@tanstack/react-virtual` | Premature; current IntersectionObserver pattern performs well |
| Color system | CSS variable value swap | Tailwind config color objects | CSS variables allow runtime theming; hardcoded Tailwind colors require rebuild |

---

## Installation

```bash
# New runtime dependency
npm install sonner

# New dev dependency (Tailwind plugin)
npm install -D tailwindcss-animate
```

**Tailwind config update:**

```js
// tailwind.config.js
plugins: [
  require('@tailwindcss/typography'),
  require('tailwindcss-animate'),  // ADD THIS
],
```

---

## Integration Points with Existing System

### Sonner + CSS Variables

Sonner reads `data-theme` attribute on its toast container. Set `theme="dark"` on `<Toaster>` to get dark defaults, then override specific colors via `[data-sonner-toast]` CSS selectors using Loom's CSS variables. This means toast colors automatically update when the palette variables change -- no component-level styling needed.

### tailwindcss-animate + CVA

The existing CVA (class-variance-authority) patterns compose cleanly with tailwindcss-animate classes:

```tsx
const toolPanel = cva(
  "grid transition-[grid-template-rows] duration-200 ease-out",
  {
    variants: {
      state: {
        open: "grid-rows-[1fr] animate-in fade-in-0",
        closed: "grid-rows-[0fr]",
      },
    },
  }
);
```

### CSS Variable Architecture

The `hsl(var(--token) / <alpha-value>)` pattern in tailwind.config.js is preserved. Only the `:root {}` values in index.css change. Every component using `bg-background`, `text-foreground`, `border-border`, `bg-primary`, etc. automatically picks up the new charcoal + rose palette.

---

## What to Change in Existing Files (No New Libraries Needed)

| File | Change | Why |
|------|--------|-----|
| `src/index.css` `:root {}` | Replace all HSL values with charcoal + rose | Palette migration |
| `src/index.css` scrollbar styles | Replace hardcoded HSL with `var(--scrollbar-thumb)` | Tokenize scrollbar colors |
| `src/index.css` select SVG | Replace hardcoded stroke color | Palette migration |
| `tailwind.config.js` | Add `tailwindcss-animate` plugin, easing tokens, duration tokens | Animation utilities |
| `streaming-cursor.css` | Replace `#d4a574` with `hsl(var(--primary))` | Palette migration |
| `aurora-shimmer.css` | No change needed | Aurora uses oklch, palette-independent |
| Components with hardcoded hex/gray | Replace with semantic Tailwind tokens | Palette migration |

---

## Version Compatibility Matrix

| Package | React 18 | Tailwind 3.4 | Vite 7 | TypeScript 5 |
|---------|----------|-------------|--------|-------------|
| `sonner` ^2.0.7 | Yes (peer dep: ^18.0.0) | N/A (CSS only theming) | Yes | Yes (ships types) |
| `tailwindcss-animate` ^1.0.7 | N/A (Tailwind plugin) | Yes (peer dep: >=3.0.0) | N/A | N/A |

---

## Sources

- npm registry (verified 2026-03-03): `sonner@2.0.7` (166KB unpacked, peer: react ^18), `tailwindcss-animate@1.0.7` (18KB, peer: tailwindcss >=3.0.0), `motion@12.34.4` (597KB unpacked), `framer-motion@12.34.4` (4.59MB unpacked), `react-hot-toast@2.6.0` (203KB unpacked), `@radix-ui/react-toast@1.2.15` (180KB unpacked), `@formkit/auto-animate@0.9.0` (56KB unpacked)
- Gemini research (2026-03-03): Sonner API (theme, richColors, promise toasts, CSS variable overrides), Framer Motion vs CSS-only analysis, tailwindcss-animate composable utilities, smart auto-scroll patterns, CSS grid-rows height animation technique
- Codebase audit (2026-03-03): 281 transition/animation/keyframes instances across 77 files (all CSS-based), 25+ backdrop-blur instances, 46+ isVisible/isOpen/isExpanded state patterns, useScrollAnchor hook (IntersectionObserver + sentinel), ScrollToBottomPill (hardcoded colors), streaming-cursor.css (hardcoded #d4a574), index.css scrollbar styles (hardcoded HSL)
- Tailwind CSS 3.4.17 installed version confirmed via `npx tailwindcss --help`
- Current main JS bundle: 1.38MB (dist/assets/index-*.js); adding Motion would increase by 2.5-4%

---

*Stack research for: Loom v1.1 -- Visual Redesign (charcoal + dusty rose palette)*
*Researched: 2026-03-03*
*Previous research (v1.0): 2026-03-01 -- recommendations for Shiki, react-markdown, motion (Framer Motion) revised here*
