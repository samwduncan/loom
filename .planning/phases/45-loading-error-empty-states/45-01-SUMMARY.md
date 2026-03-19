---
phase: 45-loading-error-empty-states
plan: 01
subsystem: ui
tags: [skeleton, shimmer, error-handling, retry, react, accessibility]

# Dependency graph
requires:
  - phase: 44-foundation
    provides: design tokens, useFetch base hook, SettingsTabSkeleton pattern
provides:
  - Skeleton shared primitive (line/circle/block variants with directional shimmer)
  - InlineError shared primitive (error display with optional retry button)
  - EmptyState shared primitive (icon + heading + optional description/action layout)
  - Global skeleton-shimmer CSS class in base.css
  - Normalized skeleton animations across all panels (zero animate-pulse in skeletons)
  - Retry buttons wired to refetch on SessionList and HistoryView error states
affects: [45-02-plan, any-future-loading-states, any-future-error-states]

# Tech tracking
tech-stack:
  added: []
  patterns: [skeleton-shimmer global class, InlineError with retry pattern, Skeleton primitive composition]

key-files:
  created:
    - src/src/components/shared/Skeleton.tsx
    - src/src/components/shared/Skeleton.test.tsx
    - src/src/components/shared/InlineError.tsx
    - src/src/components/shared/InlineError.test.tsx
    - src/src/components/shared/EmptyState.tsx
    - src/src/components/shared/EmptyState.test.tsx
  modified:
    - src/src/styles/base.css
    - src/src/components/sidebar/sidebar.css
    - src/src/components/git/GitPanelSkeleton.tsx
    - src/src/components/git/git-panel.css
    - src/src/components/git/HistoryView.tsx
    - src/src/components/settings/SettingsTabSkeleton.tsx
    - src/src/components/file-tree/FileTree.tsx
    - src/src/components/file-tree/FileTreePanel.tsx
    - src/src/components/content-area/view/ContentArea.tsx
    - src/src/hooks/useMultiProjectSessions.ts
    - src/src/components/sidebar/SessionList.tsx

key-decisions:
  - "Skeleton primitive uses className composition via cn() rather than styled variants -- simpler, more flexible for width/height control"
  - "TerminalSkeleton uses 10 varying-width lines to mimic terminal output; EditorSkeleton uses 13 lines to mimic code"
  - "InlineError uses shadcn Button with variant=outline size=xs for retry -- consistent with existing FileTree retry pattern"

patterns-established:
  - "Skeleton primitive: use <Skeleton className='h-3 w-[X%]' /> for loading lines, compose with cn()"
  - "InlineError pattern: <InlineError message={error} onRetry={refetch} /> for any fetch error state"
  - "All skeleton containers must have role='status' and aria-label for accessibility"

requirements-completed: [LOAD-01, LOAD-02, LOAD-03]

# Metrics
duration: 6min
completed: 2026-03-19
---

# Phase 45 Plan 01: Loading/Error Primitives Summary

**Three shared UI primitives (Skeleton, InlineError, EmptyState) with global shimmer normalization across all panels and retry-wired error states**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-19T00:06:10Z
- **Completed:** 2026-03-19T00:12:50Z
- **Tasks:** 2
- **Files modified:** 17

## Accomplishments
- Created three reusable shared primitives: Skeleton (line/circle/block shimmer), InlineError (error + retry), EmptyState (icon + heading + desc + action)
- Moved shimmer CSS from sidebar.css to base.css for global availability
- Normalized all skeleton components: GitPanelSkeleton, SettingsTabSkeleton, FileTree, HistoryView -- zero animate-pulse or skeleton-pulse remains
- Replaced TerminalSkeleton and EditorSkeleton text strings with proper multi-line Skeleton layouts
- Wired InlineError with retry to SessionList and HistoryView error states
- Exposed refetch from useMultiProjectSessions hook
- Added role="status" and aria-label to all skeleton containers for accessibility

## Task Commits

Each task was committed atomically:

1. **Task 1: Create shared primitives and move shimmer CSS** - `6d88cfb` (feat) -- TDD: 17 tests
2. **Task 2: Normalize skeletons and wire retry to error states** - `0e7bc28` (feat)

## Files Created/Modified
- `src/src/components/shared/Skeleton.tsx` - Reusable shimmer skeleton primitive (line/circle/block)
- `src/src/components/shared/Skeleton.test.tsx` - 6 unit tests
- `src/src/components/shared/InlineError.tsx` - Error display with AlertCircle icon and optional retry
- `src/src/components/shared/InlineError.test.tsx` - 6 unit tests
- `src/src/components/shared/EmptyState.tsx` - Empty state layout with icon/heading/desc/action
- `src/src/components/shared/EmptyState.test.tsx` - 5 unit tests
- `src/src/styles/base.css` - Added global @keyframes shimmer and .skeleton-shimmer
- `src/src/components/sidebar/sidebar.css` - Removed shimmer definitions (moved to base.css)
- `src/src/components/git/GitPanelSkeleton.tsx` - Replaced animate-pulse with skeleton-shimmer
- `src/src/components/git/git-panel.css` - Removed @keyframes skeleton-pulse
- `src/src/components/git/HistoryView.tsx` - Added skeleton-shimmer to skeleton lines, InlineError for error
- `src/src/components/settings/SettingsTabSkeleton.tsx` - Replaced animate-pulse with skeleton-shimmer
- `src/src/components/file-tree/FileTree.tsx` - Replaced animate-pulse bg-muted with skeleton-shimmer
- `src/src/components/file-tree/FileTreePanel.tsx` - Replaced EditorSkeleton text with 13-line Skeleton layout
- `src/src/components/content-area/view/ContentArea.tsx` - Replaced TerminalSkeleton text with 10-line Skeleton layout
- `src/src/hooks/useMultiProjectSessions.ts` - Exposed refetch in return value
- `src/src/components/sidebar/SessionList.tsx` - Replaced error div with InlineError + retry

## Decisions Made
- Skeleton primitive uses className composition via cn() rather than styled variants -- simpler and more flexible for controlling width/height per-instance
- TerminalSkeleton renders 10 varying-width lines (20-90%) to mimic terminal output; EditorSkeleton renders 13 lines (40-95%) to mimic code
- InlineError uses shadcn Button variant="outline" size="xs" for retry, consistent with existing FileTree retry pattern

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- ESLint `loom/no-classname-concat` rule caught template literals in className -- switched to cn() utility for composing Skeleton widths
- ESLint `loom/no-non-null-without-reason` required ASSERT comments on non-null assertions in tests

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All three shared primitives ready for Plan 02 (empty states)
- EmptyState component is the primary building block for Plan 02's panel-specific empty states
- Full test suite passes (137 files, 1395 tests)

---
*Phase: 45-loading-error-empty-states*
*Completed: 2026-03-19*
