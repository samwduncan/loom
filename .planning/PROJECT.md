# Loom

## What This Is

Loom is a premium, self-hostable web UI for Claude Code and Gemini CLI, forked from CloudCLI. It transforms a capable but generic web interface into a crafted, dense, professional developer tool — warm earthy aesthetics, Claude.ai-level density, and Linear-level attention to detail. Anyone can self-host it to access their AI coding assistants from any browser.

## Core Value

The chat interface must feel **designed, not generated** — every interaction, animation, and pixel serves the developer experience. If the UI doesn't make you want to use it over the raw terminal, it's not done.

## Requirements

### Validated

<!-- Inherited from CloudCLI fork — existing and working -->

- ✓ Chat interface with real-time streaming — existing (CloudCLI)
- ✓ Markdown rendering (react-markdown + rehype/remark) — existing
- ✓ Syntax highlighting (CodeMirror 6) — existing
- ✓ File explorer with file viewer — existing
- ✓ Git integration (stage, commit, diff, branches) — existing
- ✓ Terminal emulator (xterm.js + node-pty) — existing
- ✓ Session management with SQLite persistence — existing
- ✓ Project auto-discovery from ~/.claude/ — existing
- ✓ WebSocket real-time communication — existing
- ✓ JWT + bcrypt authentication system — existing
- ✓ MCP server management UI — existing
- ✓ Responsive design + PWA + mobile support — existing
- ✓ TaskMaster AI integration — existing
- ✓ Claude Code backend (CLI subprocess + Agent SDK) — existing
- ✓ Gemini CLI backend — existing

### Active

- [ ] Warm earthy color palette (chocolate browns, amber, copper, terracotta)
- [ ] Dense, professional layout matching Claude.ai structure with more data per screen
- [ ] Chat view significant redesign — collapsible turns, grouped tool calls, thinking block disclosures
- [ ] VS Code Dark+ syntax highlighting for code blocks with copy-to-clipboard
- [ ] Diff rendering (colored unified diffs with file headers and hunk markers)
- [ ] Tool call cards (compact inline, expandable, grouped 3+, error accents)
- [ ] Thinking blocks as collapsed disclosures (pulsing indicator while active)
- [ ] Streaming UX polish (typing dots, token-by-token, skeleton shimmer on reconnect)
- [ ] Smart auto-scroll with scroll-to-bottom pill ("N new messages")
- [ ] Terminal Catppuccin Mocha theme blending with app dark theme
- [ ] Typography overhaul (JetBrains Mono, tighter line heights, dev tool density)
- [ ] Strip i18n — English only, reduce complexity
- [ ] Strip Cursor and OpenAI Codex backends — Claude + Gemini only
- [ ] Collapsible completed turns (first line + count badge, click to expand)
- [ ] User message copy button for grabbing previous prompts
- [ ] Permission prompts as inline banners
- [ ] Usage summaries always visible (token counts, cost per response)
- [ ] System status messages muted and color-coded (gray info, amber warning, red error)
- [ ] Toast for transient errors, inline banner for permanent errors
- [ ] Global status line showing current activity
- [ ] Sidebar polish and density improvements

### Out of Scope

- Companion mascot system (Spool & friends) — no PixelLab API budget, revisit later
- Mobile-native app — web PWA is sufficient
- Additional AI providers beyond Claude + Gemini — focused scope
- Video/voice features — text-first tool
- Self-hosted auth complexity (OAuth, SSO) — JWT is sufficient for self-hosted

## Context

**Origin:** Forked from [siteboon/claudecodeui](https://github.com/siteboon/claudecodeui) (CloudCLI) — GPL-3.0 licensed, 7.4K stars, actively maintained. The fork inherits a complete, working web UI with chat, file explorer, git integration, terminal, session management, and multi-provider AI support.

**Why fork:** CloudCLI works but looks generic. The UI is spacious and functional but lacks the craft and density of tools like Claude.ai or Linear. Loom's thesis is that a developer's AI chat interface should feel as polished as the best developer tools — warm, dense, intentional.

**Design language:**
- **Palette:** Deep chocolate brown (#1c1210) base, warm surfaces (#2a1f1a, #3d2e25), cream/beige text (#f5e6d3, #c4a882), amber/copper/terracotta accents (#d4a574, #c17f59, #b85c3a)
- **Terminal:** Catppuccin Mocha ANSI colors on matching dark background
- **Typography:** JetBrains Mono, compact line heights, professional spacing
- **Reference:** "Claude.ai structure but denser and more data-rich — a developer's Claude.ai"
- **Quality bar:** A+ execution. Every component should feel designed, not just functional

**Tech stack (inherited from CloudCLI):**
- Frontend: React 18 + TypeScript + Vite + Tailwind CSS + CSS Variables (HSL)
- Backend: Node.js + Express + WebSocket + SQLite (better-sqlite3)
- Terminal: xterm.js + node-pty
- Markdown: react-markdown + rehype + remark
- Code: CodeMirror 6
- UI components: CVA (class-variance-authority) + Tailwind Merge

**Deployment:** Self-hosted on personal server, accessed via Tailscale (100.86.4.57). Dev server on port 3001. Eventually packaged for easy self-hosting by others.

## Constraints

- **License**: GPL-3.0 (inherited from CloudCLI) — all modifications must remain open-source
- **No GPU**: Server has AMD Ryzen 7 with Radeon 780M iGPU, no discrete GPU — no local AI image generation
- **Styling**: Must work within Tailwind + CSS Variables system (no migration to CSS Modules or styled-components)
- **Framework**: Stay on React (no migration to Preact or other frameworks)
- **Backend**: Keep Express + WebSocket architecture (no rewrite to different server framework)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Fork CloudCLI instead of building from scratch | Saves months of plumbing work (auth, sessions, WebSocket, file explorer, git) | — Pending |
| Keep Tailwind CSS | Existing codebase uses it, migration would be massive, CSS variables handle theming | — Pending |
| Strip i18n | English only reduces complexity, removes ~20% of component code | — Pending |
| Strip Cursor + Codex | Focused scope, less code to maintain, Claude + Gemini covers needs | — Pending |
| Keep TaskMaster integration | Useful for project management workflows | — Pending |
| GPL-3.0 license | Inherited from upstream, acceptable for open-source project | — Pending |

---
*Last updated: 2026-03-01 after initialization*
