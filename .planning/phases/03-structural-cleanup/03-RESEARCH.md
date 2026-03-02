# Phase 3: Structural Cleanup - Research

**Researched:** 2026-03-02
**Domain:** i18n removal, dead provider stripping, provider UX redesign
**Confidence:** HIGH

## Summary

Phase 3 is a mixed mechanical-cleanup + UX-redesign phase. The first half (i18n removal, Cursor stripping) is purely subtractive -- delete code and replace translation keys with string literals. The second half (provider selection UX, welcome screen, header dropdown, composer picker, per-provider model memory) is additive feature work that builds on the existing provider infrastructure.

The codebase currently has 43 files using `useTranslation` hooks with `t()` calls, an additional 17 files importing i18n infrastructure without `useTranslation` (App.tsx, main.jsx, sidebar utils, etc.), and ~4,700 lines of locale JSON across 4 languages plus config files. Cursor has ~1,070 lines of server-side code (`server/cursor-cli.js` + `server/routes/cursor.js`), plus ~30 reference points in `server/index.js`, and touches ~82 frontend files (many just containing the string "cursor" in a provider list or type union). The scope change from the user KEEPS Codex, so three providers remain after cleanup: Claude, Codex, and Gemini.

**Primary recommendation:** Execute in three waves: (1) mechanical i18n strip using `en/*.json` as the source of truth for replacement strings, (2) Cursor removal from both server and client code, (3) provider UX features (default-to-Claude, header dropdown, composer picker, welcome screen, per-provider model memory). Each wave should build-verify before proceeding.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Keep Codex** -- only remove i18n and Cursor backend (not Codex)
- `@openai/codex-sdk` stays in `package.json`
- `CodexLogo.tsx` and all Codex routes/hooks remain
- Update roadmap success criteria to reflect this change
- Strip all 38 `useTranslation` imports and `t()` calls (actual count is 43 files)
- Replace with English string literals (use existing locale file values as starting point)
- Remove `react-i18next`, `i18next`, `i18next-browser-languagedetector` from dependencies
- Delete `src/i18n/` directory and locale files
- Remove `CursorLogo.tsx` and all Cursor references
- Strip Cursor from `SessionProvider` type (`'claude' | 'codex' | 'gemini'`)
- Remove Cursor-specific routes, hooks, and UI elements
- Remove Cursor from provider selection lists and settings
- New sessions auto-start with Claude (no provider selection gate)
- Per-session provider choice -- each chat session can use a different provider
- Provider switching via header dropdown AND composer area
- Header dropdown shows "Provider (Active Model)" format
- All three providers with equal visual treatment
- Compact provider logo icon near send button, click to open mini-picker
- Per-provider model memory (each provider remembers its last-used model)
- Repurpose `ProviderSelectionEmptyState` as first-time welcome screen
- Welcome shows only on first-ever session, mentions other providers via header dropdown
- After dismissal, new sessions go straight to chat with Claude

### Claude's Discretion
- Provider switching mid-session behavior (keep history vs start new session)
- Exact dropdown/picker component styling
- Welcome screen layout and copy
- How to persist "first time seen" flag (localStorage or similar)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FORK-01 | i18n stripped from all 43 components -- `useTranslation` calls replaced with English string literals | Full i18n audit complete: 43 files with `useTranslation`, 60 files importing i18n, `en/*.json` locale files provide replacement text. `LanguageSelector.jsx` component deleted. `I18nextProvider` removed from App.tsx. `import './i18n/config.js'` removed from main.jsx. |
| FORK-02 | Cursor CLI backend integration removed -- all Cursor-specific code, routes, and UI elements deleted | Full Cursor audit complete: `server/cursor-cli.js` (275 lines), `server/routes/cursor.js` (794 lines), ~30 references in `server/index.js`, `CursorLogo.tsx`, CURSOR_MODELS in `shared/modelConstants.js`, cursor state in `useChatProviderState.ts`, cursor entries in settings constants/types. Sidebar `cursorSessions` in `Project` interface. 82 frontend files reference "cursor". |
| FORK-03 | **SCOPE CHANGE:** Codex is KEPT, not removed. Three providers remain: Claude, Codex, Gemini. Roadmap success criteria #3 and #4 need updating. New provider UX features added to this phase (default-to-Claude, header dropdown, composer picker, welcome screen, per-provider model memory). | Provider architecture documented: `SessionProvider` type, `useChatProviderState.ts`, `ProviderSelectionEmptyState.tsx`, `SessionProviderLogo.tsx`, settings constants. Per-provider model memory already partially implemented (individual localStorage keys per model). |
</phase_requirements>

## Standard Stack

### Core (Existing -- No New Libraries)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | existing | UI framework | Already installed |
| react-router-dom | existing | Routing | Already installed |
| lucide-react | existing | Icons (ChevronDown, Check, etc.) | Already used for all icons |
| Tailwind CSS | existing | Styling | Already used for all styling |
| localStorage | browser API | Persist provider choice, model memory, "first time" flag | Already used for provider/model persistence |

### Removed (This Phase)
| Library | Current Version | Purpose | Why Remove |
|---------|----------------|---------|------------|
| react-i18next | in dependencies | React i18n binding | English only -- all 43 components get string literals |
| i18next | in dependencies | i18n framework | No longer needed |
| i18next-browser-languagedetector | in dependencies | Language detection | No longer needed |
| I18nextProvider | from react-i18next | Provider in App.tsx | Removed with i18n |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| localStorage for "first-time" flag | IndexedDB, cookie | localStorage is simplest, already used for provider/model, sufficient for a boolean flag |
| Custom header dropdown | Radix UI Select | Radix adds dependency; a custom Tailwind dropdown is lightweight and consistent with existing codebase patterns |

## Architecture Patterns

### Pattern 1: i18n Replacement (Mechanical)
**What:** Replace `const { t } = useTranslation('namespace');` + `t('key.path')` with the English string literal from `src/i18n/locales/en/{namespace}.json`.
**When to use:** All 43 files with `useTranslation`.
**Process:**
1. For each file, identify the namespace(s) used (e.g., `'chat'`, `'common'`, `'settings'`)
2. Look up each `t('key.path')` in the corresponding `en/*.json` file
3. Replace with the English string literal
4. For interpolated strings like `t('key', { count: 5 })`, convert to template literals: `` `${count} items` ``
5. Remove the `useTranslation` import and `const { t } = useTranslation(...)` line
6. Remove `import { useTranslation } from 'react-i18next'` when no `t` or `i18n` usage remains

**Example:**
```typescript
// BEFORE
import { useTranslation } from 'react-i18next';
// ...
const { t } = useTranslation('chat');
return <p>{t('session.continue.title')}</p>;

// AFTER (lookup en/chat.json -> session.continue.title = "Continue your conversation")
return <p>Continue your conversation</p>;
```

**Interpolation example:**
```typescript
// BEFORE
t('session.messages.showingOf', { shown: 10, total: 50 })

// AFTER (en/chat.json -> "Showing {{shown}} of {{total}} messages")
`Showing ${shown} of ${total} messages`
```

### Pattern 2: Cursor Stripping (Subtractive)
**What:** Remove all code paths, types, and UI elements that reference the Cursor provider.
**When to use:** After i18n removal (since some Cursor strings are in locale files).
**Process:**
1. Delete files: `CursorLogo.tsx`, `server/cursor-cli.js`, `server/routes/cursor.js`
2. Update type unions: `'claude' | 'cursor' | 'codex' | 'gemini'` -> `'claude' | 'codex' | 'gemini'`
3. Remove cursor branches in switch/if statements
4. Remove cursor-specific state (cursorModel, setCursorModel) from hooks
5. Remove cursor entries from constants arrays (AGENT_PROVIDERS, PROVIDERS, etc.)
6. Remove Cursor session handling from server/index.js WebSocket logic
7. Remove `cursorSessions` from Project interface and useProjectsState
8. Remove Cursor from sidebar session view model
9. Remove CURSOR_MODELS from shared/modelConstants.js
10. Remove cursor CLI auth route from cli-auth.js
11. Remove cursor references from server/projects.js session loading
12. Update commands.js to remove cursor model list

### Pattern 3: Provider Default-to-Claude Flow
**What:** New sessions auto-start with Claude instead of showing a provider selection gate.
**When to use:** Replacing `ProviderSelectionEmptyState` behavior.
**Implementation:**
1. `useChatProviderState` already defaults to `'claude'` via localStorage fallback -- this is already correct
2. `ProviderSelectionEmptyState` currently shows a 4-provider grid for new sessions. Repurpose as a one-time welcome screen
3. New sessions skip the provider picker and go straight to the chat composer with Claude active
4. Check `localStorage.getItem('loom-welcomed')` (or similar key) -- if null, show welcome; after dismiss, set to `'true'`

### Pattern 4: Header Provider Dropdown
**What:** A compact dropdown in the chat header showing "Provider (Active Model)" with switching.
**When to use:** New component in the chat header area.
**Implementation:**
1. Create `ProviderDropdown.tsx` component
2. Display: `SessionProviderLogo` + "Claude (Sonnet)" text
3. Dropdown lists all 3 providers with their current remembered model
4. On select: update provider via `setProvider()`, persist to localStorage
5. Wire into chat header bar (likely in `ChatInterface.tsx` or a new header component)

### Pattern 5: Composer Provider Mini-Picker
**What:** Compact provider logo icon near the send button that opens a mini-picker popup.
**When to use:** Addition to `ChatComposer.tsx`.
**Implementation:**
1. Add `SessionProviderLogo` icon near the send button area
2. On click, show a small popup with 3 provider logo buttons
3. Selecting a provider updates the same shared state as the header dropdown
4. Keep minimal visual footprint

### Pattern 6: Per-Provider Model Memory
**What:** Each provider independently remembers its last-used model.
**When to use:** Already partially implemented in `useChatProviderState.ts`.
**Current state:** `claudeModel`, `codexModel`, `geminiModel` state variables already persist to localStorage independently. The `cursorModel` state is removed with Cursor stripping. This pattern is already working -- just needs Cursor cleanup and UX wiring to the new dropdown/picker.

### Anti-Patterns to Avoid
- **Don't strip i18n piecemeal per-component:** Process all 43 files in one plan. Partial removal leaves broken imports.
- **Don't leave Cursor type in union:** TypeScript will not error on unused union members, but grep audits will flag it. Remove completely.
- **Don't add a new context/provider for provider state:** The existing `useChatProviderState` hook + localStorage is sufficient. No need for React Context here.
- **Don't build the welcome screen as a modal:** It should be an inline empty state (repurposing the existing component slot), not a blocking overlay.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| i18n key lookup | Manual string search | Read `en/*.json` files directly as source of truth | JSON files ARE the canonical English strings |
| Provider logo rendering | New logo components | Existing `SessionProviderLogo.tsx` | Already handles all provider logos with fallback |
| Model options per provider | Hardcoded model lists | `shared/modelConstants.js` CLAUDE_MODELS, CODEX_MODELS, GEMINI_MODELS | Single source of truth, shared between server and client |
| Provider state persistence | Custom storage layer | Existing localStorage pattern in `useChatProviderState.ts` | Already works, just needs Cursor cleanup |

**Key insight:** This phase is primarily deletion and rearrangement of existing code, not creation of new infrastructure. The provider architecture already exists -- the work is removing Cursor from it and adding UX surfaces (dropdown, picker, welcome) that connect to the same state.

## Common Pitfalls

### Pitfall 1: Missing i18n Interpolation Variables
**What goes wrong:** A `t('key', { count: n })` call uses `{{count}}` in the JSON. Replacing with just the static string loses the dynamic value.
**Why it happens:** Easy to miss the interpolation pattern when doing mechanical replacement.
**How to avoid:** For each `t()` call, check if a second argument object is passed. If so, the replacement must be a template literal using those variable names. Grep for `t\([^)]*,\s*\{` to find all interpolated translations.
**Warning signs:** Build succeeds but UI shows literal `{{count}}` text, or undefined variable errors at runtime.

### Pitfall 2: Orphaned Cursor Imports After Deletion
**What goes wrong:** Deleting `CursorLogo.tsx` or `cursor-cli.js` breaks files that import them.
**Why it happens:** Import chains can be deep (e.g., `SessionProviderLogo` imports `CursorLogo`).
**How to avoid:** After deleting Cursor files, run `npm run typecheck` immediately. TypeScript will catch all broken imports. Fix each one by removing the cursor branch/import.
**Warning signs:** TypeScript errors about missing modules.

### Pitfall 3: Server-Side Cursor References in WebSocket Handler
**What goes wrong:** The `server/index.js` WebSocket handler has ~30 cursor references including `cursor-command`, `cursor-resume`, `cursor-abort` message types. Missing one leaves dead code or errors.
**Why it happens:** The WebSocket handler is a 2,017-line file with interleaved provider logic.
**How to avoid:** Systematically search for all cursor patterns in index.js: `'cursor'`, `cursor-`, `Cursor`, `spawnCursor`, `abortCursorSession`, `isCursorSessionActive`, `getActiveCursorSessions`. Remove the cursor-specific branches while keeping the claude/codex/gemini branches intact.
**Warning signs:** WebSocket messages fail silently because a dead code path is reached.

### Pitfall 4: Cursor Session Data in Project Interface
**What goes wrong:** The `Project` interface has `cursorSessions?: ProjectSession[]`. Removing it without updating all consumers breaks TypeScript.
**Why it happens:** `cursorSessions` is used in `useProjectsState.ts`, sidebar components, and `server/projects.js`.
**How to avoid:** Remove `cursorSessions` from `Project` interface in `types/app.ts`, then fix all TypeScript errors. Also remove `getCursorSessions` function from `server/projects.js` and cursor session loading.
**Warning signs:** TypeScript errors about `cursorSessions` not existing on type.

### Pitfall 5: LanguageSelector Component Still Imported
**What goes wrong:** `LanguageSelector.jsx` becomes dead code after i18n removal but is still imported in 2 files (`AppearanceSettingsTab.tsx`, `QuickSettingsPanel.jsx`).
**Why it happens:** Deletion of the component without removing its import/usage in parent components.
**How to avoid:** Delete `LanguageSelector.jsx`, then fix the 2 importing files by removing the language selector UI entirely (since there's no i18n, there's no language to select).
**Warning signs:** Build fails on missing import.

### Pitfall 6: Welcome Screen Shows Every New Session
**What goes wrong:** User wants welcome to show ONCE ever, but if tied to session state, it reappears every new session.
**Why it happens:** Confusing "no session selected" with "first time user".
**How to avoid:** Use a dedicated localStorage key (e.g., `loom-welcomed`) set to `true` after the first dismissal. Check this flag INDEPENDENTLY of session state. The current `ProviderSelectionEmptyState` triggers on `!selectedSession && !currentSessionId` -- the welcome screen should add an additional `!localStorage.getItem('loom-welcomed')` check.
**Warning signs:** Welcome screen reappears on every new session instead of once.

## Code Examples

### i18n Replacement: Simple String
```typescript
// BEFORE (ChatComposer.tsx)
import { useTranslation } from 'react-i18next';
const { t } = useTranslation('chat');
// ...
title={t('input.attachImages')}

// AFTER (from en/chat.json -> input.attachImages = "Attach images")
title="Attach images"
```

### i18n Replacement: Interpolated String
```typescript
// BEFORE (ChatMessagesPane.tsx)
t('session.messages.showingOf', { shown, total })

// AFTER (en/chat.json -> "Showing {{shown}} of {{total}} messages")
`Showing ${shown} of ${total} messages`
```

### i18n Replacement: Conditional i18n Object Usage
```typescript
// BEFORE (ProviderSelectionEmptyState.tsx)
const { t } = useTranslation('chat');
// ...
{
  claude: t('providerSelection.readyPrompt.claude', { model: claudeModel }),
  cursor: t('providerSelection.readyPrompt.cursor', { model: cursorModel }),
  codex: t('providerSelection.readyPrompt.codex', { model: codexModel }),
  gemini: t('providerSelection.readyPrompt.gemini', { model: geminiModel }),
}[provider]

// AFTER
{
  claude: `Ready to use Claude with ${claudeModel}. Start typing your message below.`,
  codex: `Ready to use Codex with ${codexModel}. Start typing your message below.`,
  gemini: `Ready to use Gemini with ${geminiModel}. Start typing your message below.`,
}[provider]
```

### Cursor Type Removal
```typescript
// BEFORE (src/types/app.ts)
export type SessionProvider = 'claude' | 'cursor' | 'codex' | 'gemini';

// AFTER
export type SessionProvider = 'claude' | 'codex' | 'gemini';
```

### Provider Dropdown Component (Skeleton)
```typescript
// New: src/components/chat/view/subcomponents/ProviderDropdown.tsx
import { useState, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import SessionProviderLogo from '../../../llm-logo-provider/SessionProviderLogo';
import type { SessionProvider } from '../../../../types/app';

interface ProviderDropdownProps {
  provider: SessionProvider;
  modelLabel: string;
  onProviderChange: (provider: SessionProvider) => void;
  providers: Array<{ id: SessionProvider; name: string; model: string }>;
}

export default function ProviderDropdown({
  provider, modelLabel, onProviderChange, providers
}: ProviderDropdownProps) {
  const [open, setOpen] = useState(false);
  // ... dropdown implementation with click-outside handling
}
```

### Welcome Screen Flag
```typescript
// In ProviderSelectionEmptyState (repurposed)
const hasBeenWelcomed = localStorage.getItem('loom-welcomed') === 'true';

// Show welcome only for truly first-time users with no session
if (!selectedSession && !currentSessionId && !hasBeenWelcomed) {
  return <WelcomeScreen onDismiss={() => {
    localStorage.setItem('loom-welcomed', 'true');
    // Focus the textarea to start chatting
  }} />;
}

// For all other new sessions: go straight to chat (Claude is default)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| i18n for multi-language | English-only string literals | This phase | Removes 3 npm packages, ~4,700 lines of locale files, simplifies all 43 components |
| 4-provider grid (Claude/Cursor/Codex/Gemini) | 3-provider system (Claude/Codex/Gemini) with default-to-Claude | This phase | Removes Cursor CLI dependency, simplifies provider selection |
| Provider selection gate on every new session | Welcome once, then default-to-Claude | This phase | Reduces friction for new sessions |

## Project Tooling

| Tool | Command | Detected From |
|------|---------|---------------|
| Lint | Not detected | - |
| Type Check | `npm run typecheck` | package.json scripts |
| Build | `npm run build` | package.json scripts |
| Test | Not detected | - |

*Already in `.planning/config.json` under `tooling` key.*

## Codebase Inventory

### i18n Files to Delete
| Path | Lines | Content |
|------|-------|---------|
| `src/i18n/config.js` | 163 | i18next initialization |
| `src/i18n/languages.js` | 59 | Language list/helpers |
| `src/i18n/locales/en/common.json` | 223 | English common strings |
| `src/i18n/locales/en/chat.json` | 242 | English chat strings |
| `src/i18n/locales/en/settings.json` | 418 | English settings strings |
| `src/i18n/locales/en/auth.json` | 37 | English auth strings |
| `src/i18n/locales/en/tasks.json` | (exists) | English task strings |
| `src/i18n/locales/en/sidebar.json` | (exists) | English sidebar strings |
| `src/i18n/locales/en/codeEditor.json` | (exists) | English code editor strings |
| `src/i18n/locales/ko/*` | 7 files | Korean translations |
| `src/i18n/locales/zh-CN/*` | 7 files | Chinese translations |
| `src/i18n/locales/ja/*` | 7 files | Japanese translations |
| **Total** | **~4,700 lines** | |

### Components with `useTranslation` (43 files)
Full list from grep:
1. `src/components/LoginForm.jsx`
2. `src/components/app/AppContent.tsx`
3. `src/components/LanguageSelector.jsx` (DELETE entirely)
4. `src/components/main-content/view/subcomponents/MainContentStateView.tsx`
5. `src/components/main-content/view/subcomponents/MainContentTabSwitcher.tsx`
6. `src/components/main-content/view/subcomponents/MainContentTitle.tsx`
7. `src/components/sidebar/view/Sidebar.tsx`
8. `src/components/sidebar/view/modals/VersionUpgradeModal.tsx`
9. `src/components/settings/view/tabs/agents-settings/AgentListItem.tsx`
10. `src/components/settings/view/tabs/agents-settings/sections/AgentCategoryTabsSection.tsx`
11. `src/components/settings/view/tabs/agents-settings/sections/content/AccountContent.tsx`
12. `src/components/settings/view/tabs/agents-settings/sections/content/McpServersContent.tsx`
13. `src/components/settings/view/tabs/agents-settings/sections/content/PermissionsContent.tsx`
14. `src/components/settings/view/tabs/AppearanceSettingsTab.tsx`
15. `src/components/settings/view/tabs/tasks-settings/TasksSettingsTab.tsx`
16. `src/components/settings/view/modals/ClaudeMcpFormModal.tsx`
17. `src/components/settings/view/modals/CodexMcpFormModal.tsx`
18. `src/components/settings/view/Settings.tsx`
19. `src/components/settings/view/SettingsMainTabs.tsx`
20. `src/components/settings/view/tabs/api-settings/CredentialsSettingsTab.tsx`
21. `src/components/settings/view/tabs/api-settings/sections/ApiKeysSection.tsx`
22. `src/components/settings/view/tabs/api-settings/sections/GithubCredentialsSection.tsx`
23. `src/components/settings/view/tabs/api-settings/sections/NewApiKeyAlert.tsx`
24. `src/components/settings/view/tabs/api-settings/sections/VersionInfoSection.tsx`
25. `src/components/settings/view/tabs/git-settings/GitSettingsTab.tsx`
26. `src/components/code-editor/view/CodeEditor.tsx`
27. `src/components/ProjectCreationWizard.jsx`
28. `src/components/file-tree/view/FileTree.tsx`
29. `src/components/file-tree/view/FileTreeDetailedColumns.tsx`
30. `src/components/file-tree/view/FileTreeHeader.tsx`
31. `src/components/file-tree/view/FileTreeLoadingState.tsx`
32. `src/components/file-tree/view/FileTreeBody.tsx`
33. `src/components/chat/view/ChatInterface.tsx`
34. `src/components/chat/view/subcomponents/ChatMessagesPane.tsx`
35. `src/components/chat/view/subcomponents/MessageComponent.tsx`
36. `src/components/chat/view/subcomponents/ChatComposer.tsx`
37. `src/components/chat/view/subcomponents/ChatInputControls.tsx`
38. `src/components/chat/view/subcomponents/Markdown.tsx`
39. `src/components/chat/view/subcomponents/ProviderSelectionEmptyState.tsx`
40. `src/components/chat/view/subcomponents/ThinkingModeSelector.tsx`
41. `src/components/QuickSettingsPanel.jsx`
42. `src/components/shell/view/Shell.tsx`
43. `src/components/TaskList.jsx`

### Additional i18n Infrastructure Files (not `useTranslation` but import i18n)
- `src/App.tsx` -- `I18nextProvider` wrapper, `import i18n from './i18n/config.js'`
- `src/main.jsx` -- `import './i18n/config.js'`
- `src/utils/dateUtils.ts` -- may import i18n for date formatting
- Various sidebar subcomponents importing from sidebar utils that reference i18n

### Cursor Files to Delete
| Path | Lines | Content |
|------|-------|---------|
| `server/cursor-cli.js` | 275 | Cursor CLI process spawner |
| `server/routes/cursor.js` | 794 | Cursor REST API routes |
| `src/components/llm-logo-provider/CursorLogo.tsx` | small | Cursor SVG logo |

### Cursor References in Server Files (Modify, Not Delete)
| File | Reference Count | What to Remove |
|------|----------------|----------------|
| `server/index.js` | ~30 references | Import of cursor-cli, cursor routes mounting, WebSocket cursor-command/cursor-resume/cursor-abort handlers, cursor provider branches |
| `server/routes/cli-auth.js` | 2 references | `/cursor/status` route, cursor-agent spawn |
| `server/projects.js` | ~12 references | `getCursorSessions()`, cursorSessions loading, cursor project directory handling |
| `server/routes/commands.js` | 3 references | CURSOR_MODELS usage, cursor provider branch |
| `server/gemini-cli.js` | minor | May have cursor comparison |

### Cursor References in Frontend Files (82 files matched grep)
Most are simply `'cursor'` in a type union or provider list. Key structural changes:
- `src/types/app.ts` -- Remove `'cursor'` from `SessionProvider`, remove `cursorSessions` from `Project`
- `src/components/chat/hooks/useChatProviderState.ts` -- Remove cursorModel state, cursor config fetch, CURSOR_MODELS import
- `src/components/settings/constants/constants.ts` -- Remove `'cursor'` from AGENT_PROVIDERS, remove DEFAULT_CURSOR_PERMISSIONS, remove cursor from AUTH_STATUS_ENDPOINTS
- `src/components/settings/types/types.ts` -- Remove `'cursor'` from AgentProvider, remove CursorPermissionsState, remove cursor from SettingsStoragePayload
- `src/components/chat/view/subcomponents/ProviderSelectionEmptyState.tsx` -- Remove Cursor from PROVIDERS array
- `src/components/llm-logo-provider/SessionProviderLogo.tsx` -- Remove cursor branch and CursorLogo import
- `src/components/sidebar/types/types.ts` -- Remove `isCursorSession` from SessionViewModel
- `src/hooks/useProjectsState.ts` -- Remove cursorSessions from project comparison and session aggregation
- `shared/modelConstants.js` -- Remove CURSOR_MODELS export

## Open Questions

1. **Mid-session provider switching behavior**
   - What we know: User said this is Claude's discretion. Current code changes provider for the whole session.
   - What's unclear: Should switching mid-conversation start a new session, or keep history and just change the API?
   - Recommendation: Keep it simple -- switching provider mid-session changes the API for subsequent messages but keeps the conversation history. This matches how the code already works. No need to force a new session.

2. **Exact header dropdown placement**
   - What we know: User wants it "in the chat header bar" showing "Provider (Active Model)".
   - What's unclear: The exact position relative to existing header elements (session title, etc.).
   - Recommendation: Place it at the right side of the header bar, next to any existing controls. Use the same `SessionProviderLogo` that already exists.

3. **Welcome screen copywriting**
   - What we know: User wants a one-time welcome that mentions other providers are available via header dropdown.
   - What's unclear: Exact copy text.
   - Recommendation: Brief, functional copy: "Welcome to Loom" heading, 1-2 lines about it defaulting to Claude, a note that Codex and Gemini are available via the header dropdown, and a "Start chatting" button that dismisses it.

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection via grep/glob/read (all file counts, line counts, and code patterns verified against actual files)
- `src/i18n/locales/en/*.json` -- canonical English strings for replacement
- `src/types/app.ts` -- SessionProvider type definition
- `src/components/chat/hooks/useChatProviderState.ts` -- provider state architecture
- `shared/modelConstants.js` -- model definitions
- `server/index.js` -- WebSocket handler cursor references (line numbers verified)
- `server/routes/cursor.js`, `server/cursor-cli.js` -- cursor backend scope

### Secondary (MEDIUM confidence)
- Pattern for welcome screen localStorage flag -- based on common React patterns and how existing localStorage is used in the codebase

## Metadata

**Confidence breakdown:**
- i18n removal: HIGH -- all 43 files enumerated, locale JSON provides exact replacement strings, mechanical process
- Cursor stripping: HIGH -- all server and client files identified with line counts, TypeScript will catch missed references
- Provider UX features: HIGH -- existing architecture well-understood, changes are additive to working provider state system
- Pitfalls: HIGH -- based on actual code structure analysis, not speculation

**Research date:** 2026-03-02
**Valid until:** 2026-04-02 (stable -- no external library research needed, all based on codebase state)
