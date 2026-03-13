---
phase: 29
slug: session-hardening
status: draft
nyquist_compliant: false
wave_0_complete: false
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

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 29-01-01 | 01 | 1 | SESS-01 | unit | `cd src && npx vitest run src/hooks/usePaginatedMessages.test.ts -x` | ❌ W0 | ⬜ pending |
| 29-01-02 | 01 | 1 | SESS-01 | unit | `cd src && npx vitest run src/components/chat/view/MessageList.test.tsx -x` | ❌ W0 | ⬜ pending |
| 29-01-03 | 01 | 1 | SESS-01 | unit | `cd src && npx vitest run src/hooks/usePaginatedMessages.test.ts -x` | ❌ W0 | ⬜ pending |
| 29-02-01 | 02 | 1 | SESS-02 | unit | `cd src && npx vitest run src/components/sidebar/SessionItem.test.tsx -x` | ✅ (new tests) | ⬜ pending |
| 29-02-02 | 02 | 1 | SESS-02 | unit | `cd src && npx vitest run src/components/sidebar/SessionList.test.tsx -x` | ✅ (new tests) | ⬜ pending |
| 29-03-01 | 03 | 1 | SESS-03 | unit | `cd src && npx vitest run src/stores/timeline.test.ts -x` | ✅ (new tests) | ⬜ pending |
| 29-03-02 | 03 | 1 | SESS-03 | unit | `cd src && npx vitest run src/lib/websocket-init.test.ts -x` | ✅ (new tests) | ⬜ pending |
| 29-03-03 | 03 | 1 | SESS-03 | unit | `cd src && npx vitest run src/components/chat/composer/ChatComposer.test.tsx -x` | ✅ (new tests) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/src/hooks/usePaginatedMessages.test.ts` — stubs for SESS-01 pagination hook
- [ ] `src/src/components/chat/view/MessageList.test.tsx` — stubs for SESS-01 scroll behavior

*Existing test files need new test cases but no new file creation needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Scroll position preserved on 500+ msg prepend | SESS-01 | DOM scroll measurement hard to simulate in jsdom | Open a long conversation, scroll to middle, verify position stays stable as older messages load |
| Streaming pulse visible in sidebar | SESS-02 | Visual animation timing | Start streaming in one session, check sidebar shows pulse dot on that session |
| URL transitions stub→real without flash | SESS-03 | Browser URL bar + navigation integration | Send first message in new conversation, verify URL updates smoothly |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
