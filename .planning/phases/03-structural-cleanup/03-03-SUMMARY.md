---
phase: 03-structural-cleanup
plan: 03
subsystem: ui
tags: [cursor, provider-cleanup, dead-code-removal, websocket, session-management]

# Dependency graph
requires:
  - phase: 03-structural-cleanup/01
    provides: i18n stripped from chat/core components
  - phase: 03-structural-cleanup/02
    provides: i18n stripped from settings/sidebar components
provides:
  - Cursor CLI backend fully removed (server/cursor-cli.js, server/routes/cursor.js deleted)
  - Cursor provider stripped from all frontend types, hooks, and components
  - SessionProvider type reduced to 'claude' | 'codex' | 'gemini'
  - CURSOR_MODELS export removed from shared/modelConstants.js
  - CursorLogo.tsx deleted
  - Provider UI shows only Claude, Codex, and Gemini
affects: [03-structural-cleanup/04, 03-structural-cleanup/05, 05-chat-message-architecture]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Subtractive cleanup pattern — systematic grep + remove all branches for dead provider

key-files:
  created: []
  modified:
    - server/index.js
    - server/projects.js
    - server/routes/cli-auth.js
    - server/routes/commands.js
    - server/routes/agent.js
    - server/routes/git.js
    - src/types/app.ts
    - shared/modelConstants.js
    - src/components/settings/types/types.ts
    - src/components/settings/constants/constants.ts
    - src/components/sidebar/types/types.ts
    - src/components/llm-logo-provider/SessionProviderLogo.tsx
    - src/components/chat/hooks/useChatProviderState.ts
    - src/components/chat/hooks/useChatComposerState.ts
    - src/components/chat/hooks/useChatRealtimeHandlers.ts
    - src/components/chat/hooks/useChatSessionState.ts
    - src/components/chat/utils/messageTransforms.ts
    - src/components/settings/hooks/useSettingsController.ts
    - src/components/sidebar/utils/utils.ts
    - src/hooks/useProjectsState.ts
    - src/components/chat/view/ChatInterface.tsx
    - src/components/chat/view/subcomponents/ChatMessagesPane.tsx
    - src/components/chat/view/subcomponents/ProviderSelectionEmptyState.tsx
    - src/components/settings/view/Settings.tsx
    - src/components/settings/view/tabs/agents-settings/types.ts
    - src/components/settings/view/tabs/agents-settings/AgentsSettingsTab.tsx
    - src/components/settings/view/tabs/agents-settings/AgentListItem.tsx
    - src/components/settings/view/tabs/agents-settings/sections/AgentSelectorSection.tsx
    - src/components/settings/view/tabs/agents-settings/sections/AgentCategoryContentSection.tsx
    - src/components/settings/view/tabs/agents-settings/sections/content/AccountContent.tsx
    - src/components/settings/view/tabs/agents-settings/sections/content/McpServersContent.tsx
    - src/components/settings/view/tabs/agents-settings/sections/content/PermissionsContent.tsx
    - src/components/sidebar/view/subcomponents/SidebarSessionItem.tsx
    - src/components/Onboarding.jsx
    - src/components/LoginModal.jsx
    - src/components/TaskMasterSetupWizard.jsx
    - src/components/ProjectCreationWizard.jsx
    - src/components/main-content/view/subcomponents/MainContentTitle.tsx
    - src/components/chat/view/subcomponents/AssistantThinkingIndicator.tsx
    - src/components/chat/view/subcomponents/MessageComponent.tsx
    - src/components/shell/utils/auth.ts
    - src/utils/api.js

key-decisions:
  - "Preserved CSS cursor properties (cursor-pointer, cursor-wait), text cursor variables (cursorPosition, cursorPos), CodeMirror dropCursor, and terminal shell cursor styling — only removed Cursor provider references"
  - "Simplified SidebarSessionItem conditional wrappers: replaced isCursorSession guard with unconditional rendering since Cursor sessions no longer exist"
  - "Updated ProviderSelectionEmptyState grid from 4-col to 3-col to match 3 remaining providers"
  - "Changed ProjectCreationWizard text from 'Claude/Cursor sessions' to 'AI agent sessions' for provider-agnostic phrasing"

patterns-established:
  - "Provider removal pattern: core types first, then hooks, then components — ensures typecheck catches cascading references"

requirements-completed: [FORK-02]

# Metrics
duration: 45min
completed: 2026-03-02
---

# Phase 3 Plan 3: Remove Cursor CLI Backend Summary

**Deleted 3 Cursor-specific files and stripped all Cursor provider references from 43 server and frontend files, reducing codebase by 2,689 lines**

## Performance

- **Duration:** ~45 min (across 2 continuation sessions)
- **Started:** 2026-03-02
- **Completed:** 2026-03-02
- **Tasks:** 2
- **Files modified:** 46 (3 deleted, 43 modified)

## Accomplishments
- Deleted server/cursor-cli.js (275 lines), server/routes/cursor.js (794 lines), and CursorLogo.tsx
- Removed all Cursor WebSocket handlers (cursor-command, cursor-resume, cursor-abort, cursor-output, cursor-result, cursor-error)
- Reduced SessionProvider type from 4 members to 3: 'claude' | 'codex' | 'gemini'
- Removed CURSOR_MODELS export, CursorPermissionsState type, cursor auth status, cursor MCP server management
- Removed convertCursorSessionMessages function (~230 lines) and CursorBlob type from messageTransforms
- Provider dropdown/settings now show only Claude, Codex, and Gemini
- npm run typecheck and npm run build both pass cleanly

## Task Commits

Each task was committed atomically:

1. **Task 1: Delete Cursor server files and strip Cursor from all server code** - `6d43cf0` (feat)
   - 9 files changed, 30 insertions, 1465 deletions
2. **Task 2: Delete CursorLogo and strip Cursor from all frontend code** - `e3ac6ee` (feat)
   - 37 files changed, 80 insertions, 1224 deletions

**Plan metadata:** (pending - final docs commit)

## Files Created/Modified

**Deleted:**
- `server/cursor-cli.js` - Cursor CLI process spawner (275 lines)
- `server/routes/cursor.js` - Cursor REST API routes (794 lines)
- `src/components/llm-logo-provider/CursorLogo.tsx` - Cursor logo SVG component

**Server modified (Task 1):**
- `server/index.js` - Removed cursor imports, route mounting, WebSocket handlers
- `server/projects.js` - Removed getCursorSessions, cursorSessions property
- `server/routes/cli-auth.js` - Removed /cursor/status route
- `server/routes/commands.js` - Removed CURSOR_MODELS import and cursor model options
- `server/routes/agent.js` - Removed spawnCursor import and cursor provider branch
- `server/gemini-cli.js` - Removed cursor reference comment
- `server/routes/git.js` - Removed spawnCursor import and cursor provider handling

**Frontend modified (Task 2) - key files:**
- `src/types/app.ts` - SessionProvider reduced to 3 members, cursorSessions removed from Project
- `shared/modelConstants.js` - CURSOR_MODELS export removed
- `src/components/settings/types/types.ts` - Removed cursor from AgentProvider, CursorPermissionsState, cursor settings
- `src/components/settings/constants/constants.ts` - Removed cursor from AGENT_PROVIDERS, auth endpoints
- `src/components/sidebar/types/types.ts` - Removed isCursorSession from SessionViewModel
- `src/components/chat/hooks/useChatRealtimeHandlers.ts` - Removed cursor lifecycle message types
- `src/components/chat/utils/messageTransforms.ts` - Removed convertCursorSessionMessages and CursorBlob
- `src/components/settings/view/tabs/agents-settings/sections/content/PermissionsContent.tsx` - Removed CursorPermissions component and COMMON_CURSOR_COMMANDS
- `src/components/settings/view/tabs/agents-settings/sections/content/McpServersContent.tsx` - Removed CursorMcpServers component
- `src/components/chat/view/subcomponents/ProviderSelectionEmptyState.tsx` - Removed cursor provider, updated grid to 3-col
- `src/components/Onboarding.jsx` - Removed cursor auth state, handlers, and Cursor card UI

## Decisions Made
- Preserved CSS cursor properties (`cursor-pointer`, `cursor-wait`), text cursor variables (`cursorPosition`, `cursorPos`), CodeMirror `dropCursor`, and terminal shell cursor styling — only removed Cursor provider references
- Simplified SidebarSessionItem: replaced `isCursorSession` conditional wrappers with unconditional rendering
- Updated ProviderSelectionEmptyState grid from `grid-cols-2 sm:grid-cols-4` to `grid-cols-3` to match 3 remaining providers
- Changed ProjectCreationWizard text from "Claude/Cursor sessions" to "AI agent sessions" for provider-agnostic phrasing

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Cleaned up !false conditional wrappers in SidebarSessionItem**
- **Found during:** Task 2 (Frontend cleanup - Phase D)
- **Issue:** After replacing `sessionView.isCursorSession` with `false` via replace_all, the resulting `{!false && (...)}` conditional wrappers were redundant (always true)
- **Fix:** Removed the conditional wrappers entirely, making delete/edit button rendering unconditional
- **Files modified:** src/components/sidebar/view/subcomponents/SidebarSessionItem.tsx
- **Verification:** Typecheck passes, buttons still render correctly
- **Committed in:** e3ac6ee (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor cleanup of intermediate state during systematic removal. No scope creep.

## Issues Encountered
- Many files listed in the plan's `files_modified` frontmatter had only CSS cursor properties or text cursor variables, not Cursor provider references — these were correctly identified and skipped (e.g., PRDEditor.jsx, useFileMentions.tsx, useSlashCommands.ts, shell constants, various UI components with cursor-pointer styling)

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Codebase is free of Cursor provider code — ready for Plan 03-04 (provider UX: header dropdown, composer mini-picker, welcome screen, default-to-Claude)
- Plan 03-05 (final verification audit) can confirm zero residual Cursor references
- No blockers or concerns

## Self-Check: PASSED

- server/cursor-cli.js: CONFIRMED deleted
- server/routes/cursor.js: CONFIRMED deleted
- CursorLogo.tsx: CONFIRMED deleted
- Commit 6d43cf0: FOUND
- Commit e3ac6ee: FOUND
- 03-03-SUMMARY.md: FOUND
- cursor in app.ts: 0 matches (expected 0)
- CURSOR_MODELS in modelConstants: 0 matches (expected 0)
- cursor in constants.ts: 0 matches (expected 0)

---
*Phase: 03-structural-cleanup*
*Completed: 2026-03-02*
