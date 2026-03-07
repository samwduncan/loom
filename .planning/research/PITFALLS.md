# Domain Pitfalls: M2 "The Chat" Integration

**Domain:** Adding streaming Markdown, syntax highlighting, composer UX, tool animations, and activity status to existing M1 React chat skeleton
**Researched:** 2026-03-07
**Focus:** Integration pitfalls with existing rAF streaming, segment architecture, OKLCH tokens, and Constitution rules

---

## Critical Pitfalls

Mistakes that cause rewrites, performance death, or architecture conflicts with the existing M1 skeleton.

---

### Pitfall 1: react-markdown Re-parses Entire Content on Every Token

**What goes wrong:** The existing `useStreamBuffer` paints raw text to a DOM node via `textContent`. If you naively switch to `react-markdown` for that same text, every rAF frame re-parses the full accumulated markdown string. At 100 tokens/sec with a 2000-word response, that's 100 full remark/rehype AST traversals per second. The main thread locks up, scroll anchoring breaks, and the UI freezes.

**Why it happens:** react-markdown was designed for static content. It has no concept of incremental parsing. The entire markdown string is re-parsed from scratch on every render. The existing `useStreamBuffer` bypasses React entirely via `textContent` -- introducing react-markdown means re-entering React's reconciler for every frame.

**Consequences:**
- FPS drops from 60 to <10 during streaming
- Scroll anchoring stutters because layout recalculates on every parse
- The entire M1 streaming architecture (rAF buffer + useRef bypass) is undermined
- Users see markdown "flickering" as the parser toggles between valid/invalid states

**Prevention:**
1. **Keep the rAF textContent path during active streaming.** Only parse markdown AFTER the stream completes (on flush). The raw text during streaming is displayed as plain text in a `<pre>` or styled `<span>` -- no markdown rendering until the message is finalized.
2. **Alternative: Debounced incremental parsing.** Parse markdown only on newline boundaries or after 100ms idle. Use `useDeferredValue` to keep the raw text responsive while the parsed version catches up. This is harder to get right but gives live markdown preview.
3. **Alternative: Use Streamdown (Vercel).** Purpose-built for streaming markdown from AI models -- handles unclosed blocks, incremental parsing, and token buffering. Evaluate as a react-markdown replacement for streaming contexts only.
4. **Whichever approach: never call react-markdown inside the rAF loop.** The rAF loop must remain DOM-direct. Markdown parsing happens in React state, deferred or debounced.

**Detection:** FPS counter during streaming drops below 30. React DevTools Profiler shows `ReactMarkdown` renders taking >16ms. Users report "choppy" streaming.

**Phase assignment:** Phase 1 of M2 (Markdown rendering). This is the foundational decision -- everything else depends on it.

---

### Pitfall 2: Shiki Async Highlighting Causes Layout Shifts and Flash of Unstyled Code

**What goes wrong:** Shiki loads language grammars lazily (correct for bundle size). But the first time a Python code block appears, there's a 50-200ms delay while the grammar loads. During that window, the code block either: (a) renders as raw text without highlighting, then suddenly re-renders with colors (flash), or (b) renders nothing then pops in (layout shift). Both break scroll anchoring because the element height changes.

**Why it happens:** Shiki's `codeToHtml` / `codeToTokens` is async. React renders the code block synchronously with a loading state, then re-renders when highlighting is ready. If the code block is near the scroll anchor, the height change pushes content and the auto-scroll fires incorrectly.

**Consequences:**
- Layout Cumulative Shift on every new code block during streaming
- Scroll position jumps when code blocks re-render with highlighting
- In virtual lists (future M3), Shiki async highlighting causes severe flickering (documented issue: code blocks re-highlight every time they scroll into/out of view)

**Prevention:**
1. **Reserve height for code blocks immediately.** When the markdown parser detects a code fence opening (triple backtick), render a container with `min-height` based on line count estimate. This prevents layout shift when highlighting fills in.
2. **Use `react-shiki` with throttling.** The react-shiki library handles streaming code highlighting with optional throttle. It also uses the JavaScript RegExp engine (smaller bundle, faster startup) which is better for client-side use.
3. **Cache highlighted results.** Once a language grammar is loaded and a code block is highlighted, cache the result. Subsequent code blocks in the same language highlight instantly.
4. **Pre-load common languages.** Load JavaScript, TypeScript, Python, Bash, JSON, CSS, HTML grammars at app startup (lazy but eager for these 7). Less common languages load on demand.
5. **Existing architecture concern:** The ToolChip segment architecture inserts tool chips between text spans. If markdown parsing happens at the full-message level (not per-span), tool chips will be inside the markdown tree and cause rendering conflicts. Parse markdown per text segment, not across segment boundaries.

**Detection:** Chrome DevTools Layout Shift score > 0.1 during streaming. Visible "flash" when code blocks appear. Scroll jumps during code-heavy responses.

**Phase assignment:** Phase 1-2 of M2 (Markdown + code highlighting). Must be solved alongside the markdown rendering approach.

---

### Pitfall 3: Markdown Parsing Breaks the Segment Architecture

**What goes wrong:** The existing `ActiveMessage` uses a segment array (`text | tool`) where text spans receive raw tokens via `textContent`. Markdown rendering needs to process the full text to understand block structure (headers, lists, code fences span multiple lines). But tool chips split the text into separate spans. If you parse each span independently, you get broken markdown (a code fence that starts in span 1 and ends in span 3 is never recognized). If you parse the full concatenated text, tool chip positions are lost.

**Why it happens:** The segment architecture was designed for raw text display. Markdown is a block-level format that needs the full document to parse correctly. These two models are fundamentally incompatible.

**Consequences:**
- Code fences that span across tool calls render incorrectly
- List items interrupted by tool calls break list rendering
- Headers split by tool calls don't render as headers
- The segment interleaving that works perfectly for raw text becomes a liability

**Prevention:**
1. **Two-phase rendering model.** During streaming: raw text in segments (current behavior). On flush: re-render the full message with markdown parsing, placing tool chips at their correct positions using marker tokens or position tracking.
2. **Marker-based approach.** Instead of physical text segments, accumulate ALL text in a single buffer. Insert unique marker strings (e.g., `\x00TOOL:id\x00`) at tool call positions. After markdown parsing, walk the rendered AST and replace markers with ToolChip components. This keeps the full document parseable while preserving tool positions.
3. **Hybrid: parse only finalized segments.** Text segments that are "sealed" (a new tool call started, so the previous text span is complete) can be independently parsed. Only the final active span stays as raw text. This works if tool calls only appear between complete markdown blocks (which they typically do -- Claude doesn't start a code fence and then make a tool call mid-fence).
4. **The Constitution Section 12.1 already mandates this:** "Custom remark plugins detect unclosed code blocks during streaming and inject closing tags." This implies full-document parsing with fixup, which conflicts with per-segment rendering. Resolve this conflict explicitly.

**Detection:** Code blocks rendering incorrectly in messages with tool calls. Tool chips disappearing after markdown parsing. Broken lists/headers in tool-heavy responses.

**Phase assignment:** Phase 1 of M2. This is the hardest architectural decision in the entire milestone. Get it wrong and you rewrite the rendering layer.

---

### Pitfall 4: Composer Auto-Resize Fights the CSS Grid Shell

**What goes wrong:** The existing app shell uses `CSS Grid` with `100dvh` and `overflow: hidden` on html/body. The composer textarea needs to grow with content. If the composer height changes, the CSS Grid row for the chat content area must shrink correspondingly. Without coordination, the composer either overflows the grid cell, pushes the message area offscreen, or causes the scroll container's height to change (breaking scroll anchoring).

**Why it happens:** `overflow: hidden` on body prevents page scroll (correct), but the grid template must accommodate a variable-height composer. The naive `height: auto` on a textarea inside a fixed grid row creates a conflict: the grid cell has a fixed computed height, but the textarea wants to grow beyond it.

**Consequences:**
- Composer grows but pushes messages below the fold
- Scroll position jumps when composer height changes (the scroll container's height decreases)
- On mobile, virtual keyboard + growing textarea = content pushed entirely offscreen
- Max-height cap creates inner scroll on the textarea that feels bad

**Prevention:**
1. **Grid template: `grid-template-rows: 1fr auto`.** The chat messages area gets `1fr` (flex), the composer area gets `auto` (intrinsic size). As the composer grows, the messages area shrinks. This is the correct CSS Grid approach.
2. **Cap composer height with `max-height` and inner scroll.** Limit to ~200px (configurable). Beyond that, the textarea scrolls internally. This prevents the messages area from shrinking to nothing.
3. **Use `useLayoutEffect` for height recalculation.** The height reset trick (`height = 0; height = scrollHeight`) must happen in `useLayoutEffect` to avoid a visible flash. `useEffect` will show a frame at the wrong height. (M1 already learned this lesson with scroll-to-bottom.)
4. **Stabilize scroll position on resize.** When the composer grows, the messages scroll container shrinks. Capture `scrollTop + scrollHeight` before resize, restore after. The existing scroll anchor logic may need adjustment to handle container height changes.
5. **Test with `contain: layout` on the composer area.** Prevents the textarea's layout recalculation from propagating to the entire grid.

**Detection:** Messages jumping when typing in composer. Visible layout flash on each line wrap. Scroll position lost when composer grows/shrinks.

**Phase assignment:** Phase 2-3 of M2 (Composer). Build the composer early so all other phases can test with it.

---

### Pitfall 5: Tool State Machine Animations Trigger Layout During Streaming

**What goes wrong:** The existing ToolChip uses CSS classes (`tool-chip--invoked`, `tool-chip--resolved`) for static state display. Adding animated transitions between states (height change for expanding card, color transitions, icon morphs) triggers layout recalculation. During active streaming, the rAF loop is painting tokens to a sibling DOM node. Layout recalculation from tool animations competes with the paint loop, causing dropped frames.

**Why it happens:** The Constitution (11.4) bans animating `height`/`width` during streaming for exactly this reason. But tool state transitions naturally want height animation (chip expands to card). If a tool resolves while the model is still streaming text, the expansion animation triggers layout in the same frame as the rAF paint.

**Consequences:**
- Dropped frames (FPS dip from 60 to 30-40) during tool resolution while streaming
- Scroll jitter as tool card expansion changes content height
- Worse on complex tool outputs (file diffs, large grep results) where the card expansion is significant

**Prevention:**
1. **GPU-only animations for state transitions during streaming.** Animate `opacity` and `transform` only. Use `transform: scaleY()` for the "expansion" visual effect instead of actual height change. Apply the real height change only after the animation completes (two-phase: animate visual, then commit layout).
2. **Defer card expansion during active streaming.** While `isStreaming === true`, tool chips show resolved/error status visually (color dot, icon change) but DON'T expand the card body. Expansion is enabled only after streaming ends. This keeps layout stable during the critical streaming window.
3. **Use `content-visibility: auto` on tool cards.** Combined with `contain-intrinsic-height`, this prevents offscreen tool card layout from affecting the streaming paint loop.
4. **Batch tool state updates.** The multiplexer can receive multiple tool_result messages in rapid succession. Batch these into a single state update rather than triggering N re-renders.

**Detection:** React DevTools Profiler showing `ToolChip` re-renders during streaming. Chrome Performance tab showing "Layout" markers concurrent with rAF paint. FPS dips correlating with tool state changes.

**Phase assignment:** Phase 2 of M2 (Tool cards). Must coordinate with existing ToolChip/ToolCard components.

---

### Pitfall 6: Activity Status Line Creates Unnecessary Re-renders

**What goes wrong:** The `activityText` field in the stream store updates frequently during tool execution (every tool_progress message, every tool_use_start). Every component subscribing to `activityText` re-renders on each update. If the activity status line component is a child of the message container or chat viewport, its re-renders can propagate upward.

**Why it happens:** `setActivityText` is called from the multiplexer on every tool_progress event (which fires periodically during long-running tools). The stream store update triggers Zustand selector notifications. If the activity status component doesn't use `React.memo` with proper equality, or if parent components subscribe to the same store slice, cascading re-renders occur.

**Consequences:**
- Unnecessary re-renders during tool execution
- Minor FPS impact (not critical, but accumulates with other pitfalls)
- Scroll container may re-render if it subscribes to stream store

**Prevention:**
1. **Isolate the activity status component.** It should be a standalone `React.memo` component that subscribes ONLY to `activityText` via `useStreamStore(s => s.activityText)`. No parent should subscribe to this slice.
2. **Debounce activity text updates.** The multiplexer can fire tool_progress every second. Debounce `setActivityText` to 200ms to reduce store updates.
3. **Place outside the scroll container.** The activity status line should be in the composer area (below messages, above the textarea) or in a fixed position. NEVER inside the scrollable message list -- it would cause scroll height changes.

**Detection:** React DevTools showing activity status re-renders at >5/sec during tool execution. Other components re-rendering when activity text changes.

**Phase assignment:** Phase 3-4 of M2 (Activity status). Lower priority than markdown and composer, but must be architected correctly.

---

## Moderate Pitfalls

Issues that cause significant rework or degraded UX but not full rewrites.

---

### Pitfall 7: Unclosed Markdown Blocks During Streaming

**What goes wrong:** The model streams a code fence opening (` ```python\n `) but hasn't sent the closing fence yet. react-markdown sees this as invalid markdown and either: (a) renders it as inline code or plain text, then suddenly becomes a code block when the closing fence arrives (layout shift), or (b) doesn't render anything until the block is complete (missing content).

**Prevention:**
1. **Inject synthetic closing tags.** A custom remark plugin detects unclosed code fences (odd number of triple-backtick sequences) and appends a closing fence to the string before parsing. This renders the code block container immediately, with content filling in as tokens arrive.
2. **Track block state in the stream buffer.** Count code fence openers/closers. When open > closed, the final text segment is "inside a code block" -- render it in a code block container regardless of markdown parser output.
3. **Consider Streamdown.** Vercel's Streamdown library handles this automatically via regex-based recovery rules. If adopting react-markdown proves too painful for streaming, Streamdown is the purpose-built alternative.

**Detection:** Code blocks appearing as inline code during streaming, then "jumping" into a proper code block. Layout shifts when code fences close.

**Phase assignment:** Phase 1 of M2, solved alongside the markdown parsing approach.

---

### Pitfall 8: Shiki Theme Colors Conflict with OKLCH Token System

**What goes wrong:** Shiki themes use hardcoded hex colors. The Constitution bans hardcoded colors. If you apply a Shiki theme directly, syntax highlighting colors are outside the OKLCH token system. Theme changes (future light mode, or palette tuning) won't affect code blocks. Worse, the Constitution ESLint rule for "no hardcoded colors" will flag Shiki's theme configuration.

**Prevention:**
1. **The Constitution already has an exception (Section 3.1):** "Third-party library theme objects that require JS objects (xterm.js theme, Shiki colorReplacements). These MUST reference CSS variable values via a shared constants file." Follow this pattern.
2. **Create `src/src/lib/shiki-theme.ts`.** Map Shiki token types to CSS custom properties. Use `getComputedStyle` to read OKLCH values at runtime, or define a constants file that maps token names to `var(--token)` references.
3. **Use Shiki's `colorReplacements` option.** This allows overriding specific colors in a theme with custom values. Map the base colors to CSS variable references.
4. **Don't create a full custom Shiki theme.** It's hundreds of token type mappings. Instead, pick a dark theme close to the OKLCH palette (e.g., `vitesse-dark`, `github-dark-dimmed`) and override just the background/foreground/comment colors to match design tokens.

**Detection:** ESLint Constitution rule fires on Shiki theme config. Code block colors visibly clashing with the rest of the UI.

**Phase assignment:** Phase 1-2 of M2 (code highlighting setup).

---

### Pitfall 9: Send/Stop Button Morph Requires WebSocket State Awareness

**What goes wrong:** The composer needs a Send button when idle and a Stop button when streaming. The morph seems simple (`isStreaming ? Stop : Send`). But the actual state machine is more complex: connecting -> sending -> processing -> streaming -> tool_executing -> streaming_again -> complete. The button must handle: (a) the gap between "user pressed Send" and "backend acknowledged receipt" (optimistic UI), (b) the Stop action actually sending an abort message to the backend, (c) multiple rapid Send/Stop presses.

**Prevention:**
1. **Use a local component state machine, not just `isStreaming`.** States: `idle` -> `sending` (optimistic, after click, before WS ack) -> `active` (streaming received) -> `aborting` (stop pressed, before backend confirms) -> `idle`. This prevents double-sends and double-stops.
2. **Debounce the button.** After pressing Send, disable for 200ms. After pressing Stop, disable for 500ms (abort acknowledgment can be slow).
3. **Wire Stop to the correct backend message.** The backend expects a `claude-abort` message (check BACKEND_API_CONTRACT.md). The abort may not be immediate -- the model might send a few more tokens before stopping. Handle gracefully.
4. **Visual feedback during state transitions.** The send icon morphs to a stop icon with a CSS transition. Use `opacity` + `transform: rotate` for the morph, not conditional rendering (which would flash).

**Detection:** Users pressing Send multiple times creating duplicate messages. Stop button appearing to do nothing (backend abort delay). Button flickering during state transitions.

**Phase assignment:** Phase 2-3 of M2 (Composer).

---

### Pitfall 10: Image Paste/Upload Creates Memory Pressure

**What goes wrong:** Pasting a screenshot from clipboard creates a Blob. If you convert it to a data URL for preview, you're doubling the memory usage (original Blob + base64 string, which is 33% larger). Multiple pasted images in a session accumulate. The existing timeline store persists sessions -- if images are stored as data URLs in message content, localStorage fills up fast (5MB limit).

**Prevention:**
1. **Use `URL.createObjectURL(blob)` for preview, not data URLs.** Object URLs are pointers, not copies. Revoke them when the message is sent.
2. **Upload images via the backend REST API, not inline in WebSocket messages.** The backend likely has an image upload endpoint. Send the image as multipart/form-data, get back a URL, embed the URL in the message.
3. **Never persist image data in the timeline store.** Store image references (URLs), not data. The timeline store uses localStorage with `partialize` that excludes messages -- this is already safe, but be careful if message content includes base64 strings during the session (before persistence).
4. **Limit paste size.** Cap at 5MB per image, 3 images per message. Provide UI feedback when limits are exceeded.

**Detection:** Memory usage climbing in Chrome DevTools during image-heavy sessions. localStorage quota exceeded errors. Slow message rendering with data URL images.

**Phase assignment:** Phase 3 of M2 (Composer image features). Lower priority than text input.

---

### Pitfall 11: Thinking Blocks with Markdown Content

**What goes wrong:** The existing `ThinkingDisclosure` renders thinking block text as plain `<p>` tags. Claude's thinking blocks can contain markdown (code snippets, lists, emphasis). If M2 adds markdown rendering to assistant messages but not to thinking blocks, the UX is inconsistent. But rendering markdown in thinking blocks doubles the parsing work for messages with large thinking content.

**Prevention:**
1. **Render thinking block content as markdown, but deferred.** Use `useDeferredValue` on the thinking block text. The thinking disclosure is collapsed by default after completion -- markdown parsing only happens when the user expands it.
2. **Simpler alternative: lightweight markdown.** Thinking blocks rarely have complex markdown. Use a minimal parser (just code spans, bold, italic -- skip tables, images, complex blocks) for thinking content. Or just render as monospace text (it's "thinking" -- raw text is arguably the right UX).
3. **Don't block on this.** Thinking block markdown is a polish item, not a blocker. Ship with plain text in M2, add markdown in M3 if needed.

**Detection:** Thinking blocks showing raw asterisks and backticks. User feedback about inconsistent rendering.

**Phase assignment:** Phase 2-3 of M2 or defer to M3.

---

## Minor Pitfalls

Issues that cause minor friction but are quickly fixable.

---

### Pitfall 12: Scroll Anchor Disrupted by Dynamic Content Height Changes

**What goes wrong:** The existing scroll anchor from M1 works for append-only text streaming. M2 adds dynamic height changes: code blocks expanding when highlighting loads, tool cards expanding/collapsing, thinking blocks expanding. Each height change can disrupt the scroll position.

**Prevention:**
1. **The existing `useScrollAnchor` needs enhancement.** It currently checks "is user scrolled to bottom" and auto-scrolls on new content. Add: "if user is near bottom (within 100px), maintain bottom lock even when height changes above the viewport." This covers code block highlighting and tool card expansion.
2. **Use `ResizeObserver` on the scroll container's content.** When content height changes and the user is in "auto-scroll" mode, scroll to bottom. This handles all dynamic height changes generically.
3. **Don't use `scrollIntoView` -- use `scrollTop = scrollHeight`.** `scrollIntoView` can conflict with the rAF paint loop.

**Phase assignment:** Phase 1-2 of M2, incremental enhancement of existing M1 scroll anchor.

---

### Pitfall 13: GFM Tables During Streaming Cause Wild Reflow

**What goes wrong:** The Constitution (12.3) notes this: "During streaming, table rendering is deferred until the closing `|` row is detected." If you render partial tables during streaming, each new `|` character causes the table to re-layout as columns shift. A 5-column table streamed cell-by-cell produces 25+ layout recalculations.

**Prevention:**
1. **Detect table context in the stream buffer.** If the last line starts with `|` and no empty line follows, buffer the content instead of parsing it as markdown. Render a "Table loading..." placeholder.
2. **Simpler: don't render tables during streaming at all.** Tables are rare in AI responses. Render them only on flush. During streaming, pipe-delimited lines render as plain text.
3. **If using Streamdown, check if it handles this.** It may buffer tables automatically.

**Phase assignment:** Phase 1 of M2 (markdown rendering). Minor edge case but explicitly called out in the Constitution.

---

### Pitfall 14: ESLint Constitution Rules Block Legitimate Shiki/Markdown Patterns

**What goes wrong:** The 9 existing ESLint rules ban hardcoded colors, inline styles, and more. Shiki theme objects, markdown component styles, and code block containers may trigger false positives. Developers waste time fighting ESLint for legitimate library integration patterns.

**Prevention:**
1. **Add targeted ESLint disable comments with SAFETY explanations.** The Constitution allows `// eslint-disable-next-line ... -- [reason]` for exceptions.
2. **Create a shared constants file for Shiki/markdown theme values.** Keep all library-required hardcoded values in one file with clear comments explaining why they bypass the token system.
3. **Don't weaken the ESLint rules.** The rules are correct. The exceptions are few and well-defined. Document each exception in the file where it appears.

**Phase assignment:** Throughout M2. Handle as they arise, not proactively.

---

### Pitfall 15: Multiple `claude-response` Entries Per Turn Not Handled in Markdown

**What goes wrong:** M1 already learned that multiple assistant JSONL entries share the same `message.id` and must be merged. But in M2, each of those entries may contain text content blocks that need to be concatenated for markdown rendering. If the merge logic concatenates text without proper spacing, markdown parsing breaks (e.g., two text blocks without a newline between them merge a sentence ending into a heading).

**Prevention:**
1. **Ensure text block concatenation preserves whitespace.** When merging text blocks from multiple `claude-response` entries, join with the original whitespace (which should be preserved in the token stream).
2. **This is likely already handled** by the rAF buffer concatenation (`bufferRef.current += token`). Verify that the flush produces correct markdown by testing with real multi-entry responses.
3. **Test edge case: text -> tool_use -> text in a single turn.** The segment architecture handles this for streaming. Verify it also works for historical messages loaded from the backend JSONL.

**Phase assignment:** Phase 1 of M2 (message rendering). Verify with real backend data.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Markdown rendering | Pitfall 1 (re-parse on every token), Pitfall 3 (segment conflict), Pitfall 7 (unclosed blocks) | Decide streaming vs flush-only markdown upfront. This is THE architectural decision of M2. |
| Code highlighting | Pitfall 2 (layout shift), Pitfall 8 (OKLCH conflict) | Use react-shiki with throttle + preloaded common languages. Constants file for theme. |
| Composer | Pitfall 4 (grid shell conflict), Pitfall 9 (send/stop state machine), Pitfall 10 (image memory) | Grid template `1fr auto`, useLayoutEffect for resize, local state machine for button. |
| Tool animations | Pitfall 5 (layout during streaming) | GPU-only animations during streaming. Defer expansion until stream ends. |
| Activity status | Pitfall 6 (re-renders) | Isolated memo component, debounced updates, outside scroll container. |
| Scroll anchoring | Pitfall 12 (dynamic height) | ResizeObserver + near-bottom threshold enhancement. |
| Message rendering | Pitfall 15 (multi-entry merge) | Verify whitespace preservation in text concatenation. |
| All phases | Pitfall 14 (ESLint false positives) | Targeted disable comments with SAFETY explanation. |

---

## The Big Decision: Streaming Markdown Strategy

This is not a pitfall -- it's a crossroads that determines which pitfalls you face. There are three viable approaches:

### Option A: Raw Text During Stream, Markdown on Flush

- **Keeps the M1 rAF architecture entirely intact**
- Streaming looks like a terminal (raw text, no formatting)
- On flush, the full message re-renders with markdown/highlighting
- **Pro:** Simplest, highest performance, zero risk of layout shift during streaming
- **Con:** Users don't see formatted text while streaming (other AI UIs do show it)

### Option B: Debounced Incremental Markdown

- Parse markdown on newline or 100ms idle, not on every token
- Use `useDeferredValue` so raw text shows immediately, formatted version catches up
- Keep the rAF buffer for token accumulation, but periodically flush to a React-rendered markdown component
- **Pro:** Users see formatting during streaming
- **Con:** Complex, must solve segment/markdown conflict (Pitfall 3), unclosed block handling (Pitfall 7)

### Option C: Streamdown (Vercel)

- Purpose-built streaming markdown renderer
- Handles unclosed blocks, incremental parsing, token buffering
- Replaces react-markdown for streaming contexts
- **Pro:** Solves Pitfalls 1, 3, 7, 13 out of the box
- **Con:** External dependency, may not integrate with existing rAF architecture, potential conflict with Shiki integration (they recently opened an issue about react-shiki integration)

**Recommendation:** Start with Option A for Phase 1 of M2. It ships fast, keeps M1 architecture intact, and delivers a working chat. Explore Option B or C in a later M2 phase or M3 as a UX enhancement. The V1 app rendered markdown only on completed messages and users were fine with it.

---

## Sources

- [react-markdown performance discussion](https://github.com/remarkjs/react-markdown/issues/459)
- [remarkjs virtualization discussion](https://github.com/orgs/remarkjs/discussions/1027)
- [Streamdown by Vercel](https://streamdown.ai/)
- [Next.js Markdown Chatbot with Memoization](https://ai-sdk.dev/cookbook/next/markdown-chatbot-with-memoization)
- [react-shiki (streaming-optimized Shiki for React)](https://github.com/AVGVSTVS96/react-shiki)
- [Shiki dynamic language loading](http://blog.innei.ren/shiki-dynamic-load-language?locale=en)
- [Shiki flickering in virtual lists](https://github.com/vercel/streamdown/issues/186)
- [Auto-Resizing Textarea pitfalls](https://infinitejs.com/posts/auto-resizing-textarea-react-pitfalls/)
- [react-shiki + Streamdown integration proposal](https://github.com/vercel/streamdown/issues/115)
- Loom M1 source: `src/src/hooks/useStreamBuffer.ts`, `src/src/components/chat/view/ActiveMessage.tsx`, `src/src/lib/stream-multiplexer.ts`
- Loom Constitution: `.planning/V2_CONSTITUTION.md` Sections 10, 11, 12
