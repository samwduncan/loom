# Phase 16: Per-Tool Cards - Context

**Gathered:** 2026-03-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Each of the 6 registered tools (Bash, Read, Edit, Write, Glob, Grep) gets a purpose-built card body replacing DefaultToolCard, with syntax highlighting, diff views, terminal output, and file lists. Cards register via `registerTool()` and render inside ToolCardShell (Phase 15). ANSI color support for BashToolCard (ENH-02) is included. Tool grouping/accordion is Phase 17 scope. Visual effects (SpotlightCard on cards) are Phase 19 scope.

</domain>

<decisions>
## Implementation Decisions

### Truncation & "Show more"
- Inline expand pattern: card body starts truncated at threshold, "Show N more lines" button at bottom reveals the rest in-place. Card grows taller. Scroll anchor keeps page stable.
- Per-card thresholds: Bash ~50 lines, Read ~100 lines, Write ~20 lines, Edit shows full diff (diffs are compact), Glob ~20 files, Grep ~5 files
- Button shows exact count: "Show 234 more lines" / "Show 8 more files"
- "Show less" button appears after expanding to re-truncate
- Truncation is a shared pattern — consider a `useTruncation(lines, threshold)` hook or `TruncatedContent` wrapper component for reuse across all 6 cards

### Diff presentation (EditToolCard)
- Unified diff layout: single column, green lines for additions (`bg-diff-added`), red lines for deletions (`bg-diff-removed`), context lines neutral
- Dual line number gutter: old line number | new line number
- Line coloring only — no Shiki syntax highlighting within diffs. Keeps color meaning clear (green = added, red = removed)
- Client-side diff computation from `old_string`/`new_string` using lightweight diff library (`diff` npm package, ~4KB). No backend changes.
- 3 context lines above/below each change hunk (standard git diff default)

### Terminal aesthetics (BashToolCard)
- Terminal-styled: dark `bg-surface-0` background, monospace font, ANSI color rendering
- Distinct command header: `$ command` displayed in its own row at top of card body with accent styling, visually separated from output by spacing/divider
- ANSI support: basic 16 colors (8 base + 8 bright) + bold + underline + reset. Covers 95% of real CLI output.
- ANSI color mapping uses design tokens from tokens.css (e.g., ANSI green → `--status-success`, ANSI red → `--status-error`). Constitution compliant, no hardcoded colors.
- Lightweight ANSI-to-HTML converter (~50 lines), not a full terminal emulator

### File list density (GlobToolCard)
- Simple bulleted file list with Lucide file-type icons (`File`, `FileCode`, `FileText`, `Folder`)
- Glob pattern shown prominently in card body
- Count in summary: "12 files found"
- Paths truncated from the left if too long
- Truncation by file count (~20 files), "Show N more files" to expand

### Search results (GrepToolCard)
- Grouped by file: file path as section header, matching lines below with line numbers
- Match terms highlighted with accent background (`bg-primary/20`)
- 2 context lines above/below each match (from Grep tool's `-C` output)
- Summary: "8 matches in 4 files"
- Truncation by file count (~5 files), "Show N more files" to expand

### ReadToolCard & WriteToolCard
- Reuse existing `CodeBlock` component (Shiki highlighting, line numbers, copy button) or extract its core for card body use
- ReadToolCard: file path with Lucide icon in card body, Shiki-highlighted content, language inferred from file extension, truncated at ~100 lines
- WriteToolCard: file path with Lucide icon, Shiki-highlighted content preview (first ~20 lines), "Show full file" to expand

### Icon migration
- Replace emoji icons in tool-registry.ts with Lucide icons for consistency (File, FileCode, Terminal, GitCompare, Search, etc.)
- Aligns with ToolCardShell which already uses Lucide AlertTriangle

### Claude's Discretion
- Exact Lucide icon choices per file type
- ANSI-to-HTML converter implementation details
- Whether `useTruncation` is a hook or a wrapper component
- Exact diff library choice (npm `diff` recommended but alternatives fine)
- ReadToolCard/WriteToolCard: whether to reuse CodeBlock directly or extract a lighter variant
- Exact spacing, padding, divider treatment between command and output in BashToolCard

</decisions>

<specifics>
## Specific Ideas

- Terminal feel for BashToolCard should make agent work feel "real" — like watching a terminal, not reading a log
- Grep results should feel like ripgrep output — file-grouped, line-numbered, match-highlighted
- "Show more" button should always show exact count so user can gauge output size before expanding
- Lucide icons throughout for professional, monochrome consistency (no more emoji icons)

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `CodeBlock` (src/src/components/chat/view/CodeBlock.tsx): Shiki highlighting with line numbers, copy button, max-height scroll, language detection. Directly reusable for ReadToolCard/WriteToolCard content areas.
- `shiki-highlighter.ts` (src/src/lib/shiki-highlighter.ts): Async highlight with Map-based cache, JS RegExp engine, 7 pre-loaded grammars. Language inference from file extension needed.
- `ToolCardShell` (src/src/components/chat/tools/ToolCardShell.tsx): Provides header (icon, name, status, elapsed time), CSS Grid expand/collapse, error treatment. Per-tool cards only supply body content as children.
- `tool-registry.ts` (src/src/lib/tool-registry.ts): `registerTool()` API with `ToolCardProps` interface (toolName, input, output, isError, status). 6 tools registered, all using DefaultToolCard currently.
- `ToolChip` (src/src/components/chat/tools/ToolChip.tsx): Renders chip + ToolCardShell with CardComponent from registry. No changes needed — just swap registered renderCard components.

### Established Patterns
- CSS Grid `grid-template-rows: 0fr/1fr` for expand/collapse (ToolCardShell, ThinkingDisclosure)
- `data-status` attribute for CSS-driven state styling
- `cn()` utility for conditional Tailwind classes
- `memo()` wrapping for tool card performance
- Design tokens only — no hardcoded colors (Constitution Section 3.1)
- `dangerouslySetInnerHTML` with safety comment for Shiki output (CodeBlock pattern)

### Integration Points
- Each per-tool card replaces `DefaultToolCard` in its `registerTool()` call
- `ToolCardProps` interface provides: `toolName`, `input` (Record<string, unknown>), `output` (string | null), `isError` (boolean), `status` (ToolCallStatus)
- `input` shape varies by tool: Bash has `command`, Read/Edit/Write have `file_path`, Edit has `old_string`/`new_string`, Glob/Grep have `pattern`
- Output is always a string (tool's stdout/response text) — needs parsing per card type
- New dependency needed: `diff` npm package for EditToolCard client-side diff computation

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 16-per-tool-cards*
*Context gathered: 2026-03-08*
