# Phase 11: Hardcoded Color Sweep - Research

**Researched:** 2026-03-03
**Domain:** Tailwind CSS color utilities, CSS custom property tokens, systematic codebase color migration
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Warm-brown artifact handling**
- Retain subtle warmth — the charcoal tokens already carry a 30° warm hue tint, so warm-brown hex values map to warm-charcoal equivalents, not cold neutrals
- Gold text (#c4a882) → `muted-foreground` token. No colored secondary text — everything dim goes neutral
- Cream text (#f5e6d3) → `foreground` token. Direct replacement, visually close
- Brown backgrounds (#3d2e25, #241a14, #2a1f1a) → existing 3-tier surface system (surface-base / surface-raised / surface-elevated). No new surface-deep tier

**Code surface treatment**
- Code blocks and diff viewers blend into the standard charcoal surface hierarchy — no special "code-surface" tier
- Code block headers use `surface-raised` with a subtle bottom border separating from `surface-base` content area
- Add dedicated `--diff-added-bg` and `--diff-removed-bg` CSS variable tokens for diff line backgrounds
- Syntax highlighting colors (keywords, strings, links within code) are deferred to Phase 12

**Status & feedback colors**
- Map hardcoded status hex values to existing Phase 10 tokens: error hex → `status-error`, success hex → `status-connected`, warning hex → `status-reconnecting`
- Add new `--status-info` token for links and informational text (muted blue tone) — the old #6bacce blue gets its own semantic name
- Status message backgrounds use the status token at low opacity (e.g., `bg-status-error/5`) — no explicit background variant tokens
- Status message borders use the status token at low opacity (e.g., `border-status-error/20`) — color-coded borders reinforce status type

**Gray utility mapping strategy**
- **Strict mapping table** for backgrounds: gray-900/slate-900 → `surface-base`, gray-800/slate-800 → `surface-raised`, gray-700 → `surface-elevated`. Applied mechanically across the codebase
- **Add `--foreground-secondary`** token for mid-tone text: gray-300/gray-400 map here (between `foreground` bright and `muted-foreground` dim)
- **Single border token** with opacity variants: all gray/slate/zinc borders → standard `border` token (white at 8%). Use opacity modifiers (/10, /15) for emphasis variation
- **Strip light-mode dead code**: Remove all light-mode conditional gray classes (e.g., `bg-gray-100`). Loom is dark-only — these are dead code

**Hover & focus states**
- **Hover backgrounds**: Step up one surface tier (base → raised, raised → elevated). Consistent visual hierarchy
- **Hover text**: Muted text brightens to `foreground` on hover. Clean brightness shift, no color change
- **Button hovers**: Follow the same surface-step-up pattern. No rose-tinted hovers — uniform behavior
- **Focus states**: Rose glow ring (`--rose-focus-glow`) on all focus states universally, including shell/terminal inputs. No exceptions

### Claude's Discretion
- Exact opacity values for status backgrounds and borders (approximate ranges given: /5-/10 for backgrounds, /20-/30 for borders)
- How to handle any edge cases in the strict mapping table (components where mechanical mapping produces wrong visual weight)
- Whether to add the `status-info` token to the Tailwind config `status` color group or keep it separate
- Handling of any remaining hardcoded colors not covered by the categories above

### Deferred Ideas (OUT OF SCOPE)
- Syntax highlighting theme (keywords, strings, etc.) — Phase 12: Specialty Surfaces
- Terminal Catppuccin Mocha theme — Phase 12: Specialty Surfaces
- CodeMirror/Shiki color remapping — Phase 12: Specialty Surfaces
- Light mode support — not planned (Loom is dark-only)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| COLR-01 | All 51+ hardcoded hex values in Tailwind arbitrary classes (bg-[#hex], text-[#hex]) replaced with semantic CSS variable references | Live audit confirmed 78 instances across 10 files; complete mapping table documented below |
| COLR-02 | All 371+ generic gray/slate/zinc/neutral Tailwind utility classes replaced with Loom semantic palette aliases | Live audit confirmed 1,901 instances across ~75 files; mapping table + dead-code removal strategy documented |
| COLR-03 | Grep audit for hardcoded color references returns zero matches across entire codebase — 100% palette consistency | Both verification grep commands documented; success = both return zero results |
</phase_requirements>

## Summary

Phase 11 is a systematic text-replacement sweep. The Phase 10 token foundation is already complete — all CSS variables exist in `src/index.css` and all Tailwind aliases exist in `tailwind.config.js`. This phase adds four missing tokens (`--foreground-secondary`, `--status-info`, `--diff-added-bg`, `--diff-removed-bg`), then replaces every non-semantic color reference in the source files with semantic alternatives.

Live codebase audit reveals the actual scale: **78 hardcoded hex instances** across 10 files (all in `chat/` components), and **~1,900 gray/slate/zinc instances** across ~75 files. The 1,900 gray count is much higher than the 356 quoted in the CONTEXT because CONTEXT only counted the subset in visible core UI — the TaskMaster JSX components (`TaskList.jsx`, `TaskDetail.jsx`, `ProjectCreationWizard.jsx`, etc.) contain ~600+ instances of their own and are fully live UI.

A critical pattern to understand: the codebase extensively uses **dual light+dark class pairs** (e.g., `className="bg-white bg-gray-900"`) without `dark:` prefix. Since Loom is dark-only with no `darkMode` toggle in tailwind.config.js, the light-mode class in each pair is **dead code**. The correct action is: keep the dark equivalent, delete the light equivalent, then map the dark class to a semantic token.

Additionally, blue/red/green/amber utility families appear (642 blue, 246 red, 237 green, 80 amber instances), concentrated in TaskMaster JSX files that use a full light+dark dual-class pattern. These semantic families (blue for info, red for error, green for success, amber for warning) need to be mapped to the status token system.

**Primary recommendation:** Token additions first (Wave 0), then systematic file-by-file replacement in priority waves: hex-heavy chat core files (Wave 1), gray-heavy chat tools and shell (Wave 2), settings and code-editor (Wave 3), TaskMaster JSX files (Wave 4), remaining long-tail (Wave 5). Verify with grep after each wave.

## Standard Stack

### Core (no new installations needed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tailwind CSS | ^3.4.0 | Utility-first CSS; the target token system already defined here | Already configured, `tailwind.config.js` has full semantic alias map |
| CSS Custom Properties | Native | Token definitions in `:root` block | Already established in `src/index.css` via Phase 10 |
| TypeScript | ^5.x | Type safety during edits | `npm run typecheck` available for validation |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Node.js grep/sed | Built-in | Batch pattern verification | Use grep to audit scope; use editor tools for targeted replacements |
| Vite HMR | ^7.1.8 | Instant browser reload on CSS/TSX changes | Auto-active during `npm run dev`; enables visual verification per file |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual file-by-file edits | Sed batch scripts | Sed is error-prone in JSX class strings (conditional classes, ternaries). Manual targeted edits preserve context. |
| Single-pass all files | Wave-by-wave with visual verification | Single pass risks missing edge cases; wave approach allows catching visual regressions per area |

**Installation:**
```bash
# No new dependencies needed. Phase 10 established the complete token system.
```

## Architecture Patterns

### Token System (already established in Phase 10)

```
src/index.css :root {
  --surface-base          30 3.8% 10.2%    /* #1b1a19 — replaces gray-900/slate-900 */
  --surface-raised        30 3.0% 12.9%    /* #222120 — replaces gray-800/slate-800 */
  --surface-elevated      30 2.4% 16.5%    /* #2b2a29 — replaces gray-700 */
  --foreground            0 10% 88%        /* #e4dbd9 — replaces gray-100, text-white */
  --muted-foreground      0 3% 59%         /* #989494 — replaces gray-400/gray-500 */
  --border                0 0% 100%        /* used at 8% — replaces gray/slate borders */
  --status-error          0 45% 48%        /* muted red — replaces error hex values */
  --status-connected      140 35% 50%      /* muted green — replaces success hex */
  --status-reconnecting   35 50% 55%       /* muted amber — replaces warning hex */
}
```

### New Tokens to Add (Wave 0)

```css
/* src/index.css :root additions */
--foreground-secondary: 0 5% 74%;       /* ~#bdb9b9 — mid-tone text, gray-300/gray-400 */
--status-info: 201 50% 61%;             /* #6bacce — links, informational text */
--diff-added-bg: 140 35% 12%;           /* dark green tint — diff added lines */
--diff-removed-bg: 0 35% 14%;           /* dark red tint — diff removed lines */
```

```js
// tailwind.config.js additions in colors.status group
status: {
  connected:    "hsl(var(--status-connected) / <alpha-value>)",
  reconnecting: "hsl(var(--status-reconnecting) / <alpha-value>)",
  disconnected: "hsl(var(--status-disconnected) / <alpha-value>)",
  error:        "hsl(var(--status-error) / <alpha-value>)",
  info:         "hsl(var(--status-info) / <alpha-value>)",   // NEW
},
// Add alongside foreground:
"foreground-secondary": "hsl(var(--foreground-secondary) / <alpha-value>)",  // NEW
// Add alongside surface:
diff: {
  added:   "hsl(var(--diff-added-bg) / <alpha-value>)",    // NEW
  removed: "hsl(var(--diff-removed-bg) / <alpha-value>)",  // NEW
},
```

### Strict Gray Mapping Table

This table is the mechanical rule applied across all files:

| Old Tailwind Class | Semantic Replacement | Notes |
|-------------------|---------------------|-------|
| `bg-gray-950` / `bg-gray-900` / `bg-slate-900` | `bg-surface-base` | Darkest background |
| `bg-gray-800` / `bg-slate-800` | `bg-surface-raised` | Card/panel level |
| `bg-gray-750` / `bg-gray-700` / `bg-slate-700` | `bg-surface-elevated` | Modal/popover level |
| `bg-gray-600` / `bg-gray-500` | `bg-muted` | Mid-surface (contextual) |
| `bg-gray-400` / `bg-gray-300` | `bg-foreground-secondary/20` | Light surface tint |
| `bg-gray-200` / `bg-gray-100` / `bg-gray-50` / `bg-white` | **DELETE** (dead light-mode code) | Dark-only app |
| `text-gray-100` / `text-white` | `text-foreground` | Primary text |
| `text-gray-200` / `text-gray-300` | `text-foreground-secondary` | Mid-tone text |
| `text-gray-400` / `text-gray-500` | `text-muted-foreground` | Dim/secondary text |
| `text-gray-600` / `text-gray-700` / `text-gray-800` / `text-gray-900` | **DELETE** (dead light-mode code) | Dark-only app |
| `border-gray-700` / `border-slate-700` / `border-gray-600` | `border-border/10` or `border-border/15` | Standard border |
| `border-gray-800` / `border-gray-900` | `border-border/8` | Subtle border |
| `border-gray-200` / `border-gray-300` / `border-gray-400` | **DELETE** (dead light-mode code) | Dark-only app |
| `border-gray-500` | `border-border/20` | Emphasized border |
| `bg-gray-900/50` (opacity variants) | `bg-surface-base/50` | Preserve opacity modifier |
| `bg-gray-800/50` | `bg-surface-raised/50` | Preserve opacity modifier |
| `bg-gray-700/50` | `bg-surface-elevated/50` | Preserve opacity modifier |

### Hardcoded Hex Mapping Table (COLR-01)

All 10 files confirmed affected. Primary hex values and their semantic targets:

| Hardcoded Hex | Approximate | Semantic Token |
|--------------|-------------|----------------|
| `#1c1210` | deep brown-black | `bg-surface-base` |
| `#241a14` | dark brown | `bg-surface-raised` |
| `#2a1f1a` | mid brown | `bg-surface-raised` |
| `#3d2e25` | raised brown | `bg-surface-elevated` |
| `#c4a882` | gold text | `text-muted-foreground` |
| `#a08a6e` | dim gold | `text-muted-foreground` |
| `#f5e6d3` | cream text | `text-foreground` |
| `#dab8b8` | pink-cream text | `text-foreground` |
| `#6bacce` | info blue | `text-status-info` |
| `#a0ccde` | light blue hover | `text-status-info` + hover brightness |
| `#b85c3a` | error rust | `text-status-error` or `border-status-error` |
| `#b87333` | warning copper | `text-status-reconnecting` (warning token) |
| `#6bbf59` | success green | `bg-status-connected` |
| `#d4a574` | reconnecting amber | `bg-status-reconnecting` |
| `#c15a4a` | disconnected red | `bg-status-disconnected` |

### Semantic Color Family Mapping (blue/red/green/amber)

For task-manager JSX and other components using full generic color families:

| Generic Color | Usage Context | Semantic Replacement |
|--------------|--------------|---------------------|
| `blue-*` (info states) | Info banners, links, PRD wizard | `status-info` (new token) |
| `blue-500/600` (buttons) | Primary action buttons in task manager | `primary` or `accent` |
| `red-*` (error states) | Error messages, delete actions | `status-error` |
| `green-*` (success states) | Success indicators, completed tasks | `status-connected` |
| `amber-*` (warning states) | Warnings, pending states | `status-reconnecting` |
| `amber-*` (file icons) | SVG/archive icon colors in fileIcons.ts | Keep as-is — decorative semantic color |

**Note on file icons:** `fileIcons.ts` uses colors like `text-amber-500`, `text-gray-500` for file type icons. The gray-500 values should map to `text-muted-foreground`. The amber/other color values for specific file types are intentionally semantic (e.g., amber for archives) — these MAY be kept if they read as decorative/semantic. Discuss with CONTEXT: the COLR-02 requirement says "generic gray/slate/zinc/neutral" — colored families like amber for file icons may be acceptable. The planner should decide per the success criteria grep scope.

### Dead-Code Removal Pattern

The dual-class pattern appears throughout:
```tsx
// BEFORE (light + dark paired, no dark: prefix — light class is dead)
className="bg-white bg-gray-900 border border-gray-200 border-gray-700"

// AFTER (light classes deleted, dark classes mapped to tokens)
className="bg-surface-base border border-border/10"
```

```tsx
// BEFORE (ternary with both light and dark values)
? 'bg-gray-50 bg-gray-800 text-gray-600 text-gray-300'
: 'bg-white bg-gray-900 text-gray-900 text-gray-100'

// AFTER (dark values only, mapped to tokens)
? 'bg-surface-raised text-muted-foreground'
: 'bg-surface-base text-foreground'
```

### Anti-Patterns to Avoid
- **Mapping gray-100/gray-50 to a dark token instead of deleting**: These are light-mode dead code. Delete them entirely.
- **Using `bg-gray-900` → `bg-background` instead of `bg-surface-base`**: `background` and `surface-base` resolve to the same CSS variable, but `surface-base` is the semantically correct name for explicit surface references. Use `background` only for the body/root-level page background.
- **Preserving opacity modifier mismatches**: When a gray class has `/50` or `/60`, the replacement must also include the opacity modifier. Example: `bg-gray-900/50` → `bg-surface-base/50`.
- **Replacing status hex with wrong token**: `#b85c3a` is rust/error, not `status-reconnecting`. Always check the visual context of each hex before mapping.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Color audit | Custom script to scan files | `grep` with the exact patterns from COLR-03 | Simple grep is sufficient and produces the definitive pass/fail test |
| Token HSL calculations | Python/JS converter scripts | Calculate once during research (done above), embed in token definitions | One-time calculation, not ongoing infrastructure |
| Automated replacement | Node.js AST transform | Manual targeted edits with grep verification | JSX class strings involve ternaries and template literals that confuse naive text replacement; targeted manual edits preserve logic |

**Key insight:** The success criteria grep commands ARE the test. Writing them first and running them after each wave provides unambiguous progress feedback.

## Common Pitfalls

### Pitfall 1: Dual-Class Dead Code Left in Place
**What goes wrong:** Editor replaces `bg-gray-900` with `bg-surface-base` but leaves the adjacent `bg-white` dead code: `className="bg-white bg-surface-base"` — the light class still exists in the build.
**Why it happens:** Search-and-replace only finds the target, not the paired value on the same line.
**How to avoid:** When working a line, scan the entire `className` string — delete any obvious light-mode counterparts (gray-50/100/200, white, gray-100/200 text).
**Warning signs:** After replacement, running the COLR-02 grep still shows hits — the replaced line often has a survivor.

### Pitfall 2: Opacity Modifier Loss
**What goes wrong:** `bg-gray-900/40` becomes `bg-surface-base` (opacity lost), making a previously semi-transparent surface fully opaque.
**Why it happens:** Replacement focuses on the color class name without reading the full utility.
**How to avoid:** Always capture the full pattern including `/N` suffix. Replace `bg-gray-900/40` → `bg-surface-base/40`.

### Pitfall 3: Wrong Surface Tier for Context
**What goes wrong:** A hover state using `hover:bg-gray-800` gets mapped to `hover:bg-surface-raised` when it should be `hover:bg-surface-elevated` (stepping up from the current surface-raised base).
**Why it happens:** Mechanical shade-number mapping ignores the visual context of what tier the element sits on.
**How to avoid:** When replacing hover states, check: what surface is the element on? Map the hover to one tier above the base. Element on `surface-base` → hover is `surface-raised`. Element on `surface-raised` → hover is `surface-elevated`.

### Pitfall 4: Tailwind Config Not Updated for New Tokens
**What goes wrong:** New CSS variables (`--foreground-secondary`, `--status-info`, etc.) are added to `src/index.css` but not to `tailwind.config.js`. Using `text-foreground-secondary` in a component generates no CSS output — invisible failure.
**Why it happens:** Two-file system requires synchronized updates.
**How to avoid:** Wave 0 must add both CSS variable AND Tailwind config alias before any component references the new token. Verify with `npm run typecheck` (Tailwind config is consumed by the build).

### Pitfall 5: TaskMaster JSX Scale Underestimate
**What goes wrong:** Plan underestimates effort for task-manager JSX files. The original CONTEXT estimated ~40 total files; actual audit shows ~24 JSX files with heavy blue/red/green coloring in addition to gray.
**Why it happens:** The CONTEXT discussion focused on core chat UI; task-manager JSX has its own extensive color system.
**How to avoid:** Allocate a dedicated wave for task-manager JSX files. They follow a consistent pattern (dual light+dark classes, full blue/red/green/amber families) that makes them systematically replaceable once the mapping table is established.

### Pitfall 6: fileIcons.ts Scope Decision
**What goes wrong:** Replacing `text-gray-500` in `fileIcons.ts` (28 instances) is clear, but colored file-type icons like `text-amber-500` for archives are ambiguous — COLR-02 only targets "gray/slate/zinc/neutral" but leaving amber file icons may leave a color inconsistency.
**Why it happens:** The success criteria grep doesn't target amber/blue/green — only gray/slate/zinc/neutral — so leaving amber file icons technically passes COLR-02.
**How to avoid:** Replace gray file icons with `text-muted-foreground`. Keep amber/colored file type icons (they are intentionally semantic). Document this decision explicitly.

## Code Examples

Verified patterns from direct codebase inspection:

### COLR-01: Hardcoded hex replacement (DiffViewer.tsx)
```tsx
// Source: src/components/chat/tools/components/DiffViewer.tsx
// BEFORE:
<div className="rounded-lg overflow-hidden border border-[#3d2e25]/40 my-2">
  <div className="flex items-center justify-between px-3 py-1.5 bg-[#241a14] border-b border-[#3d2e25]/40">
    <span className="font-mono text-[11px] text-[#6bacce] hover:text-[#a0ccde]">

// AFTER:
<div className="rounded-lg overflow-hidden border border-border/10 my-2">
  <div className="flex items-center justify-between px-3 py-1.5 bg-surface-raised border-b border-border/10">
    <span className="font-mono text-[11px] text-status-info hover:text-status-info">
```

### COLR-01: Error block replacement (MessageComponent.tsx)
```tsx
// Source: src/components/chat/view/subcomponents/MessageComponent.tsx
// BEFORE:
<div className="rounded-lg border-l-[3px] border-l-[#b85c3a] bg-[#b85c3a]/10 px-3 py-2">
  <XCircle className="w-4 h-4 text-[#b85c3a]" />
  <div className="text-xs text-[#dab8b8] font-mono">

// AFTER:
<div className="rounded-lg border-l-[3px] border-l-status-error bg-status-error/8 px-3 py-2">
  <XCircle className="w-4 h-4 text-status-error" />
  <div className="text-xs text-foreground font-mono">
```

### COLR-02: Dual-class dead code removal (CodeEditorHeader.tsx)
```tsx
// Source: src/components/code-editor/view/subcomponents/CodeEditorHeader.tsx
// BEFORE:
className="p-1.5 text-gray-600 text-gray-400 hover:text-gray-900 hover:text-white
           rounded-md hover:bg-gray-100 hover:bg-gray-800"

// AFTER (delete light class, map dark class):
className="p-1.5 text-muted-foreground hover:text-foreground
           rounded-md hover:bg-surface-elevated"
```

### COLR-02: Shell component replacement (Shell.tsx)
```tsx
// Source: src/components/shell/view/Shell.tsx
// BEFORE:
<div className="h-full flex flex-col bg-gray-900 w-full">

// AFTER:
<div className="h-full flex flex-col bg-surface-base w-full">
```

### Wave 0: New token addition (src/index.css)
```css
/* Add to :root block after --status-error definition */
--foreground-secondary: 0 5% 74%;       /* ~#bdb9b9 — mid-tone text between foreground and muted */
--status-info: 201 50% 61%;             /* #6bacce — informational/link blue tone */
--diff-added-bg: 140 35% 12%;           /* dark green on charcoal — diff added lines (Phase 12 ready) */
--diff-removed-bg: 0 35% 14%;           /* dark red on charcoal — diff removed lines (Phase 12 ready) */
```

### Wave 0: Tailwind config update (tailwind.config.js)
```js
// In theme.extend.colors, add alongside existing tokens:
"foreground-secondary": "hsl(var(--foreground-secondary) / <alpha-value>)",

// In status group, add:
info: "hsl(var(--status-info) / <alpha-value>)",

// Add new diff group:
diff: {
  added:   "hsl(var(--diff-added-bg) / <alpha-value>)",
  removed: "hsl(var(--diff-removed-bg) / <alpha-value>)",
},
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Dual light+dark classes without `dark:` prefix | Delete light, map dark to semantic token | Phase 11 (this phase) | Removes ~50% of gray utility volume as dead code |
| Brown/gold hex values from warm-earthy palette | Phase 10 charcoal tokens via CSS variables | Phase 10 completed | Token system ready; this phase completes the migration of component files |
| Generic tailwind grays | Semantic surface/foreground tokens | Phase 10 defined tokens; Phase 11 sweeps components | Enables single-point theme changes via CSS variable adjustments |

**Deprecated/outdated (from this codebase context):**
- Warm-earthy palette (brown/gold hex values): Superseded by charcoal + rose. Phase 11 removes the last remnants.
- `dark:` conditional classes: Never used in this codebase. Dead light classes should simply be removed.

## Open Questions

1. **fileIcons.ts colored family handling**
   - What we know: `text-gray-500` (28 instances) should map to `text-muted-foreground`. COLR-02 grep only checks gray/slate/zinc/neutral.
   - What's unclear: Should `text-amber-500` (archives), `text-blue-400` (JS files), etc. be replaced with semantic tokens? They are intentionally semantic by file type.
   - Recommendation: Keep colored file-type icons as-is. COLR-02 passes. Document the decision. Phase 11 only touches the gray file icons in fileIcons.ts.

2. **TaskMaster blue button pattern**
   - What we know: `bg-blue-600 hover:bg-blue-700` for primary action buttons in task-manager JSX. These are the "Create PRD", "Generate Tasks" etc. primary CTA buttons.
   - What's unclear: Map to `bg-primary hover:bg-primary/90` (rose) for consistency with the app's design system, or keep blue as task-manager's own accent?
   - Recommendation: Map to `bg-primary` (dusty rose). The task manager is a panel inside Loom — it should use Loom's accent color. Rose CTAs are consistent with the overall design system.

3. **Opacity value calibration for status tokens**
   - What we know: CONTEXT specifies approximate ranges (/5-/10 for backgrounds, /20-/30 for borders). These are guidance, not absolute.
   - What's unclear: Exact values need visual testing.
   - Recommendation: Start with `/8` for status bg and `/25` for status borders. Adjust during visual verification if contrast is off.

## Scope Audit (Live Codebase Numbers)

| Category | Instances | Files | Priority |
|----------|-----------|-------|----------|
| Hardcoded hex in Tailwind classes | 78 | 10 | P1 (COLR-01) |
| gray/slate/zinc/neutral utilities | ~1,901 | ~51 TSX + ~24 JSX | P1 (COLR-02) |
| blue/green/red/amber generic families | ~1,205 | ~40 (concentrated in JSX) | P2 (COLR-02 scope TBD) |
| **Total instances to address** | **~3,184** | **~75** | — |

**File areas by instance count (descending):**
1. `src/components/TaskList.jsx` — 86 gray lines
2. `src/components/ProjectCreationWizard.jsx` — 65 gray lines
3. `src/components/NextTaskBanner.jsx` — 50 gray lines
4. `src/components/QuickSettingsPanel.jsx` — 48 gray lines
5. `src/components/TaskDetail.jsx` — 44 gray lines
6. `src/components/TaskMasterSetupWizard.jsx` — 36 gray lines
7. `src/components/PRDEditor.jsx` — 34 gray lines
8. `src/components/file-tree/constants/fileIcons.ts` — 28 gray lines

## Verification Commands (COLR-03 Gate)

Run these from the project root after each wave. Phase passes when both return zero matches:

```bash
# COLR-01: Zero hardcoded hex in Tailwind arbitrary classes
grep -r 'bg-\[#\|text-\[#\|border-\[#\|fill-\[#\|ring-\[#' src/ \
  --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js"

# COLR-02: Zero generic gray/slate/zinc/neutral utilities
grep -r 'bg-gray-\|text-gray-\|border-gray-\|bg-slate-\|text-slate-\|border-slate-\|bg-zinc-\|text-zinc-\|bg-neutral-\|text-neutral-\|border-zinc-\|border-neutral-' src/ \
  --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js"
```

## Project Tooling

| Tool | Command | Detected From |
|------|---------|---------------|
| Lint | Not detected | package.json scripts |
| Type Check | `npm run typecheck` | package.json scripts |
| Build | `npm run build` | package.json scripts |
| Test | Not detected | package.json scripts |

*Written to `.planning/config.json` under `tooling` key for executor use.*

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection — `src/index.css` (755 lines), `tailwind.config.js` (75 lines), all 75 affected files audited via grep
- Phase 10 RESEARCH.md and SUMMARY files — established token system context
- Phase 11 CONTEXT.md — user decisions from discuss-phase session

### Secondary (MEDIUM confidence)
- Tailwind CSS v3 documentation (color utilities, arbitrary values, opacity modifiers) — verified patterns match codebase usage
- CSS custom property alpha-value pattern — verified already used throughout tailwind.config.js

### Tertiary (LOW confidence)
- None — all findings are from direct code inspection

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new libraries; existing Tailwind + CSS custom properties, fully audited
- Architecture patterns: HIGH — mapping tables derived from actual codebase grep counts
- Pitfalls: HIGH — identified from direct codebase patterns observed during audit

**Research date:** 2026-03-03
**Valid until:** 2026-04-03 (stable codebase; re-audit if major component additions occur)
