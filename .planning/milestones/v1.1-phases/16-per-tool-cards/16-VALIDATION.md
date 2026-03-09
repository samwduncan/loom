---
phase: 16
slug: per-tool-cards
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-08
---

# Phase 16 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.18 + jsdom |
| **Config file** | `src/vite.config.ts` (vitest config inline) |
| **Quick run command** | `cd /home/swd/loom/src && npx vitest run --reporter=verbose` |
| **Full suite command** | `cd /home/swd/loom/src && npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd /home/swd/loom/src && npx vitest run --reporter=verbose`
- **After every plan wave:** Run `cd /home/swd/loom/src && npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 16-01-01 | 01 | 1 | (shared) | unit | `cd /home/swd/loom/src && npx vitest run src/src/lib/ansi-parser.test.ts -x` | ❌ W0 | ⬜ pending |
| 16-01-02 | 01 | 1 | (shared) | unit | `cd /home/swd/loom/src && npx vitest run src/src/lib/diff-parser.test.ts -x` | ❌ W0 | ⬜ pending |
| 16-01-03 | 01 | 1 | (shared) | unit | `cd /home/swd/loom/src && npx vitest run src/src/lib/grep-parser.test.ts -x` | ❌ W0 | ⬜ pending |
| 16-01-04 | 01 | 1 | (shared) | unit | `cd /home/swd/loom/src && npx vitest run src/src/components/chat/tools/TruncatedContent.test.tsx -x` | ❌ W0 | ⬜ pending |
| 16-01-05 | 01 | 1 | (shared) | unit | `cd /home/swd/loom/src && npx vitest run src/src/lib/shiki-highlighter.test.ts -x` | ❌ W0 | ⬜ pending |
| 16-02-01 | 02 | 2 | TOOL-10 | unit | `cd /home/swd/loom/src && npx vitest run src/src/components/chat/tools/BashToolCard.test.tsx -x` | ❌ W0 | ⬜ pending |
| 16-02-02 | 02 | 2 | TOOL-11 | unit | `cd /home/swd/loom/src && npx vitest run src/src/components/chat/tools/ReadToolCard.test.tsx -x` | ❌ W0 | ⬜ pending |
| 16-02-03 | 02 | 2 | TOOL-12 | unit | `cd /home/swd/loom/src && npx vitest run src/src/components/chat/tools/EditToolCard.test.tsx -x` | ❌ W0 | ⬜ pending |
| 16-02-04 | 02 | 2 | TOOL-13 | unit | `cd /home/swd/loom/src && npx vitest run src/src/components/chat/tools/WriteToolCard.test.tsx -x` | ❌ W0 | ⬜ pending |
| 16-03-01 | 03 | 2 | TOOL-14 | unit | `cd /home/swd/loom/src && npx vitest run src/src/components/chat/tools/GlobToolCard.test.tsx -x` | ❌ W0 | ⬜ pending |
| 16-03-02 | 03 | 2 | TOOL-15 | unit | `cd /home/swd/loom/src && npx vitest run src/src/components/chat/tools/GrepToolCard.test.tsx -x` | ❌ W0 | ⬜ pending |
| 16-03-03 | 03 | 2 | ENH-02 | unit | `cd /home/swd/loom/src && npx vitest run src/src/lib/ansi-parser.test.ts -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `npm install diff` — new dependency for EditToolCard
- [ ] `src/src/lib/ansi-parser.test.ts` — stubs for ENH-02 ANSI parsing
- [ ] `src/src/lib/diff-parser.test.ts` — stubs for EditToolCard diff computation
- [ ] `src/src/lib/grep-parser.test.ts` — stubs for GrepToolCard output parsing
- [ ] `src/src/components/chat/tools/TruncatedContent.test.tsx` — stubs for shared truncation
- [ ] `src/src/components/chat/tools/BashToolCard.test.tsx` — stubs for TOOL-10
- [ ] `src/src/components/chat/tools/ReadToolCard.test.tsx` — stubs for TOOL-11
- [ ] `src/src/components/chat/tools/EditToolCard.test.tsx` — stubs for TOOL-12
- [ ] `src/src/components/chat/tools/WriteToolCard.test.tsx` — stubs for TOOL-13
- [ ] `src/src/components/chat/tools/GlobToolCard.test.tsx` — stubs for TOOL-14
- [ ] `src/src/components/chat/tools/GrepToolCard.test.tsx` — stubs for TOOL-15

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| ANSI colors render visually correct | ENH-02 | Visual color accuracy | Render BashToolCard with ANSI-colored output, verify colors match terminal |
| Diff readability | TOOL-12 | Visual layout quality | View EditToolCard with multi-hunk diff, verify line numbers align and colors are clear |
| Truncation scroll stability | (shared) | Scroll behavior | Click "Show more" mid-page, verify page doesn't jump |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
