/**
 * Chat screen route -- displays the chat interface for a given session ID.
 *
 * In Phase 74, this is a placeholder that shows:
 * - ChatHeader with hamburger and title
 * - EmptyChat "How can I help?" centered state
 * - ComposerShell visual-only composer bar
 *
 * Phase 75 will wire the streaming message list and actual composer submit.
 */

import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { ChatHeader } from '../../../../components/navigation/ChatHeader';
import { EmptyChat } from '../../../../components/chat/EmptyChat';
import { ComposerShell } from '../../../../components/chat/ComposerShell';
import { createStyles } from '../../../../theme/createStyles';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View style={styles.container}>
      <ChatHeader title={id === 'new' ? 'New Chat' : undefined} />
      <View style={styles.content}>
        <EmptyChat />
      </View>
      <ComposerShell />
    </View>
  );
}

const styles = createStyles((t) => ({
  container: {
    flex: 1,
    backgroundColor: t.colors.surface.base,
  },
  content: {
    flex: 1,
  },
}));
