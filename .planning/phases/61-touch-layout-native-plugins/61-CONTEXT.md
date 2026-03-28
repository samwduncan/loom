# Phase 61: Touch, Layout & Native Plugins - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning
**Mode:** Auto-resolved (--auto flag, all gray areas auto-selected and resolved with recommended defaults)

<domain>
## Phase Boundary

The app looks and feels right on iOS -- proper status bar, smooth launch, correct touch targets, and no layout quirks. Integrates StatusBar and SplashScreen Capacitor plugins, audits all interactive elements for 44px+ touch targets, prevents rubber-band overscroll, and resolves iOS back gesture vs sidebar drawer conflict.

**This phase delivers:**
- StatusBar plugin: light text on dark background, matching app theme
- SplashScreen plugin: color-matched splash that hides after app is interactive (not on React mount)
- Comprehensive touch target audit (44px+ on all interactive elements at mobile breakpoint)
- Rubber-band overscroll prevention at app shell level
- iOS back gesture / sidebar drawer conflict resolution
- Safe-area inset audit for all four edges
- Primary action thumb-zone positioning verification

**This phase does NOT deliver:**
- Haptic feedback (Phase 62 -- NATIVE-03)
- 120Hz spring tuning (Phase 62 -- MOTION-01/02/03)
- Bundled asset pipeline (Phase 63)

**Note:** ROADMAP.md lists NATIVE-03 under Phase 61 requirements, but REQUIREMENTS.md traceability correctly maps it to Phase 62. Phase 61 success criteria do not include haptics. Follow REQUIREMENTS.md.

</domain>

<decisions>
## Implementation Decisions

### StatusBar Plugin
- **D-01:** Add `@capacitor/status-bar` as devDependency (matching @capacitor/keyboard pattern -- ^7.x for Capacitor 7.6.1 compat)
- **D-02:** Extend `native-plugins.ts` with `initializeStatusBar()` -- called alongside keyboard init, NOT in a separate module
- **D-03:** Set `StatusBarStyle.Dark` (light text on dark bg) to match the dark-theme app surface
- **D-04:** Set `StatusBar.setBackgroundColor()` to match `--surface-base` OKLCH value (converted to hex for the plugin API)
- **D-05:** StatusBar config runs in `initializeNativePlugins()` -- single init site in main.tsx, consistent with Phase 60 pattern

### SplashScreen Plugin
- **D-06:** Add `@capacitor/splash-screen` as devDependency (^7.x)
- **D-07:** Disable auto-hide in capacitor.config.ts (`SplashScreen: { launchAutoHide: false }`) -- app controls dismiss timing
- **D-08:** Set splash background color to match app surface-base (dark theme) in capacitor.config.ts -- prevents white flash
- **D-09:** Hide splash on connection ready: listen for ConnectionStore `connected` state, then call `SplashScreen.hide({ fadeOutDuration: 300 })` -- ensures users see content, not blank screen
- **D-10:** Fallback timeout: if connection doesn't establish within 3 seconds, hide splash anyway (user should see error state, not stuck splash)
- **D-11:** Splash hide logic goes in `native-plugins.ts` as `hideSplashWhenReady()` -- called from main.tsx after React mounts

### Touch Target Audit
- **D-12:** Comprehensive audit of ALL interactive elements, not just chat -- TOUCH-01 requires "all interactive elements"
- **D-13:** Priority order: chat interface (MessageList buttons, composer, CodeBlock) → sidebar → settings/modals → command palette → editor/terminal
- **D-14:** Pattern: `min-h-[44px] min-w-[44px]` at mobile, `md:min-h-0 md:min-w-0` at desktop -- matches established codebase pattern (Sidebar.tsx, ChatView.tsx)
- **D-15:** Keep `md:` (767px) breakpoint as mobile/desktop threshold -- matches existing codebase convention, do NOT change to 1024px
- **D-16:** Dropdown/context menu items get `min-h-[44px]` at mobile via CSS (shadcn components may need targeted overrides)
- **D-17:** ToolChip already has `min-height: 44px` in tool-chip.css -- verify, don't duplicate

### Overscroll Prevention
- **D-18:** Add `overscroll-behavior: none` on `html` and `body` in base.css -- CSS-level prevention
- **D-19:** Add `touch-action: pan-y` on `.app-shell` -- prevents horizontal rubber-band on iOS WebView
- **D-20:** Scrollable children (MessageList, sidebar session list, file tree) keep `touch-action: auto` or `pan-y` to allow normal scrolling
- **D-21:** Test: scroll past top/bottom of message list should NOT cause page-level bounce

### iOS Back Gesture vs Sidebar
- **D-22:** When sidebar is CLOSED: iOS back gesture works normally (no sidebar element to intercept)
- **D-23:** When sidebar is OPEN: sidebar's existing swipe-to-close gesture handles left-edge swipes naturally -- user swipes left to close sidebar, which is the expected behavior
- **D-24:** Do NOT disable iOS back gesture globally (users expect it for navigation)
- **D-25:** If conflict detected during device testing: add `touch-action: pan-x` on sidebar backdrop to let sidebar handle horizontal swipes

### Safe-Area Insets
- **D-26:** Verify `viewport-fit=cover` in index.html meta viewport tag -- required for env(safe-area-inset-*) to work
- **D-27:** Audit all four edges:
  - Top: status bar area (already handled in Sidebar.tsx header and base.css)
  - Bottom: home indicator (already handled in composer.css and Sidebar.tsx footer)
  - Left/Right: usually 0 on iPhone portrait, but audit for landscape/iPad
- **D-28:** Add `padding-left: env(safe-area-inset-left)` and `padding-right: env(safe-area-inset-right)` to AppShell grid if not present -- inherits to children
- **D-29:** Focus on portrait-first (iPhone 16 Pro Max primary target) -- landscape is nice-to-have

### Thumb Zone
- **D-30:** Verify send button and stop button are within bottom-third thumb zone -- they should be already (composer is at bottom)
- **D-31:** No repositioning needed if composer is at screen bottom -- just verify, don't over-engineer

### Claude's Discretion
- Exact hex color values for StatusBar background (derive from OKLCH tokens)
- Whether to add visual regression tests or rely on manual device testing
- CSS specificity strategy for shadcn component touch target overrides
- Whether splash screen uses a custom image or solid color background (solid color is simpler and avoids asset management)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Platform Layer
- `src/src/lib/platform.ts` -- IS_NATIVE, API_BASE, resolveApiUrl(), resolveWsUrl()
- `src/src/lib/native-plugins.ts` -- Existing Keyboard plugin init, nativePluginsReady promise, data-native attribute
- `src/capacitor.config.ts` -- Capacitor app config, plugin settings

### Existing Touch Target Patterns
- `src/src/components/sidebar/Sidebar.tsx` -- min-h-[44px] pattern, swipe-to-close gesture, safe-area usage
- `src/src/components/sidebar/SessionItem.tsx` -- min-h-[44px] on session items
- `src/src/components/chat/view/ChatView.tsx` -- min-h-[44px] on chat action buttons
- `src/src/components/chat/view/CodeBlock.tsx` -- min-h-[44px] on copy button
- `src/src/components/chat/tools/tool-chip.css` -- min-height: 44px on tool chips

### CSS Architecture
- `src/src/styles/base.css` -- Font loading, keyboard offset var, html/body overflow, safe-area-inset-top
- `src/src/components/chat/composer/composer.css` -- composer-safe-area, keyboard offset integration
- `src/src/components/app-shell/AppShell.tsx` -- h-dvh + overflow-hidden grid layout

### Prior Phase Context
- `.planning/phases/59-platform-foundation/59-CONTEXT.md` -- Platform detection decisions
- `.planning/phases/60-keyboard-composer/60-CONTEXT.md` -- Keyboard plugin architecture, CSS-first motion strategy

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `native-plugins.ts` -- Extend with StatusBar/SplashScreen init (same pattern: dynamic import behind IS_NATIVE guard)
- `min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0` -- Established touch target pattern used in 5+ components
- `data-native` HTML attribute -- CSS conditional styling (set in native-plugins.ts)
- `nativePluginsReady` promise -- Downstream code awaits before using native APIs

### Established Patterns
- Dynamic imports for Capacitor plugins (tree-shaken from web)
- `IS_NATIVE` guard from platform.ts -- never import Capacitor modules at top level
- Safe-area via `env(safe-area-inset-*)` in CSS with `max()` for stacking (Phase 60 established this)
- `md:` (767px) breakpoint for mobile/desktop threshold

### Integration Points
- `main.tsx` -- calls `initializeNativePlugins()` before React mount
- `base.css` -- global style resets, safe-area support block
- `AppShell.tsx` -- root grid layout, overflow control
- `ConnectionStore` (Zustand) -- `connected` state for splash screen dismiss timing

</code_context>

<specifics>
## Specific Ideas

No specific requirements beyond what's in the success criteria and requirements. Standard Capacitor plugin integration patterns apply.

</specifics>

<quality_bar>
## Quality Bar (Bard Assessment)

**Good:** Touch targets pass WCAG AAA on mobile. Splash screen doesn't flash. Status bar matches theme.

**Exceptional (world-class):**
- Touch targets are gesture-aware: 44px for tap, clear visual affordance that makes the touch zone obvious
- Gesture conflicts resolved systematically with documented rationale in code comments
- Safe-area handling is complete on all four edges with viewport-fit=cover
- Splash screen behavior is pixel-perfect: matches exact app background color, fades out over 300ms, no white flicker
- Overscroll is disabled at page level but internal scroll regions work smoothly
- Non-technical user can grab an iPhone, open the app, send a message, and notice nothing wrong

**Risk flags from Bard:**
- Overscroll prevention: `overscroll-behavior: contain` alone doesn't work on iOS WebView -- need `touch-action` strategy
- Splash screen: hiding at React mount causes 300-500ms white flash before hydration completes
- Safe-area left/right edges are currently untouched -- needed for landscape/iPad

</quality_bar>

<deferred>
## Deferred Ideas

- Full responsive audit across all breakpoints (v2.3 "The Polish")
- VoiceOver/screen reader verification on device (can be done during Phase 63 device validation)
- Landscape-specific layout optimizations (portrait-first for v2.1)

</deferred>

---

*Phase: 61-touch-layout-native-plugins*
*Context gathered: 2026-03-28*
