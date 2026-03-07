# Technology Stack: M2 "The Chat" Additions

**Project:** Loom V2 — M2 Milestone
**Researched:** 2026-03-07
**Scope:** NEW libraries and patterns needed for M2 features only. Existing M1 stack (Vite 7, React 19, TypeScript 5.9, Tailwind v4, Zustand 5, Vitest 4) is validated and unchanged.
**Confidence:** HIGH (all versions verified via `npm view` on 2026-03-07)

---

## What M2 Needs That M1 Doesn't Have

M1 shipped raw text streaming via rAF + DOM mutation. M2 needs to turn that raw text into rich rendered content. The gap is:

1. **Markdown parsing + rendering** — raw assistant text becomes formatted HTML
2. **Syntax highlighting** — code blocks get language-aware coloring
3. **Auto-resize composer** — textarea grows with content
4. **Tool card animations** — state machine transitions (invoked -> executing -> resolved)
5. **Activity status line** — "Reading auth.ts..." updates from stream store

Items 3-5 need ZERO new libraries. Item 3 is a 20-line custom hook. Items 4-5 are CSS transitions + Zustand selectors. Only items 1-2 require new dependencies.

---

## New Dependencies (3 packages)

### Markdown Rendering Pipeline

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| react-markdown | ^10.1.0 | Markdown-to-React renderer | Constitution Section 12.1 mandates this. Supports custom component renderers for code blocks, tables, links. Peer dep: `react >=18` — confirmed compatible with React 19. |
| remark-gfm | ^4.0.1 | GFM extensions (tables, strikethrough, task lists) | AI agents produce GFM tables constantly. Without this, pipe-delimited tables render as plain text. |
| rehype-raw | ^7.0.0 | HTML passthrough in markdown | AI output occasionally contains raw HTML fragments. Without this, `<details>` and `<summary>` blocks from Claude break. |

**Installation:**

```bash
cd /home/swd/loom/src
npm install react-markdown@^10.1.0 remark-gfm@^4.0.1 rehype-raw@^7.0.0
```

**Bundle impact:** react-markdown + unified pipeline is ~40KB gzipped. This is the standard cost for any app rendering markdown. There is no lighter alternative that supports custom component renderers AND the remark/rehype plugin pipeline.

**Why NOT streamdown:** Streamdown (v2.4.0) is a drop-in react-markdown replacement purpose-built for AI streaming. It handles incomplete code blocks, lazy Shiki loading from CDN, and streaming-aware rendering out of the box. I considered it seriously. But: (1) it bundles `marked` alongside the unified pipeline — two parsers is redundant weight; (2) it loads Shiki grammars from CDN which won't work in all deployment scenarios; (3) the Constitution already specifies the react-markdown + remark + rehype stack with specific debouncing and incomplete-block-detection requirements. Building the streaming markdown integration ourselves gives us full control over the rAF buffer integration point, which is the hard part. Streamdown solves a different problem (simple drop-in) than what we need (deep integration with existing segment architecture).

---

### Syntax Highlighting

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| shiki | ^4.0.1 | Syntax highlighting engine | Constitution Section 12.2 mandates Shiki. Version 4.0.1 ships a JavaScript RegExp engine that eliminates the WASM download (~2MB Oniguruma binary). All built-in languages work with the JS engine as of Shiki 3.9.1+. Languages load lazily via dynamic import on first encounter. |

**Installation:**

```bash
cd /home/swd/loom/src
npm install shiki@^4.0.1
```

**Critical: Use the JavaScript engine, NOT Oniguruma.**

The default Shiki setup loads an Oniguruma WASM binary (~2MB) for TextMate regex parsing. The JavaScript engine (`@shikijs/engine-javascript`, bundled with `shiki`) uses native `RegExp` with transpilation — no WASM download, faster startup, smaller bundle.

```typescript
import { createHighlighter } from 'shiki/core';
import { createJavaScriptRegExpEngine } from 'shiki/engine/javascript';

const highlighter = await createHighlighter({
  themes: ['github-dark'],
  langs: [],  // Start empty — load on demand
  engine: createJavaScriptRegExpEngine(),
});
```

**Why NOT @shikijs/rehype:** The `@shikijs/rehype` package (v4.0.1) integrates Shiki as a rehype plugin, which means highlighting happens during the markdown parse phase. This is problematic for streaming because: (1) it blocks the parse pipeline while loading grammars; (2) it doesn't support the "render plain text while grammar loads" fallback the Constitution requires. A custom `code` component in react-markdown that calls Shiki asynchronously and renders a deferred highlighted version is the correct approach.

**Why NOT react-shiki:** The `react-shiki` package (v0.9.2) provides a React component and hook wrapper. It's fine for simple use cases, but we need tight control over the async loading lifecycle (show plain text immediately, swap in highlighted version via `useDeferredValue`). The 30 lines of custom integration code are simpler than adapting react-shiki's API to our rAF streaming pipeline.

**Theme strategy:** Use `css-variables` theme from Shiki which outputs CSS custom properties instead of inline styles. This maps directly to our OKLCH token system — we define syntax colors as CSS variables in `tokens.css` and Shiki references them. Zero inline style injection.

```typescript
// Shiki css-variables theme outputs: style="color: var(--shiki-token-keyword)"
// We define: --shiki-token-keyword in tokens.css using our OKLCH palette
const html = highlighter.codeToHtml(code, {
  lang,
  theme: 'css-variables',
});
```

---

## Libraries Explicitly NOT Needed

| Package | Why Not |
|---------|---------|
| `react-textarea-autosize` (v8.5.9) | Pulls in `@babel/runtime` as a dependency — unnecessary 30KB+ for a textarea that grows. Auto-resize is a 20-line custom hook using `scrollHeight`. See implementation pattern below. |
| `motion` / `framer-motion` | Tool card state transitions (invoked -> executing -> resolved) are CSS transitions on `data-status` attribute changes. The pulsing dot during execution is a CSS `@keyframes` animation. No JS animation engine needed for M2. Defer motion to M3 if spring physics are truly required for visual polish. |
| `@shikijs/rehype` | Blocks parse pipeline during grammar loading. Custom code component is simpler and supports async fallback. |
| `streamdown` | Brings its own parser (`marked`), loads from CDN, and doesn't integrate with our rAF buffer. |
| `@tailwindcss/typography` | We're on Tailwind v4 which doesn't use this plugin. Style markdown output directly with Tailwind utilities on react-markdown's component overrides. Prose styling via explicit classes on the markdown container. |
| `react-syntax-highlighter` | Wrapper around Prism/Highlight.js. Shiki is superior (lazy loading, CSS variable theming, TextMate quality). |

---

## Integration With Existing M1 Architecture

### Markdown + rAF Buffer Integration

The critical integration point: M1's `useStreamBuffer` paints raw text to a DOM node via `textContent`. M2 needs to render that text as markdown. These are fundamentally at odds — you can't set `innerHTML` via the rAF loop without triggering React reconciliation.

**Solution: Two-phase rendering.**

1. **During streaming:** Raw text continues painting to the DOM via `textContent` (exactly as M1 does). This is fast, zero-parse, 60fps. The user sees plain text appearing in real-time.

2. **On flush/checkpoint:** When the stream pauses (newline detected, 50ms idle, or stream complete), the accumulated text is passed to react-markdown for parsed rendering. `useDeferredValue` ensures the parse doesn't block the next rAF frame.

```typescript
// Simplified integration pattern
const [parsedContent, setParsedContent] = useState('');
const deferredContent = useDeferredValue(parsedContent);

// During streaming: rAF paints raw text to textNodeRef (M1 pattern, unchanged)
// On idle/newline: debounced callback triggers markdown parse
const debouncedParse = useMemo(
  () => debounce((text: string) => setParsedContent(text), 50),
  []
);

// In render: show raw text span during streaming, markdown after parse
{isStreaming ? (
  <span ref={textNodeRef} />
) : (
  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
    {deferredContent}
  </ReactMarkdown>
)}
```

**Important refinement:** During streaming, we can actually do incremental markdown parsing on completed blocks. When a double-newline is detected (paragraph boundary), everything before it can be parsed and rendered as markdown while the current paragraph continues as raw text. This prevents the "wall of plain text suddenly becomes formatted" flash on completion.

### Shiki + Code Block Integration

Custom `code` component for react-markdown:

```typescript
// react-markdown component override
const components = {
  code({ className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || '');
    const lang = match?.[1];

    if (!lang) {
      // Inline code — no highlighting needed
      return <code className={className} {...props}>{children}</code>;
    }

    // Block code — async Shiki highlighting with deferred fallback
    return (
      <CodeBlock lang={lang} code={String(children).replace(/\n$/, '')} />
    );
  },
};
```

The `CodeBlock` component manages the Shiki highlighter singleton, loads grammars on demand, and renders plain monospaced text as fallback while the grammar loads.

### Tool Card Animation (CSS-only)

Tool cards already have a `status` field in the stream store (`ToolCallStatus`). M2 adds CSS transitions driven by `data-status`:

```css
.tool-chip[data-status="invoked"] {
  /* Subtle appear animation */
}
.tool-chip[data-status="executing"] .tool-chip-dot {
  animation: pulse 1.5s ease-in-out infinite;
  background: oklch(var(--rose-accent));
}
.tool-chip[data-status="resolved"] .tool-chip-dot {
  background: oklch(var(--status-connected));
  transition: background var(--transition-normal);
}
.tool-chip[data-status="error"] .tool-chip-dot {
  background: oklch(var(--status-error));
  transition: background var(--transition-normal);
}
```

No JS animation library needed. The state machine is already in Zustand; CSS drives the visual transitions.

### Auto-Resize Composer (No Library)

```typescript
// useAutoResize.ts — 20 lines, no dependency
export function useAutoResize(
  ref: React.RefObject<HTMLTextAreaElement | null>,
  value: string,
  minRows = 1,
  maxRows = 12,
): void {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    const lineHeight = parseInt(getComputedStyle(el).lineHeight, 10) || 20;
    const minHeight = lineHeight * minRows;
    const maxHeight = lineHeight * maxRows;
    el.style.height = `${Math.min(Math.max(el.scrollHeight, minHeight), maxHeight)}px`;
  }, [ref, value, minRows, maxRows]);
}
```

This avoids the `@babel/runtime` dependency that `react-textarea-autosize` ships. The `useLayoutEffect` ensures height is recalculated before the browser paints, preventing visual jitter.

### Activity Status Line

Pure Zustand selector. The stream store already has `activityText: string`. The status line component subscribes to it:

```typescript
export const ActivityStatusLine = memo(function ActivityStatusLine() {
  const activityText = useStreamStore((state) => state.activityText);
  const isStreaming = useStreamStore((state) => state.isStreaming);

  if (!isStreaming || !activityText) return null;

  return (
    <div className="text-muted-foreground text-xs truncate">
      {activityText}
    </div>
  );
});
```

Zero new dependencies. The backend already sends activity text via WebSocket; the multiplexer already routes it to the stream store. M2 just renders it.

---

## Version Compatibility Matrix (M2 additions)

| Package | React 19 | Vite 7 | TypeScript 5.9 | Tailwind v4 |
|---------|----------|--------|----------------|-------------|
| react-markdown ^10.1.0 | Yes (peer: >=18) | Yes | Yes | N/A |
| remark-gfm ^4.0.1 | N/A (unified plugin) | Yes | Yes | N/A |
| rehype-raw ^7.0.0 | N/A (unified plugin) | Yes | Yes | N/A |
| shiki ^4.0.1 | N/A (framework-agnostic) | Yes (ESM) | Yes | N/A |

---

## Complete M2 Installation

```bash
cd /home/swd/loom/src

# Markdown rendering pipeline
npm install react-markdown@^10.1.0 remark-gfm@^4.0.1 rehype-raw@^7.0.0

# Syntax highlighting
npm install shiki@^4.0.1
```

**Total new dependencies:** 4 packages (+ their unified ecosystem transitive deps)
**Estimated bundle addition:** ~50-60KB gzipped (react-markdown pipeline ~40KB + Shiki core ~15KB, language grammars load on demand)

---

## What Changes From M1 STACK.md

| M1 Stated | M2 Reality | Action |
|-----------|-----------|--------|
| React ^18.2.0 | Actually React ^19.2.0 (installed) | Already correct in package.json; M1 STACK.md was written before install |
| Tailwind ^3.4 with hsl() | Actually Tailwind v4 with @theme + OKLCH | Already using v4; M1 STACK.md predated the migration |
| motion ^12.35.0 deferred to "Phase 4+" | Defer further to M3 | Not needed for M2 tool card animations — CSS transitions suffice |
| Shiki "CARRY OVER" | Not actually installed | Install now for M2 |
| react-markdown "CARRY OVER" | Not actually installed | Install now for M2 |
| @tailwindcss/typography "CARRY OVER" | Not installed, not needed on Tailwind v4 | Skip — style markdown content with direct Tailwind utilities |

---

## Sources

- npm registry (verified 2026-03-07): `react-markdown@10.1.0` (peer: react >=18), `remark-gfm@4.0.1`, `rehype-raw@7.0.0`, `shiki@4.0.1`, `react-textarea-autosize@8.5.9` (rejected — @babel/runtime dep), `motion@12.35.1`, `streamdown@2.4.0` (rejected)
- [Shiki docs — RegExp Engines](https://shiki.style/guide/regex-engines): JavaScript engine recommended for browser use, eliminates WASM download, all built-in languages supported
- [Shiki docs — Installation](https://shiki.style/guide/install): Fine-grained bundle approach, `createHighlighter` with lazy language loading, `css-variables` theme
- [react-markdown npm](https://www.npmjs.com/package/react-markdown): v10.1.0, peer deps confirmed
- [Streamdown npm](https://www.npmjs.com/react-shiki): v2.4.0, evaluated and rejected (dual parser, CDN dependency)
- Loom V2 Constitution Section 12: Mandates react-markdown + remark + rehype pipeline, debounced parsing, unclosed code block detection
- Loom V2 existing codebase: `useStreamBuffer.ts`, `ActiveMessage.tsx`, `tool-registry.ts` — confirmed integration points

---

*Stack research for: Loom V2 M2 "The Chat" — New library additions*
*Researched: 2026-03-07*
*Supplements: Original STACK.md (2026-03-04, M1 scope)*
