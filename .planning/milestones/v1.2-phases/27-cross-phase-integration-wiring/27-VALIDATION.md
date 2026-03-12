---
phase: 27
slug: cross-phase-integration-wiring
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-12
---

# Phase 27 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `src/vite.config.ts` |
| **Quick run command** | `cd src && npx vitest run --reporter=verbose` |
| **Full suite command** | `cd src && npx vitest run --reporter=verbose` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd src && npx vitest run --reporter=verbose`
- **After every plan wave:** Run `cd src && npx vitest run --reporter=verbose`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 27-01-01 | 01 | 1 | ED-15, GIT-06 | unit + integration | `cd src && npx vitest run src/src/components/editor/DiffEditor.test.tsx` | ❌ W0 | ⬜ pending |
| 27-01-02 | 01 | 1 | FT-09 | unit | `cd src && npx vitest run src/src/components/file-tree/FileTreeContextMenu.test.tsx` | ❌ W0 | ⬜ pending |
| 27-01-03 | 01 | 1 | LAY-05, TERM-15 | unit | `cd src && npx vitest run src/src/hooks/useTabKeyboardShortcuts.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Test stubs for DiffEditor integration (ChangesView → DiffEditor flow)
- [ ] Test stubs for FileTreeContextMenu "Open in Terminal" item
- [ ] Test stubs for keyboard shortcut escape guard attributes

*Existing infrastructure covers framework setup — only test files need creation.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| DiffEditor renders side-by-side diff | ED-15 | CodeMirror merge view requires actual DOM | 1. Open git panel 2. Click changed file 3. Verify diff view appears |
| Cmd+K suppressed in terminal | TERM-15 | Keyboard events in terminal emulator are browser-specific | 1. Focus terminal 2. Press Cmd+K 3. Verify command palette does NOT open |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
