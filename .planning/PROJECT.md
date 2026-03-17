# Loom V2

## What This Is

Loom is a premium web interface for AI coding agents (Claude Code, Gemini, Codex) that transforms the black-box CLI experience into a visually stunning, multi-agent workspace. Built on a from-scratch React frontend with a 10/10 quality standard, consuming the existing CloudCLI Node.js backend. The full conversation experience is shipped with rich markdown, Shiki syntax highlighting, 6 purpose-built tool cards, streaming at 60fps, auto-resize composer, permission banners, activity status, and CSS visual effects. Now a daily-driver with error resilience, composer intelligence (@-mentions, slash commands), full accessibility compliance, and performance-optimized rendering.

## Core Value

Make AI agent work visible, beautiful, and controllable — every tool call, every code write, every MCP interaction should be a satisfying visual experience that enhances understanding of what the agent is doing.

## Requirements

### Validated

- ✓ v1.0 Design Token System (DS-01 through DS-06) — v1.0
- ✓ v1.0 Enforcement (ENF-01 through ENF-04) — v1.0
- ✓ v1.0 App Shell (SHELL-01 through SHELL-04) — v1.0
- ✓ v1.0 State Architecture (STATE-01 through STATE-05) — v1.0
- ✓ v1.0 Streaming (STRM-01 through STRM-04) — v1.0
- ✓ v1.0 Components (COMP-01 through COMP-03) — v1.0
- ✓ v1.0 Navigation (NAV-01, NAV-02) — v1.0
- ✓ v1.1 Markdown rendering (MD-01 through MD-15, CODE-01 through CODE-09) — react-markdown + Shiki + streaming two-phase — v1.1
- ✓ v1.1 Composer (CMP-01 through CMP-14) — auto-resize, FSM, image attachments, draft persistence — v1.1
- ✓ v1.1 Message types (MSG-01 through MSG-11) — 5 roles, thinking, images, lightbox — v1.1
- ✓ v1.1 Tool cards (TOOL-01 through TOOL-23) — state machine, 6 cards, grouping accordion — v1.1
- ✓ v1.1 Permissions (PERM-01 through PERM-05) — inline banners with countdown — v1.1
- ✓ v1.1 Activity & scroll (ACT-01 through ACT-05, NAV-01 through NAV-04) — status line, scroll preservation, bottom lock — v1.1
- ✓ v1.1 Polish (POL-01 through POL-04, UI-01 through UI-05) — animations, cursor, shadcn/ui, CSS effects — v1.1
- ✓ v1.1 Enhanced features (ENH-01 through ENH-06) — Streamdown eval, ANSI, thinking markdown, retry, search, export — v1.1
- ✓ v1.2 Layout (LAY-01 through LAY-09) — CSS show/hide tab system, 5th Zustand store, panel error boundaries — v1.2
- ✓ v1.2 Settings (SET-01 through SET-20) — 5-tab modal, agents, API keys, appearance, git, MCP — v1.2
- ✓ v1.2 Command Palette (CMD-01 through CMD-13, CMD-15) — Cmd+K with fuzzy search, 7 command groups — v1.2
- ✓ v1.2 File Tree (FT-01 through FT-16) — hierarchical browser, type icons, context menus, search filter — v1.2
- ✓ v1.2 Code Editor (ED-01 through ED-20) — CodeMirror 6, OKLCH theme, multi-tab, diff view, save — v1.2
- ✓ v1.2 Terminal (TERM-01 through TERM-15) — xterm.js, /shell WebSocket, OKLCH colors, connection state — v1.2
- ✓ v1.2 Git Panel (GIT-01 through GIT-23) — changes/history, staging, commit, branch ops, push/pull/fetch — v1.2
- ✓ v1.2 Navigation (NAV-01 through NAV-03) — session rename, delete, context menus — v1.2

### Validated (v1.3)

- ✓ Error & connection resilience (ERR-01 through ERR-05) — crash banner, reconnect overlay, status indicator, navigate-away guard — v1.3
- ✓ Session hardening (SESS-01 through SESS-03) — paginated history, streaming indicators, temp ID lifecycle — v1.3
- ✓ File tree git integration (FTE-01, FTE-02) — git change indicators with directory aggregation — v1.3
- ✓ Editor & tool enhancements (FTE-03 through FTE-05) — minimap, "Run in Terminal" bridge — v1.3
- ✓ File mentions (COMP-01 through COMP-03) — @-mention file picker, inline chips, context attachments — v1.3
- ✓ Slash commands (COMP-04 through COMP-06) — command menu with keyboard navigation — v1.3
- ✓ Conversation UX (UXR-01 through UXR-07) — auto-collapse, usage footers, quick settings — v1.3
- ✓ Accessibility (A11Y-01 through A11Y-06) — ARIA, keyboard nav, focus management, screen reader, contrast — v1.3
- ✓ Performance (PERF-01 through PERF-05) — vendor chunks, content-visibility, memory profiling, bundle analysis — v1.3

### Active

**Next Milestone: v1.4 "The Polish"**

**Goal:** Transform the functional daily-driver into a visually stunning, award-winning interface.

**Target features:**
- [ ] Spring physics animations on all interactions
- [ ] Aurora/ambient WebGL overlay during streaming (GPU feasibility gated)
- [ ] Glass surface effects for modals and overlays
- [ ] Sidebar slim collapse mode (icon-only rail)
- [ ] DecryptedText reveals for session titles and model names
- [ ] StarBorder accents on focused/active elements
- [ ] Motion refinement across all surfaces

**Future milestones:**
- v2.0 "The Power" — Multi-provider tabs, MCP management
- v3.0 "The Vision" — GSD dashboard, Nextcloud, companions, CodeRabbit

### Out of Scope

- **Mobile-native app** — Web-first, responsive handles mobile access
- **Multi-user / auth system** — Single-user tool; backend already handles auth
- **AI model training** — Loom consumes models, doesn't train them
- **Full IDE replacement** — Complements VS Code/Cursor, doesn't replace
- **Light mode** — Dark-only for M1-M3; potential M5 stretch goal
- **Arbitrary LLM providers** — Claude, Gemini, Codex only (backend constraint)
- **Character-by-character typewriter** — Anti-pattern; use batch rendering via rAF buffer
- **Conversation branching** — High complexity, low value for single-user tool

## Context

**Current State (post v1.3):**
- 46,501 LOC TypeScript + CSS across 37 phases, 87 plans (4 milestones)
- Tech stack: Vite + React 19 + TypeScript, Tailwind v4, Zustand (5 stores), Vitest
- 551 commits (145 M1 + 158 M2 + 145 M3 + 103 M4), 14-day total build (2026-03-04 to 2026-03-17)
- 1,023+ tests passing, Playwright E2E suite, 9 custom ESLint rules
- Dependencies: react-markdown, shiki, DOMPurify, diff, shadcn/ui (14 primitives), tailwindcss-animate, cmdk, fuse.js, @codemirror/*, @xterm/*
- Frontend at `src/`, backend at `server/` (port 5555)
- Dev server: port 5184
- Full workspace with: chat, file tree, code editor, terminal, git panel, settings, command palette, @-mentions, slash commands, quick settings, accessibility, performance optimizations
- WCAG AA contrast compliance, full keyboard navigation, screen reader support

**Known Tech Debt:**
- rehypeToolMarkers plugin runs as no-op (tools render as React components post-markdown)
- highlightText not threaded into MarkdownRenderer for assistant body content
- CMD-14 deferred: recent commands need command registry for re-execution
- SET-07 backend limitation: API key add form has name field only
- GIT-04 intentional: client-side staging Set<string> (no /api/git/stage endpoint)
- fileMentions WS field sent but backend ignores (text prefix workaround)
- PERF-01: Live 55+ FPS benchmark with 200+ messages not measured (code-path verified only)
- Phase 31 minimap/terminal features need human verification (jsdom limitations)

**Prior Work:**
- V1 frontend rated 5.5/10 in audits, archived to `.planning/v1-archive/`
- Architectural consensus between Claude and Gemini architects (ARCHITECT_SYNC.md)
- V2 Constitution with 12 sections of enforceable conventions

## Constraints

- **Backend**: Keep existing CloudCLI Node.js server — no backend rewrite
- **Tech Stack**: Vite + React 19 + TypeScript, Tailwind v4, Zustand (5 stores), Vitest
- **Quality Bar**: 10/10 or iterate. Automated enforcement from commit #1.
- **Design**: No hardcoded colors, no inline styles for static values, all animations through defined tokens. Constitution enforced via ESLint.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Full frontend rewrite (not fork iteration) | Fork divergence makes merging impossible; V1 foundation can't support quality bar | Good — clean architecture, zero V1 debt |
| Zustand over React Context | Context re-renders entire tree; Zustand selectors prevent streaming perf death | Good — zero re-renders during 60fps streaming |
| useRef + DOM mutation for streaming tokens | Bypass React reconciler at 100 tokens/sec; flush to state on completion | Good — proven in Playwright E2E |
| content-visibility before virtual scrolling | Preserves DOM for simpler scroll math; pivot to @tanstack/react-virtual if insufficient | Pending — not stress-tested yet |
| Tiered animation: CSS -> LazyMotion -> Full Framer | Keeps initial bundle lean (~5KB) | Pending — full motion bundle not yet needed |
| Inter + Instrument Serif + JetBrains Mono | Editorial warmth without licensing issues | Good — fonts load correctly |
| OKLCH color space | Modern, perceptually uniform, CSS-native | Good — 29 tokens, surface hierarchy works |
| 9 custom ESLint rules | Automated Constitution enforcement from commit #1 | Good — zero violations in codebase |
| WebSocket callback injection (not direct store imports) | Keeps network layer decoupled from React/Zustand | Good — multiplexer is fully testable |
| Multiplexer as pure functions | Zero store/React imports, fully testable with mock callbacks | Good — clean separation |
| React 19 (not 18) | Vite template ships 19, backwards compatible | Good — no issues encountered |
| Segment array architecture for ActiveMessage | Interleaved text spans + ToolChip components | Good — handles complex tool-call streams |
| Two-phase streaming renderer | rAF innerHTML for streaming, react-markdown for finalized | Good — 60fps streaming, rich finalized output |
| DOMPurify over manual sanitization | Industry-standard XSS protection for innerHTML | Good — zero security incidents |
| Custom streaming converter over Streamdown | Streamdown exports React components incompatible with rAF | Good — pure function fits architecture |
| CSS Grid 0fr/1fr for expand/collapse | No JS animation library needed, GPU-accelerated | Good — used across thinking, tools, groups |
| Tools as React components after markdown | Cleaner than rehype marker injection into hast tree | Good — simpler, more maintainable |
| Shiki CSS variables theme | OKLCH tokens drive syntax colors via CSS custom properties | Good — no inline styles, Constitution compliant |
| 5-state composer FSM | Prevents double-send, double-stop, handles abort timeout | Good — zero race conditions |
| Session-scoped permission banners | Prevents cross-session permission leakage | Good — security-correct |
| CSS-only visual effects | SpotlightCard/ShinyText/ElectricBorder without JS animation libs | Good — zero bundle impact |
| 5th Zustand store (file store) | File tree + editor state needs its own store; Constitution amended | Good — clean separation of concerns |
| CSS show/hide for all panels | Mount-once pattern preserves terminal sessions, scroll, editor content | Good — zero state loss on tab switch |
| CodeMirror 6 over Monaco | 5x smaller bundle (~200KB vs ~1MB), modular, V1-proven | Good — fast loads, full language support |
| Separate /shell WebSocket | Terminal independent from chat WS; avoids message interleaving | Good — clean isolation |
| cmdk for command palette | 3KB, headless, keyboard-first, proven ecosystem | Good — works perfectly with fuse.js |
| Client-side staging (Set<string>) | No /api/git/stage endpoint; staging model is client-only | Acceptable — works but diverges from real git staging |
| Module-level ref pattern | Imperative IO (shell input, editor save) via register/deregister | Good — avoids refs-during-render lint violations |
| DiffEditorWrapper data-fetching layer | Keeps DiffEditor pure (props-only), wrapper handles useFileDiff | Good — clean separation |
| tryReconnect() on existing WebSocketClient | Reuses singleton instance instead of re-bootstrapping auth | Good — simpler, no race conditions |
| Connection banner with z-toast fixed positioning | Overlays entire app shell for maximum visibility | Good — always visible |
| Streaming dot priority over draft dot | Visual clarity when both states active | Good — clear signal |
| data-status attribute + CSS for git indicators | No inline styles, Constitution compliant | Good — clean styling |
| Single shared IntersectionObserver | Element→messageId map replaces per-message observers | Good — O(1) overhead vs O(n) |
| 5 vendor chunk groups (react, markdown, shiki, radix, zustand) | Broad groups avoid circular deps while enabling caching | Good — improved cache hits |
| LRU eviction via Map iteration order | Zero-dependency, O(1) oldest-first delete for Shiki cache | Good — simple and effective |
| 0.01ms reduced-motion override (not 0ms) | Preserves JS animationend/transitionend events | Good — no broken event handlers |
| useSyncExternalStore for LiveAnnouncer | Satisfies React 19 lint rules for external state | Good — correct React pattern |

---
*Last updated: 2026-03-17 after v1.3 milestone completion*
