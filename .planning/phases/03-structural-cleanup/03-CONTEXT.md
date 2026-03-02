# Phase 3: Structural Cleanup - Context

**Gathered:** 2026-03-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Strip i18n infrastructure and Cursor CLI backend from the codebase. **Codex is kept** — user may want to use it. After cleanup, three providers remain: Claude, Codex, and Gemini. The provider selection UX is simplified from a first-run gate to a default-to-Claude flow with accessible switching.

</domain>

<decisions>
## Implementation Decisions

### Scope change from roadmap
- **Keep Codex** — only remove i18n and Cursor backend (not Codex)
- `@openai/codex-sdk` stays in `package.json`
- `CodexLogo.tsx` and all Codex routes/hooks remain
- Update roadmap success criteria to reflect this change

### i18n removal
- Strip all 38 `useTranslation` imports and `t()` calls
- Replace with English string literals (use existing locale file values as starting point)
- Remove `react-i18next`, `i18next`, `i18next-browser-languagedetector` from dependencies
- Delete `src/i18n/` directory and locale files

### Cursor removal
- Remove `CursorLogo.tsx` and all Cursor references
- Strip Cursor from `SessionProvider` type (`'claude' | 'codex' | 'gemini'`)
- Remove Cursor-specific routes, hooks, and UI elements
- Remove Cursor from provider selection lists and settings

### Provider selection — default to Claude
- New sessions auto-start with Claude (no provider selection gate)
- Per-session provider choice — each chat session can use a different provider
- Provider switching via header dropdown AND composer area

### Provider dropdown — header
- Small dropdown in the chat header bar
- Shows "Provider (Active Model)" format — e.g., "Claude (Sonnet 4)"
- All three providers with equal visual treatment (no hierarchy)

### Provider indicator — composer area
- Compact provider logo icon near the send button
- Click to open a mini-picker popup
- Minimal visual footprint, doesn't clutter the input area

### Per-provider model memory
- Each provider independently remembers its last-used model
- Switching to Gemini restores last Gemini model choice
- Switching back to Claude restores last Claude model choice

### Welcome/onboarding
- Repurpose `ProviderSelectionEmptyState` as a first-time welcome screen
- Show only on first-ever session (not every new session)
- Mentions that other providers (Codex, Gemini) are available via the header dropdown
- After dismissal, new sessions go straight to chat with Claude

### Claude's Discretion
- Provider switching mid-session behavior (keep history vs start new session)
- Exact dropdown/picker component styling
- Welcome screen layout and copy
- How to persist "first time seen" flag (localStorage or similar)

</decisions>

<specifics>
## Specific Ideas

- Provider dropdown should show "Provider (Model)" format — e.g., "Claude (Sonnet 4)", "Gemini (2.5 Pro)"
- Composer area gets a compact logo icon that opens a mini-picker — not a text label
- Welcome screen appears once, then never again — minimal friction to start chatting

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ProviderSelectionEmptyState.tsx`: Currently a 4-provider grid — repurpose as welcome screen
- `SessionProviderLogo.tsx`: Provider logo renderer — keep for dropdown/picker UI
- `ClaudeLogo.tsx`, `CodexLogo.tsx`: Provider logos — both stay
- `CursorLogo.tsx`: Remove (Cursor is being stripped)

### Established Patterns
- `SessionProvider` type in `src/types/app.ts`: Currently `'claude' | 'cursor' | 'codex' | 'gemini'` — change to `'claude' | 'codex' | 'gemini'`
- `useChatProviderState.ts`: Manages provider selection state — modify to default to Claude
- Settings constants in `src/components/settings/constants/constants.ts`: References all 4 providers — update

### Integration Points
- Provider dropdown connects to chat header (new component)
- Composer provider icon connects near send button in `ChatComposer.tsx`
- Session `__provider` field on `ProjectSession` interface drives per-session provider tracking
- `useSettingsController.ts` and agent settings reference provider types — need Cursor removal

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-structural-cleanup*
*Context gathered: 2026-03-02*
