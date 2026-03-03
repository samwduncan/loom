---
phase: 07-streaming-ux
plan: 01
subsystem: ui
tags: [css, animation, oklch, markdown, streaming, react]

requires:
  - phase: 05-chat-message-architecture
    provides: Markdown component with isStreaming prop, message rendering pipeline
  - phase: 06-chat-message-polish
    provides: Finalized chat message layout and styling
provides:
  - Aurora shimmer CSS animation system (gradient, skeleton-line, thinking-text classes)
  - Streaming cursor CSS with blinking amber caret
  - CSS containment for streaming messages
  - Hybrid markdown rendering with live inline + deferred block elements
  - Immediate code block container on opening fence detection
affects: [07-streaming-ux, 08-tool-display]

tech-stack:
  added: []
  patterns: [CSS @property for compositor-thread animation, oklch color space gradients, prefers-reduced-motion media queries]

key-files:
  created:
    - src/components/chat/styles/aurora-shimmer.css
    - src/components/chat/styles/streaming-cursor.css
  modified:
    - src/main.jsx
    - src/components/chat/view/subcomponents/Markdown.tsx
    - src/components/chat/hooks/useChatRealtimeHandlers.ts

key-decisions:
  - "Used CSS @property for aurora animation to run on compositor thread (no JS animation)"
  - "oklch color space for vivid rainbow without dead gray zones between hue stops"
  - "Synthetic closing fence approach for immediate code block container during streaming"
  - "preprocessStreamingMarkdown uses line-start-only regex for fence detection to avoid false positives in inline code"

patterns-established:
  - "CSS animation files in src/components/chat/styles/ directory"
  - "STRM-01 comments documenting rAF buffer flush pattern"
  - "preprocessStreamingMarkdown preprocessing pipeline for streaming content"

requirements-completed: [STRM-01]

duration: 6min
completed: 2026-03-02
---

# Plan 07-01: CSS Animation Foundations + Token Buffering Summary

**Aurora rainbow shimmer CSS system with streaming cursor, hybrid markdown rendering, and per-frame token buffer flush**

## Performance

- **Duration:** ~6 min
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments
- Created aurora-shimmer.css with @property animation, full rainbow oklch gradient, skeleton-line, and thinking-text classes
- Created streaming-cursor.css with blinking amber caret and CSS containment for streaming messages
- Wired streaming cursor into Markdown component with inline cursor positioning fix
- Documented STRM-01 rAF buffer flush pattern at all three locations in useChatRealtimeHandlers
- Implemented hybrid markdown preprocessing: inline markdown renders live, incomplete block elements deferred, unclosed code fences get synthetic closing fence

## Task Commits

Each task was committed atomically:

1. **Task 1: Create aurora shimmer and streaming cursor CSS files** - `62c43aa` (feat)
2. **Task 2: Wire streaming cursor into Markdown component** - `d4d1418` (feat)
3. **Task 3: Tune rAF buffer flush and implement hybrid markdown rendering** - `3674ee3` (feat)

## Files Created/Modified
- `src/components/chat/styles/aurora-shimmer.css` - @property --aurora-angle, aurora-rotate keyframes, .aurora-gradient, .aurora-skeleton-line, .aurora-thinking-text
- `src/components/chat/styles/streaming-cursor.css` - cursor-blink keyframes, .streaming-cursor::after amber caret, .message-streaming containment
- `src/main.jsx` - CSS imports for aurora-shimmer.css and streaming-cursor.css
- `src/components/chat/view/subcomponents/Markdown.tsx` - streaming-cursor/message-streaming classes, preprocessStreamingMarkdown function
- `src/components/chat/hooks/useChatRealtimeHandlers.ts` - STRM-01 documentation comments at rAF buffer locations

## Decisions Made
- Used `> :last-child::after` pattern for cursor positioning to ensure inline placement with text (not on new line after block elements)
- Added `:has(> *)` guard to suppress container-level cursor when children exist, preserving empty-state cursor
- prefers-reduced-motion media queries added for accessibility

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed inline cursor positioning in streaming-cursor.css**
- **Found during:** Task 2 (Wire streaming cursor)
- **Issue:** Original `.streaming-cursor::after` on block-level div would place cursor on new line after block children
- **Fix:** Added `.streaming-cursor > :last-child::after` targeting and `:has(> *)` guard
- **Files modified:** src/components/chat/styles/streaming-cursor.css
- **Committed in:** d4d1418

**2. [Rule 3 - Blocking] main.tsx is actually main.jsx**
- **Found during:** Task 1
- **Issue:** Plan referenced main.tsx but actual file is main.jsx
- **Fix:** Imported CSS in main.jsx instead
- **Files modified:** src/main.jsx
- **Committed in:** 62c43aa

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking)
**Impact on plan:** Both essential for correctness. No scope creep.

## Depth Compliance

### Task 1: Create aurora shimmer and streaming cursor CSS files (Grade A)

| Depth Criterion | Status |
|----------------|--------|
| oklch gradient produces vivid rainbow without dead gray zones | VERIFIED |
| @property animation runs on compositor thread (not main thread) | VERIFIED |
| .aurora-skeleton-line includes full gradient declaration | VERIFIED |
| .message-streaming contain: content does not break child layout | VERIFIED |

**Score:** 4/4

### Task 3: Tune rAF buffer flush and implement hybrid markdown rendering (Grade A)

| Depth Criterion | Status |
|----------------|--------|
| preprocessStreamingMarkdown is fast (string ops only, no backtracking) | VERIFIED |
| Unclosed fence detection counts all ``` on line starts correctly | VERIFIED |
| Synthetic closing fence adds no visible artifact | VERIFIED |
| Real closing fence arrival removes synthetic fence seamlessly | VERIFIED |
| Incomplete header/list stripping only affects last line | VERIFIED |
| Inline markdown renders live (not stripped) | VERIFIED |
| Edge case: ``` in inline code uses line-start-only regex | VERIFIED |

**Score:** 7/7

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Aurora shimmer classes available globally for Plans 07-04 (pre-token indicator, thinking shimmer)
- Streaming cursor wired and working for all streaming messages
- Hybrid markdown rendering active for all streaming content
- Plans 07-03, 07-04, 07-05 can proceed

---
*Phase: 07-streaming-ux*
*Completed: 2026-03-02*
