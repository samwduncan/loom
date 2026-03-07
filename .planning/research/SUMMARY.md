# Project Research Summary

**Project:** Loom V2 -- M2 "The Chat"
**Domain:** AI chat interface -- streaming markdown, syntax highlighting, composer, tool cards
**Researched:** 2026-03-07
**Confidence:** HIGH

## Executive Summary

M2 transforms Loom from a functioning streaming skeleton into a complete chat experience. The core challenge is integrating rich content rendering (markdown, syntax highlighting, tool-specific cards) into an existing rAF-based streaming architecture that was deliberately built to bypass React. This is not greenfield -- it is surgical integration into proven M1 infrastructure, which constrains the approach but also reduces risk. The stack additions are minimal (4 npm packages: react-markdown, remark-gfm, rehype-raw, shiki), and most M2 features require zero new dependencies.

The recommended approach is a two-phase rendering model: raw text during active streaming (preserving the 60fps rAF buffer), full markdown + Shiki highlighting on message finalization. This is the safest path that keeps the M1 architecture intact. The research surfaced a tension between the STACK and FEATURES researchers on Streamdown vs react-markdown -- STACK recommends react-markdown (Constitution-mandated, full control over rAF integration), while FEATURES recommends Streamdown (purpose-built for AI streaming). The resolution: start with react-markdown + flush-only markdown, which ships fast with zero streaming performance risk. Evaluate Streamdown or debounced incremental parsing as a UX enhancement in a later phase if users want live formatted streaming.

The highest-risk area is the interaction between markdown parsing and the segment architecture (Pitfall 3). ActiveMessage interleaves text spans with tool chips -- markdown is a block-level format that needs full-document context. The two-phase model sidesteps this during streaming, but finalized messages still need a strategy for placing tool chips within parsed markdown. The marker-based approach (insert placeholder tokens, parse full document, replace markers with React components) is the cleanest solution. Everything else -- composer upgrade, tool card enhancements, activity status -- is well-understood with standard patterns.

## Key Findings

### Recommended Stack

M2 adds only 4 packages to the validated M1 stack. No framework changes, no new state management, no animation libraries.

**New dependencies:**
- **react-markdown ^10.1.0**: Markdown-to-React renderer -- Constitution Section 12.1 mandates this pipeline, peer dep confirmed compatible with React 19
- **remark-gfm ^4.0.1**: GFM extensions (tables, strikethrough, task lists) -- AI agents produce GFM tables constantly
- **rehype-raw ^7.0.0**: HTML passthrough for `<details>`/`<summary>` blocks in AI output
- **shiki ^4.0.1**: Syntax highlighting with JavaScript RegExp engine (no WASM), lazy language loading, CSS variable theming maps to OKLCH tokens

**Explicitly rejected:** react-textarea-autosize (pulls @babel/runtime), motion/framer-motion (CSS transitions suffice for M2), Streamdown (dual parser, CDN grammar loading, conflicts with rAF architecture), @tailwindcss/typography (not needed on Tailwind v4), @shikijs/rehype (blocks parse pipeline during grammar loading).

**Bundle impact:** ~50-60KB gzipped total (react-markdown pipeline ~40KB + Shiki core ~15KB, grammars load on demand).

See `.planning/research/STACK.md` for full version matrix, integration code patterns, and rejected alternatives with rationale.

### Expected Features

**Must have (table stakes):**
- Streaming markdown rendering (plain text -> formatted content on flush)
- Syntax-highlighted code blocks with copy button and language labels
- Auto-resize textarea composer (replace single-line input)
- All 7 message types rendering (user, assistant, tool, thinking, error, system, task_notification)
- Tool call state machine with timing (invoked -> executing -> resolved/error + elapsed time)
- Activity status line ("Reading auth.ts...")
- Scroll position preservation across session switches
- GFM table support, long content handling, user message styling

**Should have (differentiators):**
- Rich per-tool card views (BashCard, ReadCard, EditCard, WriteCard, GlobCard, GrepCard) -- THE differentiator for a coding agent UI
- Image paste/drop in composer (backend already supports it)
- Permission request banners (Allow/Deny for tool execution)
- Consecutive tool call grouping (accordion)
- Token/cost display per turn
- Keyboard shortcuts (Cmd+. stop, Escape clear)
- Draft preservation per session
- Message entrance animations, streaming cursor polish

**Defer to M3+:**
- Virtual scrolling (use content-visibility: auto first)
- Conversation branching/forking
- Rich text editor in composer (TipTap/ProseMirror)
- Full Framer Motion (CSS transitions for M2)
- Artifacts/Canvas panel, Aurora effects, Model selector, Settings panel, Light mode, Cmd+K palette

See `.planning/research/FEATURES.md` for complete competitive analysis, anti-features list, dependency graph, and phasing recommendation.

### Architecture Approach

M2 extends the existing M1 data flow at five well-defined integration points without replacing any core infrastructure. The WebSocket -> multiplexer -> stores/refs pipeline stays intact. Changes are purely at the rendering layer: ActiveMessage gains a lightweight streaming markdown parser for innerHTML (pure function, not React), AssistantMessage wraps content in a MarkdownRenderer with Shiki code blocks, ToolChip gets CSS state machine animations, ChatComposer becomes a textarea, and ActivityStatusLine reads an already-populated store field.

**Major components:**
1. **streaming-markdown.ts** -- Lightweight pure function (markdown string -> HTML string) for rAF loop, handles unclosed blocks gracefully
2. **MarkdownRenderer** -- react-markdown wrapper with custom renderers for code, tables, links (finalized messages only)
3. **shiki-highlighter.ts** -- Singleton Shiki instance with lazy language loading, CSS variable theme mapped to OKLCH tokens
4. **CodeBlock** -- Fenced code display with Shiki highlighting, language label, copy button, deferred rendering via useDeferredValue
5. **ChatComposer (rewrite)** -- Auto-resize textarea, image paste/upload, send/stop morph, keyboard shortcuts
6. **Tool card components** -- BashCard, FileCard, SearchCard registered via existing pluggable registry

**Key patterns:**
- Two-Phase Rendering: lightweight innerHTML during streaming, full react-markdown + Shiki on finalization
- Lazy Singleton: module-level Shiki highlighter created once, reused everywhere
- Registry Extension: new tool cards self-register via existing `registerTool()` API, no switch statements

See `.planning/research/ARCHITECTURE.md` for complete data flow diagrams, component boundaries, integration point analysis, and anti-patterns.

### Critical Pitfalls

1. **react-markdown re-parses entire content on every token** -- Never run react-markdown inside the rAF loop. Use two-phase rendering: raw text during streaming, full markdown on flush. This is the foundational decision of M2.

2. **Markdown parsing breaks the segment architecture** -- ActiveMessage interleaves text spans with tool chips, but markdown needs full-document context. Use marker-based approach for finalized messages: insert placeholder tokens at tool positions, parse full document, replace markers with React components.

3. **Shiki async grammar loading causes layout shifts** -- Reserve height for code blocks immediately (min-height based on line count), pre-load 7 common language grammars at startup, cache highlighted results, use useDeferredValue for non-blocking rendering.

4. **Composer auto-resize fights the CSS Grid shell** -- Grid template must be `1fr auto` (messages flex, composer intrinsic). Use useLayoutEffect for height recalculation. Cap at ~200px with inner scroll. Stabilize scroll position on resize.

5. **Tool state animations trigger layout during streaming** -- Use GPU-only animations (opacity, transform) during active streaming. Defer actual card expansion until stream ends. Constitution Section 11.4 explicitly bans height/width animation during streaming.

See `.planning/research/PITFALLS.md` for 15 pitfalls (6 critical, 5 moderate, 4 minor) with detection strategies, prevention code, and phase assignments.

## Implications for Roadmap

Based on combined research, suggested 4-phase structure for M2:

### Phase 1: Streaming Markdown + Code Blocks
**Rationale:** Highest-value, highest-risk feature. Every subsequent phase depends on formatted content rendering. The architectural decision (two-phase rendering) must be validated first. All 4 new npm packages are installed here.
**Delivers:** Formatted assistant messages with syntax-highlighted code blocks. Streaming shows lightweight markdown via innerHTML (bold, italic, code spans, paragraphs). Finalized messages show full react-markdown + Shiki rendering. Code blocks have copy buttons and language labels. GFM tables with horizontal scroll wrapper. Long content handling (word-break, link targets).
**Addresses:** Streaming markdown, syntax-highlighted code blocks, GFM tables, long content handling, code block copy button
**Avoids:** Pitfall 1 (rAF re-parse), Pitfall 2 (Shiki layout shift), Pitfall 3 (segment conflict), Pitfall 7 (unclosed blocks), Pitfall 8 (OKLCH theme conflict)
**Stack:** react-markdown ^10.1.0, remark-gfm ^4.0.1, rehype-raw ^7.0.0, shiki ^4.0.1

### Phase 2: Composer Upgrade
**Rationale:** The composer is the user's primary interaction point. Upgrading from single-line input to auto-resize textarea unlocks multiline prompts, image paste, and keyboard shortcuts. Independent of Phase 1 in code, but testing is better with formatted messages available.
**Delivers:** Auto-resize textarea (CSS Grid trick or useLayoutEffect mirror), Shift+Enter for newlines, image paste/drop with thumbnail previews (blob URLs, not data URIs), send/stop morph animation (CSS crossfade), keyboard shortcuts (Cmd+. stop, Escape clear), draft preservation per session (localStorage).
**Addresses:** Auto-resize textarea, image paste/drop, send/stop polish, keyboard shortcuts, draft preservation
**Avoids:** Pitfall 4 (Grid shell conflict), Pitfall 9 (send/stop state machine), Pitfall 10 (image memory pressure)

### Phase 3: Message Types + Tool Cards
**Rationale:** Complete message type coverage prevents broken gaps in real conversations. Rich tool cards are Loom's core differentiator. Depends on Phase 1 -- tool card output needs MarkdownRenderer and Shiki for syntax-highlighted file contents and diff views.
**Delivers:** All 7 message types (error banner with retry affordance, system message centered/muted, task notification with icon), permission request banners with Allow/Deny + 55s timeout indicator, rich per-tool cards (BashCard with terminal-styled output, ReadCard with syntax-highlighted content, EditCard with unified diff view, WriteCard with content preview, GlobCard with file list, GrepCard with match context), tool state elapsed time counter, consecutive tool call grouping accordion, activity status line.
**Addresses:** All message types, permission banners, rich tool cards, tool timing, tool grouping, activity status
**Avoids:** Pitfall 5 (tool animation layout during streaming), Pitfall 6 (activity status re-renders)

### Phase 4: Scroll, Polish, Integration
**Rationale:** Wire everything together for the complete experience. Individually small items that accumulate into the 10/10 quality bar. Good candidate for parallel execution within the phase.
**Delivers:** Scroll position preservation across session switches (per-session Map in useRef + useLayoutEffect restore), message entrance animations (tailwindcss-animate: fade-in + slide-from-bottom, respects prefers-reduced-motion), token/cost display per turn (muted text below assistant message), thinking block styling polish (character count, global toggle, italic text), content-visibility: auto on past messages (Constitution 10.5), streaming cursor polish (rose accent, 1s pulse cycle), user message styling upgrade (bg-card, rounded-lg, hover timestamp).
**Addresses:** Scroll preservation, entrance animations, token display, thinking polish, content-visibility, cursor polish, user message styling

### Phase Ordering Rationale

- **Phase 1 first** because it installs all new dependencies and makes the foundational architectural decision (two-phase rendering). Phases 3 and 4 depend on markdown rendering being solved.
- **Phase 2 is independent** of Phase 1 in code, but sequencing it second means all subsequent testing happens with the upgraded composer, which is better for integration validation.
- **Phase 3 depends on Phase 1** -- tool card output needs the MarkdownRenderer and Shiki for syntax-highlighted file contents and diff views in ReadCard and EditCard.
- **Phase 4 is pure polish** -- each item is small, low-risk, and independently shippable. ResizeObserver enhancement to scroll anchor should happen after all dynamic-height components (code blocks, tool cards) are built.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1:** The streaming markdown strategy (raw text vs debounced incremental) needs a spike. The segment/markdown conflict (Pitfall 3) needs careful implementation design with the marker-based approach. The Shiki CSS variable theme integration with OKLCH tokens needs a concrete theme file.
- **Phase 3:** Permission request banner interaction needs validation against backend WebSocket protocol (timeout behavior, cancellation edge cases, concurrent requests). EditToolCard unified diff rendering needs a concrete approach (diff parsing library or manual, syntax-aware line coloring).

Phases with standard patterns (skip research-phase):
- **Phase 2:** Textarea auto-resize, image paste, keyboard shortcuts are well-documented with clear implementation paths from STACK.md and ARCHITECTURE.md.
- **Phase 4:** All items are incremental enhancements to existing components using standard CSS/React patterns.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All versions verified via npm registry 2026-03-07. Peer dep compatibility confirmed with React 19. Bundle sizes measured. Only 4 new packages. |
| Features | HIGH | Verified against 6 reference apps. Clear table stakes vs differentiators. Anti-features explicitly documented. Backend WebSocket protocol already supports all needed message types. |
| Architecture | HIGH | Based on direct analysis of existing M1 source code. Integration points are concrete with specific file paths, not speculative. Two-phase rendering validated against rAF buffer design. |
| Pitfalls | HIGH | All pitfalls specific to Loom's existing architecture (rAF buffer, segment array, OKLCH tokens, CSS Grid shell). Prevention strategies reference actual code paths and M1 lessons learned. |

**Overall confidence:** HIGH

### Gaps to Address

- **Streaming markdown UX tradeoff:** The recommended approach (raw text during streaming, markdown on flush) is safest but means users see unformatted text while the model streams. V1 did this and users accepted it, but competitors show formatted streaming. This is a UX call that may need revisiting after Phase 1 ships. If the raw-to-formatted flash on completion feels bad, evaluate Streamdown or debounced incremental parsing.

- **Streamdown vs react-markdown disagreement:** FEATURES research recommends Streamdown, STACK research recommends react-markdown. Synthesis recommends react-markdown (lower integration risk, Constitution compliance, full control over rAF integration). If Phase 1 streaming-to-formatted transition feels jarring, Streamdown should be evaluated as an alternative for the streaming path specifically.

- **Shiki theme mapping to OKLCH:** No research file provided a complete Shiki theme file mapping token types to OKLCH CSS variables. The `css-variables` theme approach is documented but the concrete variable names and OKLCH values need to be worked out during Phase 1 planning.

- **EditToolCard diff rendering:** No research file specified how to parse unified diff format or render syntax-aware diffs. This needs a mini-research spike during Phase 3 planning -- options include a lightweight diff parser, repurposing the V1 DiffViewer component patterns, or rendering raw diff text with syntax highlighting.

- **Permission request edge cases:** The Allow/Deny banner design is straightforward, but edge cases (timeout while user is typing, permission cancelled by backend while banner is visible, rapid sequential permission requests) need validation against actual backend behavior during Phase 3 planning.

## Sources

### Primary (HIGH confidence)
- Loom M1 source code: useStreamBuffer.ts, ActiveMessage.tsx, stream-multiplexer.ts, tool-registry.ts, ChatComposer.tsx, AssistantMessage.tsx, stream.ts, timeline.ts
- npm registry (2026-03-07): react-markdown@10.1.0, remark-gfm@4.0.1, rehype-raw@7.0.0, shiki@4.0.1
- Shiki documentation: RegExp engines, lazy loading, CSS variable themes, custom themes
- Loom V2 Constitution (.planning/V2_CONSTITUTION.md): Sections 3, 10, 11, 12
- Backend API Contract (.planning/BACKEND_API_CONTRACT.md): WebSocket protocol, image upload, permission request/response

### Secondary (MEDIUM confidence)
- 6 reference app analysis (.planning/reference-app-analysis.md): Claude.ai, ChatGPT, Perplexity, Open WebUI, LobeChat, LibreChat
- Streamdown (streamdown.ai): Evaluated by FEATURES researcher, deferred by synthesis -- may revisit after Phase 1
- react-shiki: Streaming-optimized Shiki wrapper with throttle support
- AI SDK markdown chatbot memoization cookbook
- CSS-Tricks autogrowing textarea technique
- react-markdown performance discussion (GitHub #459)

### Tertiary (LOW confidence)
- Streamdown + react-shiki integration: Open GitHub issue (#115), unresolved at time of research
- shiki-stream: Streaming Shiki highlighting, evaluated but not recommended for Loom's two-phase architecture

---
*Research completed: 2026-03-07*
*Ready for roadmap: yes*
