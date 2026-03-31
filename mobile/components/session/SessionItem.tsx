/**
 * Session list item -- 56px per Soul doc, with active indicator,
 * streaming dot, swipe-to-delete, staggered entrance, and press feedback.
 *
 * Active state: surface-raised background + 3px left accent border (D-11).
 * Streaming dot: 8px accent dot pulsing opacity 0.4-1.0 at 1.5s cycle.
 * Swipe-to-delete: Pan left reveals destructive "Delete" surface.
 * Press feedback: Micro spring scale 0.97.
 * Staggered entrance: 30ms delay per item, max 10 animated.
 */

import React, { useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withRepeat,
  withTiming,
  withSequence,
  runOnJS,
  FadeIn,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { SPRING } from '../../lib/springs';
import { SURFACE, ACCENT, DESTRUCTIVE } from '../../lib/colors';
import { relativeTime } from '../../hooks/useSessions';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SessionItemProps {
  id: string;
  title: string;
  updatedAt: string;
  provider: string;
  isActive: boolean;
  isStreaming?: boolean;
  index: number;
  onDelete: () => void;
  onPress: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SWIPE_THRESHOLD = -80;
const DELETE_WIDTH = 80;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function SessionItem({
  id,
  title,
  updatedAt,
  provider,
  isActive,
  isStreaming = false,
  index,
  onDelete,
  onPress,
}: SessionItemProps) {
  // Press scale
  const pressScale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  const handlePressIn = useCallback(() => {
    pressScale.value = withSpring(0.97, SPRING.micro);
  }, [pressScale]);

  const handlePressOut = useCallback(() => {
    pressScale.value = withSpring(1, SPRING.micro);
  }, [pressScale]);

  // Swipe-to-delete
  const translateX = useSharedValue(0);
  const isDeleteRevealed = useSharedValue(false);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((e) => {
      // Only allow left swipe
      if (e.translationX < 0) {
        translateX.value = Math.max(e.translationX, -DELETE_WIDTH - 20);
      } else if (isDeleteRevealed.value) {
        translateX.value = Math.min(e.translationX - DELETE_WIDTH, 0);
      }
    })
    .onEnd((e) => {
      if (e.translationX < SWIPE_THRESHOLD) {
        translateX.value = withSpring(-DELETE_WIDTH, SPRING.standard);
        isDeleteRevealed.value = true;
      } else {
        translateX.value = withSpring(0, SPRING.standard);
        isDeleteRevealed.value = false;
      }
    });

  const swipeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const deleteBackgroundStyle = useAnimatedStyle(() => ({
    opacity: Math.min(Math.abs(translateX.value) / DELETE_WIDTH, 1),
  }));

  // Staggered entrance (first 10 items, 30ms delay each)
  const entranceDelay = index < 10 ? index * 30 : 0;
  const entranceOpacity = useSharedValue(index < 10 ? 0 : 1);
  const entranceTranslateY = useSharedValue(index < 10 ? 20 : 0);

  const entranceStyle = useAnimatedStyle(() => ({
    opacity: entranceOpacity.value,
    transform: [{ translateY: entranceTranslateY.value }],
  }));

  // Trigger entrance animation on mount
  React.useEffect(() => {
    if (index < 10) {
      entranceOpacity.value = withDelay(
        entranceDelay,
        withSpring(1, SPRING.standard),
      );
      entranceTranslateY.value = withDelay(
        entranceDelay,
        withSpring(0, SPRING.standard),
      );
    }
  }, [entranceDelay, entranceOpacity, entranceTranslateY, index]);

  // Streaming dot pulse
  const dotOpacity = useSharedValue(0.4);
  React.useEffect(() => {
    if (isStreaming) {
      dotOpacity.value = withRepeat(
        withTiming(1, { duration: 1500 }),
        -1,
        true,
      );
    } else {
      dotOpacity.value = 0.4;
    }
  }, [isStreaming, dotOpacity]);

  const dotStyle = useAnimatedStyle(() => ({
    opacity: dotOpacity.value,
  }));

  const handleDelete = useCallback(() => {
    onDelete();
  }, [onDelete]);

  const handlePress = useCallback(() => {
    onPress();
    router.push(`/(stack)/chat/${id}`);
  }, [id, onPress]);

  return (
    <Animated.View style={entranceStyle}>
      <View style={{ position: 'relative', overflow: 'hidden' }}>
        {/* Delete background */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              width: DELETE_WIDTH,
              backgroundColor: DESTRUCTIVE,
              justifyContent: 'center',
              alignItems: 'center',
            },
            deleteBackgroundStyle,
          ]}
        >
          <Pressable
            onPress={handleDelete}
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%',
              minHeight: 44,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>
              Delete
            </Text>
          </Pressable>
        </Animated.View>

        {/* Session item content */}
        <GestureDetector gesture={panGesture}>
          <Animated.View style={swipeStyle}>
            <AnimatedPressable
              onPress={handlePress}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              style={[
                pressStyle,
                {
                  minHeight: 56,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: isActive ? SURFACE.raised : 'transparent',
                  borderLeftWidth: isActive ? 3 : 0,
                  borderLeftColor: isActive ? ACCENT : 'transparent',
                },
              ]}
            >
              <View style={{ flex: 1 }}>
                {/* Title row */}
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={{
                      fontSize: 15,
                      fontWeight: '600',
                      color: 'rgb(230, 222, 216)',
                      flex: 1,
                    }}
                  >
                    {title}
                  </Text>
                  {isStreaming && (
                    <Animated.View
                      style={[
                        {
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: ACCENT,
                          marginLeft: 8,
                        },
                        dotStyle,
                      ]}
                    />
                  )}
                </View>

                {/* Subtitle: relative time + provider */}
                <Text
                  style={{
                    fontSize: 12,
                    color: 'rgb(148, 144, 141)',
                    marginTop: 2,
                  }}
                >
                  {relativeTime(updatedAt)} {provider !== 'claude' ? `\u00B7 ${provider}` : ''}
                </Text>
              </View>
            </AnimatedPressable>
          </Animated.View>
        </GestureDetector>
      </View>
    </Animated.View>
  );
}
