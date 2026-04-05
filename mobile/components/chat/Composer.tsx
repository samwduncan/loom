/**
 * Composer -- Functional message composer with 3-state FSM and glass surface.
 *
 * Visual clone targets: better-chatbot pill shape (32px radius), ChatGPT iOS density.
 * Glass treatment with backdrop blur, muted/60% opacity background.
 * Send button 44x44 touch target, no glow shadow.
 *
 * FSM States (per D-28):
 *   idle     -> Send button shows ArrowUp (accent when text present, surface when empty)
 *   sending  -> Brief transition during WS send (prevents double-send, input disabled)
 *   active   -> Streaming in progress, stop button (destructive Square icon)
 *
 * AR fix #3: 5s fallback timer uses functional updater `setComposerState((prev) => ...)`
 * to avoid stale closure. Timer is cleared when isStreaming transitions to true.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { MMKV } from 'react-native-mmkv';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { ArrowUp, Square } from 'lucide-react-native';
import { haptic } from '../../lib/haptics';

import { theme } from '../../theme/theme';
import { createStyles } from '../../theme/createStyles';
import { getWsClient } from '../../lib/websocket-init';
import { useStreamStore } from '../../stores/index';
import { ComposerStatusBar } from './ComposerStatusBar';

/**
 * Glass composer toggle. Set to false if keyboard-blur collision causes stutter (D-07).
 * Fallback: opaque surface-raised with top border (must look intentional, not broken).
 */
const USE_GLASS_COMPOSER = true;

// Draft persistence via MMKV (debounced 500ms, keyed by sessionId)
const mmkv = new MMKV();
const DRAFT_PREFIX = 'draft_';

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
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stream state from store
  const isStreaming = useStreamStore((s) => s.isStreaming);
  // Use active session ID from store when available (fixes stale stub-* session after replacement)
  const storeActiveSessionId = useStreamStore((s) => s.activeSessionId);
  const effectiveSessionId = storeActiveSessionId || sessionId;

  // Restore draft when session changes (AR fix: useState initializer only runs on mount)
  useEffect(() => {
    if (effectiveSessionId) {
      // Flush any pending debounce before switching
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
      const draft = mmkv.getString(`${DRAFT_PREFIX}${effectiveSessionId}`) ?? '';
      setText(draft);
    } else {
      setText('');
    }
  }, [effectiveSessionId]);

  // Animated input height (spring-driven grow/shrink as user types multiple lines)
  const inputHeight = useSharedValue(44);

  const onContentSizeChange = useCallback(
    (e: { nativeEvent: { contentSize: { height: number } } }) => {
      const newHeight = Math.min(Math.max(e.nativeEvent.contentSize.height, 44), 160);
      inputHeight.value = withSpring(newHeight, theme.springs.standard);
    },
    [inputHeight],
  );

  const animatedInputStyle = useAnimatedStyle(() => ({
    height: inputHeight.value,
  }));

  // Send button animation
  const buttonScale = useSharedValue(1);

  // Debounced draft persistence to MMKV
  useEffect(() => {
    if (!effectiveSessionId) return;
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    draftTimerRef.current = setTimeout(() => {
      if (text.trim()) {
        mmkv.set(`${DRAFT_PREFIX}${effectiveSessionId}`, text);
      } else {
        mmkv.delete(`${DRAFT_PREFIX}${effectiveSessionId}`);
      }
    }, 500);
    return () => {
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    };
  }, [text, effectiveSessionId]);

  // D-16: Typing-begins haptic with 2-second cooldown to prevent fatigue on rapid clear-retype
  const wasEmptyRef = useRef(true);
  const lastTypingHapticRef = useRef(0);

  useEffect(() => {
    const isEmpty = text.trim().length === 0;
    if (wasEmptyRef.current && !isEmpty) {
      const now = Date.now();
      if (now - lastTypingHapticRef.current > 2000) {
        haptic.transition(); // D-16: typing-begins transition haptic
        lastTypingHapticRef.current = now;
      }
    }
    wasEmptyRef.current = isEmpty;
  }, [text]);

  // Color transition for send -> stop (accent -> destructive)
  // Track whether we show destructive color
  const isActive = composerState === 'active';
  const hasText = text.trim().length > 0;

  // Send button entrance/exit scale (0.6 muted when empty, 1.0 prominent with text)
  const sendButtonScale = useSharedValue(0.6);
  useEffect(() => {
    sendButtonScale.value = withSpring(hasText ? 1 : 0.6, theme.springs.micro);
  }, [hasText, sendButtonScale]);

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

    haptic.tap();
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
    // Clear draft on send
    if (effectiveSessionId) {
      mmkv.delete(`${DRAFT_PREFIX}${effectiveSessionId}`);
    }

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

    haptic.transition();
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
    transform: [{ scale: buttonScale.value * sendButtonScale.value }],
    opacity: sendButtonScale.value,
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

  const outerStyle = USE_GLASS_COMPOSER
    ? [styles.glassOuter, { paddingBottom: insets.bottom + theme.spacing.sm }, theme.shadows.medium]
    : [styles.opaqueOuter, { paddingBottom: insets.bottom + theme.spacing.sm }, theme.shadows.medium];

  return (
    <View style={outerStyle}>
      {USE_GLASS_COMPOSER && (
        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill}>
          <View style={styles.glassOverlay} />
        </BlurView>
      )}
      <View style={styles.row}>
        {/* Text input — animated height via spring on content size change */}
        <Animated.View style={[styles.inputWrapper, animatedInputStyle]}>
          <TextInput
            style={styles.input}
            placeholder="Message"
            placeholderTextColor={theme.colors.text.muted}
            value={text}
            onChangeText={setText}
            editable={!isInputDisabled}
            multiline
            maxLength={100000}
            textAlignVertical="top"
            onContentSizeChange={onContentSizeChange}
          />
        </Animated.View>

        {/* Send / Stop button — 44x44 touch target, NO glow shadow */}
        <AnimatedPressable
          style={[
            styles.sendButton,
            { backgroundColor: buttonBg },
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
  glassOuter: {
    overflow: 'hidden' as const,
    borderTopLeftRadius: t.radii.xl,
    borderTopRightRadius: t.radii.xl,
    paddingHorizontal: t.spacing.md,
    paddingTop: t.spacing.sm,
  },
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: t.colors.glass,
  },
  opaqueOuter: {
    backgroundColor: t.colors.surface.raised,
    borderTopLeftRadius: t.radii.xl,
    borderTopRightRadius: t.radii.xl,
    paddingHorizontal: t.spacing.md,
    paddingTop: t.spacing.sm,
  },
  row: {
    flexDirection: 'row' as const,
    alignItems: 'flex-end' as const,
  },
  inputWrapper: {
    flex: 1,
    minHeight: 44,
    maxHeight: 160,
    backgroundColor: t.colors.surface.raised,
    borderRadius: t.radii.xl, // 20px — rounded but not pill-shaped (like Claude iOS)
    overflow: 'hidden' as const,
  },
  input: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 16, // Prevents iOS auto-zoom on focus
    fontFamily: 'Inter-Regular',
    lineHeight: 24,
    color: t.colors.text.primary,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginLeft: t.spacing.sm,
  },
}));
