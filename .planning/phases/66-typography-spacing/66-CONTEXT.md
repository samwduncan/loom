# Phase 66: Typography & Spacing - Context

**Gathered:** 2026-03-29
**Status:** Ready for planning
**Mode:** Auto-resolved (requirements have specific pixel targets, Bard-Prime consulted)

<domain>
## Phase Boundary

Text is comfortable to read at mobile viewing distance -- font sizes, line heights, and spacing optimized for iPhone density. This phase fixes 8 typography/spacing requirements (TYPO-01 through TYPO-08): minimum font sizes, mobile-specific body/code text sizing, session list density, line-height enforcement, and keyboard stability.

**This phase does NOT change component behavior** -- only typography sizing, spacing, and line-height.
**This phase does NOT affect desktop layout** -- all sizing changes are mobile-only (< 768px), desktop retains current compact values via `md:` revert pattern from Phase 65.

</domain>

<decisions>
## Implementation Decisions

### Mobile Font Sizing Mechanism
- **D-01:** Use a dual approach: (1) CSS custom property overrides via `@media (max-width: 767px)` in `tokens.css` for global token adjustments, (2) Tailwind responsive classes for component-level overrides. This follows the Phase 65 pattern (`min-h-[44px] md:min-h-0`) where mobile is the special case.
- **D-02:** No CSS `clamp()` for font sizes -- mobile and desktop have distinct fixed sizes, not fluid scaling. The viewing distance difference (arm's length mobile vs desk distance desktop) warrants a clean breakpoint split, not gradual scaling.

### Typography Token System Extension
- **D-03:** Add missing tokens to `tokens.css`: `--text-xs: 0.75rem` (12px), `--text-sm: 0.8125rem` (13px), `--text-code: 0.8125rem` (13px desktop). These replace the ~15 hardcoded `font-size` values scattered across CSS files.
- **D-04:** Add mobile-override tokens: `--text-body-mobile: 0.9375rem` (15px), `--text-code-mobile: 1.125rem` (18px). Applied via media query in `tokens.css`.
- **D-05:** Refactor existing hardcoded `font-size` values to use new tokens where practical. Not a full sweep of every file (that risks regressions), but the main violations (DateGroupHeader, composer token count, command palette shortcut, thinking disclosure) must use tokens.
- **D-06:** Bard flagged that `--text-code` doesn't exist. Confirmed -- code block font-size is currently `var(--text-code)` in streaming-markdown.css but the token is undefined. This is a latent bug (falls back to browser default). Fix by defining it.

### Specific Requirement Decisions

#### TYPO-01: DateGroupHeader Font Size
- **D-07:** Change from `0.6875rem` (11px) to `0.75rem` (12px) minimum. The requirement specifies 12px. The uppercase + tracking-wider styling improves glanceability at 12px.
- **D-08:** Also fix the composer token count (0.6875rem in `composer.css:192`) and command palette shortcut text (11px in `command-palette.css:86`) -- these are the same sub-12px violation pattern.

#### TYPO-02: ThinkingDisclosure Trigger Text
- **D-09:** Current CSS shows `font-size: 0.875rem` (14px) in `thinking-disclosure.css:28`. This may already pass. **Verify before fixing** -- if already 14px, no change needed. If streaming mode overrides it, apply mobile floor.

#### TYPO-03: Session Title Truncation
- **D-10:** SessionItem already uses `truncate` class (confirmed in code). **Verify this works on mobile viewport** -- if already single-line with ellipsis, no change needed. If multi-line wrapping occurs on narrow sidebar, ensure `line-clamp-1` or `truncate` is applied at mobile breakpoint.

#### TYPO-04: Chat Message Typography
- **D-11:** Mobile chat body text: 15px (0.9375rem) as specified by requirement. Desktop stays at current 14px (0.875rem / `text-sm`). Apply via mobile media query on `.markdown-body` and `.active-message`.
- **D-12:** Mobile code blocks: 18px (1.125rem) monospace as specified. Desktop stays at current `--text-code`. Apply via mobile media query on code block selectors.
- **D-13:** Streaming markdown CSS (`streaming-markdown.css`) must mirror the mobile overrides to prevent visual jank during streaming->finalized transition. Both phases must render at the same font size.

#### TYPO-05: Sidebar Session List Density
- **D-14:** SessionItem already uses `px-3 py-2` (line 160). The 44px `min-h-[44px]` from Phase 65 + `py-2` centering works fine for single-line text -- no actual conflict despite Bard's concern. A 44px row with 8px top + 8px bottom padding leaves 28px for text, which fits 14px @ 1.6 line-height (~22px).
- **D-15:** DateGroupHeader currently uses `py-1.5` (6px). TYPO-05 asks for "4px gaps between groups" -- this means the gap between the header and first item, which is currently default flex gap. Adjust if needed, but don't over-compress.

#### TYPO-06: Action Label Minimum Size
- **D-16:** Audit modal buttons, form labels, and secondary text for sub-14px font sizes on mobile. Components using the shadcn Button primitive already render at 14px. Custom text (tooltips, badges, helper text) may need individual fixes.
- **D-17:** Scope: buttons in modals (Settings, CommandPalette), form labels, action confirmation text. Does NOT include decorative or metadata text (timestamps, counts) which may stay at 12px.

#### TYPO-07: Line-Height Minimum
- **D-18:** Apply `line-height: 1.6` to body/reading text on mobile only: chat messages (`.markdown-body`, `.active-message`), session descriptions. Current `leading-relaxed` (Tailwind = 1.625) already meets this for markdown body.
- **D-19:** Do NOT apply 1.6 globally. Headings, labels, badges, pills, and single-line UI elements keep 1.4-1.5 as appropriate. Global 1.6 wastes space on compact UI elements (scroll pills, tool chips, status badges).
- **D-20:** Audit current `line-height` values: several CSS files set line-height to 1.0 or 1.4 (tool-card-shell, thinking-disclosure arrow, scroll pill). These are intentional for compact UI and should NOT change.

#### TYPO-08: Keyboard Stability
- **D-21:** The `useKeyboardOffset` hook adjusts `--keyboard-offset` CSS variable when keyboard opens, which shifts the composer up. No current mechanism should shrink font sizes. **Verify on real device before committing to a fix** -- if text doesn't shrink/jump, this is already passing.
- **D-22:** If the token count label (0.6875rem) becomes unreadable when keyboard opens due to viewport shrink, fixing it to 12px (D-08) solves this too.

### Convention Formalization
- **D-23:** Add a Typography section (Section 14) to V2_CONSTITUTION.md documenting:
  - Minimum 12px font size on mobile for any text element
  - Token usage requirement: all font-sizes must use design tokens (no hardcoded rem/px values)
  - Mobile body text token pattern
  - Line-height minimums (1.6 body, 1.4 labels/headings)

### Claude's Discretion
- Per-component implementation details (which Tailwind classes vs CSS rules)
- Exact refactoring scope for hardcoded font-size consolidation (pragmatic, not comprehensive)
- Whether to batch all TYPO fixes in one plan or split into typography + spacing plans
- Testing strategy for TYPO-02/TYPO-03/TYPO-08 (verify-first items)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` TYPO section -- TYPO-01 through TYPO-08 acceptance criteria with specific CSS classes and pixel measurements

### Coding Conventions
- `.planning/V2_CONSTITUTION.md` -- Existing conventions (will be updated with typography section in this phase)
- `.planning/V2_CONSTITUTION.md` Section 13 -- Touch Target & Focus Standards (Phase 65, must not regress)

### Source Files (Typography Violations)
- `src/src/components/sidebar/DateGroupHeader.tsx` -- TYPO-01: `text-[length:0.6875rem]` (11px)
- `src/src/components/chat/styles/thinking-disclosure.css` -- TYPO-02: verify 0.875rem (14px), lines 28 and 44
- `src/src/components/sidebar/SessionItem.tsx` -- TYPO-03: verify `truncate` works on mobile
- `src/src/components/chat/view/MessageContainer.tsx` -- TYPO-04: `text-[length:var(--text-body)]`
- `src/src/components/chat/view/MarkdownRenderer.tsx` -- TYPO-04: `text-sm leading-relaxed`
- `src/src/components/chat/view/AssistantMessage.tsx` -- TYPO-04: `text-sm leading-relaxed`
- `src/src/components/chat/styles/streaming-markdown.css` -- TYPO-04: code block font-sizes, must mirror finalized
- `src/src/components/sidebar/SessionItem.tsx` -- TYPO-05: `px-3 py-2`, already has min-h-[44px]
- `src/src/components/sidebar/DateGroupHeader.tsx` -- TYPO-05: `py-1.5`, gap spacing
- `src/src/components/chat/composer/composer.css` -- TYPO-01/TYPO-08: token count at 0.6875rem (line 192)
- `src/src/components/command-palette/command-palette.css` -- TYPO-01: shortcut text 11px (line 86)

### Token System
- `src/src/styles/tokens.css` -- Typography scale (lines 131-141), missing --text-code/--text-sm/--text-xs
- `src/src/styles/base.css` -- Body font-size 0.875rem (line 56), line-height 1.5 (line 57)

### Prior Phase Context
- `.planning/phases/65-touch-target-compliance/65-CONTEXT.md` -- D-01 through D-12: 44px touch target pattern, focus rings, mobile breakpoint strategy
- `.planning/phases/64-scroll-performance/64-CONTEXT.md` -- Scroll container decisions (no content-visibility, overflow-x hidden)

### Keyboard Handling
- `src/src/hooks/useKeyboardOffset.ts` -- Keyboard avoidance hook (TYPO-08 verification)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Design token system** (`tokens.css`): Typography scale exists but incomplete (--text-body, --text-h1/h2/h3 only). Missing --text-code, --text-sm, --text-xs. Extending is natural.
- **Tailwind `leading-relaxed`**: Already used on MarkdownRenderer (line-height: 1.625). Meets TYPO-07 for markdown body.
- **`md:` breakpoint pattern**: Established in Phase 65 for mobile-only overrides. Reuse for font-size mobile overrides.
- **`cn()` utility**: Used throughout for conditional class merging.

### Established Patterns
- Mobile breakpoint: `md:` (768px) — below is mobile, above is desktop
- Body font: 14px (0.875rem) set in `base.css`, inherited by all components
- Token convention: `var(--token-name)` in CSS, `text-[length:var(--token)]` in Tailwind
- `text-sm` Tailwind class used interchangeably with `var(--text-body)` for 14px — should standardize

### Integration Points
- `tokens.css` receives new typography tokens
- `base.css` receives mobile media query for body font-size/line-height
- `streaming-markdown.css` must mirror MarkdownRenderer mobile overrides
- V2_CONSTITUTION.md receives new Section 14 (Typography)
- Playwright test infrastructure for optional regression test

### Typography Audit Findings (from codebase scout)
Sub-12px font sizes found:
- `DateGroupHeader.tsx`: 0.6875rem (11px)
- `composer.css:192`: 0.6875rem (11px) -- token count
- `command-palette.css:86`: 11px -- shortcut hints
- `CollapsibleMessage.tsx:76`: `text-[10px]` -- collapse count badge (acceptable for badge)
- `ComposerStatusBar.tsx:176`: `text-[10px]` -- permission description (needs review)

Line-height violations (below 1.4):
- `tool-card-shell.css:49`: line-height: 1 (intentional for icon alignment)
- `thinking-disclosure.css:45`: line-height: 1 (intentional for toggle arrow)
- `scroll-pill.css:28`: line-height: 1 (intentional for pill)
- `tool-chip.css:77`: line-height: 1 (intentional for chip)

</code_context>

<specifics>
## Specific Ideas

No specific requirements -- the TYPO-01 through TYPO-08 acceptance criteria provide exact pixel targets and CSS classes. Follow the Phase 65 pattern of mobile-only overrides with desktop revert.

</specifics>

<quality_bar>
## Quality Bar (Bard Assessment)

**Good:** Fix all 8 TYPO requirements, verify on device, ship.

**Exceptional:**
- Create complete `--text-*` token system (--text-xs, --text-sm, --text-code, --text-body-mobile) so hardcoded font-sizes are eliminated
- Refactor scattered hardcoded `font-size` values to use tokens -- prevents future regressions
- Add Section 14 to V2_CONSTITUTION.md with typography conventions
- Verify TYPO-02, TYPO-03, TYPO-08 on real device before building fixes (some may already pass)
- Streaming markdown CSS mirrors finalized markdown font sizes -- no visual jank on transition
- Test on iPhone 16 Pro Max at both portrait and landscape orientations
- Regression test: Playwright checks `getComputedStyle().fontSize >= 12px` on all visible text elements at mobile viewport
- Audit every `text-[10px]` usage (2 found) and determine if acceptable or violation

**Risk flags from Bard:**
- Streaming markdown has independent font-sizes -- MUST be updated to match finalized markdown or users see size jump during stream completion
- `--text-code` token is referenced in streaming-markdown.css but UNDEFINED in tokens.css -- this is a latent bug regardless of this phase
- 18px code blocks on mobile will consume significant viewport width -- may force more horizontal scrolling of code. Acceptable tradeoff per requirement but worth noting.

</quality_bar>

<deferred>
## Deferred Ideas

- **Comprehensive font-size audit**: Full sweep of every hardcoded font-size to tokens. This phase fixes the main violations; a comprehensive sweep could be a polish task.
- **Fluid typography via clamp()**: Not needed for mobile/desktop binary split, but could be useful for tablet intermediate sizes in future.
- **Dark mode contrast audit**: VISUAL-08 (Phase 68) covers contrast compliance. Don't duplicate effort here.

None -- analysis stayed within phase scope.

</deferred>

---

*Phase: 66-typography-spacing*
*Context gathered: 2026-03-29*
