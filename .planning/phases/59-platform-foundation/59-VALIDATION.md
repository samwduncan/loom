---
phase: 59
slug: platform-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-28
---

# Phase 59 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `src/vitest.config.ts` |
| **Quick run command** | `cd src && npx vitest run --reporter=verbose` |
| **Full suite command** | `cd src && npx vitest run --reporter=verbose` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd src && npx vitest run --reporter=verbose`
- **After every plan wave:** Run `cd src && npx vitest run --reporter=verbose`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 59-01-01 | 01 | 1 | PLAT-01 | unit | `cd src && npx vitest run src/src/lib/platform.test.ts` | W0 | pending |
| 59-01-02 | 01 | 1 | PLAT-02 | unit | `cd src && npx vitest run src/src/lib/platform.test.ts` | W0 | pending |
| 59-01-03 | 01 | 1 | PLAT-03 | unit | `cd src && npx vitest run src/src/lib/platform.test.ts` | W0 | pending |
| 59-02-01 | 02 | 1 | PLAT-02 | unit | `cd src && npx vitest run src/src/lib/api-client.test.ts` | exists | pending |
| 59-02-02 | 02 | 1 | PLAT-02 | unit | `cd src && npx vitest run src/src/lib/auth.test.ts` | W0 | pending |
| 59-02-03 | 02 | 1 | PLAT-03 | unit | `cd src && npx vitest run src/src/lib/websocket-client.test.ts` | exists | pending |
| 59-03-01 | 03 | 2 | PLAT-04 | manual | curl test with Origin header | N/A | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] `src/src/lib/platform.test.ts` — unit tests for IS_NATIVE, resolveApiUrl, resolveWsUrl, fetchAnon
- [ ] Auth test stubs if not already covered

*Existing vitest infrastructure covers most phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| CORS accepts `capacitor://localhost` | PLAT-04 | Requires running Express server | `curl -H "Origin: capacitor://localhost" -I http://localhost:5555/api/auth/status` and verify `Access-Control-Allow-Origin` header |
| Web mode zero behavioral change | PLAT-01 | Full app behavior | Open `http://100.86.4.57:5184` in browser, verify all features work identically |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
