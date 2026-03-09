# Phase 18: Activity, Scroll, Polish - Context

**Gathered:** 2026-03-08
**Status:** Ready for planning

<domain>
## Phase Boundary

The chat experience feels complete and polished — activity feedback shows what the agent is doing, smooth scrolling preserves position across sessions and handles dynamic content, entrance animations add life to new messages, and a streaming cursor gives visual feedback during active generation. Requirements: ACT-01 through ACT-05, NAV-01 through NAV-04, DEP-06, POL-01 through POL-04.

</domain>

<decisions>
## Implementation Decisions

### Activity status line
- Positioned below messages, above composer in the CSS Grid layout (new grid row: `1fr auto auto auto` — messages, status line, permission banner, composer)
- Grid row collapses to zero height when no activity; expands when streaming with activity text
- Displays human-readable tool action phrases: "Reading src/auth.ts...", "Running npm test...", "Editing server/config.ts...", "Searching for *.tsx..."
- Text derived from tool name + key argument (the multiplexer/store already has `activityText` state)
- Fades out immediately (200ms opacity transition) when streaming stops, then row collapses
- Updates debounced to 200ms in multiplexer (ACT-03)
- Outside scroll container — never causes scroll height changes (ACT-04)

### Token/cost display
- Always visible below every finalized assistant message content
- Muted text (`text-muted text-xs`), not hover-only
- Format: "1,234 in / 567 out · $0.003" — comma-formatted numbers with cost
- Cache tokens shown if available: "1,234 in (890 cached) / 567 out · $0.003"
- Data sourced from `Message.metadata.tokenCount` and `Message.metadata.cost` (populated from `token-budget` and `result` WebSocket events)
- No token display on user messages or system messages

### Scroll preservation & auto-scroll
- Per-session scroll position stored in `useRef<Map<string, number>>` — saves scrollTop on session switch, restores via `useLayoutEffect` (instant, no animation, no flash-to-top)
- Scroll-to-bottom pill appears at 200px threshold from bottom
- Pill shows unread message count as a small circular badge: "3", "12"
- ResizeObserver on scroll container content maintains bottom lock during streaming — when auto-scrolled and content height changes (code block Shiki highlighting, tool card expansion), immediately re-scroll to bottom
- When user is scrolled up (NOT auto-scrolling), content height changes do NOT adjust scroll position
- `content-visibility: auto` with `contain-intrinsic-height: auto 200px` on past message containers (not actively streaming message) for off-screen rendering optimization (NAV-02)

### Message entrance animations
- Fade + subtle slide up: opacity 0→1, translateY 8px→0px, 200ms ease-out
- Only on newly appended messages — NOT on initial session load (avoids cascade)
- Respects `prefers-reduced-motion` (instant, no animation)
- Uses tailwindcss-animate (DEP-06) — install as Tier 2 motion dependency

### Streaming cursor
- Pulsing vertical bar at end of streaming text
- Implemented as a React component (`<StreamingCursor />`) rendered inline — NOT CSS ::after pseudo
- Primary accent color (`var(--primary)`), 2px wide, line-height tall
- 1s pulse cycle (opacity 0.4→1.0)
- Appears in both content streaming AND thinking blocks (muted variant for thinking — matches italic muted text style)
- Hides when streaming completes (or on `data-phase="finalizing"` transition)

### Thinking block styling
- Thinking text: `italic text-muted font-mono text-sm` inside ThinkingDisclosure
- Streaming cursor in thinking uses muted color variant

### Claude's Discretion
- Exact grid row collapse/expand animation timing for status line
- Badge positioning and sizing on scroll pill (top-right corner standard vs integrated)
- How to detect "newly appended" vs "loaded" messages for entrance animation (likely a ref tracking last known message count)
- StreamingCursor component internal implementation (inline-block span with CSS keyframes)
- ResizeObserver throttling strategy (rAF vs debounce)
- content-visibility boundary — which message containers get it (all finalized vs only those above fold)

</decisions>

<specifics>
## Specific Ideas

- Activity text should feel like watching someone work — "Reading...", "Editing...", "Running..." — not like reading API logs
- Token display with cache breakdown helps understand real cost vs gross tokens — important for power users monitoring API spend
- Scroll restoration must be instant (useLayoutEffect) — any flash-to-top-then-scroll defeats the purpose
- The streaming cursor in thinking blocks creates visual consistency — both streams feel "alive" during generation
- StreamingCursor as React component (not CSS pseudo) gives flexibility for the muted thinking variant and easier conditional rendering

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useScrollAnchor` (src/src/hooks/useScrollAnchor.ts): IntersectionObserver-based auto-scroll with rAF loop, pill visibility, anti-oscillation guard. Needs enhancement for ResizeObserver bottom lock and unread count.
- `ScrollToBottomPill` (src/src/components/chat/view/ScrollToBottomPill.tsx): Existing pill with frosted glass, arrow icon, slide animation. Needs unread badge prop.
- `scroll-pill.css` (src/src/components/chat/view/scroll-pill.css): Existing pill styles.
- `useStreamStore` (src/src/stores/stream.ts): Already has `activityText` state and `setActivityText` action. StatusLine can subscribe directly.
- `stream-multiplexer.ts` (src/src/lib/stream-multiplexer.ts): Activity text debouncing logic goes here.
- `ChatView.tsx` (src/src/components/chat/view/ChatView.tsx): Grid layout currently `1fr auto auto` (messages, permission banner, composer). StatusLine adds a fourth row.
- `AssistantMessage.tsx` (src/src/components/chat/view/AssistantMessage.tsx): Token display component integrates here.
- `ActiveMessage.tsx` (src/src/components/chat/view/ActiveMessage.tsx): Streaming cursor renders at end of active text.
- `ThinkingDisclosure.tsx` (src/src/components/chat/view/ThinkingDisclosure.tsx): Streaming cursor muted variant renders in thinking content.
- `MessageContainer.tsx` (src/src/components/chat/view/MessageContainer.tsx): Entrance animations and content-visibility apply here.

### Established Patterns
- CSS Grid `grid-template-rows` for layout rows (ChatView)
- Selector-only Zustand subscriptions (Constitution 4.2)
- `cn()` for conditional Tailwind classes
- `prefers-reduced-motion` media query for animation opt-out
- Design tokens for all durations (`--transition-fast`, `--transition-normal`)
- `useLayoutEffect` for synchronous DOM updates (proven in Phase 9 scroll work)
- `memo()` wrapping for performance-sensitive components

### Integration Points
- StatusLine: new component in ChatView grid, subscribes to `useStreamStore(s => s.activityText)` and `useStreamStore(s => s.isStreaming)`
- Token display: new component rendered inside AssistantMessage after content, reads from message metadata
- Scroll position map: lives in ChatView or useScrollAnchor, keyed by sessionId
- ResizeObserver: attached to scroll container's content wrapper in useScrollAnchor
- Entrance animations: applied via CSS classes on MessageContainer, controlled by "isNew" prop or ref
- StreamingCursor: rendered at end of text in ActiveMessage and ThinkingDisclosure
- tailwindcss-animate: installed as devDependency, imported in index.css

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 18-activity-scroll-polish*
*Context gathered: 2026-03-08*
