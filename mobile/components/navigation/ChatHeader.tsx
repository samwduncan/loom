/**
 * ChatHeader -- navigation header with hamburger icon and title.
 *
 * Structure:
 * - Left: hamburger icon (opens drawer via navigation.openDrawer)
 * - Center: title text (default "New Chat")
 * - Right: empty spacer to balance layout
 *
 * Safe area: paddingTop set to insets.top so content clears Dynamic Island/notch.
 * Uses Lucide Menu icon (expo-symbols requires native build context).
 */

import { Text, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, type DrawerNavigationProp } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Menu } from 'lucide-react-native';

import { theme } from '../../theme/theme';
import { createStyles } from '../../theme/createStyles';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ChatHeaderProps {
  title?: string;
}

export function ChatHeader({ title = 'New Chat' }: ChatHeaderProps) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<DrawerNavigationProp<any>>();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleHamburgerPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.openDrawer();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
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
        <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
          {title}
        </Text>

        {/* Spacer to balance hamburger */}
        <View style={styles.spacer} />
      </View>
    </View>
  );
}

const styles = createStyles((t) => ({
  container: {
    backgroundColor: t.colors.surface.base,
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
  spacer: {
    width: 44,
    height: 44,
  },
}));
