---
phase: 18
slug: activity-scroll-polish
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-08
---

# Phase 18 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.18 + jsdom |
| **Config file** | `src/vite.config.ts` (vitest inline config) |
| **Quick run command** | `cd src && npx vitest run --reporter=verbose` |
| **Full suite command** | `cd src && npx vitest run --coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd src && npx vitest run --reporter=verbose`
- **After every plan wave:** Run `cd src && npx vitest run --coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 18-01-01 | 01 | 1 | ACT-01 | unit | `cd src && npx vitest run src/src/components/chat/view/StatusLine.test.tsx -x` | ❌ W0 | ⬜ pending |
| 18-01-02 | 01 | 1 | ACT-02 | unit | Same as ACT-01 | ❌ W0 | ⬜ pending |
| 18-01-03 | 01 | 1 | ACT-03 | unit | `cd src && npx vitest run src/src/lib/stream-multiplexer.test.ts -x` | ✅ extend | ⬜ pending |
| 18-01-04 | 01 | 1 | ACT-04 | unit | Covered by ChatView integration | ✅ extend | ⬜ pending |
| 18-01-05 | 01 | 1 | POL-02 | unit | `cd src && npx vitest run src/src/components/chat/view/StreamingCursor.test.tsx -x` | ❌ W0 | ⬜ pending |
| 18-02-01 | 02 | 2 | NAV-01 | unit | `cd src && npx vitest run src/src/hooks/useScrollAnchor.test.ts -x` | ❌ W0 | ⬜ pending |
| 18-02-02 | 02 | 2 | NAV-02 | manual | CSS property, jsdom limitation | N/A | ⬜ pending |
| 18-02-03 | 02 | 2 | NAV-03 | unit | `cd src && npx vitest run src/src/hooks/useScrollAnchor.test.ts -x` | ❌ W0 | ⬜ pending |
| 18-02-04 | 02 | 2 | NAV-04 | unit | `cd src && npx vitest run src/src/components/chat/view/ScrollToBottomPill.test.tsx -x` | ✅ extend | ⬜ pending |
| 18-03-01 | 03 | 2 | ACT-05 | unit | `cd src && npx vitest run src/src/components/chat/view/TokenUsage.test.tsx -x` | ❌ W0 | ⬜ pending |
| 18-03-02 | 03 | 2 | POL-01 | manual | Animation, jsdom limitation | N/A | ⬜ pending |
| 18-03-03 | 03 | 2 | DEP-06 | smoke | `cd src && node -e "require.resolve('tw-animate-css')"` | N/A | ⬜ pending |
| 18-03-04 | 03 | 2 | POL-03 | unit | Covered by ThinkingDisclosure.test.tsx | ✅ | ⬜ pending |
| 18-03-05 | 03 | 2 | POL-04 | lint | `cd src && npx eslint src/` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/src/components/chat/view/StatusLine.test.tsx` — stubs for ACT-01, ACT-02
- [ ] `src/src/components/chat/view/StreamingCursor.test.tsx` — stubs for POL-02
- [ ] `src/src/components/chat/view/TokenUsage.test.tsx` — stubs for ACT-05
- [ ] `src/src/hooks/useScrollAnchor.test.ts` — stubs for NAV-01, NAV-03
- [ ] Extend `src/src/components/chat/view/ScrollToBottomPill.test.tsx` — stubs for NAV-04 unread badge

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| content-visibility applied to past messages | NAV-02 | CSS property, jsdom doesn't support content-visibility | Open DevTools, inspect past message containers, verify `content-visibility: auto` and `contain-intrinsic-height: auto 200px` |
| Message entrance animations | POL-01 | CSS animations not observable in jsdom | Send a message, observe fade+slide animation. Switch sessions, verify no animation cascade. Check with prefers-reduced-motion enabled. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
