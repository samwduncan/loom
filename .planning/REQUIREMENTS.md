# Requirements: v2.2 "The Touch"

**Defined:** 2026-03-28
**Target:** iOS-first UX transformation for iPhone 16 Pro Max
**Core Value:** Touch-optimized, gesture-native, visually stunning iOS experience

---

## Requirements Overview

v2.2 transforms Loom from a "desktop app scaled to mobile" into a purpose-built iOS experience. Three pillars: touch targets meet Apple's 44px minimum, typography & spacing optimized for mobile density, scroll performance validated on real device. 39 total requirements across 6 categories.

---

## TOUCH: Touch Target Compliance

User can reliably tap interactive elements on iPhone without missing. All targets ≥44px × 44px per Apple HIG.

- [ ] **TOUCH-01**: ThinkingDisclosure trigger button displays 44px minimum touch target height
  - _Acceptance:_ Measure pixel height in Safari DevTools mobile mode on iPhone 16 Pro Max; CSS class `.thinking-disclosure-trigger` has min-height or padding-y to guarantee 44px.
  - _Why:_ Currently ~20px; causes frequent mis-taps during stream watching.

- [ ] **TOUCH-02**: ToolCardShell header expands to 44px minimum touch target height
  - _Acceptance:_ `.tool-card-shell-header` has min-height: 44px or equivalent padding-y × 2.
  - _Why:_ At 8px + 12px + 8px padding = 32px effective height; too small for thick thumbs.

- [ ] **TOUCH-03**: ProjectHeader (sidebar project group trigger) reaches 44px minimum touch target height
  - _Acceptance:_ `.session-item-header` or ProjectHeader button has min-height: 44px.
  - _Why:_ Currently ~40px; inconsistent with main button standards.

- [ ] **TOUCH-04**: ChatEmptyState template suggestion buttons expand to 44px minimum height
  - _Acceptance:_ Each template pill button in ChatEmptyState has min-height: 44px and min-width: 44px.
  - _Why:_ Currently px-3 py-1.5 ≈ 32px; especially problematic on landscape mode.

- [ ] **TOUCH-05**: LiveSessionBanner Detach button reaches 44px minimum touch target height
  - _Acceptance:_ `.live-banner-detach-btn` (or equivalent) has min-height: 44px.
  - _Why:_ Currently px-2 py-0.5 ≈ 24px; small target in top-of-screen banner.

- [ ] **TOUCH-06**: All interactive elements in sidebar (session items, group headers, action buttons) have min-height: 44px
  - _Acceptance:_ Sidebar item rows and button targets audited in Playwright; no element < 44px in height.
  - _Why:_ Sidebar is primary navigation; high tap frequency during mobile sessions.

- [ ] **TOUCH-07**: Hover/focus indicators on all 44px+ targets are visible and 2px minimum stroke
  - _Acceptance:_ Focus ring, border, or background change visible at 44px size; ring-2 or border-2 class applied consistently.
  - _Why:_ VoiceOver and keyboard navigation on iPad; ensures users know they can tap.

---

## TYPO: Typography & Spacing

Text scales and spaces appropriately for mobile reading; minimum font sizes meet WCAG and Apple's comfort standards.

- [ ] **TYPO-01**: DateGroupHeader uses minimum 12px font size (not 11px)
  - _Acceptance:_ `.date-group-header` font-size changed from 0.6875rem (11px) to 0.75rem (12px) minimum.
  - _Why:_ WCAG AA minimum for body text; improves readability at arm's length (mobile usage pattern).

- [ ] **TYPO-02**: ThinkingDisclosure trigger text renders at 14px minimum on mobile
  - _Acceptance:_ `.thinking-disclosure-trigger` font-size: 0.875rem (14px) on mobile breakpoint; no smaller.
  - _Why:_ Thinking content is secondary but still needs legibility; 12px too small for scanning during waits.

- [ ] **TYPO-03**: Session titles truncate at 1 line with ellipsis on mobile (< 768px)
  - _Acceptance:_ SidebarItem and SessionListItem titles use `truncate` class; no wrapping to 2+ lines.
  - _Why:_ Narrow sidebar on mobile means 3-line titles waste space; single line + ellipsis is cleaner.

- [ ] **TYPO-04**: Chat message typography adjusts for mobile density: 15px body text, 18px for code blocks
  - _Acceptance:_ TurnBlock and MarkdownRenderer use 15px (0.9375rem) base; code blocks 18px monospace.
  - _Why:_ Desktop uses 16px; mobile reading at closer distance benefits from 1px reduction; code needs extra size.

- [ ] **TYPO-05**: Sidebar session list density optimized: py-2 items, 4px gaps between groups
  - _Acceptance:_ SessionListItem padding: py-2 (8px); gap between DateGroupHeader and first session: 4px.
  - _Why:_ Reduces vertical scroll distance; more sessions visible per screen on mobile.

- [ ] **TYPO-06**: Action labels in modals and buttons use 14px minimum (not 12px)
  - _Acceptance:_ Modal buttons, form labels, and secondary text use 14px (0.875rem) minimum on mobile.
  - _Why:_ 12px button labels strain eyes at mobile viewing distance; impacts accessibility.

- [ ] **TYPO-07**: Line-height preserved at 1.6 minimum for all body text on mobile
  - _Acceptance:_ No text element has line-height < 1.6; especially important for multi-line labels.
  - _Why:_ Tighter line-height (1.4) common on desktop; mobile needs more breathing room.

- [ ] **TYPO-08**: Keyboard (onscreen, not physical) does not cause text field labels to shrink
  - _Acceptance:_ Composer input label and floating token count remain visible when soft keyboard opens; no label resize.
  - _Why:_ iOS Capacitor keyboard triggers viewport resize; prevent "jumping" label size.

---

## SCROLL: Scroll Performance

Content scrolls at 60fps on real device (iPhone 16 Pro Max with WKWebView); no jank, stutter, or layout thrash.

- [ ] **SCROLL-01**: Session list scrolling maintains 60fps on iPhone 16 Pro Max (real device, not simulator)
  - _Acceptance:_ Measure with Safari DevTools Performance tab; scroll flame graph shows consistent 16.6ms frame time.
  - _Why:_ WKWebView's compositor needs validation; simulator lies about performance.

- [ ] **SCROLL-02**: Chat message scrolling (both direction) maintains 60fps with 50+ message turns
  - _Acceptance:_ Load 50-message session; scroll up/down; DevTools reports no frame drop below 45fps.
  - _Why:_ Rich content (code blocks, thinking disclosure) risks compositing overhead.

- [ ] **SCROLL-03**: Tool cards expand/collapse without frame drop during scroll
  - _Acceptance:_ Expand a ToolCardShell mid-scroll; no frame time spike > 20ms during animation.
  - _Why:_ CSS Grid expand animation can trigger layout thrash if not GPU-optimized.

- [ ] **SCROLL-04**: Sidebar session list scrolling smooth with 100+ sessions
  - _Acceptance:_ Create 100 test sessions; scroll sidebar; DevTools reports 60fps.
  - _Why:_ Session list can grow large during long dev sessions; poor performance here impacts UX heavily.

- [ ] **SCROLL-05**: content-visibility CSS rule applied to off-screen message turns to skip rendering
  - _Acceptance:_ MarkdownRenderer or TurnBlock has `content-visibility: auto` on container; DevTools Layout Shift shows reduction.
  - _Why:_ Prevents browser from rendering content outside viewport; especially important for large conversations.

- [ ] **SCROLL-06**: GPU compositing layers verified: all animations use transform/opacity only
  - _Acceptance:_ DevTools Rendering tab shows no animation triggering layout recalculation; use `will-change: transform` where needed.
  - _Why:_ WKWebView compositor requires clean separation of paint and composite layers.

- [ ] **SCROLL-07**: ScrollToBottomPill animation does not stall chat scroll performance
  - _Acceptance:_ Pill fade in/out (duration 200ms) does not cause frame drop in main scroll thread.
  - _Why:_ Pill uses CSS transitions; must not block message list scroll.

- [ ] **SCROLL-08**: Live session banner does not cause pinned header jank when scrolling
  - _Acceptance:_ Scroll chat with LiveSessionBanner visible; banner stays pinned; no frame drop.
  - _Why:_ Fixed/sticky positioning on WKWebView can cause compositor issues if not GPU-backed.

---

## GESTURE: iOS-Native Interactions

Users interact with app via native iOS gestures: swipe-to-delete, pull-to-refresh, long-press context menus, haptic feedback.

- [ ] **GESTURE-01**: Session list items support swipe-to-delete gesture on mobile (< 768px)
  - _Acceptance:_ Swipe left on SessionListItem reveals red Delete button; tap to confirm and remove session.
  - _Why:_ Native iOS pattern; users expect this in list-heavy UX; matches Apple Mail, Reminders.

- [ ] **GESTURE-02**: Pull-to-refresh gesture refreshes session list on mobile
  - _Acceptance:_ Pull down on session list (overscroll) triggers reload; spinner shows; live sessions re-attach.
  - _Why:_ Native iOS pattern for "check for new data"; gives users sense of control.

- [ ] **GESTURE-03**: Long-press on session item opens context menu (Copy ID, Rename, Delete, Export)
  - _Acceptance:_ Long-press (500ms hold) SessionListItem; native iOS context menu appears (or custom popover).
  - _Why:_ Mobile-native discovery; avoids clutter in list view; fast access to actions.

- [ ] **GESTURE-04**: Sidebar swipe-to-open gesture (edge pan from left) works on mobile
  - _Acceptance:_ Pan from left edge of chat area opens sidebar drawer; already implemented; verify on real device.
  - _Why:_ iOS-standard navigation; users coming from native apps expect this.

- [ ] **GESTURE-05**: Haptic feedback integrated into more touch actions beyond current set
  - _Acceptance:_ Haptics fire on: session select, sidebar toggle, pull-to-refresh complete, context menu open. Currently only on send/tool/error/selection.
  - _Why:_ Broader haptic coverage makes the app feel more responsive and native.

- [ ] **GESTURE-06**: Long-press on message gives copy/retry context menu
  - _Acceptance:_ Long-press (500ms) on message bubble opens popover with Copy Text / Retry options.
  - _Why:_ Mobile pattern for secondary actions; avoids extra UI chrome in message view.

---

## VISUAL: Visual Polish for iOS

OLED blacks, glass effects, spring physics, and color tuning optimized for WKWebView and ProMotion 120Hz.

- [ ] **VISUAL-01**: OLED-optimized base surface uses true black for outermost background only
  - _Acceptance:_ `html` and `body` background use oklch(0 0 0) (true black); `--surface-base` stays at oklch(0.15) for depth hierarchy. Surface elevation still distinguishable.
  - _Why:_ True black on OLED saves power, but flattening all surfaces to #000 kills the depth hierarchy. Only the outermost background should be true black.

- [ ] **VISUAL-02**: Glass effect (backdrop-filter blur) on modals renders at 60fps without stutter
  - _Acceptance:_ SettingsModal and CommandPalette have backdrop-filter: blur(10px); no frame drop when modal enters.
  - _Why:_ Blur is expensive; must use GPU optimization; WKWebView needs careful tuning.

- [ ] **VISUAL-03**: Spring animation timing tuned for 120Hz ProMotion (not 60Hz fallback)
  - _Acceptance:_ Spring curves (damping, stiffness) calibrated for 120fps; smooth on iPhone 16 Pro Max ProMotion.
  - _Why:_ Spring animations look sluggish at 60Hz; 120Hz requires slightly faster curves.

- [ ] **VISUAL-04**: Sidebar collapse/expand animation uses spring physics and completes in <300ms
  - _Acceptance:_ SidebarItem or Sidebar expand/collapse uses CSS spring or LazyMotion spring; duration < 300ms.
  - _Why:_ Mobile users appreciate snappy animations; <300ms feels instant.

- [ ] **VISUAL-05**: Toast notification slides in from bottom with spring bounce (not linear fade)
  - _Acceptance:_ Toast uses `ease-spring-snappy` or equivalent; bounces slightly on entry/exit.
  - _Why:_ Spring bounce creates delight and sense of physicality; matches native iOS notifications.

- [ ] **VISUAL-06**: OKLCH color space used for all color transitions and overlays
  - _Acceptance:_ No hex/HSL colors in CSS rules; all colors use oklch() or color-mix(in oklch, ...).
  - _Why:_ OKLCH perceptually smooth; prevents color shifts during animation.

- [ ] **VISUAL-07**: Accent color (#4F46E5 or equivalent) pops against OLED black without burn-in risk
  - _Acceptance:_ Accent uses medium saturation OKLCH; not pure bright neon; no solid accent fields > 1cm² at max brightness.
  - _Why:_ Bright accent on OLED can risk pixel burn at extended display; balance vibrancy with safety.

- [ ] **VISUAL-08**: Text contrast minimum AA (4.5:1) on all surfaces, AAA (7:1) for body text
  - _Acceptance:_ Use contrast checker on DevTools; all text elements meet or exceed minimum.
  - _Why:_ Mobile reading often in bright sunlight; contrast is critical.

- [ ] **VISUAL-09**: Thinking disclosure border radius adjusted for mobile: 8px corners (not 4px)
  - _Acceptance:_ `.thinking-disclosure` border-radius: 8px; less "sharp" feeling on touch device.
  - _Why:_ Larger radius feels more "native" and easier to tap near edges.

- [ ] **VISUAL-10**: Live session banner uses subtle gradient background (not solid color) to draw attention
  - _Acceptance:_ LiveSessionBanner background uses `linear-gradient()` with 2 OKLCH stops; smooth, not jarring.
  - _Why:_ Gradient creates depth without blur; indicates importance without alarm-like solid colors.

---

## INFRA: Infrastructure & Build Pipeline

All infrastructure requirements were completed in v2.1 and this session's hotfixes:
- ✓ INFRA-01 through INFRA-10: Capacitor config, nginx proxy, CORS, WebSocket, cache headers, portable scripts, viewport meta — all shipped.
- ✓ nginx dist symlink fix (2026-03-28) — nginx now serves from src/dist via symlink
- ✓ CORS origin for port 8184 added to Express ALLOWED_ORIGINS (2026-03-28)

No new infrastructure requirements for v2.2.

---

## VERIFICATION & TESTING

All requirements verified with real device testing on iPhone 16 Pro Max (WKWebView, not web browser).

| Category | Count | Status | Notes |
|----------|-------|--------|-------|
| TOUCH | 7 | TBD | Touch targets measured via code audit + real device |
| TYPO | 8 | TBD | Font sizes and spacing audited via code review + device |
| SCROLL | 8 | TBD | Performance validated on real iPhone 16 Pro Max |
| GESTURE | 6 | TBD | Gestures tested manually on device |
| VISUAL | 10 | TBD | Visual inspection on real device |
| INFRA | 0 | ✓ DONE | All shipped in v2.1 + hotfixes |
| **TOTAL** | **39** | TBD | |

---

## Acceptance Criteria (Gate)

v2.2 ships when:

1. All 39 requirements marked complete with evidence
2. App tested on real iPhone 16 Pro Max for ≥30 minutes
3. All touch targets measure ≥44px in DevTools mobile mode
4. Chat scroll sustains 60fps for 100-message conversation (Safari DevTools)
5. Session list scroll sustains 60fps with 100+ sessions
6. No visual jank during spring animations or glass effects
7. Gestured actions (swipe, pull-to-refresh, long-press) work as expected
8. All E2E tests pass (Playwright)
9. No console errors in Safari DevTools while using app
10. Deployed on Tailscale nginx; app loads from server.url in Capacitor

---

## Out of Scope (v2.3+)

| Feature | Reason | Target Milestone |
|---------|--------|------------------|
| Aurora WebGL overlay | GPU complexity; research needed | v2.3 "The Polish" |
| Offline-first sync | Network layer overhaul; post-MVP | v2.3+ |
| Dynamic island cutout optimization | Native plugin dev; deferred | v3.0+ |
| Voice input in composer | Capacitor Speech plugin; future | v2.3+ |
| App icon / splash screen polish | Design work; after core UX stable | v2.3+ |
| VoiceOver accessibility audit | Separate accessibility milestone | v2.3+ |

---

## Traceability Matrix

| Requirement | Phase | Est. | Owner | Status |
|-------------|-------|------|-------|--------|
| TOUCH-01 | 64 | 2h | TBD | Pending |
| TOUCH-02 | 64 | 2h | TBD | Pending |
| TOUCH-03 | 64 | 1h | TBD | Pending |
| TOUCH-04 | 64 | 1h | TBD | Pending |
| TOUCH-05 | 64 | 1h | TBD | Pending |
| TOUCH-06 | 64 | 3h | TBD | Pending |
| TOUCH-07 | 64 | 2h | TBD | Pending |
| TYPO-01 | 64 | 1h | TBD | Pending |
| TYPO-02 | 64 | 1h | TBD | Pending |
| TYPO-03 | 64 | 1h | TBD | Pending |
| TYPO-04 | 65 | 2h | TBD | Pending |
| TYPO-05 | 65 | 1h | TBD | Pending |
| TYPO-06 | 65 | 1h | TBD | Pending |
| TYPO-07 | 65 | 1h | TBD | Pending |
| TYPO-08 | 65 | 2h | TBD | Pending |
| SCROLL-01 | 66 | 2h | TBD | Pending |
| SCROLL-02 | 66 | 2h | TBD | Pending |
| SCROLL-03 | 66 | 1h | TBD | Pending |
| SCROLL-04 | 66 | 1h | TBD | Pending |
| SCROLL-05 | 66 | 1h | TBD | Pending |
| SCROLL-06 | 66 | 2h | TBD | Pending |
| SCROLL-07 | 66 | 1h | TBD | Pending |
| SCROLL-08 | 66 | 1h | TBD | Pending |
| GESTURE-01 | 67 | 3h | TBD | Pending |
| GESTURE-02 | 67 | 3h | TBD | Pending |
| GESTURE-03 | 67 | 3h | TBD | Pending |
| GESTURE-04 | 67 | 0h | TBD | Pending |
| GESTURE-05 | 67 | 2h | TBD | Pending |
| GESTURE-06 | 67 | 3h | TBD | Pending |
| VISUAL-01 | 68 | 0h | TBD | Pending |
| VISUAL-02 | 68 | 2h | TBD | Pending |
| VISUAL-03 | 68 | 2h | TBD | Pending |
| VISUAL-04 | 68 | 1h | TBD | Pending |
| VISUAL-05 | 68 | 1h | TBD | Pending |
| VISUAL-06 | 68 | 0h | TBD | Pending |
| VISUAL-07 | 68 | 1h | TBD | Pending |
| VISUAL-08 | 68 | 2h | TBD | Pending |
| VISUAL-09 | 68 | 0h | TBD | Pending |
| VISUAL-10 | 68 | 1h | TBD | Pending |
**Coverage:**
- v2.2 requirements: 39 total (7 TOUCH + 8 TYPO + 8 SCROLL + 6 GESTURE + 10 VISUAL)
- INFRA: 0 new (all shipped in v2.1)
- Mapped to estimated phases: 39
- Unmapped: 0 ✓

---

*Requirements defined: 2026-03-28*
*Milestone: v2.2 "The Touch"*
*Target platform: iPhone 16 Pro Max, iOS 17+*
*Build system: Capacitor 7.6.1, Vite 7, React 19*
