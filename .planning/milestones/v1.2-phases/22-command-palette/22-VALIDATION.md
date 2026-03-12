---
phase: 22
slug: command-palette
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-10
---

# Phase 22 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x + @testing-library/react 16.x |
| **Config file** | `src/vite.config.ts` (vitest config section) |
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
| 22-01-01 | 01 | 1 | CMD-01 | unit | `npx vitest run src/components/command-palette/hooks/useCommandPaletteShortcut.test.ts -x` | ❌ W0 | ⬜ pending |
| 22-01-02 | 01 | 1 | CMD-02, CMD-03, CMD-04, CMD-05, CMD-12, CMD-13 | unit | `npx vitest run src/components/command-palette/CommandPalette.test.tsx -x` | ❌ W0 | ⬜ pending |
| 22-01-03 | 01 | 1 | CMD-07, CMD-08, CMD-10 | unit | `npx vitest run src/components/command-palette/hooks/useCommandSearch.test.ts -x` | ❌ W0 | ⬜ pending |
| 22-01-04 | 01 | 1 | CMD-14 | unit | `npx vitest run src/components/command-palette/hooks/useRecentCommands.test.ts -x` | ❌ W0 | ⬜ pending |
| 22-02-01 | 02 | 1 | CMD-06 | unit | `npx vitest run src/components/command-palette/groups/NavigationGroup.test.tsx -x` | ❌ W0 | ⬜ pending |
| 22-02-02 | 02 | 1 | CMD-09 | unit | `npx vitest run src/components/command-palette/groups/ActionGroup.test.tsx -x` | ❌ W0 | ⬜ pending |
| 22-02-03 | 02 | 1 | CMD-11 | unit | `npx vitest run src/components/command-palette/groups/CommandGroup.test.tsx -x` | ❌ W0 | ⬜ pending |
| 22-02-04 | 02 | 1 | CMD-15 | unit | `npx vitest run src/components/command-palette/groups/ProjectGroup.test.tsx -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Install cmdk and fuse.js: `cd /home/swd/loom/src && npm install cmdk fuse.js`
- [ ] `src/src/components/command-palette/CommandPalette.test.tsx` — stubs for CMD-02, CMD-03, CMD-04, CMD-05, CMD-12, CMD-13
- [ ] `src/src/components/command-palette/hooks/useCommandPaletteShortcut.test.ts` — stubs for CMD-01
- [ ] `src/src/components/command-palette/hooks/useCommandSearch.test.ts` — stubs for CMD-07, CMD-08, CMD-10
- [ ] `src/src/components/command-palette/hooks/useRecentCommands.test.ts` — stubs for CMD-14
- [ ] `src/src/components/command-palette/groups/NavigationGroup.test.tsx` — stubs for CMD-06
- [ ] `src/src/components/command-palette/groups/ActionGroup.test.tsx` — stubs for CMD-09
- [ ] `src/src/components/command-palette/groups/CommandGroup.test.tsx` — stubs for CMD-11
- [ ] `src/src/components/command-palette/groups/ProjectGroup.test.tsx` — stubs for CMD-15

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Backdrop blur visual quality | CMD-01 | Visual rendering | Open palette, verify blur effect on background |
| Z-index above Settings modal | CMD-02 | Stacking context visual | Open Settings, press Cmd+K, verify palette renders above |
| Keyboard shortcut hints display | CMD-12 | Visual layout | Open palette, verify shortcut badges render correctly |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
