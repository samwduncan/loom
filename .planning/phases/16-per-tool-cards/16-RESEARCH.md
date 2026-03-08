# Phase 16: Per-Tool Cards - Research

**Researched:** 2026-03-08
**Domain:** React component implementation, diff rendering, ANSI parsing, syntax highlighting integration
**Confidence:** HIGH

## Summary

Phase 16 replaces the `DefaultToolCard` for all 6 registered tools (Bash, Read, Edit, Write, Glob, Grep) with purpose-built card bodies. Each card parses its tool's `input`/`output` and renders specialized content: terminal output with ANSI colors, syntax-highlighted code, unified diffs, and structured file/search results. All cards render inside the existing `ToolCardShell` (Phase 15) and register via `registerTool()`.

The primary challenge is output parsing -- each tool has a different output format (plain text, file content, ripgrep-style grouped matches) and the cards must degrade gracefully when output doesn't match expected patterns. The secondary challenge is the `diff` npm package integration for EditToolCard's client-side diff computation from `old_string`/`new_string`.

**Primary recommendation:** Build a shared `TruncatedContent` wrapper component first (reused by all 6 cards), then implement cards in dependency order: BashToolCard (standalone, ANSI parser), ReadToolCard/WriteToolCard (Shiki integration), EditToolCard (diff library), GlobToolCard/GrepToolCard (output parsers).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Inline expand pattern for truncation: card starts truncated, "Show N more lines" at bottom, card grows in-place, scroll anchor keeps page stable
- Per-card thresholds: Bash ~50, Read ~100, Write ~20, Edit full diff, Glob ~20 files, Grep ~5 files
- Button shows exact count, "Show less" after expanding
- Shared truncation pattern (hook or wrapper component)
- Unified diff layout for EditToolCard: single column, green additions, red deletions, dual line number gutter
- No Shiki inside diffs -- line coloring only
- Client-side diff from old_string/new_string using lightweight diff library, 3 context lines
- Terminal-styled BashToolCard: dark bg-surface-0, monospace, ANSI colors
- Distinct command header with $ prefix, visually separated from output
- ANSI: basic 16 colors + bold + underline + reset, mapped to design tokens
- Lightweight ANSI-to-HTML converter (~50 lines), not full terminal emulator
- GlobToolCard: bulleted file list with Lucide icons, pattern shown, count in summary, left-truncated paths
- GrepToolCard: grouped by file, match terms highlighted bg-primary/20, 2 context lines, summary "N matches in M files"
- Grep output parsing: ripgrep-style file:line:content, fallback to plain monospace
- ReadToolCard/WriteToolCard: reuse CodeBlock or extract lighter variant, language inferred from file extension
- Replace emoji icons with Lucide icons in tool-registry.ts
- Each card in its own .tsx file in src/src/components/chat/tools/
- Diff colors from existing tokens: --diff-added-bg, --diff-removed-bg

### Claude's Discretion
- Exact Lucide icon choices per file type
- ANSI-to-HTML converter implementation details
- Whether useTruncation is a hook or wrapper component
- Exact diff library choice (npm diff recommended)
- ReadToolCard/WriteToolCard: reuse CodeBlock directly or extract lighter variant
- Exact spacing/padding/divider in BashToolCard

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TOOL-10 | BashToolCard: command with $ prefix, terminal-styled output, ANSI color, ~50 line truncation | ANSI parser utility, TruncatedContent component, design token mapping |
| TOOL-11 | ReadToolCard: file path + icon, Shiki highlighting, line numbers, ~100 line truncation | CodeBlock reuse, getLanguageFromPath utility, TruncatedContent |
| TOOL-12 | EditToolCard: unified diff, green/red coloring, dual line numbers, diff parsing | `diff` npm package structuredPatch API, diff rendering component |
| TOOL-13 | WriteToolCard: file path + icon, Shiki preview (~20 lines), expand | CodeBlock reuse, getLanguageFromPath utility, TruncatedContent |
| TOOL-14 | GlobToolCard: pattern + bulleted file list + count, ~20 file truncation | Output parser, Lucide file-type icons, TruncatedContent |
| TOOL-15 | GrepToolCard: pattern + file-grouped matches + highlighted terms, ~5 file truncation | Output parser for ripgrep format, regex match highlighting |
| ENH-02 | BashToolCard ANSI color support (bold, colors, underline) | Lightweight parseAnsi() utility mapping to design tokens |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| diff | ^8.0.3 | Client-side unified diff computation | De facto JS diff library, 8KB gzipped, built-in TypeScript types since v8, structuredPatch gives hunk-level control |
| shiki | ^3.23.0 | Syntax highlighting for Read/Write cards | Already installed, singleton highlighter with cache in place |
| lucide-react | ^0.577.0 | File-type and tool icons | Already installed, tree-shakeable, used throughout project |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none) | - | ANSI parsing | Hand-roll ~50 line utility -- existing ANSI-to-HTML libraries (ansi-to-html, ansi_up) are 10-30KB and overkill for 16 colors + bold + underline |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `diff` npm | `fast-diff` | fast-diff is character-level only, no line-level structuredPatch with hunk info |
| Hand-rolled ANSI parser | `ansi_up` (30KB) | Overkill -- we need 16 colors + bold/underline, not full xterm-256 or hyperlinks |
| Hand-rolled ANSI parser | `ansi-to-html` (12KB) | Closer in scope but still bundles features we don't need and uses inline styles (Constitution violation) |

**Installation:**
```bash
cd /home/swd/loom/src && npm install diff
```

## Architecture Patterns

### File Organization
```
src/src/components/chat/tools/
  ToolCardShell.tsx          # (exists) shared shell wrapper
  ToolChip.tsx               # (exists) chip + shell composition
  BashToolCard.tsx            # NEW - terminal output + ANSI
  ReadToolCard.tsx            # NEW - Shiki highlighted file content
  EditToolCard.tsx            # NEW - unified diff view
  WriteToolCard.tsx           # NEW - Shiki file preview
  GlobToolCard.tsx            # NEW - file list
  GrepToolCard.tsx            # NEW - search results
  TruncatedContent.tsx        # NEW - shared truncation wrapper
  tool-cards.css              # NEW - shared styles for all per-tool cards

src/src/lib/
  tool-registry.ts           # (exists) update icon + renderCard references
  shiki-highlighter.ts       # (exists) add getLanguageFromPath()
  ansi-parser.ts             # NEW - ANSI escape code to HTML spans
  diff-parser.ts             # NEW - wrapper around diff.structuredPatch
  grep-parser.ts             # NEW - ripgrep output parser
```

### Pattern 1: TruncatedContent Wrapper
**What:** Shared component that accepts `lines` (string[]) or `items` (any[]), a `threshold` number, and renders truncated content with "Show N more" / "Show less" toggle.
**When to use:** Every per-tool card uses this for its output body.
**Example:**
```typescript
// TruncatedContent.tsx
interface TruncatedContentProps {
  items: string[];
  threshold: number;
  /** Label for the expand button, e.g. "lines" or "files" */
  unit: string;
  renderItem: (item: string, index: number) => React.ReactNode;
  renderAll?: boolean; // force show all
}

function TruncatedContent({ items, threshold, unit, renderItem }: TruncatedContentProps) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? items : items.slice(0, threshold);
  const remaining = items.length - threshold;

  return (
    <div>
      {visible.map((item, i) => renderItem(item, i))}
      {remaining > 0 && !expanded && (
        <button onClick={() => setExpanded(true)}>
          Show {remaining} more {unit}
        </button>
      )}
      {expanded && remaining > 0 && (
        <button onClick={() => setExpanded(false)}>
          Show less
        </button>
      )}
    </div>
  );
}
```

### Pattern 2: Card Registration (Swap DefaultToolCard)
**What:** Each per-tool card file exports a memo-wrapped component matching `ToolCardProps`. The `tool-registry.ts` imports and assigns to `renderCard`.
**When to use:** All 6 tool registrations.
**Example:**
```typescript
// In tool-registry.ts, update:
import { BashToolCard } from '@/components/chat/tools/BashToolCard';
import { Terminal } from 'lucide-react';

registerTool('Bash', {
  displayName: 'Bash',
  icon: () => createElement(Terminal, { size: 14 }),
  getChipLabel: bashChipLabel,
  renderCard: BashToolCard,
});
```

### Pattern 3: ANSI-to-HTML with Design Tokens
**What:** A pure function that parses ANSI escape sequences and emits HTML `<span>` elements with CSS classes referencing design tokens.
**When to use:** BashToolCard output rendering.
**Example:**
```typescript
// ansi-parser.ts
// Maps ANSI color codes to CSS custom properties
const ANSI_CLASSES: Record<number, string> = {
  30: 'ansi-black',   31: 'ansi-red',    32: 'ansi-green',
  33: 'ansi-yellow',  34: 'ansi-blue',   35: 'ansi-magenta',
  36: 'ansi-cyan',    37: 'ansi-white',
  // Bright variants: 90-97
  90: 'ansi-bright-black', 91: 'ansi-bright-red', /* ... */
};

// CSS maps these classes to design tokens:
// .ansi-red { color: var(--status-error); }
// .ansi-green { color: var(--status-success); }
// etc.

export function parseAnsi(text: string): string {
  // ~50 lines: regex match ESC[...m sequences,
  // track current style state, emit <span class="...">
}
```

### Pattern 4: getLanguageFromPath Utility
**What:** Maps file extension to Shiki language grammar ID.
**When to use:** ReadToolCard and WriteToolCard need to infer language from `file_path` input.
**Example:**
```typescript
// In shiki-highlighter.ts
const EXT_TO_LANG: Record<string, string> = {
  '.ts': 'typescript', '.tsx': 'typescript',
  '.js': 'javascript', '.jsx': 'javascript',
  '.py': 'python', '.sh': 'bash', '.bash': 'bash',
  '.json': 'json', '.css': 'css', '.html': 'html',
  '.md': 'markdown', '.yml': 'yaml', '.yaml': 'yaml',
  '.rs': 'rust', '.go': 'go', '.rb': 'ruby',
  '.java': 'java', '.c': 'c', '.cpp': 'cpp',
  '.h': 'c', '.hpp': 'cpp', '.xml': 'html',
  '.sql': 'sql', '.toml': 'toml', '.env': 'bash',
  '.dockerfile': 'docker', '.graphql': 'graphql',
};

export function getLanguageFromPath(filePath: string): string {
  const ext = '.' + filePath.split('.').pop()?.toLowerCase();
  return EXT_TO_LANG[ext] ?? 'text';
}
```

### Pattern 5: structuredPatch for EditToolCard
**What:** Use `diff.structuredPatch()` to get hunks with line numbers, then render each hunk with colored lines.
**When to use:** EditToolCard when both `old_string` and `new_string` are present in input.
**Example:**
```typescript
// diff-parser.ts
import { structuredPatch } from 'diff';

export interface DiffLine {
  type: 'added' | 'removed' | 'context';
  content: string;
  oldLineNo: number | null;
  newLineNo: number | null;
}

export function computeDiff(oldStr: string, newStr: string, contextLines = 3): DiffLine[] {
  const patch = structuredPatch('', '', oldStr, newStr, '', '', { context: contextLines });
  const lines: DiffLine[] = [];
  for (const hunk of patch.hunks) {
    let oldLine = hunk.oldStart;
    let newLine = hunk.newStart;
    for (const line of hunk.lines) {
      if (line.startsWith('+')) {
        lines.push({ type: 'added', content: line.slice(1), oldLineNo: null, newLineNo: newLine++ });
      } else if (line.startsWith('-')) {
        lines.push({ type: 'removed', content: line.slice(1), oldLineNo: oldLine++, newLineNo: null });
      } else {
        lines.push({ type: 'context', content: line.slice(1), oldLineNo: oldLine++, newLineNo: newLine++ });
      }
    }
  }
  return lines;
}
```

### Pattern 6: Grep Output Parser
**What:** Parses ripgrep-style `filepath:linenum:content` output into grouped file results.
**When to use:** GrepToolCard.
**Example:**
```typescript
// grep-parser.ts
export interface GrepMatch {
  lineNo: number;
  content: string;
}

export interface GrepFileGroup {
  filePath: string;
  matches: GrepMatch[];
}

export function parseGrepOutput(output: string): GrepFileGroup[] {
  // Parse lines matching pattern: filepath:linenum:content
  // Group consecutive matches by filepath
  // Handle context separator lines (--)
  // Fallback: if no lines match pattern, return null (triggers plain text render)
}
```

### Anti-Patterns to Avoid
- **Inline styles for ANSI colors:** Use CSS classes mapped to design tokens. Never `style={{ color: '#ff0000' }}`.
- **Rendering full output then hiding with CSS:** Always slice the data array in JS. Don't render 500 lines and use `display: none` on 450.
- **Blocking renders during Shiki highlight:** Use the existing async highlight + useDeferredValue pattern from CodeBlock. Show plain monospace fallback immediately.
- **Parsing output in render function:** Parse once in useMemo, not on every render.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Text diffing | LCS algorithm, Myers diff | `diff` npm package `structuredPatch()` | 40+ years of edge cases: Unicode, line endings, empty files, whitespace handling |
| Syntax highlighting | Token-based regex highlighter | Shiki via existing `highlightCode()` | Grammar complexity (nested scopes, lookahead) makes hand-rolling futile |
| Truncation logic | Per-card state management | Shared `TruncatedContent` component | 6 cards with identical truncation UX = guaranteed inconsistency if hand-rolled per card |

**Key insight:** The "hard" parts of this phase (diffing, highlighting) are solved problems. The real work is output parsing, layout, and consistent UX across 6 cards.

## Common Pitfalls

### Pitfall 1: Edit Tool Missing old_string/new_string
**What goes wrong:** EditToolCard assumes `input.old_string` and `input.new_string` exist, but some Edit calls may have different input shapes or missing fields.
**Why it happens:** Tool input varies by provider/version. Claude's Edit tool uses `old_string`/`new_string` but edge cases exist (empty old_string for new insertions).
**How to avoid:** Always null-check both fields. If `old_string` is empty/missing, treat as pure addition. If `new_string` is missing, treat as pure deletion. Fall back to DefaultToolCard rendering if neither is present.
**Warning signs:** Blank diff panel, crash on `.split('\n')` of undefined.

### Pitfall 2: ANSI Escape Sequence Nesting
**What goes wrong:** ANSI sequences can nest (bold + red), and reset (ESC[0m) clears ALL styles. A naive parser that tracks only "current color" breaks on `\033[1;31m` (bold red).
**Why it happens:** ANSI SGR codes are semicolon-separated: `ESC[1;31m` means bold AND red.
**How to avoid:** Track a style state object `{ bold: boolean, underline: boolean, fg: number | null }`. On each SGR sequence, update all specified attributes. On reset (code 0), clear all.
**Warning signs:** Styles "bleeding" across lines, or all text after a reset losing color.

### Pitfall 3: Grep Output Format Variations
**What goes wrong:** GrepToolCard assumes `file:line:content` format but Grep tool output varies: some modes output just filenames (`files_with_matches`), some output count lines.
**Why it happens:** The Grep tool's `output_mode` parameter changes output format.
**How to avoid:** Detect format: if lines match `filepath:number:content`, parse as matches. If lines are just paths, render as file list (like GlobToolCard). If nothing matches, fall back to plain monospace.
**Warning signs:** Parser returns empty results for valid output.

### Pitfall 4: Shiki Highlight Blocking Card Expansion
**What goes wrong:** ReadToolCard/WriteToolCard call `highlightCode()` which is async. If the card body waits for highlight before rendering, the CSS Grid expand animation looks janky (delayed content appearance).
**Why it happens:** Async highlight + synchronous expand animation = timing mismatch.
**How to avoid:** Render plain monospace immediately as fallback (same CodeBlock pattern). Swap in highlighted version via `useDeferredValue`. Card expands with content visible from frame 1.
**Warning signs:** Card shell expands but body is blank for 100-300ms.

### Pitfall 5: Large Output Memory
**What goes wrong:** Some Bash commands produce megabytes of output. Storing the full HTML-converted ANSI output in React state causes memory spikes.
**Why it happens:** Backend sends full output as a string; naive approach converts ALL of it to HTML spans.
**How to avoid:** Parse ANSI lazily -- only convert visible lines. On "Show more", convert the next batch. Use `useMemo` with the visible slice, not the full output.
**Warning signs:** Browser tab memory climbing on sessions with many Bash tool calls.

### Pitfall 6: diff Library with Empty Strings
**What goes wrong:** `structuredPatch('', '', '', newStr)` may produce unexpected results or a single hunk treating all new content as additions with wrong line numbers.
**Why it happens:** Edge case in diff library when oldStr is empty string.
**How to avoid:** Test explicitly with empty old_string (new file creation) and empty new_string (file deletion). Handle these as special cases if structuredPatch output is unexpected.
**Warning signs:** Line numbers starting at 0 or missing entirely.

## Code Examples

### ANSI Color CSS Classes (Constitution-compliant, design tokens only)
```css
/* tool-cards.css */
/* ANSI foreground colors mapped to design tokens */
.ansi-red { color: var(--status-error); }
.ansi-green { color: var(--status-success); }
.ansi-yellow { color: var(--status-warning); }
.ansi-blue { color: var(--status-info); }
.ansi-magenta { color: var(--accent-primary); }
.ansi-cyan { color: oklch(0.72 0.10 195); }
.ansi-white { color: var(--text-primary); }
.ansi-black { color: var(--text-muted); }
/* Bright variants -- higher lightness */
.ansi-bright-red { color: oklch(0.70 0.18 25); }
.ansi-bright-green { color: oklch(0.75 0.15 145); }
/* ... etc */
.ansi-bold { font-weight: 700; }
.ansi-underline { text-decoration: underline; }
```

### Diff Line Rendering
```typescript
// Inside EditToolCard.tsx
function DiffLineRow({ line }: { line: DiffLine }) {
  return (
    <div className={cn(
      'flex font-mono text-sm',
      line.type === 'added' && 'bg-diff-added',
      line.type === 'removed' && 'bg-diff-removed',
    )}>
      <span className="w-10 text-right pr-2 text-muted select-none shrink-0">
        {line.oldLineNo ?? ''}
      </span>
      <span className="w-10 text-right pr-2 text-muted select-none shrink-0">
        {line.newLineNo ?? ''}
      </span>
      <span className="px-2 select-none shrink-0 w-4">
        {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
      </span>
      <span className="whitespace-pre overflow-x-auto">{line.content}</span>
    </div>
  );
}
```

### Lucide Icon Mapping for tool-registry.ts
```typescript
// Recommended Lucide icons per tool
import { Terminal, FileText, FilePen, FilePlus, FolderSearch, Search } from 'lucide-react';

// Bash -> Terminal (terminal prompt)
// Read -> FileText (document with lines)
// Edit -> FilePen (document with pencil)
// Write -> FilePlus (document with plus)
// Glob -> FolderSearch (folder with magnifier)
// Grep -> Search (magnifying glass)

// File-type icons for Glob/Read/Write file lists:
// File (generic), FileCode (.ts/.js/.py), FileText (.md/.txt),
// FileJson (.json), Folder (directories)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| DefaultToolCard (raw JSON + pre) | Per-tool specialized cards | Phase 16 | Each tool gets optimal presentation |
| Emoji icons in registry | Lucide React icons | Phase 16 | Professional, consistent, tree-shakeable |
| No ANSI support | 16-color ANSI-to-HTML with design tokens | Phase 16 (ENH-02) | Terminal output actually looks like a terminal |

**Deprecated/outdated:**
- `@types/diff`: Not needed since diff v8.0+ ships its own TypeScript types

## Open Questions

1. **CodeBlock reuse vs. lighter variant for Read/Write cards**
   - What we know: CodeBlock has header (language label, copy button), max-height scroll, line numbers, Shiki integration. ReadToolCard/WriteToolCard need all of these except the header (tool card shell provides the header context).
   - What's unclear: Whether to render CodeBlock directly inside the card body (it has its own container styling which might conflict with card body), or extract the highlighting + line numbers into a shared hook/utility.
   - Recommendation: Extract the core rendering (Shiki HTML + line numbers + copy button) from CodeBlock into a `HighlightedCode` subcomponent. Both CodeBlock (markdown fences) and Read/Write cards can compose it. This avoids double-wrapping backgrounds and conflicting border-radius.

2. **Scroll anchor stability on "Show more" expansion**
   - What we know: CONTEXT.md says scroll anchor keeps page stable when card grows.
   - What's unclear: Whether existing scroll anchor (ResizeObserver-based, planned in NAV-03) will be in place before Phase 16.
   - Recommendation: Don't depend on NAV-03. Use a simple `scrollTop` save/restore around expansion: capture `container.scrollTop` before state change, restore after React commit via `useLayoutEffect`.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 + jsdom |
| Config file | `src/vite.config.ts` (vitest config inline) |
| Quick run command | `cd /home/swd/loom/src && npx vitest run --reporter=verbose` |
| Full suite command | `cd /home/swd/loom/src && npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TOOL-10 | BashToolCard renders command + output + truncation | unit | `cd /home/swd/loom/src && npx vitest run src/src/components/chat/tools/BashToolCard.test.tsx -x` | Wave 0 |
| TOOL-11 | ReadToolCard renders file path + highlighted content + truncation | unit | `cd /home/swd/loom/src && npx vitest run src/src/components/chat/tools/ReadToolCard.test.tsx -x` | Wave 0 |
| TOOL-12 | EditToolCard renders diff with line numbers + coloring | unit | `cd /home/swd/loom/src && npx vitest run src/src/components/chat/tools/EditToolCard.test.tsx -x` | Wave 0 |
| TOOL-13 | WriteToolCard renders file path + preview + truncation | unit | `cd /home/swd/loom/src && npx vitest run src/src/components/chat/tools/WriteToolCard.test.tsx -x` | Wave 0 |
| TOOL-14 | GlobToolCard renders pattern + file list + count | unit | `cd /home/swd/loom/src && npx vitest run src/src/components/chat/tools/GlobToolCard.test.tsx -x` | Wave 0 |
| TOOL-15 | GrepToolCard renders grouped matches + highlighting | unit | `cd /home/swd/loom/src && npx vitest run src/src/components/chat/tools/GrepToolCard.test.tsx -x` | Wave 0 |
| ENH-02 | ANSI color codes render as colored spans | unit | `cd /home/swd/loom/src && npx vitest run src/src/lib/ansi-parser.test.ts -x` | Wave 0 |
| (shared) | TruncatedContent toggle behavior | unit | `cd /home/swd/loom/src && npx vitest run src/src/components/chat/tools/TruncatedContent.test.tsx -x` | Wave 0 |
| (shared) | diff-parser computes correct line numbers | unit | `cd /home/swd/loom/src && npx vitest run src/src/lib/diff-parser.test.ts -x` | Wave 0 |
| (shared) | grep-parser handles ripgrep format | unit | `cd /home/swd/loom/src && npx vitest run src/src/lib/grep-parser.test.ts -x` | Wave 0 |
| (shared) | getLanguageFromPath maps extensions correctly | unit | `cd /home/swd/loom/src && npx vitest run src/src/lib/shiki-highlighter.test.ts -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `cd /home/swd/loom/src && npx vitest run --reporter=verbose`
- **Per wave merge:** `cd /home/swd/loom/src && npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/src/lib/ansi-parser.test.ts` -- covers ENH-02 ANSI parsing
- [ ] `src/src/lib/diff-parser.test.ts` -- covers EditToolCard diff computation
- [ ] `src/src/lib/grep-parser.test.ts` -- covers GrepToolCard output parsing
- [ ] `src/src/components/chat/tools/TruncatedContent.test.tsx` -- covers shared truncation
- [ ] `src/src/components/chat/tools/BashToolCard.test.tsx` -- covers TOOL-10
- [ ] `src/src/components/chat/tools/ReadToolCard.test.tsx` -- covers TOOL-11
- [ ] `src/src/components/chat/tools/EditToolCard.test.tsx` -- covers TOOL-12
- [ ] `src/src/components/chat/tools/WriteToolCard.test.tsx` -- covers TOOL-13
- [ ] `src/src/components/chat/tools/GlobToolCard.test.tsx` -- covers TOOL-14
- [ ] `src/src/components/chat/tools/GrepToolCard.test.tsx` -- covers TOOL-15
- [ ] `npm install diff` -- new dependency for EditToolCard

## Sources

### Primary (HIGH confidence)
- Project codebase: `src/src/lib/tool-registry.ts`, `src/src/components/chat/tools/ToolCardShell.tsx`, `src/src/components/chat/tools/ToolChip.tsx`, `src/src/components/chat/view/CodeBlock.tsx`, `src/src/lib/shiki-highlighter.ts`
- [diff package - jsDocs.io](https://www.jsdocs.io/package/diff) -- TypeScript types for structuredPatch, Hunk, ChangeObject
- [diff package - npm](https://www.npmjs.com/package/diff) -- v8.0.3, built-in types, structuredPatch API

### Secondary (MEDIUM confidence)
- ANSI SGR specification (standard: ECMA-48) -- 16-color codes 30-37/90-97, attributes 0/1/4

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- diff v8 is well-documented with built-in types, Shiki/Lucide already in project
- Architecture: HIGH -- all patterns follow existing project conventions (memo, cn, design tokens, CSS Grid)
- Pitfalls: HIGH -- based on direct codebase analysis and known diff/ANSI edge cases

**Research date:** 2026-03-08
**Valid until:** 2026-04-08 (stable domain, no fast-moving dependencies)
