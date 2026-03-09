# Phase 19: Visual Effects + Enhancements - Research

**Researched:** 2026-03-09
**Domain:** CSS visual effects, inline markdown parsing, chat UX enhancements
**Confidence:** HIGH

## Summary

Phase 19 covers six requirements across two categories: CSS visual effects (SpotlightCard, ShinyText, ElectricBorder) and chat feature enhancements (thinking markdown, error retry, message search, conversation export). All are well-scoped, isolated additions with clear integration points in existing components.

The visual effects are cherry-picked from React Bits (source-level copy, not npm). SpotlightCard and ShinyText are straightforward CSS + minimal JS. ElectricBorder as originally implemented in React Bits uses Canvas + Perlin noise -- far too heavy for a "subtle glow." The StarBorder component from the same library is CSS-only and achieves the "soft animated gradient" described in CONTEXT.md. I recommend using StarBorder's CSS gradient technique, adapted to design tokens, rather than the Canvas-based ElectricBorder.

The enhancement features are standard patterns: regex-based inline markdown (subset of existing `streaming-markdown.ts`), retry via WebSocket resend, substring search with message filtering, and Blob-based file download.

**Primary recommendation:** Use CSS-only approaches for all three visual effects (no Canvas, no Framer Motion). Build thinking markdown as a thin inline-only parser reusing patterns from `streaming-markdown.ts`. Wire retry through existing `wsClient.send()`. Search and export are pure UI features with no backend changes.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **SpotlightCard** (radial gradient hover): Applied to tool cards (ToolCardShell), sidebar session items, and sidebar project items
- **ShinyText** (shimmer sweep): Applied to "Thinking..." label in ThinkingDisclosure during streaming, and activity status line text during streaming
- **ElectricBorder** (animated border): Subtle glow on composer during active AI streaming only -- soft animated gradient using primary accent colors, not dramatic
- All effects are source-level cherry-picks from React Bits (not npm install), CSS-only, zero runtime dependencies
- All effects use design tokens only -- no hardcoded colors (Constitution ESLint enforcement)
- **prefers-reduced-motion**: ALL visual effects disabled (no spotlight, no shimmer, no electric border). Static fallbacks only.
- **Thinking Block Markdown**: Inline formatting only (bold, italic, code spans, links). Lightweight regex parser, NOT react-markdown. Works during streaming AND finalized.
- **Error Retry**: "Retry" button in ErrorMessage, resends most recent user message via WebSocket. Error stays visible until new response arrives.
- **Message Search**: Cmd+F/Ctrl+F triggers search, filter mode (hide non-matching), case-insensitive substring. Searches user, assistant, and thinking text. Does NOT search tool calls.
- **Conversation Export**: Markdown (.md) and JSON (.json). Export button in chat header menu. Filename: `{session-title-slug}-{YYYY-MM-DD}.{md|json}`.

### Claude's Discretion
- SpotlightCard gradient colors and radius
- ShinyText animation speed and gradient angle
- ElectricBorder specific gradient stops and animation timing
- Thinking markdown regex implementation details
- Search input slide-in animation and layout
- Export markdown template structure and formatting
- Thinking markdown: handling of nested inline formatting -- best effort is fine
- Search debounce timing (filter on every keystroke vs after 200ms pause)
- Search highlight implementation (`<mark>` tag vs span with bg class)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| UI-04 | Cherry-pick CSS-only effects from React Bits: SpotlightCard, ShinyText, ElectricBorder | Source code analyzed from React Bits registry; adaptation patterns documented below |
| UI-05 | All cherry-picked components use design tokens only | Token mapping strategy documented; ESLint enforcement confirmed |
| ENH-03 | Thinking block inline markdown (bold, italic, code spans) | Regex patterns from existing `streaming-markdown.ts` reusable; thin parser approach documented |
| ENH-04 | Error messages include retry button | Integration with ErrorMessage, timeline store, and wsClient documented |
| ENH-05 | Message search within session | Filter architecture for MessageList documented; keyboard shortcut pattern documented |
| ENH-06 | Conversation export as Markdown or JSON | Blob + URL.createObjectURL download pattern; export template structure documented |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19 | UI framework | Already installed |
| Zustand | 5 | State (timeline, stream, connection stores) | Already installed |
| Lucide React | latest | Icons (Search, Download, RotateCcw, X) | Already installed |
| DOMPurify | latest | Sanitize thinking markdown HTML | Already installed |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| cn() | local | Conditional class merging | All new components |

### No New Dependencies
This phase adds ZERO new npm packages. All visual effects are source-level cherry-picks. Thinking markdown reuses DOMPurify already in the bundle. Export uses native browser APIs (Blob, URL.createObjectURL, anchor click).

## Architecture Patterns

### Recommended File Structure
```
src/src/
├── components/
│   ├── effects/
│   │   ├── SpotlightCard.tsx          # Hover radial gradient wrapper
│   │   ├── SpotlightCard.css          # CSS with design tokens
│   │   ├── ShinyText.tsx              # Shimmer text wrapper
│   │   ├── ShinyText.css              # @keyframes shine
│   │   ├── ElectricBorder.tsx         # Animated border wrapper
│   │   └── ElectricBorder.css         # @keyframes star-movement
│   ├── chat/
│   │   ├── view/
│   │   │   ├── ErrorMessage.tsx        # Modified: add retry button
│   │   │   ├── ThinkingDisclosure.tsx  # Modified: inline markdown
│   │   │   ├── ChatView.tsx            # Modified: search bar, export button
│   │   │   ├── MessageList.tsx         # Modified: search filtering
│   │   │   ├── SearchBar.tsx           # NEW: search input with keyboard shortcut
│   │   │   └── StatusLine.tsx          # Modified: ShinyText wrapper
│   │   ├── composer/
│   │   │   └── ChatComposer.tsx        # Modified: ElectricBorder wrapper
│   │   └── tools/
│   │       └── ToolCardShell.tsx        # Modified: SpotlightCard wrapper
│   └── sidebar/
│       └── SessionItem.tsx             # Modified: SpotlightCard wrapper
├── lib/
│   ├── thinking-markdown.ts            # NEW: inline-only markdown parser
│   └── export-conversation.ts          # NEW: Markdown + JSON export utilities
└── hooks/
    └── useMessageSearch.ts             # NEW: search state + filtering logic
```

### Pattern 1: CSS-Only Visual Effects (Cherry-Pick from React Bits)

**What:** Source-level copy of React Bits components, adapted to use OKLCH design tokens instead of hardcoded colors.

**SpotlightCard adaptation:**
```typescript
// Source: React Bits SpotlightCard-TS-CSS registry
// Adaptation: Replace hardcoded #111, #222, rgba() with design tokens

// SpotlightCard.css uses CSS custom properties:
// --mouse-x, --mouse-y (set by JS mousemove)
// --spotlight-color (design token, not hardcoded rgba)
// Background/border from design tokens (--surface-raised, --border-subtle)

// SpotlightCard.tsx: named export, uses useRef for mouse tracking
// Sets CSS custom properties via element.style.setProperty()
// No runtime dependencies beyond React
```

**ShinyText adaptation (CSS-only, NO Framer Motion):**
```typescript
// Source: React Bits ShinyText-TS-CSS registry (CSS portion only)
// The TS version uses Framer Motion (motion/react) -- BANNED by Constitution
// Use pure CSS @keyframes shine animation instead

// ShinyText.css:
// background: linear-gradient with design token colors
// background-clip: text for text-through effect
// @keyframes shine moves background-position

// ShinyText.tsx: simple wrapper that conditionally adds className
// Props: disabled (boolean), speed (CSS duration string)
// No runtime animation library
```

**ElectricBorder adaptation (StarBorder pattern, NOT Canvas):**
```typescript
// Source: React Bits StarBorder-TS-CSS registry
// The ElectricBorder component uses Canvas + Perlin noise -- too heavy
// StarBorder achieves animated gradient border with pure CSS
// Adapted to use design token colors and renamed to ElectricBorder

// Two pseudo-elements with radial-gradient backgrounds animate
// along top and bottom edges. CSS @keyframes for movement.
// Result: subtle orbiting glow, not dramatic electric arcs.
// Matches CONTEXT.md requirement: "soft animated gradient"
```

### Pattern 2: Inline Markdown Parser for Thinking Blocks

**What:** Lightweight regex parser that converts inline markdown to HTML. Subset of existing `streaming-markdown.ts` logic.

**Key difference from full markdown:** No block-level elements (no headings, lists, code fences, blockquotes). Only: `**bold**`, `*italic*`, `` `code` ``, `[links](url)`.

```typescript
// thinking-markdown.ts
// Reuse the processInlineFormatting() pattern from streaming-markdown.ts
// 1. Extract inline code spans (placeholder pattern)
// 2. Bold: **text** -> <strong>text</strong>
// 3. Italic: *text* -> <em>text</em>
// 4. Links: [text](url) -> <a href="url">text</a>
// 5. Restore inline code placeholders
// 6. Sanitize via DOMPurify (ALLOWED_TAGS: strong, em, code, a)
// Returns HTML string for dangerouslySetInnerHTML

// Code spans within thinking get a distinct background:
// .thinking-code { background: var(--surface-overlay); border-radius: 2px; padding: 0 4px; }
```

### Pattern 3: Search with Message Filtering

**What:** Search state managed by a custom hook, filtering applied in MessageList render.

```typescript
// useMessageSearch.ts hook provides:
// - query: string
// - setQuery: (q: string) => void
// - isOpen: boolean
// - open/close/toggle: () => void
// - filterMessages(messages: Message[]): Message[]
// - highlightText(text: string): ReactNode (wraps matches in <mark>)

// ChatView passes searchQuery down to MessageList
// MessageList filters messages before mapping
// Zero-results state: centered muted message

// Keyboard: useEffect on document keydown
// Cmd+F / Ctrl+F -> preventDefault + open search
// Escape -> close search (if open)
```

### Pattern 4: Conversation Export

**What:** Pure utility functions that serialize messages to downloadable files.

```typescript
// export-conversation.ts
// exportAsMarkdown(messages, sessionTitle): void
// exportAsJSON(messages, session): void

// Both use:
// const blob = new Blob([content], { type: 'text/markdown' });
// const url = URL.createObjectURL(blob);
// const a = document.createElement('a');
// a.href = url; a.download = filename;
// a.click();
// URL.revokeObjectURL(url);

// Filename: slugify(title)-YYYY-MM-DD.md|json
```

### Anti-Patterns to Avoid
- **Canvas for subtle effects:** ElectricBorder's original Canvas + Perlin noise is 200+ lines of imperative rendering for a "subtle glow." Use CSS gradients instead.
- **Framer Motion for text shimmer:** ShinyText's TS version imports `motion/react` (full Framer bundle). Constitution bans this. CSS `@keyframes` achieves the same visual.
- **Full markdown parser for thinking:** react-markdown + remark-gfm is massive overkill for inline bold/italic/code. Regex handles this in ~30 lines.
- **Search with scroll-to-match:** CONTEXT.md explicitly chose filter mode over highlight-and-navigate. Don't build scroll-to-match.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTML sanitization | Custom tag stripping | DOMPurify (already installed) | XSS vectors in AI-generated thinking content |
| File download | Manual download logic | Blob + URL.createObjectURL | Browser-native, handles encoding correctly |
| Class merging | String concatenation | cn() (already available) | Handles conditional classes, deduplicates Tailwind |
| Relative time | Custom date math | formatRelativeTime (already exists) | Edge cases with timezones, locale |

## Common Pitfalls

### Pitfall 1: Hardcoded Colors in Cherry-Picked Components
**What goes wrong:** React Bits components use hardcoded hex/rgba. ESLint no-hardcoded-colors rule will fail.
**Why it happens:** Direct copy-paste without adaptation.
**How to avoid:** Replace every color value with CSS custom property references. SpotlightCard: `--surface-raised` for bg, `--border-subtle` for border, `--accent-primary` for spotlight color. ShinyText: `--text-muted` for base, `--accent-primary` for shine. ElectricBorder: `--accent-primary` for gradient.
**Warning signs:** ESLint errors on `#111`, `#222`, `rgba(...)` in CSS/TSX files.

### Pitfall 2: ShinyText Using Framer Motion
**What goes wrong:** The React Bits ShinyText TypeScript variant imports `motion/react` for animation control.
**Why it happens:** Copy-pasting the .tsx file without checking dependencies.
**How to avoid:** Use the CSS-only animation approach. The CSS `@keyframes shine` with `background-position` animation achieves identical visual without any JS animation library. The React component is just a span with a conditional className.
**Warning signs:** Import of `motion`, `useMotionValue`, `useAnimationFrame` from `motion/react`.

### Pitfall 3: ElectricBorder Canvas Performance
**What goes wrong:** Full ElectricBorder runs a Canvas animation loop with Perlin noise -- 200+ LOC, continuous rAF, GPU cost on every frame.
**Why it happens:** Direct cherry-pick of ElectricBorder instead of StarBorder.
**How to avoid:** Use StarBorder's CSS gradient approach. Two `radial-gradient` pseudo-elements with CSS `@keyframes` animation. Zero JS animation, zero Canvas, GPU-composited via `transform` and `opacity`.
**Warning signs:** `<canvas>` element, `requestAnimationFrame` loop, noise functions in component code.

### Pitfall 4: Search Keyboard Shortcut Conflict
**What goes wrong:** `Cmd+F` preventDefault blocks browser find entirely, even when search is closed.
**Why it happens:** Global keydown listener without proper lifecycle.
**How to avoid:** Only preventDefault when search is being opened or is already open. When search closes (Escape), remove the listener or let events pass through. Test: close search, press Cmd+F, browser find should open.
**Warning signs:** Browser find never opens, even when chat search is closed.

### Pitfall 5: Retry With No Session Context
**What goes wrong:** Retry button sends message but there's no session ID or project name available.
**Why it happens:** ErrorMessage rendered without access to session/project context.
**How to avoid:** Pass sessionId and projectName as props to ErrorMessage (or use context). Also pass the last user message content. Retry button hidden when no prior user message exists.
**Warning signs:** wsClient.send() called with null sessionId, backend rejects.

### Pitfall 6: Export Missing Thinking/Tool Data
**What goes wrong:** Markdown export includes raw tool call JSON or forgets to summarize tools.
**Why it happens:** Iterating message.content without checking toolCalls/thinkingBlocks arrays.
**How to avoid:** For Markdown: summarize each tool call as one line ("Read: src/file.ts"). For JSON: include full data. Exclude image binary data from both.
**Warning signs:** 50KB+ Markdown files from tool-heavy sessions.

### Pitfall 7: dangerouslySetInnerHTML in Thinking Without Sanitization
**What goes wrong:** XSS via AI-generated thinking content that contains `<script>` or event handlers.
**Why it happens:** Skipping DOMPurify on the thinking markdown output.
**How to avoid:** Always sanitize through DOMPurify with strict ALLOWED_TAGS (strong, em, code, a only). Same pattern as streaming-markdown.ts.
**Warning signs:** Inline event handlers or script tags rendering in thinking blocks.

## Code Examples

### SpotlightCard (Adapted for Design Tokens)
```css
/* SpotlightCard.css -- design tokens only */
.spotlight-card {
  position: relative;
  overflow: hidden;
  --mouse-x: 50%;
  --mouse-y: 50%;
  --spotlight-color: oklch(from var(--accent-primary) l c h / 0.08);
}

.spotlight-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(
    circle at var(--mouse-x) var(--mouse-y),
    var(--spotlight-color),
    transparent 80%
  );
  opacity: 0;
  transition: opacity var(--duration-normal) var(--ease-out);
  pointer-events: none;
}

.spotlight-card:hover::before {
  opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
  .spotlight-card::before {
    display: none;
  }
}
```

```typescript
// SpotlightCard.tsx
import { useRef, type MouseEvent, type ReactNode } from 'react';
import { cn } from '@/utils/cn';
import './SpotlightCard.css';

interface SpotlightCardProps {
  children: ReactNode;
  className?: string;
}

export function SpotlightCard({ children, className }: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    ref.current.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
    ref.current.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
  };

  return (
    <div ref={ref} onMouseMove={handleMouseMove} className={cn('spotlight-card', className)}>
      {children}
    </div>
  );
}
```

### ShinyText (CSS-Only, No Framer Motion)
```css
/* ShinyText.css -- CSS-only shimmer */
.shiny-text {
  display: inline-block;
  background: linear-gradient(
    120deg,
    var(--text-muted) 40%,
    var(--accent-primary) 50%,
    var(--text-muted) 60%
  );
  background-size: 200% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: shiny-sweep 3s linear infinite;
}

@keyframes shiny-sweep {
  0% { background-position: 100% center; }
  100% { background-position: -100% center; }
}

@media (prefers-reduced-motion: reduce) {
  .shiny-text {
    animation: none;
    -webkit-text-fill-color: unset;
    background: none;
    color: var(--text-muted);
  }
}
```

### ElectricBorder (StarBorder CSS Pattern)
```css
/* ElectricBorder.css -- CSS gradient animation */
.electric-border {
  position: relative;
  overflow: hidden;
  border-radius: 0.75rem;
}

.electric-border-gradient-top,
.electric-border-gradient-bottom {
  position: absolute;
  width: 300%;
  height: 50%;
  opacity: 0;
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
  transition: opacity var(--duration-normal) var(--ease-out);
}

.electric-border[data-active="true"] .electric-border-gradient-top,
.electric-border[data-active="true"] .electric-border-gradient-bottom {
  opacity: 0.5;
}

.electric-border-gradient-top {
  top: -10px;
  left: -250%;
  background: radial-gradient(circle, var(--accent-primary), transparent 10%);
  animation: electric-top 4s linear infinite alternate;
}

.electric-border-gradient-bottom {
  bottom: -11px;
  right: -250%;
  background: radial-gradient(circle, var(--accent-primary), transparent 10%);
  animation: electric-bottom 4s linear infinite alternate;
}

@keyframes electric-top {
  0% { transform: translateX(0%); opacity: 0.5; }
  100% { transform: translateX(100%); opacity: 0; }
}

@keyframes electric-bottom {
  0% { transform: translateX(0%); opacity: 0.5; }
  100% { transform: translateX(-100%); opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .electric-border-gradient-top,
  .electric-border-gradient-bottom {
    display: none;
  }
}
```

### Thinking Inline Markdown Parser
```typescript
// thinking-markdown.ts
import DOMPurify from 'dompurify';

const THINKING_ALLOWED_TAGS = ['strong', 'em', 'code', 'a'];
const THINKING_ALLOWED_ATTR = ['href', 'target', 'rel', 'class'];

export function parseThinkingMarkdown(text: string): string {
  if (!text) return '';
  let html = escapeHtml(text);

  // Extract inline code first (prevent false matches inside code)
  const codes: string[] = [];
  html = html.replace(/`([^`]+)`/g, (_, code: string) => {
    codes.push(code);
    return `\x00CODE${codes.length - 1}\x00`;
  });

  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');

  // Italic
  html = html.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
  html = html.replace(/(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/g, '<em>$1</em>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  // Restore inline code
  html = html.replace(/\x00CODE(\d+)\x00/g, (_, i: string) =>
    `<code class="thinking-code">${codes[Number(i)]}</code>`);

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: THINKING_ALLOWED_TAGS,
    ALLOWED_ATTR: THINKING_ALLOWED_ATTR,
  });
}
```

### Error Retry Integration
```typescript
// Inside ErrorMessage.tsx -- needs sessionId, projectName, messages context
// Find last user message before this error:
const lastUserMsg = messages
  .slice(0, messages.indexOf(message))
  .reverse()
  .find(m => m.role === 'user');

// Retry sends via WebSocket:
wsClient.send({
  type: 'claude-command',
  command: lastUserMsg.content,
  options: { projectPath: projectName, sessionId },
});
```

### File Download Pattern
```typescript
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Framer Motion for text effects | CSS @keyframes + background-clip | Always available | Zero bundle cost |
| Canvas for border effects | CSS gradient animation | CSS has been sufficient since 2020 | No rAF loop, GPU-composited |
| react-markdown for inline formatting | Regex + DOMPurify | When full MD is overkill | ~30 LOC vs ~50KB bundle |
| window.open for downloads | Blob + URL.createObjectURL | Modern browsers | Works offline, correct encoding |

## Open Questions

1. **ElectricBorder intensity tuning**
   - What we know: StarBorder CSS pattern works for animated gradient borders
   - What's unclear: Exact opacity/speed values that look "subtle but alive" on the composer
   - Recommendation: Start with opacity 0.4, speed 4s, tune visually. Easy to adjust CSS custom properties.

2. **Search debounce vs instant filter**
   - What we know: CONTEXT.md leaves this to Claude's discretion
   - Recommendation: 150ms debounce via setTimeout. Instant feels snappy on small lists but causes visible flicker on 100+ messages. 150ms is imperceptible typing delay but prevents re-render storms.

3. **Search highlight implementation**
   - What we know: Need to highlight matching text within message content
   - Recommendation: Use `<mark>` element with `bg-primary/20` class. `<mark>` is semantic HTML for search highlights. Split text around matches and wrap in mark elements as React nodes.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest + @testing-library/react |
| Config file | `src/vite.config.ts` (test section) |
| Quick run command | `cd src && npx vitest run --reporter=verbose` |
| Full suite command | `cd src && npx vitest run --coverage` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| UI-04 | SpotlightCard renders, mouse tracking sets CSS vars | unit | `cd src && npx vitest run src/components/effects/SpotlightCard.test.tsx -x` | Wave 0 |
| UI-04 | ShinyText renders with animation class, disabled prop removes it | unit | `cd src && npx vitest run src/components/effects/ShinyText.test.tsx -x` | Wave 0 |
| UI-04 | ElectricBorder shows gradient elements when active | unit | `cd src && npx vitest run src/components/effects/ElectricBorder.test.tsx -x` | Wave 0 |
| UI-05 | No hardcoded colors in effect CSS/TSX files | lint | `cd src && npx eslint src/components/effects/` | N/A (ESLint) |
| ENH-03 | Thinking markdown parses bold, italic, code, links | unit | `cd src && npx vitest run src/lib/thinking-markdown.test.ts -x` | Wave 0 |
| ENH-03 | ThinkingDisclosure renders inline HTML from blocks | unit | `cd src && npx vitest run src/components/chat/view/ThinkingDisclosure.test.tsx -x` | Wave 0 |
| ENH-04 | ErrorMessage shows retry button, hidden when no prior user message | unit | `cd src && npx vitest run src/components/chat/view/ErrorMessage.test.tsx -x` | Exists (extend) |
| ENH-05 | useMessageSearch filters messages by substring | unit | `cd src && npx vitest run src/hooks/useMessageSearch.test.ts -x` | Wave 0 |
| ENH-05 | SearchBar opens on Cmd+F, closes on Escape | unit | `cd src && npx vitest run src/components/chat/view/SearchBar.test.tsx -x` | Wave 0 |
| ENH-06 | exportAsMarkdown produces valid MD with tool summaries | unit | `cd src && npx vitest run src/lib/export-conversation.test.ts -x` | Wave 0 |
| ENH-06 | exportAsJSON produces valid JSON with full metadata | unit | `cd src && npx vitest run src/lib/export-conversation.test.ts -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `cd src && npx vitest run --reporter=verbose`
- **Per wave merge:** `cd src && npx vitest run --coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/src/components/effects/SpotlightCard.test.tsx` -- covers UI-04
- [ ] `src/src/components/effects/ShinyText.test.tsx` -- covers UI-04
- [ ] `src/src/components/effects/ElectricBorder.test.tsx` -- covers UI-04
- [ ] `src/src/lib/thinking-markdown.test.ts` -- covers ENH-03
- [ ] `src/src/components/chat/view/ThinkingDisclosure.test.tsx` -- covers ENH-03 (new tests)
- [ ] `src/src/hooks/useMessageSearch.test.ts` -- covers ENH-05
- [ ] `src/src/components/chat/view/SearchBar.test.tsx` -- covers ENH-05
- [ ] `src/src/lib/export-conversation.test.ts` -- covers ENH-06
- [ ] Extend `src/src/components/chat/view/ErrorMessage.test.tsx` -- covers ENH-04

## Sources

### Primary (HIGH confidence)
- React Bits GitHub registry JSONs (`SpotlightCard-TS-CSS.json`, `ShinyText-TS-CSS.json`, `StarBorder-TS-CSS.json`, `ElectricBorder-TS-CSS.json`) -- full source code extracted and analyzed
- Existing codebase: `streaming-markdown.ts`, `ErrorMessage.tsx`, `ThinkingDisclosure.tsx`, `ChatView.tsx`, `MessageList.tsx`, `ChatComposer.tsx`, `ToolCardShell.tsx`, `SessionItem.tsx` -- all integration points verified

### Secondary (MEDIUM confidence)
- [React Bits website](https://reactbits.dev/) -- component documentation and demos
- [React Bits GitHub](https://github.com/DavidHDev/react-bits) -- repository structure

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, all patterns reuse existing code
- Architecture: HIGH -- integration points verified in existing components
- Visual effects: HIGH -- source code extracted and analyzed, adaptation strategy clear
- Pitfalls: HIGH -- common issues (hardcoded colors, Framer Motion import, Canvas overhead) identified from source analysis

**Research date:** 2026-03-09
**Valid until:** 2026-04-09 (stable -- no external dependencies changing)
