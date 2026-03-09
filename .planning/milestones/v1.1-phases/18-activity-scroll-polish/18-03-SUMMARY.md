---
phase: 18-activity-scroll-polish
plan: 03
subsystem: ui
tags: [react, zustand, websocket, streaming, tw-animate-css, tokens, cost]

requires:
  - phase: 18-01
    provides: StatusLine activity indicator and StreamingCursor
  - phase: 18-02
    provides: Scroll position preservation and unread badge
provides:
  - TokenUsage component displaying per-message token count and cost
  - Token/cost data pipeline from SDKResultMessage through multiplexer to message metadata
  - Message entrance animations with new-message detection
affects: []

tech-stack:
  added: []
  patterns:
    - "Token data pipeline: multiplexer -> stream store -> ActiveMessage flush -> MessageMetadata"
    - "Adjust-state-during-rendering for animation index tracking (react-hooks/refs compliance)"

key-files:
  created:
    - src/src/components/chat/view/TokenUsage.tsx
  modified:
    - src/src/types/message.ts
    - src/src/stores/stream.ts
    - src/src/lib/stream-multiplexer.ts
    - src/src/lib/websocket-init.ts
    - src/src/components/chat/view/ActiveMessage.tsx
    - src/src/components/chat/view/AssistantMessage.tsx
    - src/src/components/chat/view/MessageList.tsx
    - src/src/lib/transformMessages.ts
    - src/src/components/chat/composer/ChatComposer.tsx

key-decisions:
  - "Extend MessageMetadata with inputTokens/outputTokens/cacheReadTokens for granular display"
  - "Extract token data from SDKResultMessage.modelUsage (sum across models) not assistant message usage"
  - "Adjust-state-during-rendering for animation base index (avoids react-hooks/refs render access)"

patterns-established:
  - "onResultData callback in multiplexer for post-stream metadata"
  - "Adjust-state-during-rendering for tracking previous counts across renders"

requirements-completed: [ACT-05, DEP-06, POL-01]

duration: 6min
completed: 2026-03-08
---

# Phase 18 Plan 03: Token/Cost Display and Entrance Animations Summary

**Token/cost data pipeline from SDK result messages to formatted "X in / Y out . $Z" display, plus fade+slide entrance animations for newly appended messages**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-08T22:06:23Z
- **Completed:** 2026-03-08T22:13:00Z
- **Tasks:** 2
- **Files modified:** 19

## Accomplishments
- Token/cost data flows from SDKResultMessage through multiplexer to stream store, picked up during ActiveMessage flush into MessageMetadata
- TokenUsage component renders formatted token counts with cost below each finalized assistant message
- New messages animate in with fade + slide-from-bottom (200ms), suppressed on initial load and session switch
- prefers-reduced-motion respected via motion-safe: Tailwind prefix (POL-01)

## Task Commits

Each task was committed atomically:

1. **Task 1: Token data pipeline + TokenUsage component + AssistantMessage integration** - `3577a35` (feat)
2. **Task 2: Message entrance animations with new-message detection** - `9ff9394` (feat)

## Files Created/Modified
- `src/src/components/chat/view/TokenUsage.tsx` - Formatted token/cost display component
- `src/src/types/message.ts` - Extended MessageMetadata with inputTokens, outputTokens, cacheReadTokens
- `src/src/stores/stream.ts` - Added resultTokens/resultCost state and setResultData action
- `src/src/lib/stream-multiplexer.ts` - Extract token usage from SDKResultMessage.modelUsage, onResultData callback
- `src/src/lib/websocket-init.ts` - Wire onResultData callback to stream store
- `src/src/components/chat/view/ActiveMessage.tsx` - Read result data during flush into message metadata
- `src/src/components/chat/view/AssistantMessage.tsx` - Integrate TokenUsage below message content
- `src/src/components/chat/view/MessageList.tsx` - Entrance animation with new-message detection
- `src/src/lib/transformMessages.ts` - Updated metadata constructions for new fields
- `src/src/components/chat/composer/ChatComposer.tsx` - Updated metadata constructions for new fields
- `src/src/components/dev/ProofOfLife.tsx` - Updated metadata construction for new fields
- 8 test files updated for new MessageMetadata fields

## Decisions Made
- Extended MessageMetadata with separate inputTokens/outputTokens/cacheReadTokens rather than just a total, since the TokenUsage display needs granular breakdown
- Extract token data from result message modelUsage (authoritative, includes cost) rather than partial assistant message usage
- Used adjust-state-during-rendering pattern for animation index tracking to satisfy react-hooks/refs ESLint rule that blocks ref access during render

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added onResultData mock to multiplexer test**
- **Found during:** Task 1 (token data pipeline)
- **Issue:** stream-multiplexer.test.ts mock callbacks didn't include new onResultData, causing TypeError
- **Fix:** Added `onResultData: vi.fn()` to createMockCallbacks
- **Files modified:** src/src/lib/stream-multiplexer.test.ts
- **Verification:** All 676 tests pass
- **Committed in:** 3577a35 (Task 1 commit)

**2. [Rule 3 - Blocking] Updated all MessageMetadata constructions with new fields**
- **Found during:** Task 1 (type extension)
- **Issue:** Adding inputTokens/outputTokens/cacheReadTokens to MessageMetadata type broke all existing metadata object literals
- **Fix:** Added null initializers for new fields across transformMessages, ChatComposer, ProofOfLife, and 8 test files
- **Files modified:** 11 files total
- **Verification:** TypeScript compilation passes, all 676 tests pass
- **Committed in:** 3577a35 (Task 1 commit)

**3. [Rule 1 - Bug] Converted ref-based animation tracking to state-based**
- **Found during:** Task 2 (entrance animations)
- **Issue:** react-hooks/refs ESLint rule blocked ref access during render for computing newStartIndex
- **Fix:** Used adjust-state-during-rendering pattern (setState during render with guards) instead of refs
- **Files modified:** src/src/components/chat/view/MessageList.tsx
- **Verification:** ESLint passes, all tests pass
- **Committed in:** 9ff9394 (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (1 bug, 2 blocking)
**Impact on plan:** All auto-fixes necessary for correctness and compilation. No scope creep.

## Issues Encountered
None beyond the auto-fixed deviations above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 18 (Activity, Scroll, Polish) is now complete with all 3 plans shipped
- Token/cost display, entrance animations, scroll position, activity indicators all operational
- Ready for Phase 19 or milestone completion

---
*Phase: 18-activity-scroll-polish*
*Completed: 2026-03-08*
