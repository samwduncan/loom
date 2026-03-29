---
phase: 67
slug: ios-native-gestures
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-29
---

# Phase 67 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.18 + jsdom + @testing-library/react 16.3.2 |
| **Config file** | `src/vite.config.ts` (test section) |
| **Quick run command** | `cd src && npx vitest run --reporter=verbose` |
| **Full suite command** | `cd src && npx vitest run` |
| **Estimated runtime** | ~45 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd src && npx vitest run --reporter=verbose`
- **After every plan wave:** Run `cd src && npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 67-01-01 | 01 | 1 | GESTURE-01 | unit | `cd src && npx vitest run src/hooks/useSwipeToDelete.test.ts -x` | ❌ W0 | ⬜ pending |
| 67-01-02 | 01 | 1 | GESTURE-02 | unit | `cd src && npx vitest run src/hooks/usePullToRefresh.test.ts -x` | ❌ W0 | ⬜ pending |
| 67-01-03 | 01 | 1 | GESTURE-03 | integration | `cd src && npx vitest run src/components/sidebar/SessionItem.test.tsx -x` | ❌ W0 | ⬜ pending |
| 67-02-01 | 02 | 1 | GESTURE-05 | unit | `cd src && npx vitest run src/lib/haptics.test.ts -x` | ❌ W0 | ⬜ pending |
| 67-02-02 | 02 | 1 | GESTURE-06 | integration | `cd src && npx vitest run src/components/chat/view/MessageContextMenu.test.tsx -x` | ❌ W0 | ⬜ pending |
| 67-03-01 | 03 | 2 | GESTURE-08 | unit | `cd src && npx vitest run src/hooks/useAppLifecycle.test.ts -x` | ❌ W0 | ⬜ pending |
| 67-03-02 | 03 | 2 | GESTURE-09 | unit | `cd src && npx vitest run src/lib/native-share.test.ts -x` | ❌ W0 | ⬜ pending |
| 67-03-03 | 03 | 2 | GESTURE-10 | unit | `cd src && npx vitest run src/lib/native-actions.test.ts -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/src/hooks/useSwipeToDelete.test.ts` — stubs for GESTURE-01
- [ ] `src/src/hooks/usePullToRefresh.test.ts` — stubs for GESTURE-02
- [ ] `src/src/hooks/useAppLifecycle.test.ts` — stubs for GESTURE-08
- [ ] `src/src/lib/native-share.test.ts` — stubs for GESTURE-09
- [ ] `src/src/lib/native-actions.test.ts` — stubs for GESTURE-10
- [ ] `src/src/lib/native-clipboard.test.ts` — stubs for GESTURE-06 clipboard
- [ ] `src/src/lib/haptics.test.ts` — extend existing for new haptic events (GESTURE-05)
- [ ] `src/src/components/chat/view/MessageContextMenu.test.tsx` — stubs for GESTURE-06
- [ ] `src/src/components/sidebar/SessionItem.test.tsx` — stubs for GESTURE-03

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Sidebar edge swipe still works | GESTURE-04 | Existing code, real device gesture only | Swipe from left edge on iPhone — sidebar opens/closes smoothly |
| Haptic feedback intensity correct | GESTURE-05 | Haptics cannot be sensed programmatically | Trigger each gesture on device, verify haptic type matches grammar |
| Pull-to-refresh feel natural | GESTURE-02 | Subjective feel, spring physics | Pull down on session list, verify proportional resistance and snap-back |
| Swipe velocity awareness | GESTURE-01 | Fast vs slow swipe feel difference | Slow swipe: proportional reveal. Fast swipe: auto-reveals delete |
| Native share sheet appears | GESTURE-09 | UIActivityViewController is native iOS | Long-press message → Share on device, verify iOS share sheet |
| Native action sheet appears | GESTURE-10 | ActionSheet is native iOS | Swipe to delete → confirm, verify iOS bottom sheet on device |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
