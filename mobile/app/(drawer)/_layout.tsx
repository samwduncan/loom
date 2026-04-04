/**
 * Drawer layout -- the primary navigation container for the app.
 *
 * Uses expo-router/drawer (wraps @react-navigation/drawer) with:
 * - drawerType: 'slide' -- both drawer and content shift together
 * - Full-width swipe area (swipeEdgeWidth = screen width)
 * - Custom DrawerContent with session list, branding, and connection status
 * - Overlay at rgba(0,0,0,0.4)
 *
 * NOTE: @react-navigation/drawer v7 uses hardcoded spring physics internally
 * (stiffness 1000, damping 500, mass 3). The Soul doc's drawer spring
 * (damping 20, stiffness 100, mass 1.0) cannot be configured via props --
 * it would require patching the drawer-layout source. The built-in spring
 * still provides smooth feel. The parallax wrapper (AnimatedScreen) adds
 * the 20px extra shift using the drawer's progress value.
 */

import { Drawer } from 'expo-router/drawer';
import { useWindowDimensions } from 'react-native';
import { DrawerContent } from '../../components/navigation/DrawerContent';
import { haptic } from '../../lib/haptics';
import { theme } from '../../theme/theme';

export default function DrawerLayout() {
  const { width } = useWindowDimensions();

  return (
    <Drawer
      screenOptions={{
        drawerType: 'slide',
        drawerStyle: {
          width: Math.min(width * 0.8, 320), // D-09: 80% capped at 320px
          backgroundColor: theme.colors.surface.sunken,
        },
        swipeEdgeWidth: width,
        overlayColor: 'rgba(0,0,0,0.4)',
        headerShown: false,
      }}
      screenListeners={{
        transitionEnd: (e) => {
          // D-18: Fire haptic when drawer reaches fully open (not on close)
          if (!(e.data as { closing?: boolean }).closing) {
            haptic.transition();
          }
        },
      }}
      drawerContent={(props) => <DrawerContent {...props} />}
    />
  );
}
