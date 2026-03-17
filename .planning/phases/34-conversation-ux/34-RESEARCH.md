# Phase 34: Conversation UX - Research

**Researched:** 2026-03-17
**Domain:** Chat message list UX -- auto-collapse + usage footers
**Confidence:** HIGH

## Summary

Phase 34 has two independent feature tracks: (1) auto-collapsing old conversation turns that scroll out of the viewport, and (2) displaying per-turn token usage and cost footers on assistant messages.

The codebase is well-positioned for both. IntersectionObserver is already used for pagination (top sentinel in MessageList.tsx). The `content-visibility: auto` CSS property is already applied on finalized messages via MessageContainer. Token usage data already flows through the system -- the stream multiplexer extracts `ResultTokens` (input/output/cacheRead) and `total_cost_usd` from SDK result messages and stores them in the stream store, and ActiveMessage flushes this data into `MessageMetadata` when finalizing. A `TokenUsage` component already exists and renders in AssistantMessage. However, historical messages loaded from JSONL currently get null token data because `transformBackendMessages` doesn't extract `result` entries from the JSONL.

**Primary recommendation:** Use IntersectionObserver per-message for collapse detection. Enhance TokenUsage to be expandable (collapsed one-liner by default, expandable to show breakdown). For historical messages, the backend JSONL contains `result` type entries with `modelUsage` -- extract and attach to the preceding assistant message during transform.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| UXR-01 | Older conversation turns auto-collapse when scrolled out of viewport | IntersectionObserver per message wrapper; collapse state tracked in local component state or Map ref |
| UXR-02 | Auto-collapsed turns expand on click or scroll-back | Same IO instance detects re-entry; click handler toggles override |
| UXR-03 | Each assistant turn displays usage footer (input/output/cache tokens, cost) | TokenUsage component exists; streaming data already flows; historical data needs JSONL result extraction |
| UXR-04 | Usage footer is collapsible/subtle, doesn't dominate the message | Enhance TokenUsage with expandable detail view; default to compact one-liner |
</phase_requirements>

## Standard Stack

### Core (already in project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React 19 | 19.x | UI framework | Project standard |
| Zustand 5 | 5.x | State management | Project standard (5 stores) |
| IntersectionObserver | Browser API | Viewport detection | Already used for pagination; no library needed |
| CSS content-visibility | Browser CSS | Off-screen rendering skip | Already applied in MessageContainer |

### Supporting (no new dependencies needed)
This phase requires zero new npm dependencies. Everything is achievable with browser APIs and existing project infrastructure.

## Architecture Patterns

### Recommended Project Structure
```
src/src/
  components/chat/view/
    CollapsibleMessage.tsx       # NEW: wrapper that auto-collapses messages
    CollapsibleMessage.test.tsx  # NEW: tests
    TokenUsage.tsx               # MODIFY: add expandable detail
    TokenUsage.test.tsx          # NEW: tests for enhanced TokenUsage
    MessageList.tsx              # MODIFY: wrap messages in CollapsibleMessage
  lib/
    transformMessages.ts         # MODIFY: extract result entries for token data
    transformMessages.test.ts    # Existing: add result-extraction tests
  hooks/
    useAutoCollapse.ts           # NEW: IntersectionObserver hook for collapse logic
    useAutoCollapse.test.ts      # NEW: tests
```

### Pattern 1: IntersectionObserver-based Auto-Collapse

**What:** Each message gets an IntersectionObserver that tracks whether it's in/near the viewport. Messages scrolled far above collapse to a single summary line. Messages scrolled back into view (or clicked) expand.

**When to use:** Any scrollable list where off-screen items should minimize their visual footprint.

**Key design decisions:**

1. **Collapse trigger:** Message must be fully out of viewport AND above the current scroll position (not below -- below means unseen new messages). Use a negative rootMargin like `-100px 0px 0px 0px` (only collapse when 100px+ above viewport top).

2. **State location:** A `Map<string, boolean>` ref (messageId -> isCollapsed) managed by the hook, with a React state counter to trigger re-renders when collapse state changes. NOT Zustand -- this is purely view-layer, ephemeral, and per-component-tree.

3. **User override:** If a user clicks a collapsed message, set a "pinned open" flag for that message. Clear pinned state on session switch.

4. **Don't collapse recent messages:** Only collapse messages that are more than N messages from the bottom (e.g., older than the last 10 messages). This prevents jarring collapses during active conversation.

5. **Collapsed summary format:** Show role icon + first line of content (truncated to ~80 chars) + message timestamp. Single line, compact. Click to expand.

**Example structure:**
```typescript
// useAutoCollapse.ts
interface UseAutoCollapseReturn {
  observeRef: (messageId: string) => (node: HTMLElement | null) => void;
  isCollapsed: (messageId: string) => boolean;
  toggleExpand: (messageId: string) => void;
}
```

### Pattern 2: Expandable TokenUsage Footer

**What:** TokenUsage renders a compact one-line summary by default ("1,234 in / 567 out . $0.012"). Clicking/hovering expands to show breakdown rows (input tokens, output tokens, cache read, cache creation, cost per category).

**When to use:** When metadata is useful but shouldn't compete with message content.

**Key design decisions:**

1. **Default state:** Compact single line, matching current TokenUsage output. Styled with `text-xs text-muted`.

2. **Expanded state:** Show a small detail card below with labeled rows. Use CSS grid transition for smooth height animation (existing pattern from ThinkingDisclosure).

3. **Toggle mechanism:** Click to toggle (not hover -- hover is unreliable on mobile and during scroll). Chevron icon indicates expandability.

4. **Persistence:** Expand state is local component state. No persistence needed.

### Pattern 3: JSONL Result Entry Extraction for Historical Messages

**What:** The backend JSONL stores `result` type entries containing `modelUsage` and `total_cost_usd`. Currently `transformBackendMessages` filters these out (they're not in the `CHAT_ENTRY_TYPES` set). Extract token data from `result` entries and attach to the preceding assistant message.

**When to use:** Whenever loading historical messages from backend.

**Key design decisions:**

1. **Processing order:** After filtering chat entries, make a second pass to find `result` entries. For each `result` entry, find the last preceding assistant message and attach the token data.

2. **Data shape:** `result` entries have `modelUsage: Record<string, { inputTokens, outputTokens, cacheReadInputTokens }>` and `total_cost_usd: number`. Map these to `MessageMetadata.inputTokens/outputTokens/cacheReadTokens/cost`.

3. **Fallback:** If no result entry exists for an assistant message, keep nulls (current behavior). TokenUsage already handles this gracefully (renders nothing).

### Anti-Patterns to Avoid

- **Don't use content-visibility for collapse:** `content-visibility: auto` is already applied. Auto-collapse is a different concern -- it physically reduces the DOM to a summary line, not just skip rendering. Don't confuse the two.

- **Don't collapse during streaming:** Never collapse the ActiveMessage or any message that's actively streaming. Only historical messages are candidates.

- **Don't persist collapse state:** It's ephemeral view state. On session switch or page reload, all messages start expanded. The IntersectionObserver will re-collapse as user scrolls.

- **Don't use a single shared IntersectionObserver:** While tempting for performance, a single observer with multiple thresholds is harder to manage. Per-message observers with `disconnect()` on unmount are simpler and the browser optimizes them internally.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Viewport detection | Manual scroll event + getBoundingClientRect | IntersectionObserver API | Scroll events are janky; IO is async and compositor-thread |
| Number formatting | Custom comma/locale logic | Number.toLocaleString() | Already used in existing TokenUsage |
| Smooth expand/collapse | JS height animation | CSS grid `grid-template-rows: 0fr/1fr` | Pattern from ThinkingDisclosure, GPU-composited |

## Common Pitfalls

### Pitfall 1: Collapse Flicker During Fast Scroll
**What goes wrong:** Messages rapidly toggle collapsed/expanded as user scrolls fast, causing visual noise.
**Why it happens:** IntersectionObserver fires on every threshold crossing.
**How to avoid:** Add a debounce/delay before collapsing (e.g., message must be out of viewport for 500ms before collapsing). Expanding should be instant (no delay).
**Warning signs:** Messages flickering between states during scroll momentum.

### Pitfall 2: Scroll Position Jumps on Collapse
**What goes wrong:** When a message above the viewport collapses, scroll position shifts because scrollHeight changed.
**Why it happens:** The browser preserves scrollTop but the content above shrinks, effectively moving the viewport.
**How to avoid:** Two options: (a) Only collapse messages that are far above viewport (rootMargin buffer), or (b) compensate scrollTop after collapse (same pattern as prepend pagination in MessageList). Option (a) is simpler and preferred.
**Warning signs:** Content "jumping" when messages collapse/expand.

### Pitfall 3: IntersectionObserver in Scrollable Container
**What goes wrong:** IO uses viewport as root by default. MessageList has its own scroll container (overflow-y: auto div), so default viewport detection doesn't work.
**Why it happens:** IO needs `root` set to the scroll container element.
**How to avoid:** Pass the scroll container ref as `root` to the IntersectionObserver. MessageList already passes `scrollContainerRef` -- thread this through to the hook.
**Warning signs:** Messages never collapsing, or collapsing based on window viewport instead of scroll container.

### Pitfall 4: Historical Messages Missing Token Data
**What goes wrong:** TokenUsage shows nothing on historical messages, only on freshly streamed ones.
**Why it happens:** `transformBackendMessages` filters out `result` JSONL entries and doesn't extract their data.
**How to avoid:** Extract `result` entries and attach their data to the preceding assistant message during transformation.
**Warning signs:** Token usage only visible on messages from the current session, never on reloaded/paginated messages.

### Pitfall 5: Memory Leak from Unobserved Elements
**What goes wrong:** IntersectionObservers accumulate without cleanup.
**Why it happens:** Observers created in ref callbacks without disconnect() on unmount.
**How to avoid:** Use useEffect cleanup to disconnect observers. Store observer refs in a Map keyed by messageId, disconnect on component unmount.
**Warning signs:** Growing memory usage in long sessions, DevTools showing hundreds of active observers.

## Code Examples

### Auto-Collapse Hook Pattern
```typescript
// Source: Project patterns (useScrollAnchor, pagination sentinel)
function useAutoCollapse(
  scrollContainerRef: RefObject<HTMLElement | null>,
  messageCount: number,
  collapseThreshold: number = 10,
) {
  const collapsedMap = useRef(new Map<string, boolean>());
  const pinnedMap = useRef(new Set<string>());
  const observerMap = useRef(new Map<string, IntersectionObserver>());
  const [revision, setRevision] = useState(0);

  const observeRef = useCallback((messageId: string, messageIndex: number) => {
    return (node: HTMLElement | null) => {
      // Disconnect existing observer for this message
      observerMap.current.get(messageId)?.disconnect();
      observerMap.current.delete(messageId);

      if (!node || !scrollContainerRef.current) return;

      // Don't observe recent messages
      if (messageIndex >= messageCount - collapseThreshold) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry) return;
          const shouldCollapse = !entry.isIntersecting && !pinnedMap.current.has(messageId);
          const wasCollapsed = collapsedMap.current.get(messageId) ?? false;
          if (shouldCollapse !== wasCollapsed) {
            collapsedMap.current.set(messageId, shouldCollapse);
            setRevision((r) => r + 1);
          }
        },
        { root: scrollContainerRef.current, rootMargin: '200px 0px 0px 0px' },
      );
      observer.observe(node);
      observerMap.current.set(messageId, observer);
    };
  }, [scrollContainerRef, messageCount, collapseThreshold]);

  // Cleanup all observers on unmount
  useEffect(() => {
    return () => {
      observerMap.current.forEach((obs) => obs.disconnect());
    };
  }, []);

  const isCollapsed = useCallback((messageId: string) => {
    void revision; // Use revision to trigger re-renders
    return collapsedMap.current.get(messageId) ?? false;
  }, [revision]);

  const toggleExpand = useCallback((messageId: string) => {
    if (pinnedMap.current.has(messageId)) {
      pinnedMap.current.delete(messageId);
    } else {
      pinnedMap.current.add(messageId);
      collapsedMap.current.set(messageId, false);
    }
    setRevision((r) => r + 1);
  }, []);

  return { observeRef, isCollapsed, toggleExpand };
}
```

### CollapsibleMessage Summary Line
```typescript
// Compact collapsed state for a message
function CollapsedSummary({ message, onClick }: { message: Message; onClick: () => void }) {
  const preview = message.content.split('\n')[0]?.slice(0, 80) ?? '';
  const toolCount = message.toolCalls?.length ?? 0;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 px-4 py-1.5 text-xs text-muted hover:bg-surface-hover rounded transition-colors"
    >
      <span className="shrink-0">{message.role === 'user' ? 'You' : 'Claude'}</span>
      <span className="truncate opacity-70">{preview || '(empty)'}</span>
      {toolCount > 0 && (
        <span className="shrink-0 text-muted/50">{toolCount} tools</span>
      )}
      <ChevronDown className="ml-auto h-3 w-3 shrink-0" />
    </button>
  );
}
```

### JSONL Result Extraction
```typescript
// In transformBackendMessages -- extract result data
function extractResultData(entries: BackendEntry[]): Map<number, { inputTokens: number; outputTokens: number; cacheReadTokens: number; cost: number }> {
  const resultMap = new Map();

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (entry.type !== 'result') continue;

    // Find the last assistant entry index before this result
    // Result entry structure: { type: 'result', modelUsage: {...}, total_cost_usd: number }
    const modelUsage = (entry as any).modelUsage;
    const totalCost = (entry as any).total_cost_usd ?? 0;

    if (!modelUsage) continue;

    const modelKey = Object.keys(modelUsage)[0];
    const data = modelUsage[modelKey];
    if (!data) continue;

    resultMap.set(i, {
      inputTokens: data.inputTokens ?? data.cumulativeInputTokens ?? 0,
      outputTokens: data.outputTokens ?? data.cumulativeOutputTokens ?? 0,
      cacheReadTokens: data.cacheReadInputTokens ?? 0,
      cost: totalCost,
    });
  }

  return resultMap;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| scroll event + getBoundingClientRect | IntersectionObserver | 2019+ | Better perf, async, no layout thrashing |
| display:none for collapse | CSS grid 0fr/1fr animation | 2023+ | Smooth transitions without JS height calc |
| content-visibility: auto | Already applied | M1 Phase 6 | Reduces off-screen rendering cost |

## Open Questions

1. **Collapsed summary content for tool-heavy messages**
   - What we know: Some assistant messages are mostly tool calls with minimal text content
   - What's unclear: Should collapsed summary show "Claude used 12 tools" or the first text line?
   - Recommendation: Show first text line if available, fall back to "N tool calls" summary

2. **Token data for non-Claude providers (Codex, Gemini)**
   - What we know: Codex and Gemini don't send `result` messages with `modelUsage`
   - What's unclear: Whether we should show "no usage data" or hide the footer entirely
   - Recommendation: Render nothing (current TokenUsage behavior) -- provider parity is M5 scope

3. **Cumulative vs per-turn tokens**
   - What we know: Backend `result` entries may have `cumulativeInputTokens` vs `inputTokens`
   - What's unclear: Whether cumulative includes all turns or just the current one
   - Recommendation: Use `cumulativeInputTokens` when available (it's per-API-call totals, not session totals)

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.x + @testing-library/react |
| Config file | `src/vite.config.ts` (vitest section) |
| Quick run command | `cd src && npx vitest run --reporter=verbose` |
| Full suite command | `cd src && npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| UXR-01 | Messages auto-collapse when out of viewport | unit | `cd src && npx vitest run src/src/hooks/useAutoCollapse.test.ts -x` | Wave 0 |
| UXR-02 | Collapsed messages expand on click/scroll-back | unit | `cd src && npx vitest run src/src/components/chat/view/CollapsibleMessage.test.tsx -x` | Wave 0 |
| UXR-03 | Assistant turns display usage footer | unit | `cd src && npx vitest run src/src/components/chat/view/TokenUsage.test.tsx -x` | Wave 0 |
| UXR-04 | Usage footer is collapsible/expandable | unit | `cd src && npx vitest run src/src/components/chat/view/TokenUsage.test.tsx -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `cd src && npx vitest run --reporter=verbose`
- **Per wave merge:** `cd src && npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/src/hooks/useAutoCollapse.test.ts` -- covers UXR-01, UXR-02
- [ ] `src/src/components/chat/view/CollapsibleMessage.test.tsx` -- covers UXR-01, UXR-02
- [ ] `src/src/components/chat/view/TokenUsage.test.tsx` -- covers UXR-03, UXR-04 (enhance existing if present)
- [ ] `src/src/lib/transformMessages.test.ts` -- add result-entry extraction tests (file exists, add cases)

## Sources

### Primary (HIGH confidence)
- Project codebase: `src/src/components/chat/view/MessageList.tsx` -- existing IO pagination pattern
- Project codebase: `src/src/components/chat/view/MessageContainer.tsx` -- content-visibility already applied
- Project codebase: `src/src/components/chat/view/TokenUsage.tsx` -- existing token display
- Project codebase: `src/src/components/chat/view/ActiveMessage.tsx` -- result data flush to timeline
- Project codebase: `src/src/lib/stream-multiplexer.ts` -- result extraction from SDK messages
- Project codebase: `src/src/types/message.ts` -- MessageMetadata shape with token fields
- Project codebase: `server/claude-sdk.js` -- backend result message structure with modelUsage

### Secondary (MEDIUM confidence)
- MDN IntersectionObserver API documentation -- root/rootMargin behavior in scrollable containers

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new deps, all existing project tech
- Architecture: HIGH - patterns mirror existing code (IO for pagination, TokenUsage component)
- Pitfalls: HIGH - scroll position compensation pattern already solved in pagination code

**Research date:** 2026-03-17
**Valid until:** 2026-04-17 (stable -- browser APIs, no moving targets)
