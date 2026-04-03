/**
 * AnimatedScreen -- parallax wrapper that shifts content 20px right
 * when the drawer opens.
 *
 * Uses useDrawerProgress from @react-navigation/drawer to get the
 * drawer's 0-1 progress value, then interpolates to a 0-20px translateX.
 *
 * NOTE: drawerType 'slide' already shifts the scene container. This wrapper
 * adds an ADDITIONAL 20px parallax on top of that, creating depth/layering.
 */

import { type PropsWithChildren } from 'react';
import Animated, { useAnimatedStyle, interpolate } from 'react-native-reanimated';
import { useDrawerProgress } from '@react-navigation/drawer';

export function AnimatedScreen({ children }: PropsWithChildren) {
  const progress = useDrawerProgress();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [0, 20]) },
    ],
  }));

  return (
    <Animated.View style={[{ flex: 1 }, animatedStyle]}>
      {children}
    </Animated.View>
  );
}
