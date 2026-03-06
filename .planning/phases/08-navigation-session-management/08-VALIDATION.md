---
phase: 8
slug: navigation-session-management
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-06
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x + React Testing Library 16.x |
| **Config file** | `src/vite.config.ts` (test section) |
| **Quick run command** | `cd /home/swd/loom/src && npx vitest run --reporter=verbose` |
| **Full suite command** | `cd /home/swd/loom/src && npm run test` |
| **Estimated runtime** | ~8 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd /home/swd/loom/src && npx vitest run --reporter=verbose`
- **After every plan wave:** Run `cd /home/swd/loom/src && npm run test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 08-01-01 | 01 | 1 | NAV-01 | unit | `npx vitest run src/src/components/sidebar/SessionList.test.tsx -x` | Wave 0 | pending |
| 08-01-02 | 01 | 1 | NAV-01 | unit | `npx vitest run src/src/components/sidebar/SessionItem.test.tsx -x` | Wave 0 | pending |
| 08-01-03 | 01 | 1 | NAV-01 | unit | `npx vitest run src/src/components/sidebar/Sidebar.test.tsx -x` | Exists | pending |
| 08-01-04 | 01 | 1 | NAV-01 | unit | `npx vitest run src/src/hooks/useSessionList.test.ts -x` | Wave 0 | pending |
| 08-01-05 | 01 | 1 | NAV-01 | unit | `npx vitest run src/src/lib/formatTime.test.ts -x` | Wave 0 | pending |
| 08-01-06 | 01 | 1 | NAV-01 | unit | `npx vitest run src/src/lib/api-client.test.ts -x` | Wave 0 | pending |
| 08-02-01 | 02 | 1 | NAV-02 | unit | `npx vitest run src/src/hooks/useSessionSwitch.test.ts -x` | Wave 0 | pending |
| 08-02-02 | 02 | 1 | NAV-02 | unit | `npx vitest run src/src/components/chat/view/ChatView.test.tsx -x` | Wave 0 | pending |
| 08-02-03 | 02 | 1 | NAV-02 | unit | `npx vitest run src/src/lib/transformMessages.test.ts -x` | Wave 0 | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] `src/src/components/sidebar/SessionList.test.tsx` — date grouping, session rendering (NAV-01)
- [ ] `src/src/components/sidebar/SessionItem.test.tsx` — item display, click handler (NAV-01)
- [ ] `src/src/hooks/useSessionList.test.ts` — fetch, WebSocket refresh (NAV-01)
- [ ] `src/src/hooks/useSessionSwitch.test.ts` — fetch, abort, URL update (NAV-02)
- [ ] `src/src/components/chat/view/ChatView.test.tsx` — message display, skeleton, composer (NAV-02)
- [ ] `src/src/lib/transformMessages.test.ts` — backend -> frontend type mapping (NAV-02)
- [ ] `src/src/lib/formatTime.test.ts` — relative time formatting (NAV-01)
- [ ] `src/src/lib/api-client.test.ts` — auth header injection, error handling (NAV-01, NAV-02)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Sticky date group headers pin during scroll | NAV-01 | CSS `position: sticky` behavior depends on scroll container geometry | Scroll sidebar with 20+ sessions, verify group headers stick to top |
| Shimmer skeleton animation renders smoothly | NAV-02 | Animation smoothness is perceptual, not testable | Navigate to session, observe skeleton gradient sweep during message fetch |
| Active session left border is visually distinct | NAV-01 | 3px accent border is a visual quality check | Click different sessions, verify dusty-rose left border on active item |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
