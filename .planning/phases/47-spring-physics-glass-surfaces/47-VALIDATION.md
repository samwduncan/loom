---
phase: 47
slug: spring-physics-glass-surfaces
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-19
---

# Phase 47 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.18 + jsdom |
| **Config file** | `src/vite.config.ts` (inline vitest config) |
| **Quick run command** | `cd src && npx vitest run --reporter=dot` |
| **Full suite command** | `cd src && npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd src && npx vitest run --reporter=dot`
- **After every plan wave:** Run `cd src && npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 47-01-01 | 01 | 1 | SPRING-01 | unit | `cd src && npx vitest run src/components/ui/dialog.test.tsx -x` | ❌ W0 | ⬜ pending |
| 47-01-02 | 01 | 1 | SPRING-02 | unit | `cd src && npx vitest run src/components/app-shell/AppShell.test.tsx -x` | ✅ add case | ⬜ pending |
| 47-01-03 | 01 | 1 | SPRING-03 | manual | Visual verification of CSS tokens | N/A | ⬜ pending |
| 47-01-04 | 01 | 1 | SPRING-04 | manual | Visual verification of CSS tokens | N/A | ⬜ pending |
| 47-01-05 | 01 | 1 | SPRING-05 | manual | Visual verification of CSS tokens | N/A | ⬜ pending |
| 47-02-01 | 02 | 1 | GLASS-01 | unit | `cd src && npx vitest run src/components/ui/dialog.test.tsx -x` | ❌ W0 | ⬜ pending |
| 47-02-02 | 02 | 1 | GLASS-02 | manual | Visual verification of CSS properties | N/A | ⬜ pending |
| 47-02-03 | 02 | 1 | GLASS-03 | unit | `cd src && npx vitest run src/components/ui/alert-dialog.test.tsx -x` | ❌ W0 | ⬜ pending |
| 47-02-04 | 02 | 1 | GLASS-04 | unit | Already covered by global base.css override | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/components/ui/dialog.test.tsx` — stubs for SPRING-01, GLASS-01
- [ ] `src/components/ui/alert-dialog.test.tsx` — stubs for GLASS-03
- [ ] Update `src/components/app-shell/AppShell.test.tsx` — add case for SPRING-02

*Note: SPRING-03/04/05 and GLASS-02 are pure CSS token swaps best verified visually per Constitution 6.4.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Tool card expand uses spring-snappy | SPRING-03 | CSS-only token swap, no JSX change | Open a tool card in chat, verify visible spring overshoot on expand |
| Command palette uses spring-gentle | SPRING-04 | CSS keyframe timing swap | Press Cmd+K, verify spring overshoot on palette entry |
| Scroll pill uses spring-bouncy | SPRING-05 | CSS-only token swap | Scroll up in long chat, verify pill bounces in |
| Command palette overlay has glass | GLASS-02 | CSS-only property addition | Press Cmd+K, verify blurred background visible through overlay |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
