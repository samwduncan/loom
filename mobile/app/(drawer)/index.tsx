/**
 * Drawer index screen -- main content area inside the drawer.
 *
 * When an active session exists, redirects to chat/[id].
 * When no session is active, shows EmptyChat with a New Chat action.
 *
 * The drawer navigator wraps this screen; opening the drawer from here
 * shows the SessionList. The EmptyChat component is from Plan 04.
 */

import { useEffect, useState, useCallback } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useTimelineStore } from '../../stores/index';
import { SURFACE } from '../../lib/colors';
import { EmptyChat } from '../../components/empty/EmptyChat';
import { NewChatButton } from '../../components/session/NewChatButton';
import { ProjectPicker } from '../../components/session/ProjectPicker';
import { useSessions } from '../../hooks/useSessions';

export default function DrawerIndexScreen() {
  const activeSessionId = useTimelineStore((s) => s.activeSessionId);
  const { createSession } = useSessions();
  const [isPickerVisible, setPickerVisible] = useState(false);

  useEffect(() => {
    if (activeSessionId && !activeSessionId.startsWith('stub-')) {
      // Navigate to the active chat session.
      // Use push (not replace) so the user can navigate back to drawer index.
      router.push({
        pathname: '/(stack)/chat/[id]',
        params: { id: activeSessionId },
      });
    }
  }, [activeSessionId]);

  const handleNewChat = useCallback(() => {
    setPickerVisible(true);
  }, []);

  const handleSelectProject = useCallback(
    (projectName: string, projectPath: string) => {
      createSession(projectName, projectPath);
    },
    [createSession],
  );

  // No active session -- show empty state with New Chat action
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: SURFACE.base,
      }}
    >
      <EmptyChat modelName="Claude" />

      {/* New Chat button at bottom */}
      <View
        style={{
          paddingHorizontal: 24,
          paddingBottom: 40,
          maxWidth: 280,
          alignSelf: 'center',
          width: '100%',
        }}
      >
        <NewChatButton onPress={handleNewChat} />
      </View>

      {/* Project Picker modal */}
      <ProjectPicker
        visible={isPickerVisible}
        onClose={() => setPickerVisible(false)}
        onSelectProject={handleSelectProject}
      />
    </View>
  );
}
