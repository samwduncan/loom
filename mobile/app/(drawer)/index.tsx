/**
 * Drawer index screen -- main content area inside the drawer.
 *
 * When an active session exists, redirects to chat/[id].
 * When no session is active, shows a placeholder empty state.
 * (EmptyChat component will be built in Plan 04.)
 */

import { useEffect } from 'react';
import { View, Text } from 'react-native';
import { router } from 'expo-router';
import { useTimelineStore } from '../../stores/index';
import { SURFACE, ACCENT } from '../../lib/colors';
import { NewChatButton } from '../../components/session/NewChatButton';

export default function DrawerIndexScreen() {
  const activeSessionId = useTimelineStore((s) => s.activeSessionId);

  useEffect(() => {
    if (activeSessionId) {
      router.replace(`/(stack)/chat/${activeSessionId}`);
    }
  }, [activeSessionId]);

  // No active session -- show empty state (Plan 04 will build EmptyChat)
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: SURFACE.base,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
      }}
    >
      <Text
        style={{
          fontSize: 15,
          color: 'rgb(148, 144, 141)',
          textAlign: 'center',
          marginBottom: 16,
        }}
      >
        Select a session or start a new one
      </Text>
      <View style={{ width: '100%', maxWidth: 280 }}>
        <NewChatButton
          onPress={() => {
            // Open the drawer to show session list + New Chat
            // Drawer navigation triggers via the drawer navigator
          }}
        />
      </View>
    </View>
  );
}
