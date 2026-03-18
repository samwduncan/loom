---
phase: 41
slug: session-organization
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-18
---

# Phase 41 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest + jsdom |
| **Config file** | src/vite.config.ts (vitest section) |
| **Quick run command** | `cd /home/swd/loom/src && npx vitest run src/src/lib/sessionGrouping.test.ts --reporter=verbose` |
| **Full suite command** | `cd /home/swd/loom/src && npx vitest run --reporter=verbose` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd /home/swd/loom/src && npx vitest run src/src/lib/sessionGrouping.test.ts src/src/lib/formatTime.test.ts --reporter=verbose`
- **After every plan wave:** Run `cd /home/swd/loom/src && npx vitest run --reporter=verbose`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 41-01-01 | 01 | 1 | SESS-04, SESS-06 | unit | `npx vitest run src/src/lib/sessionGrouping.test.ts -x` | ❌ W0 | ⬜ pending |
| 41-01-02 | 01 | 1 | SESS-04 | unit | `npx vitest run src/src/hooks/useMultiProjectSessions.test.ts -x` | ❌ W0 | ⬜ pending |
| 41-02-01 | 02 | 2 | SESS-04 | unit | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 41-02-02 | 02 | 2 | SESS-04, SESS-05, SESS-06 | unit | `npx vitest run src/src/components/sidebar/SessionList.test.tsx -x` | ✅ needs update | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/src/lib/sessionGrouping.test.ts` — covers SESS-04, SESS-06 (pure grouping + junk filter)
- [ ] `src/src/hooks/useMultiProjectSessions.test.ts` — covers SESS-04 (hook integration)
- [ ] Update `src/src/lib/formatTime.test.ts` — covers SESS-05 (5-bucket date grouping)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Scroll position preserved on collapse/expand | SESS-04 | DOM scroll position requires visual verification | 1. Expand a project group 2. Scroll down 3. Collapse and re-expand 4. Verify scroll position matches |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
