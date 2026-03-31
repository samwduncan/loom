/**
 * ScrollToBottomPill -- glass pill that appears when scrolled up from bottom.
 *
 * Per D-22: Glass surface, accent text, bounces once on appearance with Standard
 * spring. Tapping animates scroll to bottom, pill fades out (100ms).
 *
 * Positioned absolutely at bottom-center of message area, above composer.
 */

import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  FadeInDown,
  FadeOut,
} from 'react-native-reanimated';
import { ChevronDown } from 'lucide-react-native';
import { GlassSurface } from '../primitives/GlassSurface';
import { ACCENT } from '../../lib/colors';

interface ScrollToBottomPillProps {
  visible: boolean;
  onPress: () => void;
}

export function ScrollToBottomPill({ visible, onPress }: ScrollToBottomPillProps) {
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
      <Pressable onPress={onPress}>
        <GlassSurface
          intensity={50}
          className="rounded-full"
          style={styles.pill}
        >
          <ChevronDown size={20} color={ACCENT} strokeWidth={2.5} />
        </GlassSurface>
      </Pressable>
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
