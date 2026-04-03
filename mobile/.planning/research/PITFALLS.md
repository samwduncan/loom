# Domain Pitfalls: AI Chat iOS App

**Domain:** AI Chat Mobile App (React Native + Expo)
**Researched:** 2026-04-02

## Critical Pitfalls

Mistakes that cause rewrites, major performance issues, or UX disasters.

### Pitfall 1: Inverted FlatList Performance Collapse
**What goes wrong:** Using `<FlatList inverted />` for bottom-aligned chat causes 30-40 FPS drops on Android, especially with long messages or RTL text. Reanimated entering/exiting animations break because items render upside-down then flip via CSS transform.
**Why it happens:** Inverted FlatList applies `transform: [{scaleY: -1}]` to the container AND each item. Every frame requires transform calculation. Android's rendering pipeline handles this worse than iOS.
**Consequences:** Janky scrolling on Android. Animation bugs (items appear to fly in from wrong direction). Pull-to-refresh triggers from wrong end. Pagination scroll direction is confusing.
**Prevention:** Use legend-list with `alignItemsAtEnd: true` and `maintainScrollAtEnd: true`. Written in pure TypeScript with no native dependencies. Handles bottom-alignment without CSS transform tricks.
**Detection:** FPS drops visible in React DevTools Profiler. Users report "laggy scrolling" on Android.
**Sources:** https://github.com/facebook/react-native/issues/35341, https://github.com/facebook/react-native/issues/30034

### Pitfall 2: Keyboard Avoidance Fighting
**What goes wrong:** KeyboardAvoidingView with wrong `behavior` prop or hardcoded offset causes: content jumping instead of smooth push, composer hiding behind keyboard, or excessive white space above keyboard.
**Why it happens:** iOS needs `behavior="padding"`, Android often needs `behavior="height"` or none. Tab bar height, navigation header height, and safe area insets all affect the offset. Different for every device form factor.
**Consequences:** Users can't see what they're typing. Composer input is behind keyboard. Content jumps jarringly on keyboard open/close. Different behavior per device.
**Prevention:** Use `react-native-keyboard-controller` which handles cross-platform keyboard behavior identically. Its `KeyboardChatScrollView` or `KeyboardAvoidingView` with `behavior="translate-with-padding"` is purpose-built for chat.
**Detection:** Test on multiple device sizes. Test with hardware keyboard connected (should not push content). Test landscape orientation.
**Sources:** https://kirillzyusko.github.io/react-native-keyboard-controller/, https://docs.expo.dev/guides/keyboard-handling/

### Pitfall 3: Gifted Chat Lock-In
**What goes wrong:** Adopting react-native-gifted-chat seems like a shortcut (14.4k stars! complete chat UI!) but every customization requires fighting the library. No streaming support. Person-to-person messaging assumptions baked in everywhere.
**Why it happens:** Gifted chat was designed for WhatsApp/iMessage-style messaging: two-party conversation, read receipts, avatars on both sides, typing indicators from remote users. AI chat has fundamentally different patterns: one-sided streaming, markdown rendering, tool use display, code blocks.
**Consequences:** Endless `renderBubble`, `renderMessage`, `renderInputToolbar` overrides. Performance issues from fighting the internal FlatList (which is inverted). Can't integrate streaming markdown. Eventually, more code is custom overrides than library code.
**Prevention:** Build composable: legend-list + custom MessageBubble + custom Composer. More initial work, total control, no fighting.
**Detection:** If you find yourself overriding more than 3 render methods in gifted-chat, you've made the wrong choice.

### Pitfall 4: Streaming Markdown Re-render Storm
**What goes wrong:** Updating message state on every streaming token causes the entire message list to re-render, dropping frames.
**Why it happens:** If the streaming message is stored in the same state array as all other messages, every token update triggers list re-render. React's reconciler can't diff fast enough at 20-50 tokens/second.
**Consequences:** UI freezes during streaming. Scroll becomes choppy. Battery drain.
**Prevention:** 
1. Store streaming content in a separate ref (not state) -- already in Loom's web architecture.
2. Use `useRef` + `requestAnimationFrame` to batch token updates to 60fps.
3. Only commit final message to state when streaming completes.
4. Memoize non-streaming message bubbles (`React.memo`).
**Detection:** Profile with React DevTools. Watch for MessageBubble re-renders during streaming.

## Moderate Pitfalls

### Pitfall 5: Auto-Growing Input Without Max Height
**What goes wrong:** TextInput grows without limit as user types long messages, pushing chat content off screen entirely.
**Prevention:** Set `maxHeight = lineHeight * maxRows` (e.g., `24 * 6 = 144px`). After max, TextInput becomes internally scrollable. GAIA UI uses maxRows: 8 as default.

### Pitfall 6: Empty State Inversion Bug
**What goes wrong:** With inverted FlatList, the empty state component also renders inverted (upside down). Gifted chat users report this frequently (Issue #1557).
**Prevention:** legend-list with `alignItemsAtEnd` doesn't invert, so empty state renders correctly. Or use `ListEmptyComponent` with legend-list.

### Pitfall 7: Scroll-to-Bottom Races with Streaming
**What goes wrong:** Auto-scroll and user-scroll fight each other during streaming. User scrolls up to read, auto-scroll yanks them back down on next token.
**Prevention:** Track whether user has scrolled away from bottom. Only auto-scroll if user is at bottom (within threshold, e.g., 20px). Show "scroll to bottom" button when scrolled away. Resume auto-scroll only when user taps the button or scrolls back to bottom.

### Pitfall 8: Reanimated + New Architecture Performance Regression
**What goes wrong:** After enabling React Native New Architecture (default in Expo SDK 53+), Reanimated animations show FPS drops with many animated components during scrolling.
**Prevention:** Use React Native 0.80+ and Reanimated 4.2.0+. Verify Loom's Expo SDK 54 + RN 0.81 is compatible. Test animation performance on device before committing to complex entering animations on every message.
**Sources:** https://docs.swmansion.com/react-native-reanimated/docs/guides/performance/

### Pitfall 9: react-native-keyboard-controller Expo Crash
**What goes wrong:** Some users report app crashes after installing react-native-keyboard-controller with Expo 52. Specifically when combined with gifted-chat (Issue #2595).
**Prevention:** We're on Expo SDK 54, which should be past this. But: test in isolation before integrating. Don't combine with gifted-chat (which we're not using anyway). Check react-native-keyboard-controller releases for Expo 54 compat notes.
**Sources:** https://github.com/FaridSafi/react-native-gifted-chat/issues/2595

## Minor Pitfalls

### Pitfall 10: Send Button Without Debounce
**What goes wrong:** Fast double-tap sends same message twice.
**Prevention:** Disable send button immediately on press. Re-enable after message is committed to store.

### Pitfall 11: TextInput Focus Loss on Keyboard Dismiss
**What goes wrong:** Tapping outside the TextInput dismisses keyboard, but next tap on TextInput requires two taps (one to focus, one to place cursor).
**Prevention:** Use `keyboardShouldPersistTaps="handled"` on the scroll container.

### Pitfall 12: Missing `keyExtractor` on Message List
**What goes wrong:** Without stable keys, list items re-render on every data change. Animations replay. Performance degrades.
**Prevention:** Use message ID as key. For streaming messages, use session ID + "streaming" as stable key.

### Pitfall 13: Haptic Feedback Without Accessibility Check
**What goes wrong:** Haptics fire even when user has "Reduce Motion" or haptics disabled in iOS settings.
**Prevention:** Check `AccessibilityInfo.isReduceMotionEnabled` before haptics. Already in Soul doc motion rules.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| List component migration | legend-list v2 compatibility with Expo SDK 54 | Test in isolation first. Pure TS = no native module issues expected |
| Keyboard handling | Controller library + Expo crash risk | Version pin, test on device before deep integration |
| Message animations | Reanimated + New Arch perf regression | Use RN 0.81 + Reanimated 4.2+, profile on device |
| Composer redesign | Auto-grow input + keyboard avoidance interaction | Test with hardware keyboard, different device sizes |
| Streaming rendering | Re-render storm during token streaming | useRef + rAF pattern (already proven in Loom web) |
| Empty state | Suggestion chips must handle variable text lengths | Use FlexWrap or ScrollView for chips, test with long suggestions |
| Drawer polish | Gesture conflicts between drawer swipe and back swipe | Test iOS edge-swipe-back + drawer swipe thresholds |

## Sources

- RN inverted FlatList issues: https://github.com/facebook/react-native/issues/35341
- FlashList v2 chat regression: https://github.com/Shopify/flash-list/issues/1844
- Gifted chat empty state inversion: https://github.com/FaridSafi/react-native-gifted-chat/issues/1557
- Keyboard controller Expo crash: https://github.com/FaridSafi/react-native-gifted-chat/issues/2595
- Reanimated performance: https://docs.swmansion.com/react-native-reanimated/docs/guides/performance/
- legend-list: https://github.com/LegendApp/legend-list
