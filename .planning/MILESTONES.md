# Milestones: Loom

## v1.0 — Functional Foundation

**Shipped:** 2026-03-02
**Phases:** 1 (partial), 3, 5, 6 (phases 1-9 planned, 4 completed)
**Last phase number:** 9

### What Shipped

- **Phase 1 (Design System Foundation):** CSS variable token system with HSL alpha-value contract, JetBrains Mono typography, dense 4-8px grid spacing, warm scrollbars, fork governance (upstream-sync branch, GPL-3.0 attribution)
- **Phase 3 (Structural Cleanup):** Stripped i18n from all 43 components, removed Cursor CLI backend, kept Codex provider, built provider UX (header dropdown, composer picker, welcome screen, default-to-Claude)
- **Phase 5 (Chat Message Architecture):** Shiki v4 with VS Code Dark+ highlighting, collapsible TurnBlock system, compact tool action cards with type tinting, 3+ tool call grouping, thinking block disclosures, requestAnimationFrame streaming buffer
- **Phase 6 (Chat Message Polish):** react-diff-viewer-continued for unified diffs, user message restyle with copy buttons, permission banners with warm theme, TurnUsageFooter with pricing, 720px max-width centered layout, system status messages

### Requirements Completed (27/44)

- DSGN-01 through DSGN-05, DSGN-07, DSGN-08 (7)
- CHAT-01 through CHAT-16 (16)
- FORK-01 through FORK-05 (5) — note: FORK-03 kept Codex

### Requirements Carried Forward to v1.1

- DSGN-06 (color sweep — will be rewritten for new palette)
- STRM-01 through STRM-10 (streaming UX + error handling)
- TERM-01 through TERM-04 (terminal/editor theming — will be rewritten for new palette)
- SIDE-01 through SIDE-04 (sidebar/global polish — will be rewritten for new palette)

### Key Decisions Made

| Decision | Outcome |
|----------|---------|
| Fork CloudCLI instead of from scratch | ✓ Good — saved months of plumbing |
| Keep Tailwind CSS | ✓ Good — CSS variables handle theming |
| Strip i18n | ✓ Good — reduced complexity significantly |
| Strip Cursor, keep Codex | ✓ Good — 3 providers (Claude/Codex/Gemini) |
| Shiki over react-syntax-highlighter | ✓ Good — VS Code parity, smaller bundle |
| requestAnimationFrame streaming | ✓ Good — eliminated per-token setState jank |
| Warm earthy palette | ⚠️ Revisit — replacing with charcoal + rose in v1.1 |

---
*Archived: 2026-03-03*
