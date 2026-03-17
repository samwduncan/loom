---
phase: 34
slug: conversation-ux
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-17
---

# Phase 34 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x + @testing-library/react |
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
| 34-01-01 | 01 | 1 | UXR-01 | unit | `cd src && npx vitest run src/src/hooks/useAutoCollapse.test.ts -x` | ❌ W0 | ⬜ pending |
| 34-01-02 | 01 | 1 | UXR-02 | unit | `cd src && npx vitest run src/src/components/chat/view/CollapsibleMessage.test.tsx -x` | ❌ W0 | ⬜ pending |
| 34-02-01 | 02 | 1 | UXR-03 | unit | `cd src && npx vitest run src/src/components/chat/view/TokenUsage.test.tsx -x` | ❌ W0 | ⬜ pending |
| 34-02-02 | 02 | 1 | UXR-04 | unit | `cd src && npx vitest run src/src/components/chat/view/TokenUsage.test.tsx -x` | ❌ W0 | ⬜ pending |
| 34-02-03 | 02 | 1 | UXR-03 | unit | `cd src && npx vitest run src/src/lib/transformMessages.test.ts -x` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/src/hooks/useAutoCollapse.test.ts` — stubs for UXR-01, UXR-02
- [ ] `src/src/components/chat/view/CollapsibleMessage.test.tsx` — stubs for UXR-01, UXR-02
- [ ] `src/src/components/chat/view/TokenUsage.test.tsx` — stubs for UXR-03, UXR-04 (enhance existing if present)
- [ ] `src/src/lib/transformMessages.test.ts` — add result-entry extraction test cases (file exists)

*Existing infrastructure covers framework and config.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Scroll position doesn't jump on collapse | UXR-01 | Visual/perceptual, hard to assert in JSDOM | Scroll up 20+ messages, wait for collapse, verify no viewport shift |
| Usage footer doesn't dominate message visually | UXR-04 | Aesthetic judgment | Compare message content area vs footer in 5+ messages |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
