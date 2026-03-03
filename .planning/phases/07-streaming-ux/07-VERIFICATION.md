---
phase: 07-streaming-ux
verified: 2026-03-03T00:38:37Z
status: passed
score: 6/6 requirements verified
re_verification: false
human_verification:
  - test: "Scroll behavior during active streaming — scroll up to pause, pill appears, click to re-engage"
    expected: "Auto-scroll pauses immediately, 'N new turns' pill appears bottom-right, clicking pill smooth-scrolls to bottom"
    why_human: "Requires live WebSocket streaming to test IntersectionObserver sentinel response and pill visibility"
  - test: "Pre-token aurora aura indicator visible before first token"
    expected: "Soft pulsing rainbow glow bar appears, collapses upward when first token arrives"
    why_human: "Requires visual inspection of transition timing and collapse animation quality"
  - test: "ThinkingShimmer → ThinkingDisclosure transition during extended thinking"
    expected: "Aurora 'Thinking...' rainbow text shows during empty thinking, transitions seamlessly to collapsed disclosure when content arrives"
    why_human: "Requires extended thinking model to observe the two-state transition"
  - test: "Connection status dot color changes"
    expected: "Green when connected, amber with pulse when reconnecting, red when disconnected"
    why_human: "Requires killing the backend to observe reconnecting/disconnected states"
  - test: "Reconnect skeletons appear then fade"
    expected: "Aurora aura glow bars appear during reconnect message loading, fade over 200ms when messages arrive"
    why_human: "Requires simulating WebSocket reconnect to observe skeleton lifecycle"
  - test: "Streaming cursor amber caret positioning"
    expected: "Blinking amber | appears inline at end of last text character, not on new line, disappears cleanly when streaming ends"
    why_human: "Requires live streaming output to verify caret inline positioning and disappearance"
  - test: "Known deferred visual polish items"
    expected: "Scrolling glitchiness and minor integration bugs noted in 07-05 are acknowledged as deferred to UI overhaul phases"
    why_human: "User has pre-approved these as deferred — verify they do not block core functionality"
---

# Phase 7: Streaming UX Verification Report

**Phase Goal:** Streaming responses feel smooth and respect user control — token buffering prevents jank, scroll behavior never fights the user, indicators communicate AI state clearly
**Verified:** 2026-03-03T00:38:37Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | Token buffering uses rAF (~16ms) to prevent per-token setState jank | VERIFIED | STRM-01 comments at all 3 rAF buffer locations in `useChatRealtimeHandlers.ts`; `requestAnimationFrame` used (not setTimeout) at lines 258, 468, 782 |
| 2 | Auto-scroll pauses when user scrolls up; re-engages when user returns to bottom | VERIFIED | `useScrollAnchor` hook with `IntersectionObserver` sentinel; `isUserScrolledUp` state managed; `handleUserScroll` has no debounce per spec |
| 3 | Floating pill shows "N new turns" count when scrolled away | VERIFIED | `ScrollToBottomPill.tsx` renders when `visible && newTurnCount > 0`; wired to `useNewTurnCounter`; turn delta tracked via snapshotRef |
| 4 | Pre-token indicator shown before first streaming token, collapses when content arrives | VERIFIED | `PreTokenIndicator.tsx` with CSS Grid 1fr→0fr collapse; `AssistantThinkingIndicator` uses it; lifecycle managed by `showIndicator` + 350ms delayed unmount in `ChatMessagesPane` |
| 5 | "Thinking..." aurora shimmer shown during empty thinking, transitions to collapsed disclosure | VERIFIED | `ThinkingDisclosure` renders `ThinkingShimmer` when `isStreaming && isEmpty`; transitions naturally when content arrives |
| 6 | Reconnect skeleton placeholders with aurora shimmer appear during reconnect load, fade to content | VERIFIED | `ReconnectSkeletons.tsx` with 200ms opacity fade-out; wired in `ChatMessagesPane` when `isLoadingSessionMessages && chatMessages.length > 0` |
| 7 | Streaming cursor (blinking amber caret) appears during streaming, disappears when done | VERIFIED | `streaming-cursor.css` with `cursor-blink` keyframes; `Markdown.tsx` conditionally applies `streaming-cursor message-streaming` classes based on `isStreaming` prop |
| 8 | Connection status dot visible in header, reflects WebSocket state | VERIFIED | `ConnectionStatusDot.tsx` in `ChatInterface.tsx` header (line 300); `WebSocketContext` exports `connectionState` with `wasConnectedRef` for reconnect detection |
| 9 | Build and typecheck pass cleanly | VERIFIED | `npm run build` succeeds in 5.58s; `npm run typecheck` exits with no errors |

**Score:** 6/6 requirements verified (9/9 observable truths verified)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/components/chat/styles/aurora-shimmer.css` | `@property --aurora-angle`, `aurora-rotate` keyframes, `.aurora-gradient`, `.aurora-skeleton-line`, `.aurora-thinking-text`, `.aurora-aura`, `.aurora-aura-core` | VERIFIED | All classes present; `@property` registered with compositor-thread animation; oklch color stops across full spectrum; added `.aurora-aura` and `.aurora-aura-core` post-plan (improvement) |
| `src/components/chat/styles/streaming-cursor.css` | `cursor-blink` keyframes, `.streaming-cursor::after` amber caret, `.message-streaming` containment | VERIFIED | All classes present; improved with `> :last-child::after` for inline cursor positioning; `:has(> *)` guard for empty-state cursor |
| `src/components/chat/hooks/useScrollAnchor.ts` | `IntersectionObserver` sentinel tracking; exports `sentinelRef`, `isAtBottom`, `isUserScrolledUp`, `handleUserScroll`, `scrollToBottom` | VERIFIED | All 5 exports present; `isAtBottomRef` synchronous mirror implemented; 100px `rootMargin` tolerance; smooth scroll behavior |
| `src/components/chat/hooks/useNewTurnCounter.ts` | Turn delta tracking with `snapshotRef`, returns `newTurnCount` | VERIFIED | `snapshotRef` uses `null` sentinel to distinguish non-scrolled-up state; correct delta math |
| `src/components/chat/view/subcomponents/ScrollToBottomPill.tsx` | Floating pill with down arrow, turn count badge, fade-in animation | VERIFIED | `pill-enter` keyframe animation; down arrow SVG; pluralization correct; returns null when not visible or zero turns |
| `src/components/chat/view/subcomponents/PreTokenIndicator.tsx` | Aurora shimmer skeleton with CSS Grid collapse transition | VERIFIED | Implemented as aurora aura glow bars (redesigned from skeleton lines per user feedback); 300ms CSS Grid collapse; lifecycle state machine with `exiting`/`shouldRender` |
| `src/components/chat/view/subcomponents/ThinkingShimmer.tsx` | "Thinking..." with `aurora-thinking-text` rainbow gradient | VERIFIED | Uses `.aurora-thinking-text` class; renders only when `isThinking` |
| `src/components/chat/view/subcomponents/ReconnectSkeletons.tsx` | Aurora skeleton placeholders with 200ms fade-out | VERIFIED | Implemented as aurora aura glow bars (redesigned); `fading` state drives opacity transition; 200ms timing |
| `src/components/chat/view/subcomponents/ConnectionStatusDot.tsx` | Colored dot with green/amber/red states and reconnect pulse | VERIFIED | Imports `ConnectionState` type from context; amber state uses `animate-pulse`; proper ARIA attributes |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/main.jsx` | `aurora-shimmer.css` | CSS import | VERIFIED | Line 6: `import './components/chat/styles/aurora-shimmer.css'` |
| `src/main.jsx` | `streaming-cursor.css` | CSS import | VERIFIED | Line 7: `import './components/chat/styles/streaming-cursor.css'` |
| `Markdown.tsx` | `streaming-cursor.css` | CSS class `streaming-cursor` applied when `isStreaming` | VERIFIED | Line 140: `${isStreaming ? ' streaming-cursor message-streaming' : ''}` |
| `useChatRealtimeHandlers.ts` | `Markdown.tsx` | rAF buffer drives `appendStreamingChunk`; STRM-01 documented | VERIFIED | STRM-01 comments at lines 254, 464, 780; `requestAnimationFrame` used at all 3 flush points |
| `ChatMessagesPane.tsx` | `useScrollAnchor.ts` | Hook call + sentinel div placement | VERIFIED | Line 155: destructures all 5 values; line 452: `<div ref={sentinelRef} ...>` at bottom of message list |
| `ChatMessagesPane.tsx` | `ScrollToBottomPill.tsx` | Render with `newTurnCount` and `scrollToBottom` props | VERIFIED | Lines 455-459: renders with `scrollAnchorScrollToBottom`, `scrollAnchorUserScrolledUp` as visible |
| `ChatMessagesPane.tsx` | `useNewTurnCounter.ts` | Hook call with `turnCount` and `isUserScrolledUp` | VERIFIED | Line 156: `const { newTurnCount } = useNewTurnCounter(turnCount, scrollAnchorUserScrolledUp)` |
| `ChatInterface.tsx` | `useScrollAnchor.ts` (via ChatMessagesPane) | `handleUserScroll` wired to `onWheel` | VERIFIED | ChatMessagesPane line 279: `onWheel={handleUserScroll}` |
| `PreTokenIndicator.tsx` | `aurora-shimmer.css` | CSS class `aurora-aura` / `aurora-aura-core` | VERIFIED | Lines 58, 63: uses `.aurora-aura` and `.aurora-aura-core` (redesigned from skeleton lines) |
| `ThinkingShimmer.tsx` | `aurora-shimmer.css` | CSS class `aurora-thinking-text` | VERIFIED | Line 22: `className="aurora-thinking-text text-sm tracking-wide"` |
| `ChatMessagesPane.tsx` | `PreTokenIndicator.tsx` (via AssistantThinkingIndicator) | `showIndicator` lifecycle + `isVisible={isLoading}` | VERIFIED | Line 444: `{showIndicator && <AssistantThinkingIndicator selectedProvider={provider} isVisible={isLoading} />}` |
| `ThinkingDisclosure.tsx` | `ThinkingShimmer.tsx` | Renders when `isStreaming && isEmpty` | VERIFIED | Lines 57-59: conditional render of `<ThinkingShimmer isThinking={true} />` |
| `WebSocketContext.tsx` | `ConnectionStatusDot.tsx` | `connectionState` exported from context | VERIFIED | `connectionState` in context type; `wasConnectedRef` enables `reconnecting` vs `disconnected` distinction |
| `ChatInterface.tsx` | `ConnectionStatusDot.tsx` | Rendered in header bar | VERIFIED | Line 7: import; line 300: `<ConnectionStatusDot state={connectionState} />` in header flex row |
| `ChatMessagesPane.tsx` | `ReconnectSkeletons.tsx` | Rendered when `isLoadingSessionMessages && chatMessages.length > 0` | VERIFIED | Lines 447-449: conditional render with `count={3}` and `isLoading={isLoadingSessionMessages}` |
| `ReconnectSkeletons.tsx` | `aurora-shimmer.css` | CSS class `aurora-aura` / `aurora-aura-core` | VERIFIED | Lines 42, 46: uses `.aurora-aura` and `.aurora-aura-core` |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| STRM-01 | 07-01 | rAF token buffering (~16ms flush) prevents per-token setState freezing | SATISFIED | STRM-01 comments at all 3 rAF buffer locations; `preprocessStreamingMarkdown` for hybrid rendering; `streaming-cursor` + `message-streaming` CSS containment |
| STRM-02 | 07-02, 07-03 | Smart auto-scroll — pauses on scroll-up, re-engages on scroll-to-bottom, IntersectionObserver sentinel | SATISFIED | `useScrollAnchor` hook with IO sentinel; `overflow-anchor: auto` in `useChatSessionState`; immediate pause (no debounce) on `handleUserScroll` |
| STRM-03 | 07-03 | Floating scroll-to-bottom pill with "N new messages" count | SATISFIED | `ScrollToBottomPill` shows "N new turns" (turn-based, not message-based — architecturally appropriate given turn grouping system); `useNewTurnCounter` tracks delta; pill dismisses on scroll-to-bottom or click |
| STRM-04 | 07-04 | Typing/pre-token indicator shown before first streaming token, transitions into streaming content | SATISFIED | `PreTokenIndicator` with aurora aura glow bar ("or similar" per requirement); CSS Grid collapse upward; `showIndicator` lifecycle with 350ms delayed unmount for smooth transition |
| STRM-05 | 07-04 | Pulsing "Thinking..." indicator during extended thinking, transitions into collapsed ThinkingDisclosure | SATISFIED | `ThinkingShimmer` with `aurora-thinking-text` rainbow gradient (pulsing via aurora animation); `ThinkingDisclosure` shows it when `isStreaming && isEmpty`; natural transition when content arrives |
| STRM-06 | 07-05 | Skeleton shimmer placeholders shown during reconnect scrollback load, fade to real content | SATISFIED | `ReconnectSkeletons` with aurora aura glow bars (shimmer effect via aurora-rotate animation); 200ms opacity fade-out; `ConnectionStatusDot` provides companion connection state visibility |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `ScrollToBottomPill.tsx` | 12 | `return null` when not visible | Info | Correct conditional render — not a stub |
| `PreTokenIndicator.tsx` | 43 | `return null` when `!shouldRender` | Info | Correct lifecycle gate — not a stub |
| `ThinkingShimmer.tsx` | 18 | `return null` when `!isThinking` | Info | Correct conditional render — not a stub |
| `ReconnectSkeletons.tsx` | 34 | `return null` when `!visible` | Info | Correct lifecycle gate after fade-out — not a stub |
| `ActivityIndicator.tsx` | 1 | DEPRECATED comment (file kept) | Info | Intentional — kept to avoid breakage per plan decision |

No blocker or warning anti-patterns found. All `return null` instances are legitimate conditional guards, not stubs.

### Plan vs. Reality Deviations

Two implementation deviations from the plans are noted — both are improvements, not gaps:

1. **PreTokenIndicator redesigned:** The plan specified 4 skeleton paragraph bars (`.aurora-skeleton-line`). The delivered implementation uses a soft pulsing aurora aura glow bar (`.aurora-aura` + `.aurora-aura-core`). This was a user-directed change during visual checkpoint in plan 07-05. The requirement (STRM-04: "typing indicator or similar") is satisfied by the aurora aura.

2. **ReconnectSkeletons redesigned:** Same redesign — aurora aura glow bars instead of paragraph skeleton lines. STRM-06 ("skeleton shimmer placeholder bars") is satisfied because the aurora aura provides the same "placeholder" visual intent with shimmer via the rotating gradient.

3. **ScrollToBottomPill says "new turns" not "new messages":** STRM-03 specifies "N new messages". The implementation uses "N new turns" which maps to the turn grouping architecture (messages are grouped into turns). This is an intentional semantic improvement — turns are the user-visible unit of conversation, not raw messages.

4. **aurora-shimmer.css gained extra classes:** `.aurora-aura` and `.aurora-aura-core` were added beyond the original plan — these support the redesigned indicators and represent net-positive scope.

### Human Verification Required

All core architecture is verifiable programmatically. The following items require live visual testing:

**1. Scroll anchor behavior during active streaming**

**Test:** Start a streaming response, scroll up mid-stream
**Expected:** Auto-scroll pauses immediately, "N new turns" pill appears bottom-right, clicking pill smooth-scrolls (~300ms) to bottom and dismisses pill; scrolling back to bottom manually also dismisses pill
**Why human:** IntersectionObserver behavior depends on live DOM and browser viewport

**2. Pre-token aurora aura indicator transition**

**Test:** Send a message and observe pre-response state
**Expected:** Soft pulsing rainbow glow bar appears, collapses upward over 300ms when first token arrives
**Why human:** Transition timing and visual quality require visual inspection

**3. Streaming cursor inline positioning**

**Test:** Observe a streaming response with mixed content (bold, code, lists)
**Expected:** Blinking amber | appears inline at end of last text character, not on a new line; disappears when streaming ends
**Why human:** Requires observing `> :last-child::after` CSS behavior with real rendered markdown

**4. ThinkingShimmer → ThinkingDisclosure transition**

**Test:** Use extended thinking model, observe pre-content state
**Expected:** Aurora "Thinking..." rainbow shimmer shows first; transitions to collapsed ThinkingDisclosure when thinking content arrives
**Why human:** Requires extended thinking model and real streaming timing

**5. Connection status dot and reconnect skeletons**

**Test:** Kill/restart backend, observe header dot and message area
**Expected:** Dot goes amber (reconnecting), then green (connected); aurora aura glow bars appear during reconnect load, fade over 200ms when messages reload
**Why human:** Requires simulating WebSocket disconnect/reconnect cycle

**6. Deferred visual polish**

**Note:** The user has pre-approved known visual polish gaps (scrolling glitchiness, minor integration bugs) as deferred to upcoming UI overhaul phases (1, 2, 4, 9). These are not blockers for phase 7 acceptance.

### Gaps Summary

No gaps found. All 6 STRM requirements (STRM-01 through STRM-06) have complete architectural implementations with proper wiring throughout the component tree. The build is clean and typecheck passes.

Key architecture established:
- CSS animation system in `src/components/chat/styles/` (aurora-shimmer.css, streaming-cursor.css) imported globally via `main.jsx`
- `useScrollAnchor` and `useNewTurnCounter` hooks replace the legacy `onScroll`-based pattern
- `ScrollToBottomPill`, `PreTokenIndicator`, `ThinkingShimmer`, `ReconnectSkeletons`, `ConnectionStatusDot` are all substantive, wired, non-stub components
- `WebSocketContext` properly distinguishes `connected`/`reconnecting`/`disconnected` states
- `useChatRealtimeHandlers` rAF buffer pattern documented and functioning at all 3 provider locations
- `Markdown.tsx` hybrid preprocessing defers incomplete block elements and handles unclosed fences

---

_Verified: 2026-03-03T00:38:37Z_
_Verifier: Claude (gsd-verifier)_
