# Requirements: Loom V2 — v1.1 "The Chat"

**Defined:** 2026-03-07
**Core Value:** Make AI agent work visible, beautiful, and controllable
**Milestone:** v1.1 — Complete conversation experience

## v1.1 Requirements

### Dependencies & Setup

- [ ] **DEP-01**: Install react-markdown ^10.1.0, remark-gfm ^4.0.1, rehype-raw ^7.0.0 in `src/` workspace
- [ ] **DEP-02**: Install shiki ^4.0.1 in `src/` workspace
- [x] **DEP-03**: Create Shiki singleton module (`shiki-highlighter.ts`) using JavaScript RegExp engine (no WASM), empty initial language set, `css-variables` theme
- [x] **DEP-04**: Pre-load 7 common language grammars at app startup: JavaScript, TypeScript, Python, Bash, JSON, CSS, HTML. All other languages load on first encounter.
- [x] **DEP-05**: Create Shiki OKLCH theme mapping file (`shiki-theme.ts`) that maps `--shiki-token-*` CSS custom properties to design tokens in `tokens.css`. Use Constitution Section 3.1 exception pattern for third-party theme objects.
- [ ] **DEP-06**: Install tailwindcss-animate for message entrance animations (Constitution Tier 2 motion)

### Markdown Rendering — Finalized Messages

- [ ] **MD-01**: Finalized assistant messages render full Markdown via react-markdown: bold, italic, strikethrough, lists (ordered + unordered), links, headings (h1-h6), blockquotes, horizontal rules, task lists (GFM checkboxes)
- [ ] **MD-02**: react-markdown configured with `remarkPlugins: [remarkGfm]` and `rehypePlugins: [rehypeRaw]` for GFM + raw HTML passthrough (`<details>`, `<summary>`)
- [ ] **MD-03**: Custom react-markdown component overrides for: `code` (routes to CodeBlock for fenced, inline `<code>` for spans), `a` (external links: `target="_blank" rel="noopener noreferrer"`; internal links: no target), `table` (horizontal scroll wrapper `overflow-x: auto`), `pre` (code block container)
- [ ] **MD-04**: Inline code renders with `bg-surface-1` background, `rounded-sm` border radius, `px-1.5 py-0.5` padding, monospace font
- [ ] **MD-05**: Blockquotes render with left border accent (`border-l-2 border-primary/30`), muted text, indented padding
- [ ] **MD-06**: Links render with underline on hover, `text-primary` color, distinguishable from surrounding text

### Markdown Rendering — Streaming (Two-Phase)

- [ ] **MD-10**: During active streaming, rAF buffer continues painting raw text via DOM mutation (M1 pattern unchanged, 60fps preserved)
- [ ] **MD-11**: Lightweight streaming markdown-to-HTML pure function converts basic formatting (bold, italic, code spans, paragraphs, line breaks) to sanitized HTML via `dangerouslySetInnerHTML`. Allowlist: `<strong>`, `<em>`, `<code>`, `<a>`, `<p>`, `<br>`, `<ul>`, `<ol>`, `<li>`, `<h1>`-`<h6>`. All other tags stripped.
- [ ] **MD-12**: Unclosed code fences during streaming: detect odd number of triple-backtick sequences and inject synthetic closing fence before parsing. Code block container renders immediately with content filling in as tokens arrive.
- [ ] **MD-13**: GFM tables during streaming: if last line starts with `|` and no empty line follows, render as plain text until table completes. Tables only parsed on flush or double-newline. (Constitution 12.3)
- [ ] **MD-14**: Transition from streaming to finalized markdown is visually smooth — masked by existing `data-phase` CSS transition (minimum 200ms). No visible "flash" or layout jump.
- [ ] **MD-15**: Interleaved tool chips within finalized markdown: marker-based approach — insert unique placeholder tokens (`\x00TOOL:id\x00`) at tool positions, parse full document as markdown, walk rendered tree and replace markers with React ToolChip components. Marker schema defined once, used consistently.

### Code Blocks (Shiki)

- [x] **CODE-01**: Fenced code blocks render with Shiki syntax highlighting using the `css-variables` theme (colors from CSS custom properties, not inline styles)
- [x] **CODE-02**: Code block UI: language label top-right, copy-to-clipboard button top-right (shows "Copied!" for 2s after click, then reverts), dark surface background (`bg-surface-0`)
- [x] **CODE-03**: Code blocks display line numbers for blocks > 3 lines
- [x] **CODE-04**: Code blocks cap at `max-height: 400px` with `overflow-y: auto` inner scroll. Full height for blocks ≤ 20 lines.
- [x] **CODE-05**: Code blocks reserve `min-height` based on line count estimate immediately to prevent layout shift during async grammar loading (CLS = 0)
- [x] **CODE-06**: Shiki grammar loading is async — plain monospace text renders immediately as fallback, highlighted version swaps in via `useDeferredValue` (no blocking, no flash of unstyled code)
- [x] **CODE-07**: Highlighted results cached per language+code combination. Subsequent identical blocks highlight instantly.
- [x] **CODE-08**: Code blocks use `overflow-x: auto` for long lines (no wrapping by default). Lines that exceed container width get horizontal scroll.
- [x] **CODE-09**: ESLint exceptions for Shiki theme configuration use `// eslint-disable-next-line` with SAFETY explanation comment, per Constitution Section 3.1

### Composer

- [ ] **CMP-01**: Chat input is an auto-resize `<textarea>` replacing the current single-line `<input>`. Uses `useLayoutEffect` height recalculation (`height = 0; height = scrollHeight`), not a library.
- [ ] **CMP-02**: Textarea grows from 1 line to max ~200px (roughly 10-12 lines). Beyond max, inner `overflow-y: auto` scroll. Min height: 1 line.
- [ ] **CMP-03**: Enter sends message (if not empty, if not currently streaming). Shift+Enter inserts newline. Both behaviors work correctly.
- [ ] **CMP-04**: Send button visible when idle + input non-empty. Stop button visible when streaming. Morph between states with CSS crossfade (opacity transition, 100ms), position-stable in same grid cell. Uses Lucide `Send` and `Square` icons.
- [ ] **CMP-05**: Send/Stop button has a local state machine: `idle` → `sending` (optimistic, after click before WS ack) → `active` (streaming) → `aborting` (stop pressed, before backend confirms abort) → `idle`. Prevents double-send and double-stop. Send disabled for 200ms after press, Stop disabled for 500ms.
- [ ] **CMP-06**: Stop sends `claude-abort` message to backend via WebSocket. Handles graceful wind-down (model may send a few more tokens before stopping).
- [ ] **CMP-07**: Image paste: `onPaste` handler extracts `image/png` and `image/jpeg` from `clipboardData`. Shows thumbnail preview chips above textarea (small cards with X to remove). Max 5 images per message.
- [ ] **CMP-08**: Image drag-and-drop: `onDrop` handler with drag overlay (dashed border, dimmed background via `onDragEnter`/`onDragLeave`). Same thumbnail preview as paste.
- [ ] **CMP-09**: Images use `URL.createObjectURL(blob)` for previews (not data URLs — prevents memory doubling). Object URLs revoked after message sent. Max 5MB per image.
- [ ] **CMP-10**: Images uploaded to backend via REST endpoint (`/api/projects/:name/upload-images`) as multipart/form-data, or sent inline in WebSocket `claude-command` message `options.images` field. Image references stored in message, not raw data.
- [ ] **CMP-11**: Cmd+. (Mac) / Ctrl+. (Windows) stops active generation (global keyboard shortcut via `useEffect`). Escape clears input text and blurs textarea.
- [ ] **CMP-12**: Draft text preserved per session in `useRef<Map<string, string>>`. On session switch, current draft saved, target session's draft restored. Persisted to localStorage for reload survival.
- [ ] **CMP-13**: Composer integrates with CSS Grid shell: `grid-template-rows: 1fr auto` (messages flex, composer intrinsic). Scroll position stabilized when composer height changes (capture scrollTop before resize, restore after).
- [ ] **CMP-14**: Textarea auto-focuses on session switch and on app load. Focus returned to textarea after sending a message.

### Message Types

- [ ] **MSG-01**: User messages: `bg-card` background, `rounded-lg`, pre-wrapped text, timestamp visible on hover (opacity 0→1 transition, zero layout shift, shows relative time like "2m ago")
- [ ] **MSG-02**: Assistant messages: no background (transparent), left-aligned, content rendered via MarkdownRenderer. Provider logo/icon in message header.
- [ ] **MSG-03**: Error messages: inline banner with `border-l-4 border-error` accent, `bg-error/10` muted background, error icon, error text. No retry button in M2 (defer complex retry logic).
- [ ] **MSG-04**: System messages: centered horizontally, `text-muted` color, smaller font size (`text-xs`), no background. Used for "Session started", "Context compacted", etc.
- [ ] **MSG-05**: Task notification messages: distinct icon (task/checklist), label text, `bg-surface-1` background, compact layout.
- [ ] **MSG-06**: Thinking blocks: expand/collapse disclosure with character count label ("1,234 chars") when collapsed, duration label ("took 3.2s") when available. Muted italic text styling inside disclosure. CSS Grid `grid-template-rows: 0fr/1fr` animation for expand/collapse (M1 pattern).
- [ ] **MSG-07**: Thinking block content renders as plain monospace text in M2 (defer markdown rendering of thinking to M3 — thinking rarely has complex markdown, and double-parsing is expensive)
- [ ] **MSG-08**: Global thinking toggle in UI store (persisted to localStorage). When collapsed-all, thinking disclosures render in collapsed state. Toggle accessible from chat header or keyboard shortcut.
- [ ] **MSG-09**: Image blocks in messages: user-sent images display as thumbnails (max 200px width, click to expand in lightbox overlay). Assistant-referenced images render inline at natural size with max-width constraint.
- [ ] **MSG-10**: All message types use consistent spacing: `gap-3` between messages, `py-3 px-4` internal padding. MessageContainer wrapper provides consistent layout regardless of type.
- [ ] **MSG-11**: Messages display in chronological order. Historical messages loaded from backend render identically to streamed messages (same components, same styling).

### Tool Cards — State Machine & Shell

- [ ] **TOOL-01**: Tool state machine: `invoked` → `executing` → `resolved` | `error`. Visual transitions via CSS `data-status` attribute. GPU-only animations during streaming (opacity, transform only — no height/width per Constitution 11.4).
- [ ] **TOOL-02**: ToolChip (inline compact pill): shows tool name, status dot (pulsing during `executing`, static green for `resolved`, static red for `error`). Click expands to ToolCard.
- [ ] **TOOL-03**: ToolCard (expanded view): shows via ToolCardShell wrapper with consistent header (tool name, status, elapsed time), body (tool-specific content), footer (collapse button). Expansion deferred until streaming ends.
- [ ] **TOOL-04**: Elapsed time counter on executing tools: updates every 100ms using `startedAt` timestamp from `ToolCallState`. Displays as "1.2s", "5.4s", etc. Timer cleaned up (clearInterval) on resolve/error/unmount.
- [ ] **TOOL-05**: Error state: expanded card with `border-error/30` accent, `bg-error/5` tint, error message text displayed. Always force-expanded (never auto-collapsed).
- [ ] **TOOL-06**: All rich tool cards register via existing `registerTool()` API. ToolCardShell shared wrapper provides consistent header/footer/expand behavior. DefaultToolCard remains as fallback for unregistered tools.

### Tool Cards — Per-Tool Implementations

- [ ] **TOOL-10**: BashToolCard: command displayed in monospace header with `$` prefix. Output in terminal-styled container (dark `bg-surface-0`, monospace font, `whitespace-pre-wrap`). Long output truncated at ~50 lines with "Show more" expand.
- [ ] **TOOL-11**: ReadToolCard: file path in header with file icon. Content rendered with Shiki syntax highlighting (language inferred from file extension). Line numbers displayed. Long files truncated at ~100 lines with "Show more" expand.
- [ ] **TOOL-12**: EditToolCard: file path in header. Unified diff view with green lines (`bg-diff-added`) for additions, red lines (`bg-diff-removed`) for deletions. Line numbers for both old and new. Diff parsing from tool output text.
- [ ] **TOOL-13**: WriteToolCard: file path in header with file icon. Content preview (first ~20 lines) with Shiki highlighting. "Show full file" expand for longer content.
- [ ] **TOOL-14**: GlobToolCard: glob pattern in header. Results as bulleted file list with file type icons. Count shown in header ("12 files found").
- [ ] **TOOL-15**: GrepToolCard: search pattern in header. Match results with file path, line number, and highlighted match context (2 lines before/after). Match term highlighted with `bg-primary/20`.

### Tool Cards — Grouping

- [ ] **TOOL-20**: Consecutive tool calls (≥2 in a row without intervening text) group into collapsible accordion. Header shows "N tool calls" with expand chevron and summary of tool types used.
- [ ] **TOOL-21**: Accordion expand/collapse uses CSS Grid `grid-template-rows: 0fr/1fr` animation (Constitution Tier 1 motion).
- [ ] **TOOL-22**: Error tool calls within a group are always force-expanded (never hidden in collapsed state).
- [ ] **TOOL-23**: Individual tool chips within a group are clickable to expand their specific card.

### Permissions

- [ ] **PERM-01**: WebSocket `claude-permission-request` events render as inline banners above the composer (not modal, not toast). Shows: tool name, truncated input preview (first 100 chars), Allow (green accent) and Deny (red accent) buttons.
- [ ] **PERM-02**: Allow click sends `claude-permission-response` with `granted: true` via WebSocket. Deny sends `granted: false`. Banner dismissed immediately after action.
- [ ] **PERM-03**: Timeout indicator: circular progress or countdown text showing remaining time (55s default from `CLAUDE_TOOL_APPROVAL_TIMEOUT_MS`). On timeout, banner auto-dismisses.
- [ ] **PERM-04**: Banner auto-dismisses on `claude-permission-cancelled` WebSocket event (backend cancelled the request).
- [ ] **PERM-05**: Only one permission banner active at a time (backend enforces sequential requests). If a new request arrives while one is displayed, replace the old one.

### Activity & Status

- [ ] **ACT-01**: Activity status line renders below message list, above composer. Displays current tool action text from `useStreamStore(s => s.activityText)`. Isolated `React.memo` component with single selector subscription.
- [ ] **ACT-02**: Activity text fades in/out with CSS transition (200ms opacity). Truncates long paths with ellipsis (`truncate` class). Only visible when `isStreaming && activityText` is truthy.
- [ ] **ACT-03**: Activity text updates debounced to 200ms in the multiplexer (not on every `tool_progress` event) to prevent excessive re-renders.
- [ ] **ACT-04**: Activity status line positioned outside the scroll container (fixed relative to composer area) — never causes scroll height changes.
- [ ] **ACT-05**: Token/cost display below each finalized assistant message: "1,234 in / 567 out · $0.003". Data from `Message.metadata.tokenCount` and `Message.metadata.cost`, populated from `token-budget` and `result` WebSocket events. Muted text (`text-muted text-xs`), always visible (not hover-only).

### Scroll & Navigation

- [ ] **NAV-01**: Scroll position preserved per session in `useRef<Map<string, number>>`. On session switch: save current `scrollTop`, restore target session's stored position via `useLayoutEffect`.
- [ ] **NAV-02**: `content-visibility: auto` with `contain-intrinsic-height: auto 200px` applied to past message containers (not the actively streaming message). Reduces rendering cost for off-screen messages. (Constitution 10.5)
- [ ] **NAV-03**: Existing scroll anchor enhanced with ResizeObserver on the scroll container's content. When dynamic height changes occur (code block highlighting, tool card expansion) and user is in auto-scroll mode (within 100px of bottom), maintain bottom lock.
- [ ] **NAV-04**: Scroll-to-bottom pill appears when user scrolls up more than 200px from bottom. Click returns to bottom with smooth scroll. Shows unread message count badge if new messages arrived while scrolled up.

### Polish

- [ ] **POL-01**: Message entrance animations: `animate-in fade-in-0 slide-in-from-bottom-2` via tailwindcss-animate. Duration 200ms, easing ease-out. Respects `prefers-reduced-motion` (instant, no animation). Only on newly appended messages, not on initial session load.
- [ ] **POL-02**: Streaming cursor: pulsing vertical bar at end of streaming text. Rose accent color (`var(--primary)`), 1s pulse cycle (opacity 0.4→1.0), hides on `data-phase="finalizing"` transition. Width 2px, height matches line-height.
- [ ] **POL-03**: Thinking block text: `italic text-muted font-mono text-sm` inside disclosure. Consistent with "internal monologue" visual language.
- [ ] **POL-04**: All CSS animations and transitions use design tokens (`--transition-fast`, `--transition-normal`, `--duration-*`) — no hardcoded durations. Constitution enforcement via existing ESLint rules.

### UI Primitives & Component Libraries

- [ ] **UI-01**: Initialize shadcn/ui in `src/` workspace (`npx shadcn@latest init`). Configure to use OKLCH design tokens by overriding shadcn CSS variables in `tokens.css`.
- [ ] **UI-02**: Install shadcn primitives needed for M2: `dialog` (permission requests, image lightbox), `tooltip` (hover info on tools, timestamps), `scroll-area` (code blocks, tool card output), `collapsible` (tool grouping, thinking blocks), `sonner` (toast notifications for copy feedback, errors), `dropdown-menu` (thinking toggle, context menus), `badge` (tool status, file counts), `kbd` (keyboard shortcut hints), `separator` (between message groups)
- [ ] **UI-03**: All shadcn components restyled to OKLCH token system — no default shadcn colors remain. Components in `src/src/components/ui/` use `bg-surface-*`, `text-muted`, `border-subtle` etc.
- [ ] **UI-04**: Cherry-pick CSS-only effects from React Bits (source-level copy, not npm): `SpotlightCard` (hover effect on tool cards, sidebar items), `ShinyText` (thinking/status indicators), `StarBorder` / `ElectricBorder` (composer border during active streaming)
- [ ] **UI-05**: All cherry-picked components use design tokens only — no hardcoded colors. Constitution ESLint rules must pass.

### Enhanced Chat Features

- [ ] **ENH-01**: Streamdown evaluation — if raw-to-formatted flash on stream completion feels jarring after Phase 1 ships, evaluate Streamdown as alternative streaming markdown renderer. Decision documented either way.
- [ ] **ENH-02**: BashToolCard output supports ANSI color codes (bold, colors, underline) via lightweight ANSI-to-HTML conversion
- [ ] **ENH-03**: Thinking block content renders markdown (bold, italic, code spans) via lightweight parser — not full react-markdown, just basic inline formatting
- [ ] **ENH-04**: Error messages include retry affordance — "Retry" button resends the last user message
- [ ] **ENH-05**: Message search within session — filter/highlight messages matching search text (basic substring match, not fuzzy)
- [ ] **ENH-06**: Conversation export — download session as Markdown file or JSON

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
| react-textarea-autosize | Pulls @babel/runtime; 20-line custom hook suffices |
| @shikijs/rehype | Blocks parse pipeline during grammar loading |
| Streamdown | Dual parser, CDN grammar loading, conflicts with rAF architecture |

## Architect Concerns (Bard Review)

Tracked from Gemini Architect consultation on 2026-03-07:

1. **Phase 1 density** — MD-01 through MD-15 plus CODE-01 through CODE-09 is ~60% of milestone risk. Consider splitting into sub-phases (Markdown + Shiki separately from marker interleaving).
2. **Marker schema** — MD-15 marker format must be defined once and used consistently. If format changes mid-milestone, finalized message cache breaks.
3. **innerHTML security** — MD-11 must use strict sanitizer allowlist. Never pass unsanitized AI output to innerHTML.
4. **Streaming-to-formatted flash** — MD-14 transition must be 200ms+ to mask the content swap. Test with code-heavy responses.
5. **Image rendering gap** — MSG-09 added per Bard's review. Without it, sent images vanish after send.

## Traceability

Updated during roadmap creation (2026-03-07).

| Requirement | Phase | Status |
|-------------|-------|--------|
| DEP-01 | Phase 11 | Pending |
| DEP-02 | Phase 11 | Pending |
| DEP-03 | Phase 11 | Complete |
| DEP-04 | Phase 11 | Complete |
| DEP-05 | Phase 11 | Complete |
| DEP-06 | Phase 18 | Pending |
| MD-01 | Phase 11 | Pending |
| MD-02 | Phase 11 | Pending |
| MD-03 | Phase 11 | Pending |
| MD-04 | Phase 11 | Pending |
| MD-05 | Phase 11 | Pending |
| MD-06 | Phase 11 | Pending |
| MD-10 | Phase 12 | Pending |
| MD-11 | Phase 12 | Pending |
| MD-12 | Phase 12 | Pending |
| MD-13 | Phase 12 | Pending |
| MD-14 | Phase 12 | Pending |
| MD-15 | Phase 12 | Pending |
| CODE-01 | Phase 11 | Complete |
| CODE-02 | Phase 11 | Complete |
| CODE-03 | Phase 11 | Complete |
| CODE-04 | Phase 11 | Complete |
| CODE-05 | Phase 11 | Complete |
| CODE-06 | Phase 11 | Complete |
| CODE-07 | Phase 11 | Complete |
| CODE-08 | Phase 11 | Complete |
| CODE-09 | Phase 11 | Complete |
| CMP-01 | Phase 13 | Pending |
| CMP-02 | Phase 13 | Pending |
| CMP-03 | Phase 13 | Pending |
| CMP-04 | Phase 13 | Pending |
| CMP-05 | Phase 13 | Pending |
| CMP-06 | Phase 13 | Pending |
| CMP-07 | Phase 13 | Pending |
| CMP-08 | Phase 13 | Pending |
| CMP-09 | Phase 13 | Pending |
| CMP-10 | Phase 13 | Pending |
| CMP-11 | Phase 13 | Pending |
| CMP-12 | Phase 13 | Pending |
| CMP-13 | Phase 13 | Pending |
| CMP-14 | Phase 13 | Pending |
| MSG-01 | Phase 14 | Pending |
| MSG-02 | Phase 14 | Pending |
| MSG-03 | Phase 14 | Pending |
| MSG-04 | Phase 14 | Pending |
| MSG-05 | Phase 14 | Pending |
| MSG-06 | Phase 14 | Pending |
| MSG-07 | Phase 14 | Pending |
| MSG-08 | Phase 14 | Pending |
| MSG-09 | Phase 14 | Pending |
| MSG-10 | Phase 14 | Pending |
| MSG-11 | Phase 14 | Pending |
| TOOL-01 | Phase 15 | Pending |
| TOOL-02 | Phase 15 | Pending |
| TOOL-03 | Phase 15 | Pending |
| TOOL-04 | Phase 15 | Pending |
| TOOL-05 | Phase 15 | Pending |
| TOOL-06 | Phase 15 | Pending |
| TOOL-10 | Phase 16 | Pending |
| TOOL-11 | Phase 16 | Pending |
| TOOL-12 | Phase 16 | Pending |
| TOOL-13 | Phase 16 | Pending |
| TOOL-14 | Phase 16 | Pending |
| TOOL-15 | Phase 16 | Pending |
| TOOL-20 | Phase 17 | Pending |
| TOOL-21 | Phase 17 | Pending |
| TOOL-22 | Phase 17 | Pending |
| TOOL-23 | Phase 17 | Pending |
| PERM-01 | Phase 17 | Pending |
| PERM-02 | Phase 17 | Pending |
| PERM-03 | Phase 17 | Pending |
| PERM-04 | Phase 17 | Pending |
| PERM-05 | Phase 17 | Pending |
| ACT-01 | Phase 18 | Pending |
| ACT-02 | Phase 18 | Pending |
| ACT-03 | Phase 18 | Pending |
| ACT-04 | Phase 18 | Pending |
| ACT-05 | Phase 18 | Pending |
| NAV-01 | Phase 18 | Pending |
| NAV-02 | Phase 18 | Pending |
| NAV-03 | Phase 18 | Pending |
| NAV-04 | Phase 18 | Pending |
| POL-01 | Phase 18 | Pending |
| POL-02 | Phase 18 | Pending |
| POL-03 | Phase 18 | Pending |
| POL-04 | Phase 18 | Pending |
| UI-01 | Phase 11 | Pending |
| UI-02 | Phase 11 | Pending |
| UI-03 | Phase 11 | Pending |
| UI-04 | Phase 19 | Pending |
| UI-05 | Phase 19 | Pending |
| ENH-01 | Phase 12 | Pending |
| ENH-02 | Phase 16 | Pending |
| ENH-03 | Phase 19 | Pending |
| ENH-04 | Phase 19 | Pending |
| ENH-05 | Phase 19 | Pending |
| ENH-06 | Phase 19 | Pending |

**Coverage:**
- v1.1 requirements: 97 total (corrected from initial 87 count)
- Categories: 13 (DEP, MD, CODE, CMP, MSG, TOOL, PERM, ACT, NAV, POL, UI, ENH)
- Mapped to phases: 97/97
- Unmapped: 0

---
*Requirements defined: 2026-03-07*
*Last updated: 2026-03-07 -- traceability updated during roadmap creation*
