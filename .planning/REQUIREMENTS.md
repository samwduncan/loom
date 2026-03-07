# Requirements: Loom V2 — v1.1 "The Chat"

**Defined:** 2026-03-07
**Core Value:** Make AI agent work visible, beautiful, and controllable
**Milestone:** v1.1 — Complete conversation experience

## v1.1 Requirements

### Markdown & Content Rendering

- [ ] **MD-01**: Assistant messages render Markdown (bold, italic, lists, links, headings, blockquotes) via react-markdown on finalized messages
- [ ] **MD-02**: During active streaming, lightweight markdown-to-HTML converts basic formatting via `dangerouslySetInnerHTML` with a pure-function sanitizer (allowlist: `strong`, `em`, `code`, `a`, `p`, `br`, `ul`, `ol`, `li`), preserving 60fps rAF buffer
- [ ] **MD-03**: Transition from streaming raw text to finalized markdown is visually smooth (no layout flash, masked by existing `data-phase` CSS transition)
- [ ] **MD-04**: Fenced code blocks render with Shiki syntax highlighting, language label, and copy-to-clipboard button with "Copied!" feedback
- [ ] **MD-05**: Shiki uses JavaScript RegExp engine (no WASM), lazy-loads grammars per-language, shares a singleton highlighter instance
- [ ] **MD-06**: Code blocks reserve height immediately to prevent layout shift during async grammar loading
- [ ] **MD-07**: GFM tables render correctly with horizontal scroll wrapper for overflow
- [ ] **MD-08**: Long content handles word-break, inline code overflow, and external links open in new tab with `rel="noopener noreferrer"`
- [ ] **MD-09**: Shiki theme maps to OKLCH design tokens via CSS custom properties (`--shiki-token-*`)
- [ ] **MD-10**: Interleaved tool chips within markdown content render correctly in finalized messages (marker-based approach: placeholder tokens parsed then replaced with React components)

### Composer

- [ ] **CMP-01**: Chat input is an auto-resize `<textarea>` replacing the single-line `<input>`, capped at ~200px with inner scroll
- [ ] **CMP-02**: Enter sends message, Shift+Enter inserts newline
- [ ] **CMP-03**: Send/Stop button morphs smoothly between states (CSS crossfade, position-stable in same grid cell)
- [ ] **CMP-04**: Image paste (Ctrl+V) and drag-and-drop supported, with thumbnail preview chips above textarea, max 5 images
- [ ] **CMP-05**: Cmd+. stops generation, Escape clears input and blurs
- [ ] **CMP-06**: Draft text preserved per session (survives session switching, persists to localStorage for reload)
- [ ] **CMP-07**: Composer integrates with CSS Grid shell layout (`grid-template-rows: 1fr auto`)

### Message Types

- [ ] **MSG-01**: User messages render with proper styling (bg-card, rounded-lg, pre-wrapped text, hover timestamp)
- [ ] **MSG-02**: Error messages render as inline banners with red accent border, muted background, and error text
- [ ] **MSG-03**: System messages render centered, muted, smaller text
- [ ] **MSG-04**: Task notification messages render with distinct icon and label
- [ ] **MSG-05**: Thinking blocks have expand/collapse with character count or duration label, muted italic styling
- [ ] **MSG-06**: Global thinking toggle collapses all thinking blocks in a session (stored in UI store, persisted to localStorage)
- [ ] **MSG-07**: Image blocks render in messages — user-sent images display as thumbnails (click to expand), assistant-referenced images render inline

### Tool Cards

- [ ] **TOOL-01**: Tool state machine transitions visually: invoked -> executing -> resolved/error, with CSS animations (GPU-only: opacity, transform)
- [ ] **TOOL-02**: Executing tools display elapsed time counter (updates every 100ms via `startedAt` timestamp)
- [ ] **TOOL-03**: Error tool state renders with expanded red-tinted card
- [ ] **TOOL-04**: BashToolCard: command header + terminal-styled output
- [ ] **TOOL-05**: ReadToolCard: file path header + Shiki-highlighted content with line numbers
- [ ] **TOOL-06**: EditToolCard: file path header + unified diff view using `--diff-added-bg`/`--diff-removed-bg` tokens
- [ ] **TOOL-07**: WriteToolCard: file path header + content preview (truncated, expandable)
- [ ] **TOOL-08**: GlobToolCard: pattern header + file list
- [ ] **TOOL-09**: GrepToolCard: pattern header + match results with line numbers and context
- [ ] **TOOL-10**: Rich tool cards register via existing `registerTool()` API, share a ToolCardShell wrapper
- [ ] **TOOL-11**: Consecutive tool calls group into collapsible accordion ("N tool calls" header with expand chevron), error calls force-expanded
- [ ] **TOOL-12**: Tool card expansion deferred until streaming ends (Constitution Section 11.4)

### Permissions

- [ ] **PERM-01**: Permission request events (`claude-permission-request`) render as inline banners with tool name, truncated input preview, Allow/Deny buttons
- [ ] **PERM-02**: Permission response sent back via WebSocket (`claude-permission-response`) on Allow/Deny
- [ ] **PERM-03**: Permission banner shows timeout indicator (55s default) and auto-dismisses on `claude-permission-cancelled`

### Activity & Status

- [ ] **ACT-01**: Activity status line displays current tool action ("Reading auth.ts...", "Writing server.js...") derived from stream store `activityText`
- [ ] **ACT-02**: Activity text fades in/out with CSS transition (200ms), truncates long paths
- [ ] **ACT-03**: Token/cost display below assistant messages (input/output tokens + estimated cost), always visible

### Scroll & Navigation

- [ ] **NAV-01**: Scroll position preserved per session — saved on switch, restored with `useLayoutEffect` on return
- [ ] **NAV-02**: `content-visibility: auto` applied to past message containers for rendering performance (Constitution 10.5)

### Polish

- [ ] **POL-01**: Message entrance animations (fade-in + slide-from-bottom via tailwindcss-animate), respects `prefers-reduced-motion`
- [ ] **POL-02**: Streaming cursor upgraded with rose accent color (`var(--primary)`), 1s pulse cycle, hides on finalization
- [ ] **POL-03**: Thinking block styling: muted italic text inside disclosure

## v2 Requirements (Deferred)

### Future Enhancements

- **FUT-01**: Streamdown evaluation — live formatted markdown during streaming (evaluate after Phase 1 ships if raw-to-formatted flash feels jarring)
- **FUT-02**: Virtual scrolling via @tanstack/react-virtual (pivot from content-visibility if insufficient at 2000+ messages)
- **FUT-03**: Tool approval workflows with granular permission categories
- **FUT-04**: Message search within session
- **FUT-05**: Conversation export (markdown, JSON)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Character-by-character typewriter | PROJECT.md explicitly bans; causes jitter at 100 tok/sec |
| Conversation branching/forking | PROJECT.md out of scope; high complexity, low value single-user |
| Rich text editor in composer (TipTap) | Massive bundle for plain text prompts to coding agents |
| Full Framer Motion | Constitution Tier 3; CSS transitions sufficient for M2 |
| Artifacts/Canvas panel | M3/M4 scope; tool cards serve this role for coding agents |
| Aurora/ambient effects | M3 visual polish scope |
| Model selector in composer | M4 multi-provider scope |
| Sidebar slim collapse | M3 scope |
| Cmd+K command palette | M3 scope |
| Settings panel | M3 scope |
| Light mode | PROJECT.md: dark-only for M1-M3 |

## Traceability

Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| MD-01 | — | Pending |
| MD-02 | — | Pending |
| MD-03 | — | Pending |
| MD-04 | — | Pending |
| MD-05 | — | Pending |
| MD-06 | — | Pending |
| MD-07 | — | Pending |
| MD-08 | — | Pending |
| MD-09 | — | Pending |
| MD-10 | — | Pending |
| CMP-01 | — | Pending |
| CMP-02 | — | Pending |
| CMP-03 | — | Pending |
| CMP-04 | — | Pending |
| CMP-05 | — | Pending |
| CMP-06 | — | Pending |
| CMP-07 | — | Pending |
| MSG-01 | — | Pending |
| MSG-02 | — | Pending |
| MSG-03 | — | Pending |
| MSG-04 | — | Pending |
| MSG-05 | — | Pending |
| MSG-06 | — | Pending |
| MSG-07 | — | Pending |
| TOOL-01 | — | Pending |
| TOOL-02 | — | Pending |
| TOOL-03 | — | Pending |
| TOOL-04 | — | Pending |
| TOOL-05 | — | Pending |
| TOOL-06 | — | Pending |
| TOOL-07 | — | Pending |
| TOOL-08 | — | Pending |
| TOOL-09 | — | Pending |
| TOOL-10 | — | Pending |
| TOOL-11 | — | Pending |
| TOOL-12 | — | Pending |
| PERM-01 | — | Pending |
| PERM-02 | — | Pending |
| PERM-03 | — | Pending |
| ACT-01 | — | Pending |
| ACT-02 | — | Pending |
| ACT-03 | — | Pending |
| NAV-01 | — | Pending |
| NAV-02 | — | Pending |
| POL-01 | — | Pending |
| POL-02 | — | Pending |
| POL-03 | — | Pending |

**Coverage:**
- v1.1 requirements: 46 total
- Mapped to phases: 0
- Unmapped: 46 (pending roadmap creation)

---
*Requirements defined: 2026-03-07*
*Last updated: 2026-03-07 after research synthesis*
