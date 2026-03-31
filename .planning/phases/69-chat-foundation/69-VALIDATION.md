---
phase: 69
slug: chat-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-31
---

# Phase 69 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (shared + web), manual device testing (mobile) |
| **Config file** | `vitest.config.ts` (web), `mobile/` has no test framework yet |
| **Quick run command** | `npx vitest run --reporter=verbose 2>&1 \| tail -5` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds (existing 1548 tests) |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose 2>&1 | tail -5`
- **After every plan wave:** Run `npx vitest run` + manual device check on iOS
- **Before `/gsd:verify-work`:** Full suite must be green + device validation
- **Max feedback latency:** 20 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 69-01-xx | 01 | 1 | CHAT-01 | device | Manual: streamdown vs custom renderer PoC | N/A | ⬜ pending |
| 69-02-xx | 02 | 1 | CHAT-09,10 | integration | `npx vitest run` (shared store tests) | ✅ | ⬜ pending |
| 69-03-xx | 03 | 2 | CHAT-02 | device | Manual: session list + drawer navigation | N/A | ⬜ pending |
| 69-04-xx | 04 | 2 | CHAT-03,04 | device | Manual: send message, see streaming response | N/A | ⬜ pending |
| 69-05-xx | 05 | 3 | CHAT-11 | device | Manual: background/foreground reconnect | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Verify existing 1548 tests still pass (regression gate)
- [ ] Verify `vite build` succeeds (web regression gate)
- [ ] Verify `npx expo start` launches without errors (mobile baseline)

*Existing infrastructure covers web regression. Mobile testing is device-based (no automated mobile test framework in Phase 69 scope).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Streaming markdown renders correctly | CHAT-01 | React Native rendering requires visual inspection | Send multi-format message (headings, lists, code blocks, bold/italic), verify all render correctly |
| Spring physics feel correct | CHAT-04 | Subjective motion quality | Tap buttons, open drawer, scroll — verify springs match Soul doc configs |
| Dynamic color shifts during streaming | CHAT-04 | Visual color transition | Send message, observe background warmth shift during streaming |
| Keyboard sync with composer | CHAT-03 | iOS keyboard animation sync | Tap composer, verify keyboard + composer move as one unit |
| Session list swipe-to-delete | CHAT-02 | Gesture interaction | Swipe session left, verify destructive action surface appears |
| Connection banner on disconnect | CHAT-11 | Network state change | Toggle airplane mode, verify banner slides down with spring |
| AppState reconnection | CHAT-11 | iOS lifecycle | Background app for 30s+, return, verify auto-reconnect |
| Glass blur on composer | CHAT-04 | Visual effect | Scroll content behind composer, verify blur effect visible |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 20s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
