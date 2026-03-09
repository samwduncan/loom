---
phase: 15
slug: tool-card-shell-state-machine
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-07
---

# Phase 15 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest + @testing-library/react (jsdom) |
| **Config file** | src/vite.config.ts (test section) |
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
| 15-01-01 | 01 | 1 | TOOL-04 | unit | `cd /home/swd/loom/src && npx vitest run src/lib/format-elapsed.test.ts -x` | ❌ W0 | ⬜ pending |
| 15-01-02 | 01 | 1 | TOOL-01 | unit | `cd /home/swd/loom/src && npx vitest run src/hooks/useElapsedTime.test.ts -x` | ❌ W0 | ⬜ pending |
| 15-02-01 | 02 | 1 | TOOL-03, TOOL-05 | unit | `cd /home/swd/loom/src && npx vitest run src/components/chat/tools/ToolCardShell.test.tsx -x` | ❌ W0 | ⬜ pending |
| 15-02-02 | 02 | 1 | TOOL-06 | unit | `cd /home/swd/loom/src && npx vitest run src/components/chat/tools/DefaultToolCard.test.tsx -x` | ❌ W0 | ⬜ pending |
| 15-03-01 | 03 | 2 | TOOL-01, TOOL-02, TOOL-05 | unit | `cd /home/swd/loom/src && npx vitest run src/components/chat/tools/ToolChip.test.tsx -x` | ✅ (needs update) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/src/lib/format-elapsed.test.ts` — stubs for TOOL-04 elapsed time formatting
- [ ] `src/src/hooks/useElapsedTime.test.ts` — stubs for timer hook lifecycle
- [ ] `src/src/components/chat/tools/ToolCardShell.test.tsx` — stubs for TOOL-03, TOOL-05
- [ ] `src/src/components/chat/tools/DefaultToolCard.test.tsx` — stubs for TOOL-06

*Existing infrastructure covers framework and config. Only test file stubs needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| CSS spring animation feels natural | TOOL-03 | Subjective visual quality | Expand/collapse a tool card, verify smooth spring feel vs abrupt snap |
| Pulsing dot animation smooth | TOOL-01 | Visual CSS animation | Watch executing tool, verify pulse is smooth and stops on resolve |
| Error card red accent visible | TOOL-05 | Visual design check | Trigger error tool, verify red border tint and bg tint are visible |
| Elapsed time updates live | TOOL-04 | Real-time UI behavior | Watch executing tool for 3+ seconds, verify timer increments smoothly |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
