---
phase: 19
slug: visual-effects-enhancements
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-09
---

# Phase 19 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest + @testing-library/react |
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
| 19-01-01 | 01 | 1 | UI-04 | unit | `cd src && npx vitest run src/components/effects/SpotlightCard.test.tsx -x` | Wave 0 | ⬜ pending |
| 19-01-02 | 01 | 1 | UI-04 | unit | `cd src && npx vitest run src/components/effects/ShinyText.test.tsx -x` | Wave 0 | ⬜ pending |
| 19-01-03 | 01 | 1 | UI-04 | unit | `cd src && npx vitest run src/components/effects/ElectricBorder.test.tsx -x` | Wave 0 | ⬜ pending |
| 19-01-04 | 01 | 1 | UI-05 | lint | `cd src && npx eslint src/components/effects/` | N/A (ESLint) | ⬜ pending |
| 19-02-01 | 02 | 2 | ENH-03 | unit | `cd src && npx vitest run src/lib/thinking-markdown.test.ts -x` | Wave 0 | ⬜ pending |
| 19-02-02 | 02 | 2 | ENH-03 | unit | `cd src && npx vitest run src/components/chat/view/ThinkingDisclosure.test.tsx -x` | Wave 0 | ⬜ pending |
| 19-02-03 | 02 | 2 | ENH-04 | unit | `cd src && npx vitest run src/components/chat/view/ErrorMessage.test.tsx -x` | Exists (extend) | ⬜ pending |
| 19-03-01 | 03 | 2 | ENH-05 | unit | `cd src && npx vitest run src/hooks/useMessageSearch.test.ts -x` | Wave 0 | ⬜ pending |
| 19-03-02 | 03 | 2 | ENH-05 | unit | `cd src && npx vitest run src/components/chat/view/SearchBar.test.tsx -x` | Wave 0 | ⬜ pending |
| 19-03-03 | 03 | 2 | ENH-06 | unit | `cd src && npx vitest run src/lib/export-conversation.test.ts -x` | Wave 0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/src/components/effects/SpotlightCard.test.tsx` — stubs for UI-04 (SpotlightCard)
- [ ] `src/src/components/effects/ShinyText.test.tsx` — stubs for UI-04 (ShinyText)
- [ ] `src/src/components/effects/ElectricBorder.test.tsx` — stubs for UI-04 (ElectricBorder)
- [ ] `src/src/lib/thinking-markdown.test.ts` — stubs for ENH-03
- [ ] `src/src/components/chat/view/ThinkingDisclosure.test.tsx` — extend for ENH-03
- [ ] `src/src/hooks/useMessageSearch.test.ts` — stubs for ENH-05
- [ ] `src/src/components/chat/view/SearchBar.test.tsx` — stubs for ENH-05
- [ ] `src/src/lib/export-conversation.test.ts` — stubs for ENH-06
- [ ] Extend `src/src/components/chat/view/ErrorMessage.test.tsx` — covers ENH-04

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| SpotlightCard gradient follows mouse visually | UI-04 | Visual effect requires human eye | Hover over tool card, verify radial gradient tracks cursor |
| ShinyText shimmer animation appearance | UI-04 | Animation quality is subjective | Observe "Thinking..." label during streaming, verify shimmer sweep |
| ElectricBorder glow on composer | UI-04 | Animation subtlety requires visual check | Start streaming, verify soft animated gradient on composer border |
| prefers-reduced-motion disables all effects | UI-05 | Requires OS setting toggle | Enable reduced motion in OS, verify all effects are static |
| Search Cmd+F hijack doesn't break other shortcuts | ENH-05 | Browser interaction testing | Press Cmd+F in chat, verify search opens; press Escape, verify browser find works |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
