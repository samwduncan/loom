# Requirements: Loom v4.0 "The Command Center"

**Defined:** 2026-04-03
**Core Value:** Make AI agent work visible, beautiful, and controllable — from anywhere

## v4.0 Requirements

Requirements for this milestone. Each maps to roadmap phases.

### Chat Shell

- [ ] **CHAT-01**: User can view sessions grouped by status (running/recent) in a navigation drawer
- [ ] **CHAT-02**: User can create a new chat session and send messages
- [ ] **CHAT-03**: User can view streamed AI responses with markdown rendering
- [ ] **CHAT-04**: User can view tool call cards inline (Bash, Read, Edit, Write, Glob, Grep)
- [ ] **CHAT-05**: User can expand/collapse thinking blocks during and after inference
- [ ] **CHAT-06**: User can view code blocks with syntax highlighting and copy button
- [ ] **CHAT-07**: User can switch between sessions preserving scroll position
- [ ] **CHAT-08**: User can authenticate with server via JWT token stored in iOS Keychain
- [ ] **CHAT-09**: User sees connection status and WebSocket reconnects automatically
- [ ] **CHAT-10**: User can search sessions by title
- [ ] **CHAT-11**: User can delete sessions with swipe gesture
- [ ] **CHAT-12**: User can approve/deny permission requests inline in chat

### Push Notifications

- [ ] **PUSH-01**: User receives push notification when a session completes
- [ ] **PUSH-02**: User can tap notification to deep-link into the specific session
- [ ] **PUSH-03**: User receives push notification when an agent needs permission
- [ ] **PUSH-04**: User can approve/deny permission directly from notification action buttons
- [ ] **PUSH-05**: User can configure notification granularity (all / failures only / permissions only)
- [ ] **PUSH-06**: Server sends push via Expo Push Service on session events

### Agent Management

- [ ] **AGENT-01**: User can spawn a new AI agent session (Claude/Codex/Gemini) from the app
- [ ] **AGENT-02**: User can view a dashboard of all agent sessions with status badges
- [ ] **AGENT-03**: User can view live output from a running agent session
- [ ] **AGENT-04**: User can kill a running agent session
- [ ] **AGENT-05**: User can see aggregate stats (running count, completed today, failures)
- [ ] **AGENT-06**: Backend manages agent lifecycle via TmuxTransport (spawn, capture-pane, send-keys, cleanup)
- [ ] **AGENT-07**: Backend stores agent session metadata in SQLite
- [ ] **AGENT-08**: Backend exposes REST API for agent CRUD (POST/GET/DELETE /api/tasks)
- [ ] **AGENT-09**: Backend streams live output via WebSocket (100ms capture-pane polling)

### Dynamic Island + Live Activities

- [ ] **ISLAND-01**: Active session status appears in Dynamic Island compact view (name + status)
- [ ] **ISLAND-02**: Expanded Dynamic Island shows session name, token count, elapsed time, progress bar
- [ ] **ISLAND-03**: Tapping Dynamic Island deep-links to the active session
- [ ] **ISLAND-04**: Live Activity starts when a task begins and ends within 5s of completion
- [ ] **ISLAND-05**: Server pushes APNs Live Activity updates every 5-10 seconds during streaming

### Relay Security

- [ ] **RELAY-01**: Relay requires JWT authentication for all WebSocket connections
- [ ] **RELAY-02**: Agent registration includes agent type, capabilities, and tmux session ID
- [ ] **RELAY-03**: 3-layer presence detection (WS ping, agent heartbeat, orchestrator health check)
- [ ] **RELAY-04**: Unauthorized relay connections are rejected with error message

### HITL Protocol

- [ ] **HITL-01**: HITL protocol architecture designed (relay message flow, timeout, edge cases)
- [ ] **HITL-02**: Agent can request human permission via relay message (permission.request)
- [ ] **HITL-03**: Permission request delivered as push notification with approve/deny actions
- [ ] **HITL-04**: Permission request appears inline in chat when app is foreground
- [ ] **HITL-05**: Permission response delivered back to agent via relay (permission.response)
- [ ] **HITL-06**: Permission request times out after configurable duration with auto-deny

### Cross-Agent Communication

- [ ] **XAGENT-01**: Orchestrator can assign tasks to agents via relay (task.assign)
- [ ] **XAGENT-02**: Agents report completion or failure via relay (task.complete / task.error)
- [ ] **XAGENT-03**: Agents send heartbeat with status (idle/working/waiting) via relay
- [ ] **XAGENT-04**: Orchestrator detects dead agents via missed heartbeats

### Testing Infrastructure

- [ ] **TEST-01**: Mobile components render in Storybook 9 for isolation testing
- [ ] **TEST-02**: Maestro E2E tests capture screenshots for visual regression
- [ ] **TEST-03**: Kimi visual QA evaluates screenshots and produces scored JSON report
- [ ] **TEST-04**: Testing pipeline integrated into dev workflow (lint → types → jest → Maestro → Kimi)

## Future Requirements (v5.0+)

Acknowledged but deferred. Not in current roadmap.

### HITL — Dynamic Island Approval
- **HITL-DI-01**: User can approve/deny permission requests from Dynamic Island compact view
- **HITL-DI-02**: User can approve/deny permission requests from Dynamic Island expanded view

### Full Orchestration
- **ORCH-01**: Orchestrator can fan-out tasks to multiple agents simultaneously
- **ORCH-02**: Orchestrator collects and compares responses from multiple agents (result aggregation)
- **ORCH-03**: Orchestrator manages task dependency graphs (agent B waits for agent A)
- **ORCH-04**: Agents can send direct messages to other agents (bypass orchestrator)

### Mobile Extras
- **WIDGET-01**: Home screen widget shows running agent count and failures
- **WIDGET-02**: Home screen widget allows one-tap agent spawn

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Android | iOS-only until iOS is daily-driver quality |
| Light mode | Dark-only; potential future stretch goal |
| Full IDE in mobile | Complement desktop, don't replace — Loom is a control plane |
| Capacitor/WKWebView | Dead end, proven by v2.2 (5/7 critical bugs architecturally unfixable) |
| LLM-to-LLM conversation routing | Agents talk to Loom, not each other — simplifies protocol |
| Aurora/visual effects | Deferred to v6.0 "The Polish" — don't lead with polish |
| Multi-user / auth system | Single-user tool; backend already handles auth |
| Port web UI to RN | Redesign for mobile from scratch, not convert div/span to View/Text |
| Agent-to-agent direct messaging | YAGNI — orchestrator mediates all communication for v4.0 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| *(populated by roadmapper)* | | |

**Coverage:**
- v4.0 requirements: 42 total
- Mapped to phases: 0
- Unmapped: 42 ⚠️

---
*Requirements defined: 2026-04-03*
*Last updated: 2026-04-03 after initial definition*
