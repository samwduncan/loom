/**
 * Project picker modal -- shows available projects for new chat creation.
 *
 * Uses React Native Modal with surface-overlay background.
 * Entrance: Navigation spring (translateY from bottom).
 * Each project: 56px ListItem pattern with displayName, provider, session count.
 * On select: calls createSession -> closes picker.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Modal, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { createApiClient } from '@loom/shared/lib/api-client';
import { nativeAuthProvider } from '../../lib/auth-provider';
import { resolveApiUrl } from '../../lib/platform';
import { SPRING } from '../../lib/springs';
import { SURFACE, ACCENT } from '../../lib/colors';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProjectFromApi {
  name: string;
  displayName: string;
  path: string;
  fullPath: string;
  isCustomName: boolean;
  sessions: { id: string; summary: string; lastActivity: string; messageCount: number }[];
}

interface ProjectPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelectProject: (projectName: string, projectPath: string) => void;
}

// ---------------------------------------------------------------------------
// API client
// ---------------------------------------------------------------------------

const apiClient = createApiClient({
  auth: nativeAuthProvider,
  resolveUrl: resolveApiUrl,
});

// ---------------------------------------------------------------------------
// Provider badge colors
// ---------------------------------------------------------------------------

const PROVIDER_COLORS: Record<string, string> = {
  claude: 'rgb(196, 108, 88)',
  codex: 'rgb(82, 175, 108)',
  gemini: 'rgb(100, 160, 230)',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProjectPicker({ visible, onClose, onSelectProject }: ProjectPickerProps) {
  const [projects, setProjects] = useState<ProjectFromApi[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Entrance animation
  const translateY = useSharedValue(300);
  const backdropOpacity = useSharedValue(0);

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  useEffect(() => {
    if (visible) {
      // Animate in
      translateY.value = withSpring(0, SPRING.navigation);
      backdropOpacity.value = withSpring(1, SPRING.standard);

      // Fetch projects
      setIsLoading(true);
      setError(null);
      apiClient
        .apiFetch<ProjectFromApi[]>('/api/projects')
        .then((data) => {
          setProjects(data);
          setIsLoading(false);
        })
        .catch((e) => {
          setError(e instanceof Error ? e.message : 'Failed to load projects');
          setIsLoading(false);
        });
    } else {
      translateY.value = 300;
      backdropOpacity.value = 0;
    }
  }, [visible, translateY, backdropOpacity]);

  const handleSelect = useCallback(
    (project: ProjectFromApi) => {
      onSelectProject(project.name, project.fullPath);
      onClose();
    },
    [onSelectProject, onClose],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <Animated.View
        style={[
          {
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'flex-end',
          },
          backdropStyle,
        ]}
      >
        <Pressable
          style={{ flex: 1 }}
          onPress={onClose}
        />

        {/* Content */}
        <Animated.View
          style={[
            {
              backgroundColor: SURFACE.overlay,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              maxHeight: '70%',
              paddingBottom: 34, // Safe area bottom
            },
            contentStyle,
          ]}
        >
          {/* Handle indicator */}
          <View style={{ alignItems: 'center', paddingVertical: 12 }}>
            <View
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
              }}
            />
          </View>

          {/* Title */}
          <Text
            style={{
              fontSize: 17,
              fontWeight: '600',
              color: 'rgb(230, 222, 216)',
              paddingHorizontal: 16,
              paddingBottom: 12,
            }}
          >
            Select Project
          </Text>

          {/* Projects list */}
          <ScrollView style={{ maxHeight: 400 }}>
            {isLoading && (
              <View style={{ padding: 32, alignItems: 'center' }}>
                <ActivityIndicator color={SURFACE.raised} />
                <Text
                  style={{
                    fontSize: 13,
                    color: 'rgb(148, 144, 141)',
                    marginTop: 8,
                  }}
                >
                  Loading projects...
                </Text>
              </View>
            )}

            {error && (
              <View style={{ padding: 16 }}>
                <Text style={{ fontSize: 13, color: 'rgb(210, 112, 88)' }}>
                  {error}
                </Text>
              </View>
            )}

            {!isLoading &&
              !error &&
              projects.map((project) => (
                <Pressable
                  key={project.name}
                  onPress={() => handleSelect(project)}
                  style={({ pressed }) => ({
                    minHeight: 56,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: pressed ? SURFACE.raised : 'transparent',
                    borderBottomWidth: 1,
                    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
                  })}
                >
                  {/* Provider badge */}
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: ACCENT,
                      marginRight: 12,
                    }}
                  />

                  <View style={{ flex: 1 }}>
                    <Text
                      numberOfLines={1}
                      style={{
                        fontSize: 15,
                        fontWeight: '600',
                        color: 'rgb(230, 222, 216)',
                      }}
                    >
                      {project.displayName}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        color: 'rgb(148, 144, 141)',
                        marginTop: 2,
                      }}
                    >
                      {project.sessions.length} session{project.sessions.length !== 1 ? 's' : ''} {'\u00B7'}{' '}
                      {project.fullPath}
                    </Text>
                  </View>
                </Pressable>
              ))}

            {!isLoading && !error && projects.length === 0 && (
              <View style={{ padding: 32, alignItems: 'center' }}>
                <Text style={{ fontSize: 13, color: 'rgb(148, 144, 141)' }}>
                  No projects found
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Cancel button */}
          <Pressable
            onPress={onClose}
            style={{
              minHeight: 44,
              alignItems: 'center',
              justifyContent: 'center',
              marginHorizontal: 16,
              marginTop: 12,
              borderRadius: 12,
              backgroundColor: SURFACE.raised,
            }}
          >
            <Text
              style={{
                fontSize: 15,
                fontWeight: '600',
                color: 'rgb(230, 222, 216)',
              }}
            >
              Cancel
            </Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
