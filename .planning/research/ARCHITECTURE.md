# Architecture Patterns: v1.5 "The Craft" Visual Polish Integration

**Domain:** Spring animations, glass surfaces, visual effects, and UI state polish integrating into existing React 19 + Tailwind v4 workspace app
**Researched:** 2026-03-18
**Confidence:** HIGH (based on thorough source code analysis of 49K LOC codebase, existing token/motion infrastructure, and current browser API landscape)

---

## Existing Architecture Summary

The v1.5 visual polish work builds on top of a mature, well-structured codebase. Understanding the existing patterns is critical because every visual enhancement must respect these constraints.

### App Shell (CSS Grid)

```
grid-template-columns: var(--sidebar-width) 1fr var(--artifact-width, 0px)
grid-template-rows: 1fr
```

Three columns: **sidebar** | **content** | **artifact (0px reserved)**. Sidebar width is driven by CSS custom property `--sidebar-width`, toggled via `data-sidebar-state` attribute on the grid container. Current states: `expanded` (280px) and `collapsed-hidden` (0px).

**Integration implication:** Sidebar slim mode adds a third state: `collapsed-slim` (~48px icon rail). This is a CSS variable change, not a layout restructure.

### Mount-Once CSS Show/Hide (ContentArea)

All four workspace panels (Chat, Files, Shell, Git) render simultaneously via `useMemo([], [])`. The active panel gets `className="h-full outline-none"`, inactive panels get `className="hidden"` (Tailwind `display: none`).

```tsx
// Current pattern — DO NOT change to conditional rendering
{panels.map(({ id, content }) => (
  <div className={activeTab === id ? 'h-full outline-none' : 'hidden'}>
    <PanelErrorBoundary>{content}</PanelErrorBoundary>
  </div>
))}
```

**Integration implication:** Spring animations on tab transitions are incompatible with this pattern. The `hidden` class applies `display: none`, which makes CSS transitions impossible (elements go from "not in layout" to "in layout" with no tween). The mount-once pattern is architecturally correct (preserves terminal sessions, scroll positions, editor state), so we do NOT animate tab panel transitions. Polish the *contents within* active panels instead.

### 5 Zustand Stores

| Store | Persisted | Relevant to Polish |
|-------|-----------|-------------------|
| `useUIStore` | theme, sidebarOpen, thinkingExpanded, autoExpandTools, showRawParams | YES — sidebar state, modal state, theme preferences |
| `useStreamStore` | None | YES — streaming state drives animation activation |
| `useTimelineStore` | sessions (messages stripped) | No |
| `useConnectionStore` | modelId only | No |
| `useFileStore` | None | No |

**Integration implication:** No new stores needed. Slim mode is a sidebar state change in `useUIStore`. Glass/spring preferences could be added to `ThemeConfig` if we want user toggles, but the reduced-motion system already handles this globally.

### Motion Infrastructure (Already Exists)

The codebase has a complete but underutilized motion system:

| Asset | Location | Status |
|-------|----------|--------|
| Spring configs | `src/lib/motion.ts` | Defined (`SPRING_GENTLE`, `SPRING_SNAPPY`, `SPRING_BOUNCY`) but unused by any component |
| CSS easing tokens | `tokens.css` (lines 76-82) | `--ease-spring`, `--ease-out`, `--ease-in-out` + 4 duration tokens |
| FX tokens | `tokens.css` (lines 127-139) | Aurora/gradient/ambient tokens defined but unused |
| Glass tokens | `tokens.css` (lines 152-156) | `--glass-blur`, `--glass-saturate`, `--glass-bg-opacity` defined, used only in TokenPreview demo |
| `prefersReducedMotion()` | `src/lib/motion.ts` | Helper exists, used nowhere in production code |
| Reduced motion CSS | `base.css` (lines 72-81) | Global 0.01ms override — active and correct |

**Integration implication:** The token infrastructure is ready. The work is connecting existing tokens to actual component animations, not creating new token systems.

### Existing CSS Effects (React Bits Source-Copied)

| Component | Technique | Used By |
|-----------|-----------|---------|
| `SpotlightCard` | CSS `--mouse-x`/`--mouse-y` radial gradient | ToolCardShell (wraps all tool cards) |
| `ShinyText` | CSS `background-clip: text` gradient animation | Not used in production |
| `ElectricBorder` | CSS `@keyframes` orbital gradient | Not used in production |

**Integration implication:** SpotlightCard is already integrated into the tool pipeline. ShinyText and ElectricBorder are built but unused — wire them up before adding new effects.

### Current Animation Technique Inventory

| Technique | Where Used | Performance |
|-----------|-----------|-------------|
| CSS `transition` | Hover states everywhere, border colors, opacity | Excellent (GPU composited) |
| CSS `@keyframes` | Shimmer skeletons, streaming pulse dot, electric border orbits | Good |
| CSS Grid `0fr/1fr` transition | ToolCardShell expand/collapse, ThinkingDisclosure, ToolCallGroup | Good — proven pattern |
| `tw-animate-css` `animate-in/out` | Dialog overlay fade, Dialog content zoom | Good (CSS only) |
| `backdrop-filter: blur()` | Command palette overlay, ConnectionBanner, ScrollToBottomPill | Moderate (GPU intensive, limit count) |

**Integration implication:** The codebase is 100% CSS animations (Tier 1 and Tier 2 per Constitution 11.1). No framer-motion/motion dependency exists yet. The key architecture decision is whether to add `motion/react` or stay CSS-only.

---

## Recommended Architecture: Stay CSS-Only (No motion/react)

### Rationale

The Constitution defines three tiers: CSS-only, tailwindcss-animate, and LazyMotion + domAnimation. The Constitution itself notes Tier 3 "[NEEDS REVIEW -- may not be needed if CSS covers all cases]."

After analyzing every planned visual enhancement, CSS covers all cases.

**Why not add motion/react:**

1. **Bundle cost:** Even with LazyMotion + domAnimation, it adds ~15KB (gzip) to the bundle. The `m` component alone is 4.6KB. For a project that currently has zero JS animation library overhead, this is a meaningful regression.

2. **The only thing motion/react does that CSS cannot is true spring physics.** But CSS `linear()` (supported in all major browsers since late 2023, including Safari 17.2+) combined with `spring-easing` or a build-time spring curve generator can produce indistinguishable spring curves at zero runtime cost.

3. **Everything planned is achievable with CSS:**
   - Sidebar slide: CSS `transition` on `--sidebar-width` + `transform: translateX()`
   - Modal entrance: Already uses `tw-animate-css` zoom-in/fade-in
   - Tool card expand: Already uses CSS Grid `0fr/1fr` transition
   - Glass surfaces: `backdrop-filter: blur()` + opacity (pure CSS)
   - DecryptedText: CSS `@keyframes` with `clip-path` or character reveal via animation-delay
   - StarBorder: Already built as `ElectricBorder` (CSS `@keyframes`)

4. **Architecture simplicity:** Zero new runtime dependencies, zero new React context providers (LazyMotion requires a provider), zero new patterns for the team to learn.

**The one exception:** If a future milestone needs gesture-driven animations (drag-to-reorder, pinch-to-zoom), motion/react becomes necessary. That's M7 "The Power" territory, not v1.5.

### CSS Spring Curves via linear()

Instead of runtime spring physics, generate CSS easing curves at build time:

```css
/* Generated from SPRING_GENTLE: stiffness=120, damping=14 */
--ease-spring-gentle: linear(
  0, 0.0068, 0.0274, 0.0614, 0.1082, 0.1671, 0.2372, 0.3172,
  0.4054, 0.4998, 0.5979, 0.6973, 0.7951, 0.8886, 0.9749,
  1.0513, 1.1154, 1.1654, 1.2, 1.2186, 1.2213, 1.2089,
  1.1826, 1.1443, 1.0962, 1.0407, 0.9803, 0.918, 0.8564,
  0.7981, 0.7454, 0.7002, 0.6638, 0.6372, 0.6208, 0.6147,
  0.6184, 0.6311, 0.6517, 0.6788, 0.7107, 0.7459, 0.7825,
  0.819, 0.8538, 0.8857, 0.9137, 0.9373, 0.9563, 0.9705,
  0.9802, 0.9858, 0.988, 0.9875, 0.985, 0.9813, 0.977,
  0.9728, 0.9691, 0.9664, 0.965, 0.9651, 0.9667, 0.9697,
  0.974, 0.9793, 0.9853, 0.9917, 0.998, 1.004, 1.0092,
  1.0133, 1.016, 1.0172, 1.017, 1.0155, 1.0129, 1.0096,
  1.006, 1.0023, 0.999, 0.996, 0.9938, 0.9924, 0.9917,
  0.9918, 0.9925, 0.9938, 0.9954, 0.9972, 0.999, 1.0006,
  1.0018, 1.0026, 1.003, 1.003, 1.0026, 1.0019, 1.001, 1
);
```

This is computed once (at build time or via a dev script that updates `tokens.css`) and produces the characteristic overshoot and oscillation of real spring physics at zero runtime cost.

**Implementation:** Write a `generate-spring-curves.ts` script that takes the existing `SPRING_GENTLE`, `SPRING_SNAPPY`, `SPRING_BOUNCY` configs from `motion.ts` and outputs CSS `linear()` values. Add the curves to `tokens.css` alongside existing `--ease-spring`.

---

## Component Boundaries: What Changes, What Doesn't

### Components That Need Modification

| Component | Change | Technique |
|-----------|--------|-----------|
| **Sidebar** | Add slim mode (icon rail), animate width transitions | CSS transition on `--sidebar-width`, new `collapsed-slim` state |
| **AppShell** | Support 3 sidebar states in grid template | CSS variable, `data-sidebar-state` attribute |
| **Dialog (shadcn)** | Add glass surface treatment to overlay + content | `backdrop-filter: blur()` + semi-transparent OKLCH background |
| **CommandPalette** | Glass overlay already exists; enhance content panel with glass | Extend existing `backdrop-filter: blur(8px)` to content root |
| **ToolCardShell** | Replace CSS Grid 0fr/1fr easing with spring curve | Swap `--ease-spring` for `--ease-spring-gentle` in `tool-card-shell.css` |
| **ChatEmptyState** | Add DecryptedText reveal on "Loom" wordmark | New `DecryptedText` component (CSS `@keyframes`) |
| **SessionItem** | Potential ElectricBorder on active session | Wrap active item with `ElectricBorder isActive={true}` |
| **ConnectionBanner** | Already has glass; verify it uses glass tokens | Audit existing `backdrop-blur-sm` classes |
| **ScrollToBottomPill** | Already has glass; verify token compliance | Audit existing `backdrop-blur-[var(--glass-blur)]` |

### New Components Needed

| Component | Purpose | Technique | Location |
|-----------|---------|-----------|----------|
| `DecryptedText` | Character-by-character "decrypt" text reveal | CSS `@keyframes` + `animation-delay` per character | `src/components/effects/DecryptedText.tsx` |
| `GlassSurface` | Reusable glass wrapper with consistent blur + saturation | CSS utility classes wrapping glass tokens | `src/components/effects/GlassSurface.tsx` |
| `SidebarSlim` | Icon-only rail variant of sidebar | Renders tab icons + tooltips | `src/components/sidebar/SidebarSlim.tsx` |

### Components That Stay Untouched

| Component | Why |
|-----------|-----|
| **ContentArea** | Mount-once pattern is sacred. No animation on tab switch. |
| **TabBar** | Tab indicator could get a subtle slide animation, but the actual panel switching stays instant. |
| **ChatView / MessageList** | Streaming performance is the priority. No entrance animations on messages during active streaming. |
| **Terminal / CodeEditor** | These are third-party embeds (xterm.js, CodeMirror 6). Animate their containers, not their internals. |
| **ActiveMessage** | The rAF innerHTML streaming path must never be interrupted by animation overhead. |

---

## Data Flow for New Visual Features

### Sidebar Slim Mode

```
User clicks collapse → toggleSidebar() in UIStore
                     ↓
           sidebarState cycles: expanded → slim → hidden → expanded
                     ↓
           data-sidebar-state attribute updates on AppShell grid div
                     ↓
           CSS transition on --sidebar-width: 280px → 48px → 0px
                     ↓
           Sidebar component reads state, renders full | slim | hidden trigger
```

**Store change required:** Replace boolean `sidebarOpen` with a 3-state enum:

```typescript
type SidebarState = 'expanded' | 'slim' | 'hidden';
```

This is a breaking change to the UI store's persisted state. Requires a migration (version 7):

```typescript
if (version < 7) {
  // Migrate boolean sidebarOpen to SidebarState enum
  const wasOpen = s['sidebarOpen'] !== false;
  delete s['sidebarOpen'];
  s = { ...s, sidebarState: wasOpen ? 'expanded' : 'hidden' };
}
```

**CSS changes:**

```css
[data-sidebar-state="expanded"] { --sidebar-width: var(--sidebar-expanded-width); }
[data-sidebar-state="slim"]     { --sidebar-width: 48px; }
[data-sidebar-state="hidden"]   { --sidebar-width: 0px; }

/* Add transition for smooth width changes */
[data-sidebar-state] {
  transition: --sidebar-width var(--duration-slow) var(--ease-spring-gentle);
}
```

**Important:** CSS custom property transitions require `@property` registration for interpolation. Without it, the grid column snaps. Alternative: animate `transform: translateX()` on the sidebar element instead of the grid template, which is GPU-composited and doesn't require `@property`.

### Glass Surface Application

```
Glass tokens already defined in tokens.css:
  --glass-blur: 16px
  --glass-saturate: 1.4
  --glass-bg-opacity: 0.7
              ↓
GlassSurface component applies:
  backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate))
  background: oklch(from var(--surface-overlay) l c h / var(--glass-bg-opacity))
              ↓
Applied to: Dialog overlay, Dialog content, CommandPalette root
```

**Performance constraint:** Limit to 3-5 simultaneous `backdrop-filter: blur()` elements. Current count:
- CommandPalette overlay: 1 (existing)
- ConnectionBanner: 1 (existing, only visible during disconnection)
- ScrollToBottomPill: 1 (existing, only visible when scrolled up)
- Dialog overlay: 1 (NEW, only visible when settings/modal open)
- Dialog content: 1 (NEW, only visible when settings/modal open)

Max simultaneous: 3 (pill + dialog overlay + dialog content). Safe.

**Safari fix:** Add `transform: translateZ(0)` to force GPU compositing layer on elements with `backdrop-filter`. This is already implicitly done by Tailwind's `backdrop-blur-*` utility but must be verified for custom CSS.

### DecryptedText Reveal

No store interaction needed. Pure presentational component:

```
DecryptedText receives: text string, duration, trigger (on-mount | on-visible)
              ↓
Splits text into <span> per character
              ↓
Each span has: CSS animation cycling through random characters
              ↓
animation-delay staggered: char_index * (duration / text.length)
              ↓
After delay, character "locks in" to final value
              ↓
prefers-reduced-motion: show text immediately (no animation)
```

**Usage targets:**
- ChatEmptyState "Loom" wordmark (on-mount trigger)
- SessionItem title for newly created sessions (on-visible trigger, once only)
- Model name display in status line (on-mount trigger)

### Spring Easing on Existing Animations

This is the simplest integration. Swap easing curves in CSS files:

| File | Current | New |
|------|---------|-----|
| `tool-card-shell.css` line 83 | `var(--ease-spring)` | `var(--ease-spring-gentle)` |
| `thinking-disclosure.css` | `var(--ease-spring)` | `var(--ease-spring-gentle)` |
| `ToolCallGroup.css` | `var(--ease-spring)` | `var(--ease-spring-gentle)` |
| `dialog.tsx` (shadcn) | `duration-200` | custom spring timing via CSS class |

**No component logic changes.** Only CSS token references change.

---

## Scalability Considerations

| Concern | Current (v1.4) | After v1.5 | At Scale (v2.0+) |
|---------|----------------|------------|-------------------|
| Animation bundle | 0KB (CSS only) | 0KB (CSS only) | May add motion/react if gesture animations needed |
| backdrop-filter count | 3 max simultaneous | 5 max simultaneous | Monitor; consider reducing blur radius on mobile |
| CSS custom properties | 70+ tokens | ~75 tokens (+spring curves) | Fine; browsers handle hundreds efficiently |
| GPU layers | Minimal (CSS transitions) | +2-3 for glass surfaces | Watch `will-change` usage; audit with Layers panel |
| Reduced motion | Global 0.01ms override | Same + component-level checks for DecryptedText | Same |

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Animating the CSS Grid Template During Sidebar Transition

**What:** Using `transition` on `grid-template-columns` for sidebar width change.
**Why bad:** Grid template transitions are not GPU-composited. They trigger layout recalculation on every frame, which competes with the rAF streaming buffer if a chat is active.
**Instead:** Animate the sidebar container's `width` or `transform: translateX()` within a fixed grid column. The grid column uses the final value immediately; the visual transition is on the element inside.

### Anti-Pattern 2: Adding AnimatePresence to Tab Panel Switching

**What:** Wrapping ContentArea panels in framer-motion's AnimatePresence for enter/exit animations.
**Why bad:** Defeats the mount-once pattern. AnimatePresence delays unmounting for exit animations, which means panels would remount when switched back. Terminal sessions would die. Editor scroll positions would reset.
**Instead:** Animate individual elements *within* active panels. The panel container itself switches instantly via `display: hidden/block`.

### Anti-Pattern 3: Glass Effect on Streaming Chat Background

**What:** Applying `backdrop-filter: blur()` to the chat message area or message bubbles.
**Why bad:** During streaming, the DOM is mutating 10-60 times per second via the rAF innerHTML buffer. `backdrop-filter` forces the browser to re-composite the blur on every paint. This competes directly with streaming performance.
**Instead:** Glass effects are for overlays (modals, command palette, popover) that render *above* the chat area and are infrequent. Never on the streaming surface itself.

### Anti-Pattern 4: Per-Message Entrance Animations

**What:** Adding fade-in or slide-up animations to each new message in the chat.
**Why bad:** During a streaming response, messages and tool calls can arrive rapidly. Entrance animations create a queue of overlapping animations that fight with auto-scroll and content-visibility optimization.
**Instead:** Animate tool card expand/collapse (already done). Animate the transition from streaming HTML to finalized react-markdown (already done as a crossfade in ActiveMessage). Leave message containers as instant layout.

### Anti-Pattern 5: will-change on Hover Transitions

**What:** Adding `will-change: transform` or `will-change: opacity` to elements with hover transitions.
**Why bad:** Constitution 11.4 explicitly bans this. `will-change` promotes elements to their own compositing layer, consuming GPU memory. For elements that only transition on hover, this is wasteful because the promotion happens before the hover and persists.
**Instead:** Only use `will-change` on elements with *continuous* animation (shimmer skeletons, streaming pulse dot, aurora background if added later).

---

## Patterns to Follow

### Pattern 1: Token-Driven Glass Surface

**What:** A reusable GlassSurface wrapper that reads all visual values from CSS tokens.
**When:** Modals, command palette, popover overlays.

```tsx
export function GlassSurface({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'glass-surface',
        className,
      )}
    >
      {children}
    </div>
  );
}
```

```css
.glass-surface {
  backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  background: oklch(from var(--surface-overlay) l c h / var(--glass-bg-opacity));
  transform: translateZ(0); /* Force GPU layer for Safari */
}

@media (prefers-reduced-motion: reduce) {
  .glass-surface {
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    background: var(--surface-overlay); /* Solid fallback */
  }
}
```

**Why this works:** All tuning happens in `tokens.css` (`--glass-blur`, `--glass-saturate`, `--glass-bg-opacity`). Components never reference blur values directly.

### Pattern 2: CSS Spring Curves as Token Extensions

**What:** Generated `linear()` spring curves added to `tokens.css` alongside existing `--ease-spring`.
**When:** Any element that currently uses `--ease-spring` (cubic-bezier approximation) and would benefit from real spring oscillation.

```css
:root {
  /* Existing cubic-bezier approximation (single overshoot, no oscillation) */
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);

  /* New: True spring physics via linear() (overshoot + oscillation + settle) */
  --ease-spring-gentle: linear(0, 0.007, 0.027, ...);   /* SPRING_GENTLE */
  --ease-spring-snappy: linear(0, 0.012, 0.048, ...);   /* SPRING_SNAPPY */
  --ease-spring-bouncy: linear(0, 0.009, 0.035, ...);   /* SPRING_BOUNCY */
}
```

**Migration path:** Components using `--ease-spring` (the cubic-bezier) can be upgraded to `--ease-spring-gentle` (the `linear()` equivalent). This is a one-token-reference change per component, no logic changes.

### Pattern 3: Sidebar State Machine

**What:** Three-state sidebar instead of boolean toggle.
**When:** Sidebar always.

```typescript
// Current (v1.4)
sidebarOpen: boolean;  // expanded | hidden

// New (v1.5)
sidebarState: 'expanded' | 'slim' | 'hidden';

// Cycle logic
toggleSidebar: () => set((state) => ({
  sidebarState: state.sidebarState === 'expanded' ? 'slim'
    : state.sidebarState === 'slim' ? 'hidden'
    : 'expanded',
})),
```

**What renders in each state:**

| State | Sidebar Column | Renders |
|-------|---------------|---------|
| `expanded` | 280px | Full sidebar: header, session list, footer |
| `slim` | 48px | Icon rail: tab icons with tooltips, settings icon |
| `hidden` | 0px | Nothing in column; floating expand trigger |

### Pattern 4: Performance-Gated Visual Effects

**What:** Effects that are expensive (GPU shaders, backdrop-filter) are gated by both reduced-motion preference and a "visual quality" setting.
**When:** Any GPU-intensive visual effect.

```typescript
// In component
const reducedMotion = usePrefersReducedMotion(); // reads matchMedia
const effectsEnabled = !reducedMotion; // Could later tie to a user preference

// Gate rendering
{effectsEnabled && <DecryptedText text="Loom" />}
{effectsEnabled ? <GlassSurface>{children}</GlassSurface> : <div className="bg-surface-overlay">{children}</div>}
```

The reduced-motion CSS override in `base.css` handles most cases automatically (forces `animation-duration: 0.01ms`). But components with structural changes (like DecryptedText showing/hiding character spans) need explicit JS gates.

---

## Suggested Build Order

The build order is designed to respect dependencies, minimize risk to existing functionality, and deliver visible improvements early.

### Phase A: Foundation (No Visual Changes, Infrastructure Only)

1. **Generate CSS spring curves** — Write `generate-spring-curves.ts` script, add `--ease-spring-gentle/snappy/bouncy` to `tokens.css`
2. **Land settings refactor** — The pending settings changes (generic useFetch hook, connection store persist fix, ModalState type safety) must land first because they touch the same components we'll modify for glass surfaces
3. **Dead UI removal** — Remove unused imports, dead branches, and any code identified in prior audits

**Why first:** These are non-visual, non-breaking changes that set a clean foundation. Spring curves in tokens are purely additive. Settings refactor prevents merge conflicts with later glass surface work on Dialog.

### Phase B: Glass & Spring Token Adoption

4. **GlassSurface component** — New `effects/GlassSurface.tsx` + CSS, wiring glass tokens to reusable wrapper
5. **Apply glass to Dialog** — Modify `ui/dialog.tsx` overlay and content to use glass tokens
6. **Apply glass to CommandPalette** — Enhance existing `backdrop-filter: blur(8px)` to use glass tokens consistently
7. **Swap spring curves** — Replace `--ease-spring` references in `tool-card-shell.css`, `thinking-disclosure.css`, `ToolCallGroup.css` with `--ease-spring-gentle`

**Why second:** Glass and springs are the most broadly visible improvements. They touch many surfaces but require minimal logic changes — mostly CSS token swaps.

### Phase C: Sidebar Slim Mode

8. **Store migration** — Upgrade `sidebarOpen: boolean` to `sidebarState: SidebarState` with migration v7
9. **SidebarSlim component** — New icon rail with tooltips
10. **Sidebar animation** — CSS transition on sidebar width (likely `transform: translateX()` approach)
11. **Update AppShell** — Handle three `data-sidebar-state` values in CSS

**Why third:** This is the largest single feature with the most architectural impact (store migration, new component, CSS changes). Glass and springs should land first so they're stable before this work starts.

### Phase D: Visual Effects & Polish

12. **DecryptedText component** — New CSS-animation text reveal effect
13. **Wire up unused effects** — Apply ShinyText to "Thinking..." indicator, ElectricBorder/StarBorder to active elements
14. **Loading/error/empty state audit** — Systematic review and improvement of every placeholder, skeleton, and error state across all components
15. **Hover/focus/disabled state consistency** — Audit and normalize across all interactive elements
16. **Spacing and typography consistency** — Final visual audit

**Why last:** These are the detail polish items. They benefit from stable glass surfaces and spring curves already being in place, and they're the lowest risk (mostly additive, component-scoped changes).

---

## Files That Will Be Modified

### Store Layer
- `src/stores/ui.ts` — `sidebarOpen` → `sidebarState`, new migration, new toggle logic
- `src/types/ui.ts` — Add `SidebarState` type, update `ThemeConfig` if adding visual quality toggle

### CSS / Token Layer
- `src/styles/tokens.css` — Add `--ease-spring-gentle/snappy/bouncy` via `linear()`
- `src/styles/index.css` — Add `[data-sidebar-state="slim"]` CSS rule
- `src/styles/base.css` — Possibly extend reduced-motion rules

### Component Layer (Modified)
- `src/components/app-shell/AppShell.tsx` — Support 3 sidebar states
- `src/components/sidebar/Sidebar.tsx` — Render full/slim/hidden variants
- `src/components/ui/dialog.tsx` — Glass surface on overlay + content
- `src/components/command-palette/command-palette.css` — Glass tokens
- `src/components/chat/tools/tool-card-shell.css` — Spring curve easing
- `src/components/chat/styles/thinking-disclosure.css` — Spring curve easing
- `src/components/chat/tools/ToolCallGroup.css` — Spring curve easing
- `src/components/chat/view/ChatEmptyState.tsx` — DecryptedText on wordmark

### Component Layer (New)
- `src/components/effects/DecryptedText.tsx` — Text reveal animation
- `src/components/effects/GlassSurface.tsx` — Reusable glass wrapper
- `src/components/sidebar/SidebarSlim.tsx` — Icon-only rail

### Test Layer
- Tests for DecryptedText, GlassSurface, SidebarSlim (unit)
- Tests for sidebar state migration (unit)
- Update existing Sidebar tests for 3-state model
- E2E test for sidebar slim mode toggle

### Build Tooling
- `scripts/generate-spring-curves.ts` — One-time curve generation script

---

## Sources

- Codebase analysis: Direct source code reading of all referenced files
- [Motion (formerly Framer Motion)](https://motion.dev/) — Bundle size considerations
- [Motion bundle size guide](https://motion.dev/docs/react-reduce-bundle-size) — LazyMotion + domAnimation sizing
- [CSS linear() easing function](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/easing-function/linear) — Browser support
- [CSS linear() on Can I Use](https://caniuse.com/mdn-css_types_easing-function_linear-function) — Safari 17.2+ support confirmed
- [spring-easing library](https://github.com/okikio/spring-easing) — CSS spring curve generation
- [CSS Spring Easing Generator](https://www.kvin.me/css-springs) — Interactive tool for generating curves
- [Josh Comeau: Springs and Bounces in Native CSS](https://www.joshwcomeau.com/animation/linear-timing-function/) — Comprehensive guide to CSS spring animations
- [Chrome linear() easing guide](https://developer.chrome.com/docs/css-ui/css-linear-easing-function) — Chrome implementation details
- [Safari backdrop-filter performance](https://graffino.com/til/how-to-fix-filter-blur-performance-issue-in-safari) — GPU compositing fix with translateZ(0)
- [shadcn/ui backdrop-filter performance issue](https://github.com/shadcn-ui/ui/issues/327) — Community discussion on blur performance
