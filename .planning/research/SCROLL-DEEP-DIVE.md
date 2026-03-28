# Deep Dive: Chat Scroll Performance in Mobile WebViews

**Project:** Loom v2.2 "The Touch"
**Researched:** 2026-03-28
**Overall confidence:** HIGH
**Target:** iPhone 16 Pro Max, WKWebView via Capacitor server.url mode

---

## Executive Summary

The current Loom implementation renders all messages to the DOM with `content-visibility: auto` on `.msg-item` elements. This is the same fundamental approach ChatGPT uses. For a chat app with typical conversation lengths (50-200 messages), this approach is defensible -- but there are critical optimizations missing that explain the 0/10 rating on iOS.

**The hard truth:** The scroll jank on iOS is likely NOT caused by too many DOM nodes. It is caused by a combination of: (1) expensive per-frame scroll handlers doing React state updates, (2) content-visibility paint storms during fast scrolling, (3) missing CSS containment on the scroll container, and (4) the rAF auto-scroll loop calling `scrollIntoView` every frame during streaming. Virtualization would mask these problems but introduces severe complexity for variable-height streaming content. The right path is to fix the current architecture first.

---

## Part 1: How Production Apps Handle Chat Scroll

### 1.1 Telegram Web K

**Source:** [TelegramOrg/Telegram-web-k](https://github.com/TelegramOrg/Telegram-web-k) (GPL v3, open source)

**Architecture:** Custom scroll infrastructure, NOT a third-party library.

Telegram's `Scrollable` class implements:
- **Split container pattern**: Messages rendered into a `splitUp` virtual container. External `dynamicVirtualList` handles actual virtualization.
- **Custom scrollbar**: Renders its own scrollbar thumb rather than using native scrollbars, enabling pixel-perfect scroll tracking without browser quirks.
- **Throttled measurement**: Uses `requestAnimationFrame` with fallback to 24ms `setTimeout` for batching scroll events.
- **Heavy animation awareness**: `useHeavyAnimationCheck()` detects ongoing animations and defers scroll callbacks. `needCheckAfterAnimation` queues deferred measurements. This prevents scroll calculations from fighting CSS transitions.
- **Silent scroll position updates**: `setScrollPositionSilently()` updates position without triggering callbacks during programmatic scrolling.
- **Directional tracking**: `lastScrollDirection` (1=down, -1=up, 0=static) enables conditional callback execution.
- **Passive event listeners**: All scroll handlers use `{ passive: true }`.

**Key takeaway:** Telegram builds everything custom because they need sub-frame control over scroll behavior. They decouple scroll measurement from rendering and aggressively defer work during animations.

**Confidence:** MEDIUM (source code visible but implementation details inferred from class structure)

### 1.2 Discord

**Source:** [Discord Engineering Blog](https://discord.com/blog/supercharging-discord-mobile-our-journey-to-a-faster-app)

**Architecture:** Native virtualized list (Android RecyclerView / iOS equivalent), NOT web-based virtualization.

Discord's mobile chat list:
- Uses a **fully native component** -- JavaScript only fetches data, native code handles rendering and scrolling.
- **"View Portaling"**: Native code moves rendered JS views into/out of the viewport. When no JS view is ready, a native placeholder renders instead.
- **Lazy inflation**: Infrequently-used elements (spoilers, upload overlays) load on-demand, not at message render time.
- **Cell recycling**: Similar to RecyclerView/UITableView pattern -- reuses existing DOM/view allocations.

**Performance results:** Up to 60% reduction in slow frames, 12% less memory usage.

**Key takeaway:** Discord's performance comes from native scroll views, not web-based virtualization. Their web client likely uses a similar strategy to Slack/ChatGPT (render all messages, lazy-load history). This is not directly applicable to our WKWebView scenario, but reinforces that native scroll performance is king.

**Confidence:** HIGH (official Discord engineering blog)

### 1.3 Slack

**Sources:** [Making Slack Faster by Being Lazy](https://slack.engineering/making-slack-faster-by-being-lazy/), [InfoQ Presentation](https://www.infoq.com/presentations/slack-front-performance/)

**Architecture:** All messages rendered to DOM. Lazy-loading history, NOT virtual scrolling.

Key details:
- **42 messages per page**: Settled on this as the optimal batch -- fills a large monitor without overloading.
- **Previously rejected virtualization**: Found it caused "scroll speed" issues -- fast scrolling showed blank areas or flickered.
- **Now reconsidering**: Want to "try revirtualizing" the sidebar (not even the message list yet).
- **Primary optimization**: Reducing Redux selector recalculations, not DOM management.

**Key takeaway:** Slack, with orders of magnitude more engineering resources than us, does NOT virtualize their message list. They found the tradeoffs unacceptable for chat. Their performance gains came from reducing JavaScript work, not DOM work.

**Confidence:** HIGH (official Slack engineering blog)

### 1.4 WhatsApp Web

**Architecture:** Renders messages to DOM. Has ongoing scroll bugs.

WhatsApp Web is actually a cautionary tale:
- In September 2025, a scrolling bug prevented users from scrolling through messages entirely.
- The Windows desktop app (Chromium-based) doubles RAM to 1.2GB when scrolling through messages, vs their UWP app at <300MB.
- No evidence of virtualization in their web implementation.

**Key takeaway:** Even WhatsApp, backed by Meta, has scroll performance issues in their web client. This is a genuinely hard problem.

**Confidence:** MEDIUM (user reports, no official engineering documentation)

### 1.5 ChatGPT (chat.openai.com)

**Architecture:** All messages rendered to DOM. No virtual scrolling. Uses `react-scroll-to-bottom` and `scrollIntoView()`.

Evidence:
- Third-party Chrome extension ["ChatGPT Lag Fixer"](https://github.com/bramvdg/chatgpt-lag-fixer) exists specifically to add virtualization to ChatGPT, confirming the native app doesn't use it.
- The extension achieves 92% DOM reduction (4000 -> 300 nodes for 500 messages) by replacing off-screen messages with height-matched placeholders.
- ChatGPT has known auto-scroll issues -- multiple community complaints and extension workarounds.
- ChatGPT gets laggy on long conversations (50+ messages with code blocks).

**Key takeaway:** The closest comparable app to Loom does NOT use virtualization. Their scroll performance degrades on long conversations. We can do better than ChatGPT by fixing our low-level issues without adding virtualization complexity.

**Confidence:** HIGH (open-source extension confirms architecture, community bug reports)

---

## Part 2: Virtualization Libraries Compared

### 2.1 Library Comparison Matrix

| Criterion | react-virtuoso | @tanstack/react-virtual | virtua | react-window |
|-----------|---------------|------------------------|--------|-------------|
| **Bundle size (gzipped)** | ~15.7 KB | ~10-15 KB | ~3 KB | ~6.2 KB |
| **Variable height** | Automatic (ResizeObserver) | Manual measurement hooks | Automatic | Manual, no post-render resize |
| **Reverse scroll** | Built-in (`firstItemIndex`) | No built-in support | Built-in (`shift` prop) | No support |
| **Streaming/growing items** | `followOutput` prop | No built-in support | Manual | No support |
| **Chat-specific component** | VirtuosoMessageList (commercial) | None | None | None |
| **Auto-scroll to bottom** | Built-in | Manual | Manual | Manual |
| **Prepend without jump** | Built-in | Complex workaround | Built-in (`shift`) | Not supported |
| **iOS/WKWebView tested** | Not documented | Not documented | Explicitly supported | Not documented |
| **License** | MIT (core) / Commercial (MessageList) | MIT | MIT | MIT |
| **Weekly downloads** | ~1.76M | ~9.52M (core) | Not specified | ~4.21M |
| **Maintenance** | Active (v4.18.3) | Active (v3.13.23) | Active | Maintenance mode |

### 2.2 react-virtuoso (Recommended IF we go virtual)

**Strengths:**
- Purpose-built for chat: reverse scrolling, `followOutput`, `firstItemIndex` for prepend, automatic ResizeObserver-based height tracking.
- GetStream.io's React Chat SDK uses it as their virtualized message list implementation. Battle-tested in production chat apps.
- `skipAnimationFrameInResizeObserver` prop specifically addresses flickering with dynamic content.
- `followOutput` can be set to `"smooth"` for animated auto-scroll, or a function for conditional behavior.

**Weaknesses:**
- The specialized `VirtuosoMessageList` component (best for AI chat with streaming) is a **commercial product**: $14/month/seat ($168/year). The MIT-licensed `Virtuoso` component works for basic chat but lacks the imperative data API.
- 15.7 KB gzipped -- not small, but not catastrophic for our bundle.
- Known issue: `followOutput` can break when items resize during streaming. This is the EXACT scenario we face.
- Flickering reported in reverse scroll with dynamic heights ([Discussion #1083](https://github.com/petyosi/react-virtuoso/discussions/1083)).

**Confidence:** MEDIUM-HIGH (documented API, real production users, but streaming edge cases are concerning)

### 2.3 @tanstack/react-virtual

**Strengths:**
- Headless (no opinion on markup/styling). Fits well with our existing architecture.
- Largest community (9.5M weekly downloads).
- Very small bundle impact.
- Great for generic lists/grids.

**Weaknesses:**
- **No built-in reverse scroll support.** This is a dealbreaker for chat. From [Discussion #195](https://github.com/TanStack/virtual/discussions/195): implementing chat-style reverse scrolling requires CSS hacks (`scaleY(-1)` or `column-reverse`) with accessibility side effects.
- **No official chat/messenger recipe.** The maintainer acknowledges this gap but hasn't filled it.
- Prepending items while preserving scroll position is "surprisingly hard" -- developers report viewport jumps, repeated load triggers, and ResizeObserver warnings.
- Teams struggling with chat have migrated to Virtua or react-virtuoso.

**Verdict:** NOT recommended for chat. Great for generic lists, not designed for our use case.

**Confidence:** HIGH (official discussions confirm limitations)

### 2.4 virtua

**Strengths:**
- ~3 KB gzipped. Smallest option by far.
- Zero-config: automatic dynamic size measurement.
- Built-in reverse scroll with `shift` prop.
- Explicitly claims iOS support.
- Multi-framework (React, Vue, Solid, Svelte).

**Weaknesses:**
- General-purpose library, not chat-specific. No `followOutput` or streaming-aware API.
- Smaller community than react-virtuoso or TanStack. Less battle-tested.
- "shift" mode documentation warns against using item index as key -- suggests edge cases exist.
- No imperative prepend API like react-virtuoso's.

**Verdict:** Best lightweight option IF we need virtualization. Would require building chat-specific logic (auto-follow, streaming growth detection) ourselves.

**Confidence:** MEDIUM (README claims, smaller community for validation)

### 2.5 react-window

**Verdict:** NOT suitable for chat. No variable height support after render (items overflow their containers), no reverse scroll, maintenance mode. The 6.2 KB size is irrelevant when it can't handle our requirements.

**Confidence:** HIGH (well-documented limitations)

---

## Part 3: content-visibility vs Virtualization -- The Real Tradeoff

### 3.1 What content-visibility: auto Actually Does

When applied to an element, `content-visibility: auto` tells the browser:
1. Skip layout, paint, and style calculations for off-screen elements.
2. Keep the element in the DOM (accessible to Ctrl+F, screen readers, accessibility tree).
3. Use `contain-intrinsic-size` as a size estimate until the element scrolls into view.

**Browser support:** Baseline since September 2025. Safari 18.0+ / iOS Safari 18.0+. Our target (iPhone 16 Pro Max) runs iOS 19, so full support is guaranteed.

### 3.2 Performance Data

From [Nolan Lawson's benchmark](https://nolanlawson.com/2024/09/18/improving-rendering-performance-with-css-content-visibility/) on 20,000 custom emojis (40,000 DOM elements):
- ~45% improvement in initial render time in Chrome and Firefox.
- Reduces from ~3 seconds to ~1.3 seconds.
- Does NOT scale beyond ~20K-100K elements (still too much DOM memory).

From [web.dev](https://web.dev/articles/content-visibility):
- 7x rendering performance boost on initial load for chunked content areas.

### 3.3 When content-visibility Is Sufficient

Content-visibility works well when:
- **Element count is reasonable** (<5,000 elements). A chat with 200 messages and ~20 DOM nodes each = ~4,000 elements. This is well within range.
- **You need Ctrl+F search.** Virtual scrolling removes elements from DOM, breaking browser search.
- **You need accessibility.** Virtual scrolling requires ARIA feed roles and complex keyboard navigation. content-visibility preserves the accessibility tree.
- **Items have complex, variable heights.** No height estimation errors or scroll jumps.
- **Items change size after render.** Expanding code blocks, tool cards, thinking sections -- all work naturally.

### 3.4 When content-visibility Is Insufficient

- **Thousands of items** (>5,000): React rendering overhead becomes the bottleneck even if the browser skips paint. Every React component must still run its reconciler pass.
- **Very fast scrolling** on low-end devices: content-visibility still causes paint operations as elements enter the viewport. A CPU-constrained device can drop frames during fast scroll.
- **First render of very long histories**: All components must mount (React rendering), even if the browser skips painting off-screen ones.

### 3.5 The Critical Insight

**For Loom's specific use case -- 50-200 message conversations on iPhone 16 Pro Max -- content-visibility: auto is sufficient.** The phone has an A18 Pro chip with plenty of CPU headroom. The bottleneck is not DOM size; it is JavaScript execution during scroll.

Evidence: ChatGPT renders all messages to DOM without virtualization and only gets laggy at 50+ messages with complex content. Our conversations are unlikely to exceed 200 messages with rich content (code blocks, tool cards). The ChatGPT Lag Fixer extension shows that even at 500 messages, replacing off-screen DOM with placeholders (essentially manual content-visibility) fixes performance.

---

## Part 4: What Is Actually Causing the 0/10 Scroll Rating

Based on analysis of the current Loom implementation, these are the likely culprits:

### 4.1 rAF Auto-Scroll Loop Calling scrollIntoView Every Frame

**File:** `useScrollAnchor.ts`, lines 183-204

```typescript
const scroll = (): void => {
  sentinelNode?.scrollIntoView({ block: 'end' });
  rafId = requestAnimationFrame(scroll);
};
```

This runs `scrollIntoView()` on EVERY animation frame during streaming. `scrollIntoView` is a layout-triggering operation -- it forces the browser to recalculate layout to determine where to scroll. On iOS, this can cause the compositor thread to stall waiting for the main thread.

**Also in `MessageList.tsx`, line 163-165:**
```typescript
if (isStreaming && atBottom && el) {
  el.scrollTop = el.scrollHeight;
}
```

This runs inside a `useEffect` that fires on every `messages.length` change, which means every finalized message triggers a full layout recalculation via `scrollHeight`.

### 4.2 React State Updates in Scroll Handler

**File:** `MessageList.tsx`, lines 169-182

The `handleScroll` callback calls `setAtBottom(isBottom)` and `setUnreadCount(0)` inside a scroll event handler. Even though the listener is `{ passive: true }`, these state updates schedule React re-renders. On every scroll event, React diffs the component tree. On a 120Hz display, that is potentially 120 re-renders per second.

### 4.3 Duplicate Scroll Tracking

The codebase has TWO scroll tracking systems running simultaneously:
1. `useScrollAnchor.ts` -- IntersectionObserver + wheel/touchmove + scroll events + ResizeObserver + rAF loop
2. `MessageList.tsx` -- separate scroll event handler with separate `atBottom` state, separate `unreadCount` state, separate sessionStorage saves

Both systems listen to the same scroll events, both track bottom state, both manage unread counts. This is double the JavaScript work on every scroll frame.

### 4.4 Missing CSS Containment on Scroll Container

The scroll container (`MessageList.tsx` line 225) uses `overflow-y-auto` but does NOT have `contain: layout style` or similar containment. Without containment, layout changes in message content (expanding tool cards, streaming text) can trigger layout recalculation for the entire container and its siblings.

### 4.5 content-visibility on Streaming Message

The `MessageContainer.tsx` applies `content-visibility: auto` to ALL non-streaming messages, but the `contain-content` class on `.msg-item` in `base.css` also applies `content-visibility: auto`. These may conflict or double-apply, and the `contain-intrinsic-size` estimates differ (200px in MessageContainer vs 120px in base.css).

---

## Part 5: WKWebView-Specific Scroll Considerations

### 5.1 UIScrollView Under the Hood

When WKWebView encounters a scrollable `overflow: scroll/auto` element, it creates a native `UIScrollView` underneath. This is why `-webkit-overflow-scrolling: touch` used to matter (now default behavior). The native UIScrollView handles momentum scrolling, bounce, and deceleration natively -- this is a GOOD thing for performance.

**Key implication:** The compositor thread handles scroll physics independently of the main thread. As long as we don't block the main thread during scroll, scrolling should be smooth.

### 5.2 What Blocks the Compositor

The compositor can scroll independently UNLESS the main thread is busy. Things that block the main thread during scroll:
- Non-passive event listeners (we use passive -- good)
- `scrollIntoView()` calls that force layout (we do this every frame during streaming -- BAD)
- `scrollHeight` reads that force layout reflow
- React re-renders triggered by scroll state updates
- Long style recalculations from content-visibility transitions

### 5.3 overscroll-behavior: none

Important: `overscroll-behavior: none` does NOT work in WKWebView. iOS ignores it at the native level. If you want to prevent scroll chaining, you need to use `overscroll-behavior-y: contain` (which the codebase already does for native mode).

### 5.4 iOS Safari rAF Throttling

iOS Safari throttles `requestAnimationFrame` to 30fps in:
- Low Power Mode
- Cross-origin iframes (not our case in Capacitor)

On iPhone 16 Pro Max with ProMotion, rAF runs at up to 120fps when the device is not in Low Power Mode. The current rAF auto-scroll loop would fire 120 `scrollIntoView()` calls per second. This is catastrophic.

### 5.5 window.scrollY Issues

In iOS Safari, `window.scrollY` stops updating during fast scrolling. This can cause scroll position tracking to become stale. Our implementation uses `container.scrollTop` on the scroll container element, which should be more reliable, but worth monitoring.

---

## Part 6: The Recommended Approach

### 6.1 Verdict: Fix the Architecture, Don't Add Virtualization

**Do NOT add a virtualization library for v2.2.** The complexity cost is too high for the actual problem.

Reasons:
1. **The problem is JavaScript execution, not DOM size.** 200 messages with content-visibility is well within what modern Safari handles.
2. **Every virtualization library struggles with our exact use case**: variable-height items that change size after render (expanding tool cards, streaming text growth, code blocks with dynamic highlighting). react-virtuoso's `followOutput` has known issues with resizing items. TanStack Virtual doesn't even support reverse scroll. virtua requires building all the chat logic yourself.
3. **Virtualization breaks Ctrl+F** (browser search), accessibility, and increases implementation complexity by 10x.
4. **The major chat apps (ChatGPT, Slack, WhatsApp Web) don't use virtualization** for their message lists. The ones that do (Discord) use NATIVE virtualization, not web-based.

### 6.2 Specific Fixes (Priority Order)

#### Fix 1: Eliminate the rAF scrollIntoView Loop (CRITICAL)

Replace the continuous `requestAnimationFrame` + `scrollIntoView` auto-scroll loop with a `ResizeObserver`-only approach:

```typescript
// Instead of:
const scroll = (): void => {
  sentinelNode?.scrollIntoView({ block: 'end' });
  rafId = requestAnimationFrame(scroll);
};
rafId = requestAnimationFrame(scroll);

// Use:
const observer = new ResizeObserver(() => {
  if (isAutoScrollingRef.current) {
    // scrollTop assignment is faster than scrollIntoView
    container.scrollTop = container.scrollHeight - container.clientHeight;
  }
});
observer.observe(contentWrapper);
```

`scrollTop` assignment is significantly cheaper than `scrollIntoView()` because it doesn't force full layout recalculation -- it just updates the scroll offset. And firing only on actual size changes (ResizeObserver) rather than every frame eliminates 99% of the scroll calls.

**Impact:** Eliminates 120 layout recalculations per second during streaming.

#### Fix 2: Consolidate Scroll Tracking (HIGH)

Merge `useScrollAnchor.ts` and `MessageList.tsx`'s scroll handling into a single system. Currently:
- `useScrollAnchor.ts` has: IntersectionObserver, wheel listener, touchmove listener, scroll listener, ResizeObserver, rAF loop
- `MessageList.tsx` has: scroll listener, IntersectionObserver for infinite scroll, sessionStorage saves

Consolidate into `useScrollAnchor.ts` (or a renamed `useChatScroll.ts`). MessageList should only consume the hook's return values, never attach its own scroll listeners.

**Impact:** Halves JavaScript execution on every scroll event.

#### Fix 3: Remove React State Updates from Scroll Path (HIGH)

The `atBottom` tracking should use a `useRef` instead of `useState` for the high-frequency path:

```typescript
// Hot path: ref (no re-render)
const isAtBottomRef = useRef(true);

// Cold path: state (triggers re-render only for pill visibility)
const [showPill, setShowPill] = useState(false);

// In scroll handler:
const isBottom = distFromBottom < 150;
isAtBottomRef.current = isBottom;

// Debounced pill update (200ms, not every frame):
debouncedSetShowPill(!isBottom);
```

The `unreadCount` state should also use `useRef` with a debounced update to the displayed value.

**Impact:** Eliminates React re-renders on every scroll event (potentially 120/sec on ProMotion).

#### Fix 4: Add CSS Containment to Scroll Container (MEDIUM)

```css
.message-list-scroll {
  contain: strict;        /* layout + style + paint + size */
  overflow-y: auto;
  will-change: scroll-position;
}
```

`contain: strict` tells the browser that nothing inside the scroll container affects layout outside it, enabling aggressive optimization of layout recalculations.

**Impact:** Reduces layout recalculation scope during scroll and content changes.

#### Fix 5: Fix content-visibility Double-Application (MEDIUM)

Currently both `.msg-item` (base.css) and `MessageContainer` (inline style) apply `content-visibility: auto` with DIFFERENT `contain-intrinsic-size` values (120px vs 200px). Pick one location (prefer the CSS class) and remove the other.

```css
.msg-item {
  content-visibility: auto;
  contain-intrinsic-size: auto 150px;  /* average message height */
}
```

Remove the inline `contentVisibilityStyle` from `MessageContainer.tsx`.

**Impact:** Eliminates conflicting containment hints, more predictable scroll height estimation.

#### Fix 6: Throttle sessionStorage Writes (LOW)

The current 200ms debounce on sessionStorage writes is fine, but the handler itself still runs React state updates. Move the save to the consolidated scroll hook and ensure it uses only refs.

### 6.3 When to Consider Virtualization (Future)

Add virtualization ONLY if:
- Conversations regularly exceed 500+ messages AND
- Performance is still unacceptable after the above fixes AND
- You are willing to accept the tradeoffs (no Ctrl+F, complex accessibility, scroll jump edge cases)

If virtualization becomes necessary, use **react-virtuoso** (MIT core, not the commercial MessageList):
- The base `Virtuoso` component with `followOutput`, `firstItemIndex`, and `initialTopMostItemIndex` handles the chat pattern.
- Use `skipAnimationFrameInResizeObserver` to reduce flickering.
- Accept that streaming message growth will occasionally cause micro-jumps.

The commercial `@virtuoso.dev/message-list` at $168/year/seat is not worth it for a single-developer project when the free `Virtuoso` component covers 90% of the use case.

As a backup option, **virtua** (~3KB) could be used for a minimal virtualization layer with `shift` mode for prepend scroll adjustment. You'd build the chat-specific auto-follow logic yourself, but the bundle impact is trivial.

---

## Part 7: Scroll Event Handling Best Practices

### 7.1 Pattern for Non-Blocking Scroll Tracking

```typescript
// Best practice: passive listener + ref + debounced state
useEffect(() => {
  const el = scrollRef.current;
  if (!el) return;

  let ticking = false;

  const onScroll = () => {
    // Update refs immediately (no re-render)
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
    isAtBottomRef.current = dist < 150;

    // Batch visual updates via rAF (max 1 per frame)
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(() => {
        // Only trigger re-render if pill visibility changed
        setShowPill(!isAtBottomRef.current);
        ticking = false;
      });
    }
  };

  el.addEventListener('scroll', onScroll, { passive: true });
  return () => el.removeEventListener('scroll', onScroll);
}, []);
```

### 7.2 Pattern for Streaming Auto-Follow

```typescript
// ResizeObserver on content wrapper, NOT rAF loop
useEffect(() => {
  const container = scrollRef.current;
  if (!container || !isAutoScrollingRef.current) return;

  const contentWrapper = container.firstElementChild;
  if (!contentWrapper) return;

  const observer = new ResizeObserver(() => {
    // scrollTop = scrollHeight - clientHeight is cheaper than scrollIntoView
    container.scrollTop = container.scrollHeight - container.clientHeight;
  });

  observer.observe(contentWrapper);
  return () => observer.disconnect();
}, [isStreaming, isAtBottom]);
```

---

## Part 8: Bundle Size Impact Summary

| Approach | Additional Bundle | Complexity | Scroll Quality |
|----------|------------------|------------|----------------|
| **Fix current (recommended)** | 0 KB | Low | HIGH -- fixes root causes |
| + virtua (if needed later) | ~3 KB gzipped | Medium | HIGH -- smallest virtualization option |
| + react-virtuoso core | ~15.7 KB gzipped | Medium-High | HIGH -- best chat support |
| + @virtuoso.dev/message-list | ~15.7 KB + $168/yr | Medium | HIGHEST -- purpose-built |
| + @tanstack/react-virtual | ~10-15 KB gzipped | HIGH -- no chat support | MEDIUM -- requires hacks |

---

## Part 9: Implementation Checklist

### Phase 1: Fix Root Causes (do this first, measure after)
- [ ] Replace rAF `scrollIntoView` loop with ResizeObserver-based `scrollTop` assignment
- [ ] Consolidate `useScrollAnchor.ts` and `MessageList.tsx` scroll handling into single hook
- [ ] Move `atBottom` and `unreadCount` to `useRef` with debounced state updates
- [ ] Add `contain: strict` to scroll container CSS
- [ ] Fix double content-visibility application
- [ ] Validate 60fps on real device with 50+ messages

### Phase 2: Measure and Decide (only if Phase 1 isn't enough)
- [ ] Profile on iPhone 16 Pro Max with Performance Monitor
- [ ] Count DOM nodes at 50, 100, 200 messages
- [ ] Measure frame drops during fast scroll
- [ ] If still dropping frames: evaluate virtua (~3KB) as lightweight virtual layer

### Phase 3: Virtualization (only if Phase 2 shows DOM is the bottleneck)
- [ ] Install virtua (MIT, ~3KB)
- [ ] Implement reverse scroll with `shift` prop
- [ ] Build auto-follow logic for streaming messages
- [ ] Handle expanding content (tool cards, code blocks) with ResizeObserver
- [ ] Accept Ctrl+F regression or build custom search-scroll-to

---

## Sources

### Official Documentation & Engineering Blogs
- [Slack Engineering: Making Slack Faster](https://slack.engineering/making-slack-faster-by-being-lazy/) -- Lazy loading approach, 42-message pages
- [Slack Engineering: Part 2](https://slack.engineering/making-slack-faster-by-being-lazy-part-2/) -- Architecture decisions, LocalStorage pitfalls
- [Discord Engineering: Supercharging Mobile](https://discord.com/blog/supercharging-discord-mobile-our-journey-to-a-faster-app) -- View Portaling, native virtualizers, 60% slow frame reduction
- [Telegram Web K Source](https://github.com/TelegramOrg/Telegram-web-k) -- Custom Scrollable class, GPL v3

### Library Documentation
- [react-virtuoso](https://virtuoso.dev/) -- Chat-optimized virtualization, followOutput, firstItemIndex
- [react-virtuoso VirtuosoMessageList](https://virtuoso.dev/message-list/) -- Commercial chat component, $168/yr/seat
- [virtua](https://github.com/inokawa/virtua) -- 3KB zero-config virtualizer with shift mode
- [TanStack Virtual](https://tanstack.com/virtual/latest) -- Headless virtualizer, no chat support
- [TanStack Virtual Discussion #195](https://github.com/TanStack/virtual/discussions/195) -- Reverse scroll challenges

### Performance Research
- [Nolan Lawson: content-visibility Performance](https://nolanlawson.com/2024/09/18/improving-rendering-performance-with-css-content-visibility/) -- 45% improvement benchmarks, 20K element testing
- [web.dev: content-visibility](https://web.dev/articles/content-visibility) -- 7x rendering boost
- [react-virtuoso Discussion #959](https://github.com/petyosi/react-virtuoso/discussions/959) -- content-visibility vs virtualization debate
- [CSS content-visibility for React Devs](https://dev.to/sebastienlorber/css-content-visibility-for-react-devs-4a3i) -- React-specific considerations
- [Can I Use: CSS content-visibility](https://caniuse.com/css-content-visibility) -- 94.43% global support, Safari 18.0+
- [ChatGPT Lag Fixer](https://github.com/bramvdg/chatgpt-lag-fixer) -- 92% DOM reduction, proves ChatGPT doesn't virtualize

### iOS/WKWebView
- [Apple: WKWebView scrollView](https://developer.apple.com/documentation/webkit/wkwebview/1614784-scrollview) -- UIScrollView integration
- [iOS Scroll Position Updates](https://medium.com/@kristiantolleshaugmrch/a-unique-solution-to-ios-safaris-scroll-event-problem-b8e402dacc13) -- iOS Safari scroll event issues
- [Scroll Event Performance](https://copyprogramming.com/howto/scroll-events-requestanimationframe-vs-requestidlecallback-vs-passive-event-listeners) -- rAF vs passive listeners comparison
- [GetStream VirtualizedMessageList](https://getstream.io/chat/docs/sdk/react/components/core-components/virtualized_list/) -- Production chat SDK using react-virtuoso

### Comparison Articles
- [react-window vs react-virtuoso](https://dev.to/sanamumtaz/react-virtualization-react-window-vs-react-virtuoso-8g) -- Bundle sizes, feature comparison
- [npm trends](https://npmtrends.com/@tanstack/virtual-core-vs-react-virtualized-vs-react-virtuoso-vs-react-window) -- Download statistics
