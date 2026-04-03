/**
 * ComposerStatusBar -- Model name + connection dot + token count.
 *
 * Renders below the composer input row. Reads directly from stores
 * (no props needed). Shows:
 * - Model name from StreamStore (defaults to 'Claude')
 * - Connection dot: green (connected), muted (reconnecting), destructive (disconnected)
 * - Token count: "X / Y tokens" when tokenBudget is available
 *
 * @see D-29: status bar specification
 */

import React from 'react';
import { Text, View } from 'react-native';

import { theme } from '../../theme/theme';
import { createStyles } from '../../theme/createStyles';
import { useStreamStore } from '../../stores/index';
import { useConnection } from '../../hooks/useConnection';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function ComposerStatusBarInner() {
  const modelName = useStreamStore((s) => s.modelName) ?? 'Claude';
  const tokenBudget = useStreamStore((s) => s.tokenBudget);
  const { isConnected, isReconnecting } = useConnection();

  // Connection dot color
  let dotColor: string;
  if (isConnected) {
    dotColor = theme.colors.success;
  } else if (isReconnecting) {
    dotColor = theme.colors.text.muted;
  } else {
    dotColor = theme.colors.destructive;
  }

  return (
    <View style={styles.container}>
      {/* Left: connection dot + model name */}
      <View style={styles.leftGroup}>
        <View style={[styles.dot, { backgroundColor: dotColor }]} />
        <Text style={styles.label} numberOfLines={1}>
          {modelName}
        </Text>
      </View>

      {/* Right: token count (when available) */}
      {tokenBudget && (
        <Text style={styles.label}>
          {tokenBudget.used.toLocaleString()} / {tokenBudget.total.toLocaleString()} tokens
        </Text>
      )}
    </View>
  );
}

export const ComposerStatusBar = React.memo(ComposerStatusBarInner);

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = createStyles((t) => ({
  container: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: t.spacing.md,
    paddingVertical: t.spacing.xs,
  },
  leftGroup: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: t.spacing.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    ...t.typography.small,
    color: t.colors.text.muted,
  },
}));
