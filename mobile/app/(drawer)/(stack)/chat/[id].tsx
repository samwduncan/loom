/**
 * Chat screen -- the core messaging loop for Loom native.
 *
 * Wires MessageList + Composer + dynamic color warmth shift.
 * Gets session ID from route params. On mount:
 * - Sets active session in timeline store
 * - Fetches messages for this session
 * - Subscribes to streaming state for dynamic color
 *
 * Per Soul doc "Sending a Message" elevation sequence:
 * 1. Press send -> Micro spring scale 0.85, Impact Light haptic
 * 2. Release -> scale 1.0, text clears
 * 3. User bubble springs in from below (Standard spring)
 * 4. Input contracts to single line
 * 5. ~200ms later, assistant text fades in (150ms opacity)
 * 6. Streaming accent line pulses
 * 7. Background warms (useDynamicColor.enterStreaming)
 * 8. Streaming ends -> accent line fades, warmth reverts (exitStreaming)
 *
 * Stub sessions (id starts with 'stub-'): send first message without sessionId
 * so backend creates the session. onSessionCreated callback swaps the stub ID.
 */

import { useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, Text, Pressable, Keyboard, KeyboardAvoidingView } from 'react-native';
import { SURFACE } from '../../../../lib/colors';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { MessageList } from '../../../../components/chat/MessageList';
import { Composer } from '../../../../components/composer/Composer';
import { EmptyChat } from '../../../../components/empty/EmptyChat';
import { useDynamicColor } from '../../../../hooks/useDynamicColor';
import { useMessageList } from '../../../../hooks/useMessageList';
import { useStreamStore } from '../../../../stores/index';
import { useTimelineStore } from '../../../../stores/index';
import { getWsClient, clearStreamSnapshot } from '../../../../lib/websocket-init';
import { SPRING } from '../../../../lib/springs';
import type { ClientMessage } from '@loom/shared/types/websocket';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function ChatScreen() {
  const { id, projectName, projectPath } = useLocalSearchParams<{
    id: string;
    projectName?: string;
    projectPath?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Dynamic color -- background warmth shift during streaming
  const { backgroundStyle, enterStreaming, exitStreaming, enterError } =
    useDynamicColor();

  // Message data
  const { messages, isLoading, isStreaming, fetchMessages } = useMessageList();

  // Store refs for streaming subscription
  const wasStreamingRef = useRef(false);

  // Get session from timeline store for title
  const session = useTimelineStore((s) =>
    s.sessions.find((sess) => sess.id === id),
  );
  const sessionTitle = session?.title || 'New Chat';

  // Set active session on mount
  useEffect(() => {
    if (id) {
      useTimelineStore.getState().setActiveSession(id);
    }
    return () => {
      useTimelineStore.getState().setActiveSession(null);
    };
  }, [id]);

  // Fetch messages on mount (skip for stub sessions with no messages yet)
  // projectName comes from route params (via SessionItem or createSession navigation)
  useEffect(() => {
    if (id && !id.startsWith('stub-') && projectName) {
      fetchMessages(projectName, id);
    }
  }, [id, projectName, fetchMessages]);

  // Subscribe to streaming state for dynamic color
  useEffect(() => {
    const unsubscribe = useStreamStore.subscribe((state) => {
      if (state.isStreaming && !wasStreamingRef.current) {
        wasStreamingRef.current = true;
        enterStreaming();
      } else if (!state.isStreaming && wasStreamingRef.current) {
        wasStreamingRef.current = false;
        exitStreaming();
      }
    });
    return unsubscribe;
  }, [enterStreaming, exitStreaming]);

  // Subscribe to error state for dynamic color
  useEffect(() => {
    const unsubscribe = useStreamStore.subscribe((state) => {
      // Check if any tool call errored -- triggers enterError
      if (state.activeToolCalls.some((tc) => tc.isError)) {
        enterError();
      }
    });
    return unsubscribe;
  }, [enterError]);

  // Send message handler
  const handleSendMessage = useCallback(
    (text: string) => {
      const client = getWsClient();
      if (!client) {
        console.warn('[ChatScreen] No WebSocket client available');
        return;
      }

      // Add user message to timeline store immediately for instant UI feedback
      const userMessage = {
        id: `user-${Date.now()}`,
        role: 'user' as const,
        content: text,
        metadata: {
          timestamp: new Date().toISOString(),
          tokenCount: null,
          inputTokens: null,
          outputTokens: null,
          cacheReadTokens: null,
          cost: null,
          duration: null,
        },
        providerContext: {
          providerId: 'claude' as const,
          modelId: 'claude-sonnet-4-20250514',
          agentName: null,
        },
      };
      if (id) {
        useTimelineStore.getState().addMessage(id, userMessage);
      }

      // Build WS message
      const isStub = id?.startsWith('stub-');
      const msg: ClientMessage = {
        type: 'claude-command',
        command: text,
        options: {
          ...(isStub ? {} : { sessionId: id }),
          ...(projectPath ? { projectPath } : {}),
        },
      };

      client.send(msg);
    },
    [id, projectPath],
  );

  // Stop streaming handler
  const handleStopStreaming = useCallback(() => {
    const client = getWsClient();
    if (!client || !id) return;

    const msg: ClientMessage = {
      type: 'abort-session',
      sessionId: id,
      provider: 'claude',
    };
    client.send(msg);
  }, [id]);

  // Back button spring press feedback (anti-pattern #11: no silent taps)
  const backScale = useSharedValue(1);
  const backScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: backScale.value }],
  }));
  const handleBackPressIn = useCallback(() => {
    backScale.value = withSpring(0.9, SPRING.micro);
  }, [backScale]);
  const handleBackPressOut = useCallback(() => {
    backScale.value = withSpring(1, SPRING.micro);
  }, [backScale]);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    }
  }, [router]);

  // D-28: Handler for retrying interrupted stream messages
  const handleRetryInterrupted = useCallback(() => {
    if (!id) return;
    // Clear the snapshot
    clearStreamSnapshot(id);
    // Re-send could be handled by the user sending a new message.
    // For now, clear the interrupted state to let user continue naturally.
  }, [id]);

  const showEmptyState = messages.length === 0 && !isLoading && !isStreaming;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <KeyboardAvoidingView
        behavior="padding"
        style={{ flex: 1, backgroundColor: SURFACE.base }}
      >
        <Animated.View style={[styles.container, backgroundStyle]}>
          {/* Header */}
          <View style={[styles.header, { paddingTop: insets.top }]}>
            <AnimatedPressable
              onPress={handleBack}
              onPressIn={handleBackPressIn}
              onPressOut={handleBackPressOut}
              style={[styles.backButton, backScaleStyle]}
            >
              <ChevronLeft size={24} color="rgb(230, 222, 216)" strokeWidth={2} />
            </AnimatedPressable>
            <View style={styles.titleContainer}>
              <Text style={styles.title} numberOfLines={1}>
                {sessionTitle}
              </Text>
            </View>
            <View style={styles.modelIndicator}>
              <Text style={styles.modelText}>Claude</Text>
            </View>
          </View>

          {/* Content -- tap to dismiss keyboard */}
          <Pressable
            style={{ flex: 1 }}
            onPress={() => Keyboard.dismiss()}
          >
            {showEmptyState ? (
              <EmptyChat
                modelName="Claude"
                projectName={projectPath || projectName}
              />
            ) : (
              <MessageList
                messages={messages}
                isStreaming={isStreaming}
              />
            )}
          </Pressable>

          {/* Composer */}
          <Composer
            isStreaming={isStreaming}
            onSendMessage={handleSendMessage}
            onStopStreaming={handleStopStreaming}
          />
        </Animated.View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.07)',
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: 'rgb(230, 222, 216)',
    fontFamily: 'Inter',
  },
  modelIndicator: {
    width: 44,
    alignItems: 'center',
  },
  modelText: {
    fontSize: 12,
    color: 'rgb(148, 144, 141)',
    fontFamily: 'Inter',
  },
});
