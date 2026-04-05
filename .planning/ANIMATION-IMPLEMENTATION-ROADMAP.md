# Animation Implementation Roadmap
## Integrating Complete Motion Specification into Loom v4.0

**Date:** 2026-04-04  
**Status:** Planning document for Phase 75+ (Chat Shell)  
**Ownership:** Bard (design leadership) + Claude (engineering)  

---

## Why This Matters

The difference between "working" and "feels premium" is **exactly the motion**. Colors, layout, typography — users don't consciously notice these. But when a button press has no feedback, when text jumps instead of slides, when gestures feel sluggish — that breaks the illusion of a high-quality app.

ChatGPT iOS and Claude iOS feel exceptional because:
- Every tap has immediate haptic feedback
- Springs feel responsive, not sluggish
- Auto-scroll during streaming is transparent (you don't notice it working, it just works)
- Gestures have velocity tracking (swipe fast → immediate snap, swipe slow → springy bounce)

**Goal:** Loom's iOS app matches this feel within 6 months (Phases 75-80).

---

## Current State (Phase 76.1: Visual Foundation)

**Completed:**
- Color system overhaul (dark, high-contrast OKLCH)
- Typography hierarchy (SF Pro, 16px base)
- Composer glass UI with blur
- Spring physics constants defined (SNAPPY, BOUNCY, GENTLE, TIGHT)
- Haptics integration (4 events: send, tool complete, error, selection)
- Drawer navigation scaffolding

**Not yet implemented:**
- Streaming text auto-scroll throttling
- Thinking indicator animation (3-dot bounce)
- Message entry animations (slide+fade)
- Tool call stagger pattern
- Scroll-to-bottom button
- Error state animations (failed message, retry scale)
- Drawer spring physics with velocity tracking
- Long-press context menu haptics
- Reduced motion fallback system

---

## Phase 75 (Chat Shell): Motion Baseline

**Scope:** Implement streaming text, thinking indicator, basic message animations, send button feedback.

**Tasks (in order):**

### 75-01: Streaming Text & Auto-Scroll
**File:** `src/src/hooks/useStreamingAutoScroll.ts` (NEW)

**What:**
- Implement character-by-character text streaming (server-driven, no UI batching)
- Debounce auto-scroll calls to 300ms
- Detect user scroll-up, disable auto-scroll, re-enable when user returns to bottom

**Implementation:**
```typescript
export function useStreamingAutoScroll(isStreaming: boolean) {
  const flatListRef = useRef<FlatList>(null);
  const [userScrolledUp, setUserScrolledUp] = useState(false);

  const handleScroll = ({ nativeEvent: { contentOffset, contentSize, layoutMeasurement } }) => {
    const distanceFromEnd = contentSize.height - contentOffset.y - layoutMeasurement.height;
    setUserScrolledUp(distanceFromEnd > 100);
  };

  const scrollToBottom = useCallback(
    debounce(() => {
      if (!isStreaming || userScrolledUp) return;
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 300),
    [isStreaming, userScrolledUp]
  );

  // Trigger on new streaming text
  useEffect(() => {
    scrollToBottom();
  }, [streamingText]);

  return { flatListRef, handleScroll };
}
```

**Testing:**
- Verify scroll is smooth (200ms animation duration)
- Verify scroll stops when user scrolls up
- Verify scroll resumes when user returns to bottom
- No jank during rapid character updates

**Acceptance:**
- [ ] Messages stream character-by-character from server
- [ ] Auto-scroll is smooth and doesn't interrupt user reading
- [ ] Scroll throttling prevents excessive layout recalculations

---

### 75-02: Thinking Indicator (3-Dot Bounce)
**File:** `src/src/components/chat/ThinkingIndicator.tsx` (NEW)

**What:**
- 3-dot bounce animation, 600ms loop, 100ms stagger
- Disappears instantly when first character arrives
- Used before AssistantMessage text appears

**Implementation:**
```typescript
import Reanimated, { Easing, useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, withDelay } from 'react-native-reanimated';

const BOUNCE_SCALE = 1.3;
const DOT_DURATION = 300; // up 150ms + down 150ms
const DOT_STAGGER = 100;
const LOOP_DURATION = 600;

const AnimatedDot = ({ delay }: { delay: number }) => {
  const scale = useSharedValue(1);

  Reanimated.useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(BOUNCE_SCALE, { duration: 150, easing: Easing.ease }),
          withTiming(1, { duration: 150, easing: Easing.ease })
        ),
        -1,
        false
      )
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return <Reanimated.View style={[styles.dot, animStyle]} />;
};

export const ThinkingIndicator = () => (
  <View style={styles.container}>
    {[0, 1, 2].map((i) => (
      <AnimatedDot key={i} delay={i * DOT_STAGGER} />
    ))}
  </View>
);

const styles = StyleSheet.create({
  container: { flexDirection: 'row', gap: 4, paddingLeft: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ccc' },
});
```

**Testing:**
- Verify 3 dots bounce in sequence
- Verify loop timing is correct (600ms cycle)
- Verify dots are visible and sized correctly
- Verify disappears instantly when message text arrives

**Acceptance:**
- [ ] Thinking indicator appears before text streams
- [ ] Animation is smooth and not janky
- [ ] Indicator removes cleanly when first character arrives

---

### 75-03: Message Entry Animations
**Files:**
- `src/src/components/chat/UserBubble.tsx` (MODIFY)
- `src/src/components/chat/AssistantMessage.tsx` (MODIFY)
- `src/src/lib/animations.ts` (NEW — export spring configs)

**What:**
- User message: slide up 16dp + fade in, 250ms, easeOut
- Assistant message: fade in only, 150ms, easeInOut
- Spring config for easier tweaking

**Implementation:**

`animations.ts`:
```typescript
export const SPRING_SNAPPY = {
  damping: 24,
  mass: 1,
  stiffness: 300,
  overshootClamping: false,
};

export const SPRING_BOUNCY = {
  damping: 14,
  mass: 1,
  stiffness: 180,
  overshootClamping: false,
};

export const EASE_OUT_CUBIC = Easing.out(Easing.cubic);
```

`UserBubble.tsx`:
```typescript
import { SPRING_SNAPPY, EASE_OUT_CUBIC } from '@/lib/animations';

export function UserBubble({ text }: Props) {
  const translateY = useSharedValue(16);
  const opacity = useSharedValue(0);

  Reanimated.useEffect(() => {
    translateY.value = withTiming(0, { duration: 250, easing: EASE_OUT_CUBIC });
    opacity.value = withTiming(1, { duration: 250, easing: EASE_OUT_CUBIC });
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Reanimated.View style={animStyle}>
      {/* message bubble content */}
    </Reanimated.View>
  );
}
```

**Testing:**
- User message slides up smoothly and fades in
- Assistant message fades in without slide
- Timing is exactly 250ms and 150ms respectively
- Multiple messages don't interfere with each other

**Acceptance:**
- [ ] User messages enter with slide+fade
- [ ] Assistant messages enter with fade only
- [ ] No visual jank or stagger issues

---

### 75-04: Send Button Feedback
**File:** `src/src/components/chat/ChatComposer.tsx` (MODIFY)

**What:**
- Scale 1.0 → 0.92 on press, 100ms in
- Scale 0.92 → 1.0 on release, 150ms out with spring
- Opacity 1.0 → 0.8 during press
- Haptic Medium impact on press

**Implementation:**
```typescript
import { hapticImpact } from '@/lib/haptics';

export function SendButton({ onPress }: Props) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const handlePressIn = () => {
    hapticImpact('Medium');
    scale.value = withTiming(0.92, { duration: 100, easing: Easing.ease });
    opacity.value = withTiming(0.8, { duration: 100, easing: Easing.ease });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { ...SPRING_SNAPPY });
    opacity.value = withTiming(1, { duration: 150, easing: Easing.ease });
    onPress?.();
  };

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Reanimated.View style={animStyle}>
        {/* button icon */}
      </Reanimated.View>
    </Pressable>
  );
}
```

**Testing:**
- Button scales down on press, scales back with spring bounce
- Opacity transitions match timing
- Haptic fires at press start
- No flicker or visual artifacts

**Acceptance:**
- [ ] Send button has responsive feedback
- [ ] Haptic fires immediately on tap
- [ ] Spring recovery feels snappy (no sluggishness)

---

### 75-05: Composer Growth Animation
**File:** `src/src/components/chat/ChatComposer.tsx` (MODIFY)

**What:**
- Measure line count from TextInput
- Animate height changes: 150ms easeOut
- Min height: 44dp
- Max before scroll: 156dp (5 lines)
- Shrink instantly (snap) when empty

**Implementation:**
```typescript
const [height, setHeight] = useState(44);
const animatedHeight = useSharedValue(44);

const handleTextChange = (text: string) => {
  const lineCount = text.split('\n').length;
  const lineHeight = 28; // line-height in dp
  const newHeight = Math.min(44 + (lineCount - 1) * lineHeight, 156);
  
  if (newHeight !== height) {
    setHeight(newHeight);
    animatedHeight.value = withTiming(newHeight, {
      duration: 150,
      easing: Easing.out(Easing.cubic),
    });
  }
};

const handleClear = () => {
  setHeight(44);
  animatedHeight.value = 44; // snap to min height
};
```

**Testing:**
- Composer grows smoothly as text wraps
- Height changes are animated at 150ms
- Empty field snaps to 44dp (no animation)
- Internal scroll appears after 5 lines
- Keyboard avoidance is smooth

**Acceptance:**
- [ ] Composer height animates on text changes
- [ ] Clear field snaps to min height
- [ ] No layout jank during growth

---

### 75-06: Error State Animations (Failed Message)
**File:** `src/src/components/chat/MessageList.tsx` (MODIFY)

**What:**
- Failed message appears normally (slide+fade)
- After 300ms delay: "Failed to send" label fades in
- Retry button appears below label
- On retry: label fades out (150ms), message scales briefly (0.98→1.0)

**Implementation:**
```typescript
const FailedMessageLabel = ({ visible, onRetry }: Props) => {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(1);

  Reanimated.useEffect(() => {
    if (visible) {
      opacity.value = withDelay(
        300,
        withTiming(1, { duration: 200, easing: EASE_OUT_CUBIC })
      );
    }
  }, [visible]);

  const handleRetry = () => {
    opacity.value = withTiming(0, { duration: 150 });
    scale.value = withSequence(
      withTiming(0.98, { duration: 75 }),
      withTiming(1, { duration: 75 })
    );
    onRetry?.();
  };

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <>
      <Reanimated.Text style={animStyle}>Failed to send</Reanimated.Text>
      <Pressable onPress={handleRetry}>
        <Text>Retry</Text>
      </Pressable>
    </>
  );
};
```

**Testing:**
- Failed message appears with normal animation
- Label appears after 300ms delay
- Retry button is tappable
- Retry scales message briefly
- No overlapping animations

**Acceptance:**
- [ ] Failed messages show with delayed label
- [ ] Retry button feedback is clear
- [ ] Animation sequence is smooth

---

## Phase 76-77 (Navigation & Drawer): Gesture Animations

**Scope:** Implement drawer spring physics, scroll-to-bottom button, pull-to-refresh, long-press context menus.

### 76-01: Drawer Spring Physics with Velocity Tracking
**File:** `src/src/components/Drawer.tsx` (MODIFY)

**Implementation pattern:**
```typescript
const bind = useDrag(
  ({ movement: [mx], velocity: [vx], direction: [dx], active }) => {
    translateX.value = Math.max(-screenWidth, Math.min(0, -screenWidth + mx));

    if (!active) {
      if (Math.abs(mx) > 50 || Math.abs(vx) > 0.3) {
        // Open with velocity
        translateX.value = withSpring(0, { ...SPRING_BOUNCY });
      } else {
        // Close
        translateX.value = withSpring(-screenWidth, { ...SPRING_BOUNCY });
      }
    }
  },
  { axis: 'x' }
);
```

**Acceptance:**
- [ ] Swipe from left edge opens drawer (50dp threshold)
- [ ] Fast swipe (vx > 0.3) snaps open immediately
- [ ] Slow swipe bounces closed with spring
- [ ] Velocity tracking is responsive

---

### 76-02: Scroll-to-Bottom Button
**File:** `src/src/components/chat/ScrollToBottomButton.tsx` (NEW)

**Implementation pattern:**
```typescript
const show = contentSize.height - contentOffset.y - layoutHeight > 100;

const opacity = useSharedValue(0);
const scale = useSharedValue(0.8);

Reanimated.useEffect(() => {
  if (show) {
    opacity.value = withTiming(1, { duration: 200 });
    scale.value = withTiming(1, { duration: 200, easing: EASE_OUT_CUBIC });
  } else {
    opacity.value = withTiming(0, { duration: 150 });
  }
}, [show]);

const handlePress = () => {
  hapticSelection();
  flatListRef.current?.scrollToEnd({ animated: true });
};
```

**Acceptance:**
- [ ] Button appears when scrolled 200dp from bottom
- [ ] Button fades in (scale + opacity)
- [ ] Button taps scroll smoothly to bottom
- [ ] Haptic feedback on tap

---

### 76-03: Pull-to-Refresh Spinner
**File:** `src/src/components/chat/PullToRefreshSpinner.tsx` (NEW)

**Implementation pattern:**
```typescript
// Spinner rotates while pulling/refreshing
const rotation = useSharedValue(0);

Reanimated.useEffect(() => {
  if (isRefreshing) {
    rotation.value = withRepeat(
      withTiming(360, { duration: 600, easing: Easing.linear }),
      -1,
      false
    );
  } else {
    rotation.value = withTiming(0, { duration: 300 });
  }
}, [isRefreshing]);

const bind = useDrag(
  ({ movement: [, my], active }) => {
    if (my > 60 && !active) {
      // Trigger refresh
      triggerRefresh();
    }
  },
  { axis: 'y' }
);
```

**Acceptance:**
- [ ] Pull down > 60dp triggers refresh
- [ ] Spinner rotates during refresh
- [ ] Haptic on completion
- [ ] Snaps back to top when done

---

## Phase 78-80 (Final Polish): Advanced Animations

**Scope:** Tool call stagger, long-press haptics, reduced motion system, final spring tuning.

### 78-01: Tool Call Stagger Animation
**File:** `src/src/components/chat/ToolCallGroup.tsx` (MODIFY)

**Implementation pattern:**
```typescript
const toolCalls = response.toolCalls;

return (
  <>
    {toolCalls.map((tool, index) => (
      <ToolCallChip
        key={tool.id}
        tool={tool}
        enterDelay={index * 80} // +80ms per call
        shimmer={isExecuting}
      />
    ))}
  </>
);

function ToolCallChip({ tool, enterDelay, shimmer }: Props) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);

  Reanimated.useEffect(() => {
    opacity.value = withDelay(
      enterDelay,
      withTiming(1, { duration: 200, easing: EASE_OUT_CUBIC })
    );
    scale.value = withDelay(
      enterDelay,
      withTiming(1, { duration: 200, easing: EASE_OUT_CUBIC })
    );
  }, []);

  // Shimmer during execution (see shimmer implementation)
}
```

**Acceptance:**
- [ ] Tool calls appear with staggered animation
- [ ] Each call delays +80ms from previous
- [ ] Shimmer animation during execution
- [ ] No animation conflicts with text streaming

---

### 78-02: Reduced Motion System
**File:** `src/src/hooks/useAnimationDuration.ts` (NEW)

**Implementation:**
```typescript
export function useAnimationDuration() {
  const prefersReduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  return prefersReduced ? 50 : 250;
}

// Usage everywhere:
const duration = useAnimationDuration();
scale.value = withTiming(target, { duration, easing: ... });
```

**Testing:**
- [ ] All animations degrade to ~50ms with reduced motion
- [ ] Haptics still fire (separate guard)
- [ ] App remains fully functional
- [ ] No accessibility violations

---

### 78-03: Spring Tuning Session
**File:** `src/src/lib/animations.ts` (MODIFY)

**Process:**
1. Build app with current configs
2. Test on iPhone 13/14/15 (both 60Hz and 120Hz devices)
3. Gather feedback: "Does button feel snappy?" "Does drawer bounce too much?"
4. Adjust damping ±2 points at a time
5. Regenerate spring tokens via `generate-spring-tokens.mjs`
6. Re-test until feel is premium

**Acceptance:**
- [ ] Springs feel responsive (not sluggish)
- [ ] No excessive overshoot on snappy animations
- [ ] Bouncy animations feel playful, not chaotic
- [ ] 120Hz devices show noticeably smoother motion

---

## Success Criteria

### Phase 75 (Chat Shell): Motion Baseline
- [ ] Text streams smoothly, auto-scroll is seamless
- [ ] Thinking indicator is visible and loopable
- [ ] Message entries have consistent timing and easing
- [ ] Send button feedback is immediate
- [ ] Composer grows/shrinks smoothly
- [ ] Error states are visually clear

### Phase 76-77 (Navigation): Gesture Animations
- [ ] Drawer opens/closes with spring physics
- [ ] Swipes are velocity-aware
- [ ] Scroll-to-bottom button appears/disappears correctly
- [ ] Pull-to-refresh is responsive
- [ ] Long-press context menus have haptic feedback

### Phase 78-80 (Polish): Advanced + Tuning
- [ ] Tool calls have staggered entry animation
- [ ] Reduced motion mode degrades all animations gracefully
- [ ] All springs tuned for premium feel
- [ ] Device testing confirms smooth motion on both 60Hz and 120Hz

### Final: Gold Standard
- [ ] App feels as responsive and polished as ChatGPT iOS
- [ ] No animation jank or frame drops
- [ ] All interactions have haptic feedback
- [ ] Gesture recognition is instant and predictive
- [ ] Reduced motion mode is fully supported

---

## Resource Files

**Core implementation reference:**
- `.planning/INTERACTION-AND-ANIMATION-SPECIFICATION.md` — Complete spec (1217 lines)
- `.planning/phases/62-haptics-motion/62-RESEARCH.md` — Haptics architecture
- `.planning/phases/67-ios-native-gestures/67-RESEARCH.md` — Gesture patterns
- `.planning/phases/76.1-visual-foundation/VISUAL-CLONE-BRIEF.md` — UI baseline

**External references:**
- React Native Reanimated v3 docs (https://docs.swmansion.com/react-native-reanimated/)
- Gestures library (@use-gesture/react)
- iOS HIG (https://developer.apple.com/design/human-interface-guidelines/)

---

## Next Steps

1. **Phase 75-01 kickoff:** Implement streaming auto-scroll and thinking indicator
2. **Get device feedback:** Have swd or designer test with iPhone 13/14
3. **Iterate dampings:** Tune spring constants based on feel
4. **Batch testing:** Once 75% is done, test all gestures together
5. **Final polish:** 3-week tuning sprint before ship

---

**This roadmap is the creative direction. The spec is the implementation blueprint. Together they ship a premium motion experience.**

