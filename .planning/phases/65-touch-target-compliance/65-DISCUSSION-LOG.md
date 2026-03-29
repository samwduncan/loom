# Phase 65: Touch Target Compliance - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md -- this log preserves the alternatives considered.

**Date:** 2026-03-29
**Phase:** 65-touch-target-compliance
**Areas discussed:** Sizing approach, Desktop behavior, Focus ring scope, Convention formalization, Automated testing, Sidebar audit depth

---

## Sizing Approach

| Option | Description | Selected |
|--------|-------------|----------|
| Grow everything | All 7 targets visually grow to 44px on mobile. Simpler, consistent, no pseudo-element tricks. Empty state and banner just get a bit taller. | ✓ |
| Invisible hit areas for sensitive ones | ThinkingDisclosure/ToolCardShell/ProjectHeader grow visually. ChatEmptyState pills and LiveSessionBanner detach use before:: pseudo-element. More complex but preserves exact current layout. | |
| You decide | Claude picks per-component based on what looks best during implementation. | |

**User's choice:** Grow everything
**Notes:** Simplicity wins. Density-sensitive areas (empty state, banner) aren't content-dense enough to warrant invisible hit area complexity.

---

## Desktop Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Mobile-only | Apply min-h-[44px] md:min-h-0 consistently. Desktop reverts to compact natural sizing. Matches SessionItem precedent. | ✓ |
| Universal 44px | 44px on all breakpoints. Simpler but desktop sidebar feels bloated. | |
| Mobile + tablet, desktop compact | 44px up to lg: breakpoint (1024px), revert above. More breakpoint complexity. | |

**User's choice:** Mobile-only
**Notes:** Follows established SessionItem pattern. Desktop compact density preserved.

---

## Focus Ring Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Fix the 7 targets only | Add focus-visible:ring-[3px] to the 7 TOUCH components. Other custom components keep current inconsistent styles. | |
| Sweep all custom interactive | Audit all custom interactive components and standardize on shadcn ring-[3px] pattern. Includes TerminalHeader buttons, TokenUsage, etc. One pass, done right. | ✓ |
| You decide | Claude decides per-component during implementation. | |

**User's choice:** Sweep all custom interactive
**Notes:** Do it once, do it right. Prevents patchwork focus ring styles.

---

## Convention Formalization

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, add convention | Add section to V2_CONSTITUTION.md covering 44px rule, md:min-h-0 revert, focus ring standard, pattern reference. | ✓ |
| No, just fix the code | Trust developers to see the pattern in SessionItem. | |
| You decide | Claude decides based on how many patterns get established. | |

**User's choice:** Yes, add convention
**Notes:** Prevents regressions. Future phases reference this convention.

---

## Automated Testing

| Option | Description | Selected |
|--------|-------------|----------|
| Playwright audit test | Mobile viewport, query all interactive elements, assert height >= 44. Fails CI on violations. | ✓ |
| Unit tests only | Vitest tests checking CSS classes. Faster but doesn't catch rendered pixel sizes. | |
| Manual verification only | Safari DevTools on iPhone. No automated regression guard. | |

**User's choice:** Playwright audit test
**Notes:** Regression prevention at the CI level.

---

## Sidebar Audit Depth

| Option | Description | Selected |
|--------|-------------|----------|
| Full sweep | Audit every interactive sidebar element. Verify Button/Input primitives, fix custom elements. Playwright test catches anything missed. | ✓ |
| Just the named targets | Only fix what TOUCH-03 and TOUCH-06 explicitly name. Trust primitives are compliant. | |
| You decide | Claude audits during implementation, fixes what's non-compliant. | |

**User's choice:** Full sweep
**Notes:** Comprehensive audit ensures nothing slips through.

---

## Claude's Discretion

- Per-component padding values and implementation details
- Playwright test file location and query selector strategy
- Exact V2_CONSTITUTION.md section wording
- Plan structure (single plan or split)

## Deferred Ideas

None -- discussion stayed within phase scope.
