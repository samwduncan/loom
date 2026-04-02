/**
 * ComposerInput -- expanding TextInput with animated height for the chat composer.
 *
 * Per D-14: Single-line expanding to multi-line (max 6 lines before scroll).
 * 15px body text, text-primary. Placeholder "Message" in text-muted.
 * Internal container: rounded-2xl, border border-subtle, px-4 py-3.
 *
 * Height animation: Standard spring on height change (never instant) per Soul doc.
 * Focus: border shifts border-subtle to border-interactive (200ms withTiming).
 *
 * Per D-15: Attachment button (+) present as visual placeholder, non-functional.
 */

import { useState, useCallback } from 'react';
import {
  TextInput,
  View,
  Pressable,
  StyleSheet,
  type NativeSyntheticEvent,
  type TextInputContentSizeChangeEventData,
  type TextInputSubmitEditingEventData,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { Plus } from 'lucide-react-native';
import { SPRING } from '../../lib/springs';
import { SURFACE } from '../../lib/colors';

interface ComposerInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

/** Line height for body text — 17px prevents iOS auto-zoom */
const LINE_HEIGHT = 24;
/** Max 6 lines before internal scroll */
const MAX_LINES = 6;
const MIN_HEIGHT = LINE_HEIGHT + 24; // 1 line + py-3 padding (12+12)
const MAX_HEIGHT = LINE_HEIGHT * MAX_LINES + 24;

export function ComposerInput({ value, onChangeText, onSubmit, disabled = false }: ComposerInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const animatedHeight = useSharedValue(MIN_HEIGHT);
  const borderProgress = useSharedValue(0);

  const handleContentSizeChange = useCallback(
    (e: NativeSyntheticEvent<TextInputContentSizeChangeEventData>) => {
      const contentHeight = e.nativeEvent.contentSize.height + 24; // Add padding
      const clampedHeight = Math.min(Math.max(contentHeight, MIN_HEIGHT), MAX_HEIGHT);
      animatedHeight.value = withSpring(clampedHeight, SPRING.standard);
    },
    [animatedHeight],
  );

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    borderProgress.value = withTiming(1, { duration: 200 });
  }, [borderProgress]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    borderProgress.value = withTiming(0, { duration: 200 });
  }, [borderProgress]);

  const handleSubmitEditing = useCallback(
    (_e: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => {
      if (value.trim()) {
        onSubmit();
      }
    },
    [value, onSubmit],
  );

  const containerStyle = useAnimatedStyle(() => ({
    height: animatedHeight.value,
    borderColor: interpolateColor(
      borderProgress.value,
      [0, 1],
      ['rgba(255, 255, 255, 0.07)', 'rgba(255, 255, 255, 0.15)'], // border-subtle to border-interactive
    ),
  }));

  return (
    <View style={styles.wrapper}>
      {/* Attachment button - non-functional placeholder per D-15 */}
      <Pressable
        style={styles.attachButton}
        onPress={() => {
          // Coming soon -- Phase 70+
        }}
      >
        <Plus size={20} color="rgb(148, 144, 141)" strokeWidth={2} />
      </Pressable>

      <Animated.View style={[styles.inputContainer, containerStyle]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onContentSizeChange={handleContentSizeChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onSubmitEditing={handleSubmitEditing}
          placeholder="Message"
          placeholderTextColor="rgb(148, 144, 141)"
          multiline
          scrollEnabled={true}
          editable={!disabled}
          style={styles.input}
          textAlignVertical="top"
          returnKeyType="send"
          blurOnSubmit={false}
          enablesReturnKeyAutomatically={true}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
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
  inputContainer: {
    flex: 1,
    borderRadius: 22, // pill shape — matches ChatGPT/Claude iOS
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  input: {
    flex: 1,
    fontSize: 17, // 17px prevents iOS keyboard auto-zoom
    fontFamily: 'Inter',
    color: 'rgb(230, 222, 216)',
    lineHeight: LINE_HEIGHT,
    padding: 0,
  },
});
