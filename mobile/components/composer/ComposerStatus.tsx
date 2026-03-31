/**
 * ComposerStatus -- status bar below the composer input.
 *
 * Per D-14: ~24px tall, Caption text (12px, text-muted).
 * Shows: token count + model name + connection dot.
 *
 * - Token count from stream store (resultTokens or "0 tokens" when idle)
 * - Model name from stream store (or "Claude" default)
 * - Connection dot: 6px circle, success (connected) or destructive (disconnected)
 *   with 200ms color transition
 */

import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
  interpolateColor,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { LoomText } from '../primitives/TextHierarchy';
import { useStreamStore } from '../../stores/index';
import { useConnectionStore } from '../../stores/index';
import { SUCCESS, DESTRUCTIVE } from '../../lib/colors';

export function ComposerStatus() {
  const resultTokens = useStreamStore((s) => s.resultTokens);
  const modelName = useStreamStore((s) => s.modelName);
  const isStreaming = useStreamStore((s) => s.isStreaming);
  const claudeStatus = useConnectionStore(
    (s) => s.providers.claude.status,
  );

  const isConnected = claudeStatus === 'connected';
  const connectionProgress = useSharedValue(isConnected ? 1 : 0);

  useEffect(() => {
    connectionProgress.value = withTiming(isConnected ? 1 : 0, { duration: 200 });
  }, [isConnected, connectionProgress]);

  const dotStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      connectionProgress.value,
      [0, 1],
      [DESTRUCTIVE, SUCCESS],
    ),
  }));

  // Token display
  const tokenText = resultTokens
    ? `${resultTokens.output} tokens`
    : isStreaming
      ? 'Streaming...'
      : '0 tokens';

  const displayModel = modelName || 'Claude';

  return (
    <View style={styles.container}>
      <LoomText variant="caption">{tokenText}</LoomText>
      <View style={styles.rightSection}>
        <LoomText variant="caption">{displayModel}</LoomText>
        <Animated.View style={[styles.dot, dotStyle]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 24,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
