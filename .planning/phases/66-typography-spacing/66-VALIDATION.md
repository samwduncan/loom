---
phase: 66
slug: typography-spacing
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-29
---

# Phase 66 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.18 + Playwright 1.58.2 |
| **Config file** | `src/vitest.config.ts` / `src/playwright.config.ts` |
| **Quick run command** | `cd src && npx vitest run src/src/styles/tokens.test.ts` |
| **Full suite command** | `cd src && npx vitest run` |
| **Estimated runtime** | ~45 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd src && npx vitest run src/src/styles/tokens.test.ts`
- **After every plan wave:** Run `cd src && npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 45 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 66-01-01 | 01 | 1 | TYPO-01, TYPO-04, TYPO-06, TYPO-07 | unit | `cd src && npx vitest run src/src/styles/tokens.test.ts` | ✅ | ⬜ pending |
| 66-01-02 | 01 | 1 | TYPO-04, TYPO-07 | unit | `cd src && npx vitest run` | ✅ | ⬜ pending |
| 66-02-01 | 02 | 2 | TYPO-02, TYPO-03, TYPO-05, TYPO-08 | unit + verify | `cd src && npx vitest run` | ✅ | ⬜ pending |
| 66-02-02 | 02 | 2 | TYPO-01 through TYPO-07 | e2e | `cd src && npx playwright test e2e/typography.spec.ts` | ❌ W0 (created by this task) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

**Note:** Plan 02 Task 2 creates `typography.spec.ts` then runs it (create-then-run Wave 0 pattern). This is the canonical pattern for closing Wave 0 gaps within the same task.

---

## Wave 0 Requirements

- [x] `src/e2e/typography.spec.ts` — Created by Plan 02 Task 2 (create-then-run pattern)
- [x] Update `src/src/styles/tokens.test.ts` — Token additions verified by Plan 01 Task 1
- [x] TYPO-08 is manual-only (real iOS device keyboard test) — structural verification in Plan 02 Task 1

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Keyboard no font shrink | TYPO-08 | Requires real iOS keyboard events (WKWebView) | 1. Open chat on iPhone, 2. Type in composer, 3. Verify token count and labels don't shrink/jump when keyboard opens/closes |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 45s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-03-29
