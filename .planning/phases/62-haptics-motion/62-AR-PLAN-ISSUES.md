# Phase 62 — Adversarial Plan Review Issues

**Tier:** Deep (Guard/Sonnet + Hunter/Opus + Architect/Opus)
**Date:** 2026-03-28
**Total findings:** 26 raw, 9 after dedup

## S-Grade (Fix before execution)

### S-1: ToolChip haptics in React render path [Guard + Hunter + Architect]
**Plan:** 62-03, Task 1 (ToolChip.tsx integration)
**Issue:** The plan inserts hapticNotification() calls inside the "adjust state during rendering" block (lines 49-55 of ToolChip.tsx). This runs during the render phase, not an event handler. Violates React purity contract. Will double-fire in StrictMode, and in concurrent mode can fire on discarded renders. Research anti-pattern #3 explicitly warns against this.
**Fix:** Move haptic calls to a useEffect watching toolCall.status with a prevStatusRef pattern. Effects run once per committed render.

## A-Grade (Fix in this planning pass)

### A-1: Connection error haptics missing [Guard + Hunter + Architect]
**Plan:** 62-03 (entire plan)
**Issue:** D-15 and NATIVE-03 require haptics on "error states" including connection errors. Plan only implements tool rejection haptics via ToolChip. Connection error state is never wired.
**Fix:** Add hapticNotification('Error') to the connection error UI surface.

### A-2: MOTION-01 requirement text mismatch [Hunter + Architect]
**Plan:** 62-02
**Issue:** MOTION-01 says "Device refresh rate detected (60Hz vs 120Hz) at runtime" but implementation correctly skips runtime detection (D-19). Requirement text needs updating.
**Fix:** Add task to update REQUIREMENTS.md MOTION-01 text to match actual implementation.

### A-3: Batch tool haptic storm unaddressed [Hunter + Architect]
**Plan:** 62-03, Task 1
**Issue:** Research Open Question #1 identifies 10+ rapid tool completions causing haptic buzz storm. Plan has no throttle, no testing criteria, no mitigation.
**Fix:** Add 200ms throttle to hapticNotification() in haptics.ts (Plan 01). Simple lastNotificationTime check.

### A-4: QuickSettingsPanel as const type mismatch [Guard]
**Plan:** 62-03, Task 2
**Issue:** The toggle config array uses `as const`. Wrapping onChange in new arrow functions changes inferred type from specific function reference to `() => void`, which may conflict with Radix Switch's `(checked: boolean) => void` prop type.
**Fix:** Either drop `as const`, explicitly type the array, or have wrappers accept `_checked: boolean`.

### A-5: tokens.css replacement instructions vague [Guard]
**Plan:** 62-02, Task 1
**Issue:** Plan says "replace lines 93-103 with regenerated output" but doesn't specify how to handle script's comment header, indentation within :root block, or stale line numbers.
**Fix:** Clarify: strip comment header from script output, replace only the 6 property lines, preserve :root indentation.

## B-Grade (Noted)

- B-1: vi.hoisted() dual block confusion in Plan 01 Task 2
- B-2: Info.plist XML validation missing (add xmllint --noout)
- B-3: SPRING_BOUNCY acceptance criteria ambiguous (use full toEqual string)
- B-4: _resetForTesting clarity gap in native-plugins.ts
