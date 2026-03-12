---
phase: 25-terminal
plan: 02
subsystem: ui
tags: [xterm, terminal, react-lazy, resize-observer, websocket, oklch]

# Dependency graph
requires:
  - phase: 25-terminal-01
    provides: "Shell WS types, terminal theme, ShellWebSocketClient, useShellWebSocket hook"
  - phase: 20-layout
    provides: "ContentArea CSS show/hide mount-once pattern"
provides:
  - "TerminalView component with xterm.js instance lifecycle"
  - "TerminalHeader with connection state dots and control buttons"
  - "TerminalOverlay with disconnected overlay and auth URL banner"
  - "TerminalPanel composing all terminal components with WS hook"
  - "ContentArea lazy-loaded terminal integration"
affects: [25-terminal-03]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Props-based callback pattern for xterm.js wiring (onData/onResize/onReady)", "Class-based mocks for xterm.js in vitest"]

key-files:
  created:
    - src/src/components/terminal/TerminalView.tsx
    - src/src/components/terminal/TerminalView.test.tsx
    - src/src/components/terminal/TerminalHeader.tsx
    - src/src/components/terminal/TerminalHeader.test.tsx
    - src/src/components/terminal/TerminalOverlay.tsx
    - src/src/components/terminal/TerminalOverlay.test.tsx
    - src/src/components/terminal/TerminalPanel.tsx
    - src/src/components/terminal/styles/terminal.css
  modified:
    - src/src/components/content-area/view/ContentArea.tsx

key-decisions:
  - "Props-based callback pattern (onData/onResize/onReady) for TerminalView -- parent owns WS hook, view is pure xterm wrapper"
  - "writeRef pattern: parent stores terminal.write fn via onReady callback, WS output routed through ref"
  - "Class-based mocks for xterm.js Terminal/FitAddon in tests -- vi.fn() cannot be used as constructor"
  - "border-border/8 for header border (matching existing FileTreePanel, TabBar patterns) -- no border-default token exists"

patterns-established:
  - "Props callback pattern for terminal: onData/onResize/onReady avoids TerminalView needing project context"
  - "TerminalSkeleton as Suspense fallback for lazy-loaded terminal panel"

requirements-completed: [TERM-01, TERM-03, TERM-04, TERM-05, TERM-09, TERM-10, TERM-11, TERM-13, TERM-15]

# Metrics
duration: 5min
completed: 2026-03-11
---

# Phase 25 Plan 02: Terminal UI Summary

**xterm.js TerminalView with resize/visibility-aware fitting, TerminalHeader with connection state dots, TerminalOverlay with disconnected/auth UI, TerminalPanel composition, and lazy-loaded ContentArea integration**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-11T01:21:45Z
- **Completed:** 2026-03-11T01:26:58Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- TerminalView with xterm.js Terminal lifecycle: mount, open, fit, dispose with FitAddon + WebLinksAddon
- ResizeObserver with 100ms debounce, visibility-aware fitting, re-fit on tab switch
- TerminalHeader showing connection state dots (yellow pulse/green/red) with Restart and Disconnect buttons
- TerminalOverlay with "Session ended" reconnect overlay and dismissible auth URL banner
- TerminalPanel composing all pieces, owning useShellWebSocket + useProjectContext
- ContentArea lazy-loads TerminalPanel via React.lazy with TerminalSkeleton fallback
- 23 new tests (963 total suite passing)

## Task Commits

Each task was committed atomically:

1. **Task 1: TerminalView -- xterm.js instance with resize and WebSocket wiring** - `4e9a630` (feat)
2. **Task 2: TerminalHeader, TerminalOverlay, TerminalPanel, and ContentArea wiring** - `141b59b` (feat)

## Files Created/Modified
- `src/src/components/terminal/TerminalView.tsx` - xterm.js instance with FitAddon, WebLinksAddon, resize/visibility handling
- `src/src/components/terminal/TerminalView.test.tsx` - 8 tests with class-based xterm.js mocks
- `src/src/components/terminal/TerminalHeader.tsx` - Connection state dots, Shell label, Restart/Disconnect buttons
- `src/src/components/terminal/TerminalHeader.test.tsx` - 8 tests for state dots and button behavior
- `src/src/components/terminal/TerminalOverlay.tsx` - Disconnected overlay with reconnect, auth URL banner
- `src/src/components/terminal/TerminalOverlay.test.tsx` - 7 tests for overlay and auth URL banner
- `src/src/components/terminal/TerminalPanel.tsx` - Composing container owning WS hook and project context
- `src/src/components/terminal/styles/terminal.css` - xterm.js base CSS import + container styling
- `src/src/components/content-area/view/ContentArea.tsx` - Replaced Shell PanelPlaceholder with lazy TerminalPanel

## Decisions Made
- Props-based callback pattern (onData/onResize/onReady) keeps TerminalView as a pure xterm wrapper without project context dependency
- writeRef pattern: parent stores terminal.write fn via onReady callback, routes WS output through the ref
- Class-based mocks for xterm.js constructors in vitest (vi.fn() doesn't work as constructor)
- Used `border-border/8` for header border to match existing patterns (FileTreePanel, TabBar, EditorBreadcrumb)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed xterm.js mock constructors in tests**
- **Found during:** Task 1 (TerminalView tests)
- **Issue:** vi.fn(() => instance) cannot be used with `new` keyword -- "not a constructor" error
- **Fix:** Used ES6 class mocks for Terminal, FitAddon, WebLinksAddon, and ResizeObserver
- **Files modified:** src/src/components/terminal/TerminalView.test.tsx
- **Verification:** All 8 tests pass
- **Committed in:** 4e9a630 (Task 1 commit)

**2. [Rule 1 - Bug] Fixed TypeScript tuple type error for mock.calls access**
- **Found during:** Task 1 (pre-commit typecheck)
- **Issue:** `vi.fn(() => ({ dispose: vi.fn() })).mock.calls[0][0]` inferred as empty tuple, TypeScript rejected index access
- **Fix:** Cast mock.calls to explicit tuple type: `as unknown as [[(data: string) => void]]`
- **Files modified:** src/src/components/terminal/TerminalView.test.tsx
- **Verification:** TypeScript noEmit passes
- **Committed in:** 4e9a630 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (2 bug fixes in test infrastructure)
**Impact on plan:** Both fixes were test mock compatibility issues. No scope creep.

## Issues Encountered
- vitest `-x` flag (bail on first failure) not supported -- removed from test commands
- TDD RED phase combined with GREEN (same as Plan 01) due to typecheck pre-commit hook rejecting imports of non-existent modules

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All terminal UI components complete, ready for Plan 03 (if exists) or phase completion
- Terminal is fully wired: user types -> WS -> backend -> WS -> terminal.write
- Lazy-loading ensures terminal not in initial bundle
- CSS show/hide preserves terminal session across tab switches

---
*Phase: 25-terminal*
*Completed: 2026-03-11*
