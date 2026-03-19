---
phase: 46
slug: interactive-state-consistency
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-19
---

# Phase 46 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.18 + React Testing Library |
| **Config file** | `src/vite.config.ts` (vitest config section) |
| **Quick run command** | `cd src && npx vitest run --reporter=verbose` |
| **Full suite command** | `cd src && npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd src && npx vitest run --reporter=verbose`
- **After every plan wave:** Run `cd src && npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 46-01-01 | 01 | 1 | INTER-01 | manual-only | Visual verification in browser | N/A | ⬜ pending |
| 46-01-02 | 01 | 1 | INTER-02 | unit | `cd src && npx vitest run src/src/tests/focus-ring-audit.test.tsx -x` | ❌ W0 | ⬜ pending |
| 46-01-03 | 01 | 1 | INTER-03 | unit | `cd src && npx vitest run src/src/tests/disabled-state-audit.test.tsx -x` | ❌ W0 | ⬜ pending |
| 46-02-01 | 02 | 1 | INTER-04 | manual-only | Visual verification -- CSS animation presence | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/src/tests/focus-ring-audit.test.tsx` — render key interactive components, verify focus-visible classes/attributes (INTER-02)
- [ ] `src/src/tests/disabled-state-audit.test.tsx` — render disabled buttons, verify opacity/pointer-events classes (INTER-03)

*Existing infrastructure covers INTER-01 and INTER-04 (manual visual verification).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Hover states use consistent design tokens | INTER-01 | Visual appearance cannot be verified in jsdom | Tab through all panels, hover each interactive element, verify consistent highlight |
| Overlay enter/exit transitions are consistent | INTER-04 | CSS animation timing is visual | Open/close command palette, mention picker, slash picker, branch selector; verify smooth enter transitions |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
