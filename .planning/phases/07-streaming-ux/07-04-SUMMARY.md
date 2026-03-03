---
phase: 07-streaming-ux
plan: 04
subsystem: ui
tags: [react, animation, css-grid, skeleton, aurora, thinking-indicator]

requires:
  - phase: 07-streaming-ux
    provides: aurora-shimmer.css with .aurora-skeleton-line and .aurora-thinking-text classes from plan 07-01
  - phase: 05-chat-message-architecture
    provides: ThinkingDisclosure component, AssistantThinkingIndicator wrapper, ChatMessagesPane
provides:
  - PreTokenIndicator component with aurora skeleton lines and collapse-upward transition
  - ThinkingShimmer component with aurora rainbow text effect
  - AssistantThinkingIndicator rewired to use PreTokenIndicator
  - ThinkingDisclosure integrated with ThinkingShimmer for empty thinking state
  - ChatMessagesPane indicator lifecycle management for collapse animation
affects: [07-streaming-ux]

tech-stack:
  added: []
  patterns: [CSS Grid 1fr→0fr collapse animation, indicator lifecycle with delayed unmount]

key-files:
  created:
    - src/components/chat/view/subcomponents/PreTokenIndicator.tsx
    - src/components/chat/view/subcomponents/ThinkingShimmer.tsx
  modified:
    - src/components/chat/view/subcomponents/AssistantThinkingIndicator.tsx
    - src/components/chat/view/subcomponents/ActivityIndicator.tsx
    - src/components/chat/view/subcomponents/ThinkingDisclosure.tsx
    - src/components/chat/view/subcomponents/ChatMessagesPane.tsx

key-decisions:
  - "CSS Grid 1fr→0fr for collapse animation (proven pattern from ThinkingDisclosure)"
  - "350ms delayed unmount (slightly longer than 300ms transition) for clean collapse"
  - "ActivityIndicator kept as deprecated — not deleted to avoid breakage"
  - "ThinkingShimmer shows when isStreaming && isEmpty, transitions naturally to ThinkingDisclosure when content arrives"

patterns-established:
  - "Indicator lifecycle pattern: showIndicator state + delayed unmount for exit animation"
  - "ThinkingShimmer → ThinkingDisclosure seamless transition via isEmpty check"

requirements-completed: [STRM-04, STRM-05]

duration: 3min
completed: 2026-03-02
---

# Plan 07-04: Pre-Token Skeleton + Thinking Shimmer Summary

**Aurora shimmer skeleton lines replace rotating-phrase indicator, with collapse-upward transition and rainbow "Thinking..." text for extended thinking**

## Performance

- **Duration:** ~3 min
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Built PreTokenIndicator with 4 uniform-width aurora skeleton lines and CSS Grid collapse animation
- Built ThinkingShimmer with rainbow aurora text "Thinking..." effect
- Rewired AssistantThinkingIndicator to use PreTokenIndicator instead of ActivityIndicator
- Integrated ThinkingShimmer into ThinkingDisclosure for empty thinking state
- Added indicator lifecycle management in ChatMessagesPane for delayed unmount during collapse

## Task Commits

Each task was committed atomically:

1. **Task 1: Build PreTokenIndicator and ThinkingShimmer components** - `5344a12` (feat)
2. **Task 2: Replace ActivityIndicator, wire ThinkingShimmer** - `185d3cb` (feat)

## Files Created/Modified
- `src/components/chat/view/subcomponents/PreTokenIndicator.tsx` - Aurora skeleton lines with Grid 1fr→0fr collapse
- `src/components/chat/view/subcomponents/ThinkingShimmer.tsx` - Rainbow aurora "Thinking..." text effect
- `src/components/chat/view/subcomponents/AssistantThinkingIndicator.tsx` - Rewired to use PreTokenIndicator with isVisible prop
- `src/components/chat/view/subcomponents/ActivityIndicator.tsx` - Marked deprecated, kept for compatibility
- `src/components/chat/view/subcomponents/ThinkingDisclosure.tsx` - ThinkingShimmer integration for empty thinking state
- `src/components/chat/view/subcomponents/ChatMessagesPane.tsx` - Indicator lifecycle with showIndicator state and 350ms delayed unmount

## Decisions Made
None beyond plan — followed plan as specified

## Deviations from Plan
None - plan executed exactly as written

## Depth Compliance

### Task 1: Build PreTokenIndicator and ThinkingShimmer (Grade A)

| Depth Criterion | Status |
|----------------|--------|
| Collapse animation uses CSS Grid 1fr→0fr | VERIFIED |
| 300ms collapse timing matches transition duration | VERIFIED |
| Skeleton lines are uniform width (abstract placeholder) | VERIFIED |
| Aurora shimmer is CSS-only (@property animation) | VERIFIED |
| ThinkingShimmer renders only when isThinking is true | VERIFIED |

**Score:** 5/5

### Task 2: Replace ActivityIndicator, wire ThinkingShimmer (Grade S)

| Depth Criterion | Status |
|----------------|--------|
| Collapse transition: isLoading→false → isVisible→false → grid collapses → unmount at 350ms | VERIFIED |
| ThinkingShimmer→ThinkingDisclosure transition seamless via isEmpty check | VERIFIED |
| ActivityIndicator kept (deprecated) to avoid breakage | VERIFIED |
| No layout jump during skeleton-to-content transition | VERIFIED |

**Score:** 4/4

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All indicator components complete — PreTokenIndicator, ThinkingShimmer, StreamingCursor
- Plan 07-05 (reconnect skeletons + end-to-end verification) can proceed
- Wave 4 is the final wave with checkpoint verification

---
*Phase: 07-streaming-ux*
*Completed: 2026-03-02*
