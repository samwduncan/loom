# Loom V2

## What This Is

Loom is a premium web interface for AI coding agents (Claude Code, Gemini, Codex) that transforms the black-box CLI experience into a visually stunning, multi-agent workspace. Built on a from-scratch React frontend with a 10/10 quality standard, consuming the existing CloudCLI Node.js backend. The full conversation experience is shipped — rich markdown with Shiki syntax highlighting, 6 purpose-built tool cards with state machines, streaming at 60fps, auto-resize composer with image attachments, permission banners, activity status, and CSS visual effects.

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

### Active

**Current Milestone: v1.2 "The Workspace"**

**Goal:** Make Loom a usable daily-driver by building the workspace panels that V1 had — settings, command palette, file tree, terminal, git panel, and code editor.

**Target features:**
- [ ] Settings panel (appearance, agents, API keys)
- [ ] Cmd+K command palette
- [ ] File Tree panel with file browsing
- [ ] Code Editor (CodeMirror/Monaco)
- [ ] Terminal / Shell (xterm.js + WebSocket)
- [ ] Git Panel (changes, staging, commit, history)

**Future milestones:**
- M4 "The Polish" — Spring physics, Aurora effects, glass surfaces, a11y, perf audit
- M5 "The Power" — Multi-provider tabs, MCP management
- M6 "The Vision" — GSD dashboard, Nextcloud, companions, CodeRabbit

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

**Current State (post v1.1):**
- 24,786 LOC TypeScript + CSS across 19 phases, 47 plans (2 milestones)
- Tech stack: Vite + React 19 + TypeScript, Tailwind v4, Zustand (4 stores), Vitest
- 303 commits (145 M1 + 158 M2), 6-day total build (2026-03-04 to 2026-03-09)
- 700+ tests passing, Playwright E2E suite, 9 custom ESLint rules
- Dependencies: react-markdown, shiki, DOMPurify, diff, shadcn/ui primitives, tailwindcss-animate
- Frontend at `src/`, backend at `server/` (port 5555)
- Dev server: port 5184

**Known Tech Debt:**
- rehypeToolMarkers plugin runs as no-op (tools render as React components post-markdown)
- highlightText not threaded into MarkdownRenderer for assistant body content (search filtering works, visual highlighting deferred)

**Prior Work:**
- V1 frontend rated 5.5/10 in audits, archived to `.planning/v1-archive/`
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
| Two-phase streaming renderer | rAF innerHTML for streaming, react-markdown for finalized | Good — 60fps streaming, rich finalized output |
| DOMPurify over manual sanitization | Industry-standard XSS protection for innerHTML | Good — zero security incidents |
| Custom streaming converter over Streamdown | Streamdown exports React components incompatible with rAF | Good — pure function fits architecture |
| CSS Grid 0fr/1fr for expand/collapse | No JS animation library needed, GPU-accelerated | Good — used across thinking, tools, groups |
| Tools as React components after markdown | Cleaner than rehype marker injection into hast tree | Good — simpler, more maintainable |
| Shiki CSS variables theme | OKLCH tokens drive syntax colors via CSS custom properties | Good — no inline styles, Constitution compliant |
| 5-state composer FSM | Prevents double-send, double-stop, handles abort timeout | Good — zero race conditions |
| Session-scoped permission banners | Prevents cross-session permission leakage | Good — security-correct |
| CSS-only visual effects | SpotlightCard/ShinyText/ElectricBorder without JS animation libs | Good — zero bundle impact |

---
*Last updated: 2026-03-09 after v1.2 milestone started*
