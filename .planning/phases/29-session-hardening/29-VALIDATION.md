---
phase: 29
slug: session-hardening
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-13
---

# Phase 29 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest + jsdom |
| **Config file** | `src/vite.config.ts` (vitest section) |
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

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------|-------------------|--------|
| 29-01-01 | 01 | 1 | SESS-02,SESS-03 | unit | `cd src && npx vitest run src/stores/timeline.test.ts src/lib/websocket-init.test.ts -x` | pending |
| 29-01-02 | 01 | 1 | SESS-02 | unit | `cd src && npx vitest run src/components/sidebar/SessionItem.test.tsx src/components/sidebar/SessionList.test.tsx -x` | pending |
| 29-02-01 | 02 | 2 | SESS-01 | unit (TDD inline) | `cd src && npx vitest run src/hooks/usePaginatedMessages.test.ts -x` | pending |
| 29-02-02 | 02 | 2 | SESS-01 | unit | `cd src && npx vitest run src/components/chat/view/MessageList.test.tsx -x` | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

No Wave 0 tasks needed. All test files are created inline within their respective TDD tasks:

- `src/src/hooks/usePaginatedMessages.test.ts` — created in Plan 02 Task 1 (tdd="true")
- `src/src/components/chat/view/MessageList.test.tsx` — created in Plan 02 Task 2

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Scroll position preserved on 500+ msg prepend | SESS-01 | DOM scroll measurement hard to simulate in jsdom | Open a long conversation, scroll to middle, verify position stays stable as older messages load |
| Streaming pulse visible in sidebar | SESS-02 | Visual animation timing | Start streaming in one session, check sidebar shows pulse dot on that session |
| URL transitions stub to real without flash | SESS-03 | Browser URL bar + navigation integration | Send first message in new conversation, verify URL updates smoothly |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or TDD-inline test creation
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] No Wave 0 gaps (tests created inline per TDD pattern)
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
