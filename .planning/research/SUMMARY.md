# Project Research Summary

**Project:** Loom — Premium AI Coding Chat Interface
**Domain:** Brownfield React + Tailwind web app transformation (CloudCLI fork → Loom)
**Researched:** 2026-03-01
**Confidence:** HIGH

## Executive Summary

Loom is a brownfield transformation of CloudCLI — a working React 18 + Express + WebSocket AI chat interface — into a premium, visually distinctive developer tool targeting power users of Claude Code and Gemini CLI. The foundational plumbing (chat, sessions, file explorer, git panel, terminal, WebSocket, auth) already exists and must be treated as immovable. The transformation work is almost entirely a UI/UX and visual redesign: replacing the current VS Code-inspired dark palette with a warm earthy aesthetic, upgrading syntax highlighting to VS Code-quality (Shiki), and redesigning the chat message experience to match or exceed Claude.ai and Cursor. The codebase analysis confirmed 197 source files, 43 components with i18n dependency to strip, and 86 files with hardcoded Tailwind color classes that will resist theming unless addressed systematically before any visual work begins.

The recommended approach is layered transformation: establish the design system foundation first (CSS variables, palette, typography), then sweep hardcoded colors, then strip unused backends and i18n, then redesign the chat message experience, then add the streaming UX polish features that differentiate Loom from generic AI tools. This order is non-negotiable — attempting visual redesign before the CSS variable system is correct will produce inconsistent results that require re-work. The key competitive differentiators are: warm earthy identity (unique in the space), high information density (Linear-style versus Claude.ai's spacious layout), collapsible turn management for long agentic sessions, and VS Code-quality syntax highlighting.

The top risks are technical and architectural, not product-level. The Tailwind HSL opacity modifier contract (`<alpha-value>` placeholder) is a silent failure mode that breaks all interactive states if not implemented correctly from the start. Per-token React streaming re-renders are a CPU/performance hazard that must be designed around from day one (buffer + rAF pattern). Auto-scroll fighting the user is the single most disruptive UX pitfall in AI chat interfaces. Fork divergence from CloudCLI upstream is a long-term governance risk. All four of these are preventable with specific patterns documented in research — they are not discovered-later problems if the build order is followed correctly.

## Key Findings

### Recommended Stack

The inherited CloudCLI stack (React 18, TypeScript 5, Vite 7, Tailwind CSS 3, Express + WebSocket, better-sqlite3, react-router-dom, CVA + tailwind-merge, lucide-react) is solid and must not be migrated. Three targeted library additions close the gap to premium quality: Shiki replaces `react-syntax-highlighter` for VS Code-grade syntax highlighting (TextMate grammars, 99% accuracy vs Prism's ~80%), `motion` (formerly Framer Motion, now published as the `motion` package) handles layout animations for collapsible turns and thinking block disclosure, and `react-diff-viewer-continued` handles read-only diff display for Claude's file edit tool calls. The existing `@codemirror/merge` stays for the interactive git panel. Packages to remove include `react-syntax-highlighter`, `@openai/codex-sdk`, and the entire i18n stack (`i18next`, `react-i18next`, `i18next-browser-languagedetector`).

**Core technologies:**
- `shiki@^4` + `@shikijs/rehype@^4`: Syntax highlighting — TextMate grammars give VS Code Dark+ parity; replaces Prism
- `react-markdown@^10` (already installed): Markdown rendering — keep as-is; streaming jank fixed via token buffer, not library swap
- `motion@^12` (already installed): Animations — `AnimatePresence` + `layout` prop for collapsible height animations; use `LazyMotion` to reduce bundle to ~4.6KB
- `react-diff-viewer-continued@^4.1.2`: Diff display in chat — React-native, dark theme support, warm palette customizable
- `@fontsource/jetbrains-mono`: Monospace font — self-hosted, no CDN dependency
- `@xterm/xterm@^5.5.0` (keep at v5.5, do not upgrade to v6): Terminal — themed via `TERMINAL_OPTIONS.theme` JS object with Catppuccin Mocha hex values
- CSS variables + `hsl(var(--token) / <alpha-value>)` pattern: Theme system — channel-only variables in CSS, `<alpha-value>` required for opacity modifiers

**Critical version note:** Shiki is at `4.0.0` (not `3.23.0` — some secondary sources are stale). Install `shiki@^4 @shikijs/rehype@^4` with matching major versions. `motion` is at `^12.34.3` — import from `motion/react`, not the deprecated `framer-motion` package name.

### Expected Features

Research cross-verified against Claude.ai, Cursor, Windsurf, and GitHub Copilot Chat. The feature landscape splits cleanly: table stakes are what make the tool feel professional, differentiators are where Loom's "designed, not generated" thesis lives.

**Must have (table stakes) — launch blockers:**
- Markdown rendering with GFM (already exists, needs Shiki integration)
- VS Code-quality syntax highlighting (Shiki upgrade)
- Copy-to-clipboard on code blocks (one-line addition, show on hover)
- Stop generation with backend abort propagation (AbortController + `req.on('close')`)
- Auto-scroll with manual override (sticky-bottom pattern, break at 10px upward scroll)
- Jump-to-bottom pill with new message count badge
- Distinct thinking vs. generating indicators (pulsing amber, not generic spinner)
- Collapsible thinking blocks (pulse while streaming, auto-collapse on output, always expandable)
- Tool call action cards (compact, expandable, grouped for 3+ calls)
- Session persistence (already exists, needs visual "resuming" indicator)
- Status feedback for errors (toast for transient, inline banner for persistent)

**Should have (competitive differentiators):**
- Warm earthy design language — chocolate/amber/copper/terracotta palette (unique identity)
- Dense professional layout — 4-8px grid, tight line heights, JetBrains Mono throughout
- Collapsible completed turns — critical for long agentic sessions
- Live agentic status line — real-time "Reading auth.ts... Executing command..." micro-status
- Token count + cost per response — key for self-hosting power users
- Context window gauge — visual progress bar near input
- Diff rendering with colored unified diffs — file edits as readable diffs, not raw text
- Inline permission banners — non-blocking, replaces modals
- System/status message categorization — gray/amber/red visual hierarchy

**Defer (v2+):**
- Keyboard shortcut system / command palette (Cmd+K) — high value, significant implementation
- Live streaming diffs (like Cursor's ghost text) — major architectural work
- Compact/comfortable density toggle — second-order customization
- Multi-agent status visualization — SDK dependency

**Anti-features to explicitly avoid:**
- Character-by-character typewriter effect (eye strain, artificial latency)
- Modal permission dialogs (blocks flow in agentic sessions)
- Generic three-dot typing indicator (no information value)
- Dark mode toggle (Loom's identity is specifically warm dark)
- Customizable color themes (disproportionate effort; offer density/font instead)
- Infinite scroll for session history (browser performance degrades with markdown + code blocks)

### Architecture Approach

The existing architecture is well-decomposed and should be extended, not replaced. `ChatInterface` delegates to four isolated hooks (`useChatProviderState`, `useChatSessionState`, `useChatComposerState`, `useChatRealtimeHandlers`), which is the correct pattern for adding features without breaking existing behavior. The CSS variable theming system already uses the right two-layer architecture (`:root` light + `.dark` override), and the Tailwind config correctly maps semantic aliases to CSS custom properties — the transformation only changes HSL values, not variable names or component classnames. The streaming architecture uses a 100ms `setTimeout` buffer in `useChatRealtimeHandlers`, which is correct in principle but should be upgraded to `requestAnimationFrame` for better frame-rate alignment.

**Major components and transformation responsibilities:**
1. `src/index.css` + `tailwind.config.js` — palette and token system (Phase 1 work only)
2. 86 files with hardcoded Tailwind colors — systematic sweep to semantic aliases (Phase 2)
3. 43 components with `useTranslation()` — mechanical string literal substitution + i18n removal (Phase 3)
4. `useChatProviderState` + server routes — Cursor/Codex backend strip (Phase 4)
5. `ChatMessagesPane` + new `TurnBlock` component — turn collapse, tool call grouping (Phase 5)
6. `MessageComponent` — user bubble, assistant layout, thinking block, tool card redesign (Phase 5)
7. `useChatRealtimeHandlers` — add `turnId` assignment, enhance streaming buffer to rAF (Phase 5)
8. `AssistantThinkingIndicator` + scroll logic — streaming UX polish (Phase 6)
9. `src/components/shell/constants/constants.ts` — Catppuccin Mocha terminal theme (Phase 7)

**State placement rules (critical for performance):**
- Turn collapse state: `useChatSessionState` (scoped to chat, reset on session change) — NOT global Context
- Tool group expansion: local `useState` in `TurnBlock` (ephemeral per-group) — NOT lifted
- Streaming content: isolated `useRef` buffer, flushed via rAF — NEVER in Context consumed by layout components

### Critical Pitfalls

1. **Tailwind HSL `<alpha-value>` contract** — CSS variables must be defined as bare channel values (no `hsl()` wrapper), then referenced as `hsl(var(--token) / <alpha-value>)` in `tailwind.config.js`. Without this, all opacity modifiers (`bg-primary/50`, `text-accent/70`) silently render at full opacity. This is a Phase 1 day-1 requirement — get it wrong and every interactive state, overlay, and hover effect in the app is broken invisibly.

2. **86 files with hardcoded Tailwind colors** — The existing codebase bypasses the CSS variable system in 86 files (`bg-blue-600`, `text-gray-500`, `bg-red-950`, etc.). These will not respond to the palette swap. A pre-retheme audit grep and systematic replacement sprint is required before any visual QA is meaningful. Primary targets: user bubble (`bg-blue-600` → `bg-primary`), error states (`bg-red-*` → `bg-destructive`), muted text (`text-gray-500` → `text-muted-foreground`).

3. **Per-token React streaming re-renders** — Naive token-by-token `setState` causes 100–400 renders/second during Claude streaming responses. The existing 100ms setTimeout buffer helps but is not sufficient without memoized `MessageComponent` and `TurnBlock` components. Upgrade to `requestAnimationFrame` flush and ensure stable references prevent memo comparison failures. Never put streaming state in a Context consumed by sidebar or layout-level components.

4. **Auto-scroll fighting the user** — The hardest UX problem in AI chat interfaces. Solution: track `isUserAtBottom` explicitly in `onScroll` (threshold: 100px from bottom), use CSS `overflow-anchor: auto` on the scroll container, never call `scrollIntoView()` in a `useEffect` that fires on every streaming token, stable `IntersectionObserver` refs via `useCallback`.

5. **Fork divergence from CloudCLI upstream** — Without a strategy, Loom will accumulate merge conflicts as CloudCLI continues shipping. Maintain an `upstream-sync` branch tracking CloudCLI exactly. Make Loom changes atomic and scoped (one concern per commit). Prefer disabling code over deleting it (reduces conflict surface). Tag the upstream baseline commit before the fork diverges. This must be established before any code changes — not retroactively.

**Additional pitfalls of note:**
- xterm.js theme cannot be set via CSS — must use `terminal.options.theme` JS object with hex values (CSS variables have no effect on the canvas-rendered terminal)
- WebSocket cleanup required in every `useEffect` — React 18 StrictMode double-mount reveals missing cleanup immediately in dev; production leaks memory silently
- GPL-3.0 compliance — retain LICENSE file, add ATTRIBUTION/NOTICE crediting CloudCLI authors; non-negotiable legal requirement
- `rehype-raw` must never be enabled without `rehype-sanitize` — LLM output can contain XSS vectors

## Implications for Roadmap

Research strongly supports a layered transformation order. Visual work cannot precede token system correctness. Structural cleanup (i18n, dead backends) should happen before UI redesign to reduce the file count being actively worked. Chat redesign is the highest-risk, highest-value phase and should occur on a stable foundation.

### Phase 1: Foundation — Design System and Fork Governance

**Rationale:** Every subsequent phase depends on a correct CSS variable + Tailwind token system. Doing this first means zero re-work later. Fork governance (upstream-sync branch, GPL compliance, git workflow) must be established before any code diverges — it cannot be retrofitted.

**Delivers:** Warm earthy palette active across all existing UI using semantic aliases; `<alpha-value>` opacity contract verified; ATTRIBUTION file; upstream-sync branch established; JetBrains Mono loaded.

**Addresses:** Design system (palette, CSS variables, typography) — the prerequisite for all visual differentiators.

**Avoids:** HSL opacity contract failure (Pitfall 1), hardcoded color survival (Pitfall 2), fork divergence (Pitfall 5), GPL non-compliance (Pitfall 12).

**Research flag:** Standard patterns — CSS variable theming is well-documented. No research phase needed.

### Phase 2: Color Sweep — Hardcoded Color Replacement

**Rationale:** The 86 files with hardcoded Tailwind colors will produce visual inconsistency that makes QA impossible until they're resolved. This is a mechanical operation that can be largely scripted with grep + find-and-replace. Doing it before UI redesign means the new components will be authored correctly from the start.

**Delivers:** All color references in the codebase using semantic aliases; grep audit returns zero non-token color classes; consistent warm palette across every screen.

**Addresses:** System message categorization (gray/amber/red) starts here with new semantic tokens.

**Avoids:** Hardcoded colors surviving retheme (Pitfall 2), specificity conflicts with third-party components (Pitfall 9).

**Research flag:** Mechanical work — no research phase needed. Use the audit grep commands documented in ARCHITECTURE.md Pattern 2.

### Phase 3: Structural Cleanup — i18n Removal and Backend Strip

**Rationale:** 43 components with `useTranslation()` add cognitive overhead and import noise to every file touched during redesign. Removing i18n before redesigning those components is cleaner than removing it after. Similarly, stripping Cursor/Codex backends clarifies the provider model before the chat UI is redesigned around it.

**Delivers:** Codebase without i18n overhead; provider model simplified to Claude + Gemini only; 3 packages removed (`react-i18next`, `i18next`, `@openai/codex-sdk`); bundle size reduced.

**Avoids:** Touching i18n-infected components twice during redesign; Codex-specific edge cases appearing in chat message handling.

**Research flag:** Standard patterns — mechanical string substitution. No research phase needed.

### Phase 4: Raw Terminal View (Existing Phase)

**Rationale:** Per existing roadmap planning, Phase 03 (raw terminal view) has planning files already in progress. This phase likely slots between structural cleanup and chat redesign — implementing the terminal panel with correct Catppuccin Mocha theming while the codebase is clean and the design system is stable.

**Delivers:** Terminal view with warm-themed Catppuccin Mocha palette correctly applied via `terminal.options.theme`.

**Avoids:** xterm.js canvas theming confusion (Pitfall 10) — must use JS object, not CSS.

**Research flag:** Terminal theming is well-documented. Pitfall 10 is the main hazard.

### Phase 5: Chat Message Redesign — Core Experience

**Rationale:** The highest-value and highest-risk phase. Depends on stable palette (Phases 1-2) and clean codebase (Phase 3). Introduces `TurnBlock` component, redesigns `MessageComponent`, upgrades streaming buffer to rAF, adds tool call action cards, thinking block disclosure redesign, and syntax highlighting upgrade to Shiki.

**Delivers:** Premium chat experience — warm earthy message design, collapsible turns, VS Code-quality syntax highlighting, tool call action cards (compact, grouped, expandable), animated thinking blocks, diff rendering for file edits.

**Addresses:** Shiki syntax highlighting, collapsible thinking blocks, tool call action cards, collapsible completed turns, diff rendering, warm design language, dense professional layout.

**Avoids:** Per-token re-render cascade (Pitfall 3) — upgrade to rAF buffer and memoized TurnBlock; anti-pattern of blocking streaming with heavy Markdown parse (render raw text during stream, switch to Markdown on completion).

**Research flag:** This phase needs careful implementation of the streaming performance patterns. The rAF buffer pattern, memoized TurnBlock comparator, and the "raw text while streaming / Markdown after" split are all documented in ARCHITECTURE.md and PITFALLS.md. No additional research-phase needed — the patterns are defined. However, this is the phase most likely to surface unexpected edge cases requiring mid-phase design decisions.

### Phase 6: Streaming UX Polish — Scroll, Status, Indicators

**Rationale:** Auto-scroll, jump-to-bottom pill, thinking indicators, and status line are best implemented after the chat component structure is stable (Phase 5). They instrument existing components rather than restructuring them.

**Delivers:** Sticky auto-scroll with manual override, jump-to-bottom pill with new message count badge, pulsing streaming indicator with thinking vs. generating states, global activity status bar, token count/cost display per response, connection status indicator.

**Addresses:** Auto-scroll with manual override, jump-to-bottom pill, thinking/generating state distinction, usage summary, status feedback for errors, connection status.

**Avoids:** Auto-scroll fighting the user (Pitfall 4) — must implement `isUserAtBottom` tracking and `overflow-anchor` CSS; `IntersectionObserver` sentinel stability.

**Research flag:** Auto-scroll is a well-documented problem with established solution patterns. No research phase needed — follow the PITFALLS.md Pitfall 4 prevention steps exactly.

### Phase 7: Sidebar, Settings, and Global Polish

**Rationale:** After the core chat experience is designed and working, the peripheral surfaces (sidebar session list, settings panel, error toasts, global status line) get the same treatment without risk of blocking chat functionality.

**Delivers:** Dense sidebar with tight session list, settings panel cleanup, toast system for transient errors, session-level token totals in sidebar, compact/comfortable density toggle.

**Addresses:** Dense professional layout applied to sidebar, usage summary (session totals), global status bar, connection status indicator.

**Avoids:** Tailwind dynamic class purge (Pitfall 8) — any toast severity classes must be in lookup tables, not template literals.

**Research flag:** Standard patterns throughout. No research phase needed.

### Phase Ordering Rationale

- **Design system before all visual work:** The CSS variable + `<alpha-value>` contract must be correct before any component is judged visually. Building components on a broken token system means re-testing everything.
- **Color sweep before redesign:** 86 hardcoded files contaminate visual QA. Sweeping them first means new components are authored correctly and old ones respond to the palette.
- **Structural cleanup before feature work:** Reducing the codebase surface (43 i18n components, dead providers) reduces the cognitive load and file count during the highest-complexity work.
- **Chat redesign as a single phase:** Splitting `MessageComponent`, `TurnBlock`, streaming buffer, and Shiki integration across multiple phases creates integration risks. They should be developed together with a stable palette foundation under them.
- **Streaming UX polish after structure:** Scroll management and indicators instrument existing components — they don't define structure. Doing them after Phase 5 means the DOM structure they target is stable.

### Research Flags

Phases needing deeper research during planning:
- **None identified.** All implementation patterns are documented in STACK.md, ARCHITECTURE.md, and PITFALLS.md with sufficient detail for direct execution. The research phase has front-loaded the hard decisions.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Foundation):** CSS variable theming is fully specified in STACK.md and PITFALLS.md.
- **Phase 2 (Color Sweep):** Mechanical grep-and-replace; patterns in ARCHITECTURE.md Pattern 2.
- **Phase 3 (Structural Cleanup):** i18n removal approach in ARCHITECTURE.md Pattern 5; backend strip in Phase 5 notes.
- **Phase 5 (Chat Redesign):** Streaming patterns, TurnBlock memoization, Shiki integration all documented. Mid-phase decisions expected but not requiring pre-research.
- **Phase 6 (Streaming UX):** Auto-scroll solution in PITFALLS.md Pitfall 4; scroll-anchor CSS documented.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Most findings verified via Context7, npm registry (verified 2026-03-01), and official docs. Shiki 4.0.0 version confirmed directly via npm. `motion` package API verified via Context7. |
| Features | HIGH | Cross-verified against Claude.ai, Cursor, Windsurf, GitHub Copilot Chat direct analysis. Feature tiers validated against established patterns in the competitive landscape. |
| Architecture | HIGH | Based on direct analysis of 197 source files. Component boundaries, data flow, and state placement recommendations are grounded in actual code inspection, not inference. |
| Pitfalls | HIGH | Most pitfalls verified via official GitHub issues (Tailwind, React), official documentation (CodeMirror, xterm.js), and high-quality community sources. GPL compliance via GNU Project FAQ. |

**Overall confidence:** HIGH

### Gaps to Address

- **Shiki async integration in streaming context:** Shiki's `codeToHtml()` is async. During streaming, code blocks may be incomplete (no closing fence). The handling of incomplete code blocks during streaming (render as raw text until `isStreaming: false`) is the recommended approach, but the exact UX during long code blocks may need iteration. Not a blocker — the fallback (raw text while streaming) is well-specified.

- **`TurnId` assignment logic:** Research specifies that `turnId` should be added to `ChatMessage` and assigned in `useChatRealtimeHandlers`, but the exact boundary condition (when does a new turn begin vs. continue?) depends on Claude Code's streaming event structure. This needs a brief audit of the actual WebSocket message types during a real session before Phase 5 begins. Low-risk gap — one session observation answers the question.

- **ANSI chat parser interaction with Shiki:** Phase 05 (ANSI chat parser) appears in the planning directory alongside the chat redesign work. The interaction between ANSI escape code handling and Shiki's syntax highlighting pipeline is not fully specified. These likely operate on different message types (terminal output vs. markdown code blocks) and should not conflict, but verify before Phase 5.

- **`motion` LazyMotion boundary placement:** The `LazyMotion` wrapper for bundle optimization must wrap the component tree above all `m.*` components. Given the existing Provider tree in `App.tsx`, the correct insertion point needs to be confirmed to avoid breaking animation features in scattered components. Low-risk — `LazyMotion` placement is a single-file decision.

## Sources

### Primary (HIGH confidence)
- Context7 `/shikijs/shiki` — React integration patterns, `shiki/bundle/web` API, theme usage
- Context7 `/vercel/streamdown` — Streamdown API comparison, confirming react-markdown retention decision
- Context7 `/remarkjs/react-markdown` — v10 API, plugin pipeline, custom components
- Context7 `/websites/motion_dev` — Motion API, `LazyMotion` bundle strategy, layout animations
- npm registry (direct queries, 2026-03-01) — shiki@4.0.0, @shikijs/rehype@4.0.0, motion@12.34.3, react-diff-viewer-continued@4.1.2, @xterm/xterm@6.0.0, @fontsource/jetbrains-mono@5.2.8
- Direct analysis of `/home/swd/loom/src/` (197 TypeScript/React source files)
- `src/components/chat/hooks/useChatRealtimeHandlers.ts` — streaming architecture ground truth
- Tailwind CSS GitHub issue #7575 — HSL opacity modifier `<alpha-value>` requirement
- React GitHub issue #25614 — StrictMode double-mount WebSocket cleanup behavior
- CodeMirror official styling guide — `EditorView.theme()` extension API
- GNU Project GPL-3.0 FAQ — license compliance requirements

### Secondary (MEDIUM confidence)
- Gemini research — Shiki vs Prism ecosystem analysis, react-markdown vs Streamdown tradeoffs, AI interface feature landscape 2025-2026
- Claude.ai, Cursor, Windsurf, GitHub Copilot Chat — direct interface analysis for feature baseline
- Akash Builds: "Why React Apps Lag With Streaming Text" — streaming re-render cascade patterns
- LogRocket: "Pitfalls of overusing React Context" — context performance patterns
- GitHub Blog: "Friendly Fork Management Strategies" — upstream sync approach
- Oliver Roick (2024): "Setting Colors in xterm.js" — canvas theming constraints
- Oliver Roick (2024): Tailwind dark mode specificity post-v3.4.1

### Tertiary (MEDIUM-LOW confidence, validate if needed)
- ProTailwind workshop — implementing color opacity with CSS variables (consistent with official Tailwind docs but third-party source)
- SitePoint: "Streaming Backends & React: Re-render Chaos" — practical streaming analysis
- TanStack Virtual GitHub issue #832 — dynamic height estimation (applies if virtualization is added in v2+)

---
*Research completed: 2026-03-01*
*Ready for roadmap: yes*
