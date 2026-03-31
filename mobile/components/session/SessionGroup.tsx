/**
 * Project session group -- Caption-style project header + session items.
 *
 * Per Soul doc Session List spec: project headers use Caption style
 * (12px, muted, uppercase). Group is hidden when it has 0 visible sessions
 * (filtered by search).
 */

import React from 'react';
import { View, Text } from 'react-native';
import { SessionItem } from './SessionItem';
import type { SessionData } from '../../hooks/useSessions';

interface SessionGroupProps {
  displayName: string;
  sessions: SessionData[];
  activeSessionId: string | null;
  streamingSessionId?: string | null;
  onDeleteSession: (projectName: string, sessionId: string) => void;
  onSelectSession: (sessionId: string) => void;
  indexOffset: number; // For staggered animation: cumulative index from previous groups
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
  if (sessions.length === 0) return null;

  return (
    <View style={{ marginTop: 12 }}>
      {/* Project header -- Caption style: 12px, muted, uppercase */}
      <Text
        style={{
          fontSize: 12,
          fontWeight: '400',
          color: 'rgb(148, 144, 141)',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          paddingHorizontal: 16,
          paddingVertical: 6,
        }}
      >
        {displayName}
      </Text>

      {sessions.map((session, i) => (
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
