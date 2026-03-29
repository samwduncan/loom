# Adversarial Plan Review — Phase 67

**Tier:** full
**Date:** 2026-03-29
**Agents:** Guard (Sonnet), Hunter (Opus), Architect (Opus), Bard (Gemini)
**Findings:** 16 unique (2 SSS, 1 SS, 9 S, 4 A — after dedup)

## S+ Issues (Must Fix)

### [SSS-1] PTR does not re-attach live sessions (GESTURE-02 gap)
**Source:** Guard | **Confidence:** High
**Plan:** 67-02
**Description:** GESTURE-02 acceptance criteria requires "live sessions re-attach" after pull-to-refresh. All plans limit PTR refresh to `refetch()` only. No plan accounts for re-attaching WebSocket sessions that were live-attached before the refresh. The `isLiveAttached` state on SessionItem and the `SessionWatcher` backend mechanism are not referenced.
**Fix:** Plan 02 Task 2 must: after refetch(), check if active session was live-attached and re-trigger attach. Add `src/src/hooks/useSessionSwitch.ts` and `src/src/stores/stream.ts` to `read_first`.

### [SSS-2] Capacitor plugins installed as devDependencies instead of dependencies
**Source:** Bard | **Confidence:** High
**Plan:** 67-01
**Description:** Plan 01 Task 1 uses `-D` flag for `npm install` of @capacitor/app, @capacitor/share, @capacitor/action-sheet, @capacitor/clipboard. DevDependencies are tree-shaken from production builds. On real device: "Plugin not implemented" errors for GESTURE-08, -09, -10.
**Fix:** Remove `-D` flag. Install as production dependencies (like existing @capacitor/keyboard).

### [SS-1] CONTEXT.md D-03 contradicts research — useLongPress doesn't exist
**Source:** Architect (SS), Hunter (S), Guard (A) | **Confidence:** High
**Plan:** 67-01, 67-02
**Description:** D-03 says "use @use-gesture/react's useLongPress". The library has no `useLongPress` export. Research confirms this. Plans correctly use Radix's built-in long-press, but CONTEXT.md's locked decision contradicts this. An executor reading CONTEXT.md first will attempt to import a non-existent API.
**Fix:** Add explicit note in Plan 01 or Plan 02: "D-03 is superseded by research — useLongPress does not exist in @use-gesture/react v10.x. Radix ContextMenu handles long-press natively. GESTURE-07 is satisfied for swipe and PTR only."

### [S-1] Dead `cleanupAppLifecycle` export in Plan 01 artifact contract
**Source:** Guard | **Confidence:** High
**Plan:** 67-01
**Description:** Plan 01 exports `cleanupAppLifecycle` but no plan consumes it. Cleanup is returned from `initAppLifecycle()`. A separate named export creates confusion and potential double-cleanup.
**Fix:** Remove `cleanupAppLifecycle` from artifact exports. Cleanup path is the function returned by `initAppLifecycle()`.

### [S-2] Plan 02 references non-existent `useMediaQuery` instead of `useMobile()`
**Source:** Guard (S), Architect (B) | **Confidence:** High
**Plan:** 67-02
**Description:** Plan 02 says "Import useMediaQuery or check window.innerWidth < 768". No `useMediaQuery` exists. The standard hook is `useMobile()` from `@/hooks/useMobile`. Not in any `read_first`.
**Fix:** Replace with "Import `useMobile` from `@/hooks/useMobile`". Add `src/src/hooks/useMobile.ts` to Task 1 and Task 2 `read_first`.

### [S-3] DeleteSessionDialog native path breaks bulk delete
**Source:** Guard | **Confidence:** High
**Plan:** 67-02
**Description:** Native action sheet title is hardcoded "Delete Session" — ignores `count > 1` case. Existing component handles `isPlural` for both title and description. Native branch drops this.
**Fix:** Add `const isPlural = count > 1;` in native useEffect. Use dynamic title: `isPlural ? \`Delete ${count} sessions?\` : 'Delete Session'`.

### [S-4] "Select" action dropped from context menu migration
**Source:** Hunter | **Confidence:** High
**Plan:** 67-02
**Description:** Existing `SessionContextMenu.tsx` has a "Select" menu item for entering bulk selection mode. D-07 omits it. The new `SessionItemContextMenu` declares `onSelect?: () => void` in props but never renders it as a menu item. Feature regression.
**Fix:** Add "Select" item to `SessionItemContextMenu` JSX: `{onSelect && <ContextMenuItem onSelect={onSelect}><CheckSquare size={14} />Select</ContextMenuItem>}`.

### [S-5] onContextMenu prop removal is a breaking change
**Source:** Hunter (S), Architect (S) | **Confidence:** High
**Plan:** 67-02
**Description:** Plan 02 wraps SessionItem in ContextMenuTrigger, removing the `onContextMenu` prop. Existing `SessionItem.test.tsx` passes `onContextMenu: vi.fn()` in every render. Tests will break on execution.
**Fix:** Plan 02 must include test migration: update `SessionItem.test.tsx` to remove `onContextMenu` mock and test ContextMenuTrigger behavior instead.

### [S-6] Export action has no backend endpoint — stub silently misrepresents feature
**Source:** Guard (A), Architect (S) | **Confidence:** High
**Plan:** 67-02
**Description:** Plan 02 implements "Export" as sharing session title+ID. This is not Export — no conversation content. GESTURE-03 and GESTURE-09 require sharing conversation content.
**Fix:** Either (a) use existing `/api/sessions/:id/export` endpoint if it exists, (b) defer Export with a disabled menu item and tracked Forgejo issue, or (c) implement inline markdown export from client-side message data.

### [S-7] Retry action punted as "Coming Soon" toast
**Source:** Hunter (B), Architect (S) | **Confidence:** High
**Plan:** 67-03
**Description:** GESTURE-06 acceptance criteria lists "Retry" as a message context menu action. Plan 03 implements it as a "Coming soon" toast. This doesn't satisfy the requirement.
**Fix:** Implement retry by re-sending the last user message content through the existing composer/send mechanism. Add `src/src/stores/stream.ts` to read_first to find the actual send API.

### [S-8] useSwipeToDelete missing `from` property in useDrag config
**Source:** Bard | **Confidence:** High
**Plan:** 67-02
**Description:** Without `from: () => [offset, 0]` in useDrag config, repeated swipes jump instead of animate from current position. Visual jank on real device.
**Fix:** Add `from: () => [offset, 0]` to useDrag config in `useSwipeToDelete`.

### [S-9] Message text selection completely blocked on mobile
**Source:** Bard (S), Architect (A) | **Confidence:** High
**Plan:** 67-03
**Description:** `-webkit-user-select: none` on message bubbles prevents all text selection. Users cannot copy partial text. This is a significant UX regression.
**Fix:** Apply `user-select: none` only during active long-press (via state toggle), or use `touch-callout: none` instead to prevent the iOS callout without blocking selection.

## Lower-Grade Notes (A/B/C)

### [A] `active` variable not in scope in swipe snippet (Guard)
Plan 02 swipe wrapper uses `active` from useDrag state, but `useSwipeToDelete` hook doesn't return it.

### [A] `touchAction: 'pan-x'` on PTR wrapper blocks desktop scrolling (Guard)
Should be `isMobile ? 'pan-x' : 'auto'` or `manipulation`.

### [A] Plan 03 retry depends on non-existent `stream.sendMessage` (Guard)
Stream store has no `sendMessage` action. Need to find actual send mechanism.

### [A] Plan 02 wrapping each SessionItem in ContextMenu breaks memo (Hunter)
ContextMenuTrigger wrapper around memoized SessionItem defeats memoization.

### [B] Plan 02 haptic event name mismatch for Copy ID (Guard, Architect)
Uses `sessionSelect` instead of a semantically correct `copyConfirmed` event.

### [B] Multiple `read_first` omissions (Guard, Hunter, Architect)
`useMobile.ts`, `MessageContainer.tsx`, `ErrorMessage.tsx`, `stream.ts` missing from various plans.

### [C] Hardcoded `oklch(1 0 0)` and `text-white` in Plan 02 CSS (Guard, Architect)
V2_CONSTITUTION bans hardcoded colors — use tokens.

## Verification: PASSED

All 12 S+ issues addressed by planner revision. Haiku verification pass: 0 remaining violations (2026-03-29).
