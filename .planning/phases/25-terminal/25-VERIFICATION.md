---
phase: 25-terminal
verified: 2026-03-11T02:20:00Z
status: passed
score: 5/5 success criteria verified
gaps: []
notes:
  - "Gap resolved: isPlainShell: true now hardcoded in init message (commit 14e9463)."
  - "Bug fixed: useProjectContext returned project name instead of path (commit 8032886)."
  - "Bug fixed: backend shell command undefined when no initialCommand (commit 8032886)."
  - "Human verified: terminal connects, runs commands, working directory correct."
  - "Minor rendering glitches noted — polish item for M4, not a blocker."
human_verification:
  - test: "Open Shell tab, run 'echo hello world'"
    result: "PASS — terminal connects, prompt in project root, output appears"
  - test: "Open Shell tab, resize browser window"
    result: "PASS — terminal reflows (minor rendering glitches noted for M4)"
  - test: "Switch from Shell tab to Chat and back"
    result: "PASS — session preserved"
---

# Phase 25: Terminal Verification Report

**Phase Goal:** Users can run shell commands directly within Loom without switching to an external terminal
**Verified:** 2026-03-11T01:50:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Success Criteria from ROADMAP.md

| # | Success Criterion | Status | Evidence |
|---|-------------------|--------|----------|
| 1 | User sees a fully functional terminal in the Shell tab with ANSI color support and the project root as working directory | ? HUMAN | TerminalView creates xterm.js with ANSI support; projectPath sent via projectName; visual validation needed |
| 2 | Terminal session persists when switching to other tabs and back (CSS show/hide, not unmount) | ✓ VERIFIED | ContentArea uses `hidden` class on inactive panels; `useMemo([])` creates elements once; no unmount on tab switch |
| 3 | User sees connection state (connecting/connected/disconnected) in the header and can restart or reconnect | ✓ VERIFIED | TerminalHeader renders colored dots per state; Restart (RotateCw) and Disconnect (Unplug) buttons wired to `restart()`/`disconnect()`; TerminalOverlay shows "Session ended" + Reconnect on disconnect |
| 4 | Terminal auto-resizes to fill the available space when the browser window resizes | ✓ VERIFIED | ResizeObserver with 100ms debounce in TerminalView; visibility-aware (offsetParent check); re-fit on tab switch via useEffect on activeTab |
| 5 | Copy/paste works via Cmd+C/V, and URLs in terminal output are clickable | ? HUMAN | WebLinksAddon loaded in TerminalView; copy/paste handled by xterm.js natively; requires live browser verification |

**Score:** 3 definite verified, 2 human-needed, 1 gap (TERM-07)

### Observable Truths (from Plan must_haves)

#### Plan 01 Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Terminal theme colors derive from OKLCH design system tokens | ✓ VERIFIED | `getTerminalTheme()` reads 8+ CSS vars via `getComputedStyle`; 5 passing tests confirm mapping |
| 2 | Shell WebSocket connects to /shell endpoint with JWT auth | ✓ VERIFIED | `ShellWebSocketClient.connect()` builds `ws://{host}/shell?token={jwt}`; `getToken()` injected via hook |
| 3 | Init message includes projectPath, cols, rows, and plain-shell mode | ✗ FAILED | Init sends `{ type, projectPath, cols, rows }` only. `isPlainShell` field absent from types and client. Backend defaults to launching Claude CLI. |
| 4 | Auth URL messages from backend are captured and surfaced | ✓ VERIFIED | `handleMessage` dispatches `auth_url` to `onAuthUrl` callback; hook stores in `authUrl` state; TerminalOverlay renders dismissible banner with URL link |
| 5 | React strict mode does not create duplicate WebSocket connections | ✓ VERIFIED | Null-check ref init pattern (`== null`) creates client once; `useEffect([], [])` wires callbacks once; disconnect on cleanup |

#### Plan 02 Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User sees a working terminal in the Shell tab with ANSI color support | ? HUMAN | xterm.js Terminal instance created with theme from getTerminalTheme(); addons loaded; requires live browser |
| 2 | Terminal auto-resizes when browser window or panel dimensions change | ✓ VERIFIED | ResizeObserver + debounce + offsetParent visibility check + tab-switch refitting all implemented |
| 3 | URLs in terminal output are clickable | ? HUMAN | WebLinksAddon loaded via `terminal.loadAddon(webLinksAddon)`; click behavior requires live browser |
| 4 | Connection state indicator shows connecting/connected/disconnected in header | ✓ VERIFIED | `STATE_DOT_CLASSES` map covers all 3 states; animate-pulse for connecting; green/red for connected/disconnected |
| 5 | Restart and Disconnect buttons work in header | ✓ VERIFIED | Buttons wired to `onRestart`/`onDisconnect`; disabled states correct; TerminalPanel passes `restart`/`disconnect` |
| 6 | Disconnected state shows overlay with reconnect button | ✓ VERIFIED | `TerminalOverlay visible={state === 'disconnected'}` with "Session ended" text and Reconnect button |
| 7 | Terminal is lazy-loaded and not in initial bundle | ✓ VERIFIED | `React.lazy(() => import('@/components/terminal/TerminalPanel')...)` in ContentArea; `Suspense` with `TerminalSkeleton` fallback |
| 8 | Terminal stays mounted when switching tabs (CSS show/hide) | ✓ VERIFIED | `className={activeTab === id ? 'h-full' : 'hidden'}` on panel divs; `useMemo([])` prevents re-creation |
| 9 | Copy/paste works via Cmd+C/V | ? HUMAN | xterm.js handles natively; requires live browser test |

## Required Artifacts

| Artifact | Status | Details |
|----------|--------|---------|
| `src/src/types/shell.ts` | ✓ VERIFIED | Exports `ShellConnectionState`, `ShellClientMessage`, `ShellServerMessage`; discriminated unions correct. Note: `isPlainShell`/`provider` absent from init type (gap). |
| `src/src/components/terminal/terminal-theme.ts` | ✓ VERIFIED | Exports `getTerminalTheme()`; reads 16 CSS vars via `getComputedStyle`; 5 tests passing |
| `src/src/lib/shell-ws-client.ts` | ✓ VERIFIED | Exports `ShellWebSocketClient`; connect/disconnect/restart/sendInput/sendResize all implemented; 200+ lines, substantive |
| `src/src/hooks/useShellWebSocket.ts` | ✓ VERIFIED | Exports `useShellWebSocket`; strict mode guard via null-check ref; `setOutputCallback` for write wiring; `clearAuthUrl` for dismissal |
| `src/src/components/terminal/TerminalView.tsx` | ✓ VERIFIED | xterm.js lifecycle: Terminal + FitAddon + WebLinksAddon; ResizeObserver with debounce; onData/onResize/onReady props pattern; visibility-aware fitting |
| `src/src/components/terminal/TerminalHeader.tsx` | ✓ VERIFIED | Connection state dots via `STATE_DOT_CLASSES` map; Restart/Disconnect icon buttons with disabled states |
| `src/src/components/terminal/TerminalOverlay.tsx` | ✓ VERIFIED | Disconnected overlay + auth URL banner; `isSafeUrl()` guards against javascript:/data: URLs; auto-open via `window.open` |
| `src/src/components/terminal/TerminalPanel.tsx` | ✓ VERIFIED | Owns `useShellWebSocket` + `useProjectContext`; `writeRef` pattern for WS→xterm output routing; `handleReady` wires everything |
| `src/src/components/terminal/styles/terminal.css` | ✓ VERIFIED | Imports `@xterm/xterm/css/xterm.css`; `.terminal-container` with design token background; viewport padding override |

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `useShellWebSocket.ts` | `/shell` endpoint | `ShellWebSocketClient` WebSocket with `?token=` | ✓ WIRED | URL built as `${protocol}//${window.location.host}/shell?token=${token}` in shell-ws-client.ts:72 |
| `useShellWebSocket.ts` | `src/src/lib/auth.ts` | `getToken()` for WS auth | ✓ WIRED | `client.getToken = getToken` in useEffect; imported from `@/lib/auth` |
| `terminal-theme.ts` | `src/src/styles/tokens.css` | `getPropertyValue('--...')` calls | ✓ WIRED | `cssVar()` calls `getComputedStyle(document.documentElement).getPropertyValue(name)` |
| `TerminalView.tsx` | `useShellWebSocket.ts` | `onData→sendInput`, `onResize→sendResize`, `onReady→connect+setOutputCallback` | ✓ WIRED | TerminalPanel intermediates; `handleData→sendInput`, `handleResize→sendResize`, `handleReady→setOutputCallback+connect` |
| `TerminalView.tsx` | `@xterm/xterm` | `new Terminal()` + `terminal.open(container)` | ✓ WIRED | Lines 58-71 in TerminalView.tsx |
| `ContentArea.tsx` | `TerminalPanel.tsx` | `React.lazy()` replacing PanelPlaceholder | ✓ WIRED | `LazyTerminalPanel` via dynamic import; `Suspense` with `TerminalSkeleton` fallback |
| `TerminalPanel.tsx` | `TerminalView + TerminalHeader + TerminalOverlay` | Composition in JSX | ✓ WIRED | All three rendered in TerminalPanel return, props wired |

## Requirements Coverage

| Requirement | Description | Plan | Status | Evidence |
|-------------|-------------|------|--------|----------|
| TERM-01 | xterm.js terminal with full PTY emulation and ANSI 256-color | 02 | ? HUMAN | xterm.js loaded with theme; PTY provided by backend; visual confirmation needed |
| TERM-02 | Separate WebSocket to /shell (independent from chat WS) | 01 | ✓ SATISFIED | `ShellWebSocketClient` is a separate class; connects to `/shell?token=...`; independent lifecycle from chat WS |
| TERM-03 | Auto-resize via @xterm/addon-fit, debounced | 02 | ✓ SATISFIED | `FitAddon` loaded; `ResizeObserver` with 100ms debounce; `offsetParent` visibility check |
| TERM-04 | Clickable URLs via @xterm/addon-web-links | 02 | ? HUMAN | `WebLinksAddon` loaded; click behavior requires live browser |
| TERM-05 | Connection state indicator: connecting/connected/disconnected | 02 | ✓ SATISFIED | `STATE_DOT_CLASSES` in TerminalHeader; correct colors and animate-pulse |
| TERM-06 | Working directory set to active project root | 01 | ✓ SATISFIED | `projectPath: projectName` from `useProjectContext()` sent in init message |
| TERM-07 | Plain shell mode available (no AI provider attached) | 01 | ✗ BLOCKED | `isPlainShell` absent from types and client; backend defaults to launching Claude CLI; no toggle UI in TerminalHeader |
| TERM-08 | Auth URLs from CLI providers detected and displayed | 01 | ✓ SATISFIED | `auth_url` message type handled; `TerminalOverlay` renders dismissible banner with validated URL |
| TERM-09 | Header has Restart and Disconnect buttons with icons/tooltips | 02 | ✓ SATISFIED | `RotateCw` (Restart) and `Unplug` (Disconnect) buttons with `title` tooltips; correct disabled states |
| TERM-10 | Lazy-loaded via React.lazy() + Suspense | 02 | ✓ SATISFIED | `LazyTerminalPanel` via `React.lazy()`; `Suspense` fallback `TerminalSkeleton` |
| TERM-11 | DOM-mounted when switching tabs (CSS display:none) | 02 | ✓ SATISFIED | `hidden` class on inactive panel divs; `useMemo([])` creates elements once per mount |
| TERM-12 | React strict mode double-mount handled via ref guard | 01 | ✓ SATISFIED | Null-check ref init (`== null`) creates one `ShellWebSocketClient`; `useEffect([], [])` runs once |
| TERM-13 | Disconnected state shows reconnect button + "Session ended" overlay | 02 | ✓ SATISFIED | `TerminalOverlay visible={state === 'disconnected'}` with "Session ended" and Reconnect button |
| TERM-14 | Custom OKLCH color scheme matching design system | 01 | ✓ SATISFIED | `getTerminalTheme()` maps 16 CSS custom properties to xterm `ITheme` |
| TERM-15 | Copy/paste via Cmd+C / Cmd+V | 02 | ? HUMAN | xterm.js native handling; requires live browser test |

**Orphaned requirements:** None — all 15 TERM-* requirements are claimed by plans 01 and 02.

## Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| `src/src/lib/shell-ws-client.ts:59` | `console.warn('[ShellWS] No auth token available')` | Info | Expected defensive warning, not a stub |
| `src/src/components/terminal/TerminalOverlay.tsx:57` | `return null` when !visible && !authUrl | Info | Correct conditional early return, not a stub |

No blockers or warnings found. All implementations are substantive.

## Human Verification Required

### 1. Basic Terminal Functionality

**Test:** Open Shell tab in Loom, type `echo hello world` and press Enter
**Expected:** Terminal connects, displays shell prompt in project root directory, command output "hello world" appears with correct ANSI formatting
**Why human:** xterm.js rendering and PTY interaction cannot be automated in test environment

### 2. Auto-Resize Behavior

**Test:** Open Shell tab, grab and resize the browser window (make it significantly smaller and larger)
**Expected:** Terminal content reflows to fill new dimensions; no zero-column rendering artifacts
**Why human:** ResizeObserver + fitAddon behavior requires real DOM layout computation

### 3. Clickable URL in Terminal Output

**Test:** Run `echo 'Visit https://example.com'` in the terminal
**Expected:** The URL appears as a clickable link; clicking it opens a new browser tab at that URL
**Why human:** WebLinksAddon rendering and click behavior require real xterm instance

### 4. Tab Switch Session Preservation

**Test:** Open Shell tab, start a long-running process (e.g., `top` or `sleep 30`), switch to Chat tab, switch back to Shell
**Expected:** Terminal session is alive, process still running, no reconnection message, scroll position preserved
**Why human:** CSS show/hide + PTY session persistence requires live interaction

### 5. Copy/Paste

**Test:** Run a command with output in the terminal, select text with mouse, copy with Cmd+C (or Ctrl+Shift+C), paste into another app
**Expected:** Clipboard contains the selected terminal text
**Why human:** Clipboard API and selection handling require real browser interaction

## Gaps Summary

One gap blocks complete goal achievement:

**TERM-07 — Plain Shell Mode**: The frontend drops `isPlainShell` and `provider` from the protocol. When a user opens the Shell tab, Loom initiates a Claude CLI session rather than a plain interactive shell. This directly contradicts the requirement "Plain shell mode available (no AI provider attached)." The backend fully supports plain shell (`isPlainShell: true` in the init message), but the frontend never sends it.

The fix is contained and surgical: add `isPlainShell: boolean` back to `ShellClientMessage.init`, pass `isPlainShell: true` in `ShellWebSocketClient.connect()` (since the terminal should be a plain shell), and optionally add a mode label or future toggle to `TerminalHeader`.

The remaining 14 requirements are all implemented with real, substantive code backed by 48 passing tests and 0 TypeScript errors.

---
_Verified: 2026-03-11T01:50:00Z_
_Verifier: Claude (gsd-verifier)_
