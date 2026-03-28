# Phase 64: Scroll Performance - Research

**Researched:** 2026-03-28
**Domain:** CSS scroll performance, IntersectionObserver, ResizeObserver, WKWebView compositor, React render avoidance
**Confidence:** HIGH

## Summary

Phase 64 eliminates scroll jank in Loom's chat message list on iPhone 16 Pro Max. The CONTEXT.md and SCROLL-DEEP-DIVE.md research already provide an exceptionally detailed roadmap -- the decisions are locked, the code locations identified, and the fix patterns specified. This research validates those decisions against the actual codebase state, surfaces implementation details the planner needs, and documents the exact API surfaces involved.

The core problem is clear from code inspection: `MessageList.tsx:169-175` calls `setAtBottom()` and `setUnreadCount()` inside a passive scroll handler, triggering React re-renders up to 120 times per second on ProMotion. The dead `useScrollAnchor.ts` hook contains a rAF loop calling `scrollIntoView()` every frame (lines 183-204). The auto-follow `useEffect` (MessageList.tsx:160-166) fires on every `messages.length` change during streaming. ActiveMessage.tsx:184 forces a synchronous reflow via `void container.offsetHeight`. All of these are fixable without new dependencies.

**Primary recommendation:** Create a `useChatScroll.ts` hook that replaces all inline scroll logic in MessageList.tsx. Use IntersectionObserver for atBottom detection (ref-based, not state-based), ResizeObserver for streaming auto-follow, and debounced React state updates only for pill visibility. Delete `useScrollAnchor.ts` after porting its useful patterns.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: Extract scroll logic from MessageList.tsx into a new `useChatScroll.ts` hook
- D-02: useChatScroll replaces inline handleScroll with IntersectionObserver-based atBottom detection. No setAtBottom() or setUnreadCount() in scroll event handlers
- D-03: atBottom tracked as ref (isAtBottomRef). React state only via debounced update (200ms+) for pill visibility
- D-04: Remove ALL DOM measurements (scrollHeight, scrollTop, clientHeight) from scroll event handler. IO sentinel with rootMargin replaces distance-from-bottom
- D-05: Pill show/hide uses hysteresis band: show at 200px, hide at 100px
- D-06: Replace per-messages.length useEffect auto-scroll with ResizeObserver on content wrapper
- D-07: ResizeObserver callback gated by isAutoScrollingRef + rAF throttle guard
- D-08: Auto-scroll uses `container.scrollTop = container.scrollHeight - container.clientHeight` not scrollIntoView()
- D-09: Keep useLayoutEffect in useAutoResize.ts -- acceptable frequency
- D-10: Verify composer textarea resize doesn't cause jank during scroll; rAF wrap if needed
- D-11: Keep FLIP animation pattern in ActiveMessage (forced reflow required for CSS transitions)
- D-12: Defer finalization animation setup by rAF + 50ms setTimeout to avoid collision with scroll frame
- D-13: Delete useScrollAnchor.ts and useScrollAnchor.test.ts AFTER new hook is complete. Port useful patterns first
- D-14: Remove useScrollAnchor import from ProofOfLife.tsx
- D-15: No virtualization library in this phase. Measure after fixes: if >5% frame drops at 50+ messages, investigate further
- D-16: If virtualization IS needed in future, virtua (~3KB) preferred
- D-17: Status bar tap via Capacitor statusTap window event -> scrollTo({ top: 0, behavior: 'smooth' })
- D-18: Audit all scroll containers for overscroll-behavior. Message list and session list MUST have native rubber band bounce
- D-19: End-to-end validation on physical iPhone 16 Pro Max
- D-20: Test with 50+ AND 200+ message conversations
- D-21: Test scroll during streaming + new message arrival + user scroll conflict

### Claude's Discretion
- Exact hook API surface for useChatScroll (return type, parameter shape)
- Whether to add a custom scroll-performance benchmark or rely on Safari Web Inspector
- Whether to test on older devices (iPhone SE) in addition to Pro Max
- Implementation order of SCROLL-01 through 06 (recommended: 06 first, then 01+02, then 03, then 04+05)

### Deferred Ideas (OUT OF SCOPE)
- Virtualization -- deferred per SCROLL-07. Fix JS execution bottleneck first
- Custom scroll-performance benchmark -- nice-to-have, not in scope
- Older device testing -- stretch goal, not requirement
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SCROLL-01 | Remove setState from scroll handler; use ref + IO for atBottom | MessageList.tsx:169-175 confirmed calling setAtBottom/setUnreadCount in handler. IO sentinel pattern verified in useScrollAnchor.ts:82-109 |
| SCROLL-02 | Remove DOM measurements from scroll handler | MessageList.tsx:172 reads scrollHeight, scrollTop, clientHeight. IO rootMargin replaces distance calc |
| SCROLL-03 | Auto-scroll during streaming uses rAF batching, not per-message useEffect | MessageList.tsx:160-166 fires on messages.length. ResizeObserver on content wrapper is the fix |
| SCROLL-04 | Fix layout thrashing in useAutoResize | useAutoResize.ts:30-38 confirmed write-read-write pattern. Decision D-09 keeps it (acceptable frequency) with D-10 monitoring |
| SCROLL-05 | Remove forced reflow in ActiveMessage finalization | ActiveMessage.tsx:184 confirmed `void container.offsetHeight`. D-12 defers via rAF + setTimeout |
| SCROLL-06 | Delete dead useScrollAnchor.ts | File confirmed at src/src/hooks/useScrollAnchor.ts. Only production consumer: ProofOfLife.tsx. Test file at useScrollAnchor.test.ts |
| SCROLL-07 | Evaluate virtualization if needed | No action this phase per D-15. Measure-then-decide gate |
| SCROLL-08 | Status bar tap scrolls to top | `statusTap` is a window event dispatched by @capacitor/status-bar iOS native code. Pattern: `window.addEventListener('statusTap', handler)` |
| SCROLL-09 | Rubber band bounce preserved | base.css:44,53 sets overscroll-behavior:none on html/body (correct). base.css:207 sets overscroll-behavior-y:contain on .native-scroll (PROBLEM -- should be auto/unset for rubber band) |
| SCROLL-10 | 60fps validation on real device | Manual testing requirement, no code changes |
</phase_requirements>

## Standard Stack

### Core (Already Installed -- Zero New Dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React 19 | 19.x | Component framework | Already in use |
| IntersectionObserver | Web API | atBottom detection via sentinel | Zero-cost, no JS in scroll path |
| ResizeObserver | Web API | Auto-scroll trigger on content growth | Fires only on actual size change (1-5x/sec vs 120x/sec rAF) |
| requestAnimationFrame | Web API | Throttle guard for ResizeObserver callback | Standard single-frame debounce |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @capacitor/status-bar | 7.0.6 | statusTap window event for SCROLL-08 | Already installed as devDependency |
| Vitest | 4.0.18 | Unit testing for useChatScroll hook | Already configured, test runner |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| IO sentinel | Manual scrollHeight calc | IO is async off-main-thread; manual calc forces synchronous layout |
| ResizeObserver auto-scroll | rAF loop | ResizeObserver fires only on change; rAF fires 120x/sec on ProMotion |
| Debounced state for pill | Direct useState in handler | Debounced avoids 120 re-renders/sec, costs 200ms visibility lag (acceptable) |

**Installation:** None required. All APIs are browser-native or already installed.

## Architecture Patterns

### Recommended Project Structure

```
src/src/
  hooks/
    useChatScroll.ts          # NEW: extracted scroll logic from MessageList
    useChatScroll.test.ts     # NEW: unit tests (port+extend from useScrollAnchor.test.ts)
    useScrollAnchor.ts        # DELETE after useChatScroll complete
    useScrollAnchor.test.ts   # DELETE with the hook
    useAutoResize.ts          # MODIFY: possible rAF wrap (D-10)
  components/
    chat/view/
      MessageList.tsx         # MODIFY: ~120 lines of scroll logic replaced by useChatScroll hook
      ActiveMessage.tsx       # MODIFY: defer finalization reflow (D-12)
      ScrollToBottomPill.tsx  # NO CHANGE: already clean consumer
    dev/
      ProofOfLife.tsx         # MODIFY: replace useScrollAnchor with useChatScroll or remove scroll
  styles/
    base.css                  # MODIFY: fix overscroll-behavior on .native-scroll (D-18)
  e2e/
    scroll-anchor.spec.ts    # MODIFY: update selectors/behavior after refactor
```

### Pattern 1: Ref-Based Scroll State with Debounced React Updates

**What:** Track high-frequency scroll state in refs, sync to React state via debounced update for UI elements (pill).
**When to use:** Anytime scroll position drives both logic (auto-scroll decisions) and UI (pill visibility).

```typescript
// Hot path: ref (no re-render, runs in every scroll frame)
const isAtBottomRef = useRef(true);

// Cold path: React state (triggers re-render for pill, debounced 200ms)
const [showPill, setShowPill] = useState(false);
const [displayUnreadCount, setDisplayUnreadCount] = useState(0);

// Refs for unread tracking (never trigger re-renders)
const unreadCountRef = useRef(0);

// Debounced pill update -- batched, not per-frame
const debouncedPillUpdate = useRef<ReturnType<typeof setTimeout>>();
function schedulePillUpdate() {
  if (debouncedPillUpdate.current) clearTimeout(debouncedPillUpdate.current);
  debouncedPillUpdate.current = setTimeout(() => {
    setShowPill(!isAtBottomRef.current);
    setDisplayUnreadCount(unreadCountRef.current);
  }, 200);
}
```

### Pattern 2: IntersectionObserver Sentinel with Hysteresis

**What:** Two-threshold IO for bottom detection. Show pill at 200px distance, hide at 100px. Prevents pill flashing during programmatic auto-scroll.
**When to use:** SCROLL-01, SCROLL-02, D-04, D-05.

```typescript
// Bottom sentinel element placed at end of message list
// IO with negative rootMargin = "viewport is considered to end 150px above actual bottom"
const bottomObserver = new IntersectionObserver(
  ([entry]) => {
    if (!entry) return;
    if (entry.isIntersecting) {
      // Sentinel visible = user is at bottom
      isAtBottomRef.current = true;
      unreadCountRef.current = 0;
    } else if (!isAutoScrollingRef.current) {
      // Sentinel hidden AND not auto-scrolling = user scrolled up
      isAtBottomRef.current = false;
    }
    schedulePillUpdate();
  },
  {
    root: scrollContainerRef.current,
    threshold: 0,
    rootMargin: '0px 0px -150px 0px', // sentinel within 150px of bottom = "at bottom"
  },
);
```

**Note on hysteresis:** The CONTEXT.md specifies show at 200px, hide at 100px. With a single IO, use 150px as a compromise (the sentinel-based approach inherently provides hysteresis since entering/exiting the threshold zone has natural distance). For true dual-threshold, use two observers or the scroll handler fallback.

### Pattern 3: ResizeObserver Auto-Follow During Streaming

**What:** Observe content wrapper for size changes; auto-scroll only when content grows and user is at bottom.
**When to use:** SCROLL-03, replaces the rAF scrollIntoView loop AND the per-messages.length useEffect.

```typescript
useEffect(() => {
  const container = scrollContainerRef.current;
  if (!container) return;

  const contentWrapper = container.firstElementChild;
  if (!contentWrapper) return;

  let rafPending = false;

  const observer = new ResizeObserver(() => {
    if (!isAtBottomRef.current) return; // User scrolled up, don't auto-scroll
    if (rafPending) return; // Already have a frame pending

    rafPending = true;
    requestAnimationFrame(() => {
      rafPending = false;
      // Direct scrollTop assignment -- cheaper than scrollIntoView
      container.scrollTop = container.scrollHeight - container.clientHeight;
    });
  });

  observer.observe(contentWrapper);
  return () => observer.disconnect();
}, [/* re-setup on session change */]);
```

### Pattern 4: statusTap Window Event for iOS

**What:** Listen for Capacitor's `statusTap` window event (fired when user taps iOS status bar area).
**When to use:** SCROLL-08.

```typescript
// Inside useChatScroll hook or a useEffect in MessageList
useEffect(() => {
  if (!IS_NATIVE) return;

  const handleStatusTap = () => {
    const el = scrollContainerRef.current;
    if (el) {
      el.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  window.addEventListener('statusTap', handleStatusTap);
  return () => window.removeEventListener('statusTap', handleStatusTap);
}, []);
```

**Verified:** The `statusTap` event is dispatched by `@capacitor/status-bar` iOS native code via `bridge.triggerJSEvent(eventName: "statusTap", target: "window")`. It's a plain DOM event on the `window` object, not a Capacitor plugin listener.

### Anti-Patterns to Avoid

- **setState in scroll handlers:** NEVER call `setAtBottom()`, `setUnreadCount()`, or any React state setter inside a scroll event callback. This is the #1 jank source.
- **scrollIntoView in loops:** `scrollIntoView()` forces synchronous layout recalculation. Use `container.scrollTop = container.scrollHeight - container.clientHeight` instead.
- **rAF auto-scroll loops:** An rAF loop fires at display refresh rate (120fps on ProMotion). Use ResizeObserver (fires on actual content change, 1-5x/sec during streaming).
- **DOM reads in scroll handlers:** Reading `scrollHeight`, `scrollTop`, `clientHeight` forces layout recalculation if the layout is dirty. IO sentinel avoids this entirely.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Bottom detection | Manual scrollHeight - scrollTop - clientHeight < threshold | IntersectionObserver on sentinel | IO runs on compositor thread, no main-thread layout forced |
| Auto-scroll during streaming | rAF loop + scrollIntoView | ResizeObserver on content wrapper | Fires only on actual size change, not every frame |
| Scroll event throttling | Custom rAF throttle wrapper | Passive listener + ref-only updates | No throttling needed if no React state in the handler |
| Scroll position persistence | Custom store | sessionStorage (already exists) | Move save logic into the consolidated hook |

**Key insight:** The entire scroll jank problem stems from doing JavaScript work (React state updates, DOM layout reads) in the scroll hot path. The fix is to move ALL decisions to async observers (IO, ResizeObserver) and keep the scroll handler doing zero React state work.

## Common Pitfalls

### Pitfall 1: IO Observer Not Re-Created on Container Change
**What goes wrong:** IntersectionObserver is created with a `root` element. If the scroll container DOM node changes (e.g., via ref callback or re-mount), the old observer becomes disconnected.
**Why it happens:** React ref callbacks can fire multiple times. Session switches re-mount content.
**How to avoid:** Use `useEffect` with the container ref as a dependency. Disconnect old observer in cleanup. The existing pattern in useScrollAnchor.ts (lines 82-109) handles this correctly.
**Warning signs:** Pill stops appearing after session switch; auto-scroll stops working.

### Pitfall 2: ResizeObserver Loop Limit Exceeded
**What goes wrong:** If the ResizeObserver callback modifies the observed element's size (e.g., by triggering a scroll that changes content-visibility rendering), it can cause an infinite observation loop.
**Why it happens:** `container.scrollTop = ...` assignment can trigger content-visibility to render/hide elements, changing the content wrapper size.
**How to avoid:** The rAF throttle guard (D-07) breaks the synchronous cycle. Only one scroll adjustment per frame.
**Warning signs:** Console warning "ResizeObserver loop completed with undelivered notifications."

### Pitfall 3: Hysteresis Band Causes Pill Flickering During Auto-Scroll
**What goes wrong:** During programmatic auto-scroll (streaming), the sentinel briefly exits then enters the IO threshold, causing rapid show/hide of the pill.
**Why it happens:** `container.scrollTop = scrollHeight - clientHeight` positions exactly at bottom, but content growth can temporarily push sentinel out of view before the next auto-scroll fires.
**How to avoid:** D-05's hysteresis band helps. Additionally, the `isAutoScrollingRef` guard in the IO callback prevents false negatives: when auto-scrolling is active, ignore sentinel exit events.
**Warning signs:** Pill flashes during streaming.

### Pitfall 4: overscroll-behavior-y: contain Prevents Rubber Band Bounce
**What goes wrong:** Setting `overscroll-behavior-y: contain` on scroll containers prevents iOS rubber band bounce, making scrolling feel non-native.
**Why it happens:** `contain` prevents overscroll from propagating to parent AND prevents the native bounce effect. `none` would also prevent it.
**How to avoid:** For SCROLL-09, the `.native-scroll` rule in base.css:207 currently sets `overscroll-behavior-y: contain`. This needs to change. On iOS, the desired behavior is: html/body use `overscroll-behavior: none` (prevents page-level bounce -- already correct in base.css:44,53), while `.native-scroll` containers should NOT have `overscroll-behavior-y: contain` (or should use `auto`).
**Warning signs:** Scroll reaches top/bottom of list and stops hard with no bounce.

**IMPORTANT FINDING:** The CONTEXT.md D-18 says "Only html/body should have overscroll-behavior: none." The current base.css:207 sets `overscroll-behavior-y: contain` on `html[data-native] .native-scroll`. This DOES prevent native rubber band bounce. The fix is to remove this rule or change it to `overscroll-behavior-y: auto`. The `contain` was originally added to prevent scroll chaining (child scroll propagating to parent), but the html/body `overscroll-behavior: none` already handles page-level bounce prevention.

### Pitfall 5: content-visibility Double Application
**What goes wrong:** `.msg-item` in base.css applies `content-visibility: auto; contain-intrinsic-size: auto 120px` while `MessageContainer.tsx` applies inline style `contentVisibility: 'auto'; containIntrinsicHeight: 'auto 200px'` on non-streaming messages. Different contain-intrinsic-size values (120px vs 200px) cause scroll height estimation inconsistency.
**Why it happens:** The CSS rule was added for all msg-items; the inline style was added for MessageContainer specificity. Both were well-intentioned but conflict.
**How to avoid:** Use only the CSS class `.msg-item` with a single `contain-intrinsic-size` value. Remove the inline `contentVisibilityStyle` from MessageContainer.tsx. Choose 150px as a middle ground (average message height estimate).
**Warning signs:** Scroll position jumps when quickly scrolling through messages of varying heights.

### Pitfall 6: Stale isAtBottomRef During Session Switch
**What goes wrong:** Session switch resets messages but `isAtBottomRef.current` may still be `false` from the previous session, preventing auto-scroll to bottom on the new session.
**Why it happens:** Refs persist across renders; session switch changes state but doesn't reset refs.
**How to avoid:** Reset `isAtBottomRef.current = true` on session change (same as the existing `setAtBottom(true)` in MessageList.tsx:96).
**Warning signs:** New session doesn't auto-scroll to bottom; pill incorrectly shows on empty conversation.

## Code Examples

### useChatScroll Hook API Surface (Recommended)

```typescript
// Source: Designed from CONTEXT.md decisions + existing ScrollToBottomPill props
export interface UseChatScrollOptions {
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  sessionId: string;
  isStreaming: boolean;
  messageCount: number; // for unread tracking delta
}

export interface UseChatScrollReturn {
  /** Ref callback for the bottom sentinel div */
  sentinelRef: (node: HTMLDivElement | null) => void;
  /** Whether to show the scroll-to-bottom pill (debounced) */
  showPill: boolean;
  /** Number of unread messages while scrolled up (debounced) */
  unreadCount: number;
  /** Smooth scroll to bottom + reset unread */
  scrollToBottom: () => void;
  /** Ref for the content wrapper (attach to inner div for ResizeObserver) */
  contentWrapperRef: RefObject<HTMLDivElement | null>;
  /** Whether user is at bottom (ref-based, for auto-scroll logic) */
  isAtBottomRef: RefObject<boolean>;
}
```

### MessageList.tsx After Refactor (Simplified)

```typescript
// Source: Derived from CONTEXT.md D-01 through D-08
export function MessageList({ messages, sessionId, scrollContainerRef, ... }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isStreaming = useStreamStore((state) => state.isStreaming);

  const {
    sentinelRef,
    showPill,
    unreadCount,
    scrollToBottom,
    contentWrapperRef,
  } = useChatScroll({
    scrollContainerRef: scrollRef,
    sessionId,
    isStreaming,
    messageCount: messages.length,
  });

  // ... session switch logic stays (state-during-render pattern) ...
  // ... infinite scroll IO stays (separate concern) ...

  return (
    <div ref={mergedRef} className="native-scroll h-full overflow-y-auto" data-testid="message-list-scroll">
      <div ref={contentWrapperRef} className="mx-auto max-w-3xl py-4">
        {/* ... messages ... */}
      </div>
      {/* Bottom sentinel for IO-based atBottom detection */}
      <div ref={sentinelRef} style={{ height: 1 }} aria-hidden="true" />
      <ScrollToBottomPill visible={showPill} onClick={scrollToBottom} unreadCount={unreadCount} />
    </div>
  );
}
```

### ActiveMessage Deferred Finalization (D-12)

```typescript
// Source: CONTEXT.md D-12 -- defer finalization reflow
// In handleFlush callback, replace direct rAF with deferred approach:
requestAnimationFrame(() => {
  // D-12: Additional 50ms delay to avoid collision with active scroll frame
  setTimeout(() => {
    const container = containerRef.current;
    const streaming = streamingRef.current;
    const finalized = finalizedRef.current;
    if (!container || !streaming || !finalized) {
      setPhase('finalized');
      onFinalizationCompleteRef.current();
      return;
    }
    // Measure heights (this forces layout, but we're now outside the scroll frame)
    const streamingHeight = streaming.getBoundingClientRect().height;
    const finalizedHeight = finalized.getBoundingClientRect().height;
    container.style.height = `${streamingHeight}px`;
    void container.offsetHeight; // Still needed for FLIP -- but now deferred
    container.style.height = `${finalizedHeight}px`;
    setPhase('finalizing');
    // ... rest of transition handling ...
  }, 50);
});
```

### overscroll-behavior Fix (D-18)

```css
/* base.css -- BEFORE (line 205-208) */
html[data-native] .native-scroll {
  will-change: scroll-position;
  overscroll-behavior-y: contain; /* PROBLEM: kills rubber band bounce */
}

/* base.css -- AFTER */
html[data-native] .native-scroll {
  will-change: scroll-position;
  /* overscroll-behavior-y intentionally omitted -- let iOS handle rubber band natively.
     html/body already have overscroll-behavior: none to prevent page-level bounce. */
}
```

## Existing Code to Port from useScrollAnchor.ts

Before deleting `useScrollAnchor.ts`, port these patterns to `useChatScroll.ts`:

| Pattern | Location | Port Notes |
|---------|----------|------------|
| IO sentinel with rootMargin | lines 87-109 | Use as base for atBottom detection. Change rootMargin for hysteresis |
| Anti-oscillation guard (isAutoScrollingRef) | lines 93-97 | Critical: prevents pill flash during programmatic scroll |
| User gesture detection (wheel/touchmove) | lines 116-152 | Port for auto-scroll disengage on user input |
| ResizeObserver on content wrapper | lines 156-181 | Port rAF throttle pattern. CHANGE: use scrollTop assignment not scrollIntoView |
| Stream start re-engagement | lines 72-80 | Reset isAtBottomRef to true when streaming starts |
| Scroll position save/restore | lines 224-240 | Already in MessageList.tsx via sessionStorage. Consolidate into hook |

**Do NOT port:**
- rAF auto-scroll loop (lines 183-204) -- this is the jank source. Replace with ResizeObserver-only approach
- `scrollIntoView()` calls (lines 169, 194, 208) -- replace with `scrollTop` assignment

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| rAF loop + scrollIntoView | ResizeObserver + scrollTop assignment | Telegram/Slack pattern, always been better | 120x fewer layout recalcs per second |
| setState in scroll handler | Ref + debounced state | React best practice since Concurrent Mode (React 18+) | Eliminates React re-renders in scroll path |
| Manual scrollHeight checks | IntersectionObserver | IO API since 2019 | Async, off-main-thread threshold detection |
| content-visibility: auto | Same, but single source (CSS only, not inline + CSS) | Fix for this phase | Consistent contain-intrinsic-size estimates |

**Deprecated/outdated:**
- `-webkit-overflow-scrolling: touch` -- default in modern WKWebView, no longer needed
- `scrollIntoView()` in hot loops -- forces synchronous layout, use `scrollTop` assignment

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 |
| Config file | src/vite.config.ts (vitest config embedded) |
| Quick run command | `cd src && npx vitest run --reporter=verbose src/src/hooks/useChatScroll.test.ts` |
| Full suite command | `cd src && npx vitest run` |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SCROLL-01 | No setState in scroll handler | unit | `cd src && npx vitest run src/src/hooks/useChatScroll.test.ts -x` | Wave 0 |
| SCROLL-02 | No DOM reads in scroll handler | unit | Same as above | Wave 0 |
| SCROLL-03 | ResizeObserver auto-scroll | unit | Same as above | Wave 0 |
| SCROLL-04 | useAutoResize no layout thrash | unit | `cd src && npx vitest run src/src/components/chat/composer/useAutoResize.test.ts -x` | Existing (check) |
| SCROLL-05 | Deferred finalization reflow | unit | `cd src && npx vitest run src/src/components/chat/view/ActiveMessage.test.ts -x` | Existing (check) |
| SCROLL-06 | useScrollAnchor deleted | unit | Verify import errors if file referenced | N/A (deletion) |
| SCROLL-07 | Virtualization gate | manual-only | Safari Web Inspector profiling | N/A |
| SCROLL-08 | statusTap scrolls to top | unit | Part of useChatScroll.test.ts | Wave 0 |
| SCROLL-09 | Rubber band bounce | manual-only | Physical device test | N/A |
| SCROLL-10 | 60fps validation | manual-only | Safari Web Inspector performance monitor | N/A |

### Sampling Rate
- **Per task commit:** `cd src && npx vitest run src/src/hooks/useChatScroll.test.ts -x`
- **Per wave merge:** `cd src && npx vitest run`
- **Phase gate:** Full suite green before /gsd:verify-work

### Wave 0 Gaps
- [ ] `src/src/hooks/useChatScroll.test.ts` -- covers SCROLL-01, SCROLL-02, SCROLL-03, SCROLL-08
- [ ] Verify `src/e2e/scroll-anchor.spec.ts` still works after refactor (update selectors if needed)
- [ ] Check if `useAutoResize.test.ts` exists; create if not (for SCROLL-04)

## Open Questions

1. **Hysteresis implementation with single IO**
   - What we know: D-05 specifies show pill at 200px, hide at 100px. A single IO has one rootMargin threshold.
   - What's unclear: Whether to use two IOs (one at -200px for show, one at -100px for hide) or a single IO at -150px (simpler, still effective).
   - Recommendation: Start with single IO at -150px. The isAutoScrollingRef guard handles the main flicker case. Add dual IO only if pill still flashes. Planner should include this as a discretionary detail.

2. **content-visibility reconciliation**
   - What we know: Double application (CSS .msg-item + inline on MessageContainer). Different intrinsic sizes (120px vs 200px).
   - What's unclear: Whether removing inline style from MessageContainer causes any regression in the streaming-to-finalized handoff.
   - Recommendation: Remove inline style from MessageContainer.tsx. The `.msg-item` CSS class already applies content-visibility. The `isStreaming` guard in MessageContainer prevents content-visibility on the ActiveMessage (which is correct -- streaming content should not be hidden). Update `.msg-item` contain-intrinsic-size to `auto 150px` as a compromise.

3. **ProofOfLife.tsx scroll replacement**
   - What we know: ProofOfLife is the only consumer of useScrollAnchor. It's a dev page.
   - What's unclear: Whether to give ProofOfLife the full useChatScroll treatment or simplify it.
   - Recommendation: Replace useScrollAnchor with useChatScroll in ProofOfLife. It's a dev page but it's also used for testing -- giving it the same scroll infrastructure as the real chat validates the hook in two contexts.

## Sources

### Primary (HIGH confidence)
- Source code inspection: MessageList.tsx, useScrollAnchor.ts, ActiveMessage.tsx, useAutoResize.ts, MessageContainer.tsx, base.css, native-plugins.ts, platform.ts, ScrollToBottomPill.tsx, ProofOfLife.tsx
- `.planning/research/SCROLL-DEEP-DIVE.md` -- Production app analysis (Telegram, Discord, Slack, ChatGPT), virtualization comparison, 8 fix recommendations
- `@capacitor/status-bar` v7.0.6 source: iOS native code confirms `statusTap` window event (`bridge.triggerJSEvent(eventName: "statusTap", target: "window")`)
- [Capacitor Status Bar Plugin API](https://capacitorjs.com/docs/apis/status-bar)

### Secondary (MEDIUM confidence)
- [MDN IntersectionObserver API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) -- rootMargin, threshold behavior
- [MDN ResizeObserver API](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver) -- loop limit, observation patterns
- [Nolan Lawson content-visibility benchmarks](https://nolanlawson.com/2024/09/18/improving-rendering-performance-with-css-content-visibility/) -- 45% improvement on 20K elements

### Tertiary (LOW confidence)
- statusTap reliability on iOS 17+ -- some GitHub issues report inconsistency (ionic-team/capacitor#2109, ionic-team/ionic-framework#29376). May need testing on real device. If unreliable, no fallback needed (nice-to-have feature).

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- zero new deps, all browser-native APIs verified
- Architecture: HIGH -- CONTEXT.md decisions are extremely detailed, code locations verified
- Pitfalls: HIGH -- identified from actual codebase inspection (content-visibility double-apply, overscroll-behavior bug, stale ref on session switch)
- statusTap reliability: MEDIUM -- verified in Capacitor source but community reports intermittent issues on newer iOS

**Research date:** 2026-03-28
**Valid until:** 2026-04-28 (stable APIs, no fast-moving dependencies)
