---
phase: 20
slug: content-layout-tab-system
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-10
---

# Phase 20 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.18 + React Testing Library 16.3.2 |
| **Config file** | `src/vite.config.ts` (test section) |
| **Quick run command** | `cd /home/swd/loom/src && npx vitest run --reporter=verbose` |
| **Full suite command** | `cd /home/swd/loom/src && npx vitest run --coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd /home/swd/loom/src && npx vitest run --reporter=verbose`
- **After every plan wave:** Run `cd /home/swd/loom/src && npx vitest run --coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 20-01-01 | 01 | 1 | LAY-09 | unit | `cd /home/swd/loom/src && npx vitest run src/stores/ui.test.ts -x` | ✅ (update) | ⬜ pending |
| 20-01-02 | 01 | 1 | LAY-07 | unit | `cd /home/swd/loom/src && npx vitest run src/stores/file.test.ts -x` | ❌ W0 | ⬜ pending |
| 20-02-01 | 02 | 1 | LAY-01, LAY-02, LAY-04 | unit | `cd /home/swd/loom/src && npx vitest run src/components/content-area/view/TabBar.test.tsx -x` | ❌ W0 | ⬜ pending |
| 20-02-02 | 02 | 1 | LAY-03, LAY-08 | unit | `cd /home/swd/loom/src && npx vitest run src/components/content-area/view/ContentArea.test.tsx -x` | ❌ W0 | ⬜ pending |
| 20-02-03 | 02 | 1 | LAY-05 | unit | `cd /home/swd/loom/src && npx vitest run src/components/content-area/hooks/useTabKeyboardShortcuts.test.ts -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/src/stores/file.test.ts` — stubs for LAY-07
- [ ] `src/src/components/content-area/view/TabBar.test.tsx` — stubs for LAY-01, LAY-02, LAY-04
- [ ] `src/src/components/content-area/view/ContentArea.test.tsx` — stubs for LAY-03, LAY-08
- [ ] `src/src/components/content-area/hooks/useTabKeyboardShortcuts.test.ts` — stubs for LAY-05
- [ ] Update `src/src/stores/ui.test.ts` — existing, update for new TabId values (LAY-09)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Tab bar hidden on mobile (<768px) | LAY-06 | Tailwind responsive classes — JSDOM has no viewport | Resize browser to <768px, verify only Chat visible, tab bar hidden |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
