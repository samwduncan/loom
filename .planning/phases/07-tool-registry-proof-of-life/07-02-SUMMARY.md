---
phase: 07-tool-registry-proof-of-life
plan: 02
subsystem: ui, streaming
tags: [react, zustand, websocket, raf, streaming, proof-of-life]

# Dependency graph
requires:
  - phase: 07-tool-registry-proof-of-life/01
    provides: "Tool registry, ToolChip, ToolCard, ThinkingDisclosure components"
  - phase: 06-streaming-engine-scroll
    provides: "useStreamBuffer, useScrollAnchor, ScrollToBottomPill, ActiveMessage"
  - phase: 05-websocket-bridge-multiplexer
    provides: "WebSocket client, stream multiplexer, websocket-init"
provides:
  - "Multi-span ActiveMessage with tool chip interleaving during streaming"
  - "useStreamBuffer checkpoint() for span switching"
  - "Proof-of-life page demonstrating entire M1 pipeline end-to-end"
  - "Double-init guard on websocket-init preventing duplicate connections"
affects: [08-navigation-session-management]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Segment array architecture for interleaved tool chips in streaming text"
    - "Buffer checkpoint/offset pattern for multi-span rAF painting"
    - "Render-body state adjustment (not useEffect) for React 19 ESLint compliance"
    - "Module-scoped init guard for React strict mode double-mount protection"
    - "Stable empty array constant to prevent Zustand v5 infinite re-render"

key-files:
  created:
    - src/src/components/dev/ProofOfLife.tsx
    - src/src/components/dev/ProofOfLife.test.tsx
    - src/src/components/dev/proof-of-life.css
  modified:
    - src/src/hooks/useStreamBuffer.ts
    - src/src/hooks/useStreamBuffer.test.ts
    - src/src/components/chat/view/ActiveMessage.tsx
    - src/src/components/chat/view/ActiveMessage.test.tsx
    - src/src/lib/websocket-init.ts
    - src/src/lib/websocket-init.test.ts
    - src/src/lib/stream-multiplexer.ts
    - src/src/stores/stream.ts
    - src/src/App.tsx

key-decisions:
  - "Segment array architecture: ActiveMessage renders interleaved text spans + ToolChip components, rAF paints to current active span only"
  - "Buffer checkpoint/offset: useStreamBuffer.checkpoint() advances offset so new spans only show post-checkpoint characters"
  - "Render-body tool detection: detect new tool calls in render body (not useEffect) to avoid React 19 set-state-in-effect ESLint rule"
  - "Module-scoped isInitialized flag in websocket-init.ts prevents double-init from React strict mode"
  - "Stable EMPTY_MESSAGES constant prevents Zustand v5 useSyncExternalStore infinite re-render loop"
  - "Math.random().toString(36) for IDs instead of crypto.randomUUID (fails over plain HTTP)"
  - "activeSessionId added to stream store to track backend-assigned session IDs separately from local IDs"

patterns-established:
  - "Multi-span segment pattern: array of {type:'text'|'tool'} segments rendered dynamically"
  - "Buffer checkpoint pattern: checkpoint() + bufferOffset for text partitioning across spans"
  - "Constructor function mock pattern for IntersectionObserver: vi.fn(function MockIO(this, cb) {...})"
  - "Stable empty array constant for Zustand v5 selectors that may return undefined"

requirements-completed: [STRM-04]

# Metrics
duration: 49min
completed: 2026-03-06
---

# Phase 7 Plan 02: ActiveMessage Multi-Span Refactor + Proof-of-Life Summary

**Multi-span ActiveMessage with segment-based tool chip interleaving, plus proof-of-life page demonstrating complete M1 pipeline end-to-end -- WebSocket to streaming tokens to thinking blocks to scroll anchoring**

## Performance

- **Duration:** 49 min
- **Started:** 2026-03-06T17:10:05Z
- **Completed:** 2026-03-06T17:59:00Z
- **Tasks:** 3 (2 auto + 1 checkpoint)
- **Files modified:** 12

## Accomplishments
- ActiveMessage refactored from single text span to segment array architecture, interleaving ToolChip components at their chronological streaming position
- useStreamBuffer extended with checkpoint()/bufferOffset pattern enabling zero-re-render text partitioning across multiple spans
- Proof-of-life page at /dev/proof-of-life demonstrates entire M1 pipeline: WebSocket connection, real-time token streaming, thinking blocks, tool chips, connection status, scroll anchoring
- Double-init guard prevents duplicate WebSocket connections from React strict mode double-mounts
- Human-verified end-to-end: streaming works, thinking blocks display, conversation accumulates, scroll anchor and pill work, send/stop functional

## Task Commits

Each task was committed atomically:

1. **Task 1: ActiveMessage multi-span refactor + useStreamBuffer checkpoint + double-init guard** - `1548977` (feat)
2. **Task 2: Proof-of-life page with end-to-end streaming demo** - `2d7c6e4` (feat)
3. **Task 3: Human-verify checkpoint** - Approved by user

Post-checkpoint bug fixes (committed by orchestrator):
- `3452851` (fix): Replace crypto.randomUUID with Math.random fallback for plain HTTP
- `77c9c54` (fix): Fix proof-of-life session management and ActiveMessage finalization

## Files Created/Modified
- `src/src/components/dev/ProofOfLife.tsx` - End-to-end streaming demo page composing all M1 subsystems
- `src/src/components/dev/ProofOfLife.test.tsx` - 8 smoke tests for proof-of-life page
- `src/src/components/dev/proof-of-life.css` - Full-page layout with design tokens, status dot pulse animation
- `src/src/hooks/useStreamBuffer.ts` - Added bufferOffsetRef and checkpoint() method for multi-span support
- `src/src/hooks/useStreamBuffer.test.ts` - 5 new tests for checkpoint behavior (15 total)
- `src/src/components/chat/view/ActiveMessage.tsx` - Rewritten with segment array architecture (text + tool interleaving)
- `src/src/components/chat/view/ActiveMessage.test.tsx` - 12 tests covering segments, streaming, finalization, thinking
- `src/src/lib/websocket-init.ts` - Double-init guard + _resetInitForTesting() + onSessionCreated callback
- `src/src/lib/websocket-init.test.ts` - Added _resetInitForTesting() in beforeEach
- `src/src/lib/stream-multiplexer.ts` - Math.random fallback for tool call ID generation
- `src/src/stores/stream.ts` - Added activeSessionId field and setter
- `src/src/App.tsx` - Added /dev/proof-of-life route

## Decisions Made
- **Segment array architecture**: ActiveMessage renders `Segment[]` of interleaved text spans and ToolChip components. rAF paints only to the current active text span via `currentTextRef`. Re-renders happen only when tool calls arrive (segment array changes), not on every token.
- **Buffer checkpoint/offset pattern**: `useStreamBuffer.checkpoint()` sets `bufferOffsetRef = buffer.length`. Paint function writes `buffer.slice(offset)`. `getText()` still returns full buffer for flush. Clean separation of concerns.
- **Render-body state adjustment**: Tool call detection uses `if (toolCallCount > knownToolCountRef.current)` in the render body (React pattern for adjusting state during rendering) instead of useEffect, satisfying React 19's `set-state-in-effect` ESLint rule.
- **Module-scoped init flag**: `let isInitialized = false` in websocket-init.ts checked at function entry. Exported `_resetInitForTesting()` for test isolation.
- **Stable empty array constant**: `const EMPTY_MESSAGES: Message[] = []` at module level prevents Zustand v5 infinite re-render from `?? []` creating new references.
- **Math.random over crypto.randomUUID**: `crypto.randomUUID()` throws on non-HTTPS origins. Replaced with `Math.random().toString(36).slice(2, 10)` for local dev compatibility.
- **activeSessionId in stream store**: Backend assigns its own sessionId on first message. Track separately from local timeline session ID to support correct `--resume` behavior.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] crypto.randomUUID fails on plain HTTP**
- **Found during:** Post-checkpoint verification
- **Issue:** `crypto.randomUUID()` is only available in secure contexts (HTTPS). Dev server uses plain HTTP, causing runtime crash.
- **Fix:** Replaced with `Math.random().toString(36).slice(2, 10)` in ActiveMessage.tsx, ProofOfLife.tsx, and stream-multiplexer.ts
- **Files modified:** src/src/components/chat/view/ActiveMessage.tsx, src/src/components/dev/ProofOfLife.tsx, src/src/lib/stream-multiplexer.ts
- **Verification:** Page loads and generates IDs correctly over HTTP
- **Committed in:** `3452851`

**2. [Rule 1 - Bug] Session management: first message sent nonexistent sessionId**
- **Found during:** Post-checkpoint verification
- **Issue:** ProofOfLife sent `sessionId` in first message, causing backend to attempt `--resume` of a session that doesn't exist. Backend creates its own sessionId but it wasn't tracked.
- **Fix:** First message sent without sessionId. Added `activeSessionId` field to stream store. `onSessionCreated` callback in websocket-init.ts captures backend-assigned ID. Subsequent messages use the real backend sessionId.
- **Files modified:** src/src/components/dev/ProofOfLife.tsx, src/src/lib/websocket-init.ts, src/src/stores/stream.ts
- **Verification:** First message creates new session, subsequent messages resume correctly
- **Committed in:** `77c9c54`

**3. [Rule 1 - Bug] ActiveMessage unmounting before flush completes**
- **Found during:** Post-checkpoint verification
- **Issue:** ActiveMessage was unmounting during finalization (isStreaming became false), preventing the flush callback from completing and losing the streamed text.
- **Fix:** Keep ActiveMessage mounted during finalization by checking both `isStreaming` and a finalization-in-progress flag.
- **Files modified:** src/src/components/dev/ProofOfLife.tsx
- **Verification:** Response text persists after streaming completes
- **Committed in:** `77c9c54`

---

**Total deviations:** 3 auto-fixed (all Rule 1 - Bug)
**Impact on plan:** All fixes necessary for correct operation. No scope creep. Bugs only discoverable through real end-to-end testing (which is exactly what the proof-of-life page is for).

## Issues Encountered
- **ESLint `set-state-in-effect` on `setSegments`**: React 19 rule prohibits setState inside useEffect. Moved tool call detection to render body using React's "adjusting state during rendering" pattern with a guard ref.
- **websocket-init tests failing after init guard**: Module-scoped `isInitialized` persisted between test runs. Solved with `_resetInitForTesting()` export called in beforeEach.
- **IntersectionObserver mock "is not a constructor"**: Arrow function mocks lack `[[Construct]]`. Fixed with `vi.fn(function MockIO(this, cb) {...})` constructor function pattern.
- **Zustand v5 infinite re-render loop**: Timeline store selector `?? []` created new array reference each render, triggering useSyncExternalStore infinite loop. Fixed with stable module-level `EMPTY_MESSAGES` constant.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All M1 subsystems proven working end-to-end: tokens -> enforcement -> shell -> state -> websocket -> streaming -> tool registry -> proof-of-life
- Phase 7 complete: tool registry with 6 registered tools + default fallback, proof-of-life vertical slice verified
- Phase 8 (Navigation + Session Management) is the final M1 phase: sidebar with session list, session switching, URL routing
- No blockers or concerns for Phase 8

---
*Phase: 07-tool-registry-proof-of-life*
*Completed: 2026-03-06*

## Self-Check: PASSED

All 12 claimed files verified present. All 4 commit hashes verified in git log.
