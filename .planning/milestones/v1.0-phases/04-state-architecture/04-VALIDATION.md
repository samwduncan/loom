---
phase: 4
slug: state-architecture
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-05
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.18 |
| **Config file** | `src/vite.config.ts` |
| **Quick run command** | `cd /home/swd/loom/src && npx vitest run src/src/stores/` |
| **Full suite command** | `cd /home/swd/loom/src && npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd /home/swd/loom/src && npx vitest run src/src/stores/`
- **After every plan wave:** Run `cd /home/swd/loom/src && npx vitest run && npx tsc --noEmit`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | STATE-01 | unit | `cd /home/swd/loom/src && npx vitest run src/src/stores/timeline.test.ts` | ❌ W0 | ⬜ pending |
| 04-01-02 | 01 | 1 | STATE-01 | unit | `cd /home/swd/loom/src && npx vitest run src/src/stores/stream.test.ts` | ❌ W0 | ⬜ pending |
| 04-01-03 | 01 | 1 | STATE-01 | unit | `cd /home/swd/loom/src && npx vitest run src/src/stores/ui.test.ts` | ❌ W0 | ⬜ pending |
| 04-01-04 | 01 | 1 | STATE-01 | unit | `cd /home/swd/loom/src && npx vitest run src/src/stores/connection.test.ts` | ❌ W0 | ⬜ pending |
| 04-01-05 | 01 | 1 | STATE-02 | unit | `cd /home/swd/loom/src && npx vitest run src/src/stores/timeline.test.ts` | ❌ W0 | ⬜ pending |
| 04-01-06 | 01 | 1 | STATE-03 | type-check | `cd /home/swd/loom/src && npx tsc --noEmit` | ✅ | ⬜ pending |
| 04-02-01 | 02 | 1 | STATE-04 | lint | `cd /home/swd/loom/src && npx eslint src/src/stores/ src/src/components/` | ✅ | ⬜ pending |
| 04-02-02 | 02 | 1 | STATE-05 | unit | `cd /home/swd/loom/src && npx vitest run src/src/stores/timeline.test.ts` | ❌ W0 | ⬜ pending |
| 04-02-03 | 02 | 1 | STATE-05 | manual | Check `src/stores/README.md` exists | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/src/stores/timeline.test.ts` — stubs for STATE-01, STATE-02, STATE-03, STATE-05
- [ ] `src/src/stores/stream.test.ts` — stubs for STATE-01
- [ ] `src/src/stores/ui.test.ts` — stubs for STATE-01
- [ ] `src/src/stores/connection.test.ts` — stubs for STATE-01, STATE-03
- [ ] `npm install immer` — required dependency for timeline store

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| README documents persistence strategy | STATE-05 | Documentation content quality | Verify `src/stores/README.md` exists and documents which slices persist vs ephemeral |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
