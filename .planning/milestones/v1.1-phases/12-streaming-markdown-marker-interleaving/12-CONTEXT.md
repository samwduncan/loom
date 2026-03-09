# Phase 12: Streaming Markdown + Marker Interleaving - Context

**Gathered:** 2026-03-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Active streaming shows lightweight formatted text (basic markdown rendered via innerHTML), finalized messages transition smoothly to full react-markdown rendering via a crossfade, and tool chips render at correct inline positions within finalized markdown content via a rehype-based marker replacement system. Streamdown is evaluated as an alternative streaming renderer via full prototype comparison.

</domain>

<decisions>
## Implementation Decisions

### Streaming formatting approach
- Basic inline formatting during streaming: bold, italic, inline code, paragraphs, line breaks, headings (h1-h6), lists (bullet + numbered), blockquotes, and code fence containers
- innerHTML with strict HTML allowlist: `<strong>`, `<em>`, `<code>`, `<a>`, `<p>`, `<br>`, `<ul>`, `<ol>`, `<li>`, `<h1>`-`<h6>`, `<pre>`, `<div>`. All other tags stripped. No event handlers, no scripts.
- Unclosed code fences: detect odd number of triple-backtick sequences, inject synthetic closing fence before parsing. Code block container renders immediately with content filling in as tokens arrive (dark bg, mono font, language label, no Shiki highlighting until finalization)
- Incomplete tables: render as plain text until table completes (next empty line or flush). Tables only parsed on flush or double-newline.
- Headings render during streaming (simple line prefix detection, low ambiguity risk)
- Lists render during streaming with actual bullet/number styling and indentation
- Blockquotes render during streaming with left border accent

### Stream-to-final transition
- 250ms crossfade overlay: render finalized react-markdown behind streaming content, fade streaming out (opacity 1->0) and finalized in (opacity 0->1) simultaneously
- Smooth height animation: container transitions from streaming height to finalized height over the same 250ms. Explicit height capture (both heights measured), animate between, then release to auto.
- Streaming cursor fades out as part of the crossfade (opacity transition synced to 250ms)
- Accent tint background fades out with crossfade (existing data-phase="finalizing" behavior, timing synced)
- Uses position:absolute overlap during transition to prevent layout jump
- After 250ms: streaming DOM removed, finalized DOM visible, height set to auto

### Tool chip inline placement
- Marker-based approach: inject unique placeholder tokens (`\x00TOOL:id\x00`) between text content blocks (between paragraphs/blocks, not mid-paragraph)
- rehype plugin (`rehypeToolMarkers`) in the react-markdown pipeline walks hast tree, finds marker text nodes, replaces with custom `<tool-marker data-id="id" />` elements
- React component override for `tool-marker` renders ToolChip component
- No DOM walking, no createPortal — pure react-markdown integration
- Marker schema defined once, used consistently across streaming and finalized rendering
- Default display: collapsed ToolChip pill (compact inline pill with status dot)
- Expansion: inline expansion on click, pushing subsequent content down with CSS Grid 0fr->1fr animation
- No overlay/popover for tool card expansion

### Streamdown evaluation
- Full prototype comparison: build both Streamdown and custom converter side-by-side with identical test fixtures
- Evaluation criteria (all four weighted equally):
  1. Visual quality during streaming (jank, flicker, layout shifts)
  2. Edge case handling (unclosed fences, partial tables, tool markers, code blocks mid-stream)
  3. Integration fit with our stack (rAF loop, OKLCH tokens, react-markdown finalization pipeline)
  4. Bundle size impact (tree-shaken, compared to custom lightweight converter)
- Winner takes all: if Streamdown wins, replace custom converter completely and don't maintain both. If custom wins, don't install Streamdown as a dependency. Document rationale in SUMMARY.md.

### Error recovery during streaming
- Silent fallback to raw textContent if converter throws or produces broken output — no error indicator visible to user
- Permanent fallback for that streaming session (don't retry converter after failure — avoid flicker from repeated fail/retry)
- Finalization still renders full react-markdown normally (unaware of streaming error)
- Next message starts fresh with converter enabled

### Claude's Discretion
- Streaming converter performance optimization (token batching, rAF frame budget)
- Reduced motion behavior (instant crossfade vs skip formatting)
- Specific test fixtures for Streamdown comparison
- Sanitization implementation details (DOMPurify vs custom regex)

</decisions>

<specifics>
## Specific Ideas

- Code fence containers during streaming should look like the finalized CodeBlock minus Shiki colors — dark bg, mono font, language label visible. Visual continuity between streaming and finalized.
- The crossfade should feel like Claude Code's message finalization — smooth, not jarring. 250ms is the target.
- "Markdown rendering where possible on easier things" — user wants maximum formatting during streaming, not just bare minimum. Headings, lists, blockquotes all included.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useStreamBuffer` (src/src/hooks/useStreamBuffer.ts): rAF + useRef token accumulation. Currently paints textContent. Needs modification to paint innerHTML instead. Has checkpoint() for multi-span support.
- `ActiveMessage` (src/src/components/chat/view/ActiveMessage.tsx): Already has data-phase streaming/finalizing, segment array with text+tool interleaving, onFinalizationComplete callback. Core of the streaming pipeline.
- `MarkdownRenderer` (src/src/components/chat/view/MarkdownRenderer.tsx): react-markdown wrapper with 15 component overrides. Will need rehypeToolMarkers plugin added.
- `CodeBlock` (src/src/components/chat/view/CodeBlock.tsx): Full-featured with Shiki. Reused by MarkdownRenderer for finalized fenced blocks.
- `streaming-cursor.css`: Already has data-phase transitions for cursor and background tint. Needs crossfade additions.

### Established Patterns
- rAF loop for zero-React-render streaming (useStreamBuffer)
- data-phase attribute for CSS-driven state transitions (streaming-cursor.css)
- Component override pattern for react-markdown (MarkdownRenderer)
- Selector-only Zustand subscriptions (Constitution 4.2)
- CSS Grid 0fr/1fr for expand/collapse animations (Constitution Tier 1)

### Integration Points
- `useStreamBuffer.onFlush` — transition trigger. Currently creates Message and adds to timeline. Will need to orchestrate crossfade.
- `AssistantMessage` — renders finalized messages. Tool chip markers need to be in the content string when this renders.
- `ToolChip` / `ToolCard` — existing components, reused within marker-replaced elements.
- `MessageContainer` — shared wrapper for CLS-free layout. Crossfade happens inside this.

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 12-streaming-markdown-marker-interleaving*
*Context gathered: 2026-03-07*
