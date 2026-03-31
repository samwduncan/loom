/**
 * ScrollToBottomPill -- glass pill that appears when scrolled up from bottom.
 *
 * Per D-22: Glass surface, accent text, bounces once on appearance with Standard
 * spring. Tapping animates scroll to bottom, pill fades out (100ms).
 *
 * Per anti-pattern #11: Micro spring press feedback on tap.
 * Positioned absolutely at bottom-center of message area, above composer.
 */

import { useCallback } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  FadeInDown,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { ChevronDown } from 'lucide-react-native';
import { GlassSurface } from '../primitives/GlassSurface';
import { ACCENT } from '../../lib/colors';
import { SPRING } from '../../lib/springs';

interface ScrollToBottomPillProps {
  visible: boolean;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ScrollToBottomPill({ visible, onPress }: ScrollToBottomPillProps) {
  const scale = useSharedValue(1);

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.9, SPRING.micro);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, SPRING.micro);
  }, [scale]);

  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeInDown
        .springify()
        .damping(20)
        .stiffness(150)
        .mass(1.0)}
      exiting={FadeOut.duration(100)}
      style={styles.container}
    >
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={scaleStyle}
      >
        <GlassSurface
          intensity={50}
          className="rounded-full"
          style={styles.pill}
        >
          <ChevronDown size={20} color={ACCENT} strokeWidth={2.5} />
        </GlassSurface>
      </AnimatedPressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    zIndex: 10,
  },
  pill: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
});
