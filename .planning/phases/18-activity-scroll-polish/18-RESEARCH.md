# Phase 18: Activity, Scroll, Polish - Research

**Researched:** 2026-03-08
**Domain:** Chat UX polish — activity feedback, scroll management, entrance animations, streaming cursor
**Confidence:** HIGH

## Summary

Phase 18 brings four distinct but complementary UX polish areas together: an activity status line showing what the agent is doing, token/cost display on finalized messages, robust scroll position management with auto-scroll and preservation, and entrance animations with streaming cursor refinement. All four areas build on well-established existing infrastructure — the stream store already has `activityText` state, `useScrollAnchor` already handles basic auto-scroll, `tw-animate-css` is already installed and imported, and the streaming cursor CSS already exists in `streaming-cursor.css`.

The primary technical risk is in the scroll management work (NAV-01 through NAV-04), which requires careful coordination between `useLayoutEffect` for position restoration, `ResizeObserver` for dynamic content height changes during streaming, and the existing `IntersectionObserver`-based auto-scroll in `useScrollAnchor`. The activity status line (ACT-01 through ACT-04) and entrance animations (POL-01) are straightforward. Token/cost display (ACT-05) depends on wiring the existing `SDKResultMessage.total_cost_usd` and `SDKAssistantMessage.message.usage` data through to the message metadata, which is currently null-populated in `ActiveMessage.handleFlush`.

**Primary recommendation:** Implement in three waves — (1) activity status line + streaming cursor as a React component, (2) scroll enhancements + content-visibility, (3) entrance animations + token display. Wave 2 is the most complex and should be tested thoroughly with long conversations and dynamic content.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Activity status line positioned below messages, above composer in CSS Grid layout (new grid row: `1fr auto auto auto` — messages, status line, permission banner, composer)
- Grid row collapses to zero height when no activity; expands when streaming with activity text
- Displays human-readable tool action phrases: "Reading src/auth.ts...", "Running npm test...", etc.
- Text derived from tool name + key argument (multiplexer/store already has `activityText` state)
- Fades out immediately (200ms opacity transition) when streaming stops, then row collapses
- Updates debounced to 200ms in multiplexer (ACT-03)
- Outside scroll container — never causes scroll height changes (ACT-04)
- Token/cost display always visible below every finalized assistant message content
- Muted text (`text-muted text-xs`), not hover-only
- Format: "1,234 in / 567 out · $0.003" with optional cache tokens
- Data sourced from `Message.metadata.tokenCount` and `Message.metadata.cost`
- Per-session scroll position stored in `useRef<Map<string, number>>`
- Scroll-to-bottom pill at 200px threshold with unread message count badge
- ResizeObserver on scroll container content maintains bottom lock during streaming
- `content-visibility: auto` with `contain-intrinsic-height: auto 200px` on past message containers
- Message entrance animations: fade + slide up (opacity 0→1, translateY 8px→0px, 200ms ease-out)
- Only on newly appended messages, NOT on initial session load
- Respects `prefers-reduced-motion`
- Uses tw-animate-css (already installed as DEP-06)
- Streaming cursor as React component (`<StreamingCursor />`), NOT CSS ::after pseudo
- Primary accent color (`var(--primary)`), 2px wide, 1s pulse cycle (opacity 0.4→1.0)
- Muted variant for thinking blocks
- Thinking block text: `italic text-muted font-mono text-sm` inside ThinkingDisclosure

### Claude's Discretion
- Exact grid row collapse/expand animation timing for status line
- Badge positioning and sizing on scroll pill (top-right corner standard vs integrated)
- How to detect "newly appended" vs "loaded" messages for entrance animation
- StreamingCursor component internal implementation (inline-block span with CSS keyframes)
- ResizeObserver throttling strategy (rAF vs debounce)
- content-visibility boundary — which message containers get it

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ACT-01 | Activity status line renders below message list, above composer. `React.memo` with single selector subscription. | StatusLine component subscribes to `useStreamStore(s => s.activityText)` and `useStreamStore(s => s.isStreaming)`. ChatView grid adds fourth row. |
| ACT-02 | Activity text fades in/out with CSS transition (200ms opacity). Truncates with `truncate` class. | CSS transition on opacity, `truncate` Tailwind utility for ellipsis. |
| ACT-03 | Activity text updates debounced to 200ms in multiplexer. | Add debounce logic in `stream-multiplexer.ts` `onActivityText` callback or in `websocket-init.ts` callback wiring. |
| ACT-04 | Activity status line outside scroll container — never causes scroll height changes. | Grid row placement in ChatView ensures separation from scroll container. |
| ACT-05 | Token/cost display below each finalized assistant message. | Wire `SDKResultMessage.total_cost_usd` and `SDKAssistantMessage.message.usage` through multiplexer to message metadata. New `TokenUsage` component in AssistantMessage. |
| NAV-01 | Scroll position preserved per session in `useRef<Map<string, number>>`. Restore via `useLayoutEffect`. | Enhance MessageList or ChatView with scroll position map. Save on session switch, restore synchronously. |
| NAV-02 | `content-visibility: auto` with `contain-intrinsic-height: auto 200px` on past message containers. | CSS-only change on MessageContainer when not actively streaming. |
| NAV-03 | ResizeObserver on scroll container content for bottom lock during dynamic height changes. | Enhance `useScrollAnchor` with ResizeObserver on content wrapper. Throttle via rAF. |
| NAV-04 | Scroll-to-bottom pill with unread message count badge. Show when 200px+ from bottom. | Enhance existing `ScrollToBottomPill` with `unreadCount` prop. Track unread count in `useScrollAnchor`. |
| DEP-06 | Install tailwindcss-animate for message entrance animations. | Already satisfied — `tw-animate-css` v1.4.0 installed and imported in `index.css`. |
| POL-01 | Message entrance animations via tw-animate-css. Only on newly appended messages. Respects `prefers-reduced-motion`. | `animate-in fade-in slide-in-from-bottom-2 duration-200` classes. Track "isNew" via ref counting in MessageList. |
| POL-02 | Streaming cursor as pulsing vertical bar at end of streaming text. Rose accent color, 1s pulse. | Refactor existing `.streaming-cursor` CSS class into `<StreamingCursor />` React component with muted variant prop. |
| POL-03 | Thinking block text styling: `italic text-muted font-mono text-sm`. | Already implemented in ThinkingDisclosure (line 80). Verify and confirm. |
| POL-04 | All CSS animations use design tokens — no hardcoded durations. | Existing ESLint rules enforce this. Audit new CSS for compliance. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| tw-animate-css | 1.4.0 | Entrance/exit animations | Already installed. TW v4 replacement for tailwindcss-animate. Provides `animate-in`, `fade-in`, `slide-in-from-bottom-*` utilities. |
| React 19 | 19.2.0 | Component framework | Project standard |
| Zustand | 5.0.11 | Stream store for activity text | Project standard, selector-only access |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| ResizeObserver (browser API) | Native | Detect content height changes for auto-scroll | NAV-03: bottom lock during streaming |
| IntersectionObserver (browser API) | Native | Already used in useScrollAnchor | NAV-04: pill visibility |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| ResizeObserver | MutationObserver | ResizeObserver is purpose-built for size changes; MutationObserver requires manual height diffing |
| tw-animate-css | Custom CSS @keyframes | tw-animate-css already installed; custom keyframes add maintenance burden |
| useRef<Map> for scroll pos | Zustand persist | Scroll position is ephemeral per page load, no need to persist to localStorage |

**Installation:**
```bash
# No new packages needed — tw-animate-css already installed
# DEP-06 is satisfied by existing tw-animate-css@1.4.0
```

## Architecture Patterns

### Recommended Project Structure
```
src/src/
├── components/chat/view/
│   ├── StatusLine.tsx           # NEW: Activity status line (ACT-01 through ACT-04)
│   ├── StreamingCursor.tsx      # NEW: Reusable cursor component (POL-02)
│   ├── TokenUsage.tsx           # NEW: Token/cost display (ACT-05)
│   ├── ScrollToBottomPill.tsx   # MODIFY: Add unread count badge (NAV-04)
│   ├── MessageList.tsx          # MODIFY: Entrance animations, scroll preservation
│   ├── MessageContainer.tsx     # MODIFY: content-visibility CSS (NAV-02)
│   ├── ChatView.tsx             # MODIFY: Grid layout adds StatusLine row
│   ├── AssistantMessage.tsx     # MODIFY: Add TokenUsage component
│   ├── ActiveMessage.tsx        # MODIFY: Use StreamingCursor component
│   └── ThinkingDisclosure.tsx   # MODIFY: Use StreamingCursor muted variant
├── components/chat/styles/
│   ├── streaming-cursor.css     # MODIFY: Refactor cursor styles, add pulse variant
│   └── status-line.css          # NEW: Status line fade/collapse styles
├── hooks/
│   └── useScrollAnchor.ts       # MODIFY: ResizeObserver, unread count, position map
└── lib/
    ├── stream-multiplexer.ts    # MODIFY: Activity text debounce (ACT-03)
    └── websocket-init.ts        # MODIFY: Wire token/cost data to messages
```

### Pattern 1: Activity Status Line as Grid Row
**What:** StatusLine component occupies a dedicated CSS Grid row between messages and permission banner. Row height is `auto` (collapses to 0 when empty via CSS).
**When to use:** When a UI element needs to appear/disappear without affecting scroll container content height.
**Example:**
```typescript
// ChatView grid: 1fr auto auto auto
// Row 1: Message scroll container (flex-1)
// Row 2: StatusLine (collapses when inactive)
// Row 3: PermissionBanner
// Row 4: ChatComposer

// StatusLine.tsx
export const StatusLine = memo(function StatusLine() {
  const activityText = useStreamStore((s) => s.activityText);
  const isStreaming = useStreamStore((s) => s.isStreaming);
  const visible = isStreaming && Boolean(activityText);

  return (
    <div
      className={cn(
        'status-line px-4 py-1 text-xs text-muted truncate',
        'transition-opacity',
        visible ? 'opacity-100' : 'opacity-0',
      )}
      style={{ transitionDuration: 'var(--duration-normal)' }}
      data-testid="status-line"
    >
      {activityText}
    </div>
  );
});
```

### Pattern 2: Scroll Position Preservation via useRef<Map>
**What:** Store scrollTop per session in a Map ref. Save on session switch, restore via useLayoutEffect.
**When to use:** When scroll position must survive component re-renders and session switches.
**Example:**
```typescript
// In MessageList or ChatView
const scrollPositionMap = useRef<Map<string, number>>(new Map());

// Save current position before session switch
const saveScrollPosition = (sessionId: string) => {
  const el = scrollRef.current;
  if (el && sessionId) {
    scrollPositionMap.current.set(sessionId, el.scrollTop);
  }
};

// Restore position on mount/session change
useLayoutEffect(() => {
  const el = scrollRef.current;
  if (!el || !sessionId) return;
  const saved = scrollPositionMap.current.get(sessionId);
  if (saved !== undefined) {
    el.scrollTop = saved;
  } else {
    // New session: scroll to bottom
    el.scrollTop = el.scrollHeight;
  }
}, [sessionId]);
```

### Pattern 3: ResizeObserver Bottom Lock
**What:** Observe content container size changes. When user is in auto-scroll mode and content grows (Shiki highlighting, tool card expansion), re-scroll to bottom.
**When to use:** NAV-03 — maintaining bottom lock during streaming with dynamic content.
**Example:**
```typescript
// Inside useScrollAnchor
useEffect(() => {
  const container = scrollContainerRef.current;
  if (!container) return;

  // Observe the content wrapper (first child of scroll container)
  const contentWrapper = container.firstElementChild;
  if (!contentWrapper) return;

  let rafId: number | null = null;
  const observer = new ResizeObserver(() => {
    // Throttle via rAF — at most one scroll per frame
    if (rafId !== null) return;
    rafId = requestAnimationFrame(() => {
      rafId = null;
      if (isAutoScrollingRef.current) {
        sentinelNode?.scrollIntoView({ block: 'end' });
      }
    });
  });

  observer.observe(contentWrapper);
  return () => {
    observer.disconnect();
    if (rafId !== null) cancelAnimationFrame(rafId);
  };
}, [scrollContainerRef, sentinelNode]);
```

### Pattern 4: Entrance Animation with "isNew" Detection
**What:** Track message count via ref. Only messages whose index >= previous count get the animation class. On initial load, all messages are "known" (no animation).
**When to use:** POL-01 — animate newly appended messages, not historical ones.
**Example:**
```typescript
// In MessageList
const prevMessageCountRef = useRef(messages.length);
const isInitialLoadRef = useRef(true);

// After first render, mark initial load complete
useEffect(() => {
  // Set to false after first full render
  isInitialLoadRef.current = false;
}, []);

// On each render, determine which messages are "new"
const newMessageStartIndex = isInitialLoadRef.current
  ? messages.length  // All are "old" on initial load
  : prevMessageCountRef.current;

// Update ref after render
useEffect(() => {
  prevMessageCountRef.current = messages.length;
}, [messages.length]);

// In JSX:
{messages.map((msg, idx) => (
  <div
    key={msg.id}
    className={cn(
      idx >= newMessageStartIndex && 'animate-in fade-in slide-in-from-bottom-2 duration-200',
    )}
  >
    {renderMessage(msg)}
  </div>
))}
```

### Pattern 5: StreamingCursor as React Component
**What:** Replace the inline `<span className="streaming-cursor" />` with a `<StreamingCursor />` component that accepts a `variant` prop for muted thinking blocks.
**When to use:** POL-02 — needs two visual variants (primary for content, muted for thinking).
**Example:**
```typescript
// StreamingCursor.tsx
interface StreamingCursorProps {
  variant?: 'primary' | 'muted';
}

export function StreamingCursor({ variant = 'primary' }: StreamingCursorProps) {
  return (
    <span
      className={cn(
        'streaming-cursor',
        variant === 'muted' && 'streaming-cursor--muted',
      )}
      data-testid="streaming-cursor"
      aria-hidden="true"
    />
  );
}
```

### Anti-Patterns to Avoid
- **Debouncing in React component instead of multiplexer:** Activity text debounce MUST happen in the multiplexer/callback layer, not via `useDeferredValue` or component-level debounce. The Zustand store update is what causes re-renders.
- **Using `useEffect` for scroll restoration:** Must use `useLayoutEffect` — useEffect runs after paint, causing visible flash-to-top.
- **Putting StatusLine inside scroll container:** Would cause scroll height changes, violating ACT-04. Must be in a separate grid row.
- **Animating all messages on session switch:** If entrance animation applies to all messages when switching sessions, it creates an ugly cascade. The "isNew" detection must distinguish initial load from appended messages.
- **Using `scrollTo` with smooth behavior for restoration:** Scroll position restoration (NAV-01) must be instant (no animation). Only the pill click (NAV-04) uses smooth scroll.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Entrance animations | Custom CSS @keyframes + JS | `tw-animate-css` classes (`animate-in fade-in slide-in-from-bottom-2`) | Already installed, tested, handles `prefers-reduced-motion` |
| Content height observation | Manual height polling or MutationObserver | `ResizeObserver` (native API) | Purpose-built, fires on geometry changes only, performant |
| Activity text debounce | Custom debounce utility | Inline setTimeout/clearTimeout in multiplexer callback | Simple enough for a single use case; a 3-line closure suffices |
| Number formatting | Manual comma insertion | `Number.toLocaleString()` | Handles locale-specific separators correctly |
| Cost formatting | Custom decimal formatting | `Intl.NumberFormat` with currency-like options | Handles precision correctly (`$0.003` vs `$1.23`) |

**Key insight:** This phase is primarily about wiring existing infrastructure together rather than building new abstractions. The stream store, multiplexer, scroll anchor hook, and animation library are all already in place.

## Common Pitfalls

### Pitfall 1: Scroll Position Flash on Session Switch
**What goes wrong:** User switches sessions, sees content flash to top-of-page before scrolling to saved position.
**Why it happens:** Using `useEffect` instead of `useLayoutEffect` for scroll restoration. `useEffect` runs after browser paint.
**How to avoid:** Always use `useLayoutEffect` for synchronous DOM mutation. Set `scrollTop` directly, no animation.
**Warning signs:** Visible "jump" when switching between sessions with different scroll positions.

### Pitfall 2: ResizeObserver Infinite Loop
**What goes wrong:** ResizeObserver callback triggers a scroll, which triggers a layout change, which fires ResizeObserver again.
**Why it happens:** `scrollIntoView` can cause layout changes that re-trigger the observer.
**How to avoid:** Use rAF throttling in the ResizeObserver callback. Only re-scroll if `isAutoScrollingRef.current` is true. The rAF ensures at most one scroll per frame.
**Warning signs:** Browser console warning "ResizeObserver loop completed with undelivered notifications", janky scrolling.

### Pitfall 3: Entrance Animation Cascade on Load
**What goes wrong:** All 50+ messages animate in simultaneously when opening a session, creating visual chaos.
**Why it happens:** No distinction between "loaded from history" and "newly appended" messages.
**How to avoid:** Track message count via ref. On initial render, set the "known" threshold to current message count. Only messages arriving after initial render get animation classes. Also skip animation on session switch.
**Warning signs:** All messages sliding up from bottom when navigating to a session.

### Pitfall 4: Activity Text Debounce Stale Closure
**What goes wrong:** Debounced activity text shows stale tool names or never clears.
**Why it happens:** Closure captures old state in setTimeout callback.
**How to avoid:** Use a simple timer-based debounce at the multiplexer level (outside React). Store the timeout ID in module scope. Clear previous timeout before setting new one.
**Warning signs:** Status line showing "Reading file.ts..." when the tool has already resolved.

### Pitfall 5: content-visibility Breaking Scroll Calculations
**What goes wrong:** `content-visibility: auto` causes incorrect `scrollHeight` calculations because off-screen elements have estimated heights.
**Why it happens:** Browser uses `contain-intrinsic-height` estimate for off-screen elements, which may differ from actual height.
**How to avoid:** Only apply `content-visibility: auto` to finalized message containers, NOT the actively streaming message. Use `contain-intrinsic-height: auto 200px` so browser caches last-known height after first render.
**Warning signs:** Scroll position jumps when scrolling through long conversations, inaccurate scroll-to-bottom behavior.

### Pitfall 6: Token/Cost Data Not Flowing to Messages
**What goes wrong:** Token display always shows null because message metadata isn't populated.
**Why it happens:** `ActiveMessage.handleFlush` creates messages with `tokenCount: null, cost: null`. The `onTokenBudget` and `result` message data never reaches the message.
**How to avoid:** Wire the `SDKResultMessage.total_cost_usd` and usage data through the multiplexer to update the most recent message's metadata, or store it in stream store and read it during flush.
**Warning signs:** TokenUsage component renders nothing or "0 in / 0 out".

## Code Examples

### tw-animate-css Usage (Verified from installed package)
```typescript
// Entrance animation classes (tw-animate-css v1.4.0)
// Already imported via: @import "tw-animate-css"; in index.css

// Basic fade + slide from bottom:
className="animate-in fade-in slide-in-from-bottom-2 duration-200"
// - animate-in: triggers the enter animation
// - fade-in: opacity from 0 to 1
// - slide-in-from-bottom-2: translateY from 8px (2 * 4px spacing) to 0
// - duration-200: 200ms animation duration

// prefers-reduced-motion: wrap in media query or use Tailwind's motion-safe:
className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 duration-200"
// Or handle at CSS level with @media (prefers-reduced-motion: reduce)

// Fill mode forwards (element stays at final state):
className="animate-in fade-in fill-mode-forwards"
```

### StatusLine Grid Row Integration
```typescript
// ChatView.tsx — update grid-template-rows
<div className="relative grid h-full grid-rows-[1fr_auto_auto_auto]">
  {/* Row 1: Message list (scroll container) */}
  <MessageList ... />
  {/* Row 2: Status line (collapses when inactive) */}
  <StatusLine />
  {/* Row 3: Permission banner */}
  <PermissionBanner ... />
  {/* Row 4: Composer */}
  <ChatComposer ... />
</div>
```

### Token/Cost Formatting
```typescript
// TokenUsage.tsx
function formatTokenCount(count: number): string {
  return count.toLocaleString();  // 1234 → "1,234"
}

function formatCost(cost: number): string {
  if (cost < 0.01) {
    return `$${cost.toFixed(4)}`;  // $0.0034
  }
  return `$${cost.toFixed(3)}`;    // $0.123
}

// Render: "1,234 in / 567 out · $0.003"
// With cache: "1,234 in (890 cached) / 567 out · $0.003"
```

### Activity Text Debounce in Multiplexer
```typescript
// In websocket-init.ts callback wiring
let activityDebounceTimer: ReturnType<typeof setTimeout> | null = null;

const callbacks: MultiplexerCallbacks = {
  // ... other callbacks
  onActivityText: (text) => {
    if (activityDebounceTimer !== null) {
      clearTimeout(activityDebounceTimer);
    }
    activityDebounceTimer = setTimeout(() => {
      streamStore().setActivityText(text);
      activityDebounceTimer = null;
    }, 200);
  },
};
```

### Streaming Cursor Pulse Animation (CSS)
```css
/* Updated streaming-cursor.css */
.streaming-cursor {
  display: inline-block;
  width: 2px;
  height: 1.2em;
  vertical-align: text-bottom;
  background-color: var(--accent-primary);
  animation: cursor-pulse 1s ease-in-out infinite;
  transition: opacity var(--duration-normal) var(--ease-out);
}

.streaming-cursor--muted {
  background-color: var(--text-muted);
}

/* Change from blink to pulse per POL-02 */
@keyframes cursor-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

@media (prefers-reduced-motion: reduce) {
  .streaming-cursor {
    animation: none;
    opacity: 1;
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| tailwindcss-animate (JS plugin) | tw-animate-css (pure CSS) | TW v4 migration | Same API surface, CSS-first architecture, no plugin config |
| CSS ::after cursor | React component cursor | This phase | Enables variant prop for muted/primary, conditional rendering |
| scrollIntoView-only auto-scroll | ResizeObserver + scrollIntoView | This phase | Handles dynamic content height (Shiki, tool card expansion) |
| No scroll preservation | useRef<Map> + useLayoutEffect | This phase | Session-scoped scroll position memory |

**Deprecated/outdated:**
- `tailwindcss-animate` npm package: Replaced by `tw-animate-css` for Tailwind v4. Already migrated in this project.

## Open Questions

1. **Token data flow from backend**
   - What we know: `SDKResultMessage` has `total_cost_usd` and `modelUsage`. `SDKAssistantMessage` has optional `usage` with `input_tokens`/`output_tokens`. The `onTokenBudget` callback in websocket-init is currently a no-op.
   - What's unclear: Whether `total_cost_usd` includes all tokens for the session turn or just the final API call. Whether `modelUsage` has cache token breakdown.
   - Recommendation: Wire `SDKResultMessage` data through multiplexer → store it temporarily in stream store → read it during `handleFlush` to populate message metadata. If cache tokens aren't available from the SDK, omit the cache display and add it later when the data becomes available.

2. **content-visibility interaction with IntersectionObserver**
   - What we know: `content-visibility: auto` skips rendering of off-screen elements. IntersectionObserver relies on element visibility.
   - What's unclear: Whether the sentinel element at the bottom of the scroll container is affected by content-visibility on sibling message containers.
   - Recommendation: The sentinel is a separate `<div>` outside message containers, so it should not be affected. But validate during implementation — if scroll behavior breaks, remove content-visibility from the last few message containers near the sentinel.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 + jsdom |
| Config file | `src/vite.config.ts` (vitest inline config) |
| Quick run command | `cd src && npx vitest run --reporter=verbose` |
| Full suite command | `cd src && npx vitest run --coverage` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ACT-01 | StatusLine renders activity text from stream store | unit | `cd src && npx vitest run src/src/components/chat/view/StatusLine.test.tsx -x` | Wave 0 |
| ACT-02 | StatusLine fades in/out, truncates text | unit | Same as ACT-01 | Wave 0 |
| ACT-03 | Activity text debounced to 200ms | unit | `cd src && npx vitest run src/src/lib/stream-multiplexer.test.ts -x` | Existing (extend) |
| ACT-04 | StatusLine outside scroll container (grid row) | unit | Covered by ChatView.test.tsx | Existing (extend) |
| ACT-05 | TokenUsage renders formatted token/cost data | unit | `cd src && npx vitest run src/src/components/chat/view/TokenUsage.test.tsx -x` | Wave 0 |
| NAV-01 | Scroll position preserved per session | unit | `cd src && npx vitest run src/src/hooks/useScrollAnchor.test.ts -x` | Wave 0 |
| NAV-02 | content-visibility applied to past messages | unit | Covered by MessageContainer tests | manual-only (CSS property, jsdom limitation) |
| NAV-03 | ResizeObserver bottom lock | unit | `cd src && npx vitest run src/src/hooks/useScrollAnchor.test.ts -x` | Wave 0 |
| NAV-04 | Scroll pill shows unread count badge | unit | `cd src && npx vitest run src/src/components/chat/view/ScrollToBottomPill.test.tsx -x` | Existing (extend) |
| DEP-06 | tw-animate-css installed and imported | smoke | `cd src && node -e "require.resolve('tw-animate-css')"` | N/A (already satisfied) |
| POL-01 | Message entrance animations on new messages only | unit | Covered by MessageList tests | manual-only (animation, jsdom limitation) |
| POL-02 | StreamingCursor component with variant prop | unit | `cd src && npx vitest run src/src/components/chat/view/StreamingCursor.test.tsx -x` | Wave 0 |
| POL-03 | Thinking block text styling | unit | Covered by ThinkingDisclosure.test.tsx | Existing |
| POL-04 | CSS animations use design tokens | lint | `cd src && npx eslint src/` | Existing |

### Sampling Rate
- **Per task commit:** `cd src && npx vitest run --reporter=verbose`
- **Per wave merge:** `cd src && npx vitest run --coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/src/components/chat/view/StatusLine.test.tsx` — covers ACT-01, ACT-02
- [ ] `src/src/components/chat/view/TokenUsage.test.tsx` — covers ACT-05
- [ ] `src/src/components/chat/view/StreamingCursor.test.tsx` — covers POL-02
- [ ] Extend `src/src/hooks/useScrollAnchor.test.ts` — if not exists, create; covers NAV-01, NAV-03
- [ ] Extend `src/src/components/chat/view/ScrollToBottomPill.test.tsx` — covers NAV-04 unread badge

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `useScrollAnchor.ts`, `stream.ts`, `stream-multiplexer.ts`, `ChatView.tsx`, `MessageList.tsx`, `ActiveMessage.tsx`, `ScrollToBottomPill.tsx`, `MessageContainer.tsx`, `streaming-cursor.css`, `tokens.css`, `index.css`
- tw-animate-css v1.4.0 installed package: verified API surface (animate-in, fade-in, slide-in-from-bottom-*, duration-*), already imported via `@import "tw-animate-css"` in index.css
- WebSocket types: `websocket.ts` — SDKResultMessage has `total_cost_usd`, SDKAssistantMessage has optional `usage.input_tokens/output_tokens`
- Message types: `message.ts` — MessageMetadata has `tokenCount: number | null` and `cost: number | null`

### Secondary (MEDIUM confidence)
- ResizeObserver API: well-supported in all modern browsers (since Chrome 64, Firefox 69, Safari 13.1)
- content-visibility CSS: supported in Chrome 85+, Firefox 125+, Safari 18+ (check if Safari support is acceptable)

### Tertiary (LOW confidence)
- content-visibility interaction with IntersectionObserver: no direct source verifying behavior. Recommend validating during implementation.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already installed, API surfaces verified from node_modules
- Architecture: HIGH - all patterns build on existing codebase infrastructure, well-understood integration points
- Pitfalls: HIGH - common scroll/animation gotchas are well-documented, verified against existing code patterns
- Token data flow: MEDIUM - SDK data types are known but wiring hasn't been tested end-to-end yet

**Research date:** 2026-03-08
**Valid until:** 2026-04-08 (stable domain, no fast-moving dependencies)
