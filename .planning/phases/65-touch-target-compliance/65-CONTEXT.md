# Phase 65: Touch Target Compliance - Context

**Gathered:** 2026-03-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Every interactive element in Loom meets Apple's 44px minimum touch target on mobile. Users can reliably tap any button or control on iPhone without missing. This phase fixes 7 specific violations (TOUCH-01 through TOUCH-07), standardizes focus rings across all custom interactive components, adds a Playwright regression test, and formalizes the touch-target convention in V2_CONSTITUTION.md.

**This phase does NOT change component behavior** -- only sizing, focus treatment, and test coverage.
**This phase does NOT affect desktop layout** -- all 44px sizing is mobile-only (< 768px), desktop reverts to compact natural sizing.

</domain>

<decisions>
## Implementation Decisions

### Sizing Strategy (TOUCH-01 through TOUCH-06)
- **D-01:** All 7 target components visually grow to 44px on mobile. No invisible hit area extensions via pseudo-elements. Simpler, consistent, and the affected areas (empty state, banner) aren't content-dense enough to warrant preserving compact sizing.
- **D-02:** Use `min-h-[44px]` (Tailwind class) as the primary mechanism. Padding adjustments as secondary/alternative where min-height doesn't fit the flex layout.

### Desktop Behavior
- **D-03:** Mobile-only touch targets. Every 44px `min-height` MUST be paired with `md:min-h-0` to revert on desktop (>= 768px). This follows the established SessionItem pattern (`min-h-[44px] md:min-h-0`). Desktop users keep compact density.
- **D-04:** No tablet-specific breakpoint. The md: (768px) breakpoint covers iPad portrait naturally. iPad landscape users get desktop-compact treatment, which is fine for stylus/keyboard use.

### Focus Ring Standardization (TOUCH-07 + sweep)
- **D-05:** Standardize ALL custom interactive components on the shadcn focus pattern: `focus-visible:ring-[3px] focus-visible:ring-ring/50`. This goes beyond just the 7 TOUCH targets -- sweep every custom button, trigger, and clickable element.
- **D-06:** Remove non-standard focus styles (e.g., custom `box-shadow: 0 0 0 2px` on ToolCardShell) and replace with the Tailwind ring utility.
- **D-07:** Components using the Button primitive (`ui/button.tsx`) already have the correct focus ring. Only custom interactive elements (divs with onClick, custom buttons) need fixing.

### Sidebar Audit (TOUCH-06)
- **D-08:** Full sweep of every interactive sidebar element, not just the explicitly named targets. Includes BulkActionBar action buttons, QuickSettingsPanel triggers/controls, and any other clickable elements. If it uses Button/Input primitive, verify compliance; if custom, fix.
- **D-09:** SessionItem already compliant (`min-h-[44px] md:min-h-0`). ProjectHeader covered by TOUCH-03. Remaining sidebar elements to audit: NewChatButton, SearchInput, BulkActionBar, QuickSettingsPanel, SessionContextMenu items.

### Convention Formalization
- **D-10:** Add a touch-target convention section to `.planning/V2_CONSTITUTION.md` covering:
  - 44px mobile min-height rule with `md:min-h-0` desktop revert
  - Focus ring standard: `focus-visible:ring-[3px] focus-visible:ring-ring/50`
  - Pattern reference for new components
  This prevents regressions -- future phases reference this convention.

### Automated Testing
- **D-11:** Add a Playwright touch-target audit test that sets mobile viewport (375px), queries all interactive elements (buttons, links, clickable elements), and asserts `getBoundingClientRect().height >= 44`. Fails CI if any violation ships.
- **D-12:** Test runs in existing Playwright setup alongside other e2e tests.

### Claude's Discretion
- Per-component implementation details (which specific padding values, whether to use min-h or padding)
- Playwright test file location and query selector strategy
- Exact wording of V2_CONSTITUTION.md convention section
- Whether to batch all 7 fixes in one plan or split across plans

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` TOUCH section -- TOUCH-01 through TOUCH-07 acceptance criteria with specific CSS classes and pixel measurements

### Coding Conventions
- `.planning/V2_CONSTITUTION.md` -- Existing conventions (will be updated with touch-target section in this phase)

### Source Files (Violations to Fix)
- `src/src/components/chat/view/ThinkingDisclosure.tsx` -- TOUCH-01: trigger button, ~20px, no min-height
- `src/src/components/chat/tools/ToolCardShell.tsx` -- TOUCH-02: header, 32px effective, line 57 `tool-card-shell-header`
- `src/src/components/sidebar/ProjectHeader.tsx` -- TOUCH-03: `px-3 py-2` (~40px)
- `src/src/components/chat/view/ChatEmptyState.tsx` -- TOUCH-04: template pills `px-3 py-1.5` (32px)
- `src/src/components/chat/view/LiveSessionBanner.tsx` -- TOUCH-05: detach button `px-2 py-0.5` (24px)
- `src/src/components/sidebar/SessionItem.tsx` -- TOUCH-06: already compliant (reference pattern)
- `src/src/components/sidebar/BulkActionBar.tsx` -- TOUCH-06: audit target
- `src/src/components/sidebar/QuickSettingsPanel.tsx` -- TOUCH-06: audit target
- `src/src/components/sidebar/NewChatButton.tsx` -- TOUCH-06: audit target (likely uses Button primitive)
- `src/src/components/sidebar/SearchInput.tsx` -- TOUCH-06: audit target (likely uses Input primitive)

### Focus Ring Sweep Targets (beyond TOUCH-07)
- `src/src/components/chat/tools/ToolChip.tsx` -- ToolCardShell consumer
- `src/src/components/terminal/TerminalHeader.tsx` -- custom focus-visible:ring-2 (non-standard width)
- `src/src/components/chat/view/TokenUsage.tsx` -- custom focus-visible:ring-2
- `src/src/components/ui/button.tsx` -- Reference implementation for correct focus ring pattern

### Prior Phase Context
- `.planning/phases/64-scroll-performance/64-CONTEXT.md` -- content-visibility removed, overflow-x: hidden on message list

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **SessionItem pattern**: `min-h-[44px] md:min-h-0` -- THE established mobile touch target pattern. All fixes should follow this.
- **Button primitive** (`ui/button.tsx`): Already has correct focus ring: `focus-visible:ring-[3px] focus-visible:ring-ring/50`. Reference for sweep.
- **Tailwind v4 utilities**: `min-h-[44px]`, `md:min-h-0`, `focus-visible:ring-[3px]` all available.

### Established Patterns
- Mobile breakpoint: `md:` (768px) for responsive behavior
- Focus ring: `focus-visible:ring-[3px] focus-visible:ring-ring/50` on shadcn primitives
- Class merging: `cn()` utility for conditional class application
- Passive event listeners throughout (no touch target JS needed)

### Integration Points
- Playwright e2e test infrastructure in `src/e2e/` directory
- V2_CONSTITUTION.md for convention documentation
- No new dependencies needed -- pure CSS/Tailwind changes

</code_context>

<specifics>
## Specific Ideas

No specific requirements -- the TOUCH-01 through TOUCH-07 acceptance criteria provide exact CSS classes and measurement methods. Follow the SessionItem pattern for consistency.

</specifics>

<quality_bar>
## Quality Bar (Bard Assessment)

**Good:** All 7 violations fixed, 44px minimum on mobile, focus rings visible on targets.

**Exceptional:**
- Documented touch sizing convention in V2_CONSTITUTION.md prevents regression in future phases
- Playwright automated audit test catches violations before they ship -- not just a one-time fix
- Full focus ring sweep across ALL custom interactive components, not just the 7 targets
- Consistent `md:min-h-0` desktop revert on every component -- no desktop density regression
- Before/after documentation: components modified, classes changed, tests added

**Risk flags from Bard:**
- LiveSessionBanner detach is the messiest fix -- button is inside a compact banner, growing it to 44px forces the banner taller. Acceptable per D-01 but verify it doesn't look awkward.
- Don't apply both `min-height` AND extra padding on the same component (double-padding trap). Use one mechanism per component.
- Verify hover targets on desktop after revert -- `md:min-h-0` should restore compact hover areas.

</quality_bar>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope.

</deferred>

---

*Phase: 65-touch-target-compliance*
*Context gathered: 2026-03-29*
