# Architecture Patterns: M2 "The Chat" Integration

**Domain:** AI chat interface — streaming markdown, syntax highlighting, composer, tool state machines, activity status
**Researched:** 2026-03-07
**Confidence:** HIGH (based on existing M1 source code analysis + verified library research)

---

## Recommended Architecture

M2 builds on top of M1's proven architecture. The core insight: the existing segment array in ActiveMessage, rAF buffer in useStreamBuffer, and multiplexer callback injection are solid foundations that need **extension**, not replacement. The five M2 features slot into the existing data flow at specific, well-defined integration points.

### Data Flow Overview

```
WebSocket -> stream-multiplexer (pure fns) -> callbacks -> stores/refs
                                                            |
                     +--------------------------------------+
                     |                    |                  |
              StreamStore           useStreamBuffer     TimelineStore
           (tool states,         (rAF DOM mutation,    (finalized
            thinking,             buffer accumulation,  messages with
            activity text)        checkpoint/flush)     parsed content)
                     |                    |                  |
              ToolChip/Card         ActiveMessage       AssistantMessage
              ActivityStatus     (segment array)         (Markdown +
                                                         Shiki blocks)
```

**What changes in M2:**
1. ActiveMessage text spans gain streaming markdown parsing (not raw textContent)
2. AssistantMessage renders markdown with Shiki code blocks (finalized messages)
3. ToolChip gains state machine CSS animations (invoked -> executing -> resolved/rejected)
4. ChatComposer becomes a textarea with auto-resize, image paste, send/stop morph
5. ActivityStatus reads `activityText` from StreamStore (already populated by multiplexer)

---

## Integration Points: What Changes, What Stays

### 1. Streaming Markdown (ActiveMessage modification)

**Current state:** `useStreamBuffer` paints raw text to `span.textContent` via rAF. This bypasses React entirely, which is fast but means zero formatting during streaming.

**M2 change:** Replace raw `textContent` painting with incremental markdown parsing.

**Architecture decision: Two-phase rendering**

- **Phase A (streaming):** Parse accumulated buffer text through a lightweight streaming markdown parser on each rAF frame. Use `innerHTML` instead of `textContent` to support basic formatting (bold, italic, inline code, paragraphs). Full Shiki highlighting is deferred.
- **Phase B (finalized):** On flush, the complete text is parsed through react-markdown + Shiki for full-fidelity rendering in AssistantMessage.

**Why two phases instead of one:**
- Shiki language grammar loading is async and cannot block the rAF loop
- Full react-markdown parsing at 60fps on every frame is too expensive
- Streaming markdown needs to handle unclosed tags gracefully (incomplete `**bold` mid-stream)

**Implementation approach:**

```typescript
// In useStreamBuffer.ts rAF paint callback:
// Instead of: node.textContent = buffer.slice(offset)
// Do: node.innerHTML = streamingMarkdownToHtml(buffer.slice(offset))

// streamingMarkdownToHtml is a lightweight function that handles:
// - **bold** / *italic* / `inline code` / ### headings
// - Paragraph breaks (double newline)
// - Code fence detection (``` opens a <pre><code> block, even unclosed)
// - Does NOT do: Shiki highlighting, tables, complex GFM
```

**Library choice: Custom lightweight parser, NOT react-markdown during streaming.**

Rationale: react-markdown creates a React element tree, which requires reconciliation. During streaming at 100 tokens/sec, we need DOM mutation speed. A pure function (200-300 lines) converts markdown to HTML strings for innerHTML. Full react-markdown runs only on finalized messages.

For the streaming parser, use [streamdown](https://streamdown.ai/) concepts but implement a minimal version ourselves. Streamdown is a full React component with its own rendering pipeline -- too heavy for our rAF-driven architecture. We need a pure function: `string -> HTML string`.

**Files affected:**
- `src/src/hooks/useStreamBuffer.ts` -- Paint via innerHTML, not textContent
- NEW: `src/src/lib/streaming-markdown.ts` -- Lightweight markdown-to-HTML pure function
- `src/src/components/chat/view/ActiveMessage.tsx` -- Sanitize innerHTML output

**Store changes:** None. The buffer accumulation stays in useRef. The StreamStore is unaffected.

### 2. Shiki Syntax Highlighting (AssistantMessage + new components)

**When it runs:** Only on finalized messages (after flush to TimelineStore). Never during streaming.

**Architecture:**

```
AssistantMessage
  -> MarkdownRenderer (new component, wraps react-markdown)
    -> CodeBlock (new component, custom renderer for fenced code)
      -> useShikiHighlighter (new hook, lazy loads Shiki + language)
        -> ShikiHighlighter singleton (new lib module, one instance)
```

**Key design decisions:**

1. **Single Shiki highlighter instance** via module-level singleton. Creating highlighters is expensive (WASM init). Load once, reuse everywhere.

2. **Lazy language loading.** Shiki loads language grammars on-demand. The CodeBlock component shows plain monospaced text while the grammar loads, then re-renders with highlighting. No layout shift because the container dimensions stay stable.

3. **useDeferredValue on highlighted output.** Per Constitution 10.4, the raw text renders immediately while Shiki processing catches up. This prevents blocking the main thread during session switches with many code blocks.

4. **Theme from design tokens.** Create a custom Shiki theme that maps to OKLCH CSS variables. The theme file lives alongside tokens.css.

**New files:**
- `src/src/lib/shiki-highlighter.ts` -- Singleton highlighter, lazy language loading
- `src/src/components/chat/view/MarkdownRenderer.tsx` -- react-markdown wrapper with custom renderers
- `src/src/components/chat/view/CodeBlock.tsx` -- Code block with Shiki, copy button, language label
- `src/src/hooks/useShikiHighlighter.ts` -- Hook wrapping async highlight call with loading state
- `src/src/styles/code-block.css` -- Code block header, copy button, syntax theme overrides

**Modified files:**
- `src/src/components/chat/view/AssistantMessage.tsx` -- Replace raw text div with MarkdownRenderer

**Store changes:** None. Shiki is view-layer only.

### 3. Tool State Machine Animations (ToolChip modification)

**Current state:** ToolChip has CSS classes `tool-chip--invoked`, `--executing`, `--resolved`, `--rejected` but they only change colors. The status dot pulses for active states.

**M2 change:** Add CSS-driven state machine animations. Per Constitution Section 11 (Tier 1: CSS-only for transitions):

```
invoked (appear) -> executing (pulse + activity) -> resolved (check + fade to static)
                                                  -> rejected (X + error color)
```

**Architecture:**
- Stay in CSS Tier 1. No Framer Motion needed.
- Use CSS `@keyframes` for the pulse animation on executing state
- Use CSS `transition` for color/opacity changes between states
- The status dot already has per-status classes; extend with entrance/exit animations
- Add an expand/collapse animation for ToolCard using CSS Grid `grid-template-rows: 0fr/1fr`

**The state machine itself already exists in the multiplexer.** Tool calls transition:
1. `onToolUseStart` -> `invoked` (StreamStore.addToolCall)
2. `onToolProgress` -> `executing` (StreamStore.updateToolCall)
3. `onToolResult` -> `resolved` or `rejected` (StreamStore.updateToolCall)

The multiplexer correctly drives these transitions. M2 just needs better CSS for each state.

**New tool card content for M2:** The DefaultToolCard is a placeholder using createElement. M2 should add meaningful tool-specific cards:
- **Bash:** Show command, truncated output, exit status with color
- **Read/Edit/Write:** Show file path, line count, diff preview (for Edit)
- **Glob/Grep:** Show pattern, match count, file list

These are purely presentational. Register via `registerTool()` in tool-registry.ts -- the pluggable architecture handles this cleanly.

**Files affected:**
- `src/src/components/chat/tools/tool-chip.css` -- State transition animations
- `src/src/lib/tool-registry.ts` -- Enhanced per-tool renderCard components
- NEW: `src/src/components/chat/tools/cards/BashCard.tsx` -- Bash-specific card
- NEW: `src/src/components/chat/tools/cards/FileCard.tsx` -- Read/Edit/Write card
- NEW: `src/src/components/chat/tools/cards/SearchCard.tsx` -- Glob/Grep card

**Store changes:** None. The ToolCallState type already has all needed fields.

### 4. ChatComposer Upgrade (modification)

**Current state:** Single-line `<input>` with send/stop toggle. Functional but minimal.

**M2 target:** Auto-resize `<textarea>`, send/stop morph animation, image paste/upload.

**Architecture:**

```
ChatComposer
  -> useAutoResize (new hook) -- textarea height tracking
  -> ImageAttachmentBar (new component) -- preview strip for pasted/uploaded images
  -> SendStopButton (extracted sub-component) -- morph animation between states
```

**Key decisions:**

1. **Auto-resize textarea:** Use a hidden "mirror" div technique. Copy textarea value to a visually hidden div with identical styling. Read its scrollHeight. Set textarea height. This avoids layout thrashing from directly reading textarea.scrollHeight on every keystroke.

2. **Image paste:** Listen for `paste` event on textarea, extract `image/*` from clipboardData, convert to data URI, add to local state. On send, include in the `images` array of the `claude-command` WebSocket message (backend already supports `options.images` as `Array<{ data: string }>`).

3. **Image upload:** Hidden `<input type="file">` triggered by a button. Same flow as paste.

4. **Send/Stop morph:** CSS transition between two SVG icons with shared dimensions. Use `opacity` and `transform: scale` for the morph effect. The button already toggles between send/stop; M2 adds the animation.

5. **Shift+Enter for newline, Enter for send.** Already partially implemented in M1 (Enter sends). Add Shift+Enter detection in handleKeyDown.

6. **Max height cap:** Textarea grows up to ~200px (configurable via CSS var), then switches to internal scroll. Prevents the composer from consuming the entire viewport.

**Files affected:**
- `src/src/components/chat/composer/ChatComposer.tsx` -- Rewrite to textarea, add image handling
- NEW: `src/src/hooks/useAutoResize.ts` -- Textarea auto-resize hook
- NEW: `src/src/components/chat/composer/ImageAttachmentBar.tsx` -- Image preview strip
- NEW: `src/src/components/chat/composer/SendStopButton.tsx` -- Animated send/stop morph
- `src/src/components/chat/styles/chat-view.css` -- Composer styling updates

**Store changes:** None. The composer is self-contained with local state. It communicates via wsClient.send() (existing pattern).

**WebSocket contract:** The `claude-command` message already supports `options.images` as `Array<{ data: string }>`. No backend changes needed.

### 5. Activity Status Line (new component)

**Current state:** StreamStore already has `activityText` populated by the multiplexer via `getToolActivityText()`. It generates strings like "Reading auth.ts...", "Writing server.js...", "Running npm test...". Nothing reads this value in the UI yet.

**M2 change:** Add an ActivityStatusLine component that subscribes to `activityText` and renders it below the ActiveMessage or in the composer area.

**Architecture:**

```typescript
// ActivityStatusLine.tsx
export function ActivityStatusLine() {
  const activityText = useStreamStore(state => state.activityText);
  const isStreaming = useStreamStore(state => state.isStreaming);

  if (!isStreaming || !activityText) return null;

  return (
    <div className="activity-status" aria-live="polite">
      <span className="activity-status-dot" />
      <span className="activity-status-text">{activityText}</span>
    </div>
  );
}
```

This is the simplest M2 feature. The entire data pipeline already exists. It is purely a rendering component.

**Placement:** Below ActiveMessage, above ChatComposer. Visible during streaming. Keeps status visible while the user reads streaming content without conflicting with composer state.

**Files:**
- NEW: `src/src/components/chat/view/ActivityStatusLine.tsx`
- NEW: `src/src/components/chat/styles/activity-status.css`
- `src/src/components/chat/view/ChatView.tsx` -- Mount ActivityStatusLine between MessageList and ChatComposer

**Store changes:** None. Already wired.

---

## Component Boundaries

### New Components

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `MarkdownRenderer` | Wraps react-markdown with custom renderers (code, table, link) | AssistantMessage (parent), CodeBlock (child) |
| `CodeBlock` | Fenced code with Shiki highlighting, language label, copy button | MarkdownRenderer (parent), useShikiHighlighter (hook) |
| `ActivityStatusLine` | Reads StreamStore.activityText, renders pulse + text | StreamStore (subscription) |
| `ImageAttachmentBar` | Previews pasted/uploaded images before send | ChatComposer (parent, via props) |
| `SendStopButton` | Animated morph between send arrow and stop square | ChatComposer (parent, via props) |
| `BashCard` / `FileCard` / `SearchCard` | Tool-specific expanded card content | ToolChip (parent, via registry) |

### Modified Components

| Component | What Changes | Why |
|-----------|-------------|-----|
| `ActiveMessage` | Text spans use innerHTML with streaming markdown instead of textContent | Formatted streaming output |
| `AssistantMessage` | Replaces raw text div with MarkdownRenderer | Full markdown + Shiki on finalized messages |
| `ChatComposer` | Input -> textarea, add image handling, extract SendStopButton | Full composer functionality |
| `ToolChip` | Enhanced CSS transitions between states | Visual state machine |
| `ChatView` | Mount ActivityStatusLine | New component placement |

### New Hooks

| Hook | Purpose | Dependencies |
|------|---------|-------------|
| `useShikiHighlighter` | Async Shiki highlighting with loading state | shiki-highlighter singleton |
| `useAutoResize` | Textarea height tracking via mirror div | None (vanilla DOM) |

### New Lib Modules

| Module | Purpose | Dependencies |
|--------|---------|-------------|
| `streaming-markdown.ts` | Lightweight markdown-to-HTML for rAF loop | None (pure function) |
| `shiki-highlighter.ts` | Singleton Shiki instance, lazy language loading | shiki (npm) |

---

## Patterns to Follow

### Pattern 1: Two-Phase Rendering (Streaming Parse + Finalized Full-Parse)

**What:** During streaming, use a fast lightweight parser for basic formatting. On finalization, switch to the full react-markdown + Shiki pipeline.

**When:** Any content that needs both real-time rendering AND high-fidelity final output.

**Why this works with existing architecture:**
- The rAF loop in useStreamBuffer already paints to a DOM node. Changing from textContent to innerHTML is a minimal change.
- The flush callback already creates a Message object with the full text. That text feeds into AssistantMessage's MarkdownRenderer.
- No store changes needed -- the two-phase boundary is the flush event.

```typescript
// streaming-markdown.ts -- pure function, no React, no async
export function streamingMarkdownToHtml(text: string): string {
  // Handle: **bold**, *italic*, `code`, ### headings, \n\n paragraphs
  // Handle unclosed: incomplete **bold stays as **, code fence opens <pre>
  // Sanitize: escape < > & in non-code content
  // Return: HTML string safe for innerHTML
}
```

### Pattern 2: Lazy Singleton for Heavy Libraries

**What:** Module-level singleton pattern for expensive-to-create instances (Shiki highlighter).

**When:** A library requires one-time initialization (WASM loading, grammar compilation) that should not repeat per-component.

```typescript
// shiki-highlighter.ts
import type { Highlighter } from 'shiki';

let highlighterPromise: Promise<Highlighter> | null = null;

export function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = import('shiki').then(({ createHighlighter }) =>
      createHighlighter({
        themes: ['loom-dark'], // custom theme
        langs: [], // load on demand
      })
    );
  }
  return highlighterPromise;
}

export async function highlightCode(code: string, lang: string): Promise<string> {
  const h = await getHighlighter();
  const loadedLangs = h.getLoadedLanguages();
  if (!loadedLangs.includes(lang)) {
    await h.loadLanguage(lang as any);
  }
  return h.codeToHtml(code, { lang, theme: 'loom-dark' });
}
```

### Pattern 3: Registry Extension for Tool Cards

**What:** New tool-specific cards register via the existing `registerTool()` API. No switch statements, no if/else chains.

**When:** Adding visual customization for specific tool types.

```typescript
// In BashCard.tsx -- self-registers at module scope
import { registerTool } from '@/lib/tool-registry';

function BashCard({ input, output, isError, status }: ToolCardProps) {
  // Rich card with command display, output preview, exit status
}

registerTool('Bash', {
  displayName: 'Bash',
  icon: BashIcon,
  getChipLabel: bashChipLabel,
  renderCard: BashCard, // replaces DefaultToolCard
});
```

**Important:** Tool card modules must be imported at app startup to trigger self-registration. Add an import in the app initialization module or create a `tool-cards/index.ts` that imports all card modules.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: react-markdown in the rAF Loop

**What:** Running react-markdown or any React rendering library inside the requestAnimationFrame paint callback.

**Why bad:** react-markdown creates a React element tree that requires reconciliation. At 60fps, this would cause 60 full React reconciliation cycles per second, competing with the streaming buffer. The whole point of the rAF architecture is to bypass React.

**Instead:** Use a pure function that converts markdown to HTML strings. Set via innerHTML. React only enters the picture on finalization.

### Anti-Pattern 2: Shiki During Streaming

**What:** Attempting to syntax-highlight code blocks in real-time as tokens arrive.

**Why bad:** Shiki language grammar loading is async. If a code block starts streaming, the grammar may not be loaded yet. Even if loaded, highlighting a partial code block produces incorrect tokens because the parser lacks context about what comes next. Highlighting a 50-line code block at 100 tokens/sec means re-highlighting every ~10ms.

**Instead:** During streaming, render code in a `<pre><code>` with monospace font and surface-base background. After finalization, Shiki highlights the complete block. The [shiki-stream](https://github.com/antfu/shiki-stream) library exists for streaming highlighting but adds complexity we do not need -- our two-phase approach is simpler and the visual difference (un-highlighted code for a few seconds during streaming) is acceptable.

### Anti-Pattern 3: Global Markdown State in Stores

**What:** Storing parsed markdown ASTs or highlighted HTML in Zustand stores.

**Why bad:** Markdown rendering is a view concern. Storing ASTs in the store creates coupling between the rendering strategy and the persistence layer. It also bloats the store with derived data.

**Instead:** Store raw content strings in TimelineStore. Components derive the rendered output. Use React.memo and useDeferredValue to prevent re-parsing.

### Anti-Pattern 4: Per-Token Store Updates for Activity Text

**What:** Dispatching a Zustand action for every token to update activity status.

**Why bad:** Activity text only needs to change when a new tool call starts (a few times per response). Updating it per-token would create unnecessary re-renders of ActivityStatusLine.

**Instead:** The multiplexer already updates activityText only on tool_use_start and tool_progress events (not on content tokens). This is correct. Do not change it.

### Anti-Pattern 5: Image Data URIs in Store

**What:** Persisting base64 image data URIs in the TimelineStore for attached images.

**Why bad:** A single pasted screenshot is ~500KB-2MB of base64 text. Storing in Zustand means serialization/deserialization overhead on every persist cycle. Multiple images per message compounds this.

**Instead:** Keep images in local component state (ChatComposer) until send. The WebSocket message transmits them to the backend. For displaying sent images in history, use the backend's stored image reference or a blob URL.

---

## Scalability Considerations

| Concern | M2 (current) | M3 (polish) | M4 (multi-provider) |
|---------|--------------|-------------|----------------------|
| Message count | content-visibility: auto | Evaluate virtual scrolling if needed | Same, per-tab |
| Shiki memory | Single highlighter, lazy langs | Prune unused lang grammars after 5min idle | Shared highlighter across tabs |
| Streaming perf | rAF + innerHTML | Profile, optimize streaming-markdown parser | Parallel streams, multiplexer already supports |
| Image attachments | Data URIs in local state only | Consider blob URLs for large images | Same |
| Tool cards | 6 built-in cards | Community/MCP tool cards via registry | Registry shared, new tools self-register |

---

## Suggested Build Order

The dependency chain determines the build order. Features that other features depend on must come first.

```
Phase 1: Streaming Markdown + MarkdownRenderer
  |- streaming-markdown.ts (pure function, no deps)
  |- Modify useStreamBuffer to use innerHTML
  |- MarkdownRenderer component (react-markdown wrapper)
  |- Modify AssistantMessage to use MarkdownRenderer
  |- Both streaming AND finalized messages now show formatted text

Phase 2: Shiki Code Blocks
  |- shiki-highlighter.ts (singleton)
  |- useShikiHighlighter hook
  |- CodeBlock component (language label, copy button, Shiki rendering)
  |- Register CodeBlock as custom renderer in MarkdownRenderer
  |- Depends on: Phase 1 (MarkdownRenderer exists)

Phase 3: Composer Upgrade
  |- useAutoResize hook
  |- ChatComposer rewrite (input -> textarea)
  |- ImageAttachmentBar component
  |- SendStopButton component
  |- Independent of Phases 1-2 (could be parallel)

Phase 4: Tool State Machine + Enhanced Cards
  |- tool-chip.css state transition animations
  |- BashCard, FileCard, SearchCard components
  |- Register enhanced cards in tool-registry
  |- Independent of Phases 1-3 (could be parallel)

Phase 5: Activity Status Line
  |- ActivityStatusLine component
  |- Mount in ChatView
  |- Trivial -- everything already wired in StreamStore
  |- Independent (could be any phase)
```

**Parallelization opportunities:**
- Phases 3, 4, 5 are completely independent of each other and of Phases 1-2
- Phase 2 depends on Phase 1 (needs MarkdownRenderer to register CodeBlock renderer)
- Phases 1+2 are the critical path for the "formatted chat" experience

**Recommended grouping for GSD phases:**
1. **Phase A: Formatted Messages** -- streaming-markdown, MarkdownRenderer, CodeBlock + Shiki (build order phases 1+2)
2. **Phase B: Composer + Interactions** -- ChatComposer upgrade, tool state animations, activity status (build order phases 3+4+5)

This gives two roughly equal-sized phases, where Phase A delivers the visual upgrade and Phase B delivers the interaction upgrade.

---

## Sources

- Existing M1 source code -- primary source, fully verified (HIGH confidence)
  - `src/src/hooks/useStreamBuffer.ts` -- rAF buffer with checkpoint/flush
  - `src/src/stores/stream.ts` -- StreamStore with tool call state, activity text
  - `src/src/stores/timeline.ts` -- TimelineStore with sessions and messages
  - `src/src/lib/stream-multiplexer.ts` -- Pure function message routing
  - `src/src/lib/tool-registry.ts` -- Map-based pluggable registry
  - `src/src/components/chat/view/ActiveMessage.tsx` -- Segment array architecture
  - `src/src/components/chat/view/AssistantMessage.tsx` -- Raw text (no markdown yet)
  - `src/src/components/chat/composer/ChatComposer.tsx` -- Minimal input stub
  - `src/src/lib/websocket-init.ts` -- Callback wiring
- [shiki-stream](https://github.com/antfu/shiki-stream) -- Streaming Shiki for LLM outputs (evaluated, not recommended for our architecture)
- [react-shiki](https://github.com/AVGVSTVS96/react-shiki) -- React Shiki component with streaming support
- [Streamdown](https://streamdown.ai/docs) -- React streaming markdown component (concepts referenced)
- [Shiki documentation](https://shiki.style/) -- Official docs for lazy loading and custom themes
- `.planning/V2_CONSTITUTION.md` Section 12 -- Markdown & Rendering requirements
- `.planning/BACKEND_API_CONTRACT.md` -- WebSocket message types, image upload support
- `.planning/MILESTONES.md` -- M2 deliverables and gate criteria

---

*Architecture research for: Loom V2 M2 "The Chat" milestone*
*Researched: 2026-03-07*
