/**
 * ChatHeader -- glass navigation header with hamburger icon, title, and model indicator.
 *
 * Structure:
 * - Left: hamburger icon (opens drawer via navigation.openDrawer)
 * - Center: title text (default "New Chat")
 * - Right: model indicator (D-12) -- shows current model name from stream store
 *
 * Glass treatment (D-04):
 * - expo-blur BlurView intensity 40, dark tint
 * - Overlay rgba(0,0,0,0.35)
 * - Bottom border 1px border-subtle
 * - Absolutely positioned with zIndex 10 so content scrolls under
 *
 * CRITICAL: ChatHeader must render AFTER dynamic content (FlatList) in the DOM
 * tree for expo-blur to properly update its blur. ChatScreen handles this by
 * rendering ChatHeader after the content View.
 *
 * Safe area: paddingTop set to insets.top so content clears Dynamic Island/notch.
 * Uses Lucide Menu icon (expo-symbols requires native build context).
 */

import { StyleSheet, Text, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, type DrawerNavigationProp } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Menu } from 'lucide-react-native';

import { haptic } from '../../lib/haptics';
import { theme } from '../../theme/theme';
import { createStyles } from '../../theme/createStyles';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ChatHeaderProps {
  title?: string;
  modelName?: string;
}

export function ChatHeader({ title = 'New Chat', modelName }: ChatHeaderProps) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<DrawerNavigationProp<any>>();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleHamburgerPress = () => {
    haptic.tap();
    navigation.openDrawer();
  };

  return (
    <View style={[styles.glassContainer, { paddingTop: insets.top }]}>
      <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill}>
        <View style={styles.glassOverlay} />
      </BlurView>
      <View style={styles.headerRow}>
        {/* Hamburger button */}
        <AnimatedPressable
          onPressIn={() => {
            scale.value = withSpring(0.97, theme.springs.micro);
          }}
          onPressOut={() => {
            scale.value = withSpring(1, theme.springs.micro);
          }}
          onPress={handleHamburgerPress}
          style={[styles.hamburgerButton, animatedStyle]}
          accessibilityLabel="Open navigation"
          accessibilityRole="button"
        >
          <Menu
            size={24}
            color={theme.colors.text.secondary}
            strokeWidth={2}
          />
        </AnimatedPressable>

        {/* Title */}
        <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail" maxFontSizeMultiplier={1.3}>
          {title}
        </Text>

        {/* Model indicator (D-12) — tappable for future dropdown */}
        <Pressable hitSlop={8} accessibilityRole="button" accessibilityLabel="Model selector">
          <Text style={styles.modelIndicator} numberOfLines={1}>
            {modelName ?? ''}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = createStyles((t) => ({
  glassContainer: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    overflow: 'hidden' as const,
    // No bottom border — glass blur defines the edge
  },
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  headerRow: {
    height: 56,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: t.spacing.xs,
  },
  hamburgerButton: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  title: {
    ...t.typography.heading,
    color: t.colors.text.primary,
    flex: 1,
    textAlign: 'center' as const,
  },
  modelIndicator: {
    ...t.typography.caption,
    color: t.colors.text.muted,
    maxWidth: 80,
  },
}));
