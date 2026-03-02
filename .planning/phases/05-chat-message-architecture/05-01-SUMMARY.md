---
phase: 05-chat-message-architecture
plan: 01
subsystem: ui
tags: [shiki, syntax-highlighting, react, code-block, dark-plus]

# Dependency graph
requires:
  - phase: 01-design-system-foundation
    provides: CSS variables and warm color palette
provides:
  - Singleton Shiki highlighter with warm Dark+ color map
  - ShikiCodeBlock component with header, copy, truncation, streaming fallback
  - Updated Markdown.tsx using ShikiCodeBlock
  - Shiki isolated in vendor-shiki Vite chunk
affects: [05-chat-message-architecture, 06-ux-intelligence-layer]

# Tech tracking
tech-stack:
  added: [shiki@4.0.1]
  patterns: [singleton-async-highlighter, dynamic-import-code-splitting, warm-color-replacement-map]

key-files:
  created:
    - src/components/chat/hooks/useShikiHighlighter.ts
    - src/components/chat/view/subcomponents/CodeBlock.tsx
  modified:
    - src/components/chat/view/subcomponents/Markdown.tsx
    - src/components/code-editor/view/subcomponents/markdown/MarkdownCodeBlock.tsx
    - vite.config.js
    - package.json

key-decisions:
  - "Used shiki/bundle/web (3.8 MB) over full bundle (6.4 MB) for smaller payload"
  - "Loose Highlighter interface type to avoid generic mismatch between web/full bundle types"
  - "17 web-bundle languages pre-registered; others fall back to plaintext"
  - "Migrated code-editor MarkdownCodeBlock alongside chat Markdown for full react-syntax-highlighter removal"

patterns-established:
  - "Singleton async highlighter: module-level Promise pattern for one-time WASM+grammar init"
  - "Color replacement map: 12 Dark+ hex colors remapped to warm Loom equivalents"
  - "ShikiCodeBlock as universal code block: header bar, copy, truncation, streaming fallback"

requirements-completed: [CHAT-01, CHAT-02]

# Metrics
duration: 5min
completed: 2026-03-02
---

# Phase 5 Plan 01: Shiki Code Blocks Summary

**Shiki v4 warm Dark+ syntax highlighting with singleton highlighter, ShikiCodeBlock component, and full react-syntax-highlighter removal**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-02T19:34:09Z
- **Completed:** 2026-03-02T19:39:32Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Installed Shiki v4 with web bundle and created singleton highlighter with 12 warm Dark+ color replacements
- Built ShikiCodeBlock with header bar (language + copy button), 50-line truncation, streaming fallback
- Replaced react-syntax-highlighter in both Markdown.tsx and code-editor MarkdownCodeBlock.tsx
- Main bundle reduced from 1,831 kB to 1,186 kB (-645 kB) by removing Prism/react-syntax-highlighter
- Shiki code-split into vendor-shiki chunk (123 kB) with language grammars as separate lazy chunks

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Shiki and create singleton highlighter with warm Dark+ theme** - `4dfc5fe` (feat)
2. **Task 2: Build ShikiCodeBlock component and wire into Markdown.tsx** - `9c4bbfc` (feat)

## Files Created/Modified
- `src/components/chat/hooks/useShikiHighlighter.ts` - Singleton Shiki highlighter with warm Dark+ color map, getHighlighter and highlightCode exports
- `src/components/chat/view/subcomponents/CodeBlock.tsx` - ShikiCodeBlock with header bar, copy button, truncation, streaming fallback
- `src/components/chat/view/subcomponents/Markdown.tsx` - Replaced Prism SyntaxHighlighter with ShikiCodeBlock
- `src/components/code-editor/view/subcomponents/markdown/MarkdownCodeBlock.tsx` - Migrated to ShikiCodeBlock
- `vite.config.js` - Added vendor-shiki manual chunk
- `package.json` - Added shiki, removed react-syntax-highlighter
- `src/types/react-syntax-highlighter.d.ts` - Deleted (no longer needed)

## Decisions Made
- Used `shiki/bundle/web` instead of full `shiki` for ~40% smaller payload (web bundle has 54 languages vs 200+)
- Created loose `Highlighter` interface type to avoid TypeScript generic mismatch between web bundle and full bundle type exports
- Pre-registered 17 most common web-bundle languages; unknown languages gracefully fall back to plaintext
- Migrated code-editor's MarkdownCodeBlock alongside chat Markdown to fully remove react-syntax-highlighter

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Migrated code-editor MarkdownCodeBlock to ShikiCodeBlock**
- **Found during:** Task 2 (removing react-syntax-highlighter)
- **Issue:** `src/components/code-editor/view/subcomponents/markdown/MarkdownCodeBlock.tsx` also imported react-syntax-highlighter; removing the dependency would break build
- **Fix:** Rewrote MarkdownCodeBlock to use ShikiCodeBlock, same pattern as Markdown.tsx migration
- **Files modified:** src/components/code-editor/view/subcomponents/markdown/MarkdownCodeBlock.tsx
- **Verification:** Build passes, typecheck passes, zero react-syntax-highlighter references in src/
- **Committed in:** 9c4bbfc (Task 2 commit)

**2. [Rule 1 - Bug] Fixed TypeScript generic type mismatch in useShikiHighlighter**
- **Found during:** Task 1 (typecheck)
- **Issue:** Importing `BundledLanguage` from `shiki` resolved to the full bundle's type, incompatible with web bundle's `createHighlighter` return type
- **Fix:** Replaced generic imports with a loose local `Highlighter` interface matching the runtime API
- **Files modified:** src/components/chat/hooks/useShikiHighlighter.ts
- **Verification:** `npm run typecheck` passes cleanly
- **Committed in:** 4dfc5fe (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both essential for build correctness. No scope creep.

## Issues Encountered
None beyond the auto-fixed deviations above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- ShikiCodeBlock is ready for streaming-aware integration in Phase 5 Plan 05-05
- Singleton highlighter pattern is established and reusable across any component needing syntax highlighting
- Warm Dark+ color map is centralized and adjustable in useShikiHighlighter.ts

## Self-Check: PASSED

All 7 created/modified files verified present. Both commits (4dfc5fe, 9c4bbfc) confirmed in git log. Deleted file (react-syntax-highlighter.d.ts) confirmed absent.

---
*Phase: 05-chat-message-architecture*
*Completed: 2026-03-02*
