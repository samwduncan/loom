---
phase: 7
slug: tool-registry-proof-of-life
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-06
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x + React Testing Library 16.x |
| **Config file** | `src/vite.config.ts` (vitest config inline) |
| **Quick run command** | `cd /home/swd/loom/src && npx vitest run --reporter=verbose` |
| **Full suite command** | `cd /home/swd/loom/src && npx vitest run --coverage` |
| **Estimated runtime** | ~8 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd /home/swd/loom/src && npx vitest run --reporter=verbose`
- **After every plan wave:** Run `cd /home/swd/loom/src && npx vitest run --coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 1 | COMP-01 | unit | `cd /home/swd/loom/src && npx vitest run src/lib/tool-registry.test.ts` | ❌ W0 | ⬜ pending |
| 07-01-02 | 01 | 1 | COMP-01 | unit | `cd /home/swd/loom/src && npx vitest run src/components/chat/tools/ToolChip.test.tsx` | ❌ W0 | ⬜ pending |
| 07-02-01 | 02 | 2 | STRM-04 | unit | `cd /home/swd/loom/src && npx vitest run src/components/chat/view/ThinkingDisclosure.test.tsx` | ❌ W0 | ⬜ pending |
| 07-02-02 | 02 | 2 | STRM-04 | smoke | `cd /home/swd/loom/src && npx vitest run src/components/dev/ProofOfLife.test.tsx` | ❌ W0 | ⬜ pending |
| 07-02-03 | 02 | 2 | STRM-04 | manual | Navigate to `/dev/proof-of-life`, send prompt, observe streaming | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/src/lib/tool-registry.test.ts` — stubs for COMP-01 (registry API, 6 tools, default fallback)
- [ ] `src/src/components/chat/tools/ToolChip.test.tsx` — stubs for COMP-01 (chip rendering, status dot, expand)
- [ ] `src/src/components/chat/view/ThinkingDisclosure.test.tsx` — stubs for STRM-04 (disclosure toggle, auto-collapse)
- [ ] `src/src/components/dev/ProofOfLife.test.tsx` — stubs for STRM-04 (smoke: page renders, connection dot visible)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| End-to-end streaming renders in browser | STRM-04 | Requires live WebSocket connection to backend + visual verification of rAF streaming | Navigate to `/dev/proof-of-life`, type prompt, click Send, observe: (1) connection dot green, (2) tokens stream in real-time, (3) thinking block appears above response, (4) tool chips render inline |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
