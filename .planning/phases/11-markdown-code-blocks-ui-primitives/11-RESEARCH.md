# Phase 11: Markdown + Code Blocks + UI Primitives - Research

**Researched:** 2026-03-07
**Domain:** Markdown rendering, syntax highlighting, UI component library
**Confidence:** HIGH

## Summary

Phase 11 is the first phase of M2 "The Chat" and has three distinct workstreams: (1) react-markdown rendering for finalized assistant messages, (2) Shiki syntax highlighting with async grammar loading, and (3) shadcn/ui component installation with OKLCH token restyling. All three are well-understood problems with mature libraries.

The current `AssistantMessage.tsx` renders `message.content` as plain text via `whitespace-pre-wrap`. Phase 11 replaces this with a `MarkdownRenderer` component that pipes content through react-markdown with GFM support, custom component overrides for code blocks (Shiki-highlighted), links, tables, and inline code. The Shiki highlighter is a singleton module using the JavaScript RegExp engine (no WASM, ~30KB smaller) with `createCssVariablesTheme` mapping `--shiki-token-*` variables to existing OKLCH tokens in `tokens.css`. shadcn/ui components are installed via CLI into `src/src/components/ui/` and restyled to use the existing OKLCH token system -- the project already has Tailwind v4 with `@theme inline`, `clsx`, `tailwind-merge`, and the `@` path alias, so shadcn integration is straightforward.

**Primary recommendation:** Split into 3 plans: (1) Shiki singleton + OKLCH theme mapping, (2) react-markdown MarkdownRenderer with all custom components, (3) shadcn/ui init + component installation + restyling. Order matters -- Shiki must exist before MarkdownRenderer's code component can use it.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DEP-01 | Install react-markdown ^10.1.0, remark-gfm ^4.0.1, rehype-raw ^7.0.0 | Standard npm install, versions confirmed current on npm registry |
| DEP-02 | Install shiki ^4.0.1 | npm registry confirms v4.0.1 available (latest is v3.23.0 -- see note below) |
| DEP-03 | Create Shiki singleton with JS RegExp engine, css-variables theme | `createHighlighterCore` + `createJavaScriptRegexEngine()` + `createCssVariablesTheme()` APIs documented |
| DEP-04 | Pre-load 7 common grammars at startup | `highlighter.loadLanguage()` API for lazy loading after init |
| DEP-05 | Create OKLCH theme mapping for Shiki tokens | 11 CSS variables (`--shiki-token-*`) need mapping to OKLCH design tokens |
| MD-01 | Full markdown rendering: bold, italic, lists, links, headings, blockquotes, HR, task lists | react-markdown + remark-gfm handles all of these out of the box |
| MD-02 | Configure remarkGfm + rehypeRaw plugins | Standard plugin configuration on `<Markdown>` component |
| MD-03 | Custom component overrides for code, a, table, pre | react-markdown `components` prop; inline vs fenced detection via parent node check |
| MD-04 | Inline code styling: bg-surface-1, rounded-sm, px-1.5 py-0.5, monospace | Existing `--code-inline-bg` token in tokens.css maps to `bg-code-inline` |
| MD-05 | Blockquote styling: left border accent, muted text | CSS styling on `blockquote` component override |
| MD-06 | Link styling: underline on hover, text-primary color | CSS styling on `a` component override |
| CODE-01 | Shiki highlighting with css-variables theme | `createCssVariablesTheme` API, `codeToHtml()` method |
| CODE-02 | Language label + copy button | Custom CodeBlock component wrapping Shiki output |
| CODE-03 | Line numbers for blocks > 3 lines | CSS counter or Shiki transformer |
| CODE-04 | Max-height 400px with inner scroll | CSS `max-height: 400px; overflow-y: auto` |
| CODE-05 | Reserve min-height to prevent CLS during grammar loading | Estimate from line count, set via inline style |
| CODE-06 | Async grammar loading with plain text fallback, useDeferredValue | `highlighter.loadLanguage()` is async; show monospace fallback, swap via `useDeferredValue` |
| CODE-07 | Cache highlighted results per language+code | Simple Map cache keyed by `${lang}:${code}` |
| CODE-08 | Horizontal scroll for long lines | CSS `overflow-x: auto; white-space: pre` |
| CODE-09 | ESLint exceptions for Shiki theme config | Constitution Section 3.1 exception pattern with SAFETY comments |
| UI-01 | Initialize shadcn/ui in src/ workspace | `npx shadcn@latest init` with components.json pointing to existing paths |
| UI-02 | Install 9 shadcn primitives | `npx shadcn@latest add dialog tooltip scroll-area collapsible sonner dropdown-menu badge separator` + custom kbd |
| UI-03 | Restyle all shadcn components to OKLCH tokens | Replace default HSL/OKLCH variables with project's OKLCH token references |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-markdown | 10.1.0 | Markdown-to-React rendering | De facto standard for React markdown; v10 is current, works with React 19 |
| remark-gfm | 4.0.1 | GFM extension (tables, task lists, strikethrough) | Official remark plugin for GitHub Flavored Markdown |
| rehype-raw | 7.0.0 | Raw HTML passthrough in markdown | Needed for `<details>`/`<summary>` support |
| shiki | 3.23.0 | Syntax highlighting | Best-in-class highlighting, supports CSS variables theme, lazy grammar loading |
| shadcn/ui | latest CLI | UI primitive components | Unstyled Radix-based primitives, copy-into-project model, Tailwind v4 native |

**NOTE on Shiki version:** Requirements specify `^4.0.1` but npm registry shows latest is `3.23.0`. The requirement version may be aspirational or a typo. Use `^3.23.0` (latest actual release). All APIs referenced (createCssVariablesTheme, createJavaScriptRegexEngine, createHighlighterCore) exist in v3.x.

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| class-variance-authority | latest | Component variant styling | Required by shadcn/ui components |
| lucide-react | latest | Icon library | Required by shadcn/ui; provides Copy, Check, etc. icons |
| tw-animate-css | latest | CSS animation classes | Required by shadcn/ui for transitions (replaces tailwindcss-animate for Tw v4) |
| @radix-ui/* | (auto) | Headless primitives | Installed automatically by shadcn CLI per component |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Shiki | Prism / highlight.js | Shiki has TextMate grammar accuracy, CSS variables theme. Prism is lighter but less accurate. |
| react-markdown | mdx / marked | react-markdown integrates natively with React component overrides. mdx is overkill for display-only. |
| shadcn/ui | Radix primitives directly | shadcn gives pre-built compositions. Raw Radix requires more boilerplate. |
| @shikijs/rehype | Manual Shiki in component | Requirement explicitly bans @shikijs/rehype (blocks pipeline during grammar loading). Manual integration gives async control. |

**Installation:**
```bash
cd src/
npm install react-markdown@^10.1.0 remark-gfm@^4.0.1 rehype-raw@^7.0.0 shiki@^3.23.0
npx shadcn@latest init
npx shadcn@latest add dialog tooltip scroll-area collapsible sonner dropdown-menu badge separator
```

## Architecture Patterns

### Recommended Project Structure
```
src/src/
  lib/
    shiki-highlighter.ts     # Singleton highlighter instance
    shiki-theme.ts           # OKLCH token -> --shiki-token-* mapping
  components/
    chat/
      view/
        AssistantMessage.tsx  # Updated: uses MarkdownRenderer
        MarkdownRenderer.tsx  # react-markdown + custom components
        CodeBlock.tsx         # Shiki-highlighted fenced code block
        CodeBlock.test.tsx
        MarkdownRenderer.test.tsx
    ui/                      # shadcn components (auto-generated)
      badge.tsx
      collapsible.tsx
      dialog.tsx
      dropdown-menu.tsx
      kbd.tsx                # Custom (not in shadcn catalog)
      scroll-area.tsx
      separator.tsx
      sonner.tsx
      tooltip.tsx
  styles/
    tokens.css               # Extended with --shiki-token-* mappings
    shiki.css                # Code block container styles (optional)
```

### Pattern 1: Shiki Singleton Module
**What:** Single highlighter instance created once at app startup, reused everywhere.
**When to use:** Always -- Shiki docs explicitly warn against recreating highlighters.
**Example:**
```typescript
// src/src/lib/shiki-highlighter.ts
import { createHighlighterCore } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'
import { createCssVariablesTheme } from 'shiki/core'

const theme = createCssVariablesTheme({
  name: 'loom-dark',
  variablePrefix: '--shiki-',
  variableDefaults: {},
  fontStyle: true,
})

let highlighterPromise: Promise<ReturnType<typeof createHighlighterCore>> | null = null

export function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighterCore({
      themes: [theme],
      langs: [],  // Start empty, load on demand
      engine: createJavaScriptRegexEngine(),
    })
  }
  return highlighterPromise
}

// Pre-load common languages at startup
export async function preloadLanguages() {
  const hl = await getHighlighter()
  const langs = ['javascript', 'typescript', 'python', 'bash', 'json', 'css', 'html']
  await Promise.all(langs.map(l => hl.loadLanguage(l)))
}
```

### Pattern 2: react-markdown Code Component Override (v10 inline detection)
**What:** In react-markdown v10, the `inline` prop was removed. Detect fenced vs inline code by overriding `pre` to mark its children.
**When to use:** Always for react-markdown v10+.
**Example:**
```typescript
// The `pre` component receives a fenced code block's <code> as child.
// Override `pre` to pass through, and in `code`, check if parent is <pre>.
const components: Components = {
  pre: ({ children, ...props }) => (
    <div className="not-prose" {...props}>{children}</div>
  ),
  code: ({ node, className, children, ...props }) => {
    const match = className?.match(/language-(\w+)/)
    // If className has language-*, it's a fenced code block
    if (match) {
      return <CodeBlock language={match[1]} code={String(children).trimEnd()} />
    }
    // Inline code
    return (
      <code className="bg-code-inline rounded-sm px-1.5 py-0.5 font-mono text-sm" {...props}>
        {children}
      </code>
    )
  },
}
```

### Pattern 3: Async Highlighting with useDeferredValue
**What:** Show plain monospace text immediately, swap to highlighted when grammar loads.
**When to use:** Every code block render.
**Example:**
```typescript
function CodeBlock({ language, code }: { language: string; code: string }) {
  const [html, setHtml] = useState<string | null>(null)
  const deferredHtml = useDeferredValue(html)

  useEffect(() => {
    let cancelled = false
    highlightCode(language, code).then(result => {
      if (!cancelled) setHtml(result)
    })
    return () => { cancelled = true }
  }, [language, code])

  const lineCount = code.split('\n').length
  const estimatedHeight = lineCount * 20 // ~20px per line

  return (
    <div
      className="bg-code-surface rounded-lg overflow-hidden"
      style={{ minHeight: `${Math.min(estimatedHeight, 400)}px` }}
    >
      <CodeBlockHeader language={language} code={code} />
      <div className={cn(
        "overflow-x-auto font-mono text-sm p-4",
        lineCount > 20 && "max-h-[400px] overflow-y-auto"
      )}>
        {deferredHtml ? (
          <div dangerouslySetInnerHTML={{ __html: deferredHtml }} />
        ) : (
          <pre className="whitespace-pre"><code>{code}</code></pre>
        )}
      </div>
    </div>
  )
}
```

### Pattern 4: Highlight Cache
**What:** Cache Shiki output by language+code to avoid re-highlighting identical blocks.
**When to use:** Messages with repeated code patterns (common in agent conversations).
**Example:**
```typescript
const highlightCache = new Map<string, string>()

async function highlightCode(lang: string, code: string): Promise<string> {
  const key = `${lang}:${code}`
  const cached = highlightCache.get(key)
  if (cached) return cached

  const hl = await getHighlighter()
  const loadedLangs = hl.getLoadedLanguages()
  if (!loadedLangs.includes(lang)) {
    try {
      await hl.loadLanguage(lang)
    } catch {
      // Unknown language -- render as plain text
      return code
    }
  }

  const html = hl.codeToHtml(code, { lang, theme: 'loom-dark' })
  highlightCache.set(key, html)
  return html
}
```

### Anti-Patterns to Avoid
- **Creating Shiki highlighter per component:** Each instance loads WASM/engines separately. Use singleton.
- **Using @shikijs/rehype plugin:** Blocks the react-markdown parse pipeline during grammar loading. Requirement explicitly bans this.
- **Checking `inline` prop on code component:** Removed in react-markdown v10. Check `className` for `language-*` pattern instead.
- **Synchronous Shiki in render:** `codeToHtml` after `loadLanguage` is async. Never block render on grammar loading.
- **Default shadcn colors left in place:** Every `hsl(var(--...))` must be replaced with project OKLCH tokens.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Markdown parsing | Custom regex parser | react-markdown + remark-gfm | GFM tables, task lists, edge cases in nested lists are deceptively complex |
| Syntax highlighting | Custom token parser | Shiki with TextMate grammars | 600+ language grammars, accurate tokenization, maintained |
| Clipboard API | Manual `document.execCommand` | `navigator.clipboard.writeText()` | Modern API, works in secure contexts, simpler error handling |
| Dialog/modal | Custom div + portal | shadcn dialog (Radix) | Focus trapping, escape handling, scroll lock, ARIA attributes |
| Tooltips | Custom hover div | shadcn tooltip (Radix) | Positioning, collision detection, delay management, ARIA |
| Toast notifications | Custom notification system | sonner (via shadcn) | Animation, stacking, auto-dismiss, action buttons |

**Key insight:** All three workstreams (markdown, syntax highlighting, UI primitives) have battle-tested solutions. Custom implementations would take 10x longer and miss edge cases.

## Common Pitfalls

### Pitfall 1: Shiki Highlighter Recreation
**What goes wrong:** Creating a new highlighter on every component mount causes 200ms+ delays and memory leaks.
**Why it happens:** The natural React pattern is to initialize in useEffect, but Shiki is expensive to create.
**How to avoid:** Module-level singleton promise. Call `getHighlighter()` which returns the cached promise.
**Warning signs:** Slow code block rendering, memory growth over time.

### Pitfall 2: react-markdown v10 Inline Code Detection
**What goes wrong:** Code blocks render as inline `<code>` tags because the old `inline` prop no longer exists.
**Why it happens:** Most tutorials and examples online reference react-markdown v8/v9 patterns with the `inline` prop.
**How to avoid:** Check `className` for `language-(\w+)` pattern. If present, it's a fenced block. If absent, it's inline. Override both `pre` and `code` components.
**Warning signs:** Fenced code blocks rendering without syntax highlighting, appearing inline.

### Pitfall 3: Layout Shift During Grammar Loading
**What goes wrong:** Code block jumps from plain text height to highlighted height, causing CLS.
**Why it happens:** Shiki's highlighted output may have different height than plain text (line wrapping, padding).
**How to avoid:** Reserve `min-height` based on line count estimate. Use consistent padding in both fallback and highlighted states. Use `useDeferredValue` for the swap.
**Warning signs:** Visible jump when code block goes from plain to highlighted.

### Pitfall 4: shadcn CSS Variable Conflicts
**What goes wrong:** shadcn components use `hsl(var(--primary))` or `oklch(var(--primary))` format that conflicts with existing token system.
**Why it happens:** shadcn expects its own CSS variable naming convention in `:root`.
**How to avoid:** After `shadcn init`, immediately map shadcn's expected variables to existing OKLCH tokens. The project already defines `--color-primary`, `--color-background`, etc. in `@theme inline`. Shadcn components use Tailwind utility classes (`bg-primary`, `text-muted-foreground`) which already resolve through the existing `@theme inline` mappings.
**Warning signs:** Components rendering with wrong colors or unstyled.

### Pitfall 5: Shiki HTML Output + React dangerouslySetInnerHTML
**What goes wrong:** Shiki's `codeToHtml` returns an HTML string, not React elements. Must use `dangerouslySetInnerHTML`.
**Why it happens:** Shiki operates on strings, not React virtual DOM.
**How to avoid:** This is expected. The HTML is safe because it's generated by Shiki from code content (not user-supplied HTML). Use `dangerouslySetInnerHTML` with a comment explaining safety. Alternatively, use `codeToTokens` + custom renderer for React elements, but this is more complex for minimal benefit.
**Warning signs:** None -- this is the standard pattern.

### Pitfall 6: shadcn/ui Path Alias Mismatch
**What goes wrong:** shadcn CLI generates imports like `@/components/ui/button` but the project's `@` alias points to `src/src/` (since the workspace root is `src/` and source is `src/src/`).
**Why it happens:** The `@` alias in tsconfig.app.json maps `@/*` to `./src/*`, so `@/components/ui/button` resolves to `src/src/components/ui/button`. This is correct for the project structure.
**How to avoid:** Verify `components.json` aliases match the tsconfig paths. The `ui` alias should be `@/components/ui`.
**Warning signs:** Import resolution errors after running `shadcn add`.

## Code Examples

### MarkdownRenderer Component
```typescript
// src/src/components/chat/view/MarkdownRenderer.tsx
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { CodeBlock } from './CodeBlock'
import { cn } from '@/utils/cn'
import type { Components } from 'react-markdown'

interface MarkdownRendererProps {
  content: string
}

const components: Components = {
  pre: ({ children }) => <>{children}</>,
  code: ({ className, children, ...props }) => {
    const match = className?.match(/language-(\w+)/)
    if (match) {
      return <CodeBlock language={match[1]!} code={String(children).trimEnd()} />
    }
    return (
      <code
        className="bg-code-inline rounded-sm px-1.5 py-0.5 font-mono text-[0.85em]"
        {...props}
      >
        {children}
      </code>
    )
  },
  a: ({ href, children, ...props }) => {
    const isExternal = href?.startsWith('http')
    return (
      <a
        href={href}
        className="text-primary underline-offset-2 hover:underline"
        {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        {...props}
      >
        {children}
      </a>
    )
  },
  blockquote: ({ children, ...props }) => (
    <blockquote
      className="border-l-2 border-primary/30 pl-4 text-muted italic"
      {...props}
    >
      {children}
    </blockquote>
  ),
  table: ({ children, ...props }) => (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse" {...props}>
        {children}
      </table>
    </div>
  ),
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="prose prose-invert max-w-none">
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={components}
      >
        {content}
      </Markdown>
    </div>
  )
}
```

### Shiki Theme Mapping in tokens.css
```css
/* Add to tokens.css -- Shiki syntax highlighting token colors */
:root {
  --shiki-foreground: var(--text-primary);
  --shiki-background: var(--code-surface);
  --shiki-token-constant: oklch(0.75 0.12 40);    /* warm orange */
  --shiki-token-string: oklch(0.72 0.12 145);     /* muted green */
  --shiki-token-comment: oklch(0.50 0.01 30);     /* dim warm gray */
  --shiki-token-keyword: oklch(0.70 0.14 330);    /* muted purple */
  --shiki-token-parameter: oklch(0.78 0.08 60);   /* warm gold */
  --shiki-token-function: oklch(0.75 0.10 240);   /* muted blue */
  --shiki-token-string-expression: oklch(0.72 0.12 145);
  --shiki-token-punctuation: oklch(0.65 0.02 30);  /* mid warm gray */
  --shiki-token-link: var(--accent-primary);
}
```

### Copy Button with Feedback
```typescript
function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [code])

  return (
    <button
      onClick={handleCopy}
      className="text-muted hover:text-foreground transition-colors"
      aria-label={copied ? 'Copied' : 'Copy code'}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      <span className="ml-1 text-xs">{copied ? 'Copied!' : 'Copy'}</span>
    </button>
  )
}
```

### components.json for shadcn
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/styles/index.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-markdown v8 `inline` prop | v10: detect via className pattern | v9 (2024) | Must override `pre` + `code` components differently |
| Shiki WASM engine (Oniguruma) | JS RegExp engine | Shiki v1.x+ | ~30KB smaller bundle, faster startup, no WASM loading |
| shadcn HSL color format | shadcn OKLCH format | 2025-03 | New projects use OKLCH natively; aligns with project tokens |
| highlight.js / Prism | Shiki with TextMate grammars | 2023+ | More accurate highlighting, CSS variables theme support |
| tailwindcss-animate | tw-animate-css | Tailwind v4 | CSS-only replacement compatible with Tailwind v4 |

**Deprecated/outdated:**
- `@shikijs/rehype`: Blocks parsing pipeline. Explicitly banned in requirements.
- `react-syntax-highlighter`: Wraps Prism/highlight.js, large bundle, less accurate than Shiki.
- `inline` prop on react-markdown code component: Removed in v9+.
- `tailwindcss-animate`: Replaced by `tw-animate-css` for Tailwind v4 projects.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.x + React Testing Library |
| Config file | `src/vite.config.ts` (test block) |
| Quick run command | `cd src && npx vitest run --reporter=verbose` |
| Full suite command | `cd src && npx vitest run --coverage` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DEP-03 | Shiki singleton returns same instance | unit | `cd src && npx vitest run src/lib/shiki-highlighter.test.ts -x` | No -- Wave 0 |
| DEP-04 | 7 languages pre-loaded after init | unit | `cd src && npx vitest run src/lib/shiki-highlighter.test.ts -x` | No -- Wave 0 |
| DEP-05 | Shiki theme uses OKLCH token CSS vars | unit | `cd src && npx vitest run src/lib/shiki-theme.test.ts -x` | No -- Wave 0 |
| MD-01 | Bold, italic, lists, links, headings render | unit | `cd src && npx vitest run src/components/chat/view/MarkdownRenderer.test.tsx -x` | No -- Wave 0 |
| MD-03 | Custom code/a/table/pre overrides work | unit | `cd src && npx vitest run src/components/chat/view/MarkdownRenderer.test.tsx -x` | No -- Wave 0 |
| MD-04 | Inline code has correct styling classes | unit | `cd src && npx vitest run src/components/chat/view/MarkdownRenderer.test.tsx -x` | No -- Wave 0 |
| CODE-01 | Fenced blocks use Shiki highlighting | unit | `cd src && npx vitest run src/components/chat/view/CodeBlock.test.tsx -x` | No -- Wave 0 |
| CODE-02 | Language label + copy button present | unit | `cd src && npx vitest run src/components/chat/view/CodeBlock.test.tsx -x` | No -- Wave 0 |
| CODE-04 | Max-height 400px for long blocks | unit | `cd src && npx vitest run src/components/chat/view/CodeBlock.test.tsx -x` | No -- Wave 0 |
| CODE-06 | Plain text fallback before grammar loads | unit | `cd src && npx vitest run src/components/chat/view/CodeBlock.test.tsx -x` | No -- Wave 0 |
| CODE-07 | Cache returns same result for same input | unit | `cd src && npx vitest run src/lib/shiki-highlighter.test.ts -x` | No -- Wave 0 |
| UI-03 | shadcn components use OKLCH tokens | manual-only | Visual inspection -- no programmatic test for CSS variable usage | N/A |

### Sampling Rate
- **Per task commit:** `cd src && npx vitest run --reporter=verbose`
- **Per wave merge:** `cd src && npx vitest run --coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/src/lib/shiki-highlighter.test.ts` -- covers DEP-03, DEP-04, CODE-07
- [ ] `src/src/lib/shiki-theme.test.ts` -- covers DEP-05
- [ ] `src/src/components/chat/view/MarkdownRenderer.test.tsx` -- covers MD-01, MD-03, MD-04, MD-05, MD-06
- [ ] `src/src/components/chat/view/CodeBlock.test.tsx` -- covers CODE-01, CODE-02, CODE-03, CODE-04, CODE-06

## Open Questions

1. **Shiki version mismatch: Requirements say ^4.0.1, npm latest is 3.23.0**
   - What we know: Shiki v4.0.1 does not exist on npm as of 2026-03-07. Latest is 3.23.0.
   - What's unclear: Whether requirements were written against a future/beta version.
   - Recommendation: Use `^3.23.0`. All required APIs exist. Update requirements to match.

2. **shadcn `kbd` component**
   - What we know: shadcn/ui does not include a `kbd` component in its catalog.
   - What's unclear: Whether to use a third-party `kbd` or create a simple custom one.
   - Recommendation: Create a minimal `Kbd` component (~15 lines) styled with OKLCH tokens. It's just a `<kbd>` element with styling.

3. **Tailwind prose classes**
   - What we know: The project uses Tailwind v4 but `@tailwindcss/typography` (prose plugin) is not installed.
   - What's unclear: Whether to install typography plugin or style markdown elements individually.
   - Recommendation: Style individually via react-markdown component overrides. Avoids typography plugin dependency and gives full control over token usage. The `prose` class in the example above should be replaced with custom element styling.

## Sources

### Primary (HIGH confidence)
- [Shiki documentation](https://shiki.style/) - JS RegExp engine, CSS variables theme, createHighlighterCore API
- [Shiki RegExp Engine docs](https://shiki.style/guide/regex-engines) - JavaScript engine setup, limitations, compatibility
- [Shiki Theme Colors docs](https://shiki.style/guide/theme-colors) - createCssVariablesTheme API, token variable names
- [shadcn/ui Tailwind v4 docs](https://ui.shadcn.com/docs/tailwind-v4) - OKLCH colors, @theme directive, init process
- [shadcn/ui Manual Installation](https://ui.shadcn.com/docs/installation/manual) - components.json, dependencies, CSS setup
- npm registry - Confirmed versions: react-markdown 10.1.0, remark-gfm 4.0.1, rehype-raw 7.0.0, shiki 3.23.0

### Secondary (MEDIUM confidence)
- [react-markdown GitHub](https://github.com/remarkjs/react-markdown) - v10 component API, inline code detection pattern
- [react-markdown issue #776](https://github.com/remarkjs/react-markdown/issues/776) - v10 `inline` prop removal confirmed
- [remarkjs Discussion #1346](https://github.com/orgs/remarkjs/discussions/1346) - Alternative inline vs fenced detection methods

### Tertiary (LOW confidence)
- Shiki token variable complete list - Compiled from multiple sources, may be incomplete for edge tokens

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified on npm, docs fetched, APIs confirmed
- Architecture: HIGH - Singleton pattern, component overrides, and cache pattern are well-established
- Pitfalls: HIGH - Based on documented breaking changes and official migration guides
- shadcn integration: MEDIUM - Project already has Tailwind v4 + correct aliases, but shadcn init on existing project may need manual adjustment

**Research date:** 2026-03-07
**Valid until:** 2026-04-07 (stable libraries, 30 day window)
