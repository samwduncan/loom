---
phase: 1
slug: design-system-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-04
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (minimal — full setup is Phase 2 ENF-03) |
| **Config file** | None in Phase 1 — token preview page is primary validation |
| **Quick run command** | `npx vitest run --reporter=verbose` (once available) |
| **Full suite command** | `npm run test` (once available) |
| **Estimated runtime** | ~5 seconds (token preview page load + visual check) |

---

## Sampling Rate

- **After every task commit:** Visual inspection of token preview page
- **After every plan wave:** Full visual review of all token categories on preview page
- **Before `/gsd:verify-work`:** All surfaces perceptible, fonts loading, motion tokens defined, preview page complete
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 1 | — | build | `npm run build` | N/A — scaffold | ⬜ pending |
| 1-02-01 | 02 | 2 | DS-01 | manual | Visual: token preview shows all OKLCH colors | N/A — visual | ⬜ pending |
| 1-02-02 | 02 | 2 | DS-06 | manual | Visual: 3 surface tiers distinguishable | N/A — visual | ⬜ pending |
| 1-03-01 | 03 | 2 | DS-02 | unit | `vitest run src/lib/motion.test.ts` (Phase 2) | ❌ W0 | ⬜ pending |
| 1-03-02 | 03 | 2 | DS-03 | manual | Visual: spacing scale on 4px grid in preview | N/A — visual | ⬜ pending |
| 1-03-03 | 03 | 2 | DS-04 | manual | `grep -r 'z-index' src/ --include='*.css'` | N/A — enforcement | ⬜ pending |
| 1-03-04 | 03 | 2 | DS-05 | manual | Visual: DevTools Network tab shows font loads | N/A — visual | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- None — Phase 1 does not require test infrastructure. The token preview page IS the validation artifact. Automated testing is deferred to Phase 2 per user's locked decision (enforcement stays in Phase 2).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| OKLCH color tokens render correctly | DS-01 | Visual perception of color accuracy | Open token preview page, verify all swatches match design spec |
| Surface hierarchy perceivable | DS-06 | Visual perception of lightness difference | View 3 surface tiers side-by-side on preview page |
| Spacing scale on 4px grid | DS-03 | Visual spacing verification | Check preview page spacing section, verify visual rhythm |
| Fonts load with swap behavior | DS-05 | Network + rendering behavior | Open DevTools Network tab, verify .woff2 loads, check font-display |
| Z-index dictionary completeness | DS-04 | Correctness of semantic naming | Review tokens.css for all 8 z-index tiers |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
