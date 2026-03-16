# Phase 31: Editor & Tool Enhancements - Research

**Researched:** 2026-03-16
**Domain:** CodeMirror 6 minimap extension, xterm.js command injection, cross-component communication
**Confidence:** HIGH

## Summary

This phase adds two independent features: a minimap gutter for the CodeMirror 6 editor and a "Run in Terminal" action on Bash tool cards. Both are well-understood problems with established solutions.

The minimap is solved by `@replit/codemirror-minimap` (v0.5.2), the only maintained CM6 minimap extension. All peer dependencies are already satisfied by the project's existing CodeMirror installation. The extension renders onto a `<canvas>` element in the editor's scroll DOM, using a 1:4 scale ratio.

The "Run in Terminal" feature leverages the existing `shell-input.ts` module-level ref pattern -- `sendToShell()` is already exported and functional. The remaining work is: (1) adding an action button to BashToolCard, (2) switching the active tab to `'shell'` via the UI store, and (3) sending the command string through `sendToShell()`. This is a straightforward wiring task.

**Primary recommendation:** Install `@replit/codemirror-minimap`, add it as a CM6 extension in CodeEditor.tsx, and wire `sendToShell()` into BashToolCard with a tab-switch action.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FTE-03 | Code editor displays a minimap in the right gutter | `@replit/codemirror-minimap` extension with `showMinimap.compute()` facet, conditional on document length |
| FTE-04 | Bash tool cards have a "Run in Terminal" action button | Action button in BashToolCard footer, visible only on resolved Bash tool calls with a command |
| FTE-05 | "Run in Terminal" opens terminal tab and executes command | `useUIStore.getState().setActiveTab('shell')` + `sendToShell(command + '\n')` from `shell-input.ts` |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@replit/codemirror-minimap` | 0.5.2 | Minimap extension for CM6 | Only maintained CM6 minimap; used by Replit, MIT licensed |
| `@uiw/react-codemirror` | 4.25.8 (installed) | React wrapper for CM6 | Already in use; extensions array accepts minimap facet directly |
| `xterm.js` | v5 (installed) | Terminal emulator | Already in use; `sendToShell()` bridge already exists |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `lucide-react` | (installed) | Icons for action button | `Play` or `Terminal` icon for "Run in Terminal" button |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@replit/codemirror-minimap` | Custom canvas minimap | Massive effort for a solved problem; Replit's handles DPI, theming, scroll sync |
| Module-level ref (`sendToShell`) | Zustand action / event bus | Zustand is for reactive state, not imperative fire-and-forget; ref pattern already established |

**Installation:**
```bash
cd src && npm install @replit/codemirror-minimap
```

No new peer dependencies needed -- all are already installed:
- `@codemirror/view@6.39.17` (needs ^6.21.3)
- `@codemirror/state@6.5.4` (needs ^6.3.1)
- `@codemirror/language@6.12.2` (needs ^6.9.1)
- `@lezer/common@1.5.1` (needs ^1.1.0)
- `@lezer/highlight@1.2.3` (needs ^1.1.6)
- `@codemirror/lint@6.9.5` (needs ^6.4.2)

## Architecture Patterns

### Recommended Changes
```
src/src/
├── components/
│   ├── editor/
│   │   └── CodeEditor.tsx          # Add minimap extension to extensions array
│   └── chat/tools/
│       └── BashToolCard.tsx         # Add "Run in Terminal" action button
├── lib/
│   └── shell-input.ts              # Already exists -- sendToShell() ready to use
└── stores/
    └── ui.ts                       # Already has setActiveTab('shell')
```

### Pattern 1: CodeMirror Extension via Facet
**What:** `showMinimap` is a CM6 facet that computes minimap config from editor state.
**When to use:** Adding the minimap as an extension in CodeEditor.tsx's `extensions` array.
**Example:**
```typescript
// Source: @replit/codemirror-minimap README + DeepWiki
import { showMinimap } from '@replit/codemirror-minimap';

const minimapExtension = showMinimap.compute(['doc'], (state) => {
  return {
    create: () => {
      const dom = document.createElement('div');
      return { dom };
    },
    displayText: 'blocks',
    showOverlay: 'always',
  };
});

// Add to extensions array in CodeEditor:
extensions.push(minimapExtension);
```

### Pattern 2: Conditional Minimap (Viewport-Based)
**What:** Only show minimap when document exceeds viewport height.
**When to use:** FTE-03 says "for files longer than the viewport."
**Example:**
```typescript
// The minimap extension renders in the editor's scrollDOM.
// Approach: always include the extension, but use CSS to hide when
// .cm-content height <= .cm-scroller height, OR use the compute
// callback to check state.doc.lines against a threshold.
const minimapExtension = showMinimap.compute(['doc'], (state) => {
  // Heuristic: ~40 lines visible in typical viewport
  const VIEWPORT_LINE_THRESHOLD = 50;
  if (state.doc.lines < VIEWPORT_LINE_THRESHOLD) {
    return null; // No minimap for short files
  }
  return {
    create: () => ({ dom: document.createElement('div') }),
    displayText: 'blocks',
    showOverlay: 'always',
  };
});
```
**Note:** Need to verify whether returning `null` disables the minimap. If not, the `autohide` option or a CSS-based approach (display:none when content fits) is the fallback. This is a LOW confidence detail -- test during implementation.

### Pattern 3: Imperative Cross-Component Command Execution
**What:** BashToolCard fires a command to the terminal without prop drilling.
**When to use:** FTE-04/FTE-05 -- the "Run in Terminal" flow.
**Example:**
```typescript
// In BashToolCard.tsx
import { sendToShell } from '@/lib/shell-input';
import { useUIStore } from '@/stores/ui';

function handleRunInTerminal(command: string) {
  // 1. Switch to shell tab
  useUIStore.getState().setActiveTab('shell');
  // 2. Send command (with newline to execute)
  const sent = sendToShell(command + '\n');
  if (!sent) {
    // Terminal not connected -- could show toast, but for MVP just no-op
    console.warn('Terminal not connected');
  }
}
```

### Anti-Patterns to Avoid
- **Adding minimap state to Zustand:** The minimap is purely a CM6 extension concern. No store state needed.
- **Creating a new event bus for terminal commands:** `sendToShell()` already exists and works. Don't over-engineer.
- **Modifying ToolCardShell for Bash-specific actions:** Action buttons belong in BashToolCard itself, not the shared shell. Other tools don't need action buttons.
- **Auto-executing commands without user click:** Security concern. Command must require explicit user interaction.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Minimap rendering | Custom canvas scaler | `@replit/codemirror-minimap` | DPI handling, scroll sync, theme integration, viewport overlay -- all solved |
| Terminal command injection | Custom WebSocket message | `sendToShell()` from `shell-input.ts` | Already exists, already wired to TerminalPanel, handles null checks |
| Tab switching | Custom event/callback chain | `useUIStore.getState().setActiveTab('shell')` | Store action already exists and works |

## Common Pitfalls

### Pitfall 1: Minimap CSS Not Rendering
**What goes wrong:** Minimap installs but nothing visible appears.
**Why it happens:** The minimap extension creates DOM elements with specific CSS classes (`cm-minimap-gutter`, `cm-minimap-inner`). If the editor has `overflow: hidden` on the wrong container or the parent constrains width, the minimap gets clipped.
**How to avoid:** Ensure the editor container allows the minimap's 120px max width. The `cm-editor` element needs enough horizontal space. Check that `editor.css` doesn't override `.cm-gutters` positioning.
**Warning signs:** Minimap DOM exists in DevTools but is 0px wide or clipped.

### Pitfall 2: sendToShell Before Terminal Mounts
**What goes wrong:** User clicks "Run in Terminal" but nothing happens because terminal hasn't connected yet.
**Why it happens:** Terminal uses CSS show/hide (mount-once pattern), but the WebSocket only connects after the terminal tab becomes visible for the first time and `onReady` fires. If user has never opened the terminal tab, `sendToShell()` returns `false`.
**How to avoid:** Check `sendToShell()` return value. If `false`, switch to the shell tab first, then retry after a short delay (the terminal will auto-connect when visible). Or: show a brief toast saying "Terminal connecting...".
**Warning signs:** Button click does nothing, no errors in console.

### Pitfall 3: Command Injection with Special Characters
**What goes wrong:** Commands containing quotes, backticks, or shell metacharacters behave unexpectedly when sent to terminal.
**Why it happens:** `sendToShell()` sends raw keystrokes to the PTY. The command is already a string from the Bash tool call's `input.command`, which was a valid shell command. But if it contains multi-line content or control characters, xterm interprets them literally.
**How to avoid:** Send the command exactly as-is from `input.command` plus `\n`. Don't attempt to re-escape -- the command was already valid when Claude executed it.
**Warning signs:** Multi-line commands partially execute or produce unexpected output.

### Pitfall 4: Minimap Facet Recomputation on Every Keystroke
**What goes wrong:** Minimap config re-evaluates on every document change, causing jank.
**Why it happens:** Using `showMinimap.compute(['doc'], ...)` triggers on every doc change.
**How to avoid:** The minimap library handles this internally (canvas diffing). But if using conditional visibility based on line count, the threshold check is cheap (O(1) -- `state.doc.lines` is a property). No performance concern.
**Warning signs:** None expected, but profile if FPS drops during typing.

## Code Examples

### Adding Minimap to CodeEditor.tsx
```typescript
// Source: @replit/codemirror-minimap README + project CodeEditor.tsx
import { showMinimap } from '@replit/codemirror-minimap';

// Define outside component to avoid recreation
const minimapExtension = showMinimap.compute(['doc'], (state) => {
  if (state.doc.lines < 50) return null; // verify null handling
  return {
    create: () => ({ dom: document.createElement('div') }),
    displayText: 'blocks',
    showOverlay: 'always',
  };
});

// In CodeEditor component, add to extensions array:
// extensions.push(minimapExtension);
```

### Adding "Run in Terminal" Button to BashToolCard.tsx
```typescript
// Source: project BashToolCard.tsx + shell-input.ts
import { Play } from 'lucide-react';
import { sendToShell } from '@/lib/shell-input';
import { useUIStore } from '@/stores/ui';
import { Button } from '@/components/ui/button';

// Inside BashToolCard, after the output body:
function handleRunInTerminal(command: string) {
  useUIStore.getState().setActiveTab('shell');
  // Small delay to ensure terminal is visible and connected
  requestAnimationFrame(() => {
    const sent = sendToShell(command + '\n');
    if (!sent) {
      // Retry once after terminal mount
      setTimeout(() => sendToShell(command + '\n'), 500);
    }
  });
}

// Render (only when command exists and tool is resolved):
// <Button variant="ghost" size="sm" onClick={() => handleRunInTerminal(command)}>
//   <Play size={14} /> Run in Terminal
// </Button>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| No CM6 minimap existed | `@replit/codemirror-minimap` is the standard | 2023 (v0.1) | Only option for CM6; stable at v0.5.2 |
| Event bus for cross-component actions | Module-level ref pattern | Established in M3 (Phase 24) | `shell-input.ts` already implements this pattern |

## Open Questions

1. **Does `showMinimap.compute()` accept `null` return to disable?**
   - What we know: The DeepWiki docs show a `MinimapConfig` interface. The `compute` callback typically returns the config object.
   - What's unclear: Whether returning `null` gracefully disables the minimap, or if we need the `autohide` option.
   - Recommendation: Test during implementation. Fallback is using `autohide: true` + CSS to hide when content fits viewport. LOW confidence.

2. **Terminal auto-connect timing after tab switch**
   - What we know: Terminal connects on first `onReady` (when container becomes visible). CSS show/hide means component is mounted but hidden until tab is active.
   - What's unclear: Exact timing between `setActiveTab('shell')` triggering CSS visibility and the terminal's ResizeObserver firing `fit()` + WebSocket connect.
   - Recommendation: Use `requestAnimationFrame` + fallback `setTimeout(500)` as shown in code examples. Test empirically.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest + @testing-library/react |
| Config file | `src/vite.config.ts` (vitest block) |
| Quick run command | `cd src && npx vitest run --reporter=verbose` |
| Full suite command | `cd src && npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FTE-03 | Minimap extension included in editor | unit | `cd src && npx vitest run src/src/components/editor/CodeEditor.test.tsx -x` | No -- Wave 0 |
| FTE-04 | Bash tool card has "Run in Terminal" button | unit | `cd src && npx vitest run src/src/components/chat/tools/BashToolCard.test.tsx -x` | Yes (extend) |
| FTE-05 | Run in Terminal switches tab + sends command | unit | `cd src && npx vitest run src/src/components/chat/tools/BashToolCard.test.tsx -x` | Yes (extend) |

### Sampling Rate
- **Per task commit:** `cd src && npx vitest run --reporter=verbose`
- **Per wave merge:** `cd src && npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/src/components/editor/CodeEditor.test.tsx` -- covers FTE-03 (minimap extension presence). Note: testing actual canvas rendering is impractical in jsdom; test that the extension is in the extensions array.
- [ ] Extend existing `BashToolCard.test.tsx` -- covers FTE-04 (button renders for resolved Bash calls, hidden for pending/null command) and FTE-05 (click calls `sendToShell` and `setActiveTab`)

## Sources

### Primary (HIGH confidence)
- `@replit/codemirror-minimap` GitHub README -- API options, usage pattern
- [DeepWiki: codemirror-minimap Getting Started](https://deepwiki.com/replit/codemirror-minimap/2-getting-started) -- DOM structure, CSS classes, TypeScript interfaces, scale constants
- Project source: `src/src/lib/shell-input.ts` -- existing `sendToShell()` API
- Project source: `src/src/components/chat/tools/BashToolCard.tsx` -- current card implementation
- Project source: `src/src/components/editor/CodeEditor.tsx` -- current editor extension setup
- Project source: `src/src/stores/ui.ts` -- `setActiveTab` action
- Project source: `src/src/components/terminal/TerminalPanel.tsx` -- terminal lifecycle and shell-input registration

### Secondary (MEDIUM confidence)
- npm registry: `@replit/codemirror-minimap@0.5.2` -- version, peer deps verified via `npm view`

### Tertiary (LOW confidence)
- Returning `null` from `showMinimap.compute()` to conditionally disable -- not verified in docs, needs implementation testing

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - single library choice, peer deps verified, all installed
- Architecture: HIGH - leverages two existing patterns (CM6 extensions array, module-level ref for shell-input)
- Pitfalls: MEDIUM - terminal timing is empirical, minimap null-return unverified

**Research date:** 2026-03-16
**Valid until:** 2026-04-16 (stable libraries, no fast-moving APIs)
