# Requirements: Loom V2

**Defined:** 2026-03-17
**Core Value:** Make AI agent work visible, beautiful, and controllable

## v1.4 Requirements

Requirements for "The Navigator" milestone. Fix broken features, make sessions manageable, harden the backend, verify everything works.

### Session Intelligence

- [x] **SESS-01**: Sessions have auto-generated titles derived from the first real user message, skipping system prompts, XML tags, task-notification wrappers, and `<objective>` blocks
- [x] **SESS-02**: Backend provides session title update endpoint (PATCH) that persists renamed titles to JSONL summary entry
- [x] **SESS-03**: Frontend session rename calls backend endpoint so renames survive cache clear and browser changes
- [x] **SESS-04**: Sidebar groups sessions by project with collapsible project headings showing session count
- [x] **SESS-05**: Date subgroups within each project group (Today, Yesterday, This Week, This Month, Older)
- [x] **SESS-06**: Junk sessions filtered from sidebar (notification classifier, system utility, blank "New Session" with no real messages)
- [x] **SESS-07**: Sidebar has inline search/filter bar that filters sessions by title across all projects
- [x] **SESS-08**: User can pin sessions to the top of their project group
- [x] **SESS-09**: User can select multiple sessions and delete them in bulk

### Broken Feature Fixes

- [x] **FIX-01**: @-mention file picker sends fileMentions array over WebSocket so file context reaches the AI
- [x] **FIX-02**: Search highlighting works in assistant message markdown bodies (not just user messages and thinking blocks)
- [x] **FIX-03**: rehypeToolMarkers dead code removed from codebase (plugin file + MarkdownRenderer import)
- [x] **FIX-04**: NaN reconnect attempts display fixed via persist merge function and defensive guard (ALREADY DONE — verify in tests)

### Backend Hardening

- [x] **BACK-01**: Auth auto-retry on failure with clear error messaging; graceful re-registration if DB is reset
- [x] **BACK-02**: Backend session title PATCH endpoint at `/api/projects/:name/sessions/:id` writing summary entry to JSONL
- [x] **BACK-03**: systemd service or pm2 config for automatic backend startup and crash recovery
- [x] **BACK-04**: WebSocket connection heartbeat (ping/pong keepalive) with silent disconnect detection

### Persist Layer Audit

- [x] **PERS-01**: All 5 Zustand stores audited for shallow-merge rehydration bugs (timeline, stream, ui, connection, file)
- [x] **PERS-02**: Any stores using persist + partialize have proper deep merge functions

### E2E Verification

- [x] **E2E-01**: Permission banners display with countdown timer and Y/N keyboard shortcuts work
- [x] **E2E-02**: Token usage/cost footers show accurate data in conversation turns
- [x] **E2E-03**: Image paste/drag-drop into composer sends image and displays in conversation
- [x] **E2E-04**: Conversation export produces valid downloadable output
- [x] **E2E-05**: Message retry button re-sends the last user message
- [ ] **E2E-06**: Git push/pull/fetch operations complete successfully with status feedback
- [ ] **E2E-07**: Diff view opens from git panel changed file click
- [ ] **E2E-08**: Branch create/switch/delete work from git panel
- [ ] **E2E-09**: Quick settings toggles apply immediately and persist across page reload
- [ ] **E2E-10**: Auto-collapse old turns via IntersectionObserver works reliably
- [ ] **E2E-11**: Navigate-away guard prevents accidental navigation during active streaming

## v1.5 Requirements

Deferred to "The Polish" milestone. Visual transformation.

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
| LLM-generated session titles (API call to AI) | Smart regex extraction is sufficient for v1.4; LLM summaries add latency and cost |
| Session archiving (separate from delete) | Bulk delete covers the immediate need; archiving adds complexity |
| Multi-provider session grouping | Only Claude sessions exist currently; v2.0 adds Gemini/Codex |
| Session branching/forking | High complexity, low value for single-user tool |
| Mobile-responsive sidebar | Web-first; desktop is the primary use case |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SESS-01 | TBD | Complete |
| SESS-02 | TBD | Complete |
| SESS-03 | Phase 40 | Complete |
| SESS-04 | Phase 41 | Complete |
| SESS-05 | Phase 41 | Complete |
| SESS-06 | Phase 40 | Complete |
| SESS-07 | Phase 42 | Complete |
| SESS-08 | Phase 42 | Complete |
| SESS-09 | Phase 42 | Complete |
| FIX-01 | Phase 38 | Complete |
| FIX-02 | Phase 38 | Complete |
| FIX-03 | Phase 38 | Complete |
| FIX-04 | Phase 38 | Complete |
| BACK-01 | Phase 39 | Complete |
| BACK-02 | Phase 39 | Complete |
| BACK-03 | Phase 43 | Complete |
| BACK-04 | Phase 39 | Complete |
| PERS-01 | Phase 38 | Complete |
| PERS-02 | Phase 38 | Complete |
| E2E-01 | Phase 43 | Complete |
| E2E-02 | Phase 43 | Complete |
| E2E-03 | Phase 43 | Complete |
| E2E-04 | Phase 43 | Complete |
| E2E-05 | Phase 43 | Complete |
| E2E-06 | Phase 43 | Pending |
| E2E-07 | Phase 43 | Pending |
| E2E-08 | Phase 43 | Pending |
| E2E-09 | Phase 43 | Pending |
| E2E-10 | Phase 43 | Pending |
| E2E-11 | Phase 43 | Pending |

**Coverage:**
- v1.4 requirements: 30 total
- Mapped to phases: 30
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-17*
*Last updated: 2026-03-17 after roadmap creation*
