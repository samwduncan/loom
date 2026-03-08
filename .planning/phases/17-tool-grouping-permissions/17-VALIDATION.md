---
phase: 17
slug: tool-grouping-permissions
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-08
---

# Phase 17 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.18 + @testing-library/react 16.3.2 |
| **Config file** | src/vite.config.ts (vitest config section) |
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
| 17-01-01 | 01 | 1 | TOOL-20 | unit | `cd src && npx vitest run src/src/lib/groupToolCalls.test.ts -x` | No - W0 | ⬜ pending |
| 17-01-02 | 01 | 1 | TOOL-21 | unit | `cd src && npx vitest run src/src/components/chat/tools/ToolCallGroup.test.tsx -x` | No - W0 | ⬜ pending |
| 17-01-03 | 01 | 1 | TOOL-22 | unit | `cd src && npx vitest run src/src/components/chat/tools/ToolCallGroup.test.tsx -x` | No - W0 | ⬜ pending |
| 17-01-04 | 01 | 1 | TOOL-23 | unit | `cd src && npx vitest run src/src/components/chat/tools/ToolCallGroup.test.tsx -x` | No - W0 | ⬜ pending |
| 17-02-01 | 02 | 2 | PERM-01 | unit | `cd src && npx vitest run src/src/components/chat/tools/PermissionBanner.test.tsx -x` | No - W0 | ⬜ pending |
| 17-02-02 | 02 | 2 | PERM-02 | unit | `cd src && npx vitest run src/src/components/chat/tools/PermissionBanner.test.tsx -x` | No - W0 | ⬜ pending |
| 17-02-03 | 02 | 2 | PERM-03 | unit | `cd src && npx vitest run src/src/components/chat/tools/CountdownRing.test.tsx -x` | No - W0 | ⬜ pending |
| 17-02-04 | 02 | 2 | PERM-04 | unit | `cd src && npx vitest run src/src/components/chat/tools/PermissionBanner.test.tsx -x` | No - W0 | ⬜ pending |
| 17-02-05 | 02 | 2 | PERM-05 | unit | `cd src && npx vitest run src/src/components/chat/tools/PermissionBanner.test.tsx -x` | No - W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/src/lib/groupToolCalls.test.ts` — stubs for TOOL-20 (grouping algorithm)
- [ ] `src/src/components/chat/tools/ToolCallGroup.test.tsx` — stubs for TOOL-20, TOOL-21, TOOL-22, TOOL-23
- [ ] `src/src/components/chat/tools/PermissionBanner.test.tsx` — stubs for PERM-01, PERM-02, PERM-04, PERM-05
- [ ] `src/src/components/chat/tools/CountdownRing.test.tsx` — stubs for PERM-03

*Existing infrastructure covers framework setup — only test files needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| CSS Grid expand animation smooth at 60fps | TOOL-21 | Visual smoothness not testable in jsdom | Open /dev/proof-of-life, trigger 5+ tool calls, expand/collapse group, verify no jank |
| Permission banner slide-up animation | PERM-01 | CSS animation timing | Send permission request via WS, observe entrance/exit animation |
| Countdown ring SVG depletion | PERM-03 | Visual SVG rendering | Watch countdown from 55s, verify ring depletes clockwise, pulse at <10s |
| Y/N keyboard shortcuts | PERM-01 | Focus context dependent | With banner visible and no input focused, press Y then N |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
