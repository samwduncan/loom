# Phase 67: iOS-Native Gestures - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md -- this log preserves the alternatives considered.

**Date:** 2026-03-29
**Phase:** 67-ios-native-gestures
**Mode:** Auto-resolved (--auto flag)
**Areas discussed:** Gesture library scope, Context menu unification, Pull-to-refresh mechanics, Plugin architecture, Swipe vs context menu coexistence, Haptic grammar

---

## Gesture Library Scope (GESTURE-07)

| Option | Description | Selected |
|--------|-------------|----------|
| New gestures only | @use-gesture/react for new gestures; existing Sidebar swipe stays as raw touch handlers | ✓ |
| Full migration | Migrate all gesture code (including Sidebar) to @use-gesture/react | |
| Hybrid selective | Use @use-gesture for complex gestures, raw timers for simple ones (long-press) | |

**Auto-selected:** New gestures only (recommended default)
**Rationale:** GESTURE-07 explicitly says "for new gestures." Existing Sidebar swipe is optimized, tested, works on real devices. Migration adds risk with zero feature gain. Bard concurs: "don't over-engineer."

---

## Context Menu Pattern (GESTURE-03, GESTURE-06)

| Option | Description | Selected |
|--------|-------------|----------|
| Radix unification | Unify all context menus under Radix ContextMenu + useLongPress hook | ✓ |
| Keep dual patterns | Add long-press to existing SessionContextMenu, Radix for messages | |
| Native action sheet | Use @capacitor/action-sheet for all context menus on native | |

**Auto-selected:** Radix unification (recommended default)
**Rationale:** Two patterns already exist (custom portaled SessionContextMenu vs Radix FileTreeContextMenu). Adding two more menus under the custom pattern worsens fragmentation. Radix handles z-index, focus, keyboard, a11y out of box. Bard: "Unify on Radix + long-press now, before shipping message/session menus."

---

## Pull-to-Refresh Mechanics (GESTURE-02)

| Option | Description | Selected |
|--------|-------------|----------|
| @use-gesture useDrag | Professional velocity-aware pull with threshold detection | ✓ |
| CSS overscroll approach | CSS overscroll-behavior + scroll event detection (minimal JS) | |
| Raw touch handlers | Custom touchstart/touchmove/touchend (verbose, error-prone) | |

**Auto-selected:** @use-gesture useDrag (recommended default)
**Rationale:** Since we're already adding @use-gesture/react (GESTURE-07), use it for pull-to-refresh too. Provides velocity tracking for proportional animation feel. CSS approach would be lighter but offers less animation control.

---

## Plugin Architecture (GESTURE-08, 09, 10)

| Option | Description | Selected |
|--------|-------------|----------|
| Separate modules | New plugins in separate utility modules; native-plugins.ts stays as init coordinator | ✓ |
| Extend native-plugins.ts | Add all new plugins to existing native-plugins.ts | |
| Plugin registry pattern | Create a generic plugin loader/registry | |

**Auto-selected:** Separate modules (recommended default)
**Rationale:** native-plugins.ts handles init-time plugins (keyboard, status-bar, splash, haptics). New plugins are event-driven (@capacitor/app) or on-demand utilities (share, action-sheet, clipboard). Different lifecycle = different modules. Bard: "Keep native-plugins.ts as init coordinator without growing into a 500-line god module."

---

## Swipe-to-Delete vs Context Menu (GESTURE-01, GESTURE-03)

| Option | Description | Selected |
|--------|-------------|----------|
| Both coexist | Swipe for quick delete, long-press menu for full action set (both include Delete) | ✓ |
| Swipe replaces menu delete | Remove Delete from context menu on mobile, swipe is the only way | |
| Context menu only | Skip swipe-to-delete, long-press menu has Delete | |

**Auto-selected:** Both coexist (recommended default)
**Rationale:** Apple Mail pattern -- swipe left reveals Delete for quick action, long-press opens full menu (which also has Delete). Users learn one or the other based on preference. Removing either reduces discoverability.

---

## Haptic Feedback Grammar (GESTURE-05)

| Option | Description | Selected |
|--------|-------------|----------|
| Centralized event map | Define haptic grammar mapping gesture events to haptic types/styles | ✓ |
| Inline per-component | Add haptic calls directly in each component | |
| No grammar, just coverage | Fire generic hapticImpact('Light') everywhere | |

**Auto-selected:** Centralized event map (recommended default)
**Rationale:** Scattered haptic calls across components become inconsistent fast. A central mapping (gesture → haptic type+style) ensures delete always feels different from select, and pull-to-refresh always feels different from sidebar toggle.

---

## Claude's Discretion

- Per-gesture threshold values and animation durations
- Plan structure (split by gesture type or by feature area)
- Testing strategy
- Spinner component design for pull-to-refresh
- Incremental vs full replacement of SessionContextMenu

## Deferred Ideas

- Reply/Forward in message context menu (new capability)
- Swipe actions on messages (not in requirements)
- Migrate Sidebar swipe to @use-gesture (no feature gain)
- Pull-to-refresh on chat view (new capability)
