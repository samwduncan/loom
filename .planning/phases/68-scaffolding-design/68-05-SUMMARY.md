---
phase: 68-scaffolding-design
plan: 05
subsystem: design
tags: [creative-direction, ios, react-native, spring-physics, soul-doc, chatgpt-ios, claude-ios]

# Dependency graph
requires:
  - phase: 68-scaffolding-design
    provides: UI-SPEC baseline tokens (colors, typography, spacing)
provides:
  - "NATIVE-APP-SOUL-DRAFT.md: Bard's creative direction for native iOS app"
  - "Reference app analysis (ChatGPT iOS + Claude iOS) with detailed measurements"
  - "6 spring physics categories with damping/stiffness/mass values"
  - "4-tier depth system + glass layer specifications"
  - "Dynamic color shift behaviors for 6 conversation states"
  - "Screen-by-screen direction for all 12 v3.0 screens"
  - "15 anti-patterns (structural, visual, interaction)"
  - "5 detailed elevation examples with motion/haptic/color sequences"
affects: [68-06-PLAN, phase-69, phase-70, phase-71]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "6-category spring physics system (Micro/Standard/Navigation/Drawer/Expand/Dramatic)"
    - "4-tier surface depth hierarchy + glass layer"
    - "Dynamic color shifts tied to conversation state"
    - "Haptic pairing for every motion event"

key-files:
  created:
    - ".planning/phases/68-scaffolding-design/NATIVE-APP-SOUL-DRAFT.md"
  modified: []

key-decisions:
  - "User messages in bubbles, assistant messages free-flowing (matching both reference apps)"
  - "Spring physics on every interaction, not just gestures (beyond reference apps)"
  - "Dynamic color responds to conversation state (streaming, thinking, error, permission)"
  - "Glass surfaces for floating elements (composer, nav header, search input)"
  - "SF Symbols recommended as primary icon library, Lucide as fallback"
  - "Large Title typography role added (28px bold) for session list header"

patterns-established:
  - "Elevation layer: Motion (springs) + Depth (4 tiers + glass) + Dynamic Color (state-responsive)"
  - "Haptic pairing: every visual state change paired with specific haptic type"
  - "Anti-pattern enforcement: 15 explicit prohibitions for native app quality"

requirements-completed: []

# Metrics
duration: 6min
completed: 2026-03-31
---

# Phase 68 Plan 05: Native App Soul Draft Summary

**Bard creative analysis of ChatGPT iOS and Claude iOS with full elevation layer (spring physics, 4-tier depth, dynamic color), 12-screen direction, and 15 anti-patterns**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-31T14:20:03Z
- **Completed:** 2026-03-31T14:26:28Z
- **Tasks:** 1 auto + 1 checkpoint (auto-approved in parallel execution)
- **Files modified:** 1

## Accomplishments
- Comprehensive reference app analysis comparing ChatGPT iOS and Claude iOS navigation, message density, composer design, color treatment, typography, and motion
- Defined Loom's elevation layer with 6 spring physics categories (Micro through Dramatic), 4-tier surface depth + glass, and dynamic color shifts for 6 conversation states
- Screen-by-screen creative direction for all 12 v3.0 screens with layout, component, motion, and color specifications
- 15 anti-patterns covering structural (no flat surfaces, no instant transitions), visual (no pure black, no gray accent), and interaction (no silent taps, no orphaned animations) prohibitions
- 5 detailed elevation examples (message send, tool complete, permission appear, drawer open, error occur) with exact motion/haptic/color sequences

## Task Commits

Each task was committed atomically:

1. **Task 1: Bard analyzes reference apps and proposes creative direction** - `8245392` (feat)
2. **Task 2: Review Bard's creative direction with swd** - Auto-approved (parallel execution, checkpoint:decision)

## Files Created/Modified
- `.planning/phases/68-scaffolding-design/NATIVE-APP-SOUL-DRAFT.md` - 678-line creative direction document with reference analysis, elevation layer, screen specs, anti-patterns, and elevation examples

## Decisions Made
- User messages use raised bubbles, assistant messages are free-flowing (no container) -- matches both ChatGPT and Claude iOS patterns
- Loom differentiates through motion density: spring physics on every interaction, not just gestures (both reference apps are conservative with motion)
- Dynamic color is subtle and state-responsive: streaming warms surfaces, errors cool them, permissions create focused halos
- Glass surfaces reserved for floating elements (composer, modals, search) -- not overused
- SF Symbols recommended as primary icon library for native iOS feel, Lucide as fallback for Loom-specific icons
- Added Large Title (28px bold) and Subheading (13px regular) typography roles beyond UI-SPEC baseline
- 15 anti-patterns serve as an enforceable quality checklist for every component implementation

## Deviations from Plan

None -- plan executed exactly as written. The checkpoint:decision (Task 2) was auto-approved since this is running as a parallel executor agent. The orchestrator and swd will review the draft output before Plan 06 formalizes it.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- NATIVE-APP-SOUL-DRAFT.md ready for swd review
- Plan 06 will formalize approved direction into official NATIVE-APP-SOUL.md
- All 12 screens have creative direction, unblocking Phase 69+ implementation

## Self-Check: PASSED

- NATIVE-APP-SOUL-DRAFT.md: FOUND (678 lines)
- 68-05-SUMMARY.md: FOUND
- Commit 8245392: FOUND

---
*Phase: 68-scaffolding-design*
*Completed: 2026-03-31*
