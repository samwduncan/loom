# Complete Interaction & Animation Specification
## React Native iOS AI Chat App

**Based on:** ChatGPT iOS, Claude iOS, and Loom Phase research  
**Date:** 2026-04-04  
**Audience:** React Native developers (Reanimated v3, iOS 15+)  
**Deliverable:** Exact, implementable values for every animation

---

## 1. STREAMING TEXT BEHAVIOR

### Pattern Overview
Text streams character-by-character in ChatGPT and Claude iOS. No cursor visible—text simply appears at the end of the content with no animation. The visual "generation in progress" indicator is the thinking/loading state BEFORE text appears.

### 1.1 Text Appearance Rate

**ChatGPT iOS:**
- Appears character-by-character
- No batch grouping; every character rendered individually
- Rate: ~80-120ms per character (varies by token generation speed)
- No visual cursor or blinking caret
- Text color: same as complete text (no fade-in)

**Claude iOS:**
- Also character-by-character
- Slightly faster appearance (~50-100ms per character, more responsive)
- No caret

**Implementation:**
- DO NOT batch characters into word-sized chunks in the UI
- Call `setStreamingText(prev => prev + char)` on each token chunk from server
- Each setState will re-render; Reanimated.Text optimizes rendering
- Result: natural, organic character-by-character appearance without custom animation code

**Timing Values:**
- Stream delay (server transmission): typically 50-200ms per token (platform-dependent)
- Client rendering: negligible (<5ms per character in React)
- Perceived rate: client cannot control — follows server streaming speed

### 1.2 Visual Indicator That Generation Is In Progress

**Before first character appears:**
- Thinking/loading indicator (see Section 2)
- Takes precedence over any text

**During streaming:**
- Text continues appearing
- No cursor, no caret, no blinking line
- Content flows naturally downward as text accumulates

**At completion:**
- Indicator disappears
- Text stops accumulating
- Subtle visual fade of the last line (optional polish)

### 1.3 Scroll Following During Streaming

**ChatGPT iOS:**
- Auto-scrolls to bottom as text streams
- Smooth, continuous scrolling (not snapped)
- Behavior: if user has scrolled up into history, auto-scroll is disabled
- Re-enabled when user manually scrolls to bottom

**Claude iOS:**
- Similar behavior with slight delay (~300ms) before starting auto-scroll
- Prevents jank if user is still reading the previous message

**Implementation:**
```typescript
// Pseudo-code pattern
const scrollToBottom = useCallback(() => {
  flatListRef.current?.scrollToEnd({ animated: true });
}, []);

// Called on every new character (not ideal, throttle in production)
useEffect(() => {
  if (isStreaming && !userScrolledUp) {
    scrollToBottom();
  }
}, [streamingText]);
```

**Throttling Values:**
- Debounce scroll calls: 16ms (one frame at 60fps) — renders at most once per frame
- Auto-scroll delay after streaming starts: 300ms (optional, prevents premature scroll)
- Scroll animation duration: 200ms (mild easing, not jarring)
- Easing: `easeOut` cubic-bezier (0.25, 0.46, 0.45, 0.94)

### 1.4 Interruption Behavior

**When user or system interrupts streaming:**
- Text stops accumulating
- Loading indicator disappears immediately
- Last received text remains visible (no deletion)
- Optional: "Interrupted" label appears below message (2s timeout)

**Visual treatment of incomplete message:**
- Same opacity and color as complete messages
- Slightly smaller font or muted color for "Interrupted" badge (if shown)
- Retry button available

### 1.5 Accessibility: Reduced Motion

**When `prefers-reduced-motion: reduce`:**
- Text still appears character-by-character
- No change to fundamental behavior
- Auto-scroll still occurs (not a visual animation, it's navigation)

---

## 2. TYPING/LOADING INDICATOR

### 2.1 Visual Treatment

**ChatGPT iOS:**
- Three dots arranged horizontally
- Staggered bounce animation
- Positioned: left-aligned, same vertical position as where text will start
- Appears BEFORE first character (during thinking phase)
- Disappears immediately when first character arrives

**Claude iOS:**
- Similar three-dot bounce, slightly tighter
- More compact spacing between dots

### 2.2 Animation Details

**Bounce sequence:**
```
Dot 1: scale [1, 1.3, 1], opacity [1, 1, 1], duration: 600ms, loop infinite
Dot 2: same, delay: 100ms
Dot 3: same, delay: 200ms
```

**Exact Reanimated Implementation:**
```typescript
const Animated = Reanimated;

const AnimatedDot = ({ delay }: { delay: number }) => {
  const scale = Animated.useSharedValue(1);
  const opacity = Animated.useSharedValue(1);

  Animated.useEffect(() => {
    scale.value = Animated.withRepeat(
      Animated.withSequence(
        Animated.withTiming(1.3, { duration: 150, easing: Easing.ease }),
        Animated.withTiming(1, { duration: 150, easing: Easing.ease }),
      ),
      -1,
      false,
      Animated.withDelay(delay, Animated.withRepeat(...))
    );
  }, []);

  const animStyle = {
    transform: [{ scale }],
  };
  return <Animated.View style={animStyle} />;
};

export const ThinkingIndicator = () => (
  <View style={{ flexDirection: 'row', gap: 4 }}>
    <AnimatedDot delay={0} />
    <AnimatedDot delay={100} />
    <AnimatedDot delay={200} />
  </View>
);
```

**Duration breakdown:**
- Individual dot animation: 300ms total (150ms up, 150ms down)
- Stagger between dots: 100ms delay
- Cycle repeats every ~600ms (300ms + next dot's start)

**Position:**
- Margin-left: 4px (slight indent from message text)
- Vertical: same baseline as text that will follow
- Size: 6-8dp diameter per dot

### 2.3 Appearance Timing

- Appears: Immediately when server response starts (before first token)
- Disappears: Instantly when first character is received
- No fade-out transition (binary on/off)

### 2.4 Positioning Relative to Message Bubble

**For assistant messages (unbubbled):**
- Thinking indicator sits on its own line
- Once text arrives, indicator is replaced by text
- No overlap

**For error states:**
- Thinking indicator may reappear if retry is triggered
- Clear visual separation

---

## 3. MESSAGE ANIMATIONS

### 3.1 User Message Entry

**Animation:**
- Slide up from bottom + fade in (simultaneous)
- Duration: 250ms
- Easing: `easeOut` cubic-bezier (0.25, 0.46, 0.45, 0.94)
- Opacity: 0 → 1
- Transform: translateY(16dp) → translateY(0)
- Spring fallback: `damping: 14, mass: 1, overshootClamping: true`

**Trigger:** Immediately after send button tap, before API call

**Stagger:** If multiple messages sent rapidly, each has independent animation (no stagger between them)

### 3.2 Assistant Message Entry

**Animation:**
- Fade in (no slide)
- Duration: 150ms
- Easing: `easeInOut` cubic-bezier (0.42, 0, 0.58, 1)
- Opacity: 0 → 1
- No translateY (message appears in place)

**Timing relative to thinking indicator:**
1. Thinking indicator visible (0-800ms or longer, depends on model latency)
2. First character arrives → indicator disappears, text fades in
3. Text streams character-by-character

**Note:** No "message bubble" animation — the entire message container fades in with its first character

### 3.3 Tool Call Display

**Pattern:** Tool calls appear as separate visual "chips" within the assistant message

**Animation:**
- Each tool call: individual fade-in + scale
- Opacity: 0 → 1, duration: 200ms
- Scale: 0.9 → 1, duration: 200ms
- Easing: `easeOut` cubic-bezier (0.25, 0.46, 0.45, 0.94)
- Stagger: +80ms delay between each tool call

**Example sequence:**
```
T=0:     Text starts streaming
T=200:   First tool call appears (scale 0.9→1, fade in)
T=280:   Second tool call appears (delay 80ms)
T=360:   Third tool call appears (delay 80ms)
T=400+:  Text continues streaming
```

**During execution:**
- Tool call background: shimmer animation (see Section 2 for shimmer pattern)
- Shimmer duration: 1.5s loop until completion

### 3.4 Completion State Transition

**When streaming ends:**
- All pending animations complete naturally
- No additional fade or scale transition
- Message is "done" — no visual change

**Visual feedback that streaming is complete:**
- Thinking indicator is gone
- No shimmer on tool calls (they're done executing)
- Retry button appears (if there was an error) or disappears (if success)

---

## 4. SEND BUTTON & COMPOSER

### 4.1 Button Press Feedback

**Visual response to tap:**
- Scale: 1.0 → 0.92 during touch
- Opacity: 1.0 → 0.8 during touch
- Color: secondary → secondary-dark (subtly darker)
- Duration: 100ms in, 150ms out (spring recovery)
- Easing: `easeOut` cubic-bezier

**Haptic:**
- Fire-and-forget `hapticImpact('Medium')` immediately on press
- No haptic on release

**Reanimated implementation:**
```typescript
const AnimatedButton = React.forwardRef<any, ButtonProps>(
  ({ onPress, ...props }, ref) => {
    const scale = Animated.useSharedValue(1);
    const opacity = Animated.useSharedValue(1);

    const handlePressIn = () => {
      scale.value = Animated.withTiming(0.92, { duration: 100 });
      opacity.value = Animated.withTiming(0.8, { duration: 100 });
    };

    const handlePressOut = () => {
      scale.value = Animated.withSpring(1, {
        damping: 14,
        mass: 1,
        stiffness: 300,
      });
      opacity.value = Animated.withTiming(1, { duration: 150 });
      onPress?.();
    };

    return (
      <Animated.View
        ref={ref}
        style={{ transform: [{ scale }], opacity }}
        onTouchStart={handlePressIn}
        onTouchEnd={handlePressOut}
      >
        {/* button content */}
      </Animated.View>
    );
  }
);
```

### 4.2 Text Clearing

**Timing:**
- Clear input field immediately after send (0ms delay)
- User sees the field become empty instantly
- No transition animation (visual clarity that message was sent)

**Height reduction:**
- Composer shrinks back to min height (44dp) with animation
- Duration: 200ms
- Easing: `easeOut` cubic-bezier
- Simultaneous with other composer adjustments

### 4.3 Composer Growth

**Text input grows vertically as user types:**

**Default state:**
- Min height: 44dp (single line)
- Padding: 12dp vertical, 16dp horizontal
- Font size: 16px (prevents iOS auto-zoom)

**Growth thresholds:**
- 2 lines: 72dp height
- 3 lines: 100dp height
- 4 lines: 128dp height
- 5+ lines: 156dp height (max before internal scroll)

**Animation on growth:**
- Duration: 150ms
- Easing: `easeOut` cubic-bezier (0.25, 0.46, 0.45, 0.94)
- Trigger: `onChangeText` event, debounced at 50ms

**Shrinking (when text is deleted):**
- Reverse animation: 150ms, `easeOut`
- When field is empty: snap instantly to 44dp (no animation) — faster feel

**Internal scroll of text:**
- When text exceeds 5 lines (156dp), TextInput becomes scrollable internally
- Scroll appears automatically (no animation)
- Max height (including keyboard avoidance): 60% of screen height

### 4.4 Keyboard Avoidance

**Pattern:**
- Composer slides up smoothly with keyboard
- Timing: synchronous with keyboard appearance (iOS native)
- No additional delay or jerky adjustment
- Safe area respected (notch/Dynamic Island clearance)

**Implementation:**
- Use `KeyboardAvoidingView` with `behavior: 'padding'`
- `keyboardVerticalOffset: 70` (measured safe area + status bar)
- Alternatively: listen to `Keyboard.addListener('keyboardWillShow')` for custom timing

**Example:**
```typescript
<KeyboardAvoidingView
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  keyboardVerticalOffset={insets.bottom + 70}
>
  <Composer />
</KeyboardAvoidingView>
```

### 4.5 Send Button Visibility

**When input is empty:**
- Button is semi-transparent (opacity: 0.5)
- Still tappable (disabled state?)
- Optional: completely hidden and replaced with attachment/action button

**When input has text:**
- Button fully opaque (opacity: 1.0)
- Enabled
- Transition between states: 150ms fade

**Send button rotation (optional polish):**
- Icon can rotate 45° to indicate "submit" vs "action menu"
- Duration: 200ms
- Easing: `easeOut` cubic-bezier

---

## 5. DRAWER/SIDEBAR

### 5.1 Open Animation

**Trigger:** Swipe from left edge (50dp threshold) or tap hamburger menu

**Animation:**
- Slide from left: `translateX(-100%) → translateX(0)`
- Duration: 300ms
- Easing: **spring** (`damping: 12, stiffness: 100`)
- Simultaneous: backdrop fades in (see 5.2)

**Reanimated implementation with swipe:**
```typescript
const translateX = Animated.useSharedValue(-screenWidth);

const bind = useDrag(({ movement: [mx], velocity: [vx], direction: [dx] }) => {
  if (dx < 0) return; // only left-to-right swipe
  
  translateX.value = Math.max(-screenWidth, Math.min(0, -screenWidth + mx));
  
  if (!active) {
    // Release: decide to open or close
    if (mx > 50 || vx > 0.5) {
      // Open
      translateX.value = Animated.withSpring(0, {
        damping: 12,
        stiffness: 100,
      });
    } else {
      // Close
      translateX.value = Animated.withSpring(-screenWidth, {
        damping: 12,
        stiffness: 100,
      });
    }
  }
});

<Animated.View style={{ transform: [{ translateX }] }}>
  {/* drawer content */}
</Animated.View>
```

### 5.2 Backdrop Dimming

**Pattern:**
- Fade in/out (not animated state)
- Color: `rgba(0, 0, 0, 0.4)` (40% black overlay)
- Duration: 300ms (simultaneous with drawer slide)
- Easing: `easeInOut` cubic-bezier (0.42, 0, 0.58, 1)

**Tap-to-close:**
- Tapping backdrop triggers close animation
- Duration: 250ms
- Easing: same spring as drawer close

### 5.3 Close Gestures

**Swipe-to-close (from drawer left edge):**
- Gesture: drag from drawer content rightward (20dp threshold to close)
- Velocity threshold: > 0.3 px/ms
- Snap-back physics: spring with `damping: 12, stiffness: 100`
- Duration: ~250-350ms depending on velocity and distance

**Tap backdrop:**
- Instant close with 250ms spring animation

**Back button (Android):**
- Not applicable on iOS
- On Android: close drawer on back press (using React Navigation)

### 5.4 Session Switch

**Visual pattern:**
- Drawer remains open during session switch
- Selected session item highlights immediately (no animation)
- Chat content updates below drawer (message list scrolls to top)
- Optional: fade out old messages, fade in new messages (150ms fade)

**Timing:**
- Session highlight: instant
- Message fade: 150ms easeInOut
- No drawer animation (stays open)

**User experience:**
- User taps session → highlight appears immediately
- Content updates smoothly while drawer is still visible
- User can close drawer when ready

### 5.5 New Chat Creation

**Animation:**
- Drawer item for new session appears at top (slide from top or fade in)
- Duration: 200ms
- Easing: `easeOut` cubic-bezier
- Auto-select the new session (highlight)
- Auto-close drawer (trigger close animation, duration: 300ms)

---

## 6. SCREEN TRANSITIONS

### 6.1 Push Navigation (React Navigation Stack)

**iOS default behavior:**
- Slide right → left (next screen pushes from right)
- Duration: 500ms (iOS standard)
- Easing: `easeOut` cubic-bezier (custom curve, not linear)
- Simultaneous: back swipe enabled (edgeSwipeEnabled: true)
- Back gesture: snap to full-screen close if > 30% swiped, or bounce back

**Configuration:**
```typescript
<Stack.Navigator
  screenOptions={{
    cardStyle: { backgroundColor: 'transparent' },
    cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
    transitionSpec: {
      open: TransitionSpecs.TransitionIOSSpec,
      close: TransitionSpecs.TransitionIOSSpec,
    },
    gestureEnabled: true,
    gestureDirection: 'horizontal',
  }}
>
  {/* screens */}
</Stack.Navigator>
```

**Header animation:**
- Title fades in/out during transition
- Back button appears simultaneously
- Duration: 300ms (slightly faster than screen)

### 6.2 Modal Presentation (Expo Router Modals)

**Animation:**
- Slide up from bottom (vertical)
- Duration: 350ms
- Easing: `easeOut` cubic-bezier
- Backdrop appears simultaneously with 300ms fade
- Border radius: 20px at top corners (iOS 16+ sheet style)

**Reanimated sheet implementation:**
```typescript
const translateY = Animated.useSharedValue(height);

Animated.useEffect(() => {
  translateY.value = Animated.withSpring(0, {
    damping: 13,
    mass: 1,
    stiffness: 95,
  });
}, []);

return (
  <Animated.View
    style={{
      transform: [{ translateY }],
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
    }}
  >
    {/* modal content */}
  </Animated.View>
);
```

### 6.3 Sheet Presentations (Tool Details, Settings)

**Animation (same as modal above):**
- Slide up from bottom with spring physics
- Duration: 350ms
- Spring: `damping: 13, stiffness: 95`
- Backdrop: `rgba(0, 0, 0, 0.3)` with 300ms fade in

**Drag-to-dismiss:**
- Drag from sheet top downward: gesture zones (top 60dp)
- Threshold: 30% of sheet height or velocity > 0.5 px/ms
- On dismiss: slide back down, spring animation

**Snapping:**
- Sheet can snap to 3 positions: collapsed (40%), halfway (70%), expanded (90%)
- Snapping velocity: > 0.5 px/ms
- Snap animation: 250ms spring

---

## 7. SCROLL PHYSICS

### 7.1 Deceleration Rate

**iOS native default:**
- `decelerationRate: 0.998` (very slow deceleration)
- Translates to: content coasts for 1-2 seconds after swipe
- Matches UIScrollView default

**For chat list (FlatList):**
```typescript
<FlatList
  decelerationRate={0.998}
  scrollIndicatorInsets={{ right: 1 }}
/>
```

### 7.2 Bounce Behavior

**At top edge:**
- Overshoot: ~20-40dp
- Easing out: ~400ms
- Spring effect: user can see content "bounce back"

**At bottom edge:**
- Same: ~20-40dp overshoot
- Duration: ~400ms
- Natural iOS feel

**Implementation:**
- Built into FlatList (default behavior)
- No custom configuration needed
- `bounces: true` (default)

### 7.3 Scroll-to-Bottom Button

**Appearance:**
- Fades in when user scrolls up (away from bottom)
- Positioned: 20dp from bottom-right corner
- Button: 48dp × 48dp rounded circle
- Icon: chevron down (single arrow)

**Animation in:**
- Opacity: 0 → 1, duration: 200ms
- Scale: 0.8 → 1, duration: 200ms
- Easing: `easeOut` cubic-bezier
- Trigger: when `contentOffset.y < scrollViewHeight - 200`

**Animation out:**
- Opacity: 1 → 0, duration: 150ms
- Trigger: when user scrolls to bottom OR taps button
- No scale-down animation (fade only)

**On tap:**
- Scroll to bottom: 250ms animated scroll, `easeOut` cubic-bezier
- Button fades out during scroll
- Haptic: `hapticSelection()` (subtle tick)

### 7.4 Auto-Scroll During Streaming

**Behavior:**
- When new message is streaming, auto-scroll to bottom continuously
- Smooth, non-jerky scrolling
- If user manually scrolls up, auto-scroll pauses
- Resumes when user scrolls back to bottom (within 100dp of end)

**Implementation:**
```typescript
useEffect(() => {
  if (isStreaming && !userScrolledUp) {
    const scrollInterval = setInterval(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 300); // throttle: every 300ms
    return () => clearInterval(scrollInterval);
  }
}, [isStreaming, userScrolledUp]);
```

**Scroll animation details:**
- Duration: 200ms per auto-scroll call
- Easing: `easeOut` cubic-bezier
- Throttle interval: 300ms (prevent excessive scrolls)

### 7.5 Keyboard Dismiss on Scroll

**Pattern:**
- Tapping in chat (on messages) dismisses keyboard
- Scrolling (gesture while keyboard visible) dismisses keyboard
- Composer remains visible (doesn't dismiss with keyboard)

**Implementation:**
```typescript
<FlatList
  keyboardShouldPersistTaps="handled"
  keyboardDismissMode="on-drag"
/>
```

---

## 8. ERROR & FEEDBACK STATES

### 8.1 Failed Message Display

**Visual treatment:**
- Message appears in message list (same as successful message)
- Below message: "Failed to send" label in red/destructive color
- Retry button: tappable, below the failure label

**Animation entry:**
- Message enters with same animation as normal message (slide up + fade)
- Failure label fades in 300ms after message appears
- Easing: `easeOut` cubic-bezier

**Timing:**
- Message appears first (0ms)
- Failure label appears: +300ms delay

### 8.2 Retry Button Behavior

**Position:** Below the failed message, right-aligned (or inline with failure label)

**Visual:**
- Button text: "Retry" with optional refresh icon
- Color: accent/primary

**On tap:**
- Message re-sends
- Failure label disappears (150ms fade out)
- Thinking indicator appears briefly (if response is streamed)
- Haptic: `hapticSelection()`

**Retry animation:**
- Failure label fades out: 150ms, easeOut
- Message scales up slightly (0.98 → 1.0) to indicate re-sending
- Duration: 150ms, easeOut

### 8.3 Network Disconnection Banner

**Position:** Top of chat list (sticky)

**Visual:**
- Background: destructive/error color (`rgba(220, 60, 50, 0.1)`)
- Text: "Disconnected" or "No connection"
- Icon: wifi-off or antenna icon
- Height: 40dp

**Appearance animation:**
- Slide down from top: `translateY(-100%) → translateY(0)`
- Duration: 250ms
- Easing: `easeOut` cubic-bezier
- Backdrop: slight shadow to separate from list

**Dismissal:**
- Auto-dismiss on reconnect (fade out, 200ms)
- Manual close: swipe up or tap X (if provided)

**Implementation:**
```typescript
<Animated.View
  style={{
    transform: [{ translateY: isConnected ? -100 : 0 }],
    opacity: isConnected ? 0 : 1,
  }}
>
  <DisconnectionBanner />
</Animated.View>
```

### 8.4 Permission Request

**Pattern:**
- Appears as banner or inline alert in message list
- For media uploads, microphone access, etc.

**Visual:**
- Container: inline banner (not modal)
- Button: "Allow" and "Deny"
- Background: informational color (`rgba(59, 130, 246, 0.1)`)

**Animation:**
- Slide in from top: 250ms, `easeOut` cubic-bezier
- Backdrop: subtle shadow

**On grant/deny:**
- Banner slides out (250ms, `easeOut`)
- Callback triggers (upload proceeds or is canceled)

### 8.5 Tool Call Error

**Visual difference from success:**
- Tool call chip background: error red instead of success green
- Icon: X instead of checkmark
- Text: error message appears below chip (small, secondary text)

**Animation:**
- Tool executes (shimmer): 1.5s loop
- On error: shimmer stops, red background fades in (150ms)
- Error text fades in below chip (200ms)
- Haptic: `hapticNotification('Error')`

**Retry on tool error:**
- Button appears below tool call: "Retry"
- Same behavior as message retry (see 8.2)

### 8.6 Haptic Patterns for Feedback

**Impact feedback (send button, destructive actions):**
- Type: `hapticImpact('Medium')`
- No animation needed (purely haptic)
- Fire-and-forget (no await)

**Notification feedback:**
- Success: `hapticNotification('Success')` (upward chirp)
- Error: `hapticNotification('Error')` (downward chirp)
- Warning: `hapticNotification('Warning')` (two-part pattern)
- Fire-and-forget

**Selection feedback:**
- Toggle/switch: `hapticSelection()` (subtle tick)
- Picker change: `hapticSelection()`
- Drawer open/close: optional `hapticSelection()`

**Reduced motion:**
- All haptics respect `prefersReducedMotion()` guard
- On watch/accessibility mode: haptics are silent (no-op)
- App continues functioning, just without haptics

---

## 9. BACKGROUND & AMBIENT EFFECTS

### 9.1 Gradient Backgrounds

**Main chat view background:**
- Single color (no gradient): `rgb(21, 22, 25)` (nearly black)
- No animation (static)

**Optional: Empty state gradient (first-time user):**
- Subtle radial gradient: center light, edges darker
- Very low opacity (5-10%)
- Easing: radial, 400px radius
- Non-intrusive, mostly black background

**Implementation:**
```typescript
<LinearGradient
  colors={['rgba(59, 130, 246, 0.05)', 'rgba(21, 22, 25, 1)']}
  start={{ x: 0.5, y: 0 }}
  end={{ x: 0.5, y: 1 }}
  style={{ flex: 1 }}
>
  {/* content */}
</LinearGradient>
```

### 9.2 Noise Texture (Optional)

**Subtle grain overlay:**
- Very faint (opacity: 2-3%)
- Applied to entire background
- PNG or SVG pattern, tiled
- Does NOT animate (static)

**Decision:** Consider skipping for native (performance on older devices). Web version uses CSS mix-blend-mode.

### 9.3 Particle Effects (Optional Polish)

**First-time greeting screen:**
- Small animated particles (dots)
- Very subtle fade in/out
- Duration: 2-3s per particle lifecycle
- Floating upward slowly
- Maximum 5-8 particles visible at once

**Pattern:**
- Opacity: 0 → 0.4 → 0 over 2.5s
- Scale: 1 → 1.2 (very subtle)
- `translateY`: 0 → -100dp (float upward)
- Easing: `easeOut` cubic-bezier

**Note:** Highly optional, consider impact on battery. Skip if app is performance-sensitive.

### 9.4 Glass/Frosted Effects

**Composer background:**
- `BlurView` with intensity 80-90 (iOS native blur)
- Background color: `rgba(255, 255, 255, 0.08)` (semi-transparent over blur)
- No animation on blur intensity (static)

**Sheet headers (tool details):**
- `BlurView` with intensity 70
- Used to blur content behind top header in modal sheets

**Message selection/highlight:**
- Slight tint overlay (not glass, just color)
- Duration: 150ms fade in/out

### 9.5 Ambient Changes During Streaming

**During AI generation:**
- Background: no change (static)
- Optional: very subtle pulse on message container (not recommended — too distracting)

**After streaming completes:**
- Background: no change
- All visual indicators reset (no ambient animation)

**Recommendation:** Keep background completely static. Ambient animation is rarely used in premium apps (ChatGPT, Claude avoid it).

---

## 10. MICRO-INTERACTIONS

### 10.1 Button Press Feedback

**Standard button (not send button):**
- Scale: 1.0 → 0.95 during press
- Opacity: 1.0 → 0.9 during press
- Duration in: 80ms
- Duration out: 120ms
- Easing: `easeOut` cubic-bezier
- Haptic: `hapticSelection()` on release (not press)

**High-confidence buttons (primary, accent):**
- Scale: 1.0 → 0.92 (slightly more pronounced)
- Opacity: 1.0 → 0.85
- Same timing and haptics

**Disabled buttons:**
- No scale/opacity change on press (visually disabled)
- No haptic

### 10.2 List Item Press Feedback

**Session item in sidebar:**
- Background: subtle highlight (opacity increase of overlay)
- Duration: 100ms in, 150ms out (when user lifts finger)
- No scale change (prevents scroll jank)
- Highlight color: `rgba(255, 255, 255, 0.1)`

**Message long-press:**
- Context menu appears (see Section 5 for ContextMenu animation)
- Message background: slight tint (optional, 100ms fade in)
- Haptic: `hapticImpact('Light')` on long-press detection (500ms hold)

### 10.3 Toggle Animations

**Settings toggle (on/off switch):**
- Thumb slide: duration 200ms, `easeOut` cubic-bezier
- Background color fade: simultaneous with thumb
- Haptic: `hapticSelection()` on state change

**Drawer menu toggle items:**
- Same pattern (if toggle within drawer)

### 10.4 Pull-to-Refresh Spinner

**Spinner component:**
- Rotation: 0° → 360°, looping
- Duration per rotation: 600ms
- Easing: linear (constant rotation speed)
- During pull: spinner color fades in (opacity 0 → 1)
- On release: spinner continues rotating until refresh completes

**Trigger:**
- Pull distance: > 60dp downward
- Velocity threshold: optional (if pulled slowly, requires full distance)
- Snap-to-refresh: if released after threshold, trigger refresh immediately

**Completion:**
- Spinner fades out: 200ms, easeOut
- Banner slides out: 300ms with spring

### 10.5 Long-Press Detection & Feedback

**Long-press timing:**
- Activation: 500ms hold (iOS standard)
- Haptic: `hapticImpact('Light')` at 500ms mark (user feels the long-press activate)
- Context menu: appears simultaneously or 50ms after haptic

**Visual feedback during long-press:**
- Message background: subtle tint (0.05 opacity increase)
- Opacity fade-in: 250ms (gradual as user holds)

**Cancellation:**
- If user moves finger > 10-15dp, long-press is canceled
- Background tint fades out (150ms)
- Context menu doesn't appear

### 10.6 Copy Confirmation

**After user taps "Copy" on message:**
- Haptic: `hapticNotification('Success')`
- Visual: Checkmark appears (or brief toast message)
- Duration: 1.5s
- Animation: checkmark scales in (0.8 → 1.0, 150ms)
- Fade out: after 1.5s, 200ms fade

**Toast message (alternative):**
- Text: "Copied to clipboard"
- Position: center-top or bottom (consistent with app)
- Duration: 2s visible, then 200ms fade out
- Animation in: scale 0.8 → 1.0 + fade 0 → 1, 150ms
- Animation out: fade 1 → 0, 200ms

---

## 11. SPRING PHYSICS REFERENCE (IMPLEMENTABLE REANIMATED CONFIGS)

### Predefined Spring Configs

```typescript
// Tight, snappy feel (button bounces)
export const SPRING_SNAPPY = {
  damping: 24,      // tuned 15-20% higher for tighter overshoot
  mass: 1,
  stiffness: 300,
  overshootClamping: false,
};

// Bouncy, playful feel (drawer open, modals)
export const SPRING_BOUNCY = {
  damping: 14,      // tuned 15-20% higher
  mass: 1,
  stiffness: 180,
  overshootClamping: false,
};

// Gentle, smooth feel (fades, scroll to bottom)
export const SPRING_GENTLE = {
  damping: 16,
  mass: 1,
  stiffness: 120,
  overshootClamping: true,
};

// Super tight, no overshoot (list highlights, critical UI)
export const SPRING_TIGHT = {
  damping: 20,
  mass: 1,
  stiffness: 400,
  overshootClamping: true,
};
```

### Easing Curves (CSS linear() format)

These are generated by `generate-spring-tokens.mjs` and should be applied to CSS transitions when possible (Reanimated automatically uses these on iOS).

```css
/* Snappy: fast in, elastic out */
--ease-snappy: linear(0, 0.03, 0.07, 0.12 12%, 0.19, 0.27, 0.36, 0.47, 0.59 33%, 
  0.71, 0.78 42%, 0.83 46%, 0.86, 0.88 54%, 0.89, 0.89 63%, 0.89, 0.88 72%, 
  0.85, 0.82 79%, 0.78, 0.74, 0.7, 0.65, 0.61, 0.58 100%);

/* Bouncy: relaxed, playful */
--ease-bouncy: linear(0, 0.05, 0.1 3%, 0.2, 0.31 7%, 0.46, 0.63 13%, 0.83, 
  1 19%, 0.95, 0.92 23%, 0.89, 0.88 28%, 0.89, 0.93 34%, 0.99 39%, 1 43%);

/* Gentle: minimal overshoot */
--ease-gentle: linear(0, 0.06, 0.14, 0.24 10%, 0.36, 0.48 17%, 0.6, 0.71 26%, 
  0.81, 0.89 37%, 0.96, 1 48%);

/* Tight: no overshoot, immediate settle */
--ease-tight: linear(0, 0.1, 0.22 8%, 0.36, 0.52 16%, 0.68, 0.82 26%, 0.92, 1);
```

---

## 12. SUMMARY TABLE (QUICK REFERENCE)

| Interaction | Duration | Easing | Haptic | Notes |
|-------------|----------|--------|--------|-------|
| Streaming text | 50-200ms/char | (no animation) | — | Character-by-character, server-driven |
| Thinking indicator | 600ms loop | ease-bounce | — | 3-dot stagger, 100ms apart |
| User message in | 250ms | easeOut | — | Slide up + fade simultaneous |
| Assistant message in | 150ms | easeInOut | — | Fade only |
| Tool call appearance | 200ms + 80ms stagger | easeOut | — | Scale 0.9→1, fade in |
| Send button press | 100ms in, 150ms out | easeOut spring | Medium impact | Scale 0.92, opacity 0.8 |
| Composer grow | 150ms | easeOut | — | Per text line |
| Composer shrink (empty) | 0ms (instant) | — | — | Clear feel |
| Drawer open | 300ms | spring bouncy | — | Swipe or tap trigger |
| Drawer close | 250-300ms | spring bouncy | — | Swipe or tap backdrop |
| Modal slide up | 350ms | spring | — | From bottom, 20px radius top |
| Sheet drag-to-dismiss | variable | spring | — | Velocity + distance threshold |
| Scroll-to-bottom button in | 200ms | easeOut | Selection | Scale 0.8→1, fade in |
| Scroll-to-bottom button out | 150ms | easeOut | — | Fade only |
| Failed message label | 300ms delay, then fade | easeOut | — | Appears after message |
| Retry button tap | 150ms | easeOut | Selection | Label fades, message scales |
| Disconnect banner in | 250ms | easeOut | — | Slide down from top |
| Disconnect banner out | 200ms | easeOut | — | Fade on reconnect |
| Permission banner in | 250ms | easeOut | — | Slide from top |
| Permission banner out | 250ms | easeOut | — | Slide up on grant/deny |
| Copy confirmation | 1.5s visible, 200ms fade | easeOut | Success notification | Checkmark or toast |
| Long-press detection | 500ms hold | — | Light impact | Tint fades in over 250ms |
| Context menu appear | 150ms | easeOut | — | Radix native, no custom animation |
| Toggle switch | 200ms | easeOut | Selection | Thumb slides + color fades |
| List item highlight | 100ms in, 150ms out | easeOut | — | No scale (prevent jank) |

---

## 13. ACCESSIBILITY & REDUCED MOTION

### prefers-reduced-motion: reduce

**Applied globally:**
```typescript
const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

// Fallback all durations to instant or 50ms
const duration = prefersReducedMotion ? 50 : 250;
```

**What changes:**
- All spring animations → linear easing, 50ms duration
- Fade durations remain (not a motion, just opacity)
- No scale/translate on reduced motion
- Haptics still fire (haptics aren't animations)

**What doesn't change:**
- Text streaming (still character-by-character)
- Functional animations (scroll, drawer, keyboard)
- Auto-scroll during streaming
- Haptic feedback (respect haptics separately via `prefersReducedMotion()` guard)

**Implementation:**
```typescript
const animDuration = useAnimationDuration(); // returns 250 or 50

scale.value = Animated.withTiming(0.92, {
  duration: animDuration,
  easing: animDuration === 50 ? Easing.linear : Easing.out(Easing.cubic),
});
```

---

## 14. PLATFORM NOTES

### iOS-Specific (ProMotion 120Hz)

**Enable in Info.plist:**
```xml
<key>CADisableMinimumFrameDurationOnPhone</key>
<true/>
```

**Effect:**
- CSS compositor animations render at 120fps (if device supports it)
- Reanimated animations benefit automatically
- No code changes needed
- Spring physics remain frame-rate independent

**Testing:**
- iPhone 13 Pro, 14 Pro, 15 Pro: 120Hz enabled
- iPhone 12, 13, 14, 15: 60Hz only
- Animations look smoother on ProMotion but curve is identical

### React Native (Reanimated v3)

**Key pattern:**
```typescript
import Reanimated, { Easing, useSharedValue, useAnimatedStyle, withTiming, withSpring } from 'react-native-reanimated';

const scale = useSharedValue(1);
const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

// Trigger animation
scale.value = withTiming(0.92, { duration: 100, easing: Easing.out(Easing.cubic) });

return <Reanimated.View style={animStyle} />;
```

**FlatList optimization:**
```typescript
<FlashList
  estimatedItemSize={400}
  decelerationRate={0.998}
  scrollIndicatorInsets={{ right: 1 }}
  keyboardDismissMode="on-drag"
/>
```

---

## 15. VALIDATION CHECKLIST

- [ ] All animations are spring-based or eased, never linear bounces
- [ ] Haptics fire on release/completion, not on press (except send button)
- [ ] Reduced motion is tested (all animations degrade to <100ms instant)
- [ ] Scroll-to-bottom button appears only when > 200dp from end
- [ ] Drawer swipe threshold is 50dp, velocity threshold > 0.3 px/ms
- [ ] Composer max height is 156dp before internal scroll (5 lines)
- [ ] Text streaming is character-by-character from server, not batched in UI
- [ ] Auto-scroll during streaming is throttled (300ms minimum between calls)
- [ ] Send button haptic fires before text is cleared (visual feedback first)
- [ ] Tool calls have stagger animation (+80ms per call)
- [ ] Failed messages show after 300ms delay (not instant)
- [ ] Keyboard avoidance uses `keyboardVerticalOffset: 70`
- [ ] All springs use damping values tuned +15-20% from reference
- [ ] BlurView is used only on Composer and Modal headers, not everywhere
- [ ] Backdrop dimming is `rgba(0, 0, 0, 0.4)` (40% black)
- [ ] Long-press activation is 500ms (iOS standard)
- [ ] Copy feedback shows for 1.5s then fades 200ms
- [ ] Context menus use Radix ContextMenu (not custom)
- [ ] Swipe-to-delete is mobile-only (< 768px width)
- [ ] Pull-to-refresh threshold is > 60dp pull distance

---

## 16. NEXT STEPS FOR IMPLEMENTATION

1. **Create `/src/lib/animations.ts`** — Export all spring configs and easing helpers
2. **Create `/src/hooks/useAnimationDuration.ts`** — Reducer motion hook
3. **Audit existing animations** — Measure durations, apply standard configs
4. **Test on device** — Verify springs feel responsive, not sluggish
5. **Gather feedback** — Ask designers: does it feel premium?
6. **Iterate damping values** — Fine-tune based on device testing

---

**Generated for Loom v4.0 Phase 75+**  
**Reference: ChatGPT iOS, Claude iOS, Loom Phase 62 (Haptics), Phase 67 (Gestures), Phase 76.1 (Visual)**
