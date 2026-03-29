---
phase: 66
slug: typography-spacing
status: draft
nyquist_compliant: false
wave_0_complete: false
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
| 66-01-01 | 01 | 1 | TYPO-01 | unit | `cd src && npx vitest run src/src/styles/tokens.test.ts` | ✅ | ⬜ pending |
| 66-01-02 | 01 | 1 | TYPO-04 | unit | `cd src && npx vitest run src/src/styles/tokens.test.ts` | ✅ | ⬜ pending |
| 66-02-01 | 02 | 1 | TYPO-01 | unit + e2e | `cd src && npx vitest run` | ✅ unit / ❌ W0 e2e | ⬜ pending |
| 66-02-02 | 02 | 1 | TYPO-04 | e2e | Playwright mobile viewport | ❌ W0 | ⬜ pending |
| 66-02-03 | 02 | 1 | TYPO-06 | e2e | Playwright modal font-size | ❌ W0 | ⬜ pending |
| 66-02-04 | 02 | 1 | TYPO-07 | e2e | Playwright getComputedStyle | ❌ W0 | ⬜ pending |
| 66-03-01 | 03 | 2 | TYPO-02 | e2e | Playwright mobile viewport | ❌ W0 | ⬜ pending |
| 66-03-02 | 03 | 2 | TYPO-03 | e2e | Playwright mobile viewport | ❌ W0 | ⬜ pending |
| 66-03-03 | 03 | 2 | TYPO-05 | unit | `cd src && npx vitest run src/src/components/sidebar/SessionItem.test.tsx` | ✅ | ⬜ pending |
| 66-03-04 | 03 | 2 | TYPO-08 | manual | Real device test (iOS keyboard) | Manual | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/e2e/typography.spec.ts` — Playwright tests for TYPO-01 through TYPO-07: mobile viewport font-size and line-height assertions
- [ ] Update `src/src/styles/tokens.test.ts` — add `--text-xs`, `--text-sm`, `--text-code` to required properties list
- [ ] TYPO-08 is manual-only (real iOS device keyboard test)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Keyboard no font shrink | TYPO-08 | Requires real iOS keyboard events (WKWebView) | 1. Open chat on iPhone, 2. Type in composer, 3. Verify token count and labels don't shrink/jump when keyboard opens/closes |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 45s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
