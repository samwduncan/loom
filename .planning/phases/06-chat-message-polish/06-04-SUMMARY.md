---
phase: 06-chat-message-polish
plan: 04
subsystem: ui
tags: [react, tailwind, intersection-observer, token-usage, pricing, chat-layout]

# Dependency graph
requires:
  - phase: 05-chat-message-architecture
    provides: TurnBlock, useTurnGrouping, ChatMessagesPane turn-based rendering
  - phase: 06-chat-message-polish (plans 01-03)
    provides: SystemStatusMessage, warm palette, permission banners
provides:
  - Per-turn usage footer with token counts and cost
  - Pricing utility for Claude/Codex/Gemini models
  - IntersectionObserver-based collapse-on-scroll-away
  - Centered max-width 720px chat layout
  - System status and error message rendering in MessageComponent
  - Session cumulative token count display
affects: [06-chat-message-polish]

# Tech tracking
tech-stack:
  added: []
  patterns: [IntersectionObserver scroll-away collapse with debounce, per-1M-token pricing table, collapsedTurns inverted state pattern]

key-files:
  created:
    - src/components/chat/utils/pricing.ts
    - src/components/chat/view/subcomponents/TurnUsageFooter.tsx
  modified:
    - src/components/chat/types/types.ts
    - src/components/chat/hooks/useTurnGrouping.ts
    - src/components/chat/view/subcomponents/TurnBlock.tsx
    - src/components/chat/view/subcomponents/ChatMessagesPane.tsx
    - src/components/chat/view/subcomponents/MessageComponent.tsx
    - src/components/chat/view/subcomponents/ChatInputControls.tsx

key-decisions:
  - "collapsedTurns inverted state: track which turns are collapsed (empty set = all expanded) instead of tracking expanded turns"
  - "IntersectionObserver with 300ms debounce for scroll-away collapse, threshold 0.1"
  - "Streaming turns protected from IntersectionObserver collapse via ref-tracked streaming set"
  - "Usage data extracted from assistant messages via usage/tokenUsage properties with snake_case fallbacks"
  - "Task 3 changes co-committed by parallel 06-06 agent (same file edit window)"

patterns-established:
  - "IntersectionObserver collapse pattern: observe turn wrapper divs, debounce collapse, protect streaming turns"
  - "Pricing utility: hardcoded MODEL_PRICING table with fuzzy model matching and fallback to claude-default"
  - "TurnUsage type: inputTokens, outputTokens, cacheReadTokens, cacheCreationTokens"

requirements-completed: [CHAT-13, CHAT-15, CHAT-16]

# Metrics
duration: 6min
completed: 2026-03-02
---

# Phase 6 Plan 4: Usage Footers, Centered Layout, Continuous Flow Summary

**Per-turn token/cost footers via pricing utility, centered 720px layout, IntersectionObserver scroll-away collapse, continuous 1px-divider turn flow, system status message routing**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-02T22:12:18Z
- **Completed:** 2026-03-02T22:18:20Z
- **Tasks:** 5
- **Files modified:** 8

## Accomplishments
- Created pricing utility with Claude/Codex/Gemini model pricing and cost calculator
- TurnUsageFooter component renders token breakdown and cost at bottom of every completed AI turn
- Removed auto-collapse behavior and replaced with IntersectionObserver scroll-away collapse (300ms debounce)
- Chat content centered at max-width 720px for readability on wide screens
- AI turn sub-elements now separated by thin 1px warm-tinted dividers instead of whitespace gaps
- System and error messages routed to SystemStatusMessage component with tiered styling
- Session cumulative token count displayed near TokenUsagePie under chat composer

## Task Commits

Each task was committed atomically:

1. **Task 1: Create pricing utility and TurnUsageFooter** - `2e70553` (feat)
2. **Task 2a: Remove auto-collapse, IntersectionObserver, centered layout** - `77ba105` (feat)
3. **Task 2b: Continuous turn flow with dividers and usage footer** - `46afefe` (feat)
4. **Task 3: Wire system status messages into MessageComponent** - `9ab2dda` (feat, co-committed with 06-06)
5. **Task 4: Session cumulative total under chat composer** - `5635631` (feat)

## Files Created/Modified
- `src/components/chat/utils/pricing.ts` - Model pricing table, cost calculator, token formatter
- `src/components/chat/view/subcomponents/TurnUsageFooter.tsx` - Per-turn usage display component
- `src/components/chat/types/types.ts` - Extended Turn interface with usage/model fields
- `src/components/chat/hooks/useTurnGrouping.ts` - Usage and model extraction from assistant messages
- `src/components/chat/view/subcomponents/TurnBlock.tsx` - Continuous flow dividers, usage footer rendering
- `src/components/chat/view/subcomponents/ChatMessagesPane.tsx` - IntersectionObserver, centered layout, collapsedTurns
- `src/components/chat/view/subcomponents/MessageComponent.tsx` - System/error message routing
- `src/components/chat/view/subcomponents/ChatInputControls.tsx` - Cumulative token count display

## Decisions Made
- Used collapsedTurns (inverted) state pattern instead of expandedTurns -- all turns default expanded with empty set
- IntersectionObserver threshold 0.1 with 300ms debounce balances responsiveness with avoiding flicker
- Streaming turns protected from observer collapse via separate ref-tracked streaming set updated from items
- Usage data extraction uses fallbacks for both camelCase and snake_case property names
- Task 3 was co-committed by a parallel 06-06 agent that modified the same file -- changes are verified present

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Task 3 commit was absorbed by a parallel 06-06 agent that committed MessageComponent.tsx changes in the same git operation. The code changes from Task 3 are verified present in commit `9ab2dda`. No code was lost.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All layout and usage display infrastructure is in place
- Plans 06-05 and 06-06 can proceed with remaining polish
- sessionCost prop on ChatInputControls is future-proofed for when parent computes cumulative cost from turns

## Self-Check: PASSED

All 8 created/modified files verified present. All 5 task commits verified in git history.

---
*Phase: 06-chat-message-polish*
*Completed: 2026-03-02*
