# Phase 5: Chat Message Architecture - Research

**Researched:** 2026-03-02
**Domain:** Chat message rendering, syntax highlighting, collapsible UI, streaming performance
**Confidence:** HIGH

## Summary

Phase 5 transforms the flat `ChatMessage[]` rendering pipeline into a structured, collapsible, premium chat experience. The primary technical challenges are: (1) migrating from react-syntax-highlighter/Prism to Shiki v4 for VS Code-quality highlighting, (2) introducing a TurnBlock grouping layer between `ChatMessagesPane` and `MessageComponent`, (3) building compact tool call cards with two-level grouping, (4) replacing the basic `AssistantThinkingIndicator` with a Claude CLI-style activity indicator + Claude.ai-style thinking disclosure, and (5) upgrading the streaming buffer from `setTimeout(100ms)` to `requestAnimationFrame` batching.

The existing codebase has strong foundations: `ToolRenderer` with `getToolConfig()` already routes tools to `OneLineDisplay`/`CollapsibleDisplay`, `CollapsibleSection` provides reusable disclosure primitives, `showThinking` preference already flows through the component tree, and the `useChatRealtimeHandlers` hook centralizes all WebSocket message processing. The main architectural addition is the TurnBlock concept -- messages are currently flat with no turn boundary concept, so turn detection and grouping must be layered in.

**Primary recommendation:** Use Shiki v4 with `dark-plus` theme + `colorReplacements` for warm tinting, create a singleton highlighter module, introduce `TurnBlock` as a new grouping component wrapping sequences of assistant messages, and upgrade streaming to rAF batching in `useChatRealtimeHandlers`.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Turn blocks wrap AI responses only -- user messages remain standalone between turns
- Collapsed preview: first line of AI prose + tool call count badge (e.g., "3 tools")
- Previous turns auto-collapse when a new AI turn starts
- Active (streaming) turn is visually distinct -- highlighted border or different background to draw the eye
- Collapsed turns show duration (e.g., "took 45s")
- Failed tool calls show red accent on the badge (e.g., "5 tools - 2 failed")
- Expand/collapse all toolbar at the top of the chat area
- Compact single-line: icon + tool name + key argument (e.g., "Read src/auth/login.ts")
- Success/failure: green check / red X icon at right edge of card line
- Type-based subtle background tint (edit = faint blue, bash = faint gray, search = faint purple, etc.)
- Edit/Write cards show filename only on compact line (no line count)
- Bash tool uses same card style as other tools (no special terminal mini-block)
- Expanding a card reveals full arguments + result inline (not tabbed)
- 3+ consecutive tool calls grouped under mixed-type summary header (e.g., "Read 3 files, searched 2 patterns")
- Grouped cards: expanding group shows compact cards, each individually expandable (nested two-level hierarchy)
- Subagent (Task tool) containers keep their distinct visual treatment (SubagentContainer component)
- Completed thinking: Claude.ai-style simple disclosure triangle with muted "Thinking" text, collapsed by default
- Real-time thinking content: toggleable, off by default
- Toggle location: global setting in settings panel + per-block eye/toggle icon override
- Activity indicator: Claude CLI-style blinking amber/red text with rotating status phrases while working -- separate from the thinking disclosure block
- The activity indicator replaces the current basic pulsing dots AssistantThinkingIndicator
- Migrate from react-syntax-highlighter (Prism/oneDark) to Shiki v4
- Theme: warm-tinted Dark+ variant that matches Loom's aesthetic (warm-shifted backgrounds, adjusted token colors)
- No line numbers
- Header bar: language name (left) + filename when available from context (center) + copy button (right)
- Streaming fallback: raw monospace text while code block is incomplete, Shiki highlighting applied on block completion
- Soft word wrap for long lines (no horizontal scrolling)
- Long code blocks (50+ lines) truncated at ~25 lines with "Show more" button
- Inline code (backtick): Claude's discretion (keep simple styled spans recommended)

### Claude's Discretion
- Expand animation style (smooth height animation vs snap + scroll-to-top)
- Inline code treatment (simple spans vs Shiki)
- Exact tool-type color tint values
- Exact rotating status phrases for the activity indicator
- Shiki warm Dark+ token color adjustments

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CHAT-01 | Code blocks use Shiki v4 with VS Code Dark+ theme for syntax highlighting -- 99% VS Code token parity | Shiki v4.0.1 with `dark-plus` theme provides exact VS Code Dark+ TextMate grammar output. `colorReplacements` option enables warm tinting without custom theme files. |
| CHAT-02 | Code blocks display language label in header, copy-to-clipboard button with success state feedback | Custom wrapper component around Shiki HTML output. Existing `copyTextToClipboard` utility reusable. Header bar is a React wrapper, not a Shiki transformer. |
| CHAT-03 | Completed AI turns are collapsible -- first line of response text + count badge, click to expand full turn | New TurnBlock component groups consecutive assistant messages. Turn boundaries detected by user message insertion or `claude-complete`/`codex-complete` lifecycle events. |
| CHAT-04 | Tool call invocations render as compact inline action cards -- single-line showing tool name + key argument, expandable to show full arguments and nested result | Evolve existing `OneLineDisplay` + `CollapsibleDisplay` into unified `ToolActionCard`. Existing `getToolConfig()` system provides tool-specific getValue/display logic. |
| CHAT-05 | 3+ consecutive tool calls grouped under a typed summary header -- expandable to show each card individually | New `ToolCallGroup` component wraps sequences of 3+ consecutive `isToolUse` messages. Group header computes typed counts from `getToolCategory()`. |
| CHAT-06 | Tool cards with errors display red left border or red-tinted background with error message inline | Existing `toolResult.isError` field on ChatMessage provides error detection. Style via conditional CSS classes on card component. |
| CHAT-07 | Bash tool calls render in terminal-styled dark mini-blocks -- command shown monospace, output as pre-formatted text | CONTEXT.md overrides this: Bash uses SAME card style as other tools (no special terminal mini-block). The card gets a faint gray tint like other tool types. |
| CHAT-08 | Thinking blocks render as collapsed disclosure widgets -- clickable "Thinking..." bar, collapsed by default, expandable to show full reasoning with muted styling | Replace current `<details>` thinking block with dedicated `ThinkingDisclosure` component. Separate `ActivityIndicator` component with rotating phrases replaces `AssistantThinkingIndicator`. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| shiki | 4.0.1 | Syntax highlighting with VS Code TextMate grammars | Exact VS Code Dark+ parity, the `dark-plus` theme is bundled, `colorReplacements` enables warm tinting |
| react | 18.2.x | UI framework (existing) | Already installed, memo/useMemo patterns established |
| react-markdown | 10.1.x | Markdown rendering (existing) | Already installed, used by Markdown component -- Shiki replaces only the CodeBlock sub-component |
| lucide-react | 0.515.x | Icons (existing) | Already installed across 61 files -- use for tool card icons, disclosure triangles, copy buttons |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @shikijs/transformers | 4.0.1 | Line annotations, diff markers | Only if transformer-based features needed (likely not for this phase) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| shiki (full) | shiki/bundle/web | Web bundle is 3.8MB vs 6.4MB but may miss languages. Use web bundle + dynamic `loadLanguage()` for uncommon ones. |
| Oniguruma WASM engine | JavaScript RegExp engine | JS engine is lighter but needs ES2024 `v` flag; project targets ES2020. Use Oniguruma for maximum compat. |
| framer-motion | CSS transitions + native `<details>` | No animation library installed. CSS `transition: max-height` or `grid-template-rows: 0fr/1fr` trick handles disclosure. Avoid adding 30KB+ dependency for simple expand/collapse. |
| Custom turn grouping | No library needed | Pure React state derivation from existing flat `ChatMessage[]`. No library exists for this. |

**Installation:**
```bash
npm install shiki@^4.0.1
```

**Note:** Do NOT install framer-motion. CSS-only animations handle all expand/collapse needs. The STATE.md mention of `LazyMotion` is a deferred concern that no longer applies since we will use CSS transitions.

## Architecture Patterns

### Recommended Project Structure
```
src/components/chat/
  view/subcomponents/
    ChatMessagesPane.tsx          # Add TurnBlock grouping layer
    MessageComponent.tsx          # Slim down -- delegate to TurnBlock
    TurnBlock.tsx                 # NEW: groups assistant messages into collapsible turn
    ToolActionCard.tsx            # NEW: compact single-line card with expand
    ToolCallGroup.tsx             # NEW: groups 3+ consecutive tool calls
    ThinkingDisclosure.tsx        # NEW: Claude.ai-style thinking block
    ActivityIndicator.tsx         # NEW: Claude CLI-style rotating phrases
    CodeBlock.tsx                 # NEW: Shiki-powered code block with header
    Markdown.tsx                  # Modified: swap CodeBlock, keep markdown renderer
  hooks/
    useChatRealtimeHandlers.ts    # Modified: rAF streaming, turn ID assignment
    useShikiHighlighter.ts        # NEW: singleton Shiki instance management
    useTurnGrouping.ts            # NEW: derives turns from flat message array
```

### Pattern 1: Singleton Shiki Highlighter
**What:** Create a module-level promise for the Shiki highlighter, resolve once, reuse everywhere.
**When to use:** Any code block rendering.
**Example:**
```typescript
// src/components/chat/hooks/useShikiHighlighter.ts
import { createHighlighter, type Highlighter } from 'shiki/bundle/web'

let highlighterPromise: Promise<Highlighter> | null = null;

const WARM_DARK_PLUS_REPLACEMENTS: Record<string, string> = {
  '#1E1E1E': '#1c1210',  // background -> Loom base
  '#D4D4D4': '#f5e6d3',  // foreground -> Loom cream
  '#264F78': '#3d2e25',  // selection -> Loom surface 2
  // Additional token warm-shifts as needed
};

export function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ['dark-plus'],
      langs: ['javascript', 'typescript', 'python', 'json', 'html', 'css',
              'bash', 'markdown', 'jsx', 'tsx', 'rust', 'go', 'yaml', 'toml'],
    });
  }
  return highlighterPromise;
}

export function highlightCode(code: string, lang: string): Promise<string> {
  return getHighlighter().then(hl => {
    // Dynamically load language if not yet registered
    const loaded = hl.getLoadedLanguages();
    if (!loaded.includes(lang)) {
      // Fall through to 'text' for unknown languages
      lang = 'text';
    }
    return hl.codeToHtml(code, {
      lang,
      theme: 'dark-plus',
      colorReplacements: WARM_DARK_PLUS_REPLACEMENTS,
    });
  });
}
```

### Pattern 2: Turn Grouping from Flat Messages
**What:** Derive turn boundaries from the flat `ChatMessage[]` without mutating the data model.
**When to use:** In `ChatMessagesPane` or a dedicated `useTurnGrouping` hook.
**Example:**
```typescript
// src/components/chat/hooks/useTurnGrouping.ts
type Turn = {
  id: string;
  messages: ChatMessage[];
  startTime: Date;
  endTime?: Date;
  isStreaming: boolean;
  toolCallCount: number;
  failedToolCount: number;
  firstProseContent: string;
};

function groupMessagesIntoTurns(messages: ChatMessage[]): (ChatMessage | Turn)[] {
  const result: (ChatMessage | Turn)[] = [];
  let currentTurn: ChatMessage[] = [];

  for (const msg of messages) {
    if (msg.type === 'user') {
      // Flush current assistant turn
      if (currentTurn.length > 0) {
        result.push(buildTurn(currentTurn));
        currentTurn = [];
      }
      result.push(msg); // User messages stay standalone
    } else if (msg.type === 'assistant' || msg.type === 'tool') {
      currentTurn.push(msg);
    } else {
      // Error messages, etc. -- include in current turn or standalone
      if (currentTurn.length > 0) {
        currentTurn.push(msg);
      } else {
        result.push(msg);
      }
    }
  }
  // Flush trailing turn
  if (currentTurn.length > 0) {
    result.push(buildTurn(currentTurn));
  }
  return result;
}
```

### Pattern 3: requestAnimationFrame Streaming Buffer
**What:** Replace `setTimeout(100ms)` with rAF-based batching for smoother token rendering.
**When to use:** In `useChatRealtimeHandlers` for `content_block_delta` and `claude-output` handlers.
**Example:**
```typescript
// Replace in useChatRealtimeHandlers.ts
// OLD: streamTimerRef = window.setTimeout(() => { ... }, 100);
// NEW:
if (!streamTimerRef.current) {
  streamTimerRef.current = requestAnimationFrame(() => {
    const chunk = streamBufferRef.current;
    streamBufferRef.current = '';
    streamTimerRef.current = null;
    appendStreamingChunk(setChatMessages, chunk, false);
  }) as unknown as number;
}
```
**Note:** `requestAnimationFrame` fires at ~16ms (60fps) vs the current 100ms. This gives smoother visual updates. The `cancelAnimationFrame` replaces `clearTimeout` in cleanup paths.

### Pattern 4: Streaming-Safe Code Block
**What:** During streaming, code blocks are incomplete. Render as raw monospace until the closing fence arrives, then highlight with Shiki.
**When to use:** In the `CodeBlock` component within `Markdown.tsx`.
**Example:**
```typescript
// CodeBlock component (simplified)
function ShikiCodeBlock({ code, language, isStreaming }: Props) {
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    if (isStreaming) {
      setHtml(null); // Reset during streaming
      return;
    }
    // Only highlight completed blocks
    highlightCode(code, language).then(setHtml);
  }, [code, language, isStreaming]);

  if (!html) {
    // Fallback: raw monospace during streaming or before Shiki loads
    return (
      <pre className="bg-[#1c1210] rounded-lg p-4 overflow-x-hidden">
        <code className="text-[#f5e6d3] font-mono text-sm whitespace-pre-wrap">
          {code}
        </code>
      </pre>
    );
  }

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
```

### Pattern 5: CSS-Only Expand/Collapse Animation
**What:** Use the `grid-template-rows: 0fr/1fr` trick for smooth height transitions without framer-motion.
**When to use:** TurnBlock expand/collapse, ToolActionCard expand, ThinkingDisclosure expand.
**Example:**
```css
.collapsible-content {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 200ms ease-out;
}
.collapsible-content.expanded {
  grid-template-rows: 1fr;
}
.collapsible-content > div {
  overflow: hidden;
}
```
**Why:** This animates height from 0 to auto-height smoothly. Works in all modern browsers. No JS animation library needed.

### Anti-Patterns to Avoid
- **Creating Shiki instances per render:** Each `createHighlighter()` loads WASM + theme + grammars. MUST be a singleton.
- **Highlighting during streaming:** Shiki is async and incomplete code produces broken tokens. Always fall back to raw text during streaming.
- **Mutating ChatMessage objects:** The existing code clones messages (`{ ...last, content: nextContent }`). Continue this pattern in turn grouping -- derive, don't mutate.
- **Using `<details>` for animated disclosure:** Native `<details>` snaps open/close. For smooth animation, use controlled React state + CSS grid trick instead.
- **Adding framer-motion just for expand/collapse:** 30KB+ for something CSS handles natively. If complex orchestrated animations are needed later, revisit.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Syntax highlighting | Custom tokenizer | Shiki v4 with TextMate grammars | TextMate grammars are the same ones VS Code uses; 250+ languages, battle-tested |
| Language detection | Regex-based lang guessing | Shiki's `dark-plus` theme + explicit `language-*` class from react-markdown | react-markdown already extracts language from fenced code blocks |
| Icon rendering | SVG string templates | lucide-react (already installed) | 61 files already use it, consistent API, tree-shakable |
| Clipboard operations | Custom clipboard API wrapper | `copyTextToClipboard` utility (already exists at `src/utils/clipboard`) | Handles fallbacks, already used in 3+ components |
| Tool display routing | Switch/case in render | `getToolConfig()` system (already exists at `tools/configs/toolConfigs`) | Centralized, declarative, extensible |

**Key insight:** The existing tool rendering system (`ToolRenderer` + `getToolConfig`) is well-architected. Phase 5 should EVOLVE it (update configs, add card variant), not replace it.

## Common Pitfalls

### Pitfall 1: Shiki WASM Loading Race Condition
**What goes wrong:** Multiple components request the highlighter simultaneously before it finishes loading, causing multiple WASM instantiations.
**Why it happens:** `createHighlighter()` is async and takes 50-200ms on first call.
**How to avoid:** Module-level singleton promise pattern (see Pattern 1). The promise is created once and all callers await the same instance.
**Warning signs:** Console errors about WASM instantiation, duplicate theme loading logs.

### Pitfall 2: Shiki Bundle Size Explosion
**What goes wrong:** Importing `shiki` (full bundle) loads 6.4MB of grammars even though the app uses ~15 languages.
**Why it happens:** The default export includes ALL 250+ language grammars.
**How to avoid:** Import from `shiki/bundle/web` (3.8MB, common web languages pre-bundled) + dynamically `loadLanguage()` for uncommon ones. Add `'vendor-shiki': ['shiki']` to Vite's `manualChunks` so it splits into its own chunk.
**Warning signs:** Main bundle growing by 2MB+, slow initial page load.

### Pitfall 3: setState Thrashing During Streaming
**What goes wrong:** Each streaming token triggers a setState, causing re-renders of the entire message list.
**Why it happens:** `appendStreamingChunk` clones the entire `ChatMessage[]` array on every chunk.
**How to avoid:** The rAF buffer (Pattern 3) batches multiple tokens into a single setState per frame. Combined with `React.memo` on `MessageComponent`/`TurnBlock`, only the streaming message re-renders.
**Warning signs:** Visible jank during AI responses, dropped frames in Performance panel.

### Pitfall 4: Turn Boundary Detection During Streaming
**What goes wrong:** A streaming turn has no clear "end" signal, so auto-collapse of previous turns fires prematurely or not at all.
**Why it happens:** The `claude-complete` event signals turn end, but during streaming the turn is still active.
**How to avoid:** Track `isStreaming` flag on the current turn. Only auto-collapse previous turns when a NEW user message arrives (clear signal of turn boundary). The `isStreaming` flag on `ChatMessage` already exists.
**Warning signs:** Turns collapsing while still receiving content, or old turns never collapsing.

### Pitfall 5: Shiki colorReplacements Not Covering All Tokens
**What goes wrong:** Warm-tinting via `colorReplacements` requires exact hex matches. If the `dark-plus` theme uses slightly different hex values than expected, some tokens keep cold colors.
**Why it happens:** Theme hex values must match exactly (case-sensitive).
**How to avoid:** Extract the actual `dark-plus` theme JSON from Shiki, audit all unique colors, create a comprehensive replacement map. Test with diverse code samples.
**Warning signs:** Some tokens appearing in blue/gray while others are warm-tinted.

### Pitfall 6: `dangerouslySetInnerHTML` XSS with Shiki Output
**What goes wrong:** Shiki's `codeToHtml` returns raw HTML. If user-controlled content leaks into the code string without sanitization, XSS is possible.
**Why it happens:** `dangerouslySetInnerHTML` bypasses React's escaping.
**How to avoid:** Shiki internally escapes code content in its HTML output (angle brackets, quotes). The risk is low because code blocks come from AI responses, not user input. However, verify Shiki's escaping covers all cases. If paranoid, use `codeToHast` + `hast-util-to-jsx-runtime` to render as React elements.
**Warning signs:** Raw `<script>` tags appearing in rendered code blocks.

## Code Examples

### Example 1: Warm Dark+ Theme Color Replacement Map
```typescript
// Source: Shiki dark-plus theme analysis
// These are the primary background/foreground colors to warm-shift
const WARM_DARK_PLUS: Record<string, string> = {
  // Backgrounds
  '#1E1E1E': '#1c1210',   // editor background -> Loom base
  '#252526': '#2a1f1a',   // sidebar/widget bg -> Loom surface 1
  '#2D2D2D': '#3d2e25',   // active line bg -> Loom surface 2
  '#264F78': '#3d2e25',   // selection bg -> warm selection

  // Foreground/text
  '#D4D4D4': '#f5e6d3',   // default text -> Loom cream
  '#808080': '#c4a882',   // comments -> muted gold

  // Token colors (subtle warm-shift, keep recognizable)
  '#569CD6': '#6bacce',   // keywords (blue) -> slightly warmer blue
  '#4EC9B0': '#5cc0a0',   // types (teal) -> slightly warmer
  '#CE9178': '#d4a574',   // strings (orange) -> Loom amber
  '#DCDCAA': '#e0d0a0',   // functions (yellow) -> warmer yellow
  '#9CDCFE': '#a0ccde',   // variables (light blue) -> warmer
  '#C586C0': '#c48aab',   // control flow (purple) -> warmer mauve
  '#6A9955': '#7a9960',   // comments (green) -> warmer green
  '#B5CEA8': '#c0c8a0',   // numbers (green) -> warmer
};
```

### Example 2: Tool Action Card Compact Display
```typescript
// Evolving existing OneLineDisplay into ToolActionCard pattern
// The key change: unified card with expand + status icon + type tint

const TOOL_TINTS: Record<string, string> = {
  edit:    'bg-blue-500/5',      // faint blue
  bash:    'bg-gray-500/5',      // faint gray
  search:  'bg-purple-500/5',    // faint purple
  default: 'bg-gray-500/3',      // barely visible
  todo:    'bg-violet-500/5',    // faint violet
  agent:   'bg-purple-500/8',    // slightly more visible
};

// Status icon at right edge
function StatusIcon({ toolResult }: { toolResult?: ToolResult | null }) {
  if (!toolResult) return null; // Still running
  if (toolResult.isError) {
    return <XCircle className="w-3.5 h-3.5 text-red-400" />;
  }
  return <CheckCircle className="w-3.5 h-3.5 text-green-400" />;
}
```

### Example 3: Activity Indicator with Rotating Phrases
```typescript
// Replaces AssistantThinkingIndicator
const ACTIVITY_PHRASES = [
  'Thinking...',
  'Reading files...',
  'Analyzing code...',
  'Working on it...',
  'Almost there...',
  'Processing...',
  'Searching...',
  'Considering options...',
  'Crafting response...',
  'Reviewing context...',
];

function ActivityIndicator({ provider }: { provider: SessionProvider }) {
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex(i => (i + 1) % ACTIVITY_PHRASES.length);
    }, 3000); // Rotate every 3s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 py-1">
      <span className="text-sm font-mono animate-pulse text-amber-500">
        {ACTIVITY_PHRASES[phraseIndex]}
      </span>
    </div>
  );
}
```

### Example 4: Vite Manual Chunks for Shiki
```javascript
// vite.config.js addition
manualChunks: {
  'vendor-react': ['react', 'react-dom', 'react-router-dom'],
  'vendor-codemirror': [/* existing */],
  'vendor-xterm': [/* existing */],
  'vendor-shiki': ['shiki'],  // NEW: isolate Shiki into its own chunk
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-syntax-highlighter + Prism | Shiki v4 with TextMate grammars | Shiki v1 (2024), v4 (2025) | VS Code-identical highlighting, async API, WASM-powered |
| setTimeout streaming buffer | requestAnimationFrame batching | Standard browser API | Frames at 60fps instead of 10fps, smoother streaming |
| `<details>` for disclosure | Controlled state + CSS grid animation | CSS Grid `0fr/1fr` trick | Smooth height animation vs snap open/close |
| Flat message list | Turn-based grouping with collapse | Chat UI pattern (Claude.ai, ChatGPT) | Navigable conversations, reduced scroll fatigue |

**Deprecated/outdated:**
- `react-syntax-highlighter`: Uses Prism/highlight.js tokenizers which have lower fidelity than TextMate grammars. No WASM. Will be removed from the project in this phase.
- `setTimeout` stream buffer at 100ms: Causes visible chunking during fast token streams. rAF is the modern standard.
- Pulsing dots thinking indicator: Generic, provides no contextual information. Claude CLI-style phrases are more engaging.

## Project Tooling

| Tool | Command | Detected From |
|------|---------|---------------|
| Lint | Not detected | - |
| Type Check | `npm run typecheck` | package.json scripts |
| Build | `npm run build` | package.json scripts |
| Test | Not detected | - |

*Already written to `.planning/config.json` under `tooling` key.*

## Open Questions

1. **Exact Dark+ theme hex values for colorReplacements**
   - What we know: The theme name is `dark-plus` in Shiki. Common VS Code Dark+ colors are well-documented.
   - What's unclear: The exact set of unique hex values in Shiki's bundled `dark-plus` theme may differ slightly from VS Code's version.
   - Recommendation: During implementation, extract the theme JSON via `highlighter.getTheme('dark-plus')` and build the replacement map from actual values. Start with the common values listed above and iterate.

2. **Turn boundary detection edge cases**
   - What we know: User messages clearly delineate turn boundaries. `claude-complete` signals end of processing.
   - What's unclear: How Codex and Gemini providers signal turn completion (Codex has `turn_complete`; Gemini has no explicit turn signal).
   - Recommendation: For Phase 5, detect turn boundaries by user message insertion (works for all providers). Refine with provider-specific signals if needed.

3. **Shiki bundle size impact**
   - What we know: `shiki/bundle/web` is ~3.8MB minified / 695KB gzipped with common languages pre-bundled.
   - What's unclear: Exact post-Vite-chunk size after tree-shaking and splitting.
   - Recommendation: Add `'vendor-shiki': ['shiki']` to Vite manualChunks, measure actual chunk sizes after implementation. If too large, switch to fine-grained `shiki/core` with explicit language imports.

4. **Performance of CSS grid 0fr/1fr animation on many turns**
   - What we know: The CSS grid trick works well for individual disclosures.
   - What's unclear: With 20+ collapsed turns, does the browser handle 20 simultaneous grid transitions?
   - Recommendation: Only the expanding/collapsing turn animates; others snap. Use `will-change: grid-template-rows` sparingly. Profile with 20+ turns during implementation.

## Sources

### Primary (HIGH confidence)
- Shiki official docs (shiki.style) - installation, themes, engines, transformers, bundles
- Shiki npm registry - v4.0.1 confirmed latest, `dark-plus` theme file confirmed in distribution
- Existing Loom codebase - direct reading of ChatMessagesPane, MessageComponent, Markdown, ToolRenderer, useChatRealtimeHandlers, toolConfigs, types, useUiPreferences

### Secondary (MEDIUM confidence)
- VS Code Dark+ color values - based on well-known VS Code theme documentation, but exact Shiki bundled values should be verified at implementation time
- CSS grid 0fr/1fr animation technique - widely documented browser capability, but performance at scale needs profiling

### Tertiary (LOW confidence)
- Shiki `@shikijs/react` package - returned 404 on docs page; may not exist or may be under different URL. React integration should use the standard `codeToHtml` + `dangerouslySetInnerHTML` pattern instead.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Shiki v4.0.1 confirmed, package verified, dark-plus theme confirmed in bundle
- Architecture: HIGH - Existing codebase thoroughly analyzed, patterns derived from actual code structure
- Pitfalls: HIGH - Based on direct codebase analysis (setTimeout buffer, flat messages, CodeBlock component)
- Turn grouping: MEDIUM - Pattern is sound but edge cases around provider-specific signals need implementation-time validation

**Research date:** 2026-03-02
**Valid until:** 2026-04-02 (Shiki v4 is stable, unlikely to have breaking changes in 30 days)
