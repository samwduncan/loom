# Phase 61: Touch, Layout & Native Plugins - Research

**Researched:** 2026-03-28
**Domain:** iOS native plugins (StatusBar, SplashScreen), touch target compliance, overscroll prevention, safe-area audit
**Confidence:** HIGH

## Summary

Phase 61 integrates two Capacitor plugins (StatusBar, SplashScreen), audits all interactive elements for 44px+ touch targets at mobile breakpoint, prevents rubber-band overscroll, resolves the iOS back gesture vs sidebar drawer conflict, and audits safe-area insets on all four edges.

The codebase already has strong patterns for everything this phase needs: dynamic plugin imports behind `IS_NATIVE` guards (from Phase 60), the `min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0` touch target pattern in 4+ files, `env(safe-area-inset-*)` usage in base.css/composer.css/Sidebar.tsx, and the `data-native` attribute for CSS-only native branching. The work is primarily extension-of-existing-patterns plus a comprehensive audit.

**Primary recommendation:** Extend `native-plugins.ts` with StatusBar and SplashScreen init (same dynamic import pattern as Keyboard), apply the established touch target pattern to all uncovered interactive elements, and add `overscroll-behavior: none` to html/body in base.css.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01 through D-05: StatusBar plugin as devDependency (^7.x), extend native-plugins.ts with initializeStatusBar(), Style.Dark, setBackgroundColor matching surface-base hex, called in initializeNativePlugins()
- D-06 through D-11: SplashScreen plugin as devDependency (^7.x), disable auto-hide in capacitor.config.ts, dark bg color, hide on connection ready with 300ms fade, 3s fallback timeout, hide logic in native-plugins.ts as hideSplashWhenReady()
- D-12 through D-17: Comprehensive touch audit of ALL interactive elements, priority order defined, min-h-[44px] min-w-[44px] pattern at mobile with md: reset, 767px breakpoint, dropdown/context menu overrides, verify ToolChip
- D-18 through D-21: overscroll-behavior: none on html/body, touch-action: pan-y on .app-shell, scrollable children keep normal touch-action
- D-22 through D-25: iOS back gesture passthrough when sidebar closed, sidebar swipe-to-close handles left-edge swipes when open, do NOT disable back gesture globally
- D-26 through D-29: Verify viewport-fit=cover, audit all four edges, add left/right padding on AppShell if needed, portrait-first
- D-30 through D-31: Verify send/stop in thumb zone, no over-engineering

### Claude's Discretion
- Exact hex color values for StatusBar background (derive from OKLCH tokens)
- Whether to add visual regression tests or rely on manual device testing
- CSS specificity strategy for shadcn component touch target overrides
- Whether splash screen uses custom image or solid color (solid simpler)

### Deferred Ideas (OUT OF SCOPE)
- Full responsive audit across all breakpoints (v2.3 "The Polish")
- VoiceOver/screen reader verification on device (Phase 63 device validation)
- Landscape-specific layout optimizations (portrait-first for v2.1)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TOUCH-01 | All interactive elements have 44px+ touch targets at mobile breakpoint | Touch target audit findings (Section: Touch Target Audit), established pattern documented |
| TOUCH-02 | Safe-area insets applied correctly on all four edges | Safe-area audit findings, viewport-fit=cover verified, left/right padding gap identified |
| TOUCH-03 | App shell prevents rubber-band overscroll at page level | overscroll-behavior CSS support verified (Safari 16+), Capacitor bounces disabled by default |
| TOUCH-04 | Gesture back navigation handled gracefully (no conflict with sidebar drawer) | Sidebar swipe-to-close analysis, iOS back gesture passthrough strategy |
| TOUCH-05 | Primary actions (send, stop) positioned within thumb-zone reach | Composer already at bottom, send/stop buttons use h-11 w-11 on mobile |
| NATIVE-01 | Status bar shows light text on dark background matching app theme | @capacitor/status-bar 7.0.6 API verified, Style.Dark for light text, setBackgroundColor supported on iOS in Cap 7+ |
| NATIVE-02 | Splash screen matches app background and hides smoothly after React mounts | @capacitor/splash-screen API verified, launchAutoHide: false + programmatic hide() with fadeOutDuration |
| NATIVE-03 | Haptic feedback on message send, tool completion, and error states | OUT OF SCOPE for Phase 61 per CONTEXT.md -- mapped to Phase 62 |
| NATIVE-04 | Capacitor plugins load via dynamic imports (tree-shaken from web builds) | Existing pattern in native-plugins.ts verified -- extend with same pattern |
</phase_requirements>

## Standard Stack

### Core (New Dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @capacitor/status-bar | ^7.0.6 | iOS status bar style & background color | Official Capacitor plugin, v7 added iOS setBackgroundColor support |
| @capacitor/splash-screen | ^7.0.5 | Programmatic splash screen hide with fade | Official Capacitor plugin, launchAutoHide: false + JS hide() pattern |

### Existing (No Changes)

| Library | Version | Purpose |
|---------|---------|---------|
| @capacitor/core | ^7.6.1 | Capacitor runtime |
| @capacitor/keyboard | ^7.0.6 | Already installed (Phase 60) |
| @capacitor/cli | ^7.6.1 | Build tooling |
| @capacitor/ios | ^7.6.1 | iOS platform |

**Installation:**
```bash
cd src && npm install -D @capacitor/status-bar@^7.0.6 @capacitor/splash-screen@^7.0.5
```

**Version verification:** Confirmed via npm registry on 2026-03-28:
- @capacitor/status-bar: latest 7.x stable is 7.0.6 (published 2026-03-19)
- @capacitor/splash-screen: latest 7.x stable is 7.0.5 (no 7.0.6 published)
- Both compatible with @capacitor/core ^7.6.1

## Architecture Patterns

### Plugin Init Extension Pattern

The existing `native-plugins.ts` has an established pattern: dynamic import behind `IS_NATIVE` guard, try/catch with graceful degradation, `nativePluginsReady` promise. StatusBar and SplashScreen follow the exact same pattern.

```typescript
// Source: Existing pattern in native-plugins.ts
export async function initializeNativePlugins(): Promise<void> {
  if (isInitialized || !IS_NATIVE) return;
  isInitialized = true;
  document.documentElement.setAttribute('data-native', '');

  try {
    // Keyboard (existing)
    const kbMod = await import('@capacitor/keyboard');
    // ... keyboard setup ...

    // StatusBar (new -- same pattern)
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#2b2521' });

    // SplashScreen module cached for later hide call
    splashModule = await import('@capacitor/splash-screen');
  } catch (err) {
    console.warn('[native-plugins] Plugin init failed:', err);
  } finally {
    resolveReady();
  }
}
```

### Splash Screen Dismiss Pattern

The splash screen hides when the WebSocket connects (connection store `connected` state), with a 3-second fallback timeout. This ensures users see content, not a blank screen.

```typescript
// Source: D-09, D-10 from CONTEXT.md
export function hideSplashWhenReady(): void {
  if (!IS_NATIVE || !splashModule) return;

  const unsubscribe = useConnectionStore.subscribe(
    (state) => state.providers.claude.status,
    (status) => {
      if (status === 'connected') {
        splashModule?.SplashScreen.hide({ fadeOutDuration: 300 });
        unsubscribe();
        clearTimeout(fallbackTimer);
      }
    },
  );

  // Fallback: hide after 3s even if connection fails
  const fallbackTimer = setTimeout(() => {
    splashModule?.SplashScreen.hide({ fadeOutDuration: 300 });
    unsubscribe();
  }, 3000);
}
```

**Key insight:** The ConnectionStore tracks `providers.claude.status` which transitions to `'connected'` when WebSocket opens successfully (see `websocket-init.ts` line 304). Zustand's `subscribe` with selector is the cleanest way to watch this outside React.

### Touch Target Pattern

Already established in the codebase:

```typescript
// Source: Sidebar.tsx, ChatView.tsx, CodeBlock.tsx, SessionItem.tsx
className={cn(
  'p-3 md:p-1.5',                            // larger padding on mobile
  'min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0',  // 44px min on mobile, reset on desktop
  'flex items-center justify-center',          // center icon within touch area
)}
```

For CSS-only components (tool-chip, follow-up pills):
```css
/* Source: tool-chip.css */
@media (max-width: 767px) {
  .tool-chip {
    min-height: 44px;
    padding: 10px 14px;
  }
}
```

### Anti-Patterns to Avoid
- **Top-level Capacitor imports:** NEVER `import { StatusBar } from '@capacitor/status-bar'` at module level -- always dynamic import behind IS_NATIVE guard
- **setTimeout for splash dismiss:** Don't use a fixed delay. Subscribe to connection state and dismiss when ready
- **CSS transition on native keyboard:** Already handled (base.css has `html[data-native] .app-shell { transition: none }`) -- don't add new transitions that fight native animations
- **Hardcoded safe-area values:** Always use `env(safe-area-inset-*)`, never pixel values

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Status bar styling | Custom native bridge | @capacitor/status-bar | Official plugin, supports iOS since Cap 7 |
| Splash screen timing | setTimeout guesswork | @capacitor/splash-screen + store subscription | Programmatic hide tied to real app readiness |
| Overscroll prevention | JS touch event handlers | CSS `overscroll-behavior: none` | Native CSS support in Safari 16+, zero JS overhead |
| Touch target sizing | Custom component wrappers | Tailwind min-h/min-w utilities | Already proven pattern in 4+ components |

## Common Pitfalls

### Pitfall 1: StatusBar.setBackgroundColor on iOS
**What goes wrong:** Historically not supported on iOS, but Capacitor 7 added support.
**Why it matters:** The project uses Capacitor 7.6.1 -- this DOES work.
**How to avoid:** Verify the Capacitor version (confirmed ^7.6.1). If the color doesn't match exactly, it's because OKLCH-to-hex conversion is approximate.
**Warning signs:** Status bar background color looks slightly off from app background.

### Pitfall 2: Splash Screen White Flash
**What goes wrong:** If splash hides at React mount (before content renders), there's a 300-500ms white flash.
**Why it happens:** React mount != content visible. WebSocket connection + first paint takes additional time.
**How to avoid:** Hide splash on `ConnectionStore.providers.claude.status === 'connected'`, not on React mount. Set splash background color in capacitor.config.ts to match dark theme.
**Warning signs:** Brief white flash between splash and app content.

### Pitfall 3: overscroll-behavior vs WKWebView Bounce
**What goes wrong:** CSS `overscroll-behavior: none` works in Safari 16+ but WKWebView has its own bounce mechanism.
**Why it happens:** WKWebView's scrollView.bounces is a native property separate from CSS.
**How to avoid:** Capacitor already disables scrollView.bounces by default. The CSS property is belt-and-suspenders. Also add `touch-action: pan-y` on `.app-shell` to prevent horizontal rubber-band.
**Warning signs:** Page-level bounce still occurring -- check that the `<html>` and `<body>` have overflow: hidden (already set in base.css).

### Pitfall 4: Safe-Area Left/Right Missing
**What goes wrong:** Portrait mode has 0px left/right safe-area, so missing padding is invisible. But landscape or iPad may have non-zero values.
**Why it happens:** Developers test portrait-only and miss landscape/iPad edge cases.
**How to avoid:** Add `padding-left: env(safe-area-inset-left)` and `padding-right: env(safe-area-inset-right)` to AppShell even for portrait-first. It's 0px in portrait (no harm), but correct for landscape.
**Warning signs:** Content cut off by notch/edges in landscape rotation.

### Pitfall 5: Touch Target Audit Misses Dropdown Items
**What goes wrong:** Shadcn dropdown/popover/context menu items default to compact padding, making them too small on mobile.
**Why it happens:** Shadcn components are designed desktop-first.
**How to avoid:** Add mobile-specific overrides via CSS targeting `[data-radix-menu-content]` or similar selectors. Use `@media (max-width: 767px)` with `min-height: 44px` on menu items.
**Warning signs:** Dropdown items are tappable but feel cramped on iPhone.

### Pitfall 6: Zustand subscribe() Selector Signature
**What goes wrong:** Using the wrong subscribe() overload for watching specific state slices.
**Why it happens:** Zustand v5 has both `subscribe(listener)` and `subscribe(selector, listener, options)` forms.
**How to avoid:** Use the 2-argument form: `store.subscribe(selector, listener)` for watching specific slices outside React.
**Warning signs:** Callback fires on every state change, not just connection status changes.

## Code Examples

### StatusBar Configuration

```typescript
// Source: @capacitor/status-bar official docs + D-03/D-04
import type { StatusBar as StatusBarType, Style as StyleType } from '@capacitor/status-bar';

// Inside initializeNativePlugins():
const { StatusBar, Style } = await import('@capacitor/status-bar');
await StatusBar.setStyle({ style: Style.Dark }); // Light text on dark bg
await StatusBar.setBackgroundColor({ color: '#2b2521' }); // Match --surface-base
```

### SplashScreen Configuration in capacitor.config.ts

```typescript
// Source: @capacitor/splash-screen docs + D-07/D-08
plugins: {
  CapacitorHttp: { enabled: false },
  SplashScreen: {
    launchAutoHide: false,         // App controls dismiss timing
    backgroundColor: '#2b2521',     // Match dark theme (no white flash)
    launchFadeOutDuration: 0,       // Don't auto-fade; JS controls it
  },
}
```

### SplashScreen Hide on Connection Ready

```typescript
// Source: D-09/D-10/D-11
import { useConnectionStore } from '@/stores/connection';

let splashModule: typeof import('@capacitor/splash-screen') | null = null;

export function hideSplashWhenReady(): void {
  if (!IS_NATIVE || !splashModule) return;

  let dismissed = false;
  const dismiss = () => {
    if (dismissed) return;
    dismissed = true;
    splashModule?.SplashScreen.hide({ fadeOutDuration: 300 });
    unsubscribe();
    clearTimeout(fallbackTimer);
  };

  const unsubscribe = useConnectionStore.subscribe(
    (state) => state.providers.claude.status,
    (status) => {
      if (status === 'connected') dismiss();
    },
  );

  const fallbackTimer = setTimeout(dismiss, 3000);
}
```

### Overscroll Prevention CSS

```css
/* Source: D-18/D-19/D-20 -- add to base.css */
html {
  overscroll-behavior: none;     /* Prevent page-level bounce */
}

body {
  overscroll-behavior: none;
}

.app-shell {
  touch-action: pan-y;           /* Allow vertical scroll, prevent horizontal rubber-band */
}
```

### Color Derivation

The `--surface-base` token is `oklch(0.20 0.010 32)`. The existing `theme-color` meta tag uses `#2b2521`. For consistency with the existing meta tag and to avoid perceptual mismatch between OKLCH rendering and hex approximation:

**Recommendation:** Use `#2b2521` (the existing theme-color) for both StatusBar.setBackgroundColor and SplashScreen.backgroundColor. This matches the meta tag already in index.html and is close enough to the OKLCH value that the human eye won't notice any difference.

## Touch Target Audit

### Components Already Compliant (44px+ at mobile)

| Component | File | Pattern |
|-----------|------|---------|
| Sidebar collapse/expand | Sidebar.tsx | `min-h-[44px] min-w-[44px]` |
| Sidebar close (X) | Sidebar.tsx | `min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0` |
| Sidebar settings button | Sidebar.tsx | `min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0` |
| Session items | SessionItem.tsx | `min-h-[44px] md:min-h-0` |
| Thinking toggle | ChatView.tsx | `min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0` |
| Search toggle | ChatView.tsx | `min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0` |
| Export toggle | ChatView.tsx | `min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0` |
| CodeBlock copy button | CodeBlock.tsx | `min-h-[44px] md:min-h-0` |
| Send button | ChatComposer.tsx | `h-11 w-11 md:h-8 md:w-8` (44px) |
| Stop button | ChatComposer.tsx | `h-11 w-11 md:h-8 md:w-8` (44px) |
| Tool chips | tool-chip.css | `min-height: 44px` at mobile media query |
| Mention chip remove | composer.css | `min-width: 28px, min-height: 28px` -- **UNDER 44px** |

### Components Needing Touch Target Fixes

| Component | File | Current Size | Fix |
|-----------|------|-------------|-----|
| NewChatButton | NewChatButton.tsx | `py-2` (~32px height) | Add `min-h-[44px]` at mobile |
| SearchBar close button | SearchBar.tsx | `p-0.5` (~20px) | Add `min-h-[44px] min-w-[44px]` pattern at mobile |
| Follow-up pills | FollowUpPills.tsx | `py-1.5` (~32px) | Add `min-h-[44px]` at mobile via CSS |
| ModelSelector trigger | model-selector.css | `padding: 2px 6px` (~24px) | Add mobile min-height in CSS |
| ModelSelector options | model-selector.css | `padding: 6px 8px` (~32px) | Add `min-height: 44px` at mobile media query |
| QuickSettingsPanel trigger | QuickSettingsPanel.tsx | `p-2` (~32px) | Add `min-h-[44px] min-w-[44px]` pattern at mobile |
| Export dropdown items | ChatView.tsx | `py-3 md:py-1.5` (~48px mobile, OK) | Already has mobile padding -- verify |
| Mention chip remove | composer.css | 28px | Increase to 44px at mobile |
| MentionPicker items | MentionPicker.tsx | Standard padding | Verify and add min-height |
| SlashCommandPicker items | SlashCommandPicker.tsx | Standard padding | Verify and add min-height |
| PermissionBanner buttons | PermissionBanner.tsx | Needs audit | Verify Allow/Deny button sizing |
| Shadcn popover/dropdown items | Various | Desktop-first sizing | Add mobile overrides via CSS |

### Safe-Area Current State

| Edge | Current Support | Location |
|------|----------------|----------|
| Top | Partial | `base.css` (`.app-shell padding-top`), `Sidebar.tsx` header (`max(1rem, env(safe-area-inset-top))`) |
| Bottom | Good | `composer.css` (`max(env(safe-area-inset-bottom), var(--keyboard-offset))`), `Sidebar.tsx` footer |
| Left | MISSING | No `env(safe-area-inset-left)` in AppShell or base.css |
| Right | MISSING | No `env(safe-area-inset-right)` in AppShell or base.css |

### viewport-fit=cover Status
**VERIFIED:** Already present in `src/index.html`:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| StatusBar.setBackgroundColor Android-only | Supported on iOS too | Capacitor 7.0 (2025-01) | Can set status bar bg color on iOS |
| JS touch handlers for overscroll | CSS overscroll-behavior: none | Safari 16 (2022-09) | Zero-JS overscroll prevention |
| Fixed splash timeout | Programmatic hide on app ready | Standard pattern | Better UX, no guessing |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 |
| Config file | `src/vite.config.ts` (inline vitest config) |
| Quick run command | `cd src && npx vitest run --reporter=dot` |
| Full suite command | `cd src && npx vitest run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| NATIVE-01 | StatusBar init calls setStyle(Dark) + setBackgroundColor | unit | `cd src && npx vitest run src/lib/native-plugins.test.ts -x` | Needs update |
| NATIVE-02 | SplashScreen hides on connection ready with fadeOut | unit | `cd src && npx vitest run src/lib/native-plugins.test.ts -x` | Needs update |
| NATIVE-04 | Dynamic imports behind IS_NATIVE guard | unit | `cd src && npx vitest run src/lib/native-plugins.test.ts -x` | Exists (extend) |
| TOUCH-01 | 44px touch targets at mobile | manual-only | N/A | Manual: verify in browser devtools responsive mode |
| TOUCH-02 | Safe-area on all four edges | manual-only | N/A | Manual: device testing |
| TOUCH-03 | No page-level overscroll bounce | manual-only | N/A | Manual: device testing |
| TOUCH-04 | Back gesture vs sidebar conflict | manual-only | N/A | Manual: device testing |
| TOUCH-05 | Send/stop in thumb zone | manual-only | N/A | Manual: visual verification |

### Sampling Rate
- **Per task commit:** `cd src && npx vitest run --reporter=dot`
- **Per wave merge:** `cd src && npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] Update `src/src/lib/native-plugins.test.ts` -- add test cases for StatusBar and SplashScreen init
- [ ] Add test for `hideSplashWhenReady()` -- mock ConnectionStore subscription + fallback timer

## Open Questions

1. **Exact hex color for StatusBar background**
   - What we know: `--surface-base` is `oklch(0.20 0.010 32)`, which converts to approximately `#1a1413`. The existing `theme-color` meta tag uses `#2b2521`.
   - Recommendation: Use `#2b2521` for consistency with the existing meta tag. The slight mismatch with OKLCH is imperceptible. The implementer can refine with a hex color picker if needed.

2. **Shadcn component touch target overrides**
   - What we know: Shadcn uses Radix UI primitives with `data-radix-*` attributes on rendered elements.
   - Recommendation: Add a mobile CSS block in base.css targeting `[data-radix-menu-content] [role="menuitem"]` and similar selectors with `min-height: 44px`. This avoids forking shadcn components.

3. **Solid color vs image splash screen**
   - Recommendation: Solid color (`#2b2521`). No image asset management needed, matches exactly, and the Capacitor iOS storyboard splash will use this color as background. A logo image is deferred to Phase 63 bundled assets if desired.

## Sources

### Primary (HIGH confidence)
- Capacitor StatusBar API docs: https://capacitorjs.com/docs/apis/status-bar
- Capacitor SplashScreen API docs: https://capacitorjs.com/docs/apis/splash-screen
- Capacitor 7.0 Upgrade Guide (confirms iOS setBackgroundColor support): https://capacitorjs.com/docs/updating/7-0
- npm registry: `@capacitor/status-bar@7.0.6`, `@capacitor/splash-screen@7.0.5` (verified 2026-03-28)
- CSS overscroll-behavior support: https://caniuse.com/css-overscroll-behavior (Safari 16+ = full support)
- Existing codebase: native-plugins.ts, base.css, Sidebar.tsx, ChatView.tsx, CodeBlock.tsx, SessionItem.tsx, composer.css, tool-chip.css

### Secondary (MEDIUM confidence)
- Capacitor WKWebView bounce behavior: scrollView.bounces disabled by default in CAPBridgeViewController (GitHub issue #5907)

### Tertiary (LOW confidence)
- None -- all findings verified against official docs or codebase inspection

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official Capacitor plugins, versions verified against npm registry, Capacitor 7 compatibility confirmed
- Architecture: HIGH - Extending established patterns from Phase 60 (native-plugins.ts), no new architectural decisions needed
- Pitfalls: HIGH - Verified against official docs (StatusBar iOS support confirmed in Cap 7), overscroll-behavior support confirmed for target platform (iOS 16+)

**Research date:** 2026-03-28
**Valid until:** 2026-04-28 (stable -- Capacitor plugin APIs don't change within minor versions)
