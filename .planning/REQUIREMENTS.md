# Requirements: v2.2 "The Touch"

**Defined:** 2026-03-28
**Target:** iOS-first UX transformation for iPhone 16 Pro Max
**Core Value:** Touch-optimized, gesture-native, visually stunning iOS experience

---

## Requirements Overview

v2.2 transforms Loom from a "desktop app scaled to mobile" into a purpose-built iOS experience. Three pillars: touch targets meet Apple's 44px minimum, typography & spacing optimized for mobile density, scroll performance validated on real device. 45 total requirements across 5 categories.

---

## TOUCH: Touch Target Compliance

User can reliably tap interactive elements on iPhone without missing. All targets >=44px x 44px per Apple HIG.

- [ ] **TOUCH-01**: ThinkingDisclosure trigger button displays 44px minimum touch target height
  - _Acceptance:_ Measure pixel height in Safari DevTools mobile mode on iPhone 16 Pro Max; CSS class `.thinking-disclosure-trigger` has min-height or padding-y to guarantee 44px.
  - _Why:_ Currently ~20px; causes frequent mis-taps during stream watching.

- [ ] **TOUCH-02**: ToolCardShell header expands to 44px minimum touch target height
  - _Acceptance:_ `.tool-card-shell-header` has min-height: 44px or equivalent padding-y x 2.
  - _Why:_ At 8px + 12px + 8px padding = 32px effective height; too small for thick thumbs.

- [ ] **TOUCH-03**: ProjectHeader (sidebar project group trigger) reaches 44px minimum touch target height
  - _Acceptance:_ `.session-item-header` or ProjectHeader button has min-height: 44px.
  - _Why:_ Currently ~40px; inconsistent with main button standards.

- [ ] **TOUCH-04**: ChatEmptyState template suggestion buttons expand to 44px minimum height
  - _Acceptance:_ Each template pill button in ChatEmptyState has min-height: 44px and min-width: 44px.
  - _Why:_ Currently px-3 py-1.5 = 32px; especially problematic on landscape mode.

- [ ] **TOUCH-05**: LiveSessionBanner Detach button reaches 44px minimum touch target height
  - _Acceptance:_ `.live-banner-detach-btn` (or equivalent) has min-height: 44px.
  - _Why:_ Currently px-2 py-0.5 = 24px; small target in top-of-screen banner.

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

Content scrolls at 60fps on real device. This is THE highest priority -- everything else is meaningless if scrolling feels broken.

### Jank Source Elimination (audit findings)

- [ ] **SCROLL-01**: Remove setState from scroll event handler -- use ref + IntersectionObserver for atBottom detection
  - _Acceptance:_ `setAtBottom()` and `setUnreadCount()` NEVER called inside scroll event callback. atBottom state derived from IntersectionObserver on a sentinel element at the bottom of the message list.
  - _Why:_ CRITICAL. Currently fires React setState 60+ times/sec during scroll, blocking compositor on every frame. This is the #1 jank source.

- [ ] **SCROLL-02**: Remove DOM measurements (scrollHeight, scrollTop, clientHeight) from scroll handler
  - _Acceptance:_ Scroll event handler does NOT read any layout properties. All scroll-position-dependent logic uses IntersectionObserver or rAF-batched reads.
  - _Why:_ DOM layout reads during scroll force synchronous layout recalculation in WKWebView.

- [ ] **SCROLL-03**: Auto-scroll-to-bottom during streaming uses rAF batching, not per-message-length useEffect
  - _Acceptance:_ Streaming auto-scroll fires at most once per animation frame via rAF, not on every `messages.length` change.
  - _Why:_ Current implementation triggers `el.scrollTop = el.scrollHeight` on every message chunk during streaming.

- [x] **SCROLL-04**: Verify useAutoResize layout pattern is acceptable at typing frequency
  - _Acceptance:_ useAutoResize write->read->write pattern retained intentionally per D-09 -- fires at typing frequency (10-20Hz), not scroll frequency (60-120Hz). Pattern documented with `// SCROLL-04 / D-09` comment in useAutoResize.ts.
  - _Why:_ The write->read->write is unavoidable for height measurement (must reset to 0, read scrollHeight, set final). useLayoutEffect ensures pre-paint timing. Acceptable at typing frequency.

- [x] **SCROLL-05**: Defer forced reflow in ActiveMessage finalization out of scroll-critical path
  - _Acceptance:_ `void container.offsetHeight` forced reflow deferred behind rAF + 50ms setTimeout per D-11/D-12. FLIP animation intentionally preserved -- forced reflow required for CSS height transition. Relocated out of scroll-critical path so it cannot block an active scroll frame.
  - _Why:_ The forced reflow is inherent to the FLIP animation pattern (browser must commit start height before animating to end height). Deferring by 50ms ensures it fires between scroll frames, not during one.

- [ ] **SCROLL-06**: Delete dead useScrollAnchor.ts hook
  - _Acceptance:_ File removed from codebase. No imports reference it.
  - _Why:_ Contains a rAF loop calling `scrollIntoView()` every frame -- 60+ forced reflows/sec. Not currently used but dangerous if accidentally imported.

### Scroll Infrastructure

- [ ] **SCROLL-07**: Measure-then-decide virtualization gate -- no virtualization this phase
  - _Acceptance:_ After SCROLL-01 through SCROLL-06 are fixed, test with 50+ message conversation on real device. Phase passes if <5% frame drops at 50+ messages during fast scroll. If virtualization IS needed in future, `virtua` (~3KB, reverse scroll support) is preferred over @tanstack/react-virtual or react-virtuoso (per D-15/D-16). No virtualization library is added in this phase.
  - _Why:_ Fix the JS execution bottleneck first. content-visibility:auto provides off-screen rendering optimization. Virtualization only considered if fixes don't achieve 60fps.

- [ ] **SCROLL-08**: Status bar tap scrolls message list to top
  - _Acceptance:_ Tapping the iOS status bar area scrolls the chat message list to the top with smooth animation. Uses Capacitor `statusTap` event.
  - _Why:_ Universal iOS expectation since iPhone OS 1.0. Five lines of code, high impact.

- [x] **SCROLL-09**: Rubber band bounce preserved on all scroll containers
  - _Acceptance:_ Message list and session list have native iOS overscroll bounce. No `overscroll-behavior: none` on these containers (only on html/body to prevent page-level bounce).
  - _Why:_ Users expect bounce on every scrollable surface. We may have accidentally disabled it.

- [ ] **SCROLL-10**: Chat message scrolling (both directions) maintains 60fps with 50+ messages on real device
  - _Acceptance:_ Load 50-message session on iPhone 16 Pro Max. Scroll up/down rapidly. No visible stutter or frame drops.
  - _Why:_ The ultimate validation that scroll fixes worked. Test AFTER implementing SCROLL-01 through SCROLL-06.

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
  - _Acceptance:_ Haptics fire on: session select, sidebar toggle, pull-to-refresh complete, context menu open, swipe-to-delete reveal. Currently only on send/tool/error/selection.
  - _Why:_ Broader haptic coverage makes the app feel more responsive and native.

- [ ] **GESTURE-06**: Long-press on message gives copy/retry context menu
  - _Acceptance:_ Long-press (500ms) on message bubble opens popover with Copy Text / Retry / Share options. Uses @capacitor/clipboard for reliable copy on HTTP origins.
  - _Why:_ Mobile pattern for secondary actions; avoids extra UI chrome in message view.

- [ ] **GESTURE-07**: @use-gesture/react library for professional gesture handling
  - _Acceptance:_ All gesture hooks (swipe, long-press, pull-to-refresh) use @use-gesture/react for velocity tracking, direction detection, and conflict resolution. No raw touchstart/touchmove event handlers for new gestures.
  - _Why:_ 6KB for battle-tested gesture math. Raw touch handlers are a half-measure -- they reinvent the library poorly and miss edge cases (multi-touch, scroll conflicts, velocity thresholds).

- [ ] **GESTURE-08**: @capacitor/app lifecycle -- reconnect WebSocket on foreground return
  - _Acceptance:_ When app returns from background, WebSocket auto-reconnects within 2 seconds. Uses `App.addListener('appStateChange')`. No stale UI after backgrounding.
  - _Why:_ Currently backgrounding kills the WS connection silently and user sees stale state on return. Critical for daily-driver usage.

- [ ] **GESTURE-09**: Native share sheet for conversations and code blocks
  - _Acceptance:_ Share button in message context menu and session export opens iOS native share sheet (UIActivityViewController) via @capacitor/share. Falls back to Web Share API on desktop.
  - _Why:_ Users want to share interesting AI conversations. Native share sheet gives AirDrop, Messages, Mail, Notes access.

- [ ] **GESTURE-10**: Native action sheet for destructive confirmations
  - _Acceptance:_ Delete session confirmation uses native iOS action sheet (slides from bottom) via @capacitor/action-sheet on native. Falls back to existing Radix AlertDialog on web.
  - _Why:_ Native action sheet looks and feels right on iOS. Web-style modals feel foreign.

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
  - _Acceptance:_ Accent uses medium saturation OKLCH; not pure bright neon; no solid accent fields > 1cm^2 at max brightness.
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
- INFRA-01 through INFRA-10: Capacitor config, nginx proxy, CORS, WebSocket, cache headers, portable scripts, viewport meta -- all shipped.
- nginx dist symlink fix (2026-03-28) -- nginx now serves from src/dist via symlink
- CORS origin for port 8184 added to Express ALLOWED_ORIGINS (2026-03-28)

No new infrastructure requirements for v2.2.

---

## VERIFICATION & TESTING

All requirements verified with real device testing on iPhone 16 Pro Max (WKWebView, not web browser).

| Category | Count | Status | Notes |
|----------|-------|--------|-------|
| SCROLL | 10 | TBD | Jank elimination + infrastructure + validation (Phase 64) |
| TOUCH | 7 | TBD | Touch targets measured via code audit + real device (Phase 65) |
| TYPO | 8 | TBD | Font sizes and spacing audited via code review + device (Phase 66) |
| GESTURE | 10 | TBD | Gestures, lifecycle, share, native plugins (Phase 67) |
| VISUAL | 10 | TBD | Visual inspection on real device (Phase 68) |
| INFRA | 0 | DONE | All shipped in v2.1 + hotfixes |
| **TOTAL** | **45** | TBD | |

---

## Acceptance Criteria (Gate)

v2.2 ships when:

1. All 45 requirements marked complete with evidence
2. App tested on real iPhone 16 Pro Max for >=30 minutes
3. All touch targets measure >=44px in DevTools mobile mode
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
| Aurora WebGL overlay | GPU complexity; research needed | v2.4 "The Polish" |
| Offline-first sync | Network layer overhaul; post-MVP | v2.3+ |
| Dynamic island cutout optimization | Native plugin dev; deferred | v3.0+ |
| Voice input in composer | Capacitor Speech plugin; future | v2.3+ |
| App icon / splash screen polish | Design work; after core UX stable | v2.3+ |
| VoiceOver accessibility audit | Separate accessibility milestone | v2.3+ |

---

## Traceability Matrix

| Requirement | Phase | Status |
|-------------|-------|--------|
| SCROLL-01 | 64 | Pending |
| SCROLL-02 | 64 | Pending |
| SCROLL-03 | 64 | Pending |
| SCROLL-04 | 64 | Complete |
| SCROLL-05 | 64 | Complete |
| SCROLL-06 | 64 | Pending |
| SCROLL-07 | 64 | Pending |
| SCROLL-08 | 64 | Pending |
| SCROLL-09 | 64 | Complete |
| SCROLL-10 | 64 | Pending |
| TOUCH-01 | 65 | Pending |
| TOUCH-02 | 65 | Pending |
| TOUCH-03 | 65 | Pending |
| TOUCH-04 | 65 | Pending |
| TOUCH-05 | 65 | Pending |
| TOUCH-06 | 65 | Pending |
| TOUCH-07 | 65 | Pending |
| TYPO-01 | 66 | Pending |
| TYPO-02 | 66 | Pending |
| TYPO-03 | 66 | Pending |
| TYPO-04 | 66 | Pending |
| TYPO-05 | 66 | Pending |
| TYPO-06 | 66 | Pending |
| TYPO-07 | 66 | Pending |
| TYPO-08 | 66 | Pending |
| GESTURE-01 | 67 | Pending |
| GESTURE-02 | 67 | Pending |
| GESTURE-03 | 67 | Pending |
| GESTURE-04 | 67 | Pending |
| GESTURE-05 | 67 | Pending |
| GESTURE-06 | 67 | Pending |
| GESTURE-07 | 67 | Pending |
| GESTURE-08 | 67 | Pending |
| GESTURE-09 | 67 | Pending |
| GESTURE-10 | 67 | Pending |
| VISUAL-01 | 68 | Pending |
| VISUAL-02 | 68 | Pending |
| VISUAL-03 | 68 | Pending |
| VISUAL-04 | 68 | Pending |
| VISUAL-05 | 68 | Pending |
| VISUAL-06 | 68 | Pending |
| VISUAL-07 | 68 | Pending |
| VISUAL-08 | 68 | Pending |
| VISUAL-09 | 68 | Pending |
| VISUAL-10 | 68 | Pending |

**Coverage:**
- v2.2 requirements: 45 total (10 SCROLL + 7 TOUCH + 8 TYPO + 10 GESTURE + 10 VISUAL)
- INFRA: 0 new (all shipped in v2.1)
- Mapped: 45/45
- Unmapped: 0
- Phase 64: 10 reqs (SCROLL) | Phase 65: 7 reqs (TOUCH) | Phase 66: 8 reqs (TYPO) | Phase 67: 10 reqs (GESTURE) | Phase 68: 10 reqs (VISUAL)

---

*Requirements defined: 2026-03-28*
*Milestone: v2.2 "The Touch"*
*Target platform: iPhone 16 Pro Max, iOS 17+*
*Build system: Capacitor 7.6.1, Vite 7, React 19*
