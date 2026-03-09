---
phase: 18-activity-scroll-polish
verified: 2026-03-08T19:45:00Z
status: passed
score: 5/5 success criteria verified
must_haves:
  truths:
    - "Activity status line shows current tool action below messages, fades in/out, never causes scroll height changes"
    - "Token/cost display appears below each finalized assistant message showing input/output tokens and cost"
    - "Scroll position preserved per session -- switching away and back restores exact scroll position"
    - "Scroll-to-bottom pill appears when scrolled up 200px+ with unread count badge; auto-scroll locks to bottom during streaming"
    - "New messages animate in with fade + slide-from-bottom (respecting prefers-reduced-motion); streaming cursor pulses with primary accent"
  artifacts:
    - path: "src/src/components/chat/view/StatusLine.tsx"
      status: verified
    - path: "src/src/components/chat/view/StreamingCursor.tsx"
      status: verified
    - path: "src/src/components/chat/styles/status-line.css"
      status: verified
    - path: "src/src/components/chat/styles/streaming-cursor.css"
      status: verified
    - path: "src/src/hooks/useScrollAnchor.ts"
      status: verified
    - path: "src/src/components/chat/view/ScrollToBottomPill.tsx"
      status: verified
    - path: "src/src/components/chat/view/MessageContainer.tsx"
      status: verified
    - path: "src/src/components/chat/view/TokenUsage.tsx"
      status: verified
    - path: "src/src/components/chat/view/AssistantMessage.tsx"
      status: verified
---

# Phase 18: Activity, Scroll, Polish Verification Report

**Phase Goal:** The chat experience feels complete and polished -- activity feedback, smooth scrolling, entrance animations, and streaming cursor
**Verified:** 2026-03-08T19:45:00Z
**Status:** passed
**Re-verification:** No -- initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Activity status line shows current tool action below messages, fades in/out smoothly, never causes scroll height changes | VERIFIED | `StatusLine.tsx` reads `activityText` and `isStreaming` via Zustand selectors, fades via CSS opacity transition using `var(--duration-normal)`. Placed in ChatView grid row (4-row grid: `1fr_auto_auto_auto`) between MessageList and PermissionBanner -- outside scroll container. Activity text debounced to 200ms in `websocket-init.ts` with timer cleanup on stream end. |
| 2 | Token/cost display appears below each finalized assistant message showing input/output tokens and cost | VERIFIED | `TokenUsage.tsx` renders "X in / Y out . $Z" format from `MessageMetadata`. Pipeline: `stream-multiplexer.ts` extracts tokens/cost from `result` message -> `onResultData` callback -> `stream.ts` store (`setResultData`) -> `ActiveMessage.tsx` reads during `handleFlush` -> populates `metadata.inputTokens/outputTokens/cacheReadTokens/cost`. `AssistantMessage.tsx` renders `<TokenUsage metadata={message.metadata} />` at line 88. `message.ts` type extended with `inputTokens`, `outputTokens`, `cacheReadTokens` fields. |
| 3 | Scroll position preserved per session -- switching away and back restores exact scroll position | VERIFIED | `useScrollAnchor.ts` has `scrollPositionMapRef` (Map), `saveScrollPosition` saves `container.scrollTop`, `restoreScrollPosition` sets it. `MessageList.tsx` wires: on session switch, saves old session's position, restores target session's position via `useLayoutEffect`. Falls back to scroll-to-bottom for new sessions with no saved position. |
| 4 | Scroll-to-bottom pill appears when scrolled up 200px+ with unread count badge; auto-scroll locks to bottom during streaming | VERIFIED | `useScrollAnchor.ts` IntersectionObserver uses `rootMargin: '0px 0px -200px 0px'` for 200px threshold. `ScrollToBottomPill.tsx` accepts `unreadCount` prop, renders badge with `scroll-pill-badge` class (absolute positioned, bg-primary). ResizeObserver in `useScrollAnchor.ts` maintains bottom lock on content resize during streaming with rAF throttle. `incrementUnread` called by MessageList when `messages.length` grows while `showPill` is true. |
| 5 | New messages animate in with fade + slide-from-bottom (respecting prefers-reduced-motion); streaming cursor pulses with primary accent | VERIFIED | `MessageList.tsx` line 177: `motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 duration-200` applied to messages at `idx >= newStartIndex`. `motion-safe:` prefix handles `prefers-reduced-motion`. Initial load and session switch set `newStartIndex = messages.length` (no animations). `StreamingCursor.tsx` component with `primary`/`muted` variants. CSS `cursor-pulse` keyframe: opacity 0.4-1.0, 1.06s cycle. Muted variant uses `--text-muted`. `prefers-reduced-motion: reduce` disables cursor animation. `tw-animate-css` installed (package.json) and imported (index.css). |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/src/components/chat/view/StatusLine.tsx` | Activity status line component | VERIFIED | 35 lines, React.memo, two Zustand selectors, opacity fade |
| `src/src/components/chat/view/StreamingCursor.tsx` | Reusable streaming cursor | VERIFIED | 25 lines, primary/muted variants, aria-hidden |
| `src/src/components/chat/styles/status-line.css` | Status line fade CSS | VERIFIED | Uses `var(--duration-normal)` and `var(--ease-out)` design tokens |
| `src/src/components/chat/styles/streaming-cursor.css` | Cursor pulse + muted variant CSS | VERIFIED | `cursor-pulse` keyframe (0.4-1.0 opacity), `--muted` class, `prefers-reduced-motion` media query, finalizing hides |
| `src/src/hooks/useScrollAnchor.ts` | Enhanced scroll hook | VERIFIED | 253 lines, ResizeObserver, position map, unread count, 200px rootMargin |
| `src/src/components/chat/view/ScrollToBottomPill.tsx` | Scroll pill with unread badge | VERIFIED | 83 lines, `unreadCount` prop, badge with `bg-primary`, 99+ cap |
| `src/src/components/chat/view/MessageContainer.tsx` | content-visibility wrapper | VERIFIED | `contentVisibility: 'auto'`, `containIntrinsicHeight: 'auto 200px'` on non-streaming messages |
| `src/src/components/chat/view/TokenUsage.tsx` | Token/cost display | VERIFIED | 58 lines, formatted display, middle dot separator, cost formatting |
| `src/src/components/chat/view/AssistantMessage.tsx` | Assistant message with TokenUsage | VERIFIED | Imports and renders `<TokenUsage metadata={message.metadata} />` |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| StatusLine.tsx | stores/stream.ts | `useStreamStore` selectors for `activityText` and `isStreaming` | WIRED | Lines 19-20 |
| ChatView.tsx | StatusLine.tsx | Grid row between messages and permission banner | WIRED | Import line 28, render line 117, grid `1fr_auto_auto_auto` |
| websocket-init.ts | stores/stream.ts | Debounced setTimeout in onActivityText (200ms) | WIRED | Lines 75-79, cleanup on stream end lines 84-87 |
| ActiveMessage.tsx | StreamingCursor.tsx | `<StreamingCursor />` replaces inline span | WIRED | Import line 28, render line 349 |
| ThinkingDisclosure.tsx | StreamingCursor.tsx | `<StreamingCursor variant="muted" />` for active thinking | WIRED | Import line 16, conditional render line 84 |
| useScrollAnchor.ts | ResizeObserver API | Observe content wrapper for dynamic height changes | WIRED | Lines 163-181, rAF throttle |
| MessageList.tsx | useScrollAnchor.ts | scrollPositionMap save/restore + unreadCount to pill | WIRED | save line 119, restore line 124, incrementUnread line 141 |
| ScrollToBottomPill.tsx | useScrollAnchor.ts | unreadCount prop from hook return | WIRED | Prop passed from MessageList |
| TokenUsage.tsx | types/message.ts | Reads metadata.inputTokens, outputTokens, cost | WIRED | Import line 11, reads lines 30-31, 38-43 |
| AssistantMessage.tsx | TokenUsage.tsx | Renders TokenUsage below message content | WIRED | Import line 25, render line 88 |
| stream-multiplexer.ts | stores/stream.ts | onResultData stores tokens/cost | WIRED | Callback line 68, invoked line 209 |
| ActiveMessage.tsx | stores/stream.ts | Reads resultTokens/resultCost during handleFlush | WIRED | Lines 136-138, populates metadata lines 146-150 |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| ACT-01 | 18-01 | Activity status line below message list, React.memo, single selector | SATISFIED | StatusLine.tsx with memo, two selectors |
| ACT-02 | 18-01 | Fade in/out with CSS transition, truncate, visible when streaming+activityText | SATISFIED | opacity transition, truncate class, visible logic |
| ACT-03 | 18-01 | Activity text debounced to 200ms in multiplexer | SATISFIED | websocket-init.ts setTimeout 200ms with cleanup |
| ACT-04 | 18-01 | Status line outside scroll container, never causes scroll height changes | SATISFIED | Placed in ChatView grid row, not inside scroll container |
| ACT-05 | 18-03 | Token/cost display below finalized assistant messages | SATISFIED | TokenUsage component, full pipeline from multiplexer to display |
| NAV-01 | 18-02 | Scroll position preserved per session via useRef Map | SATISFIED | scrollPositionMapRef in useScrollAnchor, save/restore in MessageList |
| NAV-02 | 18-02 | content-visibility: auto on past message containers | SATISFIED | MessageContainer applies contentVisibility style when !isStreaming |
| NAV-03 | 18-02 | ResizeObserver bottom lock during dynamic content expansion | SATISFIED | ResizeObserver in useScrollAnchor with rAF throttle |
| NAV-04 | 18-02 | Scroll pill at 200px+ threshold with unread badge | SATISFIED | rootMargin -200px, unreadCount prop, badge rendering |
| DEP-06 | 18-03 | tw-animate-css installed for entrance animations | SATISFIED | package.json dependency, index.css import |
| POL-01 | 18-03 | Message entrance animations with prefers-reduced-motion | SATISFIED | motion-safe: prefix on animation classes |
| POL-02 | 18-01 | Streaming cursor pulses (opacity 0.4-1.0), primary accent | SATISFIED | cursor-pulse keyframe in CSS, StreamingCursor component |
| POL-03 | 18-01 | Thinking block text: italic text-muted font-mono text-sm | SATISFIED | Pre-existing styling confirmed intact after cursor addition |
| POL-04 | 18-01 | All CSS animations use design tokens, no hardcoded durations | SATISFIED | All transitions use var(--duration-normal), var(--ease-out) |

No orphaned requirements found -- REQUIREMENTS.md maps exactly ACT-01 through ACT-05, NAV-01 through NAV-04, DEP-06, POL-01 through POL-04 to Phase 18, all accounted for in plans.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| TokenUsage.tsx | 33 | `return null` | Info | Intentional guard -- renders nothing when no token data available |
| MessageList.tsx | 163 | `return null` | Info | Intentional fallback for unknown message types |

No blockers or warnings. Both `return null` instances are correct conditional rendering patterns.

### Human Verification Required

### 1. Activity Status Line Visual Behavior

**Test:** Start a streaming session with tool calls. Watch the area between message list and composer.
**Expected:** Activity text appears ("Reading file.ts..."), fades in smoothly, updates without flickering, fades out when streaming ends. No scroll jump when it appears/disappears.
**Why human:** Opacity transition smoothness and debounce flicker elimination need visual confirmation.

### 2. Streaming Cursor Pulse

**Test:** During active streaming, observe the cursor at the end of text.
**Expected:** Vertical bar pulses smoothly between 40% and 100% opacity with primary accent color. In thinking blocks, cursor uses muted color.
**Why human:** Animation smoothness and color correctness need visual verification.

### 3. Scroll Position Preservation

**Test:** Open a long session, scroll up partway. Switch to another session. Switch back.
**Expected:** Exact scroll position restored -- no flash to top or bottom.
**Why human:** Layout-effect timing and visual flash detection need human eyes.

### 4. Unread Badge on Scroll Pill

**Test:** During streaming, scroll up 200px+. Wait for new messages.
**Expected:** Pill appears, badge shows incrementing count. Click pill: smooth scroll to bottom, badge disappears.
**Why human:** Real-time counter behavior and smooth scroll need visual confirmation.

### 5. Token/Cost Display

**Test:** Send a message, wait for assistant response to finalize.
**Expected:** Below the assistant message: "1,234 in / 567 out . $0.003" (or similar with real numbers).
**Why human:** Data pipeline depends on live backend result messages; format needs visual check.

### 6. Message Entrance Animations

**Test:** Send a message and watch the response appear. Then reload the page.
**Expected:** New messages fade + slide in from bottom. On reload, all messages appear instantly (no animation cascade).
**Why human:** Animation timing and cascade prevention need visual confirmation.

---

_Verified: 2026-03-08T19:45:00Z_
_Verifier: Claude (gsd-verifier)_
