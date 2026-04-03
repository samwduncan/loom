---
phase: 75-chat-shell
plan: 05
subsystem: ui
tags: [react-native, composer, flatlist, streaming, fsm, reanimated, zustand, websocket]

# Dependency graph
requires:
  - phase: 75-01
    provides: message-segments parser, toast utility
  - phase: 75-03
    provides: TextSegment, CodeBlockSegment, ThinkingSegment segment components
  - phase: 75-04
    provides: ToolChip, ToolDetailSheet, PermissionCard segment components
provides:
  - "Functional Composer with 3-state FSM (idle/sending/active) and WebSocket send/stop"
  - "ComposerStatusBar showing model name + connection dot + token count"
  - "MessageList inverted FlatList with session-keyed remount and scroll stability"
  - "MessageItem role-based dispatch to UserBubble or AssistantMessage"
  - "AssistantMessage segment-based rendering with historical tool call/thinking block support"
  - "UserBubble right-aligned raised surface bubble with entrance animation"
  - "StreamingIndicator 2px pulsing accent line"
  - "DisplayMessage extended with toolCalls + thinkingBlocks (AR fix #5)"
affects: [75-06, chat-screen-wiring, session-management]

# Tech tracking
tech-stack:
  added: []
  patterns: [3-state-composer-fsm, inverted-flatlist-reversal, historical-tool-mapping, stale-closure-safe-timer]

key-files:
  created:
    - mobile/components/chat/Composer.tsx
    - mobile/components/chat/ComposerStatusBar.tsx
    - mobile/components/chat/UserBubble.tsx
    - mobile/components/chat/StreamingIndicator.tsx
    - mobile/components/chat/AssistantMessage.tsx
    - mobile/components/chat/MessageItem.tsx
    - mobile/components/chat/MessageList.tsx
  modified:
    - mobile/hooks/useMessageList.ts

key-decisions:
  - "AR fix #3: 5s fallback timer uses functional updater setComposerState((prev) => ...) to avoid stale closure, cleared on stream start"
  - "AR fix #5: Historical messages carry toolCalls/thinkingBlocks via DisplayMessage; mapToolCallToState converts ToolCall -> ToolCallState in AssistantMessage"
  - "AR fix #9: Explicit [...messages].reverse() before passing to inverted FlatList for unambiguous ordering"
  - "FlatList key={sessionId} forces remount on session switch, preventing stale message flash (Pitfall 7)"

patterns-established:
  - "3-state Composer FSM: idle/sending/active with fallbackTimerRef pattern for stale-closure safety"
  - "Historical vs streaming data branching in AssistantMessage (useMemo per data source)"
  - "Inverted FlatList with explicit reversal pattern for correct message ordering"
  - "Role-based message dispatch via MessageItem with spacing computation"

requirements-completed: [CHAT-02, CHAT-03, CHAT-08, CHAT-09]

# Metrics
duration: 6min
completed: 2026-04-03
---

# Phase 75 Plan 05: Composer + Message Pipeline Summary

**Functional 3-state Composer FSM (idle/sending/active) with stale-closure-safe fallback timer, inverted FlatList message list with session-keyed remount, and segment-based AssistantMessage rendering supporting both live streaming and historical tool calls/thinking blocks**

## Performance

- **Duration:** 6 min
- **Started:** 2026-04-03T23:46:52Z
- **Completed:** 2026-04-03T23:53:02Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments
- Functional Composer replaces visual-only ComposerShell with 3-state FSM, WebSocket send/stop, and haptic feedback
- Complete message rendering pipeline: MessageList -> MessageItem -> UserBubble/AssistantMessage with all 5 segment types
- Historical assistant messages now render tool chips and thinking blocks (not just plain text) via AR fix #5
- DisplayMessage extended to carry toolCalls and thinkingBlocks from persisted Message data

## Task Commits

Each task was committed atomically:

1. **Task 1: Functional Composer with 3-state FSM and StatusBar** - `809f9c1` (feat)
2. **Task 2: Extend DisplayMessage and create UserBubble + StreamingIndicator** - `193531c` (feat)
3. **Task 3: AssistantMessage, MessageItem, and MessageList** - `9712be1` (feat)
4. **Lint fixes** - `ec696da` (fix)

## Files Created/Modified
- `mobile/components/chat/Composer.tsx` - 3-state FSM composer with send/stop toggle, WebSocket messaging, haptics
- `mobile/components/chat/ComposerStatusBar.tsx` - Model name + connection dot + token count status bar
- `mobile/components/chat/UserBubble.tsx` - Right-aligned raised surface bubble with Standard spring entrance
- `mobile/components/chat/StreamingIndicator.tsx` - 2px accent line with 1.5s opacity pulse cycle
- `mobile/components/chat/AssistantMessage.tsx` - Segment-based renderer with historical/streaming data branching
- `mobile/components/chat/MessageItem.tsx` - Role-based dispatch with spacing computation
- `mobile/components/chat/MessageList.tsx` - Inverted FlatList with explicit reversal, session-keyed remount
- `mobile/hooks/useMessageList.ts` - Extended DisplayMessage with toolCalls + thinkingBlocks fields

## Decisions Made
- **AR fix #3 (stale closure):** Used functional updater `setComposerState((prev) => prev === 'sending' ? 'idle' : prev)` in 5s fallback timeout, plus clear timer ref on stream start. Prevents mid-stream idle reset.
- **AR fix #5 (historical data):** AssistantMessage branches between StreamStore (live) and DisplayMessage fields (historical) based on `message.isStreaming`. `mapToolCallToState()` converts persisted `ToolCall` to `ToolCallState` shape for segment components.
- **AR fix #9 (inverted ordering):** Explicit `[...messages].reverse()` before passing to inverted FlatList. Makes the ordering unambiguous -- useMessageList returns oldest-first, FlatList gets newest-first.
- **FlatList session key:** `key={sessionId}` forces complete unmount/remount on session switch, preventing stale message flash from previous session.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed unused imports flagged by expo lint**
- **Found during:** Post-task verification
- **Issue:** `withTiming` unused in Composer.tsx, `theme` unused in MessageList.tsx
- **Fix:** Removed unused imports
- **Files modified:** Composer.tsx, MessageList.tsx
- **Committed in:** ec696da

**2. [Rule 1 - Bug] Stabilized useMemo dependencies in AssistantMessage**
- **Found during:** Post-task lint verification
- **Issue:** `thinkingBlocks` and `toolCalls` conditionals made useMemo deps change every render
- **Fix:** Wrapped both in their own useMemo hooks before passing to parseMessageSegments useMemo
- **Files modified:** AssistantMessage.tsx
- **Committed in:** ec696da

---

**Total deviations:** 2 auto-fixed (2 Rule 1 bugs)
**Impact on plan:** Both fixes necessary for correctness and lint compliance. No scope creep.

## Issues Encountered
None - all tasks completed as planned.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 7 components + 1 hook update complete -- full chat conversation UI pipeline ready
- Plan 06 (screen wiring) can integrate Composer + MessageList into the chat screen route
- ComposerShell.tsx is now superseded but not deleted (Plan 06 will handle the screen refactor)

---
*Phase: 75-chat-shell*
*Completed: 2026-04-03*

## Self-Check: PASSED

All 8 files verified present. All 4 commits verified in git log.
