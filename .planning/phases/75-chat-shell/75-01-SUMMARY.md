---
phase: 75-chat-shell
plan: 01
subsystem: ui
tags: [react-native, expo, message-parser, date-grouping, toast, typography, bottom-sheet, syntax-highlighter]

requires:
  - phase: 74-shell-connection
    provides: theme system (LoomTheme, createStyles), Expo scaffold, shared types
provides:
  - MessageSegment discriminated union type and parseMessageSegments parser
  - Date section utility (getRelativeDateSection, groupSessionsByDate, SectionData)
  - Toast utility (showToast, ToastProvider) with undo action support
  - Small typography (13px) in LoomTheme type and theme object
  - Phase 75 npm dependencies installed (bottom-sheet, code-highlighter, syntax-highlighter, clipboard)
affects: [75-02-session-drawer, 75-03-code-blocks, 75-04-composer, 75-05-message-rendering, 75-06-streaming]

tech-stack:
  added: ["@gorhom/bottom-sheet", "react-native-code-highlighter", "react-syntax-highlighter", "expo-clipboard", "@types/react-syntax-highlighter"]
  patterns: ["segment-based message rendering", "module-scoped callback pattern for toast", "start-of-day date comparison"]

key-files:
  created:
    - mobile/lib/message-segments.ts
    - mobile/lib/date-sections.ts
    - mobile/lib/toast.tsx
  modified:
    - mobile/package.json
    - mobile/theme/types.ts
    - mobile/theme/theme.ts

key-decisions:
  - "Segment parser uses state machine for code block extraction (not regex)"
  - "Tool calls grouped after text/code (no position markers from backend)"
  - "Toast uses module-scoped callback to avoid Context overhead"
  - "Toast file is .tsx (not .ts) to support JSX rendering"
  - "Date sections use start-of-day comparison for correct midnight boundary behavior"

patterns-established:
  - "MessageSegment discriminated union: all message renderers consume MessageSegment[]"
  - "Module-scoped callback pattern: register in Provider, invoke from module function"
  - "SectionData interface: {title, data[]} for SectionList consumption"

requirements-completed: [CHAT-03, CHAT-04, CHAT-05, CHAT-06, CHAT-01]

duration: 5min
completed: 2026-04-03
---

# Phase 75 Plan 01: Foundation Libraries Summary

**Message segment parser (5-type discriminated union), date section grouper, toast utility, Small typography, and 5 new npm dependencies for Phase 75 chat shell**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-03T23:26:52Z
- **Completed:** 2026-04-03T23:32:09Z
- **Tasks:** 4
- **Files modified:** 6

## Accomplishments
- Installed all Phase 75 npm dependencies in one batch (bottom-sheet, code-highlighter, syntax-highlighter, clipboard, types)
- Created message segment parser with 5-type discriminated union (text, thinking, tool_use, code_block, permission) and state machine code fence extraction
- Created date section utility grouping sessions into Today/Yesterday/Last Week/Older with stable ordering
- Created toast utility with module-scoped callback pattern, Spring animation, and undo action support
- Extended LoomTheme with Small (13px) typography between body (15px) and caption (12px)

## Task Commits

Each task was committed atomically:

1. **Task 1: Install dependencies and extend theme** - `d3d9297` (feat)
2. **Task 2: Create toast utility** - `0f73dcc` (feat)
3. **Task 3: Create message segment parser** - `c1b3d4c` (feat)
4. **Task 4: Create date section utility** - `39a3dab` (feat)

## Files Created/Modified
- `mobile/package.json` - 5 new dependencies added (@gorhom/bottom-sheet, react-native-code-highlighter, react-syntax-highlighter, expo-clipboard, @types/react-syntax-highlighter)
- `mobile/theme/types.ts` - Small typography added to LoomTheme interface
- `mobile/theme/theme.ts` - Small typography (13px/400/18px LH) added to theme object
- `mobile/lib/toast.tsx` - Toast utility with showToast + ToastProvider, Spring animation, undo action
- `mobile/lib/message-segments.ts` - MessageSegment union type + parseMessageSegments parser
- `mobile/lib/date-sections.ts` - SectionData + getRelativeDateSection + groupSessionsByDate

## Decisions Made
- **Segment parser code extraction**: Used state machine (line-by-line with fence counting) instead of regex for code block extraction -- more robust with edge cases like nested backticks
- **Tool call positioning**: Tool calls grouped after all text/code segments rather than interleaved at position -- backend doesn't provide position markers, visual result matches common case
- **Toast as .tsx**: JSX components require .tsx extension in React Native TypeScript -- plan specified .ts but deviation was necessary (Rule 3: blocking)
- **Module-scoped callback for toast**: Avoids React Context overhead for a utility that's called imperatively from non-component code (e.g., gesture handlers)
- **Start-of-day date comparison**: Prevents a session from 11:59 PM yesterday appearing as "Today" when viewed at 12:01 AM

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Toast file renamed from .ts to .tsx**
- **Found during:** Task 2 (toast utility creation)
- **Issue:** Plan specified `mobile/lib/toast.ts` but the file contains JSX (React components). TypeScript does not parse JSX in .ts files.
- **Fix:** Created as `mobile/lib/toast.tsx` instead
- **Files modified:** mobile/lib/toast.tsx
- **Verification:** `npx tsc --noEmit` shows no errors in toast.tsx
- **Committed in:** 0f73dcc

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Trivial file extension change. No scope creep.

## Issues Encountered
- 59 pre-existing TypeScript errors (TS2786, TS2322, TS2307, TS2724) remain in the mobile project -- all in existing files (DrawerContent, ChatHeader, AuthScreen, etc.), none in files created/modified by this plan. These are documented in MEMORY.md as known NativeWind v4 type issues from Phase 68/69.

## User Setup Required
None - no external service configuration required.

## Known Stubs
None - all files contain complete implementations with real logic.

## Next Phase Readiness
- All Wave 2 plans (02, 03) can now import toast utility, message segments, and date sections
- Theme extended with Small typography for tool labels, timestamps, date headers
- npm dependencies installed for bottom sheet (Plan 02), syntax highlighting (Plan 03), clipboard (Plan 03)

---
*Phase: 75-chat-shell*
*Completed: 2026-04-03*

## Self-Check: PASSED

All 6 files verified present. All 4 task commits verified in git log.
