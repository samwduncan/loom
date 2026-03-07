---
phase: 07-tool-registry-proof-of-life
plan: 01
subsystem: ui
tags: [react, typescript, tool-registry, css-animations, vitest, tdd]

# Dependency graph
requires:
  - phase: 06-streaming-engine-scroll-anchor
    provides: "ToolCallState and ThinkingState types from stream store"
provides:
  - "Pluggable tool-call registry (registerTool, getToolConfig, getRegisteredToolNames)"
  - "ToolChip compact pill component with status dot and expand/collapse"
  - "ToolCard shared expanded tool display component"
  - "ThinkingDisclosure collapsible thinking block component"
  - "CSS styling for tool chips and thinking disclosure with design tokens"
affects: [07-02-proof-of-life, chat-message-display, tool-call-rendering]

# Tech tracking
tech-stack:
  added: []
  patterns: [tool-registry-map-pattern, css-grid-expand-collapse, ref-based-state-derivation]

key-files:
  created:
    - src/src/lib/tool-registry.ts
    - src/src/lib/tool-registry.test.ts
    - src/src/components/chat/tools/ToolChip.tsx
    - src/src/components/chat/tools/ToolChip.test.tsx
    - src/src/components/chat/tools/ToolCard.tsx
    - src/src/components/chat/tools/tool-chip.css
    - src/src/components/chat/view/ThinkingDisclosure.tsx
    - src/src/components/chat/view/ThinkingDisclosure.test.tsx
    - src/src/components/chat/styles/thinking-disclosure.css
  modified: []

key-decisions:
  - "07-01: createElement instead of JSX in tool-registry.ts to keep .ts extension (test files reference .ts)"
  - "07-01: pre element styles moved to CSS class (.tool-card pre) to satisfy no-banned-inline-style ESLint rule"
  - "07-01: ThinkingDisclosure uses ref-based prev-value tracking + derived state instead of useEffect+setState to satisfy React 19 set-state-in-effect ESLint rule"

patterns-established:
  - "Tool registry Map pattern: registerTool(name, config) + getToolConfig(name) with default fallback"
  - "CSS grid-template-rows 0fr/1fr for smooth expand/collapse (mirrors Phase 3 AppShell pattern)"
  - "Ref-based previous-value tracking for deriving state from prop transitions without useEffect+setState"

requirements-completed: [COMP-01]

# Metrics
duration: 7min
completed: 2026-03-06
---

# Phase 7 Plan 01: Tool Registry + Display Components Summary

**Pluggable tool registry with 6 registered tools, ToolChip/ToolCard inline display, and ThinkingDisclosure with CSS grid animation -- all TDD with 41 new tests**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-06T16:59:26Z
- **Completed:** 2026-03-06T17:06:52Z
- **Tasks:** 3
- **Files created:** 9

## Accomplishments
- Map-based tool registry with registerTool/getToolConfig API, 6 registered tools (Bash, Read, Edit, Write, Glob, Grep), and graceful default fallback for unknown tools
- ToolChip compact pill component with colored status dots (pulse animation for active, static for complete), icon, name, chip label, and inline expand/collapse to ToolCard
- ThinkingDisclosure with pulsing "Thinking..." during active thinking, auto-collapse on completion, and CSS grid-template-rows smooth transition
- Full TDD -- 41 new tests across 3 test files, all green with zero regressions across 278 total tests

## Task Commits

Each task was committed atomically:

1. **Task 1: Tool registry module with 6 registered tools and default fallback** - `cc6af02` (feat)
2. **Task 2: ToolChip, ToolCard components with CSS styling** - `33ad67c` (feat)
3. **Task 3: ThinkingDisclosure component with CSS grid expand/collapse** - `28fc711` (feat)

## Files Created/Modified
- `src/src/lib/tool-registry.ts` - Pluggable tool-call registry with Map, truncation helpers, 6 tool registrations, DefaultToolCard
- `src/src/lib/tool-registry.test.ts` - 21 unit tests for registry API, all tools, default fallback, missing input graceful handling
- `src/src/components/chat/tools/ToolChip.tsx` - Memo-wrapped compact pill with status dot, icon, name, label, expand toggle
- `src/src/components/chat/tools/ToolChip.test.tsx` - 10 component tests for status dots, expand/collapse, error display, unknown tools
- `src/src/components/chat/tools/ToolCard.tsx` - Shared expanded card showing JSON input and truncated output
- `src/src/components/chat/tools/tool-chip.css` - Chip pill, status dot pulse animation, card layout, reduced motion
- `src/src/components/chat/view/ThinkingDisclosure.tsx` - Collapsible thinking block with auto-expand/collapse and user toggle
- `src/src/components/chat/view/ThinkingDisclosure.test.tsx` - 10 component tests for null/empty, pulse, auto-collapse, toggle, blocks
- `src/src/components/chat/styles/thinking-disclosure.css` - Thinking disclosure surface, pulse animation, grid transition

## Decisions Made
- Used `createElement` instead of JSX in tool-registry.ts to maintain .ts extension (test files reference .ts, avoiding .tsx requirement for a pure module)
- Moved `<pre>` element styles (margin, white-space, word-break) from inline style to CSS class `.tool-card pre` to satisfy the no-banned-inline-style ESLint Constitution rule
- ThinkingDisclosure uses ref-based previous-value tracking with derived state (`userToggled` state + `prevIsThinkingRef`) instead of useEffect+setState, satisfying React 19's set-state-in-effect ESLint rule

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] ToolCard inline styles violate ESLint no-banned-inline-style rule**
- **Found during:** Task 2 (ToolChip/ToolCard implementation)
- **Issue:** `<pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>` blocked by Constitution ESLint rule
- **Fix:** Moved styles to `.tool-card pre` CSS class in tool-chip.css
- **Files modified:** tool-chip.css, ToolCard.tsx
- **Verification:** ESLint passes clean
- **Committed in:** 33ad67c (Task 2 commit)

**2. [Rule 3 - Blocking] ThinkingDisclosure useEffect+setState violates React 19 set-state-in-effect rule**
- **Found during:** Task 3 (ThinkingDisclosure implementation)
- **Issue:** `setIsExpanded()` inside `useEffect` triggers ESLint react-hooks/set-state-in-effect error
- **Fix:** Replaced with ref-based prev-value tracking pattern: `prevIsThinkingRef` tracks transitions, `userToggled` state captures user interaction, `isExpanded` derived without effect
- **Files modified:** ThinkingDisclosure.tsx
- **Verification:** ESLint passes clean, all 10 tests pass including auto-collapse behavior
- **Committed in:** 28fc711 (Task 3 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking ESLint issues)
**Impact on plan:** Both auto-fixes necessary for Constitution compliance. No scope creep.

## Issues Encountered
None beyond the ESLint deviations documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Tool registry ready for Plan 02 to wire into ActiveMessage multi-span rendering
- ThinkingDisclosure ready for Plan 02 proof-of-life page composition
- ToolChip/ToolCard ready for inline tool call display in streaming pipeline
- All 278 tests green, 94.8% statement coverage

## Self-Check: PASSED

- All 9 created files verified on disk
- All 3 task commits verified in git log (cc6af02, 33ad67c, 28fc711)
- Full test suite: 278 tests, 24 files, all green
- Coverage: 94.8% statements, 95.56% lines

---
*Phase: 07-tool-registry-proof-of-life*
*Completed: 2026-03-06*
