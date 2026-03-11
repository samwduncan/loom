---
phase: 26
slug: git-panel-navigation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-11
---

# Phase 26 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.x + @testing-library/react |
| **Config file** | src/vite.config.ts (vitest section) |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 26-01-01 | 01 | 1 | GIT-01 | unit | `npx vitest run src/hooks/useGitStatus.test.ts` | ❌ W0 | ⬜ pending |
| 26-01-02 | 01 | 1 | GIT-02 | unit | `npx vitest run src/components/git/FileChanges.test.tsx` | ❌ W0 | ⬜ pending |
| 26-01-03 | 01 | 1 | GIT-03 | unit | `npx vitest run src/components/git/CommitForm.test.tsx` | ❌ W0 | ⬜ pending |
| 26-02-01 | 02 | 1 | GIT-07 | unit | `npx vitest run src/components/git/BranchSelector.test.tsx` | ❌ W0 | ⬜ pending |
| 26-02-02 | 02 | 1 | GIT-10 | unit | `npx vitest run src/hooks/useGitBranches.test.ts` | ❌ W0 | ⬜ pending |
| 26-03-01 | 03 | 2 | GIT-15 | unit | `npx vitest run src/components/git/CommitHistory.test.tsx` | ❌ W0 | ⬜ pending |
| 26-03-02 | 03 | 2 | NAV-01 | unit | `npx vitest run src/components/sidebar/SessionItem.test.tsx` | ❌ W0 | ⬜ pending |
| 26-03-03 | 03 | 2 | NAV-02 | unit | `npx vitest run src/components/sidebar/SessionItem.test.tsx` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements. Vitest + testing-library already configured from prior phases.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Git diff renders in DiffEditor | GIT-14 | CodeMirror rendering needs real DOM | Click changed file, verify diff highlights |
| Push/pull/fetch with remote | GIT-10, GIT-11, GIT-12 | Requires real git remote | Run fetch/pull/push buttons, check server response |
| Session rename inline edit UX | NAV-01 | Double-click interaction, inline contentEditable | Double-click session name, type new name, press Enter |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
