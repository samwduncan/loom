# Phase 5: Chat Message Architecture - Context

**Gathered:** 2026-03-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Premium chat message structure — VS Code-quality syntax highlighting via Shiki, collapsible AI turn blocks, compact tool call action cards with grouping, animated thinking block disclosures, and streaming performance via requestAnimationFrame. This phase transforms the flat message list into a structured, navigable conversation. Creating diffs, user message styling, permission banners, and usage summaries are Phase 6.

</domain>

<decisions>
## Implementation Decisions

### Turn collapse behavior
- Turn blocks wrap AI responses only — user messages remain standalone between turns
- Collapsed preview: first line of AI prose + tool call count badge (e.g., "3 tools")
- Previous turns auto-collapse when a new AI turn starts
- Active (streaming) turn is visually distinct — highlighted border or different background to draw the eye
- Collapsed turns show duration (e.g., "took 45s")
- Failed tool calls show red accent on the badge (e.g., "5 tools - 2 failed")
- Expand/collapse all toolbar at the top of the chat area
- Expand animation: Claude's discretion (animate vs snap + scroll)

### Tool call card density
- Compact single-line: icon + tool name + key argument (e.g., "Read src/auth/login.ts")
- Success/failure: green check / red X icon at right edge of card line
- Type-based subtle background tint (edit = faint blue, bash = faint gray, search = faint purple, etc.)
- Edit/Write cards show filename only on compact line (no line count)
- Bash tool uses same card style as other tools (no special terminal mini-block)
- Expanding a card reveals full arguments + result inline (not tabbed)
- 3+ consecutive tool calls grouped under mixed-type summary header (e.g., "Read 3 files, searched 2 patterns")
- Grouped cards: expanding group shows compact cards, each individually expandable (nested two-level hierarchy)
- Subagent (Task tool) containers keep their distinct visual treatment (SubagentContainer component)

### Thinking block UX
- Completed thinking: Claude.ai-style simple disclosure triangle with muted "Thinking" text, collapsed by default
- Real-time thinking content: toggleable, off by default
- Toggle location: global setting in settings panel + per-block eye/toggle icon override
- Activity indicator: Claude CLI-style blinking amber/red text with rotating status phrases while working — separate from the thinking disclosure block
- The activity indicator replaces the current basic pulsing dots AssistantThinkingIndicator

### Code block presentation
- Migrate from react-syntax-highlighter (Prism/oneDark) to Shiki v4
- Theme: warm-tinted Dark+ variant that matches Loom's aesthetic (warm-shifted backgrounds, adjusted token colors)
- No line numbers
- Header bar: language name (left) + filename when available from context (center) + copy button (right)
- Streaming fallback: raw monospace text while code block is incomplete, Shiki highlighting applied on block completion
- Soft word wrap for long lines (no horizontal scrolling)
- Long code blocks (50+ lines) truncated at ~25 lines with "Show more" button
- Inline code (backtick): Claude's discretion (keep simple styled spans recommended)

### Claude's Discretion
- Expand animation style (smooth height animation vs snap + scroll-to-top)
- Inline code treatment (simple spans vs Shiki)
- Exact tool-type color tint values
- Exact rotating status phrases for the activity indicator
- Shiki warm Dark+ token color adjustments

</decisions>

<specifics>
## Specific Ideas

- "I want the thinking indicator to be like Claude Code CLI — blinking red/orange text with random phrases while it's working"
- Thinking blocks should look like actual Claude.ai chat — collapsible section, not a styled card
- The activity indicator with fun phrases is separate from the thinking disclosure — one is the live "what am I doing" animation, the other is the expandable thought content

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ToolRenderer` + config system (`tools/configs/toolConfigs`): Already routes tools to OneLineDisplay or CollapsibleDisplay — extend configs for new card style
- `OneLineDisplay` / `CollapsibleDisplay`: Existing display patterns to evolve into new card design
- `SubagentContainer`: Keeps distinct treatment per user preference
- `Markdown` component: Currently uses react-markdown + react-syntax-highlighter — Shiki migration replaces the CodeBlock sub-component
- `copyTextToClipboard` utility: Reuse for code block copy button
- `getToolConfig()` system: Tool-specific display configuration, extensible for new card styles

### Established Patterns
- Messages are flat `ChatMessage[]` with no turn/group concept — TurnBlock is entirely new architecture
- Streaming uses `setTimeout(100ms)` buffer in `useChatRealtimeHandlers` — upgrade to requestAnimationFrame
- `memo()` on `MessageComponent` — maintain/extend memoization for TurnBlock
- Tool calls use `isToolUse`, `toolName`, `toolInput`, `toolResult` fields on ChatMessage
- Thinking has `isThinking` flag + `reasoning` field on ChatMessage
- `showThinking` prop already flows through component tree (settings panel toggle exists)

### Integration Points
- `useChatRealtimeHandlers`: Generates ChatMessage objects from WebSocket — needs turn ID assignment logic
- `ChatMessagesPane`: Flat message rendering loop — needs turn grouping layer between it and MessageComponent
- `MessageComponent`: 490-line monolith — TurnBlock wraps/replaces much of its structure
- `AssistantThinkingIndicator`: Replace with new Claude CLI-style activity indicator
- Settings panel: Add real-time thinking toggle (showThinking already exists, extend for streaming visibility)

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-chat-message-architecture*
*Context gathered: 2026-03-02*
