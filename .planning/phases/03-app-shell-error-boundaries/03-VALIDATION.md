---
phase: 3
slug: app-shell-error-boundaries
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-05
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.18 + React Testing Library 16.3.2 |
| **Config file** | `src/vite.config.ts` (test section) |
| **Quick run command** | `cd /home/swd/loom/src && npx vitest run --reporter=verbose` |
| **Full suite command** | `cd /home/swd/loom/src && npx vitest run --coverage` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd /home/swd/loom/src && npx vitest run --reporter=verbose`
- **After every plan wave:** Run `cd /home/swd/loom/src && npx vitest run --coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | SHELL-01 | unit | `npx vitest run src/components/app-shell/AppShell.test.tsx` | Wave 0 | pending |
| 03-01-02 | 01 | 1 | SHELL-02 | unit | `npx vitest run src/components/app-shell/AppShell.test.tsx` | Wave 0 | pending |
| 03-01-03 | 01 | 1 | SHELL-03 | unit | `npx vitest run src/components/app-shell/AppShell.test.tsx` | Wave 0 | pending |
| 03-02-01 | 02 | 1 | SHELL-04 | unit | `npx vitest run src/components/shared/ErrorBoundary.test.tsx` | Wave 0 | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] `src/src/components/app-shell/AppShell.test.tsx` — stubs for SHELL-01, SHELL-02, SHELL-03
- [ ] `src/src/components/shared/ErrorBoundary.test.tsx` — stubs for SHELL-04
- [ ] `src/src/components/sidebar/Sidebar.test.tsx` — sidebar header, collapse toggle
- [ ] `react-error-boundary` package install

*Existing Vitest + RTL infrastructure from Phase 2 covers framework setup.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| No document scrollbar at any viewport size | SHELL-02 | JSDOM doesn't compute real CSS layouts/overflow | Resize browser to various sizes (320px-1920px width, 400px-1200px height), verify no scrollbar appears |
| Sidebar responsive collapse below 768px | SHELL-01 | Media queries not evaluated in JSDOM | Open browser at <768px width, verify sidebar auto-hides |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
