---
phase: 36
slug: accessibility
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-17
---

# Phase 36 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.18 + @testing-library/react |
| **Config file** | `src/vite.config.ts` (vitest config section) |
| **Quick run command** | `cd /home/swd/loom/src && npx vitest run --reporter=verbose` |
| **Full suite command** | `cd /home/swd/loom/src && npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd /home/swd/loom/src && npx vitest run --reporter=verbose 2>&1 | tail -20`
- **After every plan wave:** Run `cd /home/swd/loom/src && npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green + `npx tsc --noEmit` + `npx eslint src/ --max-warnings=0`
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 36-01-01 | 01 | 1 | A11Y-01 | unit | `npx vitest run src/src/tests/a11y-audit.test.tsx -x` | ❌ W0 | ⬜ pending |
| 36-01-02 | 01 | 1 | A11Y-02 | unit | `npx vitest run src/src/tests/a11y-audit.test.tsx -x` | ❌ W0 | ⬜ pending |
| 36-02-01 | 02 | 1 | A11Y-03 | unit | `npx vitest run src/src/tests/a11y-focus.test.tsx -x` | ❌ W0 | ⬜ pending |
| 36-03-01 | 03 | 1 | A11Y-04 | unit | `npx vitest run src/src/components/a11y/LiveAnnouncer.test.tsx -x` | ❌ W0 | ⬜ pending |
| 36-04-01 | 04 | 1 | A11Y-05 | unit+manual | Manual: browser DevTools reduced-motion check | N/A | ⬜ pending |
| 36-04-02 | 04 | 1 | A11Y-06 | unit | `npx vitest run src/src/tests/a11y-contrast.test.tsx -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `npm install -D vitest-axe` — axe-core integration for automated WCAG checks
- [ ] `src/src/tests/a11y-audit.test.tsx` — covers A11Y-01, A11Y-02
- [ ] `src/src/tests/a11y-focus.test.tsx` — covers A11Y-03
- [ ] `src/src/components/a11y/LiveAnnouncer.test.tsx` — covers A11Y-04
- [ ] `src/src/tests/a11y-contrast.test.tsx` — covers A11Y-06

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| prefers-reduced-motion disables ALL animations | A11Y-05 | CSS media query behavior requires browser verification | 1. Open Chrome DevTools → Rendering → Force reduced-motion. 2. Navigate all panels. 3. Verify zero animations (pulse, spin, transitions). |
| Screen reader streaming announcements | A11Y-04 | Live region behavior requires assistive technology | 1. Enable VoiceOver/NVDA. 2. Start streaming. 3. Verify "responding" announcement. 4. Wait for completion. 5. Verify "complete" announcement. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
