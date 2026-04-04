/**
 * Composer -- Functional message composer with 3-state FSM.
 *
 * Replaces ComposerShell with a fully wired composer that sends messages
 * via WebSocket and transforms between idle/sending/active states.
 *
 * FSM States (per D-28):
 *   idle     -> Send button shows ArrowUp (accent when text present, surface when empty)
 *   sending  -> Brief transition during WS send (prevents double-send, input disabled)
 *   active   -> Streaming in progress, stop button (destructive Square icon)
 *
 * AR fix #3: 5s fallback timer uses functional updater `setComposerState((prev) => ...)`
 * to avoid stale closure. Timer is cleared when isStreaming transitions to true.
 *
 * Haptic: Impact Light on send, Impact Medium on stop.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { ArrowUp, Square } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { theme } from '../../theme/theme';
import { createStyles } from '../../theme/createStyles';
import { getWsClient } from '../../lib/websocket-init';
import { useStreamStore } from '../../stores/index';
import { ComposerStatusBar } from './ComposerStatusBar';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ComposerState = 'idle' | 'sending' | 'active';

interface ComposerProps {
  sessionId: string | null;
  projectPath: string;
  projectName: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Composer({ sessionId, projectPath, projectName }: ComposerProps) {
  const insets = useSafeAreaInsets();
  const [composerState, setComposerState] = useState<ComposerState>('idle');
  const [text, setText] = useState('');
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stream state from store
  const isStreaming = useStreamStore((s) => s.isStreaming);
  // Use active session ID from store when available (fixes stale stub-* session after replacement)
  const storeActiveSessionId = useStreamStore((s) => s.activeSessionId);
  const effectiveSessionId = storeActiveSessionId || sessionId;

  // Send button animation
  const buttonScale = useSharedValue(1);

  // Color transition for send -> stop (accent -> destructive)
  // Track whether we show destructive color
  const isActive = composerState === 'active';
  const hasText = text.trim().length > 0;

  // -------------------------------------------------------------------------
  // FSM transitions driven by streaming state
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (isStreaming) {
      // Clear fallback timer -- stream started, no need for timeout
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
      setComposerState('active');
    } else if (composerState === 'active') {
      setComposerState('idle');
    }
    // composerState intentionally omitted to avoid loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStreaming]);

  // Cleanup fallback timer on unmount
  useEffect(() => {
    return () => {
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
      }
    };
  }, []);

  // -------------------------------------------------------------------------
  // Send handler
  // -------------------------------------------------------------------------

  const handleSend = useCallback(() => {
    if (!text.trim() || composerState !== 'idle') return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setComposerState('sending');

    const wsClient = getWsClient();
    if (!wsClient) {
      setComposerState('idle');
      return;
    }

    const options: Record<string, unknown> = { projectPath, projectName };
    if (effectiveSessionId && !effectiveSessionId.startsWith('stub-')) {
      options.sessionId = effectiveSessionId;
    }

    wsClient.send({
      type: 'claude-command',
      command: text.trim(),
      options,
    });
    setText('');

    // AR fix #3: Fallback -- if stream never starts within 5s, return to idle.
    // Uses functional updater to avoid stale closure.
    fallbackTimerRef.current = setTimeout(() => {
      setComposerState((prev) => (prev === 'sending' ? 'idle' : prev));
    }, 5000);
  }, [text, composerState, effectiveSessionId, projectPath, projectName]);

  // -------------------------------------------------------------------------
  // Stop handler
  // -------------------------------------------------------------------------

  const handleStop = useCallback(() => {
    if (composerState !== 'active' || !effectiveSessionId) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const wsClient = getWsClient();
    if (!wsClient) return;

    wsClient.send({
      type: 'abort-session',
      sessionId: effectiveSessionId,
      provider: 'claude',
    });
  }, [composerState, effectiveSessionId]);

  // -------------------------------------------------------------------------
  // Button press animation (Micro spring scale 0.85)
  // -------------------------------------------------------------------------

  const handlePressIn = useCallback(() => {
    buttonScale.value = withSpring(0.85, theme.springs.micro);
  }, [buttonScale]);

  const handlePressOut = useCallback(() => {
    buttonScale.value = withSpring(1, theme.springs.micro);
  }, [buttonScale]);

  const buttonAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  // -------------------------------------------------------------------------
  // Button appearance
  // -------------------------------------------------------------------------

  const isInputDisabled = composerState === 'sending' || composerState === 'active';

  // Determine button style
  let buttonBg: string;
  let iconColor: string;

  if (isActive) {
    buttonBg = theme.colors.destructive;
    iconColor = '#FFFFFF';
  } else if (hasText) {
    buttonBg = theme.colors.accent;
    iconColor = theme.colors.accentFg;
  } else {
    buttonBg = theme.colors.surface.raised;
    iconColor = theme.colors.text.muted;
  }

  const buttonHandler = isActive ? handleStop : handleSend;
  const buttonDisabled = !isActive && !hasText;

  return (
    <View
      style={[
        styles.outer,
        { paddingBottom: insets.bottom + theme.spacing.sm },
        theme.shadows.medium,
      ]}
    >
      <View style={styles.row}>
        {/* Text input */}
        <TextInput
          style={styles.input}
          placeholder="Message"
          placeholderTextColor={theme.colors.text.muted}
          value={text}
          onChangeText={setText}
          editable={!isInputDisabled}
          multiline
          maxLength={100000}
          textAlignVertical="center"
        />

        {/* Send / Stop button */}
        <AnimatedPressable
          style={[
            styles.sendButton,
            { backgroundColor: buttonBg },
            hasText && !isActive && theme.shadows.glow(theme.colors.accent),
            buttonAnimStyle,
          ]}
          onPress={buttonHandler}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={buttonDisabled}
          hitSlop={{ top: 4, right: 4, bottom: 4, left: 4 }}
          accessibilityRole="button"
          accessibilityLabel={isActive ? 'Stop streaming' : 'Send message'}
        >
          {isActive ? (
            <Square size={14} color={iconColor} strokeWidth={2} fill={iconColor} />
          ) : (
            <ArrowUp size={20} color={iconColor} strokeWidth={2} />
          )}
        </AnimatedPressable>
      </View>

      {/* Status bar */}
      <ComposerStatusBar />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = createStyles((t) => ({
  outer: {
    backgroundColor: t.colors.surface.raised,
    borderTopLeftRadius: t.radii.xl,
    borderTopRightRadius: t.radii.xl,
    paddingHorizontal: t.spacing.md,
    paddingTop: t.spacing.sm,
  },
  row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: t.colors.surface.base,
    borderWidth: 1,
    borderColor: t.colors.border.subtle,
    borderRadius: t.radii.md,
    paddingHorizontal: t.spacing.md,
    paddingVertical: t.spacing.sm,
    ...t.typography.body,
    color: t.colors.text.primary,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginLeft: t.spacing.sm,
  },
}));
