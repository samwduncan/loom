# Phase 65: Touch Target Compliance - Research

**Researched:** 2026-03-29
**Domain:** CSS touch target sizing, focus ring standardization, Playwright e2e audit
**Confidence:** HIGH

## Summary

Phase 65 is a pure CSS/Tailwind phase with one Playwright test and one documentation update. No new dependencies, no JS logic changes, no state management. The codebase already has a well-established `min-h-[44px] md:min-h-0` pattern used in 13+ locations -- this phase extends it to 5 remaining violations and audits all sidebar elements for compliance.

The focus ring sweep is the most mechanical task: 16 CSS `:focus-visible` rules across 5 CSS files use the non-standard `box-shadow: 0 0 0 2px var(--accent-primary)` pattern, while shadcn UI primitives use `focus-visible:ring-[3px] focus-visible:ring-ring/50`. The sweep replaces all non-standard patterns with the ring utility equivalent. Additionally, ~15 Tailwind-inline components use `focus-visible:ring-2` instead of `ring-[3px]` -- these also need updating to match the shadcn standard.

**Primary recommendation:** Fix the 5 TOUCH violations first (straightforward min-height additions), then sweep all focus rings in a single pass, then add the Playwright audit test, then update V2_CONSTITUTION.md. Batch the 5 TOUCH fixes + sidebar audit into one plan, focus ring sweep into a second, and test + docs into a third.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** All 7 target components visually grow to 44px on mobile. No invisible hit area extensions via pseudo-elements.
- **D-02:** Use `min-h-[44px]` (Tailwind class) as the primary mechanism. Padding adjustments as secondary/alternative where min-height doesn't fit the flex layout.
- **D-03:** Mobile-only touch targets. Every 44px `min-height` MUST be paired with `md:min-h-0` to revert on desktop (>= 768px). Follows established SessionItem pattern.
- **D-04:** No tablet-specific breakpoint. The md: (768px) breakpoint covers iPad portrait naturally.
- **D-05:** Standardize ALL custom interactive components on shadcn focus pattern: `focus-visible:ring-[3px] focus-visible:ring-ring/50`.
- **D-06:** Remove non-standard focus styles (e.g., custom `box-shadow: 0 0 0 2px`) and replace with Tailwind ring utility.
- **D-07:** Components using Button primitive already have correct focus ring. Only custom interactive elements need fixing.
- **D-08:** Full sweep of every interactive sidebar element, not just explicitly named targets.
- **D-09:** SessionItem already compliant. ProjectHeader covered by TOUCH-03. Remaining sidebar: NewChatButton, SearchInput, BulkActionBar, QuickSettingsPanel, SessionContextMenu items.
- **D-10:** Add touch-target convention section to V2_CONSTITUTION.md.
- **D-11:** Add Playwright touch-target audit test at mobile viewport (375px).
- **D-12:** Test runs in existing Playwright setup.

### Claude's Discretion
- Per-component implementation details (padding values, min-h vs padding)
- Playwright test file location and query selector strategy
- Exact wording of V2_CONSTITUTION.md convention section
- Whether to batch all 7 fixes in one plan or split across plans

### Deferred Ideas (OUT OF SCOPE)
None.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TOUCH-01 | ThinkingDisclosure trigger 44px min touch target | CSS-only: add mobile min-height to `.thinking-disclosure-trigger` in thinking-disclosure.css |
| TOUCH-02 | ToolCardShell header 44px min touch target | CSS-only: add mobile min-height to `.tool-card-shell-header` in tool-card-shell.css |
| TOUCH-03 | ProjectHeader 44px min touch target | Tailwind: add `min-h-[44px] md:min-h-0` to button className in ProjectHeader.tsx |
| TOUCH-04 | ChatEmptyState template buttons 44px min touch target | Tailwind: add `min-h-[44px] md:min-h-0` to template button className in ChatEmptyState.tsx |
| TOUCH-05 | LiveSessionBanner Detach button 44px min touch target | Tailwind: add `min-h-[44px] md:min-h-0` to detach button in LiveSessionBanner.tsx |
| TOUCH-06 | All sidebar interactive elements 44px min | Audit complete -- most already compliant, BulkActionBar and SearchInput need fixes |
| TOUCH-07 | Focus rings visible with 2px+ stroke on all 44px targets | Full sweep of 16 CSS rules + ~15 Tailwind inline classes |
</phase_requirements>

## Standard Stack

No new libraries needed. This phase uses only existing tools:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tailwind CSS | v4 | Utility-first CSS, `min-h-[44px]`, `md:min-h-0`, ring utilities | Already in stack, established 44px pattern |
| Playwright | 1.58.2 | E2E touch target audit test | Already configured in `src/playwright.config.ts` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Vitest | 4.0.18 | Unit tests (not needed for this phase) | Only if component rendering tests added |

**Installation:** None -- zero new dependencies.

## Architecture Patterns

### Established 44px Touch Target Pattern
```
min-h-[44px] md:min-h-0
```
This is THE pattern. Used in 13+ locations already:
- `SessionItem.tsx` (line 161) -- the original reference
- `NewChatButton.tsx` (line 28)
- `QuickSettingsPanel.tsx` (line 54) -- also has `min-w-[44px]`
- `Sidebar.tsx` (lines 113, 166, 188) -- hamburger, close, settings buttons
- `ChatView.tsx` (lines 229, 244, 260) -- header action buttons
- `CodeBlock.tsx` (line 81) -- copy button
- `PermissionBanner.tsx` (lines 182, 191)
- `SearchBar.tsx` (line 67)

For buttons that are also narrow (icon-only), pair with `min-w-[44px]`:
```
min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0
```

### CSS-File Touch Targets (media query approach)
For components styled in CSS files (not Tailwind inline), use media query:
```css
@media (max-width: 767px) {
  .selector {
    min-height: 44px;
  }
}
```
This is already established in `tool-chip.css` (line 184-188), `composer.css`, `model-selector.css`, `follow-up-pills.css`, and `base.css`.

### Focus Ring Standard Pattern
```
focus-visible:ring-[3px] focus-visible:ring-ring/50
```
This is the shadcn standard, used in ALL `ui/` primitives:
- `button.tsx`, `input.tsx`, `checkbox.tsx`, `switch.tsx`, `select.tsx`, `tabs.tsx`, `badge.tsx`, `scroll-area.tsx`

For CSS files, the equivalent:
```css
.selector:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px oklch(from var(--ring) l c h / 0.5);
}
```
Or use the Tailwind `@apply` directive if the CSS file already uses it.

### Anti-Patterns to Avoid
- **Double-sizing:** Do NOT add both `min-height` AND extra vertical padding on the same element. Pick one mechanism per component. (Quality bar risk flag from Bard)
- **Missing desktop revert:** Every `min-h-[44px]` MUST have `md:min-h-0`. Without it, desktop users get bloated spacing.
- **Invisible hit areas:** D-01 explicitly bans pseudo-element hit area extensions. Components must visually grow.
- **`focus-visible:ring-2` (non-standard):** This is 2px, not 3px. Must be `ring-[3px]` to match shadcn primitives.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Touch target sizing | JS-based runtime measurement | CSS `min-h-[44px]` | Zero runtime cost, already proven pattern |
| Focus ring styling | Custom box-shadow per component | Tailwind `ring-[3px] ring-ring/50` | Consistent with UI primitives, one source of truth |
| Touch target validation | Manual pixel inspection | Playwright `getBoundingClientRect()` | Automated, catches regressions in CI |
| Responsive breakpoints | Custom media queries per component | Tailwind `md:` prefix | Already standardized at 768px across codebase |

## Detailed Component Audit

### TOUCH-01: ThinkingDisclosure (thinking-disclosure.css + ThinkingDisclosure.tsx)
**Current state:** `.thinking-disclosure-trigger` has `padding: 0`, `font-size: 0.875rem` (14px). With line-height, effective height is ~20px.
**Fix:** Add `@media (max-width: 767px)` block with `min-height: 44px` to `.thinking-disclosure-trigger` in `thinking-disclosure.css`. Since the trigger is a flex row (`display: flex; align-items: center`), min-height works naturally.
**Focus ring:** Currently has NO focus-visible style at all. Needs one added.
**Desktop revert:** Not needed -- CSS media query only applies on mobile.

### TOUCH-02: ToolCardShell (tool-card-shell.css)
**Current state:** `.tool-card-shell-header` has `padding: 8px 12px`. With content, effective height is ~32px.
**Fix:** Add `@media (max-width: 767px)` block with `min-height: 44px` to `.tool-card-shell-header`.
**Focus ring:** Currently `box-shadow: 0 0 0 2px var(--accent-primary)` (non-standard). Replace with ring-equivalent per D-06.
**Desktop revert:** Not needed -- CSS media query scoped to mobile.

### TOUCH-03: ProjectHeader (ProjectHeader.tsx)
**Current state:** Tailwind classes `px-3 py-2` give ~40px height (text line + 16px padding).
**Fix:** Add `min-h-[44px] md:min-h-0` to the button className.
**Focus ring:** Currently has NO focus-visible style. Uses `session-item-hover` class which provides `box-shadow: 0 0 0 2px` on focus-visible via sidebar.css. This non-standard ring needs replacing per D-06.
**Desktop revert:** Via `md:min-h-0`.

### TOUCH-04: ChatEmptyState (ChatEmptyState.tsx)
**Current state:** Template buttons use `px-3 py-1.5 text-sm` = ~32px height.
**Fix:** Add `min-h-[44px] md:min-h-0` to template button className.
**Focus ring:** Currently has NO focus-visible style at all. Needs one added.
**Desktop revert:** Via `md:min-h-0`.

### TOUCH-05: LiveSessionBanner (LiveSessionBanner.tsx)
**Current state:** Detach button uses `px-2 py-0.5 text-xs` = ~24px height.
**Fix:** Add `min-h-[44px] md:min-h-0` to detach button className. This will make the banner taller on mobile -- acceptable per D-01 since the banner area is not content-dense.
**Focus ring:** Currently has NO focus-visible style. Needs one added.
**Desktop revert:** Via `md:min-h-0`.

### TOUCH-06: Sidebar Audit

| Element | File | Current | Status | Action |
|---------|------|---------|--------|--------|
| SessionItem | SessionItem.tsx:161 | `min-h-[44px] md:min-h-0` | COMPLIANT | None |
| NewChatButton | NewChatButton.tsx:28 | `min-h-[44px] md:min-h-0` | COMPLIANT | Focus ring needs `ring-[3px]` (currently `ring-2`) |
| QuickSettingsPanel trigger | QuickSettingsPanel.tsx:54 | `min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0` | COMPLIANT | Focus ring needs `ring-[3px]` (currently `ring-2`) |
| Sidebar close/hamburger | Sidebar.tsx:113,166 | `min-h-[44px] min-w-[44px]` | COMPLIANT | No focus ring -- needs adding |
| Sidebar settings button | Sidebar.tsx:188 | `min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0` | COMPLIANT | No focus ring -- needs adding |
| SearchInput field | SearchInput.tsx:42 | `py-1.5` (~32px) | NON-COMPLIANT | Add `min-h-[44px] md:min-h-0` |
| SearchInput clear button | SearchInput.tsx:54 | Icon only, ~14px | EDGE CASE | Positioned absolute; fix with min-w/min-h on the button itself |
| BulkActionBar delete | BulkActionBar.tsx:35 | `p-1.5` (~28px) | NON-COMPLIANT | Add `min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0` |
| BulkActionBar cancel | BulkActionBar.tsx:48 | `p-1.5` (~28px) | NON-COMPLIANT | Add `min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0` |
| ProjectHeader | ProjectHeader.tsx | `px-3 py-2` (~40px) | NON-COMPLIANT | TOUCH-03 covers this |
| SessionItem rename input | sidebar.css:98 | Native input | OK | Inherits SessionItem min-height |
| ConnectionStatusIndicator | Sidebar header | Display only | N/A | Not interactive |

### TOUCH-07: Focus Ring Sweep

#### CSS Files with Non-Standard `box-shadow: 0 0 0 2px` Focus Rings

| File | Selector(s) | Count |
|------|-------------|-------|
| `sidebar.css` | `.session-item-hover:focus-visible` | 1 |
| `tool-card-shell.css` | `.tool-card-shell-header:focus-visible` | 1 |
| `tool-chip.css` | `.tool-chip:focus-visible` | 1 |
| `file-tree.css` | `.file-node:focus-visible` | 1 |
| `git-panel.css` | 10 selectors (sub-tab, branch-trigger, branch-item, branch-new-btn, branch-create-confirm, action-btn, batch-btn, file-discard, generate-btn, commit-btn) | 10 |
| `composer.css` | `.mention-picker-item:focus-visible, .slash-picker-item:focus-visible` | 1 (shared rule) |
| **Total CSS** | | **15 rules** |

#### Tailwind Inline with Non-Standard `ring-2` (should be `ring-[3px]`)

| File | Line(s) | Element |
|------|---------|---------|
| `NewChatButton.tsx` | 32 | Button |
| `TerminalHeader.tsx` | 55, 66 | Restart, Disconnect buttons |
| `EditorTabs.tsx` | 85, 108 | Tab, close button |
| `TabBar.tsx` | 100 | Tab button |
| `BulkActionBar.tsx` | 38, 50 | Delete, Cancel buttons |
| `QuickSettingsPanel.tsx` | 56 | Trigger button |
| `SearchInput.tsx` | 45, 56 | Input field, clear button |
| `dialog.tsx` | 70 | Close button |
| `TokenUsage.tsx` | 75 | Summary button |
| `CodeBlock.tsx` | 81 | Copy button |
| `CollapsibleMessage.tsx` | 68 | Toggle button |
| `ImageLightbox.tsx` | 46 | Close button |
| **Total Tailwind** | | **~16 elements** |

#### Components with NO Focus-Visible Style

| Component | Element |
|-----------|---------|
| `ThinkingDisclosure.tsx` | `.thinking-disclosure-trigger` |
| `ChatEmptyState.tsx` | Template buttons |
| `LiveSessionBanner.tsx` | Detach button |
| `Sidebar.tsx` | Hamburger, close, settings buttons |

**Standard replacement (CSS files):**
```css
/* Before */
.selector:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--accent-primary);
}

/* After */
.selector:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px oklch(from var(--ring) l c h / 0.5);
}
```

**Standard replacement (Tailwind inline):**
```
/* Before */
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring

/* After */
focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50
```

## Common Pitfalls

### Pitfall 1: Double-Padding Trap
**What goes wrong:** Adding both `min-h-[44px]` AND increasing padding on the same element creates an element taller than 44px with wasted space.
**Why it happens:** Developer sees 32px element, adds padding to reach 44px, then also adds min-height.
**How to avoid:** Use ONE mechanism per component. Prefer `min-h-[44px]` with `items-center` for consistent centering. Only use padding when min-height doesn't work (e.g., text-only elements without flex).
**Warning signs:** Element measuring 50px+ in DevTools when target is 44px.

### Pitfall 2: Missing Desktop Revert
**What goes wrong:** Desktop layout gets bloated with 44px row heights, destroying information density.
**Why it happens:** Adding `min-h-[44px]` without `md:min-h-0`.
**How to avoid:** Every Tailwind `min-h-[44px]` must pair with `md:min-h-0`. Every CSS `min-height: 44px` must be inside `@media (max-width: 767px)`.
**Warning signs:** Desktop sidebar feels too spacious. Session list items are unusually tall.

### Pitfall 3: SearchInput Clear Button Sizing
**What goes wrong:** The clear button in SearchInput is absolutely positioned inside the input wrapper. Making it 44px would overlap the input text.
**Why it happens:** Absolute positioning means size changes affect the parent layout differently than flex children.
**How to avoid:** For the clear button specifically, ensure the clickable area is 44px via min-w/min-h on the button itself, but keep the icon at 14px. The button padding handles the difference. Or use the surrounding container's height to ensure the tap zone covers the area.
**Warning signs:** Text overlaps with the clear button on mobile.

### Pitfall 4: CSS Ring Variable Mismatch
**What goes wrong:** CSS files use `var(--accent-primary)` for focus ring color while Tailwind uses `ring` token. After the sweep, some rings are a different color.
**Why it happens:** `--accent-primary` and `--ring` may be different values.
**How to avoid:** Verify that `--ring` is defined in the theme. If they differ, use whichever the UI primitives use (`--ring` via `ring-ring/50`). For CSS files, use `var(--ring)` with opacity, matching the Tailwind output.
**Warning signs:** Focus rings visually change color after the sweep.

### Pitfall 5: LiveSessionBanner Height Growth
**What goes wrong:** The banner grows from ~32px to 44px+ on mobile, pushing chat content down unexpectedly.
**Why it happens:** The detach button getting min-height forces the banner taller since the button is in a flex row with the banner.
**How to avoid:** This is expected per D-01. The banner isn't content-dense. Just verify it looks intentional, not broken.
**Warning signs:** Banner looks awkwardly tall compared to its content. (Acceptable -- verify during implementation.)

## Code Examples

### Pattern 1: Tailwind Touch Target (standard)
```tsx
// Source: SessionItem.tsx (established pattern)
<div className={cn(
  'px-3 py-2 cursor-pointer',
  'min-h-[44px] md:min-h-0',                    // 44px mobile, compact desktop
  'transition-[background-color] duration-[var(--duration-fast)]',
)}>
```

### Pattern 2: CSS Touch Target (media query)
```css
/* Source: tool-chip.css (established pattern) */
@media (max-width: 767px) {
  .tool-chip {
    min-height: 44px;
    padding: 10px 14px;
  }
}
```

### Pattern 3: Standard Focus Ring (Tailwind)
```tsx
// Source: button.tsx (shadcn standard)
'focus-visible:ring-[3px] focus-visible:ring-ring/50'
```

### Pattern 4: Standard Focus Ring (CSS)
```css
/* Equivalent of Tailwind ring-[3px] ring-ring/50 */
.selector:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px oklch(from var(--ring) l c h / 0.5);
}
```

### Pattern 5: Playwright Touch Target Audit
```typescript
// Source: Playwright API docs (getBoundingClientRect for size assertions)
import { test, expect } from '@playwright/test';

test('all interactive elements meet 44px touch target on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 }); // iPhone viewport

  await page.goto('/chat');
  // Wait for app to load
  await page.waitForSelector('[data-testid="chat-empty-state"]');

  // Query all interactive elements
  const interactiveElements = page.locator(
    'button, a[href], [role="button"], [role="option"], input, select, textarea'
  );

  const count = await interactiveElements.count();
  for (let i = 0; i < count; i++) {
    const el = interactiveElements.nth(i);
    if (!(await el.isVisible())) continue;

    const box = await el.boundingBox();
    if (!box) continue;

    // Assert minimum 44px height
    expect(box.height, `Element ${await el.getAttribute('aria-label') || await el.textContent()}`).toBeGreaterThanOrEqual(44);
  }
});
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 (unit), Playwright 1.58.2 (e2e) |
| Config file | `src/playwright.config.ts` |
| Quick run command | `cd src && npx vitest run --reporter=verbose` |
| Full suite command | `cd src && npx playwright test` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TOUCH-01 | ThinkingDisclosure trigger >= 44px | e2e | `cd src && npx playwright test e2e/touch-targets.spec.ts` | Wave 0 |
| TOUCH-02 | ToolCardShell header >= 44px | e2e | Same file | Wave 0 |
| TOUCH-03 | ProjectHeader >= 44px | e2e | Same file | Wave 0 |
| TOUCH-04 | ChatEmptyState templates >= 44px | e2e | Same file | Wave 0 |
| TOUCH-05 | LiveSessionBanner detach >= 44px | e2e | Same file | Wave 0 |
| TOUCH-06 | All sidebar interactives >= 44px | e2e | Same file | Wave 0 |
| TOUCH-07 | Focus rings visible 3px width | manual | Visual inspection in browser | N/A |

### Sampling Rate
- **Per task commit:** `cd src && npx vitest run --reporter=verbose 2>&1 | tail -5`
- **Per wave merge:** `cd src && npx playwright test`
- **Phase gate:** Full Playwright suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/e2e/touch-targets.spec.ts` -- covers TOUCH-01 through TOUCH-06 (D-11/D-12)

## Sources

### Primary (HIGH confidence)
- Direct codebase audit of all 10 target component files
- Existing `min-h-[44px] md:min-h-0` pattern in 13+ locations verified by grep
- `ui/button.tsx` focus ring pattern: `focus-visible:ring-[3px] focus-visible:ring-ring/50`
- Playwright 1.58.2 confirmed via `npx playwright --version`
- Vitest 4.0.18 confirmed via package.json

### Secondary (MEDIUM confidence)
- Apple HIG 44pt minimum touch target standard (well-known, not re-verified)

### Tertiary (LOW confidence)
- None -- all findings from direct codebase inspection

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- zero new dependencies, all patterns already established in codebase
- Architecture: HIGH -- copying existing 13+ location pattern to 5 more locations
- Pitfalls: HIGH -- identified from direct code inspection of actual components
- Focus ring inventory: HIGH -- exhaustive grep of all `:focus-visible` and `ring-` patterns

**Research date:** 2026-03-29
**Valid until:** 2026-04-28 (stable -- pure CSS patterns don't change)
