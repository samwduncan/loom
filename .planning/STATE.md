# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-01)

**Core value:** The chat interface must feel designed, not generated — every interaction, animation, and pixel serves the developer experience.
**Current focus:** Phase 3 in progress — structural cleanup (Cursor provider removed)

## Current Position

Phase: 3 of 9 (Structural Cleanup)
Plan: 3 of 5 in current phase — COMPLETE
Status: Executing phase
Last activity: 2026-03-02 — Plan 03-03 complete (removed all Cursor CLI backend code from server and client, 46 files, -2689 lines)

Progress: [██░░░░░░░░] 20%

## Performance Metrics

**Velocity:**
- Total plans completed: 7
- Average duration: 9.6min
- Total execution time: 103min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-design-system-foundation | 4 | 14min | 3.5min |
| 03-structural-cleanup | 3 | 89min | 29.7min |

**Recent Trend:**
- Last 5 plans: 03-03 (45min), 03-02 (29min), 03-01 (15min), 01-04 (5min), 01-03 (4min)
- Trend: Phase 3 plans large scope (46-file Cursor removal, 33-file i18n removal)

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Pre-phase]: Keep Tailwind CSS — migration would be massive; CSS variables handle theming within Tailwind
- [Pre-phase]: Strip i18n — English only reduces complexity, removes ~20% of component code
- [Pre-phase]: Strip Cursor + Codex — focused scope; Claude + Gemini covers all needs
- [Pre-phase]: Phase 4 (Terminal) depends only on Phase 1 — sequenced after Phase 3 for linear execution but not blocked by it
- [01-02]: Added upstream as separate remote (kept origin as-is) for CloudCLI cherry-picking
- [01-02]: upstream-sync branch starts at current HEAD for clean divergence tracking
- [01-01]: Border color as bare HSL channels with 15% default in global * rule, preserving alpha-value contract
- [01-01]: Textarea/placeholder styles consolidated using CSS variables instead of .dark-scoped hardcoded colors
- [01-03]: colorScheme one-liner in main.jsx instead of React context for dark mode
- [01-03]: useSettingsController retains isDarkMode=true for API compatibility
- [03-01]: Preserved src/i18n/ directory for plan 03-02 to read locale files before deletion
- [03-01]: Left sidebar/settings i18n imports untouched (plan 03-02 scope)
- [03-01]: Static MODE_LABELS record in ThinkingModeSelector instead of dynamic t() lookup
- [03-01]: Changed TabDefinition type from labelKey to label for direct string usage
- [03-02]: Stripped t prop from all sidebar subcomponents rather than creating lookup function
- [03-02]: Simplified formatTimeAgo and createSessionViewModel to remove TFunction parameter
- [03-03]: Preserved CSS cursor properties, text cursor variables, CodeMirror dropCursor — only removed Cursor provider references
- [03-03]: Simplified SidebarSessionItem conditional wrappers to unconditional rendering after Cursor removal
- [03-03]: Updated ProviderSelectionEmptyState grid from 4-col to 3-col for 3 remaining providers
- [03-03]: Changed ProjectCreationWizard text to provider-agnostic "AI agent sessions"

### Pending Todos

None yet.

### Blockers/Concerns

- **Shiki async in streaming context:** `codeToHtml()` is async; incomplete code blocks during streaming must fall back to raw text rendering. Address in Phase 5 Plan 05-01.
- **TurnId assignment boundary:** Exact WebSocket message type that signals a new turn start needs a brief audit before Phase 5 begins. Low-risk, one session observation resolves it.
- **ANSI chat parser interaction with Shiki:** Phase 5 must verify these operate on different message types and don't conflict. Likely safe — different pipelines.
- **`LazyMotion` placement:** Correct insertion point in `App.tsx` provider tree must be confirmed when `motion` is first used (Phase 5).

## Session Continuity

Last session: 2026-03-02
Stopped at: Completed 03-03-PLAN.md — removed all Cursor CLI backend from server and client (46 files, -2689 lines)
Resume file: None
