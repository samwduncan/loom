/**
 * Stack layout inside the drawer -- wraps all screen routes with the
 * AnimatedScreen parallax wrapper that shifts content 20px when the
 * drawer opens.
 */

import { Stack } from 'expo-router';
import { AnimatedScreen } from '../../../components/navigation/AnimatedScreen';

export default function StackLayout() {
  return (
    <AnimatedScreen>
      <Stack screenOptions={{ headerShown: false }} />
    </AnimatedScreen>
  );
}
