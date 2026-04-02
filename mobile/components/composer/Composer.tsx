/**
 * Composer -- unified chat input pill matching ChatGPT/Claude iOS pattern.
 *
 * Structure:
 *   [+ attach]  [ TextInput .............. [Send] ]
 *                ^----- one pill, one border -----^
 *
 * The pill is a single Animated.View containing the TextInput and SendButton.
 * No gap between input and button — they are one visual unit.
 * Attachment button sits outside the pill to the left.
 *
 * Pill animates:
 *   - Height: standard spring on content size change
 *   - Border color: 200ms transition on focus (subtle → interactive)
 *
 * Parent screen wraps in KAV behavior="padding" for keyboard offset.
 */

import { useState, useCallback } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { Plus } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ComposerInput, VERTICAL_PADDING } from './ComposerInput';
import { SendButton } from './SendButton';
import { ComposerStatus } from './ComposerStatus';
import { SPRING } from '../../lib/springs';
import { SURFACE } from '../../lib/colors';

interface ComposerProps {
  isStreaming: boolean;
  onSendMessage: (text: string) => void;
  onStopStreaming: () => void;
}

const LINE_HEIGHT = 24;
const MIN_PILL_HEIGHT = LINE_HEIGHT + VERTICAL_PADDING;

export function Composer({ isStreaming, onSendMessage, onStopStreaming }: ComposerProps) {
  const [text, setText] = useState('');
  const insets = useSafeAreaInsets();

  // Pill height animation
  const pillHeight = useSharedValue(MIN_PILL_HEIGHT);
  // Border color animation (0 = unfocused, 1 = focused)
  const borderProgress = useSharedValue(0);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSendMessage(trimmed);
    setText('');
    // Contract pill back to single line
    pillHeight.value = withSpring(MIN_PILL_HEIGHT, SPRING.standard);
  }, [text, onSendMessage, pillHeight]);

  const handleStop = useCallback(() => {
    onStopStreaming();
  }, [onStopStreaming]);

  const handleHeightChange = useCallback(
    (height: number) => {
      pillHeight.value = withSpring(height, SPRING.standard);
    },
    [pillHeight],
  );

  const handleFocus = useCallback(() => {
    borderProgress.value = withTiming(1, { duration: 200 });
  }, [borderProgress]);

  const handleBlur = useCallback(() => {
    borderProgress.value = withTiming(0, { duration: 200 });
  }, [borderProgress]);

  const pillStyle = useAnimatedStyle(() => ({
    height: pillHeight.value,
    borderColor: interpolateColor(
      borderProgress.value,
      [0, 1],
      ['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.18)'],
    ),
  }));

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {/* Attachment button — outside the pill */}
        <Pressable
          style={styles.attachButton}
          onPress={() => {
            // Phase 70+
          }}
        >
          <Plus size={20} color="rgb(160, 155, 150)" strokeWidth={2} />
        </Pressable>

        {/* Unified pill: TextInput + SendButton */}
        <Animated.View style={[styles.pill, pillStyle]}>
          <ComposerInput
            value={text}
            onChangeText={setText}
            onSubmit={handleSend}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onHeightChange={handleHeightChange}
            disabled={isStreaming}
          />
          <View style={styles.sendInPill}>
            <SendButton
              hasText={text.trim().length > 0}
              isStreaming={isStreaming}
              onSend={handleSend}
              onStop={handleStop}
            />
          </View>
        </Animated.View>
      </View>

      <ComposerStatus />
      <View style={{ height: insets.bottom }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: SURFACE.base,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
    gap: 8,
  },
  attachButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: SURFACE.raised,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  pill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: SURFACE.raised,
    borderRadius: 22,
    borderWidth: 1,
    paddingLeft: 16,
    paddingRight: 6, // tighter on right where send button sits
    paddingVertical: 6,
  },
  sendInPill: {
    marginLeft: 6,
    marginBottom: 0,
  },
});
