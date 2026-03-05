---
phase: 2
slug: enforcement-testing-infrastructure
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-05
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x |
| **Config file** | `src/vite.config.ts` (test block) |
| **Quick run command** | `cd src && npx vitest run --reporter=dot` |
| **Full suite command** | `cd src && npx vitest run --coverage && npx eslint src/ && npx tsc -b --noEmit` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd src && npx vitest run --reporter=dot`
- **After every plan wave:** Run `cd src && npx vitest run --coverage && npx eslint src/ && npx tsc -b --noEmit`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | ENF-01 | unit | `cd src && npx eslint src/ --max-warnings=0` | N/A (lint) | ⬜ pending |
| 02-01-02 | 01 | 1 | ENF-01 | unit | `cd src && npx vitest run eslint-rules/` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 1 | ENF-02 | typecheck | `cd src && npx tsc -b --noEmit` | N/A (compiler) | ⬜ pending |
| 02-02-02 | 02 | 1 | ENF-03 | unit | `cd src && npx vitest run --coverage` | ❌ W0 | ⬜ pending |
| 02-03-01 | 03 | 2 | ENF-04 | integration | Attempt `git commit` with banned pattern | ❌ Manual | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/vitest-setup.ts` — jest-dom imports, cleanup
- [ ] Vitest config in `src/vite.config.ts` (test block)
- [ ] `src/src/utils/cn.test.ts` — cn utility tests
- [ ] `src/src/lib/motion.test.ts` — motion constants tests
- [ ] `src/src/styles/tokens.test.ts` — token CSS loading tests
- [ ] `src/src/components/dev/TokenPreview.test.tsx` — component render test
- [ ] `src/eslint-rules/` directory with all custom rules
- [ ] `.husky/pre-commit` hook script
- [ ] lint-staged config in `src/package.json`
- [ ] npm install for all dev dependencies

*Framework installation is part of Wave 0 (Plan 02).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Pre-commit hook blocks bad code | ENF-04 | Requires actual git commit attempt | Stage a file with `bg-gray-800`, run `git commit`, verify rejection |
| Non-src commits skip hooks | ENF-04 | Requires commit of non-src file | Stage a `.planning/` file, run `git commit`, verify it passes without frontend checks |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
