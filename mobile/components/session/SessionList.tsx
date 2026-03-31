/**
 * SessionList -- custom drawer content for the sidebar.
 *
 * Full Soul-doc session list: Loom heading, NewChatButton, SearchInput,
 * pinned sessions section, project groups, empty state, loading skeletons,
 * settings icon, and connection status dot.
 *
 * Background: surface-sunken (Tier 0) -- visually recedes behind chat area.
 * Pull-to-refresh via RefreshControl on ScrollView.
 * Connection dot in footer: 8px circle, success/destructive color.
 */

import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable } from 'react-native';
import { SPRING } from '../../lib/springs';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { Settings } from 'lucide-react-native';
import { router } from 'expo-router';
import type { DrawerContentComponentProps } from '@react-navigation/drawer';

import { SURFACE, SUCCESS, DESTRUCTIVE } from '../../lib/colors';
import { useSessions } from '../../hooks/useSessions';
import { useConnection } from '../../hooks/useConnection';
import { useStreamStore } from '../../stores/index';

import { NewChatButton } from './NewChatButton';
import { SearchInput } from './SearchInput';
import { SessionGroup } from './SessionGroup';
import { SessionItem } from './SessionItem';
import { ProjectPicker } from './ProjectPicker';
import { EmptySessionList } from '../empty/EmptySessionList';

// ---------------------------------------------------------------------------
// Skeleton item for loading state (anti-pattern #13)
// ---------------------------------------------------------------------------

function SkeletonItem() {
  const opacity = useSharedValue(0.3);

  React.useEffect(() => {
    opacity.value = withRepeat(withTiming(0.7, { duration: 1000 }), -1, true);
  }, [opacity]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          height: 56,
          marginHorizontal: 16,
          marginVertical: 4,
          borderRadius: 8,
          backgroundColor: SURFACE.raised,
        },
        style,
      ]}
    />
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SessionList(_props: DrawerContentComponentProps) {
  const {
    projects,
    pinnedSessions,
    isLoading,
    error,
    activeSessionId,
    searchQuery,
    setSearchQuery,
    fetchSessions,
    createSession,
    deleteSession,
    setActiveSession,
  } = useSessions();

  const { isConnected } = useConnection();
  const streamActiveSessionId = useStreamStore((s) => s.activeSessionId);
  const isStreamActive = useStreamStore((s) => s.isStreaming);
  // Only show streaming indicator when both session ID is set AND stream is active
  const streamingSessionId = isStreamActive ? streamActiveSessionId : null;

  const [isPickerVisible, setPickerVisible] = useState(false);
  const [isRefreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSessions();
    setRefreshing(false);
  }, [fetchSessions]);

  const handleNewChat = useCallback(() => {
    setPickerVisible(true);
  }, []);

  const handleSelectProject = useCallback(
    (projectName: string, projectPath: string) => {
      createSession(projectName, projectPath);
    },
    [createSession],
  );

  const handleSelectSession = useCallback(
    (sessionId: string) => {
      setActiveSession(sessionId);
    },
    [setActiveSession],
  );

  const handleDeleteSession = useCallback(
    (projectName: string, sessionId: string) => {
      deleteSession(projectName, sessionId);
    },
    [deleteSession],
  );

  // Count total sessions for empty state check
  const totalSessions = projects.reduce((sum, p) => sum + p.sessions.length, 0);
  const hasNoSessions = !isLoading && totalSessions === 0 && pinnedSessions.length === 0;

  // Settings button spring press (anti-pattern #11: no silent taps)
  const settingsScale = useSharedValue(1);
  const settingsScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: settingsScale.value }],
  }));

  // Calculate stagger index offset across groups
  let runningIndex = pinnedSessions.length;

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: SURFACE.sunken }}
      edges={['top', 'bottom']}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="rgb(148, 144, 141)"
          />
        }
      >
        {/* Header: "Loom" Large Title */}
        <Text
          style={{
            fontSize: 28,
            fontWeight: '700',
            color: 'rgb(230, 222, 216)',
            paddingHorizontal: 16,
            paddingTop: 16,
          }}
        >
          Loom
        </Text>

        {/* New Chat button */}
        <View style={{ marginTop: 12 }}>
          <NewChatButton onPress={handleNewChat} />
        </View>

        {/* Search input */}
        <SearchInput value={searchQuery} onChangeText={setSearchQuery} />

        {/* Loading state -- skeleton items per anti-pattern #13 */}
        {isLoading && (
          <View style={{ marginTop: 16 }}>
            <Text
              style={{
                fontSize: 12,
                color: 'rgb(148, 144, 141)',
                paddingHorizontal: 16,
                marginBottom: 8,
              }}
            >
              Loading sessions...
            </Text>
            <SkeletonItem />
            <SkeletonItem />
            <SkeletonItem />
            <SkeletonItem />
            <SkeletonItem />
          </View>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <View style={{ padding: 16, marginTop: 8 }}>
            <Text style={{ fontSize: 13, color: DESTRUCTIVE }}>{error}</Text>
          </View>
        )}

        {/* Empty state */}
        {hasNoSessions && <EmptySessionList onNewChat={handleNewChat} />}

        {/* Pinned sessions section */}
        {!isLoading && pinnedSessions.length > 0 && (
          <View style={{ marginTop: 16 }}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: '400',
                color: 'rgb(148, 144, 141)',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                paddingHorizontal: 16,
                paddingTop: 8,
                paddingBottom: 4,
              }}
            >
              PINNED
            </Text>
            {pinnedSessions.map((session, i) => (
              <SessionItem
                key={session.id}
                id={session.id}
                title={session.title}
                updatedAt={session.updatedAt}
                provider={session.provider}
                projectName={session.projectName}
                projectPath={session.projectPath}
                isActive={session.id === activeSessionId}
                isStreaming={session.id === streamingSessionId}
                index={i}
                onDelete={() =>
                  handleDeleteSession(session.projectName, session.id)
                }
                onPress={() => handleSelectSession(session.id)}
              />
            ))}
          </View>
        )}

        {/* Project groups */}
        {!isLoading &&
          projects.map((project) => {
            const group = (
              <SessionGroup
                key={project.name}
                displayName={project.displayName}
                sessions={project.sessions}
                activeSessionId={activeSessionId}
                streamingSessionId={streamingSessionId}
                onDeleteSession={handleDeleteSession}
                onSelectSession={handleSelectSession}
                indexOffset={runningIndex}
              />
            );
            runningIndex += project.sessions.length;
            return group;
          })}
      </ScrollView>

      {/* Footer: Settings icon + connection status dot */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderTopWidth: 1,
          borderTopColor: 'rgba(255, 255, 255, 0.05)',
        }}
      >
        <Animated.View style={settingsScaleStyle}>
          <Pressable
            onPress={() => router.push('/(drawer)/settings')}
            onPressIn={() => { settingsScale.value = withSpring(0.9, SPRING.micro); }}
            onPressOut={() => { settingsScale.value = withSpring(1, SPRING.micro); }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{ minHeight: 44, minWidth: 44, justifyContent: 'center' }}
          >
            <Settings size={20} color="rgb(148, 144, 141)" />
          </Pressable>
        </Animated.View>

        {/* Connection dot: 8px, success (green) / destructive (red) */}
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: isConnected ? SUCCESS : DESTRUCTIVE,
          }}
        />
      </View>

      {/* Project Picker modal */}
      <ProjectPicker
        visible={isPickerVisible}
        onClose={() => setPickerVisible(false)}
        onSelectProject={handleSelectProject}
      />
    </SafeAreaView>
  );
}
