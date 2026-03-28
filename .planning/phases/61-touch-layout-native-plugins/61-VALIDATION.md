---
phase: 61
slug: touch-layout-native-plugins
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-28
---

# Phase 61 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | src/vitest.config.ts |
| **Quick run command** | `cd src && npx vitest run --reporter=verbose 2>&1 | tail -5` |
| **Full suite command** | `cd src && npx vitest run 2>&1 | tail -20` |
| **Estimated runtime** | ~30 seconds |

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
| 61-01-01 | 01 | 1 | NATIVE-01, NATIVE-02, NATIVE-04 | unit | `cd src && npx vitest run src/lib/native-plugins.test.ts` | ❌ W0 | ⬜ pending |
| 61-02-01 | 02 | 1 | TOUCH-01 | unit | `cd src && npx vitest run --reporter=verbose 2>&1 \| tail -5` | ✅ | ⬜ pending |
| 61-03-01 | 03 | 2 | TOUCH-03, TOUCH-04, TOUCH-02 | unit+manual | `cd src && npx vitest run --reporter=verbose 2>&1 \| tail -5` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Update `src/src/lib/native-plugins.test.ts` — add tests for StatusBar/SplashScreen init paths
- [ ] Existing test infrastructure covers touch target and CSS verification via component tests

*Existing infrastructure covers most phase requirements. Only native-plugins tests need expansion.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Status bar light text on dark bg | NATIVE-01 | Requires real device with StatusBar plugin | Build iOS app, verify status bar style |
| Splash screen fade-out | NATIVE-02 | Requires real device launch sequence | Cold launch app, verify no white flash |
| iOS back gesture vs sidebar | TOUCH-04 | Requires real device gesture testing | Open sidebar, swipe from left edge, verify no conflict |
| Touch targets feel right | TOUCH-05 | Thumb-zone is subjective to device | Use iPhone 16 Pro Max, verify primary actions reachable |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
