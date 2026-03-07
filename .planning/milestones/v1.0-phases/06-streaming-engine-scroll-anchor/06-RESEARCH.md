# Phase 6: Streaming Engine + Scroll Anchor - Research

**Researched:** 2026-03-06
**Domain:** React performance bypass (rAF DOM mutation), CSS containment, IntersectionObserver scroll anchoring
**Confidence:** HIGH

## Summary

Phase 6 implements three tightly coupled pieces: a `useStreamBuffer` hook that accumulates WebSocket content tokens in a `useRef` and paints them to the DOM via `requestAnimationFrame` (bypassing React's reconciler entirely), an `ActiveMessage` component that displays the streaming text with a blinking cursor and manages its own finalization lifecycle, and a `useScrollAnchor` hook that uses an `IntersectionObserver` on a sentinel element to track whether the user has scrolled away from the bottom.

The entire Phase 5 WebSocket pipeline is already in place: `wsClient.subscribeContent(listener)` delivers content tokens, `wsClient.startContentStream()`/`endContentStream()` manages the backlog buffer for late subscribers, and `useStreamStore` tracks `isStreaming`. Phase 6 hooks subscribe directly to `wsClient.subscribeContent()` (not the store) for token data, and read `isStreaming` from the stream store via selector for lifecycle transitions.

**Primary recommendation:** Keep it surgically simple. Three files, three concerns. The hook owns the rAF loop and ref accumulation. The component owns the visual container (containment, cursor, tint). The scroll hook owns the observer and pill visibility. No markdown parsing, no rich rendering -- plain `textContent` assignment for M1.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Streaming cursor:** Thin vertical pipe (~2px), `--accent-primary` color, ~530ms CSS blink animation via `::after` pseudo-element or inline span. No JS animation loop for cursor. On stream end: cursor fades out over `--duration-normal` (200ms) via opacity transition.
- **Stream-to-final transition:** Seamless replace with finalizing state. ActiveMessage tracks lifecycle: `streaming` -> `finalizing` -> unmounted. Component remains mounted during entire fade-out. Parent gates unmount on "finalization complete" signal, NOT on `isStreaming === false`. On finalization: cursor + tint fade out over 200ms, accumulated text flushes to timeline store via `addMessage()`.
- **Mid-stream disconnect:** Keep partial text visible. Append muted error line: "Connection lost during response." using `--text-muted`.
- **Scroll pill:** Bottom-center of chat scroll container, floating ~16px above bottom edge. Down arrow + "Scroll to bottom" text. `var(--z-scroll-pill)` (30). Enter: slide up from translateY(8px) + opacity 0. Exit: reverse. Click: smooth-scroll to bottom + re-engage auto-scroll.
- **ActiveMessage container:** `contain: content` REQUIRED (Constitution 10.3). Background tint: `color-mix(in oklch, var(--accent-primary) 4%, transparent)` or define `--accent-primary-wash` token. Border radius: 8px. No additional borders or shadows. Tint fades to transparent over 200ms on finalization, synced with cursor fade.
- **Backlog drainage:** `useStreamBuffer` MUST consume wsClient's stream backlog on mount. Handle burst of replayed tokens correctly -- append all to ref and schedule single rAF paint, not one per replayed token.
- **Plain text:** Both streaming and finalized messages render plain text in M1. No markdown. No layout shift risk on swap.

### Claude's Discretion
- Scroll pill surface treatment (overlay vs frosted glass)
- Whether finalized messages get basic markdown or stay plain text (lean plain text)
- Exact rAF loop implementation details (batch size, timing)
- IntersectionObserver threshold and root margin values
- Finalization handshake mechanism details (local state vs ref, parent callback vs render prop)
- Whether to define `--accent-primary-wash` as new token or use `color-mix()` inline
- Error line styling details for mid-disconnect partial content
- Test strategy for zero-rerender verification

### Deferred Ideas (OUT OF SCOPE)
- Live markdown during streaming (M2 CHAT-04)
- Aurora/ambient overlay behind streaming (M3 POLISH-02)
- Message entrance animations (M3 POLISH-03)
- content-visibility: auto on past messages (M3 POLISH-01)
- Scroll physics perfection / zero jitter at 100 tok/sec (M3 POLISH-01)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| STRM-03 | `useStreamBuffer` hook: useRef + rAF token accumulation, direct DOM mutation bypassing React reconciler, flush to timeline on stream complete, zero re-renders during streaming | rAF loop pattern with ref accumulation, `wsClient.subscribeContent()` as token source, `textContent` assignment for DOM update |
| COMP-02 | `ActiveMessage` component: uses useStreamBuffer, wrapped in React.memo, blinking cursor, `contain: content` CSS, no re-renders during streaming | CSS containment, pseudo-element cursor, finalization lifecycle state machine |
| COMP-03 | `useScrollAnchor` hook: auto-scroll during streaming, IntersectionObserver sentinel, disengage on user scroll, "Scroll to bottom" pill, re-engage on click or new stream | IntersectionObserver on sentinel div, `isIntersecting` tracking, `scrollIntoView` for re-engagement |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.0 | Component framework | Already installed, provides useRef/memo/useCallback |
| Zustand | 5.0.11 | State management | Stream store (isStreaming), timeline store (addMessage) |
| TypeScript | 5.9.3 | Type safety | Strict mode with noUncheckedIndexedAccess |

### Supporting (Browser APIs -- no additional libraries)
| API | Purpose | When to Use |
|-----|---------|-------------|
| `requestAnimationFrame` | 60fps DOM mutation loop | Token painting from ref to DOM |
| `IntersectionObserver` | Scroll position detection | Sentinel visibility for auto-scroll |
| `Element.scrollIntoView()` | Programmatic scroll | Re-engage auto-scroll |
| `CSS contain: content` | Layout isolation | ActiveMessage containment |
| `CSS color-mix()` | Tint generation | Background wash from accent token |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Raw rAF loop | `useTransition` + state | Would trigger reconciler -- defeats purpose |
| IntersectionObserver | `scroll` event + debounce | Higher CPU, more complex disengage detection |
| `color-mix()` inline | New CSS token | Token is cleaner but adds maintenance surface |
| `::after` pseudo cursor | Inline `<span>` element | Pseudo avoids extra DOM node but requires parent positioning |

**Installation:** No new dependencies. All APIs are browser-native or already in `package.json`.

## Architecture Patterns

### File Locations (Constitution 1.1 compliant)
```
src/src/
  hooks/
    useStreamBuffer.ts          # rAF + ref token accumulation hook
    useStreamBuffer.test.ts     # Unit tests
    useScrollAnchor.ts          # IntersectionObserver scroll hook
    useScrollAnchor.test.ts     # Unit tests
  components/
    chat/
      view/
        ActiveMessage.tsx       # Streaming message display
        ActiveMessage.test.tsx  # Component tests
        ScrollToBottomPill.tsx  # Floating pill button
      styles/
        streaming-cursor.css    # Cursor blink + tint animations
```

### Pattern 1: rAF Token Buffer (STRM-03)
**What:** Content tokens arrive from WebSocket at unpredictable frequency (50-100/sec). A `useRef` accumulates them as a string. A `requestAnimationFrame` loop reads the ref and writes to a DOM node's `textContent` directly. React never knows the text changed.

**When to use:** Any time you need to update DOM faster than React can reconcile.

**Implementation approach:**
```typescript
// Core pattern: ref accumulation + rAF paint
function useStreamBuffer(nodeRef: React.RefObject<HTMLElement | null>) {
  const bufferRef = useRef('');
  const rafIdRef = useRef<number>(0);
  const isActiveRef = useRef(false);

  // rAF paint loop -- reads buffer, writes to DOM
  const paint = useCallback(() => {
    if (nodeRef.current && bufferRef.current) {
      nodeRef.current.textContent = bufferRef.current;
    }
    if (isActiveRef.current) {
      rafIdRef.current = requestAnimationFrame(paint);
    }
  }, [nodeRef]);

  // Token listener -- appends to ref, never triggers render
  const onToken = useCallback((token: string) => {
    bufferRef.current += token;
  }, []);

  // Subscribe to wsClient content stream
  useEffect(() => {
    isActiveRef.current = true;
    const unsub = wsClient.subscribeContent(onToken);
    rafIdRef.current = requestAnimationFrame(paint);

    return () => {
      isActiveRef.current = false;
      cancelAnimationFrame(rafIdRef.current);
      unsub();
    };
  }, [onToken, paint]);

  return bufferRef; // Expose for flush on stream end
}
```

**Critical detail:** The `subscribeContent` call replays the backlog buffer (Phase 5 design). Because backlog tokens arrive synchronously in the subscription callback before the first rAF fires, they all accumulate in `bufferRef.current` and get painted in the first frame. No per-token paint for backlog.

### Pattern 2: Finalization State Machine (COMP-02)
**What:** ActiveMessage has three lifecycle states managed by a local ref (not state, to avoid re-renders):

```
streaming ──(isStreaming=false)──> finalizing ──(fade complete)──> signal unmount
```

**When to use:** Any component that needs a cleanup animation before unmount.

**Implementation approach:**
```typescript
// Lifecycle managed by refs + CSS transitions
type LifecyclePhase = 'streaming' | 'finalizing' | 'unmounted';

// In ActiveMessage:
const phaseRef = useRef<LifecyclePhase>('streaming');
const isStreaming = useStreamStore(state => state.isStreaming);

// Detect transition from streaming to finalizing
useEffect(() => {
  if (!isStreaming && phaseRef.current === 'streaming') {
    phaseRef.current = 'finalizing';
    // 1. Flush buffer to timeline store
    const text = bufferRef.current;
    useTimelineStore.getState().addMessage(sessionId, {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: text,
      metadata: { timestamp: new Date().toISOString(), tokenCount: null, cost: null, duration: null },
      providerContext: { providerId: 'claude', modelId: null, agentName: null },
    });
    // 2. Start CSS fade-out (add data attribute or class)
    // 3. After 200ms, signal parent to unmount
    setTimeout(() => {
      onFinalizationComplete?.();
    }, 200); // matches --duration-normal
  }
}, [isStreaming]);
```

**Key insight:** The `setTimeout` matches `--duration-normal` (200ms). CSS transitions on the cursor and background tint are driven by a `data-phase="finalizing"` attribute, not React state. The component stays mounted during the entire fade.

### Pattern 3: IntersectionObserver Scroll Sentinel (COMP-03)
**What:** A zero-height sentinel `<div>` sits at the bottom of the scroll container. An `IntersectionObserver` watches it. When the sentinel is visible, the user is "at the bottom." When it leaves the viewport (user scrolled up), auto-scroll disengages.

**When to use:** Chat interfaces, log viewers, any bottom-anchored scroll.

**Implementation approach:**
```typescript
function useScrollAnchor(scrollContainerRef: RefObject<HTMLElement | null>) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const isStreaming = useStreamStore(state => state.isStreaming);

  // Observer: tracks sentinel visibility
  useEffect(() => {
    const sentinel = sentinelRef.current;
    const container = scrollContainerRef.current;
    if (!sentinel || !container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry) setIsAtBottom(entry.isIntersecting);
      },
      { root: container, threshold: 0 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [scrollContainerRef]);

  // Auto-scroll: keep at bottom during streaming when user hasn't scrolled away
  useEffect(() => {
    if (!isStreaming || !isAtBottom) return;
    let rafId: number;
    const scroll = () => {
      sentinelRef.current?.scrollIntoView({ block: 'end' });
      rafId = requestAnimationFrame(scroll);
    };
    rafId = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(rafId);
  }, [isStreaming, isAtBottom]);

  const scrollToBottom = useCallback(() => {
    sentinelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    setIsAtBottom(true);
  }, []);

  return { sentinelRef, isAtBottom, scrollToBottom, showPill: !isAtBottom && isStreaming };
}
```

**Why IntersectionObserver over scroll events:** The observer fires only on intersection changes (enters/leaves viewport), not on every scroll pixel. This means zero CPU cost during steady-state scrolling. A `scroll` event would need debouncing and threshold calculation, adding complexity and jitter.

### Anti-Patterns to Avoid
- **Never put streaming text in React state.** At 100 tokens/sec, this triggers 100 re-renders per second. The entire point is ref + rAF.
- **Never use `innerHTML` for token painting.** Use `textContent`. Plain text in M1 means no HTML injection risk and `textContent` is faster (no HTML parsing).
- **Never use `element.innerText`.** It triggers layout reflow. `textContent` does not.
- **Never create a new rAF callback per token.** One persistent rAF loop reads the ref. Tokens append to the ref without scheduling their own frames.
- **Never `scrollTo` on every token.** Use the rAF-driven auto-scroll loop which coalesces with the paint loop's frame timing.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Scroll position tracking | Manual scroll event + math | `IntersectionObserver` on sentinel | Observer is passive, zero-cost when not intersecting, handles edge cases |
| Token batching | Custom queue with flush timer | `useRef` string concatenation + rAF read | String concat is O(1) amortized in V8, rAF naturally batches |
| CSS cursor blink | JS setInterval toggle | CSS `@keyframes` animation | GPU-composited, zero main thread cost |
| Background tint | JS opacity animation | CSS `transition: background-color var(--duration-normal)` | GPU-composited opacity transition |
| Smooth scroll | Manual `scrollTop` animation | `scrollIntoView({ behavior: 'smooth' })` | Browser-native smooth scroll, handles edge cases |

**Key insight:** The performance wins here come from NOT building things. Browser-native APIs (rAF, IntersectionObserver, CSS transitions, `scrollIntoView`) handle the hard parts. The code is glue.

## Common Pitfalls

### Pitfall 1: rAF Loop Runs After Unmount
**What goes wrong:** If the rAF loop isn't cancelled on unmount, it writes to a DOM node that no longer exists (or worse, a recycled node).
**Why it happens:** `cancelAnimationFrame` not called in cleanup, or cleanup races with the next frame.
**How to avoid:** Store rAF ID in a ref. Cancel in the `useEffect` cleanup. Guard with `isActiveRef.current` boolean.
**Warning signs:** Console warnings about setting properties on null, or stale text appearing in wrong components.

### Pitfall 2: Backlog Replay Causes Per-Token Paint
**What goes wrong:** When `subscribeContent()` replays the backlog buffer, each replayed token calls the listener synchronously. If the listener schedules a paint per call, you get N paints instead of one.
**Why it happens:** Not understanding that backlog replay is synchronous -- it happens within the `subscribeContent()` call, before the first rAF fires.
**How to avoid:** The listener should only append to the ref. The rAF loop handles painting. Since replay is synchronous and rAF is async, all replayed tokens land in the ref before the first paint.
**Warning signs:** Visible flicker or stutter when joining a stream mid-flight (HMR, tab switch).

### Pitfall 3: isAtBottom State Oscillation
**What goes wrong:** Auto-scroll pushes content down, observer fires "at bottom." New content arrives, element grows, observer fires "not at bottom" briefly before scroll catches up. This oscillation makes the pill flash.
**Why it happens:** There's a frame gap between content growth and scroll adjustment.
**How to avoid:** Only set `isAtBottom = false` when the user **actively scrolls** (not when content grows). Use the observer to detect the user scrolling UP, not to detect content growing down. Alternatively, ignore "not intersecting" transitions that happen during active rAF scroll -- if we're driving the scroll via rAF, the "not intersecting" is transient and should be debounced or filtered.
**Warning signs:** Scroll pill flashes rapidly during streaming.

### Pitfall 4: Finalization Race Condition
**What goes wrong:** `isStreaming` goes false, ActiveMessage flushes to timeline store, timeline store triggers re-render that unmounts ActiveMessage before the CSS fade completes. Text appears to "jump" or disappear abruptly.
**Why it happens:** Parent component re-renders when timeline updates, removes the streaming UI before fade-out completes.
**How to avoid:** Parent must NOT unmount ActiveMessage based on `isStreaming`. Instead, ActiveMessage signals completion via a callback after the 200ms fade. Parent tracks a local `showActiveMessage` state that only goes false on that callback.
**Warning signs:** Text vanishes or jumps position when streaming ends.

### Pitfall 5: textContent Clobbers Cursor Element
**What goes wrong:** If the cursor is a child element (span) inside the text container, setting `textContent` on the container removes all children including the cursor.
**Why it happens:** `textContent` replaces all DOM children.
**How to avoid:** Use a separate DOM node for text content and cursor. Structure: `<div class="active-message"><span ref={textRef}></span><span class="cursor"></span></div>`. The rAF loop writes to `textRef.current.textContent`, which doesn't touch the cursor span.
**Warning signs:** Cursor disappears after first token arrives.

### Pitfall 6: Memory Leak on Disconnected Streams
**What goes wrong:** If the WebSocket disconnects mid-stream but `isStreaming` never goes to `false` (Phase 5 CONTEXT.md decision: don't call `endStream` on disconnect), the rAF loop runs forever painting stale content.
**Why it happens:** The disconnect handler in websocket-init.ts intentionally does NOT call `endStream()` to preserve partial content.
**How to avoid:** The rAF loop should check `wsClient.getState() === 'disconnected'` or `wsClient.getIsStreamActive() === false` and self-terminate. It can still keep the last painted content visible (per the "keep partial text" decision).
**Warning signs:** CPU stays elevated after disconnect, rAF keeps running in DevTools Performance tab.

## Code Examples

### CSS: Streaming Cursor Animation
```css
/* Source: Constitution 10.3 + CONTEXT.md decisions */
/* streaming-cursor.css */

.active-message {
  contain: content;
  border-radius: 8px;
  background-color: color-mix(in oklch, var(--accent-primary) 4%, transparent);
  transition: background-color var(--duration-normal) var(--ease-out);
  position: relative;
}

.active-message[data-phase="finalizing"] {
  background-color: transparent;
}

.streaming-cursor {
  display: inline-block;
  width: 2px;
  height: 1.2em;
  vertical-align: text-bottom;
  background-color: var(--accent-primary);
  animation: cursor-blink 1.06s step-end infinite;
  transition: opacity var(--duration-normal) var(--ease-out);
}

.active-message[data-phase="finalizing"] .streaming-cursor {
  animation: none;
  opacity: 0;
}

@keyframes cursor-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

/* Respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  .streaming-cursor {
    animation: none;
    opacity: 1;
  }
}
```

### TypeScript: useStreamBuffer Hook Signature
```typescript
// Source: STRM-03 requirement + wsClient API from Phase 5

export interface UseStreamBufferOptions {
  /** Ref to the DOM text node that receives token updates */
  textNodeRef: React.RefObject<HTMLElement | null>;
  /** Called when stream completes with accumulated text */
  onFlush: (text: string) => void;
  /** Called if connection drops mid-stream */
  onDisconnect?: () => void;
}

export interface UseStreamBufferReturn {
  /** Current accumulated text (read-only snapshot) */
  getText: () => string;
  /** Whether the buffer is actively receiving tokens */
  isBuffering: boolean;
}
```

### TypeScript: ActiveMessage Props
```typescript
// Source: COMP-02 requirement + Constitution 2.3

export interface ActiveMessageProps {
  /** Session ID for flushing to timeline store */
  sessionId: string;
  /** Called when finalization animation completes -- parent can unmount */
  onFinalizationComplete: () => void;
}
```

### TypeScript: useScrollAnchor Return Type
```typescript
// Source: COMP-03 requirement

export interface UseScrollAnchorReturn {
  /** Ref to attach to the sentinel element at scroll container bottom */
  sentinelRef: React.RefObject<HTMLDivElement | null>;
  /** Whether user is currently at the bottom of scroll */
  isAtBottom: boolean;
  /** Whether to show the scroll-to-bottom pill */
  showPill: boolean;
  /** Click handler for the pill -- smooth scrolls and re-engages */
  scrollToBottom: () => void;
}
```

### CSS: Scroll-to-Bottom Pill
```css
/* Surface: frosted glass effect per glass tokens */
.scroll-pill {
  position: absolute;
  bottom: var(--space-4);
  left: 50%;
  transform: translateX(-50%);
  z-index: var(--z-scroll-pill);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  background-color: color-mix(in oklch, var(--surface-overlay) var(--glass-bg-opacity-pct, 70%), transparent);
  border: 1px solid var(--border-subtle);
  border-radius: var(--space-6);
  padding: var(--space-2) var(--space-4);
  cursor: pointer;
  color: var(--text-primary);
  font-family: var(--font-ui);
  font-size: var(--text-body);
  /* Enter/exit animation */
  transition:
    opacity var(--duration-normal) var(--ease-spring),
    transform var(--duration-normal) var(--ease-spring);
}

.scroll-pill[data-visible="false"] {
  opacity: 0;
  transform: translateX(-50%) translateY(8px);
  pointer-events: none;
}

.scroll-pill[data-visible="true"] {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `setState` per token | `useRef` + rAF DOM mutation | 2023+ (React 18 era) | Eliminates reconciler bottleneck entirely |
| `scroll` event listener | `IntersectionObserver` sentinel | 2020+ (IO widely supported) | Passive, zero-cost when not firing |
| JS `setInterval` cursor blink | CSS `@keyframes step-end` | Always available | GPU-composited, zero main thread cost |
| `innerHTML` for streamed text | `textContent` for plain text | Best practice | No HTML parsing, no XSS risk, faster |
| `element.scrollTop` math | `scrollIntoView({ behavior })` | 2018+ (smooth scroll support) | Native smooth scroll algorithm |

**Deprecated/outdated:**
- **Character-by-character typewriter effect**: Banned per REQUIREMENTS.md Out of Scope. Anti-pattern that fights the natural token delivery rate.
- **`innerText` for text updates**: Triggers layout reflow. Use `textContent` instead.

## Discretion Recommendations

Based on research, here are my recommendations for items left to Claude's discretion:

### Scroll pill surface: Frosted glass
**Recommendation:** Use frosted glass with `backdrop-filter: blur()`. The glass tokens are already defined in `tokens.css` (`--glass-blur: 16px`, `--glass-saturate: 1.4`). Frosted glass looks more polished than a flat overlay and establishes the visual pattern early for future overlays. Performance is fine since the pill is a small element and `backdrop-filter` is GPU-composited.

### Finalized messages: Plain text
**Recommendation:** Keep plain text for M1. The swap is trivially seamless -- identical content, zero layout shift. Pulling markdown forward introduces risk (incomplete fence handling during streaming, layout shift on swap) with no visible benefit until M2.

### Background tint: `color-mix()` inline
**Recommendation:** Use `color-mix(in oklch, var(--accent-primary) 4%, transparent)` inline in the CSS class rather than defining a new token. This is a single-use value specific to the ActiveMessage component. If other components need it later, extract to a token then. Avoids premature abstraction.

### IntersectionObserver threshold: 0 (default)
**Recommendation:** Use `threshold: 0` (default). This fires the callback as soon as any part of the sentinel enters/leaves the viewport. No need for partial visibility tracking. The sentinel is a 1px-height div -- it's either visible or not.

### Finalization mechanism: Callback prop
**Recommendation:** Use a callback prop (`onFinalizationComplete`) rather than a render prop or context. The parent component passes the callback, ActiveMessage calls it after the 200ms fade. This is the simplest, most explicit pattern and matches Constitution 2.3 (`on` prefix for callbacks).

### Zero-rerender test strategy
**Recommendation:** Use Vitest + React Testing Library with a spy on the component's render function. Wrap ActiveMessage in a render counter (increment a ref in the component body before the return statement, expose via test utility). Verify the counter stays at 1 (initial render only) during simulated token streaming. For the rAF/DOM parts, test the hook in isolation with a mock DOM node.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 + React Testing Library 16.3.2 |
| Config file | `src/vite.config.ts` (test section) |
| Quick run command | `cd /home/swd/loom/src && npx vitest run --reporter=verbose` |
| Full suite command | `cd /home/swd/loom/src && npx vitest run --coverage` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| STRM-03 | Token accumulation in ref, rAF paint to DOM, flush on stream end | unit | `cd /home/swd/loom/src && npx vitest run src/hooks/useStreamBuffer.test.ts -x` | Wave 0 |
| STRM-03 | Zero re-renders during streaming | unit | `cd /home/swd/loom/src && npx vitest run src/hooks/useStreamBuffer.test.ts -x` | Wave 0 |
| COMP-02 | ActiveMessage renders streamed text, cursor blinks, finalization lifecycle | unit | `cd /home/swd/loom/src && npx vitest run src/components/chat/view/ActiveMessage.test.tsx -x` | Wave 0 |
| COMP-03 | Scroll auto-engages during streaming, disengages on scroll up, pill appears | unit | `cd /home/swd/loom/src && npx vitest run src/hooks/useScrollAnchor.test.ts -x` | Wave 0 |
| COMP-03 | Pill click scrolls to bottom and re-engages | unit | `cd /home/swd/loom/src && npx vitest run src/hooks/useScrollAnchor.test.ts -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `cd /home/swd/loom/src && npx vitest run --reporter=verbose`
- **Per wave merge:** `cd /home/swd/loom/src && npx vitest run --coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/hooks/useStreamBuffer.test.ts` -- covers STRM-03
- [ ] `src/components/chat/view/ActiveMessage.test.tsx` -- covers COMP-02
- [ ] `src/hooks/useScrollAnchor.test.ts` -- covers COMP-03
- [ ] Mock for `wsClient.subscribeContent()` -- shared test fixture for stream simulation

### Testing Challenges

**rAF in jsdom:** `requestAnimationFrame` is available in jsdom but does not actually synchronize with rendering. Use `vi.useFakeTimers()` and manually advance frames, or mock `requestAnimationFrame` to invoke callbacks synchronously for deterministic tests.

**IntersectionObserver in jsdom:** jsdom does not implement `IntersectionObserver`. Must mock it:
```typescript
const mockObserve = vi.fn();
const mockDisconnect = vi.fn();
const mockIntersectionObserver = vi.fn().mockImplementation((callback) => ({
  observe: mockObserve,
  disconnect: mockDisconnect,
  // Manually trigger: callback([{ isIntersecting: true }])
}));
vi.stubGlobal('IntersectionObserver', mockIntersectionObserver);
```

**Zero-rerender verification:** Add a render counter ref inside the component during tests (via a test-only wrapper or by checking React Testing Library's `render` result). The `@testing-library/react` `render` function doesn't expose render counts directly, so use a wrapper component that increments a counter and passes it via callback.

## Open Questions

1. **Scroll container identity**
   - What we know: ActiveMessage renders inside the AppShell's content grid area (via `<Outlet />`). The scroll container for the chat view hasn't been created yet -- Phase 6 will need to establish it.
   - What's unclear: The chat view component (parent of ActiveMessage) doesn't exist yet. Phase 6 needs to create at minimum a scrollable container.
   - Recommendation: Create a minimal `ChatView` component that provides the scroll container div. Keep it thin -- just a `div` with `overflow-y: auto` and `role="log"`. This becomes the shell that M2 builds the full chat experience into.

2. **Session ID for flush**
   - What we know: `addMessage(sessionId, message)` requires a session ID. During M1, the active session might not exist yet in the timeline store.
   - What's unclear: How the streaming message knows which session it belongs to. The `session-created` event from WebSocket provides this, but it arrives via websocket-init.ts.
   - Recommendation: Read `useTimelineStore.getState().activeSessionId` at flush time. If null, create a stub session first. This aligns with Phase 8 (NAV-01/NAV-02) handling proper session management.

3. **Multiple concurrent streams**
   - What we know: M1 only has one provider (Claude). Only one stream at a time.
   - What's unclear: Whether the hook should guard against receiving tokens from a previous stream that ended late.
   - Recommendation: The `startContentStream()` call in websocket-init.ts clears the backlog buffer. This is sufficient for M1. No multi-stream guard needed.

## Sources

### Primary (HIGH confidence)
- `src/src/lib/websocket-client.ts` -- `subscribeContent()`, `emitContent()`, `startContentStream()`, backlog replay pattern
- `src/src/stores/stream.ts` -- `isStreaming` selector, `startStream()`/`endStream()` lifecycle
- `src/src/stores/timeline.ts` -- `addMessage(sessionId, message)` Immer action
- `src/src/lib/websocket-init.ts` -- Stream lifecycle wiring, `onStreamStart`/`onStreamEnd` callbacks
- `src/src/types/message.ts` -- `Message` interface for flush shape
- `src/src/styles/tokens.css` -- All referenced CSS tokens verified present
- [MDN: IntersectionObserver API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) -- Constructor options, callback entries, root container usage
- [MDN: CSS containment](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Containment/Using) -- `contain: content` = layout + paint + style (not size)
- [MDN: requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame) -- Callback timing, cancellation

### Secondary (MEDIUM confidence)
- [SitePoint: Streaming Backends & React](https://www.sitepoint.com/streaming-backends-react-controlling-re-render-chaos/) -- ref + rAF pattern for high-frequency updates
- [web.dev: content-visibility](https://web.dev/articles/content-visibility) -- Performance characteristics of CSS containment

### Tertiary (LOW confidence)
- None -- all findings verified against primary sources or codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new libraries, all browser-native APIs with universal support
- Architecture: HIGH -- patterns derived directly from existing codebase APIs (wsClient, stores) and verified against MDN
- Pitfalls: HIGH -- all pitfalls identified from analysis of actual code paths in websocket-client.ts and websocket-init.ts

**Research date:** 2026-03-06
**Valid until:** 2026-04-06 (stable browser APIs, no version-sensitive dependencies)
