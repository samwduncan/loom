# Loom

## What This Is

Loom is a premium, self-hostable web UI for Claude Code and Gemini CLI, forked from CloudCLI. It transforms a capable but generic web interface into a crafted, dense, professional developer tool — warm earthy aesthetics, Claude.ai-level density, and Linear-level attention to detail. Anyone can self-host it to access their AI coding assistants from any browser.

## Core Value

The chat interface must feel **designed, not generated** — every interaction, animation, and pixel serves the developer experience. If the UI doesn't make you want to use it over the raw terminal, it's not done.

## Current Milestone: v1.1 Design Overhaul

**Goal:** Transform every surface of the app with a new premium dark palette (charcoal base, cream text, dusty rose accent), complete the remaining functional features (streaming UX, error handling), and achieve A+ craft quality across density, animations, typography, and spacing.

**Target features:**
- New design system — near-black charcoal base, cream/white text, dusty rose/muted pink accent replacing warm earthy palette entirely
- Full color sweep — every component, panel, and surface migrated to new palette
- Terminal and editor theming — Catppuccin Mocha ANSI + charcoal-matching background
- Sidebar and global polish — dense, professional, every modal and dialog restyled
- Streaming UX completion — smart auto-scroll, scroll pill, typing indicators, skeleton shimmer
- Error handling and status — toasts, inline banners, global status line, stop button
- Micro-interactions and motion — hover states, transitions, expand/collapse animations
- Competitive parity — informed by Open WebUI, Claude.ai, ChatGPT, Perplexity analysis

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

<!-- v1.1 — Design Overhaul -->

- [ ] New design system — charcoal base (#1a1a1a–#222222), cream text, dusty rose accent
- [ ] Full color sweep — all components migrated from warm earthy to new palette
- [ ] Terminal Catppuccin Mocha ANSI palette matching new dark base
- [ ] CodeMirror warm dark theme matching new palette
- [ ] Sidebar density and visual polish with new palette
- [ ] Settings, modals, and dialogs restyled with new palette
- [ ] Mobile navigation consistency with new theme
- [ ] Streaming UX — smart auto-scroll, scroll pill, typing indicators, skeleton shimmer
- [ ] Error handling — toasts (transient), inline banners (permanent), global status line
- [ ] Stop generation button (replace send during streaming)
- [ ] Micro-interactions — transitions, hover states, expand/collapse animations
- [ ] Competitive-informed design — patterns from Open WebUI, Claude.ai, ChatGPT, Perplexity

### Out of Scope

- Companion mascot system (Spool & friends) — no PixelLab API budget, revisit later
- Mobile-native app — web PWA is sufficient
- Additional AI providers beyond Claude + Gemini — focused scope
- Video/voice features — text-first tool
- Self-hosted auth complexity (OAuth, SSO) — JWT is sufficient for self-hosted
- Light mode / theme switching — single dark theme is the brand identity
- Warm earthy palette — replaced by charcoal + rose direction in v1.1

## Context

**Origin:** Forked from [siteboon/claudecodeui](https://github.com/siteboon/claudecodeui) (CloudCLI) — GPL-3.0 licensed, 7.4K stars, actively maintained. The fork inherits a complete, working web UI with chat, file explorer, git integration, terminal, session management, and multi-provider AI support.

**Why fork:** CloudCLI works but looks generic. The UI is spacious and functional but lacks the craft and density of tools like Claude.ai or Linear. Loom's thesis is that a developer's AI chat interface should feel as polished as the best developer tools — warm, dense, intentional.

**Design language (v1.1):**
- **Palette:** Near-black charcoal base (#1a1a1a–#222222), cream/white text, dusty rose/muted pink accent (~#D4736C / #C97B7B range)
- **Previous palette (v1.0):** Warm earthy (chocolate browns, amber, copper) — superseded
- **Terminal:** Catppuccin Mocha ANSI colors on matching charcoal background
- **Typography:** JetBrains Mono, compact line heights, professional spacing
- **Reference products:** Open WebUI, Claude.ai, ChatGPT (post-GPT5), Perplexity
- **Quality bar:** A+ execution — density, animations, typography, spacing, micro-interactions. Every pixel intentional

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
| Replace warm earthy palette with charcoal + rose | User wants premium dark base with dusty rose accent, informed by competitive analysis | — Pending |
| Full app redesign scope | Every surface — chat, sidebar, terminal, settings, modals, mobile | — Pending |
| Bundle remaining functional work into v1.1 | Streaming UX + error handling complete the experience alongside visual overhaul | — Pending |

---
*Last updated: 2026-03-03 after milestone v1.1 initialization*
