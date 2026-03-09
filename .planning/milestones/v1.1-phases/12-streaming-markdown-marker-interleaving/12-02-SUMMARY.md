---
phase: 12-streaming-markdown-marker-interleaving
plan: 02
subsystem: ui
tags: [crossfade, rehype, tool-markers, inline-chips, transition]

requires:
  - phase: 12-streaming-markdown-marker-interleaving
    plan: 01
    provides: streaming markdown converter, rAF innerHTML painting
provides:
  - rehypeToolMarkers plugin for marker-based tool chip interleaving
  - 250ms crossfade transition between streaming and finalized DOM
  - Inline tool chip rendering in AssistantMessage via markers
affects: [12-03 Streamdown evaluation if applicable]

tech-stack:
  added: []
  patterns: [rehype plugin authoring with unist-util-visit, CSS crossfade with height animation, position:absolute overlap for flash-free swap]

key-files:
  created:
    - src/src/lib/rehype-tool-markers.ts
    - src/src/lib/rehype-tool-markers.test.ts
  modified:
    - src/src/components/chat/view/MarkdownRenderer.tsx
    - src/src/components/chat/view/AssistantMessage.tsx
    - src/src/components/chat/view/ActiveMessage.tsx
    - src/src/components/chat/view/ActiveMessage.test.tsx
    - src/src/components/chat/styles/streaming-cursor.css

key-decisions:
  - "Empty text node filtering in rehype plugin for cleaner hast output"
  - "Opacity-based crossfade detection (not background-color) for transitionend"
  - "rAF-gated height measurement before crossfade start for accurate animation"

patterns-established:
  - "rehype plugin: visit text nodes, split around markers, splice replacements"
  - "Crossfade: explicit height capture -> position:absolute overlap -> opacity transition -> cleanup to auto"

requirements-completed: [MD-14, MD-15]

duration: 6min
completed: 2026-03-07
---

# Phase 12 Plan 02: Crossfade Transition + Marker Interleaving Summary

**250ms crossfade streaming-to-finalized transition with rehype-based inline tool chip marker interleaving**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-07T18:07:50Z
- **Completed:** 2026-03-07T18:14:19Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- rehypeToolMarkers plugin walks hast tree and replaces `\x00TOOL:id\x00` markers with `<tool-marker data-id="id" />` elements
- MarkdownRenderer integrates rehypeToolMarkers plugin with component override for inline ToolChip rendering
- AssistantMessage injects tool markers into content string, removing separate tool calls div
- ActiveMessage crossfade: streaming layer fades out, finalized MarkdownRenderer fades in over 250ms
- Height animation: explicit capture of both heights, CSS transition, cleanup to auto
- position:absolute overlap during transition prevents layout jump
- Streaming cursor fades out as part of crossfade
- After transition: streaming DOM removed, finalized DOM becomes static flow
- Reduced motion: instant crossfade with 0ms duration
- 8 new tests for rehype plugin, 4 existing tests updated for crossfade architecture

## Task Commits

Each task was committed atomically:

1. **Task 1: rehype-tool-markers plugin + MarkdownRenderer integration** - `623fa21` (feat)
2. **Task 2: ActiveMessage crossfade transition** - `7e061b5` (feat)

## Files Created/Modified

- `src/src/lib/rehype-tool-markers.ts` - rehype plugin: walks hast tree, replaces marker text nodes with tool-marker elements
- `src/src/lib/rehype-tool-markers.test.ts` - 8 tests covering single/multiple/nested markers and edge cases
- `src/src/components/chat/view/MarkdownRenderer.tsx` - Added rehypeToolMarkers plugin, ToolMarkerInline component override, optional toolCalls prop
- `src/src/components/chat/view/AssistantMessage.tsx` - Injects \x00TOOL:id\x00 markers into content, passes toolCallStates to MarkdownRenderer
- `src/src/components/chat/view/ActiveMessage.tsx` - Crossfade orchestration with streaming/finalizing/finalized phases, rAF height measurement
- `src/src/components/chat/view/ActiveMessage.test.tsx` - Updated 4 tests for new crossfade architecture (rAF flush + opacity transitionend)
- `src/src/components/chat/styles/streaming-cursor.css` - Added crossfade-container, crossfade-streaming, crossfade-finalized CSS with data-phase selectors

## Decisions Made

- Empty text nodes filtered in rehype plugin output for cleaner hast trees -- prevents empty text nodes at marker boundaries
- Crossfade listens for `opacity` transitionend on the finalized layer (not `background-color` on container) -- more reliable since it's the primary visual transition
- rAF gate before crossfade start ensures React has rendered MarkdownRenderer content before height measurement -- prevents measuring zero-height finalized div

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] ESLint no-control-regex on null byte marker regex**
- **Found during:** Task 1
- **Issue:** MARKER_REGEX uses `\x00` null byte delimiters, triggering ESLint no-control-regex
- **Fix:** Added eslint-disable-next-line comment (intentional protocol, not accidental)
- **Files modified:** src/src/lib/rehype-tool-markers.ts
- **Committed in:** 623fa21

**2. [Rule 3 - Blocking] ESLint custom rules (non-null assertion, any type)**
- **Found during:** Task 1
- **Issue:** AssistantMessage non-null assertions and MarkdownRenderer any type needed reason comments
- **Fix:** Added ASSERT and ANY reason comments per Constitution rules
- **Files modified:** src/src/components/chat/view/AssistantMessage.tsx, src/src/components/chat/view/MarkdownRenderer.tsx
- **Committed in:** 623fa21

**3. [Rule 1 - Bug] Existing ActiveMessage tests used old finalization pattern**
- **Found during:** Task 2
- **Issue:** 4 tests expected `background-color` transitionend and no rAF flush; new crossfade uses `opacity` on finalized layer with rAF-gated start
- **Fix:** Updated dispatchTransitionEnd helper, added rAF flush before assertions, adjusted safety timeout from 500ms to 350ms
- **Files modified:** src/src/components/chat/view/ActiveMessage.test.tsx
- **Committed in:** 7e061b5

---

**Total deviations:** 3 auto-fixed (2 blocking, 1 bug)
**Impact on plan:** All fixes required for pre-commit hooks and test suite to pass. No scope change.

## Issues Encountered

None beyond the auto-fixed deviations above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Crossfade transition and marker interleaving complete
- Streaming -> finalized swap is invisible (no flash, no layout jump)
- Tool chips render inline in both streaming (via segments) and finalized (via markers) views
- Ready for Streamdown evaluation (Plan 03) or next phase

---
*Phase: 12-streaming-markdown-marker-interleaving*
*Completed: 2026-03-07*
