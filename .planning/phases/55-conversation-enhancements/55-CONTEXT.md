# Phase 55: Conversation Enhancements - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via autonomous workflow)

<domain>
## Phase Boundary

Smart conversation features that match ChatGPT/Gemini mobile apps: suggested follow-up prompts, conversation templates, background session notifications, and per-message model selection. These are the features that make Loom feel like a polished product, not a developer tool.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion. Key constraints:

- CONV-01: Suggested follow-up prompts appear as tappable pills after assistant responses. The backend generates suggestions (or extract from the AI response if it includes them). Frontend renders as a row of pills below the last assistant message.
- CONV-02: Conversation templates on the empty state. Replace "What would you like to work on?" with categorized template chips (Code Review, Debug, Explain, Write Tests — already have some). Add more categories and make them configurable.
- CONV-03: Background session indicator — when an idle session gets a response (from a queued message or live attach), show a notification dot on the sidebar session item and optionally a toast.
- CONV-04: Model selector in composer. Small dropdown/popover to switch between Claude/Gemini/Codex per message. The backend already supports multi-provider (claude-command, codex-command, gemini-command WebSocket types). Frontend just needs to let the user pick which provider to use.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/src/components/chat/view/ChatEmptyState.tsx` — Existing empty state with suggestion chips
- `src/src/components/chat/composer/ChatComposer.tsx` — Composer with send logic
- `src/src/components/sidebar/SessionItem.tsx` — Session item (already has streaming/live dots)
- `src/src/types/websocket.ts` — claude-command, codex-command, gemini-command types
- `src/src/components/ui/popover.tsx` — shadcn Popover (used by QuickSettings, ComposerStatusBar)

### Established Patterns
- Suggestion chips as buttons in ChatEmptyState
- Popover for small selection menus
- Toast notifications via sonner

### Integration Points
- ChatView: render follow-up pills after last assistant message
- ChatEmptyState: enhance with more template categories
- SessionItem: add notification dot state
- ChatComposer: add model selector popover near send button

</code_context>

<specifics>
## Specific Ideas

- Follow-up pills: parse `[suggested follow-up]` patterns from AI responses, or use the last few message topics to generate suggestions client-side
- Model selector: show provider icon (Claude/Gemini/Codex) + short name, click to switch
- Background notification: use the `claude-complete` WebSocket message to detect idle session getting a response

</specifics>

<deferred>
## Deferred Ideas

- AI-generated follow-up suggestions (would need backend endpoint) — use client-side heuristics for now
- Conversation templates from file/API (hardcode initial set, make extensible later)

</deferred>
