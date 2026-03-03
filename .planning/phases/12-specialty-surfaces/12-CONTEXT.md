# Phase 12: Specialty Surfaces - Context

**Gathered:** 2026-03-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Third-party embedded surfaces (terminal, code editor, syntax highlighting, diffs, markdown prose) all match the charcoal + rose palette — no visual seams between app and embedded content. This phase re-themes xterm, CodeMirror, Shiki, react-diff-viewer, and markdown prose components.

</domain>

<decisions>
## Implementation Decisions

### Syntax color palette
- Use Catppuccin Mocha as the base palette for all syntax highlighting (Shiki code blocks AND CodeMirror file editor)
- Warm-shift the Catppuccin Mocha base/surface colors to blend with the app's warm charcoal hue — token colors stay Catppuccin, backgrounds integrate seamlessly
- Shiki and CodeMirror MUST use identical token colors (keyword=mauve, string=green, type=yellow, etc.) — single source of truth for the color map
- Code block backgrounds should be slightly darker than the app's surface-base (#1b1a19) to visually distinguish code from surrounding content — use warm-shifted Catppuccin base or surface-raised token
- Replace all v1.0 warm brown/amber color remnants in useShikiHighlighter.ts (WARM_COLOR_REPLACEMENTS) and DiffViewer.tsx (warmDiffStyles)

### Markdown prose styling
- Prose content links (markdown preview, editor preview) use rose accent (text-primary / #D4736C)
- Chat inline links STAY blue (text-status-info / #6bacce) — different context, different color
- Heading hierarchy (h1-h4) uses warm white foreground only — hierarchy communicated through font size and weight, not color. Matches Claude.ai / ChatGPT approach
- Blockquote left border uses rose accent color (--primary) instead of current border/10
- Inline code snippets use Catppuccin-tinted background color (matching fenced code block background) for visual consistency between inline code and code blocks

### Claude's Discretion
- Terminal ANSI palette implementation (Catppuccin Mocha per success criteria — exact hex mapping)
- Terminal cursor style (bar cursor per success criteria), font (JetBrains Mono 14px), line height (1.2)
- CodeMirror custom theme construction approach (EditorView.theme vs createTheme)
- Diff viewer updated palette (follow same charcoal + Catppuccin approach)
- Shiki theme selection (catppuccin-mocha if available, or dark-plus with color replacements)
- Exact warm-shift amounts for Catppuccin base colors

</decisions>

<specifics>
## Specific Ideas

- Catppuccin Mocha is the reference palette (https://catppuccin.com/palette) — all token colors derive from it
- "Warm-shifted" means: Catppuccin Mocha's blue-leaning base (#1e1e2e) gets shifted toward the app's warm charcoal hue so backgrounds don't clash, but syntax token colors (mauve, green, peach, sky, etc.) remain recognizably Catppuccin
- The goal is that a user familiar with Catppuccin would recognize the palette, while the backgrounds feel native to the app

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/index.css` CSS custom properties: Full charcoal + rose design token system (--surface-base, --surface-raised, --surface-elevated, --primary, --foreground, --muted-foreground)
- `tailwind.config.js`: Maps CSS vars to Tailwind classes (bg-surface-base, text-primary, etc.)
- `@tailwindcss/typography` plugin: Already installed for prose rendering
- `--diff-added-bg` and `--diff-removed-bg` CSS tokens already defined and ready for Phase 12

### Established Patterns
- Semantic token system: Components use Tailwind semantic classes (bg-surface-base, text-foreground), not raw hex
- Shiki singleton pattern in useShikiHighlighter.ts with colorReplacements map — easy to swap colors
- DiffViewer uses inline styles object (warmDiffStyles) — needs migration to semantic tokens or updated hex values

### Integration Points
- **Terminal**: `src/components/shell/constants/constants.ts` — TERMINAL_OPTIONS.theme object (hardcoded hex values)
- **CodeMirror**: `src/components/code-editor/view/subcomponents/CodeEditorSurface.tsx` — imports `oneDark`, needs custom theme
- **Shiki**: `src/components/chat/hooks/useShikiHighlighter.ts` — WARM_COLOR_REPLACEMENTS map
- **Diff viewer**: `src/components/chat/tools/components/DiffViewer.tsx` — warmDiffStyles object
- **Markdown links**: `src/components/chat/view/subcomponents/Markdown.tsx` — staticComponents.a uses text-status-info
- **Markdown preview**: `src/components/code-editor/view/subcomponents/markdown/MarkdownPreview.tsx` — already uses prose-a:text-primary
- **Inline code**: `src/components/chat/view/subcomponents/Markdown.tsx` — CodeBlockComponent inline branch uses bg-surface-raised/60
- **Code block fallback**: `src/components/chat/view/subcomponents/CodeBlock.tsx` — Shiki HTML override classes [&_pre]:!bg-surface-base

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 12-specialty-surfaces*
*Context gathered: 2026-03-03*
