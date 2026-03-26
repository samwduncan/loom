# Phase 50: SQLite Data Layer - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase — discuss skipped)

<domain>
## Phase Boundary

Sessions load instantly from a SQLite cache instead of parsing JSONL files on every request. This is the foundation phase — every subsequent phase (state persistence, live attach, mobile performance) depends on sub-second data access.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — pure infrastructure phase. Key constraints from research:

- Use better-sqlite3 (already installed) with a separate `cache.db` file
- WAL mode mandatory for concurrent read/write safety
- JSONL remains source of truth — cache is freely deletable
- Cache invalidation via mtime + file size comparison
- Background cache warmer on server startup (index all JSONL within 30s)
- Schema: session_messages (session_id, message_index, role, content, raw_json, metadata) + session_metadata (session_id, title, project, message_count, total_cost, last_activity, jsonl_mtime, jsonl_size)
- Byte-offset tracking for incremental updates (avoid re-parsing entire files)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `server/projects.js` — `parseJsonlSessions()`, `extractProjectDirectory()`, session loading logic
- `better-sqlite3` — already installed, used for auth.db at `~/.cloudcli/auth.db`
- 383 JSONL files, 646MB total in `~/.claude/projects/`

### Established Patterns
- Express REST endpoints return JSON
- Session messages fetched via `GET /api/projects/:project/sessions/:sessionId/messages`
- Session list via `GET /api/projects/:project/sessions`
- JSONL parsing happens in `projects.js` with `readline` interface

### Integration Points
- Replace JSONL-read code paths in `projects.js` with cache-first reads
- Keep existing REST API contract unchanged (frontend doesn't change)
- New `MessageCache` module in `server/` with `get()`, `set()`, `invalidate()`, `warm()`

</code_context>

<specifics>
## Specific Ideas

From research (ARCHITECTURE.md, PITFALLS.md):
- Do NOT reuse auth.db — separate cache.db file that can be deleted safely
- chokidar's existing watcher is for file tree, NOT for cache invalidation
- Cache warming should log progress (for debugging slow startups)
- Consider `PRAGMA cache_size` tuning for large session datasets

</specifics>

<deferred>
## Deferred Ideas

- Live JSONL file watching (Phase 52 — separate concern)
- Frontend IndexedDB mirror (evaluate after SQLite cache proves the perf win)

</deferred>
