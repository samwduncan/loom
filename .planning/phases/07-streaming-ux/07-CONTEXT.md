# Phase 7: Streaming UX - Context

**Gathered:** 2026-03-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Streaming responses feel smooth and respect user control. Token buffering prevents jank, scroll behavior never fights the user, indicators communicate AI state clearly, and reconnection handles gracefully. Requirements: STRM-01 through STRM-06.

</domain>

<decisions>
## Implementation Decisions

### Scroll Behavior
- Auto-scroll pauses **immediately** on any upward scroll gesture (no threshold/debounce)
- Floating scroll pill appears **bottom-right** when user is scrolled up during streaming
- Pill shows **live-updating turn count** ("N new turns" — counts full assistant turns, not individual message blocks)
- Pill **stays until dismissed** — user must click it or scroll to bottom manually; does not auto-dismiss after response ends
- Clicking the pill triggers **smooth animated scroll** to bottom (~300ms)
- Auto-scroll **auto re-engages** when the user scrolls back to the bottom during streaming (no need to click pill)

### Typing & Thinking Indicators
- **Pre-token indicator:** 4-5 **uniform-width** skeleton placeholder lines with **full rainbow aurora shimmer** effect
- **Skeleton-to-content transition:** Skeleton **collapses upward**, then real streaming text appears from the same position
- **Extended thinking indicator:** "Thinking..." text with **rainbow aurora shimmer** effect — letters are multicolored with shifting gradient, like starlight twinkling or aurora borealis. NOT blinking/pulsing — shimmering color animation
- Aurora shimmer uses **full rainbow spectrum** (not warm earthy tones)
- **Thinking block disclosure:** Starts **collapsed** when thinking content is available; user clicks to expand
- **Streaming cursor:** Blinking **solid amber** caret (|) at the end of streaming text; disappears when streaming completes
- **ClaudeStatus bar:** Remains visible during streaming (elapsed time, token count, stop button)

### Token Buffering & Rendering
- **Buffer flush interval:** Every animation frame (~16ms) for **smooth character-by-character flow**
- **Markdown rendering:** Hybrid approach — render **inline markdown** (bold, italic, inline code) live during streaming; defer **block elements** (code blocks, headers, lists) until a natural pause or block delimiter completes
- **Code blocks:** As soon as opening ``` is detected, **immediately create the code block container** and stream code into it (no wait for closing fence)
- **CSS containment:** Apply `contain: content` on streaming message elements to prevent layout recalculation from propagating

### Reconnect Experience
- **Reconnect scrollback:** Show **skeleton shimmer placeholders** (with aurora effect) where new/missing messages will appear
- **Cached messages:** Previously loaded messages **remain visible** during reconnect; skeletons only for the gap
- **Skeleton-to-real transition:** Messages **fade in** (~200ms) replacing skeleton placeholders
- **Connection status:** Small colored **dot indicator** in the **header bar** (green=connected, amber=reconnecting, red=disconnected)

### Claude's Discretion
- Exact animation timing and easing curves for all transitions
- Aurora shimmer animation implementation details (CSS gradients vs canvas vs SVG)
- Exact pixel dimensions and spacing of skeleton lines
- Connection status dot exact positioning within header
- How `isNearBottom` threshold (currently 50px) interacts with immediate pause

</decisions>

<specifics>
## Specific Ideas

- Aurora/starlight shimmer: "Almost like starlight twinkling or an aurora that is changing the colors of the letters. The letters wouldn't be solid colors but could be multicolored" — applied to both skeleton lines and "Thinking..." text
- Full rainbow spectrum, not constrained to the warm earthy palette
- Skeleton lines are uniform width (abstract placeholder feel, not fake text)
- Collapse-then-show transition for pre-token skeletons specifically; fade-in for reconnect skeletons — two different transition styles for different contexts

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useChatRealtimeHandlers.ts`: Already has `streamBufferRef` + `streamTimerRef` with `requestAnimationFrame` buffering (lines 254-263). Needs tuning from rAF-gated to per-frame flush
- `useChatSessionState.ts`: Has `isUserScrolledUp`, `scrollToBottom()`, `isNearBottom()` (50px threshold), `handleScroll()`. Foundation for scroll pill logic
- `ActivityIndicator.tsx`: Rotating phrase indicator with blinking animation — will be replaced by aurora shimmer
- `AssistantThinkingIndicator.tsx`: Wrapper for ActivityIndicator — integration point for new skeleton indicator
- `ClaudeStatus.tsx`: Status bar with elapsed time, token count, and stop button — stays as-is
- `ThinkingDisclosure.tsx`: Existing thinking block disclosure component — already supports collapsed state
- `ChatMessagesPane.tsx`: Has `isStreaming` turn protection, IntersectionObserver collapse logic, `scrollContainerRef`

### Established Patterns
- State management via React hooks (`useState`, `useCallback`, `useRef`) throughout chat system
- Streaming uses `appendStreamingChunk()` / `finalizeStreamingMessage()` helper functions
- Turn grouping via `useTurnGrouping` hook — turns track `isStreaming` flag
- WebSocket messages flow through `useChatRealtimeHandlers` effect handler
- CSS animations defined inline via `<style>` tags (see ActivityIndicator)

### Integration Points
- `ChatMessagesPane.tsx` line 407: `{isLoading && <AssistantThinkingIndicator />}` — where pre-token indicator renders
- `ChatInterface.tsx` lines 308-309: `onWheel={handleScroll}` / `onTouchMove={handleScroll}` — scroll event wiring
- `useChatSessionState.ts` line 75: `isUserScrolledUp` state — drives scroll pill visibility
- `WebSocketContext.tsx`: WebSocket connection management — integration point for connection status dot
- `scrollContainerRef` in ChatMessagesPane — scroll container for pill positioning

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 07-streaming-ux*
*Context gathered: 2026-03-02*
