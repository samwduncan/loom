# Project Research Summary

**Project:** Loom V2 — Premium AI Coding Agent Interface (Greenfield Frontend Rewrite)
**Domain:** Streaming React SPA consuming Node.js/WebSocket backend — multi-provider AI coding agent interface
**Researched:** 2026-03-04
**Confidence:** HIGH

## Executive Summary

Loom V2 is a greenfield rewrite of a premium AI coding agent interface that connects to a preserved Node.js/Express/WebSocket backend (CloudCLI). The core engineering challenge is building a React 18 frontend that handles 100 tokens/second streaming without frame drops, while delivering a visual experience that makes AI agent work beautiful and transparent. Research across six reference products (Claude.ai, ChatGPT, Perplexity, Open WebUI, LobeChat, LibreChat) plus the V1 post-mortem confirms that premium quality in this domain comes from invisible engineering: the app must feel effortless precisely because the streaming infrastructure is deeply engineered beneath the surface.

The recommended approach centers on three architectural pillars proven by V1 failure modes: a 4-store Zustand topology with selector-only subscriptions to prevent streaming re-render cascades; a useRef + requestAnimationFrame bypass for token accumulation that completely skips React's reconciler during streaming; and a strictly enforced design token system with ESLint guards from day one to prevent the hardcoded-color proliferation that consumed an entire V1 cleanup phase. The six-phase build order (App Shell → WebSocket Bridge → Streaming Engine → Message Rendering → Composer/Input → Navigation) is derived from strict dependency analysis and must not be violated — each phase produces prerequisites for all subsequent ones.

The key risk is foundation rot: V1 failed because each phase introduced small violations (hardcoded colors, whole-store Zustand subscriptions, inline provider branching) that accumulated until a dedicated cleanup phase was required at Phase 11, and the accumulated debt forced the current V2 rewrite. V2 must enforce all architectural conventions from commit #1 via automated ESLint rules, never relying on human review alone. The V2 Constitution's enforceable conventions are the primary mitigation — every gate report must verify Constitution compliance as a BLOCKER, not a warning.

## Key Findings

### Recommended Stack

The V2 stack is largely a continuation and consolidation of the V1 stack, with targeted additions driven by the streaming performance requirements. React 18 + Vite 7 + TypeScript 5.9 carry over unchanged; their Concurrent Mode features (`useTransition`, `useDeferredValue`) are essential, not optional. Tailwind CSS v3.4 (not v4) is locked because the `hsl(var(--token) / <alpha-value>)` runtime theming pattern breaks in v4's compile-time `@theme`. The two key additions are Zustand ^5.0.11 for state management (replacing React Context which re-renders all consumers at 100 tokens/sec) and Vitest ^4.0.18 for testing (native Vite integration, zero config).

See `.planning/research/STACK.md` for complete version-locked dependency list and installation commands per phase.

**Core technologies:**
- **React 18 + Vite 7**: UI runtime and build — Concurrent Mode is mandatory for streaming performance; `useDeferredValue` prevents markdown parser from blocking input
- **TypeScript 5.9 (strict)**: Discriminated union WebSocket message schema is the primary type-safety payload; `noUncheckedIndexedAccess` enforced
- **Zustand ^5.0.11**: 4-store topology (timeline, stream, ui, connection) with selector-only subscriptions — prevents full-tree re-renders during streaming
- **Tailwind CSS ^3.4.17 + CSS custom properties**: Runtime OKLCH token system; v3.4 locked (not v4) for opacity modifier compatibility
- **motion ^12.35.0 (LazyMotion subset only)**: ~5KB for spring physics on tool call state machines and AnimatePresence; full 34KB bundle is banned
- **Shiki ^4.0.1**: Lazy grammar loading per-language; never bundled upfront; deferred to post-stream (raw monospace during streaming)
- **Vitest ^4.0.18 + @testing-library/react ^16.3.2**: Native Vite integration; per-phase test focus defined in STACK.md
- **react-markdown ^10.1.0 + remark-gfm + rehype-raw**: Streaming-safe markdown with debounced parsing (not per-token); `useDeferredValue` on parsed AST

### Expected Features

The feature landscape is well-defined, cross-verified across 6 reference products plus a 106-requirement standards document. The key strategic distinction: Loom is purpose-built for AI coding agent work, not a general-purpose chat UI. Every feature decision filters through "does this make agent work more visible, beautiful, and controllable?"

See `.planning/research/FEATURES.md` for complete competitive pattern matrix, anti-features list, and 8-phase feature roadmap.

**Must have (table stakes) — core chat experience:**
- Smooth streaming text (batch rendering, never character-by-character typewriter)
- Send/Stop button morphing with instant response and square stop icon
- Syntax-highlighted code blocks (Shiki, lazy) with hover-reveal copy button
- Collapsible thinking/reasoning blocks (auto-collapsed when output begins, pulsing border while active)
- Sticky auto-scroll with manual override and "jump to bottom" pill
- Session management (create, switch, rename, delete, sidebar with time-grouped history)
- 3-tier error boundaries (app / panel / message level)
- Dark mode as first-class citizen (no flash of light theme on load)
- OKLCH color token system (perceptually uniform; not HSL)

**Should have (differentiators) — Loom-original:**
- Semantic streaming states: ActivityStatusLine above input showing "Reading auth.ts...", "Writing server.ts..."
- Tool call state machine animations: pending → running (pulsing rose indicator) → success (collapsed chip) → error (expanded muted red)
- Execution chain grouping: 3+ sequential tool calls collapse into accordion with count badge
- Aurora ambient overlay during generation: Loom-original CSS-only shimmer, GPU-layer-capped
- Tabbed multi-provider workspaces (Claude | Gemini | Codex) with independent session contexts
- MCP server management UI with connection status indicators
- GSD visual dashboard for phase pipeline and agent assignment
- Animated pixel-art companion system (8 species, 14 animation states)

**Defer (post-V2 core):**
- Cross-tab context sharing (validate tabbing works first)
- Full phase handoff automation in GSD dashboard
- Nextcloud file browser (file attachment works first)
- Companion system if feasibility gate fails (Lottie fallback)
- Light mode (single dark brand identity; OLED variant instead)
- Conversation branching / tree view
- Full IDE replacement (Monaco)

**Anti-features (explicitly rejected):**
- Character-by-character typewriter rendering
- Right-side artifact panel (inline in chat stream instead)
- Custom Mermaid/LaTeX rendering (code blocks suffice)
- Per-tab WebSocket connections (single shared connection required by backend session model)
- Glassmorphism on scrolling content (overlays only)
- Heavy drop shadows on messages (OKLCH tonal elevation instead)

### Architecture Approach

Loom V2 uses the Headless Backend Hybrid pattern: CloudCLI is preserved entirely, and the React frontend is a pure rendering and interaction layer that owns zero business logic. The structural pattern is a multi-zone CSS Grid shell (sidebar | content | artifact) controlled by CSS custom property variables, with tab isolation achieved via React key-based unmount/remount (zero shared component state between tabs). The streaming hot path is isolated into a single `ActiveMessage` component that bypasses React's reconciler entirely via useRef + direct DOM text mutation; all past `TurnBlock` components are frozen behind `React.memo` with custom comparators and receive zero re-renders during streaming. A 6-phase dependency chain (App Shell → WebSocket Bridge → Streaming Engine → Message Rendering → Composer/Input → Navigation) must be followed strictly — each phase unblocks the next.

See `.planning/research/ARCHITECTURE.md` for complete component boundary table, data flow diagrams, and all 7 named patterns with code examples.

**Major components (three-layer model):**
1. **Shell Layer** (AppShell, WorkspaceLayout, SidebarShell, ContentZone) — CSS Grid structure, no data fetching, no store subscriptions
2. **Feature Panel Layer** (ChatWorkspace, SidebarNav, OmniBar, SettingsModal, MCPManager, GSDDashboard) — feature state ownership, independently error-bounded
3. **Leaf Layer** (TurnBlock, ActiveMessage, ToolActionCard, ThinkingDisclosure, ChatComposer, CodeBlock, ActivityStatusLine) — pure render via props; `ActiveMessage` is the sole exception, directly subscribing to stream store for performance

**Key patterns:**
- Active Message Isolation: streaming response in separate `ActiveMessage` component, completely isolated from the `TurnBlock` list
- Tool Call State Machine: `invoked → awaiting → resolving → resolved / rejected` discriminated union rendered differently per phase
- CSS Grid Shell with CSS variable width control: sidebar collapse via CSS var mutation, no React re-renders
- Content-visibility before react-virtual: browser handles off-screen rendering cost; pivot to `@tanstack/react-virtual` only at 2000+ messages
- Single WebSocket shared across all tabs: tabs distinguished by sessionId, not by connection instance

### Critical Pitfalls

Ten critical pitfalls are identified with V1 post-mortem evidence. The top five demand the highest attention during planning and gate verification.

See `.planning/research/PITFALLS.md` for complete mitigation strategies, warning signs, phase-specific warnings, and integration gotchas.

1. **Dual Color System Proliferation** — V1 accumulated 144+ hardcoded hex references across 15 files requiring a dedicated Phase 11 cleanup. Prevention: ESLint `no-restricted-syntax` banning `bg-[#`, `text-[#`, `border-[#` patterns as build-time errors from Phase 1, day 1. Zero tolerance from commit #1.

2. **setState for Streaming Tokens** — At 100 tokens/sec, React's reconciler is fatally overloaded. Prevention: `tokenRef.current += token` + direct DOM text mutation via `textContent` in the rAF loop; flush to Zustand only on stream completion. Verify with React DevTools Profiler: zero re-renders on past messages during streaming.

3. **Whole-Store Zustand Subscriptions** — `const store = useXxxStore()` without a selector subscribes to every store change, causing 100 re-renders/sec across all consumers. Prevention: ESLint rule banning no-selector subscriptions; only `useStreamStore(state => state.specificField)` or `useShallow` multi-field patterns are legal.

4. **Animation Jank During Streaming / GPU Layer Explosion** — V1 confirmed this on AMD Radeon 780M iGPU: aurora gradient elements exceeding 8-10 GPU layers trigger CPU fallback; `transition: all` fires layout-triggering transitions during streaming. Prevention: always specify exact transition properties; `.is-streaming` class disables non-critical animations; cap aurora elements at 2-3.

5. **AI-Assisted Constitution Erosion** — V1's primary documented failure mode: each Claude Code session has partial Constitution context; violations accumulate phase by phase until a greenfield rewrite is required. Prevention: all ESLint rules wired in Phase 1 before any feature work; Constitution compliance is a BLOCKER in every gate report; "banned patterns quick reference" loaded with every session context.

**Additional critical pitfalls (summarized):**
- **Orphaned Components**: V1 confirmed — `ToolCallGroup.tsx` fully implemented but never imported; wiring verification is a mandatory gate check for every file created
- **Multi-Provider WebSocket Message Type Explosion**: V1's handler grew to 1050 lines; normalize to discriminated union at WebSocket layer before stores see data
- **Z-Index Wars**: V1 ended with values ranging z-10 to z-[9999]; z-index dictionary in CSS tokens + ESLint enforcement + portal requirement for all overlays from Phase 1
- **Session State Race Conditions**: stream store must clear completely before any session switch; provider identity stored on session objects, not derived from ambient state
- **Scroll Behavior Regression from Animations**: entry animations must use only `opacity` and `transform: translateY`; IntersectionObserver sentinel debounced by 150ms

## Implications for Roadmap

The dependency chain from ARCHITECTURE.md is strict and cross-validated by FEATURES.md's "Dependency Critical Path" and PITFALLS.md's phase-specific warnings. The roadmap must follow this order exactly — phases cannot be parallelized without breaking prerequisites.

### Phase 1: App Shell + Design System Foundation

**Rationale:** Every subsequent phase depends on the CSS token system and ESLint enforcement infrastructure. Constitution violations accumulate from the first commit if guards are not in place. This phase has no visible user value but is the prerequisite for everything that follows.
**Delivers:** AppShell (CSS Grid skeleton, 100dvh, overflow hidden), OKLCH CSS custom property token map, z-index dictionary (--z-base through --z-toast), typography system (Inter + Instrument Serif + JetBrains Mono), 3-tier Error Boundary hierarchy (app/panel/message), Zustand 4-store skeletons with selector-only pattern wired, Vitest + ESLint configured with all Constitution rules, LazyMotion provider setup.
**Addresses:** OKLCH design token system, surface elevation hierarchy, typography, spring physics tokens, ESLint custom rules enforcement, 3-tier error boundaries
**Avoids:** Pitfall 1 (dual color system), Pitfall 3 (whole-store subscriptions), Pitfall 7 (Constitution erosion), Pitfall 9 (z-index wars) — all must be locked in before any component work begins
**Research flag:** SKIP — well-documented patterns (Tailwind tokens, Zustand setup, Vitest config). One pre-execution check: verify OKLCH values in CSS `:root` custom properties work correctly with Tailwind v3.4's `hsl(var(--token) / <alpha-value>)` opacity modifier syntax. Quick empirical test sufficient.

### Phase 2: WebSocket Bridge + State Contract

**Rationale:** All chat features depend on real streaming data. The discriminated union WebSocket message schema and 4-store state contract must be finalized before any UI component touches live data. The InputStub (hardcoded prompt sender) enables downstream phase testing without a complete UI.
**Delivers:** WebSocketProvider, typed `WSMessage` discriminated union, provider-specific normalizers (`parseClaudeMessage.ts`, `parseCodexMessage.ts`, `parseGeminiMessage.ts`), 4 Zustand stores fully populated with actions, useRef token buffer with rAF loop, REST API client layer, InputStub component for testing.
**Uses:** Zustand ^5.0.11, native WebSocket (no library), TypeScript discriminated unions with exhaustive switch
**Implements:** Connection store, stream store (semantic state only — token text never in Zustand), token buffer bypass pattern
**Avoids:** Pitfall 2 (setState for tokens), Pitfall 3 (whole-store subscriptions), Pitfall 8 (provider-specific branching in stores), Pitfall 10 (session race conditions — session guard designed in from the start)
**Research flag:** NEEDS RESEARCH — exact WebSocket message shapes from CloudCLI backend for all three providers (Claude protocol: content_block_start/delta/stop; Codex: item-based; Gemini: separate tool events). FEATURES.md marks this HIGH priority. Without this, the discriminated union is speculative.

### Phase 3: Streaming Engine + Scroll Physics

**Rationale:** The scroll anchor system and rAF token buffer are the performance foundation for the entire chat experience. Implementing these correctly before building message rendering prevents the V1 failure mode of retrofitting scroll physics after animations are already added.
**Delivers:** ChatViewport (scroll container), ActiveMessage (ref-based DOM mutation, isolated hot path), useScrollAnchor (IntersectionObserver sentinel pattern), ScrollToBottomPill, rAF token buffer with 50ms render throttle, content-visibility:auto on past messages with contain-intrinsic-size.
**Implements:** Active Message Isolation pattern, Content-visibility pattern
**Avoids:** Pitfall 4 (animation jank during streaming — streaming performance baseline established before any animation is added), Pitfall 5 (scroll behavior regression — build scroll correctly before adding any CSS transitions)
**Gate:** 2000-token stream, scroll locks to bottom, 1px scroll up detaches auto-scroll, no jank visible, FPS stays above 55 under streaming load
**Research flag:** SKIP — scroll physics patterns confirmed by V1 research and PITFALLS.md; IntersectionObserver sentinel approach documented in V1 Phase 7 RESEARCH.md.

### Phase 4: Message Rendering + Tool Cards

**Rationale:** With scroll physics proven under load, build the content layer. Tool cards require a working scroll container because they affect message heights. Shiki loading must remain deferred (post-stream only) as established in Phase 3.
**Delivers:** TurnBlock (React.memo with custom comparator preventing streaming re-renders), ToolActionCard (4-state machine: invoked/awaiting/resolving/resolved/rejected), ThinkingDisclosure (collapsible with pulsing border), react-markdown with streaming-safe debounced parsing, Shiki lazy-loaded per language, CodeBlock (copy button, language header, max-height scroll), DiffViewer.
**Addresses:** Syntax-highlighted code blocks, collapsible thinking blocks, tool call state machine animations, inline tool result rendering (diffs, syntax highlight)
**Avoids:** Pitfall 5 (scroll regression from animations — entry animations use opacity + transform only, never height), Pitfall 4 (Shiki deferred to post-stream; raw monospace container during streaming prevents layout shift)
**Research flag:** SKIP for core rendering patterns. Sub-flag: validate streaming markdown debounce strategy (parse on newlines/sentence-end vs 50ms idle window) against live CloudCLI output during execution to confirm approach.

### Phase 5: Composer + Input + Activity Status

**Rationale:** The input system requires a working message rendering pipeline for visual review. ActivityStatusLine requires the stream store's activityText field established in Phase 2. This phase completes the full conversation loop.
**Delivers:** ChatComposer (shadow-div auto-resize, Shift+Enter vs Enter, focus trapping), ActivityStatusLine (parses stream store activityText into human-readable status), send/stop morphing, file attachment chips, drag-and-drop zone, permission request inline UI, draft preservation (localStorage per session), context window gauge.
**Addresses:** Auto-growing textarea, send/stop button morphing, semantic streaming states (ActivityStatusLine), context window gauge, optimistic UI, no duplicate submissions, draft preservation
**Avoids:** Pitfall 5 (scroll regression from composer height changes — shadow-div resize pattern must not affect scroll math)
**Research flag:** NEEDS RESEARCH (MEDIUM) — which CloudCLI WebSocket event fields map to "Reading file X" vs "Writing file Y" vs "Running terminal command" for ActivityStatusLine parsing. FEATURES.md marks this MEDIUM priority.

### Phase 6: Navigation + Session Management + Sidebar

**Rationale:** Full E2E usability requires navigation. Session switching, tab management, and the command palette are built last in the core sequence because they depend on a working chat loop (Phases 1-5) to test against. This phase delivers a fully usable product.
**Delivers:** SidebarNav (chronological groups: Today/Yesterday/Older, provider badge per session), OmniBar (Cmd+K, fuzzy search), tab bar + WorkspaceTab management (React key isolation, provider identity on session object), session switching with pending guard, SettingsModal (glassmorphic portal), multi-provider tab creation, keyboard navigation throughout.
**Implements:** Multi-Tab Provider Isolation pattern (React key = tabId, visibility:hidden for background tabs preserving scroll/input state)
**Addresses:** Session management (create/switch/rename/delete), tabbed multi-provider workspaces, OmniBar command palette, settings panel
**Avoids:** Pitfall 10 (session state race conditions — pending guard, stream store clear on session switch), Pitfall 9 (z-index wars — all modals portalled to document.body)
**Gate:** App is fully usable E2E, keyboard-navigable, sessions switch without streaming bleed between providers
**Research flag:** SKIP for core session management patterns. Sub-flag: tab persistence across page refresh approach needs brief investigation during planning (FEATURES.md flags this MEDIUM priority).

### Phase 7: Streaming UX Polish

**Rationale:** Polish phases build on proven infrastructure. Aurora overlay, execution chain grouping, and token/cost display are additive features that must not regress streaming FPS established in Phase 3.
**Delivers:** Aurora ambient overlay (CSS-only, .is-streaming guard, GPU-layer-capped at 2-3 elements), execution chain grouping (3+ calls → accordion with count badge), token/cost display per response (compact footer: "450 in / 120 out"), message entrance spring animations (LazyMotion LazyMotion subset, opacity + translateY only), streaming cursor (rose pulsing vertical bar brand moment), MCP server source labels on tool cards.
**Addresses:** Aurora overlay, execution chain grouping, streaming cursor identity, token/cost display, message entrance spring animations
**Avoids:** Pitfall 4 (GPU layer explosion — cap aurora elements at 2-3, verify Chrome DevTools Layers panel after each addition shows < 10 compositor layers), Pitfall 5 (scroll regression — every animation addition includes scroll regression gate check)
**Research flag:** SKIP — patterns well-established from V1 aurora research and PITFALLS.md phase warnings.

### Phase 8: MCP Management + Plugin System

**Rationale:** Agent capability management is independent of the core chat loop and can be built cleanly after navigation is solid. REST API contract for MCP endpoints established in Phase 2.
**Delivers:** MCP server management UI (list, enable/disable, connection status: green/amber/orange), active connections panel in composer area, Claude Code plugin/skill management, approval flow for write-heavy MCP actions (configurable, off by default with inline approve/decline).
**Addresses:** MCP server management UI, active MCP connections panel, approval flow for write-heavy actions, MCP server source labeling on tool cards
**Research flag:** SKIP — REST API contract established; UI patterns from LibreChat/LobeChat reference analysis well-understood.

### Phase 9: GSD Visual Dashboard

**Rationale:** Native GSD orchestration from the UI is a Loom-original feature with no reference product to validate against. It requires the complete navigation and session infrastructure from Phase 6 and has a backend dependency that needs verification.
**Delivers:** Phase pipeline visualization (phase cards with status: pending/active/complete/failed), agent assignment indicators (Claude vs Gemini per phase), GATE-REPORT inline viewing, basic phase execution from UI (/gsd:execute-phase N).
**Addresses:** GSD visual dashboard, agent assignment visibility, native GSD orchestration
**Research flag:** NEEDS RESEARCH — verify CloudCLI exposes /api/taskmaster/* endpoint and confirm GATE-REPORT format and file system access model. If the endpoint does not exist, Phase 9 requires backend work as a prerequisite. FEATURES.md marks this as backend-dependent with uncertain integration path.

### Phase 10: Nextcloud Integration

**Rationale:** File management is backend-dependent on Nextcloud API architecture and is independent of the core chat loop. Defer until core is proven. This phase has the highest architectural uncertainty of all phases.
**Delivers:** File picker for Nextcloud attachment to messages, Nextcloud file browser (navigate, preview text files), screenshot upload pipeline (watch folder, auto-attach offer), file operation diff display in tool cards.
**Addresses:** File attachment to chat, Nextcloud file browser, screenshot upload pipeline, agent file operation visibility
**Research flag:** NEEDS RESEARCH (HIGH) — Nextcloud integration architecture is explicitly LOW confidence: direct WebDAV from browser vs CloudCLI backend proxy has significant implications for CORS, auth token handling, and streaming behavior for file operations. Must be verified during planning before this phase begins.

### Phase 11: Companion System

**Rationale:** Companion system is gated on a feasibility assessment. itch.io license compatibility, canvas vs CSS sprite animation approach, and iGPU performance on AMD Radeon 780M must be validated before committing to this phase. If feasibility fails, Lottie animation or CSS-only loader serves as fallback for "alive" empty state.
**Delivers:** Sprite sheet rendering (CSS animation from 512x896 sprite sheets, 64x64 tiles), animation state machine (idle → type, celebrate → idle transitions), event binding (tool success → celebrate, error → alarmed), companion selection in settings (8 companions: Spool/Shiba, Bobbin/Cat, Shuttle/RedPanda, Weft/Fox, Spindle/Hamster, Thimble/Panda, Lacing/Bunny, Warp/Owl), placement and hide toggle.
**Addresses:** Animated pixel-art companion system, reactive animation states, companion selection, emotional warmth in empty state
**Research flag:** NEEDS RESEARCH (HIGH PRIORITY GATE) — feasibility assessment must complete before committing to this phase scope: itch.io license compatibility for commercial/private use, CSS sprite animation vs @napi-rs/canvas performance on Radeon 780M iGPU, whether 14 animation states are feasible via CSS sprite sheets alone. FEATURES.md: "must complete before committing to Phase 8 [companion]."

### Phase Ordering Rationale

The ordering follows strict technical dependency: App Shell tokens must exist before any component uses them (prevents Pitfall 1); WebSocket types must be defined before any state code references them (prevents Pitfall 8); streaming physics must be proven under load before adding animation on top (prevents Pitfalls 4 and 5); the full chat loop must work before building navigation that wraps it (prevents testing against a broken baseline). This mirrors the V2 Rewrite Playbook ordering and was validated against ARCHITECT_SYNC.md consensus.

Feature groupings follow architecture boundaries: streaming infrastructure phases (1-3) are hermetically sealed from content rendering phases (4-5); navigation/session management (6) is isolated to avoid contaminating the streaming hot path during development; polish phases (7-8) are additive on proven infrastructure; independent backend integrations (9-11) are deferred to avoid blocking core delivery.

The pitfall-avoidance pattern: Pitfalls 1/3/7/9 (foundation issues) must be resolved in Phase 1 exclusively; Pitfalls 2/8 (streaming architecture issues) must be resolved in Phase 2 exclusively; Pitfalls 4/5 (animation-streaming interference) are ongoing concerns that every subsequent phase with animation additions must gate against.

### Research Flags

**Needs phase-specific research during planning:**
- **Phase 2 (WebSocket Bridge):** Exact CloudCLI WebSocket message shapes for all three providers — HIGH priority, must complete before Phase 2 execution begins
- **Phase 5 (Composer/Activity):** Which WebSocket event fields map to specific ActivityStatusLine text strings — MEDIUM priority
- **Phase 6 (Navigation):** Tab persistence across page refresh approach — MEDIUM priority, handle during planning
- **Phase 9 (GSD Dashboard):** Backend endpoint availability for planning file access — verify before committing to phase scope
- **Phase 10 (Nextcloud):** Direct WebDAV vs backend proxy architecture — HIGH priority (LOW confidence currently); determines CORS, auth, and streaming approach
- **Phase 11 (Companion):** Feasibility gate (itch.io licenses, canvas vs CSS sprite, iGPU performance) — HIGH priority gate; phase must not be scoped until gate passes

**Standard patterns — skip phase research:**
- **Phase 1 (App Shell/Design System):** Tailwind config, Vitest setup, Zustand initialization are all well-documented; one quick empirical OKLCH-in-Tailwind-v3.4 verification
- **Phase 3 (Streaming/Scroll):** IntersectionObserver sentinel pattern confirmed by V1 research; content-visibility:auto MDN-documented with clear browser support matrix
- **Phase 4 (Message Rendering):** react-markdown pipeline established and working in V1; Shiki lazy loading documented
- **Phase 7 (Streaming Polish):** Aurora and animation patterns established from V1 research and PITFALLS.md analysis
- **Phase 8 (MCP Management):** REST API contract established in Phase 2; UI patterns from reference app analysis

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All versions verified on npm registry 2026-03-04; peer dependency matrix validated; V1 codebase confirms working packages; ARCHITECT_SYNC.md consensus validates architecture-level choices |
| Features | HIGH | Cross-verified from 6 reference product analyses + 106-requirement standards document + PROJECT.md constraints; anti-features explicitly documented; competitive pattern matrix covers all major dimensions |
| Architecture | HIGH | Based on BACKEND_API_CONTRACT.md + ARCHITECT_SYNC.md co-architect consensus + direct V1 codebase analysis; 7 named patterns with code examples; component boundary table with 20+ components |
| Pitfalls | HIGH | Every pitfall grounded in V1 post-mortem evidence (gate reports, audit files); not theoretical — documented failures with known consequences, file-level evidence, and grep-verified counts |

**Overall confidence:** HIGH

### Gaps to Address

- **CloudCLI WebSocket protocol (Phase 2 blocker):** The `WSMessage` discriminated union in STACK.md is illustrative ("finalize after backend audit"). Before Phase 2 execution, audit `server/index.js` and actual WebSocket output to confirm exact message shapes for all three providers. Getting this wrong requires rewriting the entire message pipeline — it is the highest-stakes gap in the research.

- **OKLCH in Tailwind v3.4 (Phase 1 pre-check):** STACK.md locks Tailwind at v3.4 for `hsl(var(--token) / <alpha-value>)` compatibility, but token definitions use OKLCH color values. Verify that OKLCH values in CSS `:root` custom properties work correctly with Tailwind v3.4's opacity modifier syntax before Phase 1 begins. Quick empirical test in isolation sufficient.

- **GSD Dashboard backend integration (Phase 9 gate):** The /api/taskmaster/* endpoint is referenced in ARCHITECTURE.md component boundary table but its existence in the current CloudCLI server needs verification. If this endpoint does not exist, Phase 9 requires backend work as a prerequisite and the phase scope must be revised.

- **Nextcloud integration architecture (Phase 10 gate):** FEATURES.md explicitly rates this LOW confidence. The choice between direct WebDAV from the browser vs proxying through CloudCLI affects CORS headers, auth token handling, and streaming behavior for file operations. Verify during Phase 10 planning before any implementation begins.

- **Companion system feasibility (Phase 11 gate):** Phase 11 is explicitly conditional. The feasibility gate must verify itch.io license compatibility for private/commercial use, CSS sprite vs canvas performance on AMD Radeon 780M iGPU (no discrete GPU, no ROCm), and whether 14 animation states are achievable via CSS sprite sheets alone before Phase 11 is committed to scope.

## Sources

### Primary (HIGH confidence)
- `.planning/BACKEND_API_CONTRACT.md` — Full WebSocket + REST protocol specification for CloudCLI
- `.planning/ARCHITECT_SYNC.md` — Claude + Gemini co-architect consensus on all 10 architectural concerns (2026-03-04)
- `.planning/audit/UI_COMPONENT_ARCHITECTURE.md` — Streaming render pattern analysis (Gemini)
- `.planning/audit/EXHAUSTIVE_UX_KNOWLEDGE_BASE.md` — Reference app teardowns: Claude.ai, ChatGPT Canvas, Linear, Perplexity, Open WebUI
- `.planning/audit/WEBSOCKET_SCHEMA.md` — Discriminated union of WebSocket message types
- `.planning/audit/UX_ARCHITECTURE_DEEP_DIVE.md` — Scroll physics, tool call display, input ergonomics deep dive
- `.planning/chat-interface-standards.md` — 106 requirements across 16 categories, cross-verified across 6 products
- `.planning/reference-app-analysis.md` — 6-product breakdown verified via Gemini research 2026-03-03
- `.planning/PROJECT.md` — V2 requirements, constraints, key architectural decisions, explicit out-of-scope items
- npm registry (2026-03-04) — All package versions and peer dependency matrices verified
- V1 Phase Gate Reports (Phases 5, 7, 10, 11) — Post-mortem evidence for all pitfalls
- V2_CONSTITUTION.md — Enforceable conventions; each rule traces to a specific V1 violation
- Direct analysis of `/home/swd/loom/src/` V1 codebase — component boundaries, performance patterns, accumulated debt lessons

### Secondary (MEDIUM confidence)
- motion official docs (motionjs.com) — LazyMotion + domAnimation bundle size (~5KB vs ~34KB full); exact KB needs Phase 1 bundle analysis verification
- MDN — `content-visibility: auto` browser support (Chrome 85+, Firefox 125+, Safari 18+), `contain-intrinsic-size`, CSS `grid-template-rows` animation
- `.planning/audit/V2_REWRITE_PLAYBOOK.md` — Initial 6-phase roadmap from Gemini architect (superseded by Claude architect review but phase ordering validated)

### Tertiary (LOW confidence, needs phase validation)
- Nextcloud integration architecture (direct WebDAV vs backend proxy) — needs empirical verification during Phase 10 planning
- Companion sprite feasibility (itch.io licensing, iGPU performance on Radeon 780M) — needs feasibility gate before Phase 11 commitment
- OKLCH in Tailwind v3.4 interaction — needs quick empirical test before Phase 1 execution

---
*Research completed: 2026-03-04*
*Ready for roadmap: yes*
