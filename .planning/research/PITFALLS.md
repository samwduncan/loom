# Pitfalls Research

**Domain:** Brownfield React + Tailwind fork/retheme — CloudCLI to Loom
**Researched:** 2026-03-01
**Confidence:** HIGH (verified against official docs, GitHub issues, and 2024/2025 community sources)

---

## Critical Pitfalls

### Pitfall 1: Tailwind HSL Variable Opacity — The `<alpha-value>` Contract

**What goes wrong:**
Custom colors defined as CSS variables silently break opacity modifiers (`bg-primary/50`, `text-accent/70`). The colors render at full opacity regardless of the modifier. This is invisible in development unless you explicitly test transparent overlays, tooltips, backdrops, and hover states.

**Why it happens:**
Tailwind's opacity modifier system works by injecting an alpha channel into the color's CSS function. For this to work, the color definition in `tailwind.config.js` must use the `<alpha-value>` placeholder. If a CSS variable is registered as `'var(--color-primary)'` (a full color reference), Tailwind has no way to splice in the alpha value. The pattern `hsl(var(--primary))` also fails because the HSL function wraps the variable before Tailwind can inject alpha.

**How to avoid:**
Define CSS variables as bare HSL *channel values only* (no `hsl()` wrapper in the variable itself), then reference them in the Tailwind config using the slash syntax:

```css
/* In globals.css — channels only, no hsl() wrapper */
:root {
  --color-bg: 15 28% 9%;          /* #1c1210 */
  --color-surface: 15 28% 15%;    /* #2a1f1a */
  --color-accent: 29 56% 64%;     /* #d4a574 */
}
```

```js
// In tailwind.config.js
colors: {
  bg: 'hsl(var(--color-bg) / <alpha-value>)',
  surface: 'hsl(var(--color-surface) / <alpha-value>)',
  accent: 'hsl(var(--color-accent) / <alpha-value>)',
}
```

This enables `bg-accent/50`, `text-surface/80` etc. to work correctly. Adding fallback values inside the `hsl()` call also breaks opacity.

**Warning signs:**
- Hover states that should be semi-transparent look fully opaque
- Backdrop overlays/modals appear solid instead of translucent
- `bg-opacity-*` classes work but `/` modifier syntax does not (different code paths)
- Any `hsl(var(--x), fallback)` pattern in the color config

**Phase to address:** Phase 1 (Tailwind color system setup) — get this right before any component work.

---

### Pitfall 2: Hardcoded Colors Surviving a Retheme

**What goes wrong:**
After the Tailwind config is fully updated, the app still shows flashes of blue, gray, or off-white from hardcoded color classes that were never tokenized. This is especially common in: third-party component overrides, CodeMirror/xterm.js inline styles, SVG `fill`/`stroke` attributes, `style={{ color: '#...' }}` JSX props, and Tailwind classes bypassing the theme (e.g., `bg-gray-900`, `text-white`, `border-zinc-700`).

**Why it happens:**
A ~200-file React codebase has hundreds of color references. The original CloudCLI used a mix of Tailwind semantic classes, hardcoded gray/blue/slate classes, and inline styles. No single grep captures all color surfaces. The developer assumes the theme covers everything but only tokenized the "obvious" paths.

**How to avoid:**
1. Before starting retheme: run an audit grep across all color axes:
   ```bash
   grep -r "bg-gray\|bg-slate\|bg-zinc\|bg-blue\|bg-neutral\|text-white\|text-gray\|border-gray\|border-slate" src/ --include="*.tsx" --include="*.ts" | wc -l
   ```
2. Run a secondary grep for inline style hex/rgb values:
   ```bash
   grep -rE "style=.*#[0-9a-fA-F]{3,6}|style=.*rgb\(" src/ --include="*.tsx"
   ```
3. Create a "no raw colors" ESLint rule or Tailwind lint rule that flags non-token color classes in PRs.
4. Audit third-party library wrappers separately — xterm.js, CodeMirror, react-markdown rendering output.

**Warning signs:**
- Visual inconsistency spotted by toggling between screens (one section is warm, another is cold)
- Third-party UI elements (toasts, tooltips, date pickers) don't inherit the warm theme
- Any `style={{ backgroundColor: '...' }}` or `style={{ color: '...' }}` in component files

**Phase to address:** Phase 1 (color audit before retheme) and enforced in every subsequent phase via linting.

---

### Pitfall 3: React Streaming Re-Render Cascade — Per-Token setState

**What goes wrong:**
The chat streaming experience degrades under load: token-by-token updates cause 100–400 renders per second, the UI stutters, browser frames drop, and typing indicators jitter. On long Claude reasoning responses with thinking blocks, the browser tab can consume 100%+ CPU.

**Why it happens:**
The naive pattern (`setMessages(prev => [...prev, token])` on each incoming WebSocket message) schedules a React reconciliation cycle per token. React 18's automatic batching helps in event handlers but streaming callbacks (WebSocket `onmessage`) bypass batching in some configurations. Even with batching, rendering a 200-message chat thread on every token wastes cycles on messages that haven't changed.

**How to avoid:**
1. **Buffer + rAF flush:** Accumulate incoming tokens in a mutable `ref` buffer. Flush the buffer to React state on `requestAnimationFrame`, collapsing hundreds of tokens into one render per frame (~60/second max):
   ```ts
   const bufferRef = useRef('');
   ws.onmessage = (e) => { bufferRef.current += e.data.token; };
   useEffect(() => {
     const id = requestAnimationFrame(() => {
       if (bufferRef.current) {
         setStreamingContent(bufferRef.current);
         bufferRef.current = '';
       }
     });
     return () => cancelAnimationFrame(id);
   });
   ```
2. **Memoize stable message components:** Wrap completed (non-streaming) messages in `React.memo` with a custom comparator. Only the actively-streaming message should re-render on each rAF flush.
3. **Separate streaming state from history state:** Keep the current streaming turn in isolated state, merged into history only on completion. This prevents the entire message list from reconciling on every token.

**Warning signs:**
- Browser DevTools "Performance" tab shows render cascades at 200+ renders/second during streaming
- Scroll position jitter while tokens arrive (caused by layout thrash during re-renders)
- CPU usage spike in the browser tab during active streaming (>30% sustained on a modern machine)

**Phase to address:** Phase 2 (chat UI streaming implementation) — must be designed in from the start, not retrofitted.

---

### Pitfall 4: Auto-Scroll Fighting the User

**What goes wrong:**
The chat view scrolls the user back to the bottom while they are actively reading earlier messages. Alternatively, the scroll jitters as new tokens arrive — content height changes cause scroll position to shift even when the user *is* at the bottom. The "N new messages" pill appears and disappears erratically.

**Why it happens:**
Two conflicting behaviors: (1) content growing during streaming changes the scrollable height, which can cause `scrollTop` to shift even without explicit scroll calls; (2) auto-scroll logic using `scrollIntoView()` or setting `scrollTop` on each render fires even when user has manually scrolled up. A subtle secondary bug: `IntersectionObserver` watching a sentinel div re-fires when the parent re-renders and its ref changes, causing the "user is at bottom" flag to toggle incorrectly.

**How to avoid:**
1. **Track user intent explicitly:** Store a boolean `isUserAtBottom`. Update it in `onScroll` by checking `scrollHeight - scrollTop - clientHeight < threshold` (e.g., 100px). Only auto-scroll when this flag is `true`.
2. **Use `scroll-anchor` CSS:** Set `overflow-anchor: auto` on the scroll container and `overflow-anchor: none` on all children except the bottom sentinel. The browser handles positional preservation automatically without JavaScript.
3. **Avoid `scrollIntoView()` in `useEffect` per-render:** Call it only when `isUserAtBottom` is true and a new message is added, not on every streaming token.
4. **Stable IntersectionObserver refs:** Wrap the observer callback in `useCallback` and ensure the sentinel ref target doesn't change on re-renders.

**Warning signs:**
- Users report "it keeps jumping to the bottom while I'm reading"
- Scroll position visibly shifts during streaming even when not at the bottom
- The "scroll to bottom" pill appears and disappears in less than a second
- The sentinel's IntersectionObserver fires on every streaming render

**Phase to address:** Phase 2 (chat UI) — design the scroll management contract before implementing streaming.

---

### Pitfall 5: Fork Divergence — The Upstream Merge Trap

**What goes wrong:**
CloudCLI continues shipping improvements (bug fixes, new AI provider support, WebSocket protocol changes, security patches). After 3–6 months, Loom's fork has diverged enough that cherry-picking upstream fixes causes multi-file conflicts. The choice becomes: spend days resolving conflicts, or stop tracking upstream entirely. Either outcome is painful.

**Why it happens:**
The fork diverges along two axes simultaneously: (1) Loom removes code paths (i18n, Cursor/Codex backends), which leaves gaps in files that upstream continues to modify; (2) Loom restructures components and renames classes, so upstream changes to those same files conflict at the syntax level even when semantically unrelated. Mixed-purpose commits (one commit touches UI and WebSocket protocol) make surgical cherry-picks impossible.

**How to avoid:**
1. **Maintain a clean separation branch:** Keep an `upstream-sync` branch that tracks `origin/main` exactly. Never commit Loom changes to it. Merge upstream into it freely. Diff `upstream-sync` against `main` to see what upstream added.
2. **Scope Loom changes atomically:** Each commit should touch either a Loom-specific concern OR an upstream-inherited concern, never both. This makes cherry-picking upstream security fixes feasible.
3. **Prefer additive changes over replacement:** Instead of removing i18n files, add a feature flag that disables them. Instead of deleting Cursor backend code, wrap it in dead code (removable later). This reduces conflict surface with upstream.
4. **Tag upstream baseline:** Tag the exact upstream commit the fork was based on (`upstream-base-v1.x.y`). When upstream ships a security fix, `git range-diff upstream-base HEAD` shows only the fix, not all your changes.
5. **Subscribe to upstream releases:** Watch the CloudCLI repository for new releases. Evaluate each release's changelog before significant divergence accumulates.

**Warning signs:**
- `git cherry-pick` on an upstream commit causes conflicts in 3+ files
- Upstream has shipped a security fix you haven't absorbed after 2+ weeks
- You've deleted rather than disabled upstream code paths
- Commits mix Loom UI work with backend protocol changes

**Phase to address:** Phase 1 (fork setup) — establish branch strategy and git workflow before any code changes.

---

### Pitfall 6: WebSocket Cleanup and React 18 StrictMode Double-Mount

**What goes wrong:**
In development, WebSocket connections are created twice, leaving orphaned connections that continue receiving messages and calling `setState` on unmounted components. In production, navigating away from a chat view leaves an active WebSocket that accumulates messages indefinitely, growing memory until the tab is refreshed.

**Why it happens:**
React 18 StrictMode intentionally double-mounts components to catch missing cleanup. A `useEffect` that opens a WebSocket without a cleanup function creates two connections in development. More critically, the effect cleanup from the *first* mount is actually called during the *second* mount's setup phase (known bug: facebook/react #25614). Even in production, WebSocket cleanup is commonly missing from components that handle navigation.

**How to avoid:**
1. Every `useEffect` that opens a WebSocket must return a cleanup function:
   ```ts
   useEffect(() => {
     const ws = new WebSocket(url);
     ws.onmessage = handleMessage;
     return () => {
       ws.close();
       ws.onmessage = null;
     };
   }, [url]);
   ```
2. Guard `setState` calls against unmount:
   ```ts
   useEffect(() => {
     let active = true;
     ws.onmessage = (e) => { if (active) setMessages(m => [...m, e.data]); };
     return () => { active = false; };
   }, []);
   ```
3. CloudCLI's existing WebSocket implementation may already handle cleanup — verify before refactoring, don't inadvertently remove the cleanup logic during component restructuring.

**Warning signs:**
- Browser DevTools Network tab shows 2 WebSocket connections in development
- Console warnings: "Can't perform a React state update on an unmounted component"
- Memory usage in the browser tab grows proportionally to how many chat sessions have been opened/closed
- Messages from previous sessions appear in new sessions

**Phase to address:** Phase 2 (any component restructuring touching WebSocket consumers) — verify cleanup is preserved after every refactor.

---

## Moderate Pitfalls

### Pitfall 7: Context API Re-Render Cascade for Streaming State

**What goes wrong:**
Any component reading from a shared context that holds streaming message state re-renders on every token. A sidebar component showing session metadata re-renders 400 times during a Claude streaming response because it shares a context with the chat messages.

**Prevention:**
Split contexts by update frequency. Streaming content and message state belong in a dedicated `StreamingContext` or managed by a local `useReducer` in the chat component, not in a global app-level context that sidebar, settings, and file explorer components also consume. Never put high-frequency streaming data in a context consumed by layout-level components.

---

### Pitfall 8: Tailwind Dynamic Class Construction — Production Purge

**What goes wrong:**
Classes constructed via template literals or string concatenation are purged in production builds. Example: `bg-${severity}-500` produces `bg-error-500` at runtime but the string `bg-error-500` never appears in source files, so Tailwind's content scanner never generates it. The class silently does nothing in production.

**Prevention:**
Use lookup tables for all dynamic color/state mapping:
```ts
const severityClass = {
  error: 'bg-error-500',
  warning: 'bg-warning-500',
  info: 'bg-info-500',
} satisfies Record<Severity, string>;
```
Never construct class names by interpolation. Add the full class string to a `safelist` in `tailwind.config.js` for any genuinely dynamic cases. Verify in production build (not dev server) by inspecting the generated CSS file.

---

### Pitfall 9: CSS Specificity Conflicts with Third-Party Components

**What goes wrong:**
Third-party components (toast libraries, CodeMirror, xterm.js) inject their own stylesheets at high specificity. After Tailwind v3.4.1 changed the dark mode `class` strategy to `selector` strategy, the specificity of `.dark:` prefixed utilities dropped, causing them to lose to third-party stylesheets. This can make dark theme overrides on toast notifications, tooltips, and dropdowns silently fail.

**Prevention:**
1. Import Tailwind's output CSS *after* all third-party stylesheets so utility classes win specificity ties.
2. For components you cannot control: use the `!important` modifier (`!bg-surface`, `!text-primary`) sparingly for direct overrides.
3. For CodeMirror: use the `EditorView.theme()` extension API directly — don't try to override CodeMirror's injected class styles via Tailwind utilities.
4. For xterm.js: colors must use the `Terminal.options.theme` object with hex values; CSS variables and Tailwind classes have no effect on the canvas-rendered terminal.

---

### Pitfall 10: xterm.js Theme — CSS Cannot Reach the Canvas

**What goes wrong:**
The terminal looks wrong — ANSI colors don't match the Catppuccin Mocha palette, the background is mismatched, or text contrast is poor. Attempts to fix it with CSS classes or custom properties have no effect.

**Why it happens:**
xterm.js renders to a WebGL canvas or DOM with its own injected stylesheet. CSS variables, Tailwind utilities, and global styles cannot reach inside the terminal rendering surface. Theme values must be passed as JavaScript configuration to `Terminal` at instantiation or updated via `terminal.options.theme = { ... }`.

**Prevention:**
Define the full Catppuccin Mocha palette as a JavaScript constant (hex values, not CSS variables) and pass it to xterm.js explicitly:
```ts
const MOCHA_THEME: ITheme = {
  background: '#1e1e2e',
  foreground: '#cdd6f4',
  black: '#45475a',
  red: '#f38ba8',
  // ... full 16-color ANSI palette
};
terminal.options.theme = MOCHA_THEME;
```
Do this once during terminal initialization and after any programmatic theme switch.

---

### Pitfall 11: React Context Provider Order — Breaking Existing Auth/Session State

**What goes wrong:**
During component restructuring, moving a Context Provider up or down the tree breaks components that were already consuming it. The most common failure: wrapping a new provider *inside* `AuthContext.Provider` when it needs auth state to initialize, or conversely extracting a provider to a higher level that causes it to re-initialize on every parent render, resetting session state.

**Prevention:**
Before restructuring any context providers: document the exact provider tree order and which components depend on which contexts being already-initialized. CloudCLI's existing provider hierarchy must be treated as a dependency graph. Add new providers at the outermost safe level — never inside a provider that manages state you need at initialization time.

---

### Pitfall 12: GPL-3.0 Compliance — Source Availability and Attribution

**What goes wrong:**
The fork is distributed (self-hosted and published publicly) without: (a) retaining the GPL-3.0 license file, (b) including attribution to the original CloudCLI authors in copyright headers or NOTICE file, (c) making modified source code available under GPL-3.0. Additionally, using "CloudCLI" or "ClaudeCodeUI" branding in the fork name may infringe the upstream project's trademark even though GPL allows code reuse.

**Prevention:**
1. Keep `LICENSE` as GPL-3.0 — no relicensing is possible.
2. Retain upstream copyright headers in all modified files. Add Loom's own copyright for new files.
3. Maintain a public repository with the modified source — GPL-3.0 requires this if distributed.
4. Rename the project (Loom) and avoid all upstream branding in UI, documentation, and npm package names.
5. Add a `NOTICE` or `ATTRIBUTION` file crediting the original CloudCLI/siteboon project.

---

### Pitfall 13: CodeMirror 6 Extension Array — Stability and Theme Application

**What goes wrong:**
Custom syntax highlighting themes don't apply, or the editor flickers and loses cursor position. Theme changes on app re-render cause the entire CodeMirror instance to rebuild rather than reconfigure.

**Why it happens:**
CodeMirror 6 extensions are configured as an array passed to `EditorState.create()`. If the `extensions` array reference changes on every React render (e.g., created inline in JSX), CodeMirror tears down and rebuilds its state. Custom themes require being added to the `extensions` array explicitly — they're not applied via CSS classes on the host element.

**Prevention:**
1. Wrap the extensions array in `useMemo` so it only changes when the theme truly changes:
   ```ts
   const extensions = useMemo(() => [
     loomTheme,
     javascript(),
     syntaxHighlighting(defaultHighlightStyle),
   ], [loomTheme]);
   ```
2. Use `Compartment` for dynamic theme switching rather than rebuilding the extensions array:
   ```ts
   const themeCompartment = new Compartment();
   // Initial: extensions: [themeCompartment.of(loomTheme)]
   // Switch: view.dispatch({ effects: themeCompartment.reconfigure(newTheme) });
   ```

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Direct `!important` overrides for third-party component theming | Quick visual fix | CSS specificity war escalates; impossible to override later | Never for core components; only for truly uncontrollable third-party leaf elements |
| Skipping `<alpha-value>` in HSL color config | Simpler config | All opacity modifiers silently fail; interactive states broken | Never — always required for the opacity modifier system |
| Putting streaming state in global Context | Easy to add | Every context consumer re-renders on every streaming token | Never — always isolate streaming state locally |
| Deleting i18n/Cursor/Codex code vs. disabling it | Cleaner codebase | Massive upstream merge conflicts when those files are modified | Acceptable if you commit to never syncing upstream changes to those files |
| Per-token `setState` for streaming | Simple code | CPU thrash, scroll jitter, browser freeze at high token rates | Never — buffered rAF pattern has same complexity once written |
| Creating WebSocket in `useEffect` without cleanup | Working MVP | Memory leaks, orphaned connections, stale state updates | Never — cleanup is 3 lines and has no downside |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| xterm.js theming | Applying colors via CSS custom properties or Tailwind classes | Pass a full `ITheme` JavaScript object with hex values to `terminal.options.theme` |
| CodeMirror 6 custom themes | Setting CSS on the container element | Create a `EditorView.theme({})` extension and add it to the `extensions` array; use `Compartment` for dynamic switching |
| react-markdown with raw HTML | Adding `rehype-raw` without `rehype-sanitize` | Always pair `rehype-raw` with `rehype-sanitize`; Claude's output may include HTML that creates XSS vectors |
| WebSocket in React 18 StrictMode | No cleanup function in `useEffect` | Return a cleanup that closes the socket; guard setState with an `active` flag |
| Tailwind opacity modifiers | `hsl(var(--color))` format in config | Must use `hsl(var(--color) / <alpha-value>)` with channel-only CSS variables |
| Tailwind dynamic classes | Template literal class construction | Use lookup table objects; full class strings must appear verbatim in source |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Per-token setState during streaming | CPU spike, scroll jitter, dropped frames | Buffer in ref, flush via rAF | As soon as streaming responses exceed ~50 tokens (typically within first real response) |
| Global context for message state | Sidebar and unrelated UI components re-render on every token | Isolate streaming state; split context by update frequency | Day 1 if streaming state is added to a broad-scope context |
| CodeMirror extensions array created inline in JSX | Editor rebuilds state on every parent render, cursor jumps | Wrap in `useMemo`, use `Compartment` for dynamic changes | Any time the parent component re-renders (which happens constantly in a chat UI) |
| TanStack Virtual dynamic heights without estimation | Scroll stutters and layout jumps with variable-length messages | Provide `estimateSize` returning a large-enough value; measure after render | As soon as messages contain tool calls or thinking blocks with variable height |
| IntersectionObserver sentinel re-mounting | Auto-scroll toggle fires incorrectly, scroll pill flickers | Stable ref and `useCallback` for observer callback | Any re-render that changes the observer's callback reference |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| `rehype-raw` without `rehype-sanitize` | Claude's markdown output containing raw HTML can execute scripts — XSS | Always pair `rehype-raw` + `rehype-sanitize` with a strict allow-list schema |
| Removing GPL-3.0 attribution/license | Legal exposure; FSF enforcement actions have been brought for GPL non-compliance | Keep LICENSE intact; add NOTICE/ATTRIBUTION file |
| JWT token exposed in WebSocket URL query parameters | Tokens appear in server access logs and browser history | Pass JWT in WebSocket handshake headers or via initial message handshake, not URL |
| Rendering user-controlled content with `dangerouslySetInnerHTML` | XSS | Never; use react-markdown's component override system instead |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Auto-scroll overrides user intent | User loses reading position mid-stream | Track `isUserAtBottom` explicitly; only auto-scroll when true |
| Color contrast failures in warm palette | Text unreadable on dark brown backgrounds; accessibility failure | Verify every text/background combination meets WCAG 4.5:1; deep browns (#1c1210) require near-white text (#f5e6d3) — verify the contrast ratio is 12:1+ |
| Missing "active streaming" indicator | User doesn't know if Claude is still thinking | Global status line + pulsing indicator on the active turn; distinct from "idle" state |
| Collapsible turns collapse the currently streaming turn | Disorienting; streaming content disappears mid-response | Never collapse the most recent turn; only collapse completed turns |
| Font fallback to system sans-serif during JetBrains Mono load | Layout shift as monospace font loads; column widths jump | Self-host JetBrains Mono as woff2 with `font-display: block`; preload in HTML head |
| Error states losing the warm theme | System errors show browser-default red on white, breaking aesthetic | All error states (toast, inline banner, permission denied) must use the earthy accent palette (terracotta red, not `#ef4444`) |

---

## "Looks Done But Isn't" Checklist

- [ ] **Tailwind opacity modifiers:** Tested with `bg-primary/50` on an overlay — verify it renders semi-transparent, not full opacity.
- [ ] **Dynamic class production build:** Build with `npm run build` and check the generated CSS file contains all tool-call severity classes, not just the ones present in dev.
- [ ] **xterm.js ANSI colors:** Open a session that outputs colored text (e.g., `ls --color`) — verify all 16 ANSI colors match Catppuccin Mocha, not browser defaults.
- [ ] **WebSocket leak:** Open 5 chat sessions in sequence, navigate away from each — DevTools Memory tab should show no growing detached WebSocket objects.
- [ ] **Streaming performance:** During a long Claude response, open DevTools Performance tab — render rate should not exceed 60/second.
- [ ] **Scroll position during streaming:** Start a stream, manually scroll up to read earlier messages, verify the view does not jump back to the bottom mid-stream.
- [ ] **Dark theme on all states:** Test hover, focus, active, disabled, error states — all must use the earthy palette with no gray/blue leakage.
- [ ] **GPL attribution:** Check built distribution for LICENSE file and ATTRIBUTION/NOTICE — must credit original CloudCLI authors.
- [ ] **CodeMirror theme persists after parent re-render:** Toggle a UI state that re-renders the chat parent component — verify code editor theme and cursor position are stable.
- [ ] **react-markdown sanitization:** Render a message containing `<script>alert(1)</script>` in markdown — verify it is not executed.

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| HSL opacity contract broken site-wide | MEDIUM | Audit all color config entries; add `/ <alpha-value>` to each; test all opacity-using components |
| Hardcoded colors survive retheme | LOW–MEDIUM | Grep audit script above; systematic file-by-file replacement sprint; add ESLint rule to prevent recurrence |
| Per-token setState causing performance issues | MEDIUM | Introduce buffer ref + rAF pattern; isolate streaming state from message history state; no API changes required |
| Fork catastrophically diverged from upstream | HIGH | Establish `upstream-sync` branch retroactively; diff against upstream baseline tag; manually merge critical fixes only; accept permanent divergence for deleted code paths |
| Context re-render cascade | MEDIUM | Split context into stable/streaming providers; wrap high-frequency state in local `useReducer`; may require threading new props through intermediate components |
| WebSocket leak | LOW | Add cleanup functions to all WebSocket `useEffect` calls; guard setState with `active` flag; one-day fix |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| HSL `<alpha-value>` contract | Phase 1: Tailwind color system | `bg-accent/50` renders semi-transparent in dev and production |
| Hardcoded colors not tokenized | Phase 1: Color audit before retheme begins | Grep audit returns 0 non-token color classes; visual QA of every screen |
| Per-token streaming re-renders | Phase 2: Chat UI streaming implementation | DevTools performance: <60 renders/second during active streaming |
| Auto-scroll fighting user | Phase 2: Chat UX | Manual scroll-up during streaming does not snap back to bottom |
| Fork divergence strategy | Phase 1: Fork setup and git workflow | `upstream-sync` branch exists; all Loom changes are atomic and scoped |
| WebSocket cleanup | Phase 2 and any component refactor phase | No orphaned WebSocket connections in DevTools after navigation |
| Context re-render cascade | Phase 2: State architecture | Sidebar and non-chat components do not re-render during streaming (verified with React DevTools Profiler) |
| Tailwind dynamic purge | Phase 3+: Any phase introducing dynamic class construction | Production build CSS contains all expected utility classes |
| CSS specificity third-party conflicts | Phase 2–3: Third-party component theming | Toast, CodeMirror, xterm themed correctly in production build |
| xterm.js canvas theming | Phase 3: Terminal integration | All 16 ANSI colors match Catppuccin Mocha spec |
| CodeMirror extension stability | Phase 3: Editor integration | Theme and cursor stable after parent component re-renders |
| GPL compliance | Phase 1: Fork setup | LICENSE, ATTRIBUTION, and source repository all present before any public distribution |
| react-markdown XSS | Phase 2: Markdown rendering | Script injection in message content is neutralized |

---

## Sources

- [Tailwind CSS HSL opacity modifier issue #7575 — Background Opacity does not work with CSS variables](https://github.com/tailwindlabs/tailwindcss/issues/7575) (HIGH confidence — official GitHub issue)
- [Tailwind CSS Color opacity modifier discussion #7736](https://github.com/tailwindlabs/tailwindcss/discussions/7736) (HIGH confidence)
- [Pro Tailwind: Implementing Color Opacity with CSS Variables](https://www.protailwind.com/workshops/multi-theme-strategy/multi-theme-tailwind/implementing-color-opacity-with-css-variables) (MEDIUM confidence)
- [Why React Apps Lag With Streaming Text — Akash Builds](https://akashbuilds.com/blog/chatgpt-stream-text-react) (MEDIUM confidence — practical analysis)
- [Streaming Backends & React: Re-render Chaos — SitePoint](https://www.sitepoint.com/streaming-backends-react-controlling-re-render-chaos/) (MEDIUM confidence)
- [Pitfalls of overusing React Context — LogRocket](https://blog.logrocket.com/pitfalls-of-overusing-react-context/) (HIGH confidence — well-sourced)
- [React Context Performance — TenX Developer](https://www.tenxdeveloper.com/blog/optimizing-react-context-performance) (MEDIUM confidence)
- [Friendly Fork Management Strategies — GitHub Blog](https://github.blog/developer-skills/github/friend-zone-strategies-friendly-fork-management/) (HIGH confidence — official GitHub)
- [Best Practices for Forking a Git Repo — Gofore](https://gofore.com/en/best-practices-for-forking-a-git-repo/) (MEDIUM confidence)
- [History-Preserving Fork Maintenance — amboar.github.io](https://amboar.github.io/notes/2021/09/16/history-preserving-fork-maintenance-with-git.html) (MEDIUM confidence)
- [React 18 StrictMode Double-Mount Bug — facebook/react #25614](https://github.com/facebook/react/issues/25614) (HIGH confidence — official React issue tracker)
- [React useEffect Cleanup — LogRocket](https://blog.logrocket.com/understanding-react-useeffect-cleanup-function/) (HIGH confidence)
- [Setting Colors in xterm.js — Oliver Roick (2024)](https://oliverroick.net/learnings/2024/setting-colours-in-xterm-js.html) (HIGH confidence — 2024, specific)
- [TanStack Virtual dynamic height issue #832](https://github.com/TanStack/virtual/issues/832) (HIGH confidence — official issue tracker)
- [GPL-3.0 FAQ — GNU Project](https://www.gnu.org/licenses/gpl-faq.en.html) (HIGH confidence — authoritative)
- [XSS via Markdown — Medium/javascript-security](https://medium.com/javascript-security/avoiding-xss-via-markdown-in-react-91665479900) (MEDIUM confidence)
- [Tailwind dark mode specificity post-v3.4.1 — Medium](https://medium.com/@hilalsem/overcoming-specificity-challenges-arising-fromtailwinds-dark-mode-strategy-update-a-contributor-s-34ae4d9b3d11) (MEDIUM confidence)
- [CodeMirror 6 Styling Guide — codemirror.net](https://codemirror.net/examples/styling/) (HIGH confidence — official docs)
- [Tailwind dynamic classes purge — Tailwind official docs](https://tailwindcss.com/docs/detecting-classes-in-source-files) (HIGH confidence)

---

*Pitfalls research for: Brownfield React fork/retheme — CloudCLI → Loom*
*Researched: 2026-03-01*
