---
phase: 40
slug: session-titles-rename
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-17
---

# Phase 40 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.x with jsdom |
| **Config file** | `src/vite.config.ts` (vitest section) |
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
| 40-01-01 | 01 | 1 | SESS-01 | unit | `cd src && npx vitest run src/src/lib/extract-session-title.test.ts -x` | ❌ W0 | ⬜ pending |
| 40-01-02 | 01 | 1 | SESS-01 | unit | same | ❌ W0 | ⬜ pending |
| 40-01-03 | 01 | 1 | SESS-01 | unit | same | ❌ W0 | ⬜ pending |
| 40-01-04 | 01 | 1 | SESS-01 | unit | same | ❌ W0 | ⬜ pending |
| 40-02-01 | 02 | 1 | SESS-02 | integration | Already tested in Phase 39 | ✅ | ⬜ pending |
| 40-02-02 | 02 | 1 | SESS-03 | unit | `cd src && npx vitest run src/src/components/sidebar/SessionList.test.tsx -x` | ❌ W0 | ⬜ pending |
| 40-02-03 | 02 | 1 | SESS-03 | unit | same | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/src/lib/extract-session-title.test.ts` — stubs for SESS-01 (title extraction)
- [ ] SessionList.test.tsx additions — SESS-03 PATCH integration and rollback tests

*Existing infrastructure covers SESS-02 (backend already tested in Phase 39).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Title persists after clearing browser cache | SESS-02, SESS-03 | Requires real browser localStorage clear | 1. Rename a session 2. Clear browser cache 3. Reload page 4. Verify title persists |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
