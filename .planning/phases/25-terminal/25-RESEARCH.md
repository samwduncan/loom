# Phase 25: Terminal - Research

**Researched:** 2026-03-11
**Domain:** xterm.js terminal emulator + WebSocket PTY integration
**Confidence:** HIGH

## Summary

Phase 25 adds a fully functional terminal to the Shell tab, replacing the current `PanelPlaceholder`. The backend `/shell` WebSocket endpoint is already complete with full PTY support via `node-pty`, session persistence (30-min timeout with 5000-message buffer), auth URL detection, and resize handling. The frontend needs to: (1) install and integrate xterm.js v5 with addons, (2) build a WebSocket client specific to `/shell`, (3) handle connection lifecycle with React strict mode guards, and (4) apply OKLCH-derived theming to match the design system.

The Vite dev proxy for `/shell` is already configured (`vite.config.ts:25-28`). The `ContentArea` already mounts all four panels simultaneously with CSS show/hide (`hidden` class), which is exactly what xterm.js needs -- the terminal DOM element stays mounted across tab switches, preserving the xterm instance and PTY session state.

**Primary recommendation:** Build a standalone `useShellWebSocket` hook (separate from the chat `wsClient`) that manages the `/shell` WebSocket connection, and a `TerminalPanel` component that wraps xterm.js with React lifecycle management via refs. Lazy-load the entire terminal panel to keep it out of the initial bundle.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TERM-01 | Shell tab renders xterm.js with full PTY emulation and ANSI 256-color | xterm.js Terminal class with `name: 'xterm-256color'` set on backend PTY; custom ITheme for OKLCH colors |
| TERM-02 | Separate WebSocket to /shell endpoint | Backend handler at `server/index.js:1042`; Vite proxy at `vite.config.ts:25-28`; build standalone WS client (not reuse wsClient) |
| TERM-03 | Auto-resize via @xterm/addon-fit, debounced | FitAddon.fit() + ResizeObserver on container + debounce; send `{type:'resize', cols, rows}` to backend |
| TERM-04 | Clickable URLs via @xterm/addon-web-links | WebLinksAddon opens links in new tab |
| TERM-05 | Connection state indicator in header | Track WS readyState: connecting (yellow pulse), connected (green), disconnected (red) |
| TERM-06 | Working directory set to active project root | Send `projectPath` in init message; use `useProjectContext` to get project path, resolve via `/api/projects` |
| TERM-07 | Plain shell mode (no AI provider) | Send `{type:'init', provider:'plain-shell', isPlainShell:true}` -- backend supports this |
| TERM-08 | Auth URLs detected and displayed as clickable links | Backend sends `{type:'auth_url', url, autoOpen}` messages; render as clickable overlay or inline |
| TERM-09 | Restart and Disconnect buttons in header | Restart: close WS + send new init; Disconnect: close WS with code 1000 |
| TERM-10 | Lazy-loaded via React.lazy() + Suspense | Same pattern as LazyCodeEditor in FileTreePanel and LazySettingsModal in AppShell |
| TERM-11 | CSS display:none when switching tabs -- stays mounted | Already handled by ContentArea's `hidden` class; xterm instance persists in ref |
| TERM-12 | React strict mode double-mount handled via ref guard | Boolean ref `isInitialized` checked in useEffect; prevents duplicate WS connections |
| TERM-13 | Disconnected state shows reconnect button + overlay | Overlay div positioned absolute over terminal; shows when WS state is disconnected |
| TERM-14 | Custom OKLCH color scheme matching design system | ITheme with CSS variable values computed at mount time via getComputedStyle |
| TERM-15 | Copy/paste via Cmd+C / Cmd+V | xterm.js handles this natively when `rightClickSelectsWord` is default; no custom handler needed |
</phase_requirements>

## Standard Stack

### Core (New Dependencies)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @xterm/xterm | ^5.5 | Terminal emulator | Only viable browser terminal. Used by VS Code, Theia, every web IDE. |
| @xterm/addon-fit | ^0.10 | Auto-resize terminal to container | Official addon, required for responsive layout |
| @xterm/addon-web-links | ^0.11 | Clickable URLs in output | Official addon, required for TERM-04 and TERM-08 |

### Already Installed (No Changes)
| Library | Purpose |
|---------|---------|
| React 19 | UI framework |
| Zustand 5 | No new store needed -- connection state is local to component |
| lucide-react | Icons for header buttons (Terminal, RotateCw, Unplug) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @xterm/xterm | Direct ANSI parser + canvas | Insane amount of work for zero benefit |
| Separate WS client class | Reuse wsClient singleton | Chat WS has completely different protocol; sharing would be worse |

**Installation:**
```bash
cd src && npm install @xterm/xterm @xterm/addon-fit @xterm/addon-web-links
```

**CSS Import Required:**
```typescript
import '@xterm/xterm/css/xterm.css';
```
This is critical -- xterm.js requires its base CSS for layout. Import it in the terminal component file.

## Architecture Patterns

### Recommended Project Structure
```
src/
  components/
    terminal/
      TerminalPanel.tsx          # Outer shell: header + terminal container + overlays
      TerminalView.tsx           # xterm.js instance management (ref-based)
      TerminalHeader.tsx         # Connection indicator, mode dropdown, restart/disconnect
      TerminalOverlay.tsx        # Disconnected/reconnect overlay
      terminal-theme.ts          # ITheme from OKLCH design tokens
      styles/
        terminal.css             # Custom terminal CSS overrides
  hooks/
    useShellWebSocket.ts         # WebSocket client for /shell endpoint
  lib/
    shell-ws-client.ts           # Raw WS client class (no React)
```

### Pattern 1: Ref-Based Terminal Lifecycle
**What:** xterm.js Terminal instance lives in a `useRef`, not state. The DOM container is also a ref. `terminal.open(containerRef.current)` is called once in `useEffect` mount. Cleanup disposes the terminal.
**When to use:** Always for xterm.js integration. Terminal is an imperative API, not a React-managed tree.
**Example:**
```typescript
// Source: xterm.js official pattern
const terminalRef = useRef<Terminal | null>(null);
const containerRef = useRef<HTMLDivElement | null>(null);

useEffect(() => {
  if (!containerRef.current || terminalRef.current) return; // strict mode guard

  const term = new Terminal({
    fontSize: 14,
    fontFamily: 'JetBrains Mono, monospace',
    theme: getTerminalTheme(), // reads CSS vars
    cursorBlink: true,
    scrollback: 5000,
    allowTransparency: true,
  });

  const fitAddon = new FitAddon();
  const webLinksAddon = new WebLinksAddon();
  term.loadAddon(fitAddon);
  term.loadAddon(webLinksAddon);

  term.open(containerRef.current);
  fitAddon.fit();
  terminalRef.current = term;

  return () => {
    term.dispose();
    terminalRef.current = null;
  };
}, []);
```

### Pattern 2: Standalone Shell WebSocket (Not Shared with Chat WS)
**What:** A dedicated WebSocket connection for `/shell`, completely independent of the chat `wsClient`. Different protocol, different lifecycle, different reconnection logic.
**When to use:** Always. The shell WS protocol (init/input/resize/output/auth_url) is entirely different from the chat WS protocol.
**Example:**
```typescript
// Shell WS protocol - Client -> Server
type ShellClientMessage =
  | { type: 'init'; projectPath: string; provider: string; isPlainShell: boolean; cols: number; rows: number }
  | { type: 'input'; data: string }
  | { type: 'resize'; cols: number; rows: number };

// Shell WS protocol - Server -> Client
type ShellServerMessage =
  | { type: 'output'; data: string }
  | { type: 'auth_url'; url: string; autoOpen: boolean };
```

### Pattern 3: Debounced Resize with ResizeObserver
**What:** ResizeObserver on the terminal container fires `fitAddon.fit()` debounced at ~100ms, then sends resize message to backend.
**When to use:** For TERM-03. Browser resize, sidebar toggle, and any layout change triggers this.
**Example:**
```typescript
const resizeObserver = new ResizeObserver(
  debounce(() => {
    if (!terminalRef.current || !fitAddonRef.current) return;
    fitAddonRef.current.fit();
    const { cols, rows } = terminalRef.current;
    ws.send(JSON.stringify({ type: 'resize', cols, rows }));
  }, 100)
);
resizeObserver.observe(containerRef.current);
```

### Anti-Patterns to Avoid
- **Terminal in state:** Never `useState(new Terminal())`. Terminal is imperative, not declarative. Refs only.
- **Conditional rendering for tab switching:** Already avoided by ContentArea's CSS show/hide. DO NOT change this pattern.
- **Sharing chat WebSocket:** The `/shell` endpoint has a completely different protocol. Don't try to multiplex.
- **Creating WS in render:** WebSocket must be created in useEffect, with ref guard for strict mode.
- **useEffect cleanup closing WS on every render:** The WS should persist across re-renders. Only close on component unmount or explicit user action.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Terminal emulation | Canvas-based ANSI parser | @xterm/xterm | Thousands of edge cases in terminal emulation |
| Resize calculation | Manual cols/rows math | @xterm/addon-fit | Font metrics, DPR, container padding -- all handled |
| URL detection in terminal | Regex on output | @xterm/addon-web-links | Handles wrapped lines, escape sequences around URLs |
| ANSI color parsing | Custom ANSI→HTML converter | xterm.js built-in | 256-color + truecolor support for free |

**Key insight:** xterm.js is a complete terminal emulator, not a text renderer. It handles selection, scrollback, mouse events, clipboard, escape sequences, and Unicode. Any custom solution would be orders of magnitude worse.

## Common Pitfalls

### Pitfall 1: xterm.js Disposed on Tab Switch
**What goes wrong:** If TerminalView is conditionally rendered (`{activeTab === 'shell' && <TerminalView />}`), the xterm instance is destroyed and recreated on every tab switch.
**Why it happens:** React unmounts the component, calling dispose().
**How to avoid:** ContentArea already uses CSS `hidden` class. The terminal component mounts ONCE and stays in DOM. Verify this by confirming the `PanelPlaceholder` replacement doesn't change the mount-once useMemo pattern.
**Warning signs:** Terminal goes blank after tab switch.

### Pitfall 2: React Strict Mode Double WebSocket
**What goes wrong:** In development, React strict mode double-mounts components. Two WebSocket connections open, two PTY sessions start.
**Why it happens:** useEffect runs twice in strict mode.
**How to avoid:** Boolean ref guard: `const initialized = useRef(false); if (initialized.current) return; initialized.current = true;`. The existing codebase uses this pattern in `websocket-init.ts` (line 23: `let isInitialized = false`).
**Warning signs:** Backend logs show two "Shell client connected" messages on single tab open.

### Pitfall 3: FitAddon Called Before Terminal Open
**What goes wrong:** `fitAddon.fit()` throws if called before `terminal.open()` attaches to DOM.
**Why it happens:** Race condition between addon loading and DOM mounting.
**How to avoid:** Call `fitAddon.fit()` only AFTER `terminal.open(container)`. The ResizeObserver callback should also check `terminalRef.current` is non-null.
**Warning signs:** Console error about missing parent element.

### Pitfall 4: CSS display:none Breaks FitAddon
**What goes wrong:** When the terminal panel is hidden (`display: none`), FitAddon.fit() calculates 0 cols/0 rows because the container has no dimensions.
**Why it happens:** Hidden elements report zero offsetWidth/offsetHeight.
**How to avoid:** Only call `fitAddon.fit()` when the terminal panel is VISIBLE. Check `containerRef.current.offsetParent !== null` before fitting. Also fit on tab switch TO the shell tab.
**Warning signs:** Terminal shows a single column after switching back to Shell tab.

### Pitfall 5: WebSocket URL Construction
**What goes wrong:** Building the WS URL incorrectly, especially with the Vite dev proxy vs production.
**Why it happens:** Dev uses Vite proxy (same host:port), production uses the backend directly.
**How to avoid:** Use the same URL construction pattern as `websocket-client.ts`:
```typescript
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const wsUrl = `${protocol}//${window.location.host}/shell?token=${token}`;
```
**Warning signs:** 404 on WebSocket upgrade.

### Pitfall 6: Terminal Font Doesn't Match Design System
**What goes wrong:** Default xterm.js font is "courier". Looks jarring against JetBrains Mono used everywhere else.
**Why it happens:** Forgetting to set `fontFamily` in Terminal options.
**How to avoid:** Read `codeFontFamily` from ThemeConfig in UI store. Default is 'JetBrains Mono'. Pass to xterm constructor.

## Code Examples

### Terminal Theme from Design Tokens
```typescript
// terminal-theme.ts
// Read OKLCH CSS vars at runtime and convert to hex/rgb for xterm ITheme
// xterm.js accepts CSS color strings (hex, rgb, hsl) but NOT oklch directly
// Must compute via getComputedStyle at mount time

import type { ITheme } from '@xterm/xterm';

export function getTerminalTheme(): ITheme {
  const style = getComputedStyle(document.documentElement);

  return {
    background: style.getPropertyValue('--surface-base').trim(),
    foreground: style.getPropertyValue('--text-primary').trim(),
    cursor: style.getPropertyValue('--accent-primary').trim(),
    cursorAccent: style.getPropertyValue('--surface-base').trim(),
    selectionBackground: 'rgba(255, 255, 255, 0.15)',
    selectionForeground: undefined, // let xterm choose
    // ANSI colors -- use sensible defaults that match the warm dark theme
    black: style.getPropertyValue('--surface-base').trim(),
    red: style.getPropertyValue('--status-error').trim(),
    green: style.getPropertyValue('--status-success').trim(),
    yellow: style.getPropertyValue('--status-warning').trim(),
    blue: style.getPropertyValue('--status-info').trim(),
    magenta: style.getPropertyValue('--accent-primary').trim(),
    cyan: '#56d4dd',      // teal complement
    white: style.getPropertyValue('--text-primary').trim(),
    brightBlack: style.getPropertyValue('--text-muted').trim(),
    brightRed: '#ff6b6b',
    brightGreen: '#69db7c',
    brightYellow: '#ffd43b',
    brightBlue: '#74c0fc',
    brightMagenta: '#da77f2',
    brightCyan: '#66d9e8',
    brightWhite: '#ffffff',
  };
}
```

**IMPORTANT:** xterm.js v5 may NOT support OKLCH color values directly. If `oklch(...)` strings don't work, compute hex values at build time or use a runtime conversion. Test this during implementation. The fallback is hardcoded hex values that visually match the OKLCH tokens.

### Shell WebSocket Init Message
```typescript
// Based on backend contract at server/index.js:1054-1060
function sendInit(ws: WebSocket, projectPath: string, cols: number, rows: number) {
  ws.send(JSON.stringify({
    type: 'init',
    projectPath,
    provider: 'plain-shell',
    isPlainShell: true,
    cols,
    rows,
  }));
}
```

### Lazy Loading Pattern (Matching Existing Codebase)
```typescript
// In ContentArea.tsx -- replace PanelPlaceholder with lazy-loaded TerminalPanel
const LazyTerminalPanel = lazy(() =>
  import('@/components/terminal/TerminalPanel').then((mod) => ({
    default: mod.TerminalPanel,
  })),
);

// In panels useMemo:
{ id: 'shell', content: (
  <Suspense fallback={<TerminalSkeleton />}>
    <LazyTerminalPanel />
  </Suspense>
) },
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `xterm` (pre-v5) | `@xterm/xterm` (v5+) | 2023 | New scoped package names, same API |
| `xterm-addon-fit` | `@xterm/addon-fit` | 2023 | Scoped package, same API |
| Separate canvas renderer addon | Built-in WebGL renderer | xterm v5 | Canvas is default, WebGL optional addon for perf |
| `term.loadAddon(fit); fit.fit()` | Same API in v5 | Stable | No change in addon loading pattern |

**Deprecated/outdated:**
- `xterm` package (unscoped) -- use `@xterm/xterm` instead
- `xterm-addon-*` packages -- use `@xterm/addon-*`
- `terminal.setOption()` -- removed in v5, pass options in constructor or use `terminal.options.X = Y`

## Backend Protocol Reference

The backend `/shell` endpoint is FULLY IMPLEMENTED. No backend changes needed.

### Client -> Server Messages
| Type | Fields | Purpose |
|------|--------|---------|
| `init` | projectPath, sessionId?, hasSession?, provider, initialCommand?, isPlainShell?, cols, rows | Start or reconnect PTY session |
| `input` | data (string) | Send keystrokes to PTY |
| `resize` | cols, rows | Resize PTY dimensions |

### Server -> Client Messages
| Type | Fields | Purpose |
|------|--------|---------|
| `output` | data (string with ANSI) | Terminal output from PTY |
| `auth_url` | url, autoOpen | Detected auth URL from provider CLI |

### Session Persistence
- PTY stays alive 30 minutes after WS disconnect
- Reconnecting replays up to 5000 buffered messages
- Session key: `${projectPath}_${sessionId||'default'}${commandSuffix}`
- For plain shell with no sessionId, key is `${projectPath}_default`

### Auth via Query Param
WebSocket authenticates via `?token=<jwt>` query parameter, same as chat WS. Use `getToken()` from `@/lib/auth.ts`.

## Vite Proxy (Already Configured)

```typescript
// vite.config.ts:25-28 -- ALREADY EXISTS, no changes needed
'/shell': {
  target: 'ws://localhost:5555',
  ws: true,
},
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 + jsdom + @testing-library/react |
| Config file | `src/vite.config.ts` (test section) |
| Quick run command | `cd src && npx vitest run --reporter=verbose` |
| Full suite command | `cd src && npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TERM-01 | xterm.js renders in container | unit | `cd src && npx vitest run src/components/terminal/TerminalView.test.tsx -x` | Wave 0 |
| TERM-02 | WebSocket connects to /shell | unit | `cd src && npx vitest run src/hooks/useShellWebSocket.test.ts -x` | Wave 0 |
| TERM-03 | Resize sends cols/rows | unit | `cd src && npx vitest run src/components/terminal/TerminalView.test.tsx -x` | Wave 0 |
| TERM-04 | Web links addon loaded | unit | `cd src && npx vitest run src/components/terminal/TerminalView.test.tsx -x` | Wave 0 |
| TERM-05 | Connection state indicator renders | unit | `cd src && npx vitest run src/components/terminal/TerminalHeader.test.tsx -x` | Wave 0 |
| TERM-06 | Init message includes projectPath | unit | `cd src && npx vitest run src/hooks/useShellWebSocket.test.ts -x` | Wave 0 |
| TERM-07 | Plain shell mode sends correct init | unit | `cd src && npx vitest run src/hooks/useShellWebSocket.test.ts -x` | Wave 0 |
| TERM-08 | Auth URL messages handled | unit | `cd src && npx vitest run src/hooks/useShellWebSocket.test.ts -x` | Wave 0 |
| TERM-09 | Restart/Disconnect buttons | unit | `cd src && npx vitest run src/components/terminal/TerminalHeader.test.tsx -x` | Wave 0 |
| TERM-10 | Lazy loading works | unit | `cd src && npx vitest run src/components/content-area/view/ContentArea.test.tsx -x` | Existing (update) |
| TERM-11 | Panel stays mounted on tab switch | unit | `cd src && npx vitest run src/components/content-area/view/ContentArea.test.tsx -x` | Existing (verify) |
| TERM-12 | Strict mode guard prevents double init | unit | `cd src && npx vitest run src/hooks/useShellWebSocket.test.ts -x` | Wave 0 |
| TERM-13 | Disconnected overlay renders | unit | `cd src && npx vitest run src/components/terminal/TerminalOverlay.test.tsx -x` | Wave 0 |
| TERM-14 | Theme uses design tokens | unit | `cd src && npx vitest run src/components/terminal/terminal-theme.test.ts -x` | Wave 0 |
| TERM-15 | Copy/paste not blocked | manual-only | N/A -- requires real clipboard API | N/A |

### Sampling Rate
- **Per task commit:** `cd src && npx vitest run --reporter=verbose`
- **Per wave merge:** `cd src && npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/src/components/terminal/TerminalView.test.tsx` -- covers TERM-01, TERM-03, TERM-04
- [ ] `src/src/components/terminal/TerminalHeader.test.tsx` -- covers TERM-05, TERM-09
- [ ] `src/src/components/terminal/TerminalOverlay.test.tsx` -- covers TERM-13
- [ ] `src/src/components/terminal/terminal-theme.test.ts` -- covers TERM-14
- [ ] `src/src/hooks/useShellWebSocket.test.ts` -- covers TERM-02, TERM-06, TERM-07, TERM-08, TERM-12

### Testing xterm.js in jsdom

xterm.js requires a real DOM with dimension calculations. In jsdom, `terminal.open()` will partially work but FitAddon will not (no layout engine). Strategy:

1. **Mock `@xterm/xterm`** in unit tests -- mock `Terminal` class with `open()`, `write()`, `dispose()`, `onData`, `loadAddon()` stubs
2. **Mock `@xterm/addon-fit`** -- mock `FitAddon` with `fit()` stub
3. **Test WS logic separately** in `useShellWebSocket.test.ts` using mock WebSocket
4. **Real xterm rendering** tested via Playwright e2e (deferred)

```typescript
// Mock pattern for vitest
vi.mock('@xterm/xterm', () => ({
  Terminal: vi.fn().mockImplementation(() => ({
    open: vi.fn(),
    write: vi.fn(),
    dispose: vi.fn(),
    onData: vi.fn(() => ({ dispose: vi.fn() })),
    loadAddon: vi.fn(),
    cols: 80,
    rows: 24,
    options: {},
  })),
}));
```

## Open Questions

1. **OKLCH in xterm ITheme**
   - What we know: xterm.js ITheme accepts CSS color strings
   - What's unclear: Whether `oklch(...)` strings are supported, or if it needs hex/rgb
   - Recommendation: Test at implementation time. If oklch doesn't work, use `getComputedStyle` to read the computed RGB values and convert to hex. Fallback: hardcode matching hex values.

2. **Plain shell default vs provider mode**
   - What we know: TERM-07 specifies "plain shell mode available" with dropdown/toggle
   - What's unclear: Should the default be plain shell, or should it launch the active provider?
   - Recommendation: Default to plain shell for Phase 25. Provider-attached terminals (Claude/Codex/Gemini) are more complex and relate to M5 multi-provider features. A simple dropdown can support both, but default to bash.

3. **Auth URL display format**
   - What we know: Backend sends `{type:'auth_url', url, autoOpen}` messages
   - What's unclear: Should these show as a toast, inline banner, or clickable overlay?
   - Recommendation: Show as a dismissible banner above the terminal (like VS Code's port forwarding notification). If `autoOpen` is true, also `window.open(url, '_blank')`.

## Sources

### Primary (HIGH confidence)
- [xterm.js official API docs](https://xtermjs.org/docs/api/terminal/) - Terminal constructor, ITheme, ITerminalOptions
- Backend source `server/index.js:1041-1397` - Complete shell WS handler (read directly)
- Backend API contract `.planning/BACKEND_API_CONTRACT.md:831-884` - Shell WS protocol spec
- Existing codebase: `ContentArea.tsx`, `vite.config.ts`, `websocket-client.ts`, `auth.ts` (read directly)

### Secondary (MEDIUM confidence)
- [xterm.js GitHub](https://github.com/xtermjs/xterm.js/) - Package versions, addon list
- `.planning/research/STACK.md` - Pre-researched dependency versions for M3
- `.planning/research/PITFALLS.md` - Pre-researched xterm lifecycle pitfalls

### Tertiary (LOW confidence)
- xterm.js OKLCH color support -- needs runtime validation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - xterm.js is the only option, versions verified against M3 research
- Architecture: HIGH - backend is fully implemented, frontend patterns well-established in codebase
- Pitfalls: HIGH - xterm.js lifecycle issues are well-documented, and M3 research already catalogued them
- Backend protocol: HIGH - read directly from source code

**Research date:** 2026-03-11
**Valid until:** 2026-04-11 (stable domain, xterm.js v5 API is mature)
