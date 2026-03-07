---
phase: 12-streaming-markdown-marker-interleaving
plan: 01
subsystem: ui
tags: [markdown, dompurify, streaming, innerHTML, rAF]

requires:
  - phase: 07-tool-registry-proof-of-life
    provides: useStreamBuffer rAF paint loop, ActiveMessage multi-span architecture
provides:
  - convertStreamingMarkdown pure function (markdown string -> sanitized HTML)
  - streaming-phase CSS for formatted markdown display
  - innerHTML-based paint in useStreamBuffer with silent fallback
affects: [12-02 marker interleaving, 12-03 finalization swap]

tech-stack:
  added: [dompurify, @types/dompurify]
  patterns: [placeholder-based code extraction for regex safety, silent converter fallback]

key-files:
  created:
    - src/src/lib/streaming-markdown.ts
    - src/src/lib/streaming-markdown.test.ts
    - src/src/components/chat/styles/streaming-markdown.css
  modified:
    - src/src/hooks/useStreamBuffer.ts
    - src/src/components/chat/styles/streaming-cursor.css
    - src/src/components/chat/view/ActiveMessage.tsx
    - src/package.json

key-decisions:
  - "Unicode PUA placeholders (U+E000/U+E001) instead of null bytes for code extraction"
  - "DOMPurify over manual sanitization for XSS protection"
  - "Permanent converter failure fallback (converterFailedRef stays true for session)"

patterns-established:
  - "Placeholder extraction: extract code blocks/inline code before inline formatting to prevent false matches"
  - "Silent fallback: try/catch in hot path with permanent disable flag on failure"

requirements-completed: [MD-10, MD-11, MD-12, MD-13]

duration: 4min
completed: 2026-03-07
---

# Phase 12 Plan 01: Streaming Markdown Converter Summary

**Streaming markdown converter with DOMPurify sanitization and rAF innerHTML painting for real-time formatted text display**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-07T18:01:32Z
- **Completed:** 2026-03-07T18:05:45Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Pure function `convertStreamingMarkdown` handles 8 formatting constructs (bold, italic, code, headings, lists, blockquotes, code fences, links)
- Unclosed code fences get synthetic close for streaming-friendly rendering
- XSS protection via DOMPurify allowlist (only safe HTML tags survive)
- useStreamBuffer paints innerHTML instead of textContent with silent fallback
- Streaming-phase CSS scoped under `.active-message` for seamless finalization transition

## Task Commits

Each task was committed atomically:

1. **Task 1: Streaming markdown converter + DOMPurify + tests** - `b35fbf0` (feat)
2. **Task 2: Wire converter into useStreamBuffer + streaming CSS** - `66debb4` (feat)

## Files Created/Modified
- `src/src/lib/streaming-markdown.ts` - Pure markdown-to-HTML converter with DOMPurify sanitization
- `src/src/lib/streaming-markdown.test.ts` - 20 tests covering all constructs, XSS, and edge cases
- `src/src/components/chat/styles/streaming-markdown.css` - Streaming-phase formatting styles
- `src/src/hooks/useStreamBuffer.ts` - innerHTML paint with converter fallback
- `src/src/components/chat/styles/streaming-cursor.css` - Removed white-space:pre-wrap
- `src/src/components/chat/view/ActiveMessage.tsx` - Added streaming-markdown.css import
- `src/package.json` - Added dompurify dependency

## Decisions Made
- Used Unicode Private Use Area characters (U+E000/U+E001) as placeholder delimiters instead of null bytes -- avoids ESLint no-control-regex violation while still being safe from collision with real markdown content
- DOMPurify over manual regex sanitization -- battle-tested library, auto-detects jsdom in test environment
- Permanent converter failure flag (converterFailedRef) -- once the converter throws, that streaming session stays on raw textContent to avoid repeated try/catch overhead in the 60fps paint loop

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] ESLint no-control-regex on null byte placeholders**
- **Found during:** Task 1 (commit attempt)
- **Issue:** Original implementation used `\x00` control characters as placeholder delimiters, triggering ESLint no-control-regex error
- **Fix:** Switched to Unicode PUA characters U+E000/U+E001
- **Files modified:** src/src/lib/streaming-markdown.ts
- **Verification:** ESLint passes, all tests pass
- **Committed in:** b35fbf0 (Task 1 commit)

**2. [Rule 3 - Blocking] TypeScript strict array indexing**
- **Found during:** Task 1 (commit attempt)
- **Issue:** TypeScript noUncheckedIndexedAccess flagged `lines[i]` as possibly undefined in processBlocks while loops
- **Fix:** Added `as string` assertions where array bounds are guaranteed by while condition
- **Files modified:** src/src/lib/streaming-markdown.ts
- **Verification:** tsc --noEmit passes cleanly
- **Committed in:** b35fbf0 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes required for pre-commit hooks to pass. No scope change.

## Issues Encountered
None beyond the auto-fixed deviations above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Streaming markdown converter ready for marker interleaving (Plan 02)
- ActiveMessage now receives formatted HTML during streaming
- CSS styles match MarkdownRenderer appearance for smooth finalization swap

---
*Phase: 12-streaming-markdown-marker-interleaving*
*Completed: 2026-03-07*
