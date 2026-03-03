# Phase 12: Specialty Surfaces - Research

**Researched:** 2026-03-03
**Domain:** Terminal, CodeMirror, Shiki, Diff Viewer, and Markdown prose theming
**Confidence:** HIGH

## Summary

Phase 12 re-themes five embedded third-party surfaces (xterm.js terminal, CodeMirror file editor, Shiki syntax highlighting, react-diff-viewer-continued, and Tailwind Typography markdown prose) to match the app's charcoal + dusty rose palette. The core approach is adopting Catppuccin Mocha as the syntax token color palette while warm-shifting its base/surface colors to blend with the app's warm charcoal (#1b1a19).

All five surfaces currently use either VS Code Dark+ defaults or v1.0 warm brown/amber colors that need replacement. The terminal has hardcoded VS Code Dark+ ANSI colors, CodeMirror uses the `oneDark` theme import, Shiki uses `dark-plus` with a `WARM_COLOR_REPLACEMENTS` map containing v1.0 earthy tones, the diff viewer has `warmDiffStyles` with v1.0 browns, and markdown prose links use `text-status-info` (blue) in chat context which is correct but blockquote borders use `border-border/10` instead of rose.

**Primary recommendation:** Create a single shared Catppuccin Mocha color map constant file, then apply it to all five surfaces. Use Shiki's built-in `catppuccin-mocha` theme (confirmed available in v4 bundle), create a custom CodeMirror theme extension via `EditorView.theme()`, update xterm.js theme object with Catppuccin Mocha ANSI colors, update diff viewer styles with charcoal + Catppuccin colors, and fix markdown prose border/heading/inline-code styling.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Use Catppuccin Mocha as the base palette for all syntax highlighting (Shiki code blocks AND CodeMirror file editor)
- Warm-shift the Catppuccin Mocha base/surface colors to blend with the app's warm charcoal hue -- token colors stay Catppuccin, backgrounds integrate seamlessly
- Shiki and CodeMirror MUST use identical token colors (keyword=mauve, string=green, type=yellow, etc.) -- single source of truth for the color map
- Code block backgrounds should be slightly darker than the app's surface-base (#1b1a19) to visually distinguish code from surrounding content -- use warm-shifted Catppuccin base or surface-raised token
- Replace all v1.0 warm brown/amber color remnants in useShikiHighlighter.ts (WARM_COLOR_REPLACEMENTS) and DiffViewer.tsx (warmDiffStyles)
- Prose content links (markdown preview, editor preview) use rose accent (text-primary / #D4736C)
- Chat inline links STAY blue (text-status-info / #6bacce) -- different context, different color
- Heading hierarchy (h1-h4) uses warm white foreground only -- hierarchy communicated through font size and weight, not color
- Blockquote left border uses rose accent color (--primary) instead of current border/10
- Inline code snippets use Catppuccin-tinted background color (matching fenced code block background) for visual consistency

### Claude's Discretion
- Terminal ANSI palette implementation (Catppuccin Mocha per success criteria -- exact hex mapping)
- Terminal cursor style (bar cursor per success criteria), font (JetBrains Mono 14px), line height (1.2)
- CodeMirror custom theme construction approach (EditorView.theme vs createTheme)
- Diff viewer updated palette (follow same charcoal + Catppuccin approach)
- Shiki theme selection (catppuccin-mocha if available, or dark-plus with color replacements)
- Exact warm-shift amounts for Catppuccin base colors

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SURF-01 | xterm.js terminal uses Catppuccin Mocha ANSI palette on charcoal base -- terminal background matches app, not embedded black box | Catppuccin Mocha palette verified, xterm ITerminalOptions.theme supports all 16 ANSI + extended colors |
| SURF-02 | Terminal uses JetBrains Mono font, bar cursor, 14px font size, 1.2 line height | xterm supports `cursorStyle: 'bar'`, `fontFamily`, `fontSize`, `lineHeight` options directly |
| SURF-03 | CodeMirror file viewer uses charcoal + rose dark theme consistent with app palette | `EditorView.theme()` with `{dark: true}` creates custom dark theme extensions |
| SURF-04 | Shiki syntax highlighting color replacement map updated for charcoal palette | Shiki v4 bundles `catppuccin-mocha` theme natively -- can use directly instead of colorReplacements |
| SURF-05 | Diff viewer (react-diff-viewer-continued) theme updated with charcoal + rose colors | warmDiffStyles object fully overridable, CSS custom properties --diff-added-bg and --diff-removed-bg already defined |
| SURF-06 | Markdown prose content (Tailwind Typography) uses rose accent for links and correct heading colors on charcoal | Tailwind Typography prose modifiers (prose-a:, prose-headings:, prose-blockquote:) available |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @xterm/xterm | ^5.5.0 | Terminal emulator | Already installed, ITerminalOptions.theme for full ANSI palette |
| @uiw/react-codemirror | ^4.23.13 | React CodeMirror wrapper | Already installed, passes theme as Extension |
| @codemirror/theme-one-dark | ^6.1.2 | Current theme (to be replaced) | Will be replaced with custom theme |
| shiki | ^4.0.1 | Syntax highlighting | Already installed, v4 bundles catppuccin-mocha theme |
| react-diff-viewer-continued | ^4.1.2 | Diff viewer | Already installed, styles prop for full theme override |
| @tailwindcss/typography | ^0.5.16 | Prose styling | Already installed, prose-* modifiers for markdown |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @codemirror/view | (peer dep) | EditorView.theme() API | Creating custom CodeMirror theme extension |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| EditorView.theme() | @uiw/codemirror-themes createTheme() | createTheme is higher-level but adds dependency; EditorView.theme() is native CM6 API |
| catppuccin-mocha Shiki theme | dark-plus with colorReplacements | catppuccin-mocha is native, no manual mapping needed |

**Installation:**
No new packages needed -- all dependencies already installed.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── shared/
│   └── catppuccin-mocha.ts         # Shared Catppuccin Mocha color constants
├── components/
│   ├── shell/constants/constants.ts # Terminal options (SURF-01, SURF-02)
│   ├── code-editor/
│   │   └── view/subcomponents/
│   │       └── CodeEditorSurface.tsx # CodeMirror theme (SURF-03)
│   ├── chat/
│   │   ├── hooks/useShikiHighlighter.ts  # Shiki theme (SURF-04)
│   │   ├── tools/components/DiffViewer.tsx # Diff styles (SURF-05)
│   │   └── view/subcomponents/
│   │       ├── Markdown.tsx          # Chat markdown (SURF-06)
│   │       └── CodeBlock.tsx         # Code block styling
│   └── code-editor/view/subcomponents/
│       └── markdown/MarkdownPreview.tsx # Editor markdown (SURF-06)
```

### Pattern 1: Shared Color Constants
**What:** Single source of truth for Catppuccin Mocha colors used across all surfaces
**When to use:** Any time a surface needs to reference the syntax color palette
**Example:**
```typescript
// src/shared/catppuccin-mocha.ts
// Catppuccin Mocha official palette
export const catppuccinMocha = {
  // Base/Surface colors (warm-shifted to match app charcoal)
  base: '#1b1a19',       // App's --surface-base (NOT Catppuccin's blue #1e1e2e)
  mantle: '#191817',     // Slightly darker than base for code blocks
  crust: '#151413',      // Darkest level
  surface0: '#252423',   // App's --secondary
  surface1: '#2b2a29',   // App's --surface-elevated
  surface2: '#343332',   // Slightly lighter

  // Text colors (warm-shifted)
  text: '#e4dbd9',       // App's --foreground
  subtext1: '#bdb9b9',   // App's --foreground-secondary
  subtext0: '#989494',   // App's --muted-foreground
  overlay2: '#7a7676',
  overlay1: '#636060',
  overlay0: '#4d4a4a',

  // Accent/token colors (pure Catppuccin Mocha -- NOT warm-shifted)
  rosewater: '#f5e0dc',
  flamingo: '#f2cdcd',
  pink: '#f5c2e7',
  mauve: '#cba6f7',
  red: '#f38ba8',
  maroon: '#eba0ac',
  peach: '#fab387',
  yellow: '#f9e2af',
  green: '#a6e3a1',
  teal: '#94e2d5',
  sky: '#89dceb',
  sapphire: '#74c7ec',
  blue: '#89b4fa',
  lavender: '#b4befe',
} as const;

// Semantic mapping for syntax highlighting
export const syntaxColors = {
  keyword: catppuccinMocha.mauve,       // #cba6f7
  string: catppuccinMocha.green,        // #a6e3a1
  type: catppuccinMocha.yellow,         // #f9e2af
  function: catppuccinMocha.blue,       // #89b4fa
  variable: catppuccinMocha.text,       // #e4dbd9
  comment: catppuccinMocha.overlay1,    // #636060 (warm-shifted)
  number: catppuccinMocha.peach,        // #fab387
  operator: catppuccinMocha.sky,        // #89dceb
  controlFlow: catppuccinMocha.mauve,   // #cba6f7
  constant: catppuccinMocha.peach,      // #fab387
  tag: catppuccinMocha.blue,            // #89b4fa
  attribute: catppuccinMocha.yellow,    // #f9e2af
  property: catppuccinMocha.lavender,   // #b4befe
} as const;
```

### Pattern 2: CodeMirror Custom Theme via EditorView.theme()
**What:** Native CM6 theme extension with Catppuccin colors
**When to use:** Replacing the `oneDark` import
**Example:**
```typescript
// Source: CodeMirror official docs
import { EditorView } from '@codemirror/view';
import { catppuccinMocha, syntaxColors } from '@/shared/catppuccin-mocha';

export const loomDarkTheme = EditorView.theme({
  '&': {
    backgroundColor: catppuccinMocha.base,
    color: catppuccinMocha.text,
  },
  '.cm-content': {
    caretColor: catppuccinMocha.rosewater,
  },
  '&.cm-focused .cm-cursor': {
    borderLeftColor: catppuccinMocha.rosewater,
  },
  '.cm-gutters': {
    backgroundColor: catppuccinMocha.mantle,
    color: catppuccinMocha.overlay0,
    borderRight: 'none',
  },
  '.cm-activeLineGutter': {
    backgroundColor: catppuccinMocha.surface0,
  },
  '.cm-activeLine': {
    backgroundColor: `${catppuccinMocha.surface0}40`,
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
    backgroundColor: `${catppuccinMocha.surface2}80`,
  },
  '.cm-selectionMatch': {
    backgroundColor: `${catppuccinMocha.surface2}40`,
  },
}, { dark: true });
```

### Pattern 3: Shiki with Native catppuccin-mocha Theme
**What:** Use Shiki's bundled catppuccin-mocha theme instead of dark-plus with color replacements
**When to use:** All Shiki-powered code blocks and diff lines
**Example:**
```typescript
// Source: Shiki v4 docs - catppuccin-mocha is a bundled theme
const highlighter = await createHighlighter({
  themes: ['catppuccin-mocha'],
  langs: [/* existing langs */],
});

return highlighter.codeToHtml(code, {
  lang: safeLang,
  theme: 'catppuccin-mocha',
  // Warm-shift only the base/surface colors to match app charcoal
  colorReplacements: {
    '#1e1e2e': '#191817',  // Catppuccin base -> warm code block bg
    '#181825': '#151413',  // Catppuccin mantle -> darker
    '#11111b': '#111010',  // Catppuccin crust -> darkest
    '#313244': '#252423',  // Catppuccin surface0 -> app secondary
    '#45475a': '#2b2a29',  // Catppuccin surface1 -> app elevated
    '#585b70': '#343332',  // Catppuccin surface2
    '#cdd6f4': '#e4dbd9',  // Catppuccin text -> app foreground
    '#bac2de': '#bdb9b9',  // Catppuccin subtext1 -> app foreground-secondary
    '#a6adc8': '#989494',  // Catppuccin subtext0 -> app muted-foreground
    '#9399b2': '#7a7676',  // overlay2
    '#7f849c': '#636060',  // overlay1
    '#6c7086': '#4d4a4a',  // overlay0
  },
});
```

### Anti-Patterns to Avoid
- **Duplicating color constants:** Each surface defining its own Catppuccin hex values. Use shared constants.
- **Hardcoding colors instead of tokens:** The diff viewer and terminal should reference the shared constant, not inline hex strings.
- **Mixing VS Code Dark+ and Catppuccin:** Don't leave remnants of the old dark-plus theme in any surface.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Shiki Catppuccin colors | Manual color mapping in WARM_COLOR_REPLACEMENTS | Built-in `catppuccin-mocha` theme + colorReplacements for base shift only | Shiki v4 bundles the official theme with correct token scoping |
| CodeMirror syntax highlighting | Manual HighlightStyle for every token | `@codemirror/theme-one-dark`'s `highlightStyle` as reference, adapt with Catppuccin colors | Token scope definitions are complex; adapt existing, don't rebuild |
| Terminal ANSI color testing | Visual inspection only | Write a terminal test string that exercises all 16 ANSI colors | Catches missed colors early |

**Key insight:** Shiki's native catppuccin-mocha theme handles all token-to-color mapping automatically -- the only manual work is warm-shifting the 12 base/surface/text colors via colorReplacements. This eliminates 90% of the color mapping work compared to the current dark-plus approach.

## Common Pitfalls

### Pitfall 1: CodeMirror Theme Not Applying
**What goes wrong:** Custom theme doesn't override oneDark defaults
**Why it happens:** CodeMirror themes are Extensions -- order matters. If oneDark is loaded after the custom theme, it wins.
**How to avoid:** Replace `oneDark` entirely, don't stack themes. Pass custom theme as the sole theme extension.
**Warning signs:** Some elements use old colors (especially gutters, selection)

### Pitfall 2: Shiki Background Color Override Failure
**What goes wrong:** Shiki injects inline `style="background-color:#1e1e2e"` on the `<pre>` tag, overriding CSS classes
**Why it happens:** Shiki sets background from theme. colorReplacements applies, but CSS specificity with `!bg-surface-base` may conflict.
**How to avoid:** Use colorReplacements to set the warm-shifted background. The existing `[&_pre]:!bg-surface-base` override in CodeBlock.tsx should be updated to match the code block background color.
**Warning signs:** Code blocks have different background than expected

### Pitfall 3: Diff Viewer Color Mismatch
**What goes wrong:** ShikiDiffLine uses Shiki highlighting (catppuccin-mocha) but diff viewer container uses different base colors
**Why it happens:** warmDiffStyles in DiffViewer.tsx and Shiki colorReplacements use different color systems
**How to avoid:** Both must reference the same shared constants. Diff backgrounds (added/removed) should use the CSS custom properties --diff-added-bg and --diff-removed-bg.
**Warning signs:** Text tokens look different in diff view vs regular code blocks

### Pitfall 4: CodeMirror Missing Syntax Highlighting
**What goes wrong:** Custom theme only styles the editor chrome (background, gutters) but leaves syntax tokens unstyled
**Why it happens:** `EditorView.theme()` handles editor elements, but syntax highlighting requires a separate `HighlightStyle` extension using `@lezer/highlight` tags
**How to avoid:** Create both a `EditorView.theme()` for editor chrome AND a `syntaxHighlighting(HighlightStyle.define([...]))` for token colors. Both are needed for a complete theme.
**Warning signs:** Code appears as monochrome text despite theme being applied

### Pitfall 5: Terminal Font Not Loading
**What goes wrong:** JetBrains Mono doesn't render, falls back to system monospace
**Why it happens:** The font needs to be available via CSS @font-face or installed locally
**How to avoid:** The project already imports JetBrains Mono in index.css (line 190) for code elements. Use the same font-family string in terminal options. Verify the @font-face declaration covers the font.
**Warning signs:** Terminal text uses different font than code blocks

## Code Examples

### xterm.js Catppuccin Mocha ANSI Theme (SURF-01, SURF-02)
```typescript
// Source: xterm.js docs + Catppuccin Mocha palette
import { catppuccinMocha } from '@/shared/catppuccin-mocha';

export const TERMINAL_OPTIONS: ITerminalOptions = {
  cursorBlink: true,
  cursorStyle: 'bar',                    // SURF-02: bar cursor
  fontSize: 14,                          // SURF-02: 14px
  fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace", // SURF-02
  lineHeight: 1.2,                       // SURF-02: 1.2 line height
  allowProposedApi: true,
  allowTransparency: false,
  convertEol: true,
  scrollback: 10000,
  tabStopWidth: 4,
  windowsMode: false,
  macOptionIsMeta: true,
  macOptionClickForcesSelection: true,
  theme: {
    background: catppuccinMocha.base,     // #1b1a19 -- matches app
    foreground: catppuccinMocha.text,     // #e4dbd9
    cursor: catppuccinMocha.rosewater,   // #f5e0dc
    cursorAccent: catppuccinMocha.base,  // #1b1a19
    selectionBackground: `${catppuccinMocha.surface2}80`,
    selectionForeground: catppuccinMocha.text,
    // Catppuccin Mocha ANSI colors
    black: catppuccinMocha.surface1,     // #2b2a29 (warm-shifted)
    red: catppuccinMocha.red,            // #f38ba8
    green: catppuccinMocha.green,        // #a6e3a1
    yellow: catppuccinMocha.yellow,      // #f9e2af
    blue: catppuccinMocha.blue,          // #89b4fa
    magenta: catppuccinMocha.pink,       // #f5c2e7
    cyan: catppuccinMocha.teal,          // #94e2d5
    white: catppuccinMocha.subtext1,     // #bdb9b9 (warm-shifted)
    brightBlack: catppuccinMocha.overlay0, // #4d4a4a (warm-shifted)
    brightRed: catppuccinMocha.red,      // #f38ba8
    brightGreen: catppuccinMocha.green,  // #a6e3a1
    brightYellow: catppuccinMocha.yellow, // #f9e2af
    brightBlue: catppuccinMocha.blue,    // #89b4fa
    brightMagenta: catppuccinMocha.pink,  // #f5c2e7
    brightCyan: catppuccinMocha.teal,    // #94e2d5
    brightWhite: catppuccinMocha.text,   // #e4dbd9 (warm-shifted)
  },
};
```

### CodeMirror Complete Custom Theme (SURF-03)
```typescript
// Source: CodeMirror docs - EditorView.theme() + HighlightStyle.define()
import { EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import { catppuccinMocha, syntaxColors } from '@/shared/catppuccin-mocha';

// Editor chrome theme
const loomEditorTheme = EditorView.theme({
  '&': {
    backgroundColor: catppuccinMocha.base,
    color: catppuccinMocha.text,
  },
  '.cm-gutters': {
    backgroundColor: catppuccinMocha.mantle,
    color: catppuccinMocha.overlay0,
    borderRight: 'none',
  },
  // ... more styles
}, { dark: true });

// Syntax highlighting style
const loomHighlightStyle = HighlightStyle.define([
  { tag: tags.keyword, color: syntaxColors.keyword },
  { tag: tags.string, color: syntaxColors.string },
  { tag: tags.typeName, color: syntaxColors.type },
  { tag: tags.function(tags.variableName), color: syntaxColors.function },
  { tag: tags.comment, color: syntaxColors.comment, fontStyle: 'italic' },
  { tag: tags.number, color: syntaxColors.number },
  // ... more tag mappings
]);

// Combined extension (both needed)
export const loomDarkTheme = [
  loomEditorTheme,
  syntaxHighlighting(loomHighlightStyle),
];
```

### Shiki with catppuccin-mocha (SURF-04)
```typescript
// Source: Shiki v4 docs - catppuccin-mocha is bundled
const highlighter = await createHighlighter({
  themes: ['catppuccin-mocha'],
  langs: [/* same language list */],
});

// Only need to warm-shift base/surface colors
return highlighter.codeToHtml(code, {
  lang: safeLang,
  theme: 'catppuccin-mocha',
  colorReplacements: WARM_BASE_REPLACEMENTS, // from shared constants
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Shiki dark-plus + full color map | catppuccin-mocha bundled theme | Shiki v1+ | Eliminates manual token color mapping |
| CodeMirror oneDark import | EditorView.theme() custom | Always available | Full control over every element |
| xterm VS Code defaults | Custom ANSI palette | Always available | Terminal matches app identity |

**Deprecated/outdated:**
- The `WARM_COLOR_REPLACEMENTS` map in useShikiHighlighter.ts maps VS Code Dark+ colors to warm brown/amber tones. This entire map will be replaced.
- The `warmDiffStyles` object in DiffViewer.tsx uses v1.0 brown/amber color scheme. Will be updated to charcoal + Catppuccin.

## Project Tooling

| Tool | Command | Detected From |
|------|---------|---------------|
| Lint | Not detected | -- |
| Type Check | `npm run typecheck` | package.json scripts |
| Build | `npm run build` | package.json scripts |
| Test | Not detected | -- |

*Already written to `.planning/config.json` under `tooling` key.*

## Open Questions

1. **Exact warm-shift delta for Catppuccin base colors**
   - What we know: Catppuccin Mocha base is #1e1e2e (blue-leaning). App base is #1b1a19 (warm charcoal). The shift removes blue and adds warm undertone.
   - What's unclear: Exact hue/saturation adjustments for intermediate surface colors
   - Recommendation: Use the existing app CSS custom property values (surface-base, surface-raised, surface-elevated) as the warm-shifted equivalents of Catppuccin's base/mantle/surface colors. This ensures perfect integration since those tokens are already in use everywhere.

2. **CodeMirror HighlightStyle tag coverage**
   - What we know: @lezer/highlight provides ~30+ tag types. We need comprehensive coverage.
   - What's unclear: Which tags are actually used by the loaded language modes
   - Recommendation: Start with the tags that @codemirror/theme-one-dark defines (it covers ~20 tags), then map each to Catppuccin colors. This is a proven complete set.

## Sources

### Primary (HIGH confidence)
- Shiki v4 docs - catppuccin-mocha bundled theme confirmed via Context7 code example
- xterm.js docs - ITerminalOptions with cursorStyle, fontFamily, fontSize, lineHeight, theme confirmed via Context7
- CodeMirror docs - EditorView.theme() with {dark: true} confirmed via Context7
- Catppuccin Mocha official palette - all 26 colors verified from catppuccin.com

### Secondary (MEDIUM confidence)
- @codemirror/language HighlightStyle.define() API for syntax token styling
- react-diff-viewer-continued styles prop for theme overrides

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already installed and APIs verified via Context7
- Architecture: HIGH - patterns based on official documentation APIs
- Pitfalls: MEDIUM - based on known CodeMirror/Shiki integration patterns

**Research date:** 2026-03-03
**Valid until:** 2026-04-03 (stable libraries, no breaking changes expected)
