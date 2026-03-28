---
phase: 63
slug: bundled-assets-device-validation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-28
---

# Phase 63 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.18 |
| **Config file** | `src/vite.config.ts` (test section) |
| **Quick run command** | `cd /home/swd/loom/src && npx vitest run --reporter verbose` |
| **Full suite command** | `cd /home/swd/loom/src && npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd /home/swd/loom/src && npx vitest run --reporter verbose`
- **After every plan wave:** Run `cd /home/swd/loom/src && npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 63-01-01 | 01 | 1 | BUNDLE-01 | smoke | `cd src && npm run build && test -f dist/index.html` | N/A (shell) | ⬜ pending |
| 63-01-02 | 01 | 1 | BUNDLE-02 | unit | `cd src && npx vitest run src/lib/platform.test.ts -x` | ✅ | ⬜ pending |
| 63-02-01 | 02 | 1 | BUNDLE-03 | unit | `cd src && npx vitest run src/components/shared/ConnectionBanner.test.tsx -x` | ✅ (needs update) | ⬜ pending |
| 63-02-02 | 02 | 1 | BUNDLE-03 | unit | `cd src && npx vitest run src/lib/websocket-init.test.ts -x` | ❌ W0 | ⬜ pending |
| 63-03-01 | 03 | 2 | BUNDLE-04 | manual-only | Visual check on device | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/src/lib/websocket-init.test.ts` — test for auth bootstrap error handling (unreachable server scenario)
- [ ] `src/src/components/shared/ConnectionBanner.test.tsx` — add IS_NATIVE-aware message assertions

*Existing infrastructure (Vitest, JSDOM) covers all other phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| No white flash on launch | BUNDLE-04 | Requires real iOS device + Xcode build | Launch app cold on iPhone, verify splash -> content transition |
| On-device spot check | BUNDLE-02 | Requires real iOS device | Run DEVICE-VALIDATION-CHECKLIST.md items on iPhone |
| cap sync produces working bundle | BUNDLE-01 | Requires macOS + Xcode | Run `npm run build && cap sync ios`, open Xcode, build & run |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
