# Phase 46: Interactive State Consistency - Research

**Researched:** 2026-03-19
**Domain:** CSS interactive states, focus management, disabled patterns, popover transitions
**Confidence:** HIGH

## Summary

Phase 46 is about making every interactive element in Loom V2 behave like a single designer touched every surface. The codebase currently has **three distinct styling layers** for interactive states: (1) shadcn/Radix primitives with consistent patterns from the `ui/` directory, (2) custom CSS files for domain-specific components (git, file tree, sidebar, composer, tool cards), and (3) inline Tailwind classes on ad-hoc buttons scattered throughout the app. The shadcn layer is already consistent -- it uses `focus-visible:ring-ring/50`, `disabled:opacity-50 disabled:pointer-events-none`, and `animate-in/animate-out` uniformly. The inconsistencies live in layers 2 and 3.

The audit reveals **four categories of inconsistency**: (a) hover states use at least 5 different approaches -- `bg-surface-raised`, `bg-primary-muted`, `color-mix()` tinting, `bg-surface-overlay`, and border-color changes, (b) focus rings exist on some shadcn components but are absent on most custom buttons (TabBar tabs, terminal buttons, git action buttons, file tree nodes, tool chips, code block copy button), (c) disabled states are mostly correct in CSS files (`opacity: 0.5; cursor: not-allowed`) but use varying opacity values (0.4 in terminal, 0.5 in git, 0.5 in shadcn), and (d) popover/overlay transitions are consistent within shadcn (zoom-in-95 + fade-in-0 + slide-in-from-*) but the command palette has no enter/exit transition at all -- it just appears/disappears instantly.

**Primary recommendation:** Create a set of CSS utility classes in `base.css` that define the canonical hover, focus, and disabled patterns, then sweep through all custom components applying those classes. Do NOT modify shadcn primitives -- they're already consistent. The effort is standardizing the ~25 custom interactive components to match shadcn's conventions.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INTER-01 | All custom interactive elements have consistent hover states using design tokens | Audit found 5+ distinct hover patterns across 38 files; standardize to 2 canonical patterns (surface-raise for cards/list-items, accent-muted for primary actions) |
| INTER-02 | All focusable elements have visible, consistent focus rings that match the design system | Audit found focus rings missing on TabBar tabs, terminal buttons, git action buttons, file tree nodes, tool chips, code block copy button, sidebar buttons, and bulk action buttons |
| INTER-03 | All interactive elements have appropriate disabled states (reduced opacity, no hover, cursor change) | Audit found opacity inconsistency (0.4 vs 0.5), and several custom buttons lack explicit disabled styles |
| INTER-04 | All context menus, tooltips, and popovers have consistent enter/exit transitions | shadcn overlays are consistent but command palette and MentionPicker/SlashPicker have no enter/exit animation |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tailwind CSS | v4 | Utility classes for hover/focus/disabled states | Already installed, @theme inline tokens |
| tw-animate-css | installed | `animate-in`/`animate-out` classes for transitions | Already used by shadcn overlays |
| Radix UI | installed | Primitives with built-in a11y for overlays | Already powers all shadcn components |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| class-variance-authority | installed | Button/component variant definitions | Already used in button.tsx, tabs.tsx |
| cn() utility | local | clsx + tailwind-merge | Already used everywhere per Constitution |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CSS utility classes | Tailwind plugin | Overkill -- 4-5 utility classes in base.css is simpler |
| Per-component fixes | Global CSS selectors | Too broad -- would override shadcn styles unintentionally |

## Architecture Patterns

### Recommended Approach: Canonical CSS Utility Classes

Define standardized interactive state classes in `base.css`, then apply them to custom components. This preserves shadcn patterns while normalizing custom components.

```css
/* base.css additions */

/* ─── Interactive State: Hover (surface raise) ───────────────── */
.interactive-hover {
  transition: background-color var(--duration-fast) var(--ease-out);
}
.interactive-hover:hover {
  background-color: var(--surface-active);
}

/* ─── Interactive State: Focus Ring ──────────────────────────── */
.focus-ring {
  outline: none;
}
.focus-ring:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: -2px;
}

/* ─── Interactive State: Disabled ────────────────────────────── */
.interactive-disabled:disabled,
.interactive-disabled[aria-disabled="true"] {
  opacity: 0.5;
  pointer-events: none;
  cursor: not-allowed;
}
```

**However**, since Tailwind v4 already has all needed utilities, the better approach is to use Tailwind classes directly (consistent with existing codebase patterns). The key is defining the **canonical combination** and sweeping it through all custom components:

### Pattern: Canonical Focus Ring (Tailwind)
```
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
```
This matches what `NewChatButton` already uses. Apply it to all custom focusable elements.

### Pattern: Canonical Disabled State (Tailwind)
```
disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed
```
This matches shadcn's `button.tsx` pattern exactly. Normalize terminal's `opacity-40` to `opacity-50`.

### Pattern: Canonical Hover (Surface Raise)
```
hover:bg-surface-raised/50
```
For list items, icon buttons, and secondary actions. Already used by `TabBar` inactive tabs.

### Pattern: Canonical Hover (Accent Tint)
```
hover:bg-primary-muted
```
For primary/accent-colored actions. Already used by `NewChatButton`.

### Anti-Patterns to Avoid
- **Ad-hoc opacity changes on hover:** `hover:opacity-90` instead of a background color change. Inconsistent and hard to perceive.
- **Different disabled opacity values:** `opacity-40` vs `opacity-50`. Pick one (0.5) and use it everywhere.
- **Missing focus styles on custom buttons:** Any `<button>` or `<div role="button">` without `focus-visible` styling.
- **`focus:ring-*` instead of `focus-visible:ring-*`:** The `focus` pseudo-class shows rings on mouse click, which is ugly. Always use `focus-visible`.

## Audit: Current Inconsistencies (Component-by-Component)

### INTER-01: Hover State Inconsistencies

| Component | File | Current Hover | Target Hover |
|-----------|------|---------------|--------------|
| TabBar tabs (inactive) | `TabBar.tsx` | `hover:text-foreground hover:bg-surface-raised/50` | OK -- keep |
| SessionItem | `SessionItem.tsx` + `sidebar.css` | `color-mix(in oklch, var(--text-muted) 5%, var(--surface-raised))` | Normalize to `var(--surface-active)` |
| FileNode | `file-tree.css` | `var(--color-surface-hover, hsl(var(--muted) / 0.5))` | HSL fallback is wrong -- should use OKLCH token |
| ToolChip | `tool-chip.css` | `border-color: var(--border-interactive)` | OK -- border hover is appropriate for chips |
| ToolCardShell header | `tool-card-shell.css` | `border-color: var(--border-interactive)` | OK -- matches ToolChip |
| Git action buttons | `git-panel.css` | `bg-surface-raised + color-text-primary + border-color-border` | Normalize to just `bg-surface-active` |
| Git file rows | `git-panel.css` | `bg-surface-raised` | OK |
| Git commit rows | `git-panel.css` | `bg-surface-raised` | OK |
| Git branch items | `git-panel.css` | `bg-surface-raised` | OK |
| Git batch buttons | `git-panel.css` | `bg-surface-overlay` | Inconsistent -- should be `bg-surface-raised` |
| CollapsibleMessage | `CollapsibleMessage.tsx` | `hover:bg-surface-raised` | OK |
| BulkActionBar delete | `BulkActionBar.tsx` | `hover:bg-[color-mix(...)]` | Normalize to destructive hover |
| BulkActionBar cancel | `BulkActionBar.tsx` | `hover:text-foreground` | Missing background hover |
| QuickSettings trigger | `QuickSettingsPanel.tsx` | `hover:text-foreground` | Missing background hover |
| Terminal buttons | `TerminalHeader.tsx` | `hover:bg-[var(--surface-overlay)]` | Should be `hover:bg-surface-raised` |
| Code block copy | `CodeBlock.tsx` | `hover:bg-surface-raised` | OK but missing focus ring |
| Composer mention chips | `composer.css` | `.mention-chip-remove:hover { opacity: 1 }` | Opacity-only hover is inconsistent |
| MentionPicker items | `composer.css` | `bg-surface-active` | OK |
| CommandPalette items | `command-palette.css` | `bg-accent-primary-muted` | OK -- accent tint for palette |

### INTER-02: Focus Ring Gaps

**Already has focus rings (consistent):**
- shadcn Button: `focus-visible:ring-[3px] focus-visible:ring-ring/50`
- shadcn TabsTrigger: `focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50`
- shadcn Switch: `focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50`
- NewChatButton: `focus-visible:ring-2 focus-visible:ring-ring`
- Dialog close button: `focus:ring-2 focus:ring-ring` (should be focus-visible)
- SearchInput (sidebar): `focus-visible:ring-2 focus-visible:ring-ring/50`
- Git commit textarea: `focus { border-color: var(--color-accent) }` (border, not ring -- inconsistent)

**Missing focus rings entirely:**
- TabBar tab buttons (custom `<button>`)
- Terminal header buttons (Restart, Disconnect)
- SessionItem (uses `tabIndex={0}` but no focus style)
- FileNode (uses `<button>` but no focus style -- relies on browser default)
- ToolChip button (no focus style)
- ToolCardShell header (clickable but no focus style)
- CodeBlock copy button
- Git action buttons (push/pull/fetch)
- Git batch buttons (Stage All, Unstage All)
- Git branch trigger
- Git branch items
- Git generate button
- Git commit button
- BulkActionBar buttons
- QuickSettings trigger button
- CollapsibleMessage expand button
- TokenUsage expand button
- MentionPicker items
- SlashPicker items
- CommandPalette overlay (keyboard-driven but no visible focus)
- EditorTabs tab items
- Sidebar ProjectHeader buttons

**Canonical focus ring to apply:** `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`

For CSS-file components, add:
```css
.component:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--accent-primary);
}
```

### INTER-03: Disabled State Inconsistencies

| Component | Current | Issue |
|-----------|---------|-------|
| shadcn Button | `disabled:opacity-50 disabled:pointer-events-none` | Canonical -- good |
| Terminal buttons | `disabled:opacity-40 disabled:pointer-events-none` | Opacity-40 instead of 50 |
| Git generate btn | `.git-generate-btn:disabled { opacity: 0.5; cursor: not-allowed }` | Missing `pointer-events: none` |
| Git commit btn | `.git-commit-btn:disabled { opacity: 0.5; cursor: not-allowed }` | Missing `pointer-events: none` |
| Git branch create confirm | `:disabled { opacity: 0.5; cursor: not-allowed }` | Missing `pointer-events: none` |
| Git action btns | `:disabled { opacity: 0.5; cursor: not-allowed }` | OK -- cursor-not-allowed |
| ChatComposer send/stop | uses `canSend`/`canStop` FSM | Need to verify disabled visual states |
| shadcn context/dropdown items | `data-[disabled]:opacity-50 data-[disabled]:pointer-events-none` | Canonical -- good |

**Note on `pointer-events: none` vs `cursor: not-allowed`:** These are mutually exclusive. `pointer-events: none` prevents all mouse interaction (including hover), while `cursor: not-allowed` shows a cursor but still allows clicks. shadcn uses `pointer-events: none`, but visually `cursor: not-allowed` is better UX because it communicates "this exists but you can't use it right now." The cursor change is only visible if `pointer-events` is NOT `none`. The shadcn pattern works because the `disabled` HTML attribute already prevents clicks natively. For consistency, use `disabled:pointer-events-none disabled:opacity-50` (shadcn canonical).

### INTER-04: Overlay Transition Inconsistencies

**Consistent (shadcn pattern):**
- Dialog: `animate-in fade-in-0 zoom-in-95` / `animate-out fade-out-0 zoom-out-95`
- AlertDialog: Same as Dialog
- ContextMenu: `animate-in fade-in-0 zoom-in-95 slide-in-from-*` / `animate-out fade-out-0 zoom-out-95`
- DropdownMenu: Same as ContextMenu
- Tooltip: `animate-in fade-in-0 zoom-in-95 slide-in-from-*` / `animate-out fade-out-0 zoom-out-95`
- Popover: Same as Tooltip

**Missing transitions:**
- **CommandPalette**: No enter/exit animation. Just appears/disappears when opened/closed. The overlay has backdrop-filter but no opacity transition.
- **MentionPicker** (composer): No animation. Popup appears instantly.
- **SlashPicker** (composer): No animation. Popup appears instantly.
- **BranchSelector dropdown** (git): Custom dropdown with no transition.

**Note on CommandPalette:** The command palette uses `cmdk` library directly (not through shadcn's Command component wrapper). The overlay and dialog are styled via CSS attribute selectors (`[cmdk-overlay]`, `[cmdk-dialog]`). Adding transitions requires either CSS animation on mount or wrapping in a transition component.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Focus ring styles | Custom box-shadow per component | Tailwind `focus-visible:ring-*` utilities | Already used by shadcn, consistent API |
| Overlay transitions | Custom keyframes per overlay | `tw-animate-css` classes (`animate-in`, `fade-in-0`, `zoom-in-95`) | Already installed and used by every shadcn overlay |
| Disabled state logic | Per-component disabled checks | HTML `disabled` attribute + CSS `disabled:*` | Native behavior, no JS needed |
| Keyboard focus management | Custom focus tracking | `focus-visible` CSS pseudo-class | Browser-native, no JS polyfill needed |

**Key insight:** The shadcn layer already demonstrates the correct patterns. This phase is about propagating those patterns to custom components, not inventing new ones.

## Common Pitfalls

### Pitfall 1: Using `focus:` Instead of `focus-visible:`
**What goes wrong:** Focus rings appear on mouse click, making the UI feel heavy/ugly.
**Why it happens:** `focus` fires on both mouse and keyboard focus; `focus-visible` only fires on keyboard.
**How to avoid:** Always use `focus-visible:` prefix. Grep for `focus:ring` and replace with `focus-visible:ring`.
**Warning signs:** Dialog close button currently uses `focus:ring-2` instead of `focus-visible:ring-2`.

### Pitfall 2: `pointer-events: none` Blocks Cursor Change
**What goes wrong:** `disabled:pointer-events-none` prevents `cursor: not-allowed` from showing.
**Why it happens:** pointer-events: none removes the element from hit testing entirely.
**How to avoid:** Accept shadcn's convention (pointer-events: none). The native `disabled` attribute already prevents clicks. Users see opacity reduction as the disabled signal, not the cursor.

### Pitfall 3: Hover Styles Not Suppressed When Disabled
**What goes wrong:** A disabled button still shows hover background/color changes.
**Why it happens:** CSS `:hover` applies regardless of `:disabled` unless explicitly excluded.
**How to avoid:** For CSS files, use `:hover:not(:disabled)` pattern (already used in `git-panel.css` for some buttons). For Tailwind, `disabled:pointer-events-none` handles this automatically.

### Pitfall 4: Command Palette Transition Complexity
**What goes wrong:** Adding enter/exit transitions to cmdk is trickier than shadcn because cmdk manages its own visibility state.
**Why it happens:** cmdk uses a custom dialog implementation, not Radix Dialog.
**How to avoid:** Use CSS `@keyframes` on the `[cmdk-overlay]` and `[cmdk-root]` selectors triggered by mount. For exit, either accept instant close or wrap in a transition state manager.
**Recommendation:** Add CSS animation-only enter transition (fade + scale). For exit, accept instant close -- it's a command palette, speed matters more than visual polish on dismiss.

### Pitfall 5: File Tree Focus Ring on Deep Nodes
**What goes wrong:** Focus ring `outline-offset` can look weird when file tree nodes have tight padding and deep indentation.
**Why it happens:** Standard outline wraps the full element width including the indentation padding.
**How to avoid:** Use `outline-offset: -2px` (inset) for file tree nodes so the ring hugs the content area, not the full row width.

## Code Examples

### Adding Focus Ring to CSS-Styled Components
```css
/* Source: Pattern from shadcn button.tsx adapted for CSS */
.git-action-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--accent-primary);
  border-radius: var(--radius-sm);
}

.tool-chip:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--accent-primary);
}
```

### Adding Focus Ring to Tailwind-Styled Components
```tsx
// Source: Existing NewChatButton pattern
// Before (TabBar):
className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors"

// After (TabBar with focus ring):
className={cn(
  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
)}
```

### Fixing Hover in File Tree CSS
```css
/* Before: Uses HSL fallback */
.file-node:hover {
  background: var(--color-surface-hover, hsl(var(--muted) / 0.5));
}

/* After: Uses OKLCH token */
.file-node:hover {
  background: var(--surface-active);
}
```

### Adding Command Palette Enter Transition
```css
/* Source: Pattern derived from shadcn Dialog transitions */
@keyframes cmdk-overlay-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes cmdk-content-in {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

[cmdk-overlay] {
  animation: cmdk-overlay-in var(--duration-normal) var(--ease-out);
}

[cmdk-root] {
  animation: cmdk-content-in var(--duration-normal) var(--ease-out);
}

@media (prefers-reduced-motion: reduce) {
  [cmdk-overlay],
  [cmdk-root] {
    animation: none;
  }
}
```

### Adding MentionPicker/SlashPicker Transitions
```css
/* Source: tw-animate-css pattern from shadcn overlays */
.mention-picker,
.slash-picker {
  animation: picker-in var(--duration-normal) var(--ease-out);
}

@keyframes picker-in {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `focus:ring-*` | `focus-visible:ring-*` | 2023+ | Focus rings only on keyboard navigation |
| Custom focus JS | CSS `:focus-visible` | 2022 (Safari 15.4) | No polyfill needed, browser-native |
| opacity for disabled | `pointer-events: none` + opacity | shadcn convention | Prevents hover/click without JS |
| Per-component transitions | tw-animate-css utility classes | Already in project | Consistent enter/exit via data attributes |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 + React Testing Library |
| Config file | `src/vite.config.ts` (vitest config section) |
| Quick run command | `cd src && npx vitest run --reporter=verbose` |
| Full suite command | `cd src && npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INTER-01 | Hover states use consistent tokens | manual-only | Visual verification in browser | N/A |
| INTER-02 | Focus rings present on all focusable elements | unit | `cd src && npx vitest run src/src/tests/focus-ring-audit.test.tsx -x` | Wave 0 |
| INTER-03 | Disabled states have reduced opacity, no hover, cursor change | unit | `cd src && npx vitest run src/src/tests/disabled-state-audit.test.tsx -x` | Wave 0 |
| INTER-04 | Overlays have consistent enter/exit transitions | manual-only | Visual verification -- CSS animation presence | N/A |

**Note:** INTER-01 and INTER-04 are primarily CSS-visual concerns. Unit tests can verify that correct CSS classes are applied, but the visual result must be verified manually (or via Playwright visual tests). INTER-02 and INTER-03 can be partially tested by rendering components and checking for focus-visible attributes and disabled state classes.

### Sampling Rate
- **Per task commit:** `cd src && npx vitest run --reporter=verbose`
- **Per wave merge:** `cd src && npx vitest run`
- **Phase gate:** Full suite green + manual visual verification in browser

### Wave 0 Gaps
- [ ] `src/src/tests/focus-ring-audit.test.tsx` -- render key interactive components, verify focus-visible classes/attributes
- [ ] `src/src/tests/disabled-state-audit.test.tsx` -- render disabled buttons, verify opacity/pointer-events classes

## Scope Breakdown (Recommended Plan Structure)

### Plan 1: Hover + Focus + Disabled Standardization (Custom Components)
Sweep through all custom interactive components (non-shadcn) and apply:
- Consistent hover backgrounds using token-based classes
- Focus-visible rings matching shadcn pattern
- Normalized disabled states (opacity-50 everywhere)

**Files to modify (~20 files):**
- CSS files: `sidebar.css`, `file-tree.css`, `git-panel.css`, `tool-chip.css`, `tool-card-shell.css`, `composer.css`, `command-palette.css`, `base.css`
- TSX files: `TabBar.tsx`, `TerminalHeader.tsx`, `SessionItem.tsx`, `BulkActionBar.tsx`, `QuickSettingsPanel.tsx`, `CollapsibleMessage.tsx`, `CodeBlock.tsx`, `EditorTabs.tsx`, `TokenUsage.tsx`
- Fix Dialog close button: `focus:ring` -> `focus-visible:ring`

### Plan 2: Overlay Transitions
Add enter/exit transitions to components that currently lack them:
- Command palette CSS animation (enter only -- exit is instant for speed)
- MentionPicker/SlashPicker fade+slide animation
- BranchSelector dropdown animation
- Verify all shadcn overlays have consistent transition classes

**Files to modify (~5 files):**
- `command-palette.css`
- `composer.css`
- `git-panel.css`
- Potentially `BranchSelector.tsx` if it needs structural changes

## Sources

### Primary (HIGH confidence)
- Codebase audit of all 21 shadcn UI components in `src/src/components/ui/`
- Codebase audit of 22 CSS files across `components/` tree
- Codebase audit of 38+ TSX files with `hover:` classes
- Constitution v2 sections 3.1, 3.3, 3.6, 7.14, 9.2, 11.1

### Secondary (MEDIUM confidence)
- shadcn/ui component source patterns (verified against installed versions)
- tw-animate-css utility class availability (verified -- already imported in index.css)
- Tailwind v4 `focus-visible:` support (verified -- used in button.tsx)

## Open Questions

1. **Command palette exit transition**
   - What we know: cmdk manages its own visibility; CSS animation works for enter but not exit (element unmounts before exit animation plays)
   - What's unclear: Whether the CommandPalette component wraps cmdk with a state that could delay unmount
   - Recommendation: Enter-only CSS animation. Exit is instant -- command palettes should feel snappy on dismiss.

2. **`--surface-active` token existence**
   - What we know: `tokens.css` defines `--surface-active: oklch(1 0 0 / 0.05)` -- a white 5% overlay
   - What's unclear: Whether this is the right semantic for all hover backgrounds
   - Recommendation: Use it for neutral list-item hovers. Use `--accent-primary-muted` for primary-action hovers.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new dependencies, pure CSS/Tailwind work
- Architecture: HIGH - patterns already established by shadcn layer, just need propagation
- Pitfalls: HIGH - well-understood CSS patterns, verified against codebase
- Scope: HIGH - complete audit of all interactive components in the codebase

**Research date:** 2026-03-19
**Valid until:** 2026-04-19 (stable -- CSS patterns don't change frequently)
