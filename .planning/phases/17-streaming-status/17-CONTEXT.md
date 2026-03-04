# Phase 17: Streaming & Status - Context

**Gathered:** 2026-03-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Streaming responses feel smooth and communicative -- token buffering prevents jank, scroll behavior respects user control, the current AI activity is always visible, and the user can stop generation at any time. Permanent errors display as persistent inline banners. The status line moves below the composer and becomes an always-visible session dashboard.

</domain>

<decisions>
## Implementation Decisions

### Scroll Behavior & New-Message Pill
- ScrollToBottomPill shows **new message count** (not turns) — "3 new messages"
- Pill stays positioned **bottom-right** of the message pane (current position)
- Replace IntersectionObserver approach with **scroll-event based** tracking — listen to scroll events, check if near bottom (10px threshold)
- Auto-scroll **re-engages automatically** when user scrolls back near the bottom — no pill click required
- CSS overflow-anchor for position preservation when content is prepended above

### Indicators & Thinking States
- Pre-token indicator becomes an **aurora atmosphere** — soft, animated aurora lights "shining down" onto where the AI response will appear. Not just a bar, but a diffused glow field
- **"Thinking..." text sits above** the aurora atmosphere — two separate elements but visually connected. Text with rainbow gradient, aurora glow field below it
- Transition to content: aurora **fades upward and dissolves** as streaming content pushes in from the top. Smooth handoff, no layout jump
- Reconnect skeletons **match the atmospheric aurora** treatment for visual consistency across all loading states
- Extended thinking ("Thinking...") transitions into collapsed thinking block when complete

### Status Line & Activity Text
- Status line moves **below the composer** — always visible, not just during streaming
- **Idle state** shows: provider name, model, and session cost (e.g. "Claude · opus-4 · $0.42")
- **Streaming state** shows: semantic activity text ("Reading auth.ts..."), elapsed time, token count, "esc to stop" hint
- Activity text parsed from tool events — real tool names and arguments, not rotating generic phrases
- **Token usage pie and cost display move down** from ChatInputControls into the status line — ChatInputControls above composer keeps only permission mode, thinking mode, and commands button
- **Stop button appears in both** the status line AND the send button morph — two ways to stop
- **Pulsing border** on the active tool card in the message stream (no spinner icon, just border glow using existing Phase 15 pill styling)

### Send/Stop Button & Error Banners
- Send button morphs to stop via **CSS crossfade** — same size/position, icon swaps from arrow to square, no layout jump
- Stop button switches to **red/destructive** color (not rose) — clear danger signal
- Permanent error banners (process crash, exit code) appear **inline after the last message** — persistent red-accented banner, visually distinct from toasts and regular messages
- Error banners are **dismissible with X** button

### Claude's Discretion
- Exact rAF batching interval for token buffering (50-100ms range per STRM-01)
- Aurora atmosphere CSS implementation details (gradient angles, opacity levels, animation timing)
- Scroll-event debounce strategy
- Status line typography and spacing
- Error banner icon and copy

</decisions>

<specifics>
## Specific Ideas

- Aurora pre-token: "like aurora lights shining down on where the output will be, soft and animated" — atmospheric, not mechanical
- Status line should feel like a persistent dashboard, not a transient notification
- The current ClaudeStatus full-width bar above composer gets replaced entirely by the new below-composer status line
- Token/cost info consolidation: remove from ChatInputControls, single source of truth in status line

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useScrollAnchor` hook (src/components/chat/hooks/useScrollAnchor.ts): IntersectionObserver-based — will be rewritten to scroll-event based but same API shape (isAtBottom, isUserScrolledUp, scrollToBottom)
- `ScrollToBottomPill` component: Already positioned and styled — needs count source change from turns to messages
- `PreTokenIndicator` (src/components/chat/view/subcomponents/PreTokenIndicator.tsx): Aurora aura with grid-collapse exit — needs atmospheric upgrade
- `ThinkingShimmer` (src/components/chat/view/subcomponents/ThinkingShimmer.tsx): "Thinking..." with aurora text gradient — keep as separate element above aurora field
- `ReconnectSkeletons` (src/components/chat/view/subcomponents/ReconnectSkeletons.tsx): Aurora aura bars with fade-out — upgrade to atmospheric aurora
- `ClaudeStatus` (src/components/chat/view/subcomponents/ClaudeStatus.tsx): Full-width status bar — will be replaced by new below-composer StatusLine component
- `ChatInputControls` (src/components/chat/view/subcomponents/ChatInputControls.tsx): Contains TokenUsagePie and cost display — these move to new status line
- `aurora-shimmer.css` (src/components/chat/styles/aurora-shimmer.css): Existing CSS for aurora effects — extend for atmospheric treatment

### Established Patterns
- WebSocket abort: `abort-session` message type exists in useChatComposerState
- Tool event parsing: useChatRealtimeHandlers already extracts toolName from tool_use parts
- Design system tokens: --destructive for error states, --primary for actions
- Phase 15 tool cards: Pill-styled with state-driven borders — extend border glow for active state

### Integration Points
- `ChatMessagesPane`: Orchestrates scroll, messages, indicators, skeletons — main integration surface
- `ChatComposer`: Send button lives here — needs stop morph logic
- `useChatComposerState`: Has abort logic, isLoading state, claudeStatus updates
- `useNewTurnCounter`: Currently counts turns — needs message-counting variant
- `ChatInterface`: Parent that passes isLoading, claudeStatus between child components

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 17-streaming-status*
*Context gathered: 2026-03-04*
