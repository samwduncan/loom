# Technology Stack: Loom V2 — Premium AI Coding Interface

**Project:** Loom V2 — Greenfield Frontend Rewrite
**Researched:** 2026-03-04
**Scope:** Full V2 stack for new `src/` from scratch. Backend (Node.js/Express/WebSocket) is preserved unchanged.
**Confidence:** HIGH (versions verified via npm registry 2026-03-04; architectural choices validated against ARCHITECT_SYNC.md consensus)

---

## Orientation

This document covers the complete V2 frontend stack. The existing `package.json` already contains several packages that carry over; others must be added. Items marked **CARRY OVER** are already installed and working. Items marked **ADD** require `npm install`. Items marked **REMOVE** are installed but should be eliminated from the V2 build.

The V2 architecture decisions (4-store Zustand, useRef streaming bypass, tiered animation, content-visibility-first virtualization) were reached through co-architect review (ARCHITECT_SYNC.md) and are treated as settled constraints, not open questions.

---

## Core Framework

| Technology | Version | Status | Purpose | Why |
|------------|---------|--------|---------|-----|
| React | ^18.2.0 | CARRY OVER | UI runtime | Concurrent Mode (`useTransition`, `useDeferredValue`, `startTransition`) is essential for streaming performance at 100 tokens/sec. React 18 is the minimum version that makes this possible without custom scheduling. |
| TypeScript | ^5.9.3 | CARRY OVER | Type safety | Strict mode (`"strict": true`, `"noUncheckedIndexedAccess": true`) enforced by V2 Constitution. TypeScript 5.9 ships with improved `--exactOptionalPropertyTypes` support needed for the discriminated union WebSocket message schema. |
| Vite | ^7.0.4 | CARRY OVER | Build & dev server | Fastest HMR in ecosystem. Vite 7 ships with Rollup 4 for superior tree-shaking of the tiered animation strategy (LazyMotion dead code eliminated at build time). `@vitejs/plugin-react` v5.1.4 provides Babel-based Fast Refresh. |

**Confidence:** HIGH — all three are current stable releases verified on npm 2026-03-04.

---

## Styling System

| Technology | Version | Status | Purpose | Why |
|------------|---------|--------|---------|-----|
| Tailwind CSS | ^3.4.17 | CARRY OVER | Utility-first styling | V2 Constitution mandates Tailwind v3.4 (not v4) because the `hsl(var(--token) / <alpha-value>)` pattern in `tailwind.config.js` provides runtime theming that Tailwind v4's compile-time `@theme` cannot. All CSS custom property tokens from `src/styles/index.css` flow through this contract. |
| clsx | ^2.1.1 | CARRY OVER | Conditional classes | Lightweight class composition. Used only inside `cn()` utility. |
| tailwind-merge | ^3.3.1 | CARRY OVER | Class deduplication | Prevents conflicting Tailwind classes in the `cn()` utility (e.g., `bg-card bg-primary` → `bg-primary`). |
| class-variance-authority | ^0.7.1 | CARRY OVER | Component variants | Type-safe variant APIs for design system primitives (Button, Badge, Card). Composes with `cn()`. |
| tailwindcss-animate | ^1.0.7 | CARRY OVER | Animation utilities | Provides composable `animate-in`, `fade-in-0`, `slide-in-from-bottom-2` CSS classes (0KB JS runtime). Used for message entrance, modal fade, toast entrance — all Tier 2 animations per V2 Constitution Section 11. |
| @tailwindcss/typography | ^0.5.16 | CARRY OVER | Prose styles | Required for `prose` class on markdown content rendering. Overridden with custom CSS variables to match the Loom palette. |

**NOT using Tailwind v4:** The `@theme` CSS-in-CSS approach in v4 would break the `hsl(var(--token) / <alpha-value>)` runtime theming contract that enables opacity modifiers like `bg-primary/20`. Migration would require rebuilding all token references. V2 starts on v3.4 and migrates to v4 only after token architecture is proven stable.

**Confidence:** HIGH — versions confirmed in current `package.json`.

---

## State Management

| Technology | Version | Status | Purpose | Why |
|------------|---------|--------|---------|-----|
| Zustand | ^5.0.11 | ADD | Global state (4 stores) | Selector-based subscriptions prevent the re-render cascade that kills streaming performance. At 100 tokens/sec, React Context triggers re-renders in every consumer; Zustand with `useShallow` triggers re-renders only in components that select the changed slice. V2 uses exactly 4 stores: `timeline`, `stream`, `ui`, `connection`. |

**The 4-Store Architecture (from ARCHITECT_SYNC.md consensus):**

```
Store 1 — timeline.ts:    Past messages, session list, conversation metadata (low update frequency)
Store 2 — stream.ts:      isStreaming, toolCallStatus, thinkingState — semantic stream state only
Store 3 — ui.ts:          Sidebar open/closed, active modal, theme — ephemeral UI state
Store 4 — connection.ts:  WebSocket status, reconnection state, connection metadata
```

**The Streaming Hybrid (critical architectural decision):**

The `stream` store holds semantic state only. The actual token text accumulation bypasses Zustand entirely — it uses `useRef` + direct DOM mutation via a `requestAnimationFrame` loop. The ref flushes to Zustand state only when streaming completes. This eliminates the VDOM diff entirely during high-frequency token delivery.

```typescript
// Pattern: useRef bypass for streaming text
const tokenBufferRef = useRef<string[]>([]);
const streamingTextRef = useRef('');

// rAF loop writes directly to DOM
useEffect(() => {
  let rafId: number;
  const flush = () => {
    if (tokenBufferRef.current.length > 0) {
      const batch = tokenBufferRef.current.splice(0);
      streamingTextRef.current += batch.join('');
      if (textNodeRef.current) {
        textNodeRef.current.textContent = streamingTextRef.current;
      }
    }
    rafId = requestAnimationFrame(flush);
  };
  rafId = requestAnimationFrame(flush);
  return () => cancelAnimationFrame(rafId);
}, []);
```

**Mandatory selector pattern:**

```typescript
// CORRECT — triggers re-render only for isStreaming changes
const isStreaming = useStreamStore(state => state.isStreaming);

// CORRECT — multiple fields with useShallow
const { isStreaming, toolCallStatus } = useStreamStore(
  useShallow(state => ({ isStreaming: state.isStreaming, toolCallStatus: state.toolCallStatus }))
);

// BANNED — subscribes to entire store, re-renders on any change
const state = useStreamStore();
```

**Why not Jotai or Valtio:** Jotai's atom model adds indirection without selector benefits for our specific use case (4 stores, defined at startup, not dynamic). Valtio's proxy model has subtle re-render behavior that makes it harder to reason about the streaming bypass pattern. Zustand's explicit selector API is the most predictable choice for this performance profile.

**Confidence:** HIGH — Zustand 5.0.11 is current stable, peer deps confirmed compatible with React 18.

---

## Routing

| Technology | Version | Status | Purpose | Why |
|------------|---------|--------|---------|-----|
| react-router-dom | ^6.8.1 | CARRY OVER | Client-side routing | Already installed and working for session routing. V2 uses flat routing structure: `/` (chat), `/sessions/:id`, `/settings`. TanStack Router (v1.166.2) is more type-safe but migration cost is not justified for a 3-route app. |

**Confidence:** HIGH — v6.8.1 installed, React 18 compatible.

---

## WebSocket / Real-Time Communication

**No new library needed.** The existing CloudCLI backend uses native WebSocket. The V2 frontend uses a thin typed wrapper in `src/lib/wsClient.ts` that:

1. Manages connection lifecycle (connect, reconnect with exponential backoff, close)
2. Parses incoming JSON messages into the discriminated union `WSMessage` type
3. Dispatches parsed messages to the appropriate Zustand store action
4. Buffers outgoing tokens into `tokenBufferRef` for the rAF loop

```typescript
// src/types/websocket.ts — the discriminated union (illustrative; finalize after backend audit)
type WSMessage =
  | { type: 'token'; data: { text: string; index: number } }
  | { type: 'tool_start'; data: { toolName: string; toolId: string; args: Record<string, unknown> } }
  | { type: 'tool_output'; data: { toolId: string; output: string; isError: boolean } }
  | { type: 'thinking'; data: { text: string; isComplete: boolean } }
  | { type: 'status'; data: { connectionState: ConnectionState } }
  | { type: 'error'; data: { code: string; message: string; recoverable: boolean } }
  | { type: 'session_meta'; data: { sessionId: string; model: string; tokenUsage: TokenUsage } };
```

**Why not a WebSocket library:** Libraries like `socket.io-client` add protocol overhead and reconnection logic we'd override anyway. `reconnecting-websocket` adds 20KB for a reconnect loop we can write in 30 lines. Native WebSocket + custom wrapper is the correct choice for a single-backend product.

**Confidence:** HIGH — pattern matches existing V1 implementation.

---

## Markdown Rendering

| Technology | Version | Status | Purpose | Why |
|------------|---------|--------|---------|-----|
| react-markdown | ^10.1.0 | CARRY OVER | Markdown parser + renderer | Supports custom component renderers (code blocks, links, tables) — essential for injecting Shiki-highlighted code and scroll-wrapped tables. The `remark-gfm` + `rehype-raw` pipeline is established and working. |
| remark-gfm | ^4.0.1 | CARRY OVER | GFM extensions | Tables, strikethrough, task lists, autolinks. Required for AI agent output which commonly produces GFM tables and task lists. |
| rehype-raw | ^7.0.0 | CARRY OVER | HTML passthrough | Allows raw HTML in markdown. Required for AI output that sometimes embeds HTML fragments. |

**Streaming markdown strategy (from V2 Constitution Section 12):**

Markdown parsing is NOT called on every token. Instead:
1. Raw text accumulates in the DOM via the `useRef` bypass (no parsing during streaming).
2. A debounced parser triggers on newline `\n`, sentence-end punctuation, or a 50ms idle window.
3. A custom remark plugin detects unclosed code blocks during streaming and injects closing tags — prevents layout flash as the code block container appears mid-stream.
4. `useDeferredValue` on the parsed AST: raw text renders immediately while the highlighted version catches up. This is a React 18 Concurrent feature that prevents the markdown parser from blocking the input.

**Confidence:** HIGH — current versions verified in package.json.

---

## Syntax Highlighting

| Technology | Version | Status | Purpose | Why |
|------------|---------|--------|---------|-----|
| Shiki | ^4.0.1 | CARRY OVER | Syntax highlighting | TextMate grammar quality, CSS variable theming (no style injection), works at build-time or runtime. Critically: language grammars load lazily per-language (dynamic import on first encounter), not bundled. This prevents the initial bundle from containing the 20+ language grammars that Claude Code uses. |

**Loading strategy:**

```typescript
// In CodeBlock.tsx — lazy grammar loading
const highlighter = await getHighlighter({
  themes: ['github-dark'],
  langs: [], // Start empty
});

// Load grammar on first encounter of a language
async function highlight(code: string, lang: string) {
  if (!highlighter.getLoadedLanguages().includes(lang)) {
    await highlighter.loadLanguage(lang as BundledLanguage);
  }
  return highlighter.codeToHtml(code, { lang, theme: 'github-dark' });
}
```

**While grammar loads:** Code renders as plain monospaced text inside the code block container. No layout shift because the container dimensions are established before the highlighted version arrives.

**Why not Prism or Highlight.js:** Prism requires bundling all grammars upfront (no dynamic loading) or runtime evaluation (security risk). Highlight.js has inferior TypeScript support and no CSS variable theming. Shiki is the clear winner for a premium developer tool.

**Confidence:** HIGH — verified installed, version confirmed.

---

## Animation

Loom V2 uses a **three-tier animation strategy** that keeps the initial JS bundle lean while providing spring physics where the premium experience requires it (per ARCHITECT_SYNC.md consensus and V2 Constitution Section 11).

### Tier 1: CSS-only (0KB JS) — Default

All hover states, opacity fades, color transitions, button press scale, expand/collapse via `grid-template-rows`.

**Spring approximation for CSS:**
```css
/* Slight overshoot — button press, icon swaps */
transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);

/* Fast decelerate — panel slides, message entrance */
transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
```

### Tier 2: tailwindcss-animate (0KB JS, CSS plugin) — Entrance/Exit

Message entrance, modal overlay, toast entrance, sidebar orchestration. Already installed.

```tsx
// Message entrance
<div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300">

// Modal overlay exit
<div className={cn(
  "fixed inset-0 bg-black/60 backdrop-blur-sm",
  isExiting && "animate-out fade-out-0 duration-150"
)} />
```

### Tier 3: motion (LazyMotion subset) — Complex Orchestration

**ADD: `motion` ^12.35.0** — but ONLY via `LazyMotion + domAnimation` subset (~5KB gzipped), never the full bundle (~34KB).

Used exclusively for:
- Tool call state machine animation (invoked → executing → resolved → rejected, with coordinated opacity/transform sequences)
- Artifact panel spring physics (content area that slides in with true spring, not cubic-bezier approximation)
- `AnimatePresence` for components where CSS `isExiting` state is insufficient (e.g., dynamically ordered lists where items can be removed from any position)

```tsx
// CORRECT — LazyMotion subset, ~5KB
import { LazyMotion, domAnimation, m } from 'motion/react';

function App() {
  return (
    <LazyMotion features={domAnimation}>
      <m.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      />
    </LazyMotion>
  );
}

// BANNED — full bundle import
import { motion } from 'framer-motion'; // DO NOT USE
import { motion } from 'motion/react'; // Only acceptable with LazyMotion wrapper
```

**Why motion at all, given V1.1 rejected it:** The V2 rewrite is building a greenfield product with more complex animation requirements. V1.1 was patching an existing UI and CSS covered all cases. V2 needs:
1. True spring physics for the tool call state machine (not approximatable with cubic-bezier)
2. `AnimatePresence` for the tabbed workspace (tabs animate in/out, not a static list)
3. Layout animations on the multi-column shell when artifact panel opens/closes

The LazyMotion subset approach limits the cost to ~5KB gzipped vs the ~34KB full bundle.

**Why not CSS animations for everything:** CSS `cubic-bezier` cannot replicate true spring dynamics. The tool call animation (which loops from invoked to executing, potentially for minutes) needs spring physics to feel "alive" rather than mechanical. This is the specific use case where the JS animation engine earns its 5KB.

| Library | Version | Gzipped JS | Use |
|---------|---------|-----------|-----|
| tailwindcss-animate | ^1.0.7 | 0KB | Tier 2: entrance/exit via CSS classes |
| motion (LazyMotion) | ^12.35.0 | ~5KB | Tier 3: spring physics, AnimatePresence |
| motion (full bundle) | — | ~34KB | BANNED |

**Confidence:** HIGH — motion 12.35.0 verified on npm. LazyMotion bundle size estimated from official docs (MEDIUM confidence for exact KB; verify during Phase 1 bundle analysis).

---

## Virtual Scrolling

**Strategy: content-visibility first, @tanstack/react-virtual as escape hatch.**

This is the explicit compromise from ARCHITECT_SYNC.md (Gemini's counter-proposal, accepted by Claude):

### Phase 1-3: CSS content-visibility

```css
/* Past messages — browser skips rendering for off-screen elements */
.message-past {
  content-visibility: auto;
  contain-intrinsic-size: auto 200px; /* Estimated height prevents scroll jump */
}

/* Actively streaming message — CSS containment prevents layout propagation */
.message-streaming {
  contain: content;
}
```

This offloads rendering cost without destroying DOM nodes. Scroll math remains simple because elements exist in the DOM even when off-screen.

### Escape Hatch: @tanstack/react-virtual

**ADD (deferred): `@tanstack/react-virtual` ^3.13.19** — Install only if `content-visibility` proves insufficient during Phase 3 integration testing.

Trigger for escalation: React DevTools Profiler showing >16ms render time with 500+ messages even with `content-visibility` applied.

**Why @tanstack/react-virtual over react-virtuoso:**
- TanStack Virtual is headless — no opinionated scroll container behavior that could conflict with `useScrollAnchor` hook
- `react-virtuoso` (v4.18.3) is higher-level and more opinionated — excellent for simple lists, but harder to integrate with custom scroll anchor logic
- TanStack Virtual gives explicit control over item measurement and overscan — critical for the variable-height markdown messages

**Important:** Virtualizing a list changes scroll math fundamentally. The `useScrollAnchor` IntersectionObserver sentinel pattern must be rewritten if virtualization is adopted. Build scroll physics on `content-visibility` first, virtualize later as a known upgrade path.

**Confidence:** HIGH for content-visibility approach (MDN-documented, Chrome/Firefox/Safari supported). MEDIUM for TanStack Virtual recommendation (based on codebase-specific reasoning, not comparative benchmark; verify if escalation needed).

---

## Error Handling

| Technology | Version | Status | Purpose | Why |
|------------|---------|--------|---------|-----|
| react-error-boundary | ^6.1.1 | CARRY OVER | Error boundary primitives | Provides `ErrorBoundary` component and `useErrorBoundary` hook. V2 requires 3-tier boundary hierarchy (app → panel → message level). Using a library rather than hand-rolling Error Boundaries prevents the common mistake of forgetting to reset boundary state on recovery. |

**Three-tier boundary setup (from V2 Constitution Section 8):**

```tsx
// Level 1 — App root
<ErrorBoundary FallbackComponent={AppErrorFallback}>
  <AppShell />
</ErrorBoundary>

// Level 2 — Each major panel
<ErrorBoundary FallbackComponent={PanelErrorFallback} onReset={resetPanel}>
  <ChatViewport />
</ErrorBoundary>

// Level 3 — Each message
<ErrorBoundary FallbackComponent={MessageErrorFallback} resetKeys={[message.id]}>
  <TurnBlock message={message} />
</ErrorBoundary>
```

**Confidence:** HIGH — installed, working in current codebase.

---

## Toast Notifications

| Technology | Version | Status | Purpose | Why |
|------------|---------|--------|---------|-----|
| sonner | ^2.0.7 | CARRY OVER | Toast notifications | Dark theme native, promise toasts, 3KB gzipped, zero dependencies. CSS variable overrides via `[data-sonner-toast]` selectors map directly to Loom's token system. Toaster is portalled to `document.body` to prevent scroll height interference with the IntersectionObserver sentinel. |

**Confidence:** HIGH — verified installed and working in V1.1.

---

## Testing

### Unit and Integration Testing

| Technology | Version | Status | Purpose | Why |
|------------|---------|--------|---------|-----|
| Vitest | ^4.0.18 | ADD | Test runner | Native Vite integration (zero config, same transform pipeline). Faster than Jest for projects using Vite. `--watch` mode is dramatically faster than Jest for iterative development. API is Jest-compatible, making migration trivial. |
| @testing-library/react | ^16.3.2 | ADD | Component testing | Tests components as users see them, not implementation details. V2 Constitution explicitly bans Enzyme and shallow rendering. |
| @testing-library/user-event | ^14.6.1 | ADD | Interaction simulation | `userEvent.click()`, `userEvent.type()` are more realistic than `fireEvent` because they simulate the full browser event sequence (pointerdown, mousedown, focus, click, etc.). Required by V2 Constitution Section 6.2. |
| jsdom | ^28.1.0 | ADD (dev) | DOM simulation for tests | Vitest's default environment for `@testing-library/react`. jsdom 28 supports `IntersectionObserver` stubs needed for testing `useScrollAnchor`. |
| @vitest/coverage-v8 | ^4.0.18 | ADD (dev) | Code coverage | V8 coverage is faster than Istanbul/nyc. Provides branch, line, and statement coverage reports. |

**Vitest configuration:**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      include: ['src/components/**', 'src/hooks/**', 'src/stores/**'],
      exclude: ['src/test/**', '**/*.test.tsx'],
    },
  },
});
```

### End-to-End Testing (Phase 6+)

| Technology | Version | Status | Purpose | Why |
|------------|---------|--------|---------|-----|
| @playwright/test | ^1.58.2 | ADD (dev, deferred) | E2E testing | Already available on this server (used by GSD workflows). Install in the frontend project when Phase 6 milestone requires visual regression tests. Not needed in Phase 1-5. |

**What to test per phase (from ARCHITECT_SYNC.md):**

| Phase | Test Focus |
|-------|-----------|
| Phase 1 | Design token snapshot tests (CSS custom properties in `:root`). Catch accidental palette regressions. |
| Phase 2 | WebSocket message handling — feed discriminated union messages into store, verify state transitions |
| Phase 3 | Scroll anchor integration — 100 token/sec burst simulation, verify `isAtBottom` state, scroll pill appearance |
| Phase 4 | Markdown rendering — fuzz incomplete/malformed fragments, verify no layout shift or crash |
| Phase 5 | Input ergonomics — auto-resize, Enter vs Shift+Enter, focus trap |
| Phase 6+ | Playwright E2E — visual regression, session switching, streaming end-to-end |

**Confidence:** HIGH — Vitest 4.0.18 and RTL 16.3.2 verified on npm, compatible with React 18.

---

## Icons

| Technology | Version | Status | Purpose | Why |
|------------|---------|--------|---------|-----|
| lucide-react | ^0.515.0 | CARRY OVER | Icon library | 1500+ icons, tree-shakeable (each icon is its own import), consistent stroke-width design language that matches Loom's clean aesthetic. Ships TypeScript types. Avoids the font-icon antipattern that blocks rendering. |

**Confidence:** HIGH — current install verified.

---

## Supporting Libraries (Carry Over from V1)

| Library | Version | Status | Purpose |
|---------|---------|--------|---------|
| react-router-dom | ^6.8.1 | CARRY OVER | Client-side routing for session navigation |
| react-dropzone | ^14.2.3 | CARRY OVER | File attachment UI for Nextcloud integration phase |
| react-diff-viewer-continued | ^4.1.2 | CARRY OVER | Diff display for file operation tool cards |
| @uiw/react-codemirror | ^4.23.13 | CARRY OVER | Code editor for multi-line input and settings code fields |
| @codemirror/lang-javascript | ^6.2.4 | CARRY OVER | CodeMirror language support |
| @codemirror/lang-python | ^6.2.1 | CARRY OVER | CodeMirror language support |
| @codemirror/lang-markdown | ^6.3.3 | CARRY OVER | CodeMirror markdown editing |
| @codemirror/merge | ^6.11.1 | CARRY OVER | CodeMirror merge/diff view |
| @xterm/xterm | ^5.5.0 | CARRY OVER | Terminal emulation for shell output |

---

## What NOT to Install

| Package | Reason to Avoid |
|---------|----------------|
| `framer-motion` (full import) | Use `motion` with `LazyMotion + domAnimation` instead. Full import is ~34KB gzipped vs ~5KB for the subset. The package name is `motion` (Framer renamed it). Never `import { motion } from 'framer-motion'`. |
| `react-query` / `@tanstack/react-query` | All data is WebSocket-driven. REST endpoints are simple fetch calls. A cache-invalidation library adds complexity without benefit for a single-user real-time app. |
| `redux` / `@reduxjs/toolkit` | Zustand with selectors solves the same performance problems in 1/10th the boilerplate. Redux's action/reducer ceremony is unnecessary overhead here. |
| `react-hot-toast` | Sonner is already installed with superior dark mode support, promise toasts, and direct CSS variable integration. |
| `@radix-ui/react-*` primitives | Would force building a full design system from headless primitives. V2 builds its own design system on Tailwind + CSS variables. Use only if a specific accessibility primitive is missing — evaluate case-by-case. |
| `styled-components` / `@emotion/*` | CSS-in-JS adds runtime style injection that conflicts with Tailwind's compile-time approach and the CSS variable token architecture. |
| `immer` | Zustand supports immer middleware but the V2 store actions are simple enough that immer's proxy-based mutation adds cognitive overhead without benefit. |
| `@formik/auto-animate` | 56KB for "magic" list animations. Insufficient control for specific animation timing. The CSS `grid-template-rows` trick achieves the same effect for expand/collapse at 0KB. |
| `react-window` | Older virtualization library. `@tanstack/react-virtual` is the current standard with headless API and better TypeScript. |

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| State | Zustand ^5 | Jotai | Atom model adds indirection; Zustand's explicit 4-store architecture maps more directly to V2 domain boundaries |
| State | Zustand ^5 | Valtio | Proxy-based re-render behavior is harder to reason about with the streaming bypass pattern; Zustand's selector model is more predictable |
| State | Zustand ^5 | React Context | Re-renders all consumers on any change; fatal for streaming performance at 100 tokens/sec |
| Animation | motion (LazyMotion) | Anime.js | No React integration, no `AnimatePresence` analog, manual DOM manipulation conflicts with React's reconciler |
| Animation | motion (LazyMotion) | React Spring | Similar capability but heavier API surface; `motion` is the standard and more actively maintained |
| Animation | CSS-first + motion | Full motion bundle | 34KB vs 5KB gzipped; only buy what you need |
| Virtual scroll | content-visibility first | react-virtuoso immediately | Virtuoso is high-level and opinionated, harder to integrate with custom scroll anchor logic; TanStack Virtual is the right escape hatch if needed |
| Testing | Vitest | Jest | Vitest has native Vite integration (zero config, same transform pipeline, faster HMR-aware watch mode); Jest requires separate Babel config |
| Markdown | react-markdown | @mdxjs/mdx | MDX is for authoring interactive content, not rendering user/AI output dynamically; react-markdown is the correct tool for runtime rendering |
| Syntax highlighting | Shiki | Prism | Prism requires bundling all grammars upfront; Shiki loads lazily and supports CSS variable theming |
| Routing | react-router-dom v6 | @tanstack/router | TanStack Router's type-safe routing is excellent but migration cost is not justified for a 3-route SPA |

---

## Installation Commands

### Phase 1 (App Shell — install immediately)

```bash
# State management
npm install zustand@^5.0.11

# Testing (dev)
npm install -D vitest@^4.0.18 @vitest/coverage-v8@^4.0.18 @testing-library/react@^16.3.2 @testing-library/user-event@^14.6.1 jsdom@^28.1.0 @testing-library/jest-dom@^6
```

### Phase 2 (WebSocket + Streaming)

No new packages. The WebSocket client is a custom wrapper in `src/lib/wsClient.ts`.

### Phase 3 (Scroll + Performance)

No new packages (content-visibility is CSS-only). Evaluate `@tanstack/react-virtual` after scroll testing:

```bash
# Only if content-visibility proves insufficient
npm install @tanstack/react-virtual@^3.13.19
```

### Phase 4+ (Complex Animations)

```bash
# Tier 3 animation (LazyMotion subset only)
npm install motion@^12.35.0
```

### Phase 6+ (E2E Testing)

```bash
npm install -D @playwright/test@^1.58.2
```

---

## Version Compatibility Matrix

| Package | React 18 | Vite 7 | TypeScript 5.9 | Tailwind 3.4 |
|---------|----------|--------|----------------|-------------|
| zustand ^5.0.11 | Yes (peer: >=18) | Yes | Yes | N/A |
| vitest ^4.0.18 | Yes | Yes (native) | Yes | N/A |
| @testing-library/react ^16.3.2 | Yes (peer: ^18\|^19) | Yes | Yes | N/A |
| motion ^12.35.0 | Yes | Yes | Yes | N/A |
| @tanstack/react-virtual ^3.13.19 | Yes (peer: ^16\|^17\|^18\|^19) | Yes | Yes | N/A |
| tailwindcss-animate ^1.0.7 | N/A | N/A | N/A | Yes (peer: >=3.0.0) |
| sonner ^2.0.7 | Yes (peer: ^18) | Yes | Yes | N/A |

---

## Sources

- npm registry (verified 2026-03-04): zustand@5.0.11, vitest@4.0.18, @testing-library/react@16.3.2, @testing-library/user-event@14.6.1, motion@12.35.0, @tanstack/react-virtual@3.13.19, react-error-boundary@6.1.1, jsdom@28.1.0, @playwright/test@1.58.2 — all versions confirmed
- ARCHITECT_SYNC.md (2026-03-04): Co-architect consensus on Zustand 4-store architecture, streaming useRef bypass, content-visibility-first virtualization, tiered animation strategy, Error Boundary hierarchy, React 18 Concurrent features
- V2_CONSTITUTION.md (2026-03-04): CSS/styling rules, state management rules, testing requirements, animation strategy
- motion official docs (motionjs.com): LazyMotion + domAnimation bundle size (~5KB vs ~34KB full)
- MDN: `content-visibility: auto` browser support (Chrome 85+, Firefox 125+, Safari 18+), `contain-intrinsic-size`, CSS `grid-template-rows` animation
- PROJECT.md (2026-03-04): Existing package.json dependencies confirmed in installed state

---

*Stack research for: Loom V2 — Greenfield Frontend Rewrite*
*Researched: 2026-03-04*
*Replaces: Previous STACK.md (v1.1 visual redesign scope — archived)*
