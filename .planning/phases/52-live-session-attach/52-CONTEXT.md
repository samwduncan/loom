# Phase 52: Live Session Attach - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via autonomous workflow)

<domain>
## Phase Boundary

Users can watch a running CLI session stream output in real-time from the browser. The sidebar shows which sessions have active CLI processes. Users can attach/detach without interrupting the running process. Permission prompts from attached sessions surface in the Loom UI.

This is Loom's killer differentiator — no competitor can do this. "Mission control for AI agents from your phone."

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion. Key constraints from research:

**Backend — SessionWatcher module:**
- Use `fs.watch` directly (NOT chokidar) — chokidar has 2s `awaitWriteFinish` delay that kills live streaming
- Track byte offset per watched file — on change, read only new bytes from last position
- Maximum 1-3 simultaneous file watches (don't exhaust inotify limit)
- New module: `server/session-watcher.js` — exports `watchSession(sessionId, projectPath, callback)`, `unwatchSession(sessionId)`, `getActiveWatches()`
- Parse new JSONL entries as they arrive, emit through callback
- Handle edge cases: file truncation, rotation, deletion

**WebSocket Protocol — Reuse existing /ws channel:**
- New client→server messages: `attach-session { sessionId, projectPath }`, `detach-session { sessionId }`
- New server→client message: `live-session-data { sessionId, entries: [] }` — batch of new JSONL entries
- Extend existing multiplexer callbacks, don't create new WebSocket endpoints
- Active session detection: scan JSONL file mtimes to find recently-written files

**Frontend — Attach UI:**
- Sidebar: pulsing dot indicator for sessions with recent JSONL writes (last 60s)
- "Attach" button or auto-attach when navigating to an active session
- Live output renders through existing streaming pipeline (reuse ActiveMessage, tool cards, etc.)
- "Detach" button to stop watching without killing the CLI process
- Permission prompts from attached sessions route through existing PermissionBanner

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/websocket-client.ts` — WebSocket singleton, `send()` method
- `lib/stream-multiplexer.ts` — Message routing with callback injection
- `lib/websocket-init.ts` — Callback wiring for all message types
- `stores/stream.ts` — Streaming state (isStreaming, activeSessionId, toolCalls, etc.)
- `components/chat/view/ActiveMessage.tsx` — Live streaming display
- `components/chat/tools/PermissionBanner.tsx` — Permission prompt UI

### Established Patterns
- WebSocket message routing through multiplexer callbacks
- Stream store manages all live streaming state
- Content tokens buffered via wsClient.subscribeContent()

### Integration Points
- `server/index.js` — WebSocket message handler for new attach/detach types
- `server/projects.js` — Session file location logic (extractProjectDirectory)
- `src/src/components/sidebar/SessionItem.tsx` — Add "live" indicator
- `src/src/components/chat/view/ChatView.tsx` — Auto-attach logic when viewing active session

</code_context>

<specifics>
## Specific Ideas

From research (ARCHITECTURE.md, PITFALLS.md):
- Explicit user-initiated attach over auto-detection (show "Attach" button, don't try to detect running processes)
- The Happy Coder analysis documents a "session scanner pattern" (JSONL file watcher) — same concept
- Use `fs.createReadStream({ start: offset })` for reading only new bytes
- Batch new entries (don't send one WS message per JSONL line — batch every 100ms)

</specifics>

<deferred>
## Deferred Ideas

- Auto-detect running CLI sessions via process list (fragile, prefer JSONL mtime heuristic)
- Cross-machine session attach (would need different transport, not just local file watching)

</deferred>
