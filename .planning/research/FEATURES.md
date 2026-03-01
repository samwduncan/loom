# Feature Research

**Domain:** Premium AI Coding Chat Interface (Web UI)
**Researched:** 2026-03-01
**Confidence:** HIGH (cross-verified via Gemini research + official docs + tool analysis)

---

## Context

Loom is a fork of CloudCLI — the foundational plumbing (chat, file explorer, git, terminal, sessions, WebSocket, auth) already exists. This research focuses on **what separates "works" from "delightful"** in the best AI coding chat interfaces: Claude.ai, Cursor, Windsurf, and GitHub Copilot Chat.

The research question is not "what should we build?" but "what do users *already expect* from AI coding UIs, and what gives a tool a genuine competitive edge?"

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features that users assume exist. Missing these = product feels broken or unprofessional.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Markdown rendering** | Every AI tool renders markdown; raw text feels primitive | LOW | Already exists in CloudCLI via react-markdown; needs upgrade to streaming-aware parser |
| **Syntax highlighting (VS Code quality)** | Developers compare code blocks to their IDE; muted/generic highlighting feels wrong | MEDIUM | Shiki v1.0+ is the 2025 industry standard — uses TextMate grammars for 1:1 VS Code accuracy; CodeMirror exists but Shiki produces better static highlighting |
| **Copy-to-clipboard on code blocks** | Every major AI tool has this; its absence is jarring | LOW | One-line addition; show on hover |
| **Stop generation button** | Users need to interrupt long outputs instantly | LOW | Replace send icon with square stop icon during generation; must propagate abort to backend (AbortController + req.on('close')) |
| **Auto-scroll with manual override** | Without it, reading while AI streams is impossible | LOW | "Sticky-bottom" pattern: follow stream only if already at bottom; any upward scroll (10px+) kills auto-scroll immediately |
| **Jump-to-bottom pill** | When auto-scroll is broken, user needs a way back | LOW | Floating arrow button, bottom-center; badge showing number of new messages since user scrolled up |
| **Distinct "thinking" vs "generating" states** | Generic spinners feel like loading; users want to know *what* the AI is doing | LOW | Phase 1: "Thinking" pulsing indicator or skeleton; Phase 2: streaming text; never use three-dot "typing" animation for AI responses |
| **Collapsible thinking blocks** | Extended thinking output clutters the UI; users want access but not by default | MEDIUM | Show thinking while active (pulsing), auto-collapse when output begins, always expandable; use subtle color distinction (gray/purple border) |
| **Tool call visibility** | Users need to know what tools the AI invoked and why | MEDIUM | Compact "action card" per tool call, expandable; group repeated calls; show name + summary, hide raw JSON by default |
| **Session persistence** | Users expect to return to conversations; losing context on reload is a dealbreaker | LOW | Already exists in CloudCLI (SQLite); visual distinction between "resuming" and "new chat" needed |
| **New chat / clear context** | Starting fresh must be one click | LOW | Prominent button; explicit visual signal that context is cleared |
| **Input that grows with content** | Fixed-height inputs feel like web 1.0 | LOW | Auto-expanding textarea up to ~6 lines, then scroll |
| **Message copy** | Copying previous prompts or responses to reuse | LOW | Hover-reveal copy icon on user messages and assistant responses |
| **Status feedback for errors** | Network failures, API errors, rate limits must be clearly communicated | MEDIUM | Toast for transient errors; inline banner for persistent errors; never silent failure |
| **Connection status indicator** | Users on flaky connections need to know if they're connected | LOW | Subtle color dot in status bar; reconnect state during WebSocket drops |

---

### Differentiators (Competitive Advantage)

Features not universally expected, but that create meaningful separation from generic tools. These are where Loom should invest given its "designed, not generated" thesis.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Collapsible completed turns** | Reduces visual noise in long sessions; keeps context visible without clutter | MEDIUM | First line + message count badge; click to expand; essential for agentic long-form sessions; Loom's agentic use case makes this high-value |
| **Live agentic status line** | Real-time micro-status ("Reading auth.ts... Executing terminal command...") turns waiting into insight | MEDIUM | JSON-driven from Claude Code backend; parse and render as human-readable status string; Cursor does checklist-style planning view |
| **Token count + cost per response** | Power users and self-hosters actively manage usage; visible costs build trust | MEDIUM | "Input: 450 \| Output: 120 \| Cost: $0.008" footer on each message; expandable; session totals in sidebar |
| **Context window gauge** | Visual progress bar showing how full the context window is; prevents "context full" surprises | MEDIUM | Near input box; updates as files are attached or history grows |
| **Diff rendering (colored unified diffs)** | Code changes are core AI coding output; plain text diffs are unreadable | HIGH | Colored unified diffs with file headers, hunk markers, line numbers; "Apply" or "Copy patch" actions |
| **Grouped tool calls (3+)** | When AI runs many tools, flat list is overwhelming; grouping preserves signal | MEDIUM | "3 tool calls" collapsed group with expand; error-state tool calls always expanded; success = compact |
| **Permission banners (inline, not modal)** | Blocking permission modals kill flow; inline banners are less disruptive | MEDIUM | Horizontal banner in chat stream: "Claude wants to run: `rm -rf ./dist`" with Run / Cancel; auto-approve toggle per command type |
| **Warm earthy design language** | Generic AI tools look alike; distinctive palette creates product identity and user preference | LOW (design) / HIGH (implementation discipline) | Chocolate brown base, amber/copper/terracotta accents; this is Loom's primary brand differentiator |
| **Dense professional layout** | Claude.ai is spacious; developer-focused users prefer information density (Linear-style) | MEDIUM | 4-8px grid, tight line heights, JetBrains Mono throughout; more context visible per screen height |
| **System/status message categorization** | Tool output, errors, and info are currently visually identical | LOW | Gray=info, amber=warning, red=error; muted visual weight for system messages |
| **Global activity status bar** | Bottom-of-window status line showing current AI state; developers recognize IDE patterns | LOW | "Claude: Reading 12 files..." or "Idle" — familiar from VS Code status bar |
| **Usage summary always visible** | Sidebar or footer showing session-level token totals, not hidden behind menus | LOW | Small, secondary-text weight; always present, never distracting |
| **Keyboard-first navigation** | Power users expect to operate without a mouse | HIGH | See Keyboard Shortcuts section below |
| **Compact vs. comfortable density toggle** | Different tasks need different density; file review vs. conversation | MEDIUM | Reduces padding 15-20%; toggleable per user preference, persisted |
| **Font customization for code blocks** | Developers have strong font preferences (JetBrains Mono, Fira Code, Cascadia Code) | LOW | CSS variable for monospace font; user settings panel entry |
| **Streaming diffs (live progress)** | Seeing changes appear in real-time in the file editor is the "killer feature" of Cursor/Windsurf | HIGH | Requires tight editor integration; out of scope for MVP but high long-term value |

---

### Anti-Features (Deliberately Avoid)

Features that seem appealing but create technical debt, UX friction, or scope creep.

| Anti-Feature | Why Requested | Why Problematic | What to Do Instead |
|--------------|---------------|-----------------|-------------------|
| **Typewriter character-by-character effect** | Feels "alive" | Creates eye strain on long responses; introduces artificial latency on fast models; masks real streaming progress | Render in token chunks (2-5 words); use smooth CSS fade-in transition instead |
| **Modal permission dialogs** | Familiar from OS permission patterns | Blocks the entire UI; kills flow in agentic sessions; users click through without reading | Inline permission banners in the chat stream; non-blocking |
| **Generic three-dot typing indicator** | Familiar pattern | Provides no information about what the AI is doing; feels like a slow connection, not an intelligent system | State-specific indicators: "Thinking..." pulsing text, then streaming begins |
| **"Real-time everything" WebSocket architecture expansion** | Feels technically impressive | Adds complexity for features that don't benefit from real-time (settings, session list); over-engineering | Keep WebSocket for chat streaming only; use standard HTTP for settings, auth, file operations |
| **Dark mode toggle** | Users expect theme control | Loom's identity is specifically warm earthy dark — a "light mode" would require a separate design system and contradict the product positioning | Offer density and font customization; accept that Loom is a dark-mode product |
| **Multi-AI-provider support** | Seems flexible | Each provider has different streaming protocols, tool call formats, and pricing models; maintaining N providers multiplies complexity | Stay Claude + Gemini only; do it excellently rather than supporting everything superficially |
| **Infinite scroll for session history** | Seems user-friendly | Long session history with markdown + code blocks becomes extremely expensive to render; browser performance degrades | Paginate sessions; load on demand; collapse completed turns aggressively |
| **"AI explains this UI element"** | Seems helpful | Meta-AI features are gimmicky; users of a dev tool already understand what buttons do | Invest in keyboard shortcut discoverability and tooltips instead |
| **Voice input** | Power user request | Adds significant complexity (browser APIs, latency, accuracy issues); almost no AI coding workflow uses voice | Text-first; defer indefinitely |
| **Customizable color themes** | Power user request | A theming system requires semantic token discipline, theme-switching logic, preview UI, persistence; disproportionate effort | Offer font and density customization; use a well-designed single theme |
| **Conversation branching / tree view** | Advanced AI power feature | Implementation complexity is very high; most users never need it; creates confusing mental model | Linear conversation; "New chat" is the branch mechanism |
| **"Vibe coding" natural language CSS** | AI trend feature | Not aligned with Loom's use case (Claude Code CLI management); scope creep | Keep focus: Loom is an interface for Claude Code and Gemini CLI, not a visual development tool |

---

## Feature Dependencies

```
[Streaming WebSocket]
    └──required-by──> [Streaming markdown rendering]
    └──required-by──> [Typing/thinking indicators]
    └──required-by──> [Auto-scroll logic]
    └──required-by──> [Stop generation button]
    └──required-by──> [Live agentic status line]

[Streaming markdown rendering]
    └──required-by──> [Syntax highlighting (Shiki)]
    └──required-by──> [Diff rendering]
    └──required-by──> [Collapsible thinking blocks]

[Tool call visibility]
    └──required-by──> [Grouped tool calls]
    └──required-by──> [Permission banners]

[Session persistence]
    └──required-by──> [Collapsible completed turns]
    └──required-by──> [Usage summary (session totals)]

[Design system (CSS variables, palette)]
    └──required-by──> [Dense layout]
    └──required-by──> [Warm earthy identity]
    └──required-by──> [Typography overhaul]
    └──required-by──> [All visual differentiators]

[Token count per response]
    └──enhances──> [Context window gauge]
    └──enhances──> [Usage summary]

[Keyboard shortcuts]
    └──enhances──> [Every core action]
    └──conflicts-with──> [Mouse-only component libraries]

[Collapsible completed turns]
    └──enhances──> [Dense layout]
    └──requires──> [Session persistence]
```

### Dependency Notes

- **Design system must come first:** All visual differentiators (density, palette, typography) require a coherent CSS variable system; retrofitting is painful. This is Phase 1 work.
- **Streaming markdown requires streaming-aware parser:** react-markdown renders complete documents; streaming requires incremental parsing (consider `marked` with streaming, or `micromark`). This change affects all downstream rendering features.
- **Grouped tool calls requires tool call visibility:** Can't group what isn't rendered individually first.
- **Keyboard shortcuts conflict with default browser behavior:** Require careful event handling; `Cmd+K` for command palette conflicts with browser defaults in some contexts; test thoroughly.

---

## MVP Definition

### Launch With (v1)

The minimum needed to feel like a *designed* tool, not just a reskinned CloudCLI.

- [ ] **Design system** (palette, typography, CSS variables) — without this nothing else matters
- [ ] **Dense layout** (tight grid, compact line heights, JetBrains Mono) — changes how the whole interface feels
- [ ] **Syntax highlighting upgrade to VS Code quality** — developers notice code block quality immediately
- [ ] **Collapsible thinking blocks** — essential for Claude Code's extended thinking output
- [ ] **Tool call action cards** (compact, expandable, grouped) — transforms tool output from noise to signal
- [ ] **Streaming UX polish** (state-aware indicators, sticky auto-scroll, jump-to-bottom pill) — the "feel" of premium
- [ ] **Stop generation** with backend abort propagation — safety valve users reach for constantly
- [ ] **System message categorization** (gray/amber/red) — reduces visual noise immediately
- [ ] **Collapsible completed turns** — essential for long agentic sessions
- [ ] **Usage summary visible** (token counts, cost) — key for self-hosting power users

### Add After Validation (v1.x)

- [ ] **Diff rendering** — valuable but complex; validate core chat experience first
- [ ] **Permission banners** — currently modals work; inline is better but not blocking
- [ ] **Token count + cost per response** — power feature; add after basic usage summary lands
- [ ] **Context window gauge** — nice to have; add after token display is working
- [ ] **Keyboard shortcut system** — high value for power users; defer until core UX is stable
- [ ] **Compact/comfortable density toggle** — second-order customization; core density comes first

### Future Consideration (v2+)

- [ ] **Streaming diffs (live file editing)** — major architectural work; requires editor integration
- [ ] **Command palette (Cmd+K)** — high value but significant implementation; Phase 2+ feature
- [ ] **Multi-agent status visualization** — depends on Claude Code SDK support
- [ ] **Font customization settings panel** — defer until settings panel is otherwise needed

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Design system (palette, variables) | HIGH | MEDIUM | P1 |
| Typography + dense layout | HIGH | MEDIUM | P1 |
| Syntax highlighting (Shiki) | HIGH | MEDIUM | P1 |
| Collapsible thinking blocks | HIGH | MEDIUM | P1 |
| Tool call action cards | HIGH | MEDIUM | P1 |
| Stop generation + abort | HIGH | LOW | P1 |
| Auto-scroll + jump-to-bottom | HIGH | LOW | P1 |
| State-aware streaming indicators | HIGH | LOW | P1 |
| Collapsible completed turns | HIGH | MEDIUM | P1 |
| System message categorization | MEDIUM | LOW | P1 |
| Usage summary (session totals) | HIGH | LOW | P1 |
| Diff rendering | HIGH | HIGH | P2 |
| Inline permission banners | MEDIUM | MEDIUM | P2 |
| Token count + cost per message | MEDIUM | MEDIUM | P2 |
| Context window gauge | MEDIUM | MEDIUM | P2 |
| Global status bar | MEDIUM | LOW | P2 |
| Keyboard shortcut system | HIGH | HIGH | P2 |
| Compact/comfortable density toggle | MEDIUM | LOW | P2 |
| Font customization | LOW | LOW | P3 |
| Command palette (Cmd+K) | HIGH | HIGH | P3 |
| Live streaming diffs | HIGH | VERY HIGH | P3 |

---

## Keyboard Shortcuts Reference

What power users expect based on industry standard patterns (Cursor, Windsurf, VS Code, Linear):

| Action | Standard Shortcut | Notes |
|--------|------------------|-------|
| Open command palette | `Cmd/Ctrl + K` | Industry standard; conflicts with browser "select all" on some platforms |
| New chat / new session | `Cmd/Ctrl + N` | Standard new-item shortcut |
| Focus chat input | `Cmd/Ctrl + L` | Cursor uses this for AI chat focus |
| Stop generation | `Escape` | Natural cancel; also replace send button with stop icon |
| Submit message | `Enter` | `Shift+Enter` for newline |
| Navigate sessions (up/down) | `J` / `K` (vim-style) | Power user expectation; only when sidebar is focused |
| Toggle sidebar | `Cmd/Ctrl + B` | VS Code standard |
| Copy last response | `Cmd/Ctrl + Shift + C` | Specific to AI chat context |
| Expand/collapse thinking block | `Cmd/Ctrl + T` | Loom-specific; custom shortcut |
| Jump to bottom | `Cmd/Ctrl + End` | Standard document navigation |

**Implementation note:** Build shortcut layer with `useHotkeys` (react-hotkeys-hook) rather than raw event listeners. Implement after core UI is stable — shortcuts require a stable DOM structure to wire correctly.

---

## Competitor Feature Analysis

| Feature | Claude.ai | Cursor | Windsurf | GitHub Copilot Chat | Our Approach |
|---------|-----------|--------|----------|---------------------|--------------|
| **Markdown rendering** | Full GFM + tables | Full GFM | Full GFM | Full GFM | Full GFM via react-markdown (existing) + Shiki upgrade |
| **Code highlighting** | VS Code-grade | Shiki | Shiki | TextMate grammars | Shiki (replace CodeMirror for display) |
| **Thinking blocks** | Collapsible purple block, auto-collapse | Checklist planning view | "Cascade" progress steps | "Searching files..." status pills | Collapsible with pulsing live indicator |
| **Tool calls** | Compact text with expand | Inline diff with Accept/Reject | Ghost text with explicit apply | Sparkle icon menus | Action cards (compact, expandable, grouped) |
| **Streaming UX** | Token chunks, smooth | Adaptive batching, fast | Ghost text supercomplete | Progressive inline | Token-chunk batching, state-aware indicators |
| **Auto-scroll** | Sticky-bottom | Sticky-bottom + override | Sticky-bottom | Sticky-bottom | Sticky-bottom + manual break at 10px, jump-to-bottom pill |
| **Stop generation** | Stop button in input | Stop replaces send | Stop replaces send | Stop button | Square stop icon replaces send during generation |
| **Token display** | CLI only (JSON) | Dashboard (usage totals) | Dashboard | Monthly quota bar | Per-message footer + session totals in sidebar |
| **Cost display** | CLI JSON logs | Exact dollar dashboard | Credits system | Enterprise only | Per-message cost + session total (self-hosters care) |
| **Keyboard shortcuts** | Standard browser | Extensive (Cmd+I, K, L) | Extensive (Cmd+I, Shift+L) | VS Code extension shortcuts | Cmd+K palette (v2), Cmd+L focus, Escape stop |
| **Information density** | Comfortable/spacious | Medium density | Medium density | Low density (VS Code pane) | High density (Linear-style, 4-8px grid) |
| **Design identity** | Clean white/gray | VS Code dark | VS Code dark | VS Code dark | Warm earthy dark (unique) |
| **Session management** | Projects + conversations | Multi-window composer | Cascade memory panel | Workspace scoped | Session list in sidebar (existing) + visual resume indicator |

---

## Streaming UX Technical Notes

Confidence: HIGH (verified via Vercel AI SDK docs and community patterns)

**What to implement:**
- Render tokens in chunks (50-100ms batching) not character-by-character — prevents browser reflow storms
- Use existing WebSocket; do not migrate to SSE (WebSocket already has reconnection logic in CloudCLI)
- `AbortController` per request; signal forwarded to backend; listen for `req.on('close')` server-side to stop token billing
- Sticky-bottom auto-scroll: break lock on first 10px scroll upward; restore lock only on user action (click jump-to-bottom)
- Jump-to-bottom pill: show only when auto-scroll is broken; badge shows new message count since scroll break

**What to avoid:**
- Character-by-character typewriter: strain-inducing and artificial
- Single-state "loading" spinner: no information value; use multi-state indicators

---

## Sources

- Claude.ai interface patterns — direct analysis (HIGH confidence)
- [Cursor documentation and feature announcements](https://cursor.com) (HIGH confidence)
- [Windsurf documentation](https://docs.codeium.com/windsurf) (HIGH confidence)
- [Shiki syntax highlighter](https://shiki.style) — industry standard for VS Code-quality browser highlighting (HIGH confidence)
- [Vercel AI SDK streaming docs](https://sdk.vercel.ai) — streaming patterns and AbortController (HIGH confidence)
- [use-stick-to-bottom library](https://github.com/vantezzen/use-stick-to-bottom) — auto-scroll pattern reference (HIGH confidence)
- GitHub Copilot Chat VS Code extension — direct analysis (HIGH confidence)
- Gemini Research: AI coding interface features 2025-2026 (MEDIUM-HIGH confidence, cross-verified)
- Linear design method — information density patterns (HIGH confidence)

---

*Feature research for: Premium AI Coding Chat Interface (Loom)*
*Researched: 2026-03-01*
