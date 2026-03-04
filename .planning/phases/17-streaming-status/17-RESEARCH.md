# Phase 17: Streaming & Status - Research

**Researched:** 2026-03-04
**Domain:** Streaming UX, scroll behavior, status indicators, error banners
**Confidence:** HIGH

## Summary

Phase 17 transforms the streaming experience from functional to polished. The codebase already has the foundational pieces -- rAF-buffered streaming (STRM-01 partially done), IntersectionObserver scroll tracking, aurora CSS animations, abort-session WebSocket messages, and tool event parsing. The work is primarily about upgrading existing components (scroll anchor rewrite, PreTokenIndicator atmospheric upgrade, ClaudeStatus replacement) and adding new UI elements (status line below composer, send/stop morph, error banners).

The critical integration surface is `ChatMessagesPane` which orchestrates scroll, messages, and indicators. The `ChatComposer` owns the send button and ClaudeStatus positioning. The `useChatRealtimeHandlers` hook already extracts tool names from `tool_use` content parts, providing the data source for semantic activity text. All aurora CSS runs on the compositor thread via `@property --aurora-angle`, so atmospheric upgrades won't compete with main-thread streaming.

**Primary recommendation:** Implement in four waves: (1) scroll rewrite + pill counter change, (2) atmospheric aurora + thinking indicators, (3) status line + send/stop morph, (4) error banners + tool card active border.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- ScrollToBottomPill shows **new message count** (not turns) -- "3 new messages"
- Replace IntersectionObserver approach with **scroll-event based** tracking -- listen to scroll events, check if near bottom (10px threshold)
- Auto-scroll **re-engages automatically** when user scrolls back near the bottom -- no pill click required
- CSS overflow-anchor for position preservation when content is prepended above
- Pre-token indicator becomes an **aurora atmosphere** -- soft, animated aurora lights "shining down", not just a bar but a diffused glow field
- **"Thinking..." text sits above** the aurora atmosphere -- two separate elements but visually connected
- Transition to content: aurora **fades upward and dissolves** as streaming content pushes in from the top
- Reconnect skeletons **match the atmospheric aurora** treatment
- Extended thinking ("Thinking...") transitions into collapsed thinking block when complete
- Status line moves **below the composer** -- always visible, not just during streaming
- **Idle state** shows: provider name, model, and session cost
- **Streaming state** shows: semantic activity text, elapsed time, token count, "esc to stop" hint
- Activity text parsed from tool events -- real tool names and arguments
- **Token usage pie and cost display move down** from ChatInputControls into the status line
- **Stop button appears in both** the status line AND the send button morph
- **Pulsing border** on the active tool card (no spinner icon, just border glow using existing Phase 15 pill styling)
- Send button morphs to stop via **CSS crossfade** -- same size/position, icon swaps from arrow to square
- Stop button switches to **red/destructive** color (not rose)
- Permanent error banners appear **inline after the last message** -- persistent red-accented banner
- Error banners are **dismissible with X** button

### Claude's Discretion
- Exact rAF batching interval for token buffering (50-100ms range per STRM-01)
- Aurora atmosphere CSS implementation details (gradient angles, opacity levels, animation timing)
- Scroll-event debounce strategy
- Status line typography and spacing
- Error banner icon and copy

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| STRM-01 | Token streaming uses rAF buffer (50-100ms batching) | Already partially implemented in useChatRealtimeHandlers. Need to add configurable batching interval on top of existing rAF. |
| STRM-02 | Smart auto-scroll -- 10px threshold, stops on user scroll, CSS overflow-anchor | Rewrite useScrollAnchor from IntersectionObserver to scroll-event based. Add overflow-anchor CSS. |
| STRM-03 | Floating scroll-to-bottom pill with "N new messages" count | Change useNewTurnCounter to count messages instead of turns. Update ScrollToBottomPill text. |
| STRM-04 | Typing indicator before first token, transitions into streaming content | Upgrade PreTokenIndicator to atmospheric aurora. Modify exit animation to fade-up dissolve. |
| STRM-05 | "Thinking..." indicator during extended thinking, transitions to collapsed block | ThinkingShimmer already exists. Wire transition to collapsed thinking disclosure. |
| STRM-06 | Skeleton shimmer during reconnect scrollback | Upgrade ReconnectSkeletons to atmospheric aurora treatment matching PreTokenIndicator. |
| STRM-08 | Inline error banner for permanent errors (process crash, exit code) | New ErrorBanner component. Detect exitCode != 0 and error types in useChatRealtimeHandlers. |
| STRM-09 | Global status line showing current activity with spinner on active card | New StatusLine component below composer. Replace ClaudeStatus. Move TokenUsagePie from ChatInputControls. |
| STRM-10 | Stop generation button replaces send during streaming via WebSocket abort | handleAbortSession already exists. Wire to send button morph + status line stop button. |
| STRM-11 | Semantic activity text -- "Reading auth.ts..." parsed from tool events | Extract toolName + first argument from tool_use parts in useChatRealtimeHandlers. |
| STRM-12 | Send-to-stop button morph uses CSS crossfade -- no layout jump | CSS transition on same-size button. Icon swap with opacity crossfade. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | existing | Component framework | Already in project |
| CSS @property | native | Compositor-thread animation | Already used for aurora-shimmer.css |
| requestAnimationFrame | native | Token batching | Already implemented in useChatRealtimeHandlers |
| CSS overflow-anchor | native | Scroll position preservation | Browser-native, no library needed |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | existing | Icons for status/stop/error | Already in project, used by ToolActionCard |
| tailwind-merge / clsx | existing | Conditional class merging | Already in project |

### Alternatives Considered
None. This phase uses entirely project-native patterns -- no new dependencies needed.

## Architecture Patterns

### Component Structure
```
src/components/chat/
├── hooks/
│   ├── useScrollAnchor.ts         # REWRITE: scroll-event based (was IntersectionObserver)
│   ├── useNewTurnCounter.ts       # MODIFY: rename to useNewMessageCounter, count messages not turns
│   └── useActivityStatus.ts       # NEW: extract semantic activity from tool events
├── view/subcomponents/
│   ├── PreTokenIndicator.tsx      # UPGRADE: atmospheric aurora with fade-up exit
│   ├── ThinkingShimmer.tsx        # MODIFY: wire exit transition to collapsed block
│   ├── ReconnectSkeletons.tsx     # UPGRADE: atmospheric aurora matching PreTokenIndicator
│   ├── ScrollToBottomPill.tsx     # MODIFY: "N new messages" text
│   ├── ClaudeStatus.tsx           # DELETE: replaced by StatusLine
│   ├── StatusLine.tsx             # NEW: below-composer always-visible dashboard
│   ├── ErrorBanner.tsx            # NEW: inline persistent error banners
│   ├── ChatComposer.tsx           # MODIFY: send/stop morph, remove ClaudeStatus
│   ├── ChatInputControls.tsx      # MODIFY: remove TokenUsagePie + cost display
│   └── ChatMessagesPane.tsx       # MODIFY: scroll rewrite integration, error banner placement
└── styles/
    └── aurora-shimmer.css         # EXTEND: atmospheric aurora field classes
```

### Pattern 1: Scroll-Event Based Tracking (replaces IntersectionObserver)
**What:** Listen to scroll events on the container, check `scrollTop + clientHeight >= scrollHeight - threshold`
**When to use:** Always -- the user decision locks this approach

```typescript
// New useScrollAnchor implementation pattern
export function useScrollAnchor(scrollContainerRef: React.RefObject<HTMLDivElement>) {
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);
  const isAtBottomRef = useRef(true);
  const THRESHOLD = 10; // pixels from bottom

  const checkIfAtBottom = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return false;
    return container.scrollHeight - container.scrollTop - container.clientHeight <= THRESHOLD;
  }, [scrollContainerRef]);

  // Scroll event handler -- no debounce per user decision (immediate response)
  const handleScroll = useCallback(() => {
    const atBottom = checkIfAtBottom();
    isAtBottomRef.current = atBottom;
    setIsAtBottom(atBottom);

    if (atBottom) {
      setIsUserScrolledUp(false); // Auto re-engage
    } else {
      setIsUserScrolledUp(true);
    }
  }, [checkIfAtBottom]);

  // Attach to onScroll on the container (not onWheel/onTouchMove)
  // Return same API shape as current hook for drop-in replacement

  const scrollToBottom = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    setIsUserScrolledUp(false);
  }, [scrollContainerRef]);

  return { isAtBottom, isUserScrolledUp, handleScroll, scrollToBottom };
}
```

**Key difference from current:** No sentinel div needed. No IntersectionObserver. The `handleScroll` goes on `onScroll` event of the container div. The sentinel ref and callback ref are removed from the API.

### Pattern 2: Aurora Atmosphere (atmospheric glow field)
**What:** Multi-layer diffused glow that fills the space where AI content will appear
**When to use:** PreTokenIndicator, ReconnectSkeletons

```css
/* Atmospheric aurora field -- stacked blur layers for depth */
.aurora-atmosphere {
  position: relative;
  height: 48px; /* taller than current 16px bar */
  overflow: hidden;
}

.aurora-atmosphere::before,
.aurora-atmosphere::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    calc(var(--aurora-angle) + 90deg),
    oklch(65% 0.28 0) 0%,
    oklch(70% 0.25 45) 12.5%,
    oklch(75% 0.22 90) 25%,
    oklch(70% 0.25 150) 37.5%,
    oklch(65% 0.28 210) 50%,
    oklch(60% 0.28 270) 62.5%,
    oklch(65% 0.25 330) 75%,
    oklch(65% 0.28 360) 100%
  );
  animation: aurora-rotate 4s linear infinite, aurora-pulse 2s ease-in-out infinite;
}

.aurora-atmosphere::before {
  filter: blur(20px);
  opacity: 0.3;
}

.aurora-atmosphere::after {
  filter: blur(8px);
  opacity: 0.15;
  animation-delay: -1s; /* offset for layered effect */
}

/* Fade-up exit for transition to content */
@keyframes aurora-dissolve-up {
  0% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-16px); }
}

.aurora-atmosphere-exit {
  animation: aurora-dissolve-up 300ms ease-out forwards;
}
```

### Pattern 3: Send/Stop CSS Crossfade
**What:** Same-size button with icon swap via opacity transition
**When to use:** ChatComposer send button during streaming

```typescript
// In ChatComposer -- the button container stays fixed size
<button
  type={isLoading ? 'button' : 'submit'}
  onClick={isLoading ? onAbortSession : undefined}
  className={`absolute right-2 top-1/2 transform -translate-y-1/2 w-10 h-10 sm:w-11 sm:h-11
    ${isLoading ? 'bg-destructive hover:bg-destructive/90' : 'bg-primary hover:bg-primary/90'}
    rounded-xl flex items-center justify-center transition-all duration-200`}
>
  {/* Send icon */}
  <svg
    className={`absolute w-4 h-4 sm:w-[18px] sm:h-[18px] text-primary-foreground transform rotate-90
      transition-opacity duration-200 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
    ...send arrow SVG...
  />
  {/* Stop icon */}
  <svg
    className={`absolute w-4 h-4 sm:w-[18px] sm:h-[18px] text-destructive-foreground
      transition-opacity duration-200 ${isLoading ? 'opacity-100' : 'opacity-0'}`}
    ...stop square SVG...
  />
</button>
```

### Pattern 4: StatusLine Component (below composer)
**What:** Always-visible dashboard showing idle/streaming state
**When to use:** Replaces ClaudeStatus above composer

```typescript
// StatusLine.tsx -- below the form element in ChatComposer
interface StatusLineProps {
  isLoading: boolean;
  provider: string;
  model: string;
  sessionCost: number | null;
  activityText: string | null;    // "Reading auth.ts..."
  elapsedTime: number;
  tokenCount: number;
  onAbort: () => void;
  canAbort: boolean;
  tokenBudget: { used?: number; total?: number } | null;
}

// Idle: "Claude . opus-4 . $0.42" with TokenUsagePie
// Streaming: "Reading auth.ts... . 12s . 1,234 tokens . esc to stop" with stop button
```

### Pattern 5: Semantic Activity Text Extraction
**What:** Parse tool events into human-readable status
**When to use:** Status line during streaming

```typescript
// useActivityStatus.ts -- new hook
function parseActivityText(toolName: string, toolInput: unknown): string {
  const input = typeof toolInput === 'string' ? JSON.parse(toolInput) : toolInput;

  switch (toolName) {
    case 'Read':
      return `Reading ${basename(input?.file_path || '')}...`;
    case 'Write':
      return `Writing ${basename(input?.file_path || '')}...`;
    case 'Edit':
      return `Editing ${basename(input?.file_path || '')}...`;
    case 'Bash':
      return `Running command...`;
    case 'Grep':
      return `Searching for "${truncate(input?.pattern, 20)}"...`;
    case 'Glob':
      return `Finding files...`;
    case 'Task':
      return `Running subtask...`;
    default:
      return `Using ${toolName}...`;
  }
}
```

The data source is already in `useChatRealtimeHandlers` where `tool_use` parts are processed. When a `tool_use` is encountered, extract `part.name` and `part.input` and update a new `activityText` state.

### Anti-Patterns to Avoid
- **Debouncing scroll check:** Do NOT debounce the scroll handler. The user expects immediate response when scrolling up. The 10px threshold is the only gate.
- **Per-token setState:** Already avoided by rAF batching, but ensure the batching interval stays in the 50-100ms range per STRM-01. Current rAF (~16ms) is actually faster than needed; consider accumulating for 2-3 frames.
- **Layout jumps on send/stop morph:** The button MUST be the same physical size. Use absolute positioning for both icons with opacity crossfade. Never change button dimensions.
- **Spinner icon on tool cards:** User explicitly said NO spinner icon. Use pulsing border glow only.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Scroll position preservation on prepend | Manual scroll math | CSS `overflow-anchor: auto` | Browser handles it natively, pixel-perfect |
| Animation timing | JS-driven animations | CSS @property + compositor | Already proven in aurora-shimmer.css, GPU-accelerated |
| Icon library | SVG inline everywhere | lucide-react (already used) | Consistent sizing, tree-shakeable |
| Token formatting | Manual number formatting | Existing `formatTokenCount` utility | Already handles K/M abbreviations |

## Common Pitfalls

### Pitfall 1: Scroll Event Performance
**What goes wrong:** Scroll event fires 60+ times/second, causing layout thrashing if handler reads layout properties (scrollHeight, scrollTop, clientHeight)
**Why it happens:** Reading layout properties forces synchronous layout calculation
**How to avoid:** The scroll handler only needs to compare three cheap properties. These ARE layout-triggering, but since they're read-only (no writes), the browser batches them efficiently. Do NOT wrap in rAF (adds a frame of lag, breaks the "immediate pause" requirement). The 10px threshold comparison is fast enough.
**Warning signs:** Janky scrolling during streaming, visible delay between scrolling up and auto-scroll stopping

### Pitfall 2: Sentinel Div Removal Regression
**What goes wrong:** Current ChatMessagesPane uses `sentinelRef` for the IntersectionObserver. Removing it without updating the auto-scroll useEffect breaks auto-scrolling during streaming.
**Why it happens:** The auto-scroll effect at line 159-166 depends on `isAtBottom` from the old hook. New hook provides same API but driven by scroll events instead.
**How to avoid:** Keep the same return API shape (`isAtBottom`, `isUserScrolledUp`, `scrollToBottom`). Replace `handleUserScroll` (onWheel/onTouchMove) with `handleScroll` (onScroll). Remove `sentinelRef` and the sentinel div.

### Pitfall 3: Aurora Atmosphere Exit vs Grid Collapse
**What goes wrong:** Current PreTokenIndicator uses CSS grid `1fr -> 0fr` for collapse. The new atmospheric aurora needs to fade-up-and-dissolve instead. Mixing both creates a weird squish-then-fade.
**Why it happens:** Two competing exit animations on the same element
**How to avoid:** Replace the grid collapse entirely with the fade-up dissolve. Use `opacity + translateY` for exit, with `grid-template-rows` staying at `1fr` until the fade completes, then unmount.

### Pitfall 4: Token Usage Pie Orphaning
**What goes wrong:** Moving TokenUsagePie from ChatInputControls to StatusLine creates a period where neither component renders it.
**Why it happens:** Components updated separately
**How to avoid:** Implement StatusLine with TokenUsagePie first, then remove from ChatInputControls in the same commit.

### Pitfall 5: Stop Button Race Condition
**What goes wrong:** User clicks stop, abort message sent, but streaming chunks continue arriving for a few hundred milliseconds. The button morphs back to "send" while content is still appearing.
**Why it happens:** WebSocket abort is async. The backend needs time to actually stop.
**How to avoid:** Keep `isLoading` true until `session-aborted` or `claude-complete` message arrives. The existing `handleAbortSession` already does this correctly -- just ensure the stop button morph is driven by `isLoading`, not a separate state.

### Pitfall 6: StatusLine Layout Shift
**What goes wrong:** Status line appears/disappears causing the composer to jump up/down
**Why it happens:** Conditional rendering of the status line
**How to avoid:** Status line is ALWAYS visible (idle and streaming states). It never unmounts. Content changes but container stays. Min-height ensures consistent spacing.

## Code Examples

### Existing rAF Streaming Buffer (useChatRealtimeHandlers.ts, lines 252-265)
```typescript
// STRM-01: Buffer flush every animation frame (~16ms).
streamBufferRef.current += decodedText;
if (!streamTimerRef.current) {
  streamTimerRef.current = requestAnimationFrame(() => {
    const chunk = streamBufferRef.current;
    streamBufferRef.current = '';
    streamTimerRef.current = null;
    appendStreamingChunk(setChatMessages, chunk, false);
  }) as unknown as number;
}
```
**Note:** This already implements rAF batching. For STRM-01 compliance (50-100ms range), consider accumulating for 3-6 frames (~50-100ms at 60fps) using a timestamp check inside the rAF callback rather than flushing every single frame.

### Existing Abort Logic (useChatComposerState.ts, lines 838-865)
```typescript
const handleAbortSession = useCallback(() => {
  if (!canAbortSession) return;
  // ... session ID resolution logic ...
  sendMessage({
    type: 'abort-session',
    sessionId: targetSessionId,
    provider,
  });
}, [canAbortSession, currentSessionId, ...]);
```

### Existing Tool Event Data Source (useChatRealtimeHandlers.ts, lines 321-373)
```typescript
structuredMessageData.content.forEach((part: any) => {
  if (part.type === 'tool_use') {
    // part.name = tool name (e.g., "Read", "Write", "Bash")
    // part.input = tool arguments (e.g., { file_path: "/src/foo.ts" })
    // This is where STRM-11 semantic activity text gets its data
  }
});
```

### Existing CSS Variables for Error States (index.css)
```css
--destructive: 0 50% 50%;            /* #bf4040 -- muted red */
--destructive-foreground: 0 10% 88%;  /* #e4dbd9 -- warm white */
```

### Existing Z-Index Scale (index.css, lines 166-170)
```css
--z-sticky: 10;
--z-dropdown: 20;
--z-scroll-pill: 30;
--z-modal: 50;
```

## Project Tooling

| Tool | Command | Detected From |
|------|---------|---------------|
| Lint | Not detected | No eslint config found |
| Type Check | `npm run typecheck` | package.json scripts |
| Build | `npm run build` | package.json scripts |
| Test | Not detected | No test framework found |

*Already written to `.planning/config.json` under `tooling` key.*

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| IntersectionObserver for scroll tracking | Scroll-event based (user decision) | This phase | More predictable 10px threshold, simpler mental model |
| ClaudeStatus above composer | StatusLine below composer (always visible) | This phase | Persistent dashboard, no flash of empty space |
| Rotating generic status words | Semantic activity from real tool events | This phase | "Reading auth.ts..." instead of "Processing..." |
| Separate turn counter | Message counter | This phase | More accurate "N new messages" count |

## Open Questions

1. **Token count data source for status line**
   - What we know: `claudeStatus.tokens` is available but currently uses fake token counting (line 36-41 of ClaudeStatus.tsx). The `token-budget` WebSocket message provides real usage.
   - What's unclear: Whether real-time token delta per streaming chunk is available from the backend
   - Recommendation: Use `claudeStatus.tokens` if provided by backend status updates, fall back to accumulated chunk character count as estimate

2. **Session cost data source**
   - What we know: `sessionCost` is passed as `null` to ChatInputControls (line 198 of ChatComposer.tsx). The /cost slash command has pricing logic.
   - What's unclear: Whether real-time session cost is tracked anywhere
   - Recommendation: If cost data isn't flowing from backend, show token count only. Cost display can be added when backend provides it.

3. **Extended thinking detection for STRM-05**
   - What we know: `isThinking` flag exists on ChatMessage. ThinkingShimmer renders based on `isThinking` boolean.
   - What's unclear: The exact signal that extended thinking has started vs. the model is just processing
   - Recommendation: Use `claudeStatus.text === 'Thinking'` or similar status update as the trigger, transitioning to collapsed thinking disclosure when the thinking content block arrives

## Sources

### Primary (HIGH confidence)
- Existing codebase files (all paths verified by direct file reads):
  - `src/components/chat/hooks/useScrollAnchor.ts` -- current IntersectionObserver implementation
  - `src/components/chat/hooks/useChatRealtimeHandlers.ts` -- streaming buffer, tool event parsing
  - `src/components/chat/hooks/useChatComposerState.ts` -- abort logic, submit flow
  - `src/components/chat/view/subcomponents/ChatMessagesPane.tsx` -- scroll integration surface
  - `src/components/chat/view/subcomponents/ChatComposer.tsx` -- send button, status placement
  - `src/components/chat/view/subcomponents/PreTokenIndicator.tsx` -- current aurora bar
  - `src/components/chat/view/subcomponents/ThinkingShimmer.tsx` -- thinking text
  - `src/components/chat/view/subcomponents/ReconnectSkeletons.tsx` -- reconnect placeholders
  - `src/components/chat/view/subcomponents/ClaudeStatus.tsx` -- current status bar (to be replaced)
  - `src/components/chat/view/subcomponents/ChatInputControls.tsx` -- TokenUsagePie + cost (to move)
  - `src/components/chat/view/subcomponents/ScrollToBottomPill.tsx` -- scroll pill
  - `src/components/chat/styles/aurora-shimmer.css` -- aurora CSS patterns

### Secondary (MEDIUM confidence)
- CSS overflow-anchor specification (well-supported in all modern browsers)
- CSS @property specification (used successfully in this project already)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new dependencies, all existing patterns
- Architecture: HIGH - direct file reads of all integration points
- Pitfalls: HIGH - identified from reading actual code, not speculation

**Research date:** 2026-03-04
**Valid until:** 2026-04-04 (stable -- internal codebase, no external API changes)
