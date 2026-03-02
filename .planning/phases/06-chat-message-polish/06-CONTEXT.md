# Phase 6: Chat Message Polish - Context

**Gathered:** 2026-03-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Complete the chat message experience — diffs, user messages, permission banners, usage summaries, system status messages, and layout all feel designed and intentional. This phase polishes existing message rendering and adds missing display components. No new features or CLI integrations.

</domain>

<decisions>
## Implementation Decisions

### Message Layout & Roles
- User messages stay right-aligned but restyle: swap blue bubble for warm amber tint background, rounded-lg (not rounded-2xl with clipped corner)
- No avatar or role label on user messages — the amber tint and right-alignment are sufficient visual distinction
- Both user and AI messages share ~720px max-width centered column
- Turn structure: keep current collapsible header (provider logo, first prose line, tool count badge, duration)
- **No auto-collapse**: Remove the behavior that collapses previous turns when a new streaming turn starts
- All turns default to expanded; collapse on scroll-away, re-expand when revisited (IntersectionObserver-based)
- AI turn content flows as one continuous block — thin subtle 1px divider lines (warm muted tone) separate tool calls, thinking, code, and prose sections
- Copy button on user messages: hover-reveal outside the message block (right side), not always visible inside
- Timestamps remain on every individual message
- Image lightbox: clicking user-attached images opens a dark overlay with full image instead of new browser tab

### Diff Presentation
- Unified diff view (single column) using `react-diff-viewer-continued`
- Syntax highlighting within diff lines using Shiki (already used for code blocks)
- 3 lines of context above and below each changed hunk
- File path header is clickable — opens the file in the code editor panel (uses existing `onFileOpen` callback)
- Warm color theme: green additions, red removals, gray context lines, hunk markers, all tinted to match earthy palette

### Usage Display
- Per-turn usage footer at the bottom of each AI turn:
  - Line 1: Token breakdown (input/output/cache read/cache creation)
  - Line 2: Cost + model name/ID
  - Always visible, never collapsed
- Session cumulative total displayed as a status line under the chat composer (enhancing existing TokenUsagePie area)
- Data source: extract from streaming API response metadata per-turn (`usage.input_tokens`, `output_tokens`, `cache_read_input_tokens`, `cache_creation_input_tokens`)
- Cost: hardcoded client-side pricing table by model ID (Claude Sonnet, Opus, Haiku, Codex, Gemini)

### System Status Messages
- Three tiers: gray info, amber warning, terracotta error
- Small icon + text for each (info circle, warning triangle, error X)
- Event mapping:
  - Gray info: session started, model switched, context loaded
  - Amber warning: rate limit approaching, long response time
  - Terracotta error: API error, connection lost, tool failure
- Always persist in chat history — not dismissible

### Permission Banners
- Highlighted inline banner within message flow — warm amber background with distinct border
- Shows: tool name (bold) + action description + status (Waiting/Approved/Denied)
- Interactive approve/deny buttons in the web UI
- Both CLI and web UI can respond to permission prompts — first response wins, other side updates to show result

### Interactive Prompts
- Restyle to warm card with copper accent border, warm brown surface background
- Options as smaller, clean buttons matching warm palette
- Interactive in web UI — users can click option buttons to respond via websocket instead of switching to CLI
- "Waiting for response" indicator has a gentle pulse animation

### Thinking Disclosure
- Muted collapsible section — dimmed text, slightly indented, warm gray tones
- Small "Thinking..." disclosure toggle
- Collapsed summary: "Thinking... (1.2K chars)" with character count
- Doesn't compete visually with actual response content

### Error Messages
- Inline terracotta banner matching system status error tier — terracotta left border, error icon, muted background
- No separate red circle avatar — flows inline with conversation
- First 3 lines visible; "Show full error" toggle for longer errors/stack traces

### Claude's Discretion
- Task notification restyling (current dot + text may stay or align with system status tier)
- Exact divider line colors and spacing within AI turns
- Lightbox overlay implementation details
- Exact warm tint hex values for user messages
- Pulse animation timing and style for interactive prompt waiting indicator

</decisions>

<specifics>
## Specific Ideas

- Session cumulative total should feel like a status line under the chat composer, similar to how the existing TokenUsagePie area works but enhanced with token count + session cost text
- Permission approve/deny should work as "both can respond, first wins" — no priority system, simple race condition handling via websocket
- Interactive prompts should use the same websocket channel as permission responses for consistency
- Collapse-on-scroll-away behavior for turns should use IntersectionObserver for performance

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `DiffViewer.jsx` (src/components/DiffViewer.jsx): Basic line-by-line diff renderer — will be replaced by react-diff-viewer-continued integration
- `ThinkingDisclosure` component: Already handles show/hide thinking — needs warm theme styling
- `ToolActionCard.tsx`: Compact tool card with expand/collapse and category-based tints — pattern to follow for permission banners
- `TokenUsagePie.tsx`: Session-level usage pie chart — will be enhanced with cumulative text
- `copyTextToClipboard` utility: Already used for user message copy — reuse for hover-reveal button
- `SessionProviderLogo`: Provider logo component — already in turn headers
- Shiki highlighter: Already integrated for code blocks — extend to diff syntax highlighting

### Established Patterns
- CSS grid 0fr/1fr animation for smooth height transitions (used in TurnBlock, ToolActionCard) — reuse for collapse behaviors
- Turn grouping via `useTurnGrouping` hook — extend to carry per-turn usage data
- `useChatRealtimeHandlers.ts` processes streaming events — extend to extract usage metadata
- Tool category-based tinting in ToolActionCard (`categoryBg` map) — follow same pattern for message type tinting

### Integration Points
- `ChatMessagesPane.tsx` renders the message list — layout changes happen here
- `MessageComponent.tsx` handles per-message rendering — user message restyle, error banner, system status rendering
- `TurnBlock.tsx` handles AI turn structure — continuous flow, usage footer, collapse behavior
- `ChatInputControls.tsx` has the composer controls area — session cumulative status line goes here
- `server/routes/agent.js` already extracts per-turn token usage — frontend needs to consume this
- `server/index.js` session token-usage endpoint — may need updates for per-turn data streaming

</code_context>

<deferred>
## Deferred Ideas

- GSD CLI native integration (similar to TaskMaster CLI integration) — separate phase
- CodeRabbit CLI integration — separate phase

</deferred>

---

*Phase: 06-chat-message-polish*
*Context gathered: 2026-03-02*
