/**
 * EmptyChat -- empty state shown when no messages in a chat session.
 *
 * Per D-23: Provider avatar (24px) at top, model name below ("Claude", 15px Body,
 * text-secondary), "How can I help?" (15px Body, text-primary), optional project
 * name in Caption (12px, text-muted).
 *
 * Standard spring entrance (opacity 0->1, translateY 20->0).
 */

import { View, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ProviderAvatar } from '../chat/ProviderAvatar';
import { LoomText } from '../primitives/TextHierarchy';

interface EmptyChatProps {
  modelName?: string;
  projectName?: string;
}

export function EmptyChat({ modelName = 'Claude', projectName }: EmptyChatProps) {
  return (
    <Animated.View
      entering={FadeInDown
        .springify()
        .damping(20)
        .stiffness(150)
        .mass(1.0)}
      style={styles.container}
    >
      <ProviderAvatar provider="claude" />
      <LoomText variant="body" style={styles.modelName}>
        {modelName}
      </LoomText>
      <LoomText variant="body" style={styles.helpText}>
        How can I help?
      </LoomText>
      {projectName ? (
        <LoomText variant="caption" style={styles.projectName}>
          {projectName}
        </LoomText>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  modelName: {
    marginTop: 12,
    color: 'rgb(191, 186, 182)', // text-secondary
  },
  helpText: {
    marginTop: 4,
    color: 'rgb(230, 222, 216)', // text-primary
  },
  projectName: {
    marginTop: 8,
    color: 'rgb(148, 144, 141)', // text-muted
  },
});
