# Project Research Summary

**Project:** Loom v1.1 -- Visual Redesign (charcoal + dusty rose)
**Domain:** Brownfield visual redesign of a React 18 streaming AI chat interface
**Researched:** 2026-03-03
**Confidence:** HIGH

## Executive Summary

Loom v1.1 is a visual redesign of a complete, functional AI chat product. The features are built; the work is replacing the warm earthy palette (#1c1210 chocolate, #d4a574 amber) with charcoal + dusty rose (#1a1a1a, #D4736C) and elevating the visual experience to the standard set by Claude.ai, ChatGPT, Perplexity, and Open WebUI. The recommended approach is conservative and surgical: swap CSS variable values first, then audit and eliminate the 86+ hardcoded color references that bypass the variable system, then add new systems (toast notifications, animation utilities) as additive layers. The v1.0 architecture was explicitly designed for this kind of palette migration -- the `hsl(var(--token) / <alpha-value>)` contract in tailwind.config.js means that changing `:root` values in index.css instantly updates every semantic-class component. The complexity lies entirely in the hardcoded hex references scattered across 13 files.

The recommended premium identity follows the **Claude.ai playbook** adapted with Loom's distinctive warmth: invisible borders at 6-10% opacity, hidden-until-hover message actions, full-width assistant messages, generous 32px inter-turn spacing, and the dusty rose accent applied sparingly (5% of surface area maximum). The only new dependencies justified are Sonner for toast notifications (~3KB gzipped) and tailwindcss-animate as a CSS-only Tailwind plugin (0KB JS runtime). Motion/Framer Motion is explicitly rejected: its 34-55KB JS cost is not warranted when CSS grid-rows tricks and the existing isExiting pattern (used in 46+ components) cover all exit animation needs. The codebase already has 281 CSS transition/animation instances across 77 files -- the pattern is established and working.

The critical risk is the "hardcoded color hydra": 51 arbitrary hex values in chat components alone plus 371 Tailwind gray/slate/neutral/zinc classes inherited from CloudCLI, all bypassing the CSS variable system. Skipping this audit before changing `:root` values produces a visually inconsistent half-migrated UI with warm brown adjacent to charcoal. A second risk is animation-induced scroll regression: CSS transitions that animate height during streaming break the IntersectionObserver sentinel, causing scroll pill flicker and auto-scroll failure. The mitigation is precise -- animate only opacity and transform (layout-safe), never height, during or near streaming.

## Key Findings

### Recommended Stack

The existing stack requires minimal additions. React 18, TypeScript, Vite 7, Tailwind CSS 3.4, Shiki v4, react-markdown, CodeMirror 6, @xterm/xterm, lucide-react, and the `hsl(var(--token) / <alpha-value>)` CSS variable architecture are all inherited without change. The only new runtime dependency is Sonner for toast notifications. The only new dev dependency is tailwindcss-animate as a Tailwind plugin.

**Core technologies:**
- `sonner ^2.0.7`: Toast notifications -- dark theme native, promise toasts, 3KB gzipped, maps directly to Loom's CSS variables via `[data-sonner-toast]` selectors. Zero dependencies.
- `tailwindcss-animate ^1.0.7`: Animation utilities -- provides composable `animate-in`, `fade-in`, `slide-in-from-bottom-2` etc. as pure Tailwind CSS classes; 0KB JS runtime impact.
- CSS variable value swap (no new library): The `:root` block in index.css changes HSL values but not variable names or the Tailwind config structure; every semantic-class component updates automatically.

**Total new JS bundle impact:** ~3KB gzipped (Sonner only).

**Rejected additions (documented rationale):**
- `motion` (Framer Motion): 34-55KB gzipped JS; CSS grid-rows trick + tailwindcss-animate + isExiting pattern covers all v1.1 animation needs at 0KB JS cost
- Any virtualization library: Chat sessions rarely exceed 100 turns; premature
- Light mode / theme switching: Single dark theme is the brand identity; would require a complete second design system

### Expected Features

Analysis of six reference products (Claude.ai, ChatGPT, Perplexity, Open WebUI, LobeChat, LibreChat) produced a clear priority ranking. The dependency chain is firm: the design system (CSS variables, palette, typography) is the prerequisite for all other visual work.

**Must have (table stakes):**
- 3-4 tier surface elevation: base (#1a1a1a) -> cards (#222222) -> elevated (#2a2a2a) -> overlays. Use background lightness steps, NOT drop shadows.
- Subtle borders at 6-10% white opacity -- single most impactful "premium" signal. Replace all hard borders with `hsl(var(--border) / 0.08-0.12)`.
- Hidden-until-hover action buttons on messages -- single biggest clutter reducer. `opacity-0 group-hover:opacity-100 transition-opacity duration-200`.
- Full-width assistant messages with transparent background (no bubble wrapper)
- Generous 32-48px inter-turn spacing, tight spacing within turns
- Toast notifications (glassmorphic style, bottom-right position, 2-4s auto-dismiss)
- Chronological sidebar grouping with tracked time-group labels (Today, Yesterday, Last 7 Days)
- Monospace code blocks with hover-reveal copy button (already built; verify new palette)
- Semantic error states: gray=info, amber=warning, muted red=error
- Dusty rose input focus glow: `box-shadow: 0 0 0 2px hsl(var(--accent)/0.15)` on focus

**Should have (competitive differentiators):**
- Tool call action card restyle: compact pill, icon + name + semantic state (pulsing rose = running, collapsed chip = success, expanded muted red = error)
- Execution chain grouping: 3+ sequential tool calls collapse into accordion with count badge
- Semantic streaming states: "Reading auth.ts..." text status above ChatComposer via ActivityStatusLine component
- Spring-physics message entrance: translateY(8px) + opacity 0->1, 250ms, `cubic-bezier(0.22, 1, 0.36, 1)` (CSS only)
- Slim sidebar collapse to icon-only strip
- Active session indicator: 2px dusty rose left border + `bg-accent/0.08` background tint
- Token/cost display per response (muted footer text, session total in sidebar)
- Custom text selection: `::selection { background-color: hsl(var(--accent)/0.25); }`
- Glassmorphic overlays for floating elements only (modals, toasts, dropdowns -- NOT scrolling content)

**Defer to v2+:**
- Context window gauge (after token display works)
- Density toggle (after base density is correct)
- Command palette (significant scope)
- Font customization
- Conversation branching / tree view (wrong mental model)
- Light mode (dilutes brand)
- Model comparison side-by-side (unnecessary for 2-model product)
- Right-side artifact panel (conflicts with 720px centered rail)

### Architecture Approach

The architecture strategy is "change values, not structures." Five integration layers handle the full redesign without touching any business logic or streaming performance boundaries. Every new overlay element must use ReactDOM.createPortal to document.body to escape stacking contexts and overflow clipping. The streaming performance boundaries (requestAnimationFrame buffer, `contain: content` on `.message-streaming`, IntersectionObserver scroll anchor, React.memo + custom comparators on TurnBlock) are protected and must not be modified.

**Five integration layers:**
1. **CSS Variable Values** (`index.css :root`): 22 existing variables get new HSL channel values; 7 new tokens added (--toast-bg, --code-bg, --diff-bg, --streaming-cursor, scrollbar tokens). Variable names and Tailwind config structure stay identical.
2. **Hardcoded Color References** (13 component files): 51 arbitrary hex values in Tailwind arbitrary syntax + 371 gray/slate/neutral/zinc classes. All must be replaced with semantic aliases. This is the largest single body of work.
3. **Specialty Surface Themes**: xterm.js `TERMINAL_OPTIONS.theme` JS object (20 hex values -> Catppuccin Mocha), Shiki `WARM_COLOR_REPLACEMENTS` map (12 mappings), `warmDiffStyles` object in DiffViewer (25+ hex values), Tailwind Typography plugin overrides.
4. **New Component Systems** (additive, no existing code changes): `ToastProvider` + `ToastContainer` (portal to document.body, subscribes to WebSocketContext connection state), `ActivityStatusLine` (CSS Grid 0fr/1fr reveal above ChatComposer).
5. **Component Visual Polish**: hover states, micro-interactions, message spacing, message entrance animations -- CSS className additions only.

### Critical Pitfalls

1. **The Hardcoded Color Hydra** (CRITICAL): 51 arbitrary hex values (`bg-[#1c1210]`, `text-[#c4a882]`) + 371 gray/slate/zinc classes across 13 files bypass CSS variables entirely. Changing `:root` leaves 40% of the app in the old palette. Run the full grep audit and create a token map (old hex -> semantic class) BEFORE touching `:root` values. The migration plan must sequence audit first, then variables.

2. **HSL Alpha-Value Contract Breakage** (CRITICAL): The Tailwind config stores `hsl(var(--X) / <alpha-value>)`. CSS variables MUST contain bare HSL channels (`0 0% 10%`), never `hsl(0 0% 10%)` or comma-separated (`0, 0%, 10%`). Adding the `hsl()` wrapper produces nested `hsl(hsl(...) / 0.5)` which browsers silently ignore, breaking ALL opacity modifiers. Create an opacity test page immediately after variable changes and verify before proceeding.

3. **Animation Jank During Streaming** (HIGH): `transition: all 150ms` on buttons/inputs triggers layout recalculation during streaming token arrival. Multiple aurora gradient elements (thinking + skeleton + aura = 3-5) create GPU compositing layers that exceed the AMD Radeon 780M iGPU budget (~8-10 layers), dropping frame rate. Replace `transition: all` with specific property transitions; add `.is-streaming` CSS guard class to disable non-critical animations; cap concurrent GPU layers.

4. **Scroll Behavior Regression from Animations** (HIGH): CSS transitions that animate height change `scrollHeight` over time, causing the IntersectionObserver sentinel to fire incorrectly (scroll pill flicker, auto-scroll failure, scroll position jumps after expand). Only animate `opacity` and `transform` -- these are layout-safe and don't affect `scrollHeight`. Use the CSS Grid 0fr/1fr pattern (already established in TurnBlock/ToolActionCard) for any expand/collapse near scroll containers.

5. **Z-Index Wars** (HIGH): Current codebase has unmanaged z-indexes spanning z-10 to z-[9999] across 20+ components. Adding toast notifications requires a formal z-index scale (sticky=10, floating=20, dropdown=30, overlay=40, modal=50, toast=60, critical=70) and portal-to-body strategy for ALL overlays. Must be established before adding any new overlay element.

6. **Contrast Ratio Failures on Charcoal** (HIGH): Dusty rose `#D4736C` on charcoal `#1a1a1a` = 4.2:1 contrast ratio, failing WCAG AA for small text (requires 4.5:1). Muted text at reduced opacity (`/30`) falls to 2:1 or below. Every text/background pair must be audited; opacity floor raised to `/40` minimum for readable text; a lighter rose variant added for text-use cases vs. decorative accent use.

## Implications for Roadmap

The architecture's five integration layers map directly to a natural phase order. The dependency chain is unambiguous: nothing can be visually correct until the design system is in place, and the design system requires the hardcoded color audit to be complete before variables are changed.

### Phase 1: Design System Foundation
**Rationale:** CSS variable values are the prerequisite for everything else. Once variables are correct, every semantic-class component updates automatically. This must complete before any component work is judged visually.
**Delivers:** Global palette switch (charcoal + dusty rose), 3-tier surface elevation, opacity modifiers verified working, WCAG contrast compliance checked, new token vocabulary (surface hierarchy, rose scale, scrollbar tokens, streaming cursor token), input focus glow, text selection color.
**Addresses:** CSS variable value swap, border opacity standardization, warm text hierarchy, scrollbar tokenization, select dropdown arrow SVG update.
**Avoids:** HSL alpha contract breakage (#2), contrast ratio failures (#6). Requires completing the hardcoded color audit grep BEFORE changing `:root` values -- the audit informs the token map needed for Phase 2.
**Research flag:** Skip -- well-documented CSS variable migration pattern with fully specified target values.

### Phase 2: Hardcoded Color Sweep
**Rationale:** The 51+ arbitrary hex values and 371 gray/slate/zinc classes are the exact blocker preventing design system propagation. This is mechanical but critical: without it, 40% of the app stays warm brown after Phase 1.
**Delivers:** 100% palette consistency across all chat components; grep audit for `[#` returns zero matches; all warm brown/amber/terracotta eliminated; semantic token coverage complete.
**Addresses:** MessageComponent.tsx (17 hex refs), CodeBlock.tsx (7), SystemStatusMessage.tsx (7), ThinkingDisclosure.tsx (6), ScrollToBottomPill.tsx (full hardcode), streaming-cursor.css (#d4a574 cursor), ConnectionStatusDot.tsx (3 status hex), gray/slate/zinc class migration.
**Avoids:** Component cascade at panel junctions (#7), hardcoded color hydra (#1).
**Research flag:** Skip -- mechanical find-and-replace using the token map created during Phase 1 audit.

### Phase 3: Specialty Surface Rethemes
**Rationale:** Third-party components (xterm.js, Shiki, DiffViewer, Tailwind Typography) have independent color systems that don't read from CSS variables. They require individual configuration updates with explicit hex values.
**Delivers:** Terminal background matches charcoal; syntax highlighting matches new palette; diff viewer palette correct; markdown prose content uses rose accent for links and correct heading colors.
**Addresses:** xterm.js TERMINAL_OPTIONS.theme (20 hex values -> Catppuccin Mocha charcoal variant), useShikiHighlighter WARM_COLOR_REPLACEMENTS (12 mappings), warmDiffStyles object (25+ colors), tailwind.config.js typography prose overrides (`--tw-prose-body`, `--tw-prose-code`, etc.).
**Avoids:** Dark mode consistency / third-party color leakage (#8), prose typography plugin leakage (#11).
**Research flag:** Skip -- direct file updates with known target values. Catppuccin Mocha is a published palette with documented hex values.

### Phase 4: Message Experience and Micro-Interactions
**Rationale:** With the palette fully consistent across all surfaces, message-level visual polish is the highest-impact next step. Hidden-until-hover actions alone transform the perceived density of the interface.
**Delivers:** Hidden-until-hover message actions, full-width assistant messages confirmed, 32px inter-turn spacing, message entrance animation (translateY(8px) + opacity, CSS only, cubic-bezier spring approximation), streaming batch opacity fade-in, button hover glows, active:scale-[0.98] press feedback, `::selection` dusty rose.
**Uses:** tailwindcss-animate for `animate-in fade-in-0 slide-in-from-bottom-2` utilities, CSS Grid 0fr/1fr for expand/collapse, Tailwind semantic tokens.
**Avoids:** Animation jank during streaming (#3 -- only opacity/transform used), scroll behavior regression (#4 -- no height animations during streaming), bundle size creep (#10 -- CSS only, no animation JS library), global `transition: none` override (#15 -- must account for this before writing animation CSS).
**Research flag:** Skip -- established CSS animation patterns; tailwindcss-animate well-documented.

### Phase 5: Toast Notifications and Z-Index System
**Rationale:** Toast system requires establishing the z-index scale first. The current z-index landscape spans z-10 to z-[9999] with no formal system -- adding any new overlay layer without a scale creates conflicts.
**Delivers:** Formal z-index CSS custom property scale (--z-sticky through --z-critical), Sonner Toaster installed and themed to charcoal+rose via CSS variable overrides, WebSocket connection state toasts (warning on disconnect, success on reconnect), session error toasts, portal strategy documented.
**Uses:** `sonner ^2.0.7`, ReactDOM.createPortal, WebSocketContext connection state (ToastProvider wraps inside WebSocketProvider).
**Avoids:** Z-index wars (#6), toast inside scroll container (anti-pattern 3 from ARCHITECTURE.md), backdrop contrast failure on charcoal (#14 -- increase `bg-black/50` to `bg-black/70`).
**Research flag:** Skip -- Sonner API is documented; portal pattern is standard React.

### Phase 6: Tool Call Display and Sidebar Polish
**Rationale:** Tool calls are central to Loom's coding workflow. Once the palette foundation is established and toast system provides the z-index framework, tool call action cards and the sidebar are the next highest-impact component areas.
**Delivers:** Tool call action pills (compact, icon + name + semantic state colors), pulsing rose indicator for running state, collapsed chip for success, expanded muted red background for errors, execution chain grouping (3+ calls -> accordion with count badge), sidebar time groups with tracked labels, active session 2px rose border + bg tint, slim sidebar icon-only collapse mode.
**Avoids:** Component cascade at panel junctions (#7 -- sidebar edge cases require checking sidebar/chat boundary), mobile breakpoint regression (#9 -- sidebar collapse must work at 375px).
**Research flag:** Low confidence needed. If exact visual parity with ChatGPT action pill pattern is required, a brief research pass on pill CSS specifics would reduce design iteration. Otherwise, the FEATURES.md competitive matrix has sufficient detail.

### Phase 7: Activity Status and Streaming States
**Rationale:** Semantic streaming states ("Reading auth.ts...", "Writing server.ts...") are a meaningful differentiator but require reading tool event data from the stream. Depends on solid animation foundation from Phase 4 and palette from Phases 1-3.
**Delivers:** ActivityStatusLine component (CSS Grid 0fr/1fr reveal above ChatComposer, shows during streaming), semantic status text parsed from useChatRealtimeHandlers tool events, send-to-stop icon morph (CSS opacity crossfade), streaming cursor color updated to hsl(var(--primary)).
**Uses:** CSS Grid expand/collapse, useChatRealtimeHandlers tool event subscription, CSS transition crossfade for send/stop swap.
**Avoids:** Animation jank during streaming (#3), scroll regression (#4). The ActivityStatusLine must use the CSS Grid 0fr/1fr pattern (not max-height) and must not trigger scroll height changes.
**Research flag:** Skip for CSS/animation work. If backend stream tool event format is undocumented or complex, a brief audit of actual WebSocket message shapes before planning will reduce mid-phase surprises.

### Phase Ordering Rationale

- Phases 1-3 are strictly sequential: CSS variables -> component hardcodes -> third-party systems. None can be reordered.
- Phases 4-7 are largely independent but Phase 5 (z-index scale) should precede any work adding new overlay elements to avoid rework.
- Every phase must include mobile regression testing at 375px. The mobile-specific CSS in index.css (lines 351-436) has critical fixed-position and safe-area dependencies that break silently on desktop.
- Scroll behavior must be regression-tested at the end of Phases 4 and 7 (the phases adding CSS transitions and new animated components).
- The hardcoded color audit grep should be run as the first action of Phase 1, before changing any values, to inform the token replacement map used in Phase 2.

### Research Flags

Phases needing deeper research during planning:
- **Phase 6 (tool call display):** If tight visual fidelity to ChatGPT's action pill pattern is a goal, a focused research pass on the CSS/component structure would reduce design iteration time. The FEATURES.md competitive matrix provides sufficient guidance for a competent implementation.
- **Phase 7 (semantic streaming states):** A brief audit of actual WebSocket message shapes from useChatRealtimeHandlers (what fields are available when a tool call starts/completes) before planning will prevent scope surprises.

Phases with well-documented patterns (skip research):
- **Phase 1:** CSS variable migration is a solved pattern; all target values and the two-pass strategy are fully specified in ARCHITECTURE.md.
- **Phase 2:** Mechanical grep-and-replace with a known token map. The audit commands are in PITFALLS.md Pitfall 1.
- **Phase 3:** Direct config file updates with known targets. Catppuccin Mocha hex values are a published palette.
- **Phase 4:** tailwindcss-animate utilities are documented; CSS-only animation pattern is established in 281 existing instances.
- **Phase 5:** Sonner API is documented; portal pattern is standard React.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Verified via npm registry (actual package sizes measured 2026-03-03), direct codebase audit (bundle size 1.38MB measured), peer dependency compatibility confirmed, Tailwind 3.4.17 install verified. |
| Features | HIGH | Cross-verified across 6 reference products via Gemini research. Competitive matrix covers palette, message styling, tool call display, streaming indicators, and sidebar design. Some ChatGPT post-GPT5 details MEDIUM (may reflect unreleased features). |
| Architecture | HIGH | Based on direct analysis of the built v1.0 codebase. All file paths, line numbers, class names, and component counts verified against actual source. The 86 hardcoded hex count and 13-file distribution are audited facts, not estimates. |
| Pitfalls | HIGH | All critical pitfalls verified against actual codebase. The 51 arbitrary hex count, z-index value distribution (z-10 to z-[9999]), and streaming performance boundary locations are direct grep results. WCAG contrast ratios are calculated against actual planned hex values. |

**Overall confidence:** HIGH

### Gaps to Address

- **Exact charcoal HSL values need visual calibration:** ARCHITECTURE.md notes the target HSL values are "illustrative." The approach is correct, but specific lightness levels for --card, --secondary, --muted-foreground need visual verification during Phase 1 execution. A slightly lighter rose may be required to clear WCAG AA for small text.
- **Dusty rose WCAG AA boundary:** `#D4736C` on `#1a1a1a` = 4.2:1, failing WCAG AA for small text (4.5:1 required). A lighter rose variant for text-use cases (e.g., `--accent-text: 5 35% 75%`) may need to be added to the token vocabulary in Phase 1.
- **Backend stream event shapes for Phase 7:** The ActivityStatusLine depends on tool event data from useChatRealtimeHandlers. A brief audit of actual WebSocket message fields before Phase 7 planning will prevent scope changes mid-phase.
- **Mobile safe-area final verification:** `env(safe-area-inset-bottom)` only works correctly in standalone/PWA mode. DevTools responsive mode cannot fully simulate this. Real device or iOS simulator testing is required, particularly after Phase 1 changes padding/spacing.

## Sources

### Primary (HIGH confidence)
- Direct codebase audit of `/home/swd/loom/src/` (v1.0 built) -- hardcoded hex counts, z-index values, file paths, animation inventories, bundle size, Tailwind version
- npm registry (verified 2026-03-03) -- sonner@2.0.7 (3KB gzipped), tailwindcss-animate@1.0.7 (0KB JS), motion@12.34.4 (34-55KB gzipped), react-hot-toast@2.6.0, @radix-ui/react-toast@1.2.15
- Tailwind CSS documentation -- HSL `<alpha-value>` contract, tailwindcss-animate peer dep compatibility (>=3.0.0)
- WCAG 2.1 Level AA -- 4.5:1 contrast ratio requirement for normal text, 3:1 for large text

### Secondary (MEDIUM-HIGH confidence)
- Gemini research (2026-03-03) -- Claude.ai, ChatGPT, Perplexity, Open WebUI, LobeChat, LibreChat interface analysis; competitive pattern matrix across palette, message styling, tool calls, streaming indicators, sidebar design
- MDN documentation -- CSS `contain`, `content-visibility: auto`, CSS Grid `grid-template-rows` animation, IntersectionObserver spec
- Chrome DevTools documentation -- Layers panel, GPU compositing layer analysis, performance profiling during streaming

### Tertiary (MEDIUM confidence)
- ChatGPT post-GPT5 interface specifics -- some details may reflect speculative analysis about features not yet publicly released; core patterns (action pills, batch streaming, aggressive tool grouping) are established
- LobeChat spring physics specifics (stiffness: 100, damping: 20) -- community documentation quality varies; spring approximation via `cubic-bezier(0.22, 1, 0.36, 1)` is the CSS-based safe substitute

---
*Research completed: 2026-03-03*
*Ready for roadmap: yes*
