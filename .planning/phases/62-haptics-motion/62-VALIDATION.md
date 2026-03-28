---
phase: 62
slug: haptics-motion
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-28
---

# Phase 62 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (existing) |
| **Config file** | src/vitest-setup.ts |
| **Quick run command** | `cd src && npx vitest run src/src/lib/haptics.test.ts src/src/lib/native-plugins.test.ts src/src/lib/motion.test.ts -x` |
| **Full suite command** | `cd src && npx vitest run` |
| **Estimated runtime** | ~30 seconds (full), ~5 seconds (quick) |

---

## Sampling Rate

- **After every task commit:** Run quick run command
- **After every plan wave:** Run full suite command
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 62-01-01 | 01 | 1 | NATIVE-03 | unit | `cd src && npx vitest run src/src/lib/haptics.test.ts -x` | No -- Wave 0 | pending |
| 62-01-02 | 01 | 1 | NATIVE-03 | unit | `cd src && npx vitest run src/src/lib/native-plugins.test.ts -x` | Yes -- extend | pending |
| 62-01-03 | 01 | 1 | NATIVE-03 | unit | `cd src && npx vitest run src/src/lib/haptics.test.ts -x` | No -- Wave 0 | pending |
| 62-02-01 | 02 | 2 | MOTION-02 | unit | `cd src && npx vitest run src/src/lib/motion.test.ts -x` | Yes -- extend | pending |
| 62-02-02 | 02 | 2 | MOTION-03 | manual | `grep CADisableMinimumFrameDurationOnPhone src/ios/App/App/Info.plist` | No -- create | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] `src/src/lib/haptics.test.ts` -- covers NATIVE-03 (haptic calls, no-ops, reduced motion)
- [ ] Extend `src/src/lib/native-plugins.test.ts` -- add Haptics plugin init test block
- [ ] Extend `src/src/lib/motion.test.ts` -- verify updated spring damping values

---

## Phase Gate Criteria

All of the following must be true before phase verification:
1. `cd src && npx vitest run` exits 0 (full suite green)
2. `grep CADisableMinimumFrameDurationOnPhone src/ios/App/App/Info.plist` returns a match
3. No new TypeScript errors: `cd src && npx tsc --noEmit` exits 0
