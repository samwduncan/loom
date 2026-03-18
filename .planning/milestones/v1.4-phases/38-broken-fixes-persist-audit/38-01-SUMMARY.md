---
phase: 38-broken-fixes-persist-audit
plan: 01
subsystem: chat, backend
tags: [websocket, file-mentions, search, markdown, dead-code]

requires: []
provides:
  - "Working @-mention file context injection via fileMentions WS field"
  - "Search highlighting in assistant message bodies during active search"
  - "Clean codebase without rehypeToolMarkers dead code"
affects: []

tech-stack:
  added: []
  patterns:
    - "Server-side file content injection via XML-wrapped tags in prompt"
    - "Search highlight fallback: plain text with marks instead of markdown during search"

key-files:
  created: []
  modified:
    - src/src/components/chat/composer/ChatComposer.tsx
    - src/src/components/chat/composer/ChatComposer.test.tsx
    - server/claude-sdk.js
    - src/src/components/chat/view/AssistantMessage.tsx
    - src/src/components/chat/view/MarkdownRenderer.tsx

key-decisions:
  - "fileMentions sent as WS options field, backend reads files and prepends XML-wrapped content to prompt"
  - "Search highlighting uses plain text fallback during active search rather than injecting into markdown AST"

patterns-established: []

requirements-completed: [FIX-01, FIX-02, FIX-03]

duration: 4min
completed: 2026-03-17
---

# Phase 38 Plan 01: Broken Features Fix Summary

**@-mention file injection via fileMentions WS field, search highlighting in assistant messages, and rehypeToolMarkers dead code removal**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-17T23:00:24Z
- **Completed:** 2026-03-17T23:04:44Z
- **Tasks:** 2
- **Files modified:** 5 (+ 2 deleted)

## Accomplishments
- @-mention file paths now sent as fileMentions array in WebSocket options; backend reads files and injects XML-wrapped content into AI prompt
- Search highlighting renders visible highlights in assistant message bodies during active search (plain text fallback)
- rehypeToolMarkers plugin completely removed (source file, test file, all imports) -- 0 references remain

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix @-mention file context delivery** - `b575a53` (feat)
2. **Task 2: Fix search highlighting + remove dead code** - `6e1fbd8` (fix)

## Files Created/Modified
- `src/src/components/chat/composer/ChatComposer.tsx` - Sends fileMentions in WS options, removed text-prefix approach
- `src/src/components/chat/composer/ChatComposer.test.tsx` - Updated test to verify fileMentions in options payload
- `server/claude-sdk.js` - Reads mentioned files and prepends XML-wrapped content to prompt
- `src/src/components/chat/view/AssistantMessage.tsx` - Conditional render: highlightText fallback during search
- `src/src/components/chat/view/MarkdownRenderer.tsx` - Removed rehypeToolMarkers import and plugin usage
- `src/src/lib/rehype-tool-markers.ts` - DELETED
- `src/src/lib/rehype-tool-markers.test.ts` - DELETED

## Decisions Made
- Used server-side file reading for @-mentions rather than client-side: the backend has filesystem access and can read files directly, avoiding sending file contents over WebSocket
- Search highlighting uses plain text with mark tags instead of injecting into markdown AST: adding highlights inside react-markdown would require a complex rehype plugin, and search is a temporary overlay state where plain text is acceptable
- rehypeToolMarkers was dead code from an abandoned inline tool marker approach; removal simplifies the markdown pipeline

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-commit hook failure on Task 2 commit due to lint-staged stash/unstash picking up unrelated unstaged working tree changes (timeline.test.ts type errors). The commit succeeded on a subsequent attempt after the stash state was cleaned up.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All three broken features fixed, ready for plan 38-02 (persist/audit tasks)
- 1282 tests passing, no type errors

---
*Phase: 38-broken-fixes-persist-audit*
*Completed: 2026-03-17*

## Self-Check: PASSED

All created/modified files verified present. All deleted files verified absent. Both commit hashes (b575a53, 6e1fbd8) found in git log.
