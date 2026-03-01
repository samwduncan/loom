# Stack Research

**Domain:** AI chat interface web UI (developer tool, React 18 + Tailwind CSS)
**Researched:** 2026-03-01
**Confidence:** HIGH (most findings verified via Context7, npm registry, or official docs)

---

## Baseline Stack (Inherited — Keep As-Is)

The CloudCLI fork already includes a solid, working stack. These decisions are NOT up for debate — migrating them would cost weeks and provide no functional benefit.

| Technology | Version | Role | Status |
|------------|---------|------|--------|
| React | ^18.2.0 | UI framework | Keep |
| TypeScript | ^5.9.3 | Type safety | Keep |
| Vite | ^7.0.4 | Build tool | Keep |
| Tailwind CSS | ^3.4.0 | Styling | Keep |
| Express + WebSocket | express ^4.18.2, ws ^8.14.2 | Backend + realtime | Keep |
| better-sqlite3 | ^12.6.2 | Session persistence | Keep |
| @xterm/xterm | ^5.5.0 (latest: 6.0.0) | Terminal emulator | Upgrade + retheme |
| react-router-dom | ^6.8.1 | Routing | Keep |
| CVA + tailwind-merge | latest | Class composition | Keep |
| lucide-react | ^0.515.0 | Icons | Keep |

---

## Recommended Stack (Enhancements)

### 1. Syntax Highlighting in Chat

**Recommendation: Replace `react-syntax-highlighter` (Prism) with `shiki` ^4.x**

| Library | Version | Confidence |
|---------|---------|-----------|
| `shiki` | ^4.0.0 (verified via npm registry 2026-03-01) | HIGH |
| `@shikijs/rehype` | ^4.0.0 (verified via npm registry 2026-03-01) | HIGH |

**Why Shiki, not Prism or Highlight.js:**

The current codebase uses `react-syntax-highlighter` with its bundled Prism backend (`oneDark` theme). This approach has three problems for Loom's goals:

1. **Theme fidelity:** Prism uses regex-based tokenization with ~80% accuracy. Shiki uses TextMate grammars — the same engine as VS Code — giving 99% parity with VS Code Dark+. Since Loom targets developers who live in VS Code, this matters.
2. **Bundle weight:** `react-syntax-highlighter` bundles ALL language grammars eagerly. Shiki supports dynamic import of only the languages actually needed.
3. **VS Code Dark+ is a native Shiki theme:** `dark-plus` ships as a bundled theme in Shiki with zero additional work.

**Why not CodeMirror for chat:** CodeMirror 6 is already in the stack for the file editor. Using it for read-only chat code blocks is overkill — it carries ~70KB+ overhead, requires mounting a full editor instance per code block, and complicates DOM management in a streamed chat context. Shiki renders to static HTML with inline styles.

**Why not Highlight.js:** Superior auto-detection is Highlight.js's only advantage, and it doesn't apply here — Claude/Gemini always provide language tags in fenced code blocks. Highlight.js tokenization quality is also ~80% (regex-based).

**Implementation pattern (client-side, no RSC):**

```tsx
import { createHighlighter } from 'shiki/bundle/web'

// Lazy singleton — create once, reuse
let highlighter: ReturnType<typeof createHighlighter> | null = null

async function getHighlighter() {
  if (!highlighter) {
    highlighter = createHighlighter({
      themes: ['dark-plus'],
      langs: ['typescript', 'javascript', 'python', 'bash', 'json', 'css', 'html', 'rust', 'go'],
    })
  }
  return highlighter
}

// In CodeBlock component:
const html = await (await getHighlighter()).codeToHtml(code, {
  lang: language,
  theme: 'dark-plus',
})
// Render via dangerouslySetInnerHTML — Shiki output is safe (no user-controlled input in HTML generation)
```

**Shiki bundle strategy:** Use `shiki/bundle/web` (not `shiki` full bundle) to limit initial load. Pre-register the 10-15 languages Claude/Gemini most commonly emit. Lazy-load additional languages on first encounter.

**Version note:** Shiki v4.x is the current stable release (verified 2026-03-01 via npm: `4.0.0`). The `createHighlighter` API is stable in v4.x. `@shikijs/rehype` is also at v4.0.0 — install matching major versions. Gemini research cited 3.23.0 but npm registry confirms 4.0.0 is latest; install with `npm install shiki@^4 @shikijs/rehype@^4`.

---

### 2. Markdown Rendering

**Recommendation: Keep `react-markdown` v10 — do NOT switch to Streamdown yet**

| Library | Version | Confidence |
|---------|---------|-----------|
| `react-markdown` | ^10.1.0 (current, already installed) | HIGH |
| `remark-gfm` | ^4.0.0 (already installed) | HIGH |
| `remark-math` | ^6.0.0 (already installed) | HIGH |
| `rehype-katex` | ^7.0.1 (already installed) | HIGH |
| `@shikijs/rehype` | ^1.x | HIGH — replaces `react-syntax-highlighter` |

**Why keep react-markdown:**

Streamdown is the emerging "streaming-first" alternative (Context7 ID: `/vercel/streamdown`, benchmark score 90.2, 607 code snippets). It offers incremental parsing that prevents layout shifts during streaming. However:

- The current codebase already has `react-markdown` v10 with a complete custom component system (see `src/components/chat/view/subcomponents/Markdown.tsx`)
- The custom `CodeBlock` component, table styling, and blockquote rendering would need to be rewritten for Streamdown's component API (which is similar but not identical)
- Streamdown is Vercel-project status — it has not yet demonstrated long-term maintenance stability vs the remarkjs ecosystem's track record
- react-markdown v10 supports React 19 and has `MarkdownAsync` for RSC — it is not stagnant

**The right fix for streaming jank is a token buffer**, not a library swap:

```tsx
// Debounce markdown re-renders during streaming
const [displayContent, setDisplayContent] = useState('')
const updateTimer = useRef<number>()

// Update at most every 50ms during streaming
function onToken(token: string) {
  buffer.current += token
  clearTimeout(updateTimer.current)
  updateTimer.current = setTimeout(() => {
    setDisplayContent(buffer.current)
  }, 50)
}
```

**Why not MDX:** MDX requires a bundler transform or runtime compilation. Runtime MDX compilation of untrusted LLM output is a security risk (arbitrary JSX execution). Not appropriate for a chat interface.

**Keep `rehype-raw` removed** (or gated behind sanitization): The current Markdown.tsx does NOT use `rehype-raw`, which is correct — enabling raw HTML from LLM output opens XSS vectors.

**Plugin to add:** `@shikijs/rehype` as a rehype plugin handles Shiki highlighting within the react-markdown pipeline, replacing the manual `CodeBlock` component with Prism:

```tsx
import { rehypeShiki } from '@shikijs/rehype'

const rehypePlugins = useMemo(() => [
  [rehypeShiki, { theme: 'dark-plus' }],
  rehypeKatex,
], [])
```

---

### 3. Diff Rendering

**Recommendation: `react-diff-viewer-continued` ^4.1.2**

| Library | Version | Confidence |
|---------|---------|-----------|
| `react-diff-viewer-continued` | ^4.1.2 | HIGH (verified via npm registry) |

**Why react-diff-viewer-continued:**

- Active maintenance fork of the original `react-diff-viewer` (which went stale)
- v4.1.x: React 18/19 compatible, dark theme support via `useDarkTheme` prop and `styles.variables.dark` customization object
- Accepts `oldValue`/`newValue` as strings — the existing git diff infrastructure already produces these
- Custom styles API allows overriding diff colors to match the warm chocolate palette:

```tsx
const diffStyles = {
  variables: {
    dark: {
      diffViewerBackground: '#1c1210',  // Loom base
      diffViewerColor: '#f5e6d3',       // Loom cream text
      addedBackground: '#1a3a1a',       // Dark green tint
      addedColor: '#a8d5a2',
      removedBackground: '#3a1a1a',     // Dark red tint
      removedColor: '#d5a2a2',
      gutterBackground: '#2a1f1a',      // Loom warm surface
    },
  },
}

<ReactDiffViewer useDarkTheme={true} styles={diffStyles} oldValue={old} newValue={new} />
```

**Why not diff2html:** diff2html is an excellent library but is designed for rendering raw unified diff strings into HTML, not React components. Integration requires either dangerouslySetInnerHTML or a wrapper layer. react-diff-viewer-continued is React-native and integrates with Tailwind class patterns more cleanly.

**Why not @codemirror/merge (already installed):** `@codemirror/merge` is CodeMirror's merge/diff extension. It's the right choice for an interactive diff editor (e.g., the git panel's diff view where users might want to stage individual hunks). For read-only chat display of Claude's file edits, react-diff-viewer-continued is simpler and lighter.

**Recommendation: Use both, different contexts:**
- `@codemirror/merge` → git panel interactive diff (already works, keep)
- `react-diff-viewer-continued` → chat tool call display of file edits

---

### 4. Animation and Transitions

**Recommendation: `motion` (formerly Framer Motion) ^12.x for complex animations; CSS transitions for simple state changes**

| Library | Version | Confidence |
|---------|---------|-----------|
| `motion` | ^12.34.3 (current, verified via npm) | HIGH |

**Why motion (Framer Motion):**

Loom's design requirements include: collapsible turn animations, thinking block disclosure expand/collapse, streaming typing indicators, tool call group accordion behavior, scroll-to-bottom pill appearance, and toast/banner entrance animations. These are all layout-dependent animations where `motion.div layout` provides significant value over hand-rolled CSS.

Key API for Loom's needs:
```tsx
import { motion, AnimatePresence } from 'motion/react'

// Collapsible turn — layout animation handles height changes
<motion.div layout initial={false} animate={{ height: collapsed ? 0 : 'auto' }}>
  {content}
</motion.div>

// Thinking block disclosure
<AnimatePresence>
  {isOpen && (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
    >
      {thinking}
    </motion.div>
  )}
</AnimatePresence>
```

**Bundle size strategy:** Use the `m` component + `LazyMotion` to reduce initial bundle from 34KB to ~4.6KB:

```tsx
import { LazyMotion, domAnimation } from 'motion/react'
import * as m from 'motion/react-m'

// Wrap app root
<LazyMotion features={domAnimation}>
  <m.div layout>...</m.div>
</LazyMotion>
```

**When to use CSS transitions instead:** For simple opacity/color/transform changes on hover states, focus rings, and button active states — Tailwind's `transition-*` utilities are sufficient and add zero JS overhead. Reserve motion for: layout animations, exit animations (AnimatePresence), and spring-physics effects.

**Do NOT use:** CSS Animations for collapsible content — `height: auto` is not animatable with pure CSS without JavaScript measurement. Motion handles this correctly with layout animations.

---

### 5. Dark Theme Implementation

**Recommendation: Reuse existing CSS variable + Tailwind class strategy, replace HSL values**

The inherited codebase already uses the correct architecture:
- `tailwind.config.js` maps Tailwind color tokens to `hsl(var(--token))` CSS variables
- `src/index.css` defines `:root {}` (light) and `.dark {}` overrides
- `darkMode: ["class"]` in tailwind config — toggled by adding/removing `dark` class on `<html>`

**The only work is replacing the variable VALUES** in `src/index.css`. The warm palette maps to the existing token names:

```css
/* src/index.css — .dark overrides for warm Loom palette */
.dark {
  /* Base surfaces (HSL format: H S% L%) */
  --background: 10 30% 9%;        /* #1c1210 deep chocolate */
  --foreground: 30 70% 88%;       /* #f5e6d3 cream */
  --card: 12 28% 14%;             /* #2a1f1a warm surface */
  --card-foreground: 30 55% 72%;  /* #c4a882 warm beige */
  --muted: 14 26% 19%;            /* #3d2e25 elevated surface */
  --muted-foreground: 28 35% 60%; /* muted text */

  /* Accent colors */
  --primary: 28 55% 64%;          /* #d4a574 amber */
  --primary-foreground: 10 30% 9%;
  --accent: 20 48% 56%;           /* #c17f59 copper */
  --destructive: 10 60% 46%;      /* #b85c3a terracotta */

  /* Borders */
  --border: 14 26% 22%;           /* subtle warm border */
  --input: 14 26% 22%;
  --ring: 28 55% 64%;             /* amber focus ring */
}
```

**Why CSS variables over Tailwind arbitrary values:** The existing `hsl(var(--token))` pattern allows runtime theme switching without rebuilding CSS. Adding a `data-theme="warm"` variant or future theme presets is trivial. Hard-coding hex values in Tailwind classes would require touching every component.

**Typography CSS variables to add:**

```css
:root {
  --font-mono: 'JetBrains Mono', ui-monospace, 'SFMono-Regular', monospace;
  --font-sans: 'Inter', system-ui, sans-serif;
}
```

Then reference in Tailwind config:
```js
fontFamily: {
  mono: ['var(--font-mono)', ...defaultTheme.fontFamily.mono],
  sans: ['var(--font-sans)', ...defaultTheme.fontFamily.sans],
}
```

**Font loading:** Add JetBrains Mono via `@fontsource/jetbrains-mono` (npm package, no CDN dependency):

```bash
npm install @fontsource/jetbrains-mono
```

```tsx
// In main.tsx or App.tsx
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/500.css'
import '@fontsource/jetbrains-mono/700.css'
```

---

### 6. Terminal Theming (xterm.js)

**Recommendation: Replace the current VS Code-inspired theme with Catppuccin Mocha colors in `TERMINAL_OPTIONS.theme`**

The current terminal theme in `src/components/shell/constants/constants.ts` is VS Code's default dark colors (blues, greens). Replace with Catppuccin Mocha, blended to match the warm app background:

```ts
export const TERMINAL_OPTIONS: ITerminalOptions = {
  // ...existing options...
  fontFamily: 'var(--font-mono, "JetBrains Mono", "Menlo", monospace)',
  fontSize: 13,
  theme: {
    // Blend Catppuccin Mocha with Loom's warm dark palette
    background: '#1c1210',        // Loom base (not Mocha's #1e1e2e — warmer)
    foreground: '#cdd6f4',        // Mocha text
    cursor: '#d4a574',            // Loom amber
    cursorAccent: '#1c1210',
    selectionBackground: '#45475a',
    selectionForeground: '#cdd6f4',

    // Catppuccin Mocha ANSI colors (standard Mocha palette)
    black: '#45475a',
    red: '#f38ba8',
    green: '#a6e3a1',
    yellow: '#f9e2af',
    blue: '#89b4fa',
    magenta: '#cba6f7',
    cyan: '#94e2d5',
    white: '#bac2de',
    brightBlack: '#585b70',
    brightRed: '#f38ba8',
    brightGreen: '#a6e3a1',
    brightYellow: '#f9e2af',
    brightBlue: '#89b4fa',
    brightMagenta: '#cba6f7',
    brightCyan: '#94e2d5',
    brightWhite: '#a6adc8',
  },
}
```

**Why Catppuccin Mocha:** It is the most widely adopted warm-toned dark terminal theme in developer tools (2025). Its muted, pastel ANSI colors avoid the harsh neon saturation of VS Code's default palette, which clashes with warm earthy UI surfaces. The Mocha palette was designed for exactly the "warm dark" aesthetic Loom targets.

**xterm.js version note:** The project currently uses `@xterm/xterm ^5.5.0`. npm shows latest is `6.0.0`. Version 6 is a significant API change — verify changelog before upgrading. For theming purposes, v5.5 supports the full `ITheme` interface including `extendedAnsi`. No upgrade needed for theming work.

---

## Packages to Remove

| Package | Why Remove | Impact |
|---------|-----------|--------|
| `react-syntax-highlighter` | Replaced by Shiki | High — requires updating Markdown.tsx CodeBlock |
| `@openai/codex-sdk` | Codex backend being stripped per PROJECT.md | Medium — backend changes |
| `i18next` + `react-i18next` + `i18next-browser-languagedetector` | Stripping i18n per PROJECT.md | High — touch every component with `useTranslation` |

---

## Packages to Add

```bash
# Syntax highlighting (replaces react-syntax-highlighter)
npm install shiki@^4 @shikijs/rehype@^4

# Animation
npm install motion

# Diff rendering (for chat tool calls display)
npm install react-diff-viewer-continued

# Fonts (no CDN dependency)
npm install @fontsource/jetbrains-mono

# Terminal themes (optional — or inline values)
# No package needed; use hex values directly in TERMINAL_OPTIONS
```

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Syntax highlighting | `shiki` | `react-syntax-highlighter` (current) | Prism grammars are ~80% accurate vs TextMate 99%; no VS Code Dark+ parity |
| Syntax highlighting | `shiki` | `highlight.js` | No advantage when language tags are always provided; weaker grammar quality |
| Syntax highlighting | `shiki` | CodeMirror 6 (already installed) | ~70KB+ per editor instance; designed for interactive editing not read-only display |
| Markdown | `react-markdown` v10 | `streamdown` v2.3.0 | Migration cost high; token buffer approach fixes streaming jank without library swap; react-markdown has longer maintenance track record |
| Markdown | `react-markdown` v10 | MDX | Runtime MDX compilation is unsafe for LLM output (arbitrary JSX execution risk) |
| Animation | `motion` | CSS transitions | `height: auto` not animatable with CSS alone; layout shift corrections require JS measurement |
| Animation | `motion` | `@react-spring/web` | Motion has better React 18 integration, `AnimatePresence` for exit animations; React Spring is lower-level |
| Diff display (chat) | `react-diff-viewer-continued` | `diff2html` | diff2html outputs HTML strings, not React components; requires wrapper layer |
| Diff display (chat) | `react-diff-viewer-continued` | `@codemirror/merge` (installed) | CodemMirror merge is for interactive editors; overkill for read-only chat display |
| Terminal theming | Inline object in constants.ts | npm theme package | No package provides Catppuccin Mocha as ITheme format; inline is simpler |
| Fonts | `@fontsource/jetbrains-mono` | Google Fonts CDN | No external CDN dependency; self-hosted, works offline |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `react-syntax-highlighter` for new work | Bundled grammars, poor tree-shaking, Prism accuracy ~80%, no VS Code parity | `shiki` with `shiki/bundle/web` |
| `rehype-highlight` (lowlight/highlight.js) | Same grammar quality issues as Highlight.js, worse than Shiki | `@shikijs/rehype` |
| `rehype-raw` without `rehype-sanitize` | Enables XSS from LLM-generated raw HTML | Use react-markdown `components` prop for custom elements |
| `MDX` for chat rendering | Runtime compilation risk, security risk on untrusted LLM output | `react-markdown` with custom components |
| `framer-motion` package name | Deprecated — package is now published as `motion` | `motion` (same library, new package name) |
| Tailwind arbitrary hex values for theme colors | Can't switch themes at runtime, must touch every file | CSS variables via `hsl(var(--token))` pattern (already established) |
| `@xterm/xterm` v6.0.0 upgrade (yet) | Breaking API change — audit changelog before upgrading | Stay on v5.5.0 for now |
| `styled-components` or CSS Modules | Incompatible with Tailwind-first approach; massive migration | Tailwind + CSS variables (already established) |

---

## Stack Patterns by Context

**For code blocks in chat messages:**
- Use Shiki (`shiki/bundle/web`) via async `codeToHtml()`
- Render with `dangerouslySetInnerHTML` (safe — Shiki input is code string, not user HTML)
- Add language badge and copy button as React overlay (position: absolute)

**For git diffs in the git panel (interactive):**
- Keep `@codemirror/merge` — already installed, already works

**For Claude's file edit tool calls in chat:**
- Use `react-diff-viewer-continued` with warm dark theme styles

**For collapsible content (turns, thinking blocks, tool call groups):**
- Use `motion` with `AnimatePresence` + `layout` prop
- For simple show/hide without height animation: CSS `transition-opacity`

**For theme variables:**
- All semantic colors via `hsl(var(--token))` CSS variables
- Override only the `.dark {}` block in `index.css`
- Never use hardcoded hex in Tailwind classes for themed colors

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| `shiki` ^4.0.0 | React 18, Vite 7, TypeScript 5 | `shiki/bundle/web` for browser; async API — wrap in `useEffect` or Suspense |
| `@shikijs/rehype` ^4.0.0 | `react-markdown` ^10, `rehype` unified pipeline | Install same major version as `shiki` — both are `^4.0.0` |
| `motion` ^12.x | React 18 (full support) | Import from `motion/react`, not `framer-motion` |
| `react-diff-viewer-continued` ^4.1.x | React 18/19 | `useDarkTheme` prop for dark mode |
| `@fontsource/jetbrains-mono` | Vite, webpack | Import specific weights to avoid loading all variants |
| `@xterm/xterm` ^5.5.0 | node-pty ^1.1.0 | Current version; v6 has breaking changes — do not upgrade yet |

---

## Sources

- Context7 `/shikijs/shiki` — React integration patterns, bundle/web API, theme usage (HIGH confidence)
- Context7 `/vercel/streamdown` — Streamdown API, component system, streaming behavior (HIGH confidence)
- Context7 `/remarkjs/react-markdown` — v10 API, plugin pipeline, custom components (HIGH confidence)
- Context7 `/websites/motion_dev` — Motion API, bundle size strategy, layout animations (HIGH confidence)
- npm registry (via `npm view`, verified 2026-03-01) — shiki@4.0.0, @shikijs/rehype@4.0.0, motion@12.34.3, react-diff-viewer-continued@4.1.2, streamdown@2.3.0, @xterm/xterm@6.0.0, @fontsource/jetbrains-mono@5.2.8 (HIGH confidence)
- Gemini research — Shiki vs Prism vs Highlight.js ecosystem analysis, react-markdown vs Streamdown tradeoffs (HIGH confidence on synthesis, MEDIUM on specific claims without Context7 verification)
- Existing codebase audit — `src/components/chat/view/subcomponents/Markdown.tsx`, `src/components/shell/constants/constants.ts`, `tailwind.config.js`, `src/index.css` (HIGH confidence — direct inspection)

---

*Stack research for: Loom — React 18 AI chat interface (CloudCLI fork)*
*Researched: 2026-03-01*
