# Phase 62: Haptics & Motion - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning
**Mode:** Auto-resolved (--auto flag, Bard consultation initiated)

<domain>
## Phase Boundary

Add haptic feedback to key interactions and tune spring animations for 120Hz ProMotion displays. Haptics fire on message send, tool completion, and errors. Spring/transition configs get ProMotion-aware variants. Info.plist opts into 120Hz rendering. All haptic feedback degrades silently on web (no errors, just no-ops).

</domain>

<decisions>
## Implementation Decisions

### Haptic Feedback Mapping
- **D-01:** Message send (user taps send button) -> Impact feedback, medium style -- confirms the action was registered
- **D-02:** Tool call completion (success) -> Notification feedback, success type -- signals task finished
- **D-03:** Error state (tool failure, connection error) -> Notification feedback, error type -- draws attention
- **D-04:** Selection/toggle changes (settings toggles, model selector) -> Selection feedback -- subtle tick for state change
- **D-05:** Do NOT add haptics to: scrolling, message appearance, sidebar open/close, or keyboard show/hide -- these are continuous/frequent events where haptics would be annoying
- **D-06:** Haptic calls are fire-and-forget (no await) -- haptics should never block UI interaction

### Haptics Architecture
- **D-07:** Create new `src/src/lib/haptics.ts` module -- separate from `native-plugins.ts` because haptics is a runtime API called per-interaction, not init-time config
- **D-08:** `native-plugins.ts` handles the Capacitor Haptics plugin dynamic import and init (following SS-7 per-plugin try/catch pattern)
- **D-09:** `haptics.ts` exports typed functions: `hapticImpact(style)`, `hapticNotification(type)`, `hapticSelection()` -- each is a silent no-op on web or if plugin failed to load
- **D-10:** All haptic functions check `prefersReducedMotion()` from `motion.ts` before firing -- accessibility requirement (SC-3)
- **D-11:** Add `@capacitor/haptics@^7.0.5` as devDependency (matching existing Capacitor 7.6.1 pattern from Phase 60)
- **D-12:** UI components call haptics functions directly (e.g., `hapticImpact('medium')`) -- no event bus or middleware indirection

### Haptic Integration Points
- **D-13:** `ChatComposer.tsx` — call `hapticImpact('medium')` in the send handler (alongside existing send logic)
- **D-14:** `ToolChip.tsx` or `ToolCallGroup.tsx` — call `hapticNotification('success')` when tool state transitions to 'result'
- **D-15:** Error boundary / connection error handler — call `hapticNotification('error')` on error state
- **D-16:** Settings toggles / model selector — call `hapticSelection()` on value change

### ProMotion Opt-In
- **D-17:** Add `CADisableMinimumFrameDurationOnPhone = true` to Info.plist -- required for WKWebView to render at 120Hz (MOTION-03)
- **D-18:** This is a build-time configuration, not runtime -- without it, iOS caps WKWebView at 60Hz even on ProMotion hardware

### ProMotion Detection & Spring Tuning
- **D-19:** Runtime detection NOT needed for CSS animations -- once Info.plist opts in, CSS transitions/animations automatically run at 120Hz (the browser handles frame scheduling)
- **D-20:** Physics-based springs (stiffness/damping/mass) are inherently frame-rate independent -- the math resolves the same curve regardless of frame rate. More frames = smoother rendering of the SAME curve, not a different curve.
- **D-21:** The existing spring configs in `motion.ts` (SPRING_GENTLE, SPRING_SNAPPY, SPRING_BOUNCY) do NOT need separate 120Hz variants. The `linear()` CSS easings in tokens.css already encode the full curve at 64 samples -- sufficient for both 60Hz and 120Hz.
- **D-22:** Spring tuning focus: reduce overshoot and settling time for a snappier feel. Increase damping by ~15-20% on SPRING_SNAPPY and SPRING_BOUNCY for tighter animations that feel more precise on ProMotion displays.
- **D-23:** Regenerate `linear()` CSS tokens after spring config changes (existing `scripts/generate-spring-tokens.mjs` handles this)
- **D-24:** Duration tokens (--duration-fast, --duration-normal, etc.) stay unchanged -- these are perception-based, not physics-based

### Reduced Motion & Web Graceful Degradation
- **D-25:** Haptic functions are silent no-ops when: (a) not IS_NATIVE, (b) plugin failed to load, (c) prefersReducedMotion() returns true
- **D-26:** No runtime errors on web -- the haptics module must be safe to import and call in any environment
- **D-27:** Existing `@media (prefers-reduced-motion: reduce)` in base.css already handles CSS animation disabling -- no changes needed there

### Claude's Discretion
- Exact damping values for tuned springs (within ~15-20% increase guideline)
- Whether to add haptics to any additional interactions beyond the 4 mapped above (if naturally discovered during implementation)
- Internal structure of haptics.ts (single function with type param vs separate exported functions)
- Whether to expose a `getHapticsModule()` accessor like `getKeyboardModule()` or keep it internal to haptics.ts

</decisions>

<specifics>
## Specific Ideas

- Haptics should feel like Apple's stock apps (Messages, Mail) -- not excessive, not flashy, just confirming
- The "snappier" spring feel on 120Hz should be subtle -- users shouldn't consciously notice the difference, it should just feel "right"
- ProMotion opt-in is the single highest-value change in this phase -- everything else benefits from 120Hz rendering even without spring retuning

</specifics>

<canonical_refs>
## Canonical References

### Motion system
- `src/src/lib/motion.ts` -- SpringConfig interface, 3 spring presets, prefersReducedMotion()
- `src/src/styles/tokens.css` lines 82-103 -- CSS spring linear() easings and duration tokens
- `scripts/generate-spring-tokens.mjs` -- Regenerates linear() CSS from motion.ts spring configs

### Native plugin architecture
- `src/src/lib/native-plugins.ts` -- Capacitor plugin init pattern (SS-7 isolation, dynamic imports)
- `src/src/lib/platform.ts` -- IS_NATIVE detection, platform-aware URL resolution
- `src/capacitor.config.ts` -- Capacitor build config, plugins section

### Accessibility
- `src/src/styles/base.css` lines 79-87 -- Global prefers-reduced-motion override
- `src/src/tests/a11y-reduced-motion.test.tsx` -- Existing reduced-motion test patterns

### Requirements
- `.planning/REQUIREMENTS.md` -- MOTION-01, MOTION-02, MOTION-03, NATIVE-03

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `motion.ts` `prefersReducedMotion()` -- already handles reduced-motion check for JS-driven animations
- `native-plugins.ts` pattern -- try/catch per-plugin, `nativePluginsReady` promise, `getKeyboardModule()` accessor
- `generate-spring-tokens.mjs` -- existing script to regenerate CSS `linear()` from spring configs

### Established Patterns
- Capacitor plugins as devDependencies with dynamic imports behind `IS_NATIVE` guard (zero web bundle impact)
- Per-plugin try/catch isolation (SS-7) -- one plugin failure doesn't crash others
- CSS-first motion strategy -- CSS transitions at native refresh rate, rAF capped at 60fps in WKWebView
- `data-native` attribute on `<html>` for CSS-only native vs web branching

### Integration Points
- `ChatComposer.tsx` send handler -- insert haptic call
- Tool state machine (ToolChip/ToolCallGroup) -- insert haptic on success transition
- Connection store error handling -- insert haptic on error
- Settings components -- insert haptic on toggle/select
- `native-plugins.ts` initializeNativePlugins() -- add Haptics plugin import
- `ios/App/App/Info.plist` -- add CADisableMinimumFrameDurationOnPhone key

</code_context>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope.

</deferred>

---

*Phase: 62-haptics-motion*
*Context gathered: 2026-03-28*
