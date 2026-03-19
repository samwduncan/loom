# Phase 47: Spring Physics & Glass Surfaces - Research

**Researched:** 2026-03-19
**Domain:** CSS animation (spring easing via `linear()`), glassmorphism (`backdrop-filter`), Radix UI dialog primitives
**Confidence:** HIGH

## Summary

Phase 47 applies spring easing and frosted glass to existing components. The infrastructure is already in place: spring `linear()` tokens were generated in Phase 44 (FOUND-03), glass tokens exist in `tokens.css`, and the global `prefers-reduced-motion` override in `base.css` already kills all animations/transitions with `0.01ms` duration. The work is CSS-level modifications to existing components, not new component creation.

There are two distinct workstreams: (1) replacing existing `ease-out` / `ease-in` / `cubic-bezier` timing functions with `linear()` spring tokens on specific components, and (2) adding `backdrop-filter: blur() saturate()` to overlay surfaces that currently use opaque `bg-black/50` backgrounds.

**Primary recommendation:** Pure CSS changes to existing UI primitives and component stylesheets. Zero new runtime dependencies. Zero JavaScript animation libraries. The spring `linear()` tokens and glass tokens already exist and are verified.

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SPRING-01 | Modal open/close uses spring easing (settings modal, delete confirmations, alert dialogs) | Radix Dialog/AlertDialog use tw-animate-css `animate-in`/`animate-out` which reads `--tw-ease`. Override `--tw-ease` with `var(--ease-spring-gentle)` and set `animation-duration` to match `--duration-spring-gentle`. Both `dialog.tsx` and `alert-dialog.tsx` need changes. |
| SPRING-02 | Sidebar expand/collapse uses spring easing | AppShell uses CSS Grid `grid-template-columns` with `var(--sidebar-width)`. Add `transition: grid-template-columns var(--duration-spring-gentle) var(--ease-spring-gentle)` to the shell grid. |
| SPRING-03 | Tool card expand/collapse and tool group accordion use spring easing | `tool-card-shell.css` and `ToolCallGroup.css` already use `var(--ease-spring)` (cubic-bezier fallback) and `var(--duration-spring)`. Replace with `var(--ease-spring-snappy)` and `var(--duration-spring-snappy)` for true overshoot. |
| SPRING-04 | Command palette open/close uses spring easing | `command-palette.css` uses `@keyframes` with `var(--ease-out)`. Replace easing with `var(--ease-spring-gentle)` and extend duration to `var(--duration-spring-gentle)`. |
| SPRING-05 | Scroll-to-bottom pill entrance/exit uses spring easing | `scroll-pill.css` already uses `var(--ease-spring)` (cubic-bezier). Replace with `var(--ease-spring-bouncy)` and set duration to `var(--duration-spring-bouncy)` for true bounce. |
| GLASS-01 | Settings modal overlay uses frosted glass effect | `DialogOverlay` currently uses `bg-black/50`. Replace with `backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate))` plus semi-transparent OKLCH background. |
| GLASS-02 | Command palette overlay uses upgraded frosted glass effect | `[cmdk-overlay]` already has `backdrop-filter: blur(8px)`. Upgrade to use `var(--glass-blur)` and add `saturate(var(--glass-saturate))`. |
| GLASS-03 | Delete/alert confirmation dialogs use frosted glass effect | `AlertDialogOverlay` currently uses `bg-black/50`. Same treatment as GLASS-01. |
| GLASS-04 | Glass effects respect `prefers-reduced-motion` | Already handled by global override in `base.css` lines 72-81. Verify `backdrop-filter` is not caught by the override (it shouldn't be -- it's a static property, not a transition/animation). No additional work needed. |

</phase_requirements>

## Standard Stack

### Core (already installed, zero new dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| tw-animate-css | 1.4.0 | Tailwind v4 animation utilities (`animate-in`, `fade-in`, `zoom-in`) | Already used by all Radix overlay primitives |
| spring-easing | (devDep) | Generated `linear()` CSS tokens in Phase 44 | One-shot generation script, zero runtime |
| Radix UI (Dialog, AlertDialog) | latest | Modal/dialog primitives with data-state attributes | Already used throughout the app |
| cmdk | (installed) | Command palette with its own overlay system | Already used in CommandPalette component |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CSS `linear()` springs | framer-motion / Motion | 5KB+ runtime bundle, explicitly BANNED in REQUIREMENTS.md Out of Scope |
| CSS `backdrop-filter` | SVG displacement glass (Tier 2) | Chrome-only full support, heavier, deferred to v2.1 |
| Per-component reduced-motion | Global base.css override | Global is sufficient and already proven |

## Architecture Patterns

### Pattern 1: tw-animate-css Easing Override for Radix Overlays

**What:** tw-animate-css reads `--tw-ease` CSS variable for animation timing. By default it uses `ease`. Override this variable on the overlay/content elements to inject spring easing.

**When to use:** Dialog, AlertDialog, and any Radix overlay using `animate-in` / `animate-out` classes.

**How it works (verified from tw-animate-css source):**

The `animate-in` utility generates:
```css
animation: enter var(--tw-animation-duration, var(--tw-duration, .15s)) var(--tw-ease, ease) ...;
```

So we can override both timing and duration by setting CSS custom properties on the element:

```css
/* On DialogContent / AlertDialogContent */
[data-slot="dialog-content"] {
  --tw-ease: var(--ease-spring-gentle);
  --tw-animation-duration: var(--duration-spring-gentle);
}
```

This is the cleanest approach because:
1. No new `@keyframes` needed -- reuses existing `enter`/`exit` keyframes from tw-animate-css
2. Works with Radix `data-[state=open]` / `data-[state=closed]` attribute selectors already in place
3. Spring overshoot is visible in the scale animation (`zoom-in-95` already sets `--tw-enter-scale: 0.95`)

**Confidence:** HIGH -- verified from tw-animate-css 1.4.0 source code read during research.

### Pattern 2: CSS Grid Column Transition for Sidebar

**What:** The sidebar width changes are driven by CSS variable `--sidebar-width` which is set via `data-sidebar-state` attribute on the AppShell grid. Add a CSS transition on `grid-template-columns` to animate the width change.

**When to use:** Sidebar expand/collapse only.

**Implementation:**
```css
[data-testid="app-shell"] {
  transition: grid-template-columns var(--duration-spring-gentle) var(--ease-spring-gentle);
}
```

**Key consideration:** The sidebar currently conditionally renders (returns different JSX for collapsed vs expanded). The expanded `<aside>` unmounts when collapsed and a small expand button mounts instead. The grid column transition will animate the column width from 280px to 0px, but the content inside abruptly unmounts. This is acceptable because:
- The column width animation gives the spatial feel of the sidebar sliding away
- The expand button appears at the left edge after transition
- The Sidebar component itself handles the rendering via `if (!isSidebarOpen)` guard

If the content unmount feels jarring, an enhancement would be to add `overflow: hidden` and keep the sidebar content mounted (CSS show/hide). But per the Phase 46 decision on enter-only animations, the instant dismiss pattern was chosen as feeling snappier. The grid column transition adds the spring feel to the width change without requiring full mount/unmount refactoring.

**Confidence:** HIGH -- `transition: grid-template-columns` is well-supported. The `linear()` easing just provides the timing function.

### Pattern 3: CSS Keyframe Easing for Command Palette

**What:** The command palette uses custom `@keyframes` (`cmdk-overlay-in`, `cmdk-content-in`) with `var(--ease-out)` timing. Replace the timing function with the spring `linear()` token.

**When to use:** Command palette overlay and content.

**Implementation:**
```css
[cmdk-overlay] {
  animation: cmdk-overlay-in var(--duration-spring-gentle) var(--ease-spring-gentle);
}

[cmdk-root] {
  animation: cmdk-content-in var(--duration-spring-gentle) var(--ease-spring-gentle);
}
```

The existing `@keyframes cmdk-content-in` already defines `from { scale(0.95) translateY(-10px) }` to `to { scale(1) translateY(0) }` -- the spring `linear()` easing will add visible overshoot to this transition automatically.

**Confidence:** HIGH -- straightforward timing function swap.

### Pattern 4: Glass Overlay via backdrop-filter

**What:** Replace opaque `bg-black/50` overlays with frosted glass using `backdrop-filter`.

**Implementation for Dialog/AlertDialog overlays:**
```tsx
// In dialog.tsx DialogOverlay:
className={cn(
  "fixed inset-0 z-[var(--z-overlay)]",
  "bg-[oklch(0_0_0/0.4)]",  // Slightly more transparent to let blur show through
  "backdrop-blur-[var(--glass-blur)]",
  "backdrop-saturate-[var(--glass-saturate)]",
  // ... existing animate-in/out classes
)}
```

Or in CSS (cleaner for command palette):
```css
[cmdk-overlay] {
  backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  background: oklch(0 0 0 / 0.4);
}
```

**Key detail:** The existing `bg-black/50` is `oklch(0 0 0 / 0.5)`. For glass effect to be visible, reduce opacity to ~0.3-0.4 so background content bleeds through the blur. The glass tokens spec says `--glass-bg-opacity: 0.7` but that's for glass surfaces on colored backgrounds. For dark overlays on varied content, 0.3-0.4 works better.

**Confidence:** HIGH -- `backdrop-filter` is supported in all modern browsers. The `-webkit-` prefix is needed for Safari.

### Pattern 5: CSS Transition Token Swap for Existing Expand/Collapse

**What:** Tool card body and tool group body already use `grid-template-rows` transition with `var(--ease-spring)` (the old cubic-bezier approximation). Swap to the true `linear()` spring tokens.

**Current (tool-card-shell.css):**
```css
.tool-card-shell-body {
  transition: grid-template-rows var(--duration-spring) var(--ease-spring);
}
```

**Updated:**
```css
.tool-card-shell-body {
  transition: grid-template-rows var(--duration-spring-snappy) var(--ease-spring-snappy);
}
```

Same for `ToolCallGroup.css`.

**Confidence:** HIGH -- direct token swap, existing transition pattern unchanged.

### Anti-Patterns to Avoid

- **Animating `backdrop-filter`:** Never transition/animate `backdrop-filter` values. Set them statically. The overlay fade-in handles the visual entrance; the blur should be constant. Animating blur causes massive GPU work.
- **Spring on exit animations:** Per Phase 46-02 decision, exit animations are instant dismiss. Don't add spring easing to `data-[state=closed]` animations. Spring overshoot on exit looks wrong (the element bounces back open before closing).
- **Different springs for each surface:** Use consistent spring profiles across the same category of element. All modals use `--ease-spring-gentle`. All expand/collapse use `--ease-spring-snappy`. The scroll pill uses `--ease-spring-bouncy` because it's a playful micro-interaction.

## Spring Token Mapping

Which spring profile for which component:

| Component | Spring Profile | Rationale |
|-----------|---------------|-----------|
| Settings modal open | `gentle` (1000ms) | Large surface, should feel weighty |
| Alert/delete dialog open | `gentle` (1000ms) | Same overlay category as settings |
| Command palette open | `gentle` (1000ms) | Large overlay, same family |
| Sidebar expand | `gentle` (1000ms) | Spatial layout change, should feel smooth |
| Tool card expand | `snappy` (833ms) | Small interactive element, needs responsiveness |
| Tool group accordion | `snappy` (833ms) | Same as tool cards for consistency |
| Scroll-to-bottom pill | `bouncy` (1167ms) | Playful micro-interaction, distinctive |

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Spring easing curves | Custom JS spring solver | CSS `linear()` tokens from Phase 44 | Already generated, zero runtime, pixel-perfect |
| Glass blur effect | Canvas blur or SVG filter | CSS `backdrop-filter` | Native GPU-accelerated, one line |
| Reduced motion handling | Per-component media queries | Global `base.css` override (lines 72-81) | Already catches everything, DRY |
| Animation timing override | New keyframes per component | `--tw-ease` CSS variable override | tw-animate-css designed for this |

## Common Pitfalls

### Pitfall 1: Safari -webkit-backdrop-filter
**What goes wrong:** `backdrop-filter` alone doesn't work in Safari without the `-webkit-` prefix.
**Why it happens:** Safari still requires the prefix even in 2026 for some versions.
**How to avoid:** Always pair `backdrop-filter` with `-webkit-backdrop-filter`. Tailwind's `backdrop-blur-*` utility handles this automatically, but raw CSS in component stylesheets (like `command-palette.css`) needs both.
**Warning signs:** Glass effect works in Chrome/Firefox but not Safari.

### Pitfall 2: Spring Duration Mismatch
**What goes wrong:** Using the spring `linear()` easing with the wrong duration produces incorrect physics -- the overshoot timing is baked into the curve.
**Why it happens:** The `linear()` values encode the spring curve at a specific duration. Using a different duration stretches/compresses the curve.
**How to avoid:** Always pair `--ease-spring-X` with its matching `--duration-spring-X`. They are generated together.
**Warning signs:** Spring overshoot looks too fast or too slow, or the animation feels "squishy" rather than springy.

### Pitfall 3: Glass on Low-Chroma OKLCH Backgrounds
**What goes wrong:** `saturate(1.4)` on low-chroma surfaces (like our warm charcoal `oklch(0.20 0.010 32)`) can push colors toward unwanted hues.
**Why it happens:** Saturation boost amplifies whatever chroma exists. Our surfaces have very low chroma (~0.008-0.010), so the effect is minimal but could shift warm tones toward orange.
**How to avoid:** The `--glass-saturate: 1.4` value was chosen to be subtle. Test visually on actual app content. If color shift is noticeable, reduce to `1.2` or `1.0` (no saturation boost).
**Warning signs:** Overlay areas look slightly orange-tinted compared to non-overlaid content.

### Pitfall 4: Sidebar Content Unmount During Grid Transition
**What goes wrong:** When the sidebar collapses, the expanded `<aside>` unmounts (returns null from the component), but the grid column is still animating from `280px` to `0px`. During the transition, the empty column is visible.
**Why it happens:** React state change is synchronous but CSS transition is asynchronous.
**How to avoid:** The sidebar's collapsed-state expand button appears at `position: fixed` (outside the grid flow), so the empty column smoothly animates to 0px without visual artifacts. The `overflow: hidden` on the grid child div ensures no content spills. This should look fine -- the sidebar slides away and the content area expands to fill the space.
**Warning signs:** Flash of empty space during collapse. Fix: ensure `overflow: hidden` is on the sidebar grid child.

### Pitfall 5: Exit Animation + Spring = Bounce Back
**What goes wrong:** Applying spring easing to exit animations (close/dismiss) causes the element to visually bounce back before disappearing, which feels broken.
**Why it happens:** Spring `linear()` curves include overshoot past the target value. On exit (scale from 1 to 0.95 or opacity from 1 to 0), overshooting means briefly going past the target before settling.
**How to avoid:** Keep exit animations instant or use simple `ease-out`. Only apply spring easing to enter/open animations. This aligns with the Phase 46-02 decision of enter-only transitions.
**Warning signs:** Modals/dialogs appear to briefly grow before closing.

## Code Examples

### Example 1: Dialog Spring Override (dialog.tsx)
```tsx
// In DialogContent className, add spring timing overrides:
className={cn(
  // ... existing classes ...
  // Override tw-animate-css timing for spring easing
  "[--tw-ease:var(--ease-spring-gentle)]",
  "[--tw-animation-duration:var(--duration-spring-gentle)]",
  // ... zoom-in-95 fade-in-0 etc stay the same ...
)}
```

Note: The `[--custom:value]` syntax is Tailwind v4's arbitrary properties. Alternatively, this can be done with a CSS rule targeting `[data-slot="dialog-content"]`.

### Example 2: Glass Overlay (dialog.tsx DialogOverlay)
```tsx
// Replace bg-black/50 with glass effect:
className={cn(
  "fixed inset-0 z-[var(--z-overlay)]",
  "bg-[oklch(0_0_0/0.35)]",
  "backdrop-blur-[var(--glass-blur)]",
  "backdrop-saturate-[var(--glass-saturate)]",
  // ... existing animate-in/out ...
)}
```

### Example 3: Sidebar Grid Transition (index.css)
```css
/* Add to the sidebar state rules section */
[data-testid="app-shell"] {
  transition: grid-template-columns var(--duration-spring-gentle) var(--ease-spring-gentle);
}

@media (prefers-reduced-motion: reduce) {
  [data-testid="app-shell"] {
    transition: none;
  }
}
```

### Example 4: Tool Card Spring Upgrade (tool-card-shell.css)
```css
.tool-card-shell-body {
  transition: grid-template-rows var(--duration-spring-snappy) var(--ease-spring-snappy);
}
```

### Example 5: Scroll Pill Spring Upgrade (scroll-pill.css)
```css
.scroll-pill {
  transition-duration: var(--duration-spring-bouncy);
  transition-timing-function: var(--ease-spring-bouncy);
}
```

### Example 6: Command Palette Spring + Glass (command-palette.css)
```css
[cmdk-overlay] {
  background: oklch(0 0 0 / 0.35);
  backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  animation: cmdk-overlay-in var(--duration-spring-gentle) var(--ease-spring-gentle);
}

[cmdk-root] {
  animation: cmdk-content-in var(--duration-spring-gentle) var(--ease-spring-gentle);
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `cubic-bezier(0.34, 1.56, 0.64, 1)` for spring | CSS `linear()` with true spring physics | Chrome 113 / Firefox 112 (2023) | Visible overshoot, physically correct bounce |
| `bg-black/50` for overlays | `backdrop-filter: blur() saturate()` | All browsers since Safari 17.2 (Dec 2023) | Depth perception, content awareness through overlay |
| Per-component `@media (prefers-reduced-motion)` | Global wildcard override in `base.css` | Phase 46-02 decision | DRY, guaranteed coverage, tested |
| framer-motion for spring physics | CSS `linear()` tokens | Project convention since Phase 44 | Zero runtime, REQUIREMENTS.md bans framer-motion |

**Deprecated/outdated:**
- `--ease-spring` (cubic-bezier): Still in `tokens.css` as legacy fallback. Phase 47 components should use `--ease-spring-gentle/snappy/bouncy` instead.
- `--duration-spring` (500ms): Generic duration paired with the old cubic-bezier. Use profile-specific durations instead.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 + jsdom |
| Config file | `src/vite.config.ts` (inline vitest config) |
| Quick run command | `cd src && npx vitest run --reporter=dot` |
| Full suite command | `cd src && npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SPRING-01 | Dialog/AlertDialog open uses spring easing class overrides | unit | `cd src && npx vitest run src/components/ui/dialog.test.tsx -x` | New file, Wave 0 |
| SPRING-02 | AppShell grid has transition property | unit | `cd src && npx vitest run src/components/app-shell/AppShell.test.tsx -x` | Exists -- add case |
| SPRING-03 | Tool card/group CSS uses spring-snappy tokens | manual-only | Visual verification of CSS token values | N/A -- CSS-only |
| SPRING-04 | Command palette CSS uses spring-gentle tokens | manual-only | Visual verification of CSS token values | N/A -- CSS-only |
| SPRING-05 | Scroll pill CSS uses spring-bouncy tokens | manual-only | Visual verification of CSS token values | N/A -- CSS-only |
| GLASS-01 | Settings dialog overlay has backdrop-filter class | unit | `cd src && npx vitest run src/components/ui/dialog.test.tsx -x` | New file, Wave 0 |
| GLASS-02 | Command palette overlay CSS has glass properties | manual-only | Visual verification of CSS properties | N/A -- CSS-only |
| GLASS-03 | AlertDialog overlay has backdrop-filter class | unit | `cd src && npx vitest run src/components/ui/alert-dialog.test.tsx -x` | New file, Wave 0 |
| GLASS-04 | Glass effects disabled with prefers-reduced-motion | unit | `cd src && npx vitest run src/styles/base.test.ts -x` | Already covered by global override |

### Sampling Rate
- **Per task commit:** `cd src && npx vitest run --reporter=dot`
- **Per wave merge:** `cd src && npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/components/ui/dialog.test.tsx` -- verify spring class overrides + glass overlay classes (SPRING-01, GLASS-01)
- [ ] `src/components/ui/alert-dialog.test.tsx` -- verify glass overlay classes (GLASS-03)
- [ ] Update `src/components/app-shell/AppShell.test.tsx` -- verify grid transition style (SPRING-02)

Note: Most SPRING requirements (03-05) are pure CSS token swaps in `.css` files and are best verified visually, not via unit test. The Constitution (6.4) explicitly bans testing CSS/styling and recommends visual regression or Playwright for that.

## Open Questions

1. **Sidebar grid transition and content unmount timing**
   - What we know: Sidebar component conditionally renders different JSX based on `isSidebarOpen`. The grid column transition animates width.
   - What's unclear: Whether the empty grid column during the collapse animation looks acceptable visually.
   - Recommendation: Implement with `overflow: hidden` on the grid child, test visually. If jarring, explore keeping sidebar content mounted with CSS visibility toggle.

2. **Glass saturation on OKLCH surfaces**
   - What we know: `saturate(1.4)` is specified in requirements (GLASS-01). Our surfaces use very low chroma.
   - What's unclear: Whether `1.4` causes visible color shift on the specific content behind modals.
   - Recommendation: Start with `1.4` as specced, tune down to `1.2` if color shift is noticeable during visual QA.

## Sources

### Primary (HIGH confidence)
- tw-animate-css 1.4.0 source: `node_modules/tw-animate-css/dist/tw-animate.css` -- verified `--tw-ease` variable drives animation timing
- tokens.css: Lines 84-94 -- existing spring `linear()` tokens with durations
- base.css: Lines 72-81 -- global `prefers-reduced-motion` override
- dialog.tsx, alert-dialog.tsx: Current animation class patterns verified
- command-palette.css: Current `@keyframes` and timing verified
- tool-card-shell.css, ToolCallGroup.css: Current transition patterns verified

### Secondary (MEDIUM confidence)
- [CSS linear() browser support](https://caniuse.com/mdn-css_types_easing-function_linear-function) -- Baseline Widely Available by June 2026
- [Chrome DevDocs on linear()](https://developer.chrome.com/docs/css-ui/css-linear-easing-function) -- Implementation details

### Tertiary (LOW confidence)
- None. All findings verified from source code or official documentation.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - zero new dependencies, all tokens pre-generated
- Architecture: HIGH - patterns verified directly from source code of tw-animate-css, Radix primitives, and existing component files
- Pitfalls: HIGH - identified from direct codebase analysis (sidebar unmount, Safari prefix, exit animation behavior)

**Research date:** 2026-03-19
**Valid until:** Indefinite (CSS platform features, no library version sensitivity)
