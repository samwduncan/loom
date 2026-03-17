# Phase 40: Session Titles & Rename - Research

**Researched:** 2026-03-17
**Domain:** Frontend session title extraction, backend PATCH integration, Zustand store persistence
**Confidence:** HIGH

## Summary

This phase connects two existing pieces: (1) the backend PATCH endpoint for session titles (built in Phase 39, BACK-02), and (2) the frontend inline rename UI (built in earlier milestones). The gap is that renaming currently only updates the Zustand store locally -- it does not call the backend endpoint, so renames are lost on cache clear or browser change.

The auto-title requirement (SESS-01) needs a title extraction function that strips system prompts, XML wrapper tags, `<objective>` blocks, and task-notification content from the first real user message. The backend already has a similar system-message filter in `parseJsonlSessions` (line 777-789 of projects.js), but the frontend stub session creation in `ChatComposer.tsx` just does `trimmed.slice(0, 50)` with no filtering.

**Primary recommendation:** Create a shared `extractSessionTitle(text: string): string` utility used by both stub session creation and backend summary fallback. Wire `handleSessionRename` to call the backend PATCH endpoint. Backend already handles everything -- this is purely a frontend wiring phase.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SESS-01 | Auto-generated titles from first real user message, skipping system prompts/XML/objective blocks | Title extraction utility function; applied at stub creation in ChatComposer and as backend summary fallback |
| SESS-02 | Backend PATCH endpoint persists renamed titles to JSONL summary entry | Already built in Phase 39 (BACK-02). Endpoint: `PATCH /api/projects/:name/sessions/:id` with `{ title }` body. Appends `type: 'summary'` entry to JSONL. |
| SESS-03 | Frontend rename calls backend endpoint so renames survive cache clear | Wire `handleSessionRename` in SessionList.tsx to call `apiFetch` PATCH before updating Zustand store |
</phase_requirements>

## Standard Stack

### Core (already in project)
| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| Zustand | 5.x | Timeline store with `updateSessionTitle` action | Exists, works |
| React Router | 6.x | Session navigation | Exists |
| apiFetch | internal | JWT-authenticated fetch wrapper with 401 retry | Exists at `src/src/lib/api-client.ts` |

### No New Dependencies

This phase requires zero new libraries. Everything is in-project already:
- Backend PATCH endpoint exists (`server/index.js` line 548)
- Frontend inline rename UI exists (`SessionItem.tsx`)
- Zustand `updateSessionTitle` action exists (`timeline.ts` line 145)
- `apiFetch` handles auth and error handling

## Architecture Patterns

### Current Flow (broken)
```
User double-clicks title -> SessionItem enters edit mode -> Enter/blur confirms
-> SessionList.handleSessionRename calls updateSessionTitle(sessionId, newTitle)
-> Zustand store updates locally
-> Title visible in sidebar
-> LOST on cache clear / browser change (only in localStorage, not backend)
```

### Target Flow (SESS-03)
```
User double-clicks title -> SessionItem enters edit mode -> Enter/blur confirms
-> SessionList.handleSessionRename:
   1. Optimistically update Zustand store (immediate UI response)
   2. Call PATCH /api/projects/:name/sessions/:id with { title }
   3. On failure: rollback Zustand title to previous value, show toast error
-> Title persisted in JSONL via backend summary entry
-> Survives cache clear, browser change, reload
```

### Auto-Title Flow (SESS-01)
```
User types message in ChatComposer -> stub session created
-> extractSessionTitle(userMessage) strips:
   - System prompts (<system-reminder>, <command-name>, etc.)
   - XML wrapper tags (<objective>, <task-notification>, etc.)
   - GSD content blocks
   - Leading/trailing whitespace
-> First 80 chars of cleaned text becomes stub title
-> Backend also applies similar logic when no summary exists (fallback)
```

### File Structure
```
src/src/
├── lib/
│   └── extract-session-title.ts          # NEW: title extraction utility
│   └── extract-session-title.test.ts     # NEW: tests for extraction
├── components/
│   └── sidebar/
│       └── SessionList.tsx               # MODIFY: wire rename to backend PATCH
│       └── SessionList.test.tsx          # MODIFY: add PATCH integration tests
├── components/
│   └── chat/
│       └── composer/
│           └── ChatComposer.tsx          # MODIFY: use extractSessionTitle for stubs
```

### Pattern: Optimistic Update with Rollback

This is the standard pattern for the rename operation:

```typescript
// In SessionList.tsx handleSessionRename
const handleSessionRename = useCallback(
  async (sessionId: string, newTitle: string) => {
    // 1. Capture previous title for rollback
    const previousTitle = sessions.find(s => s.id === sessionId)?.title;

    // 2. Optimistic update (instant UI response)
    updateSessionTitle(sessionId, newTitle);
    setEditingSessionId(null);

    // 3. Persist to backend
    try {
      await apiFetch(
        `/api/projects/${encodeURIComponent(projectName)}/sessions/${sessionId}`,
        { method: 'PATCH', body: JSON.stringify({ title: newTitle }) },
      );
    } catch (err) {
      // 4. Rollback on failure
      if (previousTitle !== undefined) {
        updateSessionTitle(sessionId, previousTitle);
      }
      toast.error('Failed to rename session');
      console.error('Session rename failed:', err);
    }
  },
  [sessions, updateSessionTitle, projectName],
);
```

### Pattern: Title Extraction

The extraction function should handle all the patterns seen in JSONL data:

```typescript
// src/src/lib/extract-session-title.ts

const SYSTEM_PREFIXES = [
  '<command-name>',
  '<command-message>',
  '<command-args>',
  '<local-command-stdout>',
  '<system-reminder>',
  'Caveat:',
  'This session is being continued from a previous',
  'Invalid API key',
] as const;

const XML_TAG_REGEX = /^<(objective|task-notification|files_to_read|additional_context|output|user_constraints|phase_requirements)[^>]*>[\s\S]*?<\/\1>/;
const LEADING_XML_TAGS = /^<[^>]+>\s*/;

export function extractSessionTitle(text: string, maxLength = 80): string {
  let cleaned = text.trim();

  // Skip if it's a system message
  for (const prefix of SYSTEM_PREFIXES) {
    if (cleaned.startsWith(prefix)) return '';
  }

  // Strip leading XML wrapper blocks
  cleaned = cleaned.replace(XML_TAG_REGEX, '').trim();

  // Strip any remaining leading XML tags
  cleaned = cleaned.replace(LEADING_XML_TAGS, '').trim();

  // Strip JSON-like content (Task Master prompts)
  if (cleaned.startsWith('{') && cleaned.includes('"subtasks"')) return '';
  if (cleaned.includes('CRITICAL: You MUST respond with ONLY a JSON')) return '';

  if (!cleaned) return '';

  // Truncate at sentence boundary or max length
  if (cleaned.length > maxLength) {
    const truncated = cleaned.slice(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    return (lastSpace > maxLength * 0.6 ? truncated.slice(0, lastSpace) : truncated) + '...';
  }

  return cleaned;
}
```

### Anti-Patterns to Avoid
- **Fire-and-forget PATCH without error handling:** Must rollback on failure, not silently lose data
- **Blocking UI on PATCH response:** Optimistic update first, PATCH async
- **Duplicating system-message filters:** Single `extractSessionTitle` function, not copy-paste from backend

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Auth-aware API calls | Custom fetch with token injection | `apiFetch` from `src/src/lib/api-client.ts` | Already handles JWT, 401 retry |
| Toast notifications | Custom error display | `sonner` toast (already imported in SessionList) | Consistent UX |
| Store updates | Direct setState | `updateSessionTitle` Zustand action | Immer middleware handles immutability |

## Common Pitfalls

### Pitfall 1: Race condition between optimistic update and refetch
**What goes wrong:** `loom:projects-updated` WebSocket event triggers `useSessionList` refetch, which could overwrite the optimistic title with the old backend value if the PATCH hasn't completed yet.
**Why it happens:** The refetch reads sessions from backend, and the JSONL write from PATCH is async.
**How to avoid:** The refetch in `useSessionList` only adds NEW sessions (line 71-77: `if (!existingIds.has(backendSession.id))`). It does NOT update existing session titles. So this is actually safe -- the existing session's title is preserved.
**Warning signs:** If someone adds title-sync to the refetch logic, this would break.

### Pitfall 2: Empty title after XML stripping
**What goes wrong:** A user message that is 100% XML wrapper content (like a GSD objective block) produces an empty title.
**How to avoid:** `extractSessionTitle` returns empty string for these cases. ChatComposer should fall back to `'New Chat'` when extraction returns empty.

### Pitfall 3: Encoding in PATCH URL
**What goes wrong:** Project names with special characters (spaces, slashes) break the URL.
**How to avoid:** Already handled -- `encodeURIComponent(projectName)` is the pattern used everywhere in the codebase (see SessionList.tsx line 156).

### Pitfall 4: handleSessionRename becoming async
**What goes wrong:** The current `handleSessionRename` is synchronous. Making it async changes its signature for the `onRename` prop passed to `SessionItem`.
**How to avoid:** Keep the function async but void-return it. The `onRename` callback type in `SessionItemProps` is `(id: string, newTitle: string) => void` -- async functions returning void are compatible. Wrap the call as `void handleSessionRename(sessionId, newTitle)` or use `onRename={handleSessionRename}` directly since async void is assignable to void.

## Code Examples

### Backend PATCH Endpoint (exists, from Phase 39)
```typescript
// PATCH /api/projects/:projectName/sessions/:sessionId
// Body: { title: string }
// Response: { success: true, title: string }
// Validation: title required, non-empty, max 200 chars
// Action: appends { type: 'summary', sessionId, summary: title, timestamp } to JSONL
```

### Backend Session Summary Resolution (exists in parseJsonlSessions)
```javascript
// Priority order for session.summary:
// 1. Most recent type='summary' entry with matching sessionId (from rename/PATCH)
// 2. Pending summary matched via parentUuid/leafUuid
// 3. Fallback: lastUserMessage || lastAssistantMessage, truncated to 50 chars
// 4. Default: 'New Session'
```

### Frontend transformBackendSession (exists)
```typescript
// Maps backend.summary -> session.title
// Falls back to 'New Chat' when summary is falsy
title: backend.summary || 'New Chat',
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Raw `trimmed.slice(0, 50)` for stub title | Should use `extractSessionTitle()` | Phase 40 | Cleaner titles, no XML noise |
| Local-only rename (Zustand) | Optimistic + backend PATCH | Phase 40 | Renames persist across browsers |
| Backend-only title fallback | Frontend extraction + backend fallback | Phase 40 | Consistent titles everywhere |

## Open Questions

None. The backend endpoint exists and is tested. The frontend components exist with inline rename support. This is a straightforward wiring phase.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.x with jsdom |
| Config file | `src/vite.config.ts` (vitest section) |
| Quick run command | `cd src && npx vitest run --reporter=verbose` |
| Full suite command | `cd src && npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SESS-01 | extractSessionTitle strips system prefixes | unit | `cd src && npx vitest run src/src/lib/extract-session-title.test.ts -x` | Wave 0 |
| SESS-01 | extractSessionTitle strips XML tags | unit | same as above | Wave 0 |
| SESS-01 | extractSessionTitle truncates at max length | unit | same as above | Wave 0 |
| SESS-01 | extractSessionTitle returns empty for pure system content | unit | same as above | Wave 0 |
| SESS-02 | Backend PATCH endpoint works | integration | Already tested in Phase 39 | Exists |
| SESS-03 | handleSessionRename calls PATCH endpoint | unit | `cd src && npx vitest run src/src/components/sidebar/SessionList.test.tsx -x` | Partial (rename tests exist, PATCH call test needed) |
| SESS-03 | handleSessionRename rolls back on PATCH failure | unit | same as above | Wave 0 |

### Sampling Rate
- **Per task commit:** `cd src && npx vitest run --reporter=verbose`
- **Per wave merge:** `cd src && npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/src/lib/extract-session-title.test.ts` -- covers SESS-01
- [ ] SessionList.test.tsx additions -- covers SESS-03 PATCH integration and rollback

## Sources

### Primary (HIGH confidence)
- `server/projects.js` lines 668-720 -- backend `updateSessionTitle` function
- `server/index.js` lines 547-578 -- PATCH endpoint definition and validation
- `server/projects.js` lines 719-870 -- `parseJsonlSessions` with summary resolution
- `src/src/components/sidebar/SessionList.tsx` -- current rename flow (local-only)
- `src/src/components/sidebar/SessionItem.tsx` -- inline rename UI
- `src/src/stores/timeline.ts` -- `updateSessionTitle` Zustand action
- `src/src/components/chat/composer/ChatComposer.tsx` line 347 -- stub session title
- `src/src/lib/api-client.ts` -- `apiFetch` with JWT auth and 401 retry
- `src/src/lib/transformMessages.ts` -- `transformBackendSession` mapping

### Secondary (MEDIUM confidence)
- None needed -- all evidence is from direct codebase inspection

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already in use, no new deps
- Architecture: HIGH - pattern is straightforward optimistic update + PATCH
- Pitfalls: HIGH - identified from direct code analysis of existing flows

**Research date:** 2026-03-17
**Valid until:** 2026-04-17 (stable, internal codebase)
