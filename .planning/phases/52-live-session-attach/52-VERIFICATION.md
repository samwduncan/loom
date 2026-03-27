---
phase: 52-live-session-attach
verified: 2026-03-27T00:30:00Z
status: human_needed
score: 12/13 must-haves verified
re_verification: false
human_verification:
  - test: "Navigate to a session that a CLI process is actively writing to, check banner appears"
    expected: "Green 'Watching live session' banner appears; new messages appear in real time in the chat view"
    why_human: "Requires a live CLI process running against a JSONL file to verify end-to-end streaming works"
  - test: "Verify LIVE-05: permission prompts from attached sessions"
    expected: "Permission requests from attached external CLI sessions should surface in Loom UI somehow"
    why_human: "Architectural gap identified: external CLI permission prompts are interactive CLI-level events not captured in JSONL. Tool calls DO appear in timeline. Cannot verify whether requirement intent is satisfied without runtime test"
---

# Phase 52: Live Session Attach Verification Report

**Phase Goal:** Users can watch a running CLI session stream output in real-time from the browser
**Verified:** 2026-03-27
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #  | Truth                                                                                    | Status      | Evidence                                                                              |
|----|------------------------------------------------------------------------------------------|-------------|---------------------------------------------------------------------------------------|
| 1  | SessionWatcher reads only new bytes from a JSONL file on change via byte-offset tracking | ✓ VERIFIED  | `session-watcher.js:143` uses `createReadStream({ start: entry.offset })`             |
| 2  | SessionWatcher emits parsed JSONL entries through EventEmitter on file append            | ✓ VERIFIED  | `session-watcher.js:184` emits `'entries'` event with parsed array                   |
| 3  | attach-session WS message starts watching a JSONL file; detach-session stops it          | ✓ VERIFIED  | `server/index.js:1093-1168` — both handlers implemented with full JSONL resolution   |
| 4  | Server broadcasts live-session-data to the attaching WS client                          | ✓ VERIFIED  | `server/index.js:2167-2178` — entries broadcast filtered to attached clients only    |
| 5  | Maximum simultaneous file watches is capped at 5                                         | ✓ VERIFIED  | `session-watcher.js:37-39` — throws Error at `watched.size >= MAX_WATCHES`           |
| 6  | Sidebar shows a pulsing green 'live' indicator for sessions that are being watched       | ✓ VERIFIED  | `sidebar.css:72-83` session-live-dot + 2s pulse; `SessionItem.tsx:200-202` renders it|
| 7  | Live session data arriving over WebSocket is routed through multiplexer to timeline store | ✓ VERIFIED  | multiplexer routes to `onLiveSessionData` → `transformBackendMessages` → `addMessage` |
| 8  | User can detach from a live session by clicking a Detach button                          | ✓ VERIFIED  | `LiveSessionBanner.tsx:26-30` — handleDetach sends `detach-session` + updates store  |
| 9  | Stream store tracks which sessions are live-attached                                     | ✓ VERIFIED  | `stream.ts:41` — `liveAttachedSessions: Set<string>` with attach/detach/isAttached   |
| 10 | Frontend sends attach-session and detach-session WS messages                            | ✓ VERIFIED  | `ChatView.tsx:114-118` attach; `ChatView.tsx:125` + `useSessionSwitch.ts:59` detach  |
| 11 | Navigating to an active session auto-sends attach-session WS message                    | ✓ VERIFIED  | `ChatView.tsx:100-130` — useEffect with 5-minute recency check and didAttachRef      |
| 12 | A banner shows 'Watching live session' with a Detach button                             | ✓ VERIFIED  | `LiveSessionBanner.tsx:43-53` — "Watching live session" text + Detach button         |
| 13 | Permission prompts from attached sessions surface in existing PermissionBanner           | ? UNCERTAIN | Architectural gap — see analysis below                                                |

**Score:** 12/13 truths verified (1 uncertain)

---

### Required Artifacts

| Artifact                                                     | Expected                                            | Status     | Details                                                          |
|--------------------------------------------------------------|-----------------------------------------------------|------------|------------------------------------------------------------------|
| `server/cache/session-watcher.js`                            | JSONL file tailing with byte-offset delta reads     | ✓ VERIFIED | 204 lines; extends EventEmitter; exports SessionWatcher + singleton; node import test passed |
| `server/index.js`                                            | WS handler for attach-session and detach-session    | ✓ VERIFIED | 19 grep matches for attach/detach/sessionWatcher/clientAttachments/live-session-data |
| `src/src/types/websocket.ts`                                 | ServerMessage types for live session variants       | ✓ VERIFIED | 3 ServerMessage + 2 ClientMessage variants at lines 163-210      |
| `src/src/lib/stream-multiplexer.ts`                          | onLiveSessionData callback routing                  | ✓ VERIFIED | Callback in MultiplexerCallbacks (line 71-73); routing cases (lines 335-341) |
| `src/src/lib/websocket-init.ts`                              | Wiring live session data to timeline store addMessage | ✓ VERIFIED | onLiveSessionData at line 242 with transformBackendMessages + addMessage |
| `src/src/stores/stream.ts`                                   | liveAttachedSessions state and actions              | ✓ VERIFIED | Set<string> at line 41; 3 actions; reset clears it              |
| `src/src/components/sidebar/SessionItem.tsx`                 | Live indicator dot (green pulsing)                  | ✓ VERIFIED | isLiveAttached prop (line 35); session-live-dot span (line 200)  |
| `src/src/components/sidebar/SessionList.tsx`                 | Passes isLiveAttached prop from stream store        | ✓ VERIFIED | liveAttachedSessions selector (line 55); prop passed (line 242)  |
| `src/src/components/sidebar/sidebar.css`                     | Green pulsing dot CSS                               | ✓ VERIFIED | .session-live-dot + @keyframes session-live-pulse + reduced-motion |
| `src/src/components/chat/view/LiveSessionBanner.tsx`         | Banner UI with Detach button                        | ✓ VERIFIED | 57 lines; Radio icon; "Watching live session"; handleDetach sends WS + updates store |
| `src/src/components/chat/view/ChatView.tsx`                  | Auto-attach on navigate; LiveSessionBanner rendered | ✓ VERIFIED | useEffect with didAttachRef; attach-session at line 114; LiveSessionBanner at line 312 |
| `src/src/hooks/useSessionSwitch.ts`                          | Auto-detach on session switch away                  | ✓ VERIFIED | Step 2.5 at lines 55-62; iterates liveAttachedSessions, sends detach-session |

---

### Key Link Verification

| From                                  | To                                    | Via                                       | Status     | Details                                                              |
|---------------------------------------|---------------------------------------|-------------------------------------------|------------|----------------------------------------------------------------------|
| `server/index.js`                     | `server/cache/session-watcher.js`     | import + `sessionWatcher.watch()`         | ✓ WIRED    | Import at line 53; watch() called at line 1124; entries listener at 2167 |
| `server/cache/session-watcher.js`     | `fs.watch`                            | Node.js file watcher                      | ✓ WIRED    | `watch(filePath, ...)` called at line 44 (imported as `watch` from 'fs') |
| `src/src/lib/websocket-init.ts`       | `src/src/stores/timeline.ts`          | `addMessage` for each transformed entry   | ✓ WIRED    | `useTimelineStore.getState().addMessage(sessionId, msg)` at line 246 |
| `src/src/lib/stream-multiplexer.ts`   | MultiplexerCallbacks                  | onLiveSessionData callback                | ✓ WIRED    | Interface line 71; routing `case 'live-session-data':` at line 335   |
| `src/src/lib/websocket-client.ts`     | `server/index.js`                     | attach-session/detach-session messages    | ✓ WIRED    | `wsClient.send()` accepts `ClientMessage` which now includes both types |
| `src/src/components/chat/view/ChatView.tsx` | `src/src/lib/websocket-client.ts` | `wsClient.send({ type: 'attach-session' })` | ✓ WIRED  | Line 114 in ChatView auto-attach useEffect                           |
| `src/src/hooks/useSessionSwitch.ts`   | `src/src/lib/websocket-client.ts`     | `wsClient.send({ type: 'detach-session' })` | ✓ WIRED  | Line 59 in switchSession step 2.5                                    |
| `src/src/components/chat/view/ChatView.tsx` | `LiveSessionBanner.tsx`         | JSX rendering when session is live-attached | ✓ WIRED  | Import at line 38; rendered at line 312 with sessionId prop          |

---

### Data-Flow Trace (Level 4)

| Artifact                                | Data Variable         | Source                                 | Produces Real Data | Status      |
|-----------------------------------------|-----------------------|----------------------------------------|--------------------|-------------|
| `LiveSessionBanner.tsx`                 | `isAttached`          | `stream store.liveAttachedSessions`    | Yes — Set<string> populated via WS events | ✓ FLOWING |
| `SessionItem.tsx` (live dot)            | `isLiveAttached`      | `stream store.liveAttachedSessions`    | Yes — passed from SessionList | ✓ FLOWING |
| `ChatView.tsx` (auto-attach useEffect)  | `sessionUpdatedAt`    | `timeline store.sessions[].updatedAt`  | Yes — from API fetch | ✓ FLOWING |
| `session-watcher.js` entries event      | `entries[]`           | `fs.createReadStream({ start: offset })` | Yes — real file bytes | ✓ FLOWING |

---

### Behavioral Spot-Checks

| Behavior                                     | Command                                                              | Result                              | Status  |
|----------------------------------------------|----------------------------------------------------------------------|-------------------------------------|---------|
| SessionWatcher module loads and exports API  | `node -e "import('./server/cache/session-watcher.js').then(...)"` | watch/unwatch/getActiveWatches/isWatching all `function`, MAX_WATCHES=5 | ✓ PASS |
| TypeScript compiles clean                    | `cd src && npx tsc --noEmit`                                         | No output (no errors)               | ✓ PASS  |
| All 6 phase commits exist in git             | `git log --oneline` grep for commit hashes                           | All 6 hashes found                  | ✓ PASS  |
| Live-session WS types present               | grep for live-session-data in websocket.ts                           | 3 ServerMessage + 2 ClientMessage found | ✓ PASS |
| End-to-end live stream                       | Requires running CLI process writing to JSONL                        | N/A — needs running server + CLI    | ? SKIP  |

---

### Requirements Coverage

| Requirement | Source Plan | Description                                                           | Status      | Evidence                                                              |
|-------------|-------------|-----------------------------------------------------------------------|-------------|-----------------------------------------------------------------------|
| LIVE-01     | 52-02       | Sidebar shows "active" indicator for sessions with running CLI processes | ✓ SATISFIED | session-live-dot in SessionItem.tsx, liveAttachedSessions selector in SessionList.tsx, sidebar.css pulse animation |
| LIVE-02     | 52-02, 52-03 | User can attach to a running session and see real-time output         | ✓ SATISFIED | auto-attach in ChatView, live-session-data→transformBackendMessages→addMessage pipeline |
| LIVE-03     | 52-01       | JSONL file watcher uses fs.watch with byte-offset delta parsing (<200ms latency) | ✓ SATISFIED | session-watcher.js uses fs.watch + createReadStream({ start: offset }) + 100ms debounce |
| LIVE-04     | 52-02, 52-03 | User can detach from live session without interrupting the CLI process | ✓ SATISFIED | Detach button in LiveSessionBanner sends detach-session; server unwatch() stops file watcher only, CLI continues |
| LIVE-05     | 52-03       | Permission prompts from attached sessions surface in Loom UI          | ? UNCERTAIN | Architectural gap — see analysis below                                |

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None found | — | No TODOs, FIXMEs, stubs, or placeholder returns in phase artifacts | — | — |

---

### LIVE-05 Architectural Analysis

**Requirement:** Permission prompts from attached sessions surface in Loom UI.

**What was implemented:** The plan states "no additional code needed — already routed via multiplexer." The multiplexer handles `claude-permission-request` ServerMessages (line 266 of stream-multiplexer.ts), which trigger `onPermissionRequest` → `setPermissionRequest` → `PermissionBanner`.

**The gap:** `claude-permission-request` is emitted by `server/claude-sdk.js` when Loom OWNS the Claude session (i.e., Loom started it). For externally-attached CLI sessions, permission prompts happen as interactive terminal events in the CLI process — they are not written to the JSONL file as separate entries, and the Loom server has no channel to intercept them.

**What does flow:** Tool calls made by the external CLI DO appear in the JSONL as `assistant` message entries with `tool_use` content blocks. These flow through `transformBackendMessages → addMessage` and are visible in the timeline. This shows the user what tools ran, but not blocking permission requests before they run.

**Verdict:** If LIVE-05 means "blocking permission prompts appear in the PermissionBanner overlay for external CLI sessions," it is NOT satisfied. If it means "tool activity from attached sessions is visible," it IS satisfied. Human verification needed to confirm requirement intent and actual runtime behavior.

---

### Human Verification Required

#### 1. End-to-End Live Session Streaming

**Test:** Start a Claude CLI session in a terminal (e.g., `claude "write a hello world"` in a project directory). With Loom open in the browser, navigate to that session in the sidebar. Wait for the banner and observe message updates.

**Expected:** Green pulsing dot appears in sidebar for the session; "Watching live session" banner appears at the bottom of the chat view above the status bar; new messages appear in real-time as the CLI writes them.

**Why human:** Requires a live CLI process actively writing to a JSONL file. Cannot simulate with a static file check.

#### 2. LIVE-05 Permission Prompts

**Test:** Start an external Claude CLI session with `--permission-mode default` (which prompts for tool permissions). Navigate to the session in Loom. Wait for a permission prompt in the CLI.

**Expected (per requirement):** Permission prompt should surface in Loom UI via PermissionBanner.

**Why human:** Architectural gap — external CLI permission prompts happen at CLI level. Need to verify whether (a) the requirement is satisfied via tool-call visibility in timeline, (b) the requirement is partially met, or (c) LIVE-05 needs a gap plan.

#### 3. Detach Without Interrupting CLI

**Test:** Attach to a running CLI session, then click "Detach" in the banner.

**Expected:** Banner disappears, sidebar live dot disappears, CLI continues running uninterrupted, JSONL file continues to grow.

**Why human:** Requires confirming the CLI process is unaffected by detach (backend stops fs.watch but does not kill any process — needs runtime confirmation).

---

### Gaps Summary

No automated-verifiable gaps. All 12 of 13 verifiable must-haves pass all levels (exists, substantive, wired, data-flowing). TypeScript compiles clean. All 6 commits verified in git history.

The one uncertain truth (LIVE-05) is an architectural limitation: external CLI permission requests are terminal-interactive events not captured in JSONL. Tool calls from attached sessions DO appear in the timeline. Whether this satisfies the requirement intent requires human judgment and runtime verification.

---

*Verified: 2026-03-27*
*Verifier: Claude (gsd-verifier)*
