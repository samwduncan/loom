# Interaction Gaps Addendum — Complete Specification

**Date:** 2026-04-05
**Sources:** Bard (2 research passes) + current codebase audit
**Purpose:** Fill every remaining gap not covered by VISUAL-CLONE-BRIEF.md or INTERACTION-AND-ANIMATION-SPECIFICATION.md

---

## 1. Gesture Conflicts

**Problem:** `swipeEdgeWidth: width` (full screen) conflicts with iOS system back gesture (15-20px edge zone).

**Reference apps:**
- ChatGPT: prioritizes drawer (conflicts with system back — worse UX)
- Claude: respects iOS HIG — system back wins in edge zone, wider zone for drawer

**Implementation:**
```typescript
// In drawer _layout.tsx screenOptions:
swipeEdgeWidth: 35,  // Leave 15-20px for iOS system back gesture
swipeEnabled: true,   // Or conditionally: routes.length === 1
```

**Current state:** `swipeEdgeWidth: width` — needs to change to 35.

---

## 2. Keyboard Behavior

**Problem:** Using `KeyboardAvoidingView` which is janky. No `keyboardDismissMode` on message list.

**Reference apps:** Both use interactive keyboard dismissal. ChatGPT: keyboard only pushes content if user is at bottom.

**Implementation:**
- Install `react-native-keyboard-controller` (Private Mind reference already uses it)
- Replace `KeyboardAvoidingView` with `KeyboardProvider` + `KeyboardAwareScrollView` or `keyboardLiftBehavior="whenAtEnd"`
- Add to MessageList/FlashList: `keyboardDismissMode="interactive"`
- Tap outside composer: `Keyboard.dismiss()` handler on message area

**Current state:** KeyboardAvoidingView only. No dismiss-on-scroll. No interactive dismiss.

---

## 3. Text Selection

**Problem:** Assistant message text not selectable (only code block output in ToolDetailSheet).

**Reference apps:**
- Claude: native iOS inline selection (handles + loupe) — better approach
- ChatGPT: custom selection modal on long-press

**Implementation:**
- `TextSegment`: already has `selectable={!isStreaming}` — GOOD
- Verify selection works on device with proper handles
- Selection cannot cross message boundaries (iOS limitation) — acceptable
- Add custom selection menu: Copy, Share (via `ActionSheetIOS` or `UIMenuController`)

**Current state:** TextSegment partially selectable. Needs device verification.

---

## 4. Copy Behavior

**Problem:** Only code blocks have copy. No full-message copy. No format spec.

**Reference apps:**
- Code copy: plain text only, **excludes language label**
- Full message copy: markdown format
- Confirmation: icon toggles to checkmark for 2s, NO toast for code copy
- Claude: 2-3s toast for non-code copy

**Implementation:**
- Code block copy: already works (`expo-clipboard`). Remove language label from copied text if included.
- Add long-press → Copy on full messages (via zeego context menu or ActionSheetIOS)
- Copy confirmation: toggle icon to checkmark for 2s (current "Copied" text toggle is close)
- Clipboard format: always plain text

**Current state:** CodeBlockSegment copy works. No message-level copy. No context menu.

---

## 5. Font Strategy

**Problem:** Inter requires font loading (potential FOUT). ChatGPT and Claude both use SF Pro (system font).

**Reference apps:** Both use system fonts for message text. Zero font loading delay.

**Recommendation (Bard):** Use SF Pro (system) for body text, keep Inter for headings/brand only.
- Saves ~50KB bundle
- Eliminates font loading delay entirely
- Matches platform convention

**Implementation:**
```typescript
// In theme.ts typography:
body: { fontFamily: undefined, ... }     // undefined = system font (SF Pro on iOS)
heading: { fontFamily: 'Inter-SemiBold', ... }  // Keep Inter for brand headings
caption: { fontFamily: undefined, ... }  // System font
```

**Alternative:** Keep Inter everywhere but ensure `SplashScreen.preventAutoHideAsync()` gates on font load (already partially implemented in `_layout.tsx`).

**Current state:** All text uses Inter. Font loading via `useFonts` in `_layout.tsx`.

---

## 6. Splash Screen

**Problem:** No splash screen configured. `app.json` splash is empty `{}`.

**Reference apps:**
- ChatGPT: logo on dark bg, ~1s before content
- Claude: breathing fade on parchment bg

**Implementation:**
```json
// app.json:
"splash": {
  "image": "./assets/splash.png",
  "resizeMode": "contain",
  "backgroundColor": "#0F0F10"  // Match IDLE_BG
}
```
- Create splash image: Loom logo (centered, white on near-black)
- Use `SplashScreen.preventAutoHideAsync()` in _layout.tsx (already present)
- Hide after fonts loaded + first render: `SplashScreen.hideAsync()` in `onLayout`

**Current state:** No splash config. App shows white/default screen on cold launch.

---

## 7. First-Run Experience

**Problem:** No onboarding. Empty state is bare (24px icon + "How can I help?").

**Reference apps:**
- ChatGPT: "How can I help you today?" + 2x2 suggestion grid
- Claude: personalized greeting "How can I help you today, [Name]?" + pill suggestions

**Implementation:**
- Already improving empty state (bigger icon, greeting, suggestion chips from brief item #41-44)
- First-run detection: check MMKV flag `hasLaunchedBefore`
- First visit: show personalized greeting with time-based salutation
- Suggestion chips: 4-6 contextual prompts ("Code review", "Bug fix", "Research", "Explain this code")
- No heavy onboarding — minimalist is correct for a dev tool

**Current state:** Basic empty state. No first-run detection.

---

## 8. Markdown Rendering on Mobile

**Problem:** Tables and wide code blocks may overflow on 390px screens.

**Reference apps:** Both use horizontal scroll for tables and wide code.

**Implementation:**
- Tables: wrap in `<ScrollView horizontal>` — need to override markdown renderer's table rule
- Code blocks: already has horizontal `ScrollView` in CodeBlockSegment — GOOD
- Links: ensure 44pt minimum tap target via `hitSlop` or padding on link elements
- Nested lists: verify indentation doesn't push content off-screen
- LaTeX: not needed for v1 (dev tool, not academic)

**Current state:** CodeBlockSegment handles horizontal scroll. Tables untested. Link tap targets unverified.

---

## 9. Reduce Motion / Accessibility

**Problem:** No Reduce Motion detection. No Dynamic Type support.

**Reference apps:** Both respect Reduce Motion. Claude excels at Dynamic Type.

**Implementation:**
```typescript
// Reanimated 3+ built-in:
withSpring(targetValue, {
  ...theme.springs.standard,
  reduceMotion: ReduceMotion.System,  // Automatically degrades
});

// Or global detection:
import { AccessibilityInfo } from 'react-native';
const [reduceMotion, setReduceMotion] = useState(false);
useEffect(() => {
  AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
  return () => sub.remove();
}, []);
```

**Dynamic Type:** Add `allowFontScaling={true}` (default) and `maxFontSizeMultiplier={1.3}` to prevent extreme scaling breaking layout.

**VoiceOver focus order:** Header → Messages (newest first) → Composer. Verify with VoiceOver on device.

**Current state:** No Reduce Motion. No maxFontSizeMultiplier. accessibilityRole/Label present on buttons.

---

## 10. Status Bar & System Chrome

**Problem:** Status bar is `style="light"` always. No contextual changes.

**Reference apps:** Status bar toggles with drawer/modal context.

**Implementation:**
- Keep `style="light"` for dark mode (correct)
- Consider: when drawer opens, status bar stays light (drawer bg is dark too) — no change needed
- Modal presentations: expo-router handles status bar for modals automatically
- Home indicator: add `autoHideHomeIndicator: true` to screen options for chat screen (fades during streaming)

**Current state:** `StatusBar style="light"` in root layout. Adequate for dark-only app.

---

## 11. Performance Targets

| Metric | Target | How to measure |
|--------|--------|---------------|
| FPS during streaming | 60fps (120fps on ProMotion) | React DevTools profiler or `CADisplayLink` |
| Cold start time | <2s to interactive | Stopwatch from tap to content |
| Memory (100 msgs) | <150MB | Xcode Instruments |
| Bundle size | <100MB (cellular download limit is 200MB) | `eas build` output |
| FlashList vs FlatList | FlashList: 5-10x fewer re-renders | Profile with `onViewableItemsChanged` counter |

**Implementation:**
- FlashList: `estimatedItemSize={400}`, `drawDistance={250}`
- ProMotion: add `CADisableMinimumFrameDurationOnPhone: true` to Info.plist
- Bundle: audit with `npx expo-optimize` and `npx react-native-bundle-visualizer`

**Current state:** FlatList (not FlashList). No ProMotion opt-in. No performance measurement.

---

## 12. Persistence & Recovery

**Problem:** Composer text not explicitly persisted. Scroll restoration may jump.

**Reference apps:** Both preserve composer text per-chat and restore scroll smoothly.

**Implementation:**
- Composer text: save to MMKV on each keystroke (debounced 500ms), keyed by sessionId
- Restore on session switch: `setText(mmkv.getString(`draft_${sessionId}`) ?? '')`
- Clear on send (already done)
- Scroll restoration: already saving offset to MMKV. Ensure `initialScrollIndex` is set before first render (not after) to avoid jump.
- App killed during streaming: D-28 interrupted snapshot already handles this. Verify visual indicator shows "Interrupted" text.

**Current state:** Scroll offset saved/restored via MMKV. Composer text NOT persisted. D-28 interrupted snapshot exists.

---

## Summary: Additional Changes (beyond the 67 in VISUAL-CLONE-BRIEF)

| # | Change | Priority | Files |
|---|--------|----------|-------|
| 68 | `swipeEdgeWidth: 35` (not full width) | HIGH | `_layout.tsx` |
| 69 | `keyboardDismissMode="interactive"` on message list | HIGH | `MessageList.tsx` |
| 70 | Install + wire `react-native-keyboard-controller` | HIGH | `chat/[id].tsx`, `Composer.tsx` |
| 71 | Splash screen config in app.json + asset | HIGH | `app.json`, `assets/splash.png` |
| 72 | Splash gate on font load (preventAutoHide) | HIGH | `_layout.tsx` |
| 73 | Long-press context menu on messages (copy) | MEDIUM | `AssistantMessage.tsx`, `UserBubble.tsx` |
| 74 | Code copy excludes language label | MEDIUM | `CodeBlockSegment.tsx` |
| 75 | `maxFontSizeMultiplier={1.3}` on key Text components | MEDIUM | Multiple |
| 76 | `reduceMotion: ReduceMotion.System` on all springs | MEDIUM | Multiple |
| 77 | Composer text draft persistence (MMKV) | MEDIUM | `Composer.tsx` |
| 78 | Suggestion chips in empty state | MEDIUM | `EmptyChat.tsx` |
| 79 | First-run detection + personalized greeting | LOW | `EmptyChat.tsx` |
| 80 | ProMotion opt-in (Info.plist) | LOW | `app.json` |
| 81 | Home indicator auto-hide during streaming | LOW | `_layout.tsx` |
| 82 | Font strategy decision: SF Pro body vs Inter everywhere | DECISION | `theme.ts` |

**Total changes: 82** (67 visual + 15 interaction/platform)

---

## Dependencies to Install (updated)

| Package | Purpose | Priority |
|---------|---------|----------|
| `@shopify/flash-list` | Streaming performance | CRITICAL |
| `react-native-keyboard-controller` | Proper keyboard avoidance | HIGH |
| `zeego` | Native context menus | MEDIUM |
