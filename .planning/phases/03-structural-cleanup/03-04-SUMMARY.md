---
phase: 03-structural-cleanup
plan: 04
subsystem: ui
tags: [react, provider-ux, dropdown, welcome-screen, localStorage]

requires:
  - phase: 03-structural-cleanup/03-03
    provides: "Cursor provider removed, 3-provider codebase (Claude, Codex, Gemini)"
provides:
  - "ProviderDropdown header component for switching providers"
  - "ComposerProviderPicker mini-picker near send button"
  - "One-time welcome screen with loom-welcomed localStorage flag"
  - "Default-to-Claude flow for new sessions"
affects: [05-chat-experience, provider-switching, onboarding]

tech-stack:
  added: []
  patterns:
    - "Click-outside/Escape close pattern for popups"
    - "localStorage flag for one-time UI gating (loom-welcomed)"

key-files:
  created:
    - src/components/chat/view/subcomponents/ProviderDropdown.tsx
    - src/components/chat/view/subcomponents/ComposerProviderPicker.tsx
  modified:
    - src/components/chat/view/ChatInterface.tsx
    - src/components/chat/view/subcomponents/ChatComposer.tsx
    - src/components/chat/view/subcomponents/ProviderSelectionEmptyState.tsx

key-decisions:
  - "Header bar added above ChatMessagesPane for ProviderDropdown placement"
  - "ComposerProviderPicker positioned left of send button with absolute positioning"
  - "Welcome screen uses React state + localStorage for instant dismiss without remount"
  - "Provider selection grid replaced entirely (not hidden) — clean break from old UX"

patterns-established:
  - "Popup close pattern: useRef + mousedown listener for click-outside, keydown for Escape"
  - "One-time gating: localStorage check in useState initializer + setter on dismiss"

requirements-completed: [FORK-03]

duration: 3min
completed: 2026-03-02
---

# Phase 3 Plan 4: Provider UX Summary

**Header dropdown and composer mini-picker for provider switching, one-time welcome screen replacing provider selection gate, default-to-Claude flow**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-02T18:02:37Z
- **Completed:** 2026-03-02T18:05:45Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- ProviderDropdown in chat header shows "Provider (Model)" with dropdown panel to switch between Claude, Codex, and Gemini
- ComposerProviderPicker near send button provides compact logo-based provider switching
- Both components share provider state — changing one reflects immediately in the other
- ProviderSelectionEmptyState repurposed as one-time welcome screen with "Start chatting" dismiss
- New sessions default to Claude with no provider selection gate
- Per-provider model memory intact (each provider remembers its last model independently)
- npm run build succeeds with zero errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Build ProviderDropdown and ComposerProviderPicker** - `c1c713a` (feat)
2. **Task 2: Repurpose ProviderSelectionEmptyState as welcome screen** - `9a53b6b` (feat)

## Files Created/Modified
- `src/components/chat/view/subcomponents/ProviderDropdown.tsx` - Header dropdown with provider/model display, click-outside close, Escape close
- `src/components/chat/view/subcomponents/ComposerProviderPicker.tsx` - Compact logo icon with popup picker showing 3 providers
- `src/components/chat/view/ChatInterface.tsx` - Added header bar with ProviderDropdown, derived model labels and provider options
- `src/components/chat/view/subcomponents/ChatComposer.tsx` - Added ComposerProviderPicker near send button with onProviderChange prop
- `src/components/chat/view/subcomponents/ProviderSelectionEmptyState.tsx` - Replaced provider selection grid with welcome screen + minimal empty state

## Decisions Made
- Header bar added above ChatMessagesPane as a new flex-shrink-0 element for consistent dropdown placement
- ComposerProviderPicker placed at absolute right-14 to sit just left of the send button without overlapping
- Welcome screen uses `useState` initialized from localStorage for instant dismiss without re-render delay
- Provider selection grid entirely replaced (not conditionally hidden) for clean codebase
- Unused imports (Check, ChevronDown, model constants) removed from ProviderSelectionEmptyState since provider selection is no longer its concern

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Provider UX complete, ready for plan 03-05 (final structural cleanup)
- Header dropdown and composer picker provide seamless provider switching
- Welcome screen introduces first-time users to available providers

## Self-Check: PASSED

All files created, all commits verified, build succeeds.

---
*Phase: 03-structural-cleanup*
*Completed: 2026-03-02*
