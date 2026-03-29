---
phase: 65
slug: touch-target-compliance
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-29
---

# Phase 65 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.18 (unit), Playwright 1.58.2 (e2e) |
| **Config file** | `src/playwright.config.ts` |
| **Quick run command** | `cd src && npx vitest run --reporter=verbose 2>&1 \| tail -5` |
| **Full suite command** | `cd src && npx playwright test` |
| **Estimated runtime** | ~30 seconds (Playwright), ~10 seconds (Vitest) |

---

## Sampling Rate

- **After every task commit:** Run `cd src && npx vitest run --reporter=verbose 2>&1 | tail -5`
- **After every plan wave:** Run `cd src && npx playwright test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 65-01-01 | 01 | 1 | TOUCH-01 | e2e | `cd src && npx playwright test e2e/touch-targets.spec.ts` | ❌ W0 | ⬜ pending |
| 65-01-02 | 01 | 1 | TOUCH-02 | e2e | Same file | ❌ W0 | ⬜ pending |
| 65-01-03 | 01 | 1 | TOUCH-03 | e2e | Same file | ❌ W0 | ⬜ pending |
| 65-01-04 | 01 | 1 | TOUCH-04 | e2e | Same file | ❌ W0 | ⬜ pending |
| 65-01-05 | 01 | 1 | TOUCH-05 | e2e | Same file | ❌ W0 | ⬜ pending |
| 65-01-06 | 01 | 1 | TOUCH-06 | e2e | Same file | ❌ W0 | ⬜ pending |
| 65-02-01 | 02 | 1 | TOUCH-07 | manual | Visual inspection | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/e2e/touch-targets.spec.ts` — Playwright test covering TOUCH-01 through TOUCH-06 (mobile viewport, getBoundingClientRect().height >= 44 assertions)

*Wave 0 is part of the execution plan — test file created alongside fixes.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Focus rings visible at 3px width | TOUCH-07 | Visual rendering quality not automatable | Open app at 375px viewport, Tab through all interactive elements, verify 3px ring with ring-ring/50 color |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
