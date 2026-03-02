# Roadmap: Loom

## Overview

Loom transforms CloudCLI — a capable but generic AI chat interface — into a premium, crafted developer tool with a warm earthy aesthetic, Claude.ai-level density, and Linear-level attention to detail. The transformation prioritizes functional features first — strip dead code, build the chat experience, implement streaming UX and error handling — then applies visual polish (color sweep, terminal theming, sidebar styling) on top of a working, feature-complete foundation. Each phase delivers a coherent capability.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

**Functional phases (build first):**
- [x] **Phase 3: Structural Cleanup** - Strip i18n, Cursor backend, and Codex backend from the codebase
- [x] **Phase 5: Chat Message Architecture** - Shiki, TurnBlock, tool call cards, thinking block disclosures
- [ ] **Phase 6: Chat Message Polish** - Diffs, user messages, permission banners, usage summaries, layout
- [ ] **Phase 7: Streaming UX** - requestAnimationFrame buffer, auto-scroll, scroll pill, typing indicators
- [ ] **Phase 8: Error Handling and Status** - Toasts, inline banners, global status line, stop button

**Visual phases (polish after):**
- [ ] **Phase 1: Design System Foundation** - Warm earthy palette, CSS variable token system, typography, fork governance
- [ ] **Phase 2: Color Sweep** - Replace all 86+ hardcoded Tailwind color classes with semantic aliases
- [ ] **Phase 4: Terminal and Editor Theming** - Catppuccin Mocha xterm.js theme, CodeMirror warm theme
- [ ] **Phase 9: Sidebar and Global Polish** - Dense sidebar, settings panel, modals, mobile nav

## Phase Details

### Phase 1: Design System Foundation
**Goal**: The app renders with a warm earthy aesthetic and a correct CSS variable token system that all subsequent phases build on
**Depends on**: Nothing (first phase)
**Requirements**: DSGN-01, DSGN-02, DSGN-03, DSGN-04, DSGN-05, DSGN-07, DSGN-08, FORK-04, FORK-05
**Success Criteria** (what must be TRUE):
  1. Opening the app shows chocolate brown (#1c1210) base with warm surface layers, cream text, and amber/copper accents — not the previous blue/gray palette
  2. Tailwind opacity modifiers work correctly — `bg-primary/50` renders at 50% opacity, not full opacity (verifiable with browser inspector)
  3. All body and code text renders in JetBrains Mono with the compact 4-8px grid spacing applied to existing layout components
  4. Scrollbars are thin, warm-tinted, and match the dark theme rather than showing OS-default chrome
  5. An upstream-sync branch tracks CloudCLI verbatim, the GPL-3.0 ATTRIBUTION file credits CloudCLI authors, and the baseline fork commit is tagged
**Plans**: 4 plans

Plans:
- [ ] 01-01-PLAN.md — Define warm earthy CSS variable palette, fix alpha-value contract, load JetBrains Mono, apply typography/density/scrollbar foundation
- [ ] 01-02-PLAN.md — Establish fork governance: upstream-sync branch, baseline tag, GPL-3.0 ATTRIBUTION file
- [ ] 01-03-PLAN.md — Remove dark mode system: delete ThemeContext/DarkModeToggle, strip all dark: Tailwind prefixes
- [ ] 01-04-PLAN.md — Verify end-to-end: build, grep audit, visual checkpoint for warm palette and opacity modifiers

### Phase 2: Color Sweep
**Goal**: Every color reference in the codebase uses semantic CSS variable aliases so the warm palette propagates uniformly and visual QA is meaningful
**Depends on**: Phase 1
**Requirements**: DSGN-06
**Success Criteria** (what must be TRUE):
  1. A grep for hardcoded Tailwind color classes (`bg-blue-`, `text-gray-`, `bg-red-`, etc.) returns zero matches across all 86+ affected files
  2. Every existing UI screen — sidebar, chat, file explorer, git panel, settings — displays the warm earthy palette with no blue or gray artifacts
  3. No component uses raw hex values or hardcoded Tailwind color utilities in className strings
**Plans**: TBD

Plans:
- [ ] 02-01: Audit and replace hardcoded colors in chat and message components
- [ ] 02-02: Audit and replace hardcoded colors in sidebar, file explorer, and git panel
- [ ] 02-03: Audit and replace hardcoded colors in settings, modals, and utility components
- [ ] 02-04: Final grep audit — verify zero remaining hardcoded color classes

### Phase 3: Structural Cleanup
**Goal**: The codebase is free of i18n overhead and the dead Cursor backend, with a streamlined provider UX defaulting to Claude — reducing cognitive load and file count before the highest-complexity redesign work
**Depends on**: Nothing (first functional phase)
**Requirements**: FORK-01, FORK-02, FORK-03
**Success Criteria** (what must be TRUE):
  1. No `useTranslation` imports or `t()` calls remain in any component — all 43 affected components display English string literals directly
  2. No Cursor CLI code, routes, or UI elements exist in the codebase — provider dropdown shows Claude, Codex, and Gemini only
  3. Codex is kept — `@openai/codex-sdk` remains in `package.json`, all Codex routes/hooks/UI intact
  4. Bundle size is measurably reduced — `react-i18next`, `i18next`, `i18next-browser-languagedetector` removed from dependencies
  5. New sessions default to Claude — header dropdown and composer picker enable switching between Claude, Codex, and Gemini
  6. First-time welcome screen appears once, mentions other providers, then auto-dismisses permanently
**Plans**: 5 plans

Plans:
- [x] 03-01-PLAN.md — Strip i18n from 22 chat/core components + remove i18n infrastructure (packages, locales, config, I18nextProvider, LanguageSelector)
- [x] 03-02-PLAN.md — Strip i18n from 20 settings/sidebar components + verify zero i18n references codebase-wide
- [x] 03-03-PLAN.md — Remove all Cursor CLI backend code from server and client (~65 files)
- [x] 03-04-PLAN.md — Build provider UX: header dropdown, composer mini-picker, welcome screen, default-to-Claude
- [x] 03-05-PLAN.md — Final verification audit + visual checkpoint

### Phase 4: Terminal and Editor Theming
**Goal**: The terminal panel and file editor use the warm Loom aesthetic — Catppuccin Mocha ANSI colors in xterm.js and a matching warm dark theme in CodeMirror
**Depends on**: Phase 1
**Requirements**: TERM-01, TERM-02, TERM-03, TERM-04
**Success Criteria** (what must be TRUE):
  1. The terminal panel background matches the app background (#1c1210) — the terminal appears integrated, not an embedded black box
  2. ANSI colors in the terminal follow Catppuccin Mocha — `ls` output, git diffs, and error text display the correct warm/muted colors
  3. The terminal uses JetBrains Mono at 14px with a bar cursor style and 1.2 line height
  4. The CodeMirror file viewer uses a warm dark theme that matches the app palette, consistent with the code block styling planned for Phase 5
**Plans**: TBD

Plans:
- [ ] 04-01: Configure xterm.js Catppuccin Mocha theme via `terminal.options.theme` JS object (all 16 ANSI colors + background/foreground/cursor)
- [ ] 04-02: Apply JetBrains Mono, cursor style, font size, and line height to xterm.js options
- [ ] 04-03: Create warm CodeMirror theme extension matching Loom palette

### Phase 5: Chat Message Architecture
**Goal**: The chat message experience has premium structure — VS Code-quality syntax highlighting, collapsible turns, compact tool call cards, animated thinking block disclosures, and correct streaming performance
**Depends on**: Phase 3
**Requirements**: CHAT-01, CHAT-02, CHAT-03, CHAT-04, CHAT-05, CHAT-06, CHAT-07, CHAT-08
**Success Criteria** (what must be TRUE):
  1. Code blocks render with VS Code Dark+ syntax highlighting via Shiki — language tokens match VS Code's color output and a language label appears in the code block header with a working copy button
  2. Completed AI turns show collapsed (first line of text + tool call count badge) and expand to full content on click — agentic sessions with 20+ turns are navigable without scrolling through all content
  3. Tool call invocations appear as compact single-line action cards showing tool name and key argument — clicking one expands to show full arguments and result inline
  4. Three or more consecutive tool calls are automatically grouped under a typed summary header and can be expanded to show individual cards
  5. Thinking blocks render as a collapsed "Thinking..." disclosure widget with muted styling — during streaming a pulsing amber indicator appears; when complete the block collapses automatically but remains expandable
  6. Bash tool calls use same card style as other tools with faint gray tint (per user decision — no special terminal mini-block)
  7. The streaming performance does not cause visible frame-rate drops during active AI responses — token batching via requestAnimationFrame prevents per-token setState freezing
**Plans**: 5 plans

Plans:
- [x] 05-01-PLAN.md — Install Shiki v4, create singleton highlighter with warm Dark+ theme, build CodeBlock component, replace react-syntax-highlighter
- [x] 05-02-PLAN.md — Build ThinkingDisclosure (Claude.ai-style) and ActivityIndicator (Claude CLI-style rotating phrases), replace AssistantThinkingIndicator
- [x] 05-03-PLAN.md — Build TurnBlock component with collapsible turns, useTurnGrouping hook, expand/collapse toolbar
- [x] 05-04-PLAN.md — Build ToolActionCard (compact cards with type tinting), ToolCallGroup (3+ grouping), update ToolRenderer
- [x] 05-05-PLAN.md — Upgrade streaming to requestAnimationFrame, wire streaming into CodeBlock, memoization audit, visual checkpoint

### Phase 6: Chat Message Polish
**Goal**: The full chat message experience is complete — diffs, user messages, permission banners, usage summaries, system status messages, and layout all feel designed and intentional
**Depends on**: Phase 5
**Requirements**: CHAT-09, CHAT-10, CHAT-11, CHAT-12, CHAT-13, CHAT-14, CHAT-15, CHAT-16
**Success Criteria** (what must be TRUE):
  1. File edit tool calls render as colored unified diffs — green additions, red removals, gray context lines, file path header, and hunk markers — not as raw text output
  2. User messages have a warm background tint that visually distinguishes them from AI messages, and each user message has a small copy button that captures the full prompt text
  3. Permission prompt events render as highlighted inline banners within the message flow — showing tool name and action, not as modal dialogs
  4. Token count and cost appear at the bottom of every AI response unconditionally — not collapsed, always visible
  5. System status messages (info, warning, error) render inline with the correct muted color tier — gray info, amber warning, terracotta error — and do not look like regular chat messages
  6. AI turn content flows as one continuous visual unit with tool calls, thinking, code, and prose inside one block separated by subtle dividers, with no gaps between message elements
**Plans**: TBD

Plans:
- [ ] 06-01: Integrate `react-diff-viewer-continued` for file edit diff rendering — warm palette custom theme
- [ ] 06-02: Style user messages — warm background tint, copy button with clipboard feedback
- [ ] 06-03: Build permission banner component — inline, non-modal, highlighted within message flow
- [ ] 06-04: Add usage summary footer to AI responses — token counts, cost, always visible
- [ ] 06-05: Style system status messages — gray/amber/terracotta tiers, muted visual weight
- [ ] 06-06: Enforce continuous AI turn layout — full-width blocks, role labels, max-width centered, no bubble gaps

### Phase 7: Streaming UX
**Goal**: Streaming responses feel smooth and respect user control — token buffering prevents jank, scroll behavior never fights the user, indicators communicate AI state clearly
**Depends on**: Phase 5
**Requirements**: STRM-01, STRM-02, STRM-03, STRM-04, STRM-05, STRM-06
**Success Criteria** (what must be TRUE):
  1. During a long AI response, scrolling the chat up pauses auto-scroll immediately — the view stays wherever the user scrolled to without snapping back
  2. When scrolled up during a response, a floating pill appears showing "N new messages" with an accurate count — clicking it scrolls to bottom and dismisses the pill
  3. A pulsing typing indicator appears before the first token arrives, then transitions seamlessly into streaming content without a layout jump
  4. The "Thinking..." pulsing indicator is visually distinct from the typing indicator — uses amber pulse color to signal extended thinking specifically
  5. Skeleton shimmer bars replace content during reconnect scrollback load, fading to real content when parsed
**Plans**: TBD

Plans:
- [ ] 07-01: Implement `isUserAtBottom` scroll tracking with 100px threshold and `overflow-anchor: auto` CSS — stable `IntersectionObserver` sentinel via `useCallback`
- [ ] 07-02: Build scroll-to-bottom floating pill — new message count badge, auto-dismiss on reaching bottom, appear/disappear animation
- [ ] 07-03: Build typing indicator component — pulsing dots before first token, seamless transition into streaming content
- [ ] 07-04: Build thinking state indicator — amber pulsing animation distinct from typing indicator, transitions into collapsed thinking disclosure (Phase 5) on completion
- [ ] 07-05: Build skeleton shimmer placeholder system — bars shown during reconnect scrollback, fade transition to real content

### Phase 8: Error Handling and Status
**Goal**: Errors are communicated clearly and non-disruptively, the AI's current activity is always visible, and the user can stop generation at any time
**Depends on**: Phase 6, Phase 7
**Requirements**: STRM-07, STRM-08, STRM-09, STRM-10
**Success Criteria** (what must be TRUE):
  1. Transient errors (reconnecting, temporary failures) appear as toast notifications that auto-dismiss — they do not block the interface or persist after recovery
  2. Permanent errors (process crash, non-zero exit) appear as persistent inline red-accented banners within the message flow — visually distinct from toasts and from regular messages
  3. The global status line at the bottom of the chat shows the current tool being executed in real time (e.g., "Running: Edit src/auth/login.ts") with a spinner on the active tool card
  4. While the AI is responding, the send button is replaced by a stop button — clicking it aborts generation via WebSocket signal and the AI response ends cleanly
**Plans**: TBD

Plans:
- [ ] 08-01: Build toast notification system — transient errors, consistent position, auto-dismiss timing, warm palette
- [ ] 08-02: Build inline error banner component — persistent, red-accented, distinct from toast, positioned within message flow
- [ ] 08-03: Build global activity status line — reads current tool event from streaming, displays tool name + argument, spinner on active card
- [ ] 08-04: Implement stop generation — replace send button with stop button during streaming, send abort signal via WebSocket, `AbortController` on backend request handler

### Phase 9: Sidebar and Global Polish
**Goal**: Every surface of the app — sidebar, settings panel, modals, mobile nav — matches the warm earthy aesthetic with density improvements, completing the full-app transformation
**Depends on**: Phase 2, Phase 8
**Requirements**: SIDE-01, SIDE-02, SIDE-03, SIDE-04
**Success Criteria** (what must be TRUE):
  1. The sidebar session and project list uses tighter spacing and smaller metadata fonts — more sessions are visible without scrolling compared to the pre-Loom baseline
  2. The settings panel fully matches the warm dark theme — no blue, gray, or white surface artifacts remain
  3. Mobile navigation and responsive breakpoints match the warm dark theme — the app feels consistent on narrow viewports
  4. All modals and dialogs use warm palette with glassmorphism-style blur backgrounds — no default browser-chrome or light-theme overlay remnants
**Plans**: TBD

Plans:
- [ ] 09-01: Restyle sidebar — tighter session list density, compact metadata fonts, warm earthy palette
- [ ] 09-02: Restyle settings panel — warm dark theme, remove all gray/blue artifacts
- [ ] 09-03: Restyle mobile navigation — warm theme, responsive consistency
- [ ] 09-04: Restyle modals and dialogs — warm palette, glassmorphism blur backgrounds

## Progress

**Execution Order:**
Functional first, then visual polish: 3 → 5 → 6 → 7 → 8 → 1 → 2 → 4 → 9

Phase 1 (Design System) has partial work completed (CSS variables, dark mode removal) but is deferred as a group with the other visual phases.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| **Functional phases** | | | |
| 3. Structural Cleanup | 5/5 | Complete |  |
| 5. Chat Message Architecture | 5/5 | Complete | 2026-03-02 |
| 6. Chat Message Polish | 0/6 | Not started | - |
| 7. Streaming UX | 0/5 | Not started | - |
| 8. Error Handling and Status | 0/4 | Not started | - |
| **Visual phases** | | | |
| 1. Design System Foundation | 0/4 | Partial (deferred) | - |
| 2. Color Sweep | 0/4 | Not started | - |
| 4. Terminal and Editor Theming | 0/3 | Not started | - |
| 9. Sidebar and Global Polish | 0/4 | Not started | - |
