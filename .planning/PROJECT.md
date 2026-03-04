# Loom V2

## What This Is

Loom is a premium web interface for AI coding agents (Claude Code, Gemini, Codex) that transforms the black-box CLI experience into a visually stunning, multi-agent workspace. It consumes the existing CloudCLI Node.js backend while providing a from-scratch React frontend built to a 10/10 quality standard. The goal is not just functional parity with the CLI — it's making the agent's work *visible and beautiful*: satisfying tool call animations, clear MCP interactions, elegant code streaming, and a design that makes you want to come back purely for how it looks.

## Core Value

Make AI agent work visible, beautiful, and controllable — every tool call, every code write, every MCP interaction should be a satisfying visual experience that enhances understanding of what the agent is doing.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

(None yet — ship to validate)

### Active

**Core Chat Experience**
- [ ] Send messages and receive streaming AI responses with smooth scroll anchoring
- [ ] Tool call display with stateful animations (running → success → error)
- [ ] Thinking/reasoning block display with expand/collapse
- [ ] Markdown rendering with syntax-highlighted code blocks
- [ ] Session management (create, switch, browse history)
- [ ] Settings panel (appearance, agents, API configuration)
- [ ] Error handling with graceful degradation (3-tier error boundaries)
- [ ] Connection management with reconnection and status display

**Design System & Visual Excellence**
- [ ] Comprehensive design token system (CSS custom properties, OKLCH color space)
- [ ] Surface hierarchy via lightness steps (no drop shadows)
- [ ] Spring physics animations on all interactions
- [ ] Satisfying tool call card animations with state machine transitions
- [ ] Message entrance animations (spring translateY + opacity)
- [ ] Streaming aurora/ambient effects during AI response generation
- [ ] Typography system: Inter (UI), Instrument Serif (editorial), JetBrains Mono (code)
- [ ] Award-winning level visual design — the kind that centers a marketing campaign

**Multi-Provider Tabbed Workspaces**
- [ ] Tabbed interface: work with Claude in one tab, Gemini in another, simultaneously
- [ ] Background tasks continue when tab is not active (with notifications on completion)
- [ ] Shared context: Gemini tab can access Claude conversation context for parallel exploration
- [ ] Real-time visibility into what each agent is doing (no black box)

**GSD Visual Dashboard**
- [ ] Visual build pipeline showing phases, progress, task status
- [ ] Agent assignment visibility (which agent owns which phase/task)
- [ ] Phase handoff between Claude and Gemini based on task type
- [ ] Native GSD orchestration from within the UI

**Plugin/MCP Management**
- [ ] UI for managing installed MCP servers (enable, disable, configure)
- [ ] UI for managing Claude Code plugins and skills
- [ ] Visual display of active MCP connections and their status

**Nextcloud Integration**
- [ ] File picker to attach Nextcloud files to chat messages
- [ ] Screenshot upload from phone → directly into chat via Nextcloud
- [ ] File sharing/hosting through Nextcloud for agent file operations
- [ ] Browse Nextcloud files within the app

**Companion System**
- [ ] Animated pixel-art companion characters (tanuki, red panda, and/or Shiba Inu)
- [ ] Multiple animation states reacting to system events (thinking, success, error, idle)
- [ ] Pre-sourced sprite libraries from itch.io or similar (not AI-generated)
- [ ] Pending feasibility assessment before architectural commitment

**CodeRabbit Integration**
- [ ] PR review and management from within the app
- [ ] Local code review before pushing to GitHub
- [ ] Issue and suggestion management for open source repos

### Out of Scope

- **Mobile-native app** — Web-first, responsive design handles mobile access
- **Self-hosted multi-user** — Single-user tool for the developer who runs it
- **AI model training/fine-tuning** — Loom consumes models, doesn't train them
- **Full IDE replacement** — Not trying to replace VS Code/Cursor, complementing them
- **Arbitrary LLM provider support** — Claude, Gemini, Codex only (backend already supports these)

## Context

**Technical Environment:**
- Existing CloudCLI Node.js backend on port 5555 with Express, JWT auth, SQLite
- WebSocket for chat streaming and terminal, SSE for git clone progress only
- 47+ REST endpoints across 14 route files (fully documented in BACKEND_API_CONTRACT.md)
- Multi-provider: Claude (SDK), Codex (child process), Gemini (child process)
- Server: AMD Ryzen 7, 27GB RAM, no discrete GPU, Tailscale network access

**Prior Work:**
- V1 frontend exists as CloudCLI fork, rated 5.5/10 in audits
- V1 has 40+ source files with 17 tool display configs, 7 message types, 5 tabs
- Loom-original features: aurora overlay, turn grouping, tool action cards, Catppuccin theme, activity status
- 8 planning/audit documents from Gemini analyzing architecture, UX, and reference apps
- 6 reference product analyses (Claude.ai, ChatGPT, Perplexity, Open WebUI, LobeChat, LibreChat)
- 106 chat interface requirements cataloged across 16 categories
- Architectural consensus reached between Claude and Gemini architects (ARCHITECT_SYNC.md)
- V2 Constitution drafted with 12 sections of enforceable coding conventions

**Previous Attempt Lessons:**
- V1 GSD project failed due to accumulated quality issues across phases
- Hardcoded styles, inconsistent patterns, and foundation rot made fixing harder than rewriting
- Key learning: architecture must be designed for final vision from Phase 1, enforcement must be automated, phases must be small enough to verify thoroughly
- Companion system sprite generation via AI failed — need pre-made sprite libraries

## Constraints

- **Backend**: Keep existing CloudCLI Node.js server — no backend rewrite. Frontend is the only deliverable.
- **Tech Stack**: Vite + React 18 + TypeScript, Tailwind v4, Zustand (4 stores), Vitest
- **Quality Bar**: Every phase must pass automated linting, TypeScript strict mode, regression tests, and visual review. No "good enough" — 10/10 or iterate.
- **Process**: GSD methodology with smaller phases (3-5 tasks), machine-enforced conventions, regression gates, visual verification at milestone boundaries.
- **Design**: No hardcoded colors, no inline styles for static values, no z-index outside dictionary, all animations through defined easing tokens. Constitution enforced via ESLint.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Full frontend rewrite (not fork iteration) | Fork divergence makes merging impossible; current foundation can't support quality bar | — Pending |
| Zustand over React Context | Context re-renders entire tree on any change; Zustand selectors prevent streaming perf death | — Pending |
| useRef + DOM mutation for streaming tokens | Bypass React reconciler at 100 tokens/sec; flush to state on stream completion | — Pending |
| content-visibility before virtual scrolling | Preserves DOM for simpler scroll math; pivot to @tanstack/react-virtual if insufficient | — Pending |
| Tiered animation: CSS → LazyMotion → Full Framer | Keeps initial bundle lean (~5KB) while having spring physics where needed | — Pending |
| Inter + Instrument Serif + JetBrains Mono | Editorial warmth without licensing issues (Instrument Serif free vs Tiempos $200+) | — Pending |
| Pre-sourced sprites for companions | AI-generated sprites failed in V1; itch.io libraries have professional quality | — Pending |
| Tabbed workspaces over split pane for multi-agent | Simpler to implement, still provides parallel work experience | — Pending |
| Nextcloud in roadmap, CodeRabbit deferred | Nextcloud is daily-use integration; CodeRabbit is nice-to-have | — Pending |

---
*Last updated: 2026-03-04 after V2 initialization*
