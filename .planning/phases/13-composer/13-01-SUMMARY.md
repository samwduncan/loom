---
phase: 13-composer
plan: 01
subsystem: ui
tags: [react, textarea, state-machine, useReducer, css-grid, lucide-react]

# Dependency graph
requires:
  - phase: 11-markdown
    provides: shadcn/ui kbd component, design tokens
provides:
  - Multiline auto-resize textarea composer
  - 5-state send/stop FSM (idle/sending/active/aborting)
  - CSS Grid crossfade for send/stop button morph
  - Keyboard shortcuts (Enter, Shift+Enter, Escape, Cmd+.)
  - Message queuing during streaming with queued flag
  - Floating pill design with centered max-w-3xl column
  - Suggestion chips on empty state
affects: [13-02-image-attachments, 13-03-draft-persistence, 14-message-types]

# Tech tracking
tech-stack:
  added: [lucide-react icons (Send, Square)]
  patterns: [useReducer FSM, useLayoutEffect auto-resize, CSS Grid crossfade, scroll container ref prop threading]

key-files:
  created:
    - src/src/components/chat/composer/useAutoResize.ts
    - src/src/components/chat/composer/useComposerState.ts
    - src/src/components/chat/composer/composer.css
    - src/src/components/chat/composer/ComposerKeyboardHints.tsx
  modified:
    - src/src/components/chat/composer/ChatComposer.tsx
    - src/src/components/chat/composer/ChatComposer.test.tsx
    - src/src/components/chat/view/ChatView.tsx
    - src/src/components/chat/view/ChatEmptyState.tsx
    - src/src/components/chat/view/MessageList.tsx
    - src/src/types/message.ts

key-decisions:
  - "Scroll container ref passed as prop from ChatView (not document.querySelector per Constitution 10.2)"
  - "FSM allows idle->active transition for components mounting mid-stream"
  - "abort-session used for both Stop button and Cmd+. shortcut (no claude-abort type)"
  - "Queued messages use metadata.queued flag for badge display"
  - "Suggestion chips use state-based prop threading (suggestionText) not imperative refs"

patterns-established:
  - "useAutoResize: useLayoutEffect height=0 then scrollHeight measurement pattern"
  - "useComposerState: useReducer FSM wired to external store via useEffect"
  - "CSS Grid crossfade: data-visible attribute for opacity toggle in shared grid cell"
  - "Scroll stability: capture/restore scrollTop around resize via useLayoutEffect pair"

requirements-completed: [CMP-01, CMP-02, CMP-03, CMP-04, CMP-05, CMP-06, CMP-11, CMP-13, CMP-14]

# Metrics
duration: 6min
completed: 2026-03-07
---

# Phase 13 Plan 01: Core Composer Summary

**Multiline auto-resize composer with 5-state send/stop FSM, keyboard shortcuts, CSS Grid crossfade, and floating pill design**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-07T18:56:29Z
- **Completed:** 2026-03-07T19:02:46Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- Auto-resize textarea grows from 1 line to 200px max, then scrolls internally
- 5-state FSM prevents double-send and double-stop with 5-second abort timeout
- Send/Stop buttons crossfade in same grid cell with no position jump
- Full keyboard support: Enter send, Shift+Enter newline, Escape clear/blur, Cmd+. stop
- Message queuing during streaming: users can type and send while response is active
- CSS Grid layout (1fr auto) in ChatView for scroll-stable composer height changes
- Welcome screen with 4 suggestion chips that populate composer input

## Task Commits

Each task was committed atomically:

1. **Task 1: useAutoResize + useComposerState FSM + composer.css** - `7c367c1` (feat)
2. **Task 2: ChatComposer rewrite + ComposerKeyboardHints + layout integration** - `fb27ac1` (feat)

## Files Created/Modified
- `src/src/components/chat/composer/useAutoResize.ts` - useLayoutEffect-based textarea height measurement with maxHeight clamp
- `src/src/components/chat/composer/useComposerState.ts` - 5-state FSM via useReducer wired to stream store
- `src/src/components/chat/composer/composer.css` - Floating pill styles, grid crossfade, CSS spinner, hint transitions
- `src/src/components/chat/composer/ComposerKeyboardHints.tsx` - Fading keyboard shortcut hints (Enter/Shift+Enter/Cmd+.)
- `src/src/components/chat/composer/ChatComposer.tsx` - Full rewrite: multiline textarea, FSM, keyboard shortcuts, message queuing
- `src/src/components/chat/composer/ChatComposer.test.tsx` - Updated tests for new FSM-based behavior (15 tests, 478 total)
- `src/src/components/chat/view/ChatView.tsx` - CSS Grid layout, scroll container ref, suggestion chip wiring
- `src/src/components/chat/view/ChatEmptyState.tsx` - Added suggestion chips with onSuggestionClick callback
- `src/src/components/chat/view/MessageList.tsx` - Centered max-w-3xl column, accepts scroll container ref prop
- `src/src/types/message.ts` - Added optional `queued` flag to MessageMetadata

## Decisions Made
- Scroll container ref passed as prop from ChatView to ChatComposer (Gemini architect flagged document.querySelector as Constitution 10.2 violation)
- FSM allows idle->active transition for components that mount mid-stream (prevents stop button from being disabled when re-entering chat during active streaming)
- Used `abort-session` for both Stop button and Cmd+. shortcut (Gemini architect confirmed no `claude-abort` type exists in ClientMessage union)
- Queued messages carry `metadata.queued: true` for future "Queued" badge rendering

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] FSM idle->active transition for mid-stream mount**
- **Found during:** Task 2 (ChatComposer rewrite)
- **Issue:** Existing test "stop button sends abort-session" failed because FSM only allowed sending->active transition, but streaming can start without user initiating send (component mount during active stream)
- **Fix:** Added idle->active as valid STREAM_STARTED transition in composerReducer
- **Files modified:** src/src/components/chat/composer/useComposerState.ts
- **Verification:** All 478 tests pass
- **Committed in:** fb27ac1

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Essential for correctness. Stop button must work when navigating to active streaming session.

## Issues Encountered
- Lint rule `loom/no-banned-inline-style` caught `style={{ overflowY: 'hidden' }}` on textarea -- replaced with Tailwind `overflow-y-hidden` class (useAutoResize overrides via el.style.overflowY dynamically)

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Composer foundation complete, ready for Plan 02 (image attachments: paste, drag-drop, thumbnails)
- Image preview row slot already reserved in ChatComposer JSX
- `queued` metadata flag ready for future "Queued" badge styling

---
*Phase: 13-composer*
*Completed: 2026-03-07*
