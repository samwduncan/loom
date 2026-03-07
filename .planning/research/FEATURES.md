# Feature Landscape: M2 "The Chat"

**Domain:** AI chat interface -- complete conversation experience
**Researched:** 2026-03-07
**Confidence:** HIGH (verified against 6 reference apps, current tooling ecosystem, existing M1 architecture)

**Scope:** NEW features only. M1 delivered: streaming rAF buffer, ActiveMessage segments, ToolChip/ToolCard, session list, session switching, turn merging, tool_result filtering, basic scroll anchor, ThinkingDisclosure.

---

## Table Stakes

Features users expect. Missing = product feels incomplete.

| Feature | Why Expected | Complexity | Depends On (M1) | Notes |
|---------|-------------|------------|------------------|-------|
| Streaming Markdown rendering | Every competitor renders formatted text during stream. Plain text (current M1 state) feels broken. | High | `useStreamBuffer`, `ActiveMessage` segment array, `AssistantMessage` | **Use Streamdown** (Vercel's drop-in react-markdown replacement, built for AI streaming). Handles unterminated blocks (`**bold` without closing), progressive formatting, zero layout shift. Same plugin API as react-markdown. Constitution 12.1 already specifies this need. |
| Syntax-highlighted code blocks | Users immediately judge code quality by highlighting. Unformatted code = amateur hour. | Medium | Markdown renderer (above) | Shiki via `@streamdown/code` plugin or `react-shiki`. Lazy-load grammars per-language. Plain monospace shell renders first, colors apply when grammar loads (no CLS). Copy button with "Copied!" feedback. Language label in header bar. Max ~400px height with overflow scroll. |
| Auto-resize textarea | Every reference app uses auto-growing input. M1's fixed `<input type="text">` is a stub. | Low | `ChatComposer` (replace `<input>` with `<textarea>`) | CSS Grid trick: hidden `::after` pseudo-element mirrors content, grid stacks them, tallest child wins. Zero JS measurement. Cap at `max-height: 200px` with `overflow-y: auto`. Shift+Enter for newlines. |
| Send/Stop animation polish | M1 has conditional render (send vs stop). Needs smooth transition, not hard swap. | Low | `ChatComposer`, `useStreamStore.isStreaming` | Add CSS crossfade between send arrow and stop square (opacity transition, 100ms). Use Lucide `Send` and `Square` icons instead of inline SVG. Icon should morph position-stable (same grid cell). |
| All 7 message types rendering | Backend sends: user, assistant, tool, thinking, error, system, task_notification. M1 only renders user and assistant. | Medium | `MessageList`, `MessageContainer`, discriminated union types | Error messages: inline banner with red accent border, muted bg, retry affordance. System messages: centered, muted, smaller text. Task notifications: distinct icon + label. Each is a small component (~50 LOC). |
| Tool call state machine with timing | Users need to see tool execution progress. M1 has status dots but no elapsed time or transition animation. | Medium | `ToolChip`, `ToolCard`, `useStreamStore.activeToolCalls` | State machine: `invoked` -> `executing` -> `resolved`/`error`. Add: elapsed time counter (updates every 100ms while executing), CSS transition on status dot color change, error state with expanded red-tinted card. ToolCallState already has `startedAt`/`completedAt` fields. |
| Activity status line | "Reading auth.ts...", "Editing server.js..." -- shows agent is working, not frozen. | Low | `useStreamStore.activityText` (already in store, populated by multiplexer) | Render below composer or above ActiveMessage. Text derived from tool_start WebSocket events. Fade in/out with CSS transition (200ms). Truncate long paths with `truncatePath()` from tool-registry. |
| Scroll position preservation | Switching sessions must restore scroll position, not jump to top or bottom. | Medium | `useScrollAnchor`, `useSessionSwitch` | Store scroll position per-session in a `useRef<Map<string, number>>`. Save on session switch, restore with `useLayoutEffect` (lesson from Phase 9: useLayoutEffect, not useEffect + setTimeout). |
| User message styling | M1 UserMessage is minimal. Needs proper visual treatment. | Low | `UserMessage` component (exists) | Subtle background (`bg-card`), rounded corners (`rounded-lg`), left-aligned (Loom is a dev tool, not iMessage). Content as pre-wrapped text. Timestamp on hover (opacity:0 -> opacity:1, zero layout shift). |
| GFM table support | Markdown tables common in AI responses. Without GFM, tables render as plain text. | Low | Markdown renderer (Streamdown) | Streamdown supports GFM out of box. Tables need horizontal scroll wrapper (`overflow-x: auto` container). Constitution 12.3: defer table rendering during streaming until closing row detected. |
| Long content handling | URLs, file paths, hashes break layout without word-break rules. | Low | CSS on message containers | `overflow-wrap: break-word` on message content containers. Inline code: `overflow-x: auto`. Links: `target="_blank"` + `rel="noopener noreferrer"`. Constitution 12.4. |
| Thinking block improvements | M1 ThinkingDisclosure works but needs polish for daily use. | Low | `ThinkingDisclosure` (exists) | Add: character count or duration label, muted italic text styling inside disclosure, global toggle (collapse all thinking in session). CSS Grid animation already correct from M1. |

---

## Differentiators

Features that set Loom apart. Not expected, but create the "10/10" quality bar.

| Feature | Value Proposition | Complexity | Depends On | Notes |
|---------|-------------------|------------|------------|-------|
| Rich tool card views per tool type | Loom is a CODE tool -- tool inputs/outputs deserve proper rendering, not truncated JSON. This is THE differentiator. | High | Tool registry `renderCard`, Shiki | M1 `DefaultToolCard` shows truncated JSON `createElement` output. M2 upgrades each tool to a custom TSX component: **BashToolCard** (command header + terminal-styled output with ANSI color support), **ReadToolCard** (file path + syntax-highlighted content with line numbers), **EditToolCard** (file path + unified diff view with green/red lines using `--diff-added-bg`/`--diff-removed-bg` tokens), **WriteToolCard** (file path + content preview), **GlobToolCard** (pattern + file list), **GrepToolCard** (pattern + match results with line numbers + context). Each registers via existing `registerTool()`. |
| Image paste/drop in composer | Drag-and-drop or Ctrl+V image into chat. Backend already supports it (`images` field in `claude-command` WebSocket message). | Medium | `ChatComposer` textarea, backend `/api/projects/:name/upload-images` | Handle `onPaste` event, extract `image/png` from `clipboardData`. Handle `onDrop` with drag overlay (dashed border, dimmed background). Show thumbnail preview chips above textarea (small cards with X to remove). Convert to base64 data URI. Max 5 images (backend constraint). |
| Permission request banners | Claude requests tool permissions via WebSocket. M1 ignores `claude-permission-request` events. M2 renders them as interactive inline banners. | Medium | WebSocket `claude-permission-request` type, `PermissionResponse` message | Render in message flow with accent border (`border-primary/20`). Show: tool name, input preview (truncated), Allow/Deny buttons. Send `claude-permission-response` back via WebSocket. Auto-dismiss on `claude-permission-cancelled`. Timeout indicator (55s default from `CLAUDE_TOOL_APPROVAL_TIMEOUT_MS`). |
| Consecutive tool call grouping | When Claude runs 5 file reads in a row, show them as a collapsible group, not 5 separate chips. Reduces visual noise. | Medium | `ActiveMessage` segments, new `ToolCallGroup` component | Accordion: "5 tool calls" header with expand chevron. Expand to see individual ToolChips. V1 had this (`useTurnGrouping`, `ToolCallGroup`). Reimplement using CSS Grid `grid-template-rows: 0fr/1fr` for smooth expand/collapse. Error calls always force-expanded (never hidden in collapsed group). |
| Streaming cursor polish | Pulsing vertical bar at the end of streaming text. M1 has basic cursor. | Low | `streaming-cursor.css` (exists) | Upgrade: rose accent color (`var(--primary)`), pulse animation keyframe synced to 1s cycle, opacity 0.4-1.0 range. Hide via `data-phase="finalizing"` transition. Brand moment -- the cursor IS Loom during streaming. |
| Message entrance animation | Messages fade+slide in when appearing. Creates "alive" feeling. | Low | CSS on `MessageContainer` | `tailwindcss-animate` classes: `animate-in fade-in-0 slide-in-from-bottom-2`. Duration `300ms`, easing `ease-out-expo`. Stagger with `animation-delay` if multiple messages render simultaneously. Respect `prefers-reduced-motion` (instant, no animation). Constitution Tier 2 motion. |
| Token/cost display per turn | Show input/output tokens and estimated cost per assistant response. | Low | Backend `token-budget` WebSocket event, `Message.metadata` fields | Render below assistant message as muted text, always visible (not hover-only). Format: "1,234 tokens / $0.003". Data flows via `token-budget` WebSocket event and `result` SDK message type. Store in `Message.metadata.tokenCount` and `Message.metadata.cost`. |
| Keyboard shortcuts | Enter send, Shift+Enter newline, Cmd+. stop, Escape clear input. | Low | `ChatComposer` keydown handler | M1 has Enter-to-send on `<input>`. M2 with `<textarea>`: Shift+Enter inserts newline (default textarea behavior), Enter sends (preventDefault). Add global `useEffect` for Cmd+. (stop generation) and Escape (blur + clear). Foundation for M3 Cmd+K palette. |
| Draft preservation per session | Losing unsent text on session switch = frustration. | Low | `ChatComposer`, session switching | Store draft text per sessionId in a `useRef<Map<string, string>>`. Restore on session switch. Persist to localStorage for reload survival. Lightweight -- just the input value string. |

---

## Anti-Features

Features to explicitly NOT build in M2.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Character-by-character typewriter | PROJECT.md explicitly bans. Causes jitter at 100 tokens/sec. rAF buffer already batches correctly. | Continue M1 pattern: rAF buffer + batch DOM mutation. Streamdown handles visual smoothness of markdown rendering. |
| Virtual scrolling (react-virtual) | Constitution specifies `content-visibility: auto` first. Virtual scrolling fundamentally changes DOM/scroll math. Premature for M2. | Apply `content-visibility: auto` + `contain-intrinsic-size` on past `MessageContainer` elements. Escape hatch to react-virtual documented for M3 if insufficient. |
| Conversation branching/forking | PROJECT.md "Out of Scope". High complexity, low value for single-user tool. | Single linear thread per session. "New chat" is the branch mechanism. |
| Rich text editor (TipTap/ProseMirror) in composer | Massive bundle, massive complexity, minimal gain. Loom sends plain text prompts to coding agents, not formatted documents. Open WebUI uses TipTap for @ mentions, but we don't need that in M2. | Plain `<textarea>` with auto-resize. Slash commands via overlay menu in M3, not inline rich text. |
| Full Framer Motion | Constitution Tier 3 says LazyMotion only for complex orchestrations. M2 should use CSS transitions (Tier 1) and tailwindcss-animate (Tier 2). | CSS `transition` for state changes, `@keyframes` for continuous effects (cursor pulse), tailwindcss-animate for entrance/exit. |
| Artifacts/Canvas panel | M3/M4 scope. Massive feature (code execution, live preview, version control). | Tool cards within chat stream ARE the artifacts for a coding agent. Tool output displays inline. |
| Aurora/ambient effects | M3 scope. Visual effects audit documented these for polish phase. | No gradient overlays, shimmer effects, or ambient backgrounds. Focus on content rendering quality. |
| Model selector in composer | M4 multi-provider scope. Currently hardcoded to Claude. | No model picker. Provider fixed to Claude. |
| Sidebar slim collapse | M3 scope. Current sidebar is functional. | Keep existing sidebar behavior. |
| Cmd+K command palette | M3 scope. Needs settings, project switching, session search. | Basic keyboard shortcuts only (Enter, Shift+Enter, Cmd+., Escape). |
| Light mode | PROJECT.md: "Dark-only for M1-M3". OKLCH tokens are dark-only. | Dark mode only. |
| Settings panel | M3 scope. Not needed for core chat experience. | No settings UI. Configuration via backend/env only. |

---

## Feature Dependencies

```
Streaming Markdown (Streamdown) ──────┐
                                      ├─> Code blocks (Shiki highlighting lives inside markdown renderer)
GFM tables ───────────────────────────┘
                                      ├─> Rich tool cards (tool output needs markdown/syntax rendering)
                                      └─> EditToolCard diff view (needs syntax-aware rendering)

Auto-resize textarea ─────────────────┐
                                      ├─> Image paste (needs textarea onPaste, not input)
Shift+Enter newlines ─────────────────┘
                                      └─> Draft preservation (needs textarea value tracking)

Tool state machine (M1 exists) ───────┐
                                      ├─> Activity status line (derived from tool_start events)
                                      ├─> Rich tool card views (needs status to show output when resolved)
                                      ├─> Consecutive tool grouping (needs activeToolCalls array)
                                      └─> Elapsed time counter (needs startedAt timestamp)

All message types rendering ──────────┐
                                      ├─> Permission request banners (interactive message type)
                                      └─> Error display (inline banner vs toast routing)

Scroll anchor (M1) ──────────────────> Scroll position preservation (per-session map)

Markdown rendering ──────────────────> Token/cost display (renders below markdown content)
```

---

## Phasing Recommendation

### Phase 1: Markdown + Code Blocks (Foundation)
Streaming markdown is the highest-value, highest-risk feature. All visual quality depends on it.
- Streamdown integration (replace plain text in AssistantMessage + ActiveMessage)
- Shiki code blocks with lazy-loaded grammars
- GFM tables with horizontal scroll wrapper
- Long content handling (word-break, link targets)
- Code block copy button with "Copied!" feedback
- **Risk:** Streamdown is new (2025). If it breaks our rAF buffer pattern, fallback is react-markdown with custom incomplete-block remark plugin (Constitution 12.1 specifies this approach).

### Phase 2: Composer Upgrade
The composer is the user's primary interaction. Must feel right before testing full loop.
- Replace `<input>` with auto-resize `<textarea>` (CSS Grid trick)
- Shift+Enter for newlines, Enter to send
- Image paste/drop with thumbnail preview chips
- Send/Stop animation polish (crossfade, Lucide icons)
- Keyboard shortcuts (Cmd+., Escape)
- Draft preservation per session

### Phase 3: Message Types + Tool Polish
Complete message type coverage and elevate tool call experience.
- All 7 message types (error banner, system message, task_notification)
- Permission request banners (Allow/Deny interactive)
- Rich tool card views (BashToolCard, ReadToolCard, EditToolCard, WriteToolCard, GlobToolCard, GrepToolCard)
- Tool state elapsed time counter
- Consecutive tool call grouping (accordion)
- Activity status line

### Phase 4: Scroll + Polish + Integration
Wire everything together for complete experience.
- Scroll position preservation across session switches
- Message entrance animations (tailwindcss-animate)
- Token/cost display per turn
- Thinking block global toggle + styling polish
- `content-visibility: auto` on past messages (Constitution 10.5)
- Streaming cursor polish (rose accent, pulse timing)
- User message styling upgrade

---

## MVP Recommendation

Prioritize:

1. **Streaming Markdown** (Phase 1) -- single highest-impact feature. Transforms plain text into a professional chat. Streamdown is purpose-built for this exact use case.

2. **Auto-resize textarea** (Phase 2) -- low effort, massive UX improvement. CSS Grid trick = near-zero JS complexity. Unlocks Shift+Enter and image paste.

3. **All 7 message types** (Phase 3) -- without error/system rendering, real conversations show broken gaps. Each type is a small component.

4. **Rich tool cards** (Phase 3) -- tools are Loom's identity. A coding agent's file reads, edits, and bash commands should look exceptional, not like truncated JSON.

Defer:
- **Image paste**: Medium complexity, not blocking conversation flow. End of Phase 2.
- **Permission banners**: Important for real usage but not for visual quality assessment. Phase 3.
- **Token/cost display**: Nice-to-have, data already flows through WebSocket. Phase 4.
- **Consecutive tool grouping**: Polish feature, not blocking. Phase 3.
- **Draft preservation**: Low priority, low effort. Phase 2 if time permits.

---

## Key Technical Decisions

### Streamdown vs react-markdown
**Use Streamdown.** Vercel's drop-in replacement for react-markdown, purpose-built for AI streaming. Key advantages over react-markdown:
- Handles unterminated markdown blocks during streaming (no layout flash)
- Progressive formatting (applies styling to partial content as tokens arrive)
- Same plugin API (`remarkPlugins`, `rehypePlugins` arrays)
- Built-in Shiki integration via `@streamdown/code`
- Security hardening (blocks images/links from unexpected origins)

The Constitution already specifies react-markdown + remark + rehype, and Streamdown is API-compatible. If Streamdown's internal rendering conflicts with our rAF DOM-mutation pattern (LOW risk -- Streamdown takes a string prop, doesn't need to own the DOM), fallback is react-markdown with a custom remark plugin that closes unclosed code blocks (Constitution 12.1).

**Confidence:** HIGH -- Streamdown launched 2025, maintained by Vercel, production-proven.

### Shiki integration path
**Use `@streamdown/code` first** (Streamdown's built-in code plugin). If insufficient (e.g., can't map OKLCH tokens to theme colors), fall back to `react-shiki` which provides `useShikiHighlighter` hook with throttled streaming support. Either way, grammars lazy-load per-language. Web bundle is ~695KB total but only used grammars are downloaded. Theme must map to OKLCH design tokens (create a custom Shiki theme JSON that references CSS custom properties via `color-mix()` or computed hex values from `--tokens`).

**Confidence:** HIGH -- Shiki is the industry standard. Claude.ai, ChatGPT, Streamdown all use it.

### Textarea auto-resize technique
**CSS Grid trick** from CSS-Tricks:
```css
.composer-wrap { display: grid; }
.composer-wrap > textarea,
.composer-wrap::after {
  grid-column: 1; grid-row: 1;
  font: inherit; padding: inherit;
  white-space: pre-wrap; word-wrap: break-word;
}
.composer-wrap::after {
  content: attr(data-value) " ";
  visibility: hidden;
}
```
Update `data-value` attribute on every input change. The hidden `::after` element grows with content, pushing the grid row height, and the textarea follows. Zero JS measurement, no `scrollHeight` polling, no `ResizeObserver`. Cap at `max-height: 200px` with `overflow-y: auto`.

**Confidence:** HIGH -- well-documented, widely used.

### Streamdown + rAF buffer integration
**Key architectural question:** M1 uses `useStreamBuffer` with `useRef` + direct DOM mutation to paint tokens at 60fps, bypassing React. Streamdown is a React component that takes a `content` string prop. These patterns need to coexist:

**Approach:** During streaming, ActiveMessage continues using rAF DOM mutation for raw text (immediate visual feedback). On stream completion (`handleFlush`), the final text is stored in the timeline store. `AssistantMessage` (historical messages) renders via Streamdown with full markdown formatting. This means streaming text is PLAIN during stream and FORMATTED after completion. This is acceptable because:
1. Streaming text changes too fast for users to read markdown formatting anyway
2. Streamdown re-renders on every content change, which would fight the rAF buffer
3. The "flash" from plain to formatted on completion can be masked by the finalization CSS transition (already exists in M1's `data-phase` attribute)

**Alternative:** Feed accumulated text to Streamdown on a debounced schedule (every 200ms) during streaming, keeping rAF for the cursor/text painting. This gives live markdown during streaming but adds complexity. Research flag for phase execution.

**Confidence:** MEDIUM -- the integration pattern needs validation during Phase 1 implementation.

### Tool card architecture
**Keep M1 registry, replace DefaultToolCard with per-tool components:**
- `BashToolCard` -- command in monospace header + terminal-styled output (dark bg, green/white text)
- `ReadToolCard` -- file path header + Shiki-highlighted content with line numbers
- `EditToolCard` -- file path header + unified diff view (Constitution diff tokens: `--diff-added-bg`, `--diff-removed-bg`)
- `WriteToolCard` -- file path header + content preview (truncated, expandable)
- `GlobToolCard` -- pattern header + file list (bulleted, clickable paths)
- `GrepToolCard` -- pattern header + matches with line numbers and context lines

Each card registers via existing `registerTool()`. The `ToolConfig` interface already supports `renderCard: ComponentType<ToolCardProps>`. Cards share a `ToolCardShell` wrapper for consistent header/footer/expand behavior.

**Confidence:** HIGH -- M1 registry is proven. Just needs richer implementations.

### Permission request approach
**Inline banner in message flow, not modal/toast.** Permission requests are contextual (they appear during a specific tool call) and need Allow/Deny interaction. A modal would block the whole UI; a toast would be dismissible. An inline banner at the bottom of the message list (above composer) is correct:
- Shows tool name + truncated input
- Allow (green) / Deny (red) buttons
- Timer indicator (55s countdown)
- Dismisses on `claude-permission-cancelled` event
- Only one active at a time (backend enforces this)

**Confidence:** HIGH -- matches Claude.ai's permission pill pattern + LibreChat's approval flow.

---

## Sources

- [Streamdown (Vercel)](https://streamdown.ai/) -- drop-in react-markdown replacement for AI streaming
- [Streamdown GitHub](https://github.com/vercel/streamdown) -- source, docs, plugin API
- [react-shiki](https://github.com/AVGVSTVS96/react-shiki) -- React Shiki component with streaming throttle support
- [Shiki](https://shiki.style/guide/) -- syntax highlighter, lazy-loaded grammars, ~695KB web bundle
- [CSS-Tricks autogrowing textareas](https://css-tricks.com/the-cleanest-trick-for-autogrowing-textareas/) -- CSS Grid auto-resize technique
- [Incremark](https://www.incremark.com/) -- alternative O(n) incremental streaming markdown renderer
- [AI SDK markdown chatbot memoization](https://ai-sdk.dev/cookbook/next/markdown-chatbot-with-memoization) -- block-level memoization pattern
- `.planning/reference-app-analysis.md` -- 6 reference app UX analysis (Claude.ai, ChatGPT, Perplexity, Open WebUI, LobeChat, LibreChat)
- `.planning/V2_CONSTITUTION.md` -- Sections 11-12 (motion + markdown conventions)
- `.planning/BACKEND_API_CONTRACT.md` -- WebSocket protocol (claude-permission-request/response, token-budget, tool events)
- `.planning/MILESTONES.md` -- M2 gate criteria, store schemas
