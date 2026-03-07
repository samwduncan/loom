# Phase 12: Streaming Markdown + Marker Interleaving - Research

**Researched:** 2026-03-07
**Domain:** Streaming markdown rendering, rehype plugin authoring, HTML sanitization, crossfade transitions
**Confidence:** HIGH

## Summary

Phase 12 transforms the streaming pipeline from raw `textContent` painting to lightweight HTML-formatted streaming, adds a smooth crossfade transition to finalized `react-markdown` rendering, and implements marker-based inline tool chip placement within finalized markdown. It also includes a Streamdown evaluation as a potential alternative.

The core technical challenges are: (1) building a fast, safe markdown-to-HTML converter that runs inside a rAF loop without causing jank, (2) orchestrating a 250ms crossfade with height animation between streaming and finalized DOM, (3) authoring a rehype plugin that finds `\x00TOOL:id\x00` marker strings in the hast tree and replaces them with React components, and (4) running a fair Streamdown vs custom converter comparison.

**Primary recommendation:** Build the streaming converter as a single pure function (~150 lines) using regex-based transforms with DOMPurify sanitization, wire into the existing rAF loop via `innerHTML` instead of `textContent`, and use `unist-util-visit` (already installed as transitive dep) for the rehype marker plugin.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Basic inline formatting during streaming: bold, italic, inline code, paragraphs, line breaks, headings (h1-h6), lists (bullet + numbered), blockquotes, and code fence containers
- innerHTML with strict HTML allowlist: `<strong>`, `<em>`, `<code>`, `<a>`, `<p>`, `<br>`, `<ul>`, `<ol>`, `<li>`, `<h1>`-`<h6>`, `<pre>`, `<div>`. All other tags stripped. No event handlers, no scripts.
- Unclosed code fences: detect odd number of triple-backtick sequences, inject synthetic closing fence before parsing. Code block container renders immediately with content filling in as tokens arrive (dark bg, mono font, language label, no Shiki highlighting until finalization)
- Incomplete tables: render as plain text until table completes (next empty line or flush). Tables only parsed on flush or double-newline.
- 250ms crossfade overlay: render finalized react-markdown behind streaming content, fade streaming out (opacity 1->0) and finalized in (opacity 0->1) simultaneously
- Smooth height animation: container transitions from streaming height to finalized height over the same 250ms. Explicit height capture (both heights measured), animate between, then release to auto.
- Streaming cursor fades out as part of the crossfade (opacity transition synced to 250ms)
- Uses position:absolute overlap during transition to prevent layout jump
- After 250ms: streaming DOM removed, finalized DOM visible, height set to auto
- Marker-based approach: inject unique placeholder tokens (`\x00TOOL:id\x00`) between text content blocks
- rehype plugin (`rehypeToolMarkers`) walks hast tree, finds marker text nodes, replaces with custom `<tool-marker data-id="id" />` elements
- React component override for `tool-marker` renders ToolChip component
- No DOM walking, no createPortal -- pure react-markdown integration
- Full prototype comparison for Streamdown evaluation: build both side-by-side with identical test fixtures
- Silent fallback to raw textContent if converter throws or produces broken output
- Permanent fallback for that streaming session (don't retry converter after failure)

### Claude's Discretion
- Streaming converter performance optimization (token batching, rAF frame budget)
- Reduced motion behavior (instant crossfade vs skip formatting)
- Specific test fixtures for Streamdown comparison
- Sanitization implementation details (DOMPurify vs custom regex)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| MD-10 | During active streaming, rAF buffer continues painting raw text via DOM mutation (60fps preserved) | Streaming converter is a pure function called in rAF paint loop; paints via innerHTML instead of textContent. No React reconciliation. |
| MD-11 | Lightweight streaming markdown-to-HTML pure function with sanitized HTML via dangerouslySetInnerHTML. Allowlist enforcement. | DOMPurify with ALLOWED_TAGS config, or custom regex strip. Pure function, no DOM dependency for parsing. |
| MD-12 | Unclosed code fences: detect odd triple-backtick count, inject synthetic closing fence | Regex counting of ``` sequences; if odd, append closing fence before conversion. Code container styled to match CodeBlock minus Shiki. |
| MD-13 | GFM tables during streaming: render as plain text until complete | Detect trailing pipe-row without closing empty line; skip table parsing, output raw text. Only parse on flush/double-newline. |
| MD-14 | Smooth streaming-to-finalized transition (250ms crossfade, no flash/layout jump) | Position:absolute overlay pattern with explicit height capture, CSS transition on opacity + height, cleanup after transitionend. |
| MD-15 | Marker-based inline tool chips in finalized markdown via rehype plugin | rehypeToolMarkers plugin using unist-util-visit (v5.1.0, already installed). Component override in react-markdown for `tool-marker` element. |
| ENH-01 | Streamdown evaluation -- compare against custom converter, document decision | Streamdown v2.1.0 available on npm. Full side-by-side prototype comparison with identical test fixtures. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-markdown | ^10.1.0 | Finalized message rendering | Already installed; react-markdown component override pattern established in Phase 11 |
| rehype-raw | ^7.0.0 | Raw HTML passthrough in react-markdown | Already installed; needed for tool-marker elements |
| unist-util-visit | 5.1.0 | Walk hast tree in rehype plugin | Already available as transitive dependency of react-markdown/rehype |
| DOMPurify | ^3.3.x | HTML sanitization for streaming innerHTML | Industry standard XSS sanitizer, ~30KB minified, configurable allowlist |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @types/hast | (installed) | TypeScript types for hast nodes | In rehypeToolMarkers plugin for type-safe node manipulation |
| streamdown | ^2.1.0 | Streaming markdown renderer | ENH-01 evaluation prototype only; install for comparison, remove if custom wins |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| DOMPurify | Custom regex strip | Smaller bundle but higher security risk; regex sanitizers are notoriously fragile. DOMPurify is battle-tested. |
| Custom streaming converter | Streamdown | Streamdown is 13MB+ with all plugins (Mermaid, KaTeX); core may be smaller but requires Tailwind CSS integration and React 19.1.1+. Our rAF architecture needs direct DOM control that Streamdown may not expose. |
| unist-util-visit | Manual tree walk | unist-util-visit is already installed and handles edge cases (circular refs, early exit). No reason to hand-roll. |

**Installation:**
```bash
cd /home/swd/loom/src && npm install dompurify @types/dompurify
# For Streamdown evaluation only (remove after comparison):
cd /home/swd/loom/src && npm install streamdown
```

## Architecture Patterns

### Recommended Project Structure
```
src/src/
  lib/
    streaming-markdown.ts       # Pure function: markdown string -> sanitized HTML string
    streaming-markdown.test.ts  # Unit tests for converter edge cases
    rehype-tool-markers.ts      # rehype plugin for marker replacement
    rehype-tool-markers.test.ts # Unit tests for hast tree transformation
  components/chat/
    view/
      ActiveMessage.tsx         # Modified: innerHTML painting, crossfade orchestration
      AssistantMessage.tsx      # Modified: marker injection into content string
      MarkdownRenderer.tsx      # Modified: rehypeToolMarkers plugin + tool-marker component override
    styles/
      streaming-cursor.css      # Modified: crossfade CSS additions
      streaming-markdown.css    # NEW: streaming-phase formatting styles (code blocks, lists, blockquotes)
  hooks/
    useStreamBuffer.ts          # Modified: innerHTML painting instead of textContent
```

### Pattern 1: Streaming Markdown Converter (Pure Function)
**What:** A single pure function that takes raw markdown text and returns sanitized HTML.
**When to use:** Called inside the rAF paint loop on every frame that has new content.
**Example:**
```typescript
// src/src/lib/streaming-markdown.ts
import DOMPurify from 'dompurify';

const ALLOWED_TAGS = ['strong', 'em', 'code', 'a', 'p', 'br', 'ul', 'ol', 'li',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'pre', 'div'];
const ALLOWED_ATTR = ['href', 'target', 'rel', 'class'];

export function convertStreamingMarkdown(raw: string): string {
  // 1. Fix unclosed code fences
  const fenceCount = (raw.match(/```/g) ?? []).length;
  let text = raw;
  if (fenceCount % 2 !== 0) {
    text += '\n```';
  }

  // 2. Check for incomplete table (trailing pipe row without empty line after)
  // If incomplete, leave table portion as plain text
  // ... (table detection logic)

  // 3. Convert markdown to HTML via regex transforms
  let html = text;
  // Bold: **text** or __text__
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
  // Italic: *text* or _text_
  html = html.replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
  // Inline code: `text`
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  // Headings: # text
  html = html.replace(/^(#{1,6})\s+(.+)$/gm, (_, hashes, content) => {
    const level = hashes.length;
    return `<h${level}>${content}</h${level}>`;
  });
  // ... (lists, blockquotes, code fences, paragraphs, line breaks)

  // 4. Sanitize
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    KEEP_CONTENT: true,
  });
}
```

### Pattern 2: rehype Tool Markers Plugin
**What:** A rehype plugin that walks the hast tree, finds text nodes containing `\x00TOOL:id\x00` markers, and replaces them with `<tool-marker>` elements.
**When to use:** Added to MarkdownRenderer's rehypePlugins array for finalized message rendering.
**Example:**
```typescript
// src/src/lib/rehype-tool-markers.ts
import { visit } from 'unist-util-visit';
import type { Root, Text, Element } from 'hast';

const MARKER_REGEX = /\x00TOOL:([^\x00]+)\x00/;

export function rehypeToolMarkers() {
  return (tree: Root) => {
    visit(tree, 'text', (node: Text, index: number | undefined, parent) => {
      if (!parent || index === undefined) return;
      const match = node.value.match(MARKER_REGEX);
      if (!match) return;

      // Split text around marker, create tool-marker element
      const before = node.value.slice(0, match.index);
      const after = node.value.slice((match.index ?? 0) + match[0].length);
      const toolId = match[1];

      const newNodes: (Text | Element)[] = [];
      if (before) newNodes.push({ type: 'text', value: before });
      newNodes.push({
        type: 'element',
        tagName: 'tool-marker',
        properties: { 'data-id': toolId },
        children: [],
      });
      if (after) newNodes.push({ type: 'text', value: after });

      parent.children.splice(index, 1, ...newNodes);
      return index + newNodes.length; // Skip inserted nodes
    });
  };
}
```

### Pattern 3: Crossfade Transition
**What:** Position:absolute overlay with explicit height animation for smooth streaming-to-finalized swap.
**When to use:** On flush (isStreaming true -> false transition).
**Example:**
```css
/* Crossfade container */
.crossfade-container {
  position: relative;
  overflow: hidden;
  transition: height 250ms var(--ease-out);
}

.crossfade-streaming {
  transition: opacity 250ms var(--ease-out);
}

.crossfade-finalized {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  opacity: 0;
  transition: opacity 250ms var(--ease-out);
}

.crossfade-container[data-phase="finalizing"] .crossfade-streaming {
  opacity: 0;
}

.crossfade-container[data-phase="finalizing"] .crossfade-finalized {
  opacity: 1;
}
```

### Anti-Patterns to Avoid
- **Running react-markdown during streaming:** Full react-markdown parse on every rAF frame would destroy performance. The lightweight converter exists specifically to avoid this.
- **Using createPortal for tool chips:** The CONTEXT.md explicitly bans this. Use react-markdown component overrides.
- **Animating height/width during streaming:** Constitution 11.4 bans this. The crossfade height animation happens AFTER streaming ends, during finalization only.
- **Retrying converter after failure:** CONTEXT.md specifies permanent fallback per session. Don't flicker between converter and fallback.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTML sanitization | Custom regex tag stripping | DOMPurify with ALLOWED_TAGS | XSS is too dangerous for regex. DOMPurify handles mutation XSS, nesting attacks, attribute-based XSS. One missed edge case = security vulnerability. |
| Hast tree walking | Manual recursive tree walk | unist-util-visit | Already installed. Handles index management on splice, early exit, type narrowing. |
| Markdown-to-React | Custom JSX builder | react-markdown (finalized only) | react-markdown handles the full GFM spec, component overrides, rehype pipeline. Only streaming gets custom converter. |

**Key insight:** The streaming converter is intentionally simple (handles ~8 formatting constructs via regex). It does NOT need to be a full markdown parser. Full parsing happens once on finalization via react-markdown. The converter just needs to be "good enough" visually during streaming to avoid raw-text jarring.

## Common Pitfalls

### Pitfall 1: innerHTML vs textContent Security
**What goes wrong:** Setting `innerHTML` with unsanitized AI output allows XSS via injected `<script>`, `<img onerror>`, event handler attributes, etc.
**Why it happens:** AI models can produce arbitrary HTML-like content in markdown.
**How to avoid:** Always pass through DOMPurify.sanitize() with strict ALLOWED_TAGS before innerHTML assignment. Never skip sanitization "because it's just markdown."
**Warning signs:** Any code path that reaches innerHTML without passing through the sanitizer.

### Pitfall 2: Crossfade Layout Jump
**What goes wrong:** Streaming content and finalized content have different heights. When swapping, the container jumps from one height to another, causing a jarring scroll position shift.
**Why it happens:** The finalized react-markdown output (with proper spacing, code blocks, etc.) almost always has different height than the streaming HTML.
**How to avoid:** Before starting crossfade: measure streaming height, render finalized behind it, measure finalized height. Set container to explicit streaming height, then animate to finalized height over 250ms. After transition completes, set height to auto.
**Warning signs:** Visible scroll jump when messages finalize, especially with code blocks.

### Pitfall 3: Regex Markdown Converter Edge Cases
**What goes wrong:** Regex-based bold/italic/code detection conflicts with each other, produces malformed HTML. E.g., `**bold *and italic* text**` nesting, or `code with * inside`.
**Why it happens:** Markdown formatting is context-sensitive; regex is not.
**How to avoid:** Process code fences FIRST (extract and replace with placeholders), then inline code, then bold/italic. Code content must not be transformed by later regex passes. Order matters.
**Warning signs:** Broken formatting on messages with mixed inline styles, especially code + bold combinations.

### Pitfall 4: Marker Characters in User Content
**What goes wrong:** If a user or AI somehow produces the literal marker string `\x00TOOL:...\x00`, it would be incorrectly treated as a tool chip placeholder.
**Why it happens:** The null byte (`\x00`) is extremely unlikely in markdown text but not impossible.
**How to avoid:** The null byte choice is good because: (1) it's not valid in markdown, (2) most LLMs never produce it, (3) DOMPurify strips null bytes from sanitized content. Still, the rehype plugin should validate that `data-id` matches an actual tool call ID before rendering a ToolChip.
**Warning signs:** Random tool chips appearing in messages without tool calls.

### Pitfall 5: Streaming Converter Performance in rAF
**What goes wrong:** The converter runs on EVERY rAF frame, re-parsing the entire accumulated buffer. With 10KB+ of accumulated text, regex operations become slow and cause frame drops.
**Why it happens:** The buffer grows monotonically; re-parsing everything each frame is O(n) where n grows.
**How to avoid:** Profile early. Options: (1) Only re-convert when buffer has new content since last paint (dirty flag). (2) For very large buffers, convert only the last N characters and prepend cached HTML for the stable prefix. The rAF loop already has a check (`bufferRef.current.length > bufferOffsetRef.current`), so conversion only runs when there's new content.
**Warning signs:** Frame drops appearing 30+ seconds into long streaming responses.

### Pitfall 6: DOMPurify in jsdom Test Environment
**What goes wrong:** DOMPurify relies on browser DOM APIs. In jsdom (Vitest), some behavior may differ from real browsers.
**Why it happens:** jsdom is a partial DOM implementation.
**How to avoid:** DOMPurify v3.x has an `isSupported` flag and works in jsdom. Import it normally -- it detects the environment. For tests, focus on testing the converter output shape rather than DOMPurify internals.
**Warning signs:** Tests passing in jsdom but sanitization behaving differently in browser.

## Code Examples

### Modifying useStreamBuffer for innerHTML
```typescript
// In the paint function, replace textContent with innerHTML:
const paint = (): void => {
  const node = textNodeRefRef.current.current;
  if (node && bufferRef.current.length > bufferOffsetRef.current) {
    const raw = bufferRef.current.slice(bufferOffsetRef.current);
    try {
      node.innerHTML = convertStreamingMarkdown(raw);
    } catch {
      // Silent fallback to textContent
      node.textContent = raw;
      // Set permanent fallback flag for this session
      converterFailedRef.current = true;
    }
  }
  // ... rest of loop
};
```

### MarkdownRenderer with rehypeToolMarkers
```typescript
import { rehypeToolMarkers } from '@/lib/rehype-tool-markers';
import { ToolChip } from '@/components/chat/tools/ToolChip';

const components: Components = {
  // ... existing overrides ...
  'tool-marker': ({ node, ...props }) => {
    const toolId = props['data-id'] as string;
    // Look up tool call data and render ToolChip
    return <ToolMarkerChip toolCallId={toolId} />;
  },
};

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="markdown-body text-foreground text-sm leading-relaxed">
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeToolMarkers]}
        components={components}
      >
        {content}
      </Markdown>
    </div>
  );
}
```

### Crossfade Height Measurement
```typescript
// In ActiveMessage handleFlush:
const streamingEl = streamingRef.current;
const finalizedEl = finalizedRef.current;
const container = containerRef.current;

if (streamingEl && finalizedEl && container) {
  const streamingHeight = streamingEl.getBoundingClientRect().height;
  // Render finalized content (hidden via opacity: 0)
  // ... trigger React render with finalized content ...

  // After finalized content renders, measure its height
  requestAnimationFrame(() => {
    const finalizedHeight = finalizedEl.getBoundingClientRect().height;
    container.style.height = `${streamingHeight}px`;
    // Force reflow
    void container.offsetHeight;
    // Start transition
    container.style.height = `${finalizedHeight}px`;
    setPhase('finalizing');
  });
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| textContent for streaming | innerHTML with lightweight converter | Phase 12 (now) | Users see formatted text during streaming, not raw markdown |
| Instant swap streaming->finalized | 250ms crossfade overlay | Phase 12 (now) | No jarring flash at message completion |
| Tool chips appended after content | Marker-based inline placement | Phase 12 (now) | Tool chips appear at correct positions within text flow |

**Streamdown status:**
- Streamdown v2.1.0 by Vercel, released March 2026
- Drop-in react-markdown replacement for streaming
- ~13MB with all plugins (Mermaid, KaTeX, Shiki built-in)
- Requires React 19.1.1+, Tailwind CSS
- Uses `remend` for streaming markdown parsing
- Plugin architecture allows slimmer bundles, but core size unclear
- Key risk: may not integrate with our rAF + useRef architecture (Streamdown manages its own rendering)

## Open Questions

1. **DOMPurify bundle impact**
   - What we know: ~30KB minified, well under budget
   - What's unclear: Whether tree-shaking removes unused features
   - Recommendation: Install and measure. If too large, fall back to custom regex strip with the strict allowlist (lower security but acceptable for known-format AI output)

2. **Streamdown integration with rAF architecture**
   - What we know: Streamdown is a React component that manages its own state
   - What's unclear: Whether it exposes hooks for external state management or requires its own render cycle
   - Recommendation: This is exactly what the prototype comparison will answer. Build both, compare.

3. **rehypeToolMarkers ordering with rehypeRaw**
   - What we know: rehype-raw parses raw HTML into hast. Tool markers use null bytes which aren't HTML.
   - What's unclear: Whether rehype-raw interferes with marker text nodes
   - Recommendation: Order plugins as `[rehypeRaw, rehypeToolMarkers]` -- raw first, then markers. Markers operate on text nodes that contain null byte sequences, which rehype-raw won't touch.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 + React Testing Library |
| Config file | `src/vite.config.ts` (test section) |
| Quick run command | `cd /home/swd/loom/src && npx vitest run --reporter=verbose` |
| Full suite command | `cd /home/swd/loom/src && npx vitest run --coverage` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MD-10 | rAF paint loop uses innerHTML not textContent | unit | `cd /home/swd/loom/src && npx vitest run src/hooks/useStreamBuffer.test.ts -x` | Yes (needs update) |
| MD-11 | Streaming converter produces correct HTML from markdown | unit | `cd /home/swd/loom/src && npx vitest run src/lib/streaming-markdown.test.ts -x` | No -- Wave 0 |
| MD-12 | Unclosed code fences get synthetic closing | unit | `cd /home/swd/loom/src && npx vitest run src/lib/streaming-markdown.test.ts -x` | No -- Wave 0 |
| MD-13 | Incomplete tables render as plain text | unit | `cd /home/swd/loom/src && npx vitest run src/lib/streaming-markdown.test.ts -x` | No -- Wave 0 |
| MD-14 | Crossfade transition (250ms, no layout jump) | integration | `cd /home/swd/loom/src && npx vitest run src/components/chat/view/ActiveMessage.test.tsx -x` | Yes (needs update) |
| MD-15 | rehype marker plugin replaces markers with tool-marker elements | unit | `cd /home/swd/loom/src && npx vitest run src/lib/rehype-tool-markers.test.ts -x` | No -- Wave 0 |
| ENH-01 | Streamdown comparison documented | manual-only | N/A -- evaluated via side-by-side prototype, documented in SUMMARY.md | N/A |

### Sampling Rate
- **Per task commit:** `cd /home/swd/loom/src && npx vitest run --reporter=verbose`
- **Per wave merge:** `cd /home/swd/loom/src && npx vitest run --coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/src/lib/streaming-markdown.test.ts` -- covers MD-11, MD-12, MD-13
- [ ] `src/src/lib/rehype-tool-markers.test.ts` -- covers MD-15
- [ ] DOMPurify install: `cd /home/swd/loom/src && npm install dompurify @types/dompurify`

## Sources

### Primary (HIGH confidence)
- Existing codebase: `useStreamBuffer.ts`, `ActiveMessage.tsx`, `MarkdownRenderer.tsx`, `CodeBlock.tsx`, `streaming-cursor.css` -- read directly
- unist-util-visit v5.1.0 -- installed as transitive dependency, verified in node_modules
- @types/hast -- installed as transitive dependency, verified in node_modules
- [DOMPurify GitHub](https://github.com/cure53/DOMPurify) -- ALLOWED_TAGS API confirmed
- [DOMPurify Wiki: Default allowlist](https://github.com/cure53/DOMPurify/wiki/Default-TAGs-ATTRIBUTEs-allow-list-&-blocklist) -- ALLOWED_TAGS/ALLOWED_ATTR configuration

### Secondary (MEDIUM confidence)
- [Streamdown GitHub](https://github.com/vercel/streamdown) -- API, plugin architecture, React integration
- [Streamdown docs](https://streamdown.ai/docs/getting-started) -- installation, Tailwind requirement
- [unist-util-visit GitHub](https://github.com/syntax-tree/unist-util-visit) -- visit API, node replacement pattern
- [react-markdown GitHub](https://github.com/remarkjs/react-markdown) -- component override pattern, rehypePlugins array

### Tertiary (LOW confidence)
- Streamdown bundle size (~13MB with all plugins) -- from GitHub issue, may be outdated with plugin architecture changes
- streamdown-lite by Phaser -- exists as lighter alternative but unclear stability

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all core libraries already installed or well-documented
- Architecture: HIGH -- patterns directly extend existing M1 codebase with clear integration points
- Pitfalls: HIGH -- based on direct code reading and known DOM/security patterns
- Streamdown evaluation: MEDIUM -- version is new (March 2026), limited production experience reports

**Research date:** 2026-03-07
**Valid until:** 2026-04-07 (stable domain, 30-day validity)
