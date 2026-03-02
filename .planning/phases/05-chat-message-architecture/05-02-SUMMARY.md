---
phase: 05-chat-message-architecture
plan: 02
subsystem: ui
tags: [react, css-grid, animation, thinking-blocks, activity-indicator, lucide-react]

# Dependency graph
requires:
  - phase: 01-design-system-foundation
    provides: CSS variables, Tailwind conventions
provides:
  - ThinkingDisclosure component with smooth CSS grid animation and per-block eye toggle
  - ActivityIndicator component with Claude CLI-style rotating phrases and blinking amber text
  - Global showThinking preference wired through to ThinkingDisclosure via showByDefault prop
affects: [05-chat-message-architecture]

# Tech tracking
tech-stack:
  added: [lucide-react Eye/EyeOff icons]
  patterns: [CSS grid 0fr/1fr smooth height animation, rotating phrase indicators]

key-files:
  created:
    - src/components/chat/view/subcomponents/ThinkingDisclosure.tsx
    - src/components/chat/view/subcomponents/ActivityIndicator.tsx
  modified:
    - src/components/chat/view/subcomponents/MessageComponent.tsx
    - src/components/chat/view/subcomponents/AssistantThinkingIndicator.tsx

key-decisions:
  - "CSS grid 0fr/1fr animation instead of native <details> for smooth height transitions"
  - "Plain text whitespace-pre-wrap for thinking content (not Markdown) since reasoning is raw text"
  - "Per-block eye toggle only visible during streaming to avoid UI clutter on completed blocks"

patterns-established:
  - "CSS grid collapse: Use grid-template-rows 0fr/1fr with overflow:hidden inner div for smooth expand/collapse"
  - "Activity indicators: Rotating phrase arrays with random start index to avoid visual synchronization"

requirements-completed: [CHAT-08]

# Metrics
duration: 2min
completed: 2026-03-02
---

# Phase 5 Plan 2: Thinking Block Disclosure & Activity Indicator Summary

**Claude.ai-style thinking disclosure with CSS grid animation and CLI-style rotating phrase activity indicator replacing pulsing dots**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-02T19:34:07Z
- **Completed:** 2026-03-02T19:36:41Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- ThinkingDisclosure component with smooth CSS grid 0fr/1fr height animation, disclosure triangle, muted styling, per-block eye toggle for streaming visibility
- ActivityIndicator component with 12 rotating status phrases, blinking amber text, random start index, provider logo
- MessageComponent wired to use ThinkingDisclosure for both isThinking messages and reasoning blocks
- Global showThinking toggle flows through as showByDefault prop -- no new settings UI needed
- Complete removal of native `<details>` elements and pulsing dots pattern

## Task Commits

Each task was committed atomically:

1. **Task 1: Build ThinkingDisclosure and ActivityIndicator components** - `07886ac` (feat)
2. **Task 2: Wire ThinkingDisclosure into MessageComponent and replace AssistantThinkingIndicator** - `952a7f8` (feat)

## Files Created/Modified
- `src/components/chat/view/subcomponents/ThinkingDisclosure.tsx` - Claude.ai-style collapsible thinking block with CSS grid animation, eye toggle, showByDefault prop
- `src/components/chat/view/subcomponents/ActivityIndicator.tsx` - Rotating phrase indicator with blinking amber text and provider logo
- `src/components/chat/view/subcomponents/MessageComponent.tsx` - Replaced native details with ThinkingDisclosure for isThinking and reasoning rendering
- `src/components/chat/view/subcomponents/AssistantThinkingIndicator.tsx` - Rewritten to render ActivityIndicator instead of pulsing dots

## Decisions Made
- Used CSS grid 0fr/1fr animation instead of native `<details>` element to enable smooth height transitions (native details snaps open/close)
- Thinking content rendered as plain text with whitespace-pre-wrap rather than Markdown since reasoning is raw text
- Per-block eye toggle icon only visible during streaming to avoid unnecessary UI noise on completed thinking blocks
- Auto-collapse on stream completion regardless of eye toggle state for clean final presentation

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing typecheck errors in `useShikiHighlighter.ts` (shiki type mismatch) -- not caused by this plan's changes, out of scope

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- ThinkingDisclosure and ActivityIndicator ready for use throughout chat UI
- Pattern established for future smooth-animation collapsible sections
- Remaining Phase 5 plans can build on the thinking block infrastructure

## Self-Check: PASSED

All files verified present. All commits verified in git log.

---
*Phase: 05-chat-message-architecture*
*Completed: 2026-03-02*
