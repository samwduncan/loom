# Phase 29: Session Hardening - Research

**Researched:** 2026-03-13
**Domain:** Session management, message pagination, streaming indicators, optimistic ID reconciliation
**Confidence:** HIGH

## Summary

Phase 29 addresses three distinct session management improvements: paginated message loading for long conversations (SESS-01), streaming activity indicators in the sidebar (SESS-02), and robust temporary-to-real session ID transition (SESS-03).

The backend already supports paginated message fetching via `limit` and `offset` query params on `GET /api/projects/:projectName/sessions/:sessionId/messages`, returning `{ messages, total, hasMore, offset, limit }`. The frontend currently fetches all messages at once with no pagination. The stub session pattern for new chats already exists in `ChatComposer.tsx` and `websocket-init.ts` but has edge cases (URL with `stub-` prefix visible to user, no URL bar update on reconciliation failure).

**Primary recommendation:** Implement reverse-chronological pagination (load newest messages first, fetch older on scroll-up), add a streaming pulse indicator to `SessionItem`, and harden the existing stub-to-real session ID reconciliation with proper error handling.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SESS-01 | User can load earlier messages in long conversations (paginated history) | Backend pagination API exists (`limit`/`offset` on messages endpoint). Frontend needs: initial fetch with limit, scroll-up detection via IntersectionObserver, prepend-and-preserve-scroll pattern, `hasMore` state tracking. |
| SESS-02 | Sidebar shows a processing indicator on sessions with active streaming | Stream store has `isStreaming` + `activeSessionId`. SessionItem needs a new `isStreaming` prop. CSS pulse animation on a dot indicator. Backend `active-sessions` WS message can sync on reconnect. |
| SESS-03 | New sessions use a temporary ID that's replaced by the backend-assigned ID after first response | Stub pattern exists (`stub-` prefix in ChatComposer + reconciliation in websocket-init.ts `onSessionCreated`). Needs hardening: `window.history.replaceState` already works but needs error fallback, localStorage draft key migration, and timeline store `replaceSessionId` action for atomic swap instead of add+copy+remove. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19 | UI framework | Already in project |
| Zustand | 5 | State management (timeline, stream stores) | Already in project, selector-only pattern |
| Vitest | latest | Testing | Already configured with jsdom |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| IntersectionObserver | Web API | Scroll-up detection for pagination trigger | SESS-01: detect when user scrolls to top |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| IntersectionObserver | scroll event + threshold | IO is more performant (off-main-thread), no debounce needed |
| Virtual scrolling (react-window) | Flat list rendering | Overkill for this phase. Virtual scrolling is Phase 37 (PERF) territory. Pagination alone solves the load time problem. |

## Architecture Patterns

### Pattern 1: Reverse-Chronological Pagination (SESS-01)

**What:** Load the most recent N messages first, then fetch older pages on scroll-up.

**When to use:** When conversations can be 500+ messages but users typically care about recent context.

**How it works with the backend:**
The backend's pagination already works in reverse: `offset=0` gives the most recent `limit` messages, `offset=50` gives the next 50 older ones. The `startIndex = Math.max(0, total - offset - limit)` calculation in `server/projects.js:1012` confirms this.

**Frontend implementation pattern:**
```typescript
// In useSessionSwitch or a new usePaginatedMessages hook:
// 1. Initial fetch: GET /messages?limit=50&offset=0 -> most recent 50
// 2. Store { hasMore, total } alongside messages
// 3. On scroll-up trigger: GET /messages?limit=50&offset=currentMessages.length
// 4. Prepend older messages to the beginning of the array
```

**Scroll position preservation:**
When prepending messages, the scroll position jumps because new DOM nodes are added above. Fix with:
```typescript
// Before prepend:
const scrollContainer = scrollRef.current;
const prevScrollHeight = scrollContainer.scrollHeight;
const prevScrollTop = scrollContainer.scrollTop;

// After prepend (in useLayoutEffect):
const heightDelta = scrollContainer.scrollHeight - prevScrollHeight;
scrollContainer.scrollTop = prevScrollTop + heightDelta;
```

### Pattern 2: Streaming Indicator in Sidebar (SESS-02)

**What:** A pulsing dot on the SessionItem that's currently streaming.

**How it connects:**
- `useStreamStore` has `isStreaming` and `activeSessionId`
- `SessionList` already subscribes to `useTimelineStore` for sessions
- Add a selector for streaming session ID, pass as prop to SessionItem

**Indicator design:** A small animated dot (similar to the existing draft dot but with pulse animation). Use CSS `@keyframes` pulse with `--accent-primary` color, respecting `prefers-reduced-motion`.

### Pattern 3: Stub-to-Real ID Reconciliation (SESS-03)

**What:** The existing pattern where ChatComposer creates a `stub-*` session, and `onSessionCreated` in websocket-init.ts swaps it to the real ID.

**Current flow (already implemented):**
1. User sends first message with no active session
2. ChatComposer creates `stub-{random}` session, navigates to `/chat/stub-{random}`
3. Backend creates real session, sends `session-created` WS message with real ID
4. `onSessionCreated` copies stub messages to real session, removes stub, calls `window.history.replaceState`

**What needs hardening:**
- Replace add+copy+remove with atomic `replaceSessionId` action in timeline store
- Handle race condition: what if user sends a second message before `session-created` arrives?
- Handle failure: what if `session-created` never arrives (WS disconnect during new chat)?
- Migrate draft persistence key from stub ID to real ID
- ChatView's `effectiveSessionId` derivation already handles `stub-` prefix correctly

### Anti-Patterns to Avoid

- **Loading ALL messages then paginating client-side:** Defeats the purpose. Always paginate at the API level.
- **Using `content-visibility: auto` as a substitute for pagination:** `content-visibility` helps rendering perf but doesn't solve load time for 500+ messages fetched over the network.
- **Subscribing to stream store per-SessionItem:** Would cause N re-renders. Subscribe once in SessionList and pass `isStreaming` as a prop.
- **Using React Router navigation for stub->real swap:** `window.history.replaceState` is correct -- avoids triggering useEffect chains and double-fetches.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Scroll-up detection | Manual scroll event + threshold | IntersectionObserver on a sentinel div at top of message list | Off-main-thread, no debounce, clean API |
| Scroll position preservation on prepend | Custom scroll restoration lib | Manual scrollHeight delta calculation in useLayoutEffect | Simple, well-understood, 5 lines of code |
| Pulse animation | JS-driven animation | CSS `@keyframes` with design tokens | GPU-composited, respects `prefers-reduced-motion` |

## Common Pitfalls

### Pitfall 1: Scroll Jump on Message Prepend
**What goes wrong:** Adding messages above the current viewport causes `scrollTop` to remain the same while `scrollHeight` increases, making the user's view jump up.
**Why it happens:** Browser maintains `scrollTop` from top, not from bottom.
**How to avoid:** Capture `scrollHeight` before prepend, compute delta after React commits DOM (in `useLayoutEffect`), adjust `scrollTop` by the delta.
**Warning signs:** User reports being "teleported" to different messages when scrolling up in long conversations.

### Pitfall 2: Infinite Pagination Loop
**What goes wrong:** Scroll-up trigger fires repeatedly, fetching the same page multiple times.
**Why it happens:** IntersectionObserver fires while the fetch is in-flight, and the sentinel is still visible.
**How to avoid:** Gate pagination fetch with a `isFetchingMore` flag. Disconnect/ignore observer while fetching. Only reconnect after prepend is complete and scroll position is restored.
**Warning signs:** Network tab shows repeated identical requests.

### Pitfall 3: Duplicate Messages on Pagination
**What goes wrong:** Messages appear twice when pagination response overlaps with already-loaded messages.
**Why it happens:** Backend offset is based on total count, which may change between requests (new messages arriving during pagination).
**How to avoid:** Deduplicate by message ID (or entry UUID) before prepending. Use a Set of existing IDs.
**Warning signs:** Same message rendered twice in the list.

### Pitfall 4: Streaming Indicator Stale After Reconnect
**What goes wrong:** Sidebar shows streaming indicator for a session that's no longer active after a WS reconnect.
**Why it happens:** Stream store state isn't synced with backend on reconnect.
**How to avoid:** The `handleOpen` in `websocket-client.ts` already sends `get-active-sessions` on reconnect. Wire `onActiveSessions` callback to update a "streaming session IDs" set. Currently it's a no-op stub.
**Warning signs:** Perpetual spinning indicator on a session that completed while disconnected.

### Pitfall 5: Stub Session Leak
**What goes wrong:** `stub-*` sessions remain in the timeline store forever if `session-created` never arrives.
**Why it happens:** WS disconnect during new chat creation, or backend error before session creation.
**How to avoid:** Add a timeout (e.g., 30 seconds) that cleans up stale stub sessions. Or clean up on `claude-error` events.
**Warning signs:** Sidebar accumulates "New Chat" entries with stub IDs that can't be loaded.

## Code Examples

### Pagination Sentinel (IntersectionObserver at top of list)
```typescript
// In MessageList.tsx, add a sentinel div at the TOP of the message list
// Source: Web Platform API (IntersectionObserver)

const topSentinelRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  if (!topSentinelRef.current || !hasMore) return;

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry?.isIntersecting && !isFetchingMore) {
        onLoadMore(); // triggers fetch of older messages
      }
    },
    { root: scrollRef.current, rootMargin: '200px 0px 0px 0px' }
  );

  observer.observe(topSentinelRef.current);
  return () => observer.disconnect();
}, [hasMore, isFetchingMore, onLoadMore]);

// In the JSX:
// <div ref={topSentinelRef} className="h-px" aria-hidden="true" />
// {isFetchingMore && <LoadingSpinner />}
// {messages.map(...)}
// <div ref={bottomSentinelRef} ... />
```

### Timeline Store: replaceSessionId Action
```typescript
// In timeline.ts, add an atomic session ID replacement action
replaceSessionId: (oldId: string, newId: string) => {
  set((state) => {
    const session = state.sessions.find((s) => s.id === oldId);
    if (session) {
      session.id = newId;
    }
    if (state.activeSessionId === oldId) {
      state.activeSessionId = newId;
    }
  });
},
```

### Streaming Pulse CSS
```css
/* In sidebar.css */
@keyframes session-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.session-streaming-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--accent-primary);
  animation: session-pulse 1.5s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .session-streaming-dot {
    animation: none;
    opacity: 0.7;
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Fetch all messages at once | Paginate with limit/offset | Backend already supports it | Frontend needs to adopt |
| No streaming indicator in sidebar | Pulse dot on active session | This phase | Visual feedback for background activity |
| stub- prefix visible in URL | history.replaceState swap | Already partially implemented | Needs hardening for edge cases |

## Open Questions

1. **Page size for initial load**
   - What we know: Backend supports any limit value. 50 is a reasonable default.
   - What's unclear: What's the typical message count for "long" conversations in this app? JSONL entries != displayable messages (many are filtered out by `transformBackendMessages`).
   - Recommendation: Start with `limit=100` for initial load (gives plenty of context), `limit=50` for subsequent pages. Can tune later.

2. **Loading indicator placement for pagination**
   - What we know: Need visual feedback when loading older messages.
   - What's unclear: Should it be a skeleton, spinner, or inline text?
   - Recommendation: Small centered spinner at the top of the message list, consistent with the existing `MessageListSkeleton` visual language but smaller.

3. **Active sessions sync on reconnect**
   - What we know: `onActiveSessions` callback exists but is a no-op. Backend sends `active-sessions` response with `{ claude: string[], codex: string[], gemini: string[] }`.
   - What's unclear: Should we store streaming state per-session in the timeline store, or keep it in stream store?
   - Recommendation: Keep stream store's `isStreaming` + `activeSessionId` as the primary source. Use `onActiveSessions` only to reconcile stale state on reconnect.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest + jsdom |
| Config file | `src/vite.config.ts` (vitest section) |
| Quick run command | `cd src && npx vitest run --reporter=verbose` |
| Full suite command | `cd src && npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SESS-01 | Paginated message loading on scroll-up | unit | `cd src && npx vitest run src/hooks/usePaginatedMessages.test.ts -x` | Wave 0 |
| SESS-01 | Scroll position preserved on prepend | unit | `cd src && npx vitest run src/components/chat/view/MessageList.test.ts -x` | Wave 0 (new test file for MessageList) |
| SESS-01 | hasMore=false hides load trigger | unit | `cd src && npx vitest run src/hooks/usePaginatedMessages.test.ts -x` | Wave 0 |
| SESS-02 | Streaming dot appears for active session | unit | `cd src && npx vitest run src/components/sidebar/SessionItem.test.tsx -x` | Exists (needs new tests) |
| SESS-02 | Streaming dot disappears when stream ends | unit | `cd src && npx vitest run src/components/sidebar/SessionList.test.tsx -x` | Exists (needs new tests) |
| SESS-03 | replaceSessionId atomic swap | unit | `cd src && npx vitest run src/stores/timeline.test.ts -x` | Exists (needs new tests) |
| SESS-03 | Stub cleanup on timeout/error | unit | `cd src && npx vitest run src/lib/websocket-init.test.ts -x` | Exists (needs new tests) |
| SESS-03 | URL updates from stub to real ID | unit | `cd src && npx vitest run src/components/chat/composer/ChatComposer.test.tsx -x` | Exists (needs new tests) |

### Sampling Rate
- **Per task commit:** `cd src && npx vitest run --reporter=verbose`
- **Per wave merge:** `cd src && npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/src/hooks/usePaginatedMessages.test.ts` -- covers SESS-01 pagination hook
- [ ] MessageList needs a test file (`src/src/components/chat/view/MessageList.test.tsx`) -- covers SESS-01 scroll behavior

## Sources

### Primary (HIGH confidence)
- Codebase inspection: `server/projects.js:929-1028` -- backend pagination implementation
- Codebase inspection: `server/index.js:498-520` -- messages endpoint with limit/offset parsing
- Codebase inspection: `src/src/stores/timeline.ts` -- session/message state management
- Codebase inspection: `src/src/lib/websocket-init.ts` -- stub session reconciliation
- Codebase inspection: `src/src/components/chat/composer/ChatComposer.tsx` -- stub creation flow
- Codebase inspection: `src/src/hooks/useSessionSwitch.ts` -- session switching with fetch
- Codebase inspection: `src/src/components/sidebar/SessionItem.tsx` -- current session item rendering
- Web Platform: IntersectionObserver API (stable, widely supported)

### Secondary (MEDIUM confidence)
- Scroll restoration pattern (useLayoutEffect + scrollHeight delta) -- standard React pattern

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all tools already in project, no new dependencies needed
- Architecture: HIGH -- backend pagination API already exists, frontend patterns are well-established
- Pitfalls: HIGH -- identified from direct codebase analysis and common React scroll patterns

**Research date:** 2026-03-13
**Valid until:** 2026-04-13 (stable patterns, no external dependencies changing)
