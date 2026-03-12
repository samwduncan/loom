---
phase: 25
slug: terminal
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-11
---

# Phase 25 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.18 + jsdom + @testing-library/react |
| **Config file** | `src/vite.config.ts` (test section) |
| **Quick run command** | `cd src && npx vitest run --reporter=verbose` |
| **Full suite command** | `cd src && npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd src && npx vitest run --reporter=verbose`
- **After every plan wave:** Run `cd src && npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 25-01-01 | 01 | 1 | TERM-14 | unit | `cd src && npx vitest run src/components/terminal/terminal-theme.test.ts -x` | ❌ W0 | ⬜ pending |
| 25-01-02 | 01 | 1 | TERM-02 | unit | `cd src && npx vitest run src/hooks/useShellWebSocket.test.ts -x` | ❌ W0 | ⬜ pending |
| 25-01-03 | 01 | 1 | TERM-06, TERM-07 | unit | `cd src && npx vitest run src/hooks/useShellWebSocket.test.ts -x` | ❌ W0 | ⬜ pending |
| 25-01-04 | 01 | 1 | TERM-08, TERM-12 | unit | `cd src && npx vitest run src/hooks/useShellWebSocket.test.ts -x` | ❌ W0 | ⬜ pending |
| 25-02-01 | 02 | 2 | TERM-01 | unit | `cd src && npx vitest run src/components/terminal/TerminalView.test.tsx -x` | ❌ W0 | ⬜ pending |
| 25-02-02 | 02 | 2 | TERM-03, TERM-04 | unit | `cd src && npx vitest run src/components/terminal/TerminalView.test.tsx -x` | ❌ W0 | ⬜ pending |
| 25-02-03 | 02 | 2 | TERM-05, TERM-09 | unit | `cd src && npx vitest run src/components/terminal/TerminalHeader.test.tsx -x` | ❌ W0 | ⬜ pending |
| 25-02-04 | 02 | 2 | TERM-13 | unit | `cd src && npx vitest run src/components/terminal/TerminalOverlay.test.tsx -x` | ❌ W0 | ⬜ pending |
| 25-02-05 | 02 | 2 | TERM-10, TERM-11 | unit | `cd src && npx vitest run src/components/content-area/view/ContentArea.test.tsx -x` | ✅ (update) | ⬜ pending |
| 25-02-06 | 02 | 2 | TERM-15 | manual | N/A — requires real clipboard API | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/src/components/terminal/TerminalView.test.tsx` — stubs for TERM-01, TERM-03, TERM-04
- [ ] `src/src/components/terminal/TerminalHeader.test.tsx` — stubs for TERM-05, TERM-09
- [ ] `src/src/components/terminal/TerminalOverlay.test.tsx` — stubs for TERM-13
- [ ] `src/src/components/terminal/terminal-theme.test.ts` — stubs for TERM-14
- [ ] `src/src/hooks/useShellWebSocket.test.ts` — stubs for TERM-02, TERM-06, TERM-07, TERM-08, TERM-12
- [ ] Mock for `@xterm/xterm` Terminal class (shared fixture)

*Existing infrastructure covers test runner and config.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Copy/paste via Cmd+C/V | TERM-15 | Clipboard API requires real browser context | 1. Open Shell tab 2. Run `echo "test text"` 3. Select output with mouse 4. Cmd+C to copy 5. Click in terminal 6. Cmd+V to paste 7. Verify pasted text appears |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
