/**
 * MessageBubble -- renders a single message in the chat thread.
 *
 * Per D-18: User messages in surface-raised bubbles (rounded-2xl, p-4), right-aligned.
 * Assistant messages free-flowing on surface-base, full width with MarkdownRenderer.
 *
 * Per D-19: 24px between different roles, 8px between same role.
 * Per D-21: User messages enter with Standard spring (opacity + translateY).
 *           Assistant first token fades in (150ms opacity, withTiming).
 *
 * Soul doc: Streaming text flows without per-character animation (rule #6).
 */

import { View, StyleSheet } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import { MarkdownRenderer } from './MarkdownRenderer';
import { ProviderAvatar } from './ProviderAvatar';
import { LoomText } from '../primitives/TextHierarchy';
import { SURFACE } from '../../lib/colors';
import type { DisplayMessage } from '../../hooks/useMessageList';

interface MessageBubbleProps {
  message: DisplayMessage;
  isLastMessage: boolean;
  previousRole?: 'user' | 'assistant' | null;
  isFirstInGroup?: boolean;
}

export function MessageBubble({
  message,
  isLastMessage,
  previousRole,
  isFirstInGroup = true,
}: MessageBubbleProps) {
  // Turn spacing: 24px between different roles, 8px between same role (D-19)
  const marginTop = previousRole === null || previousRole === undefined
    ? 0
    : previousRole !== message.role
      ? 24
      : 8;

  if (message.role === 'user') {
    return (
      <Animated.View
        entering={FadeInDown
          .springify()
          .damping(20)
          .stiffness(150)
          .mass(1.0)}
        style={[styles.userContainer, { marginTop }]}
      >
        <View style={styles.userBubble}>
          <LoomText variant="body" style={styles.userText}>
            {message.content}
          </LoomText>
        </View>
      </Animated.View>
    );
  }

  // Assistant message -- free-flowing, no container
  return (
    <Animated.View
      entering={FadeIn.duration(150)}
      style={[styles.assistantContainer, { marginTop }]}
    >
      {isFirstInGroup && (
        <View style={styles.avatarRow}>
          <ProviderAvatar provider="claude" />
        </View>
      )}
      <View style={styles.assistantContent}>
        <MarkdownRenderer
          content={message.content}
          isStreaming={message.isStreaming}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // User message: right-aligned, raised bubble
  userContainer: {
    alignSelf: 'flex-end',
    maxWidth: '85%',
    paddingHorizontal: 16,
  },
  userBubble: {
    backgroundColor: SURFACE.raised,
    borderRadius: 16, // rounded-2xl
    padding: 16,
  },
  userText: {
    textAlign: 'left',
    color: 'rgb(230, 222, 216)',
  },

  // Assistant message: full width, no container
  assistantContainer: {
    width: '100%',
    paddingHorizontal: 16,
  },
  avatarRow: {
    marginBottom: 8,
  },
  assistantContent: {
    // Free-flowing on surface-base, no additional container
  },
});
