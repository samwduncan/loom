# Roadmap: Loom v4.0 "The Command Center"

## Milestones

- ✅ **v1.0 "The Skeleton"** - Phases 1-10 (shipped 2026-03-07)
- ✅ **v1.1 "The Chat"** - Phases 11-19 (shipped 2026-03-09)
- ✅ **v1.2 "The Workspace"** - Phases 20-27 (shipped 2026-03-12)
- ✅ **v1.3 "The Refinery"** - Phases 28-37 (shipped 2026-03-17)
- ✅ **v1.4 "The Navigator"** - Phases 38-43 (shipped 2026-03-18)
- ✅ **v1.5 "The Craft"** - Phases 44-47 (shipped 2026-03-20)
- ✅ **v2.0 "The Engine"** - Phases 50-58 (shipped 2026-03-27)
- ✅ **v2.1 "The Mobile"** - Phases 59-63 (shipped 2026-03-28)
- ✅ **v2.2 "The Touch"** - Phases 64-67.1 (closed 2026-03-30, Capacitor abandoned)
- ✅ **v3.0 "The App"** - Phases 68-69 (closed 2026-04-03, 70-73 superseded)
- ✅ **v3.1 "The App (Rebuilt)"** - Phase 74 (abandoned 2026-04-03, pivoted to control plane)
- 🚧 **v4.0 "The Command Center"** - Phases 75-85 (in progress)
- 📋 **v5.0 "The Power"** - (planned, multi-provider tabs + MCP management)
- 📋 **v6.0 "The Polish"** - (planned, full visual transformation)

## Overview

Transform Loom from a web-only chat interface into the AI development control plane. Starting from a working Expo scaffold (Phase 68), @loom/shared stores, and Phase 74 shell/connection work, build a complete iOS command center: Private Mind-adapted chat shell, push notifications for session events, tmux-backed agent management with relay security, human-in-the-loop permission protocol, Dynamic Island live activities, cross-agent task communication, and a testing pyramid. 11 phases, 50 requirements, fine granularity.

## Phases

**Phase Numbering:**
- Integer phases (75, 76, 77...): Planned milestone work
- Decimal phases (76.1, 76.2): Urgent insertions (marked with INSERTED)

- [ ] **Phase 75: Chat Shell** - Private Mind-adapted chat UI wired to Loom stores with streaming, tool cards, and full session management
- [ ] **Phase 76: Push Notifications** - Session completion and permission alerts via Expo Push Service with deep links and action buttons
- [ ] **Phase 77: Relay Security** - JWT authentication, agent registration, and 3-layer presence detection on relay connections
- [ ] **Phase 78: Agent Backend** - TmuxTransport, AgentManager, SQLite metadata, REST/WS API for agent lifecycle
- [ ] **Phase 79: Agent Dashboard** - Mobile UI for spawning, monitoring, and controlling agent sessions from iPhone
- [ ] **Phase 80: HITL Protocol Design** - Architecture document for permission request/response flow via relay with timeout and edge cases
- [ ] **Phase 81: HITL Implementation** - Permission requests via relay, push notification actions, inline chat approval, configurable timeout
- [ ] **Phase 82: Dynamic Island** - Live Activities showing active session status, progress bar, and deep-link tap targets
- [ ] **Phase 83: Cross-Agent Communication** - Relay task protocol (assign/complete/error), heartbeat monitoring, dead agent detection
- [ ] **Phase 84: Testing Infrastructure** - Storybook 9 component isolation, Maestro E2E screenshots, Kimi visual QA pipeline
- [ ] **Phase 85: Integration Hardening** - End-to-end verification of all v4.0 features working together on device

## Phase Details

<details>
<summary>✅ v1.0-v3.1 (Phases 1-74) -- Shipped/Closed</summary>

See `.planning/milestones/` for archived phase details from prior milestones.

Phase 74 (Shell & Connection) completed 2026-04-03: Auth, WebSocket lifecycle, drawer navigation, theme system, safe areas. 4 plans executed. v3.1 direction then pivoted to control plane vision (v4.0).

</details>

### Phase 75: Chat Shell
**Goal**: User has a working chat app on iPhone with session management, streamed markdown, tool call cards, and permission handling -- wired to Loom backend via shared stores
**Depends on**: Nothing (first phase of v4.0; inherits Phase 68 scaffold + Phase 74 shell/connection)
**Requirements**: CHAT-01, CHAT-02, CHAT-03, CHAT-04, CHAT-05, CHAT-06, CHAT-07, CHAT-08, CHAT-09, CHAT-10, CHAT-11, CHAT-12
**Success Criteria** (what must be TRUE):
  1. User sees sessions grouped by status (running/recent) in a navigation drawer and can switch between them preserving scroll position
  2. User can create a new session, send a message, and see a streamed AI response with markdown rendering, syntax-highlighted code blocks, tool call cards, and expandable thinking blocks
  3. User can search sessions by title, delete sessions with swipe gesture, and approve/deny permission requests inline in chat
  4. App authenticates via JWT in iOS Keychain and WebSocket reconnects automatically on network changes
**Plans**: 6 plans
Plans:
- [x] 75-01-PLAN.md -- Foundation: deps, theme Small typography, message segment parser, date section utility
- [ ] 75-02-PLAN.md -- Drawer upgrade: date-grouped SectionList, search, swipe-delete, toast system
- [ ] 75-03-PLAN.md -- Content segments: TextSegment (markdown), CodeBlockSegment (syntax highlighting), ThinkingSegment (expand/collapse)
- [ ] 75-04-PLAN.md -- Interactive segments: ToolChip + ToolDetailSheet (bottom sheet), PermissionCard (approve/deny)
- [ ] 75-05-PLAN.md -- Composer (3-state FSM) + MessageList + MessageItem + UserBubble + AssistantMessage + StreamingIndicator
- [ ] 75-06-PLAN.md -- Chat screen wiring, scroll position preservation, providers, end-to-end verification checkpoint
**UI hint**: yes

### Phase 76: Push Notifications
**Goal**: User receives actionable push notifications when sessions complete or need permission, with deep links into the specific session
**Depends on**: Phase 75 (chat must exist for deep links to land)
**Requirements**: PUSH-01, PUSH-02, PUSH-03, PUSH-04, PUSH-05, PUSH-06
**Success Criteria** (what must be TRUE):
  1. User receives a push notification on iPhone when a session completes (app backgrounded or killed)
  2. User taps the notification and lands directly in the specific session conversation
  3. User receives a push notification when an agent needs permission and can approve/deny from notification action buttons without opening the app
  4. User can configure notification granularity in settings (all / failures only / permissions only)
**Plans**: TBD
**UI hint**: yes

### Phase 77: Relay Security
**Goal**: Relay connections are authenticated via JWT and agents register with verifiable identity, preventing unauthorized access to the orchestration bus
**Depends on**: Phase 75 (needs working app for testing relay from mobile)
**Requirements**: RELAY-01, RELAY-02, RELAY-03, RELAY-04
**Success Criteria** (what must be TRUE):
  1. Relay rejects WebSocket connections that lack a valid JWT token with a clear error message
  2. Agents register with type, capabilities, and tmux session ID upon connecting to the relay
  3. Relay detects dead connections via 3-layer presence (WS ping, agent heartbeat, orchestrator health check)
**Plans**: TBD

### Phase 78: Agent Backend
**Goal**: Backend can spawn, monitor, and kill AI agent sessions (Claude/Codex/Gemini) via tmux, storing metadata in SQLite and exposing REST/WS API
**Depends on**: Phase 77 (relay must be secure before agents connect to it)
**Requirements**: AGENT-06, AGENT-07, AGENT-08, AGENT-09
**Success Criteria** (what must be TRUE):
  1. Backend spawns Claude/Codex/Gemini sessions in tmux via TmuxTransport and tracks full lifecycle (spawning -> running -> completed -> cleaned_up)
  2. Backend stores agent session metadata in SQLite and exposes CRUD via REST (POST/GET/DELETE /api/tasks)
  3. Backend streams live agent output to connected clients via WebSocket using 100ms capture-pane polling
**Plans**: TBD

### Phase 79: Agent Dashboard
**Goal**: User can spawn, monitor, and control AI agent sessions from the mobile app with a status-first dashboard
**Depends on**: Phase 78 (backend API must exist before mobile UI)
**Requirements**: AGENT-01, AGENT-02, AGENT-03, AGENT-04, AGENT-05
**Success Criteria** (what must be TRUE):
  1. User can spawn a new agent session (Claude/Codex/Gemini) from the app with a project directory picker and see it appear in the dashboard
  2. User can view a dashboard of all agent sessions with status badges and aggregate stats (running count, completed today, failures)
  3. User can tap an agent to view live output and can kill a running session from the detail view
**Plans**: TBD
**UI hint**: yes

### Phase 80: HITL Protocol Design
**Goal**: Complete architectural design for the human-in-the-loop permission flow -- relay message schemas, push integration, timeout behavior, and edge cases documented
**Depends on**: Phase 77 (relay security), Phase 76 (push infrastructure)
**Requirements**: HITL-01
**Success Criteria** (what must be TRUE):
  1. Architecture document exists covering the full permission.request / permission.response relay message flow with concrete TypeScript interfaces
  2. Document specifies timeout behavior, edge cases (network loss mid-approval, app killed, duplicate requests, race conditions), and integration points with push notifications and inline chat
**Plans**: TBD

### Phase 81: HITL Implementation
**Goal**: Agents can request human permission via relay, delivered as both push notification and inline chat card, with configurable timeout and auto-deny
**Depends on**: Phase 80 (design document), Phase 78 (agent backend for spawning agents that request permission)
**Requirements**: HITL-02, HITL-03, HITL-04, HITL-05, HITL-06
**Success Criteria** (what must be TRUE):
  1. Agent sends permission.request via relay and receives permission.response (approved or denied) back through the same channel
  2. Permission request appears as a push notification with approve/deny action buttons when app is backgrounded
  3. Permission request appears inline in chat with approve/deny buttons when app is in foreground
  4. Unanswered permission requests auto-deny after a configurable timeout duration
**Plans**: TBD
**UI hint**: yes

### Phase 82: Dynamic Island
**Goal**: Active agent sessions show live status in Dynamic Island with progress indication, elapsed time, and tap-to-open deep linking
**Depends on**: Phase 76 (shares APNs infrastructure), Phase 78 (agent backend for session events)
**Requirements**: ISLAND-01, ISLAND-02, ISLAND-03, ISLAND-04, ISLAND-05
**Success Criteria** (what must be TRUE):
  1. When a task starts, Dynamic Island compact view shows session name and status; tapping it deep-links to the active session
  2. Expanded Dynamic Island shows session name, token count, elapsed time, and a progress bar
  3. Live Activity starts when a task begins and ends within 5 seconds of completion
  4. Server pushes APNs Live Activity updates every 5-10 seconds during active streaming
**Plans**: TBD
**UI hint**: yes

### Phase 83: Cross-Agent Communication
**Goal**: Orchestrator can assign tasks to agents via relay, agents report completion or failure, and dead agents are detected via missed heartbeats
**Depends on**: Phase 77 (relay security), Phase 78 (agent backend for spawning agents)
**Requirements**: XAGENT-01, XAGENT-02, XAGENT-03, XAGENT-04
**Success Criteria** (what must be TRUE):
  1. Orchestrator assigns a task to an agent via relay (task.assign) and receives task.complete or task.error response
  2. Agents send periodic heartbeat with status (idle/working/waiting) and the orchestrator detects dead agents via missed heartbeats within 90 seconds
**Plans**: TBD

### Phase 84: Testing Infrastructure
**Goal**: Mobile components are testable in isolation via Storybook, Maestro captures E2E visual regressions, and Kimi provides AI-scored visual QA reports
**Depends on**: Phase 75 (components must exist to test), Phase 79 (agent dashboard provides additional surfaces)
**Requirements**: TEST-01, TEST-02, TEST-03, TEST-04
**Success Criteria** (what must be TRUE):
  1. Key mobile components render in Storybook 9 with multiple states (loading, error, empty, populated)
  2. Maestro E2E tests run against a Development Build and capture screenshots for visual regression comparison
  3. Kimi visual QA evaluates screenshots and produces a scored JSON report with severity-rated findings
  4. Testing pipeline runs in defined order: lint -> types -> jest -> Maestro -> Kimi
**Plans**: TBD

### Phase 85: Integration Hardening
**Goal**: All v4.0 features verified working end-to-end on device with cross-feature interactions tested and edge cases covered
**Depends on**: All previous phases (75-84)
**Requirements**: (cross-cutting verification -- all 50 requirements pass on device)
**Success Criteria** (what must be TRUE):
  1. User can complete a full workflow on device: spawn agent from dashboard, receive push on completion, view result in chat, approve a permission request from notification
  2. Dynamic Island updates live during a running agent session while user is in a different app
  3. All 50 v4.0 requirements pass verification on iPhone 16 Pro Max
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 75 -> 76 -> 77 -> 78 -> 79 -> 80 -> 81 -> 82 -> 83 -> 84 -> 85

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 75. Chat Shell | v4.0 | 1/6 | In Progress|  |
| 76. Push Notifications | v4.0 | 0/TBD | Not started | - |
| 77. Relay Security | v4.0 | 0/TBD | Not started | - |
| 78. Agent Backend | v4.0 | 0/TBD | Not started | - |
| 79. Agent Dashboard | v4.0 | 0/TBD | Not started | - |
| 80. HITL Protocol Design | v4.0 | 0/TBD | Not started | - |
| 81. HITL Implementation | v4.0 | 0/TBD | Not started | - |
| 82. Dynamic Island | v4.0 | 0/TBD | Not started | - |
| 83. Cross-Agent Communication | v4.0 | 0/TBD | Not started | - |
| 84. Testing Infrastructure | v4.0 | 0/TBD | Not started | - |
| 85. Integration Hardening | v4.0 | 0/TBD | Not started | - |

## Backlog (Future Milestones)

- **Subagent Monitoring Panel** -- When Claude spawns subagents (Agent tool), show active subagents in a panel/overlay. v5.0 scope.
- **HITL via Dynamic Island** -- HITL-DI-01, HITL-DI-02: approve/deny permission from Dynamic Island compact/expanded view. v5.0 scope.
- **Full Orchestration** -- ORCH-01 through ORCH-04: fan-out, result aggregation, dependency graphs, direct agent messaging. v5.0 scope.
- **Home Screen Widgets** -- WIDGET-01, WIDGET-02: running agent count, one-tap spawn. v5.0 scope.
- **14 open Forgejo issues from v2.2** -- Most architecturally resolved by React Native. Verify closure during v4.0 device testing.

---
*Created: 2026-03-07*
*Last updated: 2026-04-03 after Phase 75 planning (6 plans, 4 waves)*
