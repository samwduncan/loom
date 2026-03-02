# Requirements: Loom

**Defined:** 2026-03-01
**Core Value:** The chat interface must feel designed, not generated — every interaction, animation, and pixel serves the developer experience.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Design System

- [x] **DSGN-01**: App uses warm earthy CSS palette — deep chocolate brown (#1c1210) base, warm surfaces (#2a1f1a, #3d2e25), cream/beige text (#f5e6d3, #c4a882), amber/copper/terracotta accents (#d4a574, #c17f59, #b85c3a)
- [x] **DSGN-02**: All CSS variables use correct HSL `<alpha-value>` contract so Tailwind opacity modifiers work correctly (e.g., `bg-primary/50`)
- [x] **DSGN-03**: Typography uses JetBrains Mono as primary monospace font with fallback chain (Fira Code, Cascadia Code, monospace)
- [x] **DSGN-04**: Layout follows dense 4-8px grid spacing — compact padding, tight line heights, maximum information per screen
- [x] **DSGN-05**: Scrollbar styling matches warm dark theme (subtle, thin, warm-tinted track and thumb)
- [ ] **DSGN-06**: All 86+ files with hardcoded Tailwind color classes (bg-blue-500, text-gray-*, etc.) replaced with semantic aliases from CSS variable system
- [x] **DSGN-07**: Status colors are warm-tinted — connected (#6bbf59), reconnecting (#d4a574), disconnected (#c15a4a), error accents use terracotta
- [x] **DSGN-08**: Borders use subtle rgba transparency (rgba(196, 168, 130, 0.15)) for warm-tinted separation lines

### Chat Rendering

- [x] **CHAT-01**: Code blocks use Shiki v4 with VS Code Dark+ theme for syntax highlighting — 99% VS Code token parity
- [x] **CHAT-02**: Code blocks display language label in header, copy-to-clipboard button with success state feedback
- [x] **CHAT-03**: Completed AI turns are collapsible — first line of response text + count badge (e.g., "I'll fix the auth... [+12 tool calls]"), click to expand full turn
- [x] **CHAT-04**: Tool call invocations render as compact inline action cards — single-line showing tool name + key argument (e.g., "Read — src/auth/login.ts"), expandable to show full arguments and nested result
- [x] **CHAT-05**: 3+ consecutive tool calls grouped under a typed summary header (e.g., "3 tool calls: 2 Read, 1 Edit") — expandable to show each card individually
- [x] **CHAT-06**: Tool cards with errors display red left border or red-tinted background with error message inline in expanded card
- [x] **CHAT-07**: Bash tool calls render in terminal-styled dark mini-blocks — command shown monospace, output as pre-formatted text
- [x] **CHAT-08**: Thinking blocks render as collapsed disclosure widgets — clickable "Thinking..." bar, collapsed by default, expandable to show full reasoning with muted styling
- [x] **CHAT-09**: Diff events render as colored unified diffs — green additions, red removals, gray context lines, file path header, hunk headers
- [x] **CHAT-10**: User messages have subtle warm background tint to visually differentiate from AI messages
- [x] **CHAT-11**: User messages have a small copy button to grab previous prompts
- [x] **CHAT-12**: Permission prompts render as highlighted inline banners within message flow showing tool name and action
- [x] **CHAT-13**: Usage summaries (token counts, cost) always visible at the end of each AI response, not collapsed
- [x] **CHAT-14**: System status messages render muted and inline — gray for info, amber for warnings, red for errors
- [x] **CHAT-15**: Messages use full-width blocks (not left/right bubbles), role label only ("You" / "Claude" / "Gemini"), max-width ~720px centered
- [x] **CHAT-16**: AI turns flow as continuous blocks — tool calls, thinking, code, prose within one visual unit with subtle dividers, no gaps

### Streaming & Status UX

- [ ] **STRM-01**: AI responses stream token-by-token using requestAnimationFrame buffer (50-100ms batching) to prevent per-token setState freezing
- [ ] **STRM-02**: Smart auto-scroll — auto-scroll while user is at bottom (within 10px threshold); stop if user scrolls up; use CSS overflow-anchor for position preservation
- [ ] **STRM-03**: Floating scroll-to-bottom pill appears when user is scrolled away — shows "N new messages" count, disappears when user reaches bottom
- [ ] **STRM-04**: Typing indicator (pulsing dots or similar) shown before text starts streaming, transitions seamlessly into streaming content
- [ ] **STRM-05**: Pulsing "Thinking..." indicator during extended thinking phases — transitions into collapsed thinking block disclosure when complete
- [ ] **STRM-06**: Skeleton shimmer placeholder bars shown during reconnect scrollback load — fades to real content when parsed
- [ ] **STRM-07**: Toast notifications for transient errors (reconnecting, temporary failures) — positioned consistently, auto-dismiss
- [ ] **STRM-08**: Inline banner for permanent errors (process crash, exit code) — persistent, distinct from toast, red-accented
- [ ] **STRM-09**: Global status line at bottom showing current activity (e.g., "Running: Edit src/auth/login.ts"), spinner on active tool card
- [ ] **STRM-10**: Stop generation button replaces send button while AI is responding — sends abort signal through WebSocket to backend

### Cleanup & Fork Governance

- [x] **FORK-01**: i18n stripped from all 43 components — `useTranslation` calls replaced with English string literals
- [x] **FORK-02**: Cursor CLI backend integration removed — all Cursor-specific code, routes, and UI elements deleted
- [x] **FORK-03**: Codex KEPT — three providers remain (Claude, Codex, Gemini). Provider UX features added: default-to-Claude, header dropdown, composer picker, welcome screen, per-provider model memory
- [x] **FORK-04**: Upstream-sync branch established and documented — strategy for cherry-picking security/bug fixes from upstream CloudCLI without conflicts
- [x] **FORK-05**: GPL-3.0 license maintained with proper attribution — LICENSE file updated with fork notice, NOTICE file if required

### Terminal & Editor

- [ ] **TERM-01**: xterm.js terminal uses Catppuccin Mocha ANSI palette — all 16 colors configured via ITheme JavaScript object (not CSS)
- [ ] **TERM-02**: Terminal background (#1c1210) matches app background — terminal blends into app, not a black box embedded in it
- [ ] **TERM-03**: Terminal uses JetBrains Mono font, cursor bar style, 14px font size, 1.2 line height
- [ ] **TERM-04**: CodeMirror file viewer uses warm dark theme matching the overall palette — consistent with chat code blocks

### Sidebar & Global UI

- [ ] **SIDE-01**: Sidebar uses warm earthy palette with density improvements — tighter spacing, smaller fonts for metadata, compact project/session list
- [ ] **SIDE-02**: Settings panel restyled to match warm dark theme
- [ ] **SIDE-03**: Mobile navigation restyled to match warm dark theme
- [ ] **SIDE-04**: All modals, dialogs, and overlays use warm palette with glassmorphism-style blur effects

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Companion System

- **COMP-01**: Animated pixel art companion mascots (Spool the Shiba Inu and friends)
- **COMP-02**: Companion reacts to chat events (celebrations, errors, thinking)
- **COMP-03**: Multiple companion species selectable by user

### Advanced Features

- **ADV-01**: Keyboard shortcut system (Cmd+K palette, Cmd+Enter send, Cmd+/ toggle sidebar)
- **ADV-02**: Session search and filtering
- **ADV-03**: Split-pane view (terminal + chat side by side)
- **ADV-04**: Custom theme editor (user-configurable color palette)
- **ADV-05**: Plugin/extension system for custom chat renderers

## Out of Scope

| Feature | Reason |
|---------|--------|
| Additional AI providers beyond Claude/Codex/Gemini (e.g., Cursor) | Focused scope — three providers cover needs |
| Dark/light mode toggle | Single warm dark theme is the brand identity — toggle dilutes it |
| Mobile-native app | Web PWA is sufficient |
| Video/voice features | Text-first tool |
| Self-hosted auth complexity (OAuth, SSO) | JWT is sufficient for self-hosted |
| Character-by-character typewriter effect | Anti-pattern — jarring, slow, outdated |
| Modal permission dialogs | Anti-pattern — breaks flow; inline banners instead |
| Infinite scroll for session history | Anti-pattern — paginated or search-based is more usable |
| i18n / multi-language | English only — reduces complexity |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DSGN-01 | Phase 1 | Complete |
| DSGN-02 | Phase 1 | Complete |
| DSGN-03 | Phase 1 | Complete |
| DSGN-04 | Phase 1 | Complete |
| DSGN-05 | Phase 1 | Complete |
| DSGN-06 | Phase 2 | Pending |
| DSGN-07 | Phase 1 | Complete |
| DSGN-08 | Phase 1 | Complete |
| CHAT-01 | Phase 5 | Complete |
| CHAT-02 | Phase 5 | Complete |
| CHAT-03 | Phase 5 | Complete |
| CHAT-04 | Phase 5 | Complete |
| CHAT-05 | Phase 5 | Complete |
| CHAT-06 | Phase 5 | Complete |
| CHAT-07 | Phase 5 | Complete |
| CHAT-08 | Phase 5 | Complete |
| CHAT-09 | Phase 6 | Complete |
| CHAT-10 | Phase 6 | Complete |
| CHAT-11 | Phase 6 | Complete |
| CHAT-12 | Phase 6 | Complete |
| CHAT-13 | Phase 6 | Complete |
| CHAT-14 | Phase 6 | Complete |
| CHAT-15 | Phase 6 | Complete |
| CHAT-16 | Phase 6 | Complete |
| STRM-01 | Phase 7 | Pending |
| STRM-02 | Phase 7 | Pending |
| STRM-03 | Phase 7 | Pending |
| STRM-04 | Phase 7 | Pending |
| STRM-05 | Phase 7 | Pending |
| STRM-06 | Phase 7 | Pending |
| STRM-07 | Phase 8 | Pending |
| STRM-08 | Phase 8 | Pending |
| STRM-09 | Phase 8 | Pending |
| STRM-10 | Phase 8 | Pending |
| FORK-01 | Phase 3 | Complete |
| FORK-02 | Phase 3 | Complete |
| FORK-03 | Phase 3 | Complete |
| FORK-04 | Phase 1 | Complete |
| FORK-05 | Phase 1 | Complete |
| TERM-01 | Phase 4 | Pending |
| TERM-02 | Phase 4 | Pending |
| TERM-03 | Phase 4 | Pending |
| TERM-04 | Phase 4 | Pending |
| SIDE-01 | Phase 9 | Pending |
| SIDE-02 | Phase 9 | Pending |
| SIDE-03 | Phase 9 | Pending |
| SIDE-04 | Phase 9 | Pending |

**Coverage:**
- v1 requirements: 44 total
- Mapped to phases: 44
- Unmapped: 0

---
*Requirements defined: 2026-03-01*
*Last updated: 2026-03-01 after roadmap creation — traceability populated*
