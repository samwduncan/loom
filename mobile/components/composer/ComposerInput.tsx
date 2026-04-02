/**
 * ComposerInput -- bare expanding TextInput for the unified composer pill.
 *
 * No border, no attachment button, no wrapper — those live in Composer.tsx
 * which owns the unified pill container. This component is JUST the TextInput
 * with height animation reporting.
 *
 * Height changes are reported via onHeightChange callback so the parent
 * pill container can animate to match.
 */

import { useCallback } from 'react';
import {
  TextInput,
  StyleSheet,
  type NativeSyntheticEvent,
  type TextInputContentSizeChangeEventData,
  type TextInputSubmitEditingEventData,
} from 'react-native';

interface ComposerInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onHeightChange?: (height: number) => void;
  disabled?: boolean;
}

const LINE_HEIGHT = 24;
const MAX_LINES = 6;
const VERTICAL_PADDING = 20; // 10 top + 10 bottom from pill
const MIN_CONTENT_HEIGHT = LINE_HEIGHT;
const MAX_CONTENT_HEIGHT = LINE_HEIGHT * MAX_LINES;

export { MIN_CONTENT_HEIGHT, MAX_CONTENT_HEIGHT, VERTICAL_PADDING };

export function ComposerInput({
  value,
  onChangeText,
  onSubmit,
  onFocus,
  onBlur,
  onHeightChange,
  disabled = false,
}: ComposerInputProps) {
  const handleContentSizeChange = useCallback(
    (e: NativeSyntheticEvent<TextInputContentSizeChangeEventData>) => {
      const raw = e.nativeEvent.contentSize.height;
      const clamped = Math.min(Math.max(raw, MIN_CONTENT_HEIGHT), MAX_CONTENT_HEIGHT);
      onHeightChange?.(clamped + VERTICAL_PADDING);
    },
    [onHeightChange],
  );

  const handleSubmitEditing = useCallback(
    (_e: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => {
      if (value.trim()) {
        onSubmit();
      }
    },
    [value, onSubmit],
  );

  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      onContentSizeChange={handleContentSizeChange}
      onFocus={onFocus}
      onBlur={onBlur}
      onSubmitEditing={handleSubmitEditing}
      placeholder="Message"
      placeholderTextColor="rgb(160, 155, 150)"
      multiline
      scrollEnabled={true}
      editable={!disabled}
      style={styles.input}
      textAlignVertical="top"
      returnKeyType="send"
      blurOnSubmit={false}
      enablesReturnKeyAutomatically={true}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    flex: 1,
    fontSize: 17,
    fontFamily: 'Inter',
    color: 'rgb(230, 222, 216)',
    lineHeight: LINE_HEIGHT,
    padding: 0,
  },
});
