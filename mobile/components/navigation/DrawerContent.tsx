/**
 * Full session navigation panel for the drawer.
 *
 * Features:
 * - Date-grouped SectionList (Today / Yesterday / Last Week / Older)
 * - Glass search bar with real-time filtering
 * - Swipe-to-delete with 5s undo toast (pendingDeletes pattern)
 * - Running session pulsing dot via stream store
 * - Stagger entrance animation (30ms per item, max 10)
 * - Skeleton loading placeholders (no ActivityIndicator per Soul doc anti-pattern #13)
 * - Empty state with "No sessions yet" + New Chat button
 * - Session press passes projectName + projectPath in router params (AR fix #2)
 *
 * Data flow:
 * - useSessions() provides projects, search, activeSessionId, createSession, deleteSession
 * - useStreamStore for isStreaming + stream activeSessionId to detect running sessions
 * - useConnection() provides status for the footer dot
 * - groupSessionsByDate() creates SectionList sections from flat session list
 * - showToast() from Plan 01's toast utility for undo toast
 */

import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SectionList,
  Pressable,
} from 'react-native';
import type { DrawerContentComponentProps } from '@react-navigation/drawer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { haptic } from '../../lib/haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useSessions } from '../../hooks/useSessions';
import type { SessionData } from '../../hooks/useSessions';
import { useConnection } from '../../hooks/useConnection';
import { useStreamStore } from '../../stores/index';
import { groupSessionsByDate } from '../../lib/date-sections';
import type { SectionData } from '../../lib/date-sections';
import { showToast } from '../../lib/toast';
import { theme } from '../../theme/theme';
import { createStyles } from '../../theme/createStyles';
import { Settings } from 'lucide-react-native';
import { SessionSearch } from './SessionSearch';
import { SessionItem } from './SessionItem';

// ---------------------------------------------------------------------------
// Animated Pressable for spring scale feedback
// ---------------------------------------------------------------------------

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ---------------------------------------------------------------------------
// Skeleton placeholder for loading state
// ---------------------------------------------------------------------------

function SkeletonItem({ index }: { index: number }) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.6, { duration: 1000 }),
      -1,
      true,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.skeleton, animatedStyle]} />
  );
}

function LoadingSkeletons() {
  return (
    <View style={styles.skeletonContainer}>
      {[0, 1, 2, 3, 4].map((i) => (
        <SkeletonItem key={i} index={i} />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Empty state (D-34)
// ---------------------------------------------------------------------------

function EmptyState({ onNewChat }: { onNewChat: () => void }) {
  const entryOpacity = useSharedValue(0);
  const entryTranslateY = useSharedValue(20);

  useEffect(() => {
    entryOpacity.value = withSpring(1, theme.springs.standard);
    entryTranslateY.value = withSpring(0, theme.springs.standard);
  }, [entryOpacity, entryTranslateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: entryOpacity.value,
    transform: [{ translateY: entryTranslateY.value }],
  }));

  const scale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.emptyContainer}>
      <Animated.View style={[styles.emptyInner, animatedStyle]}>
        <Text style={styles.emptyText}>No sessions yet</Text>
        <AnimatedPressable
          onPressIn={() => {
            scale.value = withSpring(0.97, theme.springs.micro);
          }}
          onPressOut={() => {
            scale.value = withSpring(1, theme.springs.micro);
          }}
          onPress={onNewChat}
          style={[styles.emptyNewChatButton, pressStyle]}
          accessibilityRole="button"
          accessibilityLabel="New Chat"
        >
          <Text style={styles.emptyNewChatText}>New Chat</Text>
        </AnimatedPressable>
      </Animated.View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Search empty state
// ---------------------------------------------------------------------------

function SearchEmpty() {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No sessions match your search</Text>
    </View>
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
    searchQuery,
    setSearchQuery,
    createSession,
    deleteSession,
    setActiveSession,
  } = useSessions();
  const { isConnected, isReconnecting } = useConnection();
  const isStreaming = useStreamStore((s) => s.isStreaming);
  const streamActiveSessionId = useStreamStore((s) => s.activeSessionId);

  // Force re-render counter for pendingDeletes updates
  const [forceUpdate, setForceUpdate] = useState(0);

  // Pending deletes: session IDs -> timeout handles
  const pendingDeletesRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Clean up pending delete timers on unmount
  useEffect(() => {
    return () => {
      pendingDeletesRef.current.forEach((timer) => clearTimeout(timer));
      pendingDeletesRef.current.clear();
    };
  }, []);

  // Flatten all sessions from all projects, sorted by updatedAt descending
  const allSessions = useMemo(
    () =>
      projects
        .flatMap((p) => p.sessions)
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        ),
    [projects],
  );

  // Group into date sections
  const sections = useMemo(
    () => groupSessionsByDate(allSessions),
    [allSessions],
  );

  // Filter out pending deletes from visible sections
  const visibleSections = useMemo(() => {
    return sections
      .map((section) => ({
        ...section,
        data: section.data.filter((s) => !pendingDeletesRef.current.has(s.id)),
      }))
      .filter((section) => section.data.length > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections, forceUpdate]);

  // Get first project for "New Chat" creation
  const firstProject = projects[0];

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const handleNewChat = useCallback(() => {
    haptic.tap();
    if (firstProject) {
      createSession(firstProject.name, firstProject.path);
    } else {
      createSession('default', '/home/swd/loom');
    }
    props.navigation.closeDrawer();
  }, [firstProject, createSession, props.navigation]);

  // AR fix #2: pass projectName and projectPath in router params
  const handleSessionPress = useCallback(
    (session: SessionData) => {
      setActiveSession(session.id);
      router.push({
        pathname: '/chat/[id]',
        params: {
          id: session.id,
          projectName: session.projectName,
          projectPath: session.projectPath,
        },
      });
      props.navigation.closeDrawer();
    },
    [setActiveSession, props.navigation],
  );

  // AR fix #4: pendingDeletes ref pattern with 5s delayed deletion and undo
  const handleDelete = useCallback(
    (session: SessionData) => {
      const sessionId = session.id;

      // Schedule actual deletion after 5 seconds
      const timer = setTimeout(() => {
        deleteSession(session.projectName, sessionId).catch((err) => {
          console.warn('[DrawerContent] Delete failed:', err);
          // On error: remove from pending set so session reappears
          pendingDeletesRef.current.delete(sessionId);
          setForceUpdate((prev) => prev + 1);
          showToast('Delete failed');
        });
        pendingDeletesRef.current.delete(sessionId);
      }, 5000);

      pendingDeletesRef.current.set(sessionId, timer);

      // Hide session immediately
      setForceUpdate((prev) => prev + 1);

      showToast(
        'Session deleted',
        {
          label: 'Undo',
          onPress: () => {
            const pendingTimer = pendingDeletesRef.current.get(sessionId);
            if (pendingTimer) {
              clearTimeout(pendingTimer);
              pendingDeletesRef.current.delete(sessionId);
              setForceUpdate((prev) => prev + 1);
            }
          },
        },
        5000,
      );
    },
    [deleteSession],
  );

  // -------------------------------------------------------------------------
  // Connection status
  // -------------------------------------------------------------------------

  const statusDotColor = isConnected
    ? theme.colors.success
    : isReconnecting
      ? theme.colors.warning
      : theme.colors.destructive;

  const statusText = isConnected
    ? 'Connected'
    : isReconnecting
      ? 'Reconnecting...'
      : 'Disconnected';

  // -------------------------------------------------------------------------
  // PressableScale for New Chat button
  // -------------------------------------------------------------------------

  const newChatScale = useSharedValue(1);
  const newChatPressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: newChatScale.value }],
  }));

  // Settings button spring scale + haptic
  const settingsScale = useSharedValue(1);
  const settingsPressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: settingsScale.value }],
  }));

  // -------------------------------------------------------------------------
  // SectionList renderers
  // -------------------------------------------------------------------------

  const renderItem = useCallback(
    ({ item, index }: { item: SessionData; index: number }) => (
      <SessionItem
        session={item}
        isActive={item.id === activeSessionId}
        isRunning={isStreaming && streamActiveSessionId === item.id}
        index={index}
        onPress={() => handleSessionPress(item)}
        onDelete={() => handleDelete(item)}
      />
    ),
    [activeSessionId, isStreaming, streamActiveSessionId, handleSessionPress, handleDelete],
  );

  const renderSectionHeader = useCallback(
    ({ section: { title } }: { section: SectionData }) => (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderText}>{title}</Text>
      </View>
    ),
    [],
  );

  const keyExtractor = useCallback((item: SessionData) => item.id, []);

  // -------------------------------------------------------------------------
  // Determine what to show in the list area
  // -------------------------------------------------------------------------

  const hasNoSessions = allSessions.length === 0 && !isLoading && !searchQuery.trim();
  const hasSearchNoResults =
    searchQuery.trim().length > 0 && visibleSections.length === 0 && !isLoading;

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <View style={[styles.container, { paddingTop: insets.top + theme.spacing.lg }]}>
      {/* Header: Loom branding */}
      <Text style={styles.brandTitle}>Loom</Text>

      {/* New Chat button */}
      <AnimatedPressable
        onPressIn={() => {
          newChatScale.value = withSpring(0.97, theme.springs.micro);
        }}
        onPressOut={() => {
          newChatScale.value = withSpring(1, theme.springs.micro);
        }}
        onPress={handleNewChat}
        style={[styles.newChatButton, newChatPressStyle]}
        accessibilityRole="button"
        accessibilityLabel="New Chat"
      >
        <Text style={styles.newChatText}>New Chat</Text>
      </AnimatedPressable>

      {/* Search bar */}
      <SessionSearch query={searchQuery} onQueryChange={setSearchQuery} />

      {/* Session list area */}
      <View style={styles.listContainer}>
        {isLoading ? (
          <LoadingSkeletons />
        ) : hasNoSessions ? (
          <EmptyState onNewChat={handleNewChat} />
        ) : hasSearchNoResults ? (
          <SearchEmpty />
        ) : (
          <SectionList
            sections={visibleSections}
            renderItem={renderItem}
            renderSectionHeader={renderSectionHeader}
            keyExtractor={keyExtractor}
            stickySectionHeadersEnabled={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>

      {/* Connection status footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + theme.spacing.sm }]}>
        <AnimatedPressable
          onPressIn={() => {
            settingsScale.value = withSpring(0.97, theme.springs.micro);
          }}
          onPressOut={() => {
            settingsScale.value = withSpring(1, theme.springs.micro);
          }}
          onPress={() => {
            haptic.tap();
            router.push('/(drawer)/(stack)/settings/notifications');
          }}
          accessibilityLabel="Notification settings"
          style={[styles.settingsButton, settingsPressStyle]}
          hitSlop={8}
        >
          <Settings size={20} color={theme.colors.text.secondary} />
        </AnimatedPressable>
        <View style={styles.footerStatus}>
          <View
            style={[styles.statusDot, { backgroundColor: statusDotColor }]}
            accessibilityLabel={statusText}
          />
          <Text style={styles.statusText}>{statusText}</Text>
        </View>
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
    ...t.typography.headline, // 17px heading (was 28px largeTitle)
    color: t.colors.text.primary,
    paddingHorizontal: t.spacing.md,
    marginBottom: t.spacing.md,
  },
  newChatButton: {
    marginHorizontal: t.spacing.md,
    minHeight: 44,
    height: 44,
    backgroundColor: t.colors.accentMuted,
    borderRadius: t.radii.xl, // 12px — NewChatButton per spec Part 7
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: t.spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(245, 178, 65, 0.2)',
  },
  newChatText: {
    ...t.typography.label,
    color: t.colors.accent,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 8,
  },
  sectionHeader: {
    paddingHorizontal: t.spacing.md,
    paddingTop: t.spacing.lg,
    paddingBottom: t.spacing.xs,
  },
  sectionHeaderText: {
    ...t.typography.meta, // 12px -- matches ChatGPT iOS section header density (D-08)
    color: t.colors.text.muted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  emptyInner: {
    alignItems: 'center' as const,
  },
  emptyText: {
    ...t.typography.body,
    color: t.colors.text.muted,
    marginBottom: t.spacing.md,
  },
  emptyNewChatButton: {
    minHeight: 44,
    height: 44,
    paddingHorizontal: t.spacing.xl,
    backgroundColor: t.colors.accentMuted,
    borderRadius: t.radii.xl,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(245, 178, 65, 0.2)',
  },
  emptyNewChatText: {
    ...t.typography.label,
    color: t.colors.accent,
  },
  // Skeleton loading
  skeletonContainer: {
    paddingHorizontal: t.spacing.md,
    paddingTop: t.spacing.lg,
  },
  skeleton: {
    height: 56,
    backgroundColor: t.colors.surface.raised,
    borderRadius: t.radii.md,
    marginBottom: t.spacing.sm,
  },
  // Footer
  footer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: t.spacing.md,
    paddingTop: t.spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth, // 0.5px
    borderTopColor: t.colors.border.medium,
  },
  settingsButton: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginRight: t.spacing.sm,
  },
  footerStatus: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: t.spacing.sm,
  },
  statusText: {
    ...t.typography.meta,
    color: t.colors.text.muted,
  },
}));
