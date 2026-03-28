# Device Validation Checklist -- v2.1 "The Mobile"

**Prerequisites** (per D-16):
- [ ] Mac with Xcode 16+ installed
- [ ] iPhone 16 Pro Max connected via USB
- [ ] Tailscale VPN active on both Mac and iPhone
- [ ] Server running at 100.86.4.57:5555 (verify: curl http://100.86.4.57:5555/health)
- [ ] Fresh build: `./scripts/cap-build.sh` completed successfully
- [ ] App deployed to device via Xcode (Build & Run)

## 1. Launch Flow (BUNDLE-04)
- [ ] App launches with dark splash screen (no white flash)
- [ ] Splash fades smoothly into app content (300ms fade, no jump)
- [ ] Status bar shows light text on dark background
- [ ] If NOT on VPN: splash hides after ~3s, shows "Server unreachable -- check Tailscale VPN" banner

## 2. Connection & Auth (BUNDLE-02, BUNDLE-03)
- [ ] On VPN: app connects and shows chat list within 2-3 seconds
- [ ] Auth bootstrap completes without errors (no blank screen)
- [ ] Toggling VPN off: ConnectionBanner appears with VPN-specific message
- [ ] Toggling VPN on: ConnectionBanner disappears, reconnects automatically
- [ ] Reconnect button in banner triggers reconnection attempt

## 3. Keyboard & Composer (KEY-01 through KEY-05)
- [ ] Tap composer text input: keyboard slides up smoothly
- [ ] Composer slides up with keyboard (no jank, no double-offset)
- [ ] Message list scrolls to show latest message when keyboard opens
- [ ] Type a message and send: message appears in list
- [ ] Dismiss keyboard (swipe down or tap outside): composer returns to rest position
- [ ] No black gap or layout jump when keyboard dismisses
- [ ] iOS "Done" button visible on keyboard accessory bar

## 4. Touch Targets (TOUCH-01 through TOUCH-05)
- [ ] Sidebar toggle button: easy to tap (44px+ target)
- [ ] Send button: in thumb zone, easy to tap
- [ ] Stop button (during streaming): in thumb zone, easy to tap
- [ ] Session list items: easy to tap, no mis-taps
- [ ] Settings toggles: easy to toggle (44px+ targets)
- [ ] Follow-up pills: easy to tap
- [ ] Radix menu items: 44px+ height

## 5. Safe Area & Layout (TOUCH-02)
- [ ] Top: status bar area not overlapped by content
- [ ] Bottom: home indicator area has proper spacing
- [ ] Left/Right: notch area (if applicable) respected
- [ ] Sidebar drawer: opens/closes smoothly, respects safe area
- [ ] No content hidden behind rounded corners

## 6. Gesture Navigation (TOUCH-04)
- [ ] Swipe from left edge: iOS back gesture works (if in navigable stack)
- [ ] Sidebar drawer: no conflict with iOS back swipe
- [ ] Horizontal scroll areas: scroll normally without triggering back gesture
- [ ] No accidental navigation when interacting with UI

## 7. Haptics (NATIVE-03)
- [ ] Send message: feel haptic feedback (medium impact)
- [ ] Tool call completes successfully: feel haptic notification (success)
- [ ] Connection error occurs: feel haptic notification (error)
- [ ] Model selector toggle: feel haptic impact (light)
- [ ] Quick settings toggle: feel haptic selection change
- [ ] No haptics when prefers-reduced-motion is enabled (Settings > Accessibility > Motion)

## 8. Motion & Springs (MOTION-01, MOTION-02)
- [ ] Sidebar open/close: spring animation feels snappy (not floaty)
- [ ] Tool cards expand/collapse: smooth spring animation
- [ ] Transitions feel responsive on ProMotion 120Hz display
- [ ] No visible jank or frame drops during animations
- [ ] Animations complete without lingering or bouncing excessively

## 9. Bundled Assets (BUNDLE-01, BUNDLE-02)
- [ ] App loads UI shell instantly (sub-second, from bundled assets)
- [ ] All three fonts render correctly: Inter (UI text), Instrument Serif (headings), JetBrains Mono (code)
- [ ] Icons and images load correctly (no broken images)
- [ ] CSS styles applied correctly (dark theme, correct colors)
- [ ] No 404 errors in Xcode console for asset loading

## 10. Full Flow Smoke Test
- [ ] Open app -> see session list -> tap session -> see messages
- [ ] Create new chat -> type message -> send -> receive response
- [ ] During streaming: see typing indicator, tool calls render, content streams in
- [ ] After response: follow-up pills appear (if applicable)
- [ ] Navigate between sessions: state preserved correctly
- [ ] Rotate device (if supported): layout adapts without breaking

## Sign-Off

| Area | Pass/Fail | Notes |
|------|-----------|-------|
| Launch Flow | | |
| Connection & Auth | | |
| Keyboard & Composer | | |
| Touch Targets | | |
| Safe Area & Layout | | |
| Gesture Navigation | | |
| Haptics | | |
| Motion & Springs | | |
| Bundled Assets | | |
| Full Flow | | |

**Tested by:** _______________
**Date:** _______________
**Device:** iPhone 16 Pro Max
**iOS Version:** _______________
**Build:** _______________
