---
phase: 35
slug: quick-settings
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-17
---

# Phase 35 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x |
| **Config file** | `src/vite.config.ts` (vitest section) |
| **Quick run command** | `cd src && npx vitest run --reporter=verbose` |
| **Full suite command** | `cd src && npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd src && npx vitest run --reporter=verbose`
- **After every plan wave:** Run `cd src && npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 35-01-01 | 01 | 1 | UXR-06 | unit | `cd src && npx vitest run src/src/stores/ui.test.ts -x` | Exists (extend) | ⬜ pending |
| 35-01-02 | 01 | 1 | UXR-05 | unit | `cd src && npx vitest run src/src/hooks/useQuickSettingsShortcut.test.ts -x` | ❌ W0 | ⬜ pending |
| 35-01-03 | 01 | 1 | UXR-05, UXR-06 | unit | `cd src && npx vitest run src/src/components/sidebar/QuickSettingsPanel.test.tsx -x` | ❌ W0 | ⬜ pending |
| 35-02-01 | 02 | 1 | UXR-07 | unit | `cd src && npx vitest run src/src/components/chat/tools/ToolCallGroup.test.tsx -x` | Exists (extend) | ⬜ pending |
| 35-02-02 | 02 | 1 | UXR-07 | unit | `cd src && npx vitest run src/src/components/chat/tools/ToolCardShell.test.tsx -x` | Exists (extend) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/src/components/sidebar/QuickSettingsPanel.test.tsx` — stubs for UXR-05, UXR-06
- [ ] `src/src/hooks/useQuickSettingsShortcut.test.ts` — stubs for UXR-05

*Existing tests to extend (not Wave 0):*
- `src/src/stores/ui.test.ts` — new store fields and migration
- `src/src/components/chat/tools/ToolCallGroup.test.tsx` — autoExpandTools wiring
- `src/src/components/chat/tools/ToolCardShell.test.tsx` — showRawParams rendering

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Popover positioning on sidebar | UXR-05 | Visual placement depends on viewport | Open panel from sidebar, verify it doesn't clip edges |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
