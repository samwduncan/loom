# Phase 8: Error Handling and Status - Context

**Gathered:** 2026-03-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Errors are communicated clearly and non-disruptively, the AI's current activity is always visible, and the user can stop generation at any time. This phase delivers: toast notifications for transient errors, inline banners for permanent errors, a global activity status line, and stop generation with message queuing.

</domain>

<decisions>
## Implementation Decisions

### Toast notifications
- Position: bottom-right of viewport
- Stacking: max 3 visible, newest on top, "+N more" counter for overflow
- Auto-dismiss: 5 seconds, timer pauses on hover
- Visual tiers: info (neutral), warning (amber), error (red-accent) — matching SystemStatusMessage's existing tier system
- Animation: slide in from right, fade out on dismiss

### Inline error banners
- Extend existing `SystemStatusMessage` component — add a persistent "fatal" tier with red accent, dismiss button, expandable details
- Detail level: one-line summary by default, click to expand full error details (stack trace, exit code)
- Dismissible: user can click X to clear the banner
- Placement: immediately after the failing assistant message in the message flow — contextual cause-and-effect

### Activity status line
- Position: bottom of chat area, above composer — replaces the existing ClaudeStatus bar entirely
- Displays: tool name + key argument during tool execution (e.g., "Running: Edit src/auth/login.ts")
- Fallback: "Thinking..." with elapsed time and subtle spinner when no tool is active
- Includes: elapsed time counter, stop button (migrated from ClaudeStatus)
- Spinner on the active tool card in the message flow (per success criteria)

### Stop generation UX
- Send button morphs into stop button while AI is responding (standard ChatGPT/Claude.ai pattern)
- **Input stays enabled during generation** — user can type and hit Enter to queue messages (Claude Code CLI behavior)
- Queued messages shown with subtle queue badge/counter near composer
- Stop triggers: click stop button OR single Esc keypress
- Partial output: kept in chat with a visual "[generation stopped]" footer/indicator
- Backend: abort signal sent via WebSocket, AbortController on backend request handler

### Claude's Discretion
- Toast entrance/exit animation specifics
- Exact status line spinner design and animation
- Queue badge visual treatment
- How multiple queued messages are handled when generation completes
- Error detail formatting in expanded banners

</decisions>

<specifics>
## Specific Ideas

- "Like Claude Code CLI" — during generation, stop button replaces send but input stays active for queuing messages. Enter sends/queues, Esc or stop button aborts.
- Status line should feel like a natural evolution of the existing ClaudeStatus bar, not an additional element

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `SystemStatusMessage` (src/components/chat/view/subcomponents/SystemStatusMessage.tsx): Has info/warning/error tiers with warm palette. Extend for inline error banners with fatal tier + expand/dismiss.
- `ClaudeStatus` (src/components/chat/view/subcomponents/ClaudeStatus.tsx): Processing indicator with spinner, elapsed time, abort button. Will be replaced by the new activity status line — migrate useful logic.
- `ToolActionCard` (src/components/chat/view/subcomponents/ToolActionCard.tsx): Compact expandable tool cards with category icons and status indicators. Spinner on active card needs wiring.
- `ConnectionStatusDot` (src/components/chat/view/subcomponents/ConnectionStatusDot.tsx): WebSocket connection state indicator — complements toast system for connection errors.
- `lucide-react` icons already used throughout (Info, AlertTriangle, XCircle, CheckCircle2, etc.)

### Established Patterns
- Warm palette colors: `#c4a882` (cream), `#b85c3a` (red-accent), amber-500 for warnings
- CSS grid animation for expand/collapse (ToolActionCard uses `gridTemplateRows: 0fr/1fr`)
- `isLoading` + `onAbortSession` props flow through ChatComposer → ClaudeStatus
- `session-aborted` WebSocket event already handled in useChatRealtimeHandlers
- `cancelAnimationFrame` used for stream buffer cleanup

### Integration Points
- ChatComposer: receives `isLoading`, `onAbortSession` — needs new `onQueueMessage` capability + input enabled during loading
- useChatRealtimeHandlers: handles streaming events, tool execution events — source of tool activity data for status line
- WebSocketContext: manages connection state — toast system hooks into connection errors
- ChatMessagesPane: renders message flow — inline error banners integrate here after failing messages

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 08-error-handling-and-status*
*Context gathered: 2026-03-03*
