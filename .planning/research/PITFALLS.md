# Domain Pitfalls: v1.5 "The Craft" -- Visual Polish Integration

**Domain:** Spring animations, glass effects, visual personality, and UI state polish on an existing 49K LOC React workspace app
**Researched:** 2026-03-18
**Hardware constraint:** AMD Radeon 780M iGPU (no discrete GPU), 4.3 TFLOPS, shared system memory

---

## Critical Pitfalls

Mistakes that cause rewrites, performance regressions, or broken existing functionality.

### Pitfall 1: rAF Contention Between Streaming Buffer and Animation Libraries

**What goes wrong:** Loom's streaming pipeline uses a dedicated `requestAnimationFrame` loop in `useStreamBuffer.ts` to paint tokens via `innerHTML` at 60fps. Spring animation libraries (Motion/framer-motion, react-spring) also schedule their own rAF callbacks. Multiple independent rAF loops share the same 16.67ms frame budget on the main thread. During active streaming at 100 tokens/sec, the streaming rAF is already consuming significant frame budget for markdown conversion + DOM mutation. Adding animation rAF callbacks pushes total frame work past 16.67ms, causing dropped frames.

**Why it happens:** Each `requestAnimationFrame` callback executes sequentially within the same frame. The browser gives all queued rAF callbacks the same timestamp, but each one consumes real time. The streaming converter (`convertStreamingMarkdown`) + `innerHTML` assignment is the heaviest single operation per frame. Layering spring physics calculations on top eats into the remaining budget.

**Consequences:** Jank during streaming (the worst possible time -- it's when the user is actively watching), dropped frames below the 55+ FPS target, user perception of a sluggish app specifically during the most important interaction.

**Prevention:**
1. **Gate decorative animations during streaming.** The existing `isStreaming` state from the stream store should suppress non-essential spring animations. The performance-gated activation pattern in `M3-POLISH-DEFERRED-CONTEXT.md` already shows this pattern -- enforce it as a rule, not a suggestion.
2. **Prefer CSS transitions/animations over JS spring libraries during streaming.** CSS animations run on the compositor thread and do not compete with main-thread rAF. The sidebar, modals, and tool card expand/collapse already use CSS `transition` -- keep it that way.
3. **If springs must run during streaming** (e.g., a new message entrance), use Motion's `useMotionValue` + `useTransform` which update outside React's render cycle, not `animate` props that trigger React re-renders.
4. **Never add a second independent rAF loop** for custom spring physics. If custom spring solving is needed, hook into the existing streaming rAF loop or use a single animation manager.

**Detection:** Profile with Chrome DevTools Performance tab during active streaming. Look for "Long Animation Frame" (LoAF) entries > 50ms. If main-thread frame time exceeds 12ms, animation work is eating into the streaming budget.

**Confidence:** HIGH -- direct consequence of Loom's proven rAF streaming architecture.

---

### Pitfall 2: Layout Thrash from Animating Non-Composite Properties (Sidebar Width)

**What goes wrong:** Animating `width`, `height`, `left`, `top`, `margin`, `padding`, `grid-template-columns`, or `grid-template-rows` triggers layout recalculation (reflow) on every frame. This is especially dangerous for:
- **Sidebar width animation** (currently a CSS Grid column via `--sidebar-width` custom property in AppShell.tsx)
- **Modal entrance** with height animation

Only `transform` and `opacity` are guaranteed to animate on the compositor thread (no layout, no paint). Everything else forces the browser through Layout -> Paint -> Composite on every frame. On the Radeon 780M iGPU, the compositor shares memory bandwidth with the CPU, so layout thrash is more expensive than on a system with dedicated VRAM.

**Why it happens:** CSS Grid animations are layout-level animations. The browser must recalculate the layout of ALL grid children on every frame. During active chat streaming, this competes directly with the rAF innerHTML buffer.

**Consequences:** Sub-60fps animations, visible stutter on sidebar open/close, compounded with streaming rAF contention (Pitfall 1). The streaming cursor freezes mid-animation.

**Prevention:**
1. **Sidebar slide:** Do NOT transition the grid template itself. Set the grid column to its final value immediately. Animate the sidebar element via `transform: translateX()` within that column. `transform` is GPU-composited and runs on the compositor thread, independent of layout.
2. **Tool card / thinking expand:** The existing CSS Grid `0fr`/`1fr` pattern is acceptable because it's a CSS transition (compositor-friendly in Chrome 107+). Do NOT replace it with JS-driven height animation.
3. **Modal entrance:** Animate `transform: scale()` + `opacity`, never `height` or `max-height`.
4. **Any new spring animation:** Restrict animated properties to `transform`, `opacity`, `filter`, and `clip-path`. If a design requires animating layout properties, use the FLIP technique (First, Last, Invert, Play) to convert layout changes into transform animations.

**Detection:** Chrome DevTools "Rendering" panel -> enable "Layout Shift Regions" and "Paint Flashing". Any green during an animation means layout/paint is happening. Open Performance tab, toggle sidebar while streaming, look for long "Layout" tasks.

**Confidence:** HIGH -- well-established browser rendering pipeline knowledge.

---

### Pitfall 3: `backdrop-filter` Stacking Context Corruption

**What goes wrong:** `backdrop-filter: blur()` creates a new stacking context. This has three dangerous interactions with Loom's existing architecture:

1. **Z-index dictionary breaks.** Loom has 8 named z-index tiers (`--z-base` through `--z-critical`). When `backdrop-filter` creates a new stacking context on a modal overlay, child elements can only stack within that context. A tooltip (`--z-dropdown: 20`) inside a glass modal (`--z-modal: 50`) won't appear above other `--z-modal` elements outside the modal.

2. **Fixed-position children clip.** If `backdrop-filter` is on a scrollable container, fixed-position children (like the connection banner at `--z-toast: 60`) get trapped inside the stacking context and scroll with the container instead of staying fixed.

3. **Glass-on-glass double-blur.** The command palette and settings modal both target glass treatment. If the settings modal is open and the command palette overlays it, the command palette's `backdrop-filter` blurs the modal's already-blurred content, creating a muddy, broken visual.

**Why it happens:** Per CSS spec, `backdrop-filter` always creates a new stacking context. This is not a bug; it's by design.

**Consequences:** Broken tooltips/dropdowns inside glass surfaces, fixed-position elements trapped in wrong scroll context, ugly double-blur artifacts.

**Prevention:**
1. **Apply glass to leaf containers only.** Never apply `backdrop-filter` to a wrapper that contains dropdowns, tooltips, or fixed-position elements. Apply it to the visual background layer, keep interactive children in a sibling or parent without `backdrop-filter`.
2. **Portal all overlays.** Tooltips, dropdowns, and nested modals must render via React Portal to `document.body`, escaping any parent stacking context. Radix UI primitives (already in use via shadcn) do this by default -- verify it's not being overridden.
3. **Glass-on-glass rule:** Only one glass surface visible at a time. If command palette opens over settings modal, the modal's glass should reduce to a solid semi-transparent background (drop the blur).
4. **Test on Firefox.** Firefox's `backdrop-filter` support was historically buggy (Mozilla bug 1718471 documents lag with many elements).

**Detection:** Open DevTools -> Elements panel -> look for "stacking context" indicators.

**Confidence:** HIGH -- stacking context behavior is spec-defined.

---

### Pitfall 4: `backdrop-filter` Performance on Scrolling Surfaces

**What goes wrong:** Applying `backdrop-filter: blur()` to an element above a scrolling container forces the browser to re-composite the blur effect on every scroll frame, because the backdrop content changes.

**Why it happens:** The blur must be recalculated when the content behind the glass element moves.

**Consequences:** Scroll jank in the chat message list if a glass-treated element overlays it.

**Prevention:**
- Glass effects ONLY on overlays that obscure the entire viewport (modal overlays, command palette backdrops)
- The ScrollToBottomPill is acceptable because it's small (low pixel count to composite)
- NEVER apply glass to the sidebar if it overlaps scrolling content
- Keep `--glass-blur` at 16px max. Blur radius above 20px exponentially increases GPU workload
- Measure: toggle glass on/off and compare scroll FPS in Performance panel

**Detection:** Scrolling feels sluggish after adding glass. Check "Composite Layers" in Chrome DevTools.

**Confidence:** HIGH -- documented in shadcn/ui Issue #327 and Nextcloud Issue #7896.

---

### Pitfall 5: Mount-Once Pattern Breaks with AnimatePresence

**What goes wrong:** Loom uses a **mount-once CSS show/hide** pattern for workspace panels (ContentArea.tsx, line 100: `className={activeTab === id ? 'h-full outline-none' : 'hidden'}`). All four panels (Chat, Files, Shell, Git) are always mounted; only the active one is visible. This fundamentally conflicts with Motion's `AnimatePresence`, which expects components to mount/unmount to trigger enter/exit animations.

If someone adds `AnimatePresence` to the ContentArea tab system:
- AnimatePresence delays unmounting to play exit animations
- When the user switches back, the component remounts
- Terminal sessions die. CodeMirror state resets. Scroll positions lost
- The `hidden` CSS class uses `display: none`, which `AnimatePresence` cannot detect or animate

**Why it happens:** `AnimatePresence` tracks children by key and animates their exit when they're removed from the React tree. CSS `display: none` doesn't remove from the tree. These are fundamentally different paradigms.

**Consequences:** Either broken animations (AnimatePresence does nothing on hidden panels) or broken panel state (if you switch to conditional rendering to make AnimatePresence work). There is no middle ground.

**Prevention:**
1. **Panel transitions must use CSS, not AnimatePresence.** Replace `hidden` class toggle with `opacity: 0; pointer-events: none; position: absolute` for the leaving panel and `opacity: 1; pointer-events: auto; position: relative` for the entering panel. Add CSS `transition: opacity var(--duration-normal)` for a crossfade.
2. **Alternatively, use `visibility: hidden` + `transform`** instead of `display: none`. `visibility: hidden` can be transitioned. But test layout sizing impact.
3. **Reserve AnimatePresence for truly conditional elements:** modals, toasts, tooltips, search bar, command palette -- things that actually mount/unmount.
4. **Add comment in ContentArea.tsx:** "WARNING: Do NOT wrap panels in AnimatePresence. Mount-once pattern is intentional."

**Detection:** Terminal goes blank after tab switch. Editor loses cursor position.

**Confidence:** HIGH -- directly verified against ContentArea.tsx source code. The show/hide pattern is a core architectural decision (M3 key decision).

---

### Pitfall 6: Motion Bundle Size Creep Past the Constitution Limit

**What goes wrong:** The Constitution (Section 10.6) bans importing the full `motion` package (34KB+). The tiered strategy allows only `LazyMotion` + `domAnimation` (~15KB). But Motion's API makes it trivially easy to accidentally import the full bundle:

- `import { motion } from 'motion/react'` pulls in 34KB. Only `import { m } from 'motion/react'` uses the lazy path.
- `AnimatePresence` works with both `motion` and `m`, but if any component imports `motion` directly, the tree-shaking benefit is lost for the entire app.
- `domAnimation` does NOT include layout animations or drag gestures. Using `layout` prop or `drag` prop silently fails or requires `domMax` (+25KB).
- Third-party component libraries that depend on Motion may import the full bundle internally.

**Why it happens:** The `motion` and `m` components have identical APIs. A developer copying a tutorial will use `motion.div` by default.

**Consequences:** 34KB+ bundle size increase (violates Constitution), potentially 59KB+ if `domMax` gets pulled in.

**Prevention:**
1. **Add an ESLint rule** (or extend existing loom plugin) that bans `import { motion } from 'motion/react'` and enforces `import { m } from 'motion/react'` exclusively.
2. **Bundle size CI check.** Add a step that fails if the main chunk exceeds a threshold.
3. **Document which Motion features require `domMax`** and explicitly ban them: `layout` prop, `layoutId`, `drag`/`dragConstraints`, `useScroll` with layout measurements.
4. **Audit any React Bits or third-party animation components** for internal Motion imports before adopting.

**Detection:** `npx vite-bundle-visualizer` after build. Search for `motion` chunks > 5KB.

**Confidence:** HIGH -- bundle sizes verified against Motion docs and GitHub issue #1585.

---

## Moderate Pitfalls

### Pitfall 7: OKLCH Custom Property Animation Without @property Registration

**What goes wrong:** Loom uses OKLCH CSS custom properties throughout (`--accent-primary: oklch(0.63 0.14 20)`). Unregistered CSS custom properties have `discrete` animation type -- they snap between values instead of interpolating. So `transition: --accent-primary 300ms` does nothing; it just snaps. This affects hover color transitions, aurora gradient morphing, and any planned theme transitions.

**Why it happens:** The browser doesn't know the type of an unregistered custom property. Without type information, it can't interpolate.

**Prevention:**
1. **Register animatable properties with `@property`:**
   ```css
   @property --accent-primary {
     syntax: '<color>';
     inherits: true;
     initial-value: oklch(0.63 0.14 20);
   }
   ```
2. **Only register properties that actually need animation.** Don't register all 29+ color tokens -- just the animated ones.
3. **For aurora/gradient effects,** split OKLCH channels into separate registered properties for independent channel animation.
4. **Test in Firefox.** `@property` support landed mid-2024 but has had interpolation edge cases with OKLCH.

**Confidence:** HIGH -- `@property` requirement is spec-defined (CSS Properties and Values API Level 1).

---

### Pitfall 8: `will-change` Layer Explosion on iGPU

**What goes wrong:** Adding `will-change: transform` promotes elements to compositor layers. Each layer consumes GPU memory. On the Radeon 780M, GPU memory is shared with system RAM. With 200+ message containers, tool cards, sidebar items, and editor lines, aggressive `will-change` causes:
- Hundreds of MB of shared memory consumed
- Compositor falls behind, dropping frames
- In extreme cases, browser tab crash (OOM)

**Why it happens:** Developers add `will-change` as a "performance silver bullet" without understanding the memory cost per layer.

**Prevention:**
1. **Never put `will-change` in a stylesheet.** Apply via JavaScript before animation starts, remove in `transitionend`/`animationend` handler.
2. **Never `will-change` on list items or repeated elements.** No `will-change` on message containers, tool chips, sidebar items.
3. **Maximum 5 simultaneous `will-change` elements.** Sidebar, modal overlay, command palette, active toast, and one animated element.
4. **Use `contain: strict` on WebGL/canvas elements** instead of `will-change`. Lower memory penalty.

**Detection:** Chrome DevTools -> Layers panel. If > 20 compositor layers during normal operation, `will-change` is overused.

**Confidence:** HIGH -- compositor layer behavior is well-documented.

---

### Pitfall 9: Spring Physics Creating Perpetual Re-renders

**What goes wrong:** Spring animations are physically simulated -- they overshoot, bounce, and settle. `SPRING_BOUNCY` (stiffness 180, damping 12) can take 30+ frames to settle. If the spring value drives React state (via Motion's `animate` prop), that's 30+ re-renders per animation. If a spring animation component also subscribes to stream state (`isStreaming`), each streaming state change restarts the spring, creating a never-ending loop.

**Why it happens:** Motion's `animate` prop triggers a React re-render when the target value changes. Rapidly-changing state means the spring never settles.

**Prevention:**
1. **Use `useMotionValue` + `useTransform`** for values derived from rapid state changes -- updates outside React's render cycle.
2. **Debounce or snapshot state** before feeding to spring targets. Don't pass `isStreaming` directly.
3. **Spring config selection:** `SPRING_SNAPPY` (stiffness 300, damping 20) for interactions where quick settling matters. Reserve `SPRING_BOUNCY` for celebratory/infrequent animations only.
4. **Never subscribe to both stream store and animation state in the same component.** Isolate animation into a child.

**Detection:** React DevTools Profiler during animation. If 20+ renders per single spring, this is active.

**Confidence:** HIGH for re-render mechanism. MEDIUM for exact settling frame counts.

---

### Pitfall 10: Over-Animation and Vestibular Trigger Patterns

**What goes wrong:** The temptation in a polish phase is to animate everything. The cumulative effect triggers vestibular discomfort. Dangerous patterns:
- **Parallax-like effects** where aurora background moves differently than foreground
- **Large-area motion** (sidebar + content shifting simultaneously)
- **Continuous ambient animation** that never stops
- **Zoom/scale on frequent interactions** (every message, every tool call)

~10% of the general population experiences motion sensitivity. That's not an edge case.

**Why it happens:** Animations evaluated in isolation ("this looks great!") rather than in context ("does sidebar + message entrance + tool bounce + aurora feel overwhelming together?").

**Prevention:**
1. **Animation budget:** Maximum 2 simultaneous visible animations at any time.
2. **Frequency limit:** Elements seen every few seconds (messages, tool calls) get subtle opacity fades at most. Springs for infrequent interactions only.
3. **The 3-second rule:** If an ambient animation hasn't settled in 3 seconds, it's too long or shouldn't exist.
4. **Build reduced-motion version FIRST.** Verify it works perfectly, then layer animations on top.
5. **Loom-specific rule:** During streaming, only the streaming cursor and aurora should animate. Everything else is static.

**Detection:** Use the app for 10 minutes with all animations enabled. Any visual fatigue means over-animated.

**Confidence:** HIGH -- vestibular prevalence is W3C-documented.

---

### Pitfall 11: Sidebar Boolean-to-Enum Store Migration Breaks Persisted State

**What goes wrong:** The UI store currently persists `sidebarOpen: boolean`. Changing to `sidebarState: 'expanded' | 'slim' | 'hidden'` without a migration causes `undefined` for sidebar state on first load after upgrade.

**Why it happens:** Zustand's persist middleware deserializes localStorage, finds `sidebarOpen: true`, but the new store schema expects `sidebarState`.

**Prevention:** Add migration version 7 to the UI store persist config:
1. Read `sidebarOpen` from persisted state
2. Map `true` to `'expanded'`, `false` to `'hidden'`
3. Delete old `sidebarOpen` key, write new `sidebarState` key

**Detection:** Clear localStorage, load app, verify sidebar. Then restore old localStorage shape and reload.

**Confidence:** HIGH -- directly verified against UI store persist middleware.

---

### Pitfall 12: CSS linear() Fallback Cascade Failure

**What goes wrong:** Declaring `linear()` spring curves without fallback means browsers that don't support `linear()` (pre-2023) get no animation at all, because the entire `transition-timing-function` declaration is invalid and discarded.

**Prevention:** Declare the cubic-bezier fallback FIRST, then the `linear()` override SECOND:
```css
transition-timing-function: var(--ease-spring); /* cubic-bezier fallback */
transition-timing-function: var(--ease-spring-gentle); /* linear() override */
```
Standard progressive enhancement -- browsers that support `linear()` apply the second declaration.

**Detection:** Test in Safari 16 or any browser lacking `linear()` support.

**Confidence:** HIGH -- CSS cascade behavior is spec-defined.

---

### Pitfall 13: Safari -webkit-backdrop-filter Required

**What goes wrong:** Glass effects work in Chrome/Firefox but are invisible in Safari.

**Why it happens:** Safari requires the `-webkit-` prefix for `backdrop-filter`. Older Safari versions (still common) need the prefix.

**Prevention:** Always declare both:
```css
-webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
```
The existing codebase does this correctly in `scroll-pill.css` -- use the same pattern everywhere.

**Confidence:** HIGH -- well-known browser compatibility requirement.

---

### Pitfall 14: DecryptedText Layout Shift and Interval Leak

**What goes wrong:** Two issues with DecryptedText:

1. **Layout shift:** Character randomization changes element width because Inter is proportional. In the sidebar session list, this shifts all items below the animated one.

2. **Interval leak:** `setInterval` for character scrambling continues after unmount, updating state on an unmounted component.

**Prevention for layout shift:**
- Fix the container width before starting the animation (measure final text, set `min-width`)
- Restrict DecryptedText to fixed-width contexts (header model name, sidebar section headers, NOT individual session titles)
- Use `contain: inline-size` on the animated text container

**Prevention for interval leak:**
- Store interval ID in a ref, clear in `useEffect` cleanup
- Also check `prefersReducedMotion()` in JS and skip the scramble entirely when active -- the CSS override only handles CSS animations, not JS `setInterval`

**Detection:** Layout shift visible in sidebar. Console warnings about state updates on unmounted components.

**Confidence:** MEDIUM for layout shift (depends on character set). HIGH for interval leak.

---

## Minor Pitfalls

### Pitfall 15: Glass Effect Color Desaturation

**What goes wrong:** Glass tokens include `--glass-saturate: 1.4` (140% saturation boost). Applied over Loom's low-chroma OKLCH surfaces (~0.008-0.010 chroma), the saturation boost can push charcoal surfaces toward unintended orange/brown and create visible color banding at the glass boundary.

**Prevention:** Test glass over every surface tier. Start with `saturate(1.0)` and add only if blur looks muddy.

**Confidence:** MEDIUM -- token values haven't been applied to real surfaces yet.

---

### Pitfall 16: WebGL Aurora/Grainient on Radeon 780M iGPU

**What goes wrong:** Aurora (~30KB ogl library) and Grainient consume shared system memory on iGPU. AMD Linux Mesa driver has WebGL performance quirks. Community reports document ~30fps WebGL on AMD iGPUs.

**Prevention:**
1. **Defer WebGL effects to v2.1, not v1.5.** CSS-only effects and springs first.
2. **If WebGL ships:** 30fps cap for ambient effects, 1/4 resolution canvas upscaled via CSS.
3. **Runtime GPU detection** via `WEBGL_debug_renderer_info` -- skip WebGL on weak GPUs.

**Confidence:** MEDIUM -- Radeon 780M can handle simple WebGL, but Linux Mesa driver quirks need profiling.

---

### Pitfall 17: CSS Grid `0fr`/`1fr` Transition Browser Inconsistencies

**What goes wrong:** Chrome 107+ interpolates `fr` units smoothly, but Safari and older Firefox snap between values.

**Prevention:** Accept graceful degradation. For critical animations, use `transform`-based alternatives.

**Confidence:** MEDIUM -- based on compat tables.

---

### Pitfall 18: Sidebar Slim Mode Tooltip Accessibility

**What goes wrong:** In slim mode, tab icons have no visible labels. Without tooltips, icons violate WCAG.

**Prevention:** Every slim-mode icon MUST have: (1) tooltip on hover/focus, (2) `aria-label`, (3) keyboard focus triggers tooltip. Use existing shadcn Tooltip component.

**Confidence:** HIGH -- WCAG requirement.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Settings refactor landing | Merge conflicts with later Dialog glass changes | Land settings first, before glass work |
| UI audit (loading/error/empty) | Over-animation of loading states | One animation per loading state: shimmer OR fade, not both |
| Dead UI removal | None animation-specific | Standard code quality |
| Sidebar slim mode | Layout thrash (P2), store migration (P11), no labels (P18) | `transform` animation, persist migration v7, tooltips |
| Smooth state transitions | AnimatePresence vs show/hide conflict (P5) | CSS-only panel transitions |
| Hover/focus/disabled states | `will-change` on repeated elements (P8) | CSS `transition` only |
| Spring physics on interactions | rAF contention during streaming (P1), re-render cascade (P9) | Gate springs during streaming; use CSS for sidebar/modal |
| Glass surface on modals/Cmd+K | Stacking context (P3), scroll perf (P4), Safari prefix (P13) | Portal overlays; one glass surface at a time; -webkit- prefix |
| DecryptedText reveals | Layout shift, interval leak (P14) | Fix container width; ref cleanup; skip on reduced-motion |
| StarBorder accents | `will-change` on active elements (P8) | CSS `@keyframes` only |
| Bundle discipline | Motion full bundle import (P6) | ESLint rule banning `motion` import; enforce `m` |
| Spring curve generation | `linear()` fallback missing (P12) | Cubic-bezier fallback first |

---

## iGPU-Specific Constraints (AMD Radeon 780M)

| Constraint | Impact | Threshold | Mitigation |
|-----------|--------|-----------|------------|
| **Shared memory** | GPU layers consume system RAM | Compositor layers < 20 | No `will-change` on repeated elements; `contain: strict` for canvases |
| **Memory bandwidth** | CPU and GPU compete for DDR5 | Visible during concurrent streaming + animation | Gate heavy animations during streaming |
| **WebGL scheduling** | Single GPU serves compositor + WebGL | Full-res canvas = compositor pressure | Render at 1/4 resolution; cap ambient at 30fps |
| **Linux Mesa driver** | WebGL perf varies by driver version | Profile on actual hardware | `chrome://gpu` check; CSS fallback if underperforming |
| **`backdrop-filter` compositing** | Blur is software-composited on some drivers | Heavy blur + large area = dropped frames | `--glass-blur` at 16px max; no blur on full-screen overlays |
| **Thermal throttling** | Sustained GPU load throttles APU | ~5 min continuous WebGL + streaming | Disable ambient WebGL after sustained streaming |

---

## Sources

- [Motion performance guide](https://motion.dev/docs/performance) -- GPU-accelerated properties, layout animation warnings
- [Motion bundle size reduction](https://motion.dev/docs/react-reduce-bundle-size) -- LazyMotion, m component, domAnimation vs domMax
- [Motion AnimatePresence docs](https://motion.dev/docs/react-animate-presence) -- exit animation patterns and limitations
- [Motion Issue #2554](https://github.com/framer/motion/issues/2554) -- AnimatePresence stuck on rapid state changes
- [Mozilla Bug 1718471](https://bugzilla.mozilla.org/show_bug.cgi?id=1718471) -- backdrop-filter blur lag with many elements
- [shadcn/ui Issue #327](https://github.com/shadcn-ui/ui/issues/327) -- CSS backdrop-filter performance issues
- [MDN: will-change](https://developer.mozilla.org/en-US/docs/Web/CSS/will-change) -- layer promotion, memory warnings
- [MDN: Stacking context](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Positioned_layout/Stacking_context) -- backdrop-filter stacking context creation
- [MDN: @property](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/@property) -- CSS custom property type registration
- [W3C WCAG 2.1 SC 2.3.3](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html) -- animation from interactions, vestibular considerations
- [A List Apart: Designing Safer Web Animation](https://alistapart.com/article/designing-safer-web-animation-for-motion-sensitivity/) -- vestibular disorder prevalence
- [AMD Community: Low WebGL on iGPU](https://community.amd.com/t5/pc-graphics/low-webgl-performance-with-integrated-graphics/m-p/712599) -- iGPU WebGL limitations
- [web.dev: Jank busting](https://web.dev/articles/speed-rendering) -- frame budget, rAF coordination
- [Sitepoint: Streaming Backends & React](https://www.sitepoint.com/streaming-backends-react-controlling-re-render-chaos/) -- rAF buffering for streaming
- [CSS @property for animation](https://blog.webdevsimplified.com/2025-01/css-at-property/) -- registering custom properties for interpolation
- [Smashing Magazine: CSS Relative Colour Animations](https://www.smashingmagazine.com/2026/01/smashing-animations-part-8-css-relative-colour/) -- OKLCH animation patterns 2026
- [Why backdrop-filter Fails with Positioned Children](https://medium.com/@aqib-2/why-backdrop-filter-fails-with-positioned-child-elements-0b82b504f440) -- stacking context child issues
- Codebase analysis: ContentArea mount-once pattern, useStreamBuffer rAF loop, UI store persist middleware, existing backdrop-filter usage in scroll-pill.css, base.css reduced-motion override
