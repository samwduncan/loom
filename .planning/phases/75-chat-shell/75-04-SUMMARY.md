---
phase: 75-chat-shell
plan: 04
subsystem: ui
tags: [react-native, tool-chip, bottom-sheet, permission-card, haptics, reanimated, lucide]

requires:
  - phase: 75-chat-shell
    provides: "Plan 01 foundation (theme Small typography, npm deps for bottom-sheet, message segments)"
provides:
  - ToolChip inline component with 6 tool-type icons and 4 status states
  - ToolDetailSheet modal bottom sheet with full tool details (args, output, error, duration)
  - ToolDetailSheetProvider (re-export of BottomSheetModalProvider)
  - PermissionCard with Approve/Deny, WebSocket send, store clear, and status transform
  - narrowInput() pattern for safely handling unknown-typed PermissionRequest.input
affects: [75-05-message-rendering, 75-06-streaming]

tech-stack:
  added: []
  patterns: ["narrowInput() helper for unknown -> Record<string, unknown> narrowing", "AnimatedPressable for Micro spring press feedback", "React.memo with custom comparator on id+status"]

key-files:
  created:
    - mobile/components/chat/segments/ToolChip.tsx
    - mobile/components/chat/segments/ToolDetailSheet.tsx
    - mobile/components/chat/segments/PermissionCard.tsx
  modified: []

key-decisions:
  - "ToolChip uses React.memo with id+status custom comparator to avoid re-renders on unrelated prop changes"
  - "ToolDetailSheet re-exports BottomSheetModalProvider as ToolDetailSheetProvider for clean API"
  - "PermissionCard AR fix: narrowInput() safely narrows unknown to Record<string, unknown> before property access"
  - "Both shadows (heavy + glow) applied to PermissionCard pending state for warm attention halo"

patterns-established:
  - "narrowInput(unknown): Record<string, unknown> -- safe type narrowing pattern for PermissionRequest.input"
  - "AnimatedPressable = Animated.createAnimatedComponent(Pressable) for spring press feedback"
  - "getToolIcon() mapping 6 known tools to lucide icons, Wrench as default"

requirements-completed: [CHAT-04, CHAT-12]

duration: 4min
completed: 2026-04-03
---

# Phase 75 Plan 04: Tool Chips, Detail Sheet, and Permission Cards Summary

**Tool call inline chips (6 icons, 4 status states), modal bottom sheet detail view, and permission approval cards with Approve/Deny buttons + WebSocket permission response**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-03T23:35:10Z
- **Completed:** 2026-04-03T23:39:58Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Created ToolChip inline component with 6 tool-specific lucide icons (Terminal, FileText, Pencil, FilePlus, Search, FileSearch) and 4 status states (spinner, pulsing dot, Check, X)
- Created ToolDetailSheet modal bottom sheet with snap points ['50%', '80%'], full tool details (arguments as key-value pairs, output, error, duration), overlay Tier 3 surface
- Created PermissionCard with 3-state machine (pending/approved/denied), Approve/Deny buttons sending claude-permission-response via WebSocket, Dramatic entrance spring with Warning haptic, compact status line transform after action

## Task Commits

Each task was committed atomically:

1. **Task 1: ToolChip inline component** - `fcbc009` (feat)
2. **Task 2: ToolDetailSheet bottom sheet** - `a801ba8` (feat)
3. **Task 3: PermissionCard with Approve/Deny** - `28b196e` (feat)

Lint fix: `1f9ad4f` (fix: remove unused View import from ToolChip)

## Files Created/Modified
- `mobile/components/chat/segments/ToolChip.tsx` - Inline tool call chip with icon, name, status indicator, Micro spring press, Selection haptic, React.memo
- `mobile/components/chat/segments/ToolDetailSheet.tsx` - Modal bottom sheet with full tool details, BottomSheetModalProvider re-export
- `mobile/components/chat/segments/PermissionCard.tsx` - Permission approval card with Approve/Deny, WebSocket send, store clear, status transform

## Decisions Made
- **React.memo comparator:** ToolChip uses custom comparator on `toolCall.id` and `toolCall.status` only -- avoids re-renders when unrelated ToolCallState fields change (e.g., output arriving doesn't re-render a chip already showing "resolved")
- **ToolDetailSheetProvider re-export:** Instead of a custom wrapper, re-exports BottomSheetModalProvider directly as ToolDetailSheetProvider -- simpler and equally functional
- **AR fix #1 pattern:** Created `narrowInput()` helper that safely narrows `unknown` to `Record<string, unknown>` with runtime type guard -- prevents TypeScript errors and runtime crashes when PermissionRequest.input is not an object
- **Dual shadow on PermissionCard:** Applied both `shadows.heavy` and `shadows.glow(accent)` to pending state for the warm attention halo specified in D-22

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed unused View import from ToolChip**
- **Found during:** Post-task lint verification
- **Issue:** `View` was imported from react-native but not used in ToolChip (all containers use Animated.View or AnimatedPressable)
- **Fix:** Removed `View` from import statement
- **Files modified:** mobile/components/chat/segments/ToolChip.tsx
- **Verification:** `npx expo lint` shows no warnings in ToolChip
- **Committed in:** 1f9ad4f

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Trivial import cleanup. No scope creep.

## Issues Encountered
- 43 pre-existing TypeScript errors remain in the mobile project (known NativeWind v4 type issues from Phase 68/69). None in files created by this plan. Count has actually decreased from 59 (Plan 01) to 43 -- likely due to parallel plan work resolving some issues.

## User Setup Required
None - no external service configuration required.

## Known Stubs
None - all files contain complete implementations with real logic, real WebSocket sends, and real store actions.

## Next Phase Readiness
- All 3 segment components ready for integration in Plan 05 (message rendering)
- ToolChip's onPress callback ready to wire to ToolDetailSheet visibility state in parent
- PermissionCard imports useStreamStore and getWsClient directly -- no additional wiring needed
- ToolDetailSheetProvider must be placed outside FlatList at chat screen or app root level

---
*Phase: 75-chat-shell*
*Completed: 2026-04-03*

## Self-Check: PASSED

All 4 files verified present. All 4 commits verified in git log.
