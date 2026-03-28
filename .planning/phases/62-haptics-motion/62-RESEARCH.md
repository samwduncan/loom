# Phase 62: Haptics & Motion - Research

**Researched:** 2026-03-28
**Domain:** Capacitor Haptics plugin, iOS ProMotion 120Hz, CSS spring physics
**Confidence:** HIGH

## Summary

Phase 62 adds haptic feedback to four key interactions (message send, tool completion, error, selection/toggle) and tunes spring animations for ProMotion displays. The Capacitor Haptics plugin (`@capacitor/haptics@7.0.5`) provides the haptic API with three feedback types: Impact (configurable weight), Notification (success/warning/error), and Selection (subtle tick). The architecture follows the established `native-plugins.ts` pattern: dynamic import behind `IS_NATIVE` guard, per-plugin try/catch isolation (SS-7), with a separate `haptics.ts` module exporting fire-and-forget wrapper functions that are silent no-ops on web or when reduced motion is preferred.

For ProMotion, the single highest-value change is adding `CADisableMinimumFrameDurationOnPhone = true` to Info.plist. This enables Core Animation to render at 120Hz. **Critical nuance:** only compositor-driven CSS animations (those using `transform`, `opacity`, `filter`) run at 120Hz in WKWebView. Non-compositor properties (`grid-template-rows`, `grid-template-columns`) remain at 60Hz because they're main-thread-driven. `requestAnimationFrame` is also capped at 60fps in WKWebView (this is a WebKit limitation, not something `CADisableMinimumFrameDurationOnPhone` fixes). The project's existing CSS-first motion strategy is the correct approach -- the spring `linear()` easings applied to `transform`/`opacity` transitions will benefit from 120Hz immediately after the Info.plist change.

Spring tuning (D-22) increases damping ~15-20% on SPRING_SNAPPY and SPRING_BOUNCY to reduce overshoot and settling time, then regenerates the `linear()` CSS tokens via the existing `generate-spring-tokens.mjs` script. The physics are frame-rate independent (more frames = smoother same-curve, not a different curve), so separate 120Hz variants are unnecessary.

**Primary recommendation:** Three plans -- (1) Haptics module + native plugin init, (2) haptic integration points in UI components + spring retuning, (3) Info.plist ProMotion opt-in + tests. The Info.plist change is trivially small but has the broadest impact.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01 through D-06: Haptic feedback mapping (send=Impact/medium, tool complete=Notification/success, error=Notification/error, selection=Selection, excluded events, fire-and-forget)
- D-07 through D-12: Architecture (new haptics.ts module, native-plugins.ts handles plugin init, typed exports, prefersReducedMotion check, @capacitor/haptics@^7.0.5 as devDep, direct calls from components)
- D-13 through D-16: Integration points (ChatComposer, ToolChip/ToolCallGroup, error handler, settings toggles/model selector)
- D-17 through D-18: ProMotion Info.plist opt-in (CADisableMinimumFrameDurationOnPhone = true, build-time config)
- D-19 through D-24: Spring tuning (no runtime detection needed for CSS, physics is frame-rate independent, increase damping ~15-20% on SNAPPY and BOUNCY, regenerate linear() tokens, duration tokens unchanged)
- D-25 through D-27: Reduced motion and web degradation (silent no-ops, no runtime errors on web, existing CSS @media rule unchanged)

### Claude's Discretion
- Exact damping values for tuned springs (within ~15-20% increase guideline)
- Whether to add haptics to additional interactions beyond the 4 mapped
- Internal structure of haptics.ts (single function with type param vs separate exported functions)
- Whether to expose a getHapticsModule() accessor like getKeyboardModule() or keep it internal

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MOTION-01 | Device refresh rate detected (60Hz vs 120Hz) at runtime | D-19/D-20: Runtime detection NOT needed for CSS animations. Info.plist opt-in enables 120Hz at the Core Animation layer. CSS compositor-driven animations automatically use the available refresh rate. No JS detection API needed. |
| MOTION-02 | Spring/transition durations adapted for 120Hz ProMotion displays | D-20/D-22: Physics-based springs are frame-rate independent. Tuning is about reducing overshoot/settling (damping increase), not frame-rate adaptation. Regenerate linear() tokens after config changes. |
| MOTION-03 | Info.plist includes CADisableMinimumFrameDurationOnPhone for ProMotion opt-in | D-17/D-18: Add boolean key to ios/App/App/Info.plist. Build-time configuration, no runtime code needed. |
| NATIVE-03 | Haptic feedback on message send, tool completion, and error states | D-01 through D-16: Full haptic architecture with Capacitor plugin, wrapper module, and 4 integration points in UI components. |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **Confidence gate:** >=90% proceed, 70-89% pause, <70% research first
- **No placeholders:** All generated code must be complete and functional
- **Verify before done:** Run test/build/lint and show output
- **Plan before multi-file changes:** 3+ files = numbered plan, wait for approval
- **Named exports only (Constitution 2.2):** Exception only for Capacitor config default export
- **cn() for classNames (Constitution 3.6)**
- **Design tokens only (Constitution 3.1):** No hardcoded Tailwind color utilities
- **Selector-only store access (Constitution 4.2)**
- **Tool fallback chains:** Context7 first for library docs

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @capacitor/haptics | 7.0.5 | Native haptic feedback API | Official Capacitor plugin, matches existing 7.x plugin versions (keyboard@7.0.6, splash-screen@7.0.5, status-bar@7.0.6) |
| spring-easing | 2.3.3 | Generate CSS linear() from spring physics | Already installed, used by generate-spring-tokens.mjs |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vitest | (existing) | Unit testing haptics module | Test haptics no-op behavior, reduced motion, native init |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @capacitor/haptics | Custom UIImpactFeedbackGenerator via native bridge | Unnecessary complexity, Capacitor plugin handles it |
| spring-easing | Manual spring solver | Already using spring-easing, no reason to change |

**Installation:**
```bash
cd src && npm install --save-dev @capacitor/haptics@^7.0.5
```

**Version verification:** @capacitor/haptics latest 7.x is 7.0.5 (verified via npm registry 2026-03-28). Matches project's Capacitor 7.6.1 constraint.

## Architecture Patterns

### New File: src/src/lib/haptics.ts
```
src/src/lib/
  haptics.ts         # Runtime haptic feedback API (new)
  native-plugins.ts  # Plugin init + dynamic import (modify: add Haptics)
  motion.ts          # Spring configs (modify: tune damping)
  platform.ts        # IS_NATIVE detection (read-only)
```

### Pattern 1: Haptics Module (haptics.ts)
**What:** Thin wrapper over Capacitor Haptics that degrades silently on web
**When to use:** Any component that needs haptic feedback
**Example:**
```typescript
// Source: Capacitor Haptics API docs + native-plugins.ts pattern
import { IS_NATIVE } from '@/lib/platform';
import { prefersReducedMotion } from '@/lib/motion';

type HapticsModule = typeof import('@capacitor/haptics') | null;

let hapticsModule: HapticsModule = null;

/** Called from native-plugins.ts during init */
export function setHapticsModule(mod: HapticsModule): void {
  hapticsModule = mod;
}

export function hapticImpact(style: 'Heavy' | 'Medium' | 'Light' = 'Medium'): void {
  if (!IS_NATIVE || !hapticsModule || prefersReducedMotion()) return;
  // Fire-and-forget: no await (D-06)
  void hapticsModule.Haptics.impact({
    style: hapticsModule.ImpactStyle[style],
  });
}

export function hapticNotification(type: 'Success' | 'Warning' | 'Error'): void {
  if (!IS_NATIVE || !hapticsModule || prefersReducedMotion()) return;
  void hapticsModule.Haptics.notification({
    type: hapticsModule.NotificationType[type],
  });
}

export function hapticSelection(): void {
  if (!IS_NATIVE || !hapticsModule || prefersReducedMotion()) return;
  void hapticsModule.Haptics.selectionChanged();
}
```

### Pattern 2: Plugin Init in native-plugins.ts (SS-7 isolation)
**What:** Add Haptics to the existing per-plugin try/catch chain
**When to use:** At app startup
**Example:**
```typescript
// Inside initializeNativePlugins(), after SplashScreen block:
// --- Haptics plugin (separate try/catch -- SS-7) ---
try {
  const hapticsMod = await import('@capacitor/haptics');
  setHapticsModule(hapticsMod);
} catch (err: unknown) {
  console.warn('[native-plugins] Haptics plugin failed to load:', err);
  setHapticsModule(null);
}
```

### Pattern 3: Fire-and-forget haptic calls in components
**What:** Single function call at interaction point, no async/await
**When to use:** In event handlers (onClick, onSubmit, onChange)
**Example:**
```typescript
// In ChatComposer.tsx handleSend:
import { hapticImpact } from '@/lib/haptics';

const handleSend = useCallback(async () => {
  const trimmed = input.trim();
  if (!trimmed && !hasImages) return;
  hapticImpact('Medium'); // Fire-and-forget, before async work
  // ... existing send logic
}, [/* deps */]);
```

### Pattern 4: Spring Tuning
**What:** Increase damping on SPRING_SNAPPY and SPRING_BOUNCY for tighter feel
**When to use:** One-time config change in motion.ts
**Recommendation (Claude's discretion):**
```typescript
// SPRING_SNAPPY: damping 20 -> 24 (20% increase)
export const SPRING_SNAPPY: SpringConfig = {
  stiffness: 300,
  damping: 24, // was 20
};

// SPRING_BOUNCY: damping 12 -> 14 (~17% increase)
export const SPRING_BOUNCY: SpringConfig = {
  stiffness: 180,
  damping: 14, // was 12
};
```
Then regenerate: `cd src && node scripts/generate-spring-tokens.mjs` and paste output into tokens.css.

### Anti-Patterns to Avoid
- **Awaiting haptic calls:** Haptics should be fire-and-forget (D-06). `void haptics.impact(...)` not `await haptics.impact(...)`. Blocking UI on haptic response creates perceptible delay.
- **Event bus for haptics:** Direct function calls, not pub/sub or middleware indirection (D-12). Components know when they trigger an interaction.
- **Haptics in render path:** Only call haptics in event handlers, never during rendering or effects. A re-render should never trigger a haptic.
- **Separate 120Hz spring configs:** Physics is frame-rate independent (D-20). More frames render the same curve more smoothly. Don't create SPRING_SNAPPY_120 variants.
- **Runtime refresh rate detection for CSS:** Once Info.plist opts in, CSS compositor animations automatically use 120Hz. No JS screen.frameRate API needed.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Haptic feedback | Custom native bridge / UIImpactFeedbackGenerator | @capacitor/haptics | Already handles iOS/Android, graceful degradation, type-safe API |
| Spring -> CSS linear() | Manual spring solver + string builder | spring-easing + generate-spring-tokens.mjs | Already working, tested, 64-sample fidelity |
| Reduced motion check | Custom media query listener | prefersReducedMotion() from motion.ts | Already exists, tested in a11y-reduced-motion.test.tsx |
| Platform detection | Navigator.userAgent parsing | IS_NATIVE from platform.ts | Already exists, uses Capacitor global |

**Key insight:** Every foundational piece already exists. This phase is about wiring a new Capacitor plugin into an established pattern and inserting function calls at specific interaction points. No new architectural patterns needed.

## Common Pitfalls

### Pitfall 1: Importing @capacitor/haptics statically
**What goes wrong:** Static import of @capacitor/haptics gets bundled into the web build, adding dead code
**Why it happens:** Easy to forget the dynamic import pattern when adding a new plugin
**How to avoid:** All Capacitor plugin imports MUST use `await import('@capacitor/haptics')` inside `initializeNativePlugins()`, never static `import { Haptics } from '@capacitor/haptics'` at module level
**Warning signs:** Web build size increases, Vite analyzer shows @capacitor/haptics in web chunk

### Pitfall 2: Awaiting haptic calls in event handlers
**What goes wrong:** User feels a lag between tap and UI response
**Why it happens:** Haptics.impact() returns a Promise; natural instinct is to await it
**How to avoid:** Use `void hapticsModule.Haptics.impact(...)` -- fire-and-forget, let the OS handle timing
**Warning signs:** Perceptible delay between tap and visual response

### Pitfall 3: Haptics without reduced-motion guard
**What goes wrong:** Accessibility violation -- users who disabled animations still get haptic buzzing
**Why it happens:** Haptics feels separate from "motion" but it IS physical feedback
**How to avoid:** Every haptic function checks `prefersReducedMotion()` before firing (D-10)
**Warning signs:** Haptics fire with `prefers-reduced-motion: reduce` enabled in iOS accessibility settings

### Pitfall 4: Assuming grid-template-rows transitions benefit from 120Hz
**What goes wrong:** Expecting expand/collapse animations to look smoother after Info.plist change
**Why it happens:** `grid-template-rows` is NOT a compositor-friendly property -- it triggers layout, which runs on the main thread at 60fps in WKWebView
**How to avoid:** Only `transform`, `opacity`, and `filter` transitions benefit from ProMotion. Document this clearly so expectations are set correctly.
**Warning signs:** Tool card expand/collapse looks identical at 120Hz vs 60Hz

### Pitfall 5: Generating spring tokens without updating both files
**What goes wrong:** motion.ts and tokens.css drift out of sync
**Why it happens:** Developer changes damping in motion.ts but forgets to run the generator script
**How to avoid:** The plan should chain: (1) edit motion.ts, (2) run `node scripts/generate-spring-tokens.mjs`, (3) paste output into tokens.css. Verify by comparing the spring params in the script's header comment with motion.ts values.
**Warning signs:** Spring header comments in generate-spring-tokens.mjs don't match motion.ts

### Pitfall 6: Info.plist formatting
**What goes wrong:** Invalid plist after manual edit
**Why it happens:** XML plist formatting is whitespace-sensitive, easy to break with incorrect indentation or tag nesting
**How to avoid:** Add the new key as a `<key>` + `<true/>` pair inside the `<dict>` block, matching existing indentation (tabs). Validate with `plutil -lint` if available, or careful visual inspection.
**Warning signs:** Xcode fails to parse Info.plist on next build

## Code Examples

### Capacitor Haptics API (verified from official docs)
```typescript
// Source: https://capacitorjs.com/docs/apis/haptics
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

// Impact feedback (3 styles)
await Haptics.impact({ style: ImpactStyle.Heavy });   // 'HEAVY'
await Haptics.impact({ style: ImpactStyle.Medium });  // 'MEDIUM'
await Haptics.impact({ style: ImpactStyle.Light });   // 'LIGHT'

// Notification feedback (3 types)
await Haptics.notification({ type: NotificationType.Success }); // 'SUCCESS'
await Haptics.notification({ type: NotificationType.Warning }); // 'WARNING'
await Haptics.notification({ type: NotificationType.Error });   // 'ERROR'

// Selection feedback (for toggles, pickers)
await Haptics.selectionChanged();

// Also available but NOT used in this phase:
await Haptics.selectionStart();
await Haptics.selectionEnd();
await Haptics.vibrate({ duration: 300 }); // Android-only meaningful
```

### Info.plist ProMotion Opt-In
```xml
<!-- Source: Apple Developer documentation, WebKit bug 173434 -->
<!-- Add inside <dict> in ios/App/App/Info.plist -->
<key>CADisableMinimumFrameDurationOnPhone</key>
<true/>
```

### Tool State Machine (for haptic trigger point)
```typescript
// ToolCallStatus type: 'invoked' | 'executing' | 'resolved' | 'rejected'
// ToolChip already tracks status transitions:
const [prevStatus, setPrevStatus] = useState(toolCall.status);
if (toolCall.status !== prevStatus) {
  setPrevStatus(toolCall.status);
  if (toolCall.status === 'rejected') {
    // Existing: auto-expand on error
    setLocalExpanded(true);
    // NEW: haptic on error
    hapticNotification('Error');
  }
  if (toolCall.status === 'resolved') {
    // NEW: haptic on success
    hapticNotification('Success');
  }
}
```

### Existing Test Pattern (native-plugins.test.ts)
```typescript
// Source: src/src/lib/native-plugins.test.ts
// Pattern: vi.hoisted() for mock refs, vi.mock() for module mocks,
// _resetForTesting() for state cleanup between tests
const { mockHaptics, mockImpactStyle, mockNotificationType } = vi.hoisted(() => ({
  mockHaptics: {
    impact: vi.fn().mockResolvedValue(undefined),
    notification: vi.fn().mockResolvedValue(undefined),
    selectionChanged: vi.fn().mockResolvedValue(undefined),
  },
  mockImpactStyle: { Heavy: 'HEAVY', Medium: 'MEDIUM', Light: 'LIGHT' },
  mockNotificationType: { Success: 'SUCCESS', Warning: 'WARNING', Error: 'ERROR' },
}));

vi.mock('@capacitor/haptics', () => ({
  Haptics: mockHaptics,
  ImpactStyle: mockImpactStyle,
  NotificationType: mockNotificationType,
}));
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| rAF 60fps only in WKWebView | CSS compositor animations at 120Hz, rAF still 60fps | iOS 15+ with Info.plist opt-in | CSS-first motion strategy is correct and validated |
| navigator.vibrate() for haptics | Capacitor Haptics plugin wrapping UIImpactFeedbackGenerator | Capacitor 3+ | Type-safe, platform-appropriate feedback (not just vibration) |
| Manual spring duration calc | spring-easing package with CSSSpringEasing | Already in project | Generates correct settling time from physics params |

**Deprecated/outdated:**
- `navigator.vibrate()`: Android-only, no iOS support, no nuanced feedback types. Do not use.
- MOTION-01 as originally written says "Device refresh rate detected at runtime" -- per D-19, runtime detection is NOT needed for CSS animations. The Info.plist opt-in handles this at the Core Animation layer. The requirement is satisfied by the opt-in, not by JS detection.

## Open Questions

1. **Tool completion haptic trigger location**
   - What we know: ToolChip has a status-change detection pattern (`prevStatus` tracking) that auto-expands on `rejected`. This same pattern can trigger haptics on `resolved` and `rejected`.
   - What's unclear: If a tool group has 10 tools resolving rapidly, this could fire 10 haptic notifications in quick succession. Should haptics be debounced for batch tool completions?
   - Recommendation: Start without debouncing (D-05 already excludes frequent events). If tool completion batches feel excessive during testing, add a 200ms throttle in `hapticNotification`. This is a tuning concern, not an architectural one.

2. **Error haptic -- which error surface?**
   - What we know: D-15 says "Error boundary / connection error handler." Multiple error surfaces exist: ErrorBoundary (React render errors), connection store errors, tool rejection.
   - What's unclear: Whether ErrorBoundary should fire haptics (it catches catastrophic render errors, which are developer bugs not user-facing errors).
   - Recommendation: Fire haptics on (a) tool `rejected` status transition and (b) connection error state. Skip ErrorBoundary -- those are crash-level errors where haptic feedback adds nothing useful. The user already sees a full error UI.

3. **getHapticsModule() accessor pattern**
   - What we know: native-plugins.ts exposes `getKeyboardModule()` for downstream hooks.
   - What's unclear: Whether haptics needs the same accessor pattern or if the `setHapticsModule()` approach (haptics.ts owns the reference) is cleaner.
   - Recommendation: Use `setHapticsModule()` injected from native-plugins.ts. The haptics module reference stays internal to haptics.ts. No downstream code needs the raw module -- they use the wrapper functions. Simpler than the keyboard pattern where `useKeyboardOffset` needs the raw Keyboard object for event listeners.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (existing) |
| Config file | src/vitest-setup.ts |
| Quick run command | `cd src && npx vitest run --reporter=verbose` |
| Full suite command | `cd src && npx vitest run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| NATIVE-03 | Haptic feedback fires on send, tool complete, error | unit | `cd src && npx vitest run src/src/lib/haptics.test.ts -x` | No -- Wave 0 |
| NATIVE-03 | Haptic plugin init follows SS-7 isolation | unit | `cd src && npx vitest run src/src/lib/native-plugins.test.ts -x` | Yes -- extend |
| NATIVE-03 | Haptics are silent no-op on web | unit | `cd src && npx vitest run src/src/lib/haptics.test.ts -x` | No -- Wave 0 |
| NATIVE-03 | Haptics respect prefers-reduced-motion | unit | `cd src && npx vitest run src/src/lib/haptics.test.ts -x` | No -- Wave 0 |
| MOTION-02 | Spring damping values updated | unit | `cd src && npx vitest run src/src/tests/a11y-reduced-motion.test.tsx -x` | Yes -- verify motion.ts values |
| MOTION-03 | Info.plist includes CADisableMinimumFrameDurationOnPhone | unit | `grep CADisableMinimumFrameDurationOnPhone src/ios/App/App/Info.plist` | Manual check |

### Sampling Rate
- **Per task commit:** `cd src && npx vitest run src/src/lib/haptics.test.ts src/src/lib/native-plugins.test.ts -x`
- **Per wave merge:** `cd src && npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/src/lib/haptics.test.ts` -- covers NATIVE-03 (haptic calls, no-ops, reduced motion)
- [ ] Extend `src/src/lib/native-plugins.test.ts` -- add Haptics plugin init test block

## Sources

### Primary (HIGH confidence)
- [Capacitor Haptics Plugin API](https://capacitorjs.com/docs/apis/haptics) -- Full API reference: ImpactStyle (Heavy/Medium/Light), NotificationType (Success/Warning/Error), selectionChanged(), vibrate()
- Existing codebase: `native-plugins.ts`, `motion.ts`, `platform.ts`, `tokens.css`, `generate-spring-tokens.mjs`
- npm registry: `@capacitor/haptics@7.0.5` is latest 7.x, verified 2026-03-28

### Secondary (MEDIUM confidence)
- [WebKit Bug 173434](https://bugs.webkit.org/show_bug.cgi?id=173434) -- requestAnimationFrame 120Hz support status. Resolved for Safari in iOS 18, but WKWebView rAF remains 60fps. CSS compositor animations confirmed at 120Hz.
- [Apple Developer Forums: WKWebView 120Hz](https://developer.apple.com/forums/thread/773222) -- Confirms rAF throttle in WKWebView, CSS animations on compositor properties run at native refresh rate
- [Apple CADisableMinimumFrameDurationOnPhone documentation](https://www.macrumors.com/2021/09/24/apple-promotion-third-party-app-support/) -- Required Info.plist key for 120Hz Core Animation in third-party apps

### Tertiary (LOW confidence)
- Exact behavior of `CADisableMinimumFrameDurationOnPhone` on WKWebView CSS animations vs only CALayer -- this is HIGH confidence for native CALayer animations but MEDIUM for web content specifically. The project's existing decision (D-19) aligns with community consensus that compositor-driven CSS animations benefit from this flag.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- single package (@capacitor/haptics 7.0.5), well-documented, matches existing project patterns
- Architecture: HIGH -- follows established native-plugins.ts pattern exactly, all integration points identified in existing code
- Pitfalls: HIGH -- WKWebView 120Hz nuances verified through multiple sources, haptic API surface is small and well-defined
- Spring tuning: MEDIUM -- damping values are subjective (need real device testing), but the physics approach is proven

**Research date:** 2026-03-28
**Valid until:** 2026-04-28 (stable -- Capacitor 7.x is mature, Info.plist keys don't change)
