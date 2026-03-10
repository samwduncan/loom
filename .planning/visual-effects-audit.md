# Visual Effects Library Audit for Loom V2

**Date:** 2026-03-06
**Status:** Research Complete — Awaiting Decision
**Reviewers:** Claude (engineer), Gemini Architect (consultant)

---

## Executive Summary

We evaluated 4 sources of visual effect components for Loom V2:
1. **React Bits** (reactbits.dev) — 122 animated React components
2. **shadcn/ui** — 403 registry items (UI primitives + blocks)
3. **UntitledUI** — 91 professional design system components
4. **liquid-glass-react** — Standalone Apple Liquid Glass effect

**Recommendation:** Cherry-pick from React Bits (source-level, not npm), adopt shadcn/ui for M2/M3 primitives, skip UntitledUI and liquid-glass-react.

---

## 1. React Bits — Full Component Catalogue

### Backgrounds (36 components)
Aurora, Balatro, Ballpit, Beams, ColorBends, DarkVeil, Dither, DotGrid, FaultyTerminal, FloatingLines, Galaxy, GradientBlinds, Grainient, GridDistortion, GridMotion, GridScan, Hyperspeed, Iridescence, LetterGlitch, LightPillar, LightRays, Lightning, LiquidChrome, LiquidEther, Orb, Particles, PixelBlast, PixelSnow, Plasma, Prism, PrismaticBurst, RippleGrid, Silk, Squares, Threads, Waves

### Animations (28 components)
AnimatedContent, Antigravity, BlobCursor, ClickSpark, Crosshair, Cubes, ElectricBorder, FadeContent, GhostCursor, GlareHover, GradualBlur, ImageTrail, LaserFlow, LogoLoop, Magnet, MagnetLines, MetaBalls, MetallicPaint, Noise, OrbitImages, PixelTrail, PixelTransition, Ribbons, ShapeBlur, SplashCursor, StarBorder, StickerPeel, TargetCursor

### Components (35 components)
AnimatedList, BounceCards, BubbleMenu, CardNav, CardSwap, Carousel, ChromaGrid, CircularGallery, Counter, DecayCard, Dock, DomeGallery, ElasticSlider, FlowingMenu, FluidGlass, FlyingPosters, Folder, GlassIcons, GlassSurface, GooeyNav, InfiniteMenu, Lanyard, MagicBento, Masonry, ModelViewer, PillNav, PixelCard, ProfileCard, ReflectiveCard, ScrollStack, SpotlightCard, Stack, StaggeredMenu, Stepper, TiltedCard

### Text Animations (23 components)
ASCIIText, BlurText, CircularText, CountUp, CurvedLoop, DecryptedText, FallingText, FuzzyText, GlitchText, GradientText, RotatingText, ScrambledText, ScrollFloat, ScrollReveal, ScrollVelocity, ShinyText, Shuffle, SplitText, TextCursor, TextPressure, TextType, TrueFocus, VariableProximity

### Dependencies by Component Type
| Dependency | Size (gzip) | Components Using It |
|------------|-------------|---------------------|
| `ogl` | ~30KB | Aurora, Grainient, LiquidChrome, Iridescence, and ~10 others |
| `three` + `@react-three/fiber` | ~500KB | Silk, FluidGlass only |
| CSS only | 0KB | SpotlightCard, StarBorder, ElectricBorder, ShinyText, DarkVeil |
| `framer-motion` | ~40KB (LazyMotion) | Some animation components |

---

## 2. Shortlisted Components for Loom V2

### Tier 1: High Priority (M2-M3)
These directly enhance the chat experience and are architecturally compatible.

#### Aurora (Background)
- **What:** WebGL shader — flowing Northern Lights gradient
- **Dep:** `ogl` (~30KB)
- **Props:** `colorStops` (hex[3]), `amplitude`, `blend`, `speed`
- **Use in Loom:** Subtle background behind the chat viewport during AI streaming. Activated when `isStreaming=true`, paused otherwise.
- **Token Integration:** Wrapper converts `--fx-gradient-rose`, `--fx-gradient-violet`, `--fx-gradient-teal` from OKLCH to hex via `getComputedStyle` → shader uniforms
- **Performance:** Single fullscreen quad shader. Minimal GPU load at half-res. Safe on Radeon 780M.
- **Constitution compliance:** Must wrap in CSS containment, use design tokens only

#### Grainient (Background)
- **What:** WebGL shader — animated gradient with film grain overlay
- **Dep:** `ogl` (~30KB, shared with Aurora)
- **Props:** 22+ including `color1-3` (hex), `grainAmount`, `warpStrength`, `timeSpeed`
- **Use in Loom:** Alternative/complement to Aurora. The grain texture adds cinematic quality to the dark theme. Could be the default "idle" background.
- **Token Integration:** Same OKLCH→hex wrapper as Aurora
- **Performance:** Similar to Aurora — single shader, minimal GPU

#### SpotlightCard (Animation)
- **What:** Pure CSS spotlight hover effect — radial gradient follows mouse
- **Dep:** None (CSS only)
- **Use in Loom:** Sidebar session items, tool cards, settings panels. Adds depth on hover without JS overhead.
- **Token Integration:** Trivial — just CSS custom properties
- **Constitution compliance:** CSS-only = Tier 1 animation. Perfect fit.

#### ShinyText (Text Animation)
- **What:** CSS gradient animation on text — shimmer/shine sweep
- **Dep:** None (CSS only)
- **Use in Loom:** "Thinking..." indicator, status messages, branding text
- **Token Integration:** Trivial — CSS gradient stops use tokens
- **Constitution compliance:** CSS-only = Tier 1 animation

#### StarBorder / ElectricBorder (Animation)
- **What:** Animated border effects — rotating gradient or electric pulse around element
- **Dep:** CSS only
- **Use in Loom:** Chat composer border when AI is actively streaming. "Alive" feeling on the input area.
- **Token Integration:** CSS custom properties
- **Constitution compliance:** CSS-only

### Tier 2: Worth Prototyping (M3)
Need performance testing before committing.

#### GlassSurface (Component)
- **What:** SVG displacement filter glass effect with chromatic aberration
- **Dep:** None (SVG filters)
- **Use in Loom:** Overlay panels, settings modal, command palette. More dramatic than `backdrop-filter`.
- **Caveat:** Chrome-only for full SVG filter support. Safari/Firefox get CSS fallback.
- **Token Integration:** Wrapper needed for color props

#### DecryptedText (Text Animation)
- **What:** "Hacker" text reveal — characters scramble then resolve to final text
- **Dep:** None (JS + CSS)
- **Use in Loom:** Session titles when loading, "New conversation" animation, model name reveals
- **Caveat:** Must be used sparingly — gets gimmicky fast

#### LiquidChrome (Background)
- **What:** WebGL metallic liquid effect, mouse-interactive
- **Dep:** `ogl` (~30KB shared)
- **Use in Loom:** Settings/about page accent, or very subtle ambient effect
- **Caveat:** More dramatic than Aurora. Might be distracting in a productivity tool.

#### Iridescence (Background)
- **What:** WebGL holographic/rainbow shimmer effect
- **Dep:** `ogl` (~30KB shared)
- **Use in Loom:** Accent element, not full background. Could work on sidebar header.

### Tier 3: Rejected
| Component | Reason |
|-----------|--------|
| FluidGlass | THREE.js (~500KB). Way too heavy for a chat app. |
| Silk | THREE.js. Same issue. |
| liquid-glass-react | SVG displacement, Chrome-only, limited browser support |
| Ballpit / Particles / Galaxy | Too playful for a developer tool aesthetic |
| SplashCursor / BlobCursor | Cursor effects are distracting during code work |
| FaultyTerminal | Too gimmicky for production |
| Hyperspeed | Star Wars hyperspace is not our vibe |

---

## 3. shadcn/ui — Recommended as Primitive Layer

### What It Gives Us
403 items in the `@shadcn` registry. Key categories:

**UI Primitives (58 components):**
accordion, alert, alert-dialog, avatar, badge, breadcrumb, button, button-group, calendar, card, carousel, chart, checkbox, collapsible, combobox, command, context-menu, dialog, drawer, dropdown-menu, empty, field, form, hover-card, input, input-group, input-otp, item, kbd, label, menubar, navigation-menu, pagination, popover, progress, radio-group, resizable, scroll-area, select, separator, sheet, sidebar, skeleton, slider, sonner, spinner, switch, table, tabs, textarea, toggle, toggle-group, tooltip, native-select, direction

**Blocks (pre-composed layouts):**
16 sidebar variants, 5 login pages, 5 signup pages, dashboard-01, 50+ chart variants

### Why shadcn Fits
1. **Copy-paste model** — no runtime dependency, we own the code
2. **Radix primitives** under the hood — best-in-class accessibility (ARIA)
3. **Tailwind-native** — works with our v4 setup
4. **Constitution-compatible** — components use CSS variables, customizable
5. **M2 needs these:** Dialog (permission requests), Command (Cmd+K palette), Scroll-area, Tooltip, Dropdown, Sheet, Sonner (toasts)

### Integration Strategy
- Run `npx shadcn@latest init` in `src/` directory
- Cherry-pick only what M2 needs (estimated 10-15 components)
- Restyle to use our OKLCH tokens (override shadcn CSS variables)
- Keep component files in `src/src/components/ui/`

---

## 4. UntitledUI — Not Recommended

### What It Offers
91 components across base (27), application (24), marketing (23), foundations (10), shared-assets (7).

### Why We're Passing
1. **Heavy overlap with shadcn** — both provide button, input, select, tabs, etc.
2. **react-aria dependency** — different primitive layer than Radix (shadcn). Mixing both creates inconsistency.
3. **Marketing-heavy** — 23 marketing components we'll never use
4. **Less ecosystem support** than shadcn
5. **One useful item:** `background-patterns` shared asset. Can replicate with CSS.

### Exception
If we need a specific UntitledUI component that shadcn doesn't have (e.g., advanced date-picker with `@internationalized/date`), we can cherry-pick that single component.

---

## 5. Token Integration Strategy

### The OKLCH-to-Hex Bridge
React Bits shader components need hex colors. Our tokens are OKLCH. Solution:

```typescript
// src/src/lib/oklch-to-hex.ts
// Reads CSS custom properties and converts OKLCH to hex for WebGL uniforms

export function getTokenAsHex(tokenName: string): string {
  const computed = getComputedStyle(document.documentElement)
    .getPropertyValue(tokenName).trim();
  // Parse OKLCH and convert to hex via canvas 2D context
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = computed; // Browser parses OKLCH natively
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}

// Usage: Aurora wrapper
const colorStops = [
  getTokenAsHex('--fx-gradient-rose'),
  getTokenAsHex('--fx-gradient-violet'),
  getTokenAsHex('--fx-gradient-teal'),
];
```

### Performance-Gated Activation
```typescript
// Effects only run when appropriate
const shouldAnimate = useUiPreferences(s => s.reducedMotion === false);
const isStreaming = useStreamStore(s => s.isStreaming);

// Aurora: only during streaming, with CSS containment
{shouldAnimate && isStreaming && (
  <div style={{ contain: 'strict', position: 'absolute', inset: 0, zIndex: 'var(--z-base)' }}>
    <Aurora colorStops={colorStops} speed={0.3} amplitude={0.6} blend={0.4} />
  </div>
)}
```

---

## 6. Dependency Budget

| Dependency | Size (gzip) | When | Components |
|------------|-------------|------|------------|
| `ogl` | ~30KB | Lazy (M3) | Aurora, Grainient, LiquidChrome, Iridescence |
| shadcn primitives | 0KB (source) | M2 | Dialog, Command, Tooltip, etc. |
| CSS-only effects | 0KB | M2-M3 | SpotlightCard, ShinyText, StarBorder, ElectricBorder |

**Total new runtime dependency: ~30KB (ogl, lazy-loaded)**
THREE.js and liquid-glass-react: rejected (too heavy / limited browser support)

---

## 7. Implementation Roadmap

### M2 "The Chat" — Structural Integration
- **shadcn/ui init + cherry-pick primitives** (early M2)
  - dialog, command, scroll-area, tooltip, dropdown-menu, sheet, sonner, kbd
  - Restyle all to OKLCH tokens (override shadcn CSS variables)
- **CSS-only effects ride alongside their surfaces** (throughout M2)
  - SpotlightCard hover on sidebar session items
  - ShinyText on status/thinking indicators
  - These cost zero bytes and enhance surfaces as we build them

### M3 "The Polish" — Visual Effects (phased)
- **Phase 1: Token Unification** — Remap all shadcn CSS variables to our OKLCH token system. Every primitive looks "ours."
- **Phase 2: WebGL Effects** — Cherry-pick Aurora + Grainient source into `src/src/components/fx/`. Build OKLCH-to-hex bridge. Performance test on AMD iGPU.
- **Phase 3: Streaming Polish** — StarBorder/ElectricBorder on composer during streaming. Activation logic tied to `isStreaming`. `prefers-reduced-motion` respect throughout.
- **Phase 4: Glass + Overlays** — GlassSurface prototype for modals/command palette (with CSS fallback for non-Chrome).

### M3 Design Review Checkpoint (MANDATORY PAUSE)
After M3's initial phases complete, we pause and do a holistic visual review before moving to M4:

1. Screenshot every surface (sidebar, chat viewport, composer, tool cards, settings, command palette)
2. Evaluate against the "10/10 grumpy developer" bar
3. Three possible outcomes:
   - **Satisfied** — proceed to M4 "The Power"
   - **Close but needs iteration** — add M3.x phases targeting specific surfaces that feel flat or underwhelming
   - **Want to explore further** — revisit the full React Bits / Magic UI / Aceternity / Glass UI catalogues with fresh eyes, knowing exactly which surfaces need help

This prevents over-planning effects we might not need while guaranteeing we don't rush past visual quality. The full catalogues are documented above — we'll have 200+ components to draw from if needed.

### M4+ — Evaluate After Design Review
- DecryptedText for session/model reveals
- Iridescence for accent elements
- LiquidChrome if performance budget allows
- Magic UI border-beam, shimmer-button if relevant surfaces exist
- Aceternity spotlight, beams for landing/onboarding flows

---

## 8. Gemini Architect Review Summary

Bard's key concerns and our responses:

| Concern | Bard's Position | Our Response |
|---------|----------------|--------------|
| THREE.js | BANNED | Agreed. FluidGlass and Silk rejected. |
| ogl (~30KB) | Acceptable with conditions | Agreed. Lazy-load, CSS containment, streaming-only activation. |
| Hex color props | Constitution violation | Solved via OKLCH-to-hex bridge wrapper. 10 lines of code. |
| UntitledUI | Reject | Agreed. shadcn covers our needs. |
| liquid-glass-react | Reject | Agreed. backdrop-filter + our glass tokens are sufficient. |
| shadcn/ui | Adopt for M2 | Agreed. Copy-paste model fits Constitution. |
| npm install React Bits | No | Agreed. Source-level cherry-pick only. |
