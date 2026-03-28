# Architecture Patterns: iOS-Native Gestures in React + Capacitor

**Domain:** iOS-native gesture integration for existing React/Capacitor chat app
**Researched:** 2026-03-28
**Overall confidence:** HIGH

---

## Executive Summary

Loom already has a working touch gesture infrastructure: `Sidebar.tsx` implements swipe-to-close via raw `onTouchStart`/`onTouchMove`/`onTouchEnd` handlers with direct DOM transform manipulation. This pattern works, is zero-dependency, and should be extended (not replaced) for swipe-to-delete, pull-to-refresh, long-press context menus, and enhanced haptics.

**Recommendation: Raw touch event handlers via custom hooks. No gesture library.**

Rationale: The codebase already uses raw touch handlers in Sidebar.tsx. Adding `@use-gesture/react` (~6KB gzipped for `useDrag` alone, ~10KB for the full bundle) introduces a dependency for functionality achievable in ~250 lines of custom hooks. The project has zero runtime gesture dependencies today. The Constitution's "zero new production deps for v2.0" precedent and the principle of keeping bundle lean argue against adding one for 4 gestures. The existing sidebar swipe code proves the team can build this.

---

## Recommended Architecture

### Gesture Hook Layer

All gesture logic lives in custom hooks under `src/hooks/`, never in components. Components receive gesture bind props and render. This follows the existing pattern where `useMobile()`, `useScrollAnchor()`, and `useKeyboardOffset()` encapsulate platform-specific behavior.

```
src/hooks/
  useSwipeAction.ts       -- Swipe-left to reveal action buttons
  usePullToRefresh.ts     -- Pull-down overscroll to trigger refresh
  useLongPress.ts         -- Long-press (500ms) to trigger context menu
```

### Platform-Conditional Strategy

Gestures are **mobile-only** (`< 768px` via `useMobile()`) and **native-enhanced** (haptics via `IS_NATIVE`). The web experience remains completely unchanged -- no gesture handlers attach on desktop. This is the same guard pattern used by the existing sidebar swipe code.

```
Component
  -> useMobile() ? bind gesture handlers : no handlers
  -> IS_NATIVE ? hapticImpact('Light') : silent no-op
```

The platform conditionals live **inside the hooks**, not at call sites. Each hook checks `useMobile()` internally and returns no-op handlers on desktop. This keeps component code clean.

### Component Boundaries

| Component | Change Type | Gesture | Notes |
|-----------|-------------|---------|-------|
| `SessionItem` | WRAP | Swipe-to-delete, long-press | Wrapped in SwipeableRow |
| `SessionList` | MODIFY | Pull-to-refresh | Add pull indicator + touch handlers to scroll container |
| `MessageContainer` | MODIFY | Long-press context menu | Add useLongPress for copy/retry |
| `Sidebar` | NONE | Already has swipe-to-close | Existing pattern is the architectural template |
| `SessionContextMenu` | NONE | Already positioned by `{ x, y }` | Works as-is for long-press origin |

### New Components

| Component | Purpose | Location |
|-----------|---------|----------|
| `SwipeableRow` | Reusable swipe-to-reveal wrapper | `src/components/shared/SwipeableRow.tsx` |
| `PullToRefreshIndicator` | Spinner/arrow that follows pull gesture | `src/components/shared/PullToRefreshIndicator.tsx` |
| `LongPressContextMenu` | Context menu for message long-press | `src/components/shared/LongPressContextMenu.tsx` |

### Data Flow Overview

```
                 GESTURE HOOKS (new)                    EXISTING INFRASTRUCTURE
         ┌─────────────────────────────┐        ┌──────────────────────────────┐
         │  useSwipeAction             │        │  haptics.ts                  │
         │    touchStart/Move/End      │───────>│    hapticImpact('Light')     │
         │    -> offset (translateX)   │        │    hapticSelection()         │
         ├─────────────────────────────┤        ├──────────────────────────────┤
         │  useLongPress               │        │  SessionContextMenu          │
         │    touchStart -> 500ms timer│───────>│    position: { x, y }        │
         │    -> onLongPress(position) │        │    (portaled to body)        │
         ├─────────────────────────────┤        ├──────────────────────────────┤
         │  usePullToRefresh           │        │  useMultiProjectSessions     │
         │    touchMove when scrollY=0 │───────>│    refetch()                 │
         │    -> pullDistance           │        │                              │
         └─────────────────────────────┘        └──────────────────────────────┘
                      │                                        │
                      v                                        v
              SwipeableRow.tsx                         SessionList.tsx
              PullToRefreshIndicator.tsx               SessionItem.tsx
              LongPressContextMenu.tsx                 MessageContainer.tsx
```

---

## Pattern 1: Swipe-to-Delete (GESTURE-01)

### Architecture

A `SwipeableRow` wrapper component handles the touch mechanics. The content translates right-to-left, revealing a fixed-position delete button behind it. This matches iOS Mail/Reminders exactly.

**Data flow:**
```
SwipeableRow
  ├── [Delete action]     (positioned absolute, behind content, bg-red)
  └── [Children content]  (translateX via ref during drag, transition on release)
```

**Implementation pattern:**

```typescript
// useSwipeAction.ts -- custom hook
export function useSwipeAction(options: {
  onAction: () => void;
  actionWidth?: number;
  threshold?: number;
}) {
  const elementRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);
  const swipingRef = useRef(false);
  const isMobile = useMobile();

  // Return no-op on desktop
  if (!isMobile) {
    return { elementRef, handlers: {}, isOpen: false, reset: () => {} };
  }

  const handlers = {
    onTouchStart: (e: React.TouchEvent) => {
      startXRef.current = e.touches[0]!.clientX; // ASSERT: touches[0] exists on touchstart
      swipingRef.current = false;
      // Remove transition for 1:1 tracking during drag
      if (elementRef.current) {
        elementRef.current.style.transition = 'none';
      }
    },
    onTouchMove: (e: React.TouchEvent) => {
      const deltaX = e.touches[0]!.clientX - startXRef.current; // ASSERT: touches[0] exists
      if (deltaX < -10) swipingRef.current = true;
      if (swipingRef.current && elementRef.current) {
        const clamped = Math.max(-ACTION_WIDTH, Math.min(0, deltaX));
        currentXRef.current = clamped;
        elementRef.current.style.transform = `translateX(${clamped}px)`;
      }
    },
    onTouchEnd: () => {
      const el = elementRef.current;
      if (!el) return;
      el.style.transition = 'transform 200ms var(--ease-out)';
      if (currentXRef.current < -threshold) {
        el.style.transform = `translateX(-${ACTION_WIDTH}px)`;
        hapticImpact('Light');
      } else {
        el.style.transform = 'translateX(0)';
      }
      swipingRef.current = false;
    },
  };

  return { elementRef, handlers, /* ... */ };
}
```

**Key design decisions:**

1. **Direct DOM mutation via ref** -- NOT React state. Same pattern as existing Sidebar.tsx swipe handler. Using `useState` for transform position would re-render the entire SessionItem on every touch frame (~60 events/second). Ref-based DOM mutation is zero-render overhead.

2. **`transition: 'none'` during drag, `transition: '200ms ease-out'` on release** -- Exact same pattern as existing `Sidebar.tsx` lines 55-56 and 77-79. Users get 1:1 tracking during drag, smooth snap on release.

3. **Action button width: 80px** -- iOS standard for single-action swipe reveals.

4. **Swipe threshold: 40px** (half action width) to commit the reveal.

5. **Constitution compliance:** Inline `style={{ transform }}` is explicitly allowed per Section 3.2: "Dynamically computed dimensions."

6. **Single-active pattern:** When one row opens via swipe, any previously open row snaps closed. Achieved via a shared ref/context that tracks the currently-open row ID.

7. **Haptic feedback:** `hapticImpact('Light')` when crossing the threshold (already no-op on web).

### Platform Isolation

```typescript
// In SessionList.tsx -- SwipeableRow only wraps on mobile
{dateGroup.sessions.map((session) => (
  <SwipeableRow
    key={session.id}
    onDelete={() => handleDeleteRequest(session.id)}
    disabled={!isMobile}  // no-op wrapper on desktop
  >
    <SessionItem {...sessionProps} />
  </SwipeableRow>
))}
```

Desktop: `SwipeableRow` with `disabled` renders children directly, no handlers attached, zero overhead.

---

## Pattern 2: Pull-to-Refresh (GESTURE-02)

### Architecture

Pull-to-refresh applies ONLY to the session list scroll container (`SessionList.tsx`), NOT the chat message list (which has infinite scroll / auto-follow semantics that conflict with pull-down behavior).

The existing `overscroll-behavior-y: contain` on `.native-scroll` prevents scroll chaining to the parent, which is correct. We implement a custom pull indicator that appears above the list content.

**Data flow:**
```
SessionList scroll container (ref={scrollRef})
  -> usePullToRefresh(scrollRef, refetch)
    -> Monitors touchmove when scrollTop === 0
    -> Sets pullDistance state (drives indicator height)
    -> Calls refetch() on release past threshold
    -> Shows PullToRefreshIndicator with spinner
```

**Implementation pattern:**

```typescript
// usePullToRefresh.ts
export function usePullToRefresh(
  scrollRef: RefObject<HTMLDivElement | null>,
  onRefresh: () => Promise<void> | void,
) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startYRef = useRef(0);
  const isPullingRef = useRef(false);
  const isMobile = useMobile();

  // No-op on desktop
  if (!isMobile) {
    return { pullDistance: 0, isRefreshing: false, handlers: {} };
  }

  const handlers = {
    onTouchStart: (e: React.TouchEvent) => {
      // Only start pulling when already at top of scroll
      if (scrollRef.current && scrollRef.current.scrollTop <= 0) {
        startYRef.current = e.touches[0]!.clientY; // ASSERT: touches[0] exists
        isPullingRef.current = true;
      }
    },
    onTouchMove: (e: React.TouchEvent) => {
      if (!isPullingRef.current) return;
      const deltaY = e.touches[0]!.clientY - startYRef.current; // ASSERT: touches[0] exists
      if (deltaY > 0 && scrollRef.current && scrollRef.current.scrollTop <= 0) {
        // Rubber-band resistance: diminishing returns
        const pull = Math.min(deltaY * 0.4, MAX_PULL);
        setPullDistance(pull);
      } else {
        // User scrolled normally -- cancel pull
        isPullingRef.current = false;
        setPullDistance(0);
      }
    },
    onTouchEnd: async () => {
      if (pullDistance > REFRESH_THRESHOLD) {
        setIsRefreshing(true);
        hapticNotification('Success');
        await onRefresh();
        setIsRefreshing(false);
      }
      setPullDistance(0);
      isPullingRef.current = false;
    },
  };

  return { pullDistance, isRefreshing, handlers };
}
```

**Key design decisions:**

1. **Rubber-band factor: `deltaY * 0.4`** -- Prevents over-pull, feels iOS-native. Real iOS uses a square-root curve; linear 0.4x is close enough.

2. **Threshold: 60px to trigger, max 120px** -- Matches iOS system pull-to-refresh activation distance.

3. **Must NOT interfere with normal scroll** -- Only activates when `scrollTop <= 0`. If user is mid-scroll and reaches top, pull behavior does not activate until the NEXT touchstart at top.

4. **`overscroll-behavior-y: contain`** already set on `.native-scroll` in `base.css` -- prevents browser's native pull-to-refresh and scroll chaining. Our custom implementation takes over.

5. **Integration with existing `refetch()`** -- `useMultiProjectSessions` already exposes `refetch()`. Pull-to-refresh calls it directly.

6. **Haptic: `hapticNotification('Success')`** when the refresh triggers.

### CSS for Indicator

```css
/* In SessionList or shared pull-to-refresh.css */
.pull-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  color: var(--text-muted);
  font-size: var(--text-body);
  transition: height 200ms var(--ease-out);
}

.pull-indicator svg {
  transition: transform 200ms var(--ease-out);
}
```

Height is driven by `pullDistance` via inline style (Constitution-allowed for dynamic dimensions).

---

## Pattern 3: Long-Press Context Menu (GESTURE-03, GESTURE-06)

### Architecture

A `useLongPress` hook starts a timer on `touchstart`, fires the callback at 500ms if the finger hasn't moved, and cancels on `touchmove` (> 10px movement) or `touchend`.

**Two use sites:**
1. **SessionItem** (GESTURE-03) -- long-press opens existing `SessionContextMenu` with Pin, Rename, Select, Delete
2. **MessageContainer** (GESTURE-06) -- long-press opens new `LongPressContextMenu` with Copy Text, Retry

**Data flow:**
```
SessionItem
  -> useLongPress({ onLongPress: openContextMenu })
    -> onTouchStart: start 500ms setTimeout
    -> onTouchMove: cancel if moved > 10px
    -> onTouchEnd: cancel timer, prevent click if already fired
    -> Timer fires: hapticImpact('Medium'), call onLongPress({ x, y })
```

**Implementation pattern:**

```typescript
// useLongPress.ts
interface LongPressOptions {
  onLongPress: (position: { x: number; y: number }) => void;
  delay?: number;
  moveThreshold?: number;
}

export function useLongPress({
  onLongPress,
  delay = 500,
  moveThreshold = 10,
}: LongPressOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPosRef = useRef({ x: 0, y: 0 });
  const firedRef = useRef(false);
  const isMobile = useMobile();

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => cancel, [cancel]);

  if (!isMobile) return {};

  return {
    onTouchStart: (e: React.TouchEvent) => {
      const touch = e.touches[0]!; // ASSERT: touches[0] exists on touchstart
      startPosRef.current = { x: touch.clientX, y: touch.clientY };
      firedRef.current = false;

      timerRef.current = setTimeout(() => {
        firedRef.current = true;
        hapticImpact('Medium');
        onLongPress({ x: touch.clientX, y: touch.clientY });
      }, delay);
    },
    onTouchMove: (e: React.TouchEvent) => {
      const touch = e.touches[0]!; // ASSERT: touches[0] exists on touchmove
      const dx = Math.abs(touch.clientX - startPosRef.current.x);
      const dy = Math.abs(touch.clientY - startPosRef.current.y);
      if (dx > moveThreshold || dy > moveThreshold) {
        cancel();
      }
    },
    onTouchEnd: (e: React.TouchEvent) => {
      cancel();
      if (firedRef.current) {
        e.preventDefault(); // Prevent click after long-press
      }
    },
  };
}
```

**Key design decisions:**

1. **500ms delay** matches iOS system long-press timing exactly.

2. **Movement threshold: 10px** -- same as existing sidebar swipe detection in `Sidebar.tsx` line 63.

3. **Must suppress iOS default callout** -- CSS `-webkit-touch-callout: none` on elements with long-press handlers.

4. **`e.preventDefault()` on touchend after long-press fires** -- prevents the subsequent click event from navigating to the session.

5. **Position from touchstart** -- captured when the press begins, used for menu positioning. This is where the menu should appear (under the finger).

6. **Existing SessionContextMenu works as-is** -- it already takes `position: { x: number; y: number }` and portals to `document.body`. No modifications needed to reuse it for long-press.

7. **New LongPressContextMenu for messages** -- similar structure to SessionContextMenu but with Copy Text and Retry options. Reuses the `context-menu-item` CSS class from `sidebar.css`.

### Suppress iOS Default Callout

```css
/* In base.css -- only on native to not break desktop text selection */
html[data-native] .long-press-target {
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
}
```

Applied via `className="long-press-target"` on elements with `useLongPress` handlers. Desktop (`html:not([data-native])`) retains normal text selection and browser context menus.

---

## Pattern 4: Sidebar Swipe-to-Open Verification (GESTURE-04)

### Architecture

Already implemented in `Sidebar.tsx` lines 46-101. The REQUIREMENTS.md marks GESTURE-04 as "already implemented; verify on real device" with 0h estimate.

**No code changes needed.** Real-device verification only.

The existing implementation uses the exact same raw touch event pattern recommended for all new gestures, confirming architectural consistency.

---

## Pattern 5: Broader Haptics (GESTURE-05)

### Architecture

The existing `haptics.ts` module with `hapticImpact()`, `hapticNotification()`, and `hapticSelection()` is the single integration point. No new infrastructure needed -- just add calls at the right moments in existing code.

**New haptic touch points:**

| Action | Haptic Call | Integration Point | Risk |
|--------|-----------|-------------------|------|
| Session select (tap) | `hapticSelection()` | `SessionItem.onClick` handler | NONE |
| Sidebar toggle | `hapticImpact('Light')` | `Sidebar.toggleSidebar` callback | NONE |
| Pull-to-refresh trigger | `hapticNotification('Success')` | `usePullToRefresh` hook | NONE |
| Context menu open | `hapticImpact('Medium')` | `useLongPress` hook | NONE |
| Swipe crosses threshold | `hapticImpact('Light')` | `useSwipeAction` hook | NONE |
| Delete confirmed | `hapticNotification('Warning')` | Delete action tap handler | NONE |

All haptic functions are already no-ops on web (guarded by `IS_NATIVE` internally). No platform guards needed at call sites. No new dependencies -- all functions already exist in `haptics.ts`.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Adding @use-gesture/react
**What:** Installing `@use-gesture/react` for swipe/drag/long-press gesture handling.
**Why bad:** ~6KB gzipped for `useDrag` alone. The codebase already demonstrates the raw touch pattern in `Sidebar.tsx`. Adds a dependency that must be maintained and could conflict with WKWebView touch handling edge cases. The library's value proposition (velocity calculations, spring integration, multi-touch) is irrelevant here -- we need basic single-finger swipe and timer-based long-press.
**Instead:** Custom hooks following the established `Sidebar.tsx` touch handler pattern. ~250 lines of application code replaces a library dependency.

### Anti-Pattern 2: Attaching Gesture Handlers on Desktop
**What:** Binding touch/pointer event handlers globally regardless of viewport width.
**Why bad:** Desktop users don't need swipe-to-delete, pull-to-refresh, or long-press. Adding handlers creates potential for unintended interactions with mouse drag, right-click context menus, and text selection. Also wastes event listener overhead.
**Instead:** Guard with `useMobile()` inside hooks -- only return real handlers at `< 768px`. Return no-op empty objects on desktop. The `useMobile()` hook (via `useSyncExternalStore`) is the single source of truth for this breakpoint.

### Anti-Pattern 3: CSS-Only Gestures
**What:** Attempting swipe-to-delete or pull-to-refresh with pure CSS scroll-snap, `:active`, or overscroll effects.
**Why bad:** CSS has no concept of gesture velocity, rubber-banding, or threshold-based action triggers. Cannot integrate with state (delete/refresh callbacks). Cannot fire haptics. The visual result would feel non-native.
**Instead:** Raw touch events for gesture tracking, CSS transitions for the visual animation on release.

### Anti-Pattern 4: Capacitor Native Gesture Plugins
**What:** Using `capacitor-plugin-swipe-gestures` or building a native Swift gesture recognizer for in-app gestures.
**Why bad:** Native gesture plugins compete with WKWebView's gesture system, causing conflicts (double-fire, gesture stealing). The web view already receives all touch events. Native plugins are appropriate for gestures that need to work OUTSIDE the web view (e.g., native navigation bar), not for in-app content interactions.
**Instead:** Web touch events work perfectly in WKWebView. No native bridge crossing needed.

### Anti-Pattern 5: Single God Hook for All Gestures
**What:** One `useGestures()` hook that handles swipe, long-press, pull-to-refresh, and pinch simultaneously.
**Why bad:** Different gestures have incompatible lifecycles. Swipe needs continuous position tracking. Long-press needs a timer that cancels on movement. Pull-to-refresh needs scroll position awareness. Combining them creates gesture conflict resolution complexity.
**Instead:** One hook per gesture type, composed at the component level via separate event handler props.

### Anti-Pattern 6: Using useState for Drag Position
**What:** `const [x, setX] = useState(0)` updated on every touchmove event.
**Why bad:** Causes React re-render on every touch frame (~60/sec). Each render re-runs the component function, diffs the virtual DOM, and commits to DOM. For a list item with children, this is visible jank on mobile.
**Instead:** Direct DOM mutation via ref (`elementRef.current.style.transform = ...`). This is the exact pattern used in `Sidebar.tsx` (line 65) and the streaming buffer (useRef + rAF, bypass React reconciler).

---

## Integration Points with Existing Code

### Store Changes: NONE

No Zustand store changes required. All gesture state is local to the gesture hooks (useRef for tracking, useState only for final snap states like "is open" or "is refreshing"). The gesture outcomes (delete, refresh, copy) call existing store actions or API functions that already exist.

### CSS Changes

| File | Change | Impact |
|------|--------|--------|
| `base.css` | Add `.long-press-target` rules (native-only) | Suppress iOS callout on gesture targets |
| `sidebar.css` | Add swipe-to-delete action button styles | Red delete button behind row |
| New: `swipeable-row.css` | SwipeableRow component positioning | Action button absolute positioning |
| New: `pull-to-refresh.css` | Pull indicator spinner + transition | Indicator height + spinner rotation |

### Existing Code Modifications

| File | Modification | Risk |
|------|-------------|------|
| `SessionItem.tsx` | Add `useLongPress` handlers, `long-press-target` class | LOW -- additive |
| `SessionList.tsx` | Wrap items in `SwipeableRow`, add pull-to-refresh handlers | LOW -- additive |
| `SessionList.tsx` | Add `PullToRefreshIndicator` above list content | LOW -- new DOM node |
| `MessageContainer.tsx` | Add `useLongPress` for copy/retry menu | LOW -- new behavior |
| `haptics.ts` | No changes -- just more call sites | NONE |
| `SessionContextMenu.tsx` | No changes -- already accepts position | NONE |

### Bundle Size Impact

| Addition | Source Size | Gzipped Est. | Type |
|----------|-----------|-------------|------|
| `useSwipeAction` hook | ~2KB | ~0.5KB | Application code |
| `usePullToRefresh` hook | ~1.5KB | ~0.4KB | Application code |
| `useLongPress` hook | ~1KB | ~0.3KB | Application code |
| `SwipeableRow` component | ~1.5KB | ~0.4KB | Application code |
| `PullToRefreshIndicator` component | ~1KB | ~0.3KB | Application code |
| `LongPressContextMenu` component | ~1KB | ~0.3KB | Application code |
| CSS additions | ~0.5KB | ~0.2KB | Styles |
| **Total** | **~8.5KB** | **~2.4KB** | **Zero new deps** |

Compare: `@use-gesture/react` would add ~6KB gzipped for `useDrag` alone (plus the hook wrapper overhead), or ~10KB for the full package. The custom approach is lighter AND more tailored to the codebase's existing patterns.

---

## Build Order (Phase 67 Structure)

Based on dependency analysis, the gesture features should be built in this order:

### Step 1: Shared Gesture Hooks (~2 hours)
Build `useLongPress`, `useSwipeAction`, `usePullToRefresh` hooks with unit tests. These have no component dependencies and can be tested in isolation with simulated touch events (Testing Library `fireEvent.touchStart` etc.).

- `useLongPress` -- simplest, test first
- `useSwipeAction` -- medium complexity, depends on understanding threshold mechanics
- `usePullToRefresh` -- needs scroll position awareness

### Step 2: SwipeableRow + Swipe-to-Delete (~3 hours)
Build `SwipeableRow` wrapper component with `swipeable-row.css`. Integrate into `SessionList` around `SessionItem`. Test with real touch simulation.

Dependencies: Step 1 (`useSwipeAction`)

### Step 3: Long-Press Context Menus (~3 hours)
Wire `useLongPress` into `SessionItem` (reuse existing `SessionContextMenu` -- zero new component needed). Build `LongPressContextMenu` for messages. Wire into `MessageContainer`. Add `.long-press-target` CSS to `base.css`.

Dependencies: Step 1 (`useLongPress`)

### Step 4: Pull-to-Refresh (~2 hours)
Build `PullToRefreshIndicator` component. Wire `usePullToRefresh` into `SessionList` scroll container. Connect to existing `refetch()` from `useMultiProjectSessions`.

Dependencies: Step 1 (`usePullToRefresh`)

### Step 5: Broader Haptics (~1 hour)
Add haptic calls to session select, sidebar toggle, and other touch points listed in Pattern 5. All calls use existing `haptics.ts` functions. Test on device.

Dependencies: None (can parallel with Steps 2-4)

### Step 6: Sidebar Swipe Verification (~0.5 hours)
Verify existing GESTURE-04 on real iPhone 16 Pro Max. No code changes expected.

Dependencies: None (can parallel)

**Total estimate: ~11.5 hours** (aligns with REQUIREMENTS.md Phase 67 budget of ~14 hours with testing buffer)

Steps 2, 3, 4 can run in parallel after Step 1 completes. Step 5 can run in parallel with everything.

---

## Scalability Considerations

| Concern | At 50 sessions | At 500 sessions | At 2000 sessions |
|---------|---------------|-----------------|------------------|
| Swipe handlers per row | One set per visible item, passive until touched | Same -- `content-visibility: auto` skips off-screen | Consider virtualization at this scale |
| Long-press timers | One active at a time (single-finger interaction) | Same | Same |
| Pull-to-refresh | Single instance on SessionList | Same | Same |
| DOM transforms during swipe | GPU-composited (`translateX`), no layout thrash | Same | Same |
| Event listener count | ~3 per visible SessionItem | Same (off-screen items have no active listeners) | Same (browser doesn't fire events on `content-visibility: auto` hidden items) |

The architecture scales well because:
- Touch handlers only fire on active user interaction (passive until touched)
- `content-visibility: auto` on `.msg-item` already skips layout for off-screen items
- No gesture state in Zustand -- all local to hooks via useRef
- `SwipeableRow` transform is GPU-composited (`translateX`), causes no layout thrash
- Timer-based long-press has negligible memory footprint (one setTimeout at a time)

---

## Sources

- Existing `Sidebar.tsx` swipe-to-close implementation (primary architectural reference, lines 46-101)
- [@use-gesture/react npm](https://www.npmjs.com/package/@use-gesture/react) -- evaluated, rejected: ~6KB gzipped for useDrag
- [@use-gesture/react tree shaking](https://github.com/pmndrs/use-gesture/issues/315) -- individual hooks available but still heavier than custom
- [react-swipe-to-delete-ios](https://github.com/arnaudambro/react-swipe-to-delete-ios) -- zero-dep reference implementation
- [CSS overscroll-behavior MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/overscroll-behavior) -- already in use in base.css
- [Chrome blog on overscroll-behavior](https://developer.chrome.com/blog/overscroll-behavior) -- pull-to-refresh control strategies
- [Capacitor gesture plugin discussion](https://github.com/ionic-team/capacitor/discussions/3208) -- evaluated native plugins, rejected
- [iOS WKWebView context menu discussion](https://github.com/ionic-team/capacitor/discussions/3208) -- CSS approach preferred over native
- [iOS Safari overscroll control](https://www.bram.us/2016/05/02/prevent-overscroll-bounce-in-ios-mobilesafari-pure-css/) -- CSS strategies for WKWebView
- Loom V2 Constitution (Sections 2.2, 3.1, 3.2, 3.6) -- compliance constraints
- Loom REQUIREMENTS.md (GESTURE-01 through GESTURE-06) -- feature specifications
- Loom `haptics.ts` -- existing haptic feedback infrastructure
- Loom `useMobile.ts` -- existing mobile breakpoint detection hook

---
*Architecture research for: iOS-native gestures in Loom v2.2 "The Touch"*
*Researched: 2026-03-28*
