---
phase: 37-performance
plan: 01
subsystem: performance
tags: [vite, rollup, bundle-splitting, shiki, intersection-observer, lru-cache]

# Dependency graph
requires: []
provides:
  - Vendor chunk splitting via rollup manualChunks (5 groups)
  - Bundle analysis tooling (rollup-plugin-visualizer)
  - Bounded LRU shiki highlight cache (500 entries)
  - Single shared IntersectionObserver for message auto-collapse
affects: [performance, build]

# Tech tracking
tech-stack:
  added: [rollup-plugin-visualizer]
  patterns: [LRU cache via Map insertion order, single shared IntersectionObserver]

key-files:
  created: []
  modified:
    - src/vite.config.ts
    - src/package.json
    - src/src/lib/shiki-highlighter.ts
    - src/src/lib/shiki-highlighter.test.ts
    - src/src/hooks/useAutoCollapse.ts
    - src/src/hooks/useAutoCollapse.test.ts

key-decisions:
  - "5 vendor chunk groups (react, markdown, shiki, radix, zustand) per research guidance -- no per-component splitting to avoid circular deps"
  - "LRU eviction via Map iteration order (oldest-first delete) -- zero-dependency, O(1) amortized"
  - "Single shared IntersectionObserver with Element->messageId map instead of per-message observers"

patterns-established:
  - "Map-based LRU cache: delete oldest key via keys().next().value when size >= limit"
  - "Shared observer pattern: one IO instance with element-to-ID reverse lookup map"

requirements-completed: [PERF-04, PERF-05, PERF-03, PERF-01]

# Metrics
duration: 6min
completed: 2026-03-17
---

# Phase 37 Plan 01: Bundle Optimization Summary

**Vendor chunk splitting (5 groups), bounded shiki LRU cache (500 entries), and single shared IntersectionObserver for message collapse**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-17T15:55:50Z
- **Completed:** 2026-03-17T16:01:53Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Split monolithic 1.1MB main chunk into 5 vendor groups: vendor-react (253KB), vendor-markdown (310KB), vendor-shiki (746KB), vendor-radix (107KB), vendor-zustand
- Added bundle analysis tooling with interactive treemap report at dist/bundle-report.html
- Bounded shiki highlight cache at 500 entries with LRU eviction (was unbounded Map)
- Consolidated N per-message IntersectionObservers into 1 shared observer with element-to-messageId mapping

## Task Commits

Each task was committed atomically:

1. **Task 1: Bundle analysis tooling + vendor chunk splitting** - `e26fa53` (feat)
2. **Task 2: Bounded shiki cache + single shared IntersectionObserver** - `56bf6c9` (feat)

## Files Created/Modified
- `src/vite.config.ts` - Added manualChunks config (5 vendor groups) + conditional visualizer plugin
- `src/package.json` - Added rollup-plugin-visualizer devDep + build:analyze script
- `src/src/lib/shiki-highlighter.ts` - Replaced unbounded Map with LRU cache (MAX_CACHE_SIZE=500)
- `src/src/lib/shiki-highlighter.test.ts` - Added 3 cache bounding tests
- `src/src/hooks/useAutoCollapse.ts` - Refactored from N observers to 1 shared observer
- `src/src/hooks/useAutoCollapse.test.ts` - Updated tests for single-observer pattern (13 tests)

## Decisions Made
- 5 vendor chunk groups (react, markdown, shiki, radix, zustand) -- kept broad per research guidance to avoid circular dependency issues
- LRU eviction via Map iteration order (oldest-first delete) -- zero-dependency, O(1) amortized
- Single shared IntersectionObserver with Element->messageId reverse map replaces per-message observers
- Exported MAX_CACHE_SIZE and getCacheSize() from shiki-highlighter for testability

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Bundle analysis report available via `npm run build:analyze`
- Performance foundations in place for remaining 37-performance plans
- All 1276 tests passing, build clean

---
*Phase: 37-performance*
*Completed: 2026-03-17*
