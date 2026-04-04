---
phase: 76
slug: push-notifications
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-04
---

# Phase 76 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (web/shared), jest (mobile — via jest-expo) |
| **Config file** | `vitest.config.ts` (web), `mobile/jest.config.js` (mobile — may need creation) |
| **Quick run command** | `npx vitest run --reporter=verbose` (shared), `cd mobile && npx jest --passWithNoTests` (mobile) |
| **Full suite command** | `npx vitest run && cd mobile && npx jest --passWithNoTests` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run quick command for the layer modified (server/mobile/shared)
- **After every plan wave:** Run full suite command
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 76-01-xx | 01 | 1 | PUSH-06 | unit | `npx vitest run server/` | ❌ W0 | ⬜ pending |
| 76-02-xx | 02 | 1 | PUSH-01, PUSH-02 | unit | `cd mobile && npx jest` | ❌ W0 | ⬜ pending |
| 76-03-xx | 03 | 2 | PUSH-03, PUSH-04 | unit | `cd mobile && npx jest` | ❌ W0 | ⬜ pending |
| 76-04-xx | 04 | 2 | PUSH-05 | unit | `cd mobile && npx jest` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `server/__tests__/push-service.test.js` — stubs for PushService (PUSH-06)
- [ ] `mobile/__tests__/useNotifications.test.ts` — stubs for notification hook (PUSH-01, PUSH-02)
- [ ] `mobile/__tests__/notification-settings.test.ts` — stubs for settings (PUSH-05)
- [ ] `expo-server-sdk` — install on server side
- [ ] `expo-notifications` — install on mobile side (may already be in dependencies)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Push notification delivery | PUSH-01 | Requires real APNs + physical device | Background app, trigger session complete, verify notification appears |
| Deep link from notification | PUSH-02 | Requires real notification tap on device | Tap notification, verify correct session opens |
| Permission approve/deny from notification | PUSH-03, PUSH-04 | Requires iOS notification actions on device | Trigger permission request while backgrounded, use action buttons |
| Cold-start deep link | PUSH-02 | Requires killing and relaunching app | Kill app, tap notification, verify session opens after auth |
| Notification batching | PUSH-01 | Requires multiple rapid session completions | Complete 3 sessions within 5s, verify single grouped notification |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
