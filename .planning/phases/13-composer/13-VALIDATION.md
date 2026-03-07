---
phase: 13
slug: composer
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-07
---

# Phase 13 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest + @testing-library/react |
| **Config file** | `src/vite.config.ts` (test section) |
| **Quick run command** | `cd /home/swd/loom/src && npx vitest run --reporter=verbose` |
| **Full suite command** | `cd /home/swd/loom/src && npx vitest run --coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd /home/swd/loom/src && npx vitest run --reporter=verbose`
- **After every plan wave:** Run `cd /home/swd/loom/src && npx vitest run --coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 13-01-01 | 01 | 1 | CMP-01 | unit | `npx vitest run src/components/chat/composer/useAutoResize.test.ts -x` | W0 | pending |
| 13-01-02 | 01 | 1 | CMP-02 | unit | `npx vitest run src/components/chat/composer/useAutoResize.test.ts -x` | W0 | pending |
| 13-01-03 | 01 | 1 | CMP-05 | unit | `npx vitest run src/components/chat/composer/useComposerState.test.ts -x` | W0 | pending |
| 13-01-04 | 01 | 1 | CMP-03 | unit | `npx vitest run src/components/chat/composer/ChatComposer.test.tsx -x` | W0 | pending |
| 13-01-05 | 01 | 1 | CMP-04 | unit | `npx vitest run src/components/chat/composer/ChatComposer.test.tsx -x` | W0 | pending |
| 13-01-06 | 01 | 1 | CMP-06 | unit | `npx vitest run src/components/chat/composer/ChatComposer.test.tsx -x` | W0 | pending |
| 13-01-07 | 01 | 1 | CMP-11 | unit | `npx vitest run src/components/chat/composer/ChatComposer.test.tsx -x` | W0 | pending |
| 13-01-08 | 01 | 1 | CMP-13 | manual | N/A | N/A | pending |
| 13-01-09 | 01 | 1 | CMP-14 | unit | `npx vitest run src/components/chat/composer/ChatComposer.test.tsx -x` | W0 | pending |
| 13-02-01 | 02 | 1 | CMP-07 | unit | `npx vitest run src/components/chat/composer/useImageAttachments.test.ts -x` | W0 | pending |
| 13-02-02 | 02 | 1 | CMP-08 | unit | `npx vitest run src/components/chat/composer/useImageAttachments.test.ts -x` | W0 | pending |
| 13-02-03 | 02 | 1 | CMP-09 | unit | `npx vitest run src/components/chat/composer/useImageAttachments.test.ts -x` | W0 | pending |
| 13-02-04 | 02 | 1 | CMP-10 | integration | `npx vitest run src/components/chat/composer/ChatComposer.test.tsx -x` | W0 | pending |
| 13-03-01 | 03 | 2 | CMP-12 | unit | `npx vitest run src/components/chat/composer/useDraftPersistence.test.ts -x` | W0 | pending |

*Status: pending · green · red · flaky*

---

## Wave 0 Requirements

- [ ] `src/components/chat/composer/useAutoResize.test.ts` — stubs for CMP-01, CMP-02
- [ ] `src/components/chat/composer/useComposerState.test.ts` — stubs for CMP-05
- [ ] `src/components/chat/composer/useImageAttachments.test.ts` — stubs for CMP-07, CMP-08, CMP-09
- [ ] `src/components/chat/composer/useDraftPersistence.test.ts` — stubs for CMP-12
- [ ] `src/components/chat/composer/ChatComposer.test.tsx` — stubs for CMP-03, CMP-04, CMP-06, CMP-10, CMP-11, CMP-14

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| CSS Grid scroll stability on composer resize | CMP-13 | Requires visual inspection of scroll behavior during textarea height change | 1. Open chat with 50+ messages 2. Type multiline text (5+ lines) 3. Verify messages don't jump 4. Delete text back to 1 line 5. Verify scroll position preserved |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
