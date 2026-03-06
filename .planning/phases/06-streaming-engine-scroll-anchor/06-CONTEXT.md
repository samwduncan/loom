# Phase 6: Streaming Engine + Scroll Anchor - Context

**Gathered:** 2026-03-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Streaming tokens render in the browser at 60fps via direct DOM mutation (bypassing React's reconciler), with scroll that locks to bottom during streaming and instantly disengages on any user scroll. Includes the useStreamBuffer hook (rAF + useRef token accumulation), ActiveMessage component (memo-isolated streaming display), and useScrollAnchor hook (IntersectionObserver sentinel + scroll pill). No markdown rendering (M2), no tool card display (Phase 7), no message history loading (Phase 8) -- this is the streaming UI that proves the pipeline works visually.

</domain>

<decisions>
## Implementation Decisions

### Streaming cursor
- **Shape:** Thin vertical pipe cursor, ~2px wide, matching line-height
- **Color:** `--accent-primary` (dusty rose) -- ties cursor to the app's signature accent
- **Blink rate:** Standard ~530ms CSS animation (matches native caret timing)
- **On stream end:** Cursor fades out over `--duration-normal` (200ms) via opacity transition, synced with background tint fade
- **Implementation:** Pure CSS animation on a `::after` pseudo-element or inline span. No JS animation loop for the cursor itself -- rAF handles text, CSS handles cursor.

### Stream-to-final transition
- **Strategy:** Seamless replace with **finalizing state**. ActiveMessage tracks its own lifecycle: `streaming` → `finalizing` → unmounted. It does NOT unmount the instant `isStreaming` goes false.
- **Finalization handshake:** (1) `claude-complete` fires → `isStreaming` becomes false in stream store. (2) ActiveMessage detects this and enters `finalizing` state internally (local state or ref). (3) In `finalizing`: cursor + tint begin 200ms fade-out, AND accumulated text flushes to timeline store via `addMessage()`. (4) React renders the finalized Message in the timeline. (5) After fade completes (~200ms), ActiveMessage signals unmount (e.g., calls a parent callback or sets a ref). (6) Parent removes ActiveMessage from the tree. User sees continuous text with cursor/tint fading, then a seamless handoff to the React-rendered message.
- **Critical:** ActiveMessage must remain mounted during the entire fade-out. The parent component gates unmount on a "finalization complete" signal, NOT on `isStreaming === false`.
- **Text rendering:** Plain text during streaming AND for finalized messages in M1. No markdown parsing. Full markdown rendering comes in M2 (CHAT-04). This eliminates any layout shift risk on swap since both render identically.
- **Mid-stream disconnect:** Keep partial text visible. Append a muted error line below: "Connection lost during response." using `--text-muted` color. Consistent with Phase 5 decision to preserve partial content and not call `endStream`.

### Scroll pill
- **Position:** Bottom-center of the chat scroll container, floating ~16px above the bottom edge
- **Content:** Down arrow icon + "Scroll to bottom" text label
- **Z-index:** `var(--z-scroll-pill)` (30) per Phase 1 token dictionary
- **Enter animation:** Slide up from `translateY(8px)` + `opacity: 0` to rest position + `opacity: 1`, using `--ease-spring` easing. Consistent with future message entrance animations (POLISH-03).
- **Exit animation:** Reverse of enter (slide down + fade out)
- **Surface:** Claude's discretion -- either `--surface-overlay` with border or frosted glass effect, whichever looks best against the chat background
- **Click behavior:** Smooth-scroll to bottom + re-engage auto-scroll

### ActiveMessage container styling
- **CSS containment:** `contain: content` is REQUIRED per Constitution 10.3. Prevents token-by-token DOM mutations from triggering ancestor layout recalculations.
- **Background tint:** Very subtle dusty rose wash at ~3-5% opacity. Use `color-mix(in oklch, var(--accent-primary) 4%, transparent)` since `--accent-primary` is a full `oklch()` value (not decomposed components). Alternatively, define a new token `--accent-primary-wash` in tokens.css. Do NOT use `oklch(var(--accent-primary) / 0.04)` -- this is invalid CSS because `--accent-primary` is already a complete `oklch(0.63 0.14 20)` string.
- **Border radius:** 8px rounded corners -- soft card-like feel without being a full card
- **On finalization:** Background tint fades to transparent over `--duration-normal` (200ms), synced with cursor fade-out. Both disappear together as a clean "finalization moment"
- **No additional borders or shadows** -- the tint alone provides distinction. Constitution prohibits box-shadow for elevation.

### Backlog drainage on mount
- `useStreamBuffer` MUST consume `wsClient`'s stream backlog on mount. The `subscribeContent()` API already replays backlog to late subscribers automatically (Phase 5 implementation). The hook should handle this burst of replayed tokens correctly -- append all to the ref and schedule a single rAF paint, not one paint per replayed token.
- This handles HMR, tab switches, or any scenario where ActiveMessage mounts mid-stream.

### Claude's Discretion
- Scroll pill surface treatment choice (overlay vs frosted glass)
- Whether finalized messages in M1 get basic markdown or stay plain text (leaning plain text for seamless swap, but Claude can pull forward basic markdown if the swap still works cleanly)
- Exact rAF loop implementation details (batch size, timing)
- IntersectionObserver threshold and root margin values
- Finalization handshake mechanism details (local state vs ref, parent callback vs render prop)
- Whether to define `--accent-primary-wash` as a new token or use `color-mix()` inline
- Error line styling details for mid-disconnect partial content
- Test strategy for zero-rerender verification

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `wsClient.subscribeContent(listener)`: Returns unsubscribe fn. Phase 6 hooks subscribe here for content tokens. Includes backlog replay for late subscribers.
- `wsClient.startContentStream()` / `endContentStream()`: Lifecycle already managed by websocket-init.ts.
- `useStreamStore`: `isStreaming`, `startStream()`, `endStream()` already wired by websocket-init.ts. Phase 6 reads `isStreaming` via selector.
- `useTimelineStore.addMessage()`: Immer-powered action for flushing finalized messages into session history.
- `src/src/styles/tokens.css`: All motion tokens (`--duration-normal`, `--ease-spring`), color tokens (`--accent-primary`, `--text-muted`, `--surface-overlay`), z-index (`--z-scroll-pill`) ready to use.
- `src/src/lib/motion.ts`: Spring configs (SPRING_GENTLE, SPRING_SNAPPY) available if CSS spring approximation is insufficient.
- `cn()` utility for className composition.

### Established Patterns
- Zustand stores with selector-only access (ESLint enforced)
- Named exports only (ESLint enforced)
- Test files colocated with source (*.test.ts beside *.ts)
- Constitution enforcement active on all new code
- No React Context for mutable state (Constitution 4.4)
- WS client is a pure singleton -- components import `wsClient` directly
- Content stream uses Set-based listener pattern (not EventEmitter)

### Integration Points
- `wsClient.subscribeContent()` is the token source -- hook subscribes on mount, unsubscribes on unmount
- `useStreamStore(state => state.isStreaming)` drives cursor visibility and scroll anchor behavior
- `useTimelineStore.getState().addMessage()` for flush (called from hook, not component render)
- ActiveMessage renders inside the chat content grid area (Phase 3 AppShell content slot)
- Chat scroll container will be the parent of both finalized messages and ActiveMessage
- Phase 7 proof-of-life page will consume ActiveMessage + useScrollAnchor to demonstrate the pipeline

</code_context>

<specifics>
## Specific Ideas

- Cursor in dusty rose creates a warm "heartbeat" feel during streaming -- the accent color pulses at the point of active generation
- Background tint + cursor fade happening together creates a satisfying "finalization moment" -- the message settles from active to complete
- Plain text everywhere in M1 means the seamless replace is trivially seamless -- identical content, no layout shift risk
- Slide-up + fade on scroll pill matches the planned POLISH-03 message entrance animation direction, establishing the motion language early
- The 8px rounded corners on ActiveMessage set the precedent for message container styling that M2 will build on

</specifics>

<deferred>
## Deferred Ideas

- **Live markdown during streaming**: Incremental markdown parsing with incomplete code fence handling -- M2 (CHAT-04)
- **Aurora/ambient overlay**: Animated gradient behind streaming messages -- M3 (POLISH-02)
- **Message entrance animations**: Spring translateY + opacity on all messages -- M3 (POLISH-03)
- **content-visibility: auto on past messages**: Performance optimization for long conversations -- M3 (POLISH-01)
- **Scroll physics perfection**: Zero jitter at 100 tok/sec, smooth deceleration -- M3 (POLISH-01)

</deferred>

---

*Phase: 06-streaming-engine-scroll-anchor*
*Context gathered: 2026-03-06*
*Gemini architect review: Approved with corrections applied (contain: content per Constitution 10.3, finalization handshake lifecycle, OKLCH syntax fix, backlog drainage mandate)*
