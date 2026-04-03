/**
 * EmptyChat -- empty state placeholder for the chat screen.
 *
 * Shows a Cpu icon (representing Loom/AI) and "How can I help?" text.
 * Centered vertically in available space.
 */

import { View, Text } from 'react-native';
import { Cpu } from 'lucide-react-native';

import { theme } from '../../theme/theme';
import { createStyles } from '../../theme/createStyles';

export function EmptyChat() {
  return (
    <View style={styles.container}>
      <Cpu
        size={48}
        color={theme.colors.text.muted}
        strokeWidth={1.5}
        style={{ opacity: 0.6 }}
      />
      <Text style={styles.text}>How can I help?</Text>
    </View>
  );
}

const styles = createStyles((t) => ({
  container: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  text: {
    ...t.typography.body,
    color: t.colors.text.muted,
    marginTop: t.spacing.sm,
    textAlign: 'center' as const,
  },
}));
