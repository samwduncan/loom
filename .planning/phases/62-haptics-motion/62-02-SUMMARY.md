---
phase: 62-haptics-motion
plan: 02
subsystem: motion
tags: [spring-physics, ProMotion, 120Hz, Info.plist, CSS-linear, iOS]

requires:
  - phase: 47-spring-physics-glass-surfaces
    provides: "Original spring configs and CSS linear() token generation pipeline"
provides:
  - "ProMotion 120Hz opt-in via Info.plist CADisableMinimumFrameDurationOnPhone"
  - "Tuned spring damping: SNAPPY 24 (+20%), BOUNCY 14 (+17%)"
  - "Regenerated CSS linear() spring tokens matching updated configs"
  - "Corrected MOTION-01 requirement text"
affects: [63-bundled-assets, motion-consumers]

tech-stack:
  added: []
  patterns: ["Info.plist build-time opt-in for 120Hz (no runtime detection needed)"]

key-files:
  created: ["src/ios/App/App/Info.plist"]
  modified: ["src/src/lib/motion.ts", "src/src/lib/motion.test.ts", "src/scripts/generate-spring-tokens.mjs", "src/src/styles/tokens.css", ".planning/REQUIREMENTS.md"]

key-decisions:
  - "CADisableMinimumFrameDurationOnPhone is build-time opt-in, not runtime detection (D-19)"
  - "SPRING_SNAPPY damping 20->24 and SPRING_BOUNCY damping 12->14 for tighter, more precise feel on 120Hz"
  - "CSS linear() tokens regenerated -- snappy duration dropped 833ms->667ms, bouncy 1167ms->1000ms (expected: higher damping = faster settling)"
  - "Info.plist force-added via git add -f (ios/ directory is gitignored for generated Xcode scaffold)"

patterns-established:
  - "Info.plist ProMotion opt-in: single key unlocks 120Hz for all CSS compositor animations"

requirements-completed: [MOTION-01, MOTION-02, MOTION-03]

duration: 3min
completed: 2026-03-28
---

# Phase 62 Plan 02: ProMotion / Spring Tuning Summary

**120Hz ProMotion rendering via Info.plist opt-in, spring damping tuned tighter (SNAPPY +20%, BOUNCY +17%), CSS linear() tokens regenerated**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-28T05:41:21Z
- **Completed:** 2026-03-28T05:44:53Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments
- Added CADisableMinimumFrameDurationOnPhone to Info.plist enabling 120Hz CSS compositor animations on ProMotion devices
- Increased SPRING_SNAPPY damping from 20 to 24 (+20%) and SPRING_BOUNCY damping from 12 to 14 (+17%) for tighter, more precise feel
- Regenerated CSS linear() spring tokens from updated configs (snappy duration: 833ms->667ms, bouncy: 1167ms->1000ms)
- Corrected MOTION-01 requirement text from "runtime detection" to "Info.plist opt-in"

## Task Commits

Each task was committed atomically:

1. **Task 1: Add ProMotion opt-in to Info.plist and tune spring damping values** - `b41ab78` (feat)
2. **Task 2: Update motion.test.ts for new spring damping values** - `c55d94a` (test)
3. **Task 3: Update REQUIREMENTS.md MOTION-01 text to match implementation** - `259d6f2` (docs)

## Files Created/Modified
- `src/ios/App/App/Info.plist` - Added CADisableMinimumFrameDurationOnPhone for 120Hz ProMotion
- `src/src/lib/motion.ts` - Updated SPRING_SNAPPY (damping: 24) and SPRING_BOUNCY (damping: 14)
- `src/scripts/generate-spring-tokens.mjs` - Updated header comment and springs array to match motion.ts
- `src/src/styles/tokens.css` - Regenerated --ease-spring-* and --duration-spring-* CSS tokens
- `src/src/lib/motion.test.ts` - Updated regression test assertions for new damping values
- `.planning/REQUIREMENTS.md` - Corrected MOTION-01 text to reflect Info.plist opt-in approach

## Decisions Made
- CADisableMinimumFrameDurationOnPhone is a build-time Info.plist opt-in, not runtime detection. CSS compositor animations (transform, opacity, filter) automatically render at device refresh rate once opted in. No JS runtime detection needed (D-19).
- Spring damping increases reduce overshoot and settling time for a tighter feel: SNAPPY 20->24, BOUNCY 12->14. GENTLE unchanged.
- Info.plist force-added via `git add -f` since ios/ directory is gitignored (generated Xcode scaffold). The plist itself is a source file that should be tracked.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Info.plist in gitignored directory**
- **Found during:** Task 1 (commit stage)
- **Issue:** `src/ios/` is in `.gitignore` (generated Xcode scaffold), preventing `git add` of Info.plist
- **Fix:** Used `git add -f` to force-track the Info.plist file
- **Files modified:** None (gitignore unchanged, file force-added)
- **Verification:** File committed successfully, appears in git log
- **Committed in:** b41ab78 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Minor git workflow issue resolved with force-add. No scope creep.

## Issues Encountered
- Worktree lacked node_modules for spring-easing package. Generated tokens by running the spring calculation inline from the main repo's node_modules.
- Tests run against main repo's vitest installation with modified files temporarily copied.

## Known Stubs

None -- all values are computed from spring physics, no placeholders.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- ProMotion opt-in and spring tuning complete, ready for haptics integration (62-01) and UI wiring (62-03)
- MOTION-01/02/03 requirements satisfied

## Self-Check: PASSED

All 7 files verified present. All 3 task commits verified in git log.

---
*Phase: 62-haptics-motion*
*Completed: 2026-03-28*
