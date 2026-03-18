---
phase: 45
slug: loading-error-empty-states
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-18
---

# Phase 45 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.18 + React Testing Library + jsdom |
| **Config file** | `src/vite.config.ts` (vitest config inline) |
| **Quick run command** | `cd src && npx vitest run --reporter=verbose` |
| **Full suite command** | `cd src && npx vitest run` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd src && npx vitest run --reporter=verbose`
- **After every plan wave:** Run `cd src && npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 45-01-01 | 01 | 1 | LOAD-01 | unit | `cd src && npx vitest run src/src/components/shared/Skeleton.test.tsx -x` | ❌ W0 | ⬜ pending |
| 45-01-02 | 01 | 1 | LOAD-02 | unit | `cd src && npx vitest run src/src/components/shared/InlineError.test.tsx -x` | ❌ W0 | ⬜ pending |
| 45-01-03 | 01 | 1 | EMPTY-01..04 | unit | `cd src && npx vitest run src/src/components/shared/EmptyState.test.tsx -x` | ❌ W0 | ⬜ pending |
| 45-02-01 | 02 | 2 | LOAD-01 | unit | `cd src && npx vitest run src/src/components/file-tree/FileTree.test.tsx -x` | ✅ | ⬜ pending |
| 45-02-02 | 02 | 2 | LOAD-01 | unit | `cd src && npx vitest run src/src/components/git/ChangesView.test.tsx -x` | ✅ | ⬜ pending |
| 45-02-03 | 02 | 2 | LOAD-03 | unit | `cd src && npx vitest run src/src/components/content-area/view/ContentArea.test.tsx -x` | ✅ | ⬜ pending |
| 45-02-04 | 02 | 2 | EMPTY-01 | unit | `cd src && npx vitest run src/src/components/file-tree/FileTree.test.tsx -x` | ✅ | ⬜ pending |
| 45-02-05 | 02 | 2 | EMPTY-02 | unit | `cd src && npx vitest run src/src/components/git/ChangesView.test.tsx src/src/components/git/HistoryView.test.tsx -x` | ✅ | ⬜ pending |
| 45-02-06 | 02 | 2 | EMPTY-03 | unit | `cd src && npx vitest run src/src/components/sidebar/SessionList.test.tsx -x` | ✅ | ⬜ pending |
| 45-02-07 | 02 | 2 | EMPTY-04 | unit | `cd src && npx vitest run src/src/components/command-palette/CommandPalette.test.tsx -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/src/components/shared/Skeleton.test.tsx` — stubs for LOAD-01 (Skeleton primitive renders shimmer class)
- [ ] `src/src/components/shared/InlineError.test.tsx` — stubs for LOAD-02 (InlineError renders message + retry button)
- [ ] `src/src/components/shared/EmptyState.test.tsx` — stubs for EMPTY-01 through EMPTY-04 (EmptyState renders icon/heading/description/action)
- [ ] `src/src/components/command-palette/CommandPalette.test.tsx` — stubs for EMPTY-04 (search "no results" state)

*Existing infrastructure covers most phase requirements. Wave 0 adds test files for the new shared primitives.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Shimmer animation direction (left-to-right) | LOAD-01 | CSS animation direction is visual | Inspect any skeleton in browser — shimmer should sweep left to right |
| Skeleton proportions match content layout | LOAD-01 | Layout fidelity is visual | Compare skeleton to loaded state — shapes should approximate real content |
| Empty state illustrations feel cohesive | EMPTY-01..04 | Aesthetic judgment | Review all 4 empty states side-by-side — consistent icon style, spacing, tone |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
