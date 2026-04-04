---
gsd_state_version: 1.0
milestone: v4.0
milestone_name: "The Command Center"
status: Ready to plan
stopped_at: Completed 76.1-03-PLAN.md
last_updated: "2026-04-04T18:55:37.996Z"
progress:
  total_phases: 12
  completed_phases: 3
  total_plans: 13
  completed_plans: 13
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-03)

**Core value:** Make AI agent work visible, beautiful, and controllable -- from anywhere
**Current focus:** Phase 76.1 — visual-foundation

## Current Position

Phase: 77
Plan: Not started

## Performance Metrics

**Velocity:**

- Total plans completed: 0
- Average duration: --
- Total execution time: --

## Accumulated Context

### Decisions

- [v3.0] Shared code extraction to @loom/shared -- types, stores, API, WebSocket, multiplexer
- [v3.1] Phase 74 completed (shell/connection) -- auth, WS lifecycle, drawer nav, theme, safe areas
- [v4.0] Push notifications before UI polish -- highest value, shortest path (council unanimous)
- [v4.0] Cross-agent orchestration is YAGNI -- 3-message version, not 8
- [v4.0] Relay auth mandatory before agents communicate
- [v4.0] HITL protocol needs design phase before implementation
- [v4.0] Private Mind as pattern reference (~30% reuse) for chat shell
- [Phase 75]: Segment parser uses state machine for code block extraction, tool calls grouped after text/code
- [Phase 75]: Toast uses module-scoped callback pattern (not React Context) for global imperative access
- [Phase 75]: ToolChip React.memo with id+status custom comparator for minimal re-renders
- [Phase 75]: narrowInput() helper safely narrows unknown PermissionRequest.input to Record<string, unknown>
- [Phase 75]: Swipeable (legacy) over ReanimatedSwipeable for swipe-to-delete in drawer
- [Phase 75]: pendingDeletes ref pattern with 5s setTimeout for optimistic delete with undo and error recovery
- [Phase 75]: EnrichedMarkdownText with flavor=github for GFM table support in TextSegment
- [Phase 75]: Real elapsed time via Date.now() ref for thinking duration (AR fix #6, not character-count heuristic)
- [Phase 75]: Atom One Dark theme for code syntax highlighting (closest to surface-sunken)
- [Phase 75]: AR fix #3: 5s fallback timer uses functional updater to avoid stale closure, cleared on stream start
- [Phase 75]: AR fix #5: Historical messages carry toolCalls/thinkingBlocks via DisplayMessage; mapToolCallToState in AssistantMessage
- [Phase 75]: AR fix #9: Explicit reverse() before inverted FlatList for unambiguous message ordering
- [Phase 75]: FlatList key={sessionId} forces remount on session switch, preventing stale message flash
- [Phase 75]: Composed scroll handlers: useScrollToBottom.onScroll + useScrollPosition.saveOffset fire together in single callback
- [Phase 75]: Provider stack order: GestureHandler > Keyboard > SafeArea > BottomSheet > Toast > Content
- [Phase 76]: Push triggers fire from WebSocketWriter.send() regardless of WS readyState for disconnected-client push delivery
- [Phase 76]: 30s backgroundedAt threshold prevents push spam during quick app switches (D-01)
- [Phase 76]: Session name resolution from cache.db sessions.summary for human-readable notification titles (SS-1)
- [Phase 76]: Module-level notification listener ONLY stores response, never calls API or navigates [S-8]
- [Phase 76]: apiClient.apiFetch<T>() used for all API calls (shared lib has no .get/.post convenience methods)
- [Phase 76]: Session deep link validates by searching projects sessions array, not just server reachability [D-12]
- [Phase 76]: Used apiFetch with PATCH method instead of plan's apiClient.patch (ApiClient only exposes apiFetch)
- [Phase 76]: Created push-preferences.ts as blocking dep for parallel Plan 02 (Rule 3)
- [Phase 76]: wsClient.send() takes ClientMessage object, not JSON string -- plan corrected to typed usage
- [Phase 76]: 120s permission timeout (up from 55s) for cold-start approval flow [D-07]
- [Phase 76]: AuthenticatedApp component pattern isolates auth-dependent hooks from conditional rendering
- [Phase 76.1]: Haptic hierarchy: 6 semantic levels (tap/transition/success/warning/error/selection) mapped to expo-haptics primitives
- [Phase 76.1]: rimLight token: 0.5pt top border rgba(255,255,255,0.05) for depth perception on raised surfaces
- [Phase 76.1]: Soul doc surface values updated to match device-optimized code (16-20 RGB unit jumps)
- [Phase 76.1]: ChatHeader rendered AFTER content in DOM for expo-blur correctness, absolutely positioned with zIndex 10
- [Phase 76.1]: USE_GLASS_COMPOSER toggle for Composer glass/opaque fallback (D-07 keyboard-blur risk)
- [Phase 76.1]: Composer keeps 20px radii.xl for continuity (D-04 16px acknowledged, deferred)
- [Phase 76.1]: SessionItem density: caption (12px) subtitle, 12px paddingVertical for ChatGPT iOS match (D-08)
- [Phase 76.1]: AssistantMessage D-26 override: withSpring Standard replaces withTiming per Soul doc anti-pattern #2
- [Phase 76.1]: Drawer open haptic via transitionEnd + !closing check (drawerOpen event doesn't exist in v7)
- [Phase 76.1]: Typing-begins haptic: 2s cooldown via Date.now ref to prevent fatigue on rapid clear-retype

### Roadmap Evolution

- Phase 76.1 inserted after Phase 76: Visual Foundation — Clone ChatGPT/Claude iOS shell at pixel level (URGENT). Feature work paused until visual foundation meets reference app quality bar.

### Blockers/Concerns

- Phase 76 UAT: 10/12 tests blocked on EAS build with push entitlements (provisioning profile needs --clear-credentials rebuild)
- Visual foundation must be completed before resuming feature work

## Session Continuity

Last session: 2026-04-04T18:39:11.170Z
Stopped at: Completed 76.1-03-PLAN.md
Resume: `/gsd:plan-phase 76.1`
