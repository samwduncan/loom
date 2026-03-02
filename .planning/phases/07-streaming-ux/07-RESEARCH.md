# Phase 7: Streaming UX - Research

**Researched:** 2026-03-02
**Domain:** Streaming chat UX — scroll behavior, typing/thinking indicators, token buffering, reconnect experience
**Confidence:** HIGH

## Summary

Phase 7 builds on an already-functional streaming pipeline (rAF-buffered token delivery, `appendStreamingChunk`/`finalizeStreamingMessage`, turn grouping with `isStreaming` flag) to add user-facing polish: smart auto-scroll that respects user intent, visual indicators for AI state transitions, a streaming cursor, and reconnect skeleton placeholders. The existing codebase provides strong foundations — `useChatSessionState` already tracks `isUserScrolledUp` and `isNearBottom()`, `ActivityIndicator` is the replacement target for the new aurora shimmer pre-token indicator, and `ThinkingDisclosure` handles thinking block collapse/expand.

The primary technical challenge is the **aurora rainbow shimmer animation** — the user has locked specific visual requirements (full rainbow spectrum, multicolor shifting gradient on both skeleton lines and "Thinking..." text). CSS `@property` with `background-clip: text` is the correct modern approach (Baseline 2024, ~95% browser support). The scroll behavior work is straightforward refactoring of existing `isNearBottom`/`handleScroll` logic into an IntersectionObserver sentinel pattern with a floating pill component. The streaming cursor (solid amber caret) is a simple CSS pseudo-element.

**Primary recommendation:** Use CSS `@property` for animating gradient angles on both skeleton and thinking shimmer effects. Refactor scroll tracking to use a sentinel `<div>` at the bottom of the message list observed by IntersectionObserver. Apply `contain: content` on streaming message elements and `overflow-anchor: auto` on the scroll container.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Auto-scroll pauses **immediately** on any upward scroll gesture (no threshold/debounce)
- Floating scroll pill appears **bottom-right** when user is scrolled up during streaming
- Pill shows **live-updating turn count** ("N new turns" — counts full assistant turns, not individual message blocks)
- Pill **stays until dismissed** — user must click it or scroll to bottom manually; does not auto-dismiss after response ends
- Clicking the pill triggers **smooth animated scroll** to bottom (~300ms)
- Auto-scroll **auto re-engages** when the user scrolls back to the bottom during streaming (no need to click pill)
- **Pre-token indicator:** 4-5 **uniform-width** skeleton placeholder lines with **full rainbow aurora shimmer** effect
- **Skeleton-to-content transition:** Skeleton **collapses upward**, then real streaming text appears from the same position
- **Extended thinking indicator:** "Thinking..." text with **rainbow aurora shimmer** effect — letters are multicolored with shifting gradient, like starlight twinkling or aurora borealis. NOT blinking/pulsing — shimmering color animation
- Aurora shimmer uses **full rainbow spectrum** (not warm earthy tones)
- **Thinking block disclosure:** Starts **collapsed** when thinking content is available; user clicks to expand
- **Streaming cursor:** Blinking **solid amber** caret (|) at the end of streaming text; disappears when streaming completes
- **ClaudeStatus bar:** Remains visible during streaming (elapsed time, token count, stop button)
- **Buffer flush interval:** Every animation frame (~16ms) for **smooth character-by-character flow**
- **Markdown rendering:** Hybrid approach — render **inline markdown** (bold, italic, inline code) live during streaming; defer **block elements** (code blocks, headers, lists) until a natural pause or block delimiter completes
- **Code blocks:** As soon as opening ``` is detected, **immediately create the code block container** and stream code into it (no wait for closing fence)
- **CSS containment:** Apply `contain: content` on streaming message elements to prevent layout recalculation from propagating
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

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| STRM-01 | AI responses stream token-by-token using requestAnimationFrame buffer (50-100ms batching) to prevent per-token setState freezing | Already implemented in `useChatRealtimeHandlers.ts` (lines 252-263). Phase 7 tunes it: user wants per-frame flush (~16ms), which is the current rAF behavior. Add `contain: content` CSS, streaming cursor, and hybrid markdown rendering. |
| STRM-02 | Smart auto-scroll — auto-scroll while user is at bottom; stop if user scrolls up; use CSS overflow-anchor for position preservation | Refactor `useChatSessionState` scroll logic: IntersectionObserver sentinel pattern + `overflow-anchor: auto` on scroll container + immediate pause on `wheel`/`touchmove` events |
| STRM-03 | Floating scroll-to-bottom pill appears when user is scrolled away — shows "N new messages" count, disappears when user reaches bottom | New `ScrollToBottomPill` component in bottom-right of `ChatMessagesPane`; tracks turn count delta since user scrolled up; replaces current `ChatInputControls` scroll button |
| STRM-04 | Typing indicator (pulsing dots or similar) shown before text starts streaming, transitions seamlessly into streaming content | Replace `ActivityIndicator` + `AssistantThinkingIndicator` with aurora shimmer skeleton lines; collapse-upward transition on first token |
| STRM-05 | Pulsing "Thinking..." indicator during extended thinking phases — transitions into collapsed thinking disclosure when complete | New `ThinkingShimmer` component with aurora `background-clip: text` effect; on thinking content arrival, morphs into existing `ThinkingDisclosure` (collapsed) |
| STRM-06 | Skeleton shimmer placeholder bars shown during reconnect scrollback load — fades to real content when parsed | Reuse aurora skeleton component for reconnect gap placeholders; fade-in transition (200ms) distinct from collapse-upward used for pre-token |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 18.x (existing) | Component framework | Already in project |
| CSS `@property` | Baseline 2024 | Animatable custom properties for aurora gradient angles | GPU-composited, no JS overhead, ~95% browser support (Chrome 85+, Safari 16.4+, Firefox 128+) |
| CSS `background-clip: text` | Baseline | Text gradient masking for thinking shimmer | Widely supported with `-webkit-` prefix fallback |
| CSS `contain: content` | Baseline | Layout containment on streaming messages | Prevents layout recalculation cascade during rapid DOM updates |
| CSS `overflow-anchor: auto` | Partial | Scroll position stability | Supported in Chrome/Edge/Firefox; Safari lacks support (needs JS fallback) |
| IntersectionObserver | Baseline | Sentinel-based scroll position detection | Already used in project for turn collapse; zero scroll-event overhead |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `oklch()` color space | CSS Color Level 4 | Vivid rainbow gradients without dead gray zones | All aurora shimmer gradient stops |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CSS `@property` gradient animation | `background-size: 400%` + `background-position` animation | Older technique, still works; `@property` is smoother and more maintainable |
| IntersectionObserver sentinel | `onScroll` + `isNearBottom()` calculation | Current approach; works but fires on every scroll event; sentinel is zero-overhead |
| `overflow-anchor: auto` | Manual `scrollTop` adjustment in `useLayoutEffect` | Already implemented for prepend cases; keep as Safari fallback |

**Installation:**
```bash
# No new dependencies needed — all CSS-native and React built-in
```

## Architecture Patterns

### Recommended Project Structure
```
src/components/chat/
├── view/subcomponents/
│   ├── AuroraShimmer.tsx          # Shared aurora shimmer CSS + skeleton lines
│   ├── PreTokenIndicator.tsx      # Replaces AssistantThinkingIndicator (skeleton lines)
│   ├── ThinkingShimmer.tsx        # "Thinking..." text with aurora effect
│   ├── ScrollToBottomPill.tsx     # Floating pill with turn count
│   ├── ConnectionStatusDot.tsx    # Green/amber/red dot for header
│   ├── ReconnectSkeletons.tsx     # Skeleton placeholders for reconnect gap
│   ├── StreamingCursor.css        # Blinking amber caret styles
│   ├── ThinkingDisclosure.tsx     # (existing — receives transition from ThinkingShimmer)
│   ├── ChatMessagesPane.tsx       # (existing — add sentinel div, pill, containment)
│   └── ClaudeStatus.tsx           # (existing — unchanged, stays visible during streaming)
├── hooks/
│   ├── useScrollAnchor.ts         # IntersectionObserver sentinel + isAtBottom state
│   ├── useNewTurnCounter.ts       # Counts new turns since user scrolled up
│   ├── useChatSessionState.ts     # (existing — refactor scroll logic to use useScrollAnchor)
│   └── useChatRealtimeHandlers.ts # (existing — add thinking state detection)
└── styles/
    └── aurora-shimmer.css         # @property declarations + keyframes (global CSS)
```

### Pattern 1: IntersectionObserver Sentinel for Scroll Tracking
**What:** Place an invisible `<div>` (sentinel) at the bottom of the message list. Use IntersectionObserver to detect when it's visible (user is at bottom) or not (user scrolled up).
**When to use:** Replacing `onScroll` + `isNearBottom()` calculation for auto-scroll decisions.
**Example:**
```typescript
// useScrollAnchor.ts
import { useCallback, useEffect, useRef, useState } from 'react';

export function useScrollAnchor() {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const isAtBottomRef = useRef(true);

  // Track user-initiated scroll-away
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const atBottom = entry.isIntersecting;
        isAtBottomRef.current = atBottom;
        setIsAtBottom(atBottom);
        if (atBottom) {
          setIsUserScrolledUp(false); // Auto re-engage
        }
      },
      { threshold: 0, rootMargin: '100px' } // 100px threshold
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  // Immediate pause on user scroll gesture
  const handleUserScroll = useCallback(() => {
    if (!isAtBottomRef.current) {
      setIsUserScrolledUp(true);
    }
  }, []);

  // Stable ref callback for sentinel element
  const sentinelCallbackRef = useCallback((node: HTMLDivElement | null) => {
    (sentinelRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
  }, []);

  return { sentinelRef: sentinelCallbackRef, isAtBottom, isUserScrolledUp, handleUserScroll };
}
```

### Pattern 2: Aurora Shimmer via CSS @property
**What:** Register a custom `--aurora-angle` property with `<angle>` syntax, animate it from `0deg` to `360deg`. Use as the gradient angle in a `linear-gradient()` with oklch color stops.
**When to use:** Both skeleton line shimmer and thinking text shimmer.
**Example:**
```css
/* aurora-shimmer.css */
@property --aurora-angle {
  syntax: "<angle>";
  initial-value: 0deg;
  inherits: false;
}

@keyframes aurora-rotate {
  to { --aurora-angle: 360deg; }
}

.aurora-shimmer {
  background: linear-gradient(
    var(--aurora-angle),
    oklch(70% 0.25 0),     /* Red */
    oklch(70% 0.25 60),    /* Orange/Yellow */
    oklch(70% 0.25 140),   /* Green */
    oklch(70% 0.25 220),   /* Blue */
    oklch(70% 0.25 300),   /* Purple */
    oklch(70% 0.25 0)      /* Back to Red */
  );
  animation: aurora-rotate 4s linear infinite;
}

/* For skeleton lines */
.aurora-skeleton-line {
  composes: aurora-shimmer;
  height: 14px;
  border-radius: 4px;
  opacity: 0.6;
}

/* For text */
.aurora-text {
  composes: aurora-shimmer;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
```

### Pattern 3: Collapse-Upward Transition for Pre-Token Skeleton
**What:** When first streaming token arrives, animate the skeleton container's height from its current value to 0 (collapse upward), then unmount and let streaming content appear naturally.
**When to use:** Pre-token skeleton-to-content transition (NOT reconnect — reconnect uses fade-in).
**Example:**
```typescript
// PreTokenIndicator.tsx — simplified concept
function PreTokenIndicator({ isVisible }: { isVisible: boolean }) {
  const [exiting, setExiting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isVisible && ref.current) {
      setExiting(true);
      // After collapse animation completes, unmount
      const timer = setTimeout(() => setExiting(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  if (!isVisible && !exiting) return null;

  return (
    <div
      ref={ref}
      style={{
        display: 'grid',
        gridTemplateRows: exiting ? '0fr' : '1fr',
        transition: 'grid-template-rows 300ms ease-out',
      }}
    >
      <div style={{ overflow: 'hidden' }}>
        {/* 4-5 skeleton lines with aurora shimmer */}
      </div>
    </div>
  );
}
```

### Pattern 4: Streaming Cursor as CSS Pseudo-Element
**What:** Append a blinking amber caret at the end of streaming text using `::after` on the last text node's container.
**When to use:** During active text streaming; remove when `isStreaming` becomes false.
**Example:**
```css
/* StreamingCursor.css */
@keyframes cursor-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.streaming-cursor::after {
  content: "|";
  color: #d4a574; /* Solid amber from design system */
  font-weight: bold;
  animation: cursor-blink 1s step-end infinite;
  margin-left: 1px;
}
```

### Pattern 5: Connection Status Dot in Header
**What:** Small colored circle in the header bar reflecting WebSocket connection state.
**When to use:** Always visible; changes color based on `isConnected` from `WebSocketContext`.
**Example:**
```typescript
// ConnectionStatusDot.tsx
function ConnectionStatusDot({ state }: { state: 'connected' | 'reconnecting' | 'disconnected' }) {
  const colors = {
    connected: 'bg-[#6bbf59]',      // DSGN-07 connected green
    reconnecting: 'bg-[#d4a574]',   // DSGN-07 reconnecting amber
    disconnected: 'bg-[#c15a4a]',   // DSGN-07 disconnected red
  };

  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${colors[state]} transition-colors duration-300`}
      title={`Connection: ${state}`}
    />
  );
}
```

### Anti-Patterns to Avoid
- **Animating `background-position` on large gradients:** Creates GPU texture thrashing; use `@property` angle animation instead
- **Using `setTimeout` for scroll-to-bottom:** Creates races with React state updates; use `requestAnimationFrame` or `useLayoutEffect`
- **Setting `scrollTop` in `useEffect`:** Causes visible flicker; use `useLayoutEffect` for scroll position changes
- **Debouncing the scroll-away detection:** User explicitly wants **immediate** pause on any upward scroll — no debounce
- **Counting individual messages for the pill:** User explicitly wants **turn count**, not message count
- **Auto-dismissing the pill after response ends:** User explicitly wants pill to stay until manually dismissed or bottom reached

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Scroll position anchoring on prepend | Manual `scrollTop` math for all browsers | CSS `overflow-anchor: auto` + JS fallback for Safari | Browser handles the math correctly; Safari fallback already exists in codebase (`useLayoutEffect` in `useChatSessionState`) |
| Gradient color interpolation | Manual RGB lerping in JS | CSS `oklch()` color space with `in oklch` interpolation | OKLCH produces perceptually uniform brightness across rainbow; RGB creates muddy grays between certain hue stops |
| Scroll position detection | `onScroll` + `getBoundingClientRect` | IntersectionObserver | No scroll-event overhead; already used in project for turn collapse |
| Animation timing | JS `requestAnimationFrame` loops | CSS `@keyframes` with `@property` | Compositor thread, zero main-thread cost |

**Key insight:** Every animation in this phase should be CSS-only. The streaming pipeline already runs on rAF in JS — adding JS-driven animations on top would compete for the same frame budget. CSS animations run on the compositor thread independently.

## Common Pitfalls

### Pitfall 1: Safari Does Not Support `overflow-anchor`
**What goes wrong:** Safari users experience scroll jumping when new messages are appended during streaming, because `overflow-anchor: auto` has no effect.
**Why it happens:** Safari has not implemented the CSS Scroll Anchoring spec.
**How to avoid:** Keep the existing `useLayoutEffect`-based scroll restoration in `useChatSessionState` as a fallback. It already handles the prepend case (lines 258-268). For the append case (streaming), the auto-scroll logic (`scrollToBottom()` when `!isUserScrolledUp`) handles it regardless of `overflow-anchor` support.
**Warning signs:** Test on Safari/WebKit; if scroll position jumps during streaming, the fallback isn't triggering.

### Pitfall 2: IntersectionObserver Timing with React State Updates
**What goes wrong:** The sentinel reports "at bottom" even when the user just scrolled up, because React hasn't committed the new scroll position yet.
**Why it happens:** IntersectionObserver callbacks fire asynchronously relative to React renders.
**How to avoid:** Use `isAtBottomRef` (synchronous ref) for immediate decisions in event handlers, and `isAtBottom` (state) for render decisions. The `handleUserScroll` callback on `onWheel`/`onTouchMove` provides the immediate "user scrolled" signal.
**Warning signs:** Pill flickers or doesn't appear when scrolling up during fast streaming.

### Pitfall 3: Aurora Shimmer Performance During Heavy Streaming
**What goes wrong:** Shimmer animation stutters or causes frame drops while tokens are arriving rapidly.
**Why it happens:** If the shimmer uses JS-based animation or oversized background textures, it competes with rAF-driven DOM updates.
**How to avoid:** Use CSS `@property` animation exclusively (compositor thread). Apply `will-change: --aurora-angle` only on actively animating elements. Remove `will-change` when animation stops.
**Warning signs:** DevTools Performance tab shows "Recalculate Style" entries coinciding with shimmer elements.

### Pitfall 4: Skeleton-to-Content Layout Jump
**What goes wrong:** When pre-token skeleton collapses and streaming text appears, there's a visible "jump" in the layout — content shifts up or down abruptly.
**Why it happens:** The skeleton height and the first streaming content height differ, causing a gap or overlap during the transition.
**How to avoid:** Use CSS Grid `grid-template-rows: 1fr → 0fr` animation for the collapse (already proven in `ThinkingDisclosure`). Start streaming content rendering in the same parent container so the transition is position-stable. The skeleton should collapse from its position, and streaming text appears from the same Y coordinate.
**Warning signs:** Visible vertical shift during the skeleton-to-text transition, especially noticeable on short responses.

### Pitfall 5: Turn Counter Drift
**What goes wrong:** The pill's "N new turns" count doesn't match the actual number of new turns below the viewport.
**Why it happens:** Counting turns at scroll-time vs. counting them at message-arrival time can drift if turns are finalized or split while scrolled up.
**How to avoid:** Snapshot the `turnCount` from `useTurnGrouping` at the moment the user scrolls up. Then the pill shows `currentTurnCount - snapshotTurnCount`. Reset snapshot when user reaches bottom.
**Warning signs:** Pill shows 0 when there are clearly new messages, or shows a negative number.

### Pitfall 6: Hybrid Markdown Rendering Complexity
**What goes wrong:** Inline markdown renders mid-word (e.g., `**bol` renders as attempted bold), or block elements (code fences) render prematurely, causing flicker.
**Why it happens:** The streaming buffer contains incomplete markdown tokens that the parser tries to close.
**How to avoid:** Use a two-pass approach: (1) During streaming, `ReactMarkdown` already handles incomplete inline markup gracefully (unclosed `**` just renders as text). (2) For code blocks, detect opening ``` and immediately create the container — `ShikiCodeBlock` already accepts `isStreaming` and falls back to raw monospace. The existing `Markdown` component with `isStreaming` prop threading (from 05-05) is already set up for this.
**Warning signs:** Bold text "flashing" on/off during streaming, or code blocks briefly appearing as inline text.

## Code Examples

### Example 1: Aurora Shimmer CSS (Full Implementation)
```css
/* Source: Verified pattern from @property spec + oklch color space */
@property --aurora-angle {
  syntax: "<angle>";
  initial-value: 0deg;
  inherits: false;
}

@property --aurora-phase {
  syntax: "<number>";
  initial-value: 0;
  inherits: false;
}

@keyframes aurora-rotate {
  to { --aurora-angle: 360deg; }
}

@keyframes aurora-twinkle {
  0%, 100% { --aurora-phase: 0; }
  50% { --aurora-phase: 1; }
}

/* Base shimmer gradient — full rainbow spectrum */
.aurora-gradient {
  background: linear-gradient(
    calc(var(--aurora-angle) + 45deg),
    oklch(65% 0.28 0),     /* Red */
    oklch(70% 0.25 45),    /* Orange */
    oklch(75% 0.22 90),    /* Yellow */
    oklch(70% 0.25 150),   /* Green */
    oklch(65% 0.28 210),   /* Cyan */
    oklch(60% 0.28 270),   /* Blue */
    oklch(65% 0.25 330),   /* Purple */
    oklch(65% 0.28 0)      /* Back to Red */
  );
  animation: aurora-rotate 4s linear infinite;
}

/* Skeleton line variant */
.aurora-skeleton-line {
  height: 14px;
  border-radius: 4px;
  margin-bottom: 8px;
  background: linear-gradient(
    calc(var(--aurora-angle) + 45deg),
    oklch(65% 0.28 0),
    oklch(70% 0.25 45),
    oklch(75% 0.22 90),
    oklch(70% 0.25 150),
    oklch(65% 0.28 210),
    oklch(60% 0.28 270),
    oklch(65% 0.25 330),
    oklch(65% 0.28 0)
  );
  animation: aurora-rotate 4s linear infinite;
  opacity: 0.5;
}

/* Text variant — "Thinking..." with rainbow letters */
.aurora-thinking-text {
  background: linear-gradient(
    calc(var(--aurora-angle) + 45deg),
    oklch(75% 0.28 0),
    oklch(80% 0.25 60),
    oklch(85% 0.22 120),
    oklch(80% 0.25 180),
    oklch(75% 0.28 240),
    oklch(80% 0.25 300),
    oklch(75% 0.28 360)
  );
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: aurora-rotate 4s linear infinite;
  font-weight: 500;
}
```

### Example 2: Scroll-to-Bottom Pill Component
```typescript
// Source: Standard React pattern for floating notification pill
interface ScrollToBottomPillProps {
  newTurnCount: number;
  onScrollToBottom: () => void;
  visible: boolean;
}

function ScrollToBottomPill({ newTurnCount, onScrollToBottom, visible }: ScrollToBottomPillProps) {
  if (!visible || newTurnCount <= 0) return null;

  return (
    <button
      onClick={onScrollToBottom}
      className="fixed bottom-24 right-6 z-30 flex items-center gap-2 px-3 py-1.5
                 bg-[#2a1f1a] border border-[#c4a882]/30 rounded-full shadow-lg
                 text-sm text-[#f5e6d3] hover:bg-[#3d2e25] transition-all duration-200
                 animate-in slide-in-from-bottom-2"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </svg>
      <span>{newTurnCount} new turn{newTurnCount !== 1 ? 's' : ''}</span>
    </button>
  );
}
```

### Example 3: Connection Status Dot Integration
```typescript
// Source: Existing WebSocketContext provides isConnected boolean
// Extend to detect reconnecting state from the reconnect timeout

function useConnectionState() {
  const { isConnected } = useWebSocket();
  const [state, setState] = useState<'connected' | 'reconnecting' | 'disconnected'>('disconnected');
  const wasConnectedRef = useRef(false);

  useEffect(() => {
    if (isConnected) {
      setState('connected');
      wasConnectedRef.current = true;
    } else if (wasConnectedRef.current) {
      setState('reconnecting'); // Was connected before, now dropped
    } else {
      setState('disconnected'); // Never connected
    }
  }, [isConnected]);

  return state;
}
```

### Example 4: CSS Containment on Streaming Messages
```css
/* Source: CSS Containment Level 2 spec */
/* Apply to individual message containers during streaming */
.message-streaming {
  contain: content;
  /* contain: content is shorthand for contain: layout paint style
     Prevents layout changes inside streaming messages from triggering
     recalculation of siblings and parent layout */
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `background-size: 400%` shimmer | `@property` angle animation | 2024 (Baseline) | Smoother, GPU-composited, less VRAM |
| RGB color gradients | OKLCH color space | 2023 (CSS Color L4) | No muddy gray zones in rainbow, perceptually uniform |
| `onScroll` + `getBoundingClientRect` | IntersectionObserver sentinel | 2020+ (standard) | Zero scroll-event overhead |
| Manual scroll anchoring JS | `overflow-anchor: auto` | 2019+ (Chrome/Firefox) | Browser-native, but Safari still unsupported |
| JS-based typing indicators | CSS-only shimmer + `@property` | 2024 | Runs on compositor thread, immune to main-thread jank |

**Deprecated/outdated:**
- `requestAnimationFrame` for shimmer animation: Use CSS `@keyframes` instead; reserve rAF for token buffer flushing only
- Pulsing dots typing indicator: User rejected this pattern; use skeleton lines with aurora shimmer instead
- Warm earthy palette for indicators: User explicitly wants full rainbow spectrum for aurora effects

## Project Tooling

| Tool | Command | Detected From |
|------|---------|---------------|
| Lint | Not detected | N/A |
| Type Check | `npm run typecheck` | package.json scripts |
| Build | `npm run build` | package.json scripts |
| Test | Not detected | N/A |

*Written to `.planning/config.json` under `tooling` key for executor use.*

## Existing Code Inventory

This section documents what already exists and what Phase 7 modifies, to prevent the planner from creating redundant work.

### Files to REPLACE (full rewrite)
| File | Current Purpose | Phase 7 Replacement |
|------|----------------|---------------------|
| `ActivityIndicator.tsx` | Rotating phrase with blink animation | Aurora shimmer skeleton lines (PreTokenIndicator) |
| `AssistantThinkingIndicator.tsx` | Wrapper for ActivityIndicator | Wrapper for PreTokenIndicator |

### Files to MODIFY (targeted edits)
| File | What Changes |
|------|-------------|
| `useChatSessionState.ts` | Extract scroll logic into `useScrollAnchor` hook; add turn-count-since-scrolled-up tracking; add `overflow-anchor: auto` to container |
| `ChatMessagesPane.tsx` | Add sentinel div at bottom; add `ScrollToBottomPill`; add `contain: content` class on streaming turn blocks; wire `PreTokenIndicator` with collapse transition |
| `ChatInterface.tsx` | Add `ConnectionStatusDot` to header bar; pass connection state from `WebSocketContext` |
| `WebSocketContext.tsx` | Export reconnecting state (distinguish "never connected" from "was connected, now dropped") |
| `useChatRealtimeHandlers.ts` | Detect thinking state from `content_block_start` with `type: 'thinking'`; emit signal for ThinkingShimmer |
| `ThinkingDisclosure.tsx` | Accept transition from ThinkingShimmer; ensure starts collapsed per user decision |
| `Markdown.tsx` | Add `streaming-cursor` class to last text element when `isStreaming` is true |
| `ChatComposer.tsx` / `ChatInputControls.tsx` | Remove existing scroll-to-bottom button (replaced by floating pill) |

### Files to CREATE (new components)
| File | Purpose |
|------|---------|
| `aurora-shimmer.css` | `@property` declarations, keyframes, base classes |
| `ScrollToBottomPill.tsx` | Floating pill with turn count |
| `ConnectionStatusDot.tsx` | Header bar connection indicator |
| `useScrollAnchor.ts` | IntersectionObserver sentinel hook |
| `useNewTurnCounter.ts` | Turn count delta tracking |

### Integration Points (exact locations from code analysis)
| Location | Integration |
|----------|-------------|
| `ChatMessagesPane.tsx` line 407 | `{isLoading && <AssistantThinkingIndicator />}` — replace with new PreTokenIndicator |
| `ChatMessagesPane.tsx` line 244 | `className="flex-1 overflow-y-auto..."` — add `overflow-anchor: auto` via style |
| `ChatMessagesPane.tsx` after line 403 (`</div>` closing max-w-720) | Insert sentinel `<div>` for IntersectionObserver |
| `ChatInterface.tsx` line 296 | Header bar `<div>` — add ConnectionStatusDot alongside ProviderDropdown |
| `ChatInputControls.tsx` lines 136-146 | Remove scroll-to-bottom button (replaced by floating pill) |
| `useChatRealtimeHandlers.ts` line 252 | `content_block_delta` handler — add streaming cursor awareness |

## Open Questions

1. **Thinking block detection timing**
   - What we know: Claude API sends `content_block_start` with `type: 'thinking'` before thinking content, and the existing handler processes `content_block_delta`. The `isThinking` flag is set on messages in `useChatRealtimeHandlers`.
   - What's unclear: Whether the WebSocket relay preserves the `content_block_start` message type or normalizes it. The current handler only processes `content_block_delta` (text) and `content_block_stop`.
   - Recommendation: During plan 07-04 execution, audit the actual WebSocket message flow when extended thinking is active. If `content_block_start` with `type: thinking` is received, use it to trigger ThinkingShimmer. Otherwise, trigger on first `isThinking: true` message.

2. **Reconnect gap detection**
   - What we know: `WebSocketContext` reconnects after 3s delay. When reconnected, session messages are reloaded via `loadSessionMessages`.
   - What's unclear: How to detect which messages are "new" (the gap) during reconnect to show skeleton placeholders only for the gap.
   - Recommendation: On reconnect, compare `chatMessages.length` before and after reload. Show skeletons for the delta. The `setSessionMessages` call after reconnect provides the signal.

3. **Hybrid markdown rendering edge cases**
   - What we know: `Markdown.tsx` with `ReactMarkdown` handles incomplete markup reasonably well during streaming. `ShikiCodeBlock` already has `isStreaming` fallback.
   - What's unclear: Whether deferring block-level elements (headers, lists) until delimiter completion requires custom ReactMarkdown plugin or if the existing parser behavior suffices.
   - Recommendation: Test current `ReactMarkdown` behavior with partial block elements during streaming. If acceptable, no changes needed. If not, implement a pre-processor that buffers incomplete block delimiters before passing to ReactMarkdown.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `useChatRealtimeHandlers.ts`, `useChatSessionState.ts`, `ChatMessagesPane.tsx`, `ChatInterface.tsx`, `ActivityIndicator.tsx`, `AssistantThinkingIndicator.tsx`, `ThinkingDisclosure.tsx`, `Markdown.tsx`, `WebSocketContext.tsx`, `ClaudeStatus.tsx`, `ChatInputControls.tsx`, `useTurnGrouping.ts`, `types.ts`
- [MDN: CSS @property](https://developer.mozilla.org/en-US/docs/Web/CSS/@property) — Baseline 2024, ~95% support
- [MDN: overflow-anchor](https://developer.mozilla.org/en-US/docs/Web/CSS/overflow-anchor) — Chrome/Edge/Firefox only; Safari unsupported
- [Can I Use: @property](https://caniuse.com/mdn-css_at-rules_property) — Chrome 85+, Safari 16.4+, Firefox 128+

### Secondary (MEDIUM confidence)
- Gemini Research: CSS `@property` + OKLCH aurora shimmer pattern — verified against MDN @property docs and Can I Use data
- Gemini Research: `will-change` for compositor promotion, `contain: content` for layout isolation — consistent with CSS Containment Level 2 spec

### Tertiary (LOW confidence)
- Gemini Research: `view-timeline` scroll-driven animations — mentioned but NOT recommended for this phase (too new, limited browser support); use IntersectionObserver instead

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all CSS-native, no new dependencies; `@property` verified Baseline 2024
- Architecture: HIGH — patterns derived directly from codebase analysis of 14 existing files; IntersectionObserver already used in project
- Pitfalls: HIGH — Safari `overflow-anchor` gap verified via official MDN docs; layout jump prevention proven by existing `ThinkingDisclosure` grid animation
- Aurora shimmer technique: MEDIUM-HIGH — `@property` + oklch approach verified via MDN specs and Gemini research; exact visual tuning (colors, speed) requires iteration during execution

**Research date:** 2026-03-02
**Valid until:** 2026-04-01 (stable CSS features; no moving targets)
