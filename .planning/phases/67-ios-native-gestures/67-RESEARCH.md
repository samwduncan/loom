# Phase 67: iOS-Native Gestures - Research

**Researched:** 2026-03-29
**Domain:** Mobile gesture handling, Capacitor native plugins, Radix context menus, WebSocket lifecycle
**Confidence:** HIGH

## Summary

Phase 67 adds iOS-native interaction patterns to Loom: swipe-to-delete on session items, pull-to-refresh on the session list, long-press context menus on sessions and messages, expanded haptic feedback, app lifecycle management (foreground reconnect), and native share/action sheet/clipboard utilities. The implementation touches the sidebar layer (SessionItem, SessionList), the chat message layer, and the platform utility layer (new Capacitor plugin modules).

The two riskiest areas are (1) the context menu migration from the custom portaled SessionContextMenu to Radix ContextMenu primitives (must preserve all existing actions while adding long-press), and (2) @use-gesture/react useDrag on WKWebView where touch-action CSS and iOS passive event listener defaults can cause scroll conflicts. Radix ContextMenu natively supports long-press on touch devices -- this is a significant simplification that means no custom long-press hook is needed for context menus.

**Primary recommendation:** Use @use-gesture/react only for swipe-to-delete and pull-to-refresh (useDrag with axis lock). Use Radix ContextMenu's built-in long-press for all context menus. Create four new utility modules (app-lifecycle, native-share, native-actions, native-clipboard) following the established native-plugins.ts pattern of dynamic imports with IS_NATIVE guards.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: Install @use-gesture/react for swipe-to-delete, pull-to-refresh, long-press detection
- D-02: Do NOT migrate existing Sidebar swipe-to-close to @use-gesture/react
- D-03: @use-gesture/react's useLongPress preferred for long-press over custom setTimeout
- D-04: Unify all context menus under Radix ContextMenu primitive pattern
- D-05: Deprecate custom portaled SessionContextMenu, migrate to Radix ContextMenu
- D-06: Message long-press context menu follows same Radix pattern
- D-07: Session actions: Copy ID, Rename, Delete, Export, Pin/Unpin. Message actions: Copy Text, Retry, Share
- D-08: Swipe-to-delete coexists with long-press context menu (Apple Mail pattern)
- D-09: Swipe uses useDrag with horizontal lock, 80px threshold, velocity-aware
- D-10: Swipe-to-delete is mobile-only (< 768px)
- D-11: Delete confirmation via native action sheet (iOS) / Radix AlertDialog (web)
- D-12: Pull-to-refresh on session list only, useDrag with vertical threshold, >60px
- D-13: Custom spinner with CSS spring animation
- D-14: Refresh calls existing session list fetch, haptic on success, toast on failure
- D-15: Mid-pull release (<60px) snaps back without fetching
- D-16: Pull-to-refresh is mobile-only
- D-17: New app-lifecycle.ts module (separate from native-plugins.ts)
- D-18: useAppLifecycle() hook in root App component
- D-19: Foreground return resets backoff and attempts reconnect immediately (2s target)
- D-20: No action on background entry
- D-21: native-share.ts: @capacitor/share on native, Web Share API on web, clipboard fallback
- D-22: Share targets: message text (plain text), conversation export (markdown)
- D-23: native-actions.ts: @capacitor/action-sheet on native, Radix AlertDialog on web
- D-24: Action sheet for destructive confirmations only
- D-25: Platform branching via IS_NATIVE
- D-26: @capacitor/clipboard for reliable copy on HTTP origins
- D-27: Centralized haptic event map (defined grammar)
- D-28: Haptic events respect prefersReducedMotion (existing gate)
- D-29: New plugins get separate modules (not in native-plugins.ts)
- D-30: All new modules: dynamic import, IS_NATIVE guard, per-plugin try/catch
- D-31: Swipe-to-delete has keyboard equivalent (Delete/Backspace key)
- D-32: Long-press context menus keyboard-accessible (comes free from Radix)
- D-33: Pull-to-refresh has no keyboard equivalent

### Claude's Discretion
- Per-gesture implementation details (exact threshold values, animation durations, spring physics)
- Whether to batch all swipe/gesture work in one plan or split gesture types across plans
- Testing strategy: unit tests for hooks, Playwright for gesture simulation, real-device for haptic validation
- Exact spinner component design for pull-to-refresh
- Whether to keep or modify the existing SessionContextMenu during migration (incremental vs. full replacement)

### Deferred Ideas (OUT OF SCOPE)
- Reply/Forward in message context menu
- Swipe actions on messages (swipe-left-to-reply)
- Migrate Sidebar swipe-to-close to @use-gesture
- Pull-to-refresh on chat view
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| GESTURE-01 | Session list items support swipe-to-delete gesture on mobile | @use-gesture/react useDrag with axis:'x' lock, 80px threshold, velocity-aware; pairs with native action sheet confirmation |
| GESTURE-02 | Pull-to-refresh gesture refreshes session list on mobile | @use-gesture/react useDrag with axis:'y' lock, 60px threshold; CSS spring animation for spinner; calls existing refetch() |
| GESTURE-03 | Long-press on session item opens context menu (Copy ID, Rename, Delete, Export) | Radix ContextMenu natively supports long-press on touch; migrate from custom portaled SessionContextMenu |
| GESTURE-04 | Sidebar swipe-to-open gesture (edge pan from left) works on mobile | Already implemented in Sidebar.tsx (lines 42-101); verify on real device only |
| GESTURE-05 | Haptic feedback integrated into more touch actions | Extend existing haptics.ts with centralized event map; 7 new haptic trigger points |
| GESTURE-06 | Long-press on message gives copy/retry context menu | Radix ContextMenu wrapping message bubbles; @capacitor/clipboard for reliable copy |
| GESTURE-07 | @use-gesture/react library for professional gesture handling | Install @use-gesture/react 10.3.1 (~6KB); use for useDrag (swipe + pull-to-refresh) |
| GESTURE-08 | @capacitor/app lifecycle -- reconnect WebSocket on foreground return | New app-lifecycle.ts module; appStateChange listener; calls wsClient.tryReconnect() |
| GESTURE-09 | Native share sheet for conversations and code blocks | New native-share.ts; @capacitor/share on native, navigator.share on web |
| GESTURE-10 | Native action sheet for destructive confirmations | New native-actions.ts; @capacitor/action-sheet on native, Radix AlertDialog on web |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @use-gesture/react | 10.3.1 | Swipe-to-delete, pull-to-refresh gesture hooks | Battle-tested gesture math: velocity tracking, axis lock, threshold detection, scroll conflict resolution. ~6KB. |
| Radix ContextMenu | 1.4.3 (via radix-ui) | Long-press context menus (session + message) | Already installed and used by FileTreeContextMenu. Natively supports long-press on touch devices. |

### Capacitor Plugins (devDependencies)
| Library | Version | Purpose | Compatibility |
|---------|---------|---------|---------------|
| @capacitor/app | ^7.1.2 | App lifecycle events (foreground/background) | Capacitor 7.6.1 compatible (7.x line) |
| @capacitor/share | ^7.0.4 | Native iOS share sheet (UIActivityViewController) | Capacitor 7.6.1 compatible |
| @capacitor/action-sheet | ^7.0.4 | Native iOS bottom action sheet for destructive confirms | Capacitor 7.6.1 compatible |
| @capacitor/clipboard | ^7.0.4 | Reliable clipboard access on HTTP origins | Capacitor 7.6.1 compatible |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @use-gesture/react | Custom touch handlers | Raw handlers miss velocity tracking, axis lock, scroll conflict resolution, multi-touch edge cases. 6KB is cheap for correctness. |
| @use-gesture/react for long-press | Radix built-in long-press | Radix ContextMenu already handles long-press on touch. No additional library needed for context menu triggers. |
| Custom useLongPress hook | react-aria useLongPress | CONTEXT.md D-03 says use @use-gesture/react, but it has no useLongPress hook. Radix handles this natively for context menus. For non-context-menu long-press, useDrag with delay option can simulate long-press detection. |

**Installation:**
```bash
cd src
npm install @use-gesture/react@^10.3.1
npm install -D @capacitor/app@^7.1.2 @capacitor/share@^7.0.4 @capacitor/action-sheet@^7.0.4 @capacitor/clipboard@^7.0.4
```

**Version verification:** Versions verified against npm registry on 2026-03-29. @use-gesture/react 10.3.1 is latest. Capacitor plugins use ^7.x for Capacitor 7.6.1 compatibility (NOT 8.x which breaks).

**CRITICAL version note:** The project uses `@capacitor/core: ^7.6.1`. All new Capacitor plugins MUST be 7.x versions. The npm `latest` tag points to 8.x for some plugins -- always specify `^7.x.x` explicitly. Use `npm install @capacitor/app@latest-7` pattern if needed.

## Architecture Patterns

### New Module Structure
```
src/src/
  lib/
    app-lifecycle.ts        # @capacitor/app lifecycle events (NEW)
    native-share.ts         # @capacitor/share utility (NEW)
    native-actions.ts       # @capacitor/action-sheet utility (NEW)
    native-clipboard.ts     # @capacitor/clipboard utility (NEW)
    haptics.ts              # Extended with haptic event map (MODIFY)
  hooks/
    useSwipeToDelete.ts     # @use-gesture/react useDrag horizontal (NEW)
    usePullToRefresh.ts     # @use-gesture/react useDrag vertical (NEW)
    useAppLifecycle.ts      # Foreground reconnect hook (NEW)
  components/
    sidebar/
      SessionItem.tsx       # Add swipe gesture + Radix context menu trigger (MODIFY)
      SessionList.tsx       # Add pull-to-refresh wrapper, migrate context menu (MODIFY)
      SessionContextMenu.tsx  # DEPRECATED -- replaced by Radix pattern
      PullToRefreshSpinner.tsx # New spinner component (NEW)
    chat/view/
      MessageContextMenu.tsx   # Long-press context menu for messages (NEW)
      UserMessage.tsx          # Wrap in Radix ContextMenu trigger (MODIFY)
      AssistantMessage.tsx     # Wrap in Radix ContextMenu trigger (MODIFY)
```

### Pattern 1: Radix ContextMenu with Mobile Long-Press
**What:** Radix ContextMenu natively fires on long-press (500ms) on touch devices and right-click on desktop. No custom hook needed.
**When to use:** All context menus (session items, message bubbles).
**Example:**
```typescript
// Source: Existing FileTreeContextMenu.tsx pattern + Radix docs
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from '@/components/ui/context-menu';

export function SessionItemContextMenu({ children, onCopyId, onRename, onDelete, onExport, onPin, isPinned }) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onSelect={onCopyId}>Copy ID</ContextMenuItem>
        <ContextMenuItem onSelect={onRename}>Rename</ContextMenuItem>
        <ContextMenuItem onSelect={onPin}>{isPinned ? 'Unpin' : 'Pin to top'}</ContextMenuItem>
        <ContextMenuItem onSelect={onExport}>Export</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive" onSelect={onDelete}>Delete</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
```

### Pattern 2: @use-gesture/react useDrag with Axis Lock
**What:** Horizontal-only drag for swipe-to-delete, vertical-only drag for pull-to-refresh.
**When to use:** Directional gestures that must not conflict with scrolling.
**Example:**
```typescript
// Source: @use-gesture/react docs -- useDrag with axis lock
import { useDrag } from '@use-gesture/react';

function useSwipeToDelete(onDelete: () => void) {
  const [offset, setOffset] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const bind = useDrag(
    ({ movement: [mx], velocity: [vx], direction: [dx], cancel, active }) => {
      // Only allow left swipe
      if (dx > 0 && mx > 0) { cancel(); return; }

      if (active) {
        setOffset(Math.min(0, mx));
      } else {
        // Release: check threshold or velocity
        if (Math.abs(mx) > 80 || vx > 0.5) {
          setRevealed(true);
          setOffset(-80); // Snap to reveal position
        } else {
          setOffset(0); // Snap back
          setRevealed(false);
        }
      }
    },
    {
      axis: 'x',
      filterTaps: true,
      pointer: { touch: true },
      threshold: [10, Infinity], // 10px horizontal before activating
    }
  );

  return { bind, offset, revealed };
}
```

### Pattern 3: Capacitor Plugin Utility Module
**What:** Lazy-loaded platform-branching utility with IS_NATIVE guard.
**When to use:** All new Capacitor plugin integrations.
**Example:**
```typescript
// Source: Established pattern from native-plugins.ts
import { IS_NATIVE } from '@/lib/platform';

export async function nativeShare(options: { text: string; title?: string }): Promise<void> {
  if (IS_NATIVE) {
    try {
      const { Share } = await import('@capacitor/share');
      await Share.share({ title: options.title, text: options.text });
    } catch (err) {
      console.warn('[native-share] Share failed:', err);
    }
  } else if (navigator.share) {
    try {
      await navigator.share({ title: options.title, text: options.text });
    } catch {
      // User cancelled or unsupported
    }
  } else {
    // Fallback: copy to clipboard
    await nativeClipboardWrite(options.text);
  }
}
```

### Pattern 4: App Lifecycle Hook
**What:** React hook that listens for app foreground return and triggers WebSocket reconnect.
**When to use:** Root component (AppShell or App).
**Example:**
```typescript
// New hook: useAppLifecycle.ts
import { useEffect, useRef } from 'react';
import { IS_NATIVE } from '@/lib/platform';
import { useConnectionStore } from '@/stores/connection';
import { wsClient } from '@/lib/websocket-client';

export function useAppLifecycle(): void {
  if (!IS_NATIVE) return; // Hook rules: always call, but early return on condition
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    (async () => {
      try {
        const { App } = await import('@capacitor/app');
        const handle = await App.addListener('appStateChange', ({ isActive }) => {
          if (isActive) {
            // Debounce rapid foreground/background cycling
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => {
              const claudeStatus = useConnectionStore.getState().providers.claude.status;
              if (claudeStatus !== 'connected') {
                wsClient.tryReconnect();
              }
            }, 300);
          }
        });
        cleanup = () => handle.remove();
      } catch (err) {
        console.warn('[app-lifecycle] Failed to register listener:', err);
      }
    })();

    return () => cleanup?.();
  }, []);
}
```

### Anti-Patterns to Avoid
- **touch-action: none on scroll containers:** Breaks native scrolling. Use `touch-action: pan-y` on horizontal swipe elements, `touch-action: pan-x` on vertical pull elements.
- **Gesture handlers that call setState on every frame:** Use refs for intermediate gesture state, only setState on gesture completion.
- **Multiple gesture libraries:** Do NOT add react-aria useLongPress alongside @use-gesture/react. Radix handles long-press natively.
- **Raw touchstart/touchmove for new gestures:** Per D-02, existing Sidebar swipe stays raw, but all NEW gestures use @use-gesture/react.
- **Synchronous dynamic imports in render path:** All Capacitor plugin imports must be async (already established pattern).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Horizontal swipe detection | Custom touchstart/touchmove/touchend | @use-gesture/react useDrag with axis:'x' | Velocity tracking, multi-touch, scroll conflict resolution, passive listener management |
| Vertical pull detection | Custom overscroll detection | @use-gesture/react useDrag with axis:'y' | Same as above plus overscroll threshold math |
| Long-press context menu trigger | Custom setTimeout + touchcancel handling | Radix ContextMenu (built-in long-press) | Radix handles touch cancellation, scroll conflicts, accessibility, portal positioning |
| Clipboard on HTTP origins | navigator.clipboard.writeText | @capacitor/clipboard on native | navigator.clipboard fails on HTTP origins in WKWebView; Capacitor uses native UIKit |
| iOS share sheet | Custom modal with share options | @capacitor/share | UIActivityViewController gives AirDrop, Messages, Mail, Notes -- impossible to replicate |
| iOS action sheet | Custom bottom sheet component | @capacitor/action-sheet | Native UIAlertController with Destructive style matches iOS system UX |
| App lifecycle events | window focus/blur + visibilitychange | @capacitor/app appStateChange | WKWebView doesn't reliably fire visibilitychange on background/foreground; Capacitor uses native UIApplication events |

**Key insight:** The Capacitor plugin layer exists precisely because web APIs are unreliable in WKWebView. navigator.clipboard, visibilitychange, and navigator.share all have failure modes in the Capacitor context that native plugins solve.

## Common Pitfalls

### Pitfall 1: Swipe Gesture Conflicts with Horizontal Scroll
**What goes wrong:** Horizontal swipe-to-delete intercepts horizontal scrolling in code blocks or other horizontally scrollable content.
**Why it happens:** Without axis lock, the gesture handler captures all horizontal touch movement.
**How to avoid:** Use `axis: 'x'` with a threshold of `[10, Infinity]` so the gesture only activates after 10px horizontal displacement and never activates from vertical movement. The SessionItem has no horizontal scroll content, so this is lower risk than it would be in the message area.
**Warning signs:** Code blocks in messages become unscrollable horizontally on mobile.

### Pitfall 2: Pull-to-Refresh Conflicts with Native Overscroll Bounce
**What goes wrong:** iOS rubber band bounce on the session list scroll container triggers simultaneously with the custom pull-to-refresh, causing double-pull or visual jitter.
**Why it happens:** Phase 64 set `overscroll-behavior: none` on html/body but preserved native bounce on scroll containers via `.native-scroll` class.
**How to avoid:** The pull-to-refresh gesture should only activate at scrollTop === 0 (top of list). Use useDrag with a conditional that checks scrollTop before engaging the pull gesture. The native overscroll bounce must be suppressed on the session list container specifically (add `overscroll-behavior-y: contain`).
**Warning signs:** Two bounces visible when pulling down -- one from rubber band, one from PTR spinner.

### Pitfall 3: Radix ContextMenu Long-Press vs iOS Text Selection
**What goes wrong:** Long-pressing a message bubble triggers both the context menu and iOS text selection, creating a visual mess.
**Why it happens:** Radix sets `-webkit-touch-callout: none` on the trigger but text inside can still be selected.
**How to avoid:** Add `user-select: none` (via `-webkit-user-select: none`) to the ContextMenuTrigger wrapper on mobile. Users use the "Copy Text" menu action instead of native text selection on long-press targets.
**Warning signs:** Blue text selection handles appear alongside the context menu.

### Pitfall 4: Capacitor 8.x Plugin Version Mismatch
**What goes wrong:** `npm install @capacitor/app` installs 8.x (latest), which is incompatible with @capacitor/core 7.6.1.
**Why it happens:** npm latest tag defaults to newest major version.
**How to avoid:** Always specify `@capacitor/app@^7.1.2` or use `npm install @capacitor/app@latest-7`. Verify in package.json after install. All existing Capacitor plugins in the project are 7.x.
**Warning signs:** Build errors about missing Capacitor native methods, runtime crashes on plugin calls.

### Pitfall 5: Rapid Foreground/Background Cycling Causes Connection Storm
**What goes wrong:** User multitasks rapidly (app switcher), triggering multiple appStateChange foreground events in quick succession. Each one calls wsClient.tryReconnect(), creating parallel connection attempts.
**Why it happens:** iOS fires appStateChange for every foreground return, even if <1 second apart.
**How to avoid:** Debounce the foreground handler (300ms). wsClient.tryReconnect() already guards against concurrent connections (checks state), but debouncing prevents unnecessary reconnect/cancel cycles.
**Warning signs:** Multiple WebSocket connections open simultaneously, console shows rapid connect/disconnect cycles.

### Pitfall 6: useLongPress Does NOT Exist in @use-gesture/react
**What goes wrong:** Attempting to import `useLongPress` from `@use-gesture/react` fails.
**Why it happens:** CONTEXT.md D-03 references "@use-gesture/react's useLongPress" but the library has no such hook. It provides useDrag, useMove, useHover, useScroll, useWheel, usePinch, useGesture only.
**How to avoid:** For context menus: rely on Radix ContextMenu's built-in long-press (confirmed working on touch devices). For non-context-menu long-press needs: use useDrag with `delay: 500` option which delays drag activation and can be used to detect press-and-hold. Alternatively, implement a minimal custom useLongPress using setTimeout with touchcancel/touchend cleanup.
**Warning signs:** Import error at build time if someone tries `import { useLongPress } from '@use-gesture/react'`.

### Pitfall 7: Swipe-to-Delete and Radix ContextMenu Trigger Conflict
**What goes wrong:** The @use-gesture/react useDrag handler on SessionItem intercepts the touch events that Radix ContextMenuTrigger needs for long-press detection.
**Why it happens:** Both want to handle touch events on the same element. useDrag captures pointer events aggressively.
**How to avoid:** Use `filterTaps: true` in useDrag config. This ensures small movements (< 3px) and taps are passed through. Radix's long-press fires after 500ms of no movement -- useDrag's threshold of 10px means stationary long-press won't trigger the drag handler. The key is: movement = swipe (useDrag), no movement = long-press (Radix). These are mutually exclusive gestures.
**Warning signs:** Long-press stops working after adding swipe handler, or swipe triggers on long-press release.

## Code Examples

### Verified: Radix ContextMenu with Destructive Variant
```typescript
// Source: src/src/components/ui/context-menu.tsx (existing code)
// The shadcn ContextMenuItem already supports variant="destructive"
<ContextMenuItem variant="destructive" onSelect={handleDelete}>
  <Trash2 size={14} />
  Delete
</ContextMenuItem>
```

### Verified: Haptic Feedback API (existing)
```typescript
// Source: src/src/lib/haptics.ts
import { hapticImpact, hapticNotification, hapticSelection } from '@/lib/haptics';

// Light impact: sidebar toggle, swipe reveal, share trigger
hapticImpact('Light');

// Medium impact: context menu open
hapticImpact('Medium');

// Notification success: pull-to-refresh complete
hapticNotification('Success');

// Notification warning: delete confirmed
hapticNotification('Warning');

// Selection: session select
hapticSelection();
```

### Verified: wsClient.tryReconnect() for App Lifecycle
```typescript
// Source: src/src/lib/websocket-client.ts lines 79-93
// tryReconnect() already:
// 1. Guards against no token
// 2. Guards against already connected/connecting
// 3. Cancels pending auto-reconnect timer
// 4. Resets backoff to 0 (next failure starts at 1s)
// 5. Calls internal reconnect()
wsClient.tryReconnect();
```

### Verified: @capacitor/app appStateChange API
```typescript
// Source: Capacitor official docs
import { App } from '@capacitor/app';

const handle = await App.addListener('appStateChange', ({ isActive }) => {
  // isActive: true = foreground, false = background
});
// Cleanup: handle.remove();
```

### Verified: @capacitor/clipboard Write API
```typescript
// Source: Capacitor official docs
import { Clipboard } from '@capacitor/clipboard';

await Clipboard.write({ string: 'Text to copy' });
// Returns void, throws on failure
```

### Verified: @capacitor/action-sheet showActions API
```typescript
// Source: Capacitor official docs
import { ActionSheet, ActionSheetButtonStyle } from '@capacitor/action-sheet';

const result = await ActionSheet.showActions({
  title: 'Delete session?',
  message: 'This cannot be undone.',
  options: [
    { title: 'Delete', style: ActionSheetButtonStyle.Destructive },
    { title: 'Cancel', style: ActionSheetButtonStyle.Cancel },
  ],
});
// result.index: 0 = Delete, 1 = Cancel, -1 = dismissed
```

### Verified: @capacitor/share API
```typescript
// Source: Capacitor official docs
import { Share } from '@capacitor/share';

await Share.share({
  title: 'Conversation Export',
  text: conversationMarkdown,
});
// Returns { activityType?: string }
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom portaled context menus | Radix ContextMenu primitives | shadcn migration (v1.x) | FileTreeContextMenu already uses Radix; SessionContextMenu is the last custom holdout |
| navigator.clipboard.writeText | @capacitor/clipboard on native | Capacitor 5+ | HTTP origins fail with navigator.clipboard in WKWebView; native plugin solves this |
| window focus/visibilitychange | @capacitor/app appStateChange | Capacitor core concept | WKWebView doesn't reliably fire web lifecycle events |
| react-use-gesture (v7) | @use-gesture/react (v10) | 2022 (package rename) | New package name, same maintainer (pmndrs), hooks API unchanged |

**Deprecated/outdated:**
- `react-use-gesture`: Renamed to `@use-gesture/react` in v10. Don't install the old package.
- Custom portaled SessionContextMenu: Works but fragments the codebase. Radix pattern is standard.
- `navigator.clipboard` on native: Use @capacitor/clipboard wrapper instead for HTTP origin support.

## Open Questions

1. **@use-gesture/react's useDrag on WKWebView passive event listeners**
   - What we know: iOS Safari defaults touch events to passive. @use-gesture/react has a `pointer: { touch: true }` option that uses pointer events instead of touch events. Pointer events are not passive by default.
   - What's unclear: Whether this option is sufficient for WKWebView in Capacitor 7, or if additional `touch-action` CSS is needed.
   - Recommendation: Test on real device. Start with `pointer: { touch: true }` and `touch-action: pan-y` on swipe elements. If swipe doesn't fire, try adding explicit `{ pointer: { touch: true }, preventDefault: true }`.

2. **Radix ContextMenu long-press timing**
   - What we know: Radix docs say it "triggers with a long press on touch devices." The CONTEXT.md specifies 500ms.
   - What's unclear: Whether Radix's built-in long-press duration matches the 500ms requirement, or if it uses a different default (e.g., 300ms or 700ms).
   - Recommendation: Test on real device. If timing is wrong, @use-gesture/react's useDrag with `delay: 500` can be used to programmatically trigger context menu open via Radix's controlled state.

3. **Swipe-to-delete + Radix ContextMenuTrigger on same element**
   - What we know: useDrag with `filterTaps: true` passes through non-drag interactions. Radix ContextMenuTrigger wraps children with `asChild`.
   - What's unclear: Whether the DOM event order (useDrag binding + Radix's internal listeners) conflicts.
   - Recommendation: Test both gestures on the same SessionItem wrapper. If conflict, nest as: `ContextMenuTrigger > div[...useDrag bind()] > SessionItem content`. The swipe operates on the inner div, long-press on the outer trigger.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 + jsdom + @testing-library/react 16.3.2 |
| Config file | `src/vite.config.ts` (test section) |
| Quick run command | `cd src && npx vitest run --reporter=verbose` |
| Full suite command | `cd src && npx vitest run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| GESTURE-01 | Swipe-to-delete reveals Delete button | unit | `cd src && npx vitest run src/hooks/useSwipeToDelete.test.ts -x` | Wave 0 |
| GESTURE-02 | Pull-to-refresh triggers reload | unit | `cd src && npx vitest run src/hooks/usePullToRefresh.test.ts -x` | Wave 0 |
| GESTURE-03 | Long-press session opens context menu | integration | `cd src && npx vitest run src/components/sidebar/SessionItem.test.tsx -x` | Wave 0 |
| GESTURE-04 | Sidebar edge swipe works | manual-only | N/A -- verify on real device | N/A (existing code, verify only) |
| GESTURE-05 | Haptic feedback on 7 new touch points | unit | `cd src && npx vitest run src/lib/haptics.test.ts -x` | Wave 0 |
| GESTURE-06 | Long-press message opens context menu | integration | `cd src && npx vitest run src/components/chat/view/MessageContextMenu.test.tsx -x` | Wave 0 |
| GESTURE-07 | @use-gesture/react used for gestures | unit | Covered by GESTURE-01 and GESTURE-02 tests | N/A |
| GESTURE-08 | Foreground return reconnects WS | unit | `cd src && npx vitest run src/hooks/useAppLifecycle.test.ts -x` | Wave 0 |
| GESTURE-09 | Native share sheet | unit | `cd src && npx vitest run src/lib/native-share.test.ts -x` | Wave 0 |
| GESTURE-10 | Native action sheet for confirms | unit | `cd src && npx vitest run src/lib/native-actions.test.ts -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `cd src && npx vitest run --reporter=verbose`
- **Per wave merge:** `cd src && npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/src/hooks/useSwipeToDelete.test.ts` -- covers GESTURE-01
- [ ] `src/src/hooks/usePullToRefresh.test.ts` -- covers GESTURE-02
- [ ] `src/src/hooks/useAppLifecycle.test.ts` -- covers GESTURE-08
- [ ] `src/src/lib/native-share.test.ts` -- covers GESTURE-09
- [ ] `src/src/lib/native-actions.test.ts` -- covers GESTURE-10
- [ ] `src/src/lib/native-clipboard.test.ts` -- covers GESTURE-06 clipboard portion
- [ ] `src/src/lib/haptics.test.ts` -- extend existing tests for new haptic events (GESTURE-05)
- [ ] `src/src/components/chat/view/MessageContextMenu.test.tsx` -- covers GESTURE-06
- [ ] `src/src/components/sidebar/SessionItem.test.tsx` -- covers GESTURE-03 context menu migration

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build/test | Yes | (project already builds) | -- |
| npm | Package install | Yes | (project already builds) | -- |
| @capacitor/core | Plugin runtime | Yes | ^7.6.1 (devDep) | -- |
| Real iOS device | Gesture validation | No (Linux host) | -- | User tests via Claude Relay; Playwright for basic interaction tests |
| Safari Web Inspector | Debugging | No (Linux host) | -- | Chrome DevTools for web mode; user handles native debugging on Mac |

**Missing dependencies with no fallback:**
- None (all blocking deps are software packages installable via npm)

**Missing dependencies with fallback:**
- Real iOS device: Linux dev host cannot test native gestures directly. Automated tests cover logic; real-device testing is user's responsibility via iPhone 16 Pro Max + Mac.

## Sources

### Primary (HIGH confidence)
- `src/src/components/ui/context-menu.tsx` -- Existing shadcn Radix ContextMenu primitives (code inspection)
- `src/src/components/file-tree/FileTreeContextMenu.tsx` -- Reference Radix ContextMenu implementation (code inspection)
- `src/src/components/sidebar/SessionContextMenu.tsx` -- Existing custom context menu to replace (code inspection)
- `src/src/lib/haptics.ts` -- Existing haptic API to extend (code inspection)
- `src/src/lib/native-plugins.ts` -- Established plugin init pattern (code inspection)
- `src/src/lib/websocket-client.ts` -- tryReconnect() API (code inspection)
- [Radix ContextMenu docs](https://www.radix-ui.com/primitives/docs/components/context-menu) -- Long-press support confirmed
- [Capacitor App Plugin API](https://capacitorjs.com/docs/apis/app) -- appStateChange event
- [Capacitor Clipboard API](https://capacitorjs.com/docs/apis/clipboard) -- write/read methods
- [Capacitor Action Sheet API](https://capacitorjs.com/docs/apis/action-sheet) -- showActions method
- [Capacitor Share API](https://capacitorjs.com/docs/apis/share) -- share method

### Secondary (MEDIUM confidence)
- [@use-gesture/react docs](https://use-gesture.netlify.app/docs/) -- useDrag API, options (axis, threshold, filterTaps, swipe, delay)
- [@use-gesture/react options](https://use-gesture.netlify.app/docs/options/) -- Detailed config documentation
- [npm registry](https://www.npmjs.com/package/@use-gesture/react) -- Version 10.3.1 confirmed current
- [Capacitor GitHub Issues #486](https://github.com/pmndrs/use-gesture/issues/486) -- touch-action on iOS Safari

### Tertiary (LOW confidence)
- @use-gesture/react on WKWebView: Limited real-world reports. Multiple GitHub issues about iOS touch handling but no definitive "it works" or "it breaks" for Capacitor WKWebView specifically. Needs real device validation.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries verified against npm, versions confirmed compatible, existing patterns in codebase
- Architecture: HIGH -- follows established patterns (native-plugins.ts, FileTreeContextMenu.tsx, haptics.ts)
- Pitfalls: HIGH -- identified 7 specific pitfalls from code inspection, GitHub issues, and API documentation
- Gesture integration: MEDIUM -- @use-gesture/react + Radix ContextMenu on same element needs real-device testing
- iOS WKWebView behavior: LOW -- limited data on @use-gesture/react in Capacitor WKWebView specifically

**Research date:** 2026-03-29
**Valid until:** 2026-04-28 (stable libraries, no expected breaking changes)
