# Project Research Summary

**Project:** Loom V2 — v1.5 "The Craft"
**Domain:** Production visual polish for a premium dark-theme AI coding workspace
**Researched:** 2026-03-18
**Confidence:** HIGH

## Executive Summary

v1.5 "The Craft" is a pure visual quality milestone for Loom, a 49K LOC React 19 + Tailwind v4 workspace with 609 commits and 150 tests across 5 shipped milestones. All functional features are done -- chat, streaming, file tree, code editor, terminal, git panel, settings, command palette, accessibility, and performance. What remains is making every pixel intentional: consistent loading/error/empty states, physics-based spring animations, frosted glass overlays, text reveal effects, and an icon-only sidebar collapse. The goal is closing the gap between "working software" and "a product that feels like a real team built it."

The strongest cross-cutting finding is that **zero new runtime dependencies are needed**. CSS `linear()` (90% browser support) reproduces real spring physics at zero JS cost. `backdrop-filter: blur()` (97% support) handles glass surfaces natively. DecryptedText is a ~200-line source-copy with framer-motion stripped out (it only used `<motion.span>` as a plain wrapper). StarBorder already exists in the codebase as `ElectricBorder`. The entire milestone adds ~0.5KB to the bundle. The Constitution's tiered animation strategy (CSS > tailwindcss-animate > LazyMotion) is validated: Tier 1 (CSS-only) handles every v1.5 case, and Tier 3 (LazyMotion) remains deferred.

The primary risks are performance-related: animating non-composite CSS properties (especially sidebar grid columns) competes with the rAF streaming buffer; `backdrop-filter` stacking contexts can corrupt z-index hierarchies and trap fixed-position elements; and the mount-once panel pattern makes tab transition animations fundamentally impossible. All three have clear prevention strategies documented in the research. The secondary risk is scope: sidebar slim mode is the only feature with store migration and layout architecture impact, and should be evaluated for potential deferral to v2.0 if the milestone runs long.

## Key Findings

### Recommended Stack

No new runtime dependencies. The existing stack (React 19, Tailwind v4, Zustand, Vitest, tw-animate-css) handles everything. One devDependency (`spring-easing@^2.3.3`) generates CSS `linear()` spring curve values at build time -- its output is pasted into `tokens.css`, not shipped to the browser.

**Core technologies (all existing or CSS-native):**
- CSS `linear()`: Spring easing curves -- real spring physics (overshoot, oscillation, settle) at zero runtime cost
- CSS `backdrop-filter`: Frosted glass on modals and command palette -- 97% browser support, GPU-accelerated
- `spring-easing` (devDependency): Converts stiffness/damping/mass configs into CSS `linear()` values -- run once, paste output
- Source-copied `DecryptedText`: Character scramble text reveal -- ~200 lines TypeScript, zero deps after stripping framer-motion
- Existing `ElectricBorder`: Animated border accent (already built, CSS-only) -- just apply to more surfaces

**Explicitly rejected:**
- `motion` / framer-motion (34KB full, 4.6KB LazyMotion): overkill, nothing needs layout animations or gestures
- `react-spring` (~25KB): same over-engineering for what CSS `linear()` now handles natively
- `ogl` / WebGL (~30KB): Aurora/Grainient are v2.1 spectacle, not v1.5 polish
- `tailwindcss-spring` plugin: uncertain Tailwind v4 `@plugin` compatibility

### Expected Features

**Must have (table stakes):**
- Consistent skeleton shimmer across all loading surfaces (4 of ~8 covered; upgrade from `animate-pulse` to directional sweep)
- Empty states for every data surface (file tree, git panel, session list, search, editor placeholder)
- Inline retry for failed API calls (git status, file tree, settings) -- not just toasts
- Hover/focus/active/disabled consistency across all ~51 files with interactive elements
- Focus-visible ring uniformity (same accent color, width, offset everywhere)
- Button press feedback (scale 0.98 + darken on `:active`)

**Should have (differentiators):**
- Spring physics on sidebar, modals, tool card expand/collapse, scroll-to-bottom pill
- Glass surfaces on command palette (upgrade 8px to 16px blur), settings modal, tooltips
- DecryptedText reveals for new session titles and model name on switch
- ElectricBorder/StarBorder on active sidebar session and focused composer
- Spacing/typography audit (4px grid compliance, type scale, border-radius consistency)

**Defer (v2.0+):**
- Sidebar slim mode -- most complex feature with store migration, layout changes, and highest risk. Evaluate during milestone.
- Aurora/Grainient WebGL backgrounds -- spectacle for v2.1, not production polish
- Progressive content reveal (staggered rows) -- medium complexity, potential scroll interaction issues
- BlurText empty state entrance -- nice-to-have, infrequent surface
- Light mode -- out of scope, dark-only is a brand decision

### Architecture Approach

The architecture is CSS-only animation layered on top of a mature token system. The codebase already has complete but underutilized motion infrastructure: three spring configs in `motion.ts`, CSS easing/duration tokens in `tokens.css`, glass tokens (blur, saturate, opacity), three source-copied effects (SpotlightCard, ShinyText, ElectricBorder), and a global `prefers-reduced-motion` system. The work is wiring existing tokens to actual component animations, not creating new systems.

**Major architectural constraints:**
1. **Mount-once CSS show/hide** (ContentArea) -- all 4 workspace panels always mounted, active toggled via `display: none`. Tab transition animations are impossible. Animate contents within active panels, not the panels themselves.
2. **rAF streaming buffer** (useStreamBuffer) -- the streaming pipeline owns `requestAnimationFrame` during active chat. Decorative JS animations must be gated during streaming to avoid frame budget contention.
3. **5 Zustand stores** -- no new stores needed. Sidebar slim mode is a state change in `useUIStore`. Glass/spring preferences handled by existing `prefers-reduced-motion` system.

**Key patterns to follow:**
1. **Token-driven GlassSurface** -- reusable wrapper reading all values from CSS custom properties
2. **CSS spring curves as token extensions** -- `--ease-spring-gentle/snappy/bouncy` via `linear()` alongside existing `--ease-spring` cubic-bezier fallback
3. **Sidebar state machine** -- 3-state enum (`expanded | slim | hidden`) replacing boolean `sidebarOpen`, with Zustand persist migration v7
4. **Performance-gated effects** -- expensive effects gated by `prefers-reduced-motion` in both CSS (global 0.01ms override) and JS (for `setInterval`-based effects like DecryptedText)

### Critical Pitfalls

1. **rAF contention during streaming** -- Spring animation libraries schedule their own rAF callbacks that compete with the streaming buffer's 16.67ms frame budget. Prevention: gate decorative animations during streaming via `isStreaming` state; use CSS transitions (compositor thread) not JS springs (main thread).

2. **Layout thrash from sidebar width animation** -- Animating `grid-template-columns` or `width` triggers layout recalculation on every frame, compounding with streaming rAF. Prevention: set grid column to final value immediately, animate the sidebar element via `transform: translateX()` (GPU-composited, no layout).

3. **`backdrop-filter` stacking context corruption** -- Glass surfaces create new stacking contexts that trap z-index children (tooltips, dropdowns) and break fixed-position elements. Prevention: apply glass to leaf containers only; portal all overlays to `document.body`; one glass surface visible at a time.

4. **Mount-once pattern vs AnimatePresence** -- Adding `AnimatePresence` to ContentArea tab switching would either do nothing (CSS `display: none` is invisible to it) or break panel state if switched to conditional rendering. Prevention: CSS-only panel transitions; reserve `AnimatePresence` for truly conditional elements (modals, toasts).

5. **DecryptedText layout shift and interval leak** -- Character randomization changes element width (Inter is proportional); `setInterval` continues after unmount. Prevention: fix container width before animating; clear interval in `useEffect` cleanup; skip scramble entirely when `prefers-reduced-motion` is active.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Foundation and Settings Landing
**Rationale:** Everything depends on clean token infrastructure and resolved in-progress work. Settings refactor touches Dialog component -- must land before glass surface work to avoid merge conflicts.
**Delivers:** CSS spring tokens in `tokens.css`, landed settings refactor (generic useFetch, connection store persist fix, ModalState type safety), dead UI cleanup.
**Addresses:** Spring token infrastructure, settings tech debt, code hygiene.
**Avoids:** Merge conflicts between settings refactor and later glass work on Dialog (Pitfall: phase-specific warning in PITFALLS.md).

### Phase 2: UI Audit -- Loading, Error, and Empty States
**Rationale:** Table stakes that users notice before any visual personality. Missing skeletons and empty states make the app feel like a prototype regardless of how good the animations are.
**Delivers:** Consistent directional shimmer on all skeletons, TerminalSkeleton and FileTreeSkeleton, empty state pattern (icon + heading + subtext + CTA) applied to 5 surfaces, inline retry on failed API sections, Sonner action buttons for retry, timeout escalation messages.
**Addresses:** 14 table stakes items from FEATURES.md (loading states, error states, empty states).
**Avoids:** Over-animating loading states (one animation per state: shimmer OR fade, not both).

### Phase 3: Interactive State Consistency
**Rationale:** Hover/focus/disabled inconsistency is the #1 signal of "student project" according to FEATURES.md research. Must be a systematic pass, not piecemeal fixes.
**Delivers:** Consistent `:not(:disabled):hover`, `:not(:disabled):active`, `focus-visible` ring, disabled opacity across all ~51 files. Button press feedback (scale 0.98).
**Addresses:** 4 state consistency items from FEATURES.md.
**Avoids:** `will-change` on repeated elements (Pitfall 8 -- layer explosion on iGPU).

### Phase 4: Spring Physics and Glass Surfaces
**Rationale:** Springs and glass are the most broadly visible differentiators. They touch many surfaces but require minimal logic changes -- mostly CSS token swaps.
**Delivers:** `--ease-spring-gentle/snappy/bouncy` via `linear()` wired to tool card expand, thinking disclosure, ToolCallGroup, modal entrance, scroll-to-bottom pill. GlassSurface component applied to Dialog overlay/content, CommandPalette (upgrade from 8px to 16px blur + saturate), tooltips.
**Addresses:** 8 differentiator items from FEATURES.md (spring physics, glass surfaces).
**Avoids:** rAF contention (Pitfall 1 -- gate springs during streaming), stacking context corruption (Pitfall 3 -- portal overlays), `linear()` fallback failure (Pitfall 12 -- cubic-bezier first, `linear()` second).

### Phase 5: Visual Personality Effects
**Rationale:** DecryptedText and ElectricBorder/StarBorder are the distinctive visual signatures that separate Loom from generic chat UIs. They depend on spring tokens and glass surfaces being stable.
**Delivers:** DecryptedText component (source-copied, Motion-free), applied to session titles and model name. ElectricBorder/StarBorder on active sidebar session and focused composer. ShinyText wired to production use.
**Addresses:** 6 differentiator items from FEATURES.md (text reveals, border effects).
**Avoids:** DecryptedText layout shift (Pitfall 14 -- fix container width), interval leak (Pitfall 14 -- ref cleanup), over-animation (Pitfall 10 -- max 2 simultaneous animations).

### Phase 6: Sidebar Slim Mode
**Rationale:** Most complex standalone feature with store migration, new component, and layout changes. Isolated late to avoid blocking the lower-risk phases. Consider deferral to v2.0 if milestone runs over budget.
**Delivers:** 3-state sidebar (expanded/slim/hidden), SidebarSlim icon rail with tooltips, spring-animated width transition, Zustand persist migration v7.
**Addresses:** Sidebar slim mode from FEATURES.md.
**Avoids:** Grid template animation (Pitfall 2 -- use `transform: translateX()`), store migration breakage (Pitfall 11 -- version 7 migration), missing tooltip accessibility (Pitfall 18 -- every icon needs `aria-label` + tooltip).

### Phase 7: Spacing, Typography, and Final Polish
**Rationale:** Final pass that catches anything missed. Benefits from all prior work being stable. Pure grunt work with no architectural risk.
**Delivers:** 4px grid compliance across all components, type scale consistency (font sizes, weights, line-heights), border-radius uniformity (sm/md/lg scale, no magic numbers).
**Addresses:** 3 differentiator items from FEATURES.md (spacing, typography, border-radius audit).
**Avoids:** Nothing specific -- low risk phase.

### Phase Ordering Rationale

- Foundation first because spring tokens and settings landing are prerequisites for phases 2-5
- UI audit (loading/error/empty) before visual effects because table stakes > differentiators for perceived quality
- Interactive states before springs/glass because hover/focus consistency is the baseline that makes spring animations feel polished rather than lipstick-on-a-pig
- Springs + glass before personality effects because the personality effects (DecryptedText entrance, ElectricBorder activation) use spring timing
- Sidebar slim mode isolated late because it's the only feature with store migration risk and can be cut without affecting other phases
- Final polish last as a sweep that benefits from everything else being stable

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 4 (Springs + Glass):** `spring-easing` CSSSpringEasing API needs hands-on verification -- generate curves, visually compare to existing `motion.ts` spring configs. Also verify CSS `@property` registration works with Tailwind v4 for any properties that need animation.
- **Phase 6 (Sidebar Slim):** CSS custom property interpolation via `@property` for sidebar width may be needed. Alternative `transform: translateX()` approach should be prototyped. Store migration v7 needs careful testing against persisted localStorage shapes.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Foundation):** Token generation script is straightforward; settings refactor already scoped.
- **Phase 2 (UI Audit):** Well-documented patterns from competitive analysis (FEATURES.md has exact implementations from Claude.ai, ChatGPT, LobeChat).
- **Phase 3 (Interactive States):** Pure CSS audit -- no novel patterns needed.
- **Phase 5 (Visual Effects):** DecryptedText source code already analyzed; ElectricBorder already built.
- **Phase 7 (Final Polish):** Systematic review, no unknowns.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | CSS `linear()` verified on Can I Use (90%+). `backdrop-filter` at 97%. `spring-easing` stable at v2.3.3. React Bits DecryptedText source verified on GitHub -- Motion dependency confirmed trivially removable. Zero reliance on unproven libraries. |
| Features | HIGH | Feature landscape derived from 49K LOC codebase audit, competitive analysis of 6 products (Claude.ai, ChatGPT, Perplexity, Open WebUI, LobeChat, LibreChat), prior visual effects research, and 106-requirement chat interface standards document. |
| Architecture | HIGH | CSS-only approach verified against Constitution Section 11.1. Mount-once pattern constraint verified in ContentArea.tsx source. Every planned animation confirmed achievable without JS animation library. Sidebar slim mode architecture (3-state enum, CSS variable transition, store migration) is well-defined. |
| Pitfalls | HIGH | 18 pitfalls identified with concrete prevention strategies. Critical pitfalls (rAF contention, layout thrash, stacking context) are well-documented browser behaviors with spec references. iGPU-specific constraints documented with thresholds (compositor layers < 20, `will-change` max 5, `backdrop-filter` max 5 simultaneous). |

**Overall confidence:** HIGH

### Gaps to Address

- **`spring-easing` visual verification:** Need to run the generation script and visually confirm the CSS `linear()` output matches the intended spring feel of `SPRING_GENTLE`, `SPRING_SNAPPY`, `SPRING_BOUNCY` before committing to `tokens.css`.
- **CSS `@property` + Tailwind v4:** Registering custom properties for interpolation (needed if sidebar width is animated via custom property transition) needs testing with Tailwind v4's toolchain. Browser support is good (Chrome 85+, Firefox 128+, Safari 15.4+) but integration is unverified.
- **Glass saturation tuning:** `--glass-saturate: 1.4` on Loom's low-chroma OKLCH surfaces (~0.008-0.010 chroma) could push colors toward unintended orange/brown. Need visual testing over every surface tier; may need to reduce to `saturate(1.0)`.
- **Sidebar slim mode scope:** The only feature with store migration and layout architecture impact. If the milestone runs over budget, this is the candidate for deferral to v2.0 without losing the polish story.
- **CSS Grid `0fr/1fr` browser consistency:** Chrome 107+ interpolates `fr` units smoothly, but Safari and older Firefox may snap. Graceful degradation is acceptable, but verify on target browsers.

## Sources

### Primary (HIGH confidence)
- Codebase audit: 49K LOC across `/home/swd/loom/src/src/` -- 51 files with interactive states, 4 existing skeletons, 3 adopted effects, complete token infrastructure
- `.planning/reference-app-analysis.md` -- competitive analysis of 6 AI chat products
- `.planning/chat-interface-standards.md` -- 106 requirements across 16 categories
- `.planning/V2_CONSTITUTION.md` -- 12 sections of enforceable coding conventions (Section 11.1: tiered animation)
- `.planning/visual-effects-audit.md` -- React Bits, shadcn, Magic UI evaluation
- `.planning/M3-POLISH-DEFERRED-CONTEXT.md` -- deferred polish context from M3 planning
- `.planning/PROJECT_SOUL.md` -- north star aesthetic: "surgical laser + old library"

### Secondary (MEDIUM confidence)
- [Can I Use: CSS linear()](https://caniuse.com/mdn-css_types_easing-function_linear-function) -- 90% global, Safari 17.2+
- [Can I Use: backdrop-filter](https://caniuse.com/css-backdrop-filter) -- 97% global
- [Motion bundle size docs](https://motion.dev/docs/react-reduce-bundle-size) -- 34KB full, 4.6KB LazyMotion
- [spring-easing npm](https://www.npmjs.com/package/spring-easing) -- v2.3.3, CSSSpringEasing utility
- [React Bits DecryptedText source](https://github.com/DavidHDev/react-bits/blob/main/src/content/TextAnimations/DecryptedText/DecryptedText.jsx) -- Motion dependency verified removable
- [NN/g Button States](https://www.nngroup.com/articles/button-states-communicate-interaction/) -- hover/focus/active/disabled UX research
- [shadcn/ui Issue #327](https://github.com/shadcn-ui/ui/issues/327) -- backdrop-filter performance discussion
- [Josh Comeau on backdrop-filter](https://www.joshwcomeau.com/css/backdrop-filter/) -- implementation patterns

### Tertiary (LOW confidence -- verify before adopting)
- [Dark Glassmorphism 2026 trend](https://medium.com/@developer_89726/dark-glassmorphism-the-aesthetic-that-will-define-ui-in-2026-93aa4153088f) -- 64% SaaS adoption claim (single source)
- [AMD Community: Low WebGL on iGPU](https://community.amd.com/t5/pc-graphics/low-webgl-performance-with-integrated-graphics/m-p/712599) -- iGPU WebGL limitations (relevant if Aurora/Grainient ever ships)

---
*Research completed: 2026-03-18*
*Ready for roadmap: yes*
