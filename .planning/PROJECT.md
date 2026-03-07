# Loom V2

## What This Is

Loom is a premium web interface for AI coding agents (Claude Code, Gemini, Codex) that transforms the black-box CLI experience into a visually stunning, multi-agent workspace. Built on a from-scratch React frontend with a 10/10 quality standard, consuming the existing CloudCLI Node.js backend. The architectural skeleton is complete with OKLCH design tokens, enforced coding conventions, streaming at 60fps, and a pluggable tool registry.

## Core Value

Make AI agent work visible, beautiful, and controllable — every tool call, every code write, every MCP interaction should be a satisfying visual experience that enhances understanding of what the agent is doing.

## Requirements

### Validated

- v1.0 Design Token System (DS-01 through DS-06) — 29 OKLCH color tokens, motion springs, spacing scale, z-index dictionary, typography, surface hierarchy
- v1.0 Enforcement (ENF-01 through ENF-04) — 9 custom ESLint rules, TypeScript strict, Vitest, pre-commit gates
- v1.0 App Shell (SHELL-01 through SHELL-04) — CSS Grid layout, 100dvh viewport, React Router, 3-tier error boundaries
- v1.0 State Architecture (STATE-01 through STATE-05) — 4 Zustand stores, M1-M5 interfaces, selector enforcement, persistence
- v1.0 Streaming (STRM-01 through STRM-04) — WebSocket client, stream multiplexer, rAF buffer, proof-of-life
- v1.0 Components (COMP-01 through COMP-03) — Tool registry, ActiveMessage, scroll anchor
- v1.0 Navigation (NAV-01, NAV-02) — Sidebar with sessions, session switching with message loading

### Active

**Core Chat Experience (M2)**
- [ ] All 7 message types render correctly (user, assistant, tool, thinking, error, system, task_notification)
- [ ] Tool cards with state machine animations (running -> success -> error)
- [ ] Thinking/reasoning blocks with expand/collapse
- [ ] Markdown rendering with syntax-highlighted code blocks (Shiki)
- [ ] Composer: auto-resize, send/stop morph, image paste/upload
- [ ] Activity status line ("Reading auth.ts...", "Writing server.js...")
- [ ] Session switching with real data (connected to backend)

**Visual Excellence (M3)**
- [ ] Spring physics animations on all interactions
- [ ] Message entrance animations (spring translateY + opacity)
- [ ] Streaming aurora/ambient effects
- [ ] Scroll physics perfected (zero jitter at 100 tokens/sec)
- [ ] Cmd+K command palette
- [ ] Sidebar slim collapse mode
- [ ] Settings panel (appearance, agents, API)
- [ ] Full accessibility pass (ARIA, keyboard nav, prefers-reduced-motion)

**Multi-Provider (M4)**
- [ ] Tabbed interface for simultaneous Claude/Gemini/Codex work
- [ ] Background task execution with tab notifications
- [ ] Shared context between provider tabs
- [ ] MCP server management UI

**Integrations (M5)**
- [ ] GSD visual dashboard
- [ ] Nextcloud integration (file picker, screenshot upload)
- [ ] Companion system (conditional on feasibility)
- [ ] CodeRabbit integration

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

**Current State (post v1.0):**
- 14,423 LOC TypeScript + CSS across 10 phases, 21 plans
- Tech stack: Vite + React 19 + TypeScript, Tailwind v4, Zustand (4 stores), Vitest
- 145 commits, 3-day build (2026-03-04 to 2026-03-07)
- 359+ tests passing, Playwright E2E suite, 9 custom ESLint rules
- Frontend at `src/`, backend at `server/` (port 5555)
- Dev server: port 5184

**Prior Work:**
- V1 frontend rated 5.5/10 in audits, archived to `.planning/v1-archive/`
- 8 planning/audit documents, 6 reference product analyses
- Architectural consensus between Claude and Gemini architects (ARCHITECT_SYNC.md)
- V2 Constitution with 12 sections of enforceable conventions

## Constraints

- **Backend**: Keep existing CloudCLI Node.js server — no backend rewrite
- **Tech Stack**: Vite + React 19 + TypeScript, Tailwind v4, Zustand (4 stores), Vitest
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

---
*Last updated: 2026-03-07 after v1.0 milestone*
