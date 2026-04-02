/**
 * Drawer layout -- the ONLY Drawer navigator in the app.
 *
 * Root layout uses Slot (not Drawer) per S-7 fix. This is the single
 * Drawer navigator that provides the sidebar session list.
 *
 * Route structure:
 *   (drawer)/index.tsx — empty state / redirect to active chat
 *   (drawer)/(stack)/_layout.tsx — Stack navigator for chat + other screens
 *   (drawer)/(stack)/chat/[id].tsx — chat screen
 *
 * Custom drawer content: SessionList component (Soul-doc compliant).
 * swipeEdgeWidth: 20 -- matches Soul doc "opens from left edge (first 20px)".
 * Drawer width: 300px per Soul doc Session List spec.
 */

import { Drawer } from 'expo-router/drawer';
import { SessionList } from '../../components/session/SessionList';
import { SURFACE } from '../../lib/colors';

export default function DrawerLayout() {
  return (
    <Drawer
      drawerContent={(props) => <SessionList {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          backgroundColor: SURFACE.sunken,
          width: 300,
        },
        sceneStyle: {
          backgroundColor: SURFACE.base,
        },
        swipeEdgeWidth: 20,
      }}
    >
      <Drawer.Screen name="index" options={{ headerShown: false }} />
      <Drawer.Screen name="(stack)" options={{ headerShown: false }} />
      <Drawer.Screen name="settings" options={{ headerShown: false }} />
    </Drawer>
  );
}
