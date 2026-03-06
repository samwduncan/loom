---
phase: 9
slug: e2e-integration-wiring
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-06
---

# Phase 9 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.x (unit/integration) + Playwright 1.58.x (E2E) |
| **Config file** | `src/vite.config.ts` (vitest), `src/playwright.config.ts` (E2E, created in Wave 2) |
| **Quick run command** | `cd src && npx vitest run --reporter=verbose` |
| **Full suite command** | `cd src && npx vitest run && npx playwright test` |
| **Estimated runtime** | ~15s (vitest) + ~60s (playwright) |

---

## Sampling Rate

- **After every task commit:** Run `cd src && npx vitest run --reporter=verbose`
- **After every plan wave:** Run full suite including Playwright
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 20 seconds (vitest only)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 09-01-01 | 01 | 1 | STRM-01 | integration | `vitest run websocket-init` | existing | pending |
| 09-01-02 | 01 | 1 | NAV-01, NAV-02 | unit | `vitest run SessionList` | existing | pending |
| 09-01-03 | 01 | 1 | NAV-02 | unit | `vitest run ChatComposer` | existing | pending |
| 09-01-04 | 01 | 1 | NAV-01 | unit | `vitest run stream-multiplexer` | existing | pending |
| 09-02-01 | 02 | 2 | all | E2E setup | `playwright test --list` | W0 | pending |
| 09-02-02 | 02 | 2 | STRM-01,02,03 | E2E | `playwright test streaming` | W0 | pending |
| 09-02-03 | 02 | 2 | NAV-01, NAV-02 | E2E | `playwright test session` | W0 | pending |
| 09-02-04 | 02 | 2 | STRM-03 | E2E | `playwright test cls` | W0 | pending |

*Status: pending · green · red · flaky*

---

## Wave 0 Requirements

- [ ] `src/playwright.config.ts` — Playwright config with webServer array (Vite + backend)
- [ ] `src/e2e/` directory — E2E test directory structure
- [ ] `@playwright/test` — install Playwright dependency

*Existing vitest infrastructure covers Wave 1 unit/integration tests.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual CLS perception | STRM-03 | Automated CLS measures shift magnitude but not visual perception | Watch streaming→finalized transition at 1x speed in real browser |

*All other behaviors have automated verification via Playwright E2E.*

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 20s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
