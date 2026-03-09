# Phase 19: Visual Effects + Enhancements - Context

**Gathered:** 2026-03-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Cherry-picked CSS visual effects elevate the interface (SpotlightCard, ShinyText, ElectricBorder), and enhanced features round out the chat experience: thinking block inline markdown, error retry button, session message search, and conversation export. Requirements: UI-04, UI-05, ENH-03, ENH-04, ENH-05, ENH-06.

</domain>

<decisions>
## Implementation Decisions

### CSS Visual Effects — Surfaces & Behavior
- **SpotlightCard** (radial gradient hover): Applied to tool cards (ToolCardShell), sidebar session items, and sidebar project items
- **ShinyText** (shimmer sweep): Applied to "Thinking..." label in ThinkingDisclosure during streaming, and activity status line text during streaming
- **ElectricBorder** (animated border): Subtle glow on composer during active AI streaming only — soft animated gradient using primary accent colors, not dramatic
- All effects are source-level cherry-picks from React Bits (not npm install), CSS-only, zero runtime dependencies
- All effects use design tokens only — no hardcoded colors (Constitution ESLint enforcement)
- **prefers-reduced-motion**: ALL visual effects disabled (no spotlight, no shimmer, no electric border). Static fallbacks only.

### Thinking Block Markdown
- **Inline formatting only**: bold, italic, code spans, and links — no block-level elements (no lists, headings, code blocks, tables)
- Lightweight regex-based parser (NOT react-markdown) — keeps thinking visually distinct from assistant content
- Works **during streaming AND finalized** — inline formatting parsed live as tokens arrive
- Base style unchanged: `italic text-muted font-mono text-sm` — inline markdown layers on top
- Code spans within thinking get slightly different background to stand out from surrounding monospace text

### Error Retry
- "Retry" button added to ErrorMessage component (alongside existing error icon + text)
- Click resends the most recent user message before the error via WebSocket
- Error message stays visible in timeline until new response starts arriving
- No loading indicator transformation — error stays as-is, new assistant message appears below
- **Edge case — no prior user message**: Retry button hidden if no user message exists before the error
- **Edge case — disconnected WebSocket**: Retry button disabled when connection is down (same pattern as composer send button)

### Message Search
- Search icon in chat header bar — click reveals search input that slides in
- **Cmd+F** (Mac) / **Ctrl+F** (Windows) keyboard shortcut triggers search — hijacks browser find via `preventDefault`. This is standard practice (VS Code, Slack, Discord all do it). Pressing Cmd+F when search is already open focuses the input; Escape closes search and restores browser find behavior.
- **Filter mode**: non-matching messages hidden, matching messages shown with search terms highlighted (`bg-primary/20`)
- **Zero results**: centered muted empty state message — "No messages match '{query}'" — in the message area
- Clear search (Escape or X button) restores full message list
- **Search scope**: user message text, assistant message text, and thinking block content
- Does NOT search tool call inputs/outputs
- Basic substring match (case-insensitive), not fuzzy search

### Conversation Export
- **Two formats**: Markdown (.md) and JSON (.json) — user picks format from dropdown/menu when exporting
- **Markdown export includes**: user messages, assistant messages (with markdown formatting), tool call summaries (tool name + key input, e.g., "Read: src/auth.ts"), token/cost metadata per assistant message as footer notes
- **JSON export includes**: full message data with all metadata, token counts, timestamps, tool call inputs/outputs — machine-readable for re-import or analysis
- **Excluded from both**: image binary data (referenced by path only)
- **Excluded from Markdown only**: thinking blocks, full tool call outputs
- Export button in **chat header menu** (alongside thinking toggle and search)
- **Filename**: `{session-title-slug}-{YYYY-MM-DD}.{md|json}` — falls back to session ID if no title

### Claude's Discretion
- SpotlightCard gradient colors and radius
- ShinyText animation speed and gradient angle
- ElectricBorder specific gradient stops and animation timing
- Thinking markdown regex implementation details
- Search input slide-in animation and layout
- Export markdown template structure and formatting
- Thinking markdown: handling of nested inline formatting (e.g., `_**bold italic**_`) — best effort is fine
- Search debounce timing (filter on every keystroke vs after 200ms pause)
- Search highlight implementation (`<mark>` tag vs span with bg class)

</decisions>

<specifics>
## Specific Ideas

- Visual effects should enhance, not distract — this is a productivity tool for developers, not a marketing page
- ElectricBorder on composer creates the "alive" feeling during generation without being overwhelming
- ShinyText on "Thinking..." makes the waiting feel intentional and polished rather than static
- Search filter mode works better with our content-visibility architecture than highlight-and-navigate (no need to scroll to off-screen matches)
- Markdown export for human reading/sharing, JSON export for data portability and analysis — both serve different "pro" use cases

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ToolCardShell` (src/src/components/chat/tools/ToolCardShell.tsx): SpotlightCard wrapper target — already has hover transitions
- `ThinkingDisclosure` (src/src/components/chat/view/ThinkingDisclosure.tsx): ShinyText wraps the "Thinking..." span; inline markdown renders in `<p>` blocks
- `StatusLine` (src/src/components/chat/view/StatusLine.tsx): ShinyText wraps activity text
- `ErrorMessage` (src/src/components/chat/view/ErrorMessage.tsx): Retry button integrates here — docstring already notes "No retry button (deferred to Phase 19)"
- `ChatComposer` (src/src/components/chat/composer/ChatComposer.tsx): ElectricBorder wraps composer container, activated by isStreaming
- `ChatView` (src/src/components/chat/view/ChatView.tsx): Search bar and export button integrate into header area
- `MessageList` (src/src/components/chat/view/MessageList.tsx): Search filtering applies here — filter messages before rendering
- `streaming-markdown.ts` (src/src/lib/streaming-markdown.ts): Existing lightweight markdown-to-HTML converter — thinking markdown parser can share patterns
- `useTimelineStore` (src/src/stores/timeline.ts): Messages array for search filtering and export data source
- `cn()` (src/src/utils/cn.ts): Conditional class utility for all new components

### Established Patterns
- CSS Grid layout in ChatView (grid-template-rows)
- Selector-only Zustand subscriptions (Constitution 4.2)
- Design tokens for all colors/durations (Constitution 3.1, 7.14)
- `prefers-reduced-motion` media query for animation opt-out
- Source-level component cherry-picking (shadcn model, now React Bits)

### Integration Points
- SpotlightCard: wraps existing components (ToolCardShell, sidebar items) — CSS-only, no behavior change
- ShinyText: wraps text spans in ThinkingDisclosure and StatusLine — CSS class addition
- ElectricBorder: wraps ChatComposer outer container — conditional on `isStreaming`
- Retry button: inside ErrorMessage, needs access to timeline store to find last user message and WebSocket to resend
- Search: new state in ChatView (searchQuery), filters messages prop passed to MessageList
- Export: utility functions that serialize messages to Markdown or JSON, trigger browser download via Blob + URL.createObjectURL

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 19-visual-effects-enhancements*
*Context gathered: 2026-03-09*
