---
phase: 44
slug: foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-18
---

# Phase 44 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.18 |
| **Config file** | `src/vite.config.ts` (test section) |
| **Quick run command** | `cd src && npx vitest run --reporter=verbose` |
| **Full suite command** | `cd src && npx vitest run` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd src && npx vitest run --reporter=verbose`
- **After every plan wave:** Run `cd src && npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 44-01-01 | 01 | 1 | FOUND-01 | unit | `cd src && npx vitest run src/hooks/useSettingsData.test.ts src/components/settings/ -x` | Yes | ⬜ pending |
| 44-01-02 | 01 | 1 | FOUND-02 | manual + grep | `grep -r "PanelPlaceholder\|PlaceholderView" src/src/ --include='*.ts' --include='*.tsx'` | N/A | ⬜ pending |
| 44-02-01 | 02 | 1 | FOUND-03 | unit | `cd src && npx vitest run src/lib/motion.test.ts -x` | Partial (needs spring token assertions) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/src/lib/motion.test.ts` — Add test verifying `--ease-spring-gentle`, `--ease-spring-snappy`, `--ease-spring-bouncy` are valid `linear()` values
- [ ] Verify `PanelPlaceholder` and `PlaceholderView` deletion doesn't break any imports (grep check)

*Existing infrastructure covers FOUND-01 requirements (49 tests already passing in WIP).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| No placeholder UI visible | FOUND-02 | Visual check — dead code removal is verified by absence | 1. Open app 2. Navigate all panels/tabs 3. Confirm no "coming soon" or placeholder text visible |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
