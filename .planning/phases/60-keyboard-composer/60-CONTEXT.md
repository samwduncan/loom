# Phase 60: Keyboard & Composer - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning
**Mode:** Auto-resolved (--auto flag, all gray areas auto-selected and resolved with recommended defaults)

<domain>
## Phase Boundary

Replace the fragile `visualViewport` hack in ChatComposer.tsx with Capacitor Keyboard plugin events for reliable iOS keyboard avoidance. The existing CSS `--keyboard-offset` pattern is correct and stays -- only the signal source changes. Web behavior must remain identical.

**This phase delivers:**
- Capacitor Keyboard plugin integration via platform-aware abstraction
- Smooth keyboard avoidance on iOS with native event timing
- Smart scroll coordination (keyboard-aware auto-scroll respects user position)
- Web fallback preserved (visualViewport hack stays for non-Capacitor environments)

**This phase does NOT deliver:**
- Touch target sizing (Phase 61)
- Haptic feedback (Phase 62)
- Status bar / splash screen configuration (Phase 61)

</domain>

<decisions>
## Implementation Decisions

### Plugin Architecture
- **D-01:** Create `src/src/lib/native-plugins.ts` -- module-level initialization for Capacitor plugins, called before React mounts (same pattern as `initializeWebSocket()` in `websocket-init.ts`)
- **D-02:** Create `useKeyboardOffset()` hook -- platform-aware abstraction that internally branches: Capacitor Keyboard events on native, visualViewport fallback on web
- **D-03:** Dynamic import `@capacitor/keyboard` inside `native-plugins.ts` -- tree-shaken from web builds, no bundle impact
- **D-04:** If Capacitor Keyboard plugin fails to load, log the error and fall back to visualViewport silently -- no user-facing failure
- **D-05:** ChatComposer.tsx removes its inline visualViewport effect (lines 213-251) and calls `useKeyboardOffset()` instead -- platform-unaware

### Animation Strategy
- **D-06:** On native: set `--keyboard-offset` directly from `keyboardWillShow` event height with NO CSS transition -- iOS drives the animation natively, adding a CSS transition on top creates double-animation / visual lag
- **D-07:** On web: keep current 100ms ease-out CSS transition on `--keyboard-offset` -- visualViewport fires discrete resize events, transition smooths the steps
- **D-08:** CSS transition property on `.app-shell` padding-bottom should be conditional: remove on native (set `transition: none` or remove the property), keep on web
- **D-09:** Investigate Capacitor Keyboard event's exposed `duration` parameter during research -- if available, can refine timing. But default approach is passthrough (no CSS transition on native).

### Dual-Mode Strategy
- **D-10:** All IS_NATIVE branching for keyboard confined to `useKeyboardOffset()` hook and `native-plugins.ts` -- nowhere else
- **D-11:** ChatComposer.tsx and composer.css remain fully platform-unaware -- they consume `--keyboard-offset` without knowing where it comes from
- **D-12:** The existing visualViewport code from ChatComposer.tsx moves into `useKeyboardOffset()` as the web fallback path -- not duplicated, just relocated
- **D-13:** `window.scrollTo(0, 0)` anti-scroll behavior from current hack also moves into the hook -- native path may not need it if WKWebView resize mode is `none`

### Scroll Behavior on Keyboard Open
- **D-14:** Auto-scroll to latest message ONLY if `useScrollAnchor.isAtBottom` was true before keyboard opened -- preserves reading position when user scrolled up
- **D-15:** Coordinate with `useScrollAnchor` by checking `isAtBottom` state before keyboard animation, then triggering `scrollToBottom()` if appropriate
- **D-16:** When keyboard closes, do NOT auto-scroll -- just let the content expand back naturally

### Capacitor Keyboard Configuration
- **D-17:** Set `Keyboard.setResizeMode({ mode: KeyboardResize.None })` during native-plugins init -- WKWebView must not auto-resize viewport (KEY-05)
- **D-18:** Set `Keyboard.setAccessoryBarVisible({ isVisible: true })` -- show the standard iOS input accessory bar (Done button)
- **D-19:** Listen to `keyboardWillShow` (not `keyboardDidShow`) for pre-animation offset, and `keyboardWillHide` for dismiss

### Safe Area Coordination
- **D-20:** On keyboard open: `--keyboard-offset` replaces safe-area-inset-bottom (keyboard covers the home indicator area) -- don't stack both
- **D-21:** On keyboard close: `--keyboard-offset` returns to 0, safe-area-inset-bottom takes over naturally via CSS `calc()` in composer.css
- **D-22:** Test on notched devices (iPhone 16 Pro Max) -- safe area + keyboard must not cause a layout jump during transition

### Claude's Discretion
- Internal structure of `useKeyboardOffset()` hook (useEffect vs useLayoutEffect, cleanup patterns)
- Whether to add the keyboard offset to Zustand UI store vs keep as DOM-only CSS variable
- Unit test structure for the hook (mock Capacitor vs integration)
- JSDoc depth on native-plugins.ts
- Whether `handleScroll` anti-bounce from current hack is needed on native with resize mode `none`

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Requirements
- `.planning/ROADMAP.md` SS Phase 60 -- Success criteria (KEY-01 through KEY-05)
- `.planning/REQUIREMENTS.md` SS Keyboard & Composer -- KEY-01 through KEY-05 acceptance criteria

### Architecture Conventions
- `.planning/V2_CONSTITUTION.md` -- Named exports (2.2), selector-only store access (4.2), cn() utility (3.6)
- `.planning/STATE.md` SS Decisions -- v2.1 architectural decisions (CSS-first motion, platform-unaware components)

### Files to Modify
- `src/src/components/chat/composer/ChatComposer.tsx` -- Remove visualViewport effect (lines 213-251), integrate useKeyboardOffset()
- `src/src/styles/base.css` -- Conditional CSS transition on .app-shell padding-bottom (lines 138-146)
- `src/src/components/chat/composer/composer.css` -- Safe area + keyboard offset interaction (lines 212-225)

### Files to Create
- `src/src/lib/native-plugins.ts` -- Capacitor plugin initialization module
- `src/src/hooks/useKeyboardOffset.ts` -- Platform-aware keyboard offset hook

### Files to Reference
- `src/src/lib/platform.ts` -- IS_NATIVE flag, platform detection (Phase 59)
- `src/src/hooks/useScrollAnchor.ts` -- isAtBottom state for scroll coordination
- `src/src/lib/websocket-init.ts` -- Pattern for module-level init before React mounts
- `src/capacitor.config.ts` -- Capacitor configuration (CapacitorHttp disabled)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `platform.ts` IS_NATIVE flag -- ready to use for keyboard branching
- `useScrollAnchor.ts` isAtBottom + scrollToBottom() -- ready for keyboard-scroll coordination
- `websocket-init.ts` pattern -- module-level init before React, same pattern for native-plugins.ts
- `--keyboard-offset` CSS variable -- already wired into .app-shell and .composer-safe-area

### Established Patterns
- Zustand stores for reactive UI state (could store keyboard height if needed)
- Module-scoped singletons (wsClient pattern -- same for Keyboard plugin instance)
- Constitution 2.2: named exports only
- Constitution 4.2: selector-only store access in components

### Integration Points
- `src/src/main.tsx` line 9: `void initializeWebSocket()` -- native-plugins init should run at same level
- ChatComposer.tsx useEffect at line 216 -- replaced by useKeyboardOffset() call
- base.css .app-shell padding-bottom at line 143 -- transition behavior changes
- composer.css .composer-safe-area at line 215 -- safe area stacking logic

</code_context>

<specifics>
## Specific Ideas

- The visualViewport hack currently works on web and partially on iOS -- we're replacing the iOS path with native events, keeping the web path as-is
- `window.scrollTo(0, 0)` hack in current code prevents iOS WKWebView from translating the viewport on focus -- may not be needed once resize mode is `none`, but keep as safety net initially
- Capacitor Keyboard plugin is a peer dependency of @capacitor/core -- must use version compatible with Capacitor 7.6.1
- `keyboardWillShow` event provides `keyboardHeight` directly -- no need to calculate from viewport difference

</specifics>

<quality_bar>
## Quality Bar (Bard Assessment)

**Good (meets requirements):** Keyboard height set via Capacitor events, composer slides, message scrolls, resize mode none.

**World-class (what to aim for):**
- **Animation matching:** Keyboard slide on native is indistinguishable from a native iOS app -- no visible lag between keyboard motion and composer position. Achieved by NOT adding CSS transition on native (let iOS drive it).
- **Smart scroll coordination:** Keyboard opening respects user scroll position. At bottom = scroll to latest. Scrolled up = preserve position. Single coherent system using existing useScrollAnchor.isAtBottom state.
- **Safe area + keyboard coherence:** On notched devices, the composer transitions between safe-area-only (keyboard closed) and keyboard-offset-only (keyboard open) without any jump or double-padding.
- **Platform abstraction:** IS_NATIVE checks confined to useKeyboardOffset() and native-plugins.ts. ChatComposer is 100% platform-unaware -- you could swap the implementation without touching it.
- **Error resilience:** Capacitor Keyboard plugin load failure gracefully falls back to visualViewport with a logged warning. User never sees breakage.
- **Test coverage:** useKeyboardOffset() tested with mocked Capacitor events (native path) and mocked visualViewport (web path). Integration verified on real iPhone 16 Pro Max.

**Key risk:** Animation lag from CSS transition + native event timing. Mitigation: disable CSS transition on native, passthrough native event height directly.

</quality_bar>

<deferred>
## Deferred Ideas

- Zustand atom for keyboard height (could improve reactivity across components) -- evaluate after basic hook approach ships
- Haptic feedback on keyboard open/close -- Phase 62 scope
- Android keyboard handling differences -- future if Android Capacitor target added
- ESLint rule preventing visualViewport access outside useKeyboardOffset -- nice but not essential

</deferred>

---

*Phase: 60-keyboard-composer*
*Context gathered: 2026-03-28*
