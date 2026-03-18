# Technology Stack: v1.5 "The Craft" Additions

**Project:** Loom V2
**Researched:** 2026-03-18
**Scope:** Spring animations, glass effects, DecryptedText reveals, StarBorder accents, UI audit tooling

## Executive Decision

**Do NOT add Motion (framer-motion) as a dependency.** The v1.5 scope does not justify 34KB (or even 4.6KB LazyMotion) of runtime JavaScript. Every feature in scope can be achieved with CSS-only or tiny zero-dependency JS patterns. The Constitution's tiered animation strategy (Section 11.1) explicitly prioritizes CSS-only first, and nothing in v1.5 requires orchestrated multi-step animations, layout animations, or gesture handling -- the only scenarios where Motion earns its weight.

## Recommended Additions

### Spring Physics via CSS `linear()` (ZERO new runtime dependencies)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| CSS `linear()` | Native | Spring easing curves | 90% browser support (Chrome 113+, Firefox 112+, Safari 17.2+). Generates real spring physics curves statically. Zero JS runtime cost. |
| `spring-easing` | 2.3.3 | **devDependency only** -- build-time spring curve generator | Converts stiffness/damping/mass configs into CSS `linear()` values. Used once to precompute curves, NOT shipped to browser. |

**How it works:** Use `spring-easing`'s `CSSSpringEasing()` function to convert the existing `SPRING_GENTLE`, `SPRING_SNAPPY`, `SPRING_BOUNCY` configs from `motion.ts` into CSS `linear()` values at dev time. Paste the output into `tokens.css` as `--ease-spring-gentle`, `--ease-spring-snappy`, `--ease-spring-bouncy` custom properties. The browser does the rest -- GPU-accelerated, no JS, no library runtime.

**Confidence:** HIGH -- CSS `linear()` is well-documented, supported in all major browsers since Safari 17.2 (Dec 2023). The `spring-easing` library has been stable at v2.3.3 since 2024.

**Fallback strategy:** Safari 17.2+ covers ~90% globally. For the remaining ~10%, the existing `cubic-bezier(0.34, 1.56, 0.64, 1)` spring approximation in `--ease-spring` serves as a graceful degradation. No conditional logic needed -- just declare both:
```css
transition-timing-function: var(--ease-spring); /* fallback cubic-bezier */
transition-timing-function: var(--ease-spring-gentle); /* linear() override */
```

### Glass/Frosted Effects via CSS `backdrop-filter` (ZERO new dependencies)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| CSS `backdrop-filter` | Native | Frosted glass on modals, command palette | 97% global support. GPU-accelerated. All major browsers (Chrome 76+, Firefox 103+, Safari 9+, Edge 17+). |

**Why NOT React Bits GlassSurface:** The prior research (visual-effects-audit.md) flagged GlassSurface as "Chrome-only for full SVG filter support." The SVG displacement approach adds visual complexity (refraction, chromatic aberration) but degrades to nothing on Firefox/Safari. Pure `backdrop-filter: blur()` looks great everywhere and costs zero bytes. The "liquid glass" trend is over-engineered for a developer productivity tool.

**Implementation pattern:**
```css
.glass-surface {
  background: oklch(from var(--surface-1) l c h / 0.6);
  backdrop-filter: blur(12px) saturate(1.4);
  -webkit-backdrop-filter: blur(12px) saturate(1.4);
  border: 1px solid oklch(from var(--border-subtle) l c h / 0.3);
}
```

**Confidence:** HIGH -- `backdrop-filter` at 97% is production-safe. Performance is fine for 3-5 glass elements (modals, command palette, quick settings). Avoid applying to large scrollable areas.

### DecryptedText (ZERO new dependencies -- source-copy, refactored)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Custom `DecryptedText` component | N/A (source) | "Hacker" text reveal for session titles, model names | React Bits version imports `motion/react` but only uses it for a `<motion.span>` wrapper -- trivially replaceable with a plain `<span>`. Core animation is `setInterval` + React state. |

**Key finding:** The React Bits `DecryptedText` component uses `import { motion } from 'motion/react'` but the ONLY usage is `<motion.span>` as a wrapper element for mouse events (`onMouseEnter`, `onMouseLeave`). This is a plain `<span>` with event handlers -- Motion adds zero animation value here. We strip the Motion import and use a regular `<span>`.

**Implementation approach:** Copy the React Bits source into `src/src/components/effects/DecryptedText.tsx`, replace `<motion.span>` with `<span>`, add TypeScript types, OKLCH token integration, and `prefers-reduced-motion` support. The animation engine is pure `setInterval` with `useState` -- no animation library needed.

**Bundle impact:** 0KB additional dependencies. Component itself is ~200 lines of TypeScript.

**Confidence:** HIGH -- the source code is verified (read from GitHub). The Motion dependency is confirmed unnecessary for the actual animation logic.

### StarBorder / ElectricBorder (ALREADY EXISTS)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `ElectricBorder` component | Existing | Animated border accents on active/focused elements | Already built, CSS-only, used in ChatComposer. StarBorder from React Bits IS ElectricBorder (renamed during Phase 7). |

**No new component work needed.** v1.5 scope is about applying ElectricBorder to more surfaces (sidebar active items, focused cards, settings panels) -- the infrastructure already exists.

**Confidence:** HIGH -- component exists at `src/src/components/effects/ElectricBorder.tsx`, CSS at `ElectricBorder.css`, and is in production use in ChatComposer.

## What NOT to Add

| Rejected | Size (gzip) | Reason |
|----------|-------------|--------|
| `motion` (framer-motion) | 34KB full / 4.6KB LazyMotion | Overkill. Nothing in v1.5 needs layout animations, AnimatePresence, gesture handling, or orchestrated sequences. CSS `linear()` springs + tailwindcss-animate covers everything. Constitution Section 11.1 Tier 3 says "NEEDS REVIEW -- may not be needed if CSS covers all cases." CSS covers all v1.5 cases. |
| `react-spring` | ~25KB | Same over-engineering problem. Physics engine for what CSS `linear()` now handles natively. |
| `ogl` (WebGL) | ~30KB lazy | Aurora/Grainient are v2.1 scope, not v1.5. Don't front-load WebGL overhead for a milestone focused on production quality and detail. |
| React Bits GlassSurface (source) | 0KB source | SVG displacement is Chrome-only for full effect. `backdrop-filter` is universal and sufficient. |
| `tailwindcss-spring` plugin | ~3KB | v1.0.1 (Aug 2024), uses `tailwind.config.js` plugin API -- NOT verified compatible with Tailwind v4's `@plugin` directive. Manual `linear()` token generation via `spring-easing` is simpler, more controllable, and doesn't add a plugin dependency with uncertain v4 compatibility. |
| `use-scramble` (npm) | ~2KB | Unnecessary. DecryptedText source-copy is cleaner and matches existing effects pattern (SpotlightCard, ShinyText, ElectricBorder are all source-copied). |

## Dev Dependencies Only

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `spring-easing` | ^2.3.3 | **devDependency** -- precompute CSS `linear()` spring curves | Run once to generate token values. Not shipped to browser. Alternative: use the online CSS Spring Easing Generator at kvin.me/css-springs and paste values manually -- zero dependency option. |

## Existing Stack Leveraged (No Changes)

| Existing | How It's Used for v1.5 |
|----------|----------------------|
| `tw-animate-css` (tailwindcss-animate) | Message entrances, modal overlays, toast animations. Already Tier 2 in Constitution. |
| CSS `@keyframes` + `transition` | ElectricBorder, SpotlightCard, ShinyText all use this pattern. Continue for new spring transitions. |
| `motion.ts` spring configs | `SPRING_GENTLE`, `SPRING_SNAPPY`, `SPRING_BOUNCY` configs become inputs to `spring-easing` for CSS `linear()` generation. JS configs preserved as reference and for any future JS-driven animation. |
| `tokens.css` easing tokens | New `--ease-spring-gentle/snappy/bouncy` + `--duration-spring-gentle/snappy/bouncy` tokens added alongside existing `--ease-spring` cubic-bezier approximation. |
| `prefers-reduced-motion` patterns | 16 files already respect reduced motion. Continue pattern for all new animations. |
| OKLCH color system | Glass surfaces use `oklch(from var(--token) l c h / alpha)` relative color syntax for translucent backgrounds. |
| `components/effects/` directory | Established pattern: SpotlightCard, ShinyText, ElectricBorder. DecryptedText goes here. |

## Installation

```bash
# Dev dependency only -- used to generate CSS token values, not shipped to browser
cd /home/swd/loom/src
npm install -D spring-easing@^2.3.3
```

**Runtime dependency changes: NONE.** Every v1.5 visual feature runs on CSS that's already in the browser.

## Spring Token Generation Script

One-time dev utility to generate CSS custom property values:

```typescript
// scripts/generate-spring-tokens.ts (run with tsx)
import { CSSSpringEasing } from 'spring-easing';

const springs = {
  gentle: { stiffness: 120, damping: 14, mass: 1 },
  snappy: { stiffness: 300, damping: 20, mass: 1 },
  bouncy: { stiffness: 180, damping: 12, mass: 1 },
};

for (const [name, config] of Object.entries(springs)) {
  const [easing, duration] = CSSSpringEasing(
    `spring(${config.mass}, ${config.stiffness}, ${config.damping}, 0)`,
    { numPoints: 50 }
  );
  console.log(`--ease-spring-${name}: ${easing};`);
  console.log(`--duration-spring-${name}: ${duration};`);
  console.log();
}
```

Output goes into `tokens.css`. Run once per spring config change.

## Integration Points

| Existing System | Integration |
|----------------|-------------|
| `tokens.css` | Add 6 new custom properties: 3 `--ease-spring-*` easing + 3 `--duration-spring-*` duration |
| `motion.ts` | Keep JS spring configs as-is. Add JSDoc comment referencing CSS token equivalents. |
| `tw-animate-css` | Continue using for entrance/exit animations (fade-in, slide-in). Spring easings layer ON TOP via `transition-timing-function` override. |
| Constitution Section 11.1 | Tier 1 (CSS-only) handles all v1.5 animation needs. Tier 3 (LazyMotion) remains deferred -- revisit in v2.1 if orchestrated sequences are needed. |
| `prefers-reduced-motion` | All new spring transitions use existing `@media (prefers-reduced-motion: reduce)` pattern with `0.01ms` duration override (preserves animationend events). |
| OKLCH color system | Glass surfaces use `oklch(from var(--token) l c h / alpha)` relative color syntax. No hex conversion needed (that's only for WebGL shaders in v2.1). |

## Bundle Size Impact Summary

| Addition | Runtime Size | Notes |
|----------|-------------|-------|
| CSS spring tokens | 0KB | Static CSS custom properties |
| Glass surface CSS | 0KB | CSS `backdrop-filter`, no JS |
| DecryptedText component | ~0.5KB gzip | Source-copied, zero deps |
| ElectricBorder expansion | 0KB | Already exists, just apply to more elements |
| `spring-easing` devDep | 0KB runtime | Build-time only, not bundled |
| **TOTAL** | **~0.5KB** | |

## Sources

- [Motion bundle size docs](https://motion.dev/docs/react-reduce-bundle-size) -- 34KB full, 4.6KB LazyMotion, 2.3KB useAnimate mini
- [LazyMotion docs](https://motion.dev/docs/react-lazy-motion) -- feature splitting approach
- [CSS `linear()` browser support](https://caniuse.com/mdn-css_types_easing-function_linear-function) -- 90% global, Safari 17.2+
- [CSS `backdrop-filter` support](https://caniuse.com/css-backdrop-filter) -- 97% global
- [CSS spring animation via linear()](https://pqina.nl/blog/css-spring-animation-with-linear-easing-function/) -- build-time generation approach
- [spring-easing npm](https://www.npmjs.com/package/spring-easing) -- v2.3.3, CSSSpringEasing utility
- [CSS Spring Easing Generator](https://www.kvin.me/css-springs) -- interactive online tool
- [React Bits DecryptedText source](https://github.com/DavidHDev/react-bits/blob/main/src/content/TextAnimations/DecryptedText/DecryptedText.jsx) -- verified Motion dependency is trivially removable
- [React Bits StarBorder source](https://github.com/DavidHDev/react-bits/blob/main/src/content/Animations/StarBorder/StarBorder.jsx) -- pure CSS, no dependencies
- [Josh Comeau on backdrop-filter](https://www.joshwcomeau.com/css/backdrop-filter/) -- implementation patterns
- [Firefox backdrop-filter](https://bugzilla.mozilla.org/show_bug.cgi?id=1578503) -- enabled by default in Firefox 103+
- [tailwindcss-spring GitHub](https://github.com/KevinGrajeda/tailwindcss-spring) -- v1.0.1, uncertain Tailwind v4 compatibility
- [Motion useSpring docs](https://motion.dev/docs/react-use-spring) -- spring physics hook (rejected for v1.5)
- [Animating React UIs in 2025](https://hookedonui.com/animating-react-uis-in-2025-framer-motion-12-vs-react-spring-10/) -- Framer Motion 12 vs React Spring 10 comparison
