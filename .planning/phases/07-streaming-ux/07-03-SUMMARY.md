---
phase: 07-streaming-ux
plan: 03
subsystem: ui
tags: [react, scroll, intersection-observer, component, tailwind]

requires:
  - phase: 07-streaming-ux
    provides: useScrollAnchor hook, useNewTurnCounter hook from plan 07-02
provides:
  - Floating ScrollToBottomPill component with turn count badge
  - Scroll anchor wiring into ChatMessagesPane with sentinel div
  - Old scroll button removal from ChatInputControls
affects: [07-streaming-ux]

tech-stack:
  added: []
  patterns: [IntersectionObserver sentinel wired to scroll container, absolute-positioned floating pill within relative wrapper]

key-files:
  created:
    - src/components/chat/view/subcomponents/ScrollToBottomPill.tsx
  modified:
    - src/components/chat/view/subcomponents/ChatMessagesPane.tsx
    - src/components/chat/view/ChatInterface.tsx
    - src/components/chat/view/subcomponents/ChatInputControls.tsx
    - src/components/chat/view/subcomponents/ChatComposer.tsx

key-decisions:
  - "Scroll pill self-contained in ChatMessagesPane via useScrollAnchor — avoids prop drilling to ChatInterface"
  - "Outer wrapper with overflow-hidden flex-1 relative provides positioning context for pill"
  - "useChatSessionState.isUserScrolledUp kept intact for ClaudeStatus and other consumers"

patterns-established:
  - "Floating UI pill pattern: absolute within relative wrapper, entrance animation via style tag"

requirements-completed: [STRM-02, STRM-03]

duration: 4min
completed: 2026-03-02
---

# Plan 07-03: Scroll Pill + Scroll Anchor Wiring Summary

**Floating scroll-to-bottom pill with live turn count, sentinel-based auto-scroll wiring, and old scroll button removal**

## Performance

- **Duration:** ~4 min
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Built ScrollToBottomPill component with warm earthy palette, down arrow, turn count badge, and entrance animation
- Wired useScrollAnchor + useNewTurnCounter into ChatMessagesPane with invisible sentinel div
- Added auto-scroll effect gated on isAtBottom AND not user-scrolled-up
- Removed old scroll-to-bottom button from ChatInputControls and cleaned up 3 scroll props from ChatComposer
- Removed onWheel/onTouchMove pass-through from ChatInterface (ChatMessagesPane handles internally)

## Task Commits

Each task was committed atomically:

1. **Task 1: Build ScrollToBottomPill component** - `9684071` (feat)
2. **Task 2: Wire scroll anchor, sentinel, pill, and turn counter** - `8faeae9` (feat)

## Files Created/Modified
- `src/components/chat/view/subcomponents/ScrollToBottomPill.tsx` - Floating pill with turn count, down arrow, entrance animation
- `src/components/chat/view/subcomponents/ChatMessagesPane.tsx` - useScrollAnchor + useNewTurnCounter hooks, sentinel div, ScrollToBottomPill render, auto-scroll effect
- `src/components/chat/view/ChatInterface.tsx` - Removed onWheel/onTouchMove props to ChatMessagesPane, removed scroll props to ChatComposer
- `src/components/chat/view/subcomponents/ChatInputControls.tsx` - Removed isUserScrolledUp, hasMessages, onScrollToBottom props and old scroll button
- `src/components/chat/view/subcomponents/ChatComposer.tsx` - Removed 3 scroll-related props from interface and destructured params

## Decisions Made
- Wrapped scroll container in `overflow-hidden flex-1 relative` div for pill positioning context
- Kept useChatSessionState.isUserScrolledUp intact for ClaudeStatus — separate from pill's self-contained tracking

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing functionality] Updated ChatComposer.tsx scroll props**
- **Found during:** Task 2 (wiring)
- **Issue:** ChatComposer.tsx was intermediary passing scroll props from ChatInterface to ChatInputControls — removing props from ChatInputControls required removing them from ChatComposer too
- **Fix:** Removed isUserScrolledUp, hasMessages, onScrollToBottom from ChatComposer interface and destructured params
- **Files modified:** src/components/chat/view/subcomponents/ChatComposer.tsx
- **Committed in:** 8faeae9

---

**Total deviations:** 1 auto-fixed (1 missing functionality)
**Impact on plan:** Essential for typecheck to pass. No scope creep.

## Depth Compliance

### Task 2: Wire scroll anchor, sentinel, pill, turn counter (Grade A)

| Depth Criterion | Status |
|----------------|--------|
| Sentinel div invisible (1px height, aria-hidden) | VERIFIED |
| ScrollToBottomPill positioned absolute within relative parent | VERIFIED |
| Auto-scroll effect gated on isAtBottom AND not user-scrolled-up | VERIFIED |
| Top-pagination (loadOlderMessages) still works | VERIFIED |
| overflow-anchor: auto already applied by 07-02 | VERIFIED |
| ChatInputControls cleaned up — 3 props removed | VERIFIED |

**Score:** 6/6

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Scroll system fully wired — pill appears on scroll-up, dismisses on click/scroll-back
- Plans 07-04 (indicators) and 07-05 (reconnect + verification) can proceed
- ChatMessagesPane is the integration point for remaining Wave 3/4 changes

---
*Phase: 07-streaming-ux*
*Completed: 2026-03-02*
