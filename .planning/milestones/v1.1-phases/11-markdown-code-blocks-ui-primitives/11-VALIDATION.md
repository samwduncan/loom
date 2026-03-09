---
phase: 11
slug: markdown-code-blocks-ui-primitives
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-07
---

# Phase 11 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x + React Testing Library |
| **Config file** | `src/vite.config.ts` (test block) |
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
| 11-01-01 | 01 | 1 | DEP-03 | unit | `cd src && npx vitest run src/src/lib/shiki-highlighter.test.ts -x` | No -- W0 | pending |
| 11-01-02 | 01 | 1 | DEP-04 | unit | `cd src && npx vitest run src/src/lib/shiki-highlighter.test.ts -x` | No -- W0 | pending |
| 11-01-03 | 01 | 1 | DEP-05 | unit | `cd src && npx vitest run src/src/lib/shiki-theme.test.ts -x` | No -- W0 | pending |
| 11-01-04 | 01 | 1 | CODE-07 | unit | `cd src && npx vitest run src/src/lib/shiki-highlighter.test.ts -x` | No -- W0 | pending |
| 11-02-01 | 02 | 2 | MD-01 | unit | `cd src && npx vitest run src/src/components/chat/view/MarkdownRenderer.test.tsx -x` | No -- W0 | pending |
| 11-02-02 | 02 | 2 | MD-03 | unit | `cd src && npx vitest run src/src/components/chat/view/MarkdownRenderer.test.tsx -x` | No -- W0 | pending |
| 11-02-03 | 02 | 2 | MD-04 | unit | `cd src && npx vitest run src/src/components/chat/view/MarkdownRenderer.test.tsx -x` | No -- W0 | pending |
| 11-02-04 | 02 | 2 | MD-05 | unit | `cd src && npx vitest run src/src/components/chat/view/MarkdownRenderer.test.tsx -x` | No -- W0 | pending |
| 11-02-05 | 02 | 2 | MD-06 | unit | `cd src && npx vitest run src/src/components/chat/view/MarkdownRenderer.test.tsx -x` | No -- W0 | pending |
| 11-02-06 | 02 | 2 | CODE-01 | unit | `cd src && npx vitest run src/src/components/chat/view/CodeBlock.test.tsx -x` | No -- W0 | pending |
| 11-02-07 | 02 | 2 | CODE-02 | unit | `cd src && npx vitest run src/src/components/chat/view/CodeBlock.test.tsx -x` | No -- W0 | pending |
| 11-02-08 | 02 | 2 | CODE-03 | unit | `cd src && npx vitest run src/src/components/chat/view/CodeBlock.test.tsx -x` | No -- W0 | pending |
| 11-02-09 | 02 | 2 | CODE-04 | unit | `cd src && npx vitest run src/src/components/chat/view/CodeBlock.test.tsx -x` | No -- W0 | pending |
| 11-02-10 | 02 | 2 | CODE-05 | unit | `cd src && npx vitest run src/src/components/chat/view/CodeBlock.test.tsx -x` | No -- W0 | pending |
| 11-02-11 | 02 | 2 | CODE-06 | unit | `cd src && npx vitest run src/src/components/chat/view/CodeBlock.test.tsx -x` | No -- W0 | pending |
| 11-02-12 | 02 | 2 | CODE-08 | unit | `cd src && npx vitest run src/src/components/chat/view/CodeBlock.test.tsx -x` | No -- W0 | pending |
| 11-03-01 | 03 | 1 | UI-01 | manual | shadcn init succeeds, components.json created | N/A | pending |
| 11-03-02 | 03 | 1 | UI-02 | manual | 9 components installed in src/src/components/ui/ | N/A | pending |
| 11-03-03 | 03 | 1 | UI-03 | manual | Visual inspection -- no HSL or default shadcn colors remain | N/A | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] `src/src/lib/shiki-highlighter.test.ts` -- stubs for DEP-03, DEP-04, CODE-07
- [ ] `src/src/lib/shiki-theme.test.ts` -- stubs for DEP-05
- [ ] `src/src/components/chat/view/MarkdownRenderer.test.tsx` -- stubs for MD-01, MD-03, MD-04, MD-05, MD-06
- [ ] `src/src/components/chat/view/CodeBlock.test.tsx` -- stubs for CODE-01, CODE-02, CODE-03, CODE-04, CODE-05, CODE-06, CODE-08

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| shadcn init success | UI-01 | One-time CLI operation | Run `npx shadcn@latest init`, verify components.json created |
| 9 components installed | UI-02 | One-time CLI operation | Run `npx shadcn@latest add ...`, verify files in ui/ dir |
| OKLCH token restyling | UI-03 | CSS variable usage not easily testable | Grep for `hsl(` in ui/ components -- should find zero matches |
| Code block no layout shift | CODE-05 | Visual behavior | Load page with code blocks, observe no jump during highlight swap |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
