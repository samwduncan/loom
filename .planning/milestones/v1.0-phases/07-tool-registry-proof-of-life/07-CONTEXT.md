# Phase 7: Tool Registry + Proof of Life - Context

**Gathered:** 2026-03-06
**Status:** Ready for planning

<domain>
## Phase Boundary

A pluggable tool registry handles any tool name gracefully, and a proof-of-life page demonstrates the entire pipeline working end-to-end -- WebSocket connection, streaming tokens, thinking blocks, tool call display, and connection status all visible in the browser. No markdown rendering (M2), no sidebar (Phase 8), no full chat composer (M2) -- this is the vertical slice proving every M1 subsystem works together.

</domain>

<decisions>
## Implementation Decisions

### Tool chip visuals
- **Shape:** Compact single-line chip pill rendered inline with streamed text
- **Surface:** `--surface-raised` background + `--border-subtle` border, `border-radius: 6px`, `padding: 4px 10px`
- **Status indicator:** Colored dot (small filled circle) using shared default state colors:
  - `invoked`: `--accent-primary` (dusty rose), pulsing CSS animation
  - `executing`: `--status-warning` (amber), pulsing CSS animation
  - `resolved`: `--status-success` (green), static
  - `rejected`: `--status-error` (red), static
- **Content on chip:** Status dot + tool name + key input field (truncated) + status icon
  - Bash: shows truncated command (~40 chars)
  - Read/Write/Edit: shows relative file path, truncated from left if long (`...chat/view/ActiveMessage.tsx`)
  - Glob/Grep: shows pattern
  - Unknown tools: shows raw tool name
- **Expand behavior:** Click to toggle inline expand (pushes content below down, no popover)
- **Expanded view:** Shows key input field + truncated output. Shared layout for all tools in M1 -- no per-tool custom cards yet. Error output shown in `--status-error` color for rejected tools.
- **Placement:** Inline with streamed text at the point they occurred in the conversation flow (chronological interleaving)

### Tool call interleaving with streaming text
- **Strategy:** Sibling rendering with real-time text span splitting
- **Mechanism:** ActiveMessage subscribes to `useStreamStore(s => s.activeToolCalls)`. When a new tool call appears mid-stream, the current text span "closes" and a ToolChip component renders after it. A new text span ref is created for subsequent text tokens. The rAF loop always writes to the latest text span.
- **Text:** Still bypasses React reconciler via rAF (zero re-renders for text). Tool chips use normal React rendering (append-only, minimal re-render cost).
- **Implication:** ActiveMessage needs refactoring from Phase 6's single-span design to support an array of segments (text spans and tool chips). The useStreamBuffer hook needs to support switching its target text node ref.
- **Race condition mitigation:** The rAF loop must buffer tokens internally when the target ref is null (during React's commit phase for a new span). Tokens accumulate in the buffer and flush on the next frame when the ref is available. No data loss, at most ~16ms visual delay during span switch. Do NOT use `flushSync` -- that defeats the purpose of bypassing React for text.
- **Re-render scope:** Container-level re-renders when tool chips insert are expected and acceptable. STRM-03 "zero re-renders" applies to text content updates, not structural changes from tool insertion.

### Registry architecture
- **File:** `src/src/lib/tool-registry.ts`
- **API:** `registerTool(toolName, config)`, `getToolConfig(toolName)` returning `ToolConfig | DefaultToolConfig`
- **ToolConfig fields:** `displayName`, `icon` (`React.ComponentType` -- M1 implementations return a span with Unicode emoji, M2 swaps for SVG), `getChipLabel(input)` (extracts key input field per tool), `stateColors` (optional override, defaults provided), `renderCard` (React component for expanded view -- shared stub in M1)
- **Registered tools (M1):** Bash, Read, Edit, Write, Glob, Grep -- each with smart `getChipLabel` extracting key input field
- **Default fallback:** Unknown tools get generic `⚙️` icon, raw tool name as displayName, raw input JSON in chip label. No crash, no visual jarring.
- **Icons:** Unicode/emoji for M1 -- `▶` Bash, `📄` Read, `✏️` Edit, `📝` Write, `🔍` Glob, `🔎` Grep, `⚙️` default
- **State colors:** Shared defaults for all tools. Per-tool override in ToolConfig but not used in M1.

### Thinking block display
- **Container:** Collapsible disclosure section above the response text
- **During active thinking:** Expanded with pulsing "Thinking..." label (opacity pulse CSS animation). Thinking text visible below label in `--text-muted` color. Thinking content reads from `useStreamStore(s => s.thinkingState)` -- no local state for thinking text.
- **After thinking completes:** Collapses automatically. Shows "Thinking (N blocks)" with disclosure triangle. Click to expand and read.
- **Surface:** Distinct subtle tint -- `color-mix(in oklch, var(--text-muted) 5%, transparent)` background, `border-radius: 8px`. NOT dusty rose (that's for ActiveMessage). Visually distinct from tool chips (which use `--surface-raised`).
- **Typography:** Proportional font (`--font-ui` / Inter) at `0.875rem` (14px), `--text-muted` color. Thinking is natural language, not code.

### Proof-of-life page
- **Route:** `/dev/proof-of-life` -- standalone dev route outside AppShell, like `/dev/tokens`
- **Layout:** Full viewport height. Connection status dot at top. Scrollable conversation area in the middle. Input field + Send/Stop button fixed at bottom. Chat-like layout.
- **Prompt input:** Editable text input with default value "Write a haiku about coding". Send button submits. Enter key submits.
- **Send/Stop:** Send button disabled during streaming. Stop button appears during streaming -- sends `abort-session` to backend. Partial response preserved on abort.
- **Conversation history:** Previous responses stay visible, appending below. Each new prompt/response pair adds to the conversation. Proves timeline store accumulation + exercises scroll anchor.
- **User messages:** User prompts render as distinct message bubbles in the conversation flow before each response. Establishes the chat pattern.
- **Tool calls:** Rendered inline using the real tool registry -- proves registry + streaming pipeline together end-to-end.
- **Thinking:** Rendered as collapsible section per the thinking block display decisions above.
- **Connection status:** Single dot at page top -- green (connected), yellow pulse (reconnecting), red (disconnected). Text label showing connection target.
- **Error display:** `claude-error` messages render as inline error messages in the conversation flow with `--status-error` tint and `⚠` icon. No toast/overlay.
- **Debug info:** None beyond connection status. This is a demo, not a debug panel.

### Claude's Discretion
- Exact ToolChip and ToolCard component structure and props
- How useStreamBuffer is refactored to support multi-span text splitting (the ref-switching mechanism)
- Thinking disclosure implementation (details element, custom state, etc.)
- Proof-of-life page styling details and spacing
- User message bubble styling (right-aligned, color treatment)
- How `getChipLabel` truncates paths (exact character limits, ellipsis placement)
- Whether to use the existing ActiveMessage or create a new StreamingConversation wrapper that composes ActiveMessage + tool chips + thinking
- Test strategy for the registry and proof-of-life components
- CSS animation details for pulsing dots and thinking label

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ActiveMessage` (`src/src/components/chat/view/ActiveMessage.tsx`): Single-span rAF streaming with finalization lifecycle. Needs refactoring for multi-span + tool chip interleaving.
- `useStreamBuffer` (`src/src/hooks/useStreamBuffer.ts`): rAF token buffer writing to a text node ref. Needs extension to support switching target ref mid-stream.
- `useScrollAnchor` + `ScrollToBottomPill`: Scroll anchor system ready to use on the proof-of-life page.
- `stream-multiplexer.ts`: Already routes tool_use, tool_result, thinking, and content tokens to separate callbacks. `getToolActivityText()` already extracts key input fields for activity text -- reusable for chip labels.
- `websocket-init.ts`: Already wires multiplexer callbacks to Zustand stores. Tool calls already populate `useStreamStore.activeToolCalls`.
- `wsClient` singleton: Already has `send()`, `subscribeContent()`, `startContentStream()`/`endContentStream()`.
- `ToolCallState` type: Already has `id`, `toolName`, `status`, `input`, `output`, `isError`, `startedAt`, `completedAt`.
- `streaming-cursor.css`: Cursor + ActiveMessage styling with data-phase transitions.
- `scroll-pill.css`: Frosted glass scroll pill styling.

### Established Patterns
- Zustand stores with selector-only access (ESLint enforced)
- Named exports only (ESLint enforced)
- Test files colocated with source (*.test.ts beside *.ts)
- Constitution enforcement active on all new code
- `cn()` utility for className composition
- No React Context for mutable state (Constitution 4.4)
- WS client is a pure singleton -- components import `wsClient` directly
- Content stream uses Set-based listener pattern (not EventEmitter)
- `contain: content` required on streaming containers (Constitution 10.3)

### Integration Points
- `useStreamStore(s => s.activeToolCalls)` -- tool calls populated by websocket-init.ts via multiplexer
- `useStreamStore(s => s.thinkingState)` -- thinking blocks populated by multiplexer
- `useStreamStore(s => s.isStreaming)` -- drives Send/Stop button state, cursor, scroll anchor
- `useConnectionStore(s => s.providers.claude.status)` -- drives connection status dot
- `wsClient.send({ type: 'claude-command', ... })` -- sends prompts to backend
- `wsClient.send({ type: 'abort-session', ... })` -- stops active stream
- `useTimelineStore.addMessage()` -- finalized messages flush here
- `App.tsx` route structure -- add `/dev/proof-of-life` alongside `/dev/tokens`

</code_context>

<specifics>
## Specific Ideas

- The chip design (compact pill with colored dot) is deliberately minimal -- V1 had 17 tool configs and the visual weight was overwhelming. M1 chips should be scannable at a glance.
- Real-time text span splitting is the technically ambitious part of this phase. The rAF buffer needs to handle ref switching cleanly. If this proves too complex, a fallback of appending tool chips after all text (post-hoc interleaving on finalization) is acceptable for M1.
- The proof-of-life page is intentionally chat-like (bottom input, user bubbles, scrolling history) to validate that the entire M1 stack works as a real application, not just a demo harness.
- `getToolActivityText()` in stream-multiplexer.ts already does most of the input field extraction logic that `getChipLabel()` needs -- consider reusing or sharing the extraction logic.
- The thinking disclosure with pulse animation directly scaffolds CHAT-03 from M2 -- the M2 implementation adds streaming thinking text and better collapse/expand transitions, but the disclosure pattern is established here.

</specifics>

<deferred>
## Deferred Ideas

- **Per-tool custom expanded cards**: Bash with terminal-style output, Read with line numbers, Edit with diff viewer -- M2 (CHAT-02)
- **Tool call grouping/accordion**: 3+ consecutive tool calls auto-grouped into "N tool calls" accordion -- M3 (POLISH-04)
- **SVG/Lucide icons**: Replace Unicode emoji with proper SVG icons -- M2/M3 polish
- **Tool call animations**: State machine transitions with spring physics -- M2 (CHAT-02)
- **Per-tool state colors**: Custom accent colors per tool type -- consider for M3

</deferred>

---

*Phase: 07-tool-registry-proof-of-life*
*Context gathered: 2026-03-06*
