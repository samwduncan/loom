# Requirements: Loom V2

**Defined:** 2026-03-12
**Core Value:** Make AI agent work visible, beautiful, and controllable

## v1.3 Requirements

Requirements for v1.3 "The Refinery" -- daily-driver UX, V1 feature parity, accessibility, and performance.

### Error & Resilience

- [x] **ERR-01**: User sees an error banner when the backend process crashes or exits unexpectedly
- [x] **ERR-02**: User sees a reconnection skeleton overlay when WebSocket connection drops
- [x] **ERR-03**: WebSocket automatically reconnects with exponential backoff after disconnection
- [x] **ERR-04**: User is warned before navigating away from an active streaming session
- [x] **ERR-05**: User sees connection status indicator (connected/reconnecting/disconnected)

### File Tree & Editor

- [x] **FTE-01**: File tree nodes display git change indicators (modified/added/untracked/deleted)
- [x] **FTE-02**: Git status indicators update when git panel operations complete
- [x] **FTE-03**: Code editor displays a minimap in the right gutter
- [x] **FTE-04**: Bash tool cards have a "Run in Terminal" action button
- [x] **FTE-05**: "Run in Terminal" opens the terminal tab and executes the command

### Session Management

- [x] **SESS-01**: User can load earlier messages in long conversations (paginated history)
- [x] **SESS-02**: Sidebar shows a processing indicator on sessions with active streaming
- [x] **SESS-03**: New sessions use a temporary ID that's replaced by the backend-assigned ID after first response

### Composer

- [x] **COMP-01**: User can type @ to trigger a file mention picker with fuzzy search
- [ ] **COMP-02**: Selected file mentions display as inline chips in the composer
- [ ] **COMP-03**: File mentions are sent as context attachments with the message
- [ ] **COMP-04**: User can type / to trigger a slash command menu
- [ ] **COMP-05**: Slash commands include at minimum: /clear, /help, /compact, /model
- [ ] **COMP-06**: Slash command menu supports keyboard navigation (arrow keys, enter, escape)

### UX Refinement

- [ ] **UXR-01**: Older conversation turns auto-collapse when scrolled out of viewport (IntersectionObserver)
- [ ] **UXR-02**: Auto-collapsed turns expand on click or scroll-back
- [ ] **UXR-03**: Each assistant turn displays a usage footer (input/output/cache tokens, cost)
- [ ] **UXR-04**: Usage footer is collapsible or subtle (doesn't dominate the message)
- [ ] **UXR-05**: Quick settings panel is accessible from sidebar or keyboard shortcut
- [ ] **UXR-06**: Quick settings includes toggles: auto-expand tools, show thinking, show raw params
- [ ] **UXR-07**: Quick settings changes apply immediately without page reload

### Accessibility

- [ ] **A11Y-01**: All interactive elements have appropriate ARIA roles and labels
- [ ] **A11Y-02**: Full keyboard navigation works across all panels (chat, files, terminal, git, settings)
- [ ] **A11Y-03**: Focus management: modals trap focus, panels restore focus on close
- [ ] **A11Y-04**: Screen reader announcements for streaming status, tool completion, errors
- [ ] **A11Y-05**: prefers-reduced-motion disables all animations (existing + new)
- [ ] **A11Y-06**: Color contrast meets WCAG AA across all surfaces

### Performance

- [ ] **PERF-01**: Streaming maintains 55+ FPS with 200+ messages in conversation
- [ ] **PERF-02**: content-visibility: auto applied and stress-tested on message list
- [ ] **PERF-03**: Memory profiling shows no leaks across session switches (10+ switches)
- [ ] **PERF-04**: Initial page load under 2s on dev server
- [ ] **PERF-05**: Bundle size audit with recommendations for any > 50KB chunks

## Future Requirements (v1.4 "The Polish")

### Visual Effects

- **VFX-01**: Spring physics animations on all interactions
- **VFX-02**: Aurora/ambient WebGL overlay during streaming (GPU feasibility gated)
- **VFX-03**: Glass surface effects for modals and overlays
- **VFX-04**: Sidebar slim collapse mode (icon-only rail)
- **VFX-05**: DecryptedText reveals for session titles and model names
- **VFX-06**: StarBorder accents on focused/active elements
- **VFX-07**: Motion refinement across all surfaces

## Out of Scope

| Feature | Reason |
|---------|--------|
| Multi-provider model selection UI | M5 "The Power" scope |
| Provider switching in composer | M5 "The Power" scope |
| TaskMaster integration panel | M6 "The Vision" scope |
| Companion sprites | M6 "The Vision" scope |
| Mobile bottom navigation | Responsive layout sufficient for mobile access |
| PWA safe area support | Not a native app; web-first |
| Whisper/dictation | Hidden in V1, low priority |
| Preview tab | Empty in V1, undefined purpose |
| Cross-tab sync for preferences | Single-tab use case dominant |
| Version check + upgrade modal | Backend handles versioning |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| ERR-01 | Phase 28 | Complete |
| ERR-02 | Phase 28 | Complete |
| ERR-03 | Phase 28 | Complete |
| ERR-04 | Phase 28 | Complete |
| ERR-05 | Phase 28 | Complete |
| FTE-01 | Phase 30 | Complete |
| FTE-02 | Phase 30 | Complete |
| FTE-03 | Phase 31 | Complete |
| FTE-04 | Phase 31 | Complete |
| FTE-05 | Phase 31 | Complete |
| SESS-01 | Phase 29 | Complete |
| SESS-02 | Phase 29 | Complete |
| SESS-03 | Phase 29 | Complete |
| COMP-01 | Phase 32 | Complete |
| COMP-02 | Phase 32 | Pending |
| COMP-03 | Phase 32 | Pending |
| COMP-04 | Phase 33 | Pending |
| COMP-05 | Phase 33 | Pending |
| COMP-06 | Phase 33 | Pending |
| UXR-01 | Phase 34 | Pending |
| UXR-02 | Phase 34 | Pending |
| UXR-03 | Phase 34 | Pending |
| UXR-04 | Phase 34 | Pending |
| UXR-05 | Phase 35 | Pending |
| UXR-06 | Phase 35 | Pending |
| UXR-07 | Phase 35 | Pending |
| A11Y-01 | Phase 36 | Pending |
| A11Y-02 | Phase 36 | Pending |
| A11Y-03 | Phase 36 | Pending |
| A11Y-04 | Phase 36 | Pending |
| A11Y-05 | Phase 36 | Pending |
| A11Y-06 | Phase 36 | Pending |
| PERF-01 | Phase 37 | Pending |
| PERF-02 | Phase 37 | Pending |
| PERF-03 | Phase 37 | Pending |
| PERF-04 | Phase 37 | Pending |
| PERF-05 | Phase 37 | Pending |

**Coverage:**
- v1.3 requirements: 37 total
- Mapped to phases: 37
- Unmapped: 0

---
*Requirements defined: 2026-03-12*
*Last updated: 2026-03-12 after roadmap creation*
