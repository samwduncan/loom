---
phase: 6
slug: streaming-engine-scroll-anchor
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-06
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.18 + React Testing Library 16.3.2 |
| **Config file** | `src/vite.config.ts` (test section) |
| **Quick run command** | `cd /home/swd/loom/src && npx vitest run --reporter=verbose` |
| **Full suite command** | `cd /home/swd/loom/src && npx vitest run --coverage` |
| **Estimated runtime** | ~8 seconds |

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
| 06-01-01 | 01 | 1 | STRM-03 | unit | `cd /home/swd/loom/src && npx vitest run src/hooks/useStreamBuffer.test.ts -x` | W0 | pending |
| 06-01-02 | 01 | 1 | STRM-03 | unit | `cd /home/swd/loom/src && npx vitest run src/hooks/useStreamBuffer.test.ts -x` | W0 | pending |
| 06-02-01 | 02 | 1 | COMP-02 | unit | `cd /home/swd/loom/src && npx vitest run src/components/chat/view/ActiveMessage.test.tsx -x` | W0 | pending |
| 06-02-02 | 02 | 1 | COMP-02 | unit | `cd /home/swd/loom/src && npx vitest run src/components/chat/view/ActiveMessage.test.tsx -x` | W0 | pending |
| 06-03-01 | 03 | 1 | COMP-03 | unit | `cd /home/swd/loom/src && npx vitest run src/hooks/useScrollAnchor.test.ts -x` | W0 | pending |
| 06-03-02 | 03 | 1 | COMP-03 | unit | `cd /home/swd/loom/src && npx vitest run src/hooks/useScrollAnchor.test.ts -x` | W0 | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] `src/hooks/useStreamBuffer.test.ts` — stubs for STRM-03 (token accumulation, rAF paint, flush, zero re-renders)
- [ ] `src/components/chat/view/ActiveMessage.test.tsx` — stubs for COMP-02 (render, cursor, finalization lifecycle)
- [ ] `src/hooks/useScrollAnchor.test.ts` — stubs for COMP-03 (auto-scroll, disengage, pill, re-engage)
- [ ] Mock for `wsClient.subscribeContent()` — shared fixture for simulating token streams
- [ ] Mock for `IntersectionObserver` — jsdom does not implement it natively
- [ ] Mock for `requestAnimationFrame` — jsdom implementation doesn't sync with rendering; use `vi.useFakeTimers()` or synchronous mock

*Existing infrastructure (Vitest, RTL, jest-dom) covers framework needs.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 60fps streaming render | STRM-03 | Performance profiling requires browser DevTools | 1. Start dev server 2. Trigger 2000-token stream 3. Open React DevTools Profiler 4. Verify zero re-renders on ActiveMessage 5. Check Performance tab for consistent 16ms frames |
| Scroll pill visual polish | COMP-03 | Visual appearance judgment | 1. During streaming, scroll up 2. Verify pill appears with slide-up animation 3. Click pill 4. Verify smooth scroll to bottom |
| Cursor blink + finalization fade | COMP-02 | CSS animation timing requires visual inspection | 1. During streaming, observe cursor blink rate (~530ms) 2. When stream ends, verify cursor + tint fade together over ~200ms 3. Verify no text jump on finalization |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
