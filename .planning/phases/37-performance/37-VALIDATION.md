---
phase: 37
slug: performance
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-17
---

# Phase 37 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0 + jsdom |
| **Config file** | `src/vite.config.ts` (test section) |
| **Quick run command** | `cd src && npx vitest run --reporter=verbose` |
| **Full suite command** | `cd src && npx vitest run --coverage` |
| **Estimated runtime** | ~45 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd src && npx vitest run --reporter=verbose`
- **After every plan wave:** Run `cd src && npx vitest run --coverage`
- **Before `/gsd:verify-work`:** Full suite must be green + DevTools evidence screenshots
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 37-01-01 | 01 | 1 | PERF-05 | unit | `cd src && ANALYZE=true npx vite build` | ❌ W0 | ⬜ pending |
| 37-01-02 | 01 | 1 | PERF-02 | unit | `cd src && npx vitest run src/src/components/chat/view/MessageContainer.test.tsx` | ✅ | ⬜ pending |
| 37-01-03 | 01 | 1 | PERF-01 | manual | Chrome DevTools Performance recording | N/A | ⬜ pending |
| 37-01-04 | 01 | 1 | PERF-03 | manual | Chrome DevTools Memory heap snapshots | N/A | ⬜ pending |
| 37-01-05 | 01 | 1 | PERF-04 | manual | Chrome DevTools Network tab (disable cache) | N/A | ⬜ pending |
| 37-02-01 | 02 | 1 | PERF-01 | manual | Chrome DevTools FPS meter during streaming | N/A | ⬜ pending |
| 37-02-02 | 02 | 1 | PERF-03 | manual | Heap snapshot diff after 10+ session switches | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `rollup-plugin-visualizer` — dev dependency installation
- [ ] `build:analyze` script in `src/package.json`
- [ ] Vite config: visualizer plugin + `manualChunks` configuration

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 55+ FPS with 200+ messages | PERF-01 | FPS is hardware/OS dependent, automated assertions would be flaky | Record Chrome Performance tab during streaming session with 200+ messages, verify FPS stays above 55 |
| No memory leaks across sessions | PERF-03 | Heap snapshot comparison is environment-dependent | Take heap snapshots before and after 10+ session switches, verify no growth trend |
| Page load under 2s | PERF-04 | Network timing varies by server load | Chrome Network tab with cache disabled, measure DOMContentLoaded |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
