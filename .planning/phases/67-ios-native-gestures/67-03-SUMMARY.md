---
phase: 67-ios-native-gestures
plan: 03
subsystem: ui
tags: [context-menu, radix, clipboard, share, retry, haptics, long-press, ios, gesture]

# Dependency graph
requires:
  - phase: 67-ios-native-gestures
    provides: "hapticEvent(), nativeClipboardWrite(), nativeShare() from Plan 01"
  - phase: 65-touch-target-compliance
    provides: "Radix context-menu.tsx shadcn component"
provides:
  - "MessageContextMenu component wrapping message bubbles with Copy Text, Retry, Share"
  - "Working retry mechanism re-sending last user message via WebSocket"
  - "Context menu integration on UserMessage and AssistantMessage"
affects: [67-04, visual-polish, message-interactions]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Radix ContextMenu wrapper pattern for message actions", "handleRetry via useTimelineStore.getState() + wsClient.send() outside React render"]

key-files:
  created:
    - src/src/components/chat/view/MessageContextMenu.tsx
    - src/src/components/chat/view/MessageContextMenu.test.tsx
  modified:
    - src/src/components/chat/view/UserMessage.tsx
    - src/src/components/chat/view/AssistantMessage.tsx
    - src/src/components/chat/view/MessageList.tsx
    - src/src/components/chat/view/ChatView.tsx

key-decisions:
  - "Retry uses wsClient.send with claude-command type matching ChatComposer's exact send format"
  - "projectName threaded from ChatView -> MessageList as prop (not useProjectContext hook) to match existing data flow"
  - "No user-select:none on ContextMenuTrigger -- text selection preserved per S-9 AR finding"
  - "showRetry && onRetry guard prevents Retry item rendering when no callback provided"

patterns-established:
  - "MessageContextMenu wrapper pattern: wrap message content, pass messageText for copy/share, optional showRetry + onRetry for assistant messages"
  - "Retry via useTimelineStore.getState().sessions lookup + wsClient.send() -- reads outside React render cycle for correctness"

requirements-completed: [GESTURE-06, GESTURE-09]

# Metrics
duration: 4min
completed: 2026-03-29
---

# Phase 67 Plan 03: Long-Press Context Menus Summary

**Radix ContextMenu on message bubbles with Copy Text (native clipboard), working Retry (WebSocket re-send), and Share (native share sheet) -- haptic feedback on open and share, text selection preserved**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-29T21:25:27Z
- **Completed:** 2026-03-29T21:30:00Z
- **Tasks:** 1 (TDD: RED + GREEN)
- **Files modified:** 7

## Accomplishments
- Created MessageContextMenu component using Radix ContextMenu with Copy Text, conditional Retry, and Share actions
- Wired UserMessage and AssistantMessage with MessageContextMenu wrappers -- user messages get Copy/Share, assistant messages get Copy/Retry/Share
- Implemented working retry mechanism in MessageList that re-sends last user message via wsClient.send() using exact ChatComposer send format
- Full TDD cycle: 10 tests across 1 test file, all passing; 1517 total tests, zero regressions
- Haptic feedback fires on context menu open (contextMenuOpen) and share action (shareTriggered)
- Text selection NOT blocked -- no user-select:none applied per S-9 adversarial review finding

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: Failing tests for MessageContextMenu** - `72b9f9d` (test)
2. **Task 1 GREEN: Implement MessageContextMenu and wire into messages** - `b8cf082` (feat)

## Files Created/Modified
- `src/src/components/chat/view/MessageContextMenu.tsx` - New Radix ContextMenu wrapper with Copy/Retry/Share actions
- `src/src/components/chat/view/MessageContextMenu.test.tsx` - 10 tests covering all actions, haptics, and text selection preservation
- `src/src/components/chat/view/UserMessage.tsx` - Wrapped in MessageContextMenu (Copy Text + Share)
- `src/src/components/chat/view/AssistantMessage.tsx` - Added onRetry prop, wrapped in MessageContextMenu (Copy Text + Retry + Share)
- `src/src/components/chat/view/MessageList.tsx` - Added handleRetry callback (useTimelineStore + wsClient), threading to MemoizedMessageItem
- `src/src/components/chat/view/ChatView.tsx` - Passes projectName to MessageList for retry WebSocket options

## Decisions Made
- Retry uses `wsClient.send({ type: 'claude-command', command: lastUserMsg.content, options: { projectPath, sessionId } })` matching ChatComposer's exact format -- ensures backend processes retry identically to a normal send
- projectName passed as prop from ChatView to MessageList rather than calling useProjectContext in MessageList -- avoids duplicate hook usage and follows existing prop threading pattern
- showRetry && onRetry double guard on Retry menu item -- prevents rendering Retry when no callback exists, even if showRetry is true
- No user-select:none on ContextMenuTrigger (S-9) -- Radix handles long-press detection via native contextmenu event; text selection must remain functional

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Known Stubs

None - all actions are fully implemented with real integrations.

## Next Phase Readiness
- MessageContextMenu ready for use on any future message-like components
- Retry mechanism operational for claude-command messages
- Context menu pattern reusable for other long-press interactions in Plan 04

## Self-Check: PASSED

- All 7 files verified present on disk
- All 2 task commits verified in git log (72b9f9d, b8cf082)
