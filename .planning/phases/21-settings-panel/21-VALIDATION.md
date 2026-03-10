---
phase: 21
slug: settings-panel
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-10
---

# Phase 21 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.18 + React Testing Library 16.3.2 |
| **Config file** | `src/vite.config.ts` (test section) |
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
| 21-01-01 | 01 | 1 | SET-01..SET-03 | unit | `cd src && npx vitest run src/components/settings/SettingsModal.test.tsx -x` | ❌ W0 | ⬜ pending |
| 21-02-01 | 02 | 1 | SET-04, SET-05 | unit | `cd src && npx vitest run src/components/settings/AgentsTab.test.tsx -x` | ❌ W0 | ⬜ pending |
| 21-02-02 | 02 | 1 | SET-06..SET-09, SET-20 | unit | `cd src && npx vitest run src/components/settings/ApiKeysTab.test.tsx -x` | ❌ W0 | ⬜ pending |
| 21-02-03 | 02 | 1 | SET-12..SET-14 | unit | `cd src && npx vitest run src/components/settings/AppearanceTab.test.tsx -x` | ❌ W0 | ⬜ pending |
| 21-02-04 | 02 | 1 | SET-10, SET-11 | unit | `cd src && npx vitest run src/components/settings/GitTab.test.tsx -x` | ❌ W0 | ⬜ pending |
| 21-02-05 | 02 | 1 | SET-15..SET-19 | unit | `cd src && npx vitest run src/components/settings/McpTab.test.tsx -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/components/settings/SettingsModal.test.tsx` — stubs for SET-01, SET-02, SET-03
- [ ] `src/components/settings/AgentsTab.test.tsx` — stubs for SET-04, SET-05
- [ ] `src/components/settings/ApiKeysTab.test.tsx` — stubs for SET-06, SET-07, SET-08, SET-09, SET-20
- [ ] `src/components/settings/AppearanceTab.test.tsx` — stubs for SET-12, SET-13
- [ ] `src/components/settings/GitTab.test.tsx` — stubs for SET-10, SET-11
- [ ] `src/components/settings/McpTab.test.tsx` — stubs for SET-15, SET-16, SET-17, SET-19
- [ ] `src/hooks/useSettingsData.test.ts` — data fetching hook tests
- [ ] Extend `src/stores/ui.test.ts` — SET-14 ThemeConfig persistence

*Existing infrastructure covers test framework — only test files needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Font size slider live preview | SET-12 | CSS custom property change requires visual inspection | 1. Open Settings > Appearance 2. Drag slider 3. Verify chat text size changes immediately |
| Settings modal visual appearance | SET-01 | Layout/styling correctness | 1. Open via gear icon 2. Verify full-screen overlay 3. Check backdrop blur |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
