/**
 * Custom drawer content -- Loom branding, New Chat button, session list,
 * and connection status footer.
 *
 * Data flow:
 * - useSessions() provides projects, activeSessionId, createSession, setActiveSession
 * - useConnection() provides status for the footer dot
 * - Sessions are flattened from all projects and sorted by updatedAt descending
 */

import { useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import type { DrawerContentComponentProps } from '@react-navigation/drawer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  Easing,
  FadeIn,
} from 'react-native-reanimated';

import { useSessions, relativeTime } from '../../hooks/useSessions';
import type { SessionData } from '../../hooks/useSessions';
import { useConnection } from '../../hooks/useConnection';
import { theme } from '../../theme/theme';
import { createStyles } from '../../theme/createStyles';

// ---------------------------------------------------------------------------
// Animated Pressable for spring scale feedback
// ---------------------------------------------------------------------------

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function PressableScale({
  onPress,
  style,
  children,
  accessibilityRole,
  accessibilityLabel,
}: {
  onPress: () => void;
  style?: any;
  children: React.ReactNode;
  accessibilityRole?: 'button' | 'link' | 'none';
  accessibilityLabel?: string;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPressIn={() => {
        scale.value = withSpring(0.97, theme.springs.micro);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, theme.springs.micro);
      }}
      onPress={onPress}
      style={[style, animatedStyle]}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
    >
      {children}
    </AnimatedPressable>
  );
}

// ---------------------------------------------------------------------------
// Session Item
// ---------------------------------------------------------------------------

function SessionItem({
  session,
  isActive,
  index,
  onPress,
}: {
  session: SessionData;
  isActive: boolean;
  index: number;
  onPress: () => void;
}) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(10);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;

    // Stagger animation: 30ms per item, max 10 animated items
    const delay = index < 10 ? index * 30 : 0;
    const duration = index < 10 ? undefined : 0;

    if (index < 10) {
      opacity.value = withDelay(delay, withSpring(1, theme.springs.micro));
      translateY.value = withDelay(delay, withSpring(0, theme.springs.micro));
    } else {
      opacity.value = 1;
      translateY.value = 0;
    }
  }, [index, opacity, translateY]);

  const entryStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const bgColor = isActive
    ? theme.colors.surface.raised
    : 'transparent';

  return (
    <Animated.View style={entryStyle}>
      <PressableScale
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        style={[
          styles.sessionItem,
          {
            backgroundColor: bgColor,
            borderLeftWidth: isActive ? 3 : 0,
            borderLeftColor: isActive ? theme.colors.accent : 'transparent',
            paddingLeft: isActive
              ? theme.spacing.md - 3
              : theme.spacing.md,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={session.title}
      >
        <Text
          style={styles.sessionTitle}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {session.title}
        </Text>
        <Text style={styles.sessionDate}>
          {relativeTime(session.updatedAt)}
        </Text>
      </PressableScale>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// DrawerContent
// ---------------------------------------------------------------------------

export function DrawerContent(props: DrawerContentComponentProps) {
  const insets = useSafeAreaInsets();
  const {
    projects,
    isLoading,
    activeSessionId,
    createSession,
    setActiveSession,
  } = useSessions();
  const { status, isConnected, isReconnecting } = useConnection();

  // Flatten all sessions from all projects, sorted by updatedAt descending
  const allSessions = projects
    .flatMap((p) => p.sessions)
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );

  // Get first project for "New Chat" creation
  const firstProject = projects[0];

  const handleNewChat = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (firstProject) {
      createSession(firstProject.name, firstProject.path);
    } else {
      // No projects loaded yet -- create stub with defaults
      createSession('default', '/home/swd/loom');
    }
    props.navigation.closeDrawer();
  }, [firstProject, createSession, props.navigation]);

  const handleSessionPress = useCallback(
    (session: SessionData) => {
      setActiveSession(session.id);
      router.push({
        pathname: '/chat/[id]',
        params: { id: session.id },
      });
      props.navigation.closeDrawer();
    },
    [setActiveSession, props.navigation],
  );

  // Connection status
  const statusDotColor = isConnected
    ? theme.colors.success
    : isReconnecting
      ? theme.colors.text.muted
      : theme.colors.destructive;

  const statusText = isConnected
    ? 'Connected'
    : isReconnecting
      ? 'Reconnecting...'
      : 'Disconnected';

  const renderSession = useCallback(
    ({ item, index }: { item: SessionData; index: number }) => (
      <SessionItem
        session={item}
        isActive={item.id === activeSessionId}
        index={index}
        onPress={() => handleSessionPress(item)}
      />
    ),
    [activeSessionId, handleSessionPress],
  );

  const keyExtractor = useCallback((item: SessionData) => item.id, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top + theme.spacing.lg }]}>
      {/* Header: Loom branding */}
      <Text style={styles.brandTitle}>Loom</Text>

      {/* New Chat button */}
      <PressableScale
        onPress={handleNewChat}
        style={styles.newChatButton}
        accessibilityRole="button"
        accessibilityLabel="New Chat"
      >
        <Text style={styles.newChatText}>New Chat</Text>
      </PressableScale>

      {/* Session list */}
      <View style={styles.listContainer}>
        {isLoading ? (
          <View style={styles.centeredState}>
            <ActivityIndicator color={theme.colors.surface.overlay} />
          </View>
        ) : allSessions.length === 0 ? (
          <View style={styles.centeredState}>
            <Text style={styles.emptyText}>No sessions yet</Text>
          </View>
        ) : (
          <FlatList
            data={allSessions}
            renderItem={renderSession}
            keyExtractor={keyExtractor}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>

      {/* Connection status footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + theme.spacing.sm }]}>
        <View
          style={[styles.statusDot, { backgroundColor: statusDotColor }]}
          accessibilityLabel={statusText}
        />
        <Text style={styles.statusText}>{statusText}</Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = createStyles((t) => ({
  container: {
    flex: 1,
    backgroundColor: t.colors.surface.sunken,
  },
  brandTitle: {
    ...t.typography.largeTitle,
    color: t.colors.text.primary,
    paddingHorizontal: t.spacing.md,
    marginBottom: t.spacing.md,
  },
  newChatButton: {
    marginHorizontal: t.spacing.md,
    minHeight: 44,
    height: 44,
    backgroundColor: t.colors.accent,
    borderRadius: t.radii.md,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: t.spacing.md,
  },
  newChatText: {
    ...t.typography.heading,
    color: t.colors.accentFg,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 8,
  },
  centeredState: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  emptyText: {
    ...t.typography.body,
    color: t.colors.text.muted,
  },
  sessionItem: {
    minHeight: 56,
    paddingHorizontal: t.spacing.md,
    paddingVertical: t.spacing.sm,
    justifyContent: 'center' as const,
  },
  sessionTitle: {
    ...t.typography.body,
    fontWeight: '600' as const,
    color: t.colors.text.primary,
  },
  sessionDate: {
    ...t.typography.caption,
    color: t.colors.text.muted,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: t.spacing.md,
    paddingTop: t.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: t.colors.border.subtle,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: t.spacing.sm,
  },
  statusText: {
    ...t.typography.caption,
    color: t.colors.text.muted,
  },
}));
