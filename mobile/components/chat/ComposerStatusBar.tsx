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
    paddingHorizontal: t.spacing.md,               // 16px — spec §3: outer screen padding
    paddingVertical: t.spacing.xs,                 // 4px
  },
  leftGroup: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: t.spacing.xs,                             // 4px — icon-to-text gap per spec §3
  },
  dot: {
    width: 8,                                      // spec §7.10: status dots = 8px
    height: 8,
    borderRadius: 4,
  },
  label: {
    ...t.typography.label,                         // spec §7.6: label tier for status bar
    color: t.colors.text.muted,
  },
}));
