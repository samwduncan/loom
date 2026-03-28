# Domain Pitfalls: iOS Polish for Existing Capacitor Web App

**Domain:** Adding iOS-native gestures, visual effects, and touch polish to an existing React + Capacitor 7.6.1 chat app running in WKWebView server.url mode
**Researched:** 2026-03-28
**Platform:** iPhone 16 Pro Max, iOS 17+, Capacitor 7.6.1, Vite 7, React 19

---

## Critical Pitfalls

Mistakes that cause rewrites, broken UX, or multi-day debugging sessions.

---

### Pitfall 1: iOS Back Gesture Conflict with Custom Swipe Gestures

**What goes wrong:** Adding horizontal swipe gestures (swipe-to-delete on session items, swipe-to-open sidebar) conflicts with iOS's built-in edge-swipe-to-go-back gesture. When users start a swipe near the left edge, both the native navigation gesture AND the custom gesture fire, causing a jarring double-action: the session item slides AND the WKWebView navigates back.

**Why it happens:** WKWebView's `allowsBackForwardNavigationGestures` is true by default. Capacitor does not disable it. The iOS gesture recognizer has priority over web touch events, but doesn't fully suppress them -- both fire.

**Consequences:** Users accidentally navigate away from the app when swiping session items near the left edge. The app shell may show a blank page or the WKWebView's back-stack snapshot. Recovery requires tapping forward or reloading.

**Prevention:**

In `ios/App/App/ViewController.swift` (or a Capacitor plugin), disable back-forward gestures since Loom is an SPA with no native navigation stack:

```swift
// In CAPBridgeViewController subclass
override func viewDidLoad() {
    super.viewDidLoad()
    bridge?.webView?.allowsBackForwardNavigationGestures = false
}
```

For swipe-to-delete specifically, reserve the left 20px edge zone for iOS native gestures and only allow swipe-to-delete from touches starting >20px from the left edge:

```typescript
const handleTouchStart = (e: React.TouchEvent) => {
  const touch = e.touches[0];
  if (!touch) return;
  // Skip if touch starts in iOS edge-swipe zone
  if (IS_NATIVE && touch.clientX < 20) return;
  startX.current = touch.clientX;
};
```

**Detection:** Test on real device by swiping from the very left edge of the screen. If you see a page-back animation or the whole WKWebView content slides right, the conflict exists.

**Phase:** GESTURE (Phase 67) -- must be addressed before implementing swipe-to-delete.

---

### Pitfall 2: `touch-action: pan-y` Does NOT Work in Safari/WKWebView for Gesture Discrimination

**What goes wrong:** Setting `touch-action: pan-y` on a swipe-to-delete container (intending to allow vertical scroll but capture horizontal swipe) does NOT behave as expected in Safari. Safari has historically had incomplete support for `touch-action` values beyond `auto` and `manipulation`. Even with Safari 18.2 fixing serialization order, the actual gesture discrimination is unreliable -- diagonal gestures get cancelled, vertical scrolling gets stuck, or the swipe gesture never fires.

**Why it happens:** Safari/WebKit uses a different gesture recognition pipeline than Chrome. The `touch-action` CSS property is partially implemented -- `pan-x` and `pan-y` values may be parsed but don't always gate gestures correctly. The browser's built-in momentum scrolling has its own gesture recognizer that takes priority.

**Consequences:** Horizontal swipe gestures on list items break vertical scrolling. Users can swipe a session item but then can't scroll the session list. Or vice versa -- scrolling works but swipe-to-delete never triggers because the browser steals the touch.

**Prevention:**

Do NOT rely on `touch-action: pan-y` for gesture discrimination on iOS. Instead, use a JavaScript-based approach with an initial-direction heuristic:

```typescript
const DIRECTION_THRESHOLD = 10; // px before committing to direction

const handleTouchMove = (e: React.TouchEvent) => {
  const touch = e.touches[0];
  if (!touch || !startRef.current) return;

  const dx = touch.clientX - startRef.current.x;
  const dy = touch.clientY - startRef.current.y;

  // Haven't committed to a direction yet
  if (!directionRef.current) {
    if (Math.abs(dx) > DIRECTION_THRESHOLD || Math.abs(dy) > DIRECTION_THRESHOLD) {
      // Commit: if more horizontal than vertical, it's a swipe
      directionRef.current = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical';
    }
    return; // Wait for direction commitment
  }

  if (directionRef.current === 'vertical') return; // Let browser handle scroll

  // Horizontal swipe: prevent scroll, apply transform
  e.preventDefault(); // Only works with non-passive listener!
  applySwipeTransform(dx);
};
```

The `touch-action: manipulation` already set on `<body>` in base.css is correct (disables double-tap zoom and pinch-zoom). Do NOT override it with `pan-y` or `pan-x` on child elements.

**Detection:** Test on real iPhone: try to scroll the session list vertically when a session item has `touch-action: pan-y`. If scrolling feels sticky or unresponsive, this pitfall has been triggered.

**Phase:** GESTURE (Phase 67) -- critical for swipe-to-delete implementation.

---

### Pitfall 3: React's Passive Event Listeners Block `preventDefault()` on Touch Events

**What goes wrong:** Calling `e.preventDefault()` inside a React `onTouchMove` handler does nothing on iOS. The gesture you're trying to capture (e.g., horizontal swipe) still triggers the browser's built-in scroll. The console shows: "Unable to preventDefault inside passive event listener invocation."

**Why it happens:** React 17+ attaches all event listeners to the root, and since iOS 11.3, all root-level touch event listeners are passive by default. React's synthetic event system does not pass `{ passive: false }` -- it CAN'T, because it uses event delegation on the root. When you call `e.preventDefault()` in a React `onTouchMove`, you're calling it on a passive listener, which is a no-op.

**Consequences:** Custom horizontal swipe gestures (swipe-to-delete) can't prevent the browser from simultaneously scrolling vertically. The UI jitters as both horizontal translation AND vertical scroll happen at once.

**Prevention:**

Use `useEffect` to attach touch listeners directly to the DOM element with `{ passive: false }`:

```typescript
useEffect(() => {
  const el = itemRef.current;
  if (!el) return;

  const onTouchMove = (e: TouchEvent) => {
    if (isSwipingRef.current) {
      e.preventDefault(); // This WORKS because listener is non-passive
      applySwipeTransform(e);
    }
  };

  // MUST be { passive: false } to allow preventDefault
  el.addEventListener('touchmove', onTouchMove, { passive: false });
  return () => el.removeEventListener('touchmove', onTouchMove);
}, []);
```

Do NOT use React's `onTouchMove` prop for gestures that need `preventDefault`. Use it only for gestures that don't need to block scrolling (like tracking a move for visual feedback).

If using `@use-gesture`, you MUST use the `target` option with a ref instead of the `...bind()` spread pattern, AND set `eventOptions: { passive: false }`:

```typescript
useDrag(handler, {
  target: itemRef,
  eventOptions: { passive: false },
  axis: 'x',
  filterTaps: true,
});
```

**Detection:** Open Safari DevTools console. If you see "Unable to preventDefault inside passive event listener" warnings, your gesture handler is bound passively.

**Phase:** GESTURE (Phase 67) -- must be addressed in every swipe/drag gesture implementation.

---

### Pitfall 4: `overscroll-behavior: none` is Ignored in WKWebView

**What goes wrong:** The CSS `overscroll-behavior: none` (already set on `html` and `body` in base.css) does NOT suppress rubber-band bounce in WKWebView. Users see the rubber-band overscroll when pulling down on the chat message list, even though the CSS says it shouldn't bounce.

**Why it happens:** WKWebView uses its own scroll view (`UIScrollView`) under the hood, and `overscroll-behavior` is a web-standard CSS property that WebKit recognizes but the underlying native scroll view ignores. The bounce behavior is controlled by `UIScrollView.bounces`, which CSS cannot reach.

**Consequences:** Pull-to-refresh (GESTURE-02) becomes unreliable because the rubber-band bounce interferes with custom pull-to-refresh detection. Users see both the native bounce AND any custom pull-to-refresh indicator, creating a jarring double-animation.

**Prevention:**

For pull-to-refresh, you have two options:

**Option A (Recommended): Use native `UIRefreshControl` via a Capacitor plugin.** This is the iOS-native approach and feels exactly right:

```swift
// Custom Capacitor plugin
@objc func enablePullToRefresh(_ call: CAPPluginCall) {
    DispatchQueue.main.async {
        let refreshControl = UIRefreshControl()
        refreshControl.addTarget(self, action: #selector(self.handleRefresh), for: .valueChanged)
        self.bridge?.webView?.scrollView.refreshControl = refreshControl
    }
}
```

Then notify the web app via `window.dispatchEvent(new CustomEvent('native-refresh'))`.

**Option B: Disable bounce entirely and implement a pure-web pull-to-refresh.** Set `scrollView.bounces = false` in native code, then implement a custom pull indicator using touch events. This is harder to get right and will never feel as native.

For the chat message list specifically, you probably want bounce disabled (no pull-to-refresh on chat) but pull-to-refresh on the session list. This means per-scroll-container control, which requires native code:

```swift
// Disable bounce on the main WKWebView scroll view
bridge?.webView?.scrollView.bounces = false
// The web app handles per-container scroll via its own overflow elements
```

**Detection:** On real iPhone, pull down firmly at the top of the session list. If you see the entire WKWebView bounce (background shows through), `overscroll-behavior` is being ignored.

**Phase:** GESTURE (Phase 67) -- affects pull-to-refresh implementation choice.

---

### Pitfall 5: WKWebView Keyboard Dismissal Leaves Viewport Shifted (iOS 12-26)

**What goes wrong:** After the keyboard dismisses, `position: fixed` elements bounce up and down, `visualViewport.offsetTop` doesn't reset to 0, and `visualViewport.height` stays smaller than `window.innerHeight`. The composer ends up floating in the wrong position, or the entire app shell has a gap at the bottom.

**Why it happens:** This is a long-running WebKit bug (filed as WebKit bug 192564, still open). When `viewport-fit=cover` is set (required for safe-area support on notched devices), keyboard dismissal doesn't properly restore the viewport geometry. The issue persists across iOS 12 through iOS 26 beta.

**Consequences:** After using the composer (typing, sending), the app shell has a phantom gap at the bottom. The gap grows with repeated keyboard open/close cycles. Users must scroll or interact to reset the layout.

**Prevention:**

The existing `useKeyboardOffset` hook already handles the web fallback path. For the native path (`IS_NATIVE === true`), the hook is currently a no-op, relying on WKWebView's default Body resize. This is correct for Loom because:

1. The `.app-shell` uses `position: fixed; inset: 0` on native (base.css line 182)
2. The `contain: layout size style` prevents layout from leaking

However, add a safety net for the keyboard dismissal bug:

```typescript
// In useKeyboardOffset, add a focusout listener for native
if (IS_NATIVE) {
  const handleFocusOut = () => {
    // Force layout recalculation after keyboard dismisses
    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
    });
  };
  document.addEventListener('focusout', handleFocusOut);
  return () => document.removeEventListener('focusout', handleFocusOut);
}
```

**Detection:** On real iPhone, tap the composer to open keyboard, type something, then dismiss keyboard. Check if there's a gap at the bottom of the app. Repeat 5 times -- the bug is sometimes intermittent.

**Phase:** SCROLL (Phase 66) -- must be verified during scroll performance validation.

---

### Pitfall 6: `requestAnimationFrame` Capped at 60fps in WKWebView (ProMotion Ignored)

**What goes wrong:** Spring animations driven by `requestAnimationFrame` (rAF) run at 60fps maximum in WKWebView, even on iPhone 16 Pro Max with its 120Hz ProMotion display. CSS animations run at 120Hz, creating a visible disconnect: CSS-driven UI elements animate at 120fps while JS-driven elements stutter at 60fps.

**Why it happens:** Apple intentionally caps rAF at 60Hz in WKWebView to save battery. Safari 18.3+ has a developer flag to unlock 120Hz rAF, but this flag only applies to Safari itself, not to WKWebView used by third-party apps (like Capacitor). This is a deliberate platform restriction, not a bug.

**Consequences:** Any spring animation driven by JavaScript (e.g., via Framer Motion, GSAP, or custom rAF loops) will look noticeably less smooth than CSS transitions. Side-by-side, the CSS sidebar animation at 120Hz looks buttery while the JS spring on a modal looks choppy.

**Prevention:**

This is exactly why the existing architectural decision to prefer CSS transitions over JS animation is correct. Double down on it:

1. **Use CSS transitions for all UI animations.** CSS transitions run on the compositor at 120Hz:
   ```css
   .sidebar-panel {
     transition: transform 280ms cubic-bezier(0.32, 0.72, 0, 1);
   }
   ```

2. **CSS `@keyframes` for springs.** Approximate spring physics with a cubic-bezier that matches the spring curve:
   ```css
   /* Approximation of spring(mass:1, stiffness:200, damping:20) */
   transition-timing-function: cubic-bezier(0.32, 0.72, 0, 1);
   ```

3. **Only use rAF for non-visual work** (scroll position calculation, intersection detection). Never for driving visual animation on native.

4. **If LazyMotion/Framer Motion is used for a spring**, know that it will max out at 60fps on native. This is acceptable for low-frequency animations (modal entry) but visible on high-frequency ones (drag follow, sidebar swipe).

**Detection:** On real iPhone, compare a CSS transition animation vs. a rAF-driven animation side by side. The rAF version will look noticeably less smooth.

**Phase:** VISUAL (Phase 68) -- affects spring animation tuning for VISUAL-03 and VISUAL-04.

---

## Moderate Pitfalls

Mistakes that cause hours of debugging or suboptimal UX but don't require rewrites.

---

### Pitfall 7: Long-Press Triggers Native iOS Context Menu (Link Preview / Image Preview)

**What goes wrong:** Implementing a custom long-press context menu (GESTURE-03, GESTURE-06) conflicts with iOS's built-in context menu. When a user long-presses on a session item or message, they see BOTH your custom React popover AND the native iOS context menu (with "Open Link", "Copy", "Share" options). Or worse, the native menu fires and your custom handler never runs.

**Why it happens:** WKWebView has a built-in long-press gesture recognizer that shows native previews for links and images. This recognizer fires at ~450ms. If your custom handler also fires at 500ms, there's a race condition. Capacitor doesn't have a `SuppressesLongPressGesture` option (Cordova did).

**Prevention:**

Suppress the native context menu with CSS and the `contextmenu` event:

```css
/* Suppress native long-press callout on elements where we have custom menus */
.session-item,
.message-bubble {
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
}
```

```typescript
// Prevent the native context menu from firing
el.addEventListener('contextmenu', (e) => {
  e.preventDefault();
}, { passive: false });
```

In capacitor.config.ts, disable link previews:

```typescript
ios: {
  allowsLinkPreview: false, // Suppress iOS link preview on long-press
}
```

Then implement your custom long-press with a timer:

```typescript
const LONG_PRESS_MS = 500;
let timer: ReturnType<typeof setTimeout> | null = null;
let moved = false;

const onTouchStart = () => {
  moved = false;
  timer = setTimeout(() => {
    if (!moved) {
      hapticImpact('Medium');
      showContextMenu();
    }
  }, LONG_PRESS_MS);
};

const onTouchMove = (e: TouchEvent) => {
  // Cancel if finger moved more than 10px
  const dx = Math.abs(e.touches[0].clientX - startX);
  const dy = Math.abs(e.touches[0].clientY - startY);
  if (dx > 10 || dy > 10) {
    moved = true;
    if (timer) clearTimeout(timer);
  }
};

const onTouchEnd = () => {
  if (timer) clearTimeout(timer);
};
```

**Detection:** Long-press on a link inside a message on real iPhone. If the native "Open / Copy / Share" popover appears, suppression is incomplete.

**Phase:** GESTURE (Phase 67) -- GESTURE-03 and GESTURE-06.

---

### Pitfall 8: Nested `backdrop-filter: blur()` Causes WKWebView Rendering Glitches

**What goes wrong:** Having a modal with `backdrop-filter: blur(10px)` that overlays a sidebar also using `backdrop-filter: blur()` causes visual artifacts in WKWebView. The blur either disappears, renders as a solid color, or creates a "double blur" that looks like frosted glass on top of frosted glass -- unreadable.

**Why it happens:** WebKit's compositor has a known limitation with nested backdrop-filter elements. Each backdrop-filter creates a new stacking context and requires a separate compositing pass. When stacked, the GPU memory pressure can cause the renderer to fall back to a non-blurred path, or the blur accumulates beyond readability.

**Consequences:** Opening the command palette (which has glass effect) while the sidebar is open (which may also have glass) creates visual garbage. The SettingsModal overlay looks correct in Chrome DevTools but broken on real iPhone.

**Prevention:**

1. **Limit backdrop-filter to ONE visible layer at a time.** When a modal opens, remove blur from the background layer:
   ```css
   .sidebar.modal-open {
     backdrop-filter: none; /* Remove while modal is showing */
   }
   ```

2. **Use a smaller blur radius on mobile.** 10px is expensive; 4-6px looks nearly as good with half the GPU cost:
   ```css
   @media (max-width: 767px) {
     .glass-surface {
       backdrop-filter: blur(6px);
     }
   }
   ```

3. **Never nest more than 2 backdrop-filter elements in the same stacking context.** Audit the DOM tree before adding new glass effects.

4. **Use `will-change: transform` on the blurred element** to force GPU compositing:
   ```css
   .glass-surface {
     will-change: transform;
     backdrop-filter: blur(6px);
     -webkit-backdrop-filter: blur(6px); /* Still needed for older iOS */
   }
   ```

**Detection:** Open command palette on top of sidebar on real iPhone. If the blur disappears or creates a solid-color overlay, nesting is the issue.

**Phase:** VISUAL (Phase 68) -- VISUAL-02 glass effects.

---

### Pitfall 9: Pull-to-Refresh Fights with Existing `overscroll-behavior: none` and Scroll Anchoring

**What goes wrong:** Implementing pull-to-refresh (GESTURE-02) in the session list conflicts with the existing `overscroll-behavior: none` on `<body>`. The pull gesture never triggers because the browser (or the CSS rule) prevents the overscroll that would normally indicate a pull. Additionally, if using the JS-based approach, the scroll anchor logic in `useScrollAnchor` fights the pull gesture -- it tries to keep the scroll at the bottom while the pull tries to scroll past the top.

**Why it happens:** `overscroll-behavior: none` on `<body>` prevents scroll chaining globally. But pull-to-refresh requires overscroll at the top of the list. The scroll container needs `overscroll-behavior-y: contain` (not `none`) to allow the pull but prevent chaining to the parent. However, the session list is in the sidebar, not the main body.

**Consequences:** Pull-to-refresh either never triggers (overscroll blocked), or it triggers but the scroll anchor logic immediately cancels it (thinks user is scrolling, not pulling).

**Prevention:**

The session list sidebar scroll container should have:

```css
.session-list-scroll {
  overflow-y: auto;
  overscroll-behavior-y: contain; /* Allow overscroll but contain it */
  /* NOT 'none' -- need overscroll for pull detection */
}
```

The pull-to-refresh detection should be a separate concern from scroll anchoring. Use a dedicated state machine:

```typescript
type PullState = 'idle' | 'pulling' | 'threshold' | 'refreshing';

// Only enter 'pulling' when scrollTop === 0 AND touch is moving down
const handleTouchMove = (e: TouchEvent) => {
  if (scrollContainerRef.current?.scrollTop !== 0) return; // Not at top
  const dy = e.touches[0].clientY - startY;
  if (dy > 0 && pullState === 'idle') {
    setPullState('pulling');
  }
};
```

Keep `overscroll-behavior: none` on `<body>` (prevents the whole page from bouncing) but use `overscroll-behavior-y: contain` on the specific scroll container that needs pull-to-refresh.

**Detection:** Scroll the session list to the very top, then pull down. If nothing happens, overscroll is blocked. If the whole page bounces, scroll chaining leaked.

**Phase:** GESTURE (Phase 67) -- GESTURE-02 implementation.

---

### Pitfall 10: Server.url Mode Creates Unpredictable Caching for CSS/JS Assets

**What goes wrong:** In server.url mode, WKWebView loads assets from the remote dev server (or nginx). WKWebView's HTTP cache aggressively caches CSS and JS files. After deploying a new version, users see stale styles or stale JavaScript -- glass effects from the old build, missing gesture handlers from the new build, or half-old/half-new component rendering.

**Why it happens:** WKWebView honors HTTP cache headers, but it also has its own process-level cache that survives app backgrounding. The `cleartext: true` config doesn't affect caching behavior. Unlike a regular browser, there's no easy "hard refresh" -- force-quitting the app doesn't always clear the WKWebView cache.

**Consequences:** After deploying a new build with gesture handlers, users don't get the new code until the cache expires (or the app is fully killed and relaunched, sometimes multiple times). CSS changes don't apply, causing visual regressions that are "fixed" but invisible to the user.

**Prevention:**

Loom already uses Vite's content-hashed filenames (e.g., `index-a1b2c3.js`), which should bust caches on asset changes. Verify this is working:

1. **Check nginx headers** -- ensure `Cache-Control: immutable, max-age=31536000` is set for hashed assets and `Cache-Control: no-cache` for `index.html`:
   ```nginx
   location ~* \.[0-9a-f]{8}\.(js|css)$ {
     add_header Cache-Control "immutable, max-age=31536000";
   }
   location = / {
     add_header Cache-Control "no-cache";
   }
   ```

2. **After deploy, increment a query param on the server.url** in capacitor.config.ts to bust the HTML cache:
   ```typescript
   server: {
     url: process.env.CAPACITOR_SERVER_URL
       ? `${process.env.CAPACITOR_SERVER_URL}?v=${Date.now()}`
       : undefined,
   }
   ```
   This is only needed during development -- production bundled mode doesn't have this issue.

3. **Add a version check** in the app that compares client-side JS version with server-reported version and forces a reload on mismatch.

**Detection:** Deploy a CSS change (e.g., change an OKLCH color token). Load the app on iPhone. If the old color shows, caching is stale. Check Safari DevTools Network tab for "304 Not Modified" on index.html.

**Phase:** All phases -- ongoing concern during development and testing.

---

### Pitfall 11: `will-change` Overuse Causes GPU Memory Pressure and Black Flashes

**What goes wrong:** Adding `will-change: transform` to too many elements (every session item, every message, every tool card) causes WKWebView to create excessive compositor layers. On iPhone, GPU memory is limited. When the limit is exceeded, layers start getting evicted and re-created, causing black flashes or blank rectangles during scroll.

**Why it happens:** Each `will-change: transform` creates a separate GPU texture. On a chat with 50+ messages, each with a tool card, that's 100+ compositor layers. iPhone 16 Pro Max has 8GB RAM, but GPU texture memory is a fraction of that. WKWebView is less aggressive about layer management than Safari.

**Consequences:** Scrolling through a long conversation causes random black rectangles to flash where messages should be. The issue is intermittent and hard to reproduce in simulators (which have access to Mac GPU memory).

**Prevention:**

1. **Apply `will-change` only to elements that are ACTIVELY animating.** Remove it after animation completes:
   ```typescript
   el.style.willChange = 'transform';
   el.addEventListener('transitionend', () => {
     el.style.willChange = 'auto';
   }, { once: true });
   ```

2. **Never put `will-change` in a CSS rule that applies to repeated list items.** The `.msg-item` class should NOT have `will-change: transform`. Use it only on the sidebar panel, modals, and other singleton elements.

3. **The existing `content-visibility: auto` on `.msg-item` is correct** -- it already handles off-screen optimization without creating GPU layers.

4. **Use Safari DevTools "Layers" panel** to count compositor layers. Stay under 50 active layers.

**Detection:** Scroll rapidly through a 100+ message conversation on real iPhone. If you see black rectangles or blank spaces that fill in after a moment, GPU layers are being evicted.

**Phase:** SCROLL (Phase 66) -- SCROLL-06 GPU compositing verification.

---

### Pitfall 12: Swipe-to-Delete Gesture Conflicts with Existing Sidebar Swipe-to-Close

**What goes wrong:** Loom already has a swipe-to-close gesture on the sidebar (Sidebar.tsx, line 42-101). Adding swipe-to-delete on session items INSIDE the sidebar creates a gesture conflict. A horizontal swipe on a session item could mean: (a) swipe-to-delete this session, OR (b) swipe to close the entire sidebar. Both gestures listen for the same touchmove direction (leftward horizontal swipe).

**Why it happens:** Both gestures are registered on overlapping DOM elements. The sidebar swipe-to-close listens on the sidebar panel ref, and the swipe-to-delete would listen on individual session items inside that panel. Touch events bubble from session items to the sidebar panel.

**Consequences:** Swiping left on a session item either: always closes the sidebar (parent captures first), always triggers delete (child prevents propagation), or sometimes one and sometimes the other (race condition).

**Prevention:**

Use `stopPropagation()` on the session item's touch handler to prevent the event from reaching the sidebar's swipe-to-close handler:

```typescript
// In SwipeableSessionItem
const handleTouchMove = (e: React.TouchEvent) => {
  if (isSwipingRef.current) {
    e.stopPropagation(); // Prevent sidebar's swipe-to-close from firing
    applySwipeTransform(e);
  }
};
```

Additionally, add a velocity/distance threshold difference:
- Swipe-to-delete: requires >60px horizontal displacement on the session item
- Swipe-to-close sidebar: requires >100px horizontal displacement (already set at line 78)

Ensure the sidebar swipe-to-close only activates on touches that start on the sidebar panel itself (not on session items):

```typescript
const handleTouchStart = (e: React.TouchEvent) => {
  // Only capture swipe-to-close on sidebar chrome (header, footer),
  // NOT on session items which have their own swipe handler
  const target = e.target as HTMLElement;
  if (target.closest('[data-swipeable-item]')) return;
  // ... existing swipe-to-close logic
};
```

**Detection:** On mobile, open sidebar and try to swipe-delete a session. If the entire sidebar closes instead, the gesture conflict exists.

**Phase:** GESTURE (Phase 67) -- GESTURE-01 implementation.

---

## Minor Pitfalls

Issues that cause subtle UX degradation but are easy to fix once identified.

---

### Pitfall 13: CSS Transitions Break After Keyboard Use on Some iOS Versions

**What goes wrong:** After the keyboard has been used (opened and closed), CSS transitions on animated elements stop working or run at incorrect speeds. Elements snap to their final state instead of animating.

**Why it happens:** A known iOS/WKWebView bug (tracked in Cordova iOS issue #796) where keyboard interaction disrupts the animation compositor state. The WKWebView's compositor sometimes fails to re-initialize properly after a viewport resize triggered by keyboard show/hide.

**Prevention:**

Force a compositor reset after keyboard dismissal:

```typescript
// Add to useKeyboardOffset's native path
const handleFocusOut = () => {
  requestAnimationFrame(() => {
    // Force compositor to recalculate
    document.body.style.opacity = '0.999';
    requestAnimationFrame(() => {
      document.body.style.opacity = '';
    });
  });
};
```

This is a "poke the compositor" hack, but it's the standard workaround used by Ionic framework internally.

**Detection:** Type in the composer (keyboard opens), send a message (keyboard closes), then immediately expand a ThinkingDisclosure or ToolCard. If the expand animation snaps instead of transitioning, this bug is active.

**Phase:** SCROLL (Phase 66) -- verify during scroll performance testing.

---

### Pitfall 14: OLED True Black (#000) Creates "Smearing" on Dark Content During Scroll

**What goes wrong:** Using true black (`oklch(0 0 0)`) as the background for VISUAL-01 causes "black smearing" on OLED displays during fast scroll. Pixels transitioning from true black to gray/colored have noticeably slower response times than pixels transitioning between two non-black values.

**Why it happens:** OLED pixels in their "off" state (true black) take longer to turn on than pixels that are already emitting some light. During fast scrolling, this creates a ghosting/smearing effect where dark content appears to trail or blur.

**Prevention:**

Use near-black instead of true black for the outermost background:

```css
/* VISUAL-01: Use near-black, not true black, for OLED */
html {
  background-color: oklch(0.05 0 0); /* Near-black, not pure black */
}
body {
  background-color: var(--surface-base); /* oklch(0.15) -- elevated surface */
}
```

The power savings difference between `oklch(0 0 0)` and `oklch(0.05 0 0)` is negligible (OLED pixels at 5% brightness use ~2% of full power). The smear reduction is worth it.

**Detection:** Scroll fast through a long conversation with code blocks (which have lighter backgrounds). If dark text smears or trails during scroll, true black is causing OLED ghosting.

**Phase:** VISUAL (Phase 68) -- VISUAL-01 OLED background.

---

### Pitfall 15: Desktop-Pretty Glass Effects Look Terrible on Small Mobile Screens

**What goes wrong:** Glass morphism effects (backdrop-filter blur with semi-transparent backgrounds) that look gorgeous on a 27" desktop display look muddy, low-contrast, and unreadable on a 6.7" iPhone screen. The blur radius that creates a subtle frosted-glass effect on desktop creates an illegible smear on mobile.

**Why it happens:** On mobile: (1) the blurred background contains denser content (more text per cm of screen), (2) the viewing angle is closer, (3) ambient light varies more (indoor/outdoor), and (4) the physical pixel density is higher, making blur artifacts more visible. Additionally, dark mode glass effects on dark backgrounds create near-zero contrast between the glass surface and its contents.

**Consequences:** Modals, command palette, and settings panels look beautiful in Chrome DevTools mobile preview but are hard to read on real iPhone in daylight.

**Prevention:**

1. **Increase background opacity on mobile** to compensate for reduced contrast:
   ```css
   @media (max-width: 767px) {
     .glass-surface {
       /* Desktop: oklch(0.15 / 0.6), Mobile: more opaque */
       background: oklch(0.15 0 0 / 0.85);
       backdrop-filter: blur(6px); /* Smaller radius */
     }
   }
   ```

2. **Test in direct sunlight.** DevTools cannot simulate the contrast reduction caused by bright ambient light on a glossy screen.

3. **Ensure text on glass surfaces meets AAA contrast (7:1)** since the glass background is semi-transparent and thus variable. Test against both best-case and worst-case blurred content behind the glass.

**Detection:** Take the phone outside or hold it under a bright desk lamp. If you can't read text in modals, the glass effect needs more opacity.

**Phase:** VISUAL (Phase 68) -- VISUAL-02 glass effects, VISUAL-08 contrast.

---

### Pitfall 16: `position: sticky` Breaks in WKWebView Nested Scroll Containers

**What goes wrong:** The LiveSessionBanner (SCROLL-08) or DateGroupHeader uses `position: sticky` to stay pinned during scroll. In WKWebView, sticky positioning fails silently inside nested scroll containers -- the element just scrolls away with everything else.

**Why it happens:** WKWebView's sticky implementation requires the sticky element's containing block to be the scroll container itself. If there's an intermediate `overflow: hidden` or `overflow: auto` parent between the sticky element and its scroll container, sticky behavior breaks. This is a Safari/WebKit limitation, not a standards issue.

**Prevention:**

Audit the DOM tree between any sticky element and its scroll parent. Ensure no intermediate ancestor has `overflow: hidden`:

```typescript
// Debug utility to check sticky viability
function canSticky(el: HTMLElement): boolean {
  let parent = el.parentElement;
  while (parent && parent !== el.closest('[style*="overflow"]')) {
    const style = getComputedStyle(parent);
    if (style.overflow !== 'visible') {
      console.warn('Sticky broken by', parent, 'overflow:', style.overflow);
      return false;
    }
    parent = parent.parentElement;
  }
  return true;
}
```

If sticky won't work, fall back to `position: fixed` with manual offset calculation (which the app already does for the LiveSessionBanner).

**Detection:** On real iPhone, scroll the message list with a sticky header visible. If the header scrolls away instead of staying pinned, a parent overflow is breaking it.

**Phase:** SCROLL (Phase 66) -- SCROLL-08 sticky header behavior.

---

### Pitfall 17: Haptic Feedback Timing Mismatch Creates "Laggy" Feel

**What goes wrong:** Firing haptic feedback AFTER the visual response (e.g., after a state update completes) creates a perceptible delay between touch and feedback. Users feel the tap, see the UI change 16ms later, then feel the haptic 50-100ms after that. This makes the app feel sluggish rather than responsive.

**Why it happens:** Haptic calls go through the Capacitor bridge (JS -> Swift -> Taptic Engine), which adds ~30-50ms of latency. If the haptic is fired inside a `setState` callback or after an async operation, the total delay becomes noticeable.

**Prevention:**

Fire haptics BEFORE or SIMULTANEOUS with the visual change, never after:

```typescript
const handleSessionSelect = (sessionId: string) => {
  // Fire haptic FIRST -- it goes through native bridge async
  hapticSelection();
  // Then update state -- visual change happens on next frame
  navigate(`/session/${sessionId}`);
};
```

The existing haptics.ts module already fires with `void Haptics.impact()` (fire-and-forget), which is correct. The key is calling it at the right point in the handler -- at the top, before any async work.

**Detection:** Tap rapidly between sessions. If the haptic feels "late" compared to the visual transition, the firing order is wrong.

**Phase:** GESTURE (Phase 67) -- GESTURE-05 expanded haptics.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Phase 64: Touch Targets | Touch target changes affecting existing layout | Test after EVERY change on real device; padding increase can push adjacent elements |
| Phase 65: Typography | Font size increase causing text overflow/truncation | Test with long session titles (100+ chars) and multi-language text |
| Phase 66: Scroll Performance | Measuring perf in Simulator instead of real device | Simulator uses Mac GPU; ALWAYS validate on physical iPhone |
| Phase 66: Scroll Performance | Adding `will-change` to fix jank but causing GPU memory issues | Use Safari DevTools Layers panel; stay under 50 active layers |
| Phase 66: Scroll Performance | CSS transitions broken after keyboard use | Compositor reset hack (Pitfall 13) |
| Phase 66: Scroll Performance | `position: sticky` silently broken by nested overflow | Audit DOM tree between sticky element and scroll parent (Pitfall 16) |
| Phase 67: Gestures (swipe-to-delete) | React `onTouchMove` passive listener prevents `preventDefault` | Use `useEffect` with DOM addEventListener `{ passive: false }` |
| Phase 67: Gestures (swipe-to-delete) | Conflict with existing sidebar swipe-to-close | Use `stopPropagation` and different displacement thresholds |
| Phase 67: Gestures (swipe-to-delete) | iOS back gesture conflict on left edge | Disable `allowsBackForwardNavigationGestures` in Swift |
| Phase 67: Gestures (pull-to-refresh) | CSS `overscroll-behavior: none` blocks pull detection | Consider native UIRefreshControl via Capacitor plugin |
| Phase 67: Gestures (long-press) | Native iOS context menu conflicts with custom menu | Set `-webkit-touch-callout: none` and `allowsLinkPreview: false` |
| Phase 68: Visual (glass) | Nested backdrop-filter causes rendering artifacts | Limit to ONE visible blur layer at a time |
| Phase 68: Visual (OLED) | True black smearing during fast scroll | Use near-black `oklch(0.05 0 0)` instead of pure black |
| Phase 68: Visual (springs) | rAF animations capped at 60fps in WKWebView | Use CSS transitions for all visible animations; rAF for logic only |
| Phase 68: Visual (contrast) | Glass effects unreadable on mobile in bright light | Increase glass opacity on mobile; test outdoors |

---

## Sources

**WKWebView Gesture Conflicts:**
- [touch-action: disable webview swipe back behavior (W3C PointerEvents #358)](https://github.com/w3c/pointerevents/issues/358)
- [allowsBackForwardNavigationGestures (Apple Developer Docs)](https://developer.apple.com/documentation/webkit/wkwebview/1414995-allowsbackforwardnavigationgestu)
- [WKWebView Swipe Back Gesture (Apple Developer Forums)](https://developer.apple.com/forums/thread/766975)

**touch-action Support:**
- [touch-action and scrolling directional lock (W3C #303)](https://github.com/w3c/pointerevents/issues/303)
- [touch-action: pan-y prevents L shaped gestures (@use-gesture #640)](https://github.com/pmndrs/use-gesture/discussions/640)
- [WebKit Features in Safari 18.2](https://webkit.org/blog/16301/webkit-features-in-safari-18-2/)

**Passive Event Listeners:**
- [@use-gesture FAQ: passive events](https://use-gesture.netlify.app/docs/faq/)
- [Prevent Default Behavior of Gesture (@use-gesture #1)](https://github.com/pmndrs/use-gesture/issues/1)
- [Blocking Navigation Gestures on iOS Safari](https://pqina.nl/blog/blocking-navigation-gestures-on-ios-13-4/)

**WKWebView overscroll-behavior:**
- [Disable rubber-band bounce scrolling in iOS WKWebView](https://feedback.base44.com/p/disable-rubber-band-bounce-scrolling-in-ios-wkwebview-wrapper)
- [CSS overscroll-behavior WebKit Bug #176454](https://bugs.webkit.org/show_bug.cgi?id=176454)
- [DisallowOverscroll not working on iOS 16 (Cordova #1244)](https://github.com/apache/cordova-ios/issues/1244)

**Keyboard/Viewport Issues:**
- [Keyboard dismissal leaves viewport shifted (WebKit #192564)](https://bugs.webkit.org/show_bug.cgi?id=192564)
- [Capacitor keyboard resize CSS rules not reevaluated (#6430)](https://github.com/ionic-team/capacitor/issues/6430)
- [Webview glitch on keyboard open (#5535)](https://github.com/ionic-team/capacitor/issues/5535)

**Animation Performance:**
- [WKWebView 120Hz Support (Apple Developer Forums)](https://developer.apple.com/forums/thread/773222)
- [Support for 120Hz requestAnimationFrame (WebKit #173434)](https://bugs.webkit.org/show_bug.cgi?id=173434)
- [Web Animation Performance Tier List (Motion Magazine)](https://motion.dev/magazine/web-animation-performance-tier-list)
- [CSS animations break after keyboard use (Cordova iOS #796)](https://github.com/apache/cordova-ios/issues/796)

**Context Menu / Long Press:**
- [SuppressesLongPressGesture in Capacitor (Discussion #3208)](https://github.com/ionic-team/capacitor/discussions/3208)
- [How to Prevent Default Context Menu on Long Press](https://additionalknowledge.com/2024/08/02/how-to-prevent-the-default-context-menu-live-preview-on-long-press-in-mobile-safari-chrome/)

**Visual Effects:**
- [How to fix filter: blur() performance in Safari](https://graffino.com/til/how-to-fix-filter-blur-performance-issue-in-safari/)
- [Backdrop Filter Blur rendering issues in Safari](https://copyprogramming.com/howto/backdrop-filter-blur-box-shadow-not-rendering-properly-in-safari)
- [Dark Mode Design Best Practices (NNG)](https://www.nngroup.com/articles/dark-mode-users-issues/)

**Server.url / Caching:**
- [WKWebView localhost same-origin policy (Capacitor #788)](https://github.com/ionic-team/capacitor/issues/788)
- [Capacitor iOS swipe back gesture (Discussion #3137)](https://github.com/ionic-team/capacitor/discussions/3137)

**Capacitor WKWebView Configuration:**
- [Adjusting WKWebView settings (Capacitor #1097)](https://github.com/ionic-team/capacitor/issues/1097)
- [Capacitor WKWebView bouncing issue iOS 16 (#5907)](https://github.com/ionic-team/capacitor/issues/5907)
