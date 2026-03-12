---
phase: 24
slug: code-editor
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-10
---

# Phase 24 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.18 + @testing-library/react |
| **Config file** | `src/vite.config.ts` (vitest section) |
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
| 24-01-01 | 01 | 1 | ED-01, ED-03, ED-04 | unit/integration | `cd src && npx vitest run src/src/components/editor/CodeEditor.test.tsx -x` | ❌ W0 | ⬜ pending |
| 24-01-02 | 01 | 1 | ED-03 | unit | `cd src && npx vitest run src/src/components/editor/loom-dark-theme.test.ts -x` | ❌ W0 | ⬜ pending |
| 24-02-01 | 02 | 1 | ED-05, ED-08, ED-09, ED-10, ED-11 | integration | `cd src && npx vitest run src/src/components/editor/EditorTabs.test.tsx -x` | ❌ W0 | ⬜ pending |
| 24-02-02 | 02 | 1 | ED-06, ED-07 | integration | `cd src && npx vitest run src/src/hooks/useFileSave.test.ts -x` | ❌ W0 | ⬜ pending |
| 24-02-03 | 02 | 1 | ED-18 | unit | `cd src && npx vitest run src/src/components/editor/BinaryPlaceholder.test.tsx -x` | ❌ W0 | ⬜ pending |
| 24-02-04 | 02 | 1 | ED-19 | unit | `cd src && npx vitest run src/src/components/editor/LargeFileWarning.test.tsx -x` | ❌ W0 | ⬜ pending |
| 24-02-05 | 02 | 1 | ED-20 | unit | `cd src && npx vitest run src/src/components/editor/EditorBreadcrumb.test.tsx -x` | ❌ W0 | ⬜ pending |
| 24-03-01 | 03 | 2 | ED-16 | integration | `cd src && npx vitest run src/src/components/chat/tools/ReadToolCard.test.tsx -x` | ❌ W0 | ⬜ pending |
| 24-03-02 | 03 | 2 | ED-14, ED-15 | integration | `cd src && npx vitest run src/src/components/editor/DiffEditor.test.tsx -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/src/components/editor/CodeEditor.test.tsx` — stubs for ED-01, ED-04, ED-12, ED-13, ED-17
- [ ] `src/src/components/editor/EditorTabs.test.tsx` — stubs for ED-05, ED-08, ED-09, ED-10, ED-11
- [ ] `src/src/components/editor/EditorBreadcrumb.test.tsx` — stubs for ED-20
- [ ] `src/src/components/editor/BinaryPlaceholder.test.tsx` — stubs for ED-18
- [ ] `src/src/components/editor/LargeFileWarning.test.tsx` — stubs for ED-19
- [ ] `src/src/components/editor/loom-dark-theme.test.ts` — stubs for ED-03
- [ ] `src/src/hooks/useFileContent.test.ts` — stubs for fetch, binary, size guard
- [ ] `src/src/hooks/useFileSave.test.ts` — stubs for ED-06, ED-07
- [ ] `src/src/components/editor/DiffEditor.test.tsx` — stubs for ED-14, ED-15

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Syntax highlighting visual correctness | ED-01, ED-03 | Visual rendering requires human eye | Open .ts, .py, .json files and verify colors match OKLCH theme tokens |
| Cmd+S intercepts browser save | ED-06 | Browser key handling differs by OS | Press Cmd+S in editor, verify file saves (not browser dialog) |
| CodeMirror search overlay UX | ED-12 | Visual overlay layout in CM6 | Press Cmd+F, verify search panel appears within editor bounds |
| Diff view visual layout | ED-14 | Side-by-side rendering fidelity | Open diff view, verify old/new content renders correctly |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
