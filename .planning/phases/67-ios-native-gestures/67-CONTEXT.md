# Phase 67: iOS-Native Gestures - Context

**Gathered:** 2026-03-29
**Status:** Ready for planning
**Mode:** Auto-resolved (--auto), Bard-Prime consulted

<domain>
## Phase Boundary

Users interact with Loom through native iOS patterns: swipe-to-delete on session items, pull-to-refresh on session list, long-press context menus on sessions and messages, expanded haptic feedback coverage, proper app lifecycle management (background/foreground WebSocket reconnect), and native iOS sheets (share, action sheet) with web fallbacks.

**This phase adds 4 new Capacitor plugins** (@capacitor/app, @capacitor/share, @capacitor/action-sheet, @capacitor/clipboard) and 1 new npm dependency (@use-gesture/react ~6KB).

**This phase does NOT change existing gesture behavior** -- the Sidebar swipe-to-close (raw touch handlers) stays as-is per GESTURE-07 scope ("NEW gestures").

**This phase does NOT change desktop behavior** -- all gestures are mobile-only (< 768px), desktop keeps right-click context menus and existing mouse interactions.

</domain>

<decisions>
## Implementation Decisions

### Gesture Library Strategy (GESTURE-07)
- **D-01:** Install @use-gesture/react for ALL new gesture interactions: swipe-to-delete, pull-to-refresh, long-press detection. Provides velocity tracking, direction detection, and scroll conflict resolution out of the box.
- **D-02:** Do NOT migrate existing Sidebar swipe-to-close (Sidebar.tsx lines 49-101) to @use-gesture/react. That code is optimized, tested, and works on real devices. GESTURE-07 explicitly scopes to "NEW gestures" -- existing raw touch handlers remain unchanged.
- **D-03:** For simple gestures (long-press 500ms timer), @use-gesture/react's `useLongPress` is preferred over a custom `setTimeout` wrapper because it handles touch cancellation, scroll conflicts, and multi-touch edge cases.

### Context Menu Unification (GESTURE-03, GESTURE-06)
- **D-04:** Unify all context menus under the Radix ContextMenu primitive pattern (already used by FileTreeContextMenu). Create a `useLongPress()` hook that triggers the Radix ContextMenu on mobile via long-press (500ms), while desktop continues to use right-click.
- **D-05:** Deprecate the custom portaled SessionContextMenu component. Migrate to Radix ContextMenu + ContextMenuTrigger with long-press support. This eliminates the current dual-pattern fragmentation (custom portaled vs Radix).
- **D-06:** Message long-press context menu (GESTURE-06) follows the same Radix pattern. Wrap message bubbles in ContextMenuTrigger with long-press hook.
- **D-07:** Context menu actions for sessions: Copy ID, Rename, Delete, Export, Pin/Unpin (carry forward existing actions). Context menu actions for messages: Copy Text, Retry, Share.

### Swipe-to-Delete (GESTURE-01)
- **D-08:** Swipe-to-delete on session items coexists with long-press context menu. Swipe reveals a red Delete button for quick single-action access. Long-press opens full context menu (including Delete). This matches Apple Mail's pattern where both swipe and long-press exist.
- **D-09:** Swipe gesture uses @use-gesture/react `useDrag` with horizontal lock (only fires when horizontal displacement > vertical). Threshold: 80px horizontal swipe reveals Delete button. Velocity-aware: fast swipe auto-reveals without reaching threshold.
- **D-10:** Swipe-to-delete is mobile-only (< 768px). Desktop users use right-click > Delete from context menu.
- **D-11:** Delete confirmation via GESTURE-10 pattern: native action sheet on iOS, Radix AlertDialog on web.

### Pull-to-Refresh (GESTURE-02)
- **D-12:** Implement pull-to-refresh on session list only (not chat). Use @use-gesture/react `useDrag` with vertical threshold detection. Overscroll pull > 60px triggers refresh.
- **D-13:** Custom spinner component positioned above session list. Spring animation on release (CSS transition, not JS animation per v2.1 CSS-first motion decision).
- **D-14:** Refresh action: calls the existing session list fetch endpoint. On success, haptic feedback. On failure, show error toast (not just hide spinner).
- **D-15:** Gesture interruption: if user releases mid-pull (< 60px threshold), snap back without fetching. Only fetch on full-pull completion.
- **D-16:** Pull-to-refresh is mobile-only (< 768px). Desktop has no equivalent (manual refresh via F5 or sidebar button).

### App Lifecycle (GESTURE-08)
- **D-17:** Create a new `app-lifecycle.ts` module (not in native-plugins.ts) that lazy-loads @capacitor/app and listens for `appStateChange` events. When app returns to foreground, trigger WebSocket reconnect if connection is not 'connected'.
- **D-18:** Use a React hook `useAppLifecycle()` consumed by the root App component. On foreground return: check WebSocket state via `useConnectionStore`, if disconnected/reconnecting, call `wsClient.tryReconnect()`.
- **D-19:** Reconnection must complete within 2 seconds (per acceptance criteria). The existing exponential backoff in websocket-client.ts starts at 1s -- foreground return should reset the backoff and attempt immediately.
- **D-20:** On background entry: no action needed (iOS suspends the app, WS closes naturally). Reconnect is the foreground concern.

### Native Share (GESTURE-09)
- **D-21:** Create `native-share.ts` utility module. On native: use @capacitor/share for UIActivityViewController (AirDrop, Messages, Mail, Notes). On web: use Web Share API (`navigator.share()`) with clipboard fallback if Web Share is unavailable.
- **D-22:** Share targets: message text (from message context menu), conversation export (from session context menu). Format: plain text for messages, markdown for conversation export.

### Native Action Sheet (GESTURE-10)
- **D-23:** Create `native-actions.ts` utility module. On native: use @capacitor/action-sheet for iOS-native bottom sheet. On web: use existing Radix AlertDialog pattern (already in use for delete confirmations).
- **D-24:** Action sheet used for: delete session confirmation, delete conversation confirmation. NOT used for non-destructive choices (those use context menu).
- **D-25:** Platform branching via `IS_NATIVE`: native path calls ActionSheet.showActions(), web path renders Radix AlertDialog.

### Native Clipboard (GESTURE-06)
- **D-26:** Use @capacitor/clipboard for reliable copy on HTTP origins (where navigator.clipboard.writeText may fail). Fallback to navigator.clipboard on web. The Copy Text action in message context menu and Copy ID in session context menu use this.

### Haptic Feedback Grammar (GESTURE-05)
- **D-27:** Define a haptic event map that all components reference. No hardcoded haptic calls scattered across components -- centralize the mapping:
  - Session select: `hapticSelection()` (light click)
  - Sidebar toggle: `hapticImpact('Light')` (subtle thud)
  - Swipe-to-delete reveal: `hapticImpact('Light')` (subtle thud)
  - Delete confirmed: `hapticNotification('Warning')` (destructive action)
  - Context menu open: `hapticImpact('Medium')` (affordance thud)
  - Pull-to-refresh complete: `hapticNotification('Success')` (completion)
  - Share triggered: `hapticImpact('Light')` (acknowledgment)
- **D-28:** Haptic events respect `prefersReducedMotion()` (existing gate in haptics.ts). No additional check needed -- the existing architecture handles this.

### Capacitor Plugin Architecture
- **D-29:** native-plugins.ts remains the init-time coordinator (keyboard, status-bar, splash-screen, haptics). New event-driven/utility plugins get separate modules:
  - `lib/app-lifecycle.ts` -- @capacitor/app (lazy-loaded, event-driven)
  - `lib/native-share.ts` -- @capacitor/share (lazy-loaded, utility)
  - `lib/native-actions.ts` -- @capacitor/action-sheet (lazy-loaded, utility)
  - `lib/native-clipboard.ts` -- @capacitor/clipboard (lazy-loaded, utility)
- **D-30:** All new plugin modules follow the existing pattern: dynamic import, IS_NATIVE guard, per-plugin try/catch, fire-and-forget for non-critical operations.

### Accessibility
- **D-31:** Swipe-to-delete must have keyboard equivalent: focus session + Delete key (or Backspace). VoiceOver must announce the swipe action.
- **D-32:** Long-press context menus must be keyboard-accessible: focus element + Context Menu key (or Shift+F10) opens the Radix ContextMenu. This comes free from Radix primitives.
- **D-33:** Pull-to-refresh has no keyboard equivalent (keyboard users use F5/Cmd+R for browser refresh, or a dedicated refresh button if needed).

### Claude's Discretion
- Per-gesture implementation details (exact threshold values, animation durations, spring physics)
- Whether to batch all swipe/gesture work in one plan or split gesture types across plans
- Testing strategy: unit tests for hooks, Playwright for gesture simulation, real-device for haptic validation
- Exact spinner component design for pull-to-refresh (size, animation style, positioning)
- Whether to keep or modify the existing SessionContextMenu during migration to Radix (incremental vs. full replacement)

### Folded Todos
None -- no matching todos found.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` GESTURE section -- GESTURE-01 through GESTURE-10 acceptance criteria with specific gestures, timing, and native API references

### Coding Conventions
- `.planning/V2_CONSTITUTION.md` -- Enforceable conventions (named exports, token styling, cn(), z-index dictionary, selector-only store access)
- `.planning/V2_CONSTITUTION.md` Section 13 -- Touch Target & Focus Standards (44px mobile, `md:min-h-0` revert, focus ring standard)
- `.planning/V2_CONSTITUTION.md` Section 14 -- Typography Standards (12px minimum, token usage)

### Platform Layer
- `src/src/lib/platform.ts` -- `IS_NATIVE` export, platform detection via `window.Capacitor`
- `src/src/lib/native-plugins.ts` -- Plugin initialization pattern (dynamic import, per-plugin try/catch, readiness promise)
- `src/src/lib/haptics.ts` -- Haptic feedback API (`hapticImpact`, `hapticNotification`, `hapticSelection`), reduced-motion gate, 200ms throttle

### Existing Context Menus
- `src/src/components/sidebar/SessionContextMenu.tsx` -- Current custom portaled right-click menu (to be deprecated in favor of Radix)
- `src/src/components/sidebar/SessionList.tsx` -- Context menu state management, `handleContextMenu` callback
- `src/src/components/file-tree/FileTreeContextMenu.tsx` -- Radix ContextMenu pattern (reference implementation for unification)
- `src/src/components/ui/context-menu.tsx` -- shadcn Radix ContextMenu primitives

### Existing Gesture Code
- `src/src/components/sidebar/Sidebar.tsx` lines 42-101 -- Swipe-to-close gesture (raw touch handlers, NOT to be migrated)
- `src/src/hooks/useChatScroll.ts` -- touchmove handler for scroll disengage (don't conflict with new gestures)

### WebSocket / Connection
- `src/src/lib/websocket-client.ts` -- Auto-reconnect with exponential backoff, `tryReconnect()` method
- `src/src/stores/connection.ts` -- Provider status state (`connected`, `disconnected`, `reconnecting`)
- `src/src/lib/websocket-init.ts` -- WebSocket initialization and state change handler

### Prior Phase Context
- `.planning/phases/64-scroll-performance/64-CONTEXT.md` -- Scroll hook architecture, auto-scroll disengage via touchmove
- `.planning/phases/65-touch-target-compliance/65-CONTEXT.md` -- 44px touch targets, mobile breakpoint strategy, focus ring standard
- `.planning/phases/66-typography-spacing/66-CONTEXT.md` -- Typography tokens, mobile font sizing

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Haptics module** (`haptics.ts`): Complete haptic API with IS_NATIVE guard, reduced-motion check, fire-and-forget pattern. Extend with new haptic events, don't rewrite.
- **Radix ContextMenu** (`ui/context-menu.tsx`): Full shadcn primitive set. Used by FileTreeContextMenu. Target pattern for session and message context menus.
- **SessionItem** (`SessionItem.tsx`): Already has `onContextMenu` prop, `min-h-[44px] md:min-h-0` touch targets. Add swipe gesture and long-press trigger here.
- **WebSocket reconnect** (`websocket-client.ts`): `tryReconnect()` method exists for manual reconnect. App lifecycle hook calls this on foreground return.
- **native-plugins.ts**: Established pattern for dynamic Capacitor plugin imports with per-plugin try/catch isolation and readiness promise.
- **cn() utility**: Standard class merging throughout codebase.

### Established Patterns
- Platform detection: `IS_NATIVE` from `platform.ts`
- Dynamic plugin imports: `await import('@capacitor/plugin')` with try/catch
- Mobile breakpoint: `md:` (768px) — below is mobile, above is desktop
- CSS-first motion: CSS transitions at 120Hz in WKWebView, preferred over JS animation
- Component memoization: `memo()` on list items (MemoizedMessageItem, SessionItem)
- Store access: selector-only pattern via `useXStore((s) => s.field)`

### Integration Points
- `SessionItem.tsx`: Add @use-gesture/react useDrag for swipe + useLongPress for context menu trigger
- `SessionList.tsx`: Add pull-to-refresh gesture wrapper above list, replace context menu state management
- `MessageList.tsx` / message components: Add long-press context menu trigger on message bubbles
- `native-plugins.ts`: No changes -- new plugins get their own modules
- `App.tsx` or root component: Mount `useAppLifecycle()` hook for foreground reconnect
- `package.json`: Add @use-gesture/react, @capacitor/app, @capacitor/share, @capacitor/action-sheet, @capacitor/clipboard

</code_context>

<specifics>
## Specific Ideas

No specific requirements -- requirements provide concrete acceptance criteria for each gesture. Follow the established platform layer pattern (dynamic imports, IS_NATIVE branching, fire-and-forget for non-critical operations).

</specifics>

<quality_bar>
## Quality Bar (Bard Assessment)

**Good:** All 10 GESTURE requirements implemented, gestures work on real device, haptics fire at correct moments.

**Exceptional:**
- **Velocity awareness** on pull-to-refresh and swipe-to-delete: fast swipe auto-reveals, slow pull has proportional animation. @use-gesture/react provides this data -- use it.
- **Haptic grammar** documented and centralized: every gesture has a defined haptic type+style. No inconsistent scattered haptic calls.
- **Unified context menu pattern**: all context menus (session, message, file tree) use Radix primitives with long-press support. Zero pattern fragmentation.
- **Gesture interruption handling**: mid-pull release snaps back without fetching. Mid-swipe release snaps back to closed. Spring physics on all snap-back animations.
- **Reduced motion respect**: all gesture animations honor `prefers-reduced-motion`. Instant state changes replace animations when enabled.
- **One-handed reachability**: swipe and long-press tested at thumb-reach distance on iPhone 16 Pro Max.
- **Network resilience**: pull-to-refresh shows error state on fetch failure. App lifecycle reconnect retries within 2 seconds.
- **Accessibility**: swipe-to-delete has keyboard/VoiceOver equivalent. Context menus keyboard-navigable via Radix primitives.

**Risk flags from Bard:**
- Pull-to-refresh + existing scroll behavior in session list: ensure overscroll-behavior doesn't conflict with the scroll anchor (Phase 64 set `overscroll-behavior: none` on html/body only, session list should have native bounce)
- Context menu migration from custom to Radix is the riskiest change -- test all existing context menu actions (Rename, Delete, Pin) survive the migration
- @use-gesture/react on WKWebView: test that gesture library correctly handles iOS touch event timing and passive event listeners
- App lifecycle reconnect: if user switches apps rapidly (foreground→background→foreground in <1s), debounce the reconnect to prevent connection storms

</quality_bar>

<deferred>
## Deferred Ideas

- **Reply/Forward in message context menu**: GESTURE-06 specifies Copy Text, Retry, Share. Reply-to-message and Forward are common chat patterns but would be new capabilities (scope creep).
- **Swipe actions on messages**: swipe-left-to-reply on message bubbles is a native iOS chat pattern but not in GESTURE requirements.
- **Migrate Sidebar swipe-to-close to @use-gesture**: would unify all gestures under one library but adds risk for no feature gain. Defer unless consistency becomes a maintenance problem.
- **Pull-to-refresh on chat view**: only session list has PTR per GESTURE-02. Chat view PTR (to reconnect/refresh) could be useful but is a new capability.

</deferred>

---

*Phase: 67-ios-native-gestures*
*Context gathered: 2026-03-29*
