---
phase: 14
slug: message-types
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-07
---

# Phase 14 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.18 |
| **Config file** | `src/vite.config.ts` (vitest config embedded) |
| **Quick run command** | `cd /home/swd/loom/src && npx vitest run --reporter=verbose` |
| **Full suite command** | `cd /home/swd/loom/src && npx vitest run` |
| **Estimated runtime** | ~8 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd /home/swd/loom/src && npx vitest run --reporter=verbose`
- **After every plan wave:** Run `cd /home/swd/loom/src && npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 14-01-01 | 01 | 1 | MSG-10 | unit | `npx vitest run src/src/components/chat/view/MessageContainer.test.tsx -x` | No - W0 | pending |
| 14-01-02 | 01 | 1 | MSG-03 | unit | `npx vitest run src/src/components/chat/view/ErrorMessage.test.tsx -x` | No - W0 | pending |
| 14-01-03 | 01 | 1 | MSG-04 | unit | `npx vitest run src/src/components/chat/view/SystemMessage.test.tsx -x` | No - W0 | pending |
| 14-01-04 | 01 | 1 | MSG-05 | unit | `npx vitest run src/src/components/chat/view/TaskNotificationMessage.test.tsx -x` | No - W0 | pending |
| 14-01-05 | 01 | 1 | MSG-11 | unit | `npx vitest run src/src/lib/transformMessages.test.ts -x` | Yes - update | pending |
| 14-02-01 | 02 | 1 | MSG-01 | unit | `npx vitest run src/src/components/chat/view/UserMessage.test.tsx -x` | No - W0 | pending |
| 14-02-02 | 02 | 1 | MSG-02 | unit | `npx vitest run src/src/components/chat/view/AssistantMessage.test.tsx -x` | No - W0 | pending |
| 14-02-03 | 02 | 1 | MSG-06, MSG-07 | unit | `npx vitest run src/src/components/chat/view/ThinkingDisclosure.test.tsx -x` | Yes - update | pending |
| 14-02-04 | 02 | 1 | MSG-08 | unit | `npx vitest run src/src/stores/ui.test.ts -x` | No - W0 | pending |
| 14-03-01 | 03 | 2 | MSG-09 | unit | `npx vitest run src/src/components/chat/view/ImageLightbox.test.tsx -x` | No - W0 | pending |
| 14-03-02 | 03 | 2 | MSG-09 | unit | `npx vitest run src/src/components/chat/view/ImageThumbnailGrid.test.tsx -x` | No - W0 | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] `src/src/components/chat/view/ErrorMessage.test.tsx` — stubs for MSG-03
- [ ] `src/src/components/chat/view/SystemMessage.test.tsx` — stubs for MSG-04
- [ ] `src/src/components/chat/view/TaskNotificationMessage.test.tsx` — stubs for MSG-05
- [ ] `src/src/components/chat/view/UserMessage.test.tsx` — stubs for MSG-01
- [ ] `src/src/components/chat/view/AssistantMessage.test.tsx` — stubs for MSG-02
- [ ] `src/src/components/chat/view/ImageLightbox.test.tsx` — stubs for MSG-09
- [ ] `src/src/components/chat/view/ImageThumbnailGrid.test.tsx` — stubs for MSG-09
- [ ] `src/src/stores/ui.test.ts` — stubs for MSG-08 (thinkingExpanded)
- [ ] Update `src/src/components/chat/view/ThinkingDisclosure.test.tsx` — update for MSG-06/07 prop refactor
- [ ] Update `src/src/lib/transformMessages.test.ts` — update for MSG-11 new entry type passthrough

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Hover timestamp appears without layout shift | MSG-01 | Visual: requires observing no CLS on hover | Hover user message, verify timestamp fades in without shifting messages below |
| CSS Grid expand/collapse animation smoothness | MSG-06 | Animation timing is visual | Click ThinkingDisclosure, verify smooth height transition |
| Lightbox overlay dark backdrop renders correctly | MSG-09 | Visual: backdrop opacity, image centering | Click image thumbnail, verify dark overlay with centered image |
| Historical messages look identical to streamed | MSG-11 | Visual parity check | Send message, reload page, compare visual appearance |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
