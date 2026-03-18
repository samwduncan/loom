---
phase: 42
slug: session-discovery
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-18
---

# Phase 42 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | src/vite.config.ts |
| **Quick run command** | `cd src && npx vitest run --reporter=verbose` |
| **Full suite command** | `cd src && npx vitest run --reporter=verbose` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd src && npx vitest run --reporter=verbose`
- **After every plan wave:** Run `cd src && npx vitest run --reporter=verbose`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 42-01-01 | 01 | 1 | SESS-07 | unit | `cd src && npx vitest run src/src/hooks/useSessionSearch.test.ts` | ❌ W0 | ⬜ pending |
| 42-01-02 | 01 | 1 | SESS-07 | unit | `cd src && npx vitest run src/src/components/sidebar/SearchBar.test.tsx` | ❌ W0 | ⬜ pending |
| 42-02-01 | 02 | 1 | SESS-08 | unit | `cd src && npx vitest run src/src/hooks/useSessionPins.test.ts` | ❌ W0 | ⬜ pending |
| 42-02-02 | 02 | 1 | SESS-09 | unit | `cd src && npx vitest run src/src/hooks/useSessionSelection.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/src/hooks/useSessionSearch.test.ts` — stubs for SESS-07
- [ ] `src/src/hooks/useSessionPins.test.ts` — stubs for SESS-08
- [ ] `src/src/hooks/useSessionSelection.test.ts` — stubs for SESS-09

*Existing test infrastructure covers framework needs. Only test file stubs needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Search highlights matching text in session titles | SESS-07 | Visual rendering verification | Type in search bar, confirm yellow/highlight on matching substring |
| Pinned sessions persist across reload | SESS-08 | localStorage persistence | Pin a session, reload page, confirm pin still shows |
| Bulk delete confirmation dialog | SESS-09 | Modal interaction flow | Select 3+ sessions, click delete, confirm dialog appears with count |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
