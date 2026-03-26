# Feature Research: v2.0 "The Engine" -- Competitive Parity & Differentiation

**Domain:** AI coding workspace -- competitive with ChatGPT app, Gemini app, Claude web, Cursor, Windsurf
**Researched:** 2026-03-26
**Confidence:** HIGH (6 competitor products analyzed, existing reference-app-analysis.md cross-referenced, current 2026 feature sets verified via web research)

**Context:** Loom is a self-hosted web interface for AI coding agents (Claude Code, Gemini, Codex) with terminal, filesystem, git, and multi-provider support. It already ships: chat with streaming, tool call visualization, file tree, code editor, terminal, git panel, settings, command palette, @-mentions, slash commands, session management (auto-titles, project grouping, date subgroups, search, pins, bulk delete), accessibility, and performance optimizations. 49,216 LOC across 609 commits.

**This research answers:** What do competitors do that Loom doesn't? What can Loom do that competitors can't? What features differentiate a daily-driver from a demo?

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features every serious AI chat interface ships in 2026. Missing any of these makes Loom feel incomplete as a daily-driver.

#### Data Layer & Performance

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Instant session switching (<200ms) | ChatGPT, Claude, Gemini all load conversations nearly instantly. Loom currently re-fetches JSONL from disk on every switch. Users expect tap-and-read. | HIGH | Requires client-side message cache (SQLite via backend or IndexedDB in browser). Backend parses JSONL once, caches parsed messages. This is THE critical infrastructure piece -- everything else depends on fast data access. |
| Session metadata persistence | Last-used session, scroll position, sidebar state, active tab -- all must survive browser refresh. ChatGPT and Claude restore exactly where you left off. | MEDIUM | Zustand persist middleware already exists for some stores. Extend to cover scroll position (per-session), last active session ID, sidebar collapsed state. |
| Paginated/virtualized message history | Long conversations (200+ messages) must not degrade performance. ChatGPT uses Ref+State batching at 30-60ms; Open WebUI uses lazy pagination. Loom has content-visibility but not true virtualization. | MEDIUM | content-visibility is a good start. For sessions >500 messages, need @tanstack/react-virtual or similar. Depends on instant session data being available. |
| Request deduplication | Rapid session switches must not fire redundant API calls. Multiple clicks on same session = one fetch. | LOW | AbortController + request cache map. Standard SWR/TanStack Query pattern. |
| Optimistic updates | User message appears instantly in chat before server confirms. ChatGPT, Claude, Gemini all do this. | LOW | Already partially implemented (message added to timeline before WS response). Verify all paths. |

#### Conversation UX

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Suggested follow-up prompts | ChatGPT shows 2-4 semi-transparent pill chips below each response. Claude suggests follow-ups. Gemini ends with "Would you like me to...". Reduces blank-page paralysis. | MEDIUM | Backend needs to extract/generate suggestions from response. Could be client-side heuristic (extract questions from response) or backend LLM call. Start with extraction, upgrade to generation later. |
| Empty state with contextual suggestions | ChatGPT: "How can I help you today, [Name]?" + 2x2 suggestion grid. Claude: warm welcome + project context. Not just a wordmark. | LOW | ChatEmptyState exists with suggestion chips. Enhance: personalize based on project context, recent sessions, time of day. |
| Conversation sharing/export | Claude: share link with snapshot. ChatGPT: share generates public link. LibreChat: Markdown/JSON/CSV/TXT/PNG export. Loom has export but no shareable links. | MEDIUM | Export already exists. Sharing requires backend endpoint to serve public snapshot. Consider: generate static HTML file (self-contained, no server needed) since Loom is self-hosted. |
| Message editing with branch navigation | Claude: edit creates branch, navigate with < 2/3 > arrows. ChatGPT: same pattern. LibreChat: full tree view. This is becoming table stakes in 2026. | HIGH | Requires backend support for forking message history. Claude Code SDK supports --fork-session. UI: edit icon on user messages, branch indicator with navigation arrows. Depends on data layer. |
| Conversation templates / system prompts | ChatGPT: Custom Instructions persist across chats. Claude: Projects with persistent system prompts. Gemini: Gems (custom personas). Cursor: .cursorrules files. | MEDIUM | Backend already supports system prompts per session. Need UI to create/save/apply templates. Store in SQLite or JSON config. Link to project context. |
| Keyboard shortcut for new chat | Every competitor: Cmd+K or Cmd+N for new chat. Loom has Cmd+K for command palette but no direct new-chat shortcut. | LOW | Add Cmd+N → new session. Already in command palette but needs dedicated shortcut. |

#### Mobile & Responsive

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Touch-friendly mobile layout | ChatGPT, Claude, Gemini all have polished mobile apps. Loom is accessed via Tailscale from phone browsers. Must not feel broken on mobile. | HIGH | Existing responsive patterns at 767px breakpoint. Need: sidebar as drawer/sheet, bottom-anchored composer, touch-friendly tap targets (44px min), swipe gestures for sidebar. |
| No viewport zoom on input focus | iOS zooms when input font-size < 16px. Every mobile web app must handle this. | LOW | Set font-size: 16px on textarea, or use viewport meta tag with maximum-scale=1 (accessibility concern). Prefer 16px font. |
| Pull-to-refresh | Mobile web convention. Refresh session list or current conversation. | LOW | CSS overscroll-behavior + JS touch handler. Simple but expected. |
| Safe area insets | iPhone notch/dynamic island, Android navigation bar. PWA must respect safe areas. | LOW | CSS env(safe-area-inset-*). Already partially handled in base.css. Verify coverage. |
| Mobile-optimized composer | Composer must stay above virtual keyboard on iOS/Android. Must not get hidden or cause scroll jumps. | MEDIUM | position: fixed + visualViewport API to detect keyboard height. Well-documented pattern but tricky on iOS Safari. |

#### State & Persistence

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Survive browser restart | Open Loom, close tab, reopen = same session, same scroll position, same sidebar state. ChatGPT and Claude do this perfectly. | MEDIUM | Zustand persist + rehydration. Already partially implemented. Extend to: activeSessionId, scroll offset per session, sidebar open/collapsed, active tab. |
| Draft message persistence across sessions | Type a message, switch sessions, switch back = draft preserved. ChatGPT does this. | LOW | Already implemented in composer (draft persistence). Verify it works across session switches. |
| Theme/preference sync | Settings changes apply instantly and persist. Quick settings toggles survive refresh. | LOW | Already implemented via Zustand persist. Verify all preferences covered. |

### Differentiators (Competitive Advantage)

Features that leverage Loom's unique position: self-hosted, terminal access, filesystem, git integration, multi-provider. No competitor has ALL of these.

#### Unique to Loom's Architecture

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Live session attach (JSONL file watcher) | Watch a running Claude Code CLI session in real-time from Loom's UI. No other web interface can do this. Cursor has cloud handoff but requires their infrastructure. Loom runs on YOUR server where CLI sessions already exist. | HIGH | Backend watches JSONL files with fs.watch/chokidar. Streams new entries via WebSocket. Frontend renders incoming tool calls, thinking, and text in real-time. Inspired by Happy Coder's session scanner pattern. THE killer differentiator. |
| Terminal + Chat in one workspace | Cursor and Windsurf have this in an IDE. ChatGPT/Claude/Gemini do NOT. Loom already has xterm.js terminal. The differentiator is the integration: "Run in Terminal" from tool cards, @-mention terminal output, see filesystem changes in real-time. | LOW | Already built. Enhance: auto-refresh file tree when terminal commands modify files. Deep link between chat tool calls and terminal. |
| Git-aware conversations | No competitor integrates git status into the chat experience. Loom's git panel shows changes, staging, commits, branch ops alongside the conversation that created them. | LOW | Already built. Enhance: auto-show git diff when AI modifies files. "Commit what Claude just did" quick action. |
| Multi-provider model switching | LibreChat does this well. Open WebUI does multi-model comparison. But neither has terminal+git+filesystem. Loom can let you ask Claude to write code, then ask Gemini to review it, in the same workspace. | MEDIUM | Backend already supports Claude/Gemini/Codex. UI needs: model selector dropdown in composer, provider indicator on messages, per-message model attribution. Depends on v2.1 "The Power" but groundwork can be laid now. |
| Self-hosted privacy | Your conversations never leave your server. ChatGPT/Claude/Gemini all send data to the cloud. For enterprise/security-conscious users, this is non-negotiable. | NONE | Already the case. Make it visible: "Your data stays on your server" in empty state, settings, or about. Marketing, not engineering. |
| Project-scoped context | Loom knows which project directory a session is in. It can show project files, git status, terminal for THAT project. ChatGPT/Claude/Gemini are project-agnostic unless you manually set up Projects. | LOW | Already implemented via project grouping. Enhance: auto-select project when opening session, project-specific templates/system prompts. |

#### Experience Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Sub-second session loads | Most competitors take 0.5-2s to load a conversation. With a local SQLite cache, Loom can load sessions in <100ms. Speed IS a feature. | HIGH | Depends on SQLite data layer. Parse JSONL once, cache in SQLite. Query by session ID for instant retrieval. This makes everything feel native-app fast. |
| Background session monitoring | See which sessions are actively streaming (Claude working in background). Tab title shows activity. Notification when task completes. No competitor web app does this for coding agents. | MEDIUM | Backend already tracks streaming state per session. UI: sidebar indicator dots, tab title update, optional desktop notification via Notification API. |
| Mobile agent monitoring | Start Claude Code from terminal, monitor from phone via Loom. See tool calls, approve permissions, view output -- all from mobile browser. Cursor has this with cloud agents; Loom can do it with live session attach. | HIGH | Combines live session attach + mobile responsive layout + permission handling on mobile. Cursor charges for cloud agents; Loom does this with your own server for free. |
| Instant file preview from tool calls | When Claude reads/writes a file, click the tool card to see the file in Loom's code editor. No competitor web chat does this -- they show raw text in the chat. | MEDIUM | ToolCard already shows file content. Add: "Open in Editor" button on Read/Write/Edit tool cards. Wire to file store + editor tab. |
| Cost tracking across providers | Token usage and cost per message, per session, per provider. Loom already shows per-turn usage footers. Aggregate into a usage dashboard. | MEDIUM | Backend already has /api/usage/metrics. Enhance: session-level aggregation, provider comparison, daily/weekly trends. |

### Anti-Features (Do NOT Build)

Features that seem appealing but would harm Loom's quality, coherence, or focus.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Offline chat with local models | "What if I'm offline?" | Loom is a coding agent interface, not a general chatbot. Local models (Ollama, llama.cpp) produce dramatically worse code than Claude/GPT. The quality gap would make Loom feel broken. Also conflicts with single-purpose focus. | Show clear offline indicator. Cache recent sessions for reading offline. Don't try to run inference. |
| Full IDE replacement (LSP, debugger, extensions) | "I want to never leave Loom" | Cursor/Windsurf/VS Code have thousands of engineer-years of IDE investment. Loom's CodeMirror editor is for viewing/quick-editing, not full development. Trying to compete on IDE features dilutes the chat-first mission. | Keep editor for viewing AI-generated changes and quick edits. Link to VS Code/Cursor for heavy editing. |
| Character-by-character typewriter streaming | "ChatGPT does word-level fades" | Already banned by Constitution. rAF batch rendering is faster and smoother. Typewriter effects cause jank at high token rates and violate the "mathematical precision" soul. | Keep rAF buffer. Enhance streaming cursor animation if needed. |
| Plugin/extension marketplace | "Let users add features" | Loom is a single-user tool. Marketplace implies community, maintenance, compatibility testing, security review. Massive scope for zero ROI at current stage. | MCP servers ARE the extension mechanism. Build MCP management UI instead (v2.1). |
| Real-time collaboration / multi-user | "What if I want to share with my team?" | Single-user tool running on personal server. Multi-user adds auth complexity, conflict resolution, presence, permissions. Completely different product. | Share via conversation export (static HTML). Team collaboration happens in the terminal/git, not the chat UI. |
| Voice/video input | "ChatGPT has voice mode" | Loom is a CODING interface. Voice input for code is terrible UX. Video adds complexity for near-zero value in a coding context. | If users want voice, they can use their OS dictation (built into macOS/iOS/Android). |
| Light mode | Requested by convention | Doubles CSS surface area. Dark-only is a deliberate brand choice ("deep charcoal & dusty rose"). All competitors' dark modes are their best modes. | Keep dark-only. Revisit only if user feedback overwhelmingly demands it. |
| AI-generated session summaries | "Summarize my chat" | Costs API tokens for questionable value. Auto-titles already capture the gist. Full summaries are rarely re-read. | Auto-titles are sufficient. If users want summaries, they can ask the AI in-chat. |
| Conversation branching tree view | "LibreChat has a tree view" | Complex navigation UI for a feature most users never use. LibreChat's tree view is powerful but niche. Simple < 2/3 > branch navigation covers 95% of use cases. | Implement edit-based branching with arrow navigation (Claude.ai pattern). Skip the tree visualization. |

---

## Feature Dependencies

```
SQLite Data Layer (cache + metadata)
    |-- Instant session switching
    |       |-- Scroll position restoration
    |       |-- Background session indicators
    |-- Session search (already exists, would be faster)
    |-- Message editing with branching
    |-- Conversation templates (stored in SQLite)
    |-- Usage aggregation dashboard

Live Session Attach (JSONL watcher)
    |-- Background session monitoring
    |-- Mobile agent monitoring
    |-- Tab title activity indicator

Mobile Responsive Layout
    |-- Sidebar as drawer
    |-- Touch-friendly targets
    |-- Mobile composer (above keyboard)
    |-- Safe area insets
    |-- Mobile agent monitoring (depends on both mobile + live attach)

Conversation Templates
    |-- requires: Template storage (SQLite or JSON)
    |-- enhances: Empty state suggestions
    |-- enhances: Project-scoped context

Message Editing + Branching
    |-- requires: SQLite data layer (for branch storage)
    |-- requires: Backend fork support
    |-- conflicts with: Simple message list (must handle tree structure)

Suggested Follow-ups
    |-- enhances: Empty state
    |-- independent: Can ship without data layer changes
```

### Dependency Notes

- **SQLite data layer is the foundation.** Without fast data access, session switching feels sluggish, branching is impractical, and scroll restoration is unreliable. Build this FIRST.
- **Live session attach is independent.** It's a backend feature (file watcher → WebSocket) that works regardless of the data layer. Can be built in parallel.
- **Mobile layout is independent of data layer.** CSS/responsive work can happen in parallel with backend work.
- **Message editing/branching depends on data layer.** Need structured message storage before you can fork conversation trees.
- **Conversation templates are low-dependency.** Can be stored in a simple JSON file initially, migrated to SQLite later.

---

## Competitor Feature Matrix

### Session Management

| Feature | ChatGPT | Claude.ai | Gemini | Cursor | Windsurf | Loom (Current) | Loom (Target) |
|---------|---------|-----------|--------|--------|----------|----------------|---------------|
| Instant session load | Yes | Yes | Yes | Yes | Yes | NO (re-fetches JSONL) | YES (SQLite cache) |
| Session search | Semantic search | Pro sidebar search | Rename + pin | N/A (file-based) | N/A | YES (keyword) | Keep, add fuzzy |
| Auto-titles | Yes | Yes | Yes | N/A | N/A | YES | Keep |
| Date grouping | Today/Yesterday/7d/30d | Same | Basic | N/A | N/A | YES (with project groups) | Keep |
| Pin conversations | Projects + star | Star | Pin | N/A | N/A | YES | Keep |
| Bulk operations | Archive/delete | Delete | Delete | N/A | N/A | YES (multi-select delete) | Keep |
| Project organization | Projects + folders | Projects (knowledge base) | Gems (functional) | Per-repo | Per-repo | YES (auto by project dir) | Enhance with templates |

### Conversation Features

| Feature | ChatGPT | Claude.ai | Gemini | Cursor | Windsurf | Loom (Current) | Loom (Target) |
|---------|---------|-----------|--------|--------|----------|----------------|---------------|
| Edit message + branch | Yes (< 2/3 >) | Yes (edit creates branch) | Basic regenerate | N/A | N/A | NO | YES (v2.0) |
| Conversation sharing | Public link | Snapshot link | Share link | N/A | N/A | Export only | Static HTML export |
| Conversation templates | Custom Instructions | Projects + system prompt | Gems | .cursorrules | .windsurfrules | NO | YES (project-scoped) |
| Suggested follow-ups | Pill chips below response | Inline suggestions | "Would you like..." | N/A | N/A | NO | YES (extracted from response) |
| Memory across chats | Yes (persistent memory) | No (project-scoped only) | Yes (personalization) | Rules files | Rules files | NO | Consider for v2.1+ |
| Temporary/incognito chat | Yes | No | Yes (Temporary Chat) | N/A | N/A | NO | LOW priority |

### Streaming & UX

| Feature | ChatGPT | Claude.ai | Gemini | Cursor | Windsurf | Loom (Current) | Loom (Target) |
|---------|---------|-----------|--------|--------|----------|----------------|---------------|
| Streaming quality | Word-fade 200ms | Smooth reveal + cursor | Fast streaming | Token streaming | Token streaming | rAF buffer 60fps | Keep (already best-in-class) |
| Stop button | Yes | Yes | Yes | Yes | Yes | YES | Keep |
| Retry/regenerate | Yes | Yes | Yes | Yes | Yes | YES | Keep |
| Copy full response | Yes | Yes | Yes | N/A | N/A | YES (export) | Add per-message copy |
| Read aloud | Yes | Voice mode | Yes | No | No | NO | Anti-feature for coding |

### Model Switching

| Feature | ChatGPT | Claude.ai | Gemini | Cursor | Windsurf | Loom (Current) | Loom (Target) |
|---------|---------|-----------|--------|--------|----------|----------------|---------------|
| Model selector | Top-center pill | Dropdown | Model picker | Per-conversation | Per-conversation | NO (Claude only via backend) | YES (v2.1 groundwork) |
| Mid-conversation switch | No (new chat) | No (new chat) | No | Yes | Yes | NO | YES (v2.1) |
| Multi-model comparison | No | No | No | No | No | NO | Consider for v2.1 |
| Provider indicator on messages | Logo avatar | Logo | Logo | Model name | Model name | YES (provider header) | Keep, enhance |

### Mobile Experience

| Feature | ChatGPT | Claude.ai | Gemini | Cursor | Windsurf | Loom (Current) | Loom (Target) |
|---------|---------|-----------|--------|--------|----------|----------------|---------------|
| Native mobile app | iOS + Android | iOS + Android | iOS + Android | Web (cursor.com/agents) | No | NO (web only) | PWA (Tailscale HTTPS) |
| Mobile-optimized web | N/A (native) | N/A (native) | N/A (native) | Good | Basic | PARTIAL (767px breakpoint) | Full mobile responsive |
| Voice input | Advanced voice mode | 5 voice personalities | Gemini Live | No | No | NO | Anti-feature for coding |
| Haptic feedback | Yes (native) | Yes (native) | Yes (native) | No | No | NO | Not applicable (web) |
| Push notifications | Yes | Yes | Yes | Yes (from cloud agents) | No | NO | Desktop Notification API |

### Unique Capabilities (Loom Only)

| Feature | Competitors | Loom Advantage |
|---------|------------|----------------|
| Live session attach | Cursor has cloud agents (paid). SessionCast is view-only. | Watch ANY running CLI session. Free. Real-time tool calls, permissions, output. |
| Integrated terminal | Cursor/Windsurf (IDE). ChatGPT/Claude/Gemini: NONE. | Terminal + chat + git in one interface. "Run in Terminal" from tool cards. |
| Git integration | Cursor/Windsurf (IDE). ChatGPT/Claude/Gemini: NONE. | See what the AI changed, stage, commit, push -- without switching apps. |
| Self-hosted privacy | Open WebUI, LibreChat (self-hosted). ChatGPT/Claude/Gemini: cloud only. | Your data on your server. No API key exposure to third-party UIs. |
| Multi-provider with tools | LibreChat (multi-provider, no terminal). Open WebUI (multi-model, no git). | Claude + Gemini + Codex with terminal, filesystem, git. Complete workspace. |

---

## v2.0 "The Engine" Priority Definition

### P1: Must Have (This Milestone)

These define whether v2.0 is a meaningful upgrade over v1.5.

- [ ] **SQLite data layer** -- Message cache for sub-200ms session switching. Parse JSONL once, store parsed messages in SQLite. Backend serves cached data on session load. WHY: Everything else (branching, scroll restore, search speed, mobile perf) depends on fast data.
- [ ] **State persistence** -- Last session, scroll position, sidebar state, active tab survive browser restart. WHY: Daily-driver requirement. Opening Loom must feel like returning to your desk, not starting over.
- [ ] **Live session attach** -- JSONL file watcher streams running CLI sessions to the browser in real-time. WHY: THE killer differentiator. No competitor does this. Transforms Loom from "alternative chat UI" to "mission control for AI agents."
- [ ] **Mobile-responsive layout** -- Sidebar drawer, touch targets, composer above keyboard, safe areas, no zoom on focus. WHY: Monitoring AI agents from phone via Tailscale is a daily use case. Current mobile experience is broken.
- [ ] **Performance** -- Lazy loading, request deduplication, optimistic updates, instant transitions. WHY: Speed is the most impactful UX feature. Every 100ms saved compounds across hundreds of daily interactions.

### P2: Should Have (This Milestone If Time Permits)

- [ ] **Suggested follow-up prompts** -- Extract potential questions/next-steps from AI responses, show as chips below message. WHY: Reduces friction for continuing conversations. Low effort, high perceived value.
- [ ] **Conversation templates / system prompts** -- Create, save, apply system prompt templates scoped to projects. WHY: Power users want repeatable context setup. Gems/Custom Instructions are table stakes for 2026.
- [ ] **Background session indicators** -- Sidebar dots showing which sessions are actively streaming. Tab title shows activity state. WHY: Multi-session monitoring is natural with live attach.
- [ ] **Desktop notifications** -- Notification API when background session completes or needs permission. WHY: Fire-and-forget workflow: start task, switch to other work, get notified.
- [ ] **Enhanced empty state** -- Project-aware suggestions, recent session quick-resume, time-of-day greeting. WHY: First impression matters. Current wordmark is functional but not inviting.

### P3: Defer to v2.1+ (Future Consideration)

- [ ] **Message editing with branch navigation** -- WHY defer: Requires significant backend work (fork support, branch storage). Get data layer right first, add branching on top.
- [ ] **Multi-provider model switching** -- WHY defer: Backend supports multiple providers but UI assumes Claude. Full multi-provider is v2.1 "The Power" scope.
- [ ] **Conversation sharing** -- WHY defer: Self-hosted makes sharing complex (who can access the link?). Static HTML export is a simpler v2.0 target. Full sharing needs auth/access design.
- [ ] **Cross-conversation memory** -- WHY defer: ChatGPT's memory is impressive but complex. Requires semantic extraction, storage, retrieval. High effort, uncertain value for coding context.
- [ ] **Cost tracking dashboard** -- WHY defer: Per-turn usage already shown. Dashboard aggregation is nice-to-have, not daily-driver-critical.
- [ ] **PWA with install prompt** -- WHY defer: Tailscale MagicDNS provides HTTPS (required for PWA). But service worker caching, manifest, install flow need dedicated effort. Do mobile responsive first, PWA later.

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority | Depends On |
|---------|------------|---------------------|----------|------------|
| SQLite data layer | HIGH | HIGH | P1 | Nothing (foundation) |
| State persistence | HIGH | LOW | P1 | Zustand persist (exists) |
| Live session attach | HIGH | HIGH | P1 | Backend file watcher |
| Mobile responsive | HIGH | MEDIUM | P1 | CSS/responsive work |
| Performance (dedup, lazy, optimistic) | HIGH | MEDIUM | P1 | Data layer |
| Suggested follow-ups | MEDIUM | LOW | P2 | Nothing |
| Conversation templates | MEDIUM | MEDIUM | P2 | Storage (SQLite or JSON) |
| Background indicators | MEDIUM | LOW | P2 | Live session attach |
| Desktop notifications | MEDIUM | LOW | P2 | Notification API |
| Enhanced empty state | MEDIUM | LOW | P2 | Nothing |
| Message editing + branching | HIGH | HIGH | P3 | SQLite + backend fork |
| Multi-provider switching | HIGH | HIGH | P3 | v2.1 scope |
| Conversation sharing | MEDIUM | MEDIUM | P3 | Auth/access design |
| Cross-conversation memory | LOW | HIGH | P3 | Complex infrastructure |
| Cost dashboard | LOW | MEDIUM | P3 | Usage data aggregation |

---

## Mobile-Specific Findings

What mobile AI apps do that web interfaces don't -- and what Loom should (and shouldn't) adopt:

### Must Adopt for Mobile Web

1. **Bottom-anchored composer** -- Mobile apps put input at the bottom, above the keyboard. Loom's current composer position works on desktop but may need adjustment for mobile viewport.
2. **Swipe gestures** -- Swipe right to open sidebar (drawer pattern). This is standard mobile web UX. Use touch event handlers, not complex gesture libraries.
3. **Touch-optimized tap targets** -- 44px minimum per Apple HIG. Audit all buttons, links, tool card actions.
4. **Viewport stability** -- No zoom on input focus (16px font minimum), no scroll jump when keyboard appears. Use visualViewport API.
5. **Simplified mobile UI** -- Hide panels (file tree, terminal, git) behind bottom tabs or a mobile-specific navigation. Chat is primary on mobile; workspace features are secondary.

### Do NOT Adopt from Mobile Apps

1. **Native haptics** -- Web Vibration API is inconsistent and annoying. Mobile apps use nuanced haptic patterns; web can't replicate this quality.
2. **Voice mode** -- Coding via voice is terrible UX. Let OS handle dictation.
3. **Camera/AR features** -- Screenshot sharing is useful (already have image paste). Camera integration adds complexity for edge-case value.
4. **In-app purchases** -- Loom is self-hosted, single-user. No monetization.
5. **Health/fitness integration** -- Claude app added this. Irrelevant for a coding tool.

### Mobile Monitoring Pattern (Loom's Unique Mobile Story)

The mobile story for Loom is NOT "use AI from your phone." It's **"monitor your AI agent from your phone."**

1. Start Claude Code task from terminal (desktop or SSH)
2. Open Loom on phone via Tailscale
3. Watch live session attach stream -- see tool calls, file changes, thinking
4. Approve/deny permissions from phone
5. Get notification when task completes
6. Review changes in git panel on phone

This workflow is unique to Loom. Cursor's cloud agents approach this but require their infrastructure and paid tier. Loom does it with your own server.

---

## Sources

### Competitor Products Analyzed
- ChatGPT (OpenAI) -- iOS/Android/Web, GPT-5.1, Canvas, memory, conversation branching
- Claude.ai (Anthropic) -- iOS/Android/Web, Artifacts, Projects, Apps, Remote Control
- Gemini (Google) -- iOS/Android/Web, Gems, Extensions, Temporary Chat, personalization
- Cursor -- Desktop IDE, Cloud Agents, model switching, background tasks, mobile at cursor.com/agents
- Windsurf -- Desktop IDE, Cascade, SWE-1/1.5, planning agent, flow-based coding
- LibreChat -- Self-hosted, multi-provider, conversation forking/tree view, MCP management
- Open WebUI -- Self-hosted, multi-model merge, Arena mode, OKLCH, comprehensive settings

### Research Sources
- [ChatGPT Mobile App Guide 2026](https://www.ai-toolbox.co/chatgpt-management-and-productivity/chatgpt-mobile-app-guide-2026)
- [ChatGPT Release Notes](https://help.openai.com/en/articles/6825453-chatgpt-release-notes)
- [Claude Pro Mobile Features](https://aionx.co/claude-ai-reviews/claude-pro-mobile-app-features/)
- [Claude Apps Announcement](https://www.uselayo.com/blog/claude-apps-the-complete-guide-for-2026)
- [Cursor Features](https://cursor.com/features)
- [Cursor CLI Cloud Handoff](https://cursor.com/changelog/cli-jan-16-2026)
- [Windsurf Cascade](https://windsurf.com/cascade)
- [Cursor vs Windsurf vs Claude Code 2026](https://dev.to/pockit_tools/cursor-vs-windsurf-vs-claude-code-in-2026-the-honest-comparison-after-using-all-three-3gof)
- [Gemini Release Notes](https://gemini.google/release-notes/)
- [ChatGPT Memory FAQ](https://help.openai.com/en/articles/8590148-memory-faq)
- [Offline-First Frontend Apps](https://blog.logrocket.com/offline-first-frontend-apps-2025-indexeddb-sqlite/)
- [SessionCast](https://www.toolify.ai/tool/sessioncast)
- [Claude Code Remote Control](https://venturebeat.com/orchestration/anthropic-just-released-a-mobile-version-of-claude-code-called-remote)
- Existing `.planning/reference-app-analysis.md` (6-product deep analysis)
- Existing `.planning/chat-interface-standards.md` (106 requirements)
- Existing `.planning/M3-POLISH-DEFERRED-CONTEXT.md` (deferred visual polish context)

### Confidence Notes
- **Competitor feature sets:** HIGH -- verified via official product pages, release notes, and hands-on analysis
- **Mobile patterns:** MEDIUM -- web research corroborated by existing reference analysis; some mobile-specific claims from single sources
- **Live session attach feasibility:** HIGH -- Happy Coder pattern documented, backend JSONL format understood, WebSocket infrastructure exists
- **SQLite cache approach:** HIGH -- proven pattern in multiple self-hosted projects (Open WebUI, LibreChat); backend already uses better-sqlite3

---
*Feature research for: v2.0 "The Engine" -- AI coding workspace competitive parity and differentiation*
*Researched: 2026-03-26*
