---
phase: 55-conversation-enhancements
plan: 02
subsystem: ui
tags: [zustand, websocket, popover, provider, notification]

# Dependency graph
requires:
  - phase: 52-live-session-attach
    provides: liveAttachedSessions pattern in stream store
provides:
  - Background session notification system (notifiedSessions in stream store)
  - ModelSelector popover component for provider selection
  - Provider-aware message sending (claude/codex/gemini command types)
affects: [composer, sidebar, multi-provider]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "notifiedSessions Set pattern for background completion tracking"
    - "Provider-specific command type routing in composer send"

key-files:
  created:
    - src/src/components/chat/composer/ModelSelector.tsx
    - src/src/components/chat/composer/model-selector.css
  modified:
    - src/src/stores/stream.ts
    - src/src/lib/websocket-init.ts
    - src/src/components/sidebar/SessionItem.tsx
    - src/src/components/sidebar/SessionList.tsx
    - src/src/components/sidebar/sidebar.css
    - src/src/components/chat/composer/ChatComposer.tsx

key-decisions:
  - "Static amber dot (no animation) for background notifications -- visually distinct from streaming (blue pulse) and live (green pulse)"
  - "Provider-specific options: Claude gets images/fileMentions/permissionMode, Codex/Gemini get projectPath/sessionId only"

patterns-established:
  - "notifiedSessions pattern: Set<string> in stream store, cleared on session navigation"
  - "commandType routing: ternary chain from selectedProvider to claude/codex/gemini-command"

requirements-completed: [CONV-03, CONV-04]

# Metrics
duration: 3min
completed: 2026-03-27
---

# Phase 55 Plan 02: Notifications & Model Selector Summary

**Background session notification dots in sidebar and per-message model selector popover for Claude/Gemini/Codex provider switching**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-27T01:12:54Z
- **Completed:** 2026-03-27T01:16:00Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Background session completions show amber notification dot on sidebar sessions
- Notification dot clears when user navigates to that session
- ModelSelector popover in composer with Claude/Gemini/Codex provider options
- Message sending routes through provider-specific WebSocket command types
- Provider-appropriate options (Claude gets images/mentions/permissions; Codex/Gemini get minimal options)

## Task Commits

Each task was committed atomically:

1. **Task 1: Background session notification system** - `9927d4a` (feat)
2. **Task 2: Model selector in composer** - `d6cf573` (feat)

## Files Created/Modified
- `src/src/components/chat/composer/ModelSelector.tsx` - Provider selection popover with icons
- `src/src/components/chat/composer/model-selector.css` - Trigger and option layout styles
- `src/src/stores/stream.ts` - notifiedSessions Set with add/clear actions
- `src/src/lib/websocket-init.ts` - Background completion detection in onStreamEnd and onLiveSessionData
- `src/src/components/sidebar/SessionItem.tsx` - hasNewActivity prop and amber notification dot
- `src/src/components/sidebar/SessionList.tsx` - notifiedSessions subscription and clear on click
- `src/src/components/sidebar/sidebar.css` - session-notified-dot CSS class (static amber)
- `src/src/components/chat/composer/ChatComposer.tsx` - selectedProvider state, ModelSelector integration, provider-aware send

## Decisions Made
- Static amber dot (no animation) for notifications -- visually distinct from streaming (blue pulse) and live (green pulse)
- Provider-specific options split: Claude gets full options (images, fileMentions, permissionMode), Codex/Gemini get only projectPath/sessionId
- URL pathname matching (`/chat/{id}`) to determine currently viewed session for notification detection

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Conversation enhancements complete (follow-up pills, notifications, model selector)
- Ready for next phase execution

---
*Phase: 55-conversation-enhancements*
*Completed: 2026-03-27*
