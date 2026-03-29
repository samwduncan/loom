# Phase 66: Typography & Spacing - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md -- this log preserves the alternatives considered.

**Date:** 2026-03-29
**Phase:** 66-typography-spacing
**Areas discussed:** Mobile font sizing mechanism, Token system extension, Sidebar density strategy, Line-height scope
**Mode:** Auto (`--auto` flag)

---

## Mobile Font Sizing Mechanism

| Option | Description | Selected |
|--------|-------------|----------|
| CSS tokens + media query | Mobile-responsive tokens in tokens.css with Tailwind classes for component-level | ✓ |
| CSS clamp() | Fluid typography that scales between mobile and desktop | |
| Tailwind-only responsive classes | All sizing via Tailwind responsive prefixes, no token changes | |

**User's choice:** [auto] CSS tokens + media query (recommended default)
**Notes:** Follows Phase 65 pattern. Clean breakpoint split is better than fluid scaling for distinct viewing distances.

---

## Token System Extension

| Option | Description | Selected |
|--------|-------------|----------|
| Add missing tokens | Define --text-xs, --text-sm, --text-code, --text-body-mobile in tokens.css | ✓ |
| Keep hardcoded values | Fix violations individually without token system changes | |
| Full Tailwind standardization | Remove all CSS custom property font-sizes, use only Tailwind classes | |

**User's choice:** [auto] Add missing tokens (recommended default)
**Notes:** 15+ hardcoded font-size values found. Token system prevents future regressions. Bard strongly recommended this approach.

---

## Sidebar Density Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| No conflict -- keep both | 44px min-height + py-2 centering works for single-line text | ✓ |
| Prioritize density | Remove min-h-[44px] on sidebar items, use py-2 only | |
| Prioritize touch targets | Keep 44px, accept larger gaps, skip py-2 changes | |

**User's choice:** [auto] No conflict (recommended default)
**Notes:** Verified: SessionItem already uses py-2. 44px row with 8px+8px padding leaves 28px for text = fits 14px @ 1.6 line-height. Bard flagged potential conflict but math checks out.

---

## Line-Height Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Body text only (1.6) | Apply 1.6 to chat messages and reading text; labels/headings keep 1.4-1.5 | ✓ |
| Global 1.6 minimum | Apply 1.6 to everything on mobile | |
| Keep current (1.5) | Don't change line-heights, focus on font-sizes only | |

**User's choice:** [auto] Body text only (recommended default)
**Notes:** Bard recommended conditional approach. Global 1.6 wastes space on compact UI elements. Several intentional line-height:1 values in tool chips, scroll pills, etc.

---

## Claude's Discretion

- Per-component Tailwind vs CSS implementation details
- Exact scope of hardcoded font-size refactoring
- Plan splitting strategy (one plan vs two)
- Verify-before-fix approach for TYPO-02, TYPO-03, TYPO-08

## Deferred Ideas

None -- all discussion stayed within phase scope.

## Bard-Prime Consultation Summary

Bard reviewed the phase and provided:
- Confirmed TYPO-02 (14px) and TYPO-03 (truncation) may already pass -- recommended verify-first approach
- Flagged --text-code token as undefined but referenced (latent bug)
- Flagged streaming markdown font-sizes must mirror finalized markdown
- Recommended token system consolidation as the exceptional path
- Disagreed with 15px body text (preferred 16px) but requirement is specific -- following requirement
- Recommended 1.6 line-height only for body text, not global
