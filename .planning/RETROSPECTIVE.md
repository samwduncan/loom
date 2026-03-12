# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — The Skeleton

**Shipped:** 2026-03-07
**Phases:** 10 | **Plans:** 21

### What Was Built
- Complete OKLCH design token system with 9 custom ESLint enforcement rules
- 4 Zustand stores with full TypeScript interfaces designed for M1-M5
- WebSocket bridge with stream multiplexer (thinking/content/tool channels)
- 60fps streaming engine via useRef + rAF DOM mutation (zero React re-renders)
- Pluggable tool-call registry with 6 built-in tools
- Sidebar navigation with session switching, URL sync, and message loading
- Playwright E2E test suite verifying all integration points
- 14,423 LOC across 145 commits in 3 days

### What Worked
- **Strict dependency chain** — building tokens -> enforcement -> shell -> state -> WS -> streaming -> tools -> navigation prevented foundation rot that killed V1
- **Constitution enforcement from commit #1** — 9 ESLint rules caught issues immediately, zero violations accumulated
- **Milestone audit before integration phase** — audit at Phase 8 caught INT-01 (WebSocket not wired) and INT-02 (navigation broken), which Phase 9 fixed. Without the audit, we'd have shipped broken integration.
- **Pure function multiplexer** — zero store/React imports made it trivially testable
- **Wave-based parallelization** — independent plans executed in parallel within phases
- **YOLO mode** — eliminated confirmation overhead for a solo developer who knows the codebase

### What Was Inefficient
- **Phase 7 plan 02 took 49 minutes** — the proof-of-life page required debugging real WebSocket connections, `crypto.randomUUID()` HTTPS requirement, and SDK `--resume` behavior. Research phase didn't surface these.
- **Phase 9 plan 02 took 35 minutes** — Playwright E2E tests against real backend are inherently slow and flaky (model-dependent responses, WebSocket timing)
- **Summaries lack one_liner field** — summary extraction at milestone completion had to fall back to manual composition

### Patterns Established
- **Callback injection for infrastructure** — WebSocket client uses `configure()` with callbacks instead of importing stores directly
- **Ref callback + useState for observer targets** — ensures IntersectionObserver setup fires on DOM attachment
- **Module-level singletons for shared data** — project name resolution avoids redundant API fetches
- **Adjust-during-render pattern** — React 19 ESLint rule for set-state-in-effect requires state updates during render instead of useEffect
- **EMPTY_MESSAGES constant** — Zustand v5 selectors need stable references to prevent infinite re-renders
- **Predicate-based WebSocket detection in Playwright** — distinguish app WS from Vite HMR WS

### Key Lessons
1. **useLayoutEffect for scroll-to-bottom** — useEffect + setTimeout creates visible flicker; useLayoutEffect fires synchronously after DOM commit with accurate scrollHeight
2. **Backend JSONL format is not what you expect** — entries have `type: user/assistant` (not `message`), multiple assistant entries share the same message.id per API turn, and pure `tool_result` entries have `role: user` but aren't real user messages
3. **Zustand persist rehydrates without messages** — sessions come back with empty arrays; useSessionSwitch must create stub sessions before fetching
4. **Integration gaps hide behind passing unit tests** — unit tests for WebSocket client, multiplexer, and ChatView all passed individually, but initializeWebSocket() was never called from the production route. Milestone audit caught this.
5. **React 19 ESLint rules change common patterns** — ref callbacks in render bodies, set-state-in-effect, and exhaustive deps enforcement require different approaches than React 18

### Cost Observations
- Model mix: ~80% Opus, ~15% Sonnet (subagents), ~5% Haiku (subagents)
- Total execution time: ~2.4 hours across 21 plans
- Notable: Fine granularity (3-5 tasks per plan) kept individual plan execution fast (avg 7 min), with outliers only on integration/E2E plans

---

## Milestone: v1.1 — The Chat

**Shipped:** 2026-03-09
**Phases:** 9 | **Plans:** 26

### What Was Built
- Rich markdown rendering with Shiki syntax highlighting, OKLCH theme, and streaming two-phase converter
- Auto-resize composer with 5-state FSM, image paste/drag-drop, draft persistence
- 5 message types (user, assistant, error, system, task notification) with thinking disclosures and provider logos
- 6 purpose-built tool cards (Bash, Read, Edit, Write, Glob, Grep) with state machine, elapsed time, ANSI color support
- Tool grouping accordion and permission request banners with 55s countdown ring
- Activity status line, scroll preservation with ResizeObserver bottom lock, message entrance animations
- CSS visual effects (SpotlightCard, ShinyText, ElectricBorder) — zero JS animation library dependency
- Message search with keyboard shortcut and conversation export (Markdown + JSON)
- 24,786 LOC across 158 commits in 3 days

### What Worked
- **M2 velocity higher than M1** — 8.7 plans/day vs 7 plans/day. Foundation work in M1 paid off: stores, multiplexer, and tool registry were ready.
- **Per-phase research spikes** — every phase had a RESEARCH.md. Phase 11 density concern (flagged by Bard) was mitigated by splitting into 3 focused plans.
- **Constitution enforcement continued holding** — zero violations across 158 commits. The ANSI parser, diff viewer, and SVG logos all found compliant solutions (CSS classes, custom properties, etc.)
- **Adversarial review caught real issues** — Phase 19 adversarial review found token violations, convention gaps, and quality issues across 5 areas. ~40% false positive rate, but the real findings saved debugging time.
- **Two-phase streaming was the right call** — Streamdown evaluation (Phase 12-03) confirmed that pure function streaming converter + react-markdown finalization outperforms Streamdown's React component model for the rAF architecture.

### What Was Inefficient
- **Summaries still lack one_liner field** — same issue from M1. The `summary-extract` command returns null. Manual accomplishment extraction required reading all 26 SUMMARY.md files.
- **Phase 17 decision pivot** — Originally planned to inject tools via rehype markers into markdown hast tree. During implementation, discovered it was simpler and cleaner to render tools as React components after markdown. The rehypeToolMarkers plugin now runs as a no-op (minor tech debt).
- **Some M3 scope pulled into M2** — scroll-to-bottom pill, message animations, tool grouping, and CSS effects were originally M3 scope. Pulling them forward was the right call (they're integral to the chat experience) but meant M2 had 9 phases instead of the planned ~4-6.

### Patterns Established
- **CSS Grid 0fr/1fr for all expand/collapse** — thinking blocks, tool cards, tool groups all use the same animation pattern
- **Adjust-state-during-rendering** — React 19 pattern for conditional state updates in render (avoids useEffect setState ESLint violations)
- **DOMPurify allowlist per context** — full allowlist for streaming markdown, strict 4-tag allowlist for thinking blocks
- **Session-scoped UI** — permission banners check sessionId to prevent cross-session leakage
- **CSS-only visual effects** — SpotlightCard uses element.style.setProperty for mouse tracking (no React re-renders), ElectricBorder uses data-active attribute for CSS selector activation

### Key Lessons
1. **Don't over-plan intermediate rendering** — the rehype marker injection for tool chips was over-engineered. React components rendered after markdown was simpler and equally correct.
2. **Streaming and finalized paths should diverge early** — trying to share rendering logic between rAF streaming and react-markdown finalized content creates coupling. Separate paths with a masked crossfade transition is cleaner.
3. **Image handling needs careful memory management** — URL.createObjectURL for previews, revokeObjectURL on remove/send/unmount. Data URLs double memory. The ref-based cleanup pattern is essential.
4. **Constitution ESLint rules scale beyond expectations** — rules written for M1 (no hardcoded colors, no inline styles) caught issues in M2 tool cards, SVG logos, and CSS effects without modification. The investment pays compounding dividends.
5. **Adversarial review false positive rate requires cross-vendor triangulation** — ~40% of findings are false positives. Using Gemini as second opinion before fixing prevents wasted effort.

### Cost Observations
- Model mix: ~75% Opus, ~20% Sonnet (subagents), ~5% Haiku (subagents)
- Total execution time: ~3.5 hours across 26 plans
- Notable: Average plan execution 5 min (faster than M1's 7 min avg). Foundation stability eliminated debugging time.

---

## Milestone: v1.2 — The Workspace

**Shipped:** 2026-03-12
**Phases:** 8 | **Plans:** 20

### What Was Built
- CSS show/hide tab system (Chat/Files/Shell/Git) with mount-once pattern preserving all panel state
- Full settings modal with 5 tabs (Agents, API Keys, Appearance, Git, MCP) and 14 shadcn primitives
- Command palette (Cmd+K) with fuzzy search via cmdk + fuse.js across sessions, files, and 7 command groups
- Hierarchical file tree with type icons, context menus, search filter, and image lightbox
- CodeMirror 6 code editor with OKLCH theme, multi-tab editing, diff view via @codemirror/merge, Cmd+S save
- xterm.js terminal with separate /shell WebSocket, OKLCH color scheme, connection state management
- Git panel with Changes/History views, client-side staging, commit with AI message generation, branch ops, push/pull/fetch
- Cross-phase integration wiring: DiffEditor connected to git panel, "Open in Terminal" in file tree, keyboard escape guards
- 39,363 LOC across 145 commits in 3 days

### What Worked
- **Velocity still increasing** — 10 plans/day (M1: 7, M2: 8.7). The 5-store architecture and established patterns made new panels predictable.
- **Milestone audit caught real integration gaps** — 3 cross-phase wiring issues (DiffEditor orphaned, Open in Terminal missing, keyboard escape guards unwired) were caught and fixed via Phase 27 gap closure. Without the audit, these would have shipped broken.
- **shadcn primitives investment in Phase 21** — installing 14 primitives early meant Phases 22-26 could use Dialog, AlertDialog, ContextMenu, etc. without pausing. Good decision to batch the install.
- **Constitution ESLint rules still holding** — zero violations across 448 total commits. Rules written in Phase 2 caught issues in CodeMirror theme (inline styles), terminal colors, and git panel styling.
- **Module-level ref pattern** — discovered in Phase 24 for CodeEditor save, reused in Phase 27 for shell input. Clean imperative IO without refs-during-render lint violations.

### What Was Inefficient
- **Phase 27 gap closure** — shouldn't have been needed. Three integration wiring gaps (ED-15, GIT-06, FT-09) were marked as "deferred" or "complete" by individual phase verifications but were actually just orphaned code. The milestone audit caught what per-phase verification missed.
- **Summaries still lack one_liner** — third milestone in a row where `summary-extract --fields one_liner` returns null. Need to fix the frontmatter format.
- **Phase 26 was too large** — 4 plans covering git panel + navigation. Could have been split into two phases. The 4th plan (session rename/delete) was unrelated to git.
- **SET-07 backend limitation** — discovered during implementation that backend API key schema lacks provider column. Worked around it but it's tech debt.

### Patterns Established
- **5th Zustand store (file store)** — file tree, open tabs, active file, dirty tracking, diff state. Constitution amended.
- **CSS show/hide for all panels** — mount-once with display:none/block. Terminal sessions, scroll positions, editor content all preserved.
- **AlertDialog sibling pattern** — Radix Dialog focus trap conflicts with nested AlertDialog. Solution: render AlertDialog as sibling, not child. Used in Phases 21, 24, and 26.
- **FetchState const object** — shared across hooks for loading/error/success states. Avoids enum (erasableSyntaxOnly) and prevents duplication.
- **useApiFetch<T> generic hook** — replaced duplicated fetch machinery across git hooks with single reusable hook.
- **Module-level register/deregister** — for imperative cross-component communication (shell input, editor save).

### Key Lessons
1. **Per-phase verification misses integration gaps** — individual phases verify their own scope but can't check cross-phase wiring. Milestone audit is essential for catching orphaned components.
2. **Install UI primitives early** — batching shadcn installs in one phase prevented "pause to install a dep" interruptions in later phases. Worth the upfront investment.
3. **CodeMirror 6 > Monaco for this use case** — ~200KB vs ~1MB, modular extensions, OKLCH theme via CSS var() just worked. No regrets on this decision.
4. **Separate WebSocket for terminal** — kept /shell completely independent from /ws chat. Zero message interleaving, independent lifecycle. Right call.
5. **Client-side staging is acceptable tech debt** — no /api/git/stage endpoint means staging is a Set<string> in the frontend. Works fine for the use case but diverges from real git semantics.

### Cost Observations
- Model mix: ~70% Opus, ~25% Sonnet (subagents), ~5% Haiku (subagents)
- Total execution time: ~2 hours across 20 plans
- Notable: Plan execution averaging 6 min. Integration wiring plan (Phase 27) took only 6 min — wiring existing code is fast.

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Avg Plan Time | Key Change |
|-----------|--------|-------|---------------|------------|
| v1.0 | 10 | 21 | 7 min | Strict dependency chain + automated enforcement from commit #1 |
| v1.1 | 9 | 26 | 5 min | Research spikes per phase, adversarial reviews, M3 scope pull-forward |
| v1.2 | 8 | 20 | 6 min | Milestone audit gap closure phase, shadcn batch install, module-level ref pattern |

### Cumulative Quality

| Milestone | Tests | LOC | Commits | Velocity |
|-----------|-------|-----|---------|----------|
| v1.0 | 359+ | 14,423 | 145 | 7 plans/day |
| v1.1 | 700+ | 24,786 | 303 | 8.7 plans/day |
| v1.2 | 1,023 | 39,363 | 448 | 10 plans/day |

### Top Lessons (Verified Across Milestones)

1. Automated enforcement prevents quality rot — 9 ESLint rules caught every banned pattern across 448 commits without modification
2. Integration audits catch what unit tests miss — mandatory milestone audit before archival (all 3 milestones). v1.2 audit found 3 orphaned-component gaps.
3. Foundation investment compounds — each milestone faster than the last (7 → 8.7 → 10 plans/day)
4. Research spikes before implementation pay off — all milestones benefited from upfront research, reducing mid-implementation pivots
5. Batch install shared dependencies early — v1.2's Phase 21 shadcn batch install prevented interruptions in 5 subsequent phases
