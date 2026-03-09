---
phase: 12
slug: streaming-markdown-marker-interleaving
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-07
---

# Phase 12 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | src/vite.config.ts |
| **Quick run command** | `cd src && npx vitest run --reporter=verbose` |
| **Full suite command** | `cd src && npx vitest run --reporter=verbose --coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd src && npx vitest run --reporter=verbose`
- **After every plan wave:** Run `cd src && npx vitest run --reporter=verbose --coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 12-01-01 | 01 | 1 | MD-10 | unit | `cd src && npx vitest run src/src/lib/__tests__/streaming-converter.test.ts` | W0 | pending |
| 12-01-02 | 01 | 1 | MD-11 | unit | `cd src && npx vitest run src/src/lib/__tests__/streaming-converter.test.ts` | W0 | pending |
| 12-02-01 | 02 | 1 | MD-12 | unit | `cd src && npx vitest run src/src/lib/__tests__/rehype-tool-markers.test.ts` | W0 | pending |
| 12-02-02 | 02 | 1 | MD-13 | visual | Manual crossfade inspection | N/A | pending |
| 12-03-01 | 03 | 2 | MD-14, MD-15 | unit+visual | `cd src && npx vitest run src/src/lib/__tests__/streamdown-eval.test.ts` | W0 | pending |
| 12-03-02 | 03 | 2 | ENH-01 | integration | `cd src && npx vitest run --reporter=verbose` | W0 | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] `src/src/lib/__tests__/streaming-converter.test.ts` — stubs for MD-10, MD-11 (streaming formatting, code fence handling)
- [ ] `src/src/lib/__tests__/rehype-tool-markers.test.ts` — stubs for MD-12 (marker replacement in hast tree)
- [ ] `src/src/lib/__tests__/streamdown-eval.test.ts` — stubs for MD-14, MD-15 (evaluation test fixtures)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Crossfade smoothness (no flash/jump) | MD-13 | Visual perception, timing-sensitive | Stream a long message, observe transition from streaming to finalized. No layout jump, opacity crossfade over ~250ms. |
| 60fps streaming rendering | MD-10 | Performance metric | Open DevTools Performance tab, stream a message with bold/italic/code, verify no frames >16ms in rAF paint loop. |
| Tool chip inline position | MD-12 | Visual layout verification | Send a message that triggers tools mid-conversation, verify chips appear between correct paragraphs in finalized view. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
