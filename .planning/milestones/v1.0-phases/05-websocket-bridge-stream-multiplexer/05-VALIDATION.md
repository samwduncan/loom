---
phase: 5
slug: websocket-bridge-stream-multiplexer
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-06
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x + jsdom |
| **Config file** | `src/vite.config.ts` (test block) |
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
| 05-01-01 | 01 | 1 | STRM-01 | unit | `cd /home/swd/loom/src && npx vitest run src/lib/auth.test.ts -x` | ❌ W0 | ⬜ pending |
| 05-01-02 | 01 | 1 | STRM-01 | unit | `cd /home/swd/loom/src && npx vitest run src/types/websocket.test.ts -x` | ❌ W0 | ⬜ pending |
| 05-01-03 | 01 | 1 | STRM-01 | unit | `cd /home/swd/loom/src && npx vitest run src/lib/websocket-client.test.ts -x` | ❌ W0 | ⬜ pending |
| 05-02-01 | 02 | 1 | STRM-02 | unit | `cd /home/swd/loom/src && npx vitest run src/lib/stream-multiplexer.test.ts -x` | ❌ W0 | ⬜ pending |
| 05-02-02 | 02 | 1 | STRM-02 | unit | `cd /home/swd/loom/src && npx vitest run src/lib/stream-multiplexer.test.ts -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/auth.test.ts` — stubs for STRM-01 (auth bootstrapping, token storage/retrieval)
- [ ] `src/types/websocket.test.ts` — stubs for STRM-01 (type guard functions, exhaustive type coverage)
- [ ] `src/lib/websocket-client.test.ts` — stubs for STRM-01 (connection state machine, reconnection, message dispatch)
- [ ] `src/lib/stream-multiplexer.test.ts` — stubs for STRM-02 (content/thinking/tool routing, unknown types, permission auto-allow)

*Existing infrastructure covers framework setup (Vitest, jsdom, coverage thresholds from Phase 2).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| WS connects to live backend | STRM-01 | Requires running backend server | Start backend, start dev server, open browser console, verify "connected" status in connection store |
| Streaming response from real prompt | STRM-02 | Requires running Claude session | Send hardcoded prompt, observe console logs for parsed message types |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
