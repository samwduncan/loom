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

### Validated (v1.4)

- ✓ Session intelligence (SESS-01 through SESS-09) — auto-titles, project grouping, date subgroups, junk filtering, search, pinning, bulk delete — v1.4
- ✓ Broken feature fixes (FIX-01 through FIX-04) — @-mention file context, search highlighting, dead code removal, persist NaN — v1.4
- ✓ Backend hardening (BACK-01 through BACK-04) — auth auto-retry, session title endpoint, systemd service, WebSocket heartbeat — v1.4
- ✓ Persist layer audit (PERS-01, PERS-02) — deep merge functions, rehydration safety tests — v1.4
- ✓ E2E verification (E2E-01 through E2E-11) — 18 Playwright specs covering permissions, tokens, images, export, retry, git, settings, collapse, navigate guard — v1.4

### Validated (v1.5)

- ✓ Settings refactor (useFetch<T> generic hook, SettingsTabSkeleton) — v1.5
- ✓ Comprehensive UI audit: loading states, error states, empty states — v1.5
- ✓ Consistent hover/focus/disabled states, accessibility refinements — v1.5
- ✓ Spring physics on sidebar, modals, tool cards — v1.5
- ✓ Glass surface on modals and command palette — v1.5

### Validated (v2.0)

- ✓ SQLite cache layer (cache.db) with schema versioning, prepared statements, write-through population — v2.0
- ✓ State persistence — last session, scroll position, sidebar state survive browser restarts — v2.0
- ✓ Live session attach — JSONL file watcher (SessionWatcher singleton), real-time streaming output — v2.0
- ✓ Mobile-responsive UX — sidebar drawer, touch targets, gesture swipe, responsive breakpoints — v2.0
- ✓ Performance — lazy loading, optimistic updates, request deduplication, instant transitions — v2.0
- ✓ iOS app research — Capacitor 7.6.1 scaffold, deployment model assessment, Tailscale DNS analysis — v2.0
- ✓ Follow-up suggestions — client-side regex heuristics, category-based recommendations — v2.0
- ✓ Production deployment — nginx reverse proxy, brotli/gzip, immutable caching, deploy.sh, graceful shutdown — v2.0
- ✓ iOS mobile fixes — viewport-fit, safe-area, keyboard avoidance (visualViewport hack), WKWebView compat — v2.0

### Validated (v2.1)

- ✓ Capacitor Keyboard plugin — native keyboard events replace visualViewport hack (Phase 60)
- ✓ Platform foundation — IS_NATIVE, API_BASE, WS_BASE, URL abstraction, CORS (Phase 59)
- ✓ Touch targets & native plugins — 44px+ targets, StatusBar, SplashScreen, safe-area audit (Phase 61)
- ✓ Haptics & motion — haptic feedback on send/tool/error/selection, 120Hz ProMotion opt-in (Phase 62)
- ✓ Bundled assets mode — cap-build.sh, on-device validation (Phase 63)
- ✓ WKWebView layout fixes — minmax(0,1fr) grid bug, GPU compositing, scroll optimizations (hotfix)
- ✓ Infrastructure — nginx dist symlink, CORS port 8184, backend restart (hotfix)

### Active

**Current Milestone: v2.2 "The Touch"**

**Goal:** Transform Loom from a scaled-down desktop app into a purpose-built iOS daily-driver — every element sized, spaced, and animated for touch on iPhone 16 Pro Max.

**Target features:**
- [ ] Touch target compliance — Fix 7 violations (ThinkingDisclosure, ToolCard headers, ProjectHeader, template buttons, Detach button, DateGroupHeader font, export buttons)
- [ ] Typography & spacing — Mobile-optimized font sizes, session list density, date formatting, title truncation
- [ ] Scroll performance — 60fps validated on real device with 50+ messages, content-visibility, compositor optimization
- [ ] iOS-native gestures — Swipe-to-delete sessions, pull-to-refresh, long-press context menus, broader haptics
- [ ] Visual polish — OLED-optimized backgrounds, glass effects tuned for WKWebView, 120Hz spring refinements, contrast compliance
- [ ] 39 requirements across TOUCH/TYPO/SCROLL/GESTURE/VISUAL categories (see REQUIREMENTS.md)

**Future milestones:**
- v2.3 "The Power" — Multi-provider tabs, MCP management
- v2.4 "The Polish" — Full visual transformation (aurora, WebGL, Tier 2/3 effects, comprehensive springs)
- v3.0 "The Vision" — GSD dashboard, Nextcloud, companions

### Out of Scope

- **Multi-user / auth system** — Single-user tool; backend already handles auth
- **AI model training** — Loom consumes models, doesn't train them
- **Full IDE replacement** — Complements VS Code/Cursor, doesn't replace
- **Light mode** — Dark-only for M1-M3; potential M5 stretch goal
- **Arbitrary LLM providers** — Claude, Gemini, Codex only (backend constraint)
- **Character-by-character typewriter** — Anti-pattern; use batch rendering via rAF buffer
- **Conversation branching** — Reconsidering for v2.1+ (competitive parity)

## Context

**Current State (post v2.1):**
- ~55,000 LOC TypeScript + CSS across 65 phases (9 milestones)
- Tech stack: Vite 7 + React 19 + TypeScript, Tailwind v4, Zustand (5 stores), Vitest
- ~1450 commits, 26-day total build (2026-03-04 to 2026-03-29)
- 141 test files, 1476 tests, 9 custom ESLint rules
- Phase 65 complete: 44px mobile touch targets on all interactive elements, focus rings standardized to shadcn pattern
- Dependencies: react-markdown, shiki, DOMPurify, diff, shadcn/ui (15 primitives), tailwindcss-animate, cmdk, fuse.js, @codemirror/*, @xterm/*, better-sqlite3
- Frontend at `src/`, backend at `server/` (port 5555)
- Dev server: port 5184, production nginx on port 5580 (via Tailscale Serve :5443)
- Full workspace with: chat, file tree, code editor, terminal, git panel, settings, command palette, @-mentions, slash commands, quick settings, accessibility, performance optimizations
- SQLite cache layer for sub-second session loads, live session attach via JSONL file watcher
- Mobile-responsive: sidebar drawer, touch targets, safe-area, keyboard avoidance (visualViewport hack)
- Capacitor 7.6.1 scaffold ready, server.url mode working on iPhone 16 Pro Max
- WCAG AA contrast compliance, full keyboard navigation, screen reader support
- Backend: auth auto-retry, WebSocket heartbeat, systemd auto-start, graceful shutdown, deploy.sh pipeline

**Known Tech Debt:**
- CMD-14 deferred: recent commands need command registry for re-execution
- SET-07 backend limitation: API key add form has name field only
- GIT-04 intentional: client-side staging Set<string> (no /api/git/stage endpoint)
- fileMentions WS field sent but backend reads files server-side (text prefix workaround)
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

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-29 after Phase 65 (touch target compliance) completion*
