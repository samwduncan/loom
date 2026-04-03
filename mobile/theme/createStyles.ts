import { StyleSheet, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native';
import { theme } from './theme';
import type { LoomTheme } from './types';

type NamedStyles<T> = {
  [P in keyof T]: ViewStyle | TextStyle | ImageStyle;
};

/**
 * Creates StyleSheet styles with theme tokens injected.
 * Usage: const styles = createStyles((t) => ({ container: { backgroundColor: t.colors.surface.base } }));
 *
 * Call at module scope or inside useMemo -- the theme object is a singleton
 * (dark mode only, no runtime switching).
 */
export function createStyles<T extends NamedStyles<T>>(
  factory: (t: LoomTheme) => T | NamedStyles<T>,
): T {
  return StyleSheet.create(factory(theme) as T);
}
