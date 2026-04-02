/**
 * Project session group -- Caption-style project header + collapsible session items.
 *
 * Per Soul doc Session List spec: project headers use Caption style
 * (12px, muted, uppercase). Group is hidden when it has 0 visible sessions
 * (filtered by search).
 *
 * Tap header to expand/collapse. Chevron rotates with micro spring.
 * Collapsed state persisted in component (resets on remount).
 */

import React, { useState, useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { ChevronRight } from 'lucide-react-native';
import { SPRING } from '../../lib/springs';
import { SessionItem } from './SessionItem';
import type { SessionData } from '../../hooks/useSessions';

interface SessionGroupProps {
  displayName: string;
  sessions: SessionData[];
  activeSessionId: string | null;
  streamingSessionId?: string | null;
  onDeleteSession: (projectName: string, sessionId: string) => void;
  onSelectSession: (sessionId: string) => void;
  indexOffset: number;
}

export function SessionGroup({
  displayName,
  sessions,
  activeSessionId,
  streamingSessionId,
  onDeleteSession,
  onSelectSession,
  indexOffset,
}: SessionGroupProps) {
  const [isExpanded, setExpanded] = useState(true);
  const chevronRotation = useSharedValue(90); // 90° = expanded (pointing down)

  const toggleExpand = useCallback(() => {
    setExpanded((prev) => {
      const next = !prev;
      chevronRotation.value = withSpring(next ? 90 : 0, SPRING.micro);
      return next;
    });
  }, [chevronRotation]);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevronRotation.value}deg` }],
  }));

  if (sessions.length === 0) return null;

  return (
    <View style={{ marginTop: 12 }}>
      {/* Tappable project header with chevron */}
      <Pressable
        onPress={toggleExpand}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 6,
          minHeight: 32,
        }}
      >
        <Animated.View style={chevronStyle}>
          <ChevronRight size={12} color="rgb(148, 144, 141)" strokeWidth={2} />
        </Animated.View>
        <Text
          style={{
            fontSize: 12,
            fontWeight: '400',
            color: 'rgb(148, 144, 141)',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginLeft: 6,
            flex: 1,
          }}
        >
          {displayName}
        </Text>
        <Text
          style={{
            fontSize: 11,
            color: 'rgb(115, 112, 110)',
          }}
        >
          {sessions.length}
        </Text>
      </Pressable>

      {/* Collapsible session list */}
      {isExpanded &&
        sessions.map((session, i) => (
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
            index={indexOffset + i}
            onDelete={() => onDeleteSession(session.projectName, session.id)}
            onPress={() => onSelectSession(session.id)}
          />
        ))}
    </View>
  );
}
