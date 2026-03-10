---
phase: 23
slug: file-tree-file-store
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-10
---

# Phase 23 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest + @testing-library/react |
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
| 23-01-01 | 01 | 1 | FT-03 | unit | `cd src && npx vitest run src/src/stores/file.test.ts -x` | ❌ W0 | ⬜ pending |
| 23-01-02 | 01 | 1 | FT-01 | unit | `cd src && npx vitest run src/src/components/file-tree/FileTreePanel.test.tsx -x` | ❌ W0 | ⬜ pending |
| 23-01-03 | 01 | 1 | FT-16 | integration | `cd src && npx vitest run src/src/hooks/useFileTree.test.ts -x` | ❌ W0 | ⬜ pending |
| 23-02-01 | 02 | 1 | FT-02, FT-05 | unit | `cd src && npx vitest run src/src/components/file-tree/FileNode.test.tsx -x` | ❌ W0 | ⬜ pending |
| 23-02-02 | 02 | 1 | FT-06, FT-07 | unit | `cd src && npx vitest run src/src/components/file-tree/FileNode.test.tsx -x` | ❌ W0 | ⬜ pending |
| 23-02-03 | 02 | 1 | FT-08, FT-12, FT-13, FT-15 | unit | `cd src && npx vitest run src/src/components/file-tree/FileTree.test.tsx -x` | ❌ W0 | ⬜ pending |
| 23-03-01 | 03 | 2 | FT-09, FT-10 | unit | `cd src && npx vitest run src/src/components/file-tree/FileTreeContextMenu.test.tsx -x` | ❌ W0 | ⬜ pending |
| 23-03-02 | 03 | 2 | FT-11 | unit | `cd src && npx vitest run src/src/components/file-tree/ImagePreview.test.tsx -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/src/stores/file.test.ts` — test all store actions (toggleDir, openFile, closeFile, setDirty, setActiveFile, selectPath)
- [ ] `src/src/hooks/useFileTree.test.ts` — test fetch, error, retry, WebSocket refresh
- [ ] `src/src/components/file-tree/FileTreePanel.test.tsx` — split layout rendering
- [ ] `src/src/components/file-tree/FileNode.test.tsx` — indentation, icons, click handlers, active highlight
- [ ] `src/src/components/file-tree/FileTree.test.tsx` — loading/error/search/filter states
- [ ] `src/src/components/file-tree/FileIcon.test.tsx` — extension-to-icon mapping
- [ ] `src/src/components/file-tree/FileTreeContextMenu.test.tsx` — menu actions for files and directories
- [ ] `src/src/components/file-tree/ImagePreview.test.tsx` — lightbox for image files

*Existing infrastructure covers test framework setup.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Tree visual hierarchy & indentation looks correct | FT-02 | Visual rendering quality | Inspect file tree with 3+ nesting levels, verify indentation is visible and proportional |
| Context menu positioning near panel edges | FT-09, FT-10 | Radix portal positioning | Right-click file near bottom/right edge of tree, verify menu doesn't clip |
| Image lightbox visual quality | FT-11 | Visual rendering | Click .png file, verify lightbox shows image at natural size with backdrop |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
