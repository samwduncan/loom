# Phase 60: Keyboard & Composer - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md -- this log preserves the alternatives considered.

**Date:** 2026-03-28
**Phase:** 60-keyboard-composer
**Areas discussed:** Plugin architecture, Animation matching, Dual-mode strategy, Scroll behavior
**Mode:** --auto (all areas auto-selected, recommended defaults chosen)

---

## Plugin Architecture

| Option | Description | Selected |
|--------|-------------|----------|
| useKeyboardOffset() hook in native-plugins.ts | Module-level init + platform-aware hook. ChatComposer stays clean. Matches websocket-init.ts pattern. | Yes |
| useCapacitorKeyboard() dynamic import hook | Hook handles its own async import. Simpler but fragile init timing. | |
| Zustand middleware | Keyboard events dispatched to UI store. Declarative but adds store coupling. | |

**Auto-selected:** useKeyboardOffset() hook in native-plugins.ts (recommended -- matches platform-unaware convention from Phase 59)
**Bard input:** Agreed with this approach. Flagged plugin initialization order as a footgun -- async plugin load can silently fail. Recommended module-level init with explicit error logging.

---

## Animation Matching

| Option | Description | Selected |
|--------|-------------|----------|
| Event-driven passthrough on native | Set --keyboard-offset directly from native event, NO CSS transition. iOS drives animation. | Yes |
| CSS transition matching iOS curve | Measure iOS ~280ms ease-in-out curve, replicate in CSS. Simpler code but imperfect match. | |
| rAF-driven JS animation | Replicate iOS spring curve in JavaScript. Correct but complex and 60fps cap in WKWebView. | |

**Auto-selected:** Event-driven passthrough on native (recommended -- avoids double-animation visual lag)
**Bard input:** Flagged this as the most underestimated risk. CSS ease-out creates ~150ms visible lag vs native keyboard motion. Passthrough avoids the problem entirely. Also noted rAF is capped at 60fps in WKWebView, making JS animation inferior to CSS for this use case.

---

## Dual-Mode Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Platform-aware hook extraction | useKeyboardOffset() wraps both paths. ChatComposer calls hook, gets height. No IS_NATIVE in components. | Yes |
| IS_NATIVE branch in ChatComposer | Simpler but violates platform-unaware convention. Creates two code paths in a complex component. | |
| Unified visualViewport for both | Keep current approach, just improve it. Less work but doesn't solve the root fragility on iOS. | |

**Auto-selected:** Platform-aware hook extraction (recommended -- matches v2.1 convention, scales to Android)
**Bard input:** Strongly agreed. Warned that IS_NATIVE checks in ChatComposer would scatter platform logic by Phase 65. Hook extraction is necessary, not nice-to-have.

---

## Scroll Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-scroll only if at bottom | Check isAtBottom before keyboard opens. At bottom = scroll to latest. Scrolled up = preserve position. | Yes |
| Unconditional auto-scroll | Always scroll to bottom when keyboard opens (per KEY-04 literal reading). | |
| No auto-scroll | Let user manage scroll. Simplest but poor UX when at bottom. | |

**Auto-selected:** Auto-scroll only if at bottom (recommended -- preserves reading position, uses existing isAtBottom from useScrollAnchor)
**Bard input:** Called the unconditional approach a "UX regression" -- user scrolls up to read, keyboard opens, content jumps to bottom. "Maddening." Strongly recommended conditional approach.

---

## Claude's Discretion

- Internal hook structure (useEffect vs useLayoutEffect)
- Zustand atom vs DOM-only CSS variable for keyboard height
- Test structure and mocking strategy
- JSDoc depth
- Whether handleScroll anti-bounce is needed with resize mode none

## Deferred Ideas

- Zustand atom for keyboard height -- evaluate after hook approach ships
- Haptic feedback on keyboard events -- Phase 62
- Android keyboard differences -- future milestone
- ESLint rule for visualViewport access -- nice-to-have
