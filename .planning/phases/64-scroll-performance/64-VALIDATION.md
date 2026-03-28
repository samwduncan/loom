---
phase: 64
slug: scroll-performance
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-28
---

# Phase 64 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.18 |
| **Config file** | src/vite.config.ts (vitest config embedded) |
| **Quick run command** | `cd src && npx vitest run --reporter=verbose src/src/hooks/useChatScroll.test.ts` |
| **Full suite command** | `cd src && npx vitest run` |
| **Estimated runtime** | ~45 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd src && npx vitest run src/src/hooks/useChatScroll.test.ts -x`
- **After every plan wave:** Run `cd src && npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 45 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 64-01-01 | 01 | 1 | SCROLL-01 | unit | `cd src && npx vitest run src/src/hooks/useChatScroll.test.ts -x` | Wave 0 | ⬜ pending |
| 64-01-02 | 01 | 1 | SCROLL-02 | unit | Same as above | Wave 0 | ⬜ pending |
| 64-01-03 | 01 | 1 | SCROLL-03 | unit | Same as above | Wave 0 | ⬜ pending |
| 64-02-01 | 02 | 1 | SCROLL-04 | unit | `cd src && npx vitest run src/src/components/chat/composer/useAutoResize.test.ts -x` | Check existing | ⬜ pending |
| 64-02-02 | 02 | 1 | SCROLL-05 | unit | `cd src && npx vitest run src/src/components/chat/view/ActiveMessage.test.ts -x` | Check existing | ⬜ pending |
| 64-02-03 | 02 | 1 | SCROLL-06 | unit | Verify import errors if useScrollAnchor referenced | N/A (deletion) | ⬜ pending |
| 64-03-01 | 03 | 2 | SCROLL-07 | manual-only | Safari Web Inspector profiling | N/A | ⬜ pending |
| 64-03-02 | 03 | 2 | SCROLL-08 | unit | Part of useChatScroll.test.ts | Wave 0 | ⬜ pending |
| 64-03-03 | 03 | 2 | SCROLL-09 | manual-only | Physical device test | N/A | ⬜ pending |
| 64-03-04 | 03 | 2 | SCROLL-10 | manual-only | Safari Web Inspector performance monitor | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/src/hooks/useChatScroll.test.ts` — stubs for SCROLL-01, SCROLL-02, SCROLL-03, SCROLL-08
- [ ] Verify `src/e2e/scroll-anchor.spec.ts` still works after refactor (update selectors if needed)
- [ ] Check if `useAutoResize.test.ts` exists; create if not (for SCROLL-04)

*Existing infrastructure covers SCROLL-04, SCROLL-05 if test files exist.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Virtualization gate | SCROLL-07 | Requires real device profiling | Profile with Safari Web Inspector on iPhone 16 Pro Max: scroll 50+ message conversation, check <5% frame drops |
| Rubber band bounce | SCROLL-09 | Native iOS behavior, cannot simulate | On physical device: scroll past top/bottom of message list and session list, verify native rubber band bounce |
| 60fps validation | SCROLL-10 | Performance requires physical device | Safari Web Inspector → Performance monitor → scroll rapidly through 50+ messages → verify sustained 60fps |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 45s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
