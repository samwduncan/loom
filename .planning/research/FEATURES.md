# Feature Landscape: M6 v1.5 "The Craft"

**Domain:** Production polish, visual personality, and micro-interaction quality for a premium dark-theme AI workspace
**Researched:** 2026-03-18
**Confidence:** HIGH (existing codebase audited, competitive analysis from 6 products, prior visual effects research from M3 deferred context)

**Scope:** Polish and visual personality ONLY. All functional features (chat, streaming, file tree, editor, terminal, git, settings, command palette, accessibility, performance) are shipped. This milestone is about making every pixel intentional and every interaction satisfying.

**Existing Foundation:**
- 3 CSS-only effects adopted: SpotlightCard, ShinyText, ElectricBorder
- Glass tokens defined: `--glass-blur`, `--glass-saturate`, `--glass-bg-opacity`
- Motion tokens defined: SPRING_GENTLE/SNAPPY/BOUNCY in motion.ts, CSS easing tokens in tokens.css
- 3-tier error boundaries: App, Panel, Message (with ErrorFallback UI)
- 4 skeleton components: MessageListSkeleton, SessionListSkeleton, SettingsTabSkeleton, GitPanelSkeleton
- 1 empty state: ChatEmptyState (wordmark + suggestion chips)
- Aurora FX tokens defined: `--fx-aurora-blur`, gradient color tokens
- `prefers-reduced-motion` handled globally (0.01ms override)
- Constitution bans: hardcoded colors, inline styles, typewriter effects, full motion bundle

---

## Table Stakes

Features users expect from software that feels professionally built. Missing any of these = the app feels like a prototype, not a product.

### Loading States

| Feature | Why Expected | Complexity | Dependencies | Current State |
|---------|--------------|------------|--------------|---------------|
| Skeleton screens for ALL data-loading surfaces | Every premium app (Claude.ai, ChatGPT, LobeChat) shows content-shaped placeholders during fetch. Blank areas feel broken. | Low | Existing skeleton-shimmer CSS class | 4 of ~8 surfaces covered. Missing: FileTree loading, Editor loading (exists but minimal), Terminal reconnecting, Command Palette initial. |
| Shimmer animation upgrade | Current skeletons use `animate-pulse` (Tailwind default). Premium apps use directional shimmer sweep (gradient slide). ChatGPT uses `linear-gradient(90deg)` sweep; LobeChat uses 1.5s sweep. | Low | CSS keyframe in sidebar.css already exists as `skeleton-shimmer` | `skeleton-shimmer` class exists but most skeletons use `animate-pulse` instead. Inconsistent. |
| Progressive content reveal | Session list, file tree, and git history should fade-in rows progressively rather than pop in all at once. Perplexity's staggered card reveal (100ms stagger) is the benchmark. | Medium | CSS `animation-delay` or `@starting-style` | Not implemented anywhere. |
| Loading indicator for async operations | Commit, push, pull, branch create, file save -- all network operations need visual feedback. "Settings saved" toast exists but git ops lack spinners. | Low | Sonner toast (installed), button loading states | Git operations show toast on complete but no in-progress indicator on the button itself. |
| Tab content loading during lazy import | Terminal and Git panels use `lazy()` + `Suspense`. The fallback for Terminal is text-only ("Loading terminal..."). Git has `GitPanelSkeleton`. Terminal needs a real skeleton. | Low | React Suspense boundary | TerminalSkeleton is a text string, not a skeleton component. |

### Error States

| Feature | Why Expected | Complexity | Dependencies | Current State |
|---------|--------------|------------|--------------|---------------|
| Inline retry for failed API calls | Network errors on git status, file tree fetch, settings load must show retry affordance at the point of failure, not just a toast. | Medium | Existing PanelErrorBoundary pattern | Error boundaries catch render errors. API fetch errors handled inconsistently -- some toast, some swallow, some show in-panel. |
| Graceful degradation for partial failures | If git status fails, the git panel should still show commit history tab. If file tree fails, editor should still work with open files. | Medium | Per-section error isolation | Currently panel-level error boundaries. A git status failure crashes the entire git panel. |
| Error toast with retry action | Toast notifications for async operation failures should include a "Retry" button. Current toasts are informational only. | Low | Sonner toast supports action buttons | Not using Sonner's action API. |
| Timeout indicators | WebSocket reconnection, long API calls (>5s) should show elapsed time or progress. "Still connecting..." after 5s, "This is taking longer than usual..." after 15s. | Medium | Connection store, timer logic | Connection banner exists but only shows "Reconnecting..." with no elapsed time context. |
| Network offline detection | Browser going offline should show a persistent banner. Not just WebSocket disconnect -- full offline mode indicator. | Low | `navigator.onLine` + `online`/`offline` events | Not implemented. |

### Empty States

| Feature | Why Expected | Complexity | Dependencies | Current State |
|---------|--------------|------------|--------------|---------------|
| File tree empty state | "No project open" or "Connect to a project" when file tree has no root. Every IDE handles this. | Low | File store state | FileTree shows nothing when empty. |
| Git panel empty state | "Not a git repository" when no git root detected. "No changes" when working tree is clean. | Low | Git status API | ChangesView has basic "No changes" text. HistoryView shows nothing when empty. |
| Session list empty state | "No conversations yet" with a "Start a new chat" CTA. First-run experience matters. | Low | Timeline store | SessionList renders empty space when no sessions. |
| Search results empty state | "No results found" with suggestion to refine query. For both session search and command palette. | Low | Existing search components | Command palette shows empty list. Session search shows nothing. |
| Editor empty state | "Select a file to edit" placeholder when no file is open. VS Code shows this. | Low | File store activeFilePath | PanelPlaceholder component exists but is generic. |

### State Consistency

| Feature | Why Expected | Complexity | Dependencies | Current State |
|---------|--------------|------------|--------------|---------------|
| Hover/focus/active/disabled states on ALL interactive elements | Material Design, NN/g, and every design system mandate consistent interactive feedback. Missing hover states make elements feel dead. | Medium | Audit of ~51 files with interactive states | ~97 occurrences across 51 files. Coverage is uneven -- shadcn primitives have full states, custom components vary. |
| Focus-visible ring consistency | Focus rings should use the same accent color, width, and offset across all focusable elements. Currently varies between components. | Low | CSS `focus-visible` rule in base.css | Some components use custom focus styles, others rely on browser defaults. |
| Disabled state opacity consistency | All disabled elements should use the same opacity (0.5) and cursor (not-allowed). Some custom buttons don't apply disabled styling. | Low | CSS `:disabled` and `aria-disabled` | Inconsistent. shadcn uses `disabled:opacity-50`, custom components vary. |
| Button press feedback | Active/pressed state should scale slightly (0.98) or darken. Confirms the click was registered. 150-300ms transition. | Low | CSS `:active` pseudo-class | Minimal active state styling across custom buttons. |

---

## Differentiators

Features that elevate beyond "good enough" to "this feels like a real product." Not expected, but deeply valued.

### Spring Physics Animations

| Feature | Value Proposition | Complexity | Dependencies | Notes |
|---------|-------------------|------------|--------------|-------|
| Sidebar open/close with spring | Physical feel instead of linear CSS slide. LobeChat's sidebar and ChatGPT's sidebar both use physics-based curves. SPRING_GENTLE (stiffness:120, damping:14) is already defined. | Medium | LazyMotion + `m.div` from motion/react (~4.6KB base + 15KB domAnimation). OR pure CSS spring easing (`cubic-bezier(0.34, 1.56, 0.64, 1)`). | CSS spring easing is already in tokens. Start with CSS, upgrade to motion/react only if CSS can't handle exit animations. |
| Modal/dialog entrance with spring | Settings modal and command palette sliding up with overshoot. Claude.ai uses `cubic-bezier(0.16, 1, 0.3, 1)` (easeOutExpo). ChatGPT uses bounce on sidebar. | Low | CSS spring easing token already defined | Settings dialog currently uses shadcn default animation. Override with Loom spring. |
| Panel tab switch spring | Content sliding in from the direction of the selected tab. Left tab = slide from left. Right = slide from right. Provides spatial context. | Medium | CSS or motion/react AnimatePresence for exit | Mount-once CSS show/hide pattern may conflict. Need CSS-only approach (opacity + transform on show/hide). |
| Tool card expand/collapse spring | Tool cards growing with a slight overshoot feels tactile and premium. Already using CSS Grid 0fr/1fr -- add spring easing to the `grid-template-rows` transition. | Low | Existing CSS Grid transition | Currently uses `--duration-normal` (200ms) with standard easing. Swap to spring easing and `--duration-spring` (500ms). |
| Scroll-to-bottom pill spring | The floating "scroll to bottom" pill should pop in with SPRING_BOUNCY and exit with a quick fade. Currently uses CSS slide with standard timing. | Low | scroll-pill.css already has transition | Upgrade easing curve. |

### Glass / Frosted Surfaces

| Feature | Value Proposition | Complexity | Dependencies | Notes |
|---------|-------------------|------------|--------------|-------|
| Command palette glass overlay | `backdrop-filter: blur(16px) saturate(1.4)` on the command palette background. Glass tokens already defined. Apple and LobeChat both use this. 64% of premium SaaS apps now use glassmorphism. | Low | Glass tokens in tokens.css, command-palette.css already has `backdrop-filter: blur(8px)` | Upgrade from 8px to 16px blur and add `saturate(1.4)`. Nearly trivial. |
| Settings modal glass | Same glass treatment on the settings modal backdrop. Creates depth hierarchy without heavy shadows. | Low | Glass tokens + shadcn Dialog overlay | Override Dialog overlay with glass tokens. |
| Tooltip glass | Tooltips with slight blur behind them feel premium. Subtle effect, high polish signal. | Low | Glass tokens + shadcn Tooltip component | Add `backdrop-filter` to tooltip styles. |

### Text Reveal Effects

| Feature | Value Proposition | Complexity | Dependencies | Notes |
|---------|-------------------|------------|--------------|-------|
| DecryptedText for session titles | New sessions appear in the sidebar with characters scrambling into the auto-generated title. Distinctive visual signature. Motion's ScrambleText is 1KB and avoids React re-renders. | Medium | Source-copy from React Bits OR use motion/react ScrambleText (1KB) | Must only trigger on first appearance, not every re-render. Needs intersection observer or "isNew" flag. |
| DecryptedText for model name in status | Model name in the status line decrypting on session switch. Subtle but memorable. | Low | Same component as above | Reuse the same DecryptedText component. |
| BlurText fade-in for empty state | The "Loom" wordmark and subtitle in ChatEmptyState fading in with per-word blur. Aceternity's "Text Generate" pattern. Better than static text. | Low | CSS `@starting-style` or simple JS stagger | The empty state is shown infrequently, so a richer entrance is worth the impact. |

### Animated Border Effects

| Feature | Value Proposition | Complexity | Dependencies | Notes |
|---------|-------------------|------------|--------------|-------|
| StarBorder on active sidebar session | The currently-selected session in the sidebar gets a subtle animated border glow. Differentiates from hover. CSS-only from React Bits. | Low | Source-copy StarBorder (CSS-only, already planned) | Already planned in visual effects audit. No dependencies. |
| StarBorder on focused composer | The chat input getting an animated border when focused. Signals "this is where you type." More expressive than a static border color change. | Low | Same StarBorder component | Wrap ChatComposer focus state. |
| ElectricBorder enhancement during streaming | ElectricBorder is already adopted on the composer during streaming. Ensure it's smooth, consistent, and uses the right speed. | Low | ElectricBorder (already in codebase) | Review and tune existing implementation. |

### Sidebar Slim Mode

| Feature | Value Proposition | Complexity | Dependencies | Notes |
|---------|-------------------|------------|--------------|-------|
| Icon-only rail collapse | Sidebar collapses to ~58px icon rail (matches LobeChat pattern). Shows chat icon, file icon, git icon, settings icon. Tooltips on hover. | High | UI store `sidebarCollapsed` state, CSS transition, icon mapping | Major layout change. Needs careful coordination with mount-once panel pattern. The sidebar currently hosts session list, project groups, search, bulk actions -- all need to gracefully hide. |

### Spacing & Typography Audit

| Feature | Value Proposition | Complexity | Dependencies | Notes |
|---------|-------------------|------------|--------------|-------|
| Global spacing consistency pass | Audit every component for consistent use of spacing tokens (4px grid). Fix any hardcoded margins, inconsistent padding. | Medium | Design token system | This is grunt work but high-impact. Inconsistent spacing is the #1 signal of "student project." |
| Typography hierarchy verification | Verify consistent font sizes, weights, and line-heights across all surfaces. Headings, body, labels, captions should follow a clear scale. | Medium | Font tokens in tokens.css | Currently using Tailwind text utilities directly. May need a stricter type scale. |
| Border-radius consistency | Every rounded corner should use the same scale: sm (4px), md (8px), lg (12px). No magic numbers. | Low | tokens.css border-radius tokens | Mostly consistent but needs audit. |

---

## Anti-Features

Features to explicitly NOT build for this milestone. Either too expensive, wrong direction, or counterproductive.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Full Framer Motion bundle | Constitution bans full motion bundle (~34KB). LazyMotion with domAnimation is the ceiling at 15KB. CSS spring easing handles 80% of use cases for free. | Start with CSS `cubic-bezier(0.34, 1.56, 0.64, 1)`. Only add LazyMotion if CSS can't handle exit animations or shared layout. |
| WebGL background effects (Aurora, Grainient) | ogl dependency (~30KB), GPU concerns on integrated Radeon 780M, and these are visual spectacle -- not production polish. Polish is about details that make things feel right, not effects that make things look flashy. Defer to v2.1 "The Polish". | Focus on micro-interactions and state consistency. Ship the spring physics, glass surfaces, and text reveals. Aurora/Grainient are spectacle for later. |
| Character-by-character typewriter | Constitution explicitly bans this. Batch rendering via rAF buffer is the established pattern. Typewriter creates janky scroll behavior and is a performance anti-pattern at 100+ tokens/sec. | Keep the existing rAF buffer two-phase renderer. DecryptedText on titles is different -- it's a one-time reveal on a short string, not streaming content. |
| 3D card tilts / parallax | Too playful for a dev tool. Loom is "surgical laser + old library", not a creative portfolio. LobeChat gets away with it because of its consumer-app positioning. | SpotlightCard's cursor-following gradient is the right level of interactivity. |
| Cursor followers / trails | Distracting during code work. The mouse is a precision tool in a workspace app. | Nothing. The cursor should be invisible infrastructure. |
| Animated message entrance (AnimatedList) | Conflicts with scroll-to-bottom behavior, auto-scroll during streaming, and content-visibility optimization. Every competitive product streams content in without entrance animations -- the streaming itself IS the animation. | Messages appear via streaming (active) or instant (historical). No entrance animation needed. |
| Confetti / sparkles / particles | Too playful. Loom's aesthetic is understated precision, not celebration. | Success feedback through toast messages and icon state changes (checkmark transitions). |
| Light mode | Out of scope. Dark-only is a deliberate brand decision. Potential future milestone stretch goal. | Ensure dark theme is flawless. Every surface, every scrollbar, every focus ring. |
| LiquidChrome / Iridescence WebGL | Same reasoning as Aurora -- spectacle, not polish. High risk of looking tacky if not perfectly tuned. | Defer to v2.1. |
| Sidebar drag-to-resize | Adds significant complexity (drag handler, persist width, min/max constraints) for minimal UX value. Slim mode collapse is the better investment. | Binary collapse/expand with spring animation. Not continuous resize. |

---

## Feature Dependencies

```
Shimmer upgrade ──────────────────────► ALL skeleton components (prerequisite)
                                         │
Glass tokens ─────────────────────────► Command palette glass ──► Settings modal glass ──► Tooltip glass
  (already defined)                      │
                                         │
Spring easing tokens ─────────────────► Tool card springs
  (already defined)                    ► Sidebar springs
                                       ► Modal springs
                                       ► Scroll pill springs
                                         │
Interactive state audit ──────────────► Hover/focus/active/disabled consistency
                                         │
                                         ├──► Button press feedback
                                         └──► Focus ring consistency
                                         │
DecryptedText component ──────────────► Session title reveals ──► Model name reveals
                                         │
StarBorder component ─────────────────► Active session indicator ──► Focused composer
  (planned, not yet adopted)             │
                                         │
Empty state components ───────────────► File tree empty ──► Git panel empty ──► Session list empty
  (need design language)               ► Search empty ──► Editor empty
                                         │
Loading state audit ──────────────────► Terminal skeleton ──► FileTree skeleton
                                       ► Consistent shimmer class usage
                                         │
Spacing/typography audit ─────────────► Global consistency pass (no external deps)
                                         │
Sidebar slim mode ────────────────────► Icon rail layout ──► Tooltip labels ──► Persist preference
  (most complex, standalone)             Depends on: spring animations for collapse transition
```

### Critical Path

1. **Shimmer & skeleton consistency** (unblocks visual baseline)
2. **Interactive state audit** (unblocks hover/focus/disabled consistency)
3. **Spring easing adoption** (unblocks all animated transitions)
4. **Glass surface upgrade** (unblocks premium overlay feel)
5. **Empty state components** (unblocks first-run experience)
6. **DecryptedText + StarBorder adoption** (visual personality)
7. **Spacing/typography audit** (final polish pass)
8. **Sidebar slim mode** (largest standalone feature, can parallel others)

---

## MVP Recommendation

Prioritize in this order for maximum perceived quality improvement:

### Must-Have (Phases 1-3)

1. **Settings refactor landing** -- Generic useFetch hook, connection store persist fix, ModalState type safety. Already in-progress work that must land first.
2. **Shimmer consistency + missing skeletons** -- Upgrade all skeletons to use `skeleton-shimmer` (directional sweep), add TerminalSkeleton and FileTreeSkeleton. Low effort, high visual cohesion.
3. **Interactive state audit** -- Systematic pass through all custom components for hover/focus/active/disabled consistency. Add `:not(:disabled):hover`, `:not(:disabled):active`, consistent `focus-visible` ring. The single highest-impact polish item.
4. **Empty states for all surfaces** -- Design a consistent empty state pattern (icon + heading + subtext + optional CTA) and apply to file tree, git panel, session list, search results, editor placeholder.
5. **Spring easing on key transitions** -- Swap standard easing for spring cubic-bezier on: tool card expand/collapse, sidebar open/close, modal entrance, scroll-to-bottom pill. CSS-only, zero new dependencies.

### Should-Have (Phases 4-5)

6. **Glass surface upgrade** -- Upgrade command palette from blur(8px) to blur(16px)+saturate(1.4). Apply to settings modal overlay. Apply to tooltips.
7. **Error state hardening** -- Add inline retry to failed API sections (git status, file tree, settings tabs). Add Sonner action buttons for retry. Add timeout escalation messages.
8. **DecryptedText reveals** -- Source-copy from React Bits or adopt motion/react ScrambleText. Apply to session titles on first appearance and model name on session switch.
9. **StarBorder adoption** -- Source-copy from React Bits. Apply to active sidebar session and focused composer.
10. **Spacing and typography audit** -- Systematic pass for 4px grid compliance, type scale consistency, border-radius consistency.

### Defer to v2.1 (Phase 6+)

11. **Sidebar slim mode** -- Complex layout change. Better as a standalone feature with proper research into responsive breakpoints and the mount-once panel interaction.
12. **Aurora/Grainient WebGL backgrounds** -- Spectacle effects. Need GPU testing, perf gating, reduced-motion handling. Wrong milestone.
13. **BlurText empty state entrance** -- Nice-to-have. Only seen on infrequent empty state.
14. **Progressive content reveal (staggered rows)** -- Medium complexity, potential scroll interaction issues. Research needed on interaction with content-visibility.

---

## Competitive Context

What the top products do that Loom currently doesn't:

| Pattern | Claude.ai | ChatGPT | LobeChat | Loom Current | Loom Target |
|---------|-----------|---------|----------|--------------|-------------|
| Loading skeletons | Custom shimmer | Subtle pulse | Shiny text sweep | Mix of pulse/shimmer | Consistent directional shimmer |
| Empty state | Suggestions grid | Personalized greeting + cards | Agent marketplace | Wordmark + 4 chips | Wordmark + chips + subtle blur-in |
| Spring animations | `cubic-bezier(0.16, 1, 0.3, 1)` on thinking | Bounce on sidebar, 500ms pulse | Full Framer Motion | Tokens defined, not applied | CSS spring on 5+ surfaces |
| Glass effects | None visible | Glassmorphic tool pills | `blur(36px)` strong glass | 8px blur on command palette | 16px + saturate on 3 surfaces |
| Text reveals | Staggered fade-in | Word fade 200-250ms | Shiny text shimmer | ShinyText on thinking label | DecryptedText on titles |
| Active indicators | Simple highlight | Subtle bg tint | Animated glow + scale | Background tint | StarBorder animated glow |
| Hover consistency | Full coverage | Full coverage | Full coverage with hover-reveal timestamps | ~70% coverage | 100% coverage |
| Button press feedback | Scale + color | Scale overshoot (~800ms) | CVA variants | Minimal | Scale(0.98) + darken |
| Error retry | Inline retry | Inline retry + regenerate | Plugin error with debug mode | 3-tier error boundaries | Inline retry at API level |

---

## Complexity Estimates

| Feature Group | Items | Total Effort | Risk |
|---------------|-------|-------------|------|
| Skeleton/shimmer consistency | 5 items | 1-2 days | Low -- CSS changes, no architecture |
| Interactive state audit | 4 items | 2-3 days | Low -- systematic CSS pass |
| Empty states | 5 items | 1-2 days | Low -- new components, simple |
| Spring easing adoption | 5 items | 1 day | Low -- CSS token swap |
| Glass surface upgrade | 3 items | 0.5 day | Low -- token adjustment |
| Error state hardening | 4 items | 2-3 days | Medium -- API error handling patterns |
| DecryptedText + StarBorder | 4 items | 1-2 days | Low -- source-copy, integrate |
| Spacing/typography audit | 3 items | 2-3 days | Low -- grunt work |
| Sidebar slim mode | 1 item | 3-5 days | High -- layout architecture impact |
| **Total (without sidebar slim)** | **33 items** | **~11-17 days** | |
| **Total (with sidebar slim)** | **34 items** | **~14-22 days** | |

---

## Sources

### Primary (HIGH confidence)
- Codebase audit of `/home/swd/loom/src/src/components/` -- 51 files with interactive states, 4 existing skeletons, 3 adopted effects
- `.planning/reference-app-analysis.md` -- Competitive analysis of Claude.ai, ChatGPT, Perplexity, Open WebUI, LobeChat, LibreChat
- `.planning/chat-interface-standards.md` -- 106 requirements across 16 categories
- `.planning/COMPONENT_ADOPTION_MAP.md` -- Planned component adoptions
- `.planning/visual-effects-audit.md` -- React Bits, shadcn, Magic UI evaluation
- `.planning/M3-POLISH-DEFERRED-CONTEXT.md` -- Deferred polish context from M3 planning
- `.planning/PROJECT_SOUL.md` -- North star: "surgical laser + old library"

### Secondary (MEDIUM confidence)
- [Motion.dev LazyMotion docs](https://motion.dev/docs/react-lazy-motion) -- 4.6KB base, domAnimation +15KB
- [Motion.dev ScrambleText](https://motion.dev/docs/react-scramble-text) -- 1KB scramble component
- [React Bits DecryptedText](https://www.reactbits.dev/text-animations/decrypted-text) -- Source-copy text animation
- [Glassmorphism implementation guide](https://playground.halfaccessible.com/blog/glassmorphism-design-trend-implementation-guide) -- 3-5 glass elements negligible perf
- [NN/g Button States](https://www.nngroup.com/articles/button-states-communicate-interaction/) -- Hover/focus/active/disabled UX research
- [Empty State UX patterns](https://www.pencilandpaper.io/articles/empty-states) -- Design patterns for empty states
- [Framer Motion vs React Spring 2025](https://hookedonui.com/animating-react-uis-in-2025-framer-motion-12-vs-react-spring-10/) -- Animation library comparison

### Tertiary (LOW confidence -- verify before adopting)
- [Dark Glassmorphism 2026 trend](https://medium.com/@developer_89726/dark-glassmorphism-the-aesthetic-that-will-define-ui-in-2026-93aa4153088f) -- 64% SaaS adoption claim (single source)
- [BadtzUI Border Beam](https://www.badtz-ui.com/docs/components/border-beam) -- Alternative to StarBorder
