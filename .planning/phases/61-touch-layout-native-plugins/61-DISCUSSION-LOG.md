# Phase 61: Touch, Layout & Native Plugins - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md -- this log preserves the alternatives considered.

**Date:** 2026-03-28
**Phase:** 61-touch-layout-native-plugins
**Areas discussed:** Touch target audit scope, Plugin architecture, iOS back gesture, Overscroll prevention, Splash screen timing
**Mode:** --auto (all decisions auto-resolved with recommended defaults)

---

## Touch Target Audit Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Comprehensive audit | Audit ALL interactive elements across all panels (TOUCH-01 requirement) | ✓ |
| Chat-focused first | Audit chat interface only, defer other panels | |
| Incremental by panel | Audit one panel per phase iteration | |

**Auto-selected:** Comprehensive audit, chat-first priority
**Reasoning:** TOUCH-01 explicitly requires "all interactive elements have 44px+ touch targets at mobile breakpoint". Cannot partially fulfill. Priority order: chat → sidebar → modals → editor/terminal.

---

## StatusBar + SplashScreen Plugin Architecture

| Option | Description | Selected |
|--------|-------------|----------|
| Extend native-plugins.ts | Add init functions alongside Keyboard plugin (single module, single import site) | ✓ |
| Separate modules | Create status-bar-plugin.ts and splash-screen-plugin.ts independently | |
| iOS-only Xcode config | Configure in Info.plist/Xcode project, no JS | |

**Auto-selected:** Extend native-plugins.ts
**Reasoning:** Phase 60 established native-plugins.ts as the single init site for Capacitor plugins. All three plugins (Keyboard, StatusBar, SplashScreen) configure device-level state. Separate modules would fragment init logic.

---

## iOS Back Gesture vs Sidebar Drawer

| Option | Description | Selected |
|--------|-------------|----------|
| Natural coexistence | Sidebar handles when open, iOS back works when closed | ✓ |
| Disable iOS back globally | Set gesturesEnabled: false in capacitor config | |
| Edge detection zone split | Partition left edge: 0-20px for iOS, 20px+ for sidebar | |

**Auto-selected:** Natural coexistence
**Reasoning:** When sidebar is closed, no conflict exists. When sidebar is open, its swipe-to-close gesture naturally handles left-edge swipes (user expects to close sidebar by swiping left). Disabling iOS back gesture globally breaks user expectations.

---

## Overscroll Prevention Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Two-tier strategy | overscroll-behavior on body + touch-action on app shell, auto on scrollable children | ✓ |
| CSS-only | overscroll-behavior: none on html/body only | |
| JS touch handler | Custom touchmove preventDefault on app shell | |

**Auto-selected:** Two-tier strategy
**Reasoning:** CSS `overscroll-behavior` alone doesn't prevent rubber-band on iOS WebView. Need `touch-action` for WKWebView compatibility. Two-tier approach prevents page-level bounce while allowing internal scroll regions to function normally.

---

## Splash Screen Dismiss Timing

| Option | Description | Selected |
|--------|-------------|----------|
| On connection ready + fallback | Hide when ConnectionStore reports connected; 3s fallback | ✓ |
| On React mount | Hide in useEffect in App component | |
| On DOMContentLoaded | Hide as early as possible | |

**Auto-selected:** On connection ready + 3s fallback
**Reasoning:** Hiding at React mount causes 300-500ms white flash before hydration/data load. Connection ready ensures users see splash → content (no blank intermediate state). 3s fallback prevents stuck splash if server unreachable.

---

## Bard-Prime Consultation

Bard-Prime was consulted for cross-vendor perspective. Key contributions:
- Flagged overscroll-behavior insufficiency on iOS WebView (led to two-tier strategy)
- Recommended splash hide on connection ready vs React mount (prevents white flash)
- Suggested safe-area left/right audit (previously untouched)
- Advised against disabling iOS back gesture globally
- Pushed back on deferring touch audit to Phase 62 (overruled: TOUCH-01 requires all elements in Phase 61)

## Claude's Discretion

- Exact hex color for StatusBar background (derive from OKLCH design tokens)
- CSS specificity strategy for shadcn component touch target overrides
- Whether splash uses custom image or solid color
- Visual regression test approach

## Deferred Ideas

- VoiceOver/screen reader verification (Phase 63 device validation)
- Landscape-specific layout optimizations (v2.3)
- Full responsive audit across all breakpoints (v2.3)
