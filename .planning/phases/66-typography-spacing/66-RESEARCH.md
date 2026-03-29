# Phase 66: Typography & Spacing - Research

**Researched:** 2026-03-29
**Domain:** CSS typography tokens, mobile font scaling, design system extension
**Confidence:** HIGH

## Summary

Phase 66 is a CSS-focused phase that extends the existing design token system with typography tokens, fixes 8 font-size and spacing violations for mobile, and formalizes typography conventions. The work is well-scoped: all changes are CSS/class-level with zero behavioral changes to components.

The codebase has three latent bugs that this phase naturally fixes: `--text-code`, `--text-sm`, and `--text-xs` CSS custom properties are referenced in 26 CSS declarations across `streaming-markdown.css` and `git-panel.css` but **never defined** in `tokens.css`. These resolve to `initial` (browser default) which means code blocks and git panel text have been rendering at inconsistent sizes. The fix is simple: define the tokens in `:root`.

All 8 TYPO requirements have specific pixel targets and CSS selectors in the acceptance criteria. The existing Phase 65 mobile breakpoint pattern (`min-h-[44px] md:min-h-0` / `@media (max-width: 767px)`) provides the proven mechanism for mobile-only overrides. No new libraries, no behavioral changes, no complex architecture -- this is design token extension + targeted CSS fixes.

**Primary recommendation:** Define all missing typography tokens in `tokens.css`, add mobile overrides via `@media (max-width: 767px)`, fix the ~5 sub-12px violations in components, and add Section 14 to V2_CONSTITUTION.md.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Dual approach: CSS custom property overrides via `@media (max-width: 767px)` in `tokens.css` for global token adjustments + Tailwind responsive classes for component-level overrides. Follows Phase 65 pattern.
- **D-02:** No CSS `clamp()` for font sizes -- mobile and desktop have distinct fixed sizes, not fluid scaling.
- **D-03:** Add missing tokens to `tokens.css`: `--text-xs: 0.75rem` (12px), `--text-sm: 0.8125rem` (13px), `--text-code: 0.8125rem` (13px desktop).
- **D-04:** Add mobile-override tokens: `--text-body-mobile: 0.9375rem` (15px), `--text-code-mobile: 1.125rem` (18px). Applied via media query in `tokens.css`.
- **D-05:** Refactor existing hardcoded `font-size` values to use new tokens where practical (main violations only, not full sweep).
- **D-06:** Fix latent bug: `--text-code` referenced in streaming-markdown.css but undefined in tokens.css.
- **D-07:** DateGroupHeader from 0.6875rem (11px) to 0.75rem (12px).
- **D-08:** Fix composer token count (0.6875rem) and command palette shortcut text (11px) -- same sub-12px pattern.
- **D-09:** ThinkingDisclosure trigger already at 0.875rem (14px) -- verify before fixing.
- **D-10:** SessionItem already uses `truncate` -- verify on mobile before adding `line-clamp-1`.
- **D-11:** Mobile chat body text: 15px (0.9375rem). Desktop stays at 14px.
- **D-12:** Mobile code blocks: 18px (1.125rem). Desktop stays at `--text-code`.
- **D-13:** Streaming markdown CSS must mirror mobile overrides for seamless transition.
- **D-14:** SessionItem already uses `px-3 py-2` with 44px min-h -- no conflict.
- **D-15:** DateGroupHeader `py-1.5` -- adjust gap if needed for 4px between groups.
- **D-16:** Audit modal buttons/form labels for sub-14px on mobile.
- **D-17:** Scope: modals, form labels, action text. NOT decorative/metadata text.
- **D-18:** `line-height: 1.6` for body/reading text on mobile only (`.markdown-body`, `.active-message`).
- **D-19:** Do NOT apply 1.6 globally -- headings/labels/badges/pills keep 1.4-1.5.
- **D-20:** Intentional `line-height: 1` in tool-card-shell, thinking-disclosure arrow, scroll pill, tool chip -- do NOT change.
- **D-21:** `useKeyboardOffset` hook -- no current mechanism shrinks fonts. Verify before fixing.
- **D-22:** If token count label (0.6875rem) becomes unreadable on keyboard open, D-08 fix resolves it.
- **D-23:** Add Section 14 to V2_CONSTITUTION.md for typography conventions.

### Claude's Discretion
- Per-component implementation details (Tailwind classes vs CSS rules)
- Exact refactoring scope for hardcoded font-size consolidation
- Whether to batch all TYPO fixes in one plan or split into typography + spacing plans
- Testing strategy for TYPO-02/TYPO-03/TYPO-08 (verify-first items)

### Deferred Ideas (OUT OF SCOPE)
- Comprehensive font-size audit (full sweep of every hardcoded font-size to tokens)
- Fluid typography via clamp()
- Dark mode contrast audit (VISUAL-08, Phase 68)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TYPO-01 | DateGroupHeader uses minimum 12px font size (not 11px) | Direct CSS fix: change `text-[length:0.6875rem]` to `text-[length:var(--text-xs)]` where `--text-xs: 0.75rem`. Also fix `composer.css:192` and `command-palette.css:86`. |
| TYPO-02 | ThinkingDisclosure trigger text renders at 14px minimum on mobile | Already at `font-size: 0.875rem` (14px) in thinking-disclosure.css:28. Verify no override. Mobile media query adds floor if needed. |
| TYPO-03 | Session titles truncate at 1 line with ellipsis on mobile | SessionItem.tsx already uses `truncate` class on title div. Verify at mobile viewport width. |
| TYPO-04 | Chat message typography: 15px body, 18px code on mobile | Mobile media query on `.markdown-body`, `.active-message` sets `font-size: var(--text-body-mobile)`. Code blocks get `var(--text-code-mobile)`. streaming-markdown.css mirrors. |
| TYPO-05 | Sidebar session list density: py-2 items, 4px gaps between groups | SessionItem already `px-3 py-2` with `min-h-[44px]`. DateGroupHeader gap adjustment if needed. |
| TYPO-06 | Action labels in modals/buttons use 14px minimum on mobile | Audit shadcn Button (already 14px), custom text in modals/CommandPalette. Mobile media query for any sub-14px action labels. |
| TYPO-07 | Line-height preserved at 1.6 minimum for body text on mobile | MarkdownRenderer already uses `leading-relaxed` (1.625). Add mobile media query for `.active-message` content. |
| TYPO-08 | Keyboard does not cause text field labels to shrink | useKeyboardOffset adjusts padding, not font size. Verify no viewport-based font scaling occurs. D-08 fix for token count at 12px covers edge case. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| CSS Custom Properties | N/A | Typography token system | Already used for all design tokens in `tokens.css` |
| Tailwind CSS v4 | 4.x | Responsive utility classes | Already the project's styling system |
| `@media (max-width: 767px)` | CSS | Mobile breakpoint | Established Phase 65 pattern |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Vitest | 4.0.18 | Unit tests for token definitions | Token presence assertions in `tokens.test.ts` |
| Playwright | 1.58.2 | E2E font-size regression tests | Mobile viewport font-size measurement |

No new dependencies required. This phase is purely CSS/token work.

## Architecture Patterns

### Token System Extension Pattern

The existing `tokens.css` defines tokens in a single `:root` block. New typography tokens follow the same pattern.

**Desktop tokens (in `:root`):**
```css
/* tokens.css - add to Typography Scale section */
--text-xs: 0.75rem;      /* 12px */
--text-sm: 0.8125rem;    /* 13px */
--text-code: 0.8125rem;  /* 13px - code blocks desktop */
```

**Mobile overrides (new media query block in `tokens.css` or `base.css`):**
```css
@media (max-width: 767px) {
  :root {
    --text-body-mobile: 0.9375rem;  /* 15px */
    --text-code-mobile: 1.125rem;   /* 18px */
  }
}
```

### Mobile Font Override Pattern

Two mechanisms, consistent with Phase 65:

**Pattern A: Token override via media query (global)**
Used when the change should affect all consumers of a token. Best for body text and code blocks.

```css
/* In base.css or tokens.css */
@media (max-width: 767px) {
  .markdown-body,
  .active-message {
    font-size: 0.9375rem;  /* 15px body on mobile */
    line-height: 1.6;
  }
  .markdown-body code,
  .active-message code,
  .active-message .streaming-code-block code {
    font-size: 1.125rem;   /* 18px code on mobile */
  }
}
```

**Pattern B: Tailwind responsive class (component-specific)**
Used for one-off component fixes. Follows the `md:` revert pattern.

```tsx
// DateGroupHeader: from 0.6875rem to 0.75rem (12px minimum)
'text-[length:var(--text-xs)]'  // Replaces 'text-[length:0.6875rem]'
```

### Anti-Patterns to Avoid
- **Global `line-height: 1.6` on body/html:** Wastes space on compact UI elements (tool chips, scroll pills, badges). Apply only to reading text containers.
- **Using `clamp()` for mobile font sizes:** D-02 explicitly rejects fluid scaling. Clean breakpoint split only.
- **Changing intentional `line-height: 1` values:** Four CSS files use `line-height: 1` for compact UI elements (tool-card-shell, thinking-disclosure arrow, scroll pill, tool chip). These are deliberate and must not change.
- **Applying mobile font-size to code blocks via Tailwind classes:** Code block font-size inheritance is complex (Shiki, streaming, finalized). CSS media queries on class selectors are more reliable than Tailwind classes scattered across 3+ components.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Mobile breakpoint detection | Custom JS viewport listener | `@media (max-width: 767px)` CSS | Phase 65 established this pattern; CSS media queries are zero-JS overhead |
| Typography scale system | Custom JS font-size manager | CSS custom properties in `:root` | Existing token system; no JS needed for static font sizes |
| Font-size verification | Manual browser inspection | Playwright `getComputedStyle()` assertions | Automated regression testing at mobile viewport |

## Common Pitfalls

### Pitfall 1: Streaming/Finalized Font-Size Mismatch
**What goes wrong:** Mobile font-size is applied to MarkdownRenderer (finalized messages) but not to streaming-markdown.css (active messages), causing a visible size jump when streaming completes.
**Why it happens:** Streaming and finalized markdown have independent CSS rulesets. The streaming phase uses `.active-message` classes while finalized uses `.markdown-body` classes.
**How to avoid:** Every mobile font-size override targeting `.markdown-body` MUST also target `.active-message`. Apply them in the same media query block.
**Warning signs:** Text visibly resizes when a streaming message finishes.

### Pitfall 2: Undefined CSS Token Fallback
**What goes wrong:** `var(--text-code)` resolves to `initial` (browser default, typically 16px) because the token was never defined. After defining it as `0.8125rem`, the git panel and streaming code blocks may visually change size.
**Why it happens:** `--text-code`, `--text-sm`, and `--text-xs` are referenced in 26 CSS declarations across `git-panel.css` and `streaming-markdown.css` but missing from `tokens.css`.
**How to avoid:** Define all three tokens. Check git-panel.css rendering before/after since it heavily uses `--text-sm` and `--text-xs` (22 occurrences).
**Warning signs:** Code blocks or git panel text changes size unexpectedly after token definition.

### Pitfall 3: Double Font-Size Application
**What goes wrong:** Both a CSS media query AND a Tailwind responsive class set font-size on the same element, creating specificity conflicts or double overrides.
**Why it happens:** Mixing Pattern A and Pattern B on the same element.
**How to avoid:** Use ONE mechanism per element. CSS media query for shared selectors (`.markdown-body`, `.active-message`), Tailwind for individual component classes.
**Warning signs:** Font size doesn't change on mobile, or changes to an unexpected value.

### Pitfall 4: CodeBlock Font-Size Inheritance Chain
**What goes wrong:** CodeBlock component uses `text-sm` Tailwind class, which may not respond to the mobile media query override on `.markdown-body`.
**Why it happens:** CodeBlock.tsx (lines 110, 121) uses `text-sm` directly. This is a Tailwind utility class, not a CSS custom property. The mobile override via media query on `.markdown-body code` may lose the specificity battle.
**How to avoid:** Ensure the mobile media query selector is specific enough: `.markdown-body pre code, .markdown-body [data-highlighted] code` to override `text-sm`.
**Warning signs:** Code blocks don't grow to 18px on mobile while surrounding text does grow to 15px.

### Pitfall 5: Regressing Touch Targets
**What goes wrong:** Typography changes accidentally remove `min-h-[44px]` or alter padding that maintains 44px touch targets.
**Why it happens:** Editing SessionItem or DateGroupHeader to fix font-size inadvertently modifies the class string.
**How to avoid:** Existing E2E test `touch-targets.spec.ts` catches this. Run after every change.
**Warning signs:** Touch target E2E tests fail.

## Code Examples

### Example 1: Typography Token Extension (tokens.css)

```css
/* ─── Typography Scale ────────────────────────────────────────────
 * Bold scale: 14->18->24->32. Greater dynamic range for visual authority.
 */
--text-xs: 0.75rem;      /* 12px - minimum readable, used for DateGroupHeader, badges */
--text-sm: 0.8125rem;    /* 13px - compact text, used for git panel, tool cards */
--text-code: 0.8125rem;  /* 13px - monospace code blocks desktop */
--text-body: 0.875rem;   /* 14px - body text (existing) */
--text-h3: 1.125rem;     /* 18px (existing) */
--text-h2: 1.5rem;       /* 24px (existing) */
--text-h1: 2rem;         /* 32px (existing) */
--font-ui: 'Inter Variable', 'Inter', ui-sans-serif, system-ui, sans-serif;
--font-serif: 'Instrument Serif', Georgia, serif;
--font-mono: 'JetBrains Mono Variable', 'JetBrains Mono', ui-monospace, monospace;
```

### Example 2: Mobile Typography Overrides (base.css)

```css
/* ─── Mobile Typography Overrides (TYPO-04, TYPO-07) ──────────── */
@media (max-width: 767px) {
  .markdown-body,
  .active-message {
    font-size: 0.9375rem;   /* 15px body text at mobile distance */
    line-height: 1.6;       /* TYPO-07: mobile reading comfort */
  }

  .markdown-body code,
  .markdown-body pre code,
  .markdown-body [data-highlighted],
  .active-message code,
  .active-message .streaming-code-block code {
    font-size: 1.125rem;    /* 18px code at mobile distance */
  }
}
```

### Example 3: DateGroupHeader Fix (TYPO-01)

```tsx
// Before:
'text-[length:0.6875rem] font-medium uppercase tracking-wider'

// After:
'text-[length:var(--text-xs)] font-medium uppercase tracking-wider'
// --text-xs resolves to 0.75rem (12px)
```

### Example 4: Command Palette Group Heading Fix (TYPO-01)

```css
/* Before: */
[cmdk-group-heading] {
  font-size: 11px;
}

/* After: */
[cmdk-group-heading] {
  font-size: var(--text-xs); /* 12px minimum */
}
```

### Example 5: Composer Status Bar Fix (TYPO-01/TYPO-08)

```css
/* Before: */
.composer-status-bar {
  font-size: 0.6875rem;
}

/* After: */
.composer-status-bar {
  font-size: var(--text-xs); /* 12px minimum */
}
```

## Current State Audit

### Sub-12px Font Sizes Found (TYPO-01 violations)

| File | Line | Current | Target | Fix |
|------|------|---------|--------|-----|
| `DateGroupHeader.tsx` | 23 | `0.6875rem` (11px) | `var(--text-xs)` (12px) | Tailwind class change |
| `composer.css` | 192 | `0.6875rem` (11px) | `var(--text-xs)` (12px) | CSS token replacement |
| `command-palette.css` | 86 | `11px` | `var(--text-xs)` (12px) | CSS token replacement |
| `CollapsibleMessage.tsx` | 76 | `text-[10px]` (10px) | Keep -- badge/pill (D-17 exclusion) | No change |
| `ComposerStatusBar.tsx` | 176 | `text-[10px]` (10px) | Review -- permission description in popover | May need mobile 12px floor |
| `TabBar.tsx` | 110 | `text-[10px]` (10px) | Keep -- keyboard shortcut hint (desktop-only, `lg:` guard) | No change |
| `TokenPreview.tsx` (dev) | 70+ | `text-[10px]` (10px) | Keep -- dev-only component | No change |

### Undefined CSS Tokens (latent bugs)

| Token | Referenced In | Occurrences | Browser Fallback |
|-------|--------------|-------------|------------------|
| `--text-code` | `streaming-markdown.css` | 2 | `initial` (~16px) |
| `--text-sm` | `git-panel.css` | 10 | `initial` (~16px) |
| `--text-xs` | `git-panel.css` | 14 | `initial` (~16px) |

### Intentional line-height: 1 (DO NOT CHANGE)

| File | Line | Element | Reason |
|------|------|---------|--------|
| `tool-card-shell.css` | 49 | Status text | Compact icon alignment |
| `thinking-disclosure.css` | 45 | Arrow indicator | Toggle arrow sizing |
| `scroll-pill.css` | 28 | Scroll pill | Compact floating pill |
| `tool-chip.css` | 77 | Inline status | Compact chip text |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 + Playwright 1.58.2 |
| Config file | `src/vitest.config.ts` / `src/playwright.config.ts` |
| Quick run command | `cd src && npx vitest run src/src/styles/tokens.test.ts` |
| Full suite command | `cd src && npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TYPO-01 | No font < 12px | unit + e2e | `cd src && npx vitest run src/src/styles/tokens.test.ts` + Playwright | Tokens: yes, E2E: Wave 0 |
| TYPO-02 | ThinkingDisclosure >= 14px mobile | e2e | Playwright mobile viewport check | Wave 0 |
| TYPO-03 | Session title single-line truncation | e2e | Playwright mobile viewport check | Wave 0 |
| TYPO-04 | 15px body, 18px code mobile | e2e | Playwright getComputedStyle at 375px | Wave 0 |
| TYPO-05 | Session list density py-2 | unit | `cd src && npx vitest run src/src/components/sidebar/SessionItem.test.tsx` | yes (class check) |
| TYPO-06 | Action labels >= 14px mobile | e2e | Playwright modal font-size audit | Wave 0 |
| TYPO-07 | line-height >= 1.6 body mobile | e2e | Playwright getComputedStyle | Wave 0 |
| TYPO-08 | Keyboard no font shrink | manual-only | Real device test (iOS keyboard) | Manual |

### Sampling Rate
- **Per task commit:** `cd src && npx vitest run src/src/styles/tokens.test.ts`
- **Per wave merge:** `cd src && npx vitest run && cd src && npx playwright test e2e/touch-targets.spec.ts`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/e2e/typography.spec.ts` -- covers TYPO-01 through TYPO-07: mobile viewport font-size and line-height assertions
- [ ] Update `src/src/styles/tokens.test.ts` -- add `--text-xs`, `--text-sm`, `--text-code` to required properties list
- [ ] TYPO-08 is manual-only (real iOS device keyboard test)

## Open Questions

1. **ComposerStatusBar `text-[10px]` permission descriptions**
   - What we know: D-17 excludes "decorative or metadata text" from the 14px minimum, but permission descriptions in a popover are arguably action-context text
   - What's unclear: Whether this popover text is visible enough at 10px on mobile
   - Recommendation: Change to `text-[length:var(--text-xs)]` (12px) on mobile only. The popover is interactive context, not decorative.

2. **git-panel.css token resolution impact**
   - What we know: Defining `--text-sm: 0.8125rem` and `--text-xs: 0.75rem` will change git panel rendering from browser-default `initial` to the defined values
   - What's unclear: Whether the current browser-default rendering (likely 16px) is being relied upon visually
   - Recommendation: Define the tokens. The git panel was always intended to use these smaller sizes. Verify visually after the change.

3. **Streaming code lang label at 0.75rem**
   - What we know: `streaming-markdown.css:27` has `.active-message .streaming-code-lang { font-size: 0.75rem }` -- this is 12px, which meets TYPO-01
   - What's unclear: Whether this should use `var(--text-xs)` for token consistency
   - Recommendation: Replace with `var(--text-xs)` for consistency. Same effective size.

## Sources

### Primary (HIGH confidence)
- Direct codebase audit of all CSS files for font-size and line-height declarations
- `tokens.css` -- verified missing token definitions
- `streaming-markdown.css` -- confirmed `var(--text-code)` references to undefined token
- `git-panel.css` -- confirmed 24 references to undefined `--text-sm` and `--text-xs` tokens
- Phase 65 CONTEXT.md -- established mobile breakpoint and `md:` revert patterns
- V2_CONSTITUTION.md Section 13 -- touch target and focus standards to preserve

### Secondary (MEDIUM confidence)
- Tailwind v4 documentation for `leading-relaxed` (1.625 line-height) -- verified via project usage
- CSS custom property scoping in media queries -- well-established CSS standard

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all tools are already in the project, no new dependencies
- Architecture: HIGH - extends existing token system with same patterns, all files audited
- Pitfalls: HIGH - derived from actual codebase audit, especially the undefined token bug and streaming/finalized mismatch risk

**Research date:** 2026-03-29
**Valid until:** 2026-04-28 (stable -- CSS tokens and Tailwind v4 patterns are mature)
