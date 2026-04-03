---
phase: 75
slug: chat-shell
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-03
---

# Phase 75 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (web), jest (mobile via expo) |
| **Config file** | `mobile/jest.config.js` (if exists), `vitest.config.ts` (web) |
| **Quick run command** | `cd mobile && npx expo lint && npx tsc --noEmit` |
| **Full suite command** | `cd mobile && npx jest --passWithNoTests && cd .. && npx vite build` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd mobile && npx tsc --noEmit`
- **After every plan wave:** Run `cd mobile && npx expo lint && npx tsc --noEmit && cd .. && npx vite build`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| TBD | TBD | TBD | CHAT-01..12 | type-check + build | `npx tsc --noEmit && npx vite build` | TBD | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

*Note: Per-task map will be populated after PLAN.md files are created.*

---

## Wave 0 Requirements

- [ ] Verify `mobile/` TypeScript compiles clean (`npx tsc --noEmit`)
- [ ] Verify `npx vite build` succeeds (web app regression gate)
- [ ] Verify EAS build profile exists in `mobile/eas.json`

*Existing infrastructure covers core validation. No new test framework installation needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Streaming markdown renders without jank | CHAT-03 | Visual performance, 60fps requires device | Open session, send prompt, observe streaming render on iPhone |
| Tool chip status updates in-place | CHAT-04 | Visual animation timing | Trigger tool call, observe chip pending→running→done transition |
| Thinking block expand/collapse smooth | CHAT-05 | Reanimated animation quality | Observe auto-collapse on stream complete, re-expand on tap |
| Swipe-to-delete gesture feel | CHAT-11 | Gesture spring tuning | Swipe session item, check spring animation + undo toast |
| Keyboard avoidance matches system curve | CHAT-02 | System keyboard curve matching | Open composer, verify keyboard avoidance is smooth |
| Scroll position restoration | CHAT-07 | Stateful navigation | Switch between sessions, verify scroll offset preserved |
| Permission card glow/highlight | CHAT-12 | Visual attention design | Trigger permission request, verify card draws attention |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
