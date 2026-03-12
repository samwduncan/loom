---
phase: 25-terminal
plan: 01
subsystem: ui
tags: [xterm, websocket, terminal, shell, oklch, react-hook]

# Dependency graph
requires:
  - phase: 21-settings
    provides: "Design system tokens (OKLCH CSS custom properties)"
provides:
  - "Shell WS protocol types (ShellConnectionState, ShellClientMessage, ShellServerMessage)"
  - "Terminal theme function (getTerminalTheme) mapping CSS vars to xterm ITheme"
  - "ShellWebSocketClient class for /shell endpoint lifecycle"
  - "useShellWebSocket React hook with strict mode guard"
affects: [25-terminal-02, 25-terminal-03]

# Tech tracking
tech-stack:
  added: ["@xterm/xterm", "@xterm/addon-fit", "@xterm/addon-web-links"]
  patterns: ["ShellWebSocketClient (per-instance, not singleton)", "null-check ref init pattern"]

key-files:
  created:
    - src/src/types/shell.ts
    - src/src/components/terminal/terminal-theme.ts
    - src/src/components/terminal/terminal-theme.test.ts
    - src/src/lib/shell-ws-client.ts
    - src/src/hooks/useShellWebSocket.ts
    - src/src/hooks/useShellWebSocket.test.ts
  modified:
    - src/package.json

key-decisions:
  - "Null-check (== null) ref init pattern for ShellWebSocketClient in useShellWebSocket -- avoids refs-during-render lint violation"
  - "lastWs() helper in tests for type-safe MockWebSocket access without non-null assertions everywhere"
  - "addEventListener/removeEventListener on WS (not onopen/onclose) for cleaner cleanup in disconnect"

patterns-established:
  - "Shell WS client per-instance: each terminal panel gets own ShellWebSocketClient (not singleton like chat WS)"
  - "No auto-reconnect for shell WS: user clicks Reconnect explicitly"

requirements-completed: [TERM-02, TERM-06, TERM-07, TERM-08, TERM-12, TERM-14]

# Metrics
duration: 5min
completed: 2026-03-11
---

# Phase 25 Plan 01: Terminal Infrastructure Summary

**xterm.js deps installed, shell WS protocol types, OKLCH terminal theme, and ShellWebSocketClient with React hook**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-11T01:13:36Z
- **Completed:** 2026-03-11T01:19:29Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Installed @xterm/xterm, @xterm/addon-fit, @xterm/addon-web-links
- Shell protocol types with discriminated unions for client/server messages
- getTerminalTheme() maps 8 OKLCH CSS vars + hardcoded bright variants to xterm ITheme
- ShellWebSocketClient class with connect/disconnect/restart/sendInput/sendResize
- useShellWebSocket hook with strict mode guard, auth URL state, and cleanup on unmount
- 20 new tests (5 theme + 15 WS client/hook), 940 total suite passing

## Task Commits

Each task was committed atomically:

1. **Task 1: Install deps, define types, build terminal theme** - `0573660` (feat)
2. **Task 2: Shell WebSocket client class and React hook** - `fe6ce4a` (feat)

_Note: TDD RED phase for Task 2 could not be committed separately due to typecheck pre-commit hook._

## Files Created/Modified
- `src/src/types/shell.ts` - Shell WS protocol types (ShellConnectionState, ShellClientMessage, ShellServerMessage)
- `src/src/components/terminal/terminal-theme.ts` - OKLCH CSS var to xterm ITheme mapping
- `src/src/components/terminal/terminal-theme.test.ts` - 5 tests for theme CSS variable mapping
- `src/src/lib/shell-ws-client.ts` - Raw WebSocket client class for /shell endpoint
- `src/src/hooks/useShellWebSocket.ts` - React hook wrapping ShellWebSocketClient
- `src/src/hooks/useShellWebSocket.test.ts` - 15 tests for WS client and hook
- `src/package.json` - Added xterm.js dependencies

## Decisions Made
- Null-check (== null) ref init pattern for ShellWebSocketClient in hook -- avoids refs-during-render lint violation while keeping the client stable across renders
- addEventListener/removeEventListener on WS instead of onopen/onclose -- enables cleaner cleanup in disconnect() by removing all handlers before closing
- lastWs() test helper -- avoids scattered non-null assertions on MockWebSocket.instances[0]

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed refs-during-render lint violation**
- **Found during:** Task 2 (useShellWebSocket hook)
- **Issue:** Accessing clientRef.current during render and assigning to `const client` triggered react-hooks/refs lint rule
- **Fix:** Used `== null` pattern for init (lint-approved) and accessed clientRef.current only inside effects/callbacks
- **Files modified:** src/src/hooks/useShellWebSocket.ts
- **Verification:** ESLint passes, all 15 tests pass
- **Committed in:** fe6ce4a (Task 2 commit)

**2. [Rule 1 - Bug] Fixed non-null assertion ASSERT comments**
- **Found during:** Task 2 (test file)
- **Issue:** Custom loom/no-non-null-without-reason rule requires trailing `// ASSERT: [reason]` on same line as `!`, not preceding line
- **Fix:** Moved ASSERT comments to trailing position on assertion lines
- **Files modified:** src/src/hooks/useShellWebSocket.test.ts
- **Verification:** ESLint passes
- **Committed in:** fe6ce4a (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 bug fixes)
**Impact on plan:** Both fixes were lint compliance issues caught by pre-commit hooks. No scope creep.

## Issues Encountered
- TDD RED phase could not produce a separate commit because the typecheck pre-commit hook rejects files that import non-existent modules. The RED and GREEN phases were combined into a single commit.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All non-visual terminal infrastructure ready for Plan 02 (TerminalView component)
- Types, theme, WS client, and React hook are fully tested and exported
- No blockers

---
*Phase: 25-terminal*
*Completed: 2026-03-11*
