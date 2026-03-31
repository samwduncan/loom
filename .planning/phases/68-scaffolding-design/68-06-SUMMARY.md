---
phase: 68-scaffolding-design
plan: 06
subsystem: design
tags: [soul-doc, ios, react-native, spring-physics, design-system, visual-contract, nativewind]

# Dependency graph
requires:
  - phase: 68-scaffolding-design
    provides: "NATIVE-APP-SOUL-DRAFT.md (Bard's creative direction), 68-UI-SPEC.md baseline tokens"
provides:
  - "NATIVE-APP-SOUL.md: Authoritative visual contract for native iOS app (v3.0 Phases 69-73)"
  - "626-line design specification covering all 12 v3.0 screens"
  - "6-category spring physics system with exact damping/stiffness/mass values"
  - "4-tier surface depth hierarchy + glass layer + 4 shadow specifications"
  - "Dynamic color system tied to 6 conversation states"
  - "15 anti-patterns as enforceable quality checklist"
  - "5 elevation examples with complete motion/haptic/color sequences"
  - "Reference app comparison table (ChatGPT iOS vs Claude iOS vs Loom)"
  - "Typography overrides: Large Title (28px bold) and Subheading (13px regular)"
  - "Icon direction: SF Symbols primary, Lucide fallback"
affects: [phase-69, phase-70, phase-71, phase-72, phase-73]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Soul doc as authoritative visual contract for multi-phase execution"
    - "Elevation layer: Motion (6 spring categories) + Depth (4 tiers + glass) + Dynamic Color (6 states)"
    - "Anti-pattern checklist: 15 prohibitions (5 structural + 5 visual + 5 interaction)"
    - "Screen specification format: Layout, Components, Motion, Color per screen"

key-files:
  created:
    - ".planning/NATIVE-APP-SOUL.md"
  modified: []

key-decisions:
  - "Soul doc placed at .planning/ root (not phase dir) as living document for Phases 69-73"
  - "No color overrides from UI-SPEC baseline -- dusty rose accent and warm charcoal surfaces confirmed correct"
  - "Typography: Bold (700) permitted ONLY for Large Title (28px). All else: Regular (400) or Semibold (600)"
  - "SF Symbols primary for system UI, Lucide fallback for Loom-specific icons"
  - "Accent Glow shadow added to reserved-for list (send button, connection indicator)"
  - "User messages in bubbles, assistant messages free-flowing (matching both reference apps)"

patterns-established:
  - "Design gate pattern: Phase 69 cannot start until Soul doc is approved"
  - "Screen spec format: Layout / Components / Motion / Color sections per screen"
  - "Elevation examples as acceptance criteria: exact sequences for key interactions"

requirements-completed: []

# Metrics
duration: 5min
completed: 2026-03-31
---

# Phase 68 Plan 06: Native App Soul Formalization Summary

**626-line authoritative visual contract formalizing Bard's creative direction into NATIVE-APP-SOUL.md with 12 screen specs, 6 spring categories, 4-tier depth system, dynamic color, and 15 anti-patterns**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-31T14:35:57Z
- **Completed:** 2026-03-31T14:41:04Z
- **Tasks:** 1 auto + 1 checkpoint (auto-approved)
- **Files modified:** 1

## Accomplishments
- Formalized Bard's 678-line NATIVE-APP-SOUL-DRAFT.md into the official 626-line NATIVE-APP-SOUL.md at .planning/ root
- Structured the document with clear hierarchy: North Star, 5 Design Principles, Elevation Layer (Motion/Depth/Dynamic Color), 12 Screen Specifications, Typography/Color/Spacing overrides, 15 Anti-Patterns, Reference App Comparison, 5 Elevation Examples
- Every screen spec includes Layout, Components, Motion, and Color subsections with specific pixel values, spring configs, and timing
- Document is concrete and actionable: an executor can build any screen from the spec without ambiguity

## Task Commits

Each task was committed atomically:

1. **Task 1: Formalize Soul document from Bard's approved direction** - `4fcdecb` (feat)
2. **Task 2: swd approves official Native App Soul document** - Auto-approved (parallel execution, checkpoint:human-verify)

## Files Created/Modified
- `.planning/NATIVE-APP-SOUL.md` - 626-line authoritative visual contract for v3.0 native iOS app (Phases 69-73)

## Decisions Made
- Placed Soul doc at `.planning/NATIVE-APP-SOUL.md` (project root, not phase directory) -- this is a living document that spans Phases 69-73
- Confirmed no color value changes from UI-SPEC baseline needed -- dusty rose accent and warm charcoal surface palette are correct for native
- Added Bold (700) weight for Large Title (28px) only -- all other text stays Regular (400) or Semibold (600)
- Confirmed SF Symbols as primary icon library for system UI, Lucide as fallback for Loom-specific elements
- Added accent Glow shadow to the reserved-for list (send button, active connection indicator)
- Structured the document as a formalized version of Bard's draft, curating and organizing rather than rewriting

## Deviations from Plan

None -- plan executed exactly as written. Bard's creative direction from NATIVE-APP-SOUL-DRAFT.md was formalized into the official document structure specified in the plan. The checkpoint:human-verify (Task 2) was auto-approved since auto mode is active and this is running as a parallel executor.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Known Stubs
None - this plan produces a design document, not code.

## Next Phase Readiness
- NATIVE-APP-SOUL.md is the design gate for Phase 69 -- document exists and is ready for swd's final review
- All 12 screens have actionable specifications for Phase 69+ implementation
- Elevation layer fully defined with spring values, surface tiers, and dynamic color configs
- 15 anti-patterns provide an enforceable quality checklist for every component

## Self-Check: PASSED

- NATIVE-APP-SOUL.md: FOUND (626 lines)
- 68-06-SUMMARY.md: FOUND
- Commit 4fcdecb: FOUND

---
*Phase: 68-scaffolding-design*
*Completed: 2026-03-31*
