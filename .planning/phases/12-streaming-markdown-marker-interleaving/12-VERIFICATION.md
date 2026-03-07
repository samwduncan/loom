---
phase: 12-streaming-markdown-marker-interleaving
verified: 2026-03-07T18:18:00Z
status: passed
score: 5/5 must-haves verified
re_verification: false
---

# Phase 12: Streaming Markdown + Marker Interleaving Verification Report

**Phase Goal:** Active streaming shows lightweight formatted text, finalized messages transition smoothly to full markdown with tool chips correctly placed inline via markers, and Streamdown is evaluated as an alternative
**Verified:** 2026-03-07T18:18:00Z
**Status:** passed
**Re-verification:** No -- initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | During active streaming, text renders at 60fps with basic formatting (bold, italic, code spans) -- not raw markdown source | VERIFIED | `useStreamBuffer.ts` calls `convertStreamingMarkdown(raw)` in rAF paint loop, assigns to `node.innerHTML`. Converter handles bold/italic/code/headings/lists/blockquotes/code fences. 20 unit tests pass. |
| 2 | Unclosed code fences during streaming render as a code block container that fills in as tokens arrive -- no broken layout | VERIFIED | `streaming-markdown.ts` lines 70-78: regex catches unclosed fences (`/```(\w*)\n([\s\S]*)$/g`) and injects synthetic close. Test "handles unclosed code fence by injecting synthetic close" passes. |
| 3 | The transition from streaming to finalized markdown is visually smooth with no flash or layout jump (200ms+ masked transition) | VERIFIED | `ActiveMessage.tsx` implements 250ms crossfade: explicit height capture, `position:absolute` overlap, opacity transition via `data-phase` CSS attributes. `streaming-cursor.css` has `.crossfade-container`, `.crossfade-streaming`, `.crossfade-finalized` with `var(--duration-normal)` transitions. Reduced-motion media query disables all transitions. |
| 4 | Tool chips render at correct inline positions within finalized markdown content via marker-based interleaving -- not orphaned at bottom of message | VERIFIED | `rehype-tool-markers.ts` walks hast tree replacing `\x00TOOL:id\x00` text nodes with `<tool-marker data-id="id">` elements (8 tests pass). `MarkdownRenderer.tsx` integrates plugin via `rehypePlugins={[rehypeRaw, rehypeToolMarkers]}` with `tool-marker` component override rendering `ToolChip`. `AssistantMessage.tsx` injects markers via `injectToolMarkers()`. |
| 5 | Streamdown evaluated as alternative streaming renderer -- decision documented with rationale (adopt or stick with two-phase) | VERIFIED | `streamdown-eval.ts` documents 10 test fixtures, 4-criteria evaluation. Streamdown is a React `MemoExoticComponent` -- fundamentally incompatible with rAF architecture. 47 comparison tests pass. Streamdown dependency uninstalled (not in `package.json` or `node_modules/`). Decision documented in SUMMARY and eval module. |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/src/lib/streaming-markdown.ts` | Pure function: markdown -> sanitized HTML | VERIFIED | 259 lines, exports `convertStreamingMarkdown`, uses DOMPurify allowlist, handles 8 formatting constructs |
| `src/src/lib/streaming-markdown.test.ts` | Unit tests for converter (min 80 lines) | VERIFIED | 153 lines, 20 tests covering all constructs + XSS + edge cases |
| `src/src/hooks/useStreamBuffer.ts` | rAF paint loop using innerHTML | VERIFIED | 139 lines, imports `convertStreamingMarkdown`, uses `innerHTML` with `converterFailedRef` silent fallback |
| `src/src/components/chat/styles/streaming-markdown.css` | Streaming-phase formatting styles | VERIFIED | 129 lines, scoped under `.active-message`, covers code blocks, headings, lists, blockquotes, paragraphs, links |
| `src/src/lib/rehype-tool-markers.ts` | rehype plugin replacing markers with tool-marker elements | VERIFIED | 77 lines, exports `rehypeToolMarkers`, uses `unist-util-visit` with SKIP |
| `src/src/lib/rehype-tool-markers.test.ts` | Unit tests for hast transformation (min 40 lines) | VERIFIED | 167 lines, 8 tests covering single/multiple/nested/boundary markers |
| `src/src/components/chat/view/MarkdownRenderer.tsx` | Updated with rehypeToolMarkers + tool-marker override | VERIFIED | `rehypeToolMarkers` in rehypePlugins array, `ToolMarkerInline` component, `toolCalls` prop on interface |
| `src/src/components/chat/view/AssistantMessage.tsx` | Injects markers into content for inline tool placement | VERIFIED | `injectToolMarkers()` function, `toToolCallStates()` converter, passes `toolCalls` to MarkdownRenderer |
| `src/src/components/chat/view/ActiveMessage.tsx` | Crossfade orchestration (streaming/finalizing/finalized) | VERIFIED | 317 lines, three-phase state machine, rAF height measurement, 250ms crossfade, renders MarkdownRenderer in finalized layer |
| `src/src/components/chat/styles/streaming-cursor.css` | Crossfade CSS + cursor styles | VERIFIED | 106 lines, crossfade-container/streaming/finalized classes, data-phase selectors, reduced-motion support |
| `src/src/lib/streamdown-eval.ts` | Side-by-side comparison module | VERIFIED | 256 lines, 10 fixtures, evaluation functions, documented summary |
| `src/src/lib/streamdown-eval.test.ts` | Comparison tests documenting results | VERIFIED | 195 lines, 47 tests documenting evaluation |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `useStreamBuffer.ts` | `streaming-markdown.ts` | `import convertStreamingMarkdown` | WIRED | Line 21: import, Line 83: called in `paint()` |
| `useStreamBuffer.ts` | DOM node | `node.innerHTML = convertStreamingMarkdown(raw)` | WIRED | Line 83: `node.innerHTML` assignment in rAF loop |
| `ActiveMessage.tsx` | `MarkdownRenderer.tsx` | Renders in finalized layer | WIRED | Line 26: import, Line 292: `<MarkdownRenderer content={finalizedContent} />` |
| `MarkdownRenderer.tsx` | `rehype-tool-markers.ts` | rehypePlugins array | WIRED | Line 20: import, Line 207: `rehypePlugins={[rehypeRaw, rehypeToolMarkers]}` |
| `AssistantMessage.tsx` | `MarkdownRenderer.tsx` | Injects markers + passes toolCalls | WIRED | Line 40: `\x00TOOL:${tc.id}\x00` markers, Line 77: `<MarkdownRenderer content={content} toolCalls={toolCallStates} />` |
| `ActiveMessage.tsx` | `streaming-markdown.css` | CSS import | WIRED | Line 29: `import '../styles/streaming-markdown.css'` |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-----------|-------------|--------|----------|
| MD-10 | 12-01 | rAF buffer continues painting, 60fps preserved | SATISFIED | `useStreamBuffer.ts` rAF loop with `convertStreamingMarkdown` |
| MD-11 | 12-01 | Lightweight streaming markdown-to-HTML pure function with sanitized HTML | SATISFIED | `streaming-markdown.ts` with DOMPurify allowlist matching spec exactly |
| MD-12 | 12-01 | Unclosed code fences: detect + inject synthetic close | SATISFIED | Regex handler at lines 70-78, test passes |
| MD-13 | 12-01 | GFM tables during streaming: render as plain text until complete | SATISFIED | No table parser = tables render as plain text. Test confirms `not.toContain('<table>')` |
| MD-14 | 12-02 | Streaming-to-finalized transition: smooth, no flash, min 200ms | SATISFIED | 250ms crossfade via CSS transitions, position:absolute overlap |
| MD-15 | 12-02 | Marker-based tool chip interleaving: `\x00TOOL:id\x00` markers | SATISFIED | rehypeToolMarkers plugin + component override + AssistantMessage injection |
| ENH-01 | 12-03 | Streamdown evaluation with documented decision | SATISFIED | Full evaluation module + 47 tests + decision: custom wins (Streamdown is React component) |

No orphaned requirements. All 7 requirement IDs from ROADMAP Phase 12 are covered.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None | - | - | - | No anti-patterns detected |

The grep for TODO/FIXME/HACK/PLACEHOLDER returned only legitimate uses of the word "placeholder" in variable names (`placeholderCounter`, `codePlaceholders`, `inlinePlaceholders`) which are functional code, not deferred work markers. No empty implementations, no console.log-only handlers, no stub returns.

### Human Verification Required

### 1. Streaming Formatting Visual Quality

**Test:** Start a new chat session, send a prompt that elicits a response with bold, italic, code, headings, lists, and a code block. Watch the streaming text as it arrives.
**Expected:** Text should render with proper formatting (bold text bold, italic text italic, code in monospace) during streaming -- not raw markdown characters like `**` or `#`.
**Why human:** Visual rendering quality cannot be verified by grep -- need to see actual browser output at 60fps.

### 2. Crossfade Transition Smoothness

**Test:** During a streaming response, watch for the moment streaming completes. The streaming text should fade out while the finalized markdown fades in.
**Expected:** No visible flash, no layout jump, smooth 250ms transition. Container height should animate smoothly between streaming and finalized heights.
**Why human:** CSS transition smoothness, absence of flicker, and height animation quality require visual inspection.

### 3. Inline Tool Chip Placement

**Test:** Trigger a response that uses tool calls (e.g., ask Claude to read a file). After the response finalizes, check that tool chips appear inline within the markdown text, not orphaned at the bottom.
**Expected:** Tool chips render at their marked positions within the text flow.
**Why human:** Inline positioning within reflowed markdown content requires visual confirmation.

### 4. Reduced Motion Behavior

**Test:** Enable `prefers-reduced-motion: reduce` in browser devtools, then watch a streaming response finalize.
**Expected:** Crossfade should be instant (no animation), cursor should not pulse.
**Why human:** Accessibility behavior requires testing with actual browser media query override.

### Gaps Summary

No gaps found. All 5 observable truths verified. All 12 artifacts exist, are substantive, and are wired. All 7 requirements satisfied. All 6 key links confirmed. Full test suite passes (477 tests, 41 files). TypeScript compiles cleanly. No anti-patterns detected.

Phase 12 goal achieved: streaming text renders as formatted HTML (not raw markdown), the streaming-to-finalized transition uses a 250ms crossfade with no flash, tool chips render inline via rehype marker interleaving, and Streamdown was evaluated and rejected with documented rationale.

---

_Verified: 2026-03-07T18:18:00Z_
_Verifier: Claude (gsd-verifier)_
